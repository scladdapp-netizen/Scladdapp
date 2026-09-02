import { patchAttribute, patchStyles, applyTableTemplate } from "../pages/AdminSec/AdminPages/AIWebsiteEditor/htmlPatcher";
import { TABLE_STYLE_TEMPLATES, tableTemplateWithColor } from "./tableStyleTemplates";

const hleSel = (id) => `[data-hle-id="${id}"]`;

export const DEFAULT_SECTION_COLOR = "#111111";

/** Empty string = auto (derived from layout + accent color). */
export const SECTION_BG_AUTO = "";

export const SECTION_BG_PRESETS = [
  { id: "auto", label: "Auto", value: SECTION_BG_AUTO },
  { id: "transparent", label: "None", value: "transparent" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "gray", label: "Light gray", value: "#f3f4f6" },
  { id: "cream", label: "Cream", value: "#fffbeb" },
  { id: "blue", label: "Light blue", value: "#eff6ff" },
  { id: "green", label: "Light green", value: "#ecfdf5" },
  { id: "lavender", label: "Lavender", value: "#f5f3ff" },
];

const HEADER_LAYOUT_META = [
  { id: "classic", label: "Classic", description: "Logo left, school center, session right" },
  { id: "centered", label: "Centered", description: "Logo and school name centered" },
  { id: "split", label: "Split", description: "Logo left, all details stacked right" },
  { id: "minimal", label: "Minimal", description: "Clean thin header with subtle border" },
  { id: "banner-top", label: "Banner Top", description: "Dark banner above school details" },
  { id: "bordered", label: "Bordered", description: "Framed header with strong border" },
  { id: "accent-left", label: "Accent Left", description: "Colored left accent strip" },
  { id: "wide-logo", label: "Wide Logo", description: "Larger logo with spacious layout" },
  { id: "official", label: "Official", description: "Formal letterhead style" },
];

const STUDENT_LAYOUT_META = [
  { id: "photo-left", label: "Photo Left", description: "Photo on the left, fields on the right" },
  { id: "photo-top", label: "Photo Top", description: "Photo above student fields" },
  { id: "grid", label: "Grid", description: "No photo — fields in a compact grid" },
  { id: "inline", label: "Inline", description: "Single row with dividers" },
  { id: "card", label: "Card", description: "Student details in a bordered card" },
  { id: "bordered", label: "Bordered", description: "Full border around the info strip" },
  { id: "two-column", label: "Two Column", description: "Fields arranged in two columns" },
  { id: "compact-row", label: "Compact", description: "Dense single-row layout" },
  { id: "highlight", label: "Highlight", description: "Accent bar with shaded background" },
];

const REMARKS_LAYOUT_META = [
  { id: "side-by-side", label: "Side by Side", description: "Teacher and principal remarks in two columns" },
  { id: "stacked", label: "Stacked", description: "Remarks stacked vertically" },
  { id: "boxed", label: "Boxed", description: "Each remark in a bordered box" },
  { id: "signature", label: "Signature", description: "Extra space for signature lines" },
  { id: "accent-bar", label: "Accent Bar", description: "Colored left border on each remark" },
  { id: "cards", label: "Cards", description: "Rounded card style for each remark" },
  { id: "minimal", label: "Minimal", description: "Clean labels without divider lines" },
  { id: "bordered", label: "Bordered", description: "Full border around remarks section" },
  { id: "formal", label: "Formal", description: "Double-line formal remark style" },
];

const SECTION_DEFS = [
  {
    type: "school-header",
    label: "School Header",
    rootId: "rc-header",
    match: /^(rc-header|rc-banner|rc-logo|rc-school|rc-header-)/,
    layouts: HEADER_LAYOUT_META,
  },
  {
    type: "student-info",
    label: "Student Info",
    rootId: "rc-student-strip",
    match: /^(rc-student|rc-field-)/,
    layouts: STUDENT_LAYOUT_META,
  },
  {
    type: "academic-scores",
    label: "Academic Scores",
    rootId: "rc-scores-section",
    tableId: "rc-scores-table",
    match: /^rc-scores/,
    layouts: TABLE_STYLE_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      description: "Table layout for academic scores",
      tableTemplate: t,
    })),
  },
  {
    type: "behavioral-traits",
    label: "Behavioral Traits",
    rootId: "rc-traits",
    tableId: "rc-traits-table",
    match: /^rc-traits/,
    layouts: TABLE_STYLE_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      description: "Table layout for behavioral traits",
      tableTemplate: t,
    })),
  },
  {
    type: "grading-scale",
    label: "Grading Scale",
    rootId: "rc-scheme",
    tableId: "rc-scheme-table",
    match: /^rc-scheme/,
    layouts: TABLE_STYLE_TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      description: "Table layout for grading scale",
      tableTemplate: t,
    })),
  },
  {
    type: "remarks",
    label: "Remarks",
    rootId: "rc-remarks",
    match: /^rc-remark/,
    layouts: REMARKS_LAYOUT_META,
  },
];

