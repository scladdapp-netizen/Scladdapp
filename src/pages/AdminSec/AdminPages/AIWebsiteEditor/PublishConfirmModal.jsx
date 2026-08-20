import { useState } from "react";
import "./PublishConfirmModal.css";

const IconPublish = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 16V4M6 10l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCheckSmall = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const CHECKLIST = [
  "Your current draft will go live immediately",
  "The previous published version will be replaced",
  "All visitors to your site will see the changes",
];

export default function PublishConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  publishing,
  publishedUrl,
  isSuccess,
}) {
  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="pcm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="pcm-modal" role="dialog" aria-modal="true">
          <div className="pcm-success-body">
            <div className="pcm-success-icon">
              <IconCheck />
            </div>
            <h2 className="pcm-success-title">Site published!</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#555555" }}>
              Your website is now live and accessible at:
            </p>
            {publishedUrl && (
              <div className="pcm-success-url">
                <IconGlobe />
                <a href={publishedUrl} target="_blank" rel="noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}>
                  {publishedUrl}
                </a>
              </div>
            )}
            <button className="pcm-success-done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pcm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pcm-modal" role="dialog" aria-modal="true" aria-labelledby="pcm-title">
        <div className="pcm-body">
          <div className="pcm-icon">
            <IconPublish />
          </div>
          <h2 className="pcm-title" id="pcm-title">Publish website?</h2>
          <p className="pcm-desc">
            This will update the live version of your school website that the public can see.
          </p>

          <div className="pcm-checklist">
            {CHECKLIST.map((item) => (
              <div className="pcm-check-item" key={item}>
                <div className="pcm-check-dot">
                  <IconCheckSmall />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="pcm-footer">
          <button className="pcm-cancel-btn" onClick={onClose} disabled={publishing}>
            Cancel
          </button>
          <button className="pcm-confirm-btn" onClick={onConfirm} disabled={publishing}>
            {publishing ? (
              <><span className="pcm-confirm-spinner" /> Publishing…</>
            ) : (
              <><IconPublish /> Publish now</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
