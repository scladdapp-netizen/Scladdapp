import { useEffect } from "react";

/** A plain dialog. Escape and the backdrop close it unless `locked` is set. */
export const CbtModal = ({ title, onClose, children, footer, wide = false, locked = false }) => {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, locked]);

  return (
    <div className="cbt-modal-back" onMouseDown={(event) => event.target === event.currentTarget && !locked && onClose()}>
      <div className={`cbt-modal${wide ? " is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="cbt-modal-head">
          <h2>{title}</h2>
          <button type="button" className="cbt-icon-btn" onClick={onClose} disabled={locked} aria-label="Close">×</button>
        </div>
        <div className="cbt-modal-body">{children}</div>
        {footer && <div className="cbt-modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ title, message, confirmLabel = "Confirm", danger = false, busy = false, onConfirm, onCancel }) => (
  <CbtModal
    title={title}
    onClose={onCancel}
    locked={busy}
    footer={
      <>
        <button type="button" className="cbt-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className={`cbt-btn${danger ? " is-danger" : ""}`} onClick={onConfirm} disabled={busy}>
          {busy ? "Working..." : confirmLabel}
        </button>
      </>
    }
  >
    <p className="cbt-modal-text">{message}</p>
  </CbtModal>
);
