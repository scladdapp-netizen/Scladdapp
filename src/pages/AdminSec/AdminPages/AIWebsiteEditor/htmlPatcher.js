// htmlPatcher.js
// Pure functions for modifying an HTML string by selector.
// All functions parse → mutate DOM → serialize back to string.
// No side effects, always returns a new HTML string.

/**
 * Internal: parse html string → document, run mutationFn(doc), serialize back.
 *
 * If the input looks like a plain HTML fragment (no <!DOCTYPE> / <html> tag),
 * only the body's innerHTML is returned so the stored value stays a fragment.
 * Full-page HTML (AIWebsiteEditor) is preserved as a full document.
 *
 * {{placeholders}} are temporarily swapped to data-attributes on a <span>
 * before parsing so the browser doesn't eject them from table contexts.
 */
function withDoc(html, mutationFn) {
  const isFragment = !/<html[\s>]/i.test(html) && !/<!DOCTYPE/i.test(html);

  // ── Protect {{placeholders}} from the HTML parser ──────────────────────
  // Browser ejects bare text like {{subjectTableRows}} out of <tbody>/<tr>.
  // Strategy: replace every {{key}} with a <template data-ph="key"></template>
  // which is valid anywhere in a table, then restore after serialisation.
  const placeholders = [];
  const protected_html = html.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const idx = placeholders.length;
    placeholders.push(match);
    return `<template data-ph="${idx}"></template>`;
  });

  const parser = new DOMParser();
  const doc    = parser.parseFromString(protected_html, "text/html");
  mutationFn(doc);

  let result;
  if (isFragment) {
    result = doc.body.innerHTML;
  } else {
    result = doc.documentElement.outerHTML
      ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
      : protected_html;
  }

  // ── Restore {{placeholders}} ───────────────────────────────────────────
  result = result.replace(/<template data-ph="(\d+)"><\/template>/g, (_, idx) => {
    return placeholders[Number(idx)] ?? "";
  });

  return result;
}

/**
 * Find an element by CSS selector inside a document.
 * Returns null if not found or selector is invalid.
 */
