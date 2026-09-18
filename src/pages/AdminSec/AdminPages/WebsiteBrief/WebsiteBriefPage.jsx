import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import useSchool from "../../../../api_call/useSchool";
import useWebsiteRequest from "../../../../api_call/useWebsiteRequest";
import { TUTORIAL_PAGE_WEBSITE_BRIEF } from "../../../../api_call/useTutorialVideos";
import SetupSchoolVideo from "../SchoolDirectory/SetupSchoolVideo/SetupSchoolVideo";
import "./WebsiteBriefPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

// Reference viewport for auto-sizing preview iframes. Sections written against
// 100vh render at this height instead of chasing the iframe's own size.
const AUTO_HEIGHT_VIEWPORT = 560;
const AUTO_HEIGHT_MAX = 20000;
const AUTO_HEIGHT_MAX_PASSES = 24;

/**
 * Rewrite viewport-height units to fixed pixels.
 *
 * An auto-sized iframe is exactly as tall as its content, so inside it `100vh`
 * resolves to the iframe's own height. A hero using `height:100vh` therefore
 * grows every time we measure it and apply the result — the section expands
 * forever. Pinning vh to a constant breaks that cycle at the source, and a
 * 100vh hero then renders at a sane, stable height.
 */
const neutralizeViewportUnits = (css) =>
  String(css || "").replace(
    /(-?\d*\.?\d+)(dvh|svh|lvh|vh)\b/gi,
    (_, n) => `${((parseFloat(n) / 100) * AUTO_HEIGHT_VIEWPORT).toFixed(2)}px`,
  );

// Required sections depend on the page:
// Home → hero + navigation/footer chrome
// Other pages → navigation/footer chrome only (no hero)
const HOME_LOCKED = ["topbar", "hero", "navbar", "navigation", "footer"];
const PAGE_LOCKED = ["topbar", "navbar", "navigation", "footer"];

const isHomePage = (pageId) => pageId === "home" || pageId === "/";

const lockedTokensForPage = (pageId) =>
  isHomePage(pageId) ? HOME_LOCKED : PAGE_LOCKED;

const isLocked = (category, pageId = "home") =>
  lockedTokensForPage(pageId).some((l) => category?.toLowerCase().includes(l));

const isHeroCategory = (category) =>
  String(category || "")
    .toLowerCase()
    .includes("hero");

// A section is an *instance* of a category, and a page may hold several from
// the same one, so `id` identifies the instance and `categoryId` the template
// family. Briefs saved before duplicates were allowed have no `categoryId` —
// back then the instance id was the category id.
const catIdOf = (sec) => sec?.categoryId || sec?.id;

const makeSectionId = (categoryId) =>
  `${categoryId}__${Math.random().toString(36).slice(2, 8)}`;

// ── Fetch website templates ───────────────────────────────────────────────────
const useWebsiteTemplates = () => {
  const [categories, setCategories] = useState([]); // [{ id, label, templates: [...] }]
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/website-templates`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        // Use only type==="section" templates
        const sections = data.data?.sections || [];

        // Group by category
        const map = {};
        sections.forEach((t) => {
          const key = t.category?.trim() || "Other";
          if (!map[key]) map[key] = { id: key, label: key, templates: [] };
          map[key].templates.push(t);
        });

        // Sort: home-required chrome first, then alphabetically
        const sorted = Object.values(map).sort((a, b) => {
          const aLocked = isLocked(a.id, "home");
          const bLocked = isLocked(b.id, "home");
          if (aLocked && !bLocked) return -1;
          if (!aLocked && bLocked) return 1;
          return a.label.localeCompare(b.label);
        });

        setCategories(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
};

// ── Build default selected sections from categories ───────────────────────────
const buildDefaultSections = (categories, pageId = "home") =>
  categories
    .filter((c) => isLocked(c.id, pageId))
    .map((c, i) => ({
      id: c.id,
      categoryId: c.id,
      label: c.label,
      templateId: c.templates[0]?.template_id || null,
      notes: "",
      order: i,
      content: {},
    }));

const PAGE_PRESETS = [
  { id: "home", title: "Home", slug: "/", locked: true },
  { id: "about", title: "About", slug: "/about" },
  { id: "admissions", title: "Admissions", slug: "/admissions" },
  { id: "academics", title: "Academics", slug: "/academics" },
  { id: "contact", title: "Contact", slug: "/contact" },
];

const slugify = (title) =>
  `/${
    String(title || "page")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "page"
  }`;

const createPage = (preset, categories, order = 0) => {
  const id = preset.id || `page_${Date.now()}`;
  return {
    id,
    title: preset.title || "New Page",
    slug: preset.slug || slugify(preset.title),
    order,
    sections: buildDefaultSections(categories, id),
  };
};

const normalizePages = (pages = [], sections = [], categories = []) => {
  if (Array.isArray(pages) && pages.length > 0) {
    return pages.map((p, i) => ({
      id: p.id || `page_${i}`,
      title: p.title || `Page ${i + 1}`,
      slug: p.slug || (i === 0 ? "/" : slugify(p.title || `page-${i + 1}`)),
      order: p.order ?? i,
      sections: Array.isArray(p.sections) ? p.sections : [],
    }));
  }
  if (Array.isArray(sections) && sections.length > 0) {
    return [{ id: "home", title: "Home", slug: "/", order: 0, sections }];
  }
  return [createPage(PAGE_PRESETS[0], categories, 0)];
};

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  {
    id: "modern",
    label: "Modern",
    sample: "Aa",
    desc: "Clean, geometric sans-serif",
    fontStyle: {
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      fontWeight: 700,
    },
  },
  {
    id: "classic",
    label: "Classic",
    sample: "Aa",
    desc: "Elegant serif typeface",
    fontStyle: {
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
    },
  },
  {
    id: "playful",
    label: "Playful",
    sample: "Aa",
    desc: "Friendly, rounded feel",
    fontStyle: {
      fontFamily: "'Trebuchet MS', 'Comic Sans MS', cursive",
      fontWeight: 700,
    },
  },
];

// ── Step bar ──────────────────────────────────────────────────────────────────
// Slot id the page tabs portal into, so they share this row from the far side
const STEPBAR_SLOT_ID = "wbp-stepbar-slot";

const StepBar = ({ step, onStep, isSubmitted }) => {
  const steps = ["Brand & Style", "Pages", "Final Notes"];
  return (
    <div className="wbp-stepbar">
      <div className="wbp-stepbar-steps">
        {steps.map((label, i) => {
          const num = i + 1;
          const active = step === num;
          const done = step > num;
          return (
            <button
              key={num}
              className={`wbp-step ${active ? "wbp-step--active" : ""} ${done ? "wbp-step--done" : ""}`}
              onClick={() => !isSubmitted && onStep(num)}
              disabled={isSubmitted && !done && !active}
              aria-current={active ? "step" : undefined}
            >
              <span className="wbp-step-num">
                {done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  num
                )}
              </span>
              <span className="wbp-step-label">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="wbp-stepbar-slot" id={STEPBAR_SLOT_ID} />
    </div>
  );
};

// ── Color picker ──────────────────────────────────────────────────────────────
const ColorPicker = ({ label, value, onChange, disabled }) => (
  <div className="wbp-color-row">
    <label className="wbp-color-label">{label}</label>
    <div className="wbp-color-wrap">
      <input
        type="color"
        className="wbp-color-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
      />
      <input
        type="text"
        className="wbp-color-hex"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        disabled={disabled}
        aria-label={`${label} hex`}
      />
      <span
        className="wbp-color-swatch"
        style={{ background: value }}
        aria-hidden="true"
      />
    </div>
  </div>
);

// ── Step 1 — Brand & Style ────────────────────────────────────────────────────
const Step1 = ({ school, brief, onChange, disabled }) => (
  <div className="wbp-step-body">
    <div className="wbp-school-card">
      <div className="wbp-school-logo-wrap">
        {school?.logo_url ? (
          <img
            src={
              typeof school.logo_url === "string"
                ? school.logo_url
                : school.logo_url?.url
            }
            alt={school.school_name}
            className="wbp-school-logo"
          />
        ) : (
          <div className="wbp-school-logo-placeholder">
            {school?.school_name?.charAt(0)?.toUpperCase() || "S"}
          </div>
        )}
      </div>
      <div className="wbp-school-info">
        <p className="wbp-school-name">
          {school?.school_name || "Your School"}
        </p>
        {school?.motto && <p className="wbp-school-motto">"{school.motto}"</p>}
        <p className="wbp-school-note">
          Pulled from your school profile · no re-upload needed
        </p>
      </div>
    </div>

    <div className="wbp-divider" />

    <div className="wbp-field-group">
      <h3 className="wbp-field-group-title">Brand Colors</h3>
      <p className="wbp-field-group-hint">
        These colors set the look of your school website. Pick ones that match
        your logo and branding.
      </p>

      <div className="wbp-colors-stack">
        <div className="wbp-color-item">
          <ColorPicker
            label="Primary Color"
            value={brief.primary_color || "#111111"}
            onChange={(v) => onChange("primary_color", v)}
            disabled={disabled}
          />
          <p className="wbp-color-help">
            Main brand color — used for buttons, links, headings, and the
            strongest accents.
          </p>
        </div>

        <div className="wbp-color-item">
          <ColorPicker
            label="Secondary Color"
            value={brief.secondary_color || "#6c5ce7"}
            onChange={(v) => onChange("secondary_color", v)}
            disabled={disabled}
          />
          <p className="wbp-color-help">
            Supporting accent color — used for highlights, badges, hover states,
            and secondary details.
          </p>
        </div>

        <div className="wbp-color-item">
          <ColorPicker
            label="Background Color"
            value={brief.background_color || "#ffffff"}
            onChange={(v) => onChange("background_color", v)}
            disabled={disabled}
          />
          <p className="wbp-color-help">
            Page background color — the base surface behind sections, cards, and
            content.
          </p>
        </div>
      </div>

      <div
        className="wbp-color-preview wbp-color-preview--site"
        style={{ background: brief.background_color || "#ffffff" }}
      >
        <span
          style={{ background: brief.primary_color || "#111111" }}
          className="wbp-color-pill"
        >
          Primary
        </span>
        <span
          style={{ background: brief.secondary_color || "#6c5ce7" }}
          className="wbp-color-pill"
        >
          Secondary
        </span>
        <span
          className="wbp-color-pill wbp-color-pill--combo"
          style={{
            background: brief.primary_color || "#111111",
            color: brief.secondary_color || "#6c5ce7",
          }}
        >
          Combined
        </span>
        <span className="wbp-color-pill wbp-color-pill--bg">Background</span>
      </div>
    </div>

    <div className="wbp-divider" />

    <div className="wbp-field-group">
      <h3 className="wbp-field-group-title">Font Style</h3>
      <div className="wbp-font-grid">
        {FONT_OPTIONS.map((f) => (
          <button
            key={f.id}
            className={`wbp-font-card ${brief.font_style === f.id ? "wbp-font-card--active" : ""}`}
            onClick={() => !disabled && onChange("font_style", f.id)}
            disabled={disabled}
            type="button"
            aria-pressed={brief.font_style === f.id}
          >
            <span className="wbp-font-sample" style={f.fontStyle}>
              {f.sample}
            </span>
            <span className="wbp-font-name">{f.label}</span>
            <span className="wbp-font-desc">{f.desc}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ── Parse editable fields from HTML ──────────────────────────────────────────
// Returns an array of { key, type, label, selector, originalValue }
// type: "text" | "img"
// Skips navigation/topbar categories entirely
const SKIP_CONTENT_CATEGORIES = ["topbar", "navbar", "navigation", "footer"];
const shouldSkipContent = (categoryId) =>
  SKIP_CONTENT_CATEGORIES.some((s) => categoryId?.toLowerCase().includes(s));
const parseEditableFields = (html) => {
  if (!html) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const fields = [];
    let idx = 0;

    // Walk all elements, collect text nodes and img tags
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 1) {
          // Build a CSS selector path for this text's parent element
          const parent = node.parentElement;
          if (
            !parent ||
            ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)
          )
            return;
          const key = `text_${idx++}`;
          // Tag the element so we can re-find it later
          parent.setAttribute(`data-wbp-key`, key);
          // Derive a human-readable label from the tag / context
          const tag = parent.tagName.toLowerCase();
          let label =
            tag === "h1"
              ? "Heading 1"
              : tag === "h2"
                ? "Heading 2"
                : tag === "h3"
                  ? "Heading 3"
                  : tag === "h4" || tag === "h5" || tag === "h6"
                    ? `Heading ${tag[1]}`
                    : tag === "a"
                      ? "Link text"
                      : tag === "button"
                        ? "Button text"
                        : tag === "li"
                          ? "List item"
                          : tag === "span"
                            ? "Inline text"
                            : tag === "p"
                              ? "Paragraph"
                              : "Text";
          // Add position hint if multiple of same type
          const sameType = fields.filter((f) => f.label.startsWith(label));
          if (sameType.length > 0) label = `${label} ${sameType.length + 1}`;
          fields.push({ key, type: "text", label, originalValue: text });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === "IMG") {
          const key = `img_${idx++}`;
          node.setAttribute("data-wbp-key", key);
          const alt = node.getAttribute("alt") || "";
          const imgCount = fields.filter((f) => f.type === "img").length;
          fields.push({
            key,
            type: "img",
            label: alt
              ? `Image — ${alt}`
              : imgCount === 0
                ? "Image"
                : `Image ${imgCount + 1}`,
            originalValue: node.getAttribute("src") || "",
          });
        } else {
          node.childNodes.forEach(walk);
        }
      }
    };

    doc.body.childNodes.forEach(walk);
    return { fields, taggedHtml: doc.body.innerHTML };
  } catch (_) {
    return { fields: [], taggedHtml: html };
  }
};

const PREVIEW_EDIT_STYLE = `
  /* Nothing uploaded yet — stripe the placeholder red so it can't be missed.
     img is a replaced element and won't take ::after, so the hatch is painted
     as its background and revealed by dropping the picture's opacity. */
  [data-wbp-key^="img_"].wbp-img-empty {
    outline: 2px solid #ef4444 !important;
    outline-offset: -2px;
    opacity: 0.5;
    background-image: repeating-linear-gradient(
      45deg,
      rgba(239, 68, 68, 0.55) 0 10px,
      rgba(239, 68, 68, 0.12) 10px 20px
    );
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]) {
    cursor: text;
    transition: outline 0.12s ease, box-shadow 0.12s ease;
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]).wbp-text-empty {
    outline: 2px solid #ef4444 !important;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16);
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]).wbp-text-empty:hover {
    outline: 2px solid #dc2626 !important;
    outline-offset: 3px;
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]):not(.wbp-text-empty):hover {
    outline: 1.5px dashed rgba(59, 130, 246, 0.55);
    outline-offset: 3px;
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]):focus {
    outline: 2px solid #3b82f6;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
  }
  [data-wbp-key]:not([data-wbp-key^="img_"]).wbp-text-empty:focus {
    outline: 2px solid #ef4444;
    outline-offset: 3px;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.22);
  }
