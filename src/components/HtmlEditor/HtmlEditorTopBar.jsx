/**
 * HtmlEditorTopBar — reusable top bar for HTML fragment editors.
 * Used by: EditTemplatePage, (future) EmailTemplatePage
 *
 * Props:
 *   name        – string — document/template name shown in centre
 *   saveStatus  – "saved" | "saving" | "unsaved"
 *   canUndo     – bool
 *   canRedo     – bool
 *   onUndo      – fn()
 *   onRedo      – fn()
 *   onSave      – fn()  — explicit save / publish button
 *   saving      – bool  — save button loading state
 *   onReset     – fn()  — optional reset-to-default button
 *   resetting   – bool  — reset button loading state
 *   onBack      – fn()  — back button click
 *   backLabel   – string (default "Back")
 *   hasDraft    – bool  — show amber "Draft" badge
 *   children    – optional extra actions rendered in the right slot
 */

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconUndo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 7v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 13C5.33 7.87 11 4 17 5a9 9 0 013.8 17.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconRedo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M21 7v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 13C18.67 7.87 13 4 7 5A9 9 0 003.2 22.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const IconReset = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function HtmlEditorTopBar({
  name,
  saveStatus = "saved",
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onSave,
  saving = false,
  onReset,
  resetting = false,
  onBack,
  backLabel = "Back",
  hasDraft = false,
  children,
}) {
  const saveDotClass =
    saveStatus === "saved"  ? "aie-save-dot aie-save-dot--saved"  :
    saveStatus === "saving" ? "aie-save-dot aie-save-dot--saving" :
                              "aie-save-dot aie-save-dot--unsaved";

  const saveLabel =
    saveStatus === "saved"  ? "Draft saved"    :
    saveStatus === "saving" ? "Saving…"        :
                              "Unsaved changes";

  return (
    <header className="aie-topbar">
      {/* ── Left: back + name + draft badge + save status ── */}
      <div className="aie-topbar-left">
        <button className="aie-back-btn" onClick={onBack} aria-label={backLabel}>
          <IconArrowLeft /> {backLabel}
        </button>
        {name && <span className="aie-site-name">{name}</span>}
        {hasDraft && (
          <span className="aie-draft-badge" title="You have unpublished edits. Click Save to publish.">
            Draft
          </span>
        )}
        <div className="aie-save-status">
          <span className={saveDotClass} />
          <span>{saveLabel}</span>
        </div>
      </div>

      {/* ── Right: undo/redo + optional extras + reset + save ── */}
      <div className="aie-topbar-right">
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

        {children}

        {onReset && (
          <button
            className="aie-icon-btn aie-reset-btn"
            onClick={onReset}
            disabled={resetting}
            title="Reset to default layout"
            aria-label="Reset to default"
          >
            {resetting ? <span className="aie-publish-spinner" /> : <IconReset />}
            <span>Reset</span>
          </button>
        )}

        <button
          className="aie-publish-btn"
          onClick={onSave}
          disabled={saving}
          aria-label="Save"
        >
          {saving ? (
            <><span className="aie-publish-spinner" /> Saving…</>
          ) : (
            <><IconSave /> Save</>
          )}
        </button>
      </div>
    </header>
  );
}