function findEl(doc, selector) {
  if (!selector) return null;
  try { return doc.querySelector(selector); }
  catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delete the element matching `selector` from the HTML string.
 *
 * @param {string} html       - full page HTML
 * @param {string} selector   - CSS selector of the element to remove
 * @returns {string}          - new HTML string
 */
export function deleteElement(html, selector) {
  return withDoc(html, (doc) => {
    const el = findEl(doc, selector);
    if (el) el.remove();
    else console.warn("[deleteElement] Element not found for selector:", selector);
  });
}

/**
 * Insert `newHtml` as the LAST child of the element matching `parentSelector`.
 *
 * @param {string} html             - full page HTML
 * @param {string} parentSelector   - CSS selector of the parent element
 * @param {string} newHtml          - HTML string to insert
 * @returns {string}                - new HTML string
 */
export function insertChildLast(html, parentSelector, newHtml) {
  return withDoc(html, (doc) => {
    const parent = findEl(doc, parentSelector);
    if (!parent) return;
    const tmp = doc.createElement("div");
    tmp.innerHTML = newHtml;
    // Move all children of tmp into parent
    while (tmp.firstChild) {
      parent.appendChild(tmp.firstChild);
    }
  });
}

/**
 * Insert `newHtml` AFTER the element matching `selector` (as a sibling).
 *
 * @param {string} html       - full page HTML
 * @param {string} selector   - CSS selector of the reference element
 * @param {string} newHtml    - HTML string to insert after it
 * @returns {string}          - new HTML string
 */
export function insertAfter(html, selector, newHtml) {
  return withDoc(html, (doc) => {
    const ref = findEl(doc, selector);
    if (!ref || !ref.parentNode) return;
    const tmp = doc.createElement("div");
    tmp.innerHTML = newHtml;
    const frag = doc.createDocumentFragment();
    while (tmp.firstChild) frag.appendChild(tmp.firstChild);
    ref.parentNode.insertBefore(frag, ref.nextSibling);
  });
}

/**
 * Move element matching `fromSelector` to before or after `toSelector`.
 *
 * @param {string} html         - full page HTML
 * @param {string} fromSelector - element to move
 * @param {string} toSelector   - reference element
 * @param {"before"|"after"} position
 * @returns {string}            - new HTML string
 */
export function moveElement(html, fromSelector, toSelector, position) {
  return withDoc(html, (doc) => {
    const from = findEl(doc, fromSelector);
    const to   = findEl(doc, toSelector);
    if (!from || !to || from === to) return;
    if (to.contains(from)) return; // can't drop inside itself

    // Clone before removing so the reference isn't lost
    const clone = from.cloneNode(true);
    from.remove();

    // Re-find `to` after removal (selector may have shifted nth-of-type)
    // Use the clone's position relative to parent
    const toFresh = findEl(doc, toSelector);
    const ref = toFresh || to;

    if (position === "before") {
      ref.parentNode?.insertBefore(clone, ref);
    } else {
      ref.parentNode?.insertBefore(clone, ref.nextSibling);
    }
  });
}

/**
 * Append `newHtml` directly to <body> (used for top-level sections).
 *
 * @param {string} html       - full page HTML
 * @param {string} newHtml    - HTML string to append
 * @returns {string}          - new HTML string
 */
export function appendToBody(html, newHtml) {
  return withDoc(html, (doc) => {
    const tmp = doc.createElement("div");
    tmp.innerHTML = newHtml;
    while (tmp.firstChild) {
      doc.body.appendChild(tmp.firstChild);
    }
  });
}

/**
 * Duplicate the element matching `selector`, inserting the clone
 * immediately after the original.
 *
 * @param {string} html
 * @param {string} selector - CSS selector of the element to clone
 * @returns {string}        - new HTML string
 */
export function duplicateElement(html, selector) {
  if (!html || !selector) return html || "";
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el || !el.parentNode) return;

    const clone = el.cloneNode(true);
    // Strip any injected __aie selection/hover classes from the clone
    clone.classList.remove("__aie_selected__", "__aie_hover__");
    clone.querySelectorAll(".__aie_selected__, .__aie_hover__").forEach((c) => {
      c.classList.remove("__aie_selected__", "__aie_hover__");
    });

    el.parentNode.insertBefore(clone, el.nextSibling);
  });
}

/**
 * Move `fromSelector` element INTO `parentSelector` as its last child.
 * Used when dropping an element "inside" a nestable container.
 *
 * @param {string} html
 * @param {string} fromSelector
 * @param {string} parentSelector
 * @returns {string}
 */
export function moveIntoParent(html, fromSelector, parentSelector) {
  return withDoc(html, (doc) => {
    const from   = findEl(doc, fromSelector);
    const parent = findEl(doc, parentSelector);
    if (!from || !parent || parent === from || parent.contains(from) === false && from.contains(parent)) return;
    if (from.contains(parent)) return; // can't move parent into its own child

    const clone = from.cloneNode(true);
    from.remove();

    // Re-find parent after removal
    const parentFresh = findEl(doc, parentSelector) || parent;
    parentFresh.appendChild(clone);
  });
}

/**
 * Set or remove an HTML attribute on the element matching `selector`.
 * Pass value = null / "" to remove the attribute.
 *
 * @param {string} html
 * @param {string} selector
 * @param {string} attr       - attribute name, e.g. "href", "src", "alt"
 * @param {string|null} value - new value, or null/empty to remove
 * @returns {string}
 */
export function patchAttribute(html, selector, attr, value) {
  if (!html || !selector) return html || "";
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el) {
      console.warn("[patchAttribute] Element not found for selector:", selector);
      return;
    }
    if (value === null || value === undefined || value === "") {
      el.removeAttribute(attr);
    } else {
      el.setAttribute(attr, value);
    }
  });
}

