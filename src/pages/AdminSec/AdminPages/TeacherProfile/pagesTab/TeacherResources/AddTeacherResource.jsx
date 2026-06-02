import { useState, useRef } from "react";
import "./AddTeacherResource.css";
import Button from "../../../../../../components/Button/Button";
import { useTeacherResource } from "../../../../../../api_call/useTeacherResource";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import SubscriptionLimitModal from "../../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

const CATEGORIES = [
  "Teaching Materials", "Laboratory", "Evaluation", "Interactive Content",
  "Administration", "Projects", "Curriculum", "Presentations", "General",
];

const AddTeacherResource = ({ teacherData, onClose, onSave }) => {
  const { addNotification } = useNotification();
  const { createResource, loading } = useTeacherResource();
  const fileInputRef = useRef(null);

  const [form, setForm]             = useState({ name: "", description: "", category: "Teaching Materials" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg]   = useState("");

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target?.value ?? e }));

  const handleFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) setForm((p) => ({ ...p, name: file.name.replace(/\.[^.]+$/, "") }));
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const formatSize = (b) => b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const handleSave = async () => {
    if (!form.name.trim())  return addNotification("Resource name is required", "error");
    if (!selectedFile)      return addNotification("Please select a file", "error");

    const teacherId = teacherData?.teacher?.teacher_id;
    const schoolId  = teacherData?.teacher?.school_id;

    const fd = new FormData();
    fd.append("file",        selectedFile);
    fd.append("teacher_id",  teacherId || "");
    fd.append("school_id",   schoolId  || "");
    fd.append("name",        form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("category",    form.category);

    const result = await createResource(fd);
    if (result.success) {
      addNotification("Resource added successfully", "success");
      onSave?.();
    } else if (result.message?.includes("Storage limit")) {
      setStorageLimitMsg(result.message);
      setStorageLimitOpen(true);
    } else {
      addNotification(result.message || "Failed to add resource", "error");
    }
  };

  const teacherName = teacherData?.teacher?.staff?.full_name || "this teacher";

  return (
    <div className="atr-panel">

      {/* ── Header ── */}
      <div className="atr-header">
        <span className="atr-deco"  aria-hidden="true" />
        <span className="atr-deco2" aria-hidden="true" />
        <div className="atr-header-content">
          <div className="atr-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <h2 className="atr-header-title">Add New Resource</h2>
            <p className="atr-header-sub">Upload a file for {teacherName}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="atr-body">

        {/* Drop zone */}
        <div className="atr-section">
          <div className="atr-label">File</div>
          <div
            className={`atr-dropzone ${selectedFile ? "has-file" : ""} ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="atr-file-selected">
                <div className="atr-file-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="atr-file-info">
                  <div className="atr-file-name">{selectedFile.name}</div>
                  <div className="atr-file-size">{formatSize(selectedFile.size)}</div>
                </div>
                <button className="atr-file-remove" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="atr-dropzone-empty">
                <div className="atr-dropzone-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 16 12 12 8 16"/>
                    <line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                  </svg>
                </div>
                <div className="atr-dropzone-text">
                  <span className="atr-dropzone-main">Click to browse or drag & drop</span>
                  <span className="atr-dropzone-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Images, ZIP</span>
                </div>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" onChange={(e) => handleFile(e.target.files?.[0])}
            style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar" />
        </div>

        {/* Name */}
        <div className="atr-section">
          <div className="atr-label">Resource Name *</div>
          <input className="atr-input" type="text" value={form.name}
            onChange={set("name")} placeholder="e.g., Lesson Plan — Week 3" />
        </div>

        {/* Category */}
        <div className="atr-section">
          <div className="atr-label">Category</div>
          <select className="atr-select" value={form.category} onChange={set("category")}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div className="atr-section">
          <div className="atr-label">Description (Optional)</div>
          <textarea className="atr-textarea" value={form.description}
            onChange={set("description")} placeholder="Brief description of this resource..." rows={3} />
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="atr-footer">
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSave} disabled={!form.name.trim() || !selectedFile || loading}>
          {loading ? "Uploading..." : "Add Resource"}
        </Button>
      </div>

      <SubscriptionLimitModal isOpen={storageLimitOpen} onClose={() => setStorageLimitOpen(false)} message={storageLimitMsg} />
    </div>
  );
};

export default AddTeacherResource;