`;

const readEditableText = (el) =>
  (el?.textContent || "").replace(/\u00a0/g, " ").trim();

const isTextContentEmpty = (content, key) => {
  const v = content?.[key];
  return typeof v !== "string" || !v.trim();
};

// An image slot still showing the template's placeholder counts as empty
const isImageContentEmpty = (content, key) => {
  const v = content?.[key];
  if (!v) return true;
  if (typeof v === "string") return !v.trim();
  return !(v.file instanceof File || v.cloudUrl || v.localUrl);
};

const syncEmptyClass = (el, empty) => {
  el.classList.toggle("wbp-text-empty", !!empty);
};

// The whole page renders as ONE document, so identical field keys coming from
// two different templates would collide. Namespaced keys keep the original
// `text_`/`img_` prefix — the edit styles and the image branch both test it.
const nsKey = (key, sectionId) => `${key}@@${sectionId}`;

const splitNsKey = (namespaced) => {
  const i = String(namespaced).lastIndexOf("@@");
  return i === -1
    ? { key: namespaced, sectionId: null }
    : {
        key: String(namespaced).slice(0, i),
        sectionId: String(namespaced).slice(i + 2),
      };
};

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const applyContentToDom = (doc, content, { skipKey } = {}) => {
  if (!doc || !content) return;
  Object.entries(content).forEach(([key, value]) => {
    if (skipKey && key === skipKey) return;
    const el = doc.querySelector(`[data-wbp-key="${key}"]`);
    if (!el) return;
    if (key.startsWith("img_")) {
      const url =
        typeof value === "string"
          ? value
          : value?.localUrl || value?.cloudUrl || "";
      if (url) el.setAttribute("src", url);
      return;
    }
    if (typeof value === "string" && value.trim()) {
      const textNode = Array.from(el.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0,
      );
      if (textNode) textNode.textContent = value;
      else el.textContent = value;
    }
  });
};

// ── HTML preview in a sandboxed iframe ────────────────────────────────────────
// Editable mode writes the tagged template once, then patches text/images in-DOM.
// Entered text is tracked locally so red borders clear immediately and stay cleared.
const HtmlPreview = ({
  html,
  baseHtml = null,
  editable = false,
  disabled = false,
  content = null,
  onContentChange,
  autoHeight = false,
  frameRef = null,
  onLayout = null,
}) => {
  const iframeRef = useRef(null);
  const [frameHeight, setFrameHeight] = useState(null);
  const onLayoutRef = useRef(onLayout);
  onLayoutRef.current = onLayout;
  const editingKeyRef = useRef(null);
  const writtenBaseRef = useRef("");
  const enteredRef = useRef({}); // key -> last non-empty text the user committed
  const contentSigRef = useRef("");
  const onChangeRef = useRef(onContentChange);
  onChangeRef.current = onContentChange;

  const sourceHtml = editable ? baseHtml || html : html;

  const isEmptyKey = (key, contentMap) => {
    const local = enteredRef.current[key];
    if (typeof local === "string" && local.trim()) return false;
    return isTextContentEmpty(contentMap, key);
  };

  const syncAllEmptyClasses = (doc, contentMap) => {
    if (!doc) return;
    doc.querySelectorAll("[data-wbp-key]").forEach((el) => {
      const key = el.getAttribute("data-wbp-key");
      if (!key) return;
      if (key.startsWith("img_")) {
        el.classList.toggle(
          "wbp-img-empty",
          isImageContentEmpty(contentMap, key),
        );
        return;
      }
      // Template HTML already has placeholder copy, so emptiness is about
      // whether the user has entered content — not whether the DOM has text.
      if (editingKeyRef.current === key) {
        syncEmptyClass(el, !readEditableText(el));
        return;
      }
      syncEmptyClass(el, isEmptyKey(key, contentMap));
    });
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !sourceHtml) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;

      const needsWrite = writtenBaseRef.current !== sourceHtml;

      if (needsWrite) {
        if (editable && editingKeyRef.current) return;

        doc.open();
        doc.write(sourceHtml);
        doc.close();
        writtenBaseRef.current = sourceHtml;
        enteredRef.current = {};
        contentSigRef.current = "";

        if (autoHeight) {
          // Default body margin would otherwise show up as a white seam
          // between two stacked sections.
          let resetEl = doc.getElementById("wbp-autoheight-reset");
          if (!resetEl) {
            resetEl = doc.createElement("style");
            resetEl.id = "wbp-autoheight-reset";
            resetEl.textContent =
              "html,body{margin:0!important;padding:0!important;}";
            (doc.head || doc.documentElement).appendChild(resetEl);
          }
        }

        if (editable && !disabled) {
          let styleEl = doc.getElementById("wbp-edit-style");
          if (!styleEl) {
            styleEl = doc.createElement("style");
            styleEl.id = "wbp-edit-style";
            styleEl.textContent = PREVIEW_EDIT_STYLE;
            (doc.head || doc.documentElement).appendChild(styleEl);
          }

          doc.querySelectorAll("[data-wbp-key]").forEach((el) => {
            const key = el.getAttribute("data-wbp-key");
            if (!key) return;

            // Images are uploaded per-section from the toolbar, not inline
            if (key.startsWith("img_")) return;

            el.setAttribute("contenteditable", "plaintext-only");
            if (el.contentEditable !== "plaintext-only") {
              el.setAttribute("contenteditable", "true");
            }
            el.setAttribute("spellcheck", "true");

            el.addEventListener("focus", () => {
              editingKeyRef.current = key;
            });
            el.addEventListener("input", () => {
              const value = readEditableText(el);
              if (value) enteredRef.current[key] = value;
              else delete enteredRef.current[key];
              syncEmptyClass(el, !value);
            });
            el.addEventListener("blur", () => {
              const value = readEditableText(el);
              if (value) enteredRef.current[key] = value;
              else delete enteredRef.current[key];
              syncEmptyClass(el, !value);
              editingKeyRef.current = null;
              onChangeRef.current?.(key, value);
            });
            el.addEventListener("keydown", (e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                el.tagName !== "P" &&
                !/^H[1-6]$/.test(el.tagName)
              ) {
                e.preventDefault();
                el.blur();
              }
            });
          });
        }
      }

      if (editable && !disabled) {
        const nextSig = briefSignature(content || {});
        const contentChanged = nextSig !== contentSigRef.current;
        contentSigRef.current = nextSig;

        // Hydrate local entered map from saved content (e.g. reopening a draft)
        if (contentChanged || needsWrite) {
          Object.entries(content || {}).forEach(([key, value]) => {
            if (
              !key.startsWith("img_") &&
              typeof value === "string" &&
              value.trim()
            ) {
              enteredRef.current[key] = value;
            }
          });
          applyContentToDom(doc, content, { skipKey: editingKeyRef.current });
        }
        // Always refresh empty markers from entered/saved state — never from
        // template placeholder text still sitting in the DOM.
        syncAllEmptyClasses(doc, content);
      }
    } catch (_) {}
  }, [sourceHtml, editable, disabled, content, autoHeight]);

  useEffect(
    () => () => {
      writtenBaseRef.current = "";
    },
    [sourceHtml],
  );

  // Grow the frame to its content so stacked sections read as one page
  useEffect(() => {
    if (!autoHeight) return;
    const iframe = iframeRef.current;
    if (!iframe) return;

    let raf = 0;
    let passes = 0;
    let lastApplied = null;

    // vh units are rewritten to px before the document is written, so nothing
    // in it depends on the iframe's height and this measurement settles on the
    // first pass. The pass counter is a backstop in case a template still finds
    // some other way to chase its own size.
    const measure = () => {
      const doc = iframe.contentDocument;
      const body = doc?.body;
      if (!body) return;

      const measured = Math.max(
        body.scrollHeight || 0,
        doc.documentElement?.scrollHeight || 0,
      );
      if (measured <= 0) return;

      const next = Math.min(measured, AUTO_HEIGHT_MAX);
      if (lastApplied !== null && Math.abs(lastApplied - next) <= 1) {
        onLayoutRef.current?.();
        return;
      }
      if (passes >= AUTO_HEIGHT_MAX_PASSES) return;

      passes += 1;
      lastApplied = next;
      setFrameHeight(next);
      onLayoutRef.current?.();
    };

    measure();
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    const doc = iframe.contentDocument;
    const ro =
      doc?.body && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;
    ro?.observe(doc.body);
    // images and webfonts settle after the first paint
    const late = setTimeout(measure, 500);

    return () => {
      clearTimeout(late);
      cancelAnimationFrame(raf);
      ro?.disconnect();
    };
  }, [autoHeight, sourceHtml, content]);

  return (
    <iframe
      ref={(el) => {
        iframeRef.current = el;
        if (typeof frameRef === "function") frameRef(el);
        else if (frameRef) frameRef.current = el;
      }}
      className={`wbp-html-preview-iframe${editable ? " wbp-html-preview-iframe--editable" : ""}`}
      title={editable ? "Editable section preview" : "Section preview"}
      sandbox="allow-scripts allow-same-origin"
      scrolling={autoHeight ? "no" : editable ? "auto" : "no"}
      aria-hidden={editable ? undefined : "true"}
      style={autoHeight && frameHeight ? { height: frameHeight } : undefined}
    />
  );
};

// Upload all pending image fields for a section, returns updated content map
const uploadSectionImages = async (schoolId, content) => {
  if (!content) return content;
  const updated = { ...content };

  for (const [key, val] of Object.entries(updated)) {
    if (key === "images" && Array.isArray(val)) {
      const uploaded = [];
      for (const img of val) {
        if (img && typeof img === "object" && img.file instanceof File) {
          try {
            const { uploadWebsiteImage } =
              await import("../../../../api_call/useAIWebsiteEditor");
            const res = await uploadWebsiteImage(schoolId, img.file);
            if (res.success && res.url) {
              uploaded.push({ file: null, localUrl: "", cloudUrl: res.url });
            } else {
              uploaded.push({ ...img, file: null });
            }
          } catch (_) {
            uploaded.push({ ...img, file: null });
          }
        } else {
          uploaded.push(img);
        }
      }
      updated.images = uploaded;
      continue;
    }
    if (val && typeof val === "object" && val.file instanceof File) {
      try {
        const { uploadWebsiteImage } =
          await import("../../../../api_call/useAIWebsiteEditor");
        const res = await uploadWebsiteImage(schoolId, val.file);
        if (res.success && res.url) {
          updated[key] = { file: null, localUrl: "", cloudUrl: res.url };
        }
      } catch (_) {}
    }
  }
  return updated;
};

// Upload every pending File in a brief, then shape the payload for PATCH
const prepareBriefForSave = async (schoolId, brief) => {
  const pagesWithUploads = await Promise.all(
    (brief.pages || []).map(async (page) => {
      const sectionsWithUploads = await Promise.all(
        (page.sections || []).map(async (sec) => {
          const updatedContent = await uploadSectionImages(
            schoolId,
            sec.content,
          );
          return { ...sec, content: updatedContent };
        }),
      );
      return { ...page, sections: sectionsWithUploads };
    }),
  );
  return {
    ...brief,
    pages: pagesWithUploads,
    sections: pagesWithUploads[0]?.sections || [],
  };
};

// Pull only newly-uploaded cloud URLs into the live brief so a save can't
// stomp text the user typed while the request was in flight.
const mergeUploadedImagesIntoBrief = (live, prepared) => {
  let changed = false;
  const nextPages = (live.pages || []).map((page) => {
    const prepPage = (prepared.pages || []).find((p) => p.id === page.id);
    if (!prepPage) return page;
    const nextSections = (page.sections || []).map((sec) => {
      const prepSec = (prepPage.sections || []).find((s) => s.id === sec.id);
      if (!prepSec?.content) return sec;
      let sectionChanged = false;
      const nextContent = { ...(sec.content || {}) };
      Object.entries(prepSec.content).forEach(([key, prepVal]) => {
        const cloud =
          prepVal && typeof prepVal === "object" ? prepVal.cloudUrl : "";
        if (!cloud) return;
        const liveVal = nextContent[key];
        const liveCloud =
          liveVal && typeof liveVal === "object" ? liveVal.cloudUrl : "";
        if (liveCloud === cloud && !liveVal?.file && !liveVal?.localUrl) return;
        nextContent[key] = { file: null, localUrl: "", cloudUrl: cloud };
        sectionChanged = true;
      });
      if (!sectionChanged) return sec;
      changed = true;
      return { ...sec, content: nextContent };
    });
    return nextSections === page.sections
      ? page
      : { ...page, sections: nextSections };
  });
  if (!changed) return live;
  return {
    ...live,
    pages: nextPages,
    sections: nextPages[0]?.sections || live.sections,
  };
};

// Stable-ish fingerprint so auto-save can skip when nothing meaningful changed.
// Files and blob URLs aren't JSON-serialisable, so they're reduced to a token.
const briefSignature = (brief) => {
  try {
    return JSON.stringify(brief, (_key, val) => {
      if (typeof File !== "undefined" && val instanceof File) {
        return `file:${val.name}:${val.size}:${val.lastModified}`;
      }
      if (typeof val === "string" && val.startsWith("blob:")) return "blob";
      return val;
    });
  } catch (_) {
    return String(Date.now());
  }
};

const isCustomSection = (sec) =>
  !!(sec?.isCustom || String(sec?.id || "").startsWith("custom_"));

const isCustomSectionFilled = (sec) => {
  const description = (sec?.content?.description || "").trim();
  const body = (sec?.content?.body || "").trim();
  return description.length > 0 && body.length > 0;
};

// ── Multi-image attachments for custom sections ───────────────────────────────
const MultiImageAttachments = ({ images = [], onChange, disabled }) => {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    const next = [
      ...images,
      ...files.map((file) => ({
        file,
        localUrl: URL.createObjectURL(file),
        cloudUrl: "",
      })),
    ];
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeAt = (idx) => {
    const target = images[idx];
    if (target?.localUrl) URL.revokeObjectURL(target.localUrl);
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="wbp-multi-imgs">
      <div className="wbp-multi-imgs-grid">
        {images.map((img, idx) => {
          const src = img?.localUrl || img?.cloudUrl || "";
          return (
            <div key={`${src}-${idx}`} className="wbp-multi-imgs-item">
              {src ? (
                <img src={src} alt={`Attachment ${idx + 1}`} />
              ) : (
                <span>Image</span>
              )}
              {!disabled && (
                <button
                  type="button"
                  className="wbp-img-remove"
                  onClick={() => removeAt(idx)}
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6 6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
        {!disabled && (
          <button
            type="button"
            className="wbp-multi-imgs-add"
            onClick={() => inputRef.current?.click()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add images
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <p className="wbp-multi-imgs-hint">
        Optional · you can attach multiple images
      </p>
    </div>
  );
};

// ── Custom section editor ─────────────────────────────────────────────────────
const CustomSectionEditor = ({ section, onChange, disabled, onRemove }) => {
  const content = section.content || {};
  const setField = (key, value) => {
    onChange({
      content: { ...content, [key]: value },
      ...(key === "title" ? { label: value.trim() || "Custom section" } : {}),
    });
  };

  return (
    <div className="wbp-custom-sec">
      <div className="wbp-sec-main-header">
        <div>
          <h3 className="wbp-sec-main-title">Custom section</h3>
          <p className="wbp-sec-main-desc">
            Describe this block and what content should appear on the page.
          </p>
        </div>
        {!disabled && (
          <button
            type="button"
            className="wbp-custom-remove-btn"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>

      <p className="wbp-sec-block-label">Section name</p>
      <input
        className="wbp-input"
        placeholder="e.g. Our Values, Campus Life, Fees overview"
        value={content.title || section.label || ""}
        onChange={(e) => !disabled && setField("title", e.target.value)}
        disabled={disabled}
      />

      <p className="wbp-sec-block-label wbp-sec-block-label--mt">
        Describe the section
      </p>
      <textarea
        className="wbp-textarea"
        rows={3}
        placeholder="What is this section for? e.g. Introduce the school’s values with 3 cards…"
        value={content.description || ""}
        onChange={(e) => !disabled && setField("description", e.target.value)}
        disabled={disabled}
      />

      <p className="wbp-sec-block-label wbp-sec-block-label--mt">
        Section content
      </p>
      <textarea
        className="wbp-textarea"
        rows={8}
        placeholder="Write the text/content that should appear in this section…"
        value={content.body || ""}
        onChange={(e) => !disabled && setField("body", e.target.value)}
        disabled={disabled}
      />

      <p className="wbp-sec-block-label wbp-sec-block-label--mt">
        Images <span className="wbp-optional">(optional)</span>
      </p>
      <MultiImageAttachments
        images={Array.isArray(content.images) ? content.images : []}
        onChange={(images) => !disabled && setField("images", images)}
        disabled={disabled}
      />

      <p className="wbp-sec-block-label wbp-sec-block-label--mt">
        Notes for our team <span className="wbp-optional">(optional)</span>
      </p>
      <textarea
        className="wbp-textarea wbp-textarea--notes"
        rows={3}
        placeholder="Any layout or design notes for this custom section…"
        value={section.notes || ""}
        onChange={(e) => !disabled && onChange({ notes: e.target.value })}
        disabled={disabled}
      />
    </div>
  );
};

const EMPTY_CONTENT = Object.freeze({});

// Stack order for the assembled page preview: chrome at the edges, hero up top,
// everything else in the order the user enabled it.
const STACK_RANK_BODY = 5;

const stackRank = (id) => {
  const s = String(id || "").toLowerCase();
  if (s.includes("topbar")) return 0;
  if (s.includes("navbar") || s.includes("navigation")) return 1;
  if (s.includes("hero")) return 2;
  if (s.includes("footer")) return 9;
  return STACK_RANK_BODY;
};

const orderSectionsForPage = (sections) =>
  [...sections].sort((a, b) => {
    const rank = stackRank(catIdOf(a)) - stackRank(catIdOf(b));
    return rank !== 0 ? rank : (a.order ?? 0) - (b.order ?? 0);
  });

const CUSTOM_BLOCK_STYLE =
  "padding:56px 24px;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#fafafa;color:#333";

/**
 * Stitch every section into a single HTML document so the preview behaves like
 * the real site: one style cascade, one flow, and `position:fixed` chrome that
 * spans the whole page instead of being trapped in its own frame.
 */
const buildMergedPageHtml = (stacked, categories) => {
  const headParts = [];
  const bodyParts = [];
  const fieldsBySection = {};
  const seenHead = new Set();

  stacked.forEach((sec) => {
    if (isCustomSection(sec)) {
      const title = escapeHtml(sec.content?.title || "Custom section");
      const body = escapeHtml(
        sec.content?.description || sec.content?.body || "",
      );
      bodyParts.push(
        `<section data-wbp-sec="${escapeHtml(sec.id)}" style="${CUSTOM_BLOCK_STYLE}">` +
          `<h2 style="margin:0 0 10px;font-size:26px">${title}</h2>` +
          `<p style="margin:0;font-size:15px;line-height:1.7;opacity:.75">${body}</p>` +
          `</section>`,
      );
      return;
    }

    const cat = categories.find((c) => c.id === catIdOf(sec));
    const templates = cat?.templates || [];
    const tmpl =
      templates.find((t) => t.template_id === sec.templateId) || templates[0];
    if (!tmpl?.html) return;

    const skip = shouldSkipContent(cat?.id);
    const parsed = skip ? null : parseEditableFields(tmpl.html);
    fieldsBySection[sec.id] = parsed?.fields || [];

    let bodyHtml = parsed?.taggedHtml ?? tmpl.html;

    // parseEditableFields only hands back the body, so pull <head> assets off
    // the raw template or the section loses its styling in the merge
    try {
      const raw = new DOMParser().parseFromString(tmpl.html, "text/html");
      const head = raw.head?.innerHTML?.trim();
      if (head && !seenHead.has(head)) {
        seenHead.add(head);
        headParts.push(head);
      }
      if (skip) bodyHtml = raw.body.innerHTML;
    } catch (_) {}

    // Namespace the editable keys and mark the top-level nodes with their
    // owning section. Tagging the nodes themselves rather than wrapping them
    // keeps `body > *` selectors in the templates working.
    try {
      const frag = new DOMParser().parseFromString(bodyHtml, "text/html");
      frag.querySelectorAll("[data-wbp-key]").forEach((el) => {
        el.setAttribute(
          "data-wbp-key",
          nsKey(el.getAttribute("data-wbp-key"), sec.id),
        );
      });
      Array.from(frag.body.children).forEach((el) =>
        el.setAttribute("data-wbp-sec", sec.id),
      );
      bodyHtml = frag.body.innerHTML;
    } catch (_) {}

    bodyParts.push(bodyHtml);
  });

  let html = `<!doctype html><html><head><meta charset="utf-8">
