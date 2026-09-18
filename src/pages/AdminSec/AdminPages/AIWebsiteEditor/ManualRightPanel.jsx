// ManualRightPanel.jsx
// Right sidebar for Manual mode.
// Two tabs:
//   Content — text/link/image fields for the selected part
//   Look    — simple visual controls (advanced CSS behind "More options")

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { patchAttribute, patchStyle, patchStyles, patchTextContent, patchMediaStyle, readMediaStyles, applyTableTemplate, patchElementLink } from "./htmlPatcher";
import { parseLayoutTree } from "./htmlLayoutParser";
import { TABLE_STYLE_TEMPLATES } from "../../../../utils/tableStyleTemplates";
import { detectReportSection } from "../../../../utils/reportSectionTemplates";
import ReportTemplateTab from "../../../../components/HtmlEditor/ReportTemplateTab";
import { uploadWebsiteImage } from "../../../../api_call/useAIWebsiteEditor";

// ─────────────────────────────────────────────────────────────────────────────
// Tiny SVG icons
// ─────────────────────────────────────────────────────────────────────────────
const IconType    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconTemplate = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconPaint   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18.37 2.63L14 7l-1.59-1.59a2 2 0 00-2.82 0L8 7l9 9 1.59-1.59a2 2 0 000-2.82L17 10l4.37-4.37a2.12 2.12 0 00-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8c-2 3-4 3.5-7 4l8 8c1-.5 3.5-2 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconPlus    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
const IconTrash   = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconDesktop = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconMobile  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers: read live inline styles from the element's outerHTML
// ─────────────────────────────────────────────────────────────────────────────

/** Parse inline style string "color:red;background-image:url(...)" → { color:"red", ... }
 *  Handles nested parentheses (linear-gradient, rgba, url). */
function parseInlineStyle(styleStr) {
  const map = {};
  if (!styleStr) return map;
  let i = 0;
  const s = styleStr;
  while (i < s.length) {
    const colon = s.indexOf(":", i);
    if (colon === -1) break;
    const prop = s.slice(i, colon).trim().toLowerCase();
    let j = colon + 1;
    let depth = 0;
    while (j < s.length) {
      const ch = s[j];
      if (ch === "(") depth++;
      else if (ch === ")") depth = Math.max(0, depth - 1);
      else if (ch === ";" && depth === 0) break;
      j++;
    }
    const val = s.slice(colon + 1, j).trim();
    if (prop) map[prop] = val;
    i = j + 1;
  }
  return map;
}

function extractBgImageUrl(bgImage) {
  if (!bgImage) return "";
  const decoded = bgImage.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const m = decoded.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
  return m ? m[2].trim() : "";
}

/** Read inline styles from a live element, including CSSOM (survives `background` shorthand). */
function readInlineStyleMap(el) {
  if (!el) return {};
  const map = parseInlineStyle(el.getAttribute("style") || "");
  const cssomKeys = [
    "background-image", "background-size", "background-position", "background-repeat",
    "background-color", "background",
    "color", "padding", "margin", "width", "height", "border-radius", "opacity",
  ];
  cssomKeys.forEach((prop) => {
    const v = el.style.getPropertyValue(prop);
    if (v) map[prop] = v;
  });
  if (!map["background-image"] && map["background"]) {
    const url = extractBgImageUrl(map["background"]);
    if (url || /gradient/i.test(map["background"])) {
      map["background-image"] = el.style.backgroundImage || map["background"];
    }
  }
  return map;
}

function hexToRgb(hex) {
  let h = (hex || "#000000").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return { r: 0, g: 0, b: 0 };
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, "0")).join("");
}

