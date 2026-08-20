import { useState, useEffect } from "react";
import "./WebsiteRequestPanel.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

const proxyDownload = (url, name) =>
  `${API_BASE_URL}/api/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name || "document")}`;


const fmtSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── upload drop zone ──────────────────────────────────────────────────────────
const UploadZone = ({ id, label, accept, hint, icon, value, onChange, disabled }) => {
  const [drag, setDrag] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    onChange(file);
  };

  return (
    <div className="wrp-upload-wrap">
      <p className="wrp-upload-label">{label}</p>
      <label
        htmlFor={id}
        className={`wrp-zone${drag ? " wrp-zone--drag" : ""}${disabled ? " wrp-zone--disabled" : ""}${value ? " wrp-zone--filled" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
      >
        {value ? (
          <div className="wrp-zone-filled">
            <div className="wrp-zone-file-icon">{icon}</div>
            <div className="wrp-zone-file-info">
              <span className="wrp-zone-file-name">{value.name}</span>
              <span className="wrp-zone-file-size">{fmtSize(value.size)}</span>
            </div>
            {!disabled && (
              <button
                className="wrp-zone-remove"
                onClick={(e) => { e.preventDefault(); onChange(null); }}
                title="Remove"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="wrp-zone-empty">
            <div className="wrp-zone-icon">{icon}</div>
            <p className="wrp-zone-cta">Drag & drop or <span>browse</span></p>
            <p className="wrp-zone-hint">{hint}</p>
          </div>
        )}
        {!disabled && (
          <input
            id={id}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        )}
      </label>
    </div>
  );
};

// ── main panel ────────────────────────────────────────────────────────────────
const WebsiteRequestPanel = ({
  isOpen, onClose, schoolId, existingData,
  onDraftSaved, onSubmitted, onCancelled,
  saveDraftFn, submitFn, cancelFn, loading,
}) => {
  const [docFile,   setDocFile]   = useState(null);
  const [imgFile,   setImgFile]   = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(""); // "", "uploading", "saved"

  const isSubmitted = existingData?.status === "submitted";

  useEffect(() => {
    if (!isOpen) return;
    setDocFile(null);
    setImgFile(null);
    setShowConfirm(false);
    setUploadStatus("");
  }, [isOpen]);

  const hasExistingDoc = !!existingData?.description_doc_url;
  const hasExistingImg = !!existingData?.reference_image_url;

  const canSave = !isSubmitted && (docFile || imgFile);
  const canSubmit = !isSubmitted && (hasExistingDoc || docFile);

  const handleSave = async () => {
    setUploadStatus("uploading");
    const res = await saveDraftFn(schoolId, docFile, imgFile);
    if (res.success) {
      onDraftSaved(res.data);
      setDocFile(null);
      setImgFile(null);
      setUploadStatus("saved");
      setTimeout(() => setUploadStatus(""), 3000);
    } else {
      setUploadStatus("");
    }
  };

  const handleSubmit = async () => {
    // Save any pending files first
    if (docFile || imgFile) {
      const saveRes = await saveDraftFn(schoolId, docFile, imgFile);
      if (!saveRes.success) return;
      onDraftSaved(saveRes.data);
    }
    const res = await submitFn(schoolId);
    if (res.success) {
      onSubmitted();
      setShowConfirm(false);
    }
  };

  const handleCancel = async () => {
    const res = await cancelFn(schoolId);
    if (res.success) { onCancelled(); onClose(); }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="wrp-backdrop" onClick={onClose} />
      <div className="wrp-panel">

        {/* Header */}
        <div className="wrp-header">
          <div className="wrp-header-left">
            <div className="wrp-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="wrp-header-title">Request a School Website</h2>
              <p className="wrp-header-sub">
                {isSubmitted
                  ? "Submitted and locked · our team is working on it"
                  : "Upload your brief and reference — we'll handle the rest"}
              </p>
            </div>
          </div>
          <button className="wrp-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="wrp-body-simple">

          {/* What is this */}
          <div className="wrp-info-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="wrp-info-icon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <p>
              We'll build you a <strong>single-page website</strong> for your school — professionally designed, hosted, and linked to your Scladapp profile. It includes everything on one scrollable page: hero, about, stats, admissions, contact, and footer.
            </p>
          </div>

          {/* Warning */}
          <div className="wrp-caution">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <div>
              <strong>Your document is your brief.</strong> Make sure it includes everything you want on the website — school name, slogan, about text, stats, admissions info, social links, colour preferences, and anything else. Once submitted this cannot be changed.
            </div>
          </div>

          {/* Document upload */}
          <UploadZone
            id="wrp-doc"
            label="Description Document *"
            accept=".pdf,.doc,.docx,.txt"
            hint="PDF, Word, or text file — describe everything you want on your website"
            disabled={isSubmitted}
            value={docFile}
            onChange={setDocFile}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            }
          />

          {/* Show already-uploaded doc */}
          {!docFile && hasExistingDoc && (
            <div className="wrp-existing-file">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Uploaded: <a href={proxyDownload(existingData.description_doc_url, existingData.description_doc_name)} target="_blank" rel="noreferrer">{existingData.description_doc_name || "View document"}</a></span>
              {!isSubmitted && <span className="wrp-replace-hint">Upload a new file above to replace it</span>}
            </div>
          )}

          {/* Reference image upload */}
          <UploadZone
            id="wrp-img"
            label="Reference Image (optional)"
            accept="image/*"
            hint="A screenshot or example website you like — helps us match your style"
            disabled={isSubmitted}
            value={imgFile}
            onChange={setImgFile}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.5"/>
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
              </svg>
            }
          />

          {/* Show already-uploaded image */}
          {!imgFile && hasExistingImg && (
            <div className="wrp-existing-img">
              <img src={existingData.reference_image_url} alt="Reference" className="wrp-existing-img-thumb" />
              <div className="wrp-existing-img-info">
                <span className="wrp-existing-img-name">{existingData.reference_image_name || "Reference image"}</span>
                {!isSubmitted && <span className="wrp-replace-hint">Upload a new image above to replace it</span>}
              </div>
            </div>
          )}

          {/* Submitted state */}
          {isSubmitted && (
            <div className="wrp-submitted-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong>Brief submitted.</strong> Our team will review your document and reference, then reach out to get started. This form is now permanently locked.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <div className="wrp-footer">
            <div className="wrp-footer-left">
              {uploadStatus === "uploading" && <span className="wrp-status">Uploading…</span>}
              {uploadStatus === "saved"     && <span className="wrp-status wrp-status--ok">✓ Saved</span>}
            </div>
            <div className="wrp-footer-right">
              <button className="wrp-btn-cancel" onClick={handleCancel} disabled={loading}>Cancel Request</button>
              <button className="wrp-btn-draft"  onClick={handleSave}   disabled={loading || !canSave || uploadStatus === "uploading"}>
                {uploadStatus === "uploading" ? "Uploading…" : "Save Draft"}
              </button>
              <button className="wrp-btn-submit" onClick={() => setShowConfirm(true)} disabled={loading || !canSubmit}>
                Submit Brief
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && (
        <>
          <div className="wrp-confirm-backdrop"/>
          <div className="wrp-confirm">
            <div className="wrp-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="wrp-confirm-title">Submit your website brief?</h3>
            <p className="wrp-confirm-body">
              Once submitted, <strong>this brief is permanently locked</strong> and cannot be changed. Our team will build your website based exactly on what you've uploaded.
              <br/><br/>
              Make sure your document contains <strong>everything you want</strong> on the website before continuing.
            </p>
            <div className="wrp-confirm-actions">
              <button className="wrp-btn-draft"  onClick={() => setShowConfirm(false)} disabled={loading}>Go back &amp; review</button>
              <button className="wrp-btn-submit" onClick={handleSubmit} disabled={loading}>{loading ? "Submitting…" : "Yes, submit now"}</button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default WebsiteRequestPanel;