export const SECTION_COLOR_PRESETS = [
  "#111111",
  "#1e3a5f",
  "#166534",
  "#0f766e",
  "#6d28d9",
  "#b45309",
  "#be123c",
  "#0369a1",
];

function findElBySelector(html, selector) {
  if (!html || !selector) return null;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (
      doc.querySelector(selector) ||
      doc.querySelector(selector.replace(/:nth-of-type\(\d+\)/g, ""))
    );
  } catch {
    return null;
  }
}

function walkHleId(el) {
  let cur = el;
  while (cur) {
    const id = cur.getAttribute?.("data-hle-id");
    if (id) return id;
    cur = cur.parentElement;
  }
  return null;
}

/** Merge baseline + layout so leftover styles from the previous template are cleared. */
function patchLayout(html, selector, baseline, layout = {}) {
  return patchStyles(html, selector, { ...baseline, ...layout });
}

const HEADER_BASE = {
  header: {
    display: "flex",
    "flex-direction": "row",
    "align-items": "center",
    gap: "10px",
    padding: "10px 14px",
    "text-align": "left",
    "border-bottom": "1px solid #e5e7eb",
    border: "none",
    "border-left": "none",
    margin: "0",
    "border-radius": "0",
    background: "rgba(255,255,255,0.88)",
  },
  schoolInfo: {
    flex: "1",
    "text-align": "center",
    width: "auto",
    "padding-left": "0",
    padding: "0",
  },
  headerRight: {
    display: "block",
    "text-align": "right",
    "margin-top": "0",
    padding: "0",
    width: "auto",
  },
  logo: {
    display: "flex",
    width: "40px",
    height: "40px",
    margin: "0",
  },
  banner: {
    display: "block",
    "text-align": "center",
    padding: "4px 0",
    width: "auto",
    order: "0",
    "letter-spacing": "3px",
    "font-size": "8px",
    background: "#111111",
    color: "#ffffff",
  },
};

const STUDENT_BASE = {
  strip: {
    display: "flex",
    "flex-direction": "row",
    "align-items": "stretch",
    gap: "10px",
    padding: "10px 14px",
    border: "none",
    "border-radius": "0",
    margin: "0",
    background: "rgba(249,250,251,0.75)",
    "border-left": "none",
    "border-bottom": "1px solid #e5e7eb",
  },
  photo: {
    display: "flex",
    width: "48px",
    height: "60px",
    margin: "0",
  },
  fields: {
    flex: "1",
    display: "flex",
    "flex-direction": "column",
    gap: "6px",
    width: "auto",
    "grid-template-columns": "",
  },
};

const REMARKS_BASE = {
  root: {
    display: "flex",
    "flex-direction": "row",
    gap: "12px",
    padding: "0",
    border: "none",
    "border-radius": "0",
  },
  remarkBox: {
    flex: "1",
    padding: "0",
    border: "none",
    background: "transparent",
    "border-radius": "0",
    "border-left": "none",
    "padding-left": "0",
    "padding-bottom": "0",
  },
  remarkLabel: {
    margin: "0 0 3px",
    "font-size": "7px",
    "font-weight": "700",
    "text-transform": "uppercase",
    "letter-spacing": "0.5px",
    color: "#9ca3af",
    "border-bottom": "none",
    "padding-bottom": "0",
    display: "block",
  },
  remarkLine: {
    height: "1px",
    background: "#e5e7eb",
    margin: "0 0 5px",
    display: "block",
    "margin-top": "0",
  },
  remarkText: {
    margin: "0",
    "font-size": "10px",
    color: "#374151",
    "font-style": "italic",
    "line-height": "1.5",
    "margin-top": "0",
    "margin-bottom": "0",
  },
};

