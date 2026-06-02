import "./DeleteConfirmPanel.css";
import SlideInMenu from "../SlideInMenu/SlideInMenu";
import Button from "../Button/Button";

/**
 * Reusable delete confirmation panel using SlideInMenu.
 *
 * Props:
 *  isOpen      — boolean
 *  onClose     — fn
 *  onConfirm   — async fn, called on confirm
 *  loading     — boolean
 *  title       — string  e.g. "Delete Guardian"
 *  description — string  e.g. "You are about to remove this guardian."
 *  itemName    — string  highlighted name in the panel
 */
const DeleteConfirmPanel = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Delete Item",
  description = "This action cannot be undone.",
  itemName = "",
}) => {
  return (
    <SlideInMenu isShow={isOpen} onClose={onClose} width="420px">
      <div className="dcp-container">
        {/* Dark header */}
        <div className="dcp-header">
          <span className="dcp-header-deco" aria-hidden="true" />
          <div className="dcp-header-content">
            <div className="dcp-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dcp-header-text">
              <h2>{title}</h2>
              <p>Confirm before proceeding</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="dcp-body">
          <p className="dcp-desc">{description}</p>

          {itemName && (
            <div className="dcp-item-name">
              <span>{itemName}</span>
            </div>
          )}

          <div className="dcp-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            This action is permanent and cannot be undone.
          </div>
        </div>

        {/* Footer */}
        <div className="dcp-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="dcp-delete-btn" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </SlideInMenu>
  );
};

export default DeleteConfirmPanel;
