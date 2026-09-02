import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import useSchool from "../../../../api_call/useSchool";
import useWebsiteRequest from "../../../../api_call/useWebsiteRequest";
import "./WebsiteBriefPage.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

// Categories that are always selected and cannot be removed
const LOCKED_CATEGORIES = ["topbar", "hero", "navbar", "navigation", "footer"];
const isLocked = (category) =>
  LOCKED_CATEGORIES.some((l) => category?.toLowerCase().includes(l));

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

        // Sort: locked categories first, then alphabetically
        const sorted = Object.values(map).sort((a, b) => {
          const aLocked = isLocked(a.id);
          const bLocked = isLocked(b.id);
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
const buildDefaultSections = (categories) =>
  categories
    .filter((c) => isLocked(c.id))
    .map((c, i) => ({
      id: c.id,
      label: c.label,
      templateId: c.templates[0]?.template_id || null,
      notes: "",
      order: i,
    }));

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_OPTIONS = [
  { id: "modern",  label: "Modern",  sample: "Aa", desc: "Clean, geometric sans-serif", fontStyle: { fontFamily: "'Inter', 'Helvetica Neue', sans-serif", fontWeight: 700 } },
  { id: "classic", label: "Classic", sample: "Aa", desc: "Elegant serif typeface",      fontStyle: { fontFamily: "Georgia, 'Times New Roman', serif",          fontWeight: 700 } },
  { id: "playful", label: "Playful", sample: "Aa", desc: "Friendly, rounded feel",      fontStyle: { fontFamily: "'Trebuchet MS', 'Comic Sans MS', cursive",    fontWeight: 700 } },
];

// ── Step bar ──────────────────────────────────────────────────────────────────
const StepBar = ({ step, onStep, isSubmitted }) => {
  const steps = ["Brand & Style", "Sections", "Final Notes"];
  return (
    <div className="wbp-stepbar">
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
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : num}
            </span>
            <span className="wbp-step-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ── Color picker ──────────────────────────────────────────────────────────────
const ColorPicker = ({ label, value, onChange, disabled }) => (
  <div className="wbp-color-row">
    <label className="wbp-color-label">{label}</label>
    <div className="wbp-color-wrap">
      <input type="color" className="wbp-color-input" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-label={label} />
      <input type="text"  className="wbp-color-hex"   value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} disabled={disabled} aria-label={`${label} hex`} />
      <span className="wbp-color-swatch" style={{ background: value }} aria-hidden="true" />
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
            src={typeof school.logo_url === "string" ? school.logo_url : school.logo_url?.url}
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
        <p className="wbp-school-name">{school?.school_name || "Your School"}</p>
        {school?.motto && <p className="wbp-school-motto">"{school.motto}"</p>}
        <p className="wbp-school-note">Pulled from your school profile · no re-upload needed</p>
      </div>
    </div>

    <div className="wbp-divider" />

    <div className="wbp-field-group">
      <h3 className="wbp-field-group-title">Brand Colors</h3>
      <div className="wbp-colors-row">
        <ColorPicker label="Primary Color"   value={brief.primary_color   || "#111111"} onChange={(v) => onChange("primary_color",   v)} disabled={disabled} />
        <ColorPicker label="Secondary Color" value={brief.secondary_color || "#6c5ce7"} onChange={(v) => onChange("secondary_color", v)} disabled={disabled} />
      </div>
      <div className="wbp-color-preview">
        <span style={{ background: brief.primary_color   || "#111111" }} className="wbp-color-pill">Primary</span>
        <span style={{ background: brief.secondary_color || "#6c5ce7" }} className="wbp-color-pill">Secondary</span>
        <span style={{ background: brief.primary_color || "#111111", color: brief.secondary_color || "#6c5ce7" }} className="wbp-color-pill wbp-color-pill--combo">Combined</span>
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
            <span className="wbp-font-sample" style={f.fontStyle}>{f.sample}</span>
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
const SKIP_CONTENT_CATEGORIES = ["topbar", "navbar", "navigation"];
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
          if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) return;
          const key = `text_${idx++}`;
          // Tag the element so we can re-find it later
          parent.setAttribute(`data-wbp-key`, key);
          // Derive a human-readable label from the tag / context
          const tag = parent.tagName.toLowerCase();
          let label = tag === "h1" ? "Heading 1"
            : tag === "h2" ? "Heading 2"
            : tag === "h3" ? "Heading 3"
            : tag === "h4" || tag === "h5" || tag === "h6" ? `Heading ${tag[1]}`
            : tag === "a" ? "Link text"
            : tag === "button" ? "Button text"
            : tag === "li" ? "List item"
            : tag === "span" ? "Inline text"
            : tag === "p" ? "Paragraph"
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
            label: alt ? `Image — ${alt}` : imgCount === 0 ? "Image" : `Image ${imgCount + 1}`,
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

// Apply content values back into the tagged HTML
const applyContentToHtml = (baseHtml, content) => {
  if (!baseHtml || !content || Object.keys(content).length === 0) return baseHtml;
  try {
    const doc = new DOMParser().parseFromString(baseHtml, "text/html");
    Object.entries(content).forEach(([key, value]) => {
      const el = doc.querySelector(`[data-wbp-key="${key}"]`);
      if (!el) return;
      if (key.startsWith("img_")) {
        // value is either a string URL or { file, localUrl, cloudUrl }
        const url = typeof value === "string"
          ? value
          : (value?.localUrl || value?.cloudUrl || "");
        if (url) el.setAttribute("src", url);
      } else if (typeof value === "string" && value.trim()) {
        const textNode = Array.from(el.childNodes).find(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 1
        );
        if (textNode) textNode.textContent = value;
        else el.textContent = value;
      }
    });
    return doc.body.innerHTML;
  } catch (_) {
    return baseHtml;
  }
};

// ── HTML preview in a sandboxed iframe ────────────────────────────────────────
const HtmlPreview = ({ html }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(html);
      doc.close();
    } catch (_) {}
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      className="wbp-html-preview-iframe"
      title="Section preview"
      sandbox="allow-scripts allow-same-origin"
      scrolling="no"
      aria-hidden="true"
    />
  );
};

