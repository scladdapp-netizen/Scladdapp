/**
 * Per-screen styles for the website editor.
 *
 * A change made while the preview shows Desktop is written for every screen. A change made
 * while it shows Tablet or Mobile is written only for that size (and smaller, for Tablet), so the
 * desktop look stays as it was. They are stored as ordinary CSS inside the page, so the published
 * site keeps them:
 *
 *   <style id="sclad-responsive">
 *   [data-sx="a1"][data-sx="a1"]{padding-top:24px!important}
 *   @media (max-width:820px){
 *   [data-sx="a1"][data-sx="a1"]{padding-top:12px!important}
 *   }
 *   @media (max-width:480px){
 *   ...
 *   }
 *   </style>
 *
 * Each styled element carries a data-sx="key" attribute. The key is repeated in the selector so
 * the rule is stronger than the page's own rules (for example the full-height hero).
 */

export const SCREEN_WIDTH = { tablet: 820, mobile: 480 };
const STYLE_ID = "sclad-responsive";
const ORDER = ["desktop", "tablet", "mobile"];
// A screen uses its own rules first, then the ones for the bigger screens above it.
const CASCADE = {
  desktop: ["desktop"],
  tablet: ["tablet", "desktop"],
  mobile: ["mobile", "tablet", "desktop"],
};
// What "back to normal" means on a smaller screen when a bigger screen set a value.
const NEUTRAL = {
  width: "auto",
  height: "auto",
  "min-width": "0",
  "min-height": "0",
  "max-width": "none",
  "max-height": "none",
  "flex-direction": "row",
  "flex-wrap": "nowrap",
  "align-items": "stretch",
  "justify-content": "flex-start",
  "grid-template-columns": "none",
  position: "static",
  top: "auto",
  right: "auto",
  bottom: "auto",
  left: "auto",
  overflow: "visible",
  "text-align": "left",
  "white-space": "normal",
};

export const kebab = (key) => String(key).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function emptyRules() {
  return { desktop: {}, tablet: {}, mobile: {} };
}

