// AddTemplateModal.jsx
// Sections + Components fetched from the backend API.
// Falls back gracefully with an error state if the request fails.

import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

// ── fetch hook ────────────────────────────────────────────────────────────────
function useTemplates(isOpen) {
  const [sections,   setSections]   = useState([]);
  const [components, setComponents] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);

    let token = "";
    try {
      const raw = sessionStorage.getItem("user");
      if (raw) token = JSON.parse(raw)?.token || "";
    } catch (_) {}

    fetch(`${API_BASE}/api/website-templates`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to load templates");
        setSections(data.data.sections   || []);
        setComponents(data.data.components || []);
      })
      .catch((err) => setError(err.message || "Could not load templates"))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return { sections, components, loading, error };
}

// ── group helpers ─────────────────────────────────────────────────────────────
function groupBy(items) {
  return items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const IconSections = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconComponents = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ── loading skeleton ──────────────────────────────────────────────────────────
function SkeletonGrid({ count = 6, height = 160 }) {
  return (
    <div className="atm-sections-scroll">
      <div className="atm-section-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="atm-skeleton-card" style={{ height }} />
        ))}
      </div>
    </div>
  );
}

/**
 * Props:
 *   isOpen       – boolean
 *   initialTab   – "sections" | "components"
 *   onClose      – fn()
 *   onInsert     – fn(templateHtml)
 *   targetLabel  – optional string describing where the insert will land
 */
export default function AddTemplateModal({ isOpen, initialTab, onClose, onInsert, targetLabel }) {
  const [tab, setTab] = useState(initialTab || "sections");
  const { sections, components, loading, error } = useTemplates(isOpen);

  // sync tab when modal re-opens
  useEffect(() => {
    if (isOpen) setTab(initialTab || "sections");
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleInsert = (html) => {
    onInsert(html);
    onClose();
  };

  const sectionGroups   = groupBy(sections);
  const componentGroups = groupBy(components);

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="atm-header">
          <div className="atm-header__left">
            <span className="atm-header__title">Add to page</span>
            <span className="atm-header__sub">
              {targetLabel
                ? <>Inserting inside <strong>{targetLabel}</strong></>
                : "Click a block to insert it at the bottom of your page"}
            </span>
          </div>
          <button className="atm-close-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div className="atm-tabs">
          <button
            className={`atm-tab ${tab === "sections" ? "atm-tab--active" : ""}`}
            onClick={() => setTab("sections")}
          >
            <IconSections /> Sections
          </button>
          <button
            className={`atm-tab ${tab === "components" ? "atm-tab--active" : ""}`}
            onClick={() => setTab("components")}
          >
            <IconComponents /> Components
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────── */}
        <div className="atm-body">

          {/* loading */}
          {loading && (
            tab === "sections"
              ? <SkeletonGrid count={6} height={160} />
              : <SkeletonGrid count={9} height={110} />
          )}

          {/* error */}
          {!loading && error && (
            <div className="atm-fetch-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ── SECTIONS tab ── */}
          {!loading && !error && tab === "sections" && (
            <div className="atm-sections-scroll">
              {Object.keys(sectionGroups).length === 0 && (
                <div className="atm-empty">No sections found.</div>
              )}
              {Object.entries(sectionGroups).map(([cat, items]) => (
                <div key={cat} className="atm-group">
                  <div className="atm-group__label">{cat}</div>
                  <div className="atm-section-grid">
                    {items.map((item) => (
                      <button
                        key={item.template_id}
                        className="atm-section-card"
                        onClick={() => handleInsert(item.html)}
                        title={item.label}
                      >
                        <div className="atm-section-card__preview">
                          <iframe
                            srcDoc={`<style>*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif;}body{width:1100px;display:flex;align-items:center;justify-content:center;min-height:640px;overflow:hidden;}</style>${item.html}`}
                            title={item.label}
                            className="atm-section-card__iframe"
                            sandbox=""
                          />
                        </div>
                        <div className="atm-section-card__footer">
                          <span className="atm-section-card__name">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── COMPONENTS tab ── */}
          {!loading && !error && tab === "components" && (
            <div className="atm-comp-scroll">
              {Object.keys(componentGroups).length === 0 && (
                <div className="atm-empty">No components found.</div>
              )}
              {Object.entries(componentGroups).map(([cat, items]) => (
                <div key={cat} className="atm-group">
                  <div className="atm-group__label">{cat}</div>
                  <div className="atm-comp-grid">
                    {items.map((item) => (
                      <button
                        key={item.template_id}
                        className="atm-comp-card"
                        onClick={() => handleInsert(item.html)}
                        title={item.label}
                      >
                        <div className="atm-comp-card__preview">
                          <iframe
                            srcDoc={`<style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;align-items:center;justify-content:center;padding:14px;min-height:90px;background:#f8f8f8;overflow:hidden;}</style>${item.html}`}
                            title={item.label}
                            className="atm-comp-card__iframe"
                            sandbox=""
                          />
                        </div>
                        <div className="atm-comp-card__footer">
                          <span className="atm-comp-card__name">{item.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
