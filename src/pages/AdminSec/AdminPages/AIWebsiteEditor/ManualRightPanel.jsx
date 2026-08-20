// ManualRightPanel.jsx
// Right sidebar for Manual mode.
// Two tabs:
//   Attributes — content/link/source/alt specific to the element type
//   Style      — visual CSS properties with friendly controls

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { patchAttribute, patchStyle, patchTextContent, patchMediaStyle, readMediaStyles } from "./htmlPatcher";
import { uploadWebsiteImage } from "../../../../api_call/useAIWebsiteEditor";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny SVG icons
// ─────────────────────────────────────────────────────────────────────────────
const IconType    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconPaint   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 00-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconPlus    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
const IconTrash   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconDesktop = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconMobile  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: read live inline styles from the element's outerHTML
// ─────────────────────────────────────────────────────────────────────────────

/** Parse inline style string "color:red;background-image:url(...)" → { color:"red", ... }
 *  Handles url(...) values that contain colons and semicolons safely. */
function parseInlineStyle(styleStr) {
  const map = {};
  if (!styleStr) return map;
  // Use a regex that matches prop: value pairs, handling url(...) blobs
  const re = /([a-z-]+)\s*:\s*((?:[^;(]|\([^)]*\))*)/gi;
  let m;
  while ((m = re.exec(styleStr)) !== null) {
    const prop = m[1].trim();
    const val  = m[2].trim();
    if (prop) map[prop] = val;
  }
  return map;
}

/** Extract a single attribute from an outerHTML string. Uses DOM for 'style' to handle complex values. */
function getAttrFromHtml(outerHTML, attr) {
  if (!outerHTML) return "";
  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(outerHTML, "text/html");
    const el     = doc.body.firstElementChild;
    if (!el) return "";
    return el.getAttribute(attr) || "";
  } catch {
    return "";
  }
}

/** Get the direct text content (skipping child elements) from outerHTML. */
function getTextFromHtml(outerHTML) {
  if (!outerHTML) return "";
  try {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(outerHTML, "text/html");
    const el     = doc.body.firstElementChild;
    if (!el) return "";
    // Collect ALL direct text nodes (nodeType 3), skip child elements
    const text = Array.from(el.childNodes)
      .filter(n => n.nodeType === 3)
      .map(n => n.textContent)
      .join("")
      .trim();
    return text;
  } catch { return ""; }
}


// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE definitions per tag group
// ─────────────────────────────────────────────────────────────────────────────

const ATTR_DEFS = {
  // plain text nodes
  text: [
    { key: "_text", label: "Text shown on screen", type: "textarea",
      hint: "This is what visitors will read." },
  ],
  // heading tags
  heading: [
    { key: "_text", label: "Heading text", type: "textarea",
      hint: "The big title or subtitle shown on the page." },
  ],
  // links
  a: [
    { key: "_text", label: "Link text (label)", type: "text",
      hint: "What the visitor clicks on, e.g. \"Learn More\"." },
    { key: "href",  label: "Where it leads (URL)", type: "text",
      hint: "Paste a web address or use # for same-page links.", placeholder: "https://..." },
    { key: "target", label: "Open in", type: "select",
      options: [
        { value: "",       label: "Same tab" },
        { value: "_blank", label: "New tab" },
      ],
      hint: "Choose whether the link opens in the same or a new browser tab." },
    { key: "title", label: "Tooltip (on hover)", type: "text",
      hint: "Small description shown when visitors hover over the link.", placeholder: "optional" },
  ],
  // buttons
  button: [
    { key: "_text", label: "Button label", type: "text",
      hint: "The text written on the button." },
    { key: "type", label: "Button type", type: "select",
      options: [
        { value: "button", label: "Normal button" },
        { value: "submit", label: "Submit form" },
        { value: "reset",  label: "Reset form" },
      ],
      hint: 'Use "Submit form" if this button sends a form.' },
    { key: "disabled", label: "Disabled (greyed out)?", type: "checkbox",
      hint: "When ticked, the button cannot be clicked." },
  ],
  // images
  img: [
    { key: "src",    label: "Image URL", type: "text",
      hint: "Paste the web address of your image.", placeholder: "https://..." },
    { key: "alt",    label: "Description (for screen readers)", type: "text",
      hint: "Briefly describe the image. Used by visually impaired visitors and search engines.", placeholder: "e.g. Students in classroom" },
    { key: "width",  label: "Width", type: "text",
      hint: "Set a fixed width, e.g. 300px or 100%.", placeholder: "e.g. 300px" },
    { key: "height", label: "Height", type: "text",
      hint: "Set a fixed height, or leave blank to auto-scale.", placeholder: "e.g. 200px" },
  ],
  // inputs
  input: [
    { key: "placeholder", label: "Placeholder text", type: "text",
      hint: "The greyed-out hint shown inside the field before the user types.", placeholder: "e.g. Enter your name" },
    { key: "value", label: "Default value", type: "text",
      hint: "Pre-filled text in the field.", placeholder: "optional" },
    { key: "type", label: "Input type", type: "select",
      options: [
        { value: "text",     label: "Single-line text" },
        { value: "email",    label: "Email address" },
        { value: "password", label: "Password (hidden)" },
        { value: "number",   label: "Number" },
        { value: "tel",      label: "Phone number" },
        { value: "date",     label: "Date picker" },
        { value: "file",     label: "File upload" },
        { value: "checkbox", label: "Checkbox" },
        { value: "radio",    label: "Radio button" },
        { value: "hidden",   label: "Hidden (not visible)" },
      ],
      hint: "Controls what kind of data the visitor can type." },
    { key: "name", label: "Field name (for forms)", type: "text",
      hint: "Used when the form is submitted to identify this field.", placeholder: "e.g. email" },
    { key: "required", label: "Required field?", type: "checkbox",
      hint: "When ticked, the form cannot be submitted without filling this field." },
  ],
  // textarea
  textarea: [
    { key: "placeholder", label: "Placeholder text", type: "text",
      hint: "The greyed-out hint inside the text area.", placeholder: "e.g. Write your message…" },
    { key: "rows", label: "Visible rows", type: "text",
      hint: "Controls the visible height of the text area.", placeholder: "e.g. 4" },
    { key: "name", label: "Field name (for forms)", type: "text",
      hint: "Used to identify this field when the form is submitted.", placeholder: "e.g. message" },
  ],
  // iframe embeds
  iframe: [
    { key: "src", label: "Embed URL", type: "text",
      hint: "Paste the embed URL from YouTube, Google Maps, etc.", placeholder: "https://..." },
    { key: "title", label: "Description", type: "text",
      hint: "Describes what is embedded (for accessibility).", placeholder: "e.g. School location map" },
    { key: "width",  label: "Width",  type: "text", placeholder: "e.g. 100%" },
    { key: "height", label: "Height", type: "text", placeholder: "e.g. 400px" },
    { key: "allowfullscreen", label: "Allow fullscreen?", type: "checkbox",
      hint: "Let visitors expand the embed to fullscreen." },
  ],
  // video
  video: [
    { key: "src",      label: "Video URL",       type: "text", placeholder: "https://..." },
    { key: "poster",   label: "Thumbnail image (URL)", type: "text",
      hint: "Image shown before the video plays.", placeholder: "https://..." },
    { key: "autoplay", label: "Auto-play?",      type: "checkbox",
      hint: "Video starts playing immediately (usually muted)." },
    { key: "controls", label: "Show controls?",  type: "checkbox",
      hint: "Show play/pause/volume buttons to the visitor." },
    { key: "loop",     label: "Loop (repeat)?",  type: "checkbox" },
    { key: "muted",    label: "Muted by default?", type: "checkbox" },
  ],
  // generic container — text content (if any) + id (hashtag/anchor)
  container: [
    { key: "_text", label: "Text content", type: "textarea",
      hint: "Direct text shown inside this container (if any). Child elements like headings and paragraphs are edited by selecting them directly." },
    { key: "id", label: "Page anchor (hashtag)", type: "text",
      hint: "Sets the #id for this block. Links like \"#about\" will scroll to this section.",
      placeholder: "e.g. about  →  links to #about" },
  ],
};