${headParts.join("\n")}
<style>html,body{margin:0;padding:0;}</style>
</head><body>${bodyParts.join("\n")}</body></html>`;

  // Strip vh units everywhere before the document is ever rendered
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("style").forEach((el) => {
      el.textContent = neutralizeViewportUnits(el.textContent);
    });
    doc.querySelectorAll("[style]").forEach((el) => {
      el.setAttribute(
        "style",
        neutralizeViewportUnits(el.getAttribute("style")),
      );
    });
    html = `<!doctype html>${doc.documentElement.outerHTML}`;
  } catch (_) {}

  return { html, fieldsBySection };
};

const buildMergedContent = (sections) => {
  const out = {};
  sections.forEach((sec) => {
    Object.entries(sec.content || {}).forEach(([k, v]) => {
      out[nsKey(k, sec.id)] = v;
    });
  });
  return out;
};

// ── Whole page rendered as one document, with hover affordances on top ────────
const PagePreview = ({
  stacked,
  categories,
  activeId,
  hoverId,
  disabled,
  mergedContent,
  onContentChange,
  onActivate,
  onHover,
  isFilled,
}) => {
  const frameElRef = useRef(null);
  const fileInputRef = useRef(null);
  const pendingRef = useRef(null); // { sectionId } for bulk, or { keys: [ns] }
  const [zones, setZones] = useState([]);
  const [imgPanelId, setImgPanelId] = useState(null);

  const { html: pageHtml, fieldsBySection } = useMemo(
    () => buildMergedPageHtml(stacked, categories),
    [stacked, categories],
  );

  const imageFieldsFor = useCallback(
    (sectionId) =>
      (fieldsBySection[sectionId] || []).filter((f) => f.type === "img"),
    [fieldsBySection],
  );

  const openPicker = (namespacedKeys) => {
    pendingRef.current = namespacedKeys;
    fileInputRef.current?.click();
  };

  // Files land in the slots that were queued, one per slot, in order
  const handlePickedImages = (files) => {
    const keys = pendingRef.current || [];
    pendingRef.current = null;
    if (!keys.length || !files.length) return;

    keys.slice(0, files.length).forEach((namespaced, i) => {
      const prev = mergedContent?.[namespaced];
      if (prev?.localUrl) {
        try {
          URL.revokeObjectURL(prev.localUrl);
        } catch (_) {}
      }
      onContentChange(namespaced, {
        file: files[i],
        localUrl: URL.createObjectURL(files[i]),
        cloudUrl: "",
      });
    });
  };

  // Close the slot panel on Escape or a click anywhere else — including inside
  // the iframe, whose clicks never reach the parent document.
  useEffect(() => {
    if (!imgPanelId) return;
    const close = () => setImgPanelId(null);
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e) => {
      if (!e.target?.closest?.(".wbp-pv-imgpanel, .wbp-pv-tools-img")) close();
    };
    const frameDoc = frameElRef.current?.contentDocument;
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    frameDoc?.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      frameDoc?.removeEventListener("mousedown", close);
    };
  }, [imgPanelId]);

  // Where each section sits inside the merged document, so the overlay
  // affordances can be placed over it from the outside.
  const measureZones = useCallback(() => {
    const doc = frameElRef.current?.contentDocument;
    if (!doc) return;
    const next = [];
    stacked.forEach((sec) => {
      const els = doc.querySelectorAll(`[data-wbp-sec="${sec.id}"]`);
      if (!els.length) return;
      let top = Infinity;
      let bottom = -Infinity;
      els.forEach((el) => {
        // fixed chrome sits outside the flow — it would skew the bounds
        if (doc.defaultView?.getComputedStyle(el).position === "fixed") return;
        const r = el.getBoundingClientRect();
        top = Math.min(top, r.top);
        bottom = Math.max(bottom, r.bottom);
      });
      if (!Number.isFinite(top) || bottom <= top) return;
      next.push({ id: sec.id, top: Math.max(0, top), height: bottom - top });
    });
    setZones((prev) => {
      const same =
        prev.length === next.length &&
        prev.every(
          (p, i) =>
            p.id === next[i].id &&
            Math.abs(p.top - next[i].top) < 1 &&
            Math.abs(p.height - next[i].height) < 1,
        );
      return same ? prev : next;
    });
  }, [stacked]);

  // Pointer events inside an iframe don't reach the parent, so hover has to be
  // tracked from within the document itself.
  useEffect(() => {
    const doc = frameElRef.current?.contentDocument;
    if (!doc || disabled) return;
    const onMove = (e) => {
      const y = e.clientY;
      const hit = zones.find((z) => y >= z.top && y < z.top + z.height);
      onHover(hit?.id || null);
    };
    const onLeave = () => onHover(null);
    doc.addEventListener("mousemove", onMove);
    doc.addEventListener("mouseleave", onLeave);
    return () => {
      doc.removeEventListener("mousemove", onMove);
      doc.removeEventListener("mouseleave", onLeave);
    };
  }, [zones, disabled, onHover, pageHtml]);

  useEffect(() => {
    const t = setTimeout(measureZones, 300);
    return () => clearTimeout(t);
  }, [measureZones, pageHtml, mergedContent]);

  return (
    <div className="wbp-pv-stage" onMouseLeave={() => onHover(null)}>
      <div
        className={`wbp-pv-frame${disabled ? "" : " wbp-pv-frame--editable"}`}
      >
        <HtmlPreview
          html={pageHtml}
          baseHtml={pageHtml}
          editable={!disabled}
          disabled={disabled}
          content={mergedContent}
          onContentChange={onContentChange}
          autoHeight
          frameRef={frameElRef}
          onLayout={measureZones}
        />
      </div>

      <div className="wbp-pv-overlay">
        {zones.map((zone) => {
          const sec = stacked.find((s) => s.id === zone.id);
          if (!sec) return null;
          const cat = categories.find((c) => c.id === catIdOf(sec));
          const active = activeId === zone.id;
          const panelOpen = imgPanelId === zone.id;
          const shown = active || panelOpen || hoverId === zone.id;
          const imgFields = imageFieldsFor(zone.id);
          const missingImgs = imgFields.filter((f) =>
            isImageContentEmpty(mergedContent, nsKey(f.key, zone.id)),
          ).length;
          return (
            <div
              key={zone.id}
              className={`wbp-pv-zone${active ? " wbp-pv-zone--active" : ""}${shown ? " wbp-pv-zone--shown" : ""}`}
              style={{ top: zone.top, height: zone.height }}
            >
              <div className="wbp-pv-tools">
                <span className="wbp-pv-tools-label">
                  {isCustomSection(sec)
                    ? sec.content?.title || "Custom section"
                    : cat?.label || sec.label}
                </span>
                {!isFilled(sec) && (
                  <span
                    className="wbp-pv-tools-dot"
                    title="Not filled in yet"
                  />
                )}
                {!disabled && imgFields.length > 0 && (
                  <button
                    type="button"
                    className={`wbp-pv-tools-img${missingImgs ? " wbp-pv-tools-img--missing" : ""}`}
                    title={`${imgFields.length} image${imgFields.length === 1 ? "" : "s"} in this section`}
                    aria-expanded={panelOpen}
                    onClick={() => setImgPanelId(panelOpen ? null : zone.id)}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="8.5" cy="8.5" r="1.6" fill="currentColor" />
                      <path
                        d="M3 15.5l5-5 4 4 3-3 6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>
                      {imgFields.length - missingImgs}/{imgFields.length}
                    </span>
                  </button>
                )}
                {!disabled && (
                  <button
                    type="button"
                    className="wbp-pv-tools-btn"
                    onClick={() => onActivate(active ? null : zone.id)}
                  >
                    {active ? "Done" : "Options"}
                  </button>
                )}

                {panelOpen && (
                  <div className="wbp-pv-imgpanel">
                    {imgFields.map((f) => {
                      const ns = nsKey(f.key, zone.id);
                      const val = mergedContent?.[ns];
                      const src = val?.localUrl || val?.cloudUrl || "";
                      const empty = isImageContentEmpty(mergedContent, ns);
                      return (
                        <button
                          key={f.key}
                          type="button"
                          className={`wbp-pv-imgslot${empty ? " wbp-pv-imgslot--empty" : ""}`}
                          onClick={() => openPicker([ns])}
                        >
                          <span className="wbp-pv-imgslot-thumb">
                            {src ? <img src={src} alt="" /> : null}
                          </span>
                          <span className="wbp-pv-imgslot-name">{f.label}</span>
                          <span className="wbp-pv-imgslot-act">
                            {empty ? "Add" : "Replace"}
                          </span>
                        </button>
                      );
                    })}
                    {imgFields.length > 1 && (
                      <button
                        type="button"
                        className="wbp-pv-imgpanel-all"
                        onClick={() =>
                          openPicker(
                            imgFields.map((f) => nsKey(f.key, zone.id)),
                          )
                        }
                      >
                        Pick all {imgFields.length} at once…
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!disabled && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => {
            handlePickedImages(Array.from(e.target.files || []));
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
};

// ── Editor drawer for whichever section is open ───────────────────────────────
const SectionOptionsDrawer = ({
  section,
  category,
  disabled,
  onTemplateSelect,
  onSectionChange,
  onRemoveCustom,
}) => {
  const custom = section ? isCustomSection(section) : false;
  const templates = category?.templates || [];

  return (
    <aside className="wbp-opt-sidebar">
      <div className="wbp-pv-drawer-body">
        {!section ? (
          <p className="wbp-opt-empty">
            Hover a section in the preview and press <strong>Options</strong> to
            change its layout, images and notes.
          </p>
        ) : custom ? (
          <CustomSectionEditor
            section={section}
            disabled={disabled}
            onChange={onSectionChange}
            onRemove={onRemoveCustom}
          />
        ) : (
          <>
            <p className="wbp-sec-block-label">
              Layout · {templates.length} available
            </p>
            {templates.length === 0 ? (
              <p className="wbp-no-templates">
                No layouts yet for this section.
              </p>
            ) : (
              <div className="wbp-layout-grid">
                {templates.map((tmpl) => {
                  const isSelected =
                    section.templateId === tmpl.template_id ||
                    (!section.templateId && tmpl === templates[0]);
                  return (
                    <button
                      key={tmpl.template_id}
                      type="button"
                      className={`wbp-layout-card ${isSelected ? "wbp-layout-card--active" : ""}`}
                      onClick={() =>
                        onTemplateSelect(section.id, tmpl.template_id)
                      }
                      aria-pressed={isSelected}
                    >
                      <div className="wbp-layout-preview">
                        <HtmlPreview html={tmpl.html} />
                      </div>
                      <span className="wbp-layout-name">{tmpl.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

// ── Step 2 — Sections ─────────────────────────────────────────────────────────
const Step2 = ({
  sections,
  onChange,
  disabled,
  categories,
  templatesLoading,
  pageId = "home",
}) => {
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const addWrapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  // Stable emit so blur/effects during tab teardown still hit this instance's
  // page callback, not whatever tab is newly active.
  const emitSections = useCallback((next) => {
    onChangeRef.current?.(next);
  }, []);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        const aLocked = isLocked(a.id, pageId);
        const bLocked = isLocked(b.id, pageId);
        if (aLocked && !bLocked) return -1;
        if (!aLocked && bLocked) return 1;
        return a.label.localeCompare(b.label);
      }),
    [categories, pageId],
  );

  // activeId is now "which section has its options panel open" — start closed so
  // the page reads as a preview until you choose something to change.
  useEffect(() => {
    setActiveId(null);
    setAddOpen(false);
  }, [pageId]);

  // Dismiss the add menu on Escape or a click outside it
  useEffect(() => {
    if (!addOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setAddOpen(false);
    };
    const onDown = (e) => {
      if (addWrapRef.current && !addWrapRef.current.contains(e.target))
        setAddOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [addOpen]);

  // Per-section completion check (same logic as main page)
  const isSectionFilled = useCallback(
    (sec) => {
      if (!sec) return true;
      if (isCustomSection(sec)) return isCustomSectionFilled(sec);
      const cat = categories.find((c) => c.id === catIdOf(sec));
      if (!cat) return true;
      if (shouldSkipContent(cat.id)) return true; // nav/topbar — no content required
      const tmpl =
        cat.templates.find((t) => t.template_id === sec.templateId) ||
        cat.templates[0];
      if (!tmpl) return true;
      const { fields } = parseEditableFields(tmpl.html);
      if (!fields || fields.length === 0) return true;
      // Text is entered in the preview. Images are left as the template's own
      // placeholders, so they aren't part of the completeness check.
      const textFields = fields.filter((f) => f.type === "text");
      return textFields.every((field) => {
        const val = sec.content?.[field.key];
        return typeof val === "string" && val.trim().length > 0;
      });
    },
    [categories],
  );

  // Every category stays pickable so a page can stack several of the same kind
  // (two Features bands, three Galleries…). Only the required chrome is left
  // out, since a second Navigation or Footer would be nonsense.
  const availableCategories = useMemo(
    () => sortedCategories.filter((c) => !isLocked(c.id, pageId)),
    [sortedCategories, pageId],
  );

  const addCategory = (cat) => {
    if (disabled) return;
    const id = makeSectionId(cat.id);
    emitSections([
      ...sections,
      {
        id,
        categoryId: cat.id,
        label: cat.label,
        templateId: cat.templates[0]?.template_id || null,
        notes: "",
        order: sections.length,
        content: {},
      },
    ]);
    setActiveId(id);
    setAddOpen(false);
  };

  const removeSection = (id) => {
    const target = sections.find((s) => s.id === id);
    if (disabled || !target || isLocked(catIdOf(target), pageId)) return;
    emitSections(
      sections.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })),
    );
    if (activeId === id) setActiveId(null);
    if (hoverId === id) setHoverId(null);
  };

  // Drag to reorder. Only body sections can move: topbar/nav/hero/footer are
  // pinned by stackRank, so dragging them would change `order` with no visible
  // effect. Refs hold the live drag state; the mirrored state is for styling.
  const [dragId, setDragId] = useState(null);
  const [dropHint, setDropHint] = useState(null); // { id, after }
  const dragIdRef = useRef(null);
  const dropHintRef = useRef(null);

  const canReorder = (sec) =>
    !disabled && stackRank(catIdOf(sec)) === STACK_RANK_BODY;

  const clearDrag = () => {
    dragIdRef.current = null;
    dropHintRef.current = null;
    setDragId(null);
    setDropHint(null);
  };

  const handleDragStart = (e, id) => {
    dragIdRef.current = id;
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    // Firefox refuses to start a drag without payload
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch (_) {}
  };

  const handleDragOver = (e, sec) => {
    const id = sec.id;
    if (!dragIdRef.current || !canReorder(sec)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    const prev = dropHintRef.current;
    if (prev && prev.id === id && prev.after === after) return;
    dropHintRef.current = { id, after };
    setDropHint({ id, after });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const id = dragIdRef.current;
    const hint = dropHintRef.current;
    clearDrag();
    if (!id || !hint || hint.id === id) return;

    const ordered = orderSectionsForPage(sections);
    const moved = ordered.find((s) => s.id === id);
    if (!moved) return;
    const rest = ordered.filter((s) => s.id !== id);
    let to = rest.findIndex((s) => s.id === hint.id);
    if (to === -1) return;
    if (hint.after) to += 1;
    rest.splice(to, 0, moved);
    emitSections(rest.map((s, i) => ({ ...s, order: i })));
  };

  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  // Ensure locked categories for THIS page exist; drop empty auto-added hero on non-home
  useEffect(() => {
    let next = [...sectionsRef.current];
    let changed = false;

    if (!isHomePage(pageId)) {
      const heroSec = next.find((s) => isHeroCategory(catIdOf(s)));
      if (heroSec) {
        const hasContent =
          heroSec.content &&
          Object.keys(heroSec.content).some((k) => {
            const v = heroSec.content[k];
            if (typeof v === "string") return v.trim().length > 0;
            if (v && typeof v === "object")
              return !!(v.cloudUrl || v.file || v.localUrl);
            return false;
          });
        if (!hasContent && !(heroSec.notes || "").trim()) {
          next = next
            .filter((s) => !isHeroCategory(catIdOf(s)))
            .map((s, i) => ({ ...s, order: i }));
          changed = true;
        }
      }
    }

    const lockedMissing = sortedCategories.filter(
      (c) => isLocked(c.id, pageId) && !next.find((s) => catIdOf(s) === c.id),
    );
    if (lockedMissing.length > 0) {
      next = [
        ...next,
        ...lockedMissing.map((c, i) => ({
          id: c.id,
          categoryId: c.id,
          label: c.label,
          templateId: c.templates[0]?.template_id || null,
          notes: "",
          order: next.length + i,
          content: {},
        })),
      ];
      changed = true;
    }

    if (changed) emitSections(next);
  }, [categories, pageId, sortedCategories, emitSections]);

  const updateSection = (id, patch) =>
    emitSections(sectionsRef.current.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Every enabled section, stacked the way the finished page will read
  const stackedSections = useMemo(
    () => orderSectionsForPage(sections),
    [sections],
  );
  const mergedContent = useMemo(() => buildMergedContent(sections), [sections]);
  const activeSection = sections.find((s) => s.id === activeId) || null;

  // When layout changes, reset content (user must re-enter text in the preview)
  const handleTemplateSelect = (sectionId, templateId) => {
    updateSection(sectionId, { templateId, content: {} });
  };

  // Every section in the stack renders at once, so they all need a template
  useEffect(() => {
    const missing = sections.filter((s) => {
      if (isCustomSection(s) || s.templateId) return false;
      const cat = categories.find((c) => c.id === catIdOf(s));
      return cat && cat.templates.length > 0;
    });
    if (missing.length === 0) return;
    emitSections(
      sections.map((s) => {
        if (!missing.includes(s)) return s;
        const cat = categories.find((c) => c.id === catIdOf(s));
        return { ...s, templateId: cat.templates[0].template_id };
      }),
    );
  }, [sections, categories, emitSections]);

  const handleContentChange = (sectionId, key, value) => {
    emitSections(
      sectionsRef.current.map((s) =>
        s.id === sectionId
          ? { ...s, content: { ...(s.content || {}), [key]: value } }
          : s,
      ),
    );
  };

  // Edits arrive from the merged document keyed by section
  const handleMergedContentChange = useCallback((namespaced, value) => {
    const { key, sectionId } = splitNsKey(namespaced);
    if (!sectionId) return;
    handleContentChange(sectionId, key, value);
  }, []);

  if (templatesLoading) {
    return (
      <div className="wbp-sec-layout">
        <div className="wbp-templates-loading">
          <div className="wbp-spinner" />
          <span>Loading section templates…</span>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="wbp-sec-layout">
        <div className="wbp-templates-loading">
          <span>
            No section templates found. Add templates from the admin panel
            first.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="wbp-sec-layout">
      {/* ── Left sidebar: only the sections on this page, in stack order ── */}
      <div className="wbp-sec-sidebar">
        <div className="wbp-sec-sidebar-head" ref={addWrapRef}>
          <p className="wbp-sec-sidebar-hint">
            {isHomePage(pageId)
              ? "Home requires Hero, Navigation & Footer"
              : "This page requires Navigation & Footer only"}
          </p>
          {!disabled && (
            <button
              type="button"
              className={`wbp-sec-add-btn${addOpen ? " wbp-sec-add-btn--open" : ""}`}
              onClick={() => setAddOpen((v) => !v)}
              aria-expanded={addOpen}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
              Add section
            </button>
          )}

          {addOpen && !disabled && (
            <div className="wbp-sec-add-menu" role="menu">
              {availableCategories.length === 0 ? (
                <p className="wbp-sec-add-empty">
                  Every section is already on this page.
                </p>
              ) : (
                availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="menuitem"
                    className="wbp-sec-add-item"
                    onClick={() => addCategory(cat)}
                  >
                    <span className="wbp-sec-name">{cat.label}</span>
                    <span className="wbp-sec-count">
                      {cat.templates.length}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {stackedSections.length === 0 && (
          <p className="wbp-sec-list-empty">
            No sections yet — use Add section.
          </p>
        )}

        {stackedSections.map((sec, i) => {
          const cat = categories.find((c) => c.id === catIdOf(sec));
          const locked = isLocked(catIdOf(sec), pageId);
          const isActive = activeId === sec.id;
          const label = isCustomSection(sec)
            ? sec.content?.title || "Custom section"
            : cat?.label || sec.label;
          // repeats of one category need telling apart at a glance
          const dupes = stackedSections.filter(
            (s) => catIdOf(s) === catIdOf(sec),
          );
          const ordinal =
            dupes.length > 1 ? dupes.indexOf(sec) + 1 : 0;
          const movable = canReorder(sec);
          const hinted =
            dropHint && dropHint.id === sec.id && dragId !== sec.id;
          return (
            <div
              key={sec.id}
              className={[
                "wbp-sec-item wbp-sec-item--enabled",
                isActive ? "wbp-sec-item--active" : "",
                movable ? "wbp-sec-item--movable" : "",
                dragId === sec.id ? "wbp-sec-item--dragging" : "",
                hinted
                  ? dropHint.after
                    ? "wbp-sec-item--drop-after"
                    : "wbp-sec-item--drop-before"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveId(sec.id)}
              onMouseEnter={() => setHoverId(sec.id)}
              onMouseLeave={() => setHoverId(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActiveId(sec.id)}
              draggable={movable}
              onDragStart={
                movable ? (e) => handleDragStart(e, sec.id) : undefined
              }
              onDragOver={(e) => handleDragOver(e, sec)}
              onDrop={handleDrop}
              onDragEnd={clearDrag}
            >
              <div className="wbp-sec-item-left">
                {movable && (
                  <span
                    className="wbp-sec-grip"
                    aria-hidden="true"
                    title="Drag to reorder"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <circle cx="9" cy="5" r="2" />
                      <circle cx="15" cy="5" r="2" />
                      <circle cx="9" cy="12" r="2" />
                      <circle cx="15" cy="12" r="2" />
                      <circle cx="9" cy="19" r="2" />
                      <circle cx="15" cy="19" r="2" />
                    </svg>
                  </span>
                )}
                <span className="wbp-sec-name">{label}</span>
                {ordinal > 0 && (
                  <span className="wbp-sec-ordinal">#{ordinal}</span>
                )}
                {!isSectionFilled(sec) && (
                  <span
                    className="wbp-sec-incomplete-dot"
                    title="Fill all content fields"
                  />
                )}
              </div>
              {locked ? (
                <span className="wbp-sec-locked-pill">Required</span>
              ) : !disabled ? (
                <button
                  type="button"
                  className="wbp-sec-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(sec.id);
                  }}
                  aria-label={`Remove ${label}`}
                  title="Remove from this page"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* ── Right: the whole page, section by section, in stack order ── */}
      <div className="wbp-sec-main">
        {stackedSections.length === 0 ? (
          <div className="wbp-sec-empty">
            <p>Use “Add section” on the left to start building this page.</p>
          </div>
        ) : (
          <div className="wbp-page-preview">
            <div className="wbp-page-preview-head">
              <p className="wbp-sec-main-desc">
                This is your page as it will be built — {stackedSections.length}{" "}
                section
                {stackedSections.length !== 1 ? "s" : ""} in order.
                {!disabled &&
                  " Click any text to edit it. Red-striped images still need uploading — use the image button on the section toolbar."}
              </p>
            </div>

            <div className="wbp-page-preview-sheet">
              <PagePreview
                stacked={stackedSections}
                categories={categories}
                activeId={activeId}
                hoverId={hoverId}
                disabled={disabled}
                mergedContent={mergedContent}
                onContentChange={handleMergedContentChange}
                onActivate={setActiveId}
                onHover={setHoverId}
                isFilled={isSectionFilled}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Far right: options for whichever section is open ── */}
      {!disabled && (
        <SectionOptionsDrawer
          section={activeSection}
          category={
            activeSection
              ? categories.find((c) => c.id === catIdOf(activeSection))
              : null
          }
          disabled={disabled}
          onTemplateSelect={handleTemplateSelect}
          onSectionChange={(patch) =>
            activeSection && updateSection(activeSection.id, patch)
          }
          onRemoveCustom={() =>
            activeSection && removeSection(activeSection.id)
          }
        />
      )}
    </div>
  );
};

// ── Step 2 — Pages (each page has its own sections) ───────────────────────────
// ── Add / rename page dialog ──────────────────────────────────────────────────
const normalizeSlugInput = (raw) => {
  let s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (!s.startsWith("/")) s = `/${s}`;
  return s.replace(/\/+$/, "") || "/";
};

const PageDialog = ({
  mode,
  page,
  presets,
  takenSlugs,
  onPreset,
  onSave,
  onClose,
}) => {
  const isEdit = mode === "edit";
  const [title, setTitle] = useState(isEdit ? page.title || "" : "");
  const [slug, setSlug] = useState(isEdit ? page.slug || "" : "");
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Give the page a title.");
    const cleanSlug = normalizeSlugInput(slug || slugify(cleanTitle));
    if (cleanSlug === "/")
      return setError("“/” is reserved for the Home page.");
    if (takenSlugs.includes(cleanSlug))
      return setError("Another page already uses that path.");
    onSave({ title: cleanTitle, slug: cleanSlug });
  };

  return (
    <div
      className="wbp-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wbp-page-dialog-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="wbp-page-dialog">
        <div className="wbp-page-dialog-head">
          <h3 className="wbp-confirm-title" id="wbp-page-dialog-title">
            {isEdit ? "Page settings" : "Add a page"}
          </h3>
          <button
            type="button"
            className="wbp-page-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!isEdit && presets.length > 0 && (
          <div className="wbp-page-dialog-group">
            <span className="wbp-page-dialog-label">Quick add</span>
            <div className="wbp-page-preset-grid">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="wbp-page-preset"
                  onClick={() => onPreset(preset)}
                >
                  <span className="wbp-page-preset-title">{preset.title}</span>
                  <span className="wbp-page-preset-slug">{preset.slug}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="wbp-page-dialog-group">
          {!isEdit && (
            <span className="wbp-page-dialog-label">
              {presets.length > 0 ? "Or build your own" : "New page"}
            </span>
          )}

          <div className="wbp-page-meta-field">
            <label htmlFor="wbp-dialog-title">Page title</label>
            <input
              id="wbp-dialog-title"
              className="wbp-input"
              autoFocus
              value={title}
              placeholder="e.g. Admissions"
              onChange={(e) => {
                const v = e.target.value;
                setTitle(v);
                setError("");
                if (!slugEdited) setSlug(slugify(v));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </div>

          <div className="wbp-page-meta-field">
            <label htmlFor="wbp-dialog-slug">URL path</label>
            <input
              id="wbp-dialog-slug"
              className="wbp-input"
              value={slug}
              placeholder="/admissions"
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
            />
          </div>

          {error && <p className="wbp-page-dialog-error">{error}</p>}
        </div>

        <div className="wbp-confirm-actions">
          <button type="button" className="wbp-nav-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="wbp-submit-btn" onClick={save}>
            {isEdit ? "Save changes" : "Add page"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Step2Pages = ({
  pages,
  onChange,
  disabled,
  categories,
  templatesLoading,
}) => {
  const [activePageId, setActivePageId] = useState(pages[0]?.id || "home");
  const [dialog, setDialog] = useState(null); // { mode: "add" | "edit" }

  // The tabs belong to this step but live in the step bar, on the opposite side
  // from the step buttons. The slot is committed by then, so a layout effect
  // picks it up before paint.
  const [tabSlot, setTabSlot] = useState(null);
  useLayoutEffect(() => {
    setTabSlot(document.getElementById(STEPBAR_SLOT_ID));
  }, []);

  useEffect(() => {
    if (!pages.find((p) => p.id === activePageId) && pages[0]) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId]);

  const activePage = pages.find((p) => p.id === activePageId) || pages[0];
  const usedPresetIds = new Set(pages.map((p) => p.id));
  const availablePresets = PAGE_PRESETS.filter(
    (p) => !p.locked && !usedPresetIds.has(p.id),
  );

  const updatePageById = useCallback(
    (pageId, patch) => {
      onChange((prevPages) =>
        (prevPages || []).map((p) =>
          p.id === pageId ? { ...p, ...patch } : p,
        ),
      );
    },
    [onChange],
  );

  const handleAddPreset = (preset) => {
    const page = createPage(preset, categories, pages.length);
    onChange((prevPages) => [...(prevPages || []), page]);
    setActivePageId(page.id);
    setDialog(null);
  };

  const handleAddCustom = ({ title, slug }) => {
    const page = createPage(
      { id: `page_${Date.now()}`, title, slug },
      categories,
      pages.length,
    );
    onChange((prevPages) => [...(prevPages || []), page]);
    setActivePageId(page.id);
    setDialog(null);
  };

  const handleRenamePage = ({ title, slug }) => {
    if (!activePage) return;
    updatePageById(activePage.id, { title, slug });
    setDialog(null);
  };

  const handleRemovePage = (pageId) => {
    if (disabled || pageId === "home" || pages.length <= 1) return;
    onChange((prevPages) => {
      const next = (prevPages || [])
        .filter((p) => p.id !== pageId)
        .map((p, i) => ({ ...p, order: i }));
      return next;
    });
    if (activePageId === pageId) {
      const fallback =
        pages.find((p) => p.id !== pageId)?.id || "home";
      setActivePageId(fallback);
    }
  };

  const editingPageId = activePage?.id;
  const handleSectionsChange = useCallback(
    (nextSections) => {
      if (!editingPageId) return;
      updatePageById(editingPageId, { sections: nextSections });
    },
    [editingPageId, updatePageById],
  );

  if (!activePage) {
    return (
      <div className="wbp-sec-layout">
        <div className="wbp-templates-loading">
          <span>No pages yet. Add a page to continue.</span>
        </div>
      </div>
    );
  }

  const pageTabs = (
    <div className="wbp-pages-list" role="tablist" aria-label="Website pages">
      {pages.map((page) => {
        const active = activePageId === page.id;
        return (
          <button
            key={page.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`wbp-page-tab ${active ? "wbp-page-tab--active" : ""}`}
            onClick={() => setActivePageId(page.id)}
          >
            <span className="wbp-page-tab-main">
              <span className="wbp-page-tab-title">{page.title}</span>
              <span className="wbp-page-tab-slug">{page.slug}</span>
            </span>

            <span
              className="wbp-page-tab-count"
              title={`${(page.sections || []).length} sections`}
            >
              {(page.sections || []).length}
            </span>

            {page.id === "home" ? (
              <span className="wbp-page-tab-pill">Home</span>
            ) : !disabled ? (
              <>
                {active && (
                  <span
                    className="wbp-page-tab-icon"
                    title="Rename page"
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDialog({ mode: "edit" });
                    }}
                  >
                    ✎
                  </span>
                )}
                <span
                  className="wbp-page-tab-remove"
                  title="Remove page"
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePage(page.id);
                  }}
                >
                  ×
                </span>
              </>
            ) : null}
          </button>
        );
      })}

      {!disabled && (
        <button
          type="button"
          className="wbp-pages-add-btn"
          title="Add page"
          aria-label="Add page"
          onClick={() => setDialog({ mode: "add" })}
        >
          +
        </button>
      )}
    </div>
  );

  return (
    <div className="wbp-pages-wrap">
      {tabSlot && createPortal(pageTabs, tabSlot)}

      <div className="wbp-pages-body">
        <Step2
          key={editingPageId}
          pageId={editingPageId}
          sections={activePage.sections || []}
          onChange={handleSectionsChange}
          disabled={disabled}
          categories={categories}
          templatesLoading={templatesLoading}
        />
      </div>

      {dialog && (
        <PageDialog
          mode={dialog.mode}
          page={activePage}
          presets={dialog.mode === "add" ? availablePresets : []}
          takenSlugs={pages
            .filter((p) => dialog.mode === "add" || p.id !== activePage.id)
            .map((p) => p.slug)}
          onPreset={handleAddPreset}
          onSave={dialog.mode === "add" ? handleAddCustom : handleRenamePage}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};

// ── Step 3 — Final Notes ──────────────────────────────────────────────────────
const Step3 = ({ value, onChange, disabled }) => (
  <div className="wbp-step-body">
    <div className="wbp-notes-wrap">
      <h3 className="wbp-notes-title">Anything else you want us to know?</h3>
      <p className="wbp-notes-sub">
        Special requests, things to avoid, inspirations, or any extra context
        our team should have when building your site.
      </p>
      <textarea
        className="wbp-textarea wbp-textarea--final"
        placeholder="e.g. We'd like a calm, professional tone. Avoid bright colours. We love the layout of xyz.com…"
        value={value || ""}
        onChange={(e) => !disabled && onChange(e.target.value)}
        rows={10}
        disabled={disabled}
        aria-label="Final notes"
      />
      {disabled && (
        <div className="wbp-submitted-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M22 11.08V12a10 10 0 11-5.93-9.14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <polyline
              points="22,4 12,14.01 9,11.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Brief submitted and locked. Our team is working on your website.
        </div>
      )}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const WebsiteBriefPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { getWebsite } = useSchool();
  const { getRequest, saveDraft, submitRequest, cancelRequest, loading } =
    useWebsiteRequest();
  const { categories, loading: templatesLoading } = useWebsiteTemplates();

  const [school, setSchool] = useState(null);
  const [step, setStep] = useState(1);
  const [briefData, setBriefData] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [brief, setBrief] = useState({
    primary_color: "#111111",
    secondary_color: "#6c5ce7",
    background_color: "#ffffff",
    font_style: "modern",
    theme: "light",
    pages: [],
    sections: [],
    final_notes: "",
  });

  const briefRef = useRef(brief);
  briefRef.current = brief;
  const lastSavedSigRef = useRef("");
  const savingRef = useRef(false);
  const pendingResaveRef = useRef(false);
  const autoSaveReadyRef = useRef(false);
  const autoSaveArmedRef = useRef(false);
  const [autoSaveReady, setAutoSaveReady] = useState(false);

  const isSubmitted =
    briefData?.status === "submitted" || briefData?.status === "published";

  // Once categories load, initialise default pages if brief has none
  useEffect(() => {
    if (templatesLoading || categories.length === 0) return;
    setBrief((prev) => {
      const pages = normalizePages(prev.pages, prev.sections, categories);
      const patchedPages = pages.map((page) => ({
        ...page,
        sections: (page.sections?.length
          ? page.sections
          : buildDefaultSections(categories, page.id)
        ).map((sec) => {
          if (sec.templateId) return sec;
          const cat = categories.find((c) => c.id === catIdOf(sec));
          const firstTmpl = cat?.templates[0];
          if (!firstTmpl) return sec;
          return { ...sec, templateId: firstTmpl.template_id };
        }),
      }));
      const same =
        prev.pages?.length === patchedPages.length &&
        patchedPages.every((p, i) => {
          const old = prev.pages?.[i];
          if (!old) return false;
          if (old.id !== p.id || old.sections?.length !== p.sections?.length)
            return false;
          return p.sections.every(
            (s, j) => s.templateId === old.sections[j]?.templateId,
          );
        });
      if (same && prev.pages?.length) return prev;
      return {
        ...prev,
        pages: patchedPages,
        sections: patchedPages[0]?.sections || [],
      };
    });
  }, [categories, templatesLoading]);

  // Load school + existing brief, then arm auto-save after boot settles
  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    autoSaveReadyRef.current = false;
    autoSaveArmedRef.current = false;
    setAutoSaveReady(false);

    const load = async () => {
      getWebsite(schoolId).then((res) => {
        if (!cancelled && res.success && res.data) setSchool(res.data);
      });

      const res = await getRequest(schoolId);
      if (cancelled) return;

      if (res.success && res.data) {
        setBriefData(res.data);
        if (res.data.brief) {
          const mappedSections = (s) => ({
            id: s.id,
            categoryId: s.categoryId || s.id,
            label: s.label,
            templateId: s.templateId || null,
            isCustom: !!(
              s.isCustom || String(s.id || "").startsWith("custom_")
            ),
            content: s.content || {},
            notes: s.notes || "",
            order: s.order ?? 0,
          });
          const loadedPages = normalizePages(
            (res.data.brief.pages || []).map((p, i) => ({
              id: p.id || `page_${i}`,
              title: p.title || `Page ${i + 1}`,
              slug: p.slug || (i === 0 ? "/" : slugify(p.title)),
              order: p.order ?? i,
              sections: (p.sections || []).map(mappedSections),
            })),
            (res.data.brief.sections || []).map(mappedSections),
            [],
          );
          setBrief((prev) => ({
            primary_color: res.data.brief.primary_color || prev.primary_color,
            secondary_color:
              res.data.brief.secondary_color || prev.secondary_color,
            background_color:
              res.data.brief.background_color || prev.background_color,
            font_style: res.data.brief.font_style || prev.font_style,
            theme: res.data.brief.theme || prev.theme,
            pages: loadedPages.length ? loadedPages : prev.pages,
            sections: loadedPages[0]?.sections || prev.sections,
            final_notes: res.data.brief.final_notes || "",
          }));
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  // Wait until templates + loaded brief have finished patching before auto-saving
  useEffect(() => {
    if (!schoolId || templatesLoading || autoSaveArmedRef.current) return;
    const t = setTimeout(() => {
      if (autoSaveArmedRef.current) return;
      lastSavedSigRef.current = briefSignature(briefRef.current);
      autoSaveReadyRef.current = true;
      autoSaveArmedRef.current = true;
      setAutoSaveReady(true);
    }, 800);
    return () => clearTimeout(t);
  }, [schoolId, templatesLoading, briefData]);

  const handleBriefChange = useCallback((key, value) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }, []);

  const persistDraft = useCallback(
    async ({ silent = false } = {}) => {
      if (!schoolId || isSubmitted) return { success: false };
      if (savingRef.current) {
        pendingResaveRef.current = true;
        return { success: false, deferred: true };
      }

      savingRef.current = true;
      setSaveStatus("saving");
      try {
        const prepared = await prepareBriefForSave(schoolId, briefRef.current);
        const sig = briefSignature(prepared);
        if (sig === lastSavedSigRef.current && silent) {
          setSaveStatus("");
          return { success: true, skipped: true };
        }

        const res = await saveDraft(schoolId, prepared, { silent });
        if (res.success) {
          // Snapshot was taken at save start — merge image uploads into the
          // *current* brief instead of replacing it, or mid-save typing is lost
          // and empty-border sync thinks the fields are blank again.
          const merged = mergeUploadedImagesIntoBrief(
            briefRef.current,
            prepared,
          );
          if (merged !== briefRef.current) {
            setBrief(merged);
            briefRef.current = merged;
          }
          // Mark what the server actually has. If the live brief moved on while
          // we saved, the auto-save effect will schedule another pass.
          lastSavedSigRef.current = briefSignature(prepared);
          setBriefData(res.data);
          setSaveStatus("saved");
          setTimeout(() => {
            setSaveStatus((cur) => (cur === "saved" ? "" : cur));
          }, 2500);
          return { success: true };
        }

        setSaveStatus("");
        if (!silent) {
          addNotification(res.message || "Failed to save draft", "error");
        }
        return { success: false };
      } catch (err) {
        setSaveStatus("");
        if (!silent) {
          addNotification(err?.message || "Failed to save draft", "error");
        }
        return { success: false };
      } finally {
        savingRef.current = false;
        if (pendingResaveRef.current) {
          pendingResaveRef.current = false;
          // Chain another silent pass for edits that landed mid-save
          setTimeout(() => {
            persistDraft({ silent: true });
          }, 400);
        }
      }
    },
    [schoolId, isSubmitted, saveDraft, addNotification],
  );

  const handleSaveDraft = useCallback(() => {
    return persistDraft({ silent: false });
  }, [persistDraft]);

  // Debounced auto-save whenever the brief changes
  useEffect(() => {
    if (!autoSaveReady || !autoSaveReadyRef.current) return;
    if (isSubmitted || !schoolId) return;
    if (briefSignature(brief) === lastSavedSigRef.current) return;

    const t = setTimeout(() => {
      persistDraft({ silent: true });
    }, 1600);
    return () => clearTimeout(t);
  }, [brief, autoSaveReady, isSubmitted, schoolId, persistDraft]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const briefToSubmit = await prepareBriefForSave(schoolId, briefRef.current);

      const saveRes = await saveDraft(schoolId, briefToSubmit);
      if (!saveRes.success) {
        addNotification(
          saveRes.message || "Failed to save before submitting",
          "error",
        );
        setShowConfirm(false);
        return;
      }
      lastSavedSigRef.current = briefSignature(briefToSubmit);
      setBrief(briefToSubmit);
      briefRef.current = briefToSubmit;

      const res = await submitRequest(schoolId);
      if (res.success) {
        setBriefData((prev) => ({ ...prev, status: "submitted" }));
        setShowConfirm(false);
        addNotification(
          "Website brief submitted! We'll be in touch soon.",
          "success",
        );
      } else {
        addNotification(res.message || "Failed to submit", "error");
        setShowConfirm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }, [schoolId, saveDraft, submitRequest, addNotification]);

  const handleCancel = useCallback(async () => {
    if (
      !window.confirm(
        "Cancel your website request? This will delete all your draft progress.",
      )
    )
      return;
    const res = await cancelRequest(schoolId);
    if (res.success) {
      const home = createPage(PAGE_PRESETS[0], categories, 0);
      setBriefData(null);
      setBrief({
        primary_color: "#111111",
        secondary_color: "#6c5ce7",
        background_color: "#ffffff",
        font_style: "modern",
        theme: "light",
        pages: [home],
        sections: home.sections,
        final_notes: "",
      });
      addNotification("Request cancelled.", "success");
      navigate(`/admin/${schoolId}/school/profile`);
    } else {
      addNotification("Failed to cancel request", "error");
    }
  }, [schoolId, cancelRequest, addNotification, navigate, categories]);

  const canSubmit = (brief.pages || []).some(
    (p) => (p.sections || []).length > 0,
  );

  const isSectionComplete = useCallback(
    (sec) => {
      if (isCustomSection(sec)) return isCustomSectionFilled(sec);
      const cat = categories.find((c) => c.id === catIdOf(sec));
      if (!cat) return true;
      if (shouldSkipContent(cat.id)) return true;
      const tmpl =
        cat.templates.find((t) => t.template_id === sec.templateId) ||
        cat.templates[0];
      if (!tmpl) return true;
      const { fields } = parseEditableFields(tmpl.html);
      if (!fields || fields.length === 0) return true;
      return fields.every((field) => {
        const val = sec.content?.[field.key];
        if (field.type === "img") {
          return (
            val &&
            (val.file instanceof File ||
              val.cloudUrl ||
              (typeof val === "string" && val.trim()))
          );
        }
        return typeof val === "string" && val.trim().length > 0;
      });
    },
    [categories],
  );

  // Check every selected section on every page has content filled
  const step2Complete = useMemo(() => {
    const pages = brief.pages || [];
    if (pages.length === 0) return false;
    return pages.every((page) => {
      const secs = page.sections || [];
      if (secs.length === 0) return false;
      return secs.every(isSectionComplete);
    });
  }, [brief.pages, isSectionComplete]);

  return (
    <div className="wbp-root">
      <div
        className="wbp-mobile-block"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wbp-mobile-block-title"
      >
        <div className="wbp-mobile-block-card">
          <div className="wbp-mobile-block-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="4"
                width="20"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 20h8M12 18v2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 id="wbp-mobile-block-title" className="wbp-mobile-block-title">
            Wider screen required
          </h2>
          <p className="wbp-mobile-block-text">
            The website brief editor must be opened on a tablet or laptop.
            Please switch to a wider screen to continue.
          </p>
          <button
            type="button"
            className="wbp-mobile-block-back"
            onClick={() => navigate(`/admin/${schoolId}/school/profile`)}
          >
            Go back
          </button>
        </div>
      </div>

      {/* Top bar */}
      <header className="wbp-topbar">
        <div className="wbp-topbar-left">
          <button
            className="wbp-back-btn"
            onClick={() => navigate(`/admin/${schoolId}/school/profile`)}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 5l-7 7 7 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
          <div className="wbp-topbar-logo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>Website Brief</span>
          </div>
          {isSubmitted && (
            <span className="wbp-submitted-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Submitted · Locked
            </span>
          )}
        </div>
        <div className="wbp-topbar-right">
          {!isSubmitted && (
            <>
              {saveStatus === "saving" && (
                <span className="wbp-save-label">Saving…</span>
              )}
              {saveStatus === "saved" && (
                <span className="wbp-save-label wbp-save-label--ok">
                  ✓ Saved
                </span>
              )}
              {briefData?.status === "draft" && (
                <button
                  className="wbp-cancel-btn"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel Request
                </button>
              )}
              <button
                className="wbp-save-btn"
                onClick={handleSaveDraft}
                disabled={loading || saveStatus === "saving"}
              >
                Save Draft
              </button>
              <button
                className="wbp-submit-btn"
                onClick={() => setShowConfirm(true)}
                disabled={loading || !canSubmit}
              >
                Submit Brief
              </button>
            </>
          )}
        </div>
      </header>

      <StepBar
        step={step}
        onStep={(n) => {
          if (n === 3 && step === 2 && !isSubmitted && !step2Complete) return;
          setStep(n);
        }}
        isSubmitted={isSubmitted}
      />

      <div className="wbp-content">
        {step === 1 && (
          <Step1
            school={school}
            brief={brief}
            onChange={handleBriefChange}
            disabled={isSubmitted}
          />
        )}
        {step === 2 && (
          <Step2Pages
            pages={brief.pages || []}
            onChange={(updater) => {
              setBrief((prev) => {
                const prevPages = prev.pages || [];
                const pages =
                  typeof updater === "function" ? updater(prevPages) : updater;
                return {
                  ...prev,
                  pages,
                  sections: pages[0]?.sections || [],
                };
              });
            }}
            disabled={isSubmitted}
            categories={categories}
            templatesLoading={templatesLoading}
          />
        )}
        {step === 3 && (
          <Step3
            value={brief.final_notes}
            onChange={(v) => handleBriefChange("final_notes", v)}
            disabled={isSubmitted}
          />
        )}
      </div>

      {/* Bottom bar */}
      <div className="wbp-bottombar">
        <div className="wbp-bottombar-left">
          <span className="wbp-step-indicator">Step {step} of 3</span>
          {step === 2 && !isSubmitted && !step2Complete && (
            <span className="wbp-step-warning">
              Fill all content fields on every page to continue
            </span>
          )}
        </div>
        <div className="wbp-bottombar-right">
          {step > 1 && (
            <button
              className="wbp-nav-btn"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button
              className="wbp-nav-btn wbp-nav-btn--next"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 2 && !isSubmitted && !step2Complete}
              title={
                step === 2 && !step2Complete
                  ? "Fill all content fields on every page first"
                  : undefined
              }
            >
              Next →
            </button>
          ) : (
            !isSubmitted && (
              <button
                className="wbp-submit-btn"
                onClick={() => setShowConfirm(true)}
                disabled={loading || !canSubmit}
              >
                Submit Brief
              </button>
            )
          )}
        </div>
      </div>

      {/* Confirm overlay */}
      {showConfirm && (
        <div className="wbp-overlay" role="dialog" aria-modal="true">
          <div className="wbp-confirm">
            <div className="wbp-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="9"
                  x2="12"
                  y2="13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <line
                  x1="12"
                  y1="17"
                  x2="12.01"
                  y2="17"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="wbp-confirm-title">Submit your website brief?</h3>
            <p className="wbp-confirm-body">
              Once submitted, <strong>this brief is permanently locked</strong>{" "}
              and cannot be changed. Our team will build your website based
              exactly on what you've filled in ({(brief.pages || []).length}{" "}
              page{(brief.pages || []).length === 1 ? "" : "s"}).
            </p>
            <div className="wbp-confirm-actions">
              <button
                className="wbp-nav-btn"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Go back &amp; review
              </button>
              <button
                className="wbp-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="wbp-btn-spinner" /> Submitting…
                  </>
                ) : (
                  "Yes, submit now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* This page renders outside AdminLayout, so it mounts its own helper */}
      <SetupSchoolVideo
        page={TUTORIAL_PAGE_WEBSITE_BRIEF}
        corner="bottom-left"
        storageKey="ssv_pos_website_brief"
        footerText="Keep this open while you build your site."
        collapsedText="Watch a quick walkthrough of the website brief builder."
      />
    </div>
  );
};

export default WebsiteBriefPage;