export function detectReportSection(html, selector) {
  if (!html || !selector) return null;
  const el = findElBySelector(html, selector);
  if (!el) return null;
  const hleId = walkHleId(el);
  if (!hleId) return null;

  const def = SECTION_DEFS.find((s) => s.match.test(hleId));
  if (!def) return null;

  const rootEl = findElBySelector(html, hleSel(def.rootId));
  const layoutId = rootEl?.getAttribute("data-section-layout") || def.layouts[0]?.id || "";
  const color = rootEl?.getAttribute("data-section-color") || DEFAULT_SECTION_COLOR;
  const backgroundColor = rootEl?.getAttribute("data-section-bg-color") ?? SECTION_BG_AUTO;

  return {
    ...def,
    hleId,
    rootSelector: hleSel(def.rootId),
    tableSelector: def.tableId ? hleSel(def.tableId) : null,
    layoutId,
    color,
    backgroundColor,
  };
}

function applySchoolHeaderLayout(html, layoutId) {
  let next = patchAttribute(html, hleSel("rc-header"), "data-section-layout", layoutId);

  const layouts = {
    classic: {
      header: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "10px", padding: "10px 14px", "text-align": "left", "border-bottom": "1px solid #e5e7eb" },
      schoolInfo: { flex: "1", "text-align": "center" },
      headerRight: { display: "block", "text-align": "right" },
      logo: { display: "flex", width: "40px", height: "40px" },
      banner: { display: "block", "text-align": "center", padding: "4px 0" },
    },
    centered: {
      header: { display: "flex", "flex-direction": "column", "align-items": "center", gap: "8px", padding: "14px", "text-align": "center", "border-bottom": "2px solid #e5e7eb" },
      schoolInfo: { flex: "none", "text-align": "center", width: "100%" },
      headerRight: { display: "none" },
      logo: { display: "flex", margin: "0 auto", width: "48px", height: "48px" },
      banner: { display: "block", "text-align": "center", padding: "6px 0", "letter-spacing": "4px" },
    },
    split: {
      header: { display: "flex", "flex-direction": "row", "align-items": "flex-start", gap: "14px", padding: "12px 14px", "text-align": "left", "border-bottom": "1px solid #d1d5db" },
      schoolInfo: { flex: "1", "text-align": "left" },
      headerRight: { display: "block", "text-align": "right", "margin-top": "4px" },
      logo: { display: "flex", width: "44px", height: "44px" },
      banner: { display: "block", "text-align": "left", padding: "5px 14px", "font-size": "9px" },
    },
    minimal: {
      header: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "8px", padding: "8px 12px", "text-align": "left", "border-bottom": "1px solid #f3f4f6", background: "rgba(255,255,255,0.95)" },
      schoolInfo: { flex: "1", "text-align": "left" },
      headerRight: { display: "block", "text-align": "right" },
      logo: { display: "flex", width: "32px", height: "32px" },
      banner: { display: "none" },
    },
    "banner-top": {
      header: { display: "flex", "flex-direction": "column", gap: "0", padding: "0", "border-bottom": "none" },
      schoolInfo: { flex: "1", "text-align": "center", padding: "10px 14px" },
      headerRight: { display: "block", "text-align": "center", padding: "0 14px 8px" },
      logo: { display: "flex", margin: "8px auto 0", width: "44px", height: "44px" },
      banner: { display: "block", "text-align": "center", padding: "6px 0", width: "100%", order: "-1" },
    },
    bordered: {
      header: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "10px", padding: "12px 14px", border: "2px solid #111111", margin: "8px 10px", "border-radius": "4px" },
      schoolInfo: { flex: "1", "text-align": "center" },
      headerRight: { display: "block", "text-align": "right" },
      logo: { display: "flex", width: "40px", height: "40px" },
      banner: { display: "block", "text-align": "center", padding: "4px 0" },
    },
    "accent-left": {
      header: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "10px", padding: "10px 14px 10px 10px", "border-left": "4px solid #111111", "border-bottom": "1px solid #e5e7eb" },
      schoolInfo: { flex: "1", "text-align": "left", "padding-left": "6px" },
      headerRight: { display: "block", "text-align": "right" },
      logo: { display: "flex", width: "40px", height: "40px" },
      banner: { display: "block", "text-align": "left", padding: "4px 14px" },
    },
    "wide-logo": {
      header: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "16px", padding: "14px 16px", "border-bottom": "1px solid #e5e7eb" },
      schoolInfo: { flex: "1", "text-align": "left" },
      headerRight: { display: "block", "text-align": "right" },
      logo: { display: "flex", width: "56px", height: "56px" },
      banner: { display: "block", "text-align": "center", padding: "5px 0" },
    },
    official: {
      header: { display: "flex", "flex-direction": "column", "align-items": "center", gap: "6px", padding: "12px 14px 10px", "border-bottom": "3px double #111111", "text-align": "center" },
      schoolInfo: { flex: "none", "text-align": "center", width: "100%" },
      headerRight: { display: "block", "text-align": "center", width: "100%" },
      logo: { display: "flex", margin: "0 auto", width: "46px", height: "46px" },
      banner: { display: "block", "text-align": "center", padding: "5px 0", "letter-spacing": "5px" },
    },
  };

  const cfg = layouts[layoutId] || layouts.classic;
  next = patchLayout(next, hleSel("rc-header"), HEADER_BASE.header, cfg.header);
  next = patchLayout(next, hleSel("rc-school-info"), HEADER_BASE.schoolInfo, cfg.schoolInfo);
  next = patchLayout(next, hleSel("rc-header-right"), HEADER_BASE.headerRight, cfg.headerRight);
  next = patchLayout(next, hleSel("rc-logo"), HEADER_BASE.logo, cfg.logo);
  next = patchLayout(next, hleSel("rc-banner"), HEADER_BASE.banner, cfg.banner);
  return next;
}

