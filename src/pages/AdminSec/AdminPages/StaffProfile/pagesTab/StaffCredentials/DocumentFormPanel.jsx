import React, { useState, useEffect, useRef } from "react";
import "./DocumentFormPanel.css";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import FormInput from "../../../../../../components/FormInput";

const CATEGORIES = ["Academic","Administrative","Certification","License","Medical","Legal","Financial","Identity","Training","General"];
const VERIFICATION_STATUSES = ["Pending","Verified","Rejected","Expired"];

const DEFAULT_FORM = {
  title: "", category: "General", issuer: "", documentNumber: "",
  description: "", expiryDate: "", isRequired: false, verificationStatus: "Pending",
};

const DocumentFormPanel = ({ isShow, onClose, documentData, onSubmit, isEditMode }) => {
  const fileInputRef = useRef(null);
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  useEffect(() => {
    if (isEditMode && documentData) {
      setForm({
        title:              documentData.title || "",
        category:           documentData.category || "General",
        issuer:             documentData.issuer || "",
        documentNumber:     documentData.documentNumber || "",
        description:        documentData.description || "",
        expiryDate:         documentData.expiryDate ? String(documentData.expiryDate).slice(0, 10) : "",
        isRequired:         documentData.isRequired || false,
        verificationStatus: documentData.verificationStatus || "Pending",
      });
    } else {
      setForm(DEFAULT_FORM);
      setSelectedFile(null);
    }
    setLoading(false);
  }, [isEditMode, documentData, isShow]);

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.title) set("title")(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.title) set("title")(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(form, selectedFile);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <SlideInMenu isShow={isShow} onClose={onClose} width="600px">
      <div className="dfp-panel">

        {/* ── Header ── */}
        <div className="dfp-header">
          <span className="dfp-header-deco"  aria-hidden="true" />
          <span className="dfp-header-deco2" aria-hidden="true" />
          <div className="dfp-header-content">
            <div className="dfp-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <polyline points="9 15 12 18 15 15"/>
                <line x1="12" y1="12" x2="12" y2="18"/>
              </svg>
            </div>
            <div>
              <h2 className="dfp-header-title">{isEditMode ? "Edit Document" : "Upload Document"}</h2>
              <p className="dfp-header-sub">{isEditMode ? "Update document metadata" : "Add a new credential or document"}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="dfp-body">

          {/* File drop zone — create mode only */}
          {!isEditMode && (
            <div className="dfp-section">
              <div className="dfp-section-label">File</div>
              <div
                className={`dfp-dropzone ${selectedFile ? "has-file" : ""} ${dragOver ? "drag-over" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="dfp-file-selected">
                    <div className="dfp-file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="dfp-file-info">
                      <div className="dfp-file-name">{selectedFile.name}</div>
                      <div className="dfp-file-size">{formatSize(selectedFile.size)}</div>
                    </div>
                    <button className="dfp-file-remove" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="dfp-dropzone-empty">
                    <div className="dfp-dropzone-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <div className="dfp-dropzone-text">
                      <span className="dfp-dropzone-main">Click to browse or drag & drop</span>
                      <span className="dfp-dropzone-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG</span>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png" />
            </div>
          )}

          <FormInput label="Document Title *" value={form.title} onChange={set("title")} placeholder="e.g. Teaching License 2024" />

          <FormInput label="Category" type="select" value={form.category} onChange={set("category")}
            options={CATEGORIES.map((c) => ({ label: c, value: c }))} />

          <FormInput label="Issuer *" value={form.issuer} onChange={set("issuer")} placeholder="e.g. Ministry of Education" />

          <FormInput label="Document Number" value={form.documentNumber} onChange={set("documentNumber")} placeholder="e.g. LIC-2024-00123" />

          <FormInput label="Expiry Date" type="date" value={form.expiryDate} onChange={set("expiryDate")} />

          <FormInput label="Verification Status" type="select" value={form.verificationStatus} onChange={set("verificationStatus")}
            options={VERIFICATION_STATUSES.map((s) => ({ label: s, value: s }))} />

          <FormInput label="Required Document" type="checkbox" value={form.isRequired} onChange={set("isRequired")} />

          <FormInput label="Description" type="textarea" value={form.description} onChange={set("description")}
            placeholder="Optional notes about this document..." height="80px" />
        </div>

        {/* ── Footer ── */}
        <div className="dfp-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? (isEditMode ? "Saving..." : "Uploading...")
              : (isEditMode ? "Save Changes" : "Upload Document")}
          </Button>
        </div>
      </div>

      </SlideInMenu>
  );
};

export default DocumentFormPanel;