function cleanValue(value) {
  const text = String(value ?? "").trim().replace(/\s*!important\s*$/i, "");
  if (!text || text.length > 120 || /[{};<>]|url\s*\(|expression\s*\(|@import/i.test(text)) return "";
  return text;
}

export function parseRules(text) {
  const rules = emptyRules();
  let bucket = "desktop";
  String(text || "").split("\n").forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const media = /^@media\s*\(max-width:\s*(\d+)px\)\s*\{$/.exec(line);
    if (media) {
      bucket = Number(media[1]) === SCREEN_WIDTH.tablet ? "tablet" : Number(media[1]) === SCREEN_WIDTH.mobile ? "mobile" : null;
      return;
    }
    if (line === "}") {
      bucket = "desktop";
      return;
    }
    const rule = /^\[data-sx="([\w-]+)"\]\[data-sx="\1"\]\{(.*)\}$/.exec(line);
    if (!rule || !bucket) return;
    const decls = rules[bucket][rule[1]] || {};
    rule[2].split(";").forEach((part) => {
      const at = part.indexOf(":");
      if (at < 1) return;
      const prop = part.slice(0, at).trim();
      const value = cleanValue(part.slice(at + 1));
      if (prop && value) decls[prop] = value;
    });
    if (Object.keys(decls).length) rules[bucket][rule[1]] = decls;
  });
  return rules;
}

export function serializeRules(rules) {
  const block = (map) => Object.entries(map || {})
    .filter(([, decls]) => Object.keys(decls).length)
    .map(([key, decls]) => `[data-sx="${key}"][data-sx="${key}"]{${Object.entries(decls).map(([prop, value]) => `${prop}:${value}!important`).join(";")}}`)
    .join("\n");
  const parts = [];
  ORDER.forEach((device) => {
    const body = block(rules[device]);
    if (!body) return;
    parts.push(device === "desktop" ? body : `@media (max-width:${SCREEN_WIDTH[device]}px){\n${body}\n}`);
  });
  return parts.join("\n");
}

function load(doc) {
  return parseRules(doc.getElementById(STYLE_ID)?.textContent || "");
}

function save(doc, rules) {
  let style = doc.getElementById(STYLE_ID);
  const text = serializeRules(rules);
  if (!style) {
    if (!text) return;
    style = doc.createElement("style");
    style.id = STYLE_ID;
    // After the page's own styles, so these win when the strength is equal.
    doc.head.appendChild(style);
  }
  style.textContent = text;
}

function keyOf(doc, el, create) {
  let key = el.getAttribute("data-sx");
  if (!key && create) {
    do {
      key = `s${Math.random().toString(36).slice(2, 8)}`;
    } while (doc.querySelector(`[data-sx="${key}"]`));
    el.setAttribute("data-sx", key);
  }
  return key || "";
}

function inherited(rules, key, device, prop, skipOwn) {
  const list = skipOwn ? CASCADE[device].slice(1) : CASCADE[device];
  for (const bucket of list) {
    const value = rules[bucket][key]?.[prop];
    if (value) return value;
  }
  return "";
}

/** The value this screen currently gets from the editor's rules (own or from a bigger screen). */
export function getDeviceStyle(doc, el, device, prop) {
  const key = keyOf(doc, el, false);
  if (!key) return "";
  return inherited(load(doc), key, device, kebab(prop), false);
}

/** The value a screen would get from the bigger screens above it, ignoring its own rules. */
export function getInheritedStyle(doc, el, device, prop) {
  const key = keyOf(doc, el, false);
  if (!key) return "";
  return inherited(load(doc), key, device, kebab(prop), true);
}

/**
 * Set one CSS property of an element for a screen. A null value means "back to normal":
 * on Desktop the rule is dropped, on a smaller screen the bigger screen's value is undone.
 */
export function setDeviceStyle(doc, el, device, prop, value) {
  const css = kebab(prop);
  const rules = load(doc);
  const key = keyOf(doc, el, true);
  // A value written straight on the element by an older edit would beat these rules, so it moves in here.
  const inline = el.style?.getPropertyValue(css);
  if (inline) {
    rules.desktop[key] = rules.desktop[key] || {};
    if (!rules.desktop[key][css]) rules.desktop[key][css] = cleanValue(inline) || inline;
    el.style.removeProperty(css);
  }
  const own = rules[device][key] || {};
  if (value === null || value === undefined || value === "") {
    delete own[css];
    if (device !== "desktop" && NEUTRAL[css] && inherited(rules, key, device, css, true)) own[css] = NEUTRAL[css];
  } else {
    const clean = cleanValue(value);
    if (clean) own[css] = clean;
  }
  if (Object.keys(own).length) rules[device][key] = own;
  else delete rules[device][key];
  save(doc, rules);
}

/** Does this element have changes made just for this (smaller) screen? */
export function hasDeviceStyles(doc, el, device) {
  if (device === "desktop") return false;
  const key = keyOf(doc, el, false);
  if (!key) return false;
  return Object.keys(load(doc)[device][key] || {}).length > 0;
}

/** Drop the changes made for one smaller screen so it follows the bigger screen again. */
export function clearDeviceStyles(doc, el, device) {
  if (device === "desktop") return;
  const key = keyOf(doc, el, false);
  if (!key) return;
  const rules = load(doc);
  delete rules[device][key];
  save(doc, rules);
}

/** A copy of an element (and the styled elements inside it) gets its own keys and the same rules. */
export function forkDeviceStyles(doc, original, copy) {
  const from = [original, ...original.querySelectorAll("[data-sx]")];
  const to = [copy, ...copy.querySelectorAll("[data-sx]")];
  const rules = load(doc);
  let changed = false;
  from.forEach((node, index) => {
    const twin = to[index];
    const oldKey = node.getAttribute?.("data-sx");
    if (!twin || !oldKey || twin === node) return;
    twin.removeAttribute("data-sx");
    const newKey = keyOf(doc, twin, true);
    ORDER.forEach((device) => {
      if (rules[device][oldKey]) {
        rules[device][newKey] = { ...rules[device][oldKey] };
        changed = true;
      }
    });
  });
  if (changed) save(doc, rules);
}
