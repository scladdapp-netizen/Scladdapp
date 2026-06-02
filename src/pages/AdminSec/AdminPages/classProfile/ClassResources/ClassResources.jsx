import "./ClassResources.css";
import { useState, useEffect, useRef } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import FormInput from "../../../../../components/FormInput";
import { useClassResource } from "../../../../../api_call/useClassResource";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import downloadFile from "../../../../../utils/downloadFile";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

const CATEGORIES = ["Academic", "Administrative", "Assignment", "Safety", "Photos", "Meeting", "Reports", "Forms", "General"];
const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];
const DEFAULT_FORM = { name: "", category: "Academic", description: "" };

const ClassResources = ({ classData }) => {
  const classInfo = classData?.class || classData;
  const classId   = classInfo?.class_id;
  const schoolId  = classInfo?.school_id;
  const className = classInfo?.class_name || "this class";

  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getByClass, createResource, incrementDownload, deleteResource, loading } = useClassResource();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.classes?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.classes?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.classes?.delete;

  const [resources, setResources]       = useState([]);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [docToDelete, setDocToDelete]   = useState(null);
  const [filterType, setFilterType]     = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [form, setForm]                 = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg]   = useState("");
  const fileInputRef = useRef(null);

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }));

  useEffect(() => { if (classId) fetchResources(); }, [classId]);

  const fetchResources = async () => {
    const result = await getByClass(classId);
    setResources(result.success ? result.data : []);
    if (!result.success) addNotification(result.message || "Failed to load resources", "error");
  };

  const openUpload = () => {
    if (!canCreate) { addNotification("No permission to upload resources.", "error"); return; }
    setForm(DEFAULT_FORM); setSelectedFile(null); setShowFormPanel(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) setForm(f => ({ ...f, name: file.name.split(".")[0] }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { addNotification("Resource name is required.", "error"); return; }
    if (!selectedFile)     { addNotification("Please select a file.", "error"); return; }

    const fd = new FormData();
    fd.append("file",        selectedFile);
    fd.append("class_id",    classId  || "");
    fd.append("school_id",   schoolId || "");
    fd.append("name",        form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("category",    form.category);

    const res = await createResource(fd);
    if (res.success) {
      addNotification("Resource uploaded.", "success");
      setShowFormPanel(false);
      fetchResources();
    } else if (res.message?.includes("Storage limit")) {
      setStorageLimitMsg(res.message);
      setStorageLimitOpen(true);
    } else {
      addNotification(res.message || "Failed to upload.", "error");
    }
  };

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources(prev => prev.map(r =>
        r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
      ));
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
    } else {
      addNotification(res.message || "Failed to delete.", "error");
    }
  };

  const typeCount = (type) => resources.filter(d =>
    (type === "all" || (d.file_type || "").toLowerCase() === type) &&
    (!searchQuery || (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;

  const filtered = resources.filter(doc => {
    const matchType = filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return matchType && (!q ||
      (doc.name || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q) ||
      (doc.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <InnerTabCon>
      <div className="classResources">

        {/* Header */}
        <div className="cr-header">
          <div className="cr-header-left">
            <h2 className="cr-title">Resources</h2>
            <p className="cr-subtitle">{resources.length} {resources.length === 1 ? "file" : "files"} for {className}</p>
          </div>
          {canCreate && <Button onClick={openUpload}>Upload Resource</Button>}
        </div>

        {/* Search */}
        <div className="cr-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="cr-search"
            type="text"
            placeholder="Search by name or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="cr-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="cr-tabs">
          {FILE_TYPES.map(type => (
            <button key={type} className={`cr-tab ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (
          <>
            {filtered.length === 0 ? (
              <div className="cr-empty">
                <h3>No resources found</h3>
                <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
                {searchQuery && <button className="cr-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>}
              </div>
            ) : (
              <div className="cr-grid">
                {filtered.map(doc => (
                  <ResourceCard
                    key={doc.resource_id}
                    doc={doc}
                    onDownload={handleDownload}
                    onEdit={() => addNotification("Edit not available for class resources.", "info")}
                    onDelete={(d) => { if (!canDelete) { addNotification("No permission to delete.", "error"); return; } setDocToDelete(d); }}
                    canEdit={false}
                    canDelete={canDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Upload Panel */}
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
                  <h2>Upload Resource</h2>
                  <p>Add a new file for {className}</p>
                </div>
              </div>
            </div>
            <div className="rp-body">
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
              <FormInput label="Resource Name *" type="text" value={form.name} onChange={set("name")} placeholder="e.g. Class Notes Week 3" />
              <div className="rp-field">
                <label className="rp-field-label">Category</label>
                <select className="rp-select" value={form.category} onChange={e => set("category")(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <FormInput label="Description" type="textarea" value={form.description} onChange={set("description")} placeholder="Brief description..." height="80px" />
            </div>
            <div className="rp-footer">
              <Button variant="secondary" onClick={() => setShowFormPanel(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Uploading..." : "Upload Resource"}
              </Button>
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

        <SubscriptionLimitModal
          isOpen={storageLimitOpen}
          onClose={() => setStorageLimitOpen(false)}
          message={storageLimitMsg}
        />
      </div>
    </InnerTabCon>
  );
};

export default ClassResources;
