import "./StaffResources.css";
import { useState, useEffect, useRef } from "react";
import SubscriptionLimitModal from "../../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";
import ResourceCard from "../../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import ResourceFormPanel from "./ResourceFormPanel";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStaffResource from "../../../../../../api_call/useStaffResource";
import downloadFile from "../../../../../../utils/downloadFile";

const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];

const StaffResources = ({ staffData }) => {
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, getByStaff, createResource, updateResource, incrementDownload, deleteResource } = useStaffResource();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.staff?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.staff?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.staff?.delete;

  const staff   = staffData?.staff || staffData;
  const staffId = staff?.staff_id;
  const schoolId = staff?.school_id;
  const staffName = staff?.full_name || "this staff member";

  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg]   = useState("");
  const [resources, setResources]               = useState([]);
  const [docToDelete, setDocToDelete]           = useState(null);
  const [showFormPanel, setShowFormPanel]       = useState(false);
  const [selectedDoc, setSelectedDoc]           = useState(null);
  const [isEditMode, setIsEditMode]             = useState(false);
  const [filterType, setFilterType]             = useState("all");
  const [searchQuery, setSearchQuery]           = useState("");

  const load = async () => { if (!staffId) return; const res = await getByStaff(staffId); if (res.success) setResources(res.data); };
  useEffect(() => { load(); }, [staffId]);

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources(prev => prev.map(r => r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const handleEdit = (doc) => {
    if (!canEdit) { addNotification("No permission to edit resources.", "error"); return; }
    setIsEditMode(true); setSelectedDoc(doc); setShowFormPanel(true);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteResource(docToDelete.resource_id);
    if (res.success) {
      addNotification("Resource deleted", "success");
      setResources(prev => prev.filter(r => r.resource_id !== docToDelete.resource_id));
      setDocToDelete(null);
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const handleSubmitResource = async (formData, file) => {
    if (!formData.name) return addNotification("Resource name is required", "error");
    if (!isEditMode && !file) return addNotification("Please select a file", "error");

    if (isEditMode) {
      const res = await updateResource(selectedDoc.resource_id, { name: formData.name, description: formData.description, category: formData.category });
      if (res.success) {
        addNotification("Resource updated", "success");
        setResources(prev => prev.map(r => r.resource_id === selectedDoc.resource_id ? res.data : r));
        setShowFormPanel(false); setSelectedDoc(null);
      } else addNotification(res.message || "Failed to update", "error");
    } else {
      const fd = new FormData();
      fd.append("file", file); fd.append("staff_id", staffId); fd.append("school_id", schoolId || "");
      fd.append("name", formData.name); fd.append("description", formData.description || ""); fd.append("category", formData.category);
      const res = await createResource(fd);
      if (res.success) {
        addNotification("Resource uploaded", "success");
        setResources(prev => [res.data, ...prev]); setShowFormPanel(false);
      } else if (res.message?.includes("Storage limit")) {
        setStorageLimitMsg(res.message); setStorageLimitOpen(true);
      } else addNotification(res.message || "Failed to upload", "error");
    }
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
      <div className="staffResources">
        <div className="stf-res-header">
          <div className="stf-res-header-left">
            <h2 className="stf-res-title">Resources</h2>
            <p className="stf-res-subtitle">{resources.length} {resources.length === 1 ? "file" : "files"} for {staffName}</p>
          </div>
          {canCreate && (
            <Button onClick={() => { setIsEditMode(false); setSelectedDoc(null); setShowFormPanel(true); }}>
              Upload Resource
            </Button>
          )}
        </div>

        <div className="stf-res-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input className="stf-res-search" type="text" placeholder="Search by name or category..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button className="stf-res-clear" onClick={() => setSearchQuery("")}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <div className="stf-res-tabs">
          {FILE_TYPES.map(type => (
            <button key={type} className={`stf-res-tab ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>
              {type === "all" ? `All (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading resources..." />}

        {!loading && (
          filtered.length === 0 ? (
            <div className="stf-res-empty">
              <h3>No resources found</h3>
              <p>{searchQuery ? `No results for "${searchQuery}"` : "No resources uploaded yet."}</p>
              {searchQuery && <button className="stf-res-clear-btn" onClick={() => setSearchQuery("")}>Clear search</button>}
            </div>
          ) : (
            <div className="stf-res-grid">
              {filtered.map(doc => (
                <ResourceCard
                  key={doc.resource_id}
                  doc={doc}
                  onDownload={handleDownload}
                  onEdit={handleEdit}
                  onDelete={(d) => { if (!canDelete) { addNotification("No permission to delete.", "error"); return; } setDocToDelete(d); }}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))}
            </div>
          )
        )}

        <ResourceFormPanel
          isShow={showFormPanel}
          onClose={() => { setShowFormPanel(false); setSelectedDoc(null); }}
          resourceData={selectedDoc}
          onSubmit={handleSubmitResource}
          isEditMode={isEditMode}
        />

        <DeleteConfirmPanel
          isOpen={!!docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Resource"
          description="You are about to permanently remove this file."
          itemName={docToDelete?.name}
        />

        <SubscriptionLimitModal isOpen={storageLimitOpen} onClose={() => setStorageLimitOpen(false)} message={storageLimitMsg} />
      </div>
    </InnerTabCon>
  );
};

export default StaffResources;