/** Read overlay colour/opacity from a layered background-image value. */
function parseBgOverlay(bgImage) {
  if (!bgImage) return { color: "#000000", opacity: 0 };
  const m = bgImage.match(
    /linear-gradient\(\s*rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/i
  );
  if (!m) return { color: "#000000", opacity: 0 };
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  return {
    color: rgbToHex(+m[1], +m[2], +m[3]),
    opacity: Math.round(Math.max(0, Math.min(1, a)) * 100),
  };
}

function composeBgImage(url, overlayColor, overlayOpacity) {
  if (!url) return "";
  const quoted = `url("${url}")`;
  const pct = Number(overlayOpacity) || 0;
  if (pct <= 0) return quoted;
  const { r, g, b } = hexToRgb(overlayColor || "#000000");
  const a = Math.max(0, Math.min(100, pct)) / 100;
  return `linear-gradient(rgba(${r}, ${g}, ${b}, ${a}), rgba(${r}, ${g}, ${b}, ${a})), ${quoted}`;
}

/** True when background-image is a gradient fill (not a photo + overlay). */
function isPureGradient(bgImage) {
  if (!bgImage || bgImage === "none") return false;
  if (extractBgImageUrl(bgImage)) return false;
  return /(?:linear|radial|conic)-gradient\s*\(/i.test(bgImage);
}

/** Split top-level commas (ignore commas inside parentheses). */
function splitCssList(val) {
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of String(val || "")) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

function extractBalancedCall(str, startIdx) {
  const open = str.indexOf("(", startIdx);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < str.length; i++) {
    if (str[i] === "(") depth++;
    else if (str[i] === ")") {
      depth--;
      if (depth === 0) {
        return { full: str.slice(startIdx, i + 1), inner: str.slice(open + 1, i) };
      }
    }
  }
  return null;
}

/**
 * Parse the first linear-gradient in a background-image value into editable stops.
 * Supports angles like `165deg` / `to bottom`. Keeps raw color tokens (hex, rgb, var()).
 */
function parseLinearGradient(bgImage) {
  if (!bgImage) return null;
  const idx = bgImage.search(/linear-gradient\s*\(/i);
  if (idx === -1) {
    // Fallback: treat other gradients as a 2-stop linear for editing
    const anyIdx = bgImage.search(/(?:radial|conic)-gradient\s*\(/i);
    if (anyIdx === -1) return null;
    const call = extractBalancedCall(bgImage, anyIdx);
    if (!call) return null;
    const parts = splitCssList(call.inner);
    const stops = parts
      .map((p) => {
        const m = p.match(/^(.+?)(?:\s+(-?[\d.]+%))?$/);
        return m ? { color: m[1].trim(), pos: m[2] || "" } : null;
      })
      .filter(Boolean)
      .filter((s) => !/^(circle|ellipse|at|from|to)\b/i.test(s.color));
    if (stops.length < 1) return null;
    while (stops.length < 2) stops.push({ color: stops[0].color, pos: "" });
    return { kind: "linear", angle: "180deg", stops: stops.slice(0, 3), raw: bgImage };
  }
  const call = extractBalancedCall(bgImage, idx);
  if (!call) return null;
  const parts = splitCssList(call.inner);
  if (!parts.length) return null;

  let angle = "180deg";
  let stopParts = parts;
  const first = parts[0];
  if (/^-?[\d.]+deg$/i.test(first) || /^to\s+/i.test(first) || /^in\s+/i.test(first)) {
    angle = first;
    stopParts = parts.slice(1);
  }

  const stops = stopParts
    .map((p) => {
      const m = p.match(/^(.+?)(?:\s+(-?[\d.]+%))?$/);
      if (!m) return null;
      return { color: m[1].trim(), pos: m[2] || "" };
    })
    .filter(Boolean);

  if (!stops.length) return null;
  while (stops.length < 2) stops.push({ color: "#ffffff", pos: "" });
  return { kind: "linear", angle, stops: stops.slice(0, 3), raw: bgImage };
}

function composeLinearGradient({ angle, stops }) {
  const ang = angle || "180deg";
  const list = (stops || [])
    .filter((s) => s && s.color)
    .map((s) => (s.pos ? `${s.color} ${s.pos}` : s.color));
  if (list.length < 2) {
    const c = list[0] || "#111111";
    return `linear-gradient(${ang}, ${c}, ${c})`;
  }
  return `linear-gradient(${ang}, ${list.join(", ")})`;
}

function swatchHex(color) {
  const c = String(color || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) {
    if (c.length === 4) {
      return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
    }
    return c;
  }
  const rgb = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return rgbToHex(+rgb[1], +rgb[2], +rgb[3]);
  return "#888888";
}

/** Last comma-separated layer (the photo), ignoring commas inside (). */
function lastBgLayer(val) {
  if (!val) return "";
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of val) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(buf.trim());
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts[parts.length - 1] || "";
}

/** Overlay is layer 0; the photo is layer 1 — size/position/repeat must target the photo. */
function imageLayerCss(userVal, overlayOn, kind) {
  if (!userVal) return "";
  if (!overlayOn) return userVal;
  const gradDefault = kind === "size" ? "auto" : kind === "repeat" ? "repeat" : "0 0";
  return `${gradDefault}, ${userVal}`;
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
      hint: "Paste a web address, or pick a # section on this page.", placeholder: "https://... or #about" },
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
    { key: "href",  label: "Where it leads (URL)", type: "text",
      hint: "Paste a web address, or pick a # section on this page. Turns the button into a clickable link.",
      placeholder: "https://... or #about" },
    { key: "target", label: "Open in", type: "select",
      options: [
        { value: "",       label: "Same tab" },
        { value: "_blank", label: "New tab" },
      ],
      hint: "Choose whether the link opens in the same or a new browser tab." },
    { key: "type", label: "Button type", type: "select",
      options: [
        { value: "button", label: "Normal button" },
        { value: "submit", label: "Submit form" },
        { value: "reset",  label: "Reset form" },
      ],
      hint: 'Use "Submit form" if this button sends a form. Ignored when a link URL is set.' },
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
function getAttrDefs(tagName, outerHTML) {
  if (!tagName) return [];
  const t = tagName.toLowerCase();
  if (["h1","h2","h3","h4","h5","h6"].includes(t)) return ATTR_DEFS.heading;
  if (["p","span","li","td","th","label","strong","em","blockquote"].includes(t)) return ATTR_DEFS.text;
  // Link-styled buttons (converted from <button> or inserted as <a role="button">)
  if (t === "a" && /role\s*=\s*["']?button["']?/i.test(outerHTML || "")) {
    return [
      { key: "_text", label: "Button label", type: "text",
        hint: "The text written on the button." },
      { key: "href",  label: "Where it leads (URL)", type: "text",
        hint: "Paste a web address, or pick a # section on this page.",
        placeholder: "https://... or #about" },
      { key: "target", label: "Open in", type: "select",
        options: [
          { value: "",       label: "Same tab" },
          { value: "_blank", label: "New tab" },
        ],
        hint: "Choose whether the link opens in the same or a new browser tab." },
      { key: "title", label: "Tooltip (on hover)", type: "text",
        hint: "Small description shown when visitors hover over the button.", placeholder: "optional" },
    ];
  }
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

  // ── Tables ───────────────────────────────────────────────────────────────
  table: [
    "width",
    "border-collapse",
    "font-size",
    "background-color",
    "color",
    "border",
    "margin",
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

function getDefaultStyleProps(tagName, outerHTML) {
  if (!tagName) return STYLE_DEFAULTS_MAP.generic;
  const t = tagName.toLowerCase();

  if (["div","section","article","main","header","footer","nav","aside","form"].includes(t))
    return STYLE_DEFAULTS_MAP.container;

  if (["h1","h2","h3","h4","h5","h6"].includes(t))
    return STYLE_DEFAULTS_MAP.heading;

  if (["p","span","label","strong","em","blockquote","small","time","pre","code"].includes(t))
    return STYLE_DEFAULTS_MAP.text;

  // Button components inserted as <a role="button">
  if (t === "a" && /role\s*=\s*["']?button["']?/i.test(outerHTML || ""))
    return STYLE_DEFAULTS_MAP.button;
  if (t === "a")      return STYLE_DEFAULTS_MAP.link;
  if (t === "button") return STYLE_DEFAULTS_MAP.button;
  if (t === "img")    return STYLE_DEFAULTS_MAP.image;

  if (["input","textarea","select"].includes(t))
    return STYLE_DEFAULTS_MAP.input;

  if (["ul","ol"].includes(t)) return STYLE_DEFAULTS_MAP.list;
  if (["li"].includes(t))      return STYLE_DEFAULTS_MAP.text;
  if (t === "table" || ["thead","tbody","tfoot","tr"].includes(t))
    return STYLE_DEFAULTS_MAP.table;
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

const OVERLAY_PRESETS = [
  { id: "off",     label: "Off",     color: "#000000", opacity: 0  },
  { id: "darken",  label: "Darken",  color: "#000000", opacity: 45 },
  { id: "lighten", label: "Lighten", color: "#ffffff", opacity: 45 },
  { id: "navy",    label: "Navy",    color: "#0f172a", opacity: 55 },
  { id: "purple",  label: "Purple",  color: "#2e1065", opacity: 50 },
  { id: "green",   label: "Green",   color: "#14532d", opacity: 50 },
  { id: "red",     label: "Red",     color: "#7f1d1d", opacity: 50 },
  { id: "gold",    label: "Gold",    color: "#78350f", opacity: 40 },
];

function BackgroundRow({ styleVals, onStyle, onStyles, onRemove, schoolId }) {
  const writeStyles = onStyles || ((props) => {
    Object.entries(props).forEach(([p, v]) => onStyle(p, v));
  });

  const colorVal = styleVals["background-color"] || "";
  const imgVal   = styleVals["background-image"] || styleVals["background"] || "";

  const [showImgManual, setShowImgManual] = useState(false);
  const [showGradManual, setShowGradManual] = useState(false);

  const rawImgUrl = extractBgImageUrl(imgVal);
  const hasPureGradient = isPureGradient(imgVal);
  const parsedGrad = hasPureGradient ? parseLinearGradient(imgVal) : null;
  const showImg = showImgManual || !!rawImgUrl;
  const showGrad = (showGradManual || hasPureGradient) && !rawImgUrl;

  const overlay   = parseBgOverlay(imgVal);

  const sizeSelect = lastBgLayer(styleVals["background-size"]);
  const posSelect  = lastBgLayer(styleVals["background-position"]);
  const repSelect  = lastBgLayer(styleVals["background-repeat"]) || "no-repeat";

  const writeBg = (url, color, opacity, extras = {}) => {
    if (!url) {
      writeStyles({
        background: "",
        "background-image": "",
        "background-size": "",
        "background-position": "",
        "background-repeat": "",
      });
      return;
    }
    const ov = (Number(opacity) || 0) > 0;
    const size = extras.size !== undefined ? extras.size : sizeSelect;
    const pos  = extras.pos  !== undefined ? extras.pos  : posSelect;
    const rep  = extras.rep  !== undefined ? extras.rep  : (repSelect || "no-repeat");
    writeStyles({
      background: "",
      "background-image":    composeBgImage(url, color, opacity),
      "background-size":     imageLayerCss(size || "cover", ov, "size"),
      "background-position": imageLayerCss(pos || "center", ov, "position"),
      "background-repeat":   imageLayerCss(rep || "no-repeat", ov, "repeat"),
    });
  };

  const writeGradient = (grad) => {
    const next = composeLinearGradient(grad);
    writeStyles({
      background: "",
      "background-image": next,
      // Keep a solid fallback colour (first stop) so contrast tools stay meaningful
      "background-color": grad.stops?.[0]?.color || colorVal || "",
    });
  };

  const handleSolidColor = (hex) => {
    if (hasPureGradient && parsedGrad) {
      const stops = parsedGrad.stops.map((s, i) =>
        i === 0 ? { ...s, color: hex } : s
      );
      writeGradient({ ...parsedGrad, stops });
      return;
    }
    // Solid colour must win over leftover gradients in shorthand / image
    writeStyles({
      background: "",
      "background-image": rawImgUrl
        ? composeBgImage(rawImgUrl, overlay.color, overlay.opacity)
        : "",
      "background-color": hex,
    });
  };

  const handleBgImageChange = (url) => {
    writeBg(url, overlay.color, overlay.opacity);
    if (url) setShowGradManual(false);
  };

  const handleOverlayColor = (hex) => {
    if (!rawImgUrl) return;
    writeBg(rawImgUrl, hex, overlay.opacity > 0 ? overlay.opacity : 40);
  };

  const handleOverlayOpacity = (pct) => {
    if (!rawImgUrl) return;
    writeBg(rawImgUrl, overlay.color || "#000000", pct);
  };

  const applyPreset = (preset) => {
    if (!rawImgUrl) return;
    writeBg(rawImgUrl, preset.color, preset.opacity);
  };

  const startGradient = () => {
    setShowGradManual(true);
    setShowImgManual(false);
    const base = colorVal && colorVal !== "transparent" ? colorVal : "#111111";
    writeGradient({
      angle: "135deg",
      stops: [
        { color: base, pos: "" },
        { color: "#4c4294", pos: "" },
      ],
    });
  };

  const clearGradientToSolid = () => {
    setShowGradManual(false);
    const solid = parsedGrad?.stops?.[0]?.color || colorVal || "#111111";
    writeStyles({
      background: "",
      "background-image": "",
      "background-color": solid,
    });
  };

  const activePresetId = OVERLAY_PRESETS.find((p) => {
    if (p.opacity === 0) return overlay.opacity === 0;
    return p.color.toLowerCase() === overlay.color.toLowerCase() && p.opacity === overlay.opacity;
  })?.id || (overlay.opacity > 0 ? "custom" : "off");

  const angleNum = (() => {
    const m = String(parsedGrad?.angle || "180deg").match(/(-?[\d.]+)deg/i);
    return m ? Math.round(Number(m[1])) : 180;
  })();

  return (
    <div className="mrp-field mrp-field--style">
      <div className="mrp-field-header">
        <label className="mrp-label">Background colour</label>
        <div className="mrp-field-actions">
          <button
            className={`mrp-expand-btn ${showGrad ? "mrp-expand-btn--active" : ""}`}
            onClick={() => {
              if (showGrad) clearGradientToSolid();
              else startGradient();
            }}
            title="Edit gradient background"
            aria-label="Toggle gradient"
            type="button"
          >
            gradient
          </button>
          <button
            className={`mrp-expand-btn ${showImg ? "mrp-expand-btn--active" : ""}`}
            onClick={() => setShowImgManual(s => !s)}
            title="Use a background image instead"
            aria-label="Toggle background image"
            type="button"
          >
            <IconImage /> image
          </button>
          <button className="mrp-icon-btn mrp-icon-btn--remove"
            onClick={onRemove} title="Remove" aria-label="Remove background" type="button">
            <IconTrash />
          </button>
        </div>
      </div>
      <div className="mrp-field-sub">
        {hasPureGradient
          ? "gradient (colour edits the first stop)"
          : "background-color"}
      </div>
      <div className="mrp-color-row">
        <input type="color" className="mrp-color-swatch"
          value={
            hasPureGradient
              ? swatchHex(parsedGrad?.stops?.[0]?.color || colorVal)
              : (colorVal.startsWith("#") ? colorVal : "#ffffff")
          }
          onChange={e => handleSolidColor(e.target.value)} />
        <input type="text" className="mrp-text-input"
          value={
            hasPureGradient
              ? (parsedGrad?.stops?.[0]?.color || colorVal)
              : colorVal
          }
          placeholder="#ffffff or rgba(…) or transparent"
          onChange={e => handleSolidColor(e.target.value)} />
      </div>

      {showGrad && (
        <div className="mrp-bg-gradient">
          <div className="mrp-bg-gradient__title">Gradient</div>
          <p className="mrp-bg-gradient__hint">
            Edit angle and colour stops. Changing the main colour above updates the first stop.
          </p>

          <div
            className="mrp-bg-gradient__preview"
            style={{ backgroundImage: composeLinearGradient(parsedGrad || { angle: "135deg", stops: [{ color: "#111" }, { color: "#4c4294" }] }) }}
          />

          <label className="mrp-side-label">Angle — {angleNum}°</label>
          <div className="mrp-slider-row">
            <input
              type="range"
              className="mrp-slider"
              min="0"
              max="360"
              step="1"
              value={angleNum}
              onChange={(e) => {
                const g = parsedGrad || { angle: "180deg", stops: [{ color: "#111111" }, { color: "#4c4294" }] };
                writeGradient({ ...g, angle: `${Number(e.target.value)}deg` });
              }}
            />
            <span className="mrp-slider-val">{angleNum}°</span>
          </div>

          {(parsedGrad?.stops || [{ color: "#111111" }, { color: "#4c4294" }]).map((stop, i) => (
            <div key={i} className="mrp-bg-gradient__stop">
              <label className="mrp-side-label">Colour {i + 1}</label>
              <div className="mrp-color-row">
                <input
                  type="color"
                  className="mrp-color-swatch"
                  value={swatchHex(stop.color)}
                  onChange={(e) => {
                    const g = parsedGrad || { angle: "180deg", stops: [{ color: "#111111" }, { color: "#4c4294" }] };
                    const stops = g.stops.map((s, idx) =>
                      idx === i ? { ...s, color: e.target.value } : s
                    );
                    writeGradient({ ...g, stops });
                  }}
                />
                <input
                  type="text"
                  className="mrp-text-input"
                  value={stop.color}
                  onChange={(e) => {
                    const g = parsedGrad || { angle: "180deg", stops: [{ color: "#111111" }, { color: "#4c4294" }] };
                    const stops = g.stops.map((s, idx) =>
                      idx === i ? { ...s, color: e.target.value } : s
                    );
                    writeGradient({ ...g, stops });
                  }}
                />
              </div>
            </div>
          ))}

          <div className="mrp-bg-gradient__actions">
            {(parsedGrad?.stops?.length || 0) < 3 && (
              <button
                type="button"
                className="mrp-expand-btn"
                onClick={() => {
                  const g = parsedGrad || { angle: "180deg", stops: [{ color: "#111111" }, { color: "#4c4294" }] };
                  writeGradient({
                    ...g,
                    stops: [...g.stops, { color: "#ffffff", pos: "" }],
                  });
                }}
              >
                + Add colour
              </button>
            )}
            <button type="button" className="mrp-expand-btn" onClick={clearGradientToSolid}>
              Make solid
            </button>
          </div>
        </div>
      )}

      {showImg && (
        <div className="mrp-bg-img-section">
          <div className="mrp-bg-img-section__title">Background picture</div>

          <ImageUploadField
            value={rawImgUrl}
            onChange={handleBgImageChange}
            schoolId={schoolId}
          />

          {rawImgUrl && (
            <div className="mrp-bg-overlay">
              <div className="mrp-bg-overlay__title">Image overlay</div>
              <p className="mrp-bg-overlay__hint">Darken, lighten, or tint the photo so text stays readable.</p>

              <div className="mrp-bg-overlay__presets">
                {OVERLAY_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`mrp-bg-overlay__chip ${activePresetId === p.id ? "mrp-bg-overlay__chip--active" : ""}`}
                    onClick={() => applyPreset(p)}
                    title={p.label}
                  >
                    <span
                      className="mrp-bg-overlay__chip-swatch"
                      style={{
                        background: p.opacity === 0
                          ? "repeating-conic-gradient(#333 0% 25%, #1a1a1a 0% 50%) 50% / 8px 8px"
                          : p.color,
                        opacity: p.opacity === 0 ? 1 : 0.35 + p.opacity / 150,
                      }}
                    />
                    {p.label}
                  </button>
                ))}
              </div>

              <label className="mrp-side-label">Overlay colour</label>
              <div className="mrp-color-row">
                <input
                  type="color"
                  className="mrp-color-swatch"
                  value={overlay.color || "#000000"}
                  onChange={(e) => handleOverlayColor(e.target.value)}
                />
                <input
                  type="text"
                  className="mrp-text-input"
                  value={overlay.color || "#000000"}
                  onChange={(e) => handleOverlayColor(e.target.value)}
                />
              </div>

              <label className="mrp-side-label" style={{ marginTop: 8 }}>
                Strength — {overlay.opacity}%
              </label>
              <div className="mrp-slider-row">
                <input
                  type="range"
                  className="mrp-slider"
                  min="0"
                  max="85"
                  step="1"
                  value={overlay.opacity}
                  onChange={(e) => handleOverlayOpacity(Number(e.target.value))}
                />
                <span className="mrp-slider-val">{overlay.opacity}%</span>
              </div>
            </div>
          )}

          <label className="mrp-side-label" style={{marginTop:8}}>How it fits</label>
          <select className="mrp-select" value={sizeSelect || ""}
            onChange={e => {
              const v = e.target.value;
              if (!rawImgUrl) {
                writeStyles({ "background-size": v });
                return;
              }
              writeBg(rawImgUrl, overlay.color, overlay.opacity, { size: v });
            }}>
            <option value="">— choose —</option>
            {BG_SIZE_OPTIONS2.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label className="mrp-side-label" style={{marginTop:8}}>Position</label>
          <select className="mrp-select" value={posSelect || ""}
            onChange={e => {
              const v = e.target.value;
              if (!rawImgUrl) {
                writeStyles({ "background-position": v });
                return;
              }
              writeBg(rawImgUrl, overlay.color, overlay.opacity, { pos: v });
            }}>
            <option value="">— choose —</option>
            {BG_POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <label className="mrp-side-label" style={{marginTop:8}}>Repeat</label>
          <select className="mrp-select" value={repSelect || "no-repeat"}
            onChange={e => {
              const v = e.target.value;
              if (!rawImgUrl) {
                writeStyles({ "background-repeat": v });
                return;
              }
              writeBg(rawImgUrl, overlay.color, overlay.opacity, { rep: v });
            }}>
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
// SIMPLE LOOK CONTROLS (plain-language Style tab)
// ─────────────────────────────────────────────────────────────────────────────

const FONT_SIZE_STEPS = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"];

const SPACING_PRESETS = [
  { id: "none",   label: "None",   value: "0" },
  { id: "tight",  label: "Tight",  value: "8px" },
  { id: "normal", label: "Normal", value: "16px" },
  { id: "roomy",  label: "Roomy",  value: "24px" },
  { id: "wide",   label: "Wide",   value: "40px" },
];

const CORNER_PRESETS = [
  { id: "sharp", label: "Sharp", value: "0" },
  { id: "soft",  label: "Soft",  value: "8px" },
  { id: "round", label: "Round", value: "16px" },
  { id: "pill",  label: "Pill",  value: "999px" },
];

const ALIGN_CHIPS = [
  { value: "left",    label: "Left" },
  { value: "center",  label: "Middle" },
  { value: "right",   label: "Right" },
  { value: "justify", label: "Even" },
];

const CASE_CHIPS = [
  { value: "none",       label: "As typed" },
  { value: "uppercase",  label: "ALL CAPS" },
  { value: "capitalize", label: "Title" },
  { value: "lowercase",  label: "lower" },
];

const LINE_HEIGHT_PRESETS = [
  { id: "tight",  label: "Tight",  value: "1.2" },
  { id: "normal", label: "Normal", value: "1.5" },
  { id: "loose",  label: "Loose",  value: "1.8" },
  { id: "airy",   label: "Airy",   value: "2.2" },
];

const GAP_PRESETS = [
  { id: "none",   label: "None",   value: "0" },
  { id: "tight",  label: "Tight",  value: "8px" },
  { id: "normal", label: "Normal", value: "16px" },
  { id: "roomy",  label: "Roomy",  value: "24px" },
];

const SHADOW_PRESETS = [
  { id: "none",   label: "None",   value: "none" },
  { id: "soft",   label: "Soft",   value: "0 4px 14px rgba(0,0,0,0.18)" },
  { id: "strong", label: "Strong", value: "0 10px 28px rgba(0,0,0,0.28)" },
  { id: "glow",   label: "Glow",   value: "0 0 0 3px rgba(108,92,231,0.35)" },
];

const BORDER_PRESETS = [
  { id: "none",  label: "None",  value: "none" },
  { id: "thin",  label: "Thin",  value: "1px solid #333333" },
  { id: "thick", label: "Thick", value: "3px solid #333333" },
];

const WIDTH_PRESETS = [
  { id: "auto", label: "Auto", value: "auto" },
  { id: "half", label: "Half", value: "50%" },
  { id: "full", label: "Full", value: "100%" },
];

const HEIGHT_PRESETS = [
  { id: "auto",   label: "Auto",        value: "auto" },
  { id: "short",  label: "Short",       value: "120px" },
  { id: "medium", label: "Medium",      value: "240px" },
  { id: "tall",   label: "Tall",        value: "400px" },
  { id: "screen", label: "Full screen", value: "100vh" },
];

const JUSTIFY_CHIPS = [
  { value: "flex-start",    label: "Start" },
  { value: "center",        label: "Centre" },
  { value: "flex-end",      label: "End" },
  { value: "space-between", label: "Spread" },
];

const CROSS_ALIGN_CHIPS = [
  { value: "flex-start", label: "Top" },
  { value: "center",     label: "Middle" },
  { value: "flex-end",   label: "Bottom" },
  { value: "stretch",    label: "Stretch" },
];

const LAYOUT_MODE_CHIPS = [
  { id: "row",    label: "Side by side", display: "flex", flexDirection: "row", columns: "" },
  { id: "column", label: "Stacked",      display: "flex", flexDirection: "column", columns: "" },
  { id: "grid-2", label: "Grid 2",       display: "grid", flexDirection: "", columns: "1fr 1fr" },
  { id: "grid-3", label: "Grid 3",       display: "grid", flexDirection: "", columns: "1fr 1fr 1fr" },
  { id: "grid-4", label: "Grid 4",       display: "grid", flexDirection: "", columns: "repeat(4, 1fr)" },
];

function detectLayoutMode(vals) {
  const display = String(vals.display || "").toLowerCase();
  const cols = String(vals["grid-template-columns"] || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (display === "grid" || cols) {
    if (cols.includes("repeat(4") || (cols.match(/1fr/g) || []).length >= 4) return "grid-4";
    if (cols.includes("repeat(3") || (cols.match(/1fr/g) || []).length === 3) return "grid-3";
    if (cols.includes("repeat(2") || cols === "1fr 1fr" || (cols.match(/1fr/g) || []).length === 2) return "grid-2";
    return "grid-2";
  }
  const dir = String(vals["flex-direction"] || "").toLowerCase();
  if (dir === "column" || dir === "column-reverse") return "column";
  if (dir === "row" || dir === "row-reverse" || display === "flex") return "row";
  return "";
}

function nearestFontStep(val) {
  const n = parseFloat(val);
  if (!Number.isFinite(n)) return 2;
  let best = 2;
  let dist = Infinity;
  FONT_SIZE_STEPS.forEach((s, i) => {
    const d = Math.abs(parseFloat(s) - n);
    if (d < dist) { dist = d; best = i; }
  });
  return best;
}

function matchPreset(val, presets) {
  if (val == null || val === "") return null;
  const norm = String(val).trim().toLowerCase().replace(/\s+/g, "");
  const found = presets.find((p) => String(p.value).toLowerCase().replace(/\s+/g, "") === norm);
  if (found) return found.id;
  const n = parseFloat(val);
  if (!Number.isFinite(n)) return null;
  let best = null;
  let dist = Infinity;
  presets.forEach((p) => {
    const pn = parseFloat(p.value);
    if (!Number.isFinite(pn)) return;
    const d = Math.abs(pn - n);
    if (d < dist) { dist = d; best = p.id; }
  });
  return dist <= 4 ? best : null;
}

function matchShadowPreset(val) {
  if (!val || val === "none") return "none";
  const v = String(val).toLowerCase();
  if (v.includes("108,92,231") || v.includes("108, 92, 231")) return "glow";
  if (v.includes("28px") || v.includes("0.28")) return "strong";
  if (v.includes("14px") || v.includes("0.18") || v.includes("rgba")) return "soft";
  return null;
}

function matchBorderPreset(val) {
  if (!val || val === "none" || val === "0") return "none";
  const n = parseFloat(val);
  if (Number.isFinite(n) && n >= 2.5) return "thick";
  if (Number.isFinite(n) && n > 0) return "thin";
  if (String(val).includes("3px")) return "thick";
  if (String(val).includes("1px") || String(val).includes("solid")) return "thin";
  return null;
}

function toColorInput(val) {
  const v = String(val || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const r = v[1], g = v[2], b = v[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#000000";
}

function isBoldWeight(val) {
  const v = String(val || "").toLowerCase();
  if (v === "bold" || v === "bolder") return true;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= 600;
}

function isItalicStyle(val) {
  const v = String(val || "").toLowerCase();
  return v === "italic" || v === "oblique";
}

function hasUnderline(val) {
  return String(val || "").toLowerCase().includes("underline");
}

const CONTAINER_TAGS = new Set([
  "div", "section", "article", "main", "header", "footer", "nav", "aside",
  "form", "ul", "ol", "li", "figure", "figcaption", "blockquote",
]);
const MEDIA_TAGS = new Set(["img", "video", "audio", "iframe", "hr", "br", "svg", "canvas"]);

function ChipRow({ label, chips, active, onPick }) {
  return (
    <div className="mrp-simple-row mrp-simple-row--stack">
      <span className="mrp-simple-label">{label}</span>
      <div className="mrp-simple-chips">
        {chips.map((c) => {
          const value = c.value ?? c.id;
          const isOn = active === value || active === c.id;
          return (
            <button
              key={value}
              type="button"
              className={`mrp-simple-chip ${isOn ? "mrp-simple-chip--active" : ""}`}
              onClick={() => onPick(c.value !== undefined ? c.value : c.id, c)}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SimpleLookPanel({ vals, onStyle, onStyles, tagName, schoolId }) {
  const sizeIdx = nearestFontStep(vals["font-size"]);
  const spacingId = matchPreset(vals.padding, SPACING_PRESETS);
  const marginId = matchPreset(vals.margin, SPACING_PRESETS);
  const gapId = matchPreset(vals.gap, GAP_PRESETS);
  const cornerId = matchPreset(vals["border-radius"], CORNER_PRESETS);
  const lineId = matchPreset(vals["line-height"], LINE_HEIGHT_PRESETS);
  const widthId = matchPreset(vals.width, WIDTH_PRESETS);
  const heightId = matchPreset(vals.height, HEIGHT_PRESETS);
  const shadowId = matchShadowPreset(vals["box-shadow"]);
  const borderId = matchBorderPreset(vals.border);
  const align = vals["text-align"] || "";
  const textCase = vals["text-transform"] || "none";
  const bold = isBoldWeight(vals["font-weight"]);
  const italic = isItalicStyle(vals["font-style"]);
  const underline = hasUnderline(vals["text-decoration"]);
  const tag = String(tagName || "").toLowerCase();
  const isContainer = CONTAINER_TAGS.has(tag);
  const showText = !isContainer && !MEDIA_TAGS.has(tag);
  const showMediaFit = tag === "img" || tag === "video";
  const layoutMode = detectLayoutMode(vals);
  const justify = vals["justify-content"] || "";
  const alignItems = vals["align-items"] || "";
  const opacityNum = (() => {
    const n = parseFloat(vals.opacity);
    return Number.isFinite(n) ? n : 1;
  })();

  const pickChip = (prop) => (_value, chip) => {
    onStyle(prop, chip.value);
  };

  const applyLayoutMode = (_value, chip) => {
    const mode = chip;
    if (mode.display === "grid") {
      onStyles({
        display: "grid",
        "flex-direction": "",
        "grid-template-columns": mode.columns,
      });
    } else {
      onStyles({
        display: "flex",
        "flex-direction": mode.flexDirection,
        "grid-template-columns": "",
      });
    }
  };

  return (
    <div className="mrp-simple">
      {showText && (
        <div className="mrp-simple-card">
          <p className="mrp-simple-card__title">Text</p>

          <div className="mrp-simple-row">
            <span className="mrp-simple-label">Colour</span>
            <div className="mrp-simple-color">
              <input
                type="color"
                className="mrp-color-swatch"
                value={toColorInput(vals.color)}
                onChange={(e) => onStyle("color", e.target.value)}
                aria-label="Text colour"
              />
              <span className="mrp-simple-color-hint">Pick a colour</span>
            </div>
          </div>

          <div className="mrp-simple-row">
            <span className="mrp-simple-label">Size</span>
            <div className="mrp-simple-stepper" role="group" aria-label="Text size">
              <button
                type="button"
                className="mrp-simple-stepper__btn"
                disabled={sizeIdx <= 0}
                onClick={() => onStyle("font-size", FONT_SIZE_STEPS[Math.max(0, sizeIdx - 1)])}
                aria-label="Make text smaller"
              >
                A−
              </button>
              <span className="mrp-simple-stepper__val">
                {FONT_SIZE_STEPS[sizeIdx].replace("px", "")}
              </span>
              <button
                type="button"
                className="mrp-simple-stepper__btn"
                disabled={sizeIdx >= FONT_SIZE_STEPS.length - 1}
                onClick={() => onStyle("font-size", FONT_SIZE_STEPS[Math.min(FONT_SIZE_STEPS.length - 1, sizeIdx + 1)])}
                aria-label="Make text bigger"
              >
                A+
              </button>
            </div>
          </div>

          <div className="mrp-simple-row">
            <span className="mrp-simple-label">Style</span>
            <div className="mrp-simple-chips">
              <button
                type="button"
                className={`mrp-simple-chip ${bold ? "mrp-simple-chip--active" : ""}`}
                onClick={() => onStyle("font-weight", bold ? "400" : "700")}
              >
                Bold
              </button>
              <button
                type="button"
                className={`mrp-simple-chip ${italic ? "mrp-simple-chip--active" : ""}`}
                onClick={() => onStyle("font-style", italic ? "normal" : "italic")}
              >
                Italic
              </button>
              <button
                type="button"
                className={`mrp-simple-chip ${underline ? "mrp-simple-chip--active" : ""}`}
                onClick={() => onStyle("text-decoration", underline ? "none" : "underline")}
              >
                Underline
              </button>
            </div>
          </div>

          <ChipRow label="Align" chips={ALIGN_CHIPS} active={align} onPick={pickChip("text-align")} />
          <ChipRow label="Letter case" chips={CASE_CHIPS} active={textCase} onPick={pickChip("text-transform")} />
          <ChipRow
            label="Line spacing"
            chips={LINE_HEIGHT_PRESETS}
            active={lineId}
            onPick={(_v, chip) => onStyle("line-height", chip.value)}
          />
        </div>
      )}

      {isContainer && (
        <div className="mrp-simple-card">
          <p className="mrp-simple-card__title">Box layout</p>
          <ChipRow
            label="How children line up"
            chips={LAYOUT_MODE_CHIPS}
            active={layoutMode}
            onPick={applyLayoutMode}
          />
          <ChipRow
            label="Space between children"
            chips={GAP_PRESETS}
            active={gapId}
            onPick={(_v, chip) => onStyle("gap", chip.value)}
          />
          <ChipRow
            label="Push children"
            chips={JUSTIFY_CHIPS}
            active={justify}
            onPick={pickChip("justify-content")}
          />
          <ChipRow
            label="Align children"
            chips={CROSS_ALIGN_CHIPS}
            active={alignItems}
            onPick={pickChip("align-items")}
          />
        </div>
      )}

      <div className="mrp-simple-card">
        <p className="mrp-simple-card__title">{isContainer ? "Box look" : showMediaFit ? "Picture look" : "Look"}</p>

        <BackgroundRow
          styleVals={vals}
          onStyle={onStyle}
          onStyles={onStyles}
          onRemove={() => (onStyles || ((props) => Object.entries(props).forEach(([p, v]) => onStyle(p, v))))({
            background: "",
            "background-color": "",
            "background-image": "",
            "background-size": "",
            "background-position": "",
            "background-repeat": "",
          })}
          schoolId={schoolId}
        />

        <ChipRow
          label="Space inside"
          chips={SPACING_PRESETS}
          active={spacingId}
          onPick={(_v, chip) => onStyle("padding", chip.value)}
        />
        <ChipRow
          label="Space outside"
          chips={SPACING_PRESETS}
          active={marginId}
          onPick={(_v, chip) => onStyle("margin", chip.value)}
        />
        <ChipRow
          label="Corners"
          chips={CORNER_PRESETS}
          active={cornerId}
          onPick={(_v, chip) => onStyle("border-radius", chip.value)}
        />
        <ChipRow
          label="Border"
          chips={BORDER_PRESETS}
          active={borderId}
          onPick={(_v, chip) => onStyle("border", chip.value)}
        />
        <ChipRow
          label="Shadow"
          chips={SHADOW_PRESETS}
          active={shadowId}
          onPick={(_v, chip) => onStyle("box-shadow", chip.value)}
        />
        <ChipRow
          label="Width"
          chips={WIDTH_PRESETS}
          active={widthId}
          onPick={(_v, chip) => onStyle("width", chip.value)}
        />
        <ChipRow
          label="Height"
          chips={HEIGHT_PRESETS}
          active={heightId}
          onPick={(_v, chip) => onStyle("height", chip.value)}
        />

        {showMediaFit && (
          <ChipRow
            label="How picture fits"
            chips={[
              { value: "cover", label: "Fill" },
              { value: "contain", label: "Fit" },
              { value: "fill", label: "Stretch" },
            ]}
            active={vals["object-fit"] || ""}
            onPick={pickChip("object-fit")}
          />
        )}

        <div className="mrp-simple-row">
          <span className="mrp-simple-label">See-through</span>
          <div className="mrp-simple-opacity">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={opacityNum}
              className="mrp-slider"
              onChange={(e) => onStyle("opacity", e.target.value)}
              aria-label="Transparency"
            />
            <span className="mrp-simple-stepper__val">{Math.round(opacityNum * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
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
function StyleAccordion({ group, props, currentVals, commitStyle, commitStyles, removeStyleProp, showFlexArrows, schoolId }) {
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
              onStyles={commitStyles}
              onRemove={() => commitStyles({
                background: "",
                "background-color": "",
                "background-image": "",
                "background-size": "",
                "background-position": "",
                "background-repeat": "",
              })}
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

// TABLE_STYLE_TEMPLATES imported from utils/tableStyleTemplates.js

function cssMapToReact(map) {
  if (!map) return {};
  const out = {};
  Object.entries(map).forEach(([k, v]) => {
    const camel = k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  });
  return out;
}

function MiniTablePreview({ template }) {
  const th = cssMapToReact(template.th);
  const td = cssMapToReact(template.td);
  const thead = cssMapToReact(template.thead);
  const odd = cssMapToReact(template.trOdd);
  const even = cssMapToReact(template.trEven);
  return (
    <table className="mrp-table-theme__mini" style={cssMapToReact(template.table)}>
      <thead style={thead}>
        <tr>
          <th style={th}>A</th>
          <th style={th}>B</th>
        </tr>
      </thead>
      <tbody>
        <tr style={odd}>
          <td style={td}>1</td>
          <td style={td}>2</td>
        </tr>
        <tr style={even}>
          <td style={td}>3</td>
          <td style={td}>4</td>
        </tr>
      </tbody>
    </table>
  );
}

function TableStylePicker({ html, selector, onHtmlChange }) {
  const [open, setOpen] = useState(false);
  const activeId = useMemo(() => {
    if (!html || !selector) return "";
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      let el = doc.querySelector(selector) ||
        doc.querySelector(selector.replace(/:nth-of-type\(\d+\)/g, ""));
      const table = el?.tagName === "TABLE" ? el : el?.closest?.("table");
      return table?.getAttribute("data-table-theme") || "";
    } catch {
      return "";
    }
  }, [html, selector]);

  const activeLabel = TABLE_STYLE_TEMPLATES.find((t) => t.id === activeId)?.label;

  return (
    <div className={`mrp-accordion ${open ? "mrp-accordion--open" : ""}`}>
      <button
        type="button"
        className="mrp-accordion__header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="mrp-accordion__icon">▦</span>
        <span className="mrp-accordion__label">Table style</span>
        {activeLabel && (
          <span className="mrp-accordion__badge">{activeLabel}</span>
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
          <div className="mrp-table-themes__grid">
            {TABLE_STYLE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                className={`mrp-table-theme ${activeId === tpl.id ? "mrp-table-theme--active" : ""}`}
                onClick={() => onHtmlChange(applyTableTemplate(html, selector, tpl))}
              >
                <MiniTablePreview template={tpl} />
                <span className="mrp-table-theme__label">{tpl.label}</span>
              </button>
            ))}
          </div>
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentVals    = viewMode === "mobile" ? mobileVals  : styleVals;
  const setCurrentVals = viewMode === "mobile" ? setMobileVals : setStyleVals;

  // Sync when selected element changes
  useEffect(() => {
    if (!selectedElement) { setActiveProps([]); setStyleVals({}); setMobileVals({}); return; }
    const defaults = getDefaultStyleProps(selectedElement.tagName, selectedElement.outerHTML);

    // Always use the latest html via ref — avoids stale closure when a new
    // element is selected right after an edit, and avoids re-running on every
    // html change (which would reset the color picker mid-edit).
    const currentHtml = htmlRef.current;

    let inlineMap = {};
    if (currentHtml && selectedElement.selector) {
      try {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(currentHtml, "text/html");
        const liveEl = doc.querySelector(selectedElement.selector) ||
                       doc.querySelector(selectedElement.selector.replace(/:nth-of-type\(\d+\)/g, ""));
        if (liveEl) inlineMap = readInlineStyleMap(liveEl);
      } catch (_) {}
    }
    if (!Object.keys(inlineMap).length && selectedElement.outerHTML) {
      try {
        const parser = new DOMParser();
        const doc    = parser.parseFromString(selectedElement.outerHTML, "text/html");
        const el     = doc.body?.firstElementChild;
        if (el) inlineMap = readInlineStyleMap(el);
      } catch (_) {}
    }
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
    if (inlineMap["background-image"] && !("background-image" in vals)) {
      vals["background-image"] = inlineMap["background-image"];
    }
    ["background-size","background-position","background-repeat"].forEach((p) => {
      if (inlineMap[p] && !vals[p]) vals[p] = inlineMap[p];
    });
    [
      "color","font-size","font-weight","font-style","text-align","text-decoration","text-transform","line-height",
      "background-color","padding","margin","border-radius","border","box-shadow","width","height","opacity",
      "gap","flex-direction","justify-content","align-items","display","grid-template-columns","object-fit",
    ].forEach((p) => {
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
    [
      "color","font-size","font-weight","font-style","text-align","text-decoration","text-transform","line-height",
      "background-color","padding","margin","border-radius","border","box-shadow","width","height","opacity",
      "gap","flex-direction","justify-content","align-items","display","grid-template-columns","object-fit",
    ].forEach((p) => {
      if (!(p in mVals)) mVals[p] = mediaMap[p] || "";
    });
    setMobileVals(mVals);
    setShowAdvanced(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.selector]);

  if (!selectedElement) return null;

  const commitStyle = useCallback((prop, value) => {
    setCurrentVals(v => ({ ...v, [prop]: value }));
    if (viewMode === "mobile") {
      onHtmlChange(patchMediaStyle(html, sel, prop, value));
    } else {
      let newHtml = patchStyle(html, sel, prop, value);
      if (["flex-direction", "justify-content", "align-items", "gap"].includes(prop) && value) {
        newHtml = patchStyle(newHtml, sel, "display", "flex");
        setStyleVals(v => ({ ...v, display: "flex", [prop]: value }));
      }
      onHtmlChange(newHtml);
    }
  }, [html, sel, onHtmlChange, viewMode, setCurrentVals]);

  const commitStyles = useCallback((props) => {
    if (!props || !Object.keys(props).length) return;
    setCurrentVals((v) => ({ ...v, ...props }));
    if (viewMode === "mobile") {
      let next = html;
      Object.entries(props).forEach(([p, value]) => {
        next = patchMediaStyle(next, sel, p, value);
      });
      onHtmlChange(next);
    } else {
      onHtmlChange(patchStyles(html, sel, props));
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
  const tableTag = (selectedElement.tagName || "").toLowerCase();
  const showTableThemes = ["table", "thead", "tbody", "tfoot", "tr", "td", "th"].includes(tableTag);

  return (
    <div className="mrp-style-tab">
      <div className="mrp-style-tab__scroll">
        <div className="mrp-simple-tip">
          <strong>How to edit:</strong> click something to style it. Double-click text on the page to change the words.
        </div>

        <div className="mrp-view-toggle">
          <button
            className={`mrp-view-btn ${viewMode === "desktop" ? "mrp-view-btn--active" : ""}`}
            onClick={() => setViewMode("desktop")}
            title="Edit how it looks on a computer"
          >
            <IconDesktop /> Computer
          </button>
          <button
            className={`mrp-view-btn ${viewMode === "mobile" ? "mrp-view-btn--active mrp-view-btn--mobile" : ""}`}
            onClick={() => setViewMode("mobile")}
            title="Edit how it looks on a phone"
          >
            <IconMobile /> Phone
          </button>
        </div>

        {viewMode === "mobile" && (
          <div className="mrp-mobile-banner">
            These changes only show on phones (small screens).
          </div>
        )}

        <SimpleLookPanel
          vals={currentVals}
          onStyle={commitStyle}
          onStyles={commitStyles}
          tagName={selectedElement.tagName}
          schoolId={schoolId}
        />

        {showTableThemes && viewMode === "desktop" && sel && (
          <div className="mrp-simple-card mrp-simple-card--table">
            <p className="mrp-simple-card__title">Table look</p>
            <TableStylePicker html={html} selector={sel} onHtmlChange={onHtmlChange} />
          </div>
        )}

        <button
          type="button"
          className={`mrp-more-options ${showAdvanced ? "mrp-more-options--open" : ""}`}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? "Hide extra options" : "More options (advanced)"}
        </button>

        {showAdvanced && (
          <>
            <div className="mrp-accordions">
              {STYLE_GROUPS.map(group => (
                <StyleAccordion
                  key={group.id}
                  group={group}
                  props={grouped[group.id] || []}
                  currentVals={currentVals}
                  commitStyle={commitStyle}
                  commitStyles={commitStyles}
                  removeStyleProp={removeStyleProp}
                  showFlexArrows={showFlexArrows}
                  schoolId={schoolId}
                />
              ))}
            </div>

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
          </>
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
function collectPageAnchors(html) {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const seen = new Set();
    const list = [];
    doc.querySelectorAll("[id]").forEach((el) => {
      const id = (el.getAttribute("id") || "").trim();
      if (!id || id.startsWith("__aie") || seen.has(id)) return;
      const tag = el.tagName.toLowerCase();
      if (["script", "style", "meta", "link"].includes(tag)) return;
      seen.add(id);
      const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 42);
      list.push({
        value: `#${id}`,
        label: text ? `#${id}  ·  ${text}` : `#${id}  (${tag})`,
      });
    });
    return list;
  } catch {
    return [];
  }
}

function HrefField({ value, onChange, html, placeholder }) {
  const anchors = useMemo(() => collectPageAnchors(html), [html]);
  const hashVal = (value || "").startsWith("#") ? value : "";

  return (
    <div className="mrp-href-field">
      {anchors.length > 0 && (
        <>
          <div className="mrp-href-field__label">On this page</div>
          <div className="mrp-anchor-list" role="listbox" aria-label="Page sections">
            {anchors.map((a) => (
              <button
                key={a.value}
                type="button"
                role="option"
                aria-selected={hashVal === a.value}
                className={`mrp-anchor-chip ${hashVal === a.value ? "mrp-anchor-chip--active" : ""}`}
                onClick={() => onChange(a.value)}
                title={a.value}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
      <input
        type="text"
        className="mrp-text-input"
        value={value ?? ""}
        placeholder={placeholder || "https://... or #section"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AttributesTab({ selectedElement, html, onHtmlChange, schoolId, onSelectNode }) {
  const defs = getAttrDefs(selectedElement?.tagName, selectedElement?.outerHTML);
  const sel  = selectedElement?.selector;
  const tag  = (selectedElement?.tagName || "").toLowerCase();

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
      } else if (d.key === "href" && tag === "button") {
        // Buttons may store a pending link as data-href before conversion
        initial.href =
          getAttrFromHtml(selectedElement.outerHTML || "", "data-href") ||
          getAttrFromHtml(selectedElement.outerHTML || "", "href") ||
          "";
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

  const reselectByHleId = (newHtml, hleId) => {
    if (!onSelectNode || !hleId) return;
    const walk = (nodes) => {
      for (const n of nodes || []) {
        // Match the stamped element only — descendant selectors also embed this id
        if (n.id === hleId) return n;
        const found = walk(n.children);
        if (found) return found;
      }
      return null;
    };
    const node = walk(parseLayoutTree(newHtml));
    if (node) onSelectNode(node);
  };

  const commit = (key, value) => {
    // Strip leading # if user types it into the id field
    const cleanValue = key === "id" ? value.replace(/^#+/, "") : value;
    setVals(v => ({ ...v, [key]: cleanValue }));
    if (key === "_text") {
      onHtmlChange(patchTextContent(html, sel, cleanValue));
    } else if (defs.find(d => d.key === key)?.type === "checkbox") {
      onHtmlChange(patchAttribute(html, sel, key, cleanValue === "true" ? "" : null));
    } else if ((key === "href" || key === "target") && (tag === "button" || tag === "a")) {
      // Links + buttons: use shared link patcher (converts button → <a>)
      const nextHref   = key === "href"   ? cleanValue : (vals.href ?? "");
      const nextTarget = key === "target" ? cleanValue : (vals.target ?? "");
      const { html: newHtml, hleId } = patchElementLink(html, sel, nextHref, nextTarget || null);
      onHtmlChange(newHtml);
      if (tag === "button") reselectByHleId(newHtml, hleId);
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
          ) : def.type === "text" && def.key === "href" ? (
            <HrefField
              value={vals[def.key] ?? ""}
              onChange={(v) => commit(def.key, v)}
              html={html}
              placeholder={def.placeholder}
            />
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
  { id: "attrs",     label: "Content",  Icon: IconType    },
  { id: "styles",    label: "Look",     Icon: IconPaint   },
  { id: "template",  label: "Template", Icon: IconTemplate },
];

/**
 * Props:
 *   selectedElement  – { selector, tagName, label, textContent, outerHTML } | null
 *   html             – current full HTML string
 *   onHtmlChange     – fn(newHtml) commit to history
 *   reportMode       – when true, show Template tab for report card sections
 */
export default function ManualRightPanel({ selectedElement, html, onHtmlChange, onSelectNode, reportMode = false }) {
  const { schoolId } = useParams();
  const [activeTab, setActiveTab] = useState("attrs");

  // When the selected element changes, default to Content (or Template in report mode).
  // Do NOT depend on `html` — style edits update html and must not yank the user off Style.
  useEffect(() => {
    if (!selectedElement?.selector) return;
    if (
      reportMode &&
      detectReportSection(html, selectedElement.selector)
    ) {
      setActiveTab("template");
    } else {
      setActiveTab("attrs");
    }
    // html intentionally omitted: only re-evaluate when selection / report mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.selector, reportMode]);

  const noSelection = !selectedElement;
  const visibleTabs = reportMode ? TABS : TABS.filter((t) => t.id !== "template");

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
      <div className="msp-tabs" role="tablist">
        {!noSelection && visibleTabs.map(({ id, label, Icon }) => (
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

      <div className="msp-content">
        {noSelection ? (
          <div className="manual-side-panel__empty">
            <div className="manual-side-panel__empty-icon">
              <IconPaint />
            </div>
            <p className="manual-side-panel__empty-title">Tap something to edit</p>
            <p className="manual-side-panel__empty-desc">
              Click any part of the page to style it.<br />
              Double-click text to change the words.
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
                onSelectNode={onSelectNode}
              />
            )}
            {activeTab === "styles" && (
              <StyleTab
                selectedElement={selectedElement}
                html={html}
                onHtmlChange={onHtmlChange}
              />
            )}
            {activeTab === "template" && reportMode && (
              <ReportTemplateTab
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
