/**
 * Builds a CSS + JS string to inject into the srcdoc iframe.
 *
 * The injected script:
 *  - Adds a hover outline on any element the mouse is over
 *  - Adds a persistent "selected" outline on click
 *  - Posts { type, label, selector, outerHTML, textContent } to window.parent
 *
 * A floating label badge follows the hovered/selected element.
 */

// ── CSS injected into the page ───────────────────────────────────────────────
const INJECT_CSS = `
  <style id="__aie_style__">
    .__aie_hover__ {
      outline: 2px solid #6c5ce7 !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }
    .__aie_selected__ {
      outline: 2.5px solid #a29bfe !important;
      outline-offset: 2px !important;
    }
    .__aie_editing__ {
      outline: 2.5px solid #00b894 !important;
      outline-offset: 2px !important;
      cursor: text !important;
      min-width: 1ch;
    }
    .__aie_editing__:focus {
      outline: 2.5px solid #00b894 !important;
      box-shadow: 0 0 0 3px rgba(0, 184, 148, 0.25) !important;
    }
    #__aie_badge__ {
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
      background: #6c5ce7;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace, sans-serif;
      padding: 3px 7px;
      border-radius: 4px;
      line-height: 1.4;
      white-space: nowrap;
      letter-spacing: 0.03em;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      transition: opacity 0.1s;
    }
    #__aie_sel_badge__ {
      position: fixed;
      z-index: 2147483646;
      pointer-events: none;
      background: #a29bfe;
      color: #111;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace, sans-serif;
      padding: 3px 7px;
      border-radius: 4px;
      line-height: 1.4;
      white-space: nowrap;
      letter-spacing: 0.03em;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    }
  </style>
`;