/** Pick which attribute group to show for a given tagName. */
function getAttrDefs(tagName) {
  if (!tagName) return [];
  const t = tagName.toLowerCase();
  if (["h1","h2","h3","h4","h5","h6"].includes(t)) return ATTR_DEFS.heading;
  if (["p","span","li","td","th","label","strong","em","blockquote"].includes(t)) return ATTR_DEFS.text;
  if (t === "a")        return ATTR_DEFS.a;
  if (t === "button")   return ATTR_DEFS.button;
  if (t === "img")      return ATTR_DEFS.img;
  if (t === "input")    return ATTR_DEFS.input;
  if (t === "textarea") return ATTR_DEFS.textarea;
  if (t === "iframe")   return ATTR_DEFS.iframe;
  if (t === "video")    return ATTR_DEFS.video;
  // containers and layout elements get the id/anchor field
  if (["div","section","article","main","header","footer","nav","aside","form","ul","ol"].includes(t))
    return ATTR_DEFS.container;
  return ATTR_DEFS.container;
}


// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT STYLE PROPS — mapped per element group
// Each group gets exactly the properties that make sense for that element.
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_DEFAULTS_MAP = {
  // ── Containers / layout blocks ──────────────────────────────────────────
  container: [
    "background-color",
    "padding",
    "margin",
    "width",
    "height",
    "border-radius",
    "border",
    "box-shadow",
    "flex-direction",
    "justify-content",
    "align-items",
    "gap",
    "opacity",
  ],

  // ── Headings h1–h6 ──────────────────────────────────────────────────────
  heading: [
    "color",
    "font-size",
    "font-weight",
    "text-align",
    "line-height",
    "letter-spacing",
    "text-decoration",
    "background-color",
    "padding",
    "margin",
    "opacity",
  ],

  // ── Paragraph / inline text ──────────────────────────────────────────────
  text: [
    "color",
    "font-size",
    "font-weight",
    "text-align",
    "line-height",
    "letter-spacing",
    "text-decoration",
    "background-color",
    "padding",
    "margin",
    "opacity",
  ],

  // ── Links <a> ────────────────────────────────────────────────────────────
  link: [
    "color",
    "font-size",
    "font-weight",
    "text-decoration",
    "background-color",
    "padding",
    "border-radius",
    "opacity",
  ],

  // ── Buttons ──────────────────────────────────────────────────────────────
  button: [
    "background-color",
    "color",
    "font-size",
    "font-weight",
    "padding",
    "border-radius",
    "border",
    "box-shadow",
    "opacity",
    "cursor",
  ],

  // ── Images ───────────────────────────────────────────────────────────────
  image: [
    "width",
    "height",
    "border-radius",
    "border",
    "box-shadow",
    "object-fit",
    "opacity",
    "margin",
    "padding",
  ],

  // ── Form inputs / textarea / select ─────────────────────────────────────
  input: [
    "background-color",
    "color",
    "font-size",
    "padding",
    "border",
    "border-radius",
    "width",
    "box-shadow",
    "opacity",
  ],

  // ── Lists ul/ol ──────────────────────────────────────────────────────────
  list: [
    "background-color",
    "padding",
    "margin",
    "border-radius",
    "border",
    "gap",
    "flex-direction",
    "width",
    "opacity",
  ],

  // ── Table cells td/th ────────────────────────────────────────────────────
  cell: [
    "color",
    "font-size",
    "font-weight",
    "text-align",
    "background-color",
    "padding",
    "border",
    "opacity",
  ],

  // ── Video / iframe embeds ────────────────────────────────────────────────
  media: [
    "width",
    "height",
    "border-radius",
    "border",
    "box-shadow",
    "opacity",
    "margin",
  ],

  // ── Fallback — generic unknown element ───────────────────────────────────
  generic: [
    "background-color",
    "color",
    "padding",
    "margin",
    "width",
    "height",
    "border-radius",
    "border",
    "opacity",
  ],
};

function getDefaultStyleProps(tagName) {
  if (!tagName) return STYLE_DEFAULTS_MAP.generic;
  const t = tagName.toLowerCase();

  if (["div","section","article","main","header","footer","nav","aside","form"].includes(t))
    return STYLE_DEFAULTS_MAP.container;

  if (["h1","h2","h3","h4","h5","h6"].includes(t))
    return STYLE_DEFAULTS_MAP.heading;

  if (["p","span","label","strong","em","blockquote","small","time","pre","code"].includes(t))
    return STYLE_DEFAULTS_MAP.text;

  if (t === "a")      return STYLE_DEFAULTS_MAP.link;
  if (t === "button") return STYLE_DEFAULTS_MAP.button;
  if (t === "img")    return STYLE_DEFAULTS_MAP.image;

  if (["input","textarea","select"].includes(t))
    return STYLE_DEFAULTS_MAP.input;

  if (["ul","ol"].includes(t)) return STYLE_DEFAULTS_MAP.list;
  if (["li"].includes(t))      return STYLE_DEFAULTS_MAP.text;
  if (["td","th"].includes(t)) return STYLE_DEFAULTS_MAP.cell;

  if (["video","audio","iframe","canvas"].includes(t))
    return STYLE_DEFAULTS_MAP.media;

  return STYLE_DEFAULTS_MAP.generic;
}