// ── Image picker (stores File locally, uploads on submit) ────────────────────
const ImagePicker = ({ fieldKey, value, onChange, disabled }) => {
  // value = { file: File|null, localUrl: string, cloudUrl: string }
  const inputRef = useRef(null);
  const localUrl = value?.localUrl || value?.cloudUrl || "";

  const handleFile = (file) => {
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    onChange(fieldKey, { file, localUrl, cloudUrl: "" });
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (value?.localUrl) URL.revokeObjectURL(value.localUrl);
    onChange(fieldKey, null);
  };

  return (
    <div className="wbp-img-picker">
      {localUrl ? (
        <div className="wbp-img-picker-thumb">
          <img src={localUrl} alt="Selected" className="wbp-img-thumb" />
          {!disabled && (
            <button className="wbp-img-remove" onClick={handleRemove} title="Remove" type="button">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          className="wbp-img-picker-btn"
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.5"/>
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
          </svg>
          Choose image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled}
      />
    </div>
  );
};

// Upload all pending image fields for a section, returns updated content map
const uploadSectionImages = async (schoolId, content) => {
  if (!content) return content;
  const updated = { ...content };
  for (const [key, val] of Object.entries(updated)) {
    if (val && typeof val === "object" && val.file instanceof File) {
      try {
        const { uploadWebsiteImage } = await import("../../../../api_call/useAIWebsiteEditor");
        const res = await uploadWebsiteImage(schoolId, val.file);
        if (res.success && res.url) {
          updated[key] = { file: null, localUrl: "", cloudUrl: res.url };
        }
      } catch (_) {}
    }
  }
  return updated;
};

// ── Content fields editor ─────────────────────────────────────────────────────
const ContentFields = ({ fields, content, onChange, disabled }) => {
  if (!fields || fields.length === 0) return null;

  const getTextValue = (key) => {
    const v = content?.[key];
    if (!v || typeof v !== "string") return "";
    return v;
  };

  return (
    <div className="wbp-content-fields">
      {fields.map((field) => (
        <div key={field.key} className="wbp-cf-row">
          <div className="wbp-cf-label-row">
            <span className={`wbp-cf-type-badge wbp-cf-type-badge--${field.type}`}>
              {field.type === "img" ? "IMG" : "TXT"}
            </span>
            <label className="wbp-cf-label" htmlFor={`cf-${field.key}`}>{field.label}</label>
          </div>
          {field.type === "img" ? (
            <ImagePicker
              fieldKey={field.key}
              value={content?.[field.key]}
              onChange={onChange}
              disabled={disabled}
            />
          ) : field.originalValue.length > 80 ? (
            <textarea
              id={`cf-${field.key}`}
              className="wbp-textarea"
              placeholder={field.originalValue}
              value={getTextValue(field.key)}
              onChange={(e) => !disabled && onChange(field.key, e.target.value)}
              rows={3}
              disabled={disabled}
            />
          ) : (
            <input
              id={`cf-${field.key}`}
              type="text"
              className="wbp-input"
              placeholder={field.originalValue}
              value={getTextValue(field.key)}
              onChange={(e) => !disabled && onChange(field.key, e.target.value)}
              disabled={disabled}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Step 2 — Sections ─────────────────────────────────────────────────────────
const Step2 = ({ sections, onChange, disabled, categories, templatesLoading }) => {
  const [activeId, setActiveId] = useState(null);

  // Once categories load, activate the first enabled category
  useEffect(() => {
    if (sections.length > 0 && !activeId) {
      setActiveId(sections[0]?.id);
    }
  }, [sections, activeId]);

  const enabledIds = new Set(sections.map((s) => s.id));
  // Locked categories are always considered enabled for UI purposes
  categories.forEach((c) => { if (isLocked(c.id)) enabledIds.add(c.id); });

  // Per-section completion check (same logic as main page)
  const isSectionFilled = useCallback((sec) => {
    const cat = categories.find((c) => c.id === sec.id);
    if (!cat) return true;
    if (shouldSkipContent(cat.id)) return true; // nav/topbar — no content required
    const tmpl = cat.templates.find((t) => t.template_id === sec.templateId) || cat.templates[0];
    if (!tmpl) return true;
    const { fields } = parseEditableFields(tmpl.html);
    if (!fields || fields.length === 0) return true;
    return fields.every((field) => {
      const val = sec.content?.[field.key];
      if (field.type === "img") return val && (val.file instanceof File || val.cloudUrl || (typeof val === "string" && val.trim()));
      return typeof val === "string" && val.trim().length > 0;
    });
  }, [categories]);

  const toggleCategory = (cat) => {
    if (isLocked(cat.id) || disabled) return;
    if (enabledIds.has(cat.id)) {
      const next = sections
        .filter((s) => s.id !== cat.id)
        .map((s, i) => ({ ...s, order: i }));
      onChange(next);
      if (activeId === cat.id) setActiveId(sections.find((s) => s.id !== cat.id)?.id || null);
    } else {
      const newSec = {
        id: cat.id,
        label: cat.label,
        templateId: cat.templates[0]?.template_id || null,
        notes: "",
        order: sections.length,
      };
      const next = [...sections, newSec];
      onChange(next);
      setActiveId(cat.id);
    }
  };

  // Ensure locked categories always have a section entry (e.g. footer may be missing from saved draft)
  useEffect(() => {
    const lockedMissing = categories
      .filter((c) => isLocked(c.id) && !sections.find((s) => s.id === c.id));
    if (lockedMissing.length === 0) return;
    const extras = lockedMissing.map((c, i) => ({
      id: c.id, label: c.label,
      templateId: c.templates[0]?.template_id || null,
      notes: "", order: sections.length + i,
    }));
    onChange([...sections, ...extras]);
  }, [categories]);

  const updateSection = (id, patch) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const activeSec = sections.find((s) => s.id === activeId);
  const activeCat = categories.find((c) => c.id === activeId);
  // Templates for the active category
  const activeTemplates = activeCat?.templates || [];
  // Currently selected template object
  const selectedTemplate = activeTemplates.find((t) => t.template_id === activeSec?.templateId)
    || activeTemplates[0]
    || null;

  // Parse editable fields from the selected template HTML
  // Skip content fields for navigation/topbar categories
  const { fields: parsedFields, taggedHtml } = useMemo(() => {
    if (!selectedTemplate || shouldSkipContent(activeCat?.id)) return { fields: [], taggedHtml: selectedTemplate?.html || "" };
    return parseEditableFields(selectedTemplate.html);
  }, [selectedTemplate?.template_id, activeCat?.id]);

  // Build live preview HTML with user content applied
  const liveHtml = useMemo(
    () => activeSec?.content && taggedHtml
      ? applyContentToHtml(taggedHtml, activeSec.content)
      : taggedHtml || selectedTemplate?.html || "",
    [taggedHtml, activeSec?.content, selectedTemplate?.html]
  );

  // When layout changes, reset content but preserve notes
  const handleTemplateSelect = (sectionId, templateId) => {
    updateSection(sectionId, { templateId, content: {} });
  };

  // Auto-set templateId to first template when section is activated and has none
  useEffect(() => {
    if (!activeId) return;
    const sec = sections.find((s) => s.id === activeId);
    const cat = categories.find((c) => c.id === activeId);
    if (!sec || !cat || sec.templateId || cat.templates.length === 0) return;
    updateSection(activeId, { templateId: cat.templates[0].template_id });
  }, [activeId]);

  const handleContentChange = (sectionId, key, value) => {
    updateSection(sectionId, {
      content: { ...(activeSec?.content || {}), [key]: value },
    });
  };

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
          <span>No section templates found. Add templates from the admin panel first.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="wbp-sec-layout">
      {/* ── Left sidebar: categories from DB ── */}
      <div className="wbp-sec-sidebar">
        <p className="wbp-sec-sidebar-hint">Select sections to include on your website</p>
        {categories.map((cat) => {
          const enabled  = enabledIds.has(cat.id);
          const locked   = isLocked(cat.id);
          const isActive = activeId === cat.id;
          return (
            <div
              key={cat.id}
              className={`wbp-sec-item ${isActive ? "wbp-sec-item--active" : ""} ${enabled ? "wbp-sec-item--enabled" : ""}`}
              onClick={() => { if (enabled || locked) setActiveId(cat.id); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && (enabled || locked) && setActiveId(cat.id)}
            >
              <div className="wbp-sec-item-left">
                <button
                  className={`wbp-sec-checkbox ${enabled ? "wbp-sec-checkbox--on" : ""} ${locked ? "wbp-sec-checkbox--locked" : ""}`}
                  onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                  disabled={locked || disabled}
                  aria-label={`Toggle ${cat.label}`}
                  title={locked ? "Required section" : enabled ? "Remove" : "Add"}
                >
                  {locked ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2.2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                  ) : enabled ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </button>
                <span className="wbp-sec-name">{cat.label}</span>
                <span className="wbp-sec-count">{cat.templates.length}</span>
              </div>
          {locked && <span className="wbp-sec-locked-pill">Required</span>}
              {!locked && enabled && !isSectionFilled(sections.find(s => s.id === cat.id)) && (
                <span className="wbp-sec-incomplete-dot" title="Fill all content fields" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Right: layout picker + notes ── */}
      <div className="wbp-sec-main">
        {activeSec && activeCat ? (
          <>
            <div className="wbp-sec-main-header">
              <div>
                <h3 className="wbp-sec-main-title">{activeCat.label}</h3>
                <p className="wbp-sec-main-desc">
                  {activeTemplates.length} layout{activeTemplates.length !== 1 ? "s" : ""} available · pick the one you like
                </p>
              </div>
            </div>

            {/* Layout picker — real HTML previews */}
            <p className="wbp-sec-block-label">Layout</p>
            {activeTemplates.length === 0 ? (
              <p className="wbp-no-templates">No layouts yet for this section. Add them from the admin panel.</p>
            ) : (
              <div className="wbp-layout-grid">
                {activeTemplates.map((tmpl) => {
                  const isSelected = activeSec.templateId === tmpl.template_id
                    || (!activeSec.templateId && tmpl === activeTemplates[0]);
                  return (
                    <button
                      key={tmpl.template_id}
                      className={`wbp-layout-card ${isSelected ? "wbp-layout-card--active" : ""}`}
                      onClick={() => !disabled && handleTemplateSelect(activeSec.id, tmpl.template_id)}
                      disabled={disabled}
                      type="button"
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

            {/* Full-size live preview with user content applied */}
            {selectedTemplate && (
              <>
                <p className="wbp-sec-block-label wbp-sec-block-label--mt">Preview — {selectedTemplate.label}</p>
                <div className="wbp-full-preview">
                  <HtmlPreview html={liveHtml} />
                </div>
              </>
            )}

            {/* Auto-generated content fields */}
            {parsedFields.length > 0 && (
              <>
                <p className="wbp-sec-block-label wbp-sec-block-label--mt">Content</p>
                <ContentFields
                  fields={parsedFields}
                  content={activeSec.content || {}}
                  onChange={(key, value) => handleContentChange(activeSec.id, key, value)}
                  disabled={disabled}
                />
              </>
            )}

            {/* Notes */}
            <p className="wbp-sec-block-label wbp-sec-block-label--mt">
              Notes for this section <span className="wbp-optional">(optional)</span>
            </p>
            <textarea
              className="wbp-textarea wbp-textarea--notes"
              placeholder="Any extra instructions for our team about this section…"
              value={activeSec.notes || ""}
              onChange={(e) => !disabled && updateSection(activeSec.id, { notes: e.target.value })}
              rows={3}
              disabled={disabled}
              aria-label="Section notes"
            />
          </>
        ) : (
          <div className="wbp-sec-empty">
            <p>Select a section from the left to configure it.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Step 3 — Final Notes ──────────────────────────────────────────────────────
const Step3 = ({ value, onChange, disabled }) => (
  <div className="wbp-step-body">
    <div className="wbp-notes-wrap">
      <h3 className="wbp-notes-title">Anything else you want us to know?</h3>
      <p className="wbp-notes-sub">
        Special requests, things to avoid, inspirations, or any extra context our team should have when building your site.
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
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Brief submitted and locked. Our team is working on your website.
        </div>
      )}
    </div>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const WebsiteBriefPage = () => {
  const { schoolId }  = useParams();
  const navigate      = useNavigate();
  const { addNotification }  = useNotification();
  const { getWebsite }       = useSchool();
  const { getRequest, saveDraft, submitRequest, cancelRequest, loading } = useWebsiteRequest();
  const { categories, loading: templatesLoading } = useWebsiteTemplates();

  const [school,     setSchool]     = useState(null);
  const [step,       setStep]       = useState(1);
  const [briefData,  setBriefData]  = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [brief, setBrief] = useState({
    primary_color:   "#111111",
    secondary_color: "#6c5ce7",
    font_style:      "modern",
    theme:           "light",
    sections:        [],
    final_notes:     "",
  });

  const isSubmitted = briefData?.status === "submitted" || briefData?.status === "published";

  // Once categories load, initialise default sections if brief has none
  useEffect(() => {
    if (templatesLoading || categories.length === 0) return;
    setBrief((prev) => {
      if (prev.sections.length > 0) {
        // Fill in missing templateIds from categories for any section that lacks one
        const patched = prev.sections.map((sec) => {
          if (sec.templateId) return sec;
          const cat = categories.find((c) => c.id === sec.id);
          const firstTmpl = cat?.templates[0];
          if (!firstTmpl) return sec;
          return { ...sec, templateId: firstTmpl.template_id };
        });
        // Only update if something changed
        const changed = patched.some((s, i) => s.templateId !== prev.sections[i]?.templateId);
        return changed ? { ...prev, sections: patched } : prev;
      }
      return { ...prev, sections: buildDefaultSections(categories) };
    });
  }, [categories, templatesLoading]);

  // Load school + existing brief
  useEffect(() => {
    if (!schoolId) return;
    getWebsite(schoolId).then((res) => {
      if (res.success && res.data) setSchool(res.data);
    });
    getRequest(schoolId).then((res) => {
      if (res.success && res.data) {
        setBriefData(res.data);
        if (res.data.brief) {
          setBrief((prev) => ({
            primary_color:   res.data.brief.primary_color   || prev.primary_color,
            secondary_color: res.data.brief.secondary_color || prev.secondary_color,
            font_style:      res.data.brief.font_style      || prev.font_style,
            theme:           res.data.brief.theme           || prev.theme,
            // Migrate old sections: strip layoutId, keep templateId if present
            sections: res.data.brief.sections?.length
              ? res.data.brief.sections.map((s) => ({
                  id:         s.id,
                  label:      s.label,
                  templateId: s.templateId || null, // layoutId is dropped
                  content:    s.content || {},
                  notes:      s.notes   || "",
                  order:      s.order   ?? 0,
                }))
              : prev.sections,
            final_notes: res.data.brief.final_notes || "",
          }));
        }
      }
    });
  }, [schoolId]);

  const handleBriefChange = useCallback((key, value) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveDraft = useCallback(async () => {
    setSaveStatus("saving");
    const res = await saveDraft(schoolId, brief);
    if (res.success) {
      setBriefData(res.data);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } else {
      setSaveStatus("");
      addNotification(res.message || "Failed to save draft", "error");
    }
  }, [schoolId, brief, saveDraft, addNotification]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      // Upload any locally-stored images to Cloudinary first
      const sectionsWithUploads = await Promise.all(
        brief.sections.map(async (sec) => {
          const updatedContent = await uploadSectionImages(schoolId, sec.content);
          return { ...sec, content: updatedContent };
        })
      );
      const briefToSubmit = { ...brief, sections: sectionsWithUploads };

      const saveRes = await saveDraft(schoolId, briefToSubmit);
      if (!saveRes.success) {
        addNotification(saveRes.message || "Failed to save before submitting", "error");
        setShowConfirm(false);
        return;
      }
      setBrief(briefToSubmit);

      const res = await submitRequest(schoolId);
      if (res.success) {
        setBriefData((prev) => ({ ...prev, status: "submitted" }));
        setShowConfirm(false);
        addNotification("Website brief submitted! We'll be in touch soon.", "success");
      } else {
        addNotification(res.message || "Failed to submit", "error");
        setShowConfirm(false);
      }
    } finally {
      setSubmitting(false);
    }
  }, [schoolId, brief, saveDraft, submitRequest, addNotification]);

  const handleCancel = useCallback(async () => {
    if (!window.confirm("Cancel your website request? This will delete all your draft progress.")) return;
    const res = await cancelRequest(schoolId);
    if (res.success) {
      setBriefData(null);
      setBrief({ primary_color: "#111111", secondary_color: "#6c5ce7", font_style: "modern", theme: "light", sections: buildDefaultSections(categories), final_notes: "" });
      addNotification("Request cancelled.", "success");
      navigate(`/admin/${schoolId}/school/profile`);
    } else {
      addNotification("Failed to cancel request", "error");
    }
  }, [schoolId, cancelRequest, addNotification, navigate, categories]);

  const canSubmit = brief.sections.length > 0;

  // Check every selected section has all its content fields filled
  const step2Complete = useMemo(() => {
    if (brief.sections.length === 0) return false;
    return brief.sections.every((sec) => {
      const cat = categories.find((c) => c.id === sec.id);
      if (!cat) return true;
      if (shouldSkipContent(cat.id)) return true; // nav/topbar — no content required
      const tmpl = cat.templates.find((t) => t.template_id === sec.templateId) || cat.templates[0];
      if (!tmpl) return true;
      const { fields } = parseEditableFields(tmpl.html);
      if (!fields || fields.length === 0) return true;
      return fields.every((field) => {
        const val = sec.content?.[field.key];
        if (field.type === "img") {
          return val && (val.file instanceof File || val.cloudUrl || typeof val === "string" && val.trim());
        }
        return typeof val === "string" && val.trim().length > 0;
      });
    });
  }, [brief.sections, categories]);

  return (
    <div className="wbp-root">
      {/* Top bar */}
      <header className="wbp-topbar">
        <div className="wbp-topbar-left">
          <button className="wbp-back-btn" onClick={() => navigate(`/admin/${schoolId}/school/profile`)} aria-label="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <div className="wbp-topbar-logo">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Website Brief</span>
          </div>
          {isSubmitted && (
            <span className="wbp-submitted-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Submitted · Locked
            </span>
          )}
        </div>
        <div className="wbp-topbar-right">
          {!isSubmitted && (
            <>
              {saveStatus === "saving" && <span className="wbp-save-label">Saving…</span>}
              {saveStatus === "saved"  && <span className="wbp-save-label wbp-save-label--ok">✓ Saved</span>}
              {briefData?.status === "draft" && (
                <button className="wbp-cancel-btn" onClick={handleCancel} disabled={loading}>Cancel Request</button>
              )}
              <button className="wbp-save-btn" onClick={handleSaveDraft} disabled={loading || saveStatus === "saving"}>Save Draft</button>
              <button className="wbp-submit-btn" onClick={() => setShowConfirm(true)} disabled={loading || !canSubmit}>Submit Brief</button>
            </>
          )}
          {/* {isSubmitted && (
            <button className="wbp-ai-btn" onClick={() => navigate(`/admin/${schoolId}/school/website/ai-editor`)}>
              Open AI Editor
            </button>
          )} */}
        </div>
      </header>

      <StepBar step={step} onStep={(n) => {
        // Block jumping to step 3 if step 2 isn't complete
        if (n === 3 && step === 2 && !isSubmitted && !step2Complete) return;
        setStep(n);
      }} isSubmitted={isSubmitted} />

      <div className="wbp-content">
        {step === 1 && <Step1 school={school} brief={brief} onChange={handleBriefChange} disabled={isSubmitted} />}
        {step === 2 && (
          <Step2
            sections={brief.sections}
            onChange={(sections) => handleBriefChange("sections", sections)}
            disabled={isSubmitted}
            categories={categories}
            templatesLoading={templatesLoading}
          />
        )}
        {step === 3 && <Step3 value={brief.final_notes} onChange={(v) => handleBriefChange("final_notes", v)} disabled={isSubmitted} />}
      </div>

      {/* Bottom bar */}
      <div className="wbp-bottombar">
        <div className="wbp-bottombar-left">
          <span className="wbp-step-indicator">Step {step} of 3</span>
          {step === 2 && !isSubmitted && !step2Complete && (
            <span className="wbp-step-warning">Fill all content fields to continue</span>
          )}
        </div>
        <div className="wbp-bottombar-right">
          {step > 1 && <button className="wbp-nav-btn" onClick={() => setStep((s) => s - 1)}>← Back</button>}
          {step < 3 ? (
            <button
              className="wbp-nav-btn wbp-nav-btn--next"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 2 && !isSubmitted && !step2Complete}
              title={step === 2 && !step2Complete ? "Fill all content fields in every section first" : undefined}
            >
              Next →
            </button>
          ) : (
            !isSubmitted && (
              <button className="wbp-submit-btn" onClick={() => setShowConfirm(true)} disabled={loading || !canSubmit}>Submit Brief</button>
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
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="wbp-confirm-title">Submit your website brief?</h3>
            <p className="wbp-confirm-body">
              Once submitted, <strong>this brief is permanently locked</strong> and cannot be changed.
              Our team will build your website based exactly on what you've filled in.
            </p>
            <div className="wbp-confirm-actions">
              <button className="wbp-nav-btn" onClick={() => setShowConfirm(false)} disabled={submitting}>Go back &amp; review</button>
              <button className="wbp-submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><span className="wbp-btn-spinner" /> Submitting…</>
                ) : "Yes, submit now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteBriefPage;
