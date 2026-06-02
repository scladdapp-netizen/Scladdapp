import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../../components/ResourceCard/ResourceCard";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import useSubjectResource from "../../../../../../api_call/useSubjectResource";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import downloadFile from "../../../../../../utils/downloadFile";
import "./SubjectResources.css";

const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];
const DEFAULT_FORM = { name: "", category: "General", description: "" };

const SubjectResources = ({ subjectData }) => {
  const { subjectId, schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, getBySubject, createResource, updateResource, incrementDownload, deleteResource } =
    useSubjectResource();

  const subjectName  = subjectData?.subject?.subject_name || "Subject";
  const uploaderId   = user?.staff?.staff_id || user?.admin?.admin_id || user?.user_id;
  const uploaderName = user?.staff?.full_name || user?.admin?.username || "Teacher";

  const [resources, setResources]       = useState([]);
  const [filterType, setFilterType]     = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [selectedDoc, setSelectedDoc]   = useState(null);
  const [form, setForm]                 = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docToDelete, setDocToDelete]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const load = async () => {
    if (!subjectId) return;
    const res = await getBySubject(subjectId);
    if (res.success) setResources(res.data);
  };

  useEffect(() => { load(); }, [subjectId]);

  const typeCount = (type) =>
    resources.filter((d) =>
      (type === "all" || (d.file_type || "").toLowerCase() === type) &&
      (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).length;

  const filtered = resources.filter((doc) => {
    const matchType = filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return matchType && (!q || (doc.name || "").toLowerCase().includes(q) || (doc.category || "").toLowerCase().includes(q));
  });

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources((prev) => prev.map((r) =>
        r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
      ));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const openAdd = () => {
    setIsEditMode(false); setSelectedDoc(null);
    setForm(DEFAULT_FORM); setSelectedFile(null);
    setShowFormPanel(true);
  };

  const openEdit = (doc) => {
    setIsEditMode(true); setSelectedDoc(doc);
    setForm({ name: doc.name || "", category: doc.category || "General", description: doc.description || "" });
    setSelectedFile(null); setShowFormPanel(true);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    if (!form.name) setForm((p) => ({ ...p, name: f.name.split(".")[0] }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return addNotification("Resource name is required", "error");
    if (!isEditMode && !selectedFile) return addNotification("Please select a file", "error");
    setSubmitting(true);
    try {
      if (isEditMode) {
        const res = await updateResource(selectedDoc.resource_id, {
          name: form.name, description: form.description, category: form.category, modified_by: uploaderId,
        });
        if (res.success) {
          addNotification("Resource updated", "success");
          setResources((prev) => prev.map((r) => r.resource_id === selectedDoc.resource_id ? res.data : r));
          setShowFormPanel(false);
        } else {
          addNotification(res.message || "Failed to update", "error");
        }
      } else {
        const fd = new FormData();
        fd.append("file", selectedFile);
        fd.append("subject_id", subjectId);
        fd.append("school_id", schoolId || subjectData?.subject?.school_id || "");
        fd.append("name", form.name);
        fd.append("description", form.description || "");
        fd.append("category", form.category);
        fd.append("uploaded_by_id", uploaderId || "");
        fd.append("uploaded_by_name", uploaderName);
        const res = await createResource(fd);
        if (res.success) {
          addNotification("Resource uploaded", "success");
          setResources((prev) => [res.data, ...prev]);
          setShowFormPanel(false);
        } else {
          addNotification(res.message || "Failed to upload", "error");
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteResource(docToDelete.resource_id, uploaderId);
    if (res.success) {
      addNotification("Resource deleted", "success");
      setResources((prev) => prev.filter((r) => r.resource_id !== docToDelete.resource_id));
      setDocToDelete(null);
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  return (
    <InnerTabCon>
      <div className="subjectResources">
        {/* Header */}
        <div className="sr2-header">
          <div className="sr2-header-left">
            <h2 className="sr2-title">Resources</h2>
            <p className="sr2-subtitle">
              {resources.length} {resources.length === 1 ? "file" : "files"} for {subjectName}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="sr2-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            className="sr2-search"
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sr2-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="sr2-tabs">
          {FILE_TYPES.map((type) => (
            <button
              key={type}
              className={`sr2-tab ${filterType === type ? "active" : ""}`}
              onClick={() => setFilterType(type)}
            >
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (filtered.length === 0 ? (
          <div className="sr2-empty">
            <h3>No resources found</h3>
            <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
            {searchQuery && <button className="sr2-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>}
          </div>
        ) : (
          <div className="sr2-grid">
            {filtered.map((doc) => (
              <ResourceCard
                key={doc.resource_id}
                doc={doc}
                onDownload={handleDownload}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Upload / Edit panel */}
      <SlideInMenu isShow={showFormPanel} onClose={() => setShowFormPanel(false)} width="520px">
        <div className="srp-panel">

          {/* Header */}
          <div className="srp-header">
            <span className="srp-deco"  aria-hidden="true" />
            <span className="srp-deco2" aria-hidden="true" />
            <div className="srp-header-content">
              <div className="srp-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <div>
                <h2 className="srp-header-title">{isEditMode ? "Edit Resource" : "Upload Resource"}</h2>
                <p className="srp-header-sub">{isEditMode ? "Update resource details" : `Add a new file for ${subjectName}`}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="srp-body">
            {!isEditMode && (
              <div className="srp-section">
                <div className="srp-label">File</div>
                <div
                  className={`srp-dropzone ${selectedFile ? "has-file" : ""} ${dragOver ? "drag-over" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault(); setDragOver(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) { setSelectedFile(f); if (!form.name) setForm((p) => ({ ...p, name: f.name.replace(/\.[^.]+$/, "") })); }
                  }}
                >
                  {selectedFile ? (
                    <div className="srp-file-selected">
                      <div className="srp-file-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                      <div className="srp-file-info">
                        <div className="srp-file-name">{selectedFile.name}</div>
                        <div className="srp-file-size">
                          {selectedFile.size < 1024 * 1024
                            ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                            : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                        </div>
                      </div>
                      <button className="srp-file-remove" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="srp-dropzone-empty">
                      <div className="srp-dropzone-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="16 16 12 12 8 16"/>
                          <line x1="12" y1="12" x2="12" y2="21"/>
                          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                        </svg>
                      </div>
                      <div className="srp-dropzone-text">
                        <span className="srp-dropzone-main">Click to browse or drag & drop</span>
                        <span className="srp-dropzone-hint">PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Images, ZIP</span>
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png" />
              </div>
            )}

            <div className="srp-section">
              <div className="srp-label">Resource Name *</div>
              <input className="srp-input" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Chapter 3 Notes" />
            </div>

            <div className="srp-section">
              <div className="srp-label">Category</div>
              <input className="srp-input" value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="e.g. Notes, Assessment, Reference" />
            </div>

            <div className="srp-section">
              <div className="srp-label">Description</div>
              <textarea className="srp-textarea" value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Brief description..." rows={3} />
            </div>
          </div>

          {/* Footer */}
          <div className="srp-footer">
            <Button variant="secondary" onClick={() => setShowFormPanel(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || loading}>
              {submitting ? (isEditMode ? "Saving..." : "Uploading...") : (isEditMode ? "Save Changes" : "Upload Resource")}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Delete confirmation */}
      <SlideInMenu isShow={!!docToDelete} onClose={() => setDocToDelete(null)} width="420px">
        <div className="sc-panel">
          <div className="sc-panel-header danger">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>Delete Resource</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">{docToDelete?.name}</div>
            <div className="sc-panel-danger">This will permanently remove the file and all its data.</div>
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => setDocToDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Delete</Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SubjectResources;