function applyStudentInfoLayout(html, layoutId) {
  let next = patchAttribute(html, hleSel("rc-student-strip"), "data-section-layout", layoutId);

  const layouts = {
    "photo-left": {
      strip: { display: "flex", "flex-direction": "row", gap: "10px", padding: "10px 14px", border: "none", background: "rgba(249,250,251,0.75)" },
      photo: { display: "flex", width: "48px", height: "60px" },
      fields: { flex: "1", display: "flex", "flex-direction": "column", gap: "6px" },
    },
    "photo-top": {
      strip: { display: "flex", "flex-direction": "column", "align-items": "center", gap: "10px", padding: "12px 14px", border: "none" },
      photo: { display: "flex", width: "56px", height: "68px" },
      fields: { width: "100%", display: "flex", "flex-direction": "column", gap: "8px" },
    },
    grid: {
      strip: { display: "block", padding: "12px 14px", border: "none" },
      photo: { display: "none" },
      fields: { display: "grid", "grid-template-columns": "1fr 1fr 1fr", gap: "10px" },
    },
    inline: {
      strip: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "0", padding: "8px 14px", border: "none" },
      photo: { display: "none" },
      fields: { flex: "1", display: "flex", "flex-direction": "row", gap: "0" },
    },
    card: {
      strip: { display: "flex", "flex-direction": "row", gap: "10px", padding: "12px 14px", border: "1px solid #e5e7eb", "border-radius": "8px", margin: "0 10px", background: "#ffffff" },
      photo: { display: "flex", width: "48px", height: "60px" },
      fields: { flex: "1", display: "flex", "flex-direction": "column", gap: "6px" },
    },
    bordered: {
      strip: { display: "flex", "flex-direction": "row", gap: "10px", padding: "10px 14px", border: "2px solid #d1d5db", background: "#fafafa" },
      photo: { display: "flex", width: "48px", height: "60px" },
      fields: { flex: "1", display: "flex", "flex-direction": "column", gap: "6px" },
    },
    "two-column": {
      strip: { display: "block", padding: "12px 14px", border: "none" },
      photo: { display: "flex", width: "48px", height: "60px", margin: "0 0 8px" },
      fields: { display: "grid", "grid-template-columns": "1fr 1fr", gap: "10px 16px" },
    },
    "compact-row": {
      strip: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "8px", padding: "6px 12px", border: "none" },
      photo: { display: "flex", width: "36px", height: "44px" },
      fields: { flex: "1", display: "flex", "flex-direction": "column", gap: "4px" },
    },
    highlight: {
      strip: { display: "flex", "flex-direction": "row", gap: "10px", padding: "10px 14px", "border-left": "4px solid #111111", background: "rgba(249,250,251,0.9)" },
      photo: { display: "flex", width: "48px", height: "60px" },
      fields: { flex: "1", display: "flex", "flex-direction": "column", gap: "6px" },
    },
  };

  const cfg = layouts[layoutId] || layouts["photo-left"];
  next = patchLayout(next, hleSel("rc-student-strip"), STUDENT_BASE.strip, cfg.strip);
  next = patchLayout(next, hleSel("rc-student-photo"), STUDENT_BASE.photo, cfg.photo);
  next = patchLayout(next, hleSel("rc-student-fields"), STUDENT_BASE.fields, cfg.fields);
  return next;
}

