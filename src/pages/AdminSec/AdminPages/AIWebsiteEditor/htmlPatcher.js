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
function ensureHleId(el) {
  if (el && el.nodeType === 1 && !el.getAttribute("data-hle-id")) {
    el.setAttribute(
      "data-hle-id",
      `hle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    );
  }
}

function findEl(doc, selector) {
  if (!selector) return null;
  try {
    const el = doc.querySelector(selector);
    if (el) return el;
  } catch { /* invalid selector */ }
  // Fallback: strip :nth-of-type so preview/tree selector variants still resolve
  try {
    const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
    if (simplified !== selector) return doc.querySelector(simplified);
  } catch { /* ignore */ }
  return null;
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
    while (tmp.firstChild) {
      const child = tmp.firstChild;
      ensureHleId(child);
      parent.appendChild(child);
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
    while (tmp.firstChild) {
      ensureHleId(tmp.firstChild);
      frag.appendChild(tmp.firstChild);
    }
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
  let movedHleId = null;
  const newHtml = withDoc(html, (doc) => {
    const from = findEl(doc, fromSelector);
    const to   = findEl(doc, toSelector);
    if (!from || !to || from === to) return;
    if (to.contains(from)) return; // can't drop a parent onto its child
    if (!to.parentNode) return;

    ensureHleId(from);
    movedHleId = from.getAttribute("data-hle-id");

    // Move the live node — avoids nth-of-type shift bugs from clone/remove
    if (position === "before") {
      to.parentNode.insertBefore(from, to);
    } else {
      to.parentNode.insertBefore(from, to.nextSibling);
    }
  });
  return { html: newHtml, movedHleId };
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
      const child = tmp.firstChild;
      ensureHleId(child);
      doc.body.appendChild(child);
    }
  });
}

/** Insert `newHtml` as the first children of <body>, keeping their order. */
export function prependToBody(html, newHtml) {
  return withDoc(html, (doc) => {
    const tmp = doc.createElement("div");
    tmp.innerHTML = newHtml;
    const nodes = [];
    while (tmp.firstChild) nodes.push(tmp.firstChild);
    const ref = doc.body.firstChild;
    nodes.forEach((node) => {
      ensureHleId(node);
      doc.body.insertBefore(node, ref);
    });
  });
}

/**
 * Insert a section fragment into a page.
 * Styles go in <head>. Markup goes into the body (or a parent).
 * Navigation can replace the existing bar so it is not hidden under it.
 * Returns { html, selector } for the inserted root element.
 */
export function insertSectionIntoPage(html, fragmentHtml, {
  atStart = false,
  replaceSelector = null,
  parentSelector = null,
} = {}) {
  let insertedSelector = null;
  const newHtml = withDoc(html, (doc) => {
    const parsed = new DOMParser().parseFromString(String(fragmentHtml || ""), "text/html");
    Array.from(parsed.head.querySelectorAll("style, link[rel='stylesheet']")).forEach((node) => {
      doc.head.appendChild(doc.importNode(node, true));
    });

    const imported = Array.from(parsed.body.children).map((node) => {
      ensureHleId(node);
      return doc.importNode(node, true);
    });
    if (!imported.length) return;

    const root = imported[0];
    const hleId = root.getAttribute("data-hle-id");
    const tag = root.tagName.toLowerCase();
    insertedSelector = hleId ? `${tag}[data-hle-id="${hleId}"]` : null;

    if (parentSelector) {
      const parent = findEl(doc, parentSelector);
      const host = parent || doc.body;
      imported.forEach((node) => host.appendChild(node));
      return;
    }

    const existing = replaceSelector ? findEl(doc, replaceSelector) : null;
    if (existing && existing.parentNode) {
      imported.forEach((node) => existing.parentNode.insertBefore(node, existing));
      existing.remove();
      return;
    }

    if (atStart) {
      const ref = doc.body.firstChild;
      imported.forEach((node) => doc.body.insertBefore(node, ref));
    } else {
      imported.forEach((node) => doc.body.appendChild(node));
    }
  });
  return { html: newHtml, selector: insertedSelector };
}

/** Create or replace a <style id> in the document head. */
export function upsertHeadStyle(html, id, css) {
  if (!html || !id) return html;
  return withDoc(html, (doc) => {
    let style = doc.getElementById(id);
    if (!style) {
      style = doc.createElement("style");
      style.id = id;
      (doc.head || doc.documentElement).appendChild(style);
    }
    style.textContent = css;
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
    // Fresh stable ids so the clone is independently addressable
    clone.querySelectorAll("[data-hle-id]").forEach((c) => {
      c.removeAttribute("data-hle-id");
      ensureHleId(c);
    });
    clone.removeAttribute("data-hle-id");
    ensureHleId(clone);

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
  let movedHleId = null;
  const newHtml = withDoc(html, (doc) => {
    const from   = findEl(doc, fromSelector);
    const parent = findEl(doc, parentSelector);
    if (!from || !parent || parent === from) return;
    if (from.contains(parent)) return; // can't move parent into its own child

    ensureHleId(from);
    movedHleId = from.getAttribute("data-hle-id");

    // Live move to end of parent (works even if already a child)
    parent.appendChild(from);
  });
  return { html: newHtml, movedHleId };
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
 * Set a navigation URL on a button or link.
 * Buttons are converted to <a role="button"> so the link works on the published site
 * without JavaScript. Returns { html, hleId } so the editor can re-select the node.
 *
 * @param {string} html
 * @param {string} selector
 * @param {string|null} href
 * @param {string|null} [target]
 * @returns {{ html: string, hleId: string|null }}
 */
export function patchElementLink(html, selector, href, target) {
  let hleId = null;
  if (!html || !selector) return { html: html || "", hleId };
  const newHtml = withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el) return;

    const tag = el.tagName.toLowerCase();
    const url = (href || "").trim();

    // Already a link — just patch href/target
    if (tag === "a") {
      ensureHleId(el);
      hleId = el.getAttribute("data-hle-id");
      if (!url) el.setAttribute("href", "#");
      else el.setAttribute("href", url);
      if (target) el.setAttribute("target", target);
      else el.removeAttribute("target");
      if (target === "_blank") el.setAttribute("rel", "noopener noreferrer");
      else el.removeAttribute("rel");
      return;
    }

    if (tag !== "button") return;

    ensureHleId(el);
    hleId = el.getAttribute("data-hle-id");

    // Convert <button> → <a role="button"> so href navigates on the live site
    const a = doc.createElement("a");
    for (const attr of Array.from(el.attributes)) {
      if (attr.name === "type" || attr.name === "disabled") continue;
      a.setAttribute(attr.name, attr.value);
    }
    a.setAttribute("href", url || "#");
    a.setAttribute("role", "button");
    if (target) {
      a.setAttribute("target", target);
      if (target === "_blank") a.setAttribute("rel", "noopener noreferrer");
    }
    a.innerHTML = el.innerHTML;
    el.replaceWith(a);
  });
  return { html: newHtml, hleId };
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

    applyBackgroundAwareStyle(el, prop, value);
  });
}

/**
 * Set several CSS properties on the same element in one parse, so later
 * writes are not applied to stale HTML.
 */
export function patchStyles(html, selector, props) {
  if (!html || !selector || !props) return html || "";
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el) {
      console.warn("[patchStyles] Element not found for selector:", selector);
      return;
    }
    // Clear shorthand first when any longhand background prop is written,
    // so gradients / images in `background:` do not block colour edits.
    const touchesBg = Object.keys(props).some((p) =>
      p === "background" || p.startsWith("background-")
    );
    if (touchesBg) el.style.removeProperty("background");

    Object.entries(props).forEach(([prop, value]) => {
      applyBackgroundAwareStyle(el, prop, value, { skipShorthandClear: true });
    });
  });
}

/** Apply a style prop; clear `background` shorthand when editing longhands. */
function applyBackgroundAwareStyle(el, prop, value, opts = {}) {
  const isBgLonghand =
    prop === "background-color" ||
    prop === "background-image" ||
    prop === "background-size" ||
    prop === "background-position" ||
    prop === "background-repeat";

  if (!opts.skipShorthandClear && isBgLonghand) {
    el.style.removeProperty("background");
  }

  if (value === null || value === undefined || value === "") {
    el.style.removeProperty(prop);
  } else {
    el.style.setProperty(prop, value);
  }
}

function applyStyleMap(el, map) {
  if (!el || !map) return;
  Object.entries(map).forEach(([prop, value]) => {
    if (value === null || value === undefined || value === "") {
      el.style.removeProperty(prop);
    } else {
      el.style.setProperty(prop, value);
    }
  });
}

function cssDecls(map) {
  if (!map) return "";
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k}: ${v} !important`)
    .join("; ");
}

function rowTdMap(template, rowMap) {
  const out = { ...(template.td || {}) };
  const bg = rowMap?.["background-color"];
  if (bg && bg !== "transparent") out["background-color"] = bg;
  return out;
}

/**
 * Body rows for scores are often {{subjectTableRows}} — they have no <td>
 * until preview/export hydrates them, and those cells ship their own inline
 * styles. A <style> next to the table wins with !important so tbody matches.
 */
function upsertTableThemeCss(doc, table, template) {
  let id = table.getAttribute("data-hle-id");
  if (!id) {
    id = `tbl-theme-${template.id || "custom"}`;
    table.setAttribute("data-hle-id", id);
  }

  const sel = `table[data-hle-id="${id}"]`;
  const rules = [
    `${sel} thead { ${cssDecls(template.thead)} }`,
    `${sel} tfoot { ${cssDecls(template.tfoot)} }`,
    `${sel} th { ${cssDecls(template.th)} }`,
    `${sel} td { ${cssDecls(template.td)} }`,
    `${sel} tbody tr:nth-child(odd) td { ${cssDecls(rowTdMap(template, template.trOdd))} }`,
    `${sel} tbody tr:nth-child(even) td { ${cssDecls(rowTdMap(template, template.trEven))} }`,
    `${sel} tfoot td { ${cssDecls(template.td)} }`,
  ].filter((r) => !r.endsWith("{  }"));

  const css = rules.join("\n");
  let styleEl = null;
  doc.querySelectorAll("style[data-hle-table-css]").forEach((s) => {
    if (s.getAttribute("data-hle-table-css") === id) styleEl = s;
  });
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("data-hle-table-css", id);
    table.parentNode?.insertBefore(styleEl, table);
  }
  styleEl.textContent = css;
}

