import React, { useState, useEffect, useRef } from "react";
import "./ResourceFormPanel.css";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../../components/FormInput";
import Button from "../../../../../../components/Button/Button";

const DEFAULT_FORM = { name: "", category: "General", description: "" };

const ResourceFormPanel = ({ isShow, onClose, resourceData, onSubmit, isEditMode }) => {
  const fileInputRef = useRef(null);
  const [form, setForm]               = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [dragOver, setDragOver]       = useState(false);

  useEffect(() => {
    if (isEditMode && resourceData) {
      setForm({ name: resourceData.name || "", category: resourceData.category || "General", description: resourceData.description || "" });
    } else {
      setForm(DEFAULT_FORM);
      setSelectedFile(null);
    }
    setLoading(false);
  }, [isEditMode, resourceData, isShow]);

  const set = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) set("name")(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) set("name")(file.name.replace(/\.[^.]+$/, ""));
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
      <div className="rfp-panel">

        {/* ── Header ── */}
        <div className="rfp-header">
          <span className="rfp-header-deco"  aria-hidden="true" />
          <span className="rfp-header-deco2" aria-hidden="true" />
          <div className="rfp-header-content">
            <div className="rfp-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <h2 className="rfp-header-title">{isEditMode ? "Edit Resource" : "Upload Resource"}</h2>
              <p className="rfp-header-sub">{isEditMode ? "Update resource details" : "Add a new resource to staff profile"}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="rfp-body">

          {/* File drop zone — create mode only */}
          {!isEditMode && (
            <div className="rfp-section">
              <div className="rfp-section-label">File</div>
              <div
                className={`rfp-dropzone ${selectedFile ? "has-file" : ""} ${dragOver ? "drag-over" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="rfp-file-selected">
                    <div className="rfp-file-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="rfp-file-info">
                      <div className="rfp-file-name">{selectedFile.name}</div>
                      <div className="rfp-file-size">{formatSize(selectedFile.size)}</div>
                    </div>
                    <button className="rfp-file-remove" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="rfp-dropzone-empty">
                    <div className="rfp-dropzone-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 8 16"/>
                        <line x1="12" y1="12" x2="12" y2="21"/>
                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                      </svg>
                    </div>
                    <div className="rfp-dropzone-text">
                      <span className="rfp-dropzone-main">Click to browse or drag & drop</span>
                      <span className="rfp-dropzone-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, Images</span>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png,.webp" />
            </div>
          )}

          <FormInput label="Resource Name *" value={form.name} onChange={set("name")} placeholder="e.g., School Administration Handbook" />
          <FormInput label="Category" value={form.category} onChange={set("category")} placeholder="e.g., Administration, Training, Finance" />
          <FormInput label="Description" type="textarea" value={form.description} onChange={set("description")} placeholder="Brief description of this resource..." height="90px" />
        </div>

        {/* ── Footer ── */}
        <div className="rfp-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? (isEditMode ? "Saving..." : "Uploading...")
              : (isEditMode ? "Save Changes" : "Upload Resource")}
          </Button>
        </div>
      </div>

      </SlideInMenu>
  );
};

export default ResourceFormPanel;
