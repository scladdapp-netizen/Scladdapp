import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import "./WebsiteBriefPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

const SCHEMES = [
  { id: "navy", name: "Navy", primary: "#1e3a5f", secondary: "#d6e2f0", accent: "#c4a35a", background: "#f7f5f0", ink: "#142033" },
  { id: "forest", name: "Forest", primary: "#1f6b4a", secondary: "#d7efe3", accent: "#e0a100", background: "#f4faf6", ink: "#143026" },
  { id: "wine", name: "Wine", primary: "#7a2430", secondary: "#f3d6db", accent: "#c4a574", background: "#fbf6f4", ink: "#2a1216" },
  { id: "ink", name: "Ink", primary: "#111111", secondary: "#e7e7e7", accent: "#b08968", background: "#fafafa", ink: "#111111" },
  { id: "gold", name: "Gold", primary: "#8a6412", secondary: "#f3e6c4", accent: "#1e3a5f", background: "#fffaf0", ink: "#2a220f" },
  { id: "violet", name: "Violet", primary: "#3d348b", secondary: "#e4dff8", accent: "#e07a5f", background: "#f7f6fb", ink: "#1c1733" },
];

function schemeById(id) {
  return SCHEMES.find((item) => item.id === id) || SCHEMES[0];
}

const SCHEME_FIELDS = [
  ["primary", "Main"],
  ["secondary", "Panel"],
  ["accent", "Button"],
  ["background", "Background"],
  ["ink", "Text"],
];

const DEFAULT_CUSTOM = {
  primary: "#1e3a5f",
  secondary: "#d6e2f0",
  accent: "#c4a35a",
  background: "#f7f5f0",
  ink: "#142033",
};

function activeScheme(draft) {
  if (draft.schemeId === "custom") {
    return { id: "custom", name: "Custom", ...DEFAULT_CUSTOM, ...(draft.customScheme || {}) };
  }
  return schemeById(draft.schemeId);
}

function schemeCss(colors) {
  return `:root{--sclad-primary:${colors.primary};--sclad-secondary:${colors.secondary};--sclad-accent:${colors.accent};--sclad-background:${colors.background};--sclad-ink:${colors.ink}}body{background-color:var(--sclad-background)!important;color:var(--sclad-ink)!important}header,footer{background-color:var(--sclad-primary)!important;color:#fff!important}h1,h2,h3,h4{color:var(--sclad-primary)!important}a[href*="/apply"],a[href*="/login"]{background-color:var(--sclad-accent)!important;color:#fff!important}`;
}

function readScheme(html) {
  const block = String(html || "").match(/<style\b[^>]*id=["']sclad-scheme["'][^>]*>([\s\S]*?)<\/style>/i);
  const css = block?.[1] || "";
  const pick = (name, fallback) => {
    const found = css.match(new RegExp(`--sclad-${name}\\s*:\\s*(#[0-9a-f]{3,8})`, "i"));
    return found?.[1] || fallback;
  };
  const colors = {
    primary: pick("primary", DEFAULT_CUSTOM.primary),
    secondary: pick("secondary", DEFAULT_CUSTOM.secondary),
    accent: pick("accent", DEFAULT_CUSTOM.accent),
    background: pick("background", DEFAULT_CUSTOM.background),
    ink: pick("ink", DEFAULT_CUSTOM.ink),
  };
  const preset = SCHEMES.find((item) => SCHEME_FIELDS.every(([key]) => item[key].toLowerCase() === colors[key].toLowerCase()));
  return preset ? { ...preset } : { id: "custom", name: "Custom", ...colors };
}

const FONTS = [
  { id: "modern", name: "Modern", stack: '"Segoe UI", Helvetica, Arial, sans-serif', sample: "Clear and simple" },
  { id: "classic", name: "Classic", stack: 'Georgia, "Times New Roman", serif', sample: "Calm and traditional" },
  { id: "friendly", name: "Friendly", stack: '"Trebuchet MS", "Segoe UI", sans-serif', sample: "Warm and open" },
  { id: "editorial", name: "Editorial", stack: '"Palatino Linotype", Palatino, Georgia, serif', sample: "Quiet and literary" },
  { id: "clean", name: "Clean", stack: 'Calibri, "Segoe UI", sans-serif', sample: "Soft and even" },
  { id: "plain", name: "Plain", stack: 'Arial, Helvetica, sans-serif', sample: "Straight and familiar" },
  { id: "schoolbook", name: "Schoolbook", stack: '"Century Schoolbook", Georgia, serif', sample: "Made for reading" },
  { id: "book", name: "Book", stack: 'Cambria, Georgia, serif', sample: "Steady and formal" },
  { id: "soft", name: "Soft", stack: 'Candara, "Segoe UI", sans-serif', sample: "Light and kind" },
  { id: "open", name: "Open", stack: 'Verdana, Geneva, sans-serif', sample: "Wide and easy" },
  { id: "strong", name: "Strong", stack: '"Franklin Gothic Medium", "Arial Narrow", sans-serif', sample: "Bold and direct" },
  { id: "round", name: "Round", stack: '"Century Gothic", "Trebuchet MS", sans-serif', sample: "Airy and modern" },
  { id: "slab", name: "Slab", stack: 'Rockwell, "Rockwell Nova", Georgia, serif', sample: "Solid and grounded" },
  { id: "hand", name: "Hand", stack: '"Segoe Print", "Segoe Script", cursive', sample: "Written by hand" },
  { id: "script", name: "Script", stack: 'Gabriola, "Segoe Script", cursive', sample: "A formal signature" },
  { id: "news", name: "News", stack: '"Book Antiqua", Palatino, serif', sample: "Old and trusted" },
];

const BUILD_STEPS = [
  "Opening the screenshot",
  "Reading the image",
  "Finding the header",
  "Noting the colors",
  "Noting the type",
  "Describing the layout",
  "Listing the sections",
  "Checking the spacing",
  "Writing the HTML",
  "Placing the hero",
  "Styling the buttons",
  "Fitting a phone screen",
  "Building the page",
  "Checking the result",
];

const storageKey = (schoolId) => `sclad-brief-start:${schoolId || "school"}`;

function schoolToken() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null")?.token || "";
  } catch (_) {
    return "";
  }
}

function pageFileName(slug) {
  if (!slug || slug === "/") return "index.html";
  return `${String(slug).replace(/^\//, "").replace(/\//g, "-")}.html`;
}

function stripPageLinks(html) {
  return String(html || "").replace(/<a\b[^>]*\bsclad-page-link\b[^>]*>[\s\S]*?<\/a>/gi, "");
}

function onlyHome(list) {
  const pages = (list || []).filter((page) => page?.html);
  const home = pages.find((page) => page.slug === "/" || page.id === "home") || pages[0];
  if (!home) return [];
  return [{
    id: "home",
    title: "Home",
    slug: "/",
    html: stripPageLinks(home.html),
  }];
}