/**
 * Restyle a <table> (or the table that contains the selected cell/row)
 * using a preset of inline styles on the table, header, cells, and rows.
 */
export function applyTableTemplate(html, selector, template) {
  if (!html || !selector || !template) return html || "";
  return withDoc(html, (doc) => {
    let el = findEl(doc, selector);
    if (!el) {
      const simplified = selector.replace(/:nth-of-type\(\d+\)/g, "");
      if (simplified !== selector) el = findEl(doc, simplified);
    }
    if (!el) {
      console.warn("[applyTableTemplate] Element not found for selector:", selector);
      return;
    }
    const table = el.tagName === "TABLE" ? el : el.closest("table");
    if (!table) return;

    table.setAttribute("data-table-theme", template.id || "");
    // Clear chrome left over from other presets (overflow clips an outer border).
    applyStyleMap(table, {
      overflow: "visible",
      "border-radius": "0",
      outline: "none",
      border: "none",
      "border-spacing": "0",
    });
    applyStyleMap(table, template.table);

    table.querySelectorAll("thead").forEach((n) => {
      n.style.removeProperty("background");
      applyStyleMap(n, template.thead);
    });
    table.querySelectorAll("tfoot").forEach((n) => {
      n.style.removeProperty("background");
      applyStyleMap(n, template.tfoot);
    });
    table.querySelectorAll("th").forEach((n) => applyStyleMap(n, template.th));
    table.querySelectorAll("td").forEach((n) => applyStyleMap(n, template.td));

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach((tr, i) => {
      const even = i % 2 === 1;
      applyStyleMap(tr, even ? (template.trEven || template.tr) : (template.trOdd || template.tr));
    });

    upsertTableThemeCss(doc, table, template);
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
