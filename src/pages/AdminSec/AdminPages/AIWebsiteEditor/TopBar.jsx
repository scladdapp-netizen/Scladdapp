// TopBar.jsx
// Top navigation bar for the AI Website Editor.
// Contains: back button, logo, site name, save status,
// editor mode toggle (AI / Manual), view toggle, undo/redo,
// reset-to-live, token badge, and publish button.

import { useNavigate, useParams } from "react-router-dom";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconUndo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 13C5.33 7.87 11 4 17 5a9 9 0 013.8 17.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconRedo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 13C18.67 7.87 13 4 7 5A9 9 0 003.2 22.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconCoin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v1m0 8v1M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPublish = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 16V4M6 10l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconEye = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconReset = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconSplit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
  </svg>
);
const IconAI = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
);
const IconHammer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M15 12l-8.5 8.5a2.12 2.12 0 01-3-3L12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17.64 15L22 10.64l-2-2-1.5 1.5-2.5-2.5 1.5-1.5-2-2L11 8.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Props:
 *   siteName      – string
 *   saveStatus    – "saved" | "saving" | "unsaved"
 *   editorMode    – "ai" | "manual"
 *   onEditorMode  – fn("ai" | "manual")
 *   tokenCount    – number  (only relevant in AI mode)
 *   onBuyTokens   – fn()
 *   canUndo       – bool
 *   canRedo       – bool
 *   onUndo        – fn()
 *   onRedo        – fn()
 *   viewMode      – "split" | "preview"
 *   onViewMode    – fn("split" | "preview")
 *   onPublish     – fn()
 *   publishing    – bool
 *   onResetToLive – fn()
 *   resetting     – bool
 */
export default function TopBar({
  siteName,
  saveStatus,
  editorMode,
  onEditorMode,
  tokenCount,
  onBuyTokens,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewMode,
  onViewMode,
  onPublish,
  publishing,
  onResetToLive,
  resetting,
}) {
  const navigate     = useNavigate();
  const { schoolId } = useParams();

  const saveDotClass =
    saveStatus === "saved"  ? "aie-save-dot aie-save-dot--saved"  :
    saveStatus === "saving" ? "aie-save-dot aie-save-dot--saving" :
                              "aie-save-dot aie-save-dot--unsaved";

  const saveLabel =
    saveStatus === "saved"  ? "Draft saved" :
    saveStatus === "saving" ? "Saving…"     :
                              "Unsaved changes";

  return (
    <header className="aie-topbar">

      {/* ── Left: back, logo, site name, save status ─────────────────────── */}
      <div className="aie-topbar-left">
        <button
          className="aie-back-btn"
          onClick={() => navigate(`/admin/${schoolId}/school/profile`)}
          aria-label="Back to website settings"
        >
          <IconArrowLeft />
          Back
        </button>

        <div className="aie-logo">
          <div className="aie-logo-dot">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <span className="aie-logo-text">Website Editor</span>
        </div>

        {/* {siteName && <span className="aie-site-name">{siteName}</span>} */}

        <div className="aie-save-status">
          <span className={saveDotClass} />
          <span>{saveLabel}</span>
        </div>
      </div>

      {/* ── Center: editor mode toggle + view toggle ──────────────────────── */}
      <div className="aie-topbar-center">

        {/* Editor mode: AI / Manual */}
        <div className="aie-mode-toggle" role="group" aria-label="Editor mode">
          <button
            className={`aie-mode-btn ${editorMode === "ai" ? "aie-mode-btn--active" : ""}`}
            onClick={() => onEditorMode("ai")}
            title="AI editing mode"
          >
            <IconAI />
            AI Mode
          </button>
          <button
            className={`aie-mode-btn ${editorMode === "manual" ? "aie-mode-btn--active" : ""}`}
            onClick={() => onEditorMode("manual")}
            title="Manual editing mode"
          >
            <IconHammer />
            Manual
          </button>
        </div>

        <div className="aie-topbar-divider" aria-hidden="true" />

        {/* View: Edit (split) / Preview */}
        <div className="aie-view-toggle" role="group" aria-label="View mode">
          <button
            className={`aie-view-btn ${viewMode === "split" ? "aie-view-btn--active" : ""}`}
            onClick={() => onViewMode("split")}
            title="Split view"
          >
            <IconSplit /> Edit
          </button>
          <button
            className={`aie-view-btn ${viewMode === "preview" ? "aie-view-btn--active" : ""}`}
            onClick={() => onViewMode("preview")}
            title="Preview only"
          >
            <IconEye /> Preview
          </button>
        </div>
      </div>

      {/* ── Right: undo/redo, reset, tokens, publish ──────────────────────── */}
      <div className="aie-topbar-right">

        {/* Undo / Redo */}
        <div className="aie-history-btns">
          <button
            className="aie-icon-btn"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <IconUndo />
          </button>
          <button
            className="aie-icon-btn"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
          >
            <IconRedo />
          </button>
        </div>

        {/* Reset to live */}
        {onResetToLive && (
          <button
            className="aie-reset-btn"
            onClick={onResetToLive}
            disabled={resetting || publishing}
            title="Discard draft and reload the live published website"
            aria-label="Reset to live"
          >
            {resetting ? <span className="aie-publish-spinner" /> : <IconReset />}
            {resetting ? "Loading…" : "Reset to live"}
          </button>
        )}

        {/* Token badge — only shown in AI mode */}
        {editorMode === "ai" && (
          <button className="aie-token-badge" onClick={onBuyTokens} aria-label="Token balance">
            <span className="aie-token-icon"><IconCoin /></span>
            <span className="aie-token-count">{tokenCount}</span>
            <span className="aie-token-label">tokens</span>
          </button>
        )}

        {/* Publish */}
        <button
          className="aie-publish-btn"
          onClick={onPublish}
          disabled={publishing}
          aria-label="Publish website"
        >
          {publishing ? (
            <><span className="aie-publish-spinner" /> Publishing…</>
          ) : (
            <><IconPublish /> Publish</>
          )}
        </button>
      </div>
    </header>
  );
}