/**
 * Set a single CSS property on the element's inline `style`.
 * Pass value = null / "" to remove that property from inline style.
 *
 * @param {string} html
 * @param {string} selector
 * @param {string} prop   - CSS property in camelCase or kebab-case
 * @param {string|null} value
 * @returns {string}
 */
export function patchStyle(html, selector, prop, value) {
  if (!html || !selector) {
    console.warn("[patchStyle] Missing html or selector", { selector, prop, value });
    return html || "";
  }
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);

    // Fallback: if the full selector fails (e.g. nth-of-type shifted after a
    // previous edit), try stripping nth-of-type suffixes and retry once.
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }

    if (!el) {
      console.warn("[patchStyle] Element not found for selector:", selector);
      return;
    }

    if (value === null || value === undefined || value === "") {
      el.style.removeProperty(prop);
    } else {
      el.style.setProperty(prop, value);
    }
  });
}

/**
 * Replace the visible text content (textContent) of the element matching
 * `selector`. For elements that contain only text (no child elements) this
 * is equivalent to editing the label. For elements with mixed content the
 * entire innerHTML is replaced with the escaped text.
 *
 * @param {string} html
 * @param {string} selector
 * @param {string} text
 * @returns {string}
 */
export function patchTextContent(html, selector, text) {
  if (!html || !selector) return html || "";
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el) {
      console.warn("[patchTextContent] Element not found for selector:", selector);
      return;
    }
    // If the element has no child elements (pure text node), just set textContent
    if (el.children.length === 0) {
      el.textContent = text;
    } else {
      // Replace only the first direct text node; fallback: set full textContent
      const firstText = Array.from(el.childNodes).find(n => n.nodeType === 3);
      if (firstText) {
        firstText.textContent = text;
      } else {
        el.textContent = text;
      }
    }
  });
}

/**
 * Set or remove a CSS property inside a @media (max-width: Npx) rule
 * that targets `selector`, stored in a dedicated <style id="__aie_responsive__">
 * block in <head>.
 *
 * Strategy:
 *   - Parse the block's text as a plain string map: selector → { prop: value }
 *   - Mutate the map
 *   - Re-serialise back to CSS text
 *   - If the block doesn't exist, create it
 *
 * @param {string} html
 * @param {string} selector   - CSS selector of the element
 * @param {string} prop       - CSS property (kebab-case)
 * @param {string|null} value - new value, or null/empty to remove
 * @param {number} [breakpoint=768] - max-width in px
 * @returns {string} new HTML string
 */
export function patchMediaStyle(html, selector, prop, value, breakpoint = 768) {
  if (!html || !selector) return html || "";
  return withDoc(html, (doc) => {
    const BLOCK_ID = "__aie_responsive__";
    let styleEl = doc.getElementById(BLOCK_ID);
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = BLOCK_ID;
      (doc.head || doc.documentElement).appendChild(styleEl);
    }

    const mediaKey = `@media (max-width: ${breakpoint}px)`;

    // Read existing CSS — use textContent, trim aggressively to avoid stray chars
    const existingCss = (styleEl.textContent || "").trim();
    const rulesMap = parseResponsiveCss(existingCss);

    if (!rulesMap[mediaKey]) rulesMap[mediaKey] = {};
    if (!rulesMap[mediaKey][selector]) rulesMap[mediaKey][selector] = {};

    if (value === null || value === undefined || value === "") {
      delete rulesMap[mediaKey][selector][prop];
      if (!Object.keys(rulesMap[mediaKey][selector]).length)
        delete rulesMap[mediaKey][selector];
      if (!Object.keys(rulesMap[mediaKey]).length)
        delete rulesMap[mediaKey];
    } else {
      rulesMap[mediaKey][selector][prop] = value;
    }

    // Overwrite the entire style element content with clean CSS
    const newCss = serialiseResponsiveCss(rulesMap);
    // Use a text node so no HTML encoding happens
    while (styleEl.firstChild) styleEl.removeChild(styleEl.firstChild);
    if (newCss) styleEl.appendChild(doc.createTextNode(newCss));
  });
}

