import "./StudentResources.css";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../../components/FormInput";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStudentResource from "../../../../../../api_call/useStudentResource";

import downloadFile from "../../../../../../utils/downloadFile";

const DEFAULT_FORM = { name: "", category: "General", description: "" };
const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];

const StudentResources = ({ studentData }) => {
  const { studentId, schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, getByStudent, createResource, updateResource, incrementDownload, deleteResource } = useStudentResource();

  const studentName = studentData?.student?.full_name || "Student";
  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.students?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.students?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.students?.delete;

  const [resources, setResources] = useState([]);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }));

  useEffect(() => { if (studentId) getByStudent(studentId).then(r => r.success && setResources(r.data)); }, [studentId]);

  const openUpload = () => {
    if (!canCreate) { addNotification("No permission to upload resources.", "error"); return; }
    setIsEditMode(false); setSelectedDoc(null); setForm(DEFAULT_FORM); setSelectedFile(null); setShowFormPanel(true);
  };

  const openEdit = (doc) => {
    if (!canEdit) { addNotification("No permission to edit resources.", "error"); return; }
    setIsEditMode(true); setSelectedDoc(doc);
    setForm({ name: doc.name || "", category: doc.category || "General", description: doc.description || "" });
    setSelectedFile(null); setShowFormPanel(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) setForm(f => ({ ...f, name: file.name.split(".")[0] }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { addNotification("Resource name is required.", "error"); return; }
    if (!isEditMode && !selectedFile) { addNotification("Please select a file.", "error"); return; }

    if (isEditMode) {
      const res = await updateResource(selectedDoc.resource_id, { name: form.name, description: form.description, category: form.category });
      if (res.success) {
        addNotification("Resource updated.", "success");
        setResources(prev => prev.map(r => r.resource_id === selectedDoc.resource_id ? res.data : r));
        setShowFormPanel(false);
      } else addNotification(res.message || "Failed to update.", "error");
    } else {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("student_id", studentId);
      fd.append("school_id", schoolId || "");
      fd.append("name", form.name);
      fd.append("description", form.description || "");
      fd.append("category", form.category);
      fd.append("uploaded_by_id", admin?.admin_id || "");
      fd.append("uploaded_by_name", admin?.full_name || "");
      const res = await createResource(fd);
      if (res.success) {
        addNotification("Resource uploaded.", "success");
        setResources(prev => [res.data, ...prev]);
        setShowFormPanel(false);
      } else addNotification(res.message || "Failed to upload.", "error");
    }
  };

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources(prev => prev.map(r => r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteResource(docToDelete.resource_id);
    if (res.success) {
      addNotification("Resource deleted.", "success");
      setResources(prev => prev.filter(r => r.resource_id !== docToDelete.resource_id));
      setDocToDelete(null);
    } else addNotification(res.message || "Failed to delete.", "error");
  };

  const typeCount = (type) => resources.filter(d =>
    (type === "all" || (d.file_type || "").toLowerCase() === type) &&
    (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;

  const filtered = resources.filter(doc => {
    const matchType = filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return matchType && (!q || (doc.name || "").toLowerCase().includes(q) || (doc.category || "").toLowerCase().includes(q));
  });

  return (
    <InnerTabCon>
      <div className="studentResources">
        {/* Header */}
        <div className="sr-header">
          <div className="sr-header-left">
            <h2 className="sr-title">Resources</h2>
            <p className="sr-subtitle">{resources.length} {resources.length === 1 ? "file" : "files"} for {studentName}</p>
          </div>
          {canCreate && <Button onClick={openUpload}>Upload Resource</Button>}
        </div>

        {/* Search */}
        <div className="sr-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="sr-search"
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="sr-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="sr-tabs">
          {FILE_TYPES.map(type => (
            <button key={type} className={`sr-tab ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div className="sr-empty">
                <h3>No resources found</h3>
                <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
                {searchQuery && <button className="sr-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>}
              </div>
            ) : (
              <div className="sr-grid">
                {filtered.map(doc => (
                  <ResourceCard
                    key={doc.resource_id}
                    doc={doc}
                    onDownload={handleDownload}
                    onEdit={openEdit}
                    onDelete={(d) => { if (!canDelete) { addNotification("No permission to delete.", "error"); return; } setDocToDelete(d); }}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Upload / Edit Panel */}
        <SlideInMenu isShow={showFormPanel} onClose={() => setShowFormPanel(false)} width="520px">
          <div className="rp-container">
            <div className="rp-header">
              <span className="rp-header-deco" aria-hidden="true" />
              <div className="rp-header-content">
                <div className="rp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="rp-header-text">
                  <h2>{isEditMode ? "Edit Resource" : "Upload Resource"}</h2>
                  <p>{isEditMode ? "Update resource details" : `Add a new file for ${studentName}`}</p>
                </div>
              </div>
            </div>
            <div className="rp-body">
              {!isEditMode && (
                <div className="rp-file-drop" onClick={() => fileInputRef.current?.click()}>
                  {selectedFile ? (
                    <div className="rp-file-selected">
                      <span>📄</span>
                      <div>
                        <p className="rp-file-name">{selectedFile.name}</p>
                        <p className="rp-file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rp-file-placeholder">
                      <span className="rp-file-placeholder-icon">📁</span>
                      <p>Click to browse file</p>
                      <span>PDF, DOC, XLS, PPT, ZIP, Images</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" onChange={handleFileChange} style={{ display: "none" }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png" />
                </div>
              )}
              <FormInput label="Resource Name *" type="text" value={form.name} onChange={set("name")} placeholder="e.g. Assignment Sheet" />
              <FormInput label="Category" type="text" value={form.category} onChange={set("category")} placeholder="e.g. Assignment, Report, Certificate" />
              <FormInput label="Description" type="textarea" value={form.description} onChange={set("description")} placeholder="Brief description..." height="80px" />
            </div>
            <div className="rp-footer">
              <Button variant="secondary" onClick={() => setShowFormPanel(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{isEditMode ? "Save Changes" : "Upload Resource"}</Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Delete Confirm */}
        <DeleteConfirmPanel
          isOpen={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Resource"
          description="You are about to permanently remove this file."
          itemName={docToDelete?.name}
        />
      </div>
    </InnerTabCon>
  );
};

export default StudentResources;
