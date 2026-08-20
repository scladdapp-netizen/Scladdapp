// htmlLayoutParser.js
// Parses an HTML string and returns a friendly tree structure
// that maps raw HTML tags to human-readable names non-programmers understand.

// ── Tag → friendly label mapping ─────────────────────────────────────────────
const TAG_LABELS = {
  // Layout / structure
  header:  "Header",
  nav:     "Navigation",
  main:    "Main Content",
  footer:  "Footer",
  section: "Section",
  article: "Article",
  aside:   "Sidebar",
  div:     "Container",
  form:    "Form",

  // Text
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  p:  "Paragraph",
  span: "Text",
  label: "Label",
  blockquote: "Quote",
  pre: "Code Block",
  code: "Code",

  // Media
  img:    "Image",
  video:  "Video",
  audio:  "Audio",
  iframe: "Embed",
  canvas: "Canvas",
  svg:    "Icon / SVG",
  figure: "Figure",
  picture: "Picture",

  // Interactive
  a:        "Link",
  button:   "Button",
  input:    "Input Field",
  textarea: "Text Area",
  select:   "Dropdown",
  option:   "Option",
  fieldset: "Field Group",

  // Lists
  ul: "List",
  ol: "Numbered List",
  li: "List Item",

  // Table
  table: "Table",
  thead: "Table Header",
  tbody: "Table Body",
  tr:    "Table Row",
  td:    "Table Cell",
  th:    "Table Heading Cell",

  // Misc
  hr:     "Divider",
  br:     "Line Break",
  strong: "Bold Text",
  em:     "Italic Text",
  small:  "Small Text",
  time:   "Date / Time",
  details: "Expandable",
  summary: "Summary",
};

// ── Tag → icon type (used by the UI to pick an icon) ─────────────────────────
export const TAG_ICON = {
  header:  "layout",
  nav:     "navigation",
  main:    "layout",
  footer:  "layout",
  section: "section",
  article: "article",
  aside:   "sidebar",
  div:     "container",
  form:    "form",

  h1: "heading", h2: "heading", h3: "heading",
  h4: "heading", h5: "heading", h6: "heading",
  p:  "text",
  span: "text",
  blockquote: "quote",

  img:    "image",
  video:  "video",
  audio:  "audio",
  svg:    "icon",
  figure: "image",
  picture: "image",
  iframe: "embed",

  a:        "link",
  button:   "button",
  input:    "input",
  textarea: "input",
  select:   "input",

  ul: "list", ol: "list", li: "listitem",
  table: "table", tr: "table", td: "table", th: "table",

  hr: "divider",
};

// Tags we never show in the tree (invisible/meta elements)
const SKIP_TAGS = new Set([
  "script", "style", "meta", "link", "title", "noscript",
  "head", "html", "br", "wbr",
]);

// Tags that are too granular to expand into children by default
const LEAF_TAGS = new Set([
  "img", "video", "audio", "iframe", "input", "hr", "br",
  "svg", "canvas", "br",
]);

let _nodeId = 0;

/**
 * Recursively walk a DOM element and build a plain JS tree.
 * @param {Element} el
 * @param {number} depth
 * @returns {object|null}
 */
function walkElement(el, depth = 0) {
  if (!el || el.nodeType !== 1) return null;

  const tag = el.tagName.toLowerCase();
  if (SKIP_TAGS.has(tag)) return null;

  // Build a unique path-based id so we can find it again
  const id = ++_nodeId;

  // Friendly label: use id attr, class hint, or tag label
  const tagLabel  = TAG_LABELS[tag] || tag.charAt(0).toUpperCase() + tag.slice(1);
  const idHint    = el.id   ? `#${el.id}` : "";
  const classHint = el.classList.length
    ? "." + Array.from(el.classList).filter(c => !c.startsWith("__aie")).slice(0, 1).join(".")
    : "";

  // Text preview for leaf nodes
  const textPreview = LEAF_TAGS.has(tag)
    ? (el.getAttribute("src") || el.getAttribute("href") || el.getAttribute("alt") || "")
    : (el.textContent || "").trim().slice(0, 40).replace(/\s+/g, " ");

  // Build a CSS selector to identify this element
  const selector = buildSelector(el);

  // Children — skip leaves
  const children = LEAF_TAGS.has(tag)
    ? []
    : Array.from(el.children)
        .map(child => walkElement(child, depth + 1))
        .filter(Boolean);

  return {
    id,
    tag,
    label: tagLabel,
    hint: idHint || classHint,
    textPreview,
    selector,
    iconType: TAG_ICON[tag] || "container",
    depth,
    children,
    // store outerHTML for passing to the right panel later
    outerHTML: el.outerHTML,
  };
}

function buildSelector(el) {
  const parts = [];
  let cur = el;

  while (cur && cur.tagName && cur.tagName.toLowerCase() !== "body") {
    const tag = cur.tagName.toLowerCase();
    const id  = cur.id ? `#${cur.id}` : "";

    if (id) {
      // id is globally unique — anchor here and stop
      parts.unshift(tag + id);
      break;
    }

    // data-hle-id is a stable anchor we stamp on generated templates
    const hleId = cur.getAttribute("data-hle-id");
    if (hleId) {
      parts.unshift(`${tag}[data-hle-id="${hleId}"]`);
      break;
    }

    // Always use :nth-of-type so every step is unambiguous,
    // even when there is only one sibling of this tag type.
    const parent = cur.parentElement;
    const siblings = parent
      ? Array.from(parent.children).filter(c => c.tagName === cur.tagName)
      : [cur];
    const index = siblings.indexOf(cur) + 1; // 1-based

    // Include first class for human readability (optional, doesn't affect uniqueness)
    const cls = Array.from(cur.classList)
      .filter(c => !c.startsWith("__aie"))
      .slice(0, 1)
      .map(c => `.${c}`)
      .join("");

    parts.unshift(`${tag}${cls}:nth-of-type(${index})`);
    cur = cur.parentElement;
  }

  return parts.join(" > ").slice(0, 300);
}

/**
 * Parse an HTML string and return a tree of friendly nodes
 * representing the <body> children.
 *
 * @param {string} html
 * @returns {Array} tree nodes
 */
export function parseLayoutTree(html) {
  if (!html) return [];
  _nodeId = 0; // reset ids each parse

  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, "text/html");
    const body   = doc.body;
    if (!body) return [];

    return Array.from(body.children)
      .map(child => walkElement(child, 0))
      .filter(Boolean);
  } catch {
    return [];
  }
}