function applyRemarksLayout(html, layoutId) {
  let next = patchAttribute(html, hleSel("rc-remarks"), "data-section-layout", layoutId);

  const remarkBox = (extra = {}) => ({ ...extra });
  const label = (extra = {}) => ({ ...extra });
  const line = (extra = {}) => ({ ...extra });
  const text = (extra = {}) => ({ ...extra });

  const layouts = {
    "side-by-side": {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox(),
      principal: remarkBox(),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "block" }),
      principalLine: line({ display: "block" }),
      teacherText: text(),
      principalText: text(),
    },
    stacked: {
      root: { display: "flex", "flex-direction": "column", gap: "14px", padding: "0", border: "none" },
      teacher: remarkBox(),
      principal: remarkBox(),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "block" }),
      principalLine: line({ display: "block" }),
      teacherText: text(),
      principalText: text(),
    },
    boxed: {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox({ padding: "10px", border: "1px solid #e5e7eb", "border-radius": "6px", background: "#fafafa" }),
      principal: remarkBox({ padding: "10px", border: "1px solid #e5e7eb", "border-radius": "6px", background: "#fafafa" }),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "none" }),
      principalLine: line({ display: "none" }),
      teacherText: text({ "font-style": "normal" }),
      principalText: text({ "font-style": "normal" }),
    },
    signature: {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox({ "padding-bottom": "24px" }),
      principal: remarkBox({ "padding-bottom": "24px" }),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "block", "margin-bottom": "28px" }),
      principalLine: line({ display: "block", "margin-bottom": "28px" }),
      teacherText: text({ "margin-bottom": "16px" }),
      principalText: text({ "margin-bottom": "16px" }),
    },
    "accent-bar": {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox({ "border-left": "3px solid #111111", "padding-left": "10px" }),
      principal: remarkBox({ "border-left": "3px solid #111111", "padding-left": "10px" }),
      teacherLabel: label({ color: "#111111" }),
      principalLabel: label({ color: "#111111" }),
      teacherLine: line({ display: "block" }),
      principalLine: line({ display: "block" }),
      teacherText: text(),
      principalText: text(),
    },
    cards: {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox({ padding: "12px", border: "1px solid #e5e7eb", "border-radius": "10px", background: "#ffffff" }),
      principal: remarkBox({ padding: "12px", border: "1px solid #e5e7eb", "border-radius": "10px", background: "#ffffff" }),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "none" }),
      principalLine: line({ display: "none" }),
      teacherText: text({ "font-style": "normal" }),
      principalText: text({ "font-style": "normal" }),
    },
    minimal: {
      root: { display: "flex", "flex-direction": "row", gap: "16px", padding: "0", border: "none" },
      teacher: remarkBox(),
      principal: remarkBox(),
      teacherLabel: label({ "text-transform": "none", "font-size": "8px" }),
      principalLabel: label({ "text-transform": "none", "font-size": "8px" }),
      teacherLine: line({ display: "none" }),
      principalLine: line({ display: "none" }),
      teacherText: text({ "font-style": "normal" }),
      principalText: text({ "font-style": "normal" }),
    },
    bordered: {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "12px", border: "1px solid #d1d5db", "border-radius": "4px" },
      teacher: remarkBox(),
      principal: remarkBox(),
      teacherLabel: label(),
      principalLabel: label(),
      teacherLine: line({ display: "block" }),
      principalLine: line({ display: "block" }),
      teacherText: text(),
      principalText: text(),
    },
    formal: {
      root: { display: "flex", "flex-direction": "row", gap: "12px", padding: "0", border: "none" },
      teacher: remarkBox(),
      principal: remarkBox(),
      teacherLabel: label({ "letter-spacing": "1px", "border-bottom": "1px solid #111111", "padding-bottom": "4px", display: "inline-block" }),
      principalLabel: label({ "letter-spacing": "1px", "border-bottom": "1px solid #111111", "padding-bottom": "4px", display: "inline-block" }),
      teacherLine: line({ display: "block", height: "2px", background: "#111111", "margin-top": "4px" }),
      principalLine: line({ display: "block", height: "2px", background: "#111111", "margin-top": "4px" }),
      teacherText: text({ "font-style": "normal", "margin-top": "8px" }),
      principalText: text({ "font-style": "normal", "margin-top": "8px" }),
    },
  };

  const cfg = layouts[layoutId] || layouts["side-by-side"];
  next = patchLayout(next, hleSel("rc-remarks"), REMARKS_BASE.root, cfg.root);
  next = patchLayout(next, hleSel("rc-remark-teacher"), REMARKS_BASE.remarkBox, cfg.teacher);
  next = patchLayout(next, hleSel("rc-remark-principal"), REMARKS_BASE.remarkBox, cfg.principal);
  next = patchLayout(next, hleSel("rc-remark-teacher-label"), REMARKS_BASE.remarkLabel, cfg.teacherLabel);
  next = patchLayout(next, hleSel("rc-remark-principal-label"), REMARKS_BASE.remarkLabel, cfg.principalLabel);
  next = patchLayout(next, hleSel("rc-remark-teacher-line"), REMARKS_BASE.remarkLine, cfg.teacherLine);
  next = patchLayout(next, hleSel("rc-remark-principal-line"), REMARKS_BASE.remarkLine, cfg.principalLine);
  next = patchLayout(next, hleSel("rc-remark-teacher-text"), REMARKS_BASE.remarkText, cfg.teacherText);
  next = patchLayout(next, hleSel("rc-remark-principal-text"), REMARKS_BASE.remarkText, cfg.principalText);
  return next;
}