function unsetImageCount(html) {
  const tags = String(html || "").match(/<img\b[^>]*>/gi) || [];
  return tags.filter((tag) => {
    const src = (tag.match(/\bsrc\s*=\s*(["'])([\s\S]*?)\1/i) || [])[2] || "";
    return !src || /placehold\.co/i.test(src);
  }).length;
}

function readCleanHtml(frame) {
  const doc = frame?.contentDocument;
  if (!doc?.documentElement) return "";
  const clone = doc.documentElement.cloneNode(true);
  clone.querySelectorAll("#sclad-edit-style, #sclad-hover-box, #sclad-picked-bar, #sclad-image-add, .sclad-image-hit").forEach((node) => node.remove());
  clone.removeAttribute("data-sclad-bound");
  clone.removeAttribute("data-sclad-hover-on");
  clone.removeAttribute("data-sclad-hover-edge");
  clone.removeAttribute("data-sclad-select-on");
  clone.removeAttribute("data-sclad-image-add");
  clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  clone.querySelectorAll("[data-sclad-text]").forEach((node) => node.removeAttribute("data-sclad-text"));
  clone.querySelectorAll("[data-sclad-empty]").forEach((node) => node.removeAttribute("data-sclad-empty"));
  clone.querySelectorAll("[data-sclad-picked]").forEach((node) => node.removeAttribute("data-sclad-picked"));
  clone.querySelectorAll("[data-sclad-hover]").forEach((node) => node.removeAttribute("data-sclad-hover"));
  clone.querySelectorAll("[data-sclad-target]").forEach((node) => node.removeAttribute("data-sclad-target"));
  clone.querySelectorAll("[data-sclad-pass]").forEach((node) => node.removeAttribute("data-sclad-pass"));
  clone.querySelectorAll(".sclad-ai-pick").forEach((node) => node.classList.remove("sclad-ai-pick"));
  clone.querySelectorAll(".sclad-hover-edge").forEach((node) => node.classList.remove("sclad-hover-edge"));
  clone.querySelectorAll("[style]").forEach((node) => {
    node.style.removeProperty("outline");
    node.style.removeProperty("outline-offset");
  });
  return `<!doctype html>\n${clone.outerHTML}`;
}

function readMarkedPage(frame) {
  const doc = frame?.contentDocument;
  if (!doc?.documentElement) return null;
  const clone = doc.documentElement.cloneNode(true);
  clone.querySelectorAll("#sclad-edit-style, #sclad-hover-box, #sclad-picked-bar, #sclad-image-add, .sclad-image-hit").forEach((node) => node.remove());
  clone.removeAttribute("data-sclad-bound");
  clone.removeAttribute("data-sclad-hover-on");
  clone.removeAttribute("data-sclad-hover-edge");
  clone.removeAttribute("data-sclad-select-on");
  clone.removeAttribute("data-sclad-image-add");
  clone.querySelectorAll("[contenteditable]").forEach((node) => node.removeAttribute("contenteditable"));
  clone.querySelectorAll("[data-sclad-text]").forEach((node) => node.removeAttribute("data-sclad-text"));
  clone.querySelectorAll("[data-sclad-empty]").forEach((node) => node.removeAttribute("data-sclad-empty"));
  clone.querySelectorAll("[data-sclad-picked]").forEach((node) => node.removeAttribute("data-sclad-picked"));
  clone.querySelectorAll("[data-sclad-hover]").forEach((node) => node.removeAttribute("data-sclad-hover"));
  clone.querySelectorAll("[data-sclad-pass]").forEach((node) => node.removeAttribute("data-sclad-pass"));
  clone.querySelectorAll(".sclad-ai-pick").forEach((node) => node.classList.remove("sclad-ai-pick"));
  return clone;
}

function markImageOverlays(doc) {
  const pictures = [];
  doc.querySelectorAll("img").forEach((img) => {
    if (img.id !== "sclad-image-add") pictures.push(img);
  });
  doc.querySelectorAll("*").forEach((el) => {
    if (el.tagName === "IMG" || el.id === "sclad-hover-box") return;
    const bg = doc.defaultView?.getComputedStyle(el).backgroundImage || "";
    if (/url\(/i.test(bg)) pictures.push(el);
  });
  pictures.forEach((picture) => {
    const rect = picture.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) return;
    const points = [
      [rect.left + rect.width / 2, rect.top + rect.height / 2],
      [rect.left + Math.min(12, rect.width / 4), rect.top + Math.min(12, rect.height / 4)],
      [rect.right - Math.min(12, rect.width / 4), rect.bottom - Math.min(12, rect.height / 4)],
    ];
    points.forEach(([x, y]) => {
      const stack = doc.elementsFromPoint(x, y);
      for (const el of stack) {
        if (el === picture) break;
        if (!el || el === doc.body || el === doc.documentElement) continue;
        if (el.id === "sclad-hover-box") continue;
        if (picture.contains(el) || el.contains(picture)) continue;
        el.setAttribute("data-sclad-pass", "1");
      }
    });
  });
}

const TREE_SKIP = new Set(["SCRIPT", "STYLE", "LINK", "META", "BR", "WBR", "NOSCRIPT", "TEMPLATE", "SOURCE", "TRACK"]);

function buildLayoutTree(root) {
  const walk = (el, path) => {
    if (!el || el.nodeType !== 1) return null;
    if (TREE_SKIP.has(el.tagName)) return null;
    if (el.id === "sclad-hover-box" || el.id === "sclad-picked-bar" || el.id === "sclad-scheme" || el.classList?.contains("sclad-image-hit")) return null;
    if (el.tagName !== "svg" && el.closest?.("svg")) return null;
    const children = [];
    Array.from(el.children).forEach((child, index) => {
      const node = walk(child, path.concat(index));
      if (node) children.push(node);
    });
    const hasText = Array.from(el.childNodes).some((node) => node.nodeType === 3 && node.textContent.trim());
    const keep = children.length || hasText || ["IMG", "VIDEO", "SVG", "INPUT", "IFRAME"].includes(el.tagName);
    if (!keep) return null;
    if (!children.length && ["SPAN", "STRONG", "EM", "B", "I", "SMALL", "U", "MARK"].includes(el.tagName)) return null;
    return {
      path: path.join("."),
      id: el.getAttribute("data-sclad-target") || `path:${path.join(".")}`,
      label: elementChipLabel(el),
      children,
    };
  };
  const top = [];
  Array.from(root.children || []).forEach((child, index) => {
    const node = walk(child, [index]);
    if (node) top.push(node);
  });
  return top;
}

function elementAtPath(body, pathKey) {
  let el = body;
  String(pathKey || "").split(".").forEach((part) => {
    el = el?.children?.[Number(part)] || null;
  });
  return el;
}

function LayoutBranch({ node, depth, selectedId, onPick }) {
  const hasKids = node.children.length > 0;
  const [open, setOpen] = useState(false);
  return (
    <li>
      <div className={`wbp-tree-row${node.id === selectedId ? " is-on" : ""}`}>
        {hasKids ? (
          <button type="button" className={`wbp-tree-toggle${open ? " is-open" : ""}`} aria-label={open ? "Collapse" : "Expand"} onClick={() => setOpen((value) => !value)} />
        ) : (
          <span className="wbp-tree-toggle is-empty" />
        )}
        <button type="button" className="wbp-tree-name" onClick={() => onPick(node)}>{node.label}</button>
      </div>
      {hasKids && open && (
        <ul>
          {node.children.map((child) => (
            <LayoutBranch key={child.path} node={child} depth={depth + 1} selectedId={selectedId} onPick={onPick} />
          ))}
        </ul>
      )}
    </li>
  );
}

function elementChipLabel(el) {
  const names = {
    H1: "Heading", H2: "Heading", H3: "Heading", H4: "Heading",
    P: "Text", A: "Link", BUTTON: "Button", IMG: "Image",
    SECTION: "Section", HEADER: "Header", NAV: "Nav", FOOTER: "Footer",
    LI: "Item", DIV: "Block", SPAN: "Text",
  };
  if (el.tagName === "IMG") return el.getAttribute("alt")?.trim() || "Image";
  const title = names[el.tagName] || el.tagName.toLowerCase();
  const text = (el.innerText || "").replace(/\s+/g, " ").trim();
  return text ? `${title}: ${text.slice(0, 32)}` : title;
}

const TEXT_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "A", "BUTTON", "LI", "LABEL", "STRONG", "EM", "B", "I", "FIGCAPTION", "TD", "TH", "SMALL", "BLOCKQUOTE"]);
const FONT_OPTIONS = [
  ["Arial, sans-serif", "Arial"],
  ["Inter, sans-serif", "Inter"],
  ["Roboto, sans-serif", "Roboto"],
  ["Poppins, sans-serif", "Poppins"],
  ["Georgia, serif", "Georgia"],
  ["Times New Roman, serif", "Times New Roman"],
  ["Verdana, sans-serif", "Verdana"],
];
const SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "64px"];

function toHex(color) {
  const match = String(color || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
  if (!match) return /^#[0-9a-f]{3,8}$/i.test(color) ? color.slice(0, 7) : "#111111";
  if (match[4] !== undefined && Number(match[4]) === 0) return "#ffffff";
  return `#${[match[1], match[2], match[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

function nearest(value, options) {
  const number = parseFloat(value);
  if (Number.isNaN(number)) return options[0];
  return options.reduce((best, item) => (Math.abs(item - number) < Math.abs(best - number) ? item : best));
}

function readSelection(el) {
  const cs = el.ownerDocument.defaultView.getComputedStyle(el);
  const kind = el.tagName === "IMG" ? "image" : TEXT_TAGS.has(el.tagName) ? "text" : "box";
  const fontSize = `${Math.round(parseFloat(cs.fontSize) || 16)}px`;
  const family = FONT_OPTIONS.find(([stack, name]) => cs.fontFamily.toLowerCase().includes(name.toLowerCase()));
  const lineHeight = cs.lineHeight === "normal"
    ? "1.5"
    : String(nearest(String(cs.lineHeight).includes("px") ? parseFloat(cs.lineHeight) / (parseFloat(cs.fontSize) || 16) : cs.lineHeight, [1, 1.15, 1.3, 1.5, 1.6, 1.8, 2]));
  const weight = String(nearest(cs.fontWeight, [400, 500, 600, 700]));
  const decoration = ["underline", "overline", "line-through"].find((item) => cs.textDecorationLine?.includes(item) || cs.textDecoration?.includes(item)) || "none";
  const shadow = !cs.textShadow || cs.textShadow === "none"
    ? "none"
    : (cs.textShadow.includes("8px") ? "0 2px 8px rgba(0,0,0,0.35)" : "0 1px 2px rgba(0,0,0,0.25)");
  const boxShadow = !cs.boxShadow || cs.boxShadow === "none"
    ? "none"
    : "0 8px 24px rgba(0,0,0,0.18)";
  const styles = {
    fontFamily: family ? family[0] : FONT_OPTIONS[0][0],
    fontSize: SIZE_OPTIONS.includes(fontSize) ? fontSize : fontSize,
    fontWeight: weight,
    color: toHex(cs.color),
    lineHeight,
    letterSpacing: cs.letterSpacing === "normal" ? "0px" : `${nearest(cs.letterSpacing, [0, 0.5, 1, 2, 4])}px`,
    textAlign: ["left", "center", "right", "justify"].includes(cs.textAlign) ? cs.textAlign : "left",
    textDecoration: decoration,
    textTransform: ["uppercase", "lowercase", "capitalize"].includes(cs.textTransform) ? cs.textTransform : "none",
    fontStyle: cs.fontStyle === "italic" ? "italic" : "normal",
    textShadow: shadow,
    opacity: String(Math.round((parseFloat(cs.opacity) || 1) * 100) / 100),
    whiteSpace: cs.whiteSpace === "nowrap" ? "nowrap" : "normal",
    textOverflow: cs.textOverflow === "ellipsis" ? "ellipsis" : "clip",
    direction: cs.direction === "rtl" ? "rtl" : "ltr",
    display: cs.display || "block",
    flexDirection: cs.flexDirection || "row",
    width: el.style.getPropertyValue("width") || "auto",
    height: el.style.getPropertyValue("height") || "auto",
    minWidth: cs.minWidth === "0px" ? "" : cs.minWidth,
    maxWidth: cs.maxWidth === "none" ? "" : cs.maxWidth,
    minHeight: cs.minHeight === "0px" ? "" : cs.minHeight,
    maxHeight: cs.maxHeight === "none" ? "" : cs.maxHeight,
    margin: cs.margin || "",
    padding: cs.padding || "",
    gap: cs.gap === "normal" ? "" : cs.gap,
    alignItems: cs.alignItems || "stretch",
    justifyContent: cs.justifyContent || "flex-start",
    flexWrap: cs.flexWrap || "nowrap",
    backgroundColor: toHex(cs.backgroundColor),
    backgroundImage: /url\(/i.test(cs.backgroundImage) ? "image" : "",
    border: cs.border && cs.borderStyle !== "none" ? `${cs.borderWidth} ${cs.borderStyle} ${toHex(cs.borderColor)}` : "",
    borderRadius: cs.borderRadius === "0px" ? "" : cs.borderRadius,
    position: cs.position || "static",
    top: cs.top === "auto" ? "" : cs.top,
    right: cs.right === "auto" ? "" : cs.right,
    bottom: cs.bottom === "auto" ? "" : cs.bottom,
    left: cs.left === "auto" ? "" : cs.left,
    zIndex: cs.zIndex === "auto" ? "" : cs.zIndex,
    overflow: cs.overflow || "visible",
    boxShadow,
    objectFit: cs.objectFit || "cover",
    objectPosition: (cs.objectPosition || "center").split(" ")[0] || "center",
    aspectRatio: cs.aspectRatio === "auto" ? "" : cs.aspectRatio,
    imageAlign: "left",
    alt: el.getAttribute("alt") || "",
    src: el.getAttribute("src") ? "image" : "",
  };
  return {
    kind,
    leaf: el.children.length === 0,
    styles,
  };
}

function ensureWebFonts(doc) {
  if (!doc || doc.getElementById("sclad-webfonts")) return;
  const link = doc.createElement("link");
  link.id = "sclad-webfonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap";
  doc.head.appendChild(link);
}

function FieldIcon({ name }) {
  const paths = {
    font: "M4 20V6h2.2l3.3 10h.1L13 6h2.2v14h-1.8v-10h-.1l-3 9.2h-1.4L6 10h-.1v10H4z",
    size: "M6 18V8h2v10H6zm5 0V4h2v14h-2zm5 0v-6h2v6h-2z",
    weight: "M5 18V6h3.2a4 4 0 0 1 0 8H7v4H5zm2-6h1.1a2.2 2.2 0 0 0 0-4.4H7V12z",
    color: "M12 3a9 9 0 1 0 0 18 4 4 0 0 0 0-8h-1.2a1.2 1.2 0 0 1 0-2.4H12a2.2 2.2 0 0 0 0-4.4",
    lines: "M4 7h16M4 12h16M4 17h10",
    letters: "M4 8h6M8 8v8M14 8h6M14 12h4M14 16h6",
    align: "M4 7h16M7 12h10M5 17h14",
    underline: "M7 5v6a5 5 0 0 0 10 0V5M5 19h14",
    case: "M5 17l4-10h1.2l4 10M7 13h5M16 17V8h1.4l2.6 6 2.6-6H24",
    italic: "M10 6h8M8 18h8M13 6l-2 12",
    shadow: "M6 16a6 6 0 1 1 8-8 6 6 0 0 1 4 10",
    fade: "M4 12h16M12 6v12",
    wrap: "M5 7h14M5 12h10a3 3 0 0 1 0 6H8",
    cut: "M5 8h14M5 12h8M16 12l3 3M5 16h6",
    read: "M5 7h6M5 12h10M5 17h8M16 8l3 4-3 4",
    layout: "M4 5h7v6H4V5zm9 0h7v6h-7V5zM4 13h16v6H4v-6z",
    flow: "M5 8h6M14 8h5M8 8v8M5 16h14",
    width: "M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3",
    height: "M12 4v16M9 7l3-3 3 3M9 17l3 3 3-3",
    outside: "M8 8h8v8H8zM4 4h4M16 4h4M4 20h4M16 20h4",
    inside: "M5 5h14v14H5zM9 9h6v6H9z",
    gap: "M5 6h4v12H5zM15 6h4v12h-4z",
    lineup: "M6 16V8M12 18V6M18 14v-4",
    spread: "M5 8v8M19 8v8M9 12h6",
    photo: "M5 6h14v12H5zM8 14l2.2-2.5L13 15l2-2 2 2",
    border: "M6 6h12v12H6z",
    round: "M8 6h8a4 4 0 0 1 4 4v8",
    pin: "M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z",
    stack: "M6 16l6 3 6-3M6 12l6 3 6-3M6 8l6 3 6-3",
    spill: "M6 6h12v6H6zM8 16h8",
    picture: "M4 6h16v12H4zM8 14l2-2 2 2 3-3 2 2",
    note: "M7 5h8l3 3v11H7zM15 5v3h3",
    shape: "M6 16l6-9 6 9H6z",
  };
  return (
    <svg className="wbp-field-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.layout} />
    </svg>
  );
}

function optionList(field, value) {
  const options = field.options || [];
  const known = options.some((item) => (Array.isArray(item) ? item[0] : item) === value);
  if (known || value === "" || value == null) return options;
  return [[value, "Custom"], ...options];
}

function StyleFields({ fields, styles, onChange, onPickImage }) {
  let lastGroup = "";
  const main = [];
  const more = [];
  fields.forEach((field) => (field.more ? more : main).push(field));
  const renderField = (field) => {
    const value = styles?.[field.key] ?? "";
    const showGroup = field.group && field.group !== lastGroup;
    if (field.group) lastGroup = field.group;
    const title = (
      <span className="wbp-field-name">
        <FieldIcon name={field.icon} />
        {field.label}
      </span>
    );
    let control = null;
    if (field.type === "image") {
      control = <button type="button" className="wbp-pick" onClick={onPickImage}>{value ? "Change picture" : "Add a picture"}</button>;
    } else if (field.type === "chips" || field.type === "select") {
      control = (
        <div className={`wbp-chips${field.wide ? " is-wide" : ""}`}>
          {optionList(field, value).map((item) => {
            const option = Array.isArray(item) ? item[0] : item;
            const name = Array.isArray(item) ? item[1] : item;
            return (
              <button
                key={option}
                type="button"
                className={option === value ? "is-on" : ""}
                style={field.preview === "font" ? { fontFamily: option } : undefined}
                onClick={() => onChange(field.key, option)}
              >
                {name}
              </button>
            );
          })}
        </div>
      );
    } else if (field.type === "color") {
      control = (
        <span className="wbp-color">
          <input type="color" aria-label={field.label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#111111"} onChange={(event) => onChange(field.key, event.target.value)} />
          <em>Tap the circle</em>
        </span>
      );
    } else if (field.type === "words") {
      control = (
        <input
          className="wbp-words"
          type="text"
          value={value}
          placeholder={field.placeholder || "A short description"}
          onChange={(event) => onChange(field.key, event.target.value)}
        />
      );
    } else if (field.type === "measure") {
      const parsed = String(value || "").trim().match(/^(\d*\.?\d+)(%|vh|vw)$/i);
      const number = parsed ? parsed[1] : "";
      const unit = parsed ? parsed[2].toLowerCase() : "";
      const setMeasure = (nextNumber, nextUnit) => {
        const amount = String(nextNumber ?? "").trim();
        const chosen = nextUnit || unit || "%";
        onChange(field.key, amount ? `${amount}${chosen}` : "auto");
      };
      control = (
        <div className="wbp-measure">
          <span className="wbp-fade">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              aria-label={field.label}
              value={number || 0}
              onChange={(event) => setMeasure(event.target.value, unit || "%")}
            />
            <input
              className="wbp-words"
              type="number"
              min="0"
              max="100"
              value={number}
              placeholder="100"
              onChange={(event) => setMeasure(event.target.value, unit || "%")}
            />
          </span>
          <div className="wbp-chips">
            {[["%", "% of the parent"], ["vw", "Screen width"], ["vh", "Screen height"]].map(([option, name]) => (
              <button key={option} type="button" className={unit === option ? "is-on" : ""} onClick={() => setMeasure(number || "100", option)}>
                {name}
              </button>
            ))}
            <button type="button" className={!unit ? "is-on" : ""} onClick={() => onChange(field.key, "auto")}>Auto</button>
          </div>
        </div>
      );
    } else if (field.type === "range") {
      control = (
        <span className="wbp-fade">
          <i>Clear</i>
          <input type="range" min="0" max="1" step="0.05" value={value || 1} onChange={(event) => onChange(field.key, event.target.value)} />
          <i>Solid</i>
        </span>
      );
    } else {
      control = (
        <div className="wbp-chips">
          {optionList(field, value).map((item) => {
            const option = Array.isArray(item) ? item[0] : item;
            const name = Array.isArray(item) ? item[1] : item;
            return (
              <button key={option || "empty"} type="button" className={option === value ? "is-on" : ""} onClick={() => onChange(field.key, option)}>
                {name}
              </button>
            );
          })}
        </div>
      );
    }
    return (
      <div key={field.key} className="wbp-field">
        {showGroup && <p className="wbp-style-group">{field.group}</p>}
        <label>
          {title}
          {control}
        </label>
      </div>
    );
  };
  return (
    <div className="wbp-style-fields">
      {main.map(renderField)}
      {more.length > 0 && (
        <details className="wbp-more">
          <summary>More options</summary>
          {more.map(renderField)}
        </details>
      )}
    </div>
  );
}

const TEXT_FIELDS = [
  { pane: "style", group: "Look", key: "fontFamily", icon: "font", label: "Font", type: "chips", preview: "font", wide: true, options: FONT_OPTIONS },
  { pane: "style", key: "fontSize", icon: "size", label: "Size", type: "chips", options: [["14px", "Small"], ["16px", "Normal"], ["20px", "Large"], ["28px", "Big"], ["40px", "Huge"], ["64px", "Poster"]] },
  { pane: "style", key: "fontWeight", icon: "weight", label: "Thickness", type: "chips", options: [["400", "Regular"], ["500", "Medium"], ["600", "Strong"], ["700", "Bold"]] },
  { pane: "style", key: "color", icon: "color", label: "Text color", type: "color" },
  { pane: "style", key: "fontStyle", icon: "italic", label: "Slant", type: "chips", options: [["normal", "Upright"], ["italic", "Italic"]] },
  { pane: "layout", group: "Spacing", key: "lineHeight", icon: "lines", label: "Space between lines", type: "chips", options: [["1.15", "Tight"], ["1.5", "Comfortable"], ["1.8", "Roomy"], ["2", "Loose"]] },
  { pane: "layout", key: "letterSpacing", icon: "letters", label: "Space between letters", type: "chips", options: [["0px", "Normal"], ["1px", "Open"], ["2px", "Wide"], ["4px", "Very wide"]] },
  { pane: "layout", key: "textAlign", icon: "align", label: "Line up", type: "chips", options: [["left", "Left"], ["center", "Center"], ["right", "Right"], ["justify", "Even"]] },
  { pane: "style", group: "Style", key: "textDecoration", icon: "underline", label: "Line on the words", type: "chips", options: [["none", "None"], ["underline", "Underline"], ["line-through", "Strike"]] },
  { pane: "style", key: "textTransform", icon: "case", label: "Capital letters", type: "chips", options: [["none", "As typed"], ["uppercase", "CAPITALS"], ["lowercase", "lowercase"], ["capitalize", "Title Case"]] },
  { pane: "style", key: "textShadow", icon: "shadow", label: "Shadow", type: "chips", options: [["none", "None"], ["0 1px 2px rgba(0,0,0,0.25)", "Soft"], ["0 2px 8px rgba(0,0,0,0.35)", "Strong"]] },
  { pane: "style", key: "opacity", icon: "fade", label: "See-through", type: "range" },
  { pane: "layout", key: "whiteSpace", icon: "wrap", label: "Long lines", type: "chips", options: [["normal", "Wrap"], ["nowrap", "One line"]] },
  { pane: "style", key: "textOverflow", icon: "cut", label: "If it does not fit", type: "chips", options: [["clip", "Cut off"], ["ellipsis", "End with ..."]] },
  { pane: "layout", key: "direction", icon: "read", label: "Reading direction", type: "chips", more: true, options: [["ltr", "Left to right"], ["rtl", "Right to left"]] },
];

const BOX_FIELDS = [
  { pane: "layout", group: "Arrange", key: "display", icon: "layout", label: "How items sit", type: "chips", wide: true, options: [["block", "Stacked"], ["flex", "Side by side"], ["grid", "Grid"], ["none", "Hidden"]] },
  { pane: "layout", key: "flexDirection", icon: "flow", label: "Which way", type: "chips", options: [["row", "Across"], ["column", "Down"]] },
  { pane: "layout", key: "alignItems", icon: "lineup", label: "Line them up", type: "chips", options: [["flex-start", "Start"], ["center", "Middle"], ["flex-end", "End"], ["stretch", "Stretch"]] },
  { pane: "layout", key: "justifyContent", icon: "spread", label: "Spread them", type: "chips", options: [["flex-start", "Start"], ["center", "Middle"], ["space-between", "Apart"], ["space-evenly", "Even"]] },
  { pane: "layout", key: "flexWrap", icon: "wrap", label: "If they do not fit", type: "chips", options: [["nowrap", "One line"], ["wrap", "Next line"]] },
  { pane: "layout", group: "Size", key: "width", icon: "width", label: "Width", type: "measure" },
  { pane: "layout", key: "height", icon: "height", label: "Height", type: "measure" },
  { pane: "layout", group: "Space", key: "padding", icon: "inside", label: "Space inside", type: "chips", options: [["0px", "None"], ["12px", "Tight"], ["24px", "Comfy"], ["40px", "Roomy"]] },
  { pane: "layout", key: "margin", icon: "outside", label: "Space outside", type: "chips", options: [["0px", "None"], ["12px", "Tight"], ["24px", "Comfy"], ["40px", "Roomy"]] },
  { pane: "layout", key: "gap", icon: "gap", label: "Space between", type: "chips", options: [["0px", "None"], ["8px", "Tight"], ["16px", "Comfy"], ["28px", "Roomy"]] },
  { pane: "style", group: "Look", key: "backgroundColor", icon: "color", label: "Fill color", type: "color" },
  { pane: "style", key: "backgroundImage", icon: "photo", label: "Picture behind it", type: "image" },
  { pane: "style", key: "borderRadius", icon: "round", label: "Corners", type: "chips", options: [["0px", "Square"], ["12px", "Soft"], ["24px", "Round"], ["999px", "Pill"]] },
  { pane: "style", key: "border", icon: "border", label: "Outline", type: "chips", options: [["none", "None"], ["1px solid #111111", "Thin"], ["3px solid #111111", "Bold"]] },
  { pane: "style", key: "boxShadow", icon: "shadow", label: "Shadow", type: "chips", options: [["none", "None"], ["0 8px 24px rgba(0,0,0,0.18)", "Soft"]] },
  { pane: "style", key: "opacity", icon: "fade", label: "See-through", type: "range" },
  { pane: "layout", key: "minWidth", icon: "width", label: "Smallest width", type: "chips", more: true, options: [["", "None"], ["160px", "Small"], ["320px", "Medium"]] },
  { pane: "layout", key: "maxWidth", icon: "width", label: "Widest", type: "chips", more: true, options: [["", "None"], ["640px", "Medium"], ["960px", "Wide"]] },
  { pane: "layout", key: "position", icon: "pin", label: "Where it sits", type: "chips", more: true, wide: true, options: [["static", "In the flow"], ["relative", "Nudge"], ["absolute", "Float"], ["sticky", "Stick"]] },
  { pane: "layout", key: "overflow", icon: "spill", label: "If content spills", type: "chips", more: true, options: [["visible", "Show"], ["hidden", "Hide"], ["auto", "Scroll"]] },
];

const IMAGE_FIELDS = [
  { pane: "style", group: "Picture", key: "src", icon: "picture", label: "Picture", type: "image" },
  { pane: "style", key: "alt", icon: "note", label: "What the picture shows", type: "words", placeholder: "Pupils in class" },
  { pane: "layout", group: "Size", key: "width", icon: "width", label: "Width", type: "measure" },
  { pane: "layout", key: "height", icon: "height", label: "Height", type: "measure" },
  { pane: "style", group: "Fit", key: "objectFit", icon: "photo", label: "How it fills", type: "chips", wide: true, options: [["cover", "Fill and crop"], ["contain", "Show it all"], ["fill", "Stretch"]] },
  { pane: "layout", key: "objectPosition", icon: "pin", label: "Keep this part", type: "chips", options: [["center", "Middle"], ["top", "Top"], ["bottom", "Bottom"], ["left", "Left"], ["right", "Right"]] },
  { pane: "style", key: "aspectRatio", icon: "shape", label: "Shape", type: "chips", options: [["auto", "Free"], ["1 / 1", "Square"], ["4 / 3", "Photo"], ["16 / 9", "Wide"]] },
  { pane: "layout", key: "imageAlign", icon: "align", label: "Place", type: "chips", options: [["left", "Left"], ["center", "Center"], ["right", "Right"]] },
];

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not read that image"));
      image.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function saveDraftPages(schoolId, pages) {
  const token = schoolToken();
  const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/draft`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      pages: pages.map((page, index) => ({
        id: page.id || (index === 0 ? "home" : `page_${index}`),
        title: page.title || "Home",
        slug: page.slug || (index === 0 ? "/" : `/${page.id || index}`),
        order: index,
        html: page.html || "",
      })),
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Could not save the draft");
  return data;
}

const DEFAULT_SITE_PROMPT = `Build one long scrolling school website for this school. Do not create a second page, and do not link to about.html, team.html, fees.html, or any other file. Every part of the site lives on this single page. The writing should feel warm, clear, and proud, like a real school speaking to parents. Use the school’s real name. Write several sentences in each section, not a single short line. Avoid empty phrases such as “welcome to our world-class institution.” Say something specific a parent would want to know.

The navbar shows the school logo, then the school name, then only these five links: About, Academics, Team, Fees, Contact. Do not add a sixth link. Each of those five links scrolls to its section on this same page. About goes to #about, Academics goes to #academics, Team goes to #team, Fees goes to #fees, and Contact goes to #contact. They must not open another page. Apply and Login stay as buttons, separate from those five links. On a phone, the bar is one calm row with the logo, the school name, and a menu button. The five links, Apply, and Login sit inside that menu.

Home is a full-screen hero. It fills the first screen. Show the school name in large type, then the motto, then a welcome paragraph of three or four sentences about the kind of students the school raises and the care parents can expect. Under that, place an Apply button and a second text link that scrolls to About. The hero picture uses object-fit:cover so it fills the frame.

About tells the school’s story. Open with a paragraph on when the school serves families and what it believes a good education looks like. Follow with three longer points: character, learning, and community. Each point gets a heading and two or three sentences. Close the section with one paragraph on how teachers know the children by name and how the school works with parents.

Academics explains what children learn. Introduce the section with a paragraph on a calm, structured school day. Then describe the stages the school offers, such as early years, primary, and secondary, or the classes this school actually runs. Give each stage a heading and a short paragraph on the subjects, the habits children practise, and how teachers help a child who is finding a subject hard. End with a sentence inviting parents to ask about the right class for their child.

Team introduces the people who look after the children. Open with a paragraph about a staff that knows the pupils and works as one school. Then show several people: the head of the school, a senior teacher, and two or three class teachers or other staff. For each person, give a name, a role, and two sentences on what they care about in the classroom or in the running of the school. If a photo is needed, use a placeholder with object-fit:cover. Do not leave this section as a single line.

Fees is a School Fees section. Start with two sentences explaining that the list is a guide and that the school office confirms the current figure before a child starts. Then show a clear list or table in Nigerian naira, using the ₦ sign. Include lines a parent expects, such as tuition, books, uniform, and other school charges, with a short note under each line about what it covers. Do not invent a payment form. Add one sentence that says families can ask the office about a payment plan.

Admissions explains how a child joins. It is on the page, but it is not one of the five navbar links. Write an opening paragraph about visiting the school and asking questions. Then set out three steps in full sentences: enquire, visit, and apply. Each step should say what the parent does and what the school does next. Place an Apply button at the end of the section, with a line that says the button opens the school’s application page.

Contact closes the page. Write a short paragraph inviting parents to call, email, or visit. Show the school address, phone number, and email. Do not add an input form. Under the details, add one sentence about office hours on school days.

Keep the same five header links and this section order from top to bottom: Home, About, Academics, Team, Fees, Admissions, Contact. The footer repeats the school name and the phone number.`;

const emptyDraft = {
  step: "welcome",
  color: "#1e3a5f",
  schemeId: "navy",
  customScheme: { ...DEFAULT_CUSTOM },
  fontId: "classic",
  templateId: "",
  customName: "",
  sitePrompt: DEFAULT_SITE_PROMPT,
};

const WebsiteBriefPage = ({ aiOnly = false }) => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const notifyError = (message) => {
    const text = String(message || "").trim();
    if (text) addNotification(text, "error");
  };
  const [draft, setDraft] = useState(aiOnly ? { ...emptyDraft, step: "page" } : emptyDraft);
  const [ready, setReady] = useState(false);
  const [customImage, setCustomImage] = useState("");
  const [helloOn, setHelloOn] = useState(false);
  const [templateImages, setTemplateImages] = useState([]);
  const [shot, setShot] = useState(null);
  const [phase, setPhase] = useState("in");
  const [creating, setCreating] = useState(false);
  const [pages, setPages] = useState([]);
  const [pageTab, setPageTab] = useState(0);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [logLines, setLogLines] = useState([]);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPicked, setAiPicked] = useState(false);
  const pagesRef = useRef([]);
  const frameRef = useRef(null);
  const imageTargetRef = useRef(null);
  const imageFileRef = useRef(null);
  const imageAddBtnRef = useRef(null);
  const imageHoldRef = useRef(false);
  const saveTimerRef = useRef(null);
  const historyTimerRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const [histTick, setHistTick] = useState(0);
  const saveGenRef = useRef(0);
  const [savingDraft, setSavingDraft] = useState(false);
  const ownEditRef = useRef(false);
  const aiOpenRef = useRef(false);
  const editOpenRef = useRef(false);
  const [selectedEl, setSelectedEl] = useState(null);
  const aiFieldRef = useRef(null);
  const aiCaretRef = useRef(null);
  const [frameHtml, setFrameHtml] = useState("");
  const [resetWarn, setResetWarn] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState("layout");
  const [drawerShut, setDrawerShut] = useState(true);
  const drawerRef = useRef(null);
  const [layoutNodes, setLayoutNodes] = useState([]);
  const refreshLayoutRef = useRef(() => {});
  const commitFrameRef = useRef(() => {});
  const applyPickRef = useRef(() => {});
  const pickedBarPosRef = useRef(() => {});
  const [pickedBar, setPickedBar] = useState(null);
  const [editorScheme, setEditorScheme] = useState(null);
  pagesRef.current = pages;

  useEffect(() => {
    if (aiOnly) {
      setReady(true);
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(schoolId)) || "null");
      if (saved?.step) {
        setDraft({
          ...emptyDraft,
          ...saved,
          schemeId: saved.schemeId || SCHEMES.find((item) => item.primary === saved.color)?.id || "navy",
          sitePrompt: String(saved.sitePrompt || "").trim() ? saved.sitePrompt : DEFAULT_SITE_PROMPT,
          step: saved.step === "creating" ? "template" : saved.step,
        });
      }
    } catch (_) {}
    setReady(true);
  }, [schoolId, aiOnly]);

  useEffect(() => {
    if (!ready || aiOnly) return;
    const { step, color, schemeId, customScheme, fontId, templateId, customName, sitePrompt } = draft;
    localStorage.setItem(
      storageKey(schoolId),
      JSON.stringify({
        step: step === "creating" ? "brief" : step,
        color,
        schemeId,
        customScheme,
        fontId,
        templateId,
        customName,
        sitePrompt,
      }),
    );
  }, [draft, ready, schoolId]);

  useEffect(() => {
    if (!ready || draft.step !== "page" || pagesRef.current.length) return;
    let cancelled = false;
    setLoadingDraft(true);
    const token = schoolToken();
    fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/draft`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const loaded = onlyHome(data?.data?.pages || []);
        if (loaded.length) {
          setPages(loaded);
          return;
        }
        if (!aiOnly) {
          setPages([]);
          setFrameHtml("");
          setDraft(emptyDraft);
          localStorage.removeItem(storageKey(schoolId));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingDraft(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, draft.step, schoolId]);

  useEffect(() => {
    if (ownEditRef.current) {
      window.setTimeout(() => { ownEditRef.current = false; }, 0);
      return;
    }
    const html = pages[pageTab]?.html || "";
    setFrameHtml(html);
    if (html && historyRef.current.length === 0) {
      historyRef.current = [html];
      historyIndexRef.current = 0;
      setHistTick((n) => n + 1);
    }
  }, [pages, pageTab]);

  useEffect(() => {
    fetch(`${API_BASE}/api/brief-template-images`)
      .then((res) => res.json())
      .then((data) => setTemplateImages(data?.data || []))
      .catch(() => setTemplateImages([]));
  }, []);

  useEffect(() => {
    if (draft.step !== "welcome") return;
    const t = setTimeout(() => setHelloOn(true), 80);
    return () => clearTimeout(t);
  }, [draft.step]);

  useEffect(() => {
    const html = pages[0]?.html || "";
    if (!html || editorScheme) return;
    setEditorScheme(readScheme(html));
  }, [pages, editorScheme]);

  const paintScheme = (next) => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.head) {
      let style = doc.getElementById("sclad-scheme");
      if (!style) {
        style = doc.createElement("style");
        style.id = "sclad-scheme";
        doc.head.appendChild(style);
      }
      style.textContent = schemeCss(next);
    }
    setEditorScheme(next);
    commitFrame();
  };
  const font = FONTS.find((item) => item.id === draft.fontId) || FONTS[1];
  const scheme = activeScheme(draft);
  const pageScheme = editorScheme || scheme;
  const homeTemplates = templateImages.filter((item) => item.kind !== "other");
  const picked = homeTemplates.find((item) => item.image_id === draft.templateId)
    || templateImages.find((item) => item.image_id === draft.templateId);

  useEffect(() => {
    aiOpenRef.current = aiOpen;
    editOpenRef.current = editOpen;
    const doc = frameRef.current?.contentDocument;
    const body = doc?.body;
    if (body) {
      body.classList.toggle("sclad-ai-pick", aiOpen || editOpen);
      if (!aiOpen && !editOpen) {
        body.querySelectorAll("[data-sclad-picked]").forEach((node) => node.removeAttribute("data-sclad-picked"));
        const box = doc.getElementById("sclad-hover-box");
        if (box) box.style.display = "none";
        doc.documentElement._scladClearEdge?.();
        doc.documentElement._scladPlaceBar?.();
      }
      if ((aiOpen || editOpen) && imageAddBtnRef.current) imageAddBtnRef.current.style.display = "none";
      doc.documentElement._scladSyncHits?.();
    }
    if (!editOpen) {
      setSelectedEl(null);
      setEditTab("layout");
    }
  }, [aiOpen, editOpen]);

  const rememberAiCaret = () => {
    const field = aiFieldRef.current;
    const selection = window.getSelection();
    if (!field || !selection?.rangeCount || !field.contains(selection.anchorNode)) return;
    aiCaretRef.current = selection.getRangeAt(0).cloneRange();
  };

  const insertAiChip = (label, targetId) => {
    const field = aiFieldRef.current;
    if (!field) return;
    const chip = document.createElement("span");
    chip.className = "wbp-ai-chip";
    chip.contentEditable = "false";
    chip.textContent = label;
    if (targetId) chip.dataset.target = targetId;
    const selection = window.getSelection();
    const inside = selection?.rangeCount && field.contains(selection.anchorNode);
    const range = inside
      ? selection.getRangeAt(0)
      : aiCaretRef.current?.cloneRange();
    field.focus();
    const space = document.createTextNode("\u00a0");
    const frag = document.createDocumentFragment();
    frag.appendChild(chip);
    frag.appendChild(space);
    if (range && field.contains(range.startContainer)) {
      range.deleteContents();
      range.insertNode(frag);
      range.setStartAfter(space);
      range.collapse(true);
      const next = window.getSelection();
      next.removeAllRanges();
      next.addRange(range);
      aiCaretRef.current = range.cloneRange();
    } else {
      field.appendChild(chip);
      field.appendChild(space);
    }
    setAiPicked(true);
    requestAnimationFrame(() => {
      field.focus();
      const caret = window.getSelection();
      if (!caret) return;
      const range = document.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      caret.removeAllRanges();
      caret.addRange(range);
      aiCaretRef.current = range.cloneRange();
    });
  };

  const go = (step) => {
    if (phase === "out") return;
    setPhase("out");
    window.setTimeout(() => {
      setDraft((prev) => ({ ...prev, step }));
      setPhase("in");
    }, 340);
  };

  const startBuildLog = () => {
    setLogLines([{ id: 0, text: BUILD_STEPS[0], restart: false }]);
    let step = 0;
    let id = 0;
    return window.setInterval(() => {
      if (step >= BUILD_STEPS.length - 1) {
        id += 1;
        const restartId = id;
        setLogLines((prev) => [
          ...prev,
          { id: restartId, text: "Seen an issue. Restarting to continue the loop.", restart: true },
        ]);
        step = -1;
        return;
      }
      step += 1;
      id += 1;
      const nextId = id;
      const text = BUILD_STEPS[step];
      setLogLines((prev) => [...prev, { id: nextId, text, restart: false }]);
    }, 4000);
  };

  const createSite = async () => {
    const image = draft.templateId === "custom" ? customImage : picked?.image;
    if (!image || creating) return;
    setCreating(true);
    const tick = startBuildLog();
    go("creating");
    try {
      let token = "";
      try {
        token = JSON.parse(sessionStorage.getItem("user") || "null")?.token || "";
      } catch (_) {}
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/create-site`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          image,
          color: scheme.primary,
          colors: {
            primary: scheme.primary,
            secondary: scheme.secondary,
            accent: scheme.accent,
            background: scheme.background,
            ink: scheme.ink,
          },
          fontName: font.name,
          fontStack: font.stack,
          prompt: String(draft.sitePrompt || "").trim(),
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not create the site");
      const created = onlyHome(data.pages || []);
      try {
        await saveDraftPages(schoolId, created);
      } catch (_) {}
      window.clearInterval(tick);
      setPages(created);
      setPageTab(0);
      window.setTimeout(() => go("page"), 700);
    } catch (err) {
      window.clearInterval(tick);
      notifyError(err.message);
      go("brief");
    } finally {
      setCreating(false);
    }
  };

  const onCustomFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomImage(String(reader.result || ""));
      setDraft((prev) => ({
        ...prev,
        templateId: "custom",
        customName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const startOver = () => {
    window.clearTimeout(saveTimerRef.current);
    window.clearTimeout(historyTimerRef.current);
    setCustomImage("");
    setHelloOn(false);
    setPages([]);
    setFrameHtml("");
    historyRef.current = [];
    historyIndexRef.current = -1;
    setPublishedUrl("");
    setResetWarn(false);
    setDraft(emptyDraft);
    localStorage.removeItem(storageKey(schoolId));
  };

  const commitFrame = () => {
    const html = readCleanHtml(frameRef.current);
    if (!html) return pagesRef.current;
    ownEditRef.current = true;
    const next = pagesRef.current.map((page, index) => (
      index === pageTab ? { ...page, html } : page
    ));
    pagesRef.current = next;
    setPages(next);
    const gen = ++saveGenRef.current;
    setSavingDraft(true);
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveDraftPages(schoolId, next)
        .catch((err) => notifyError(err.message || "Could not save the draft"))
        .finally(() => {
          if (gen === saveGenRef.current) setSavingDraft(false);
        });
    }, 800);
    window.clearTimeout(historyTimerRef.current);
    historyTimerRef.current = window.setTimeout(() => pushHistory(html), 700);
    return next;
  };
  commitFrameRef.current = commitFrame;

  const pushHistory = (html) => {
    if (!html) return;
    const hist = historyRef.current;
    const index = historyIndexRef.current;
    if (index >= 0 && hist[index] === html) return;
    const next = hist.slice(0, index + 1);
    next.push(html);
    historyRef.current = next.length > 40 ? next.slice(next.length - 40) : next;
    historyIndexRef.current = historyRef.current.length - 1;
    setHistTick((n) => n + 1);
  };

  const showHistory = (html) => {
    ownEditRef.current = true;
    const next = pagesRef.current.map((page, index) => (
      index === pageTab ? { ...page, html } : page
    ));
    pagesRef.current = next;
    setPages(next);
    setFrameHtml(html);
    const gen = ++saveGenRef.current;
    setSavingDraft(true);
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveDraftPages(schoolId, next)
        .catch(() => {})
        .finally(() => {
          if (gen === saveGenRef.current) setSavingDraft(false);
        });
    }, 400);
  };

  const undoPage = () => {
    const current = readCleanHtml(frameRef.current);
    window.clearTimeout(historyTimerRef.current);
    if (current) pushHistory(current);
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setHistTick((n) => n + 1);
    showHistory(historyRef.current[historyIndexRef.current]);
  };

  const redoPage = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setHistTick((n) => n + 1);
    showHistory(historyRef.current[historyIndexRef.current]);
  };

  const bindEditor = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    refreshLayoutRef.current();
    let style = doc.getElementById("sclad-edit-style");
    if (!style) {
      style = doc.createElement("style");
      style.id = "sclad-edit-style";
      doc.head.appendChild(style);
    }
    style.textContent = `
      html { scrollbar-width: thin; scrollbar-color: #c4c4c4 transparent; }
      html::-webkit-scrollbar { width: 10px; height: 10px; }
      html::-webkit-scrollbar-track { background: transparent; margin: 10px 0; }
      html::-webkit-scrollbar-thumb { background: #d0d0d0; border: 3px solid transparent; border-radius: 99px; background-clip: padding-box; }
      html::-webkit-scrollbar-thumb:hover { background: #9a9a9a; background-clip: padding-box; }
      [data-sclad-text] { outline: 1px dashed transparent; cursor: text; }
      [data-sclad-text]:hover, [data-sclad-text]:focus { outline: 1px dashed #1e3a5f; background: rgba(30, 58, 95, 0.04); }
      img { cursor: pointer; }
      img[data-sclad-empty] { outline: 3px dashed #b42318; outline-offset: 3px; }
      [data-sclad-pass] { pointer-events: none !important; }
      [data-sclad-pass] [data-sclad-text],
      [data-sclad-pass] a,
      [data-sclad-pass] button,
      [data-sclad-pass] img { pointer-events: auto !important; }
      *::before, *::after { pointer-events: none !important; }
      [data-sclad-picked] { outline: 2px solid #111111 !important; outline-offset: 3px; }
      button.sclad-image-hit {
        position: fixed !important;
        z-index: 2147483647 !important;
        align-items: center;
        justify-content: center;
        height: 32px;
        padding: 0 12px;
        border: 0;
        border-radius: 999px;
        background: #111111 !important;
        color: #ffffff !important;
        font: 700 12px/1 "Segoe UI", Helvetica, Arial, sans-serif;
        cursor: pointer !important;
        pointer-events: auto !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
      }
      body.sclad-ai-pick, body.sclad-ai-pick * { cursor: pointer !important; }
      #sclad-hover-box {
        position: fixed;
        z-index: 2147483646;
        pointer-events: none;
        display: none;
        box-sizing: border-box;
        border: 2px solid #2563eb;
        border-radius: 2px;
        background: rgba(37, 99, 235, 0.08);
      }
    `;
    let hoverBox = doc.getElementById("sclad-hover-box");
    if (!hoverBox) {
      hoverBox = doc.createElement("div");
      hoverBox.id = "sclad-hover-box";
      doc.body.appendChild(hoverBox);
    }
    const placePickedBar = () => {
      const frame = frameRef.current;
      const node = doc.querySelector("[data-sclad-picked]");
      if (!frame || !editOpenRef.current || !node || node === doc.body || node === doc.documentElement) {
        pickedBarPosRef.current(null);
        return;
      }
      const frameRect = frame.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      const width = 72;
      const height = 36;
      const inView = rect.bottom > 8 && rect.top < frameRect.height - 8 && rect.right > 0 && rect.left < frameRect.width;
      if (!inView) {
        pickedBarPosRef.current(null);
        return;
      }
      let top = frameRect.top + rect.top - height - 8;
      if (top < frameRect.top + 8) top = frameRect.top + Math.max(8, rect.top + 8);
      let left = frameRect.left + rect.left + Math.max(0, (rect.width - width) / 2);
      left = Math.max(frameRect.left + 8, Math.min(left, frameRect.right - width - 8));
      pickedBarPosRef.current({ top: Math.round(top), left: Math.round(left) });
    };
    doc.documentElement._scladPlaceBar = placePickedBar;
    if (doc.documentElement._scladBarOn !== 1) {
      doc.documentElement._scladBarOn = 1;
      doc.addEventListener("scroll", () => doc.documentElement._scladPlaceBar?.(), true);
      doc.defaultView?.addEventListener("resize", () => doc.documentElement._scladPlaceBar?.());
    }
    placePickedBar();
    if (aiOpenRef.current) doc.body.classList.add("sclad-ai-pick");
    if (doc.documentElement._scladHoverOn !== 1) {
      doc.documentElement._scladHoverOn = 1;
      let hoverEl = null;
      const placeHover = (el) => {
        const box = doc.getElementById("sclad-hover-box");
        if (!box) return;
        if ((!aiOpenRef.current && !editOpenRef.current) || !el || el === doc.body || el === doc.documentElement || el.id === "sclad-hover-box" || el.id === "sclad-picked-bar" || el.closest?.("#sclad-picked-bar") || el.classList?.contains("sclad-image-hit")) {
          hoverEl = null;
          box.style.setProperty("display", "none", "important");
          return;
        }
        hoverEl = el;
        const rect = el.getBoundingClientRect();
        box.style.setProperty("display", "block", "important");
        box.style.setProperty("position", "fixed", "important");
        box.style.setProperty("z-index", "2147483646", "important");
        box.style.setProperty("pointer-events", "none", "important");
        box.style.setProperty("box-sizing", "border-box", "important");
        box.style.setProperty("border", "3px solid #2563eb", "important");
        box.style.setProperty("background", "rgba(37, 99, 235, 0.12)", "important");
        box.style.setProperty("left", `${rect.left}px`, "important");
        box.style.setProperty("top", `${rect.top}px`, "important");
        box.style.setProperty("width", `${Math.max(rect.width, 2)}px`, "important");
        box.style.setProperty("height", `${Math.max(rect.height, 2)}px`, "important");
      };
      doc.addEventListener("mousemove", (event) => {
        if (!aiOpenRef.current && !editOpenRef.current) return;
        placeHover(event.target?.nodeType === 1 ? event.target : event.target?.parentElement);
      }, true);
      doc.addEventListener("mouseleave", () => placeHover(null), true);
      doc.addEventListener("scroll", () => {
        if (hoverEl) placeHover(hoverEl);
      }, true);
    }
    if (doc.documentElement._scladHoverEdge !== 1) {
      doc.documentElement._scladHoverEdge = 1;
      let edged = null;
      const clearEdge = () => {
        if (!edged) return;
        edged.style.removeProperty("outline");
        edged.style.removeProperty("outline-offset");
        edged = null;
      };
      doc.documentElement._scladClearEdge = clearEdge;
      doc.addEventListener("mousemove", (event) => {
        if (!editOpenRef.current && !aiOpenRef.current) {
          clearEdge();
          return;
        }
        const el = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
        if (!el || el === doc.body || el === doc.documentElement || el.id === "sclad-hover-box" || el.id === "sclad-picked-bar" || el.closest?.("#sclad-picked-bar") || el.classList?.contains("sclad-image-hit")) {
          clearEdge();
          return;
        }
        if (edged === el) return;
        clearEdge();
        edged = el;
        el.style.setProperty("outline", "2px solid #2563eb", "important");
        el.style.setProperty("outline-offset", "2px", "important");
      }, true);
      doc.addEventListener("mouseleave", () => {
        clearEdge();
      }, true);
    }
    if (doc.documentElement._scladImageAdd !== 1) {
      doc.documentElement._scladImageAdd = 1;
      let imageEl = null;
      let hideTimer = 0;
      const hideImageButton = () => {
        window.clearTimeout(hideTimer);
        hideTimer = window.setTimeout(() => {
          if (imageHoldRef.current) return;
          imageEl = null;
          if (imageAddBtnRef.current) imageAddBtnRef.current.style.display = "none";
        }, 120);
      };
      const placeImageButton = (img, x, y) => {
        const button = imageAddBtnRef.current;
        const frame = frameRef.current;
        if (!button || !frame) return;
        window.clearTimeout(hideTimer);
        if (aiOpenRef.current || editOpenRef.current || !img) {
          imageHoldRef.current = false;
          hideImageButton();
          return;
        }
        const rect = img.getBoundingClientRect();
        if (rect.width < 24 || rect.height < 24) {
          hideImageButton();
          return;
        }
        imageEl = img;
        imageTargetRef.current = img;
        const frameRect = frame.getBoundingClientRect();
        const width = 124;
        const height = 36;
        const left = frameRect.left + rect.left + Math.max(0, (rect.width - width) / 2);
        const top = frameRect.top + rect.top + Math.max(0, (rect.height - height) / 2);
        button.textContent = "Change image";
        button.style.display = "inline-flex";
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        if (typeof x === "number" && typeof y === "number") {
          const parentX = frameRect.left + x;
          const parentY = frameRect.top + y;
          if (parentX >= left && parentX <= left + width && parentY >= top && parentY <= top + height) {
            imageHoldRef.current = true;
          }
        }
      };
      const imageUnderPointer = (x, y) => {
        let best = null;
        let bestArea = Infinity;
        const consider = (el) => {
          if (!el || el === doc.body || el === doc.documentElement) return;
          const rect = el.getBoundingClientRect();
          if (rect.width < 24 || rect.height < 24) return;
          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return;
          const area = rect.width * rect.height;
          if (area < bestArea) {
            best = el;
            bestArea = area;
          }
        };
        doc.querySelectorAll("img").forEach(consider);
        if (best) return best;
        doc.querySelectorAll("*").forEach((el) => {
          const bg = doc.defaultView?.getComputedStyle(el).backgroundImage || "";
          if (!/url\(/i.test(bg)) return;
          consider(el);
        });
        return best;
      };
      doc.addEventListener("mousemove", (event) => {
        if (aiOpenRef.current || editOpenRef.current) {
          hideImageButton();
          return;
        }
        const img = imageUnderPointer(event.clientX, event.clientY);
        if (!img) {
          imageHoldRef.current = false;
          hideImageButton();
          return;
        }
        placeImageButton(img, event.clientX, event.clientY);
      }, true);
      doc.addEventListener("click", (event) => {
        if (aiOpenRef.current || editOpenRef.current) return;
        if (event.target?.closest?.(".sclad-image-hit")) return;
        const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
        if (target?.closest?.("[data-sclad-text]")) return;
        const img = imageUnderPointer(event.clientX, event.clientY);
        if (!img) return;
        const link = target?.closest?.("a, button");
        if (link && link !== img) {
          const linkRect = link.getBoundingClientRect();
          const imgRect = img.getBoundingClientRect();
          if (linkRect.width * linkRect.height < imgRect.width * imgRect.height * 0.45) return;
        }
        event.preventDefault();
        event.stopPropagation();
        imageTargetRef.current = img;
        imageFileRef.current?.click();
      }, true);
      doc.addEventListener("mouseleave", () => hideImageButton(), true);
      doc.addEventListener("scroll", () => placeImageButton(imageEl), true);
    }
    markImageOverlays(doc);
    if (!doc.documentElement._scladSyncHits) {
      let hitButtons = [];
      const syncImageHits = () => {
        const pictures = [];
        doc.querySelectorAll("img").forEach((img) => {
          if (img.classList.contains("sclad-image-hit") || img.id === "sclad-hover-box") return;
          pictures.push(img);
        });
        doc.querySelectorAll("*").forEach((el) => {
          if (el.tagName === "IMG" || el === doc.body || el === doc.documentElement) return;
          if (el.classList.contains("sclad-image-hit") || el.id === "sclad-hover-box") return;
          if (el.querySelector("img")) return;
          const bg = doc.defaultView?.getComputedStyle(el).backgroundImage || "";
          if (/url\(/i.test(bg)) pictures.push(el);
        });
        const same = hitButtons.length === pictures.length
          && hitButtons.every((button, index) => button._picture === pictures[index]);
        if (!same) {
          hitButtons.forEach((button) => button.remove());
          hitButtons = pictures.map((picture) => {
            const button = doc.createElement("button");
            button.type = "button";
            button.className = "sclad-image-hit";
            button.textContent = "Change image";
            button._picture = picture;
            button.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              imageTargetRef.current = picture;
              imageFileRef.current?.click();
            });
            doc.body.appendChild(button);
            return button;
          });
        }
        const viewHeight = doc.documentElement.clientHeight || 0;
        if (editOpenRef.current) {
          hitButtons.forEach((button) => { button.style.display = "none"; });
          return;
        }
        hitButtons.forEach((button) => {
          const rect = button._picture.getBoundingClientRect();
          const hidden = rect.width < 24 || rect.height < 24 || rect.bottom < 0 || rect.top > viewHeight;
          button.style.display = hidden ? "none" : "inline-flex";
          if (hidden) return;
          button.style.left = `${Math.max(rect.left + 8, rect.right - 132)}px`;
          button.style.top = `${Math.max(8, rect.top + 8)}px`;
        });
      };
      doc.documentElement._scladSyncHits = syncImageHits;
      doc.addEventListener("scroll", () => doc.documentElement._scladSyncHits?.(), true);
      doc.defaultView?.addEventListener("resize", () => doc.documentElement._scladSyncHits?.());
    }
    doc.documentElement._scladSyncHits?.();
    requestAnimationFrame(() => {
      markImageOverlays(doc);
      doc.documentElement._scladSyncHits?.();
    });
    if (doc.documentElement._scladSelectOn !== 1) {
      doc.documentElement._scladSelectOn = 1;
      doc.addEventListener("mousedown", (event) => {
        if (!aiOpenRef.current && !editOpenRef.current) return;
        if (event.target?.closest?.(".sclad-image-hit, #sclad-picked-bar")) return;
        event.preventDefault();
      }, true);
      doc.addEventListener("click", (event) => {
        if (!aiOpenRef.current && !editOpenRef.current) return;
        const raw = event.target?.closest?.("*");
        if (!raw || raw === doc.body || raw === doc.documentElement || raw.id === "sclad-hover-box" || raw.id === "sclad-picked-bar" || raw.closest?.("#sclad-picked-bar") || raw.classList?.contains("sclad-image-hit")) return;
        const el = editOpenRef.current ? raw : (raw.closest("section, header, footer, nav") || raw);
        if (el === doc.body || el === doc.documentElement) return;
        event.preventDefault();
        event.stopPropagation();
        doc.querySelectorAll("[data-sclad-picked]").forEach((node) => node.removeAttribute("data-sclad-picked"));
        el.setAttribute("data-sclad-picked", "1");
        let targetId = el.getAttribute("data-sclad-target");
        if (!targetId) {
          targetId = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
          el.setAttribute("data-sclad-target", targetId);
        }
        if (aiOpenRef.current) insertAiChip(elementChipLabel(el), targetId);
        if (editOpenRef.current) {
          let picked = { kind: "box", leaf: el.children.length === 0, styles: {} };
          try { picked = readSelection(el); } catch (_) {}
          if (picked.kind === "image") imageTargetRef.current = el;
          setEditTab("style");
          refreshLayoutRef.current();
          doc.documentElement._scladPlaceBar?.();
          setSelectedEl({
            id: targetId,
            label: elementChipLabel(el),
            text: (el.innerText || "").replace(/\s+/g, " ").trim(),
            ...picked,
          });
        }
      }, true);
    }
    if (doc.documentElement.dataset.scladBound === "1" || doc.querySelector("[data-sclad-text]")) {
      doc.documentElement.dataset.scladBound = "1";
      return;
    }
    doc.documentElement.dataset.scladBound = "1";
    const selector = "h1,h2,h3,h4,h5,h6,p,li,figcaption,button,a,span,label,td,th,strong";
    doc.querySelectorAll(selector).forEach((el) => {
      if (el.id === "sclad-image-add" || el.id === "sclad-hover-box") return;
      if (el.classList.contains("sclad-nav-burger") || el.closest(".sclad-nav-burger")) return;
      if (el.querySelector(selector)) return;
      if (!el.textContent.trim()) return;
      el.setAttribute("contenteditable", "true");
      el.setAttribute("data-sclad-text", "1");
      el.addEventListener("input", () => commitFrame());
      if (el.tagName === "A") el.addEventListener("click", (event) => event.preventDefault());
    });
    doc.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!src || /placehold\.co/i.test(src)) img.setAttribute("data-sclad-empty", "1");
      img.addEventListener("load", () => {
        markImageOverlays(doc);
        doc.documentElement._scladSyncHits?.();
      });
      img.addEventListener("click", (event) => {
        if (aiOpenRef.current || editOpenRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        imageTargetRef.current = img;
        imageFileRef.current?.click();
      });
    });
  };

  refreshLayoutRef.current = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc?.body) return;
    setLayoutNodes(buildLayoutTree(doc.body));
  };

  const pickLayoutNode = (node) => {
    const doc = frameRef.current?.contentDocument;
    const el = elementAtPath(doc?.body, node.path);
    if (!doc || !el) return;
    doc.querySelectorAll("[data-sclad-picked]").forEach((item) => item.removeAttribute("data-sclad-picked"));
    el.setAttribute("data-sclad-picked", "1");
    let targetId = el.getAttribute("data-sclad-target");
    if (!targetId) {
      targetId = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      el.setAttribute("data-sclad-target", targetId);
    }
    let picked = { kind: "box", leaf: el.children.length === 0, styles: {} };
    try { picked = readSelection(el); } catch (_) {}
    if (picked.kind === "image") imageTargetRef.current = el;
    setSelectedEl({
      id: targetId,
      label: elementChipLabel(el),
      text: (el.innerText || "").replace(/\s+/g, " ").trim(),
      ...picked,
    });
    setLayoutNodes(buildLayoutTree(doc.body));
    doc.documentElement._scladPlaceBar?.();
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  };

  pickedBarPosRef.current = (next) => {
    setPickedBar((prev) => {
      if (!next && !prev) return prev;
      if (next && prev && prev.top === next.top && prev.left === next.left) return prev;
      return next;
    });
  };

  applyPickRef.current = (el) => {
    if (!el) {
      setSelectedEl(null);
      refreshLayoutRef.current();
      return;
    }
    let picked = { kind: "box", leaf: el.children.length === 0, styles: {} };
    try { picked = readSelection(el); } catch (_) {}
    if (picked.kind === "image") imageTargetRef.current = el;
    setSelectedEl({
      id: el.getAttribute("data-sclad-target"),
      label: elementChipLabel(el),
      text: (el.innerText || "").replace(/\s+/g, " ").trim(),
      ...picked,
    });
    refreshLayoutRef.current();
    frameRef.current?.contentDocument?.documentElement?._scladPlaceBar?.();
  };

  const duplicateSelected = () => {
    const doc = frameRef.current?.contentDocument;
    const el = doc?.querySelector("[data-sclad-picked]");
    if (!doc || !el || el === doc.body || !el.parentNode) return;
    const copy = el.cloneNode(true);
    copy.removeAttribute("data-sclad-picked");
    copy.removeAttribute("data-sclad-target");
    copy.querySelectorAll("[data-sclad-picked], [data-sclad-target]").forEach((item) => {
      item.removeAttribute("data-sclad-picked");
      item.removeAttribute("data-sclad-target");
    });
    el.removeAttribute("data-sclad-picked");
    const id = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    copy.setAttribute("data-sclad-target", id);
    copy.setAttribute("data-sclad-picked", "1");
    el.parentNode.insertBefore(copy, el.nextSibling);
    applyPickRef.current(copy);
    commitFrame();
    copy.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  };

  const deleteSelected = () => {
    const doc = frameRef.current?.contentDocument;
    const el = doc?.querySelector("[data-sclad-picked]");
    if (!doc || !el || el === doc.body || el === doc.documentElement) return;
    el.remove();
    applyPickRef.current(null);
    commitFrame();
  };

  const selectedNode = () => {
    const doc = frameRef.current?.contentDocument;
    if (!doc || !selectedEl?.id) return null;
    return doc.querySelector(`[data-sclad-target="${selectedEl.id}"]`);
  };

  const updateSelectedText = (text) => {
    const el = selectedNode();
    if (!el || selectedEl?.kind !== "text" || !selectedEl.leaf) return;
    el.textContent = text;
    setSelectedEl((prev) => (prev ? { ...prev, text } : prev));
    commitFrame();
  };

  const paintStyle = (el, key, value) => {
    const name = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    if (value === "" || value == null) el.style.removeProperty(name);
    else el.style.setProperty(name, value, "important");
  };

  const applySelectedStyle = (key, value) => {
    const el = selectedNode();
    if (!el) return;
    if (key === "fontFamily") ensureWebFonts(el.ownerDocument);
    if (key === "alt") el.setAttribute("alt", value);
    else if (key === "imageAlign") {
      paintStyle(el, "display", "block");
      paintStyle(el, "marginLeft", value === "left" ? "0" : "auto");
      paintStyle(el, "marginRight", value === "right" ? "0" : "auto");
    } else if (key !== "src" && key !== "backgroundImage") {
      paintStyle(el, key, value);
      if (key === "textOverflow" && value === "ellipsis") {
        paintStyle(el, "overflow", "hidden");
        paintStyle(el, "whiteSpace", "nowrap");
      }
    }
    setSelectedEl((prev) => (prev ? { ...prev, styles: { ...prev.styles, [key]: value } } : prev));
    commitFrame();
  };

  const pickSelectedImage = () => {
    const el = selectedNode();
    if (!el) return;
    imageTargetRef.current = el;
    imageFileRef.current?.click();
  };

  useEffect(() => {
    bindEditor();
  }, [aiOpen, editOpen, frameHtml]);

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    const move = () => doc?.documentElement?._scladPlaceBar?.();
    move();
    doc?.addEventListener("scroll", move, true);
    window.addEventListener("scroll", move, true);
    window.addEventListener("resize", move);
    return () => {
      doc?.removeEventListener("scroll", move, true);
      window.removeEventListener("scroll", move, true);
      window.removeEventListener("resize", move);
    };
  }, [editOpen, selectedEl, frameHtml]);

  const onPreviewImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = imageTargetRef.current;
    if (!file || !target) return;
    try {
      const picture = await compressImageFile(file);
      if (target.tagName === "IMG") {
        target.src = picture;
        target.removeAttribute("data-sclad-empty");
      } else {
        target.style.backgroundImage = `url("${picture}")`;
        if (!target.style.backgroundSize) target.style.backgroundSize = "cover";
        if (!target.style.backgroundPosition) target.style.backgroundPosition = "center";
      }
      setSelectedEl((prev) => {
        if (!prev) return prev;
        if (target.tagName === "IMG") return { ...prev, styles: { ...prev.styles, src: "image" } };
        return { ...prev, styles: { ...prev.styles, backgroundImage: "image" } };
      });
      commitFrame();
    } catch (err) {
      notifyError(err.message);
    }
  };

  const sendAiEdit = async (event) => {
    event.preventDefault();
    if (aiBusy) return;
    const field = aiFieldRef.current;
    let prompt = "";
    const selections = [];
    let chipCount = 0;
    const marked = readMarkedPage(frameRef.current);
    field?.childNodes.forEach((node) => {
      if (node.nodeType === 3) prompt += node.textContent;
      else if (node.classList?.contains("wbp-ai-chip")) {
        chipCount += 1;
        const label = node.textContent || "element";
        prompt += ` [${label}] `;
        const targetId = node.dataset.target || "";
        const picked = targetId && marked
          ? marked.querySelector(`[data-sclad-target="${CSS.escape(targetId)}"]`)
          : null;
        if (picked) selections.push({ label, html: picked.outerHTML });
      }
    });
    prompt = prompt.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    if (!chipCount || !prompt) return;
    if (chipCount && selections.length < chipCount) {
      notifyError("Select that part again. It is no longer on the page.");
      return;
    }
    const markedHtml = marked ? `<!doctype html>\n${marked.outerHTML}` : "";
    const latest = commitFrame() || pagesRef.current;
    window.clearTimeout(saveTimerRef.current);
    window.clearTimeout(historyTimerRef.current);
    const current = latest[pageTab] || latest[0];
    if (!current?.html) return;
    pushHistory(current.html);
    setAiBusy(true);
    try {
      const token = schoolToken();
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/edit-page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          html: markedHtml || current.html,
          prompt,
          selections,
          pageId: current.id || "home",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not edit the page");
      const next = latest.map((page, index) => (
        index === pageTab ? { ...page, html: data.html } : page
      ));
      ownEditRef.current = true;
      pagesRef.current = next;
      setPages(next);
      setFrameHtml(data.html);
      pushHistory(data.html);
      if (field) field.innerHTML = "";
      setAiPicked(false);
    } catch (err) {
      notifyError(err.message);
      saveDraftPages(schoolId, latest).catch(() => {});
    } finally {
      setAiBusy(false);
    }
  };

  const publishSite = async () => {
    const latest = commitFrame();
    const missing = (latest || []).reduce((sum, page) => sum + unsetImageCount(page.html), 0);
    if (!latest?.length || publishing) return;
    if (missing) {
      notifyError(missing === 1
        ? "Add the remaining image before you can publish."
        : `Add the remaining ${missing} images before you can publish.`);
      return;
    }
    setPublishing(true);
    try {
      await saveDraftPages(schoolId, latest);
      const formData = new FormData();
      formData.append(
        "pages_json",
        JSON.stringify(latest.map((page, index) => ({
          id: page.id || (index === 0 ? "home" : `page_${index}`),
          title: page.title || "Home",
          slug: page.slug || "/",
          order: index,
        }))),
      );
      latest.forEach((page) => {
        formData.append(
          "html_files",
          new Blob([page.html || ""], { type: "text/html" }),
          pageFileName(page.slug),
        );
      });
      const token = schoolToken();
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/website-request/publish`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not publish the site");
      addNotification("Your site is published.", "success");
      navigate(`/admin/${schoolId}/school`);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!ready) return null;
  const unsetCount = pages.reduce((sum, page) => sum + unsetImageCount(page.html), 0);

  return (
    <div className="wbp-root">
      {draft.step === "welcome" && (
        <section className={`wbp-hello wbp-stage${phase === "out" ? " is-out" : ""}${helloOn ? " is-on" : ""}`}>
          <span className="wbp-hello-circle" aria-hidden="true" />
          <span className="wbp-hello-box" aria-hidden="true" />
          <div className="wbp-hello-card">
            <h1>Your school’s website is about to feel wonderful.</h1>
            <p className="wbp-hello-copy">
              A color scheme, a font, and one happy page. That’s all it takes, and the AI will put it together for you.
            </p>
            <button type="button" className="wbp-next" onClick={() => go("color")}>
              Next
            </button>
          </div>
        </section>
      )}

      {draft.step !== "welcome" && draft.step !== "page" && draft.step !== "creating" && (
        <div className={`wbp-stage${phase === "out" ? " is-out" : ""}`}>
        <header className="wbp-top">
          <span>School website</span>
          <ol>
            <li className={draft.step === "color" ? "is-on" : ""}>Colors</li>
            <li className={draft.step === "font" ? "is-on" : ""}>Font</li>
            <li className={draft.step === "template" ? "is-on" : ""}>Template</li>
            <li className={draft.step === "brief" ? "is-on" : ""}>Content</li>
          </ol>
        </header>

      {draft.step === "color" && (
        <section className="wbp-step">
          <div>
            <h1>Pick a color scheme</h1>
            <p>These colors work together. The page uses all of them, not just one.</p>
            <div className="wbp-swatches">
              {SCHEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={draft.schemeId === item.id ? "is-on" : ""}
                  onClick={() => setDraft((prev) => ({ ...prev, schemeId: item.id, color: item.primary }))}
                  title={item.name}
                >
                  <span className="wbp-scheme-dots">
                    <i style={{ background: item.primary }} />
                    <i style={{ background: item.secondary }} />
                    <i style={{ background: item.accent }} />
                    <i style={{ background: item.background }} />
                    <i style={{ background: item.ink }} />
                  </span>
                  {item.name}
                </button>
              ))}
              <button
                type="button"
                className={draft.schemeId === "custom" ? "is-on" : ""}
                onClick={() => setDraft((prev) => {
                  const customScheme = { ...DEFAULT_CUSTOM, ...(prev.customScheme || {}) };
                  return { ...prev, schemeId: "custom", customScheme, color: customScheme.primary };
                })}
              >
                <span className="wbp-scheme-dots">
                  {SCHEME_FIELDS.map(([key]) => (
                    <i key={key} style={{ background: (draft.customScheme || DEFAULT_CUSTOM)[key] }} />
                  ))}
                </span>
                Custom
              </button>
            </div>
            {draft.schemeId === "custom" && (
              <div className="wbp-scheme-fields">
                {SCHEME_FIELDS.map(([key, label]) => (
                  <label key={key}>
                    <input
                      type="color"
                      value={scheme[key]}
                      aria-label={label}
                      onChange={(event) => {
                        const value = event.target.value;
                        setDraft((prev) => {
                          const customScheme = { ...DEFAULT_CUSTOM, ...(prev.customScheme || {}), [key]: value };
                          return {
                            ...prev,
                            schemeId: "custom",
                            customScheme,
                            color: customScheme.primary,
                          };
                        });
                      }}
                    />
                    {label}
                  </label>
                ))}
              </div>
            )}
            <div className="wbp-actions">
              <button type="button" className="wbp-back" onClick={() => go("welcome")}>Back</button>
              <button type="button" className="wbp-next" onClick={() => go("font")}>Next</button>
            </div>
          </div>
          <div className="wbp-color-stage" style={{ background: scheme.background, color: scheme.ink }}>
            <div className="wbp-scheme-preview">
              <strong style={{ background: scheme.primary }}>Your school</strong>
              <span style={{ background: scheme.secondary }}>A quiet panel for the school story</span>
              <em style={{ background: scheme.accent }}>Apply</em>
            </div>
          </div>
        </section>
      )}

      {draft.step === "font" && (
        <section className="wbp-step wbp-step--font">
          <div>
            <h1>Choose a font</h1>
            <p>This is the voice of the page. Headings and text will use it.</p>
            <div className="wbp-fonts">
              {FONTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={draft.fontId === item.id ? "is-on" : ""}
                  onClick={() => setDraft((prev) => ({ ...prev, fontId: item.id }))}
                >
                  <strong style={{ fontFamily: item.stack }}>{item.name}</strong>
                  <span style={{ fontFamily: item.stack }}>{item.sample}</span>
                </button>
              ))}
            </div>
            <div className="wbp-actions">
              <button type="button" className="wbp-back" onClick={() => go("color")}>Back</button>
              <button type="button" className="wbp-next" onClick={() => go("template")}>Next</button>
            </div>
          </div>
        </section>
      )}

      {draft.step === "template" && (
        <section className="wbp-step wbp-step--templates">
          <div>
            <h1>Choose a template</h1>
            <p>Pick a picture, or upload one of your own.</p>
            <div className="wbp-templates">
              <label className={`wbp-custom${draft.templateId === "custom" ? " is-on" : ""}`}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onCustomFile(e.target.files?.[0])}
                />
                {customImage ? (
                  <img src={customImage} alt="" />
                ) : (
                  <em>Add a custom template</em>
                )}
                <strong>{draft.customName || "Upload a screenshot"}</strong>
                <span>A picture of a site you want this page to follow.</span>
              </label>
              {homeTemplates.map((item) => (
                <div key={item.image_id} className={`wbp-shot-card${draft.templateId === item.image_id ? " is-on" : ""}`}>
                  <button
                    type="button"
                    className="wbp-shot-pick"
                    onClick={() => {
                      setCustomImage("");
                      setDraft((prev) => ({ ...prev, templateId: item.image_id, customName: "" }));
                    }}
                  >
                    <img src={item.image} alt="" />
                    <strong>{item.label}</strong>
                  </button>
                  <button type="button" className="wbp-shot-eye" aria-label={`View ${item.label}`} onClick={() => setShot({ src: item.image, label: item.label })}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="wbp-actions wbp-actions-float">
              <button type="button" className="wbp-back" onClick={() => go("font")} disabled={creating}>Back</button>
              <button
                type="button"
                className="wbp-next"
                disabled={!draft.templateId}
                onClick={() => go("brief")}
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {draft.step === "brief" && (
        <section className="wbp-step wbp-step--brief">
          <div>
            <h1>What should the page include?</h1>
            <p>This starts filled in. Change it if you want different sections, or clear it to follow the template only.</p>
            <textarea
              className="wbp-brief"
              rows={16}
              value={draft.sitePrompt}
              placeholder="A hero with the school name, then admissions, then a photo gallery and a visit section."
              onChange={(event) => setDraft((prev) => ({ ...prev, sitePrompt: event.target.value }))}
            />
            <div className="wbp-actions">
              <button type="button" className="wbp-back" onClick={() => go("template")} disabled={creating}>Back</button>
              <button
                type="button"
                className="wbp-next"
                disabled={!draft.templateId || creating}
                onClick={createSite}
              >
                {creating ? "Creating site…" : "Create site"}
              </button>
            </div>
          </div>
        </section>
      )}
        </div>
      )}

      {draft.step === "creating" && (
        <section className={`wbp-build wbp-stage${phase === "out" ? " is-out" : ""}`}>
          <div className="wbp-build-copy">
            <h1>Creating site</h1>
            <p>Please remain on the page. Sit tight. The log below is the work as it happens.</p>
          </div>
          <div className="wbp-log">
            <ol>
              {logLines.map((line, index) => {
                const age = logLines.length - 1 - index;
                const live = age === 0;
                return (
                  <li
                    key={line.id}
                    className={`${live ? "is-live" : "is-old"}${line.restart ? " is-restart" : ""}`}
                    style={{ opacity: live ? 1 : Math.max(0.16, 1 - age * 0.3) }}
                  >
                    <span className="wbp-log-ts">{String(index).padStart(2, "0")}</span>
                    <span className="wbp-log-tag">{line.restart ? "SYS" : "AI"}</span>
                    <span>{line.text.toLowerCase()}</span>
                    {live && <i />}
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {draft.step === "page" && (
        <section className={`wbp-result wbp-stage${phase === "out" ? " is-out" : ""}`}>
          <header className="wbp-result-bar">
            <div className="wbp-result-title">
              <strong>{aiOnly ? "Edit site" : "Your page"}</strong>
              <span>{picked?.label || draft.customName || "Custom template"}</span>
              {savingDraft && <em className="wbp-draft-saving">Draft saving</em>}
            </div>
            <div className="wbp-result-tools">
              <div className="wbp-devices">
                <button type="button" className={previewDevice === "desktop" ? "is-on" : ""} title="Desktop" aria-label="Desktop" onClick={() => setPreviewDevice("desktop")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2v7h14V7H5zm4 11h6v1.5H9V18z" />
                  </svg>
                </button>
                <button type="button" className={previewDevice === "tablet" ? "is-on" : ""} title="Tablet" aria-label="Tablet" onClick={() => setPreviewDevice("tablet")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm1 3v12h8V5H8zm3 14.2h2v1.2h-2v-1.2z" />
                  </svg>
                </button>
                <button type="button" className={previewDevice === "mobile" ? "is-on" : ""} title="Mobile" aria-label="Mobile" onClick={() => setPreviewDevice("mobile")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 1.5h6a2 2 0 0 1 2 2v17a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-17a2 2 0 0 1 2-2zm1 3v13h4V4.5h-4zm1.2 15h1.6v1.2h-1.6V19.5z" />
                  </svg>
                </button>
              </div>
              <button type="button" className="wbp-icon-btn" title="Undo" aria-label="Undo" onClick={undoPage} disabled={histTick < 0 || historyIndexRef.current <= 0}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8H4v4M4.5 9A8 8 0 1 1 6 17" /></svg>
              </button>
              <button type="button" className="wbp-icon-btn" title="Redo" aria-label="Redo" onClick={redoPage} disabled={histTick < 0 || historyIndexRef.current >= historyRef.current.length - 1}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8h4v4M19.5 9A8 8 0 1 0 18 17" /></svg>
              </button>
              {/*
              <button
                type="button"
                className={`wbp-ai-switch${aiOpen ? " is-on" : ""}`}
                role="switch"
                aria-checked={aiOpen}
                onClick={() => {
                  setAiOpen((open) => !open);
                  setAiPicked(false);
                }}
              >
                <span>Edit with AI</span>
                <i />
              </button>
              */}
              <button
                type="button"
                className={`wbp-ai-switch${editOpen ? " is-on" : ""}`}
                role="switch"
                aria-checked={editOpen}
                onClick={() => {
                  setEditOpen((open) => {
                    if (!open) {
                      setEditTab("layout");
                      setDrawerShut(true);
                    }
                    return !open;
                  });
                }}
              >
                <span>Edit</span>
                <i />
              </button>
              <button type="button" onClick={() => {
                frameRef.current?.contentDocument?.querySelectorAll("[data-sclad-picked]").forEach((node) => node.removeAttribute("data-sclad-picked"));
                setSelectedEl(null);
                setEditTab("style");
                setDrawerShut(false);
                setEditOpen(true);
              }}>
                Colors
              </button>
              {!aiOnly && <button type="button" onClick={() => setResetWarn(true)}>Start over</button>}
              <button type="button" className="wbp-publish" onClick={publishSite} disabled={publishing || !pages.length || unsetCount > 0}>
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </div>
          </header>
          {publishedUrl && (
            <p className="wbp-published">
              Live at <a href={publishedUrl} target="_blank" rel="noreferrer">{publishedUrl}</a>
            </p>
          )}
          {/*
          {aiOpen && pages.length > 0 && (
            <p className="wbp-edit-note">Select a section on the page. The box stays off until you do.</p>
          )}
          */}
          {!aiOpen && unsetCount > 0 && (
            <p className="wbp-edit-note">
              {unsetCount} image{unsetCount === 1 ? "" : "s"} still need a real photo before you can publish.
            </p>
          )}
          {editOpen && pickedBar && createPortal(
            <div className="wbp-picked-bar" style={{ top: pickedBar.top, left: pickedBar.left }}>
              <button type="button" aria-label="Duplicate" onClick={duplicateSelected}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M6 16V6a2 2 0 0 1 2-2h10" /></svg>
              </button>
              <button type="button" aria-label="Delete" onClick={deleteSelected}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V5h6v2M7 7l1 13h8l1-13" /></svg>
              </button>
            </div>,
            document.body,
          )}
          {createPortal(
            <button
              ref={imageAddBtnRef}
              type="button"
              className="wbp-image-add"
              onMouseEnter={() => { imageHoldRef.current = true; }}
              onMouseLeave={() => {
                imageHoldRef.current = false;
                if (imageAddBtnRef.current) imageAddBtnRef.current.style.display = "none";
              }}
              onClick={() => imageFileRef.current?.click()}
            >
              Change image
            </button>,
            document.body,
          )}
          <div className={`wbp-preview-row${editOpen ? " is-edit" : ""}`}>
            {editOpen && (
              <aside ref={drawerRef} className={`wbp-edit-side${drawerShut ? " is-shut" : ""}`}>
                <button
                  type="button"
                  className="wbp-drawer-handle"
                  aria-label={drawerShut ? "Drag up to open the editor" : "Drag down to close the editor"}
                  onPointerDown={(event) => {
                    if (!window.matchMedia("(max-width: 800px)").matches) return;
                    const aside = drawerRef.current;
                    if (!aside) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const startY = event.clientY;
                    let lastY = startY;
                    const height = aside.getBoundingClientRect().height;
                    const travel = Math.max(1, height - 64);
                    const startShift = drawerShut ? 1 : 0;
                    let shift = startShift;
                    const move = (pointerEvent) => {
                      lastY = pointerEvent.clientY;
                      shift = Math.max(0, Math.min(1, startShift + (lastY - startY) / travel));
                      aside.style.setProperty("--wbp-drawer", String(shift));
                      aside.classList.add("is-dragging");
                    };
                    const up = () => {
                      aside.classList.remove("is-dragging");
                      const closed = Math.abs(lastY - startY) < 8 ? !drawerShut : shift > 0.45;
                      aside.classList.toggle("is-shut", closed);
                      aside.style.removeProperty("--wbp-drawer");
                      setDrawerShut(closed);
                      event.currentTarget.removeEventListener("pointermove", move);
                      event.currentTarget.removeEventListener("pointerup", up);
                      event.currentTarget.removeEventListener("pointercancel", up);
                    };
                    event.currentTarget.addEventListener("pointermove", move);
                    event.currentTarget.addEventListener("pointerup", up);
                    event.currentTarget.addEventListener("pointercancel", up);
                  }}
                />
                <div className="wbp-edit-side-head">
                  <strong>Edit</strong>
                  <button type="button" aria-label="Close edit" onClick={() => setEditOpen(false)}>×</button>
                </div>
                <div className="wbp-edit-tabs" role="tablist">
                  <button type="button" role="tab" aria-selected={editTab === "layout"} className={editTab === "layout" ? "is-on" : ""} onClick={() => setEditTab("layout")}>Layout</button>
                  <button type="button" role="tab" aria-selected={editTab === "style"} className={editTab === "style" ? "is-on" : ""} onClick={() => setEditTab("style")}>Style</button>
                </div>
                {editTab === "layout" && (
                  layoutNodes.length ? (
                    <ul className="wbp-tree">
                      {layoutNodes.map((node) => (
                        <LayoutBranch key={node.path} node={node} depth={0} selectedId={selectedEl?.id} onPick={pickLayoutNode} />
                      ))}
                    </ul>
                  ) : (
                    <p>The page outline will show here.</p>
                  )
                )}
                {editTab === "style" && selectedEl && (
                  <div className="wbp-edit-selected">
                    <h2>{selectedEl.kind === "image" ? "Picture" : selectedEl.kind === "text" ? "Words" : "This block"}</h2>
                    <strong>{selectedEl.label}</strong>
                    {selectedEl.kind === "text" && selectedEl.leaf && (
                      <textarea
                        value={selectedEl.text}
                        aria-label="Selected text"
                        onChange={(event) => updateSelectedText(event.target.value)}
                      />
                    )}
                    <StyleFields
                      fields={selectedEl.kind === "image" ? IMAGE_FIELDS : selectedEl.kind === "text" ? TEXT_FIELDS : BOX_FIELDS}
                      styles={selectedEl.styles}
                      onChange={applySelectedStyle}
                      onPickImage={pickSelectedImage}
                    />
                  </div>
                )}
                {editTab === "style" && !selectedEl && <p>Click anything on the page, or pick it from Layout.</p>}
                {!selectedEl && editTab === "style" && <h2>Colors</h2>}
                {!selectedEl && editTab === "style" && <div className="wbp-swatches">
                  {SCHEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={pageScheme.id !== "custom" && pageScheme.primary === item.primary && pageScheme.accent === item.accent ? "is-on" : ""}
                      onClick={() => paintScheme(item)}
                    >
                      <span className="wbp-scheme-dots">
                        <i style={{ background: item.primary }} />
                        <i style={{ background: item.secondary }} />
                        <i style={{ background: item.accent }} />
                        <i style={{ background: item.background }} />
                        <i style={{ background: item.ink }} />
                      </span>
                      {item.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={pageScheme.id === "custom" ? "is-on" : ""}
                    onClick={() => paintScheme({ ...pageScheme, id: "custom", name: "Custom" })}
                  >
                    <span className="wbp-scheme-dots">
                      {SCHEME_FIELDS.map(([key]) => (
                        <i key={key} style={{ background: pageScheme[key] }} />
                      ))}
                    </span>
                    Custom
                  </button>
                </div>}
                {!selectedEl && editTab === "style" && <div className="wbp-scheme-fields">
                  {SCHEME_FIELDS.map(([key, label]) => (
                    <label key={key}>
                      <input
                        type="color"
                        value={pageScheme[key]}
                        aria-label={label}
                        onChange={(event) => paintScheme({
                          id: "custom",
                          name: "Custom",
                          ...pageScheme,
                          [key]: event.target.value,
                        })}
                      />
                      {label}
                    </label>
                  ))}
                </div>}
              </aside>
            )}
          <div className={`wbp-sheet${previewDevice === "desktop" ? "" : ` is-${previewDevice}`}`}>
            {pages[pageTab] ? (
              <iframe
                ref={frameRef}
                title={pages[pageTab].title}
                srcDoc={frameHtml || pages[pageTab].html}
                onLoad={bindEditor}
              />
            ) : loadingDraft ? (
              <div className="wbp-page-load">
                <span className="wbp-page-load-icon" aria-hidden="true">
                  <i />
                  <svg viewBox="0 0 48 48" fill="none">
                    <path d="M14 8h14l8 8v24a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z" stroke="#111" strokeWidth="2.4" />
                    <path d="M28 8v8h8" stroke="#111" strokeWidth="2.4" />
                    <path d="M16 26h16M16 32h10" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
                  </svg>
                </span>
                <p>Loading your page</p>
              </div>
            ) : (
              <p className="wbp-create-error">The site has no pages yet.</p>
            )}
          </div>
          </div>
          <input
            ref={imageFileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPreviewImage}
          />
          {resetWarn && (
            <div className="wbp-modal is-on" onClick={() => setResetWarn(false)}>
              <div className="wbp-modal-card wbp-reset-card" onClick={(event) => event.stopPropagation()}>
                <h2>Start over?</h2>
                <p>This clears the pages on this screen and takes you back to the beginning. You cannot undo it.</p>
                <div className="wbp-actions">
                  <button type="button" className="wbp-back" onClick={() => setResetWarn(false)}>Cancel</button>
                  <button type="button" className="wbp-next wbp-reset-go" onClick={startOver}>Start over</button>
                </div>
              </div>
            </div>
          )}
          {/*
          {aiOpen && (
            <form
              className="wbp-ai-bar"
              onSubmit={sendAiEdit}
            >
              <div className="wbp-ai-compose">
                <div
                  ref={aiFieldRef}
                  className={`wbp-ai-field${aiPicked ? "" : " is-locked"}`}
                  contentEditable="true"
                  role="textbox"
                  aria-disabled={!aiPicked}
                  aria-label={aiPicked ? "Tell the AI what to change" : "Select a section first"}
                  data-placeholder={aiPicked ? "Tell the AI what to change" : "Select a section first"}
                  suppressContentEditableWarning
                  onMouseDown={(event) => {
                    if (!aiFieldRef.current?.querySelector(".wbp-ai-chip")) event.preventDefault();
                  }}
                  onBeforeInput={(event) => {
                    if (!aiFieldRef.current?.querySelector(".wbp-ai-chip")) event.preventDefault();
                  }}
                  onPaste={(event) => {
                    if (!aiFieldRef.current?.querySelector(".wbp-ai-chip")) event.preventDefault();
                  }}
                  onKeyDown={(event) => {
                    if (aiFieldRef.current?.querySelector(".wbp-ai-chip")) return;
                    event.preventDefault();
                  }}
                  onInput={() => setAiPicked(!!aiFieldRef.current?.querySelector(".wbp-ai-chip"))}
                  onKeyUp={rememberAiCaret}
                  onMouseUp={rememberAiCaret}
                  onBlur={rememberAiCaret}
                />
                <div className="wbp-ai-tools">
                  <button type="submit" className={`wbp-ai-send${aiBusy ? " is-busy" : ""}`} aria-label={aiBusy ? "Working" : "Send"} disabled={!aiPicked || aiBusy}>
                    {aiBusy ? (
                      <i className="wbp-ai-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 19V5M6 11l6-6 6 6" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
          */}
        </section>
      )}
      {shot && (
        <div className="wbp-shot" onClick={() => setShot(null)}>
          <button type="button" className="wbp-shot-close" aria-label="Close" onClick={() => setShot(null)}>×</button>
          <img src={shot.src} alt={shot.label} onClick={(event) => event.stopPropagation()} />
          <p>{shot.label}</p>
        </div>
      )}
    </div>
  );
};

export default WebsiteBriefPage;