/**
 * Read ALL media-query styles for a given selector + breakpoint from the HTML.
 * Returns a plain { prop: value } map.
 *
 * @param {string} html
 * @param {string} selector
 * @param {number} [breakpoint=768]
 * @returns {Object}
 */
export function readMediaStyles(html, selector, breakpoint = 768) {
  if (!html || !selector) return {};
  try {
    const parser   = new DOMParser();
    const doc      = parser.parseFromString(html, "text/html");
    const styleEl  = doc.getElementById("__aie_responsive__");
    if (!styleEl) return {};
    const mediaKey = `@media (max-width: ${breakpoint}px)`;
    const rulesMap = parseResponsiveCss((styleEl.textContent || "").trim());
    return rulesMap[mediaKey]?.[selector] || {};
  } catch { return {}; }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Parse our hand-written responsive CSS text into:
 * { "@media (max-width: 768px)": { "selector": { "prop": "value" } } }
 *
 * We only parse the structure we write — simple, no nested at-rules.
 */
function parseResponsiveCss(cssText) {
  const result = {};
  if (!cssText.trim()) return result;

  // Match:  @media (...) {   ...inner rules...   }
  // The outer closing brace is the LAST } in the block.
  // We walk character by character to find the matching brace.
  let i = 0;
  const len = cssText.length;

  while (i < len) {
    // Find next @media
    const atIdx = cssText.indexOf("@media", i);
    if (atIdx < 0) break;

    // Find the opening brace of the @media block
    const openBrace = cssText.indexOf("{", atIdx);
    if (openBrace < 0) break;

    const mediaKey = cssText.slice(atIdx, openBrace).trim();

    // Find the matching closing brace (handle nested braces for inner rules)
    let depth = 1;
    let j = openBrace + 1;
    while (j < len && depth > 0) {
      if (cssText[j] === "{") depth++;
      else if (cssText[j] === "}") depth--;
      j++;
    }
    // cssText[openBrace+1 .. j-2] is the inner content
    const innerCss = cssText.slice(openBrace + 1, j - 1);
    i = j;

    if (!result[mediaKey]) result[mediaKey] = {};

    // Parse inner selector { decls } rules
    const ruleRe = /([^{]+)\{([^}]*)\}/g;
    let rMatch;
    while ((rMatch = ruleRe.exec(innerCss)) !== null) {
      const sel   = rMatch[1].trim();
      const decls = rMatch[2];
      if (!sel) continue;
      if (!result[mediaKey][sel]) result[mediaKey][sel] = {};
      decls.split(";").forEach(decl => {
        const idx = decl.indexOf(":");
        if (idx < 0) return;
        const p = decl.slice(0, idx).trim();
        const v = decl.slice(idx + 1).trim().replace(/\s*!important\s*$/i, "").trim();
        if (p && v) result[mediaKey][sel][p] = v;
      });
    }
  }
  return result;
}

function serialiseResponsiveCss(rulesMap) {
  if (!Object.keys(rulesMap).length) return "";
  return Object.entries(rulesMap).map(([media, selectors]) => {
    const inner = Object.entries(selectors).map(([sel, props]) => {
      const decls = Object.entries(props)
        .map(([p, v]) => {
          // Strip any existing !important then re-add it so mobile
          // rules always override desktop inline styles
          const clean = v.replace(/\s*!important\s*$/i, "").trim();
          return `    ${p}: ${clean} !important;`;
        })
        .join("\n");
      return `  ${sel} {\n${decls}\n  }`;
    }).join("\n");
    return `${media} {\n${inner}\n}`;
  }).join("\n\n");
}