// ── JS injected into the page ────────────────────────────────────────────────
const INJECT_SCRIPT = `
  <script id="__aie_script__">
  (function() {
    var hovered   = null;
    var selected  = null;
    var badge     = null;
    var selBadge  = null;
    var editing   = null;
    var editOriginal = '';

    // skip invisible / utility elements
    var SKIP_TAGS = ['HTML','HEAD','BODY','SCRIPT','STYLE','META','LINK','TITLE','NOSCRIPT'];
    var TEXT_EDIT_TAGS = ['P','H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LI','LABEL','TD','TH','STRONG','EM','B','I','SMALL','BLOCKQUOTE','FIGCAPTION','LEGEND','DT','DD','SUMMARY','CITE','TIME','CODE'];
    var NON_TEXT_TAGS = ['IMG','VIDEO','AUDIO','IFRAME','SVG','INPUT','TEXTAREA','SELECT','BR','HR','CANVAS','TABLE','THEAD','TBODY','TFOOT','TR','UL','OL','FORM','SECTION','NAV','HEADER','FOOTER','MAIN','ASIDE','ARTICLE','DIV'];

    function shouldSkip(el) {
      if (!el || el.nodeType !== 1) return true;
      if (SKIP_TAGS.indexOf(el.tagName) !== -1) return true;
      return false;
    }

    function isTextEditable(el) {
      if (!el || shouldSkip(el)) return false;
      if (NON_TEXT_TAGS.indexOf(el.tagName) !== -1 && TEXT_EDIT_TAGS.indexOf(el.tagName) === -1) {
        // allow DIV/SECTION only when they contain plain text and no element children
        if (el.tagName === 'DIV' || el.tagName === 'SECTION') {
          if (el.children && el.children.length > 0) return false;
          return !!(el.innerText || el.textContent || '').trim();
        }
        return false;
      }
      if (TEXT_EDIT_TAGS.indexOf(el.tagName) !== -1) return true;
      if (!el.children || el.children.length === 0) {
        return !!(el.innerText || el.textContent || '').trim();
      }
      return false;
    }

    function findTextEditable(start) {
      var el = start;
      while (el && el !== document.body && el !== document.documentElement) {
        if (isTextEditable(el)) return el;
        el = el.parentElement;
      }
      return null;
    }

    // build a short CSS selector for an element (must match layout tree / htmlLayoutParser)
    function buildSelector(el) {
      var parts = [];
      var cur = el;
      while (cur && cur !== document.body && cur.tagName && cur.tagName.toLowerCase() !== 'body') {
        var tag = cur.tagName.toLowerCase();
        var id  = cur.id ? '#' + cur.id : '';

        if (id) {
          parts.unshift(tag + id);
          break;
        }

        var hleId = cur.getAttribute && cur.getAttribute('data-hle-id');
        if (hleId) {
          parts.unshift(tag + '[data-hle-id="' + hleId + '"]');
          break;
        }

        var cls = Array.from(cur.classList)
                    .filter(function(c){ return c.indexOf('__aie') === -1; })
                    .slice(0,1)
                    .map(function(c){ return '.' + c; })
                    .join('');

        // Always include nth-of-type so selectors match the layout tree
        var parent   = cur.parentElement;
        var siblings = parent
          ? Array.from(parent.children).filter(function(c){ return c.tagName === cur.tagName; })
          : [cur];
        var nthOfType = ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')';

        parts.unshift(tag + cls + nthOfType);
        cur = cur.parentElement;
      }
      return parts.join(' > ').slice(0, 300);
    }

    // human-readable label: tagName + id/class snippet
    function buildLabel(el) {
      var tag = el.tagName.toLowerCase();
      var id  = el.id ? '#' + el.id : '';
      var cls = Array.from(el.classList)
                  .filter(function(c){ return c.indexOf('__aie') === -1; })
                  .slice(0,2)
                  .map(function(c){ return '.' + c; })
                  .join('');
      return tag + id + cls;
    }

    function getTextSnippet(el) {
      var t = (el.innerText || el.textContent || '').trim().slice(0, 120);
      return t;
    }

    // position badge near element
    function positionBadge(badgeEl, targetEl) {
      var rect = targetEl.getBoundingClientRect();
      var top  = rect.top - 22;
      if (top < 2) top = rect.bottom + 4;
      badgeEl.style.top  = top + 'px';
      badgeEl.style.left = rect.left + 'px';
    }

    // create hover badge
    function ensureBadge() {
      if (!badge) {
        badge = document.createElement('div');
        badge.id = '__aie_badge__';
        document.body.appendChild(badge);
      }
    }

    // create selected badge
    function ensureSelBadge() {
      if (!selBadge) {
        selBadge = document.createElement('div');
        selBadge.id = '__aie_sel_badge__';
        document.body.appendChild(selBadge);
      }
    }

    // find nearest <section id="..."> ancestor — used for sectionId + sectionHtml
    function nearestSectionElement(el) {
      var cur = el;
      while (cur && cur !== document.body) {
        if (cur.tagName === 'SECTION' && cur.id) return cur;
        cur = cur.parentElement;
      }
      return null;
    }

    // find the nearest direct child of <body> (fallback block scope)
    // this is what we send as sectionHtml so the backend edits only that block
    function nearestBodyChild(el) {
      var cur = el;
      while (cur && cur.parentElement && cur.parentElement !== document.body) {
        cur = cur.parentElement;
      }
      // must be a real element, not body/html itself
      if (!cur || cur === document.body || cur.tagName === 'HTML') return null;
      return cur;
    }

    // post message to parent
    function post(type, el) {
      try {
        var sectionEl = nearestSectionElement(el);
        var bodyChild = nearestBodyChild(el);
        var scopeEl   = sectionEl || bodyChild;
        window.parent.postMessage({
          __aie: true,
          type:         type,
          label:        buildLabel(el),
          selector:     buildSelector(el),
          outerHTML:    el.outerHTML.slice(0, 20000),
          textContent:  getTextSnippet(el),
          tagName:      el.tagName.toLowerCase(),
          sectionId:    sectionEl ? sectionEl.id : null,
          sectionHtml:  scopeEl ? scopeEl.outerHTML.slice(0, 80000) : null,
        }, '*');
      } catch(e) {}
    }

    function endTextEdit(commit) {
      if (!editing) return;
      var el = editing;
      var selector = '';
      try { selector = buildSelector(el); } catch (_) {}
      var text = (el.innerText || '').replace(/\u00a0/g, ' ');
      el.removeAttribute('contenteditable');
      el.classList.remove('__aie_editing__');
      editing = null;
      if (!commit) {
        el.innerText = editOriginal;
      } else if (selector && text !== editOriginal) {
        try {
          window.parent.postMessage({
            __aie: true,
            type: 'textEdit',
            selector: selector,
            text: text,
            label: buildLabel(el),
            tagName: el.tagName.toLowerCase(),
            outerHTML: el.outerHTML.slice(0, 20000),
            textContent: getTextSnippet(el),
          }, '*');
        } catch (_) {}
      }
      selected = el;
      selected.classList.add('__aie_selected__');
      ensureSelBadge();
      selBadge.textContent = buildLabel(el) + ' · editing saved';
      positionBadge(selBadge, selected);
      setTimeout(function() {
        if (selBadge && selected === el) selBadge.textContent = buildLabel(el);
      }, 1200);
      post('select', el);
    }

    function startTextEdit(el) {
      if (!el || !isTextEditable(el)) return;
      if (editing === el) return;
      if (editing) endTextEdit(true);

      if (selected && selected !== el) selected.classList.remove('__aie_selected__');
      selected = el;
      selected.classList.add('__aie_selected__');

      editOriginal = (el.innerText || '').replace(/\u00a0/g, ' ');
      editing = el;
      el.setAttribute('contenteditable', 'true');
      el.classList.add('__aie_editing__');
      el.focus();

      try {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}

      ensureSelBadge();
      selBadge.textContent = 'Editing text — click away to save';
      positionBadge(selBadge, el);
      post('select', el);
    }

    // ── mousemove ─────────────────────────────────────────────────────
    document.addEventListener('mousemove', function(e) {
      if (editing) return;
      var el = e.target;
      if (shouldSkip(el)) {
        if (hovered) {
          hovered.classList.remove('__aie_hover__');
          hovered = null;
        }
        if (badge) badge.style.opacity = '0';
        return;
      }

      if (el !== hovered) {
        if (hovered) hovered.classList.remove('__aie_hover__');
        hovered = el;
        hovered.classList.add('__aie_hover__');
        post('hover', el);

        ensureBadge();
        var editable = findTextEditable(el);
        badge.textContent = editable
          ? (buildLabel(editable) + ' · double-click to edit')
          : buildLabel(el);
        badge.style.opacity = '1';
        positionBadge(badge, el);
      }
    }, true);

    // ── mouseleave doc ─────────────────────────────────────────────────
    document.addEventListener('mouseleave', function() {
      if (hovered) { hovered.classList.remove('__aie_hover__'); hovered = null; }
      if (badge)   badge.style.opacity = '0';
    });

    // ── click ──────────────────────────────────────────────────────────
    document.addEventListener('click', function(e) {
      var el = e.target;
      if (editing) {
        if (editing === el || editing.contains(el)) {
          e.stopPropagation();
          return;
        }
        endTextEdit(true);
      }
      if (shouldSkip(el)) return;

      e.preventDefault();
      e.stopPropagation();

      // deselect previous
      if (selected) selected.classList.remove('__aie_selected__');

      selected = el;
      selected.classList.add('__aie_selected__');

      post('select', el);

      ensureSelBadge();
      var tip = isTextEditable(el) || findTextEditable(el)
        ? ' · double-click to edit text'
        : '';
      selBadge.textContent = buildLabel(el) + tip;
      positionBadge(selBadge, el);
    }, true);

    // ── double-click: edit text in place ───────────────────────────────
    document.addEventListener('dblclick', function(e) {
      var target = findTextEditable(e.target);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      startTextEdit(target);
    }, true);

    document.addEventListener('keydown', function(e) {
      if (!editing) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        endTextEdit(false);
        return;
      }
      // Single-line tags: Enter saves (Shift+Enter still allowed nowhere useful)
      var singleLine = ['H1','H2','H3','H4','H5','H6','SPAN','A','BUTTON','LABEL','STRONG','EM','B','I','SMALL'].indexOf(editing.tagName) !== -1;
      if (e.key === 'Enter' && (singleLine || (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        endTextEdit(true);
      }
    }, true);

    // ── scroll: reposition selected badge ─────────────────────────────
    document.addEventListener('scroll', function() {
      if (selected && selBadge) positionBadge(selBadge, selected);
      if (hovered  && badge)    positionBadge(badge,    hovered);
    }, true);

    // ── external hover from parent (e.g. layout tree hover) ───────────
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.__aie) return;

      if (e.data.type === 'externalHover') {
        if (editing) return;
        // clear previous external hover
        if (hovered) { hovered.classList.remove('__aie_hover__'); hovered = null; }
        if (badge)   badge.style.opacity = '0';

        var selector = e.data.selector;
        if (!selector) return;
        var el = null;
        try { el = document.querySelector(selector); } catch(_) {}
        if (!el) return;

        hovered = el;
        hovered.classList.add('__aie_hover__');
        ensureBadge();
        badge.textContent = e.data.label || selector;
        badge.style.opacity = '1';
        positionBadge(badge, el);
        // NOTE: no scrollIntoView here — we never auto-scroll on hover
      }

      if (e.data.type === 'externalHoverClear') {
        if (hovered) { hovered.classList.remove('__aie_hover__'); hovered = null; }
        if (badge)   badge.style.opacity = '0';
      }

      if (e.data.type === 'externalSelect') {
        if (editing) endTextEdit(true);
        if (selected) selected.classList.remove('__aie_selected__');
        var sel = e.data.selector;
        if (!sel) return;
        var target = null;
        try { target = document.querySelector(sel); } catch(_) {}
        if (!target) return;
        selected = target;
        selected.classList.add('__aie_selected__');
        ensureSelBadge();
        selBadge.textContent = e.data.label || sel;
        positionBadge(selBadge, selected);
        selected.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      // ── live HTML patch — update DOM without reloading the iframe ──
      if (e.data.type === 'updateHtml') {
        if (editing) return; // don't wipe in-progress text edits
        try {
          // Save scroll position + current selection (style edits must not deselect)
          var sx = window.scrollX;
          var sy = window.scrollY;
          var keepSelector = null;
          var keepLabel = null;
          if (selected && !shouldSkip(selected)) {
            try {
              keepSelector = buildSelector(selected);
              keepLabel = buildLabel(selected);
            } catch (_) {}
          }
          if (!keepSelector && e.data.preserveSelector) {
            keepSelector = e.data.preserveSelector;
            keepLabel = e.data.preserveLabel || keepSelector;
          }

          // Parse the new HTML
          var parser = new DOMParser();
          var newDoc = parser.parseFromString(e.data.html, 'text/html');

          // ── Update <head> styles ──
          // Remove all non-aie styles from current head
          var oldHeadStyles = Array.from(document.head.querySelectorAll(
            'style:not(#__aie_style__):not(#__aie_responsive__), link[rel="stylesheet"]'
          ));
          oldHeadStyles.forEach(function(el) { el.remove(); });

          // Insert new styles from the parsed doc, before our injected __aie_style__
          var aieStyleEl = document.getElementById('__aie_style__');
          var newHeadStyles = Array.from(newDoc.head.querySelectorAll(
            'style, link[rel="stylesheet"]'
          ));
          newHeadStyles.forEach(function(el) {
            var clone = el.cloneNode(true);
            if (aieStyleEl) {
              document.head.insertBefore(clone, aieStyleEl);
            } else {
              document.head.appendChild(clone);
            }
          });

          // Copy <html> / <body> class, style, and other attrs.
          // Page background often lives here; innerHTML alone leaves a white canvas.
          function copyAttrs(fromEl, toEl) {
            if (!fromEl || !toEl) return;
            var keep = {};
            Array.from(toEl.attributes).forEach(function(a) {
              if (a.name === "id" && String(a.value).indexOf("__aie") === 0) keep[a.name] = a.value;
            });
            Array.from(toEl.attributes).forEach(function(a) {
              toEl.removeAttribute(a.name);
            });
            Array.from(fromEl.attributes).forEach(function(a) {
              toEl.setAttribute(a.name, a.value);
            });
            Object.keys(keep).forEach(function(name) {
              if (!toEl.hasAttribute(name)) toEl.setAttribute(name, keep[name]);
            });
          }
          copyAttrs(newDoc.documentElement, document.documentElement);
          copyAttrs(newDoc.body, document.body);

          // ── Update <body> ──
          document.body.innerHTML = newDoc.body.innerHTML;

          // Badges were in body — reset refs so they get recreated on demand
          badge    = null;
          selBadge = null;
          selected = null;
          hovered  = null;

          // Restore scroll position
          window.scrollTo(sx, sy);

          // Re-apply selection outline after the DOM swap (Styles tab edits)
          if (keepSelector) {
            var restored = null;
            try { restored = document.querySelector(keepSelector); } catch (_) {}
            if (!restored) {
              try {
                restored = document.querySelector(
                  keepSelector.replace(/:nth-of-type\(\d+\)/g, "")
                );
              } catch (_) {}
            }
            if (restored && !shouldSkip(restored)) {
              selected = restored;
              selected.classList.add('__aie_selected__');
              ensureSelBadge();
              selBadge.textContent = keepLabel || buildLabel(restored);
              positionBadge(selBadge, selected);
              // Refresh parent metadata (outerHTML) without clearing the Styles panel
              post('select', restored);
            }
          }
        } catch(err) {}
      }

    });

  })();
  <\/script>
`;

/**
 * Takes the raw HTML string and injects the hover/select tracker.
 * If <head> exists, appends into it. Otherwise prepends to the string.
 */
export function injectInteractivity(html) {
  if (!html) return html;

  const injection = INJECT_CSS + INJECT_SCRIPT;

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, injection + "</head>");
  }
  if (/<body/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, (match) => match + injection);
  }
  return injection + html;
}