// All addable style properties, grouped for the "+ Add style" picker
const ADDABLE_STYLE_GROUPS = [
  {
    label: "Text",
    items: [
      { prop: "color",           label: "Text colour" },
      { prop: "font-size",       label: "Font size" },
      { prop: "font-weight",     label: "Bold / weight" },
      { prop: "font-family",     label: "Font family" },
      { prop: "text-align",      label: "Text alignment" },
      { prop: "text-decoration", label: "Underline / strikethrough" },
      { prop: "text-transform",  label: "UPPERCASE / lowercase" },
      { prop: "letter-spacing",  label: "Letter spacing" },
      { prop: "line-height",     label: "Line height" },
      { prop: "white-space",     label: "Text wrapping" },
    ],
  },
  {
    label: "Background",
    items: [
      { prop: "background-color",    label: "Background colour" },
      { prop: "background-image",    label: "Background image" },
      { prop: "background-size",     label: "Background size" },
      { prop: "background-position", label: "Background position" },
      { prop: "background-repeat",   label: "Background repeat" },
    ],
  },
  {
    label: "Spacing & Size",
    items: [
      { prop: "padding",        label: "Inner spacing (padding)" },
      { prop: "margin",         label: "Outer spacing (margin)" },
      { prop: "width",          label: "Width" },
      { prop: "min-width",      label: "Minimum width" },
      { prop: "max-width",      label: "Maximum width" },
      { prop: "height",         label: "Height" },
      { prop: "min-height",     label: "Minimum height" },
      { prop: "max-height",     label: "Maximum height" },
      { prop: "gap",            label: "Space between children" },
    ],
  },
  {
    label: "Border & Shadow",
    items: [
      { prop: "border",        label: "Border (all sides)" },
      { prop: "border-radius", label: "Rounded corners" },
      { prop: "box-shadow",    label: "Shadow" },
      { prop: "outline",       label: "Outline" },
    ],
  },
  {
    label: "Layout / Direction",
    items: [
      { prop: "display",         label: "Display type" },
      { prop: "flex-direction",  label: "Direction (row / column)" },
      { prop: "justify-content", label: "Align children — horizontal" },
      { prop: "align-items",     label: "Align children — vertical" },
      { prop: "flex-wrap",       label: "Wrap children to next line?" },
      { prop: "grid-template-columns", label: "Grid columns" },
      { prop: "position",        label: "Position type" },
      { prop: "top",             label: "Position — top" },
      { prop: "bottom",          label: "Position — bottom" },
      { prop: "left",            label: "Position — left" },
      { prop: "right",           label: "Position — right" },
      { prop: "z-index",         label: "Layer order (z-index)" },
      { prop: "overflow",        label: "Overflow (scroll / hide)" },
    ],
  },
  {
    label: "Other",
    items: [
      { prop: "opacity",        label: "Opacity (transparency)" },
      { prop: "object-fit",     label: "Image fit" },
      { prop: "cursor",         label: "Mouse cursor style" },
      { prop: "transition",     label: "Animation / transition" },
      { prop: "transform",      label: "Rotate / scale / skew" },
      { prop: "visibility",     label: "Visible / invisible" },
      { prop: "pointer-events", label: "Allow mouse clicks?" },
    ],
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// Smart input renderers — pick the best control for each CSS property
// ─────────────────────────────────────────────────────────────────────────────

const FLEX_DIRECTIONS = [
  { value: "row",            label: "→ Left to right",    arrow: "→" },
  { value: "row-reverse",    label: "← Right to left",    arrow: "←" },
  { value: "column",         label: "↓ Top to bottom",    arrow: "↓" },
  { value: "column-reverse", label: "↑ Bottom to top",    arrow: "↑" },
];

const JUSTIFY_OPTIONS = [
  { value: "flex-start",    label: "⬛□□ Start" },
  { value: "center",        label: "□⬛□ Center" },
  { value: "flex-end",      label: "□□⬛ End" },
  { value: "space-between", label: "⬛□⬛ Space between" },
  { value: "space-around",  label: "□⬛□⬛□ Space around" },
  { value: "space-evenly",  label: "Equal space" },
];

const ALIGN_OPTIONS = [
  { value: "flex-start", label: "⬆ Top" },
  { value: "center",     label: "↕ Middle" },
  { value: "flex-end",   label: "⬇ Bottom" },
  { value: "stretch",    label: "↕ Stretch to fill" },
  { value: "baseline",   label: "Text baseline" },
];

const TEXT_ALIGN_OPTIONS = [
  { value: "left",    label: "⬛□□ Left" },
  { value: "center",  label: "□⬛□ Centre" },
  { value: "right",   label: "□□⬛ Right" },
  { value: "justify", label: "⬛⬛⬛ Justify" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi-bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
  { value: "900", label: "Black / Heavy" },
];

const TEXT_DECORATION_OPTIONS = [
  { value: "none",         label: "None" },
  { value: "underline",    label: "Underline" },
  { value: "line-through", label: "Strikethrough" },
  { value: "overline",     label: "Overline" },
];

const TEXT_TRANSFORM_OPTIONS = [
  { value: "none",       label: "As typed" },
  { value: "uppercase",  label: "ALL CAPS" },
  { value: "lowercase",  label: "all lowercase" },
  { value: "capitalize", label: "First Letter Capital" },
];

const DISPLAY_OPTIONS = [
  { value: "block",        label: "Block (full width row)" },
  { value: "inline",       label: "Inline (flows with text)" },
  { value: "inline-block", label: "Inline block (sized inline)" },
  { value: "flex",         label: "Flex (arrange children in a row/column)" },
  { value: "grid",         label: "Grid (place children in rows & columns)" },
  { value: "none",         label: "Hidden (remove from view)" },
];

const OBJECT_FIT_OPTIONS = [
  { value: "fill",       label: "Stretch to fill" },
  { value: "contain",    label: "Fit inside (letterbox)" },
  { value: "cover",      label: "Cover (crop to fill)" },
  { value: "none",       label: "Original size" },
  { value: "scale-down", label: "Shrink to fit" },
];

const OVERFLOW_OPTIONS = [
  { value: "visible", label: "Visible (overflow shown)" },
  { value: "hidden",  label: "Hidden (overflow cut off)" },
  { value: "scroll",  label: "Scroll (always show scrollbar)" },
  { value: "auto",    label: "Auto (scrollbar when needed)" },
];

const CURSOR_OPTIONS = [
  { value: "default",  label: "Arrow (default)" },
  { value: "pointer",  label: "Hand (pointer)" },
  { value: "text",     label: "Text cursor (I-beam)" },
  { value: "not-allowed", label: "Not allowed" },
  { value: "grab",     label: "Grab / drag" },
  { value: "zoom-in",  label: "Zoom in" },
];

const POSITION_OPTIONS = [
  { value: "static",   label: "Static (normal flow)" },
  { value: "relative", label: "Relative (offset from normal)" },
  { value: "absolute", label: "Absolute (placed relative to parent)" },
  { value: "fixed",    label: "Fixed (stays when scrolling)" },
  { value: "sticky",   label: "Sticky (sticks on scroll)" },
];

const FLEX_WRAP_OPTIONS = [
  { value: "nowrap", label: "No wrap (all in one line)" },
  { value: "wrap",   label: "Wrap (overflow to next line)" },
  { value: "wrap-reverse", label: "Wrap reverse" },
];

const BG_SIZE_OPTIONS = [
  { value: "auto",    label: "Original size" },
  { value: "cover",   label: "Cover (fill & crop)" },
  { value: "contain", label: "Contain (fit inside)" },
  { value: "100% 100%", label: "Stretch to fill" },
];

const WHITE_SPACE_OPTIONS = [
  { value: "normal",   label: "Normal (wrap at edge)" },
  { value: "nowrap",   label: "No wrap (single line)" },
  { value: "pre",      label: "Keep spaces & line breaks" },
  { value: "pre-wrap", label: "Keep line breaks, wrap at edge" },
];


// ─────────────────────────────────────────────────────────────────────────────
// Expandable shorthand props — padding / margin / border each expand to sides
// ─────────────────────────────────────────────────────────────────────────────

const SIDE_PROPS = {
  padding: { top: "padding-top", right: "padding-right", bottom: "padding-bottom", left: "padding-left" },
  margin:  { top: "margin-top",  right: "margin-right",  bottom: "margin-bottom",  left: "margin-left"  },
  border:  { top: "border-top",  right: "border-right",  bottom: "border-bottom",  left: "border-left"  },
};

const BG_POSITION_OPTIONS = [
  { value: "center",       label: "Center" },
  { value: "top",          label: "Top" },
  { value: "bottom",       label: "Bottom" },
  { value: "left",         label: "Left" },
  { value: "right",        label: "Right" },
  { value: "top left",     label: "Top left" },
  { value: "top right",    label: "Top right" },
  { value: "bottom left",  label: "Bottom left" },
  { value: "bottom right", label: "Bottom right" },
];
const BG_REPEAT_OPTIONS = [
  { value: "no-repeat", label: "No repeat" },
  { value: "repeat",    label: "Tile (repeat both)" },
  { value: "repeat-x",  label: "Repeat horizontally" },
  { value: "repeat-y",  label: "Repeat vertically" },
];
const BG_SIZE_OPTIONS2 = [
  { value: "cover",   label: "Cover (fill & crop)" },
  { value: "contain", label: "Contain (fit inside)" },
  { value: "auto",    label: "Original size" },
  { value: "100% 100%", label: "Stretch to fill" },
];

// ─────────────────────────────────────────────────────────────────────────────
// StyleInput — smart control per property
// ─────────────────────────────────────────────────────────────────────────────

/** Returns the right input element for a given CSS property. */
function StyleInput({ prop, value, onChange }) {
  const v = value || "";

  const sel = (options, ph = "— choose —") => (
    <select className="mrp-select" value={v} onChange={e => onChange(e.target.value)}>
      <option value="">{ph}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  if (["color", "background-color", "border-color", "outline-color", "text-shadow",
       "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"].includes(prop)) {
    return (
      <div className="mrp-color-row">
        <input type="color" className="mrp-color-swatch"
          value={v.startsWith("#") ? v : "#000000"}
          onChange={e => onChange(e.target.value)} />
        <input type="text" className="mrp-text-input" value={v}
          placeholder="#000000 or rgba(…)" onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (prop === "flex-direction")  return sel(FLEX_DIRECTIONS);
  if (prop === "justify-content") return sel(JUSTIFY_OPTIONS);
  if (prop === "align-items")     return sel(ALIGN_OPTIONS);
  if (prop === "text-align")      return sel(TEXT_ALIGN_OPTIONS);
  if (prop === "font-weight")     return sel(FONT_WEIGHT_OPTIONS);
  if (prop === "text-decoration") return sel(TEXT_DECORATION_OPTIONS);
  if (prop === "text-transform")  return sel(TEXT_TRANSFORM_OPTIONS);
  if (prop === "display")         return sel(DISPLAY_OPTIONS);
  if (prop === "object-fit")      return sel(OBJECT_FIT_OPTIONS);
  if (prop === "overflow")        return sel(OVERFLOW_OPTIONS);
  if (prop === "cursor")          return sel(CURSOR_OPTIONS);
  if (prop === "position")        return sel(POSITION_OPTIONS);
  if (prop === "flex-wrap")       return sel(FLEX_WRAP_OPTIONS);
  if (prop === "background-size") return sel(BG_SIZE_OPTIONS2);
  if (prop === "background-position") return sel(BG_POSITION_OPTIONS);
  if (prop === "background-repeat")   return sel(BG_REPEAT_OPTIONS);
  if (prop === "white-space")     return sel(WHITE_SPACE_OPTIONS);

  if (prop === "opacity") {
    const num = parseFloat(v) || 1;
    return (
      <div className="mrp-slider-row">
        <input type="range" min="0" max="1" step="0.01" value={num}
          className="mrp-slider" onChange={e => onChange(e.target.value)} />
        <span className="mrp-slider-val">{Math.round(num * 100)}%</span>
      </div>
    );
  }

  return (
    <input type="text" className="mrp-text-input" value={v}
      placeholder="e.g. 16px" onChange={e => onChange(e.target.value)} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ExpandableRow — shorthand prop with per-side toggle
// ─────────────────────────────────────────────────────────────────────────────
const SIDE_LABELS = {
  padding: { top: "Top", right: "Right", bottom: "Bottom", left: "Left" },
  margin:  { top: "Top", right: "Right", bottom: "Bottom", left: "Left" },
  border:  { top: "Top", right: "Right", bottom: "Bottom", left: "Left" },
};

function ExpandableRow({ prop, shorthandVal, sideVals, onShorthand, onSide, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const sides = SIDE_PROPS[prop];
  const sideLabels = SIDE_LABELS[prop];

  return (
    <div className="mrp-field mrp-field--style">
      <div className="mrp-field-header">
        <label className="mrp-label">{getPropLabel(prop)}</label>
        <div className="mrp-field-actions">
          <button
            className={`mrp-expand-btn ${expanded ? "mrp-expand-btn--active" : ""}`}
            onClick={() => setExpanded(e => !e)}
            title="Set per side"
            aria-label="Expand per side"
          >
            {expanded ? "▾ per side" : "▸ per side"}
          </button>
          <button className="mrp-icon-btn mrp-icon-btn--remove"
            onClick={onRemove} title="Remove" aria-label={`Remove ${prop}`}>
            <IconTrash />
          </button>
        </div>
      </div>
      <div className="mrp-field-sub">{prop}</div>

      {!expanded ? (
        <input type="text" className="mrp-text-input" value={shorthandVal}
          placeholder="e.g. 16px  or  8px 16px"
          onChange={e => onShorthand(e.target.value)} />
      ) : (
        <div className="mrp-sides-grid">
          {Object.entries(sides).map(([side, sideProp]) => (
            <div key={side} className="mrp-side-field">
              <label className="mrp-side-label">{sideLabels[side]}</label>
              <input type="text" className="mrp-text-input"
                value={sideVals[sideProp] || ""}
                placeholder="e.g. 8px"
                onChange={e => onSide(sideProp, e.target.value)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BackgroundRow — color + optional image sub-section
// ─────────────────────────────────────────────────────────────────────────────
const IconImage = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// PositionRow — position type selector + conditional sub-fields
// ─────────────────────────────────────────────────────────────────────────────

const POSITION_WITH_OFFSETS = new Set(["relative","absolute","fixed","sticky"]);
const OFFSET_PROPS = ["top","right","bottom","left","z-index"];

function PositionRow({ styleVals, onStyle, onRemove }) {
  const posVal = styleVals["position"] || "";
  const showOffsets = POSITION_WITH_OFFSETS.has(posVal);

  return (
    <div className="mrp-field mrp-field--style">
      <div className="mrp-field-header">
        <label className="mrp-label">Position</label>
        <button className="mrp-icon-btn mrp-icon-btn--remove"
          onClick={onRemove} title="Remove" aria-label="Remove position">
          <IconTrash />
        </button>
      </div>
      <div className="mrp-field-sub">position</div>

      <select className="mrp-select" value={posVal}
        onChange={e => onStyle("position", e.target.value)}>
        <option value="">— choose —</option>
        {POSITION_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {showOffsets && (
        <div className="mrp-position-sub">
          <div className="mrp-position-sub__label">Offsets &amp; layer</div>

          {/* Top / Bottom row */}
          <div className="mrp-position-grid">
            {["top","bottom","left","right"].map(side => (
              <div key={side} className="mrp-position-field">
                <label className="mrp-side-label">{side.charAt(0).toUpperCase() + side.slice(1)}</label>
                <input
                  type="text"
                  className="mrp-text-input"
                  value={styleVals[side] || ""}
                  placeholder="e.g. 0px"
                  onChange={e => onStyle(side, e.target.value)}
                />
              </div>
            ))}
          </div>

          {/* z-index */}
          <div className="mrp-position-field mrp-position-field--full">
            <label className="mrp-side-label">Z-index (layer order)</label>
            <input
              type="text"
              className="mrp-text-input"
              value={styleVals["z-index"] || ""}
              placeholder="e.g. 10"
              onChange={e => onStyle("z-index", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function BackgroundRow({ styleVals, onStyle, onRemove, schoolId }) {
  const colorVal = styleVals["background-color"] || "";
  const imgVal   = styleVals["background-image"]  || "";

  // showImg is true whenever there's already a bg-image set, or user manually toggled it on
  const [showImgManual, setShowImgManual] = useState(false);
  const showImg = showImgManual || !!imgVal;

  // Extract raw URL from css url("...") wrapper
  const rawImgUrl = imgVal.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");

  const handleBgImageChange = (url) => {
    onStyle("background-image", url ? `url("${url}")` : "");
  };

  return (
    <div className="mrp-field mrp-field--style">
      <div className="mrp-field-header">
        <label className="mrp-label">Background colour</label>
        <div className="mrp-field-actions">
          <button
            className={`mrp-expand-btn ${showImg ? "mrp-expand-btn--active" : ""}`}
            onClick={() => setShowImgManual(s => !s)}
            title="Use a background image instead"
            aria-label="Toggle background image"
          >
            <IconImage /> image
          </button>
          <button className="mrp-icon-btn mrp-icon-btn--remove"
            onClick={onRemove} title="Remove" aria-label="Remove background">
            <IconTrash />
          </button>
        </div>
      </div>
      <div className="mrp-field-sub">background-color</div>
      <div className="mrp-color-row">
        <input type="color" className="mrp-color-swatch"
          value={colorVal.startsWith("#") ? colorVal : "#ffffff"}
          onChange={e => onStyle("background-color", e.target.value)} />
        <input type="text" className="mrp-text-input" value={colorVal}
          placeholder="#ffffff or rgba(…) or transparent"
          onChange={e => onStyle("background-color", e.target.value)} />
      </div>

      {showImg && (
        <div className="mrp-bg-img-section">
          <div className="mrp-bg-img-section__title">Background image</div>

          <ImageUploadField
            value={rawImgUrl}
            onChange={handleBgImageChange}
            schoolId={schoolId}
          />

          <label className="mrp-side-label" style={{marginTop:8}}>How it fits</label>
          <select className="mrp-select" value={styleVals["background-size"] || ""}
            onChange={e => onStyle("background-size", e.target.value)}>
            <option value="">— choose —</option>
            {BG_SIZE_OPTIONS2.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label className="mrp-side-label" style={{marginTop:8}}>Position</label>
          <select className="mrp-select" value={styleVals["background-position"] || ""}
            onChange={e => onStyle("background-position", e.target.value)}>
            <option value="">— choose —</option>
            {BG_POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label className="mrp-side-label" style={{marginTop:8}}>Repeat</label>
          <select className="mrp-select" value={styleVals["background-repeat"] || "no-repeat"}
            onChange={e => onStyle("background-repeat", e.target.value)}>
            {BG_REPEAT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-style picker
// ─────────────────────────────────────────────────────────────────────────────
function AddStylePicker({ existingProps, onPick, onClose }) {
  const [search, setSearch] = useState("");
  const q = search.toLowerCase();

  return (
    <div className="mrp-add-picker">
      <div className="mrp-add-picker__header">
        <span>Add a style property</span>
        <button className="mrp-icon-btn" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <input type="text" className="mrp-text-input" placeholder="Search…"
        value={search} onChange={e => setSearch(e.target.value)} autoFocus />
      <div className="mrp-add-picker__list">
        {ADDABLE_STYLE_GROUPS.map(group => {
          const items = group.items.filter(
            it => !existingProps.includes(it.prop) &&
                  (it.label.toLowerCase().includes(q) || it.prop.toLowerCase().includes(q))
          );
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <div className="mrp-add-picker__group-label">{group.label}</div>
              {items.map(it => (
                <button key={it.prop} className="mrp-add-picker__item"
                  onClick={() => { onPick(it.prop); onClose(); }}>
                  <span className="mrp-add-picker__item-label">{it.label}</span>
                  <span className="mrp-add-picker__item-prop">{it.prop}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helper
// ─────────────────────────────────────────────────────────────────────────────
function getPropLabel(prop) {
  for (const group of ADDABLE_STYLE_GROUPS) {
    const found = group.items.find(i => i.prop === prop);
    if (found) return found.label;
  }
  // fallbacks for common defaults not listed above
  const fallbacks = {
    "color": "Text colour",
    "font-size": "Font size",
    "font-weight": "Bold / weight",
    "text-align": "Text alignment",
    "line-height": "Line height",
    "letter-spacing": "Letter spacing",
    "text-decoration": "Underline / strikethrough",
    "background-color": "Background colour",
    "padding": "Inner spacing (padding)",
    "margin": "Outer spacing (margin)",
    "width": "Width",
    "height": "Height",
    "border-radius": "Rounded corners",
    "border": "Border",
    "box-shadow": "Shadow",
    "opacity": "Opacity (transparency)",
    "flex-direction": "Direction (row / column)",
    "justify-content": "Align children — horizontal",
    "align-items": "Align children — vertical",
    "gap": "Space between children",
  };
  return fallbacks[prop] || prop;
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLE TAB
// ─────────────────────────────────────────────────────────────────────────────

// Props that are rendered with the expandable per-side UI
const EXPANDABLE = new Set(["padding", "margin", "border"]);
// Bg sub-props are rendered inside BackgroundRow, not as standalone fields
const BG_SUB_PROPS = new Set(["background-image","background-size","background-position","background-repeat"]);

// ── Accordion group definitions ───────────────────────────────────────────────
// Each group: which CSS props belong, icon emoji, default open state
const STYLE_GROUPS = [
  {
    id: "layout",
    label: "Layout",
    icon: "⊞",
    defaultOpen: false,
    props: ["display","flex-direction","justify-content","align-items","flex-wrap",
            "grid-template-columns","position","top","bottom","left","right","z-index","overflow"],
  },
  {
    id: "text",
    label: "Text",
    icon: "T",
    defaultOpen: false,
    props: ["color","font-size","font-weight","font-family","text-align","line-height",
            "letter-spacing","text-decoration","text-transform","white-space"],
  },
  {
    id: "background",
    label: "Background",
    icon: "🎨",
    defaultOpen: false,
    props: ["background-color","background-image","background-size","background-position","background-repeat"],
  },
  {
    id: "spacing",
    label: "Spacing & Size",
    icon: "⬜",
    defaultOpen: false,
    props: ["padding","margin","width","min-width","max-width","height","min-height","max-height","gap"],
  },
  {
    id: "border",
    label: "Border & Shadow",
    icon: "▣",
    defaultOpen: false,
    props: ["border","border-radius","box-shadow","outline"],
  },
  {
    id: "other",
    label: "Other",
    icon: "⚙",
    defaultOpen: false,
    props: ["opacity","object-fit","cursor","transition","transform","visibility","pointer-events"],
  },
];

// Given a list of active props, assign each to the first matching group (or "other")
function groupProps(activeProps) {
  const grouped = {};
  STYLE_GROUPS.forEach(g => { grouped[g.id] = []; });

  activeProps.forEach(prop => {
    // background sub-props handled inside background-color's BackgroundRow
    if (BG_SUB_PROPS.has(prop)) return;
    let placed = false;
    for (const g of STYLE_GROUPS) {
      if (g.props.includes(prop)) {
        grouped[g.id].push(prop);
        placed = true;
        break;
      }
    }
    if (!placed) grouped["other"].push(prop);
  });
  return grouped;
}

// Count how many props in a group have non-empty values
// For layout group, also count position offsets
function countActive(propList, vals) {
  const check = [...propList];
  // if position is in the list, also count its offset sub-props
  if (propList.includes("position")) {
    ["top","bottom","left","right","z-index"].forEach(p => {
      if (!check.includes(p)) check.push(p);
    });
  }
  return check.filter(p => vals[p] && vals[p] !== "").length;
}

// ── Single accordion section ──────────────────────────────────────────────────
function StyleAccordion({ group, props, currentVals, commitStyle, removeStyleProp, showFlexArrows, schoolId }) {
  const [open, setOpen] = useState(group.defaultOpen);
  const active = countActive(props, currentVals);

  // Render a single prop field
  const renderField = (prop) => {
    if (prop === "background-color") return null; // handled by BackgroundRow below
    if (prop === "flex-direction" && showFlexArrows) return null; // handled by flex-arrows
    if (prop === "position") return null; // handled by PositionRow below
    // offset props are rendered inside PositionRow — skip as standalone fields
    if (["top","bottom","left","right","z-index"].includes(prop)) return null;
    if (EXPANDABLE.has(prop)) {
      return (
        <ExpandableRow key={prop} prop={prop}
          shorthandVal={currentVals[prop] || ""}
          sideVals={currentVals}
          onShorthand={v => commitStyle(prop, v)}
          onSide={(sp, v) => commitStyle(sp, v)}
          onRemove={() => removeStyleProp(prop)} />
      );
    }
    return (
      <div key={prop} className="mrp-field mrp-field--style">
        <div className="mrp-field-header">
          <label className="mrp-label">{getPropLabel(prop)}</label>
          <button className="mrp-icon-btn mrp-icon-btn--remove"
            onClick={() => removeStyleProp(prop)}
            title="Remove" aria-label={`Remove ${prop}`}>
            <IconTrash />
          </button>
        </div>
        <div className="mrp-field-sub">{prop}</div>
        <StyleInput prop={prop} value={currentVals[prop] ?? ""}
          onChange={v => commitStyle(prop, v)} />
      </div>
    );
  };

  // For the background group, BackgroundRow handles background-color + sub-props together
  const hasBg = group.id === "background" && props.includes("background-color");
  // For the layout group, PositionRow is ALWAYS shown (position is universal)
  const hasPosition = group.id === "layout";

  // Determine if there's anything to show
  const visibleFields = props.filter(p => {
    if (group.id === "background") return p === "background-color";
    if (p === "flex-direction" && showFlexArrows) return false;
    if (["position","top","bottom","left","right","z-index"].includes(p)) return false;
    return true;
  });

  // Layout accordion is always visible (has flex arrows and/or PositionRow)
  if (visibleFields.length === 0 && !hasBg && !hasPosition && !(group.id === "layout" && showFlexArrows)) return null;

  return (
    <div className={`mrp-accordion ${open ? "mrp-accordion--open" : ""}`}>
      <button
        className="mrp-accordion__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="mrp-accordion__icon">{group.icon}</span>
        <span className="mrp-accordion__label">{group.label}</span>
        {active > 0 && (
          <span className="mrp-accordion__badge">{active}</span>
        )}
        <span className="mrp-accordion__chevron">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {open && (
        <div className="mrp-accordion__body">
          {/* Flex arrows inside Layout group */}
          {group.id === "layout" && showFlexArrows && (
            <div className="mrp-flex-hint mrp-flex-hint--inline">
              <div className="mrp-flex-hint__title">Direction — how children line up</div>
              <div className="mrp-flex-arrows">
                {FLEX_DIRECTIONS.map(fd => (
                  <button key={fd.value}
                    className={`mrp-flex-arrow-btn ${currentVals["flex-direction"] === fd.value ? "mrp-flex-arrow-btn--active" : ""}`}
                    onClick={() => commitStyle("flex-direction", fd.value)}
                    title={fd.label}
                  >
                    <span className="mrp-flex-arrow">{fd.arrow}</span>
                    <span className="mrp-flex-arrow-label">{fd.label.replace(/^[→←↓↑]\s/, "")}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Background group: BackgroundRow covers color + image together */}
          {hasBg && (
            <BackgroundRow
              styleVals={currentVals}
              onStyle={commitStyle}
              onRemove={() => removeStyleProp("background-color")}
              schoolId={schoolId} />
          )}

          {/* Layout group: PositionRow always shown */}
          {hasPosition && (
            <PositionRow
              styleVals={currentVals}
              onStyle={(prop, val) => commitStyle(prop, val)}
              onRemove={() => {
                // clear position + all offset props
                ["position","top","bottom","left","right","z-index"].forEach(p => {
                  commitStyle(p, "");
                });
              }}
            />
          )}

          {/* All other props */}
          {props.map(prop => {
            if (group.id === "background") return null; // handled above
            return renderField(prop);
          })}
        </div>
      )}
    </div>
  );
}

function StyleTab({ selectedElement, html, onHtmlChange }) {
  const { schoolId } = useParams();
  const sel = selectedElement?.selector;

  // Keep a ref to the latest html so the selector-change effect always reads
  // the current HTML without needing html in its dep array (which would cause
  // the style panel to reset every time any edit is made).
  const htmlRef = useRef(html);
  useEffect(() => { htmlRef.current = html; }, [html]);

  const [activeProps,  setActiveProps]  = useState([]);
  const [styleVals,    setStyleVals]    = useState({});
  const [mobileVals,   setMobileVals]   = useState({});
  const [showPicker,   setShowPicker]   = useState(false);
  const [viewMode,     setViewMode]     = useState("desktop");

  const currentVals    = viewMode === "mobile" ? mobileVals  : styleVals;
  const setCurrentVals = viewMode === "mobile" ? setMobileVals : setStyleVals;

  // Sync when selected element changes
  useEffect(() => {
    if (!selectedElement) { setActiveProps([]); setStyleVals({}); setMobileVals({}); return; }
    const defaults = getDefaultStyleProps(selectedElement.tagName);

    // Always use the latest html via ref — avoids stale closure when a new
    // element is selected right after an edit, and avoids re-running on every
    // html change (which would reset the color picker mid-edit).
    const currentHtml = htmlRef.current;

    let liveOuterHTML = selectedElement.outerHTML || "";
    if (currentHtml && selectedElement.selector) {
      try {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(currentHtml, "text/html");
        const liveEl = doc.querySelector(selectedElement.selector) ||
                       doc.querySelector(selectedElement.selector.replace(/:nth-of-type\(\d+\)/g, ""));
        if (liveEl) liveOuterHTML = liveEl.outerHTML;
      } catch (_) {}
    }

    const inlineStyleStr = getAttrFromHtml(liveOuterHTML, "style");
    const inlineMap      = parseInlineStyle(inlineStyleStr);
    const extraInline    = Object.keys(inlineMap).filter(p =>
      !defaults.includes(p) &&
      !["padding-top","padding-right","padding-bottom","padding-left",
        "margin-top","margin-right","margin-bottom","margin-left",
        "border-top","border-right","border-bottom","border-left"].includes(p)
    );
    setActiveProps([...defaults, ...extraInline]);
    const vals = {};
    [...defaults, ...extraInline].forEach(p => { vals[p] = inlineMap[p] || ""; });
    for (const sides of Object.values(SIDE_PROPS)) {
      for (const sp of Object.values(sides)) { vals[sp] = inlineMap[sp] || ""; }
    }
    ["position","top","bottom","left","right","z-index"].forEach(p => {
      if (!(p in vals)) vals[p] = inlineMap[p] || "";
    });
    setStyleVals(vals);

    const mediaMap = readMediaStyles(currentHtml, selectedElement.selector);
    const mVals    = {};
    defaults.forEach(p => { mVals[p] = mediaMap[p] || ""; });
    Object.keys(mediaMap).forEach(p => { if (!mVals[p]) mVals[p] = mediaMap[p]; });
    ["position","top","bottom","left","right","z-index"].forEach(p => {
      if (!(p in mVals)) mVals[p] = mediaMap[p] || "";
    });
    setMobileVals(mVals);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.selector]);

  if (!selectedElement) return null;

  const commitStyle = useCallback((prop, value) => {
    setCurrentVals(v => ({ ...v, [prop]: value }));
    if (viewMode === "mobile") {
      onHtmlChange(patchMediaStyle(html, sel, prop, value));
    } else {
      let newHtml = patchStyle(html, sel, prop, value);
      if (prop === "flex-direction" && value) {
        newHtml = patchStyle(newHtml, sel, "display", "flex");
        setStyleVals(v => ({ ...v, display: "flex" }));
      }
      onHtmlChange(newHtml);
    }
  }, [html, sel, onHtmlChange, viewMode, setCurrentVals]);

  const removeStyleProp = useCallback((prop) => {
    setActiveProps(p => p.filter(x => x !== prop));
    if (viewMode === "mobile") {
      setMobileVals(v => { const n = { ...v }; delete n[prop]; return n; });
      onHtmlChange(patchMediaStyle(html, sel, prop, null));
    } else {
      setStyleVals(v => { const n = { ...v }; delete n[prop]; return n; });
      if (EXPANDABLE.has(prop)) {
        let cur = html;
        Object.values(SIDE_PROPS[prop]).forEach(sp => { cur = patchStyle(cur, sel, sp, null); });
        onHtmlChange(patchStyle(cur, sel, prop, null));
      } else {
        onHtmlChange(patchStyle(html, sel, prop, null));
      }
    }
  }, [html, sel, onHtmlChange, viewMode]);

  const addStyleProp = (prop) => {
    if (activeProps.includes(prop)) return;
    setActiveProps(p => [...p, prop]);
    setStyleVals(v => ({ ...v, [prop]: "" }));
    setMobileVals(v => ({ ...v, [prop]: "" }));
  };

  const isContainer = ["div","section","article","main","header","footer","nav","aside","form","ul","ol"]
    .includes((selectedElement.tagName || "").toLowerCase());
  const showFlexArrows = isContainer || currentVals["display"] === "flex";

  const grouped = groupProps(activeProps);

  return (
    <div className="mrp-style-tab">
      {/* ── Desktop / Mobile toggle ─────────────────────────────── */}
      <div className="mrp-view-toggle">
        <button
          className={`mrp-view-btn ${viewMode === "desktop" ? "mrp-view-btn--active" : ""}`}
          onClick={() => setViewMode("desktop")}
          title="Edit desktop styles (inline)"
        >
          <IconDesktop /> Desktop
        </button>
        <button
          className={`mrp-view-btn ${viewMode === "mobile" ? "mrp-view-btn--active mrp-view-btn--mobile" : ""}`}
          onClick={() => setViewMode("mobile")}
          title="Edit mobile styles (@media max-width: 768px)"
        >
          <IconMobile /> Mobile
        </button>
      </div>

      {viewMode === "mobile" && (
        <div className="mrp-mobile-banner">
          📱 Styles here only apply on screens ≤ 768 px wide
        </div>
      )}

      {/* ── Accordion groups ────────────────────────────────────── */}
      <div className="mrp-accordions">
        {STYLE_GROUPS.map(group => (
          <StyleAccordion
            key={group.id}
            group={group}
            props={grouped[group.id] || []}
            currentVals={currentVals}
            commitStyle={commitStyle}
            removeStyleProp={removeStyleProp}
            showFlexArrows={showFlexArrows}
            schoolId={schoolId}
          />
        ))}
      </div>

      {/* ── Add style property ──────────────────────────────────── */}
      <div className="mrp-style-tab__footer">
        {showPicker ? (
          <AddStylePicker existingProps={activeProps}
            onPick={addStyleProp} onClose={() => setShowPicker(false)} />
        ) : (
          <button className="mrp-add-style-btn" onClick={() => setShowPicker(true)}>
            <IconPlus /> Add style property
          </button>
        )}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// ImageUploadField — pick a local file, upload to Cloudinary, use URL in HTML
// ─────────────────────────────────────────────────────────────────────────────
const IconUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * Renders an image src field with:
 *  - A thumbnail preview of the current image (if any)
 *  - A "Pick image" button that opens a file picker
 *  - Auto-upload to Cloudinary on file pick; replaces old image if one exists
 *  - A plain URL text input as fallback / manual override
 *
 * Props:
 *   value      – current src URL string
 *   onChange   – fn(newUrl) called after successful upload or manual edit
 *   schoolId   – used by the upload API
 */
function ImageUploadField({ value, onChange, schoolId }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  // Store the Cloudinary public_id of the currently uploaded image so we can
  // delete it when the user picks a new one.
  const publicIdRef = useRef(null);
  const fileRef     = useRef(null);

  // If the current src is a Cloudinary URL we already uploaded, try to extract public_id
  // (best-effort — only set when we uploaded it this session)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const result = await uploadWebsiteImage(schoolId, file, publicIdRef.current || null);
      if (result.success) {
        publicIdRef.current = result.public_id;
        onChange(result.url);
      } else {
        setError(result.message || "Upload failed.");
      }
    } catch (err) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      // Reset so same file can be picked again if needed
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mrp-img-upload">
      {/* Preview */}
      {value && (
        <div className="mrp-img-preview">
          <img src={value} alt="preview" className="mrp-img-preview__img" />
        </div>
      )}

      {/* Pick button + hidden file input */}
      <div className="mrp-img-upload__row">
        <button
          className="mrp-img-pick-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !schoolId}
          type="button"
          aria-label="Pick image from device"
        >
          {uploading ? (
            <span className="mrp-img-uploading">Uploading…</span>
          ) : (
            <><IconUpload /> Pick image</>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Manual URL fallback */}
      <input
        type="text"
        className="mrp-text-input mrp-img-url-input"
        value={value}
        placeholder="https://... (or pick above)"
        onChange={e => onChange(e.target.value)}
      />

      {error && <p className="mrp-img-error">{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function AttributesTab({ selectedElement, html, onHtmlChange, schoolId }) {
  const defs = getAttrDefs(selectedElement?.tagName);
  const sel  = selectedElement?.selector;

  // local state mirror for attr values so input stays responsive
  const [vals, setVals] = useState({});

  // Re-read from outerHTML whenever selection changes
  useEffect(() => {
    if (!selectedElement) return;
    const initial = {};
    defs.forEach(d => {
      if (d.key === "_text") {
        initial._text = getTextFromHtml(selectedElement.outerHTML || "");
      } else if (d.type === "checkbox") {
        initial[d.key] = selectedElement.outerHTML?.includes(` ${d.key}`) ? "true" : "false";
      } else {
        initial[d.key] = getAttrFromHtml(selectedElement.outerHTML || "", d.key);
      }
    });
    setVals(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.selector, selectedElement?.outerHTML]);

  if (!selectedElement) return null;

  if (!defs.length) {
    return (
      <div className="mrp-empty-hint">
        No editable attributes for a <code>{selectedElement.tagName}</code> element.
      </div>
    );
  }

  const commit = (key, value) => {
    // Strip leading # if user types it into the id field
    const cleanValue = key === "id" ? value.replace(/^#+/, "") : value;
    setVals(v => ({ ...v, [key]: cleanValue }));
    if (key === "_text") {
      onHtmlChange(patchTextContent(html, sel, cleanValue));
    } else if (defs.find(d => d.key === key)?.type === "checkbox") {
      onHtmlChange(patchAttribute(html, sel, key, cleanValue === "true" ? "" : null));
    } else {
      onHtmlChange(patchAttribute(html, sel, key, cleanValue));
    }
  };

  return (
    <div className="mrp-section-body">
      {defs.map(def => (
        <div key={def.key} className="mrp-field">
          <label className="mrp-label">{def.label}</label>
          {def.hint && <p className="mrp-hint">{def.hint}</p>}

          {def.type === "textarea" && (
            <textarea
              className="mrp-textarea"
              value={vals[def.key] ?? ""}
              rows={3}
              onChange={e => commit(def.key, e.target.value)}
            />
          )}

          {/* Image src — use upload picker instead of plain text */}
          {def.type === "text" && def.key === "src" && selectedElement?.tagName?.toLowerCase() === "img" ? (
            <ImageUploadField
              value={vals["src"] ?? ""}
              onChange={url => commit("src", url)}
              schoolId={schoolId}
            />
          ) : def.type === "text" && def.key === "id" ? (
            <div className="mrp-id-row">
              <span className="mrp-id-prefix">#</span>
              <input
                type="text"
                className="mrp-text-input"
                value={vals[def.key] ?? ""}
                placeholder={def.placeholder || "e.g. about"}
                onChange={e => commit(def.key, e.target.value)}
              />
            </div>
          ) : def.type === "text" ? (
            <input
              type="text"
              className="mrp-text-input"
              value={vals[def.key] ?? ""}
              placeholder={def.placeholder || ""}
              onChange={e => commit(def.key, e.target.value)}
            />
          ) : null}

          {def.type === "select" && (
            <select
              className="mrp-select"
              value={vals[def.key] ?? ""}
              onChange={e => commit(def.key, e.target.value)}
            >
              {def.options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          )}

          {def.type === "checkbox" && (
            <label className="mrp-checkbox-row">
              <input
                type="checkbox"
                checked={vals[def.key] === "true"}
                onChange={e => commit(def.key, e.target.checked ? "true" : "false")}
              />
              <span>{def.label}</span>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "attrs",  label: "Content",  Icon: IconType  },
  { id: "styles", label: "Style",    Icon: IconPaint },
];

/**
 * Props:
 *   selectedElement  – { selector, tagName, label, textContent, outerHTML } | null
 *   html             – current full HTML string
 *   onHtmlChange     – fn(newHtml) commit to history
 */
export default function ManualRightPanel({ selectedElement, html, onHtmlChange }) {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("attrs");

  // When selection changes, default to "Content" tab
  useEffect(() => { setActiveTab("attrs"); }, [selectedElement?.selector]);

  const noSelection = !selectedElement;

  return (
    <div className="manual-side-panel manual-side-panel--right mrp-root">

      {/* header + tabs */}
      <div className="manual-side-panel__header mrp-header">
        {noSelection ? (
          <span className="manual-side-panel__title">Properties</span>
        ) : (
          <div className="mrp-sel-tag">
            <span className="mrp-sel-tag__chip">{selectedElement.tagName}</span>
            <span className="mrp-sel-tag__label">{selectedElement.label}</span>
          </div>
        )}
      </div>

      {/* tabs */}
      {!noSelection && (
        <div className="msp-tabs" role="tablist">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              className={`msp-tab ${activeTab === id ? "msp-tab--active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon />{label}
            </button>
          ))}
        </div>
      )}

      {/* body */}
      <div className="msp-content">
        {noSelection ? (
          <div className="manual-side-panel__empty">
            <div className="manual-side-panel__empty-icon">
              <IconPaint />
            </div>
            <p className="manual-side-panel__empty-title">No element selected</p>
            <p className="manual-side-panel__empty-desc">
              Click any element in the preview<br />to edit its content and styles.
            </p>
          </div>
        ) : (
          <>
            {activeTab === "attrs" && (
              <AttributesTab
                selectedElement={selectedElement}
                html={html}
                onHtmlChange={onHtmlChange}
                schoolId={schoolId}
              />
            )}
            {activeTab === "styles" && (
              <StyleTab
                selectedElement={selectedElement}
                html={html}
                onHtmlChange={onHtmlChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
