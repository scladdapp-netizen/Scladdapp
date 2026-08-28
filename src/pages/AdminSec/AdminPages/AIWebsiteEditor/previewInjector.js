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

    // skip invisible / utility elements
    var SKIP_TAGS = ['HTML','HEAD','BODY','SCRIPT','STYLE','META','LINK','TITLE','NOSCRIPT'];

    function shouldSkip(el) {
      if (!el || el.nodeType !== 1) return true;
      if (SKIP_TAGS.indexOf(el.tagName) !== -1) return true;
      return false;
    }

    // build a short CSS selector for an element
    function buildSelector(el) {
      var parts = [];
      var cur = el;
      while (cur && cur !== document.body) {
        var tag = cur.tagName.toLowerCase();
        var id  = cur.id ? '#' + cur.id : '';

        if (id) {
          parts.unshift(tag + id);
          break;
        }

        var cls = Array.from(cur.classList)
                    .filter(function(c){ return c.indexOf('__aie') === -1; })
                    .slice(0,1)
                    .map(function(c){ return '.' + c; })
                    .join('');

        // nth-of-type to disambiguate siblings with the same tag
        var parent   = cur.parentElement;
        var siblings = parent
          ? Array.from(parent.children).filter(function(c){ return c.tagName === cur.tagName; })
          : [];
        var nthOfType = siblings.length > 1
          ? ':nth-of-type(' + (siblings.indexOf(cur) + 1) + ')'
          : '';

        parts.unshift(tag + cls + nthOfType);
        cur = cur.parentElement;
      }
      return parts.join(' > ').slice(0, 200);
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

    // find nearest <section id="..."> ancestor and return its id
    function nearestSectionId(el) {
      var cur = el;
      while (cur && cur !== document.body) {
        if (cur.tagName === 'SECTION' && cur.id) return cur.id;
        cur = cur.parentElement;
      }
      return null;
    }

    // find the nearest direct child of <body> (the top-level block that contains el)
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
        var bodyChild = nearestBodyChild(el);
        window.parent.postMessage({
          __aie: true,
          type:         type,
          label:        buildLabel(el),
          selector:     buildSelector(el),
          outerHTML:    el.outerHTML.slice(0, 20000),
          textContent:  getTextSnippet(el),
          tagName:      el.tagName.toLowerCase(),
          sectionId:    nearestSectionId(el),
          // full outerHTML of the direct body child that contains el
          // backend uses this to know exactly which block to edit
          sectionHtml:  bodyChild ? bodyChild.outerHTML : null,
        }, '*');
      } catch(e) {}
    }

    // ── mousemove ─────────────────────────────────────────────────────
    document.addEventListener('mousemove', function(e) {
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
        badge.textContent = buildLabel(el);
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
      if (shouldSkip(el)) return;

      e.preventDefault();
      e.stopPropagation();

      // deselect previous
      if (selected) selected.classList.remove('__aie_selected__');

      selected = el;
      selected.classList.add('__aie_selected__');

      post('select', el);

      ensureSelBadge();
      selBadge.textContent = buildLabel(el);
      positionBadge(selBadge, el);
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
        try {
          // Save scroll position
          var sx = window.scrollX;
          var sy = window.scrollY;

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