function applyTableSectionLayout(html, section, layoutId) {
  const layout = section.layouts.find((l) => l.id === layoutId);
  if (!layout?.tableTemplate || !section.tableSelector) return html;
  let next = patchAttribute(html, section.rootSelector, "data-section-layout", layoutId);
  next = applyTableTemplate(next, section.tableSelector, layout.tableTemplate);
  return next;
}

export function applyReportSectionLayout(html, section, layoutId) {
  if (!html || !section || !layoutId) return html;
  switch (section.type) {
    case "school-header":
      return applySchoolHeaderLayout(html, layoutId);
    case "student-info":
      return applyStudentInfoLayout(html, layoutId);
    case "remarks":
      return applyRemarksLayout(html, layoutId);
    case "academic-scores":
    case "behavioral-traits":
    case "grading-scale":
      return applyTableSectionLayout(html, section, layoutId);
    default:
      return html;
  }
}

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(17,17,17,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveSectionBackground(section, accentColor) {
  const layout = section.layoutId;
  switch (section.type) {
    case "school-header":
      if (layout === "minimal") return "rgba(255,255,255,0.95)";
      return hexToRgba(accentColor, 0.06);
    case "student-info":
      if (layout === "card") return "#ffffff";
      if (layout === "bordered") return "#fafafa";
      return hexToRgba(accentColor, 0.08);
    case "remarks":
      return "transparent";
    case "academic-scores":
    case "behavioral-traits":
    case "grading-scale":
      return "transparent";
    default:
      return "transparent";
  }
}

function sectionBackgroundTarget(section) {
  switch (section.type) {
    case "school-header":
      return hleSel("rc-header");
    case "student-info":
      return hleSel("rc-student-strip");
    case "remarks":
      return hleSel("rc-remarks");
    case "academic-scores":
      return hleSel("rc-scores-section");
    case "behavioral-traits":
      return hleSel("rc-traits");
    case "grading-scale":
      return hleSel("rc-scheme");
    default:
      return null;
  }
}

export function applyReportSectionBackground(html, section, backgroundColor, accentColor) {
  if (!html || !section) return html;
  const accent = accentColor || section.color || DEFAULT_SECTION_COLOR;
  const isAuto = backgroundColor === SECTION_BG_AUTO || backgroundColor === null || backgroundColor === undefined;
  let next = patchAttribute(html, section.rootSelector, "data-section-bg-color", isAuto ? "" : backgroundColor);

  const target = sectionBackgroundTarget(section);
  if (!target) return next;

  const effectiveBg = isAuto ? resolveSectionBackground(section, accent) : backgroundColor;
  next = patchStyles(next, target, { background: effectiveBg });
  return next;
}

export function applyReportSectionColor(html, section, color) {
  if (!html || !section || !color) return html;
  let next = patchAttribute(html, section.rootSelector, "data-section-color", color);

  switch (section.type) {
    case "school-header": {
      const layout = findElBySelector(next, hleSel("rc-header"))?.getAttribute("data-section-layout");
      next = patchStyles(next, hleSel("rc-header"), {
        "border-bottom-color": hexToRgba(color, 0.25),
        "border-left-color": layout === "accent-left" ? color : "",
      });
      next = patchStyles(next, hleSel("rc-school-name"), { color });
      if (layout === "minimal") {
        next = patchStyles(next, hleSel("rc-banner"), {
          display: "none",
          background: "",
          color: "",
        });
      } else {
        next = patchStyles(next, hleSel("rc-banner"), {
          display: "block",
          background: color,
          color: "#ffffff",
        });
      }
      next = patchStyles(next, hleSel("rc-header-title"), { color });
      return next;
    }
    case "student-info": {
      const layout = findElBySelector(next, hleSel("rc-student-strip"))?.getAttribute("data-section-layout");
      next = patchStyles(next, hleSel("rc-student-strip"), {
        "border-bottom": `1px solid ${hexToRgba(color, 0.2)}`,
        "border-left-color": layout === "highlight" ? color : "",
        "border-left-width": layout === "highlight" ? "4px" : "",
        "border-left-style": layout === "highlight" ? "solid" : "",
      });
      return next;
    }
    case "remarks": {
      const layout = findElBySelector(next, hleSel("rc-remarks"))?.getAttribute("data-section-layout");
      next = patchStyles(next, hleSel("rc-remarks"), {
        "border-color": hexToRgba(color, 0.35),
      });
      next = patchStyles(next, hleSel("rc-remark-teacher"), {
        "border-left-color": layout === "accent-bar" ? color : "",
        "border-left-width": layout === "accent-bar" ? "3px" : "",
        "border-left-style": layout === "accent-bar" ? "solid" : "",
      });
      next = patchStyles(next, hleSel("rc-remark-principal"), {
        "border-left-color": layout === "accent-bar" ? color : "",
        "border-left-width": layout === "accent-bar" ? "3px" : "",
        "border-left-style": layout === "accent-bar" ? "solid" : "",
      });
      next = patchStyles(next, hleSel("rc-remark-teacher-label"), { color: hexToRgba(color, 0.75) });
      next = patchStyles(next, hleSel("rc-remark-principal-label"), { color: hexToRgba(color, 0.75) });
      next = patchStyles(next, hleSel("rc-remark-teacher-line"), { background: hexToRgba(color, 0.35) });
      next = patchStyles(next, hleSel("rc-remark-principal-line"), { background: hexToRgba(color, 0.35) });
      return next;
    }
    case "academic-scores":
    case "behavioral-traits":
    case "grading-scale": {
      if (!section.tableSelector) return next;
      const layoutId = section.layoutId || section.layouts[0]?.id || "striped";
      const tpl = tableTemplateWithColor(layoutId, color);
      next = applyTableTemplate(next, section.tableSelector, tpl);
      const titleId =
        section.type === "academic-scores"
          ? "rc-scores-title"
          : section.type === "behavioral-traits"
            ? "rc-traits-title"
            : "rc-scheme-title";
      next = patchStyles(next, hleSel(titleId), { color });
      return next;
    }
    default:
      return next;
  }
}

export function resetReportSection(html, section) {
  if (!html || !section) return html;
  const defaultLayout = section.layouts[0]?.id;
  if (!defaultLayout) return html;
  let next = applyReportSectionLayout(html, section, defaultLayout);
  const themed = { ...section, layoutId: defaultLayout, backgroundColor: SECTION_BG_AUTO };
  next = applyReportSectionColor(next, themed, DEFAULT_SECTION_COLOR);
  next = applyReportSectionBackground(next, themed, SECTION_BG_AUTO, DEFAULT_SECTION_COLOR);
  return next;
}

export function getSectionLayouts(section) {
  return section?.layouts || [];
}
