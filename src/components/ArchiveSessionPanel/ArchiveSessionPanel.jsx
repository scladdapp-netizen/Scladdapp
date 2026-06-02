import "./ArchiveSessionPanel.css";
import SlideInMenu from "../SlideInMenu/SlideInMenu";
import Button from "../Button/Button";
import { formatDate } from "../../services/dateFormarter";

const ArchiveSessionPanel = ({
  isOpen,
  onClose,
  onConfirm,
  sessionData,
  type = "session",
  mode = "archive",
}) => {
  if (!sessionData) return null;

  const isSession = type === "session";
  const isDelete  = mode === "delete";

  const name      = isSession ? sessionData.session_name              : sessionData.term_name;
  const code      = isSession ? sessionData.session_code              : sessionData.term_code;
  const startDate = isSession ? sessionData.academic_year_start_date  : sessionData.term_start_date;
  const endDate   = isSession ? sessionData.academic_year_end_date    : sessionData.term_end_date;
  const status    = isSession ? sessionData.session_status            : sessionData.term_status;

  const entityLabel = isSession ? "Session" : "Subsession";

  return (
    <SlideInMenu isShow={isOpen} onClose={onClose} width="500px">
      <div className="archive-session-panel-container">

        {/* ── Header ── */}
        <div className={`archive-session-panel-header ${isDelete ? "mode-delete" : "mode-archive"}`}>
          <span className="asp-arch-deco" aria-hidden="true" />
          <span className="asp-arch-deco2" aria-hidden="true" />
          <div className="archive-header-content">
            <div className="archive-header-icon">
              {isDelete ? (
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="6" width="18" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                  <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div className="archive-header-text">
              <h2>{isDelete ? "Delete" : "Archive"} {entityLabel}</h2>
              <p>
                {isDelete
                  ? `Permanently remove this ${entityLabel.toLowerCase()}`
                  : `Move this ${entityLabel.toLowerCase()} to archive`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="archive-session-panel-content">

          {/* Info grid */}
          <div className="archive-session-panel-info">
            <div className="archive-info-item">
              <span className="archive-info-label">Name</span>
              <span className="archive-info-value">{name}</span>
            </div>
            {code && (
              <div className="archive-info-item">
                <span className="archive-info-label">Code</span>
                <span className="archive-info-value">{code}</span>
              </div>
            )}
            <div className="archive-info-item">
              <span className="archive-info-label">Period</span>
              <span className="archive-info-value">
                {formatDate(startDate)} – {formatDate(endDate)}
              </span>
            </div>
            <div className="archive-info-item">
              <span className="archive-info-label">Status</span>
              <span className={`archive-status-pill ${status}`}>{status}</span>
            </div>
          </div>

          {/* Warning box */}
          <div className={`archive-warning-box ${isDelete ? "warn-delete" : "warn-archive"}`}>
            <div className="archive-warning-icon">
              {isDelete ? (
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <path d="M11 3l8.5 15H2.5L11 3z" fill="#cc3333" opacity="0.15" stroke="#cc3333" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M11 9v4" stroke="#cc3333" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="11" cy="16" r="1" fill="#cc3333"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <path d="M11 3l8.5 15H2.5L11 3z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M11 9v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="11" cy="16" r="1" fill="#f59e0b"/>
                </svg>
              )}
            </div>
            <div className="archive-warning-content">
              <h4>Important Notice</h4>
              {isDelete ? (
                <>
                  <p>Deleting this {entityLabel.toLowerCase()} will:</p>
                  <ul>
                    <li>Permanently remove it from the database</li>
                    <li>Delete all associated data</li>
                    <li>This action cannot be undone</li>
                  </ul>
                  <p className="archive-warning-note">This is permanent and cannot be reversed.</p>
                </>
              ) : (
                <>
                  <p>Archiving this {entityLabel.toLowerCase()} will:</p>
                  <ul>
                    <li>Mark it as archived and no longer active</li>
                    <li>Prevent any further modifications</li>
                    <li>Keep all historical data intact</li>
                    <li>Remove it from active lists</li>
                  </ul>
                  <p className="archive-warning-note">This can be reversed by an administrator if needed.</p>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── Footer (fixed) ── */}
        <div className="archive-session-panel-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={onConfirm}
            variant={isDelete ? "danger" : "danger"}
          >
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none" style={{ marginRight: 7 }}>
              {isDelete ? (
                <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <>
                  <rect x="2" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                  <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </>
              )}
            </svg>
            {isDelete ? `Delete ${entityLabel}` : `Archive ${entityLabel}`}
          </Button>
        </div>

      </div>
    </SlideInMenu>
  );
};

export default ArchiveSessionPanel;
