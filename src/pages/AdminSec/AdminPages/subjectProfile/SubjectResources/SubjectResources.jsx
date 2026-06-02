import "./SubjectResources.css";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import ResourceCard from "../../../../../components/ResourceCard/ResourceCard";
import DeleteConfirmPanel from "../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import FormInput from "../../../../../components/FormInput";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useSubjectResource from "../../../../../api_call/useSubjectResource";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";
import downloadFile from "../../../../../utils/downloadFile";
const FILE_TYPES = ["all", "pdf", "docx", "xlsx", "pptx", "zip"];
const DEFAULT_FORM = { name: "", category: "General", description: "" };

const SubjectResources = ({ subjectData }) => {
  const { subjectId, schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    loading,
    getBySubject,
    createResource,
    updateResource,
    incrementDownload,
    deleteResource,
  } = useSubjectResource();

  const subjectName = subjectData?.subject?.subject_name || "Subject";
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.subject?.create;
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.subject?.delete;

  const [resources, setResources] = useState([]);
  const [docToDelete, setDocToDelete] = useState(null);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedFile, setSelectedFile] = useState(null);
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");
  const fileInputRef = useRef(null);

  const load = async () => {
    if (!subjectId) return;
    const res = await getBySubject(subjectId);
    if (res.success) setResources(res.data);
  };

  useEffect(() => {
    load();
  }, [subjectId]);

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources((prev) =>
        prev.map((r) =>
          r.resource_id === doc.resource_id
            ? { ...r, download_count: (r.download_count || 0) + 1 }
            : r
        )
      );
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const openEdit = (doc) => {
    if (!canEdit) {
      addNotification("No permission to edit resources.", "error");
      return;
    }
    setIsEditMode(true);
    setSelectedDoc(doc);
    setForm({
      name: doc.name || "",
      category: doc.category || "General",
      description: doc.description || "",
    });
    setSelectedFile(null);
    setShowFormPanel(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!form.name) setForm((f) => ({ ...f, name: file.name.split(".")[0] }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return addNotification("Resource name is required", "error");
    if (!isEditMode && !selectedFile) return addNotification("Please select a file", "error");

    if (isEditMode) {
      const res = await updateResource(selectedDoc.resource_id, {
        name: form.name,
        description: form.description,
        category: form.category,
      });
      if (res.success) {
        addNotification("Resource updated", "success");
        setResources((prev) =>
          prev.map((r) => (r.resource_id === selectedDoc.resource_id ? res.data : r))
        );
        setShowFormPanel(false);
      } else {
        addNotification(res.message || "Failed to update", "error");
      }
    } else {
      const fd = new FormData();
      fd.append("file", selectedFile);
      fd.append("subject_id", subjectId);
      fd.append("school_id", schoolId || "");
      fd.append("name", form.name);
      fd.append("description", form.description || "");
      fd.append("category", form.category);
      fd.append("uploaded_by_id", user?.admin?.admin_id || "");
      fd.append("uploaded_by_name", user?.admin?.full_name || "");
      const res = await createResource(fd);
      if (res.success) {
        addNotification("Resource uploaded", "success");
        setResources((prev) => [res.data, ...prev]);
        setShowFormPanel(false);
      } else if (res.message?.includes("Storage limit")) {
        setStorageLimitMsg(res.message);
        setStorageLimitOpen(true);
      } else {
        addNotification(res.message || "Failed to upload", "error");
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteResource(docToDelete.resource_id);
    if (res.success) {
      addNotification("Resource deleted", "success");
      setResources((prev) => prev.filter((r) => r.resource_id !== docToDelete.resource_id));
      setDocToDelete(null);
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const typeCount = (type) =>
    resources.filter(
      (d) =>
        (type === "all" || (d.file_type || "").toLowerCase() === type) &&
        (!searchQuery ||
          (d.name || "").toLowerCase().includes(searchQuery.toLowerCase()))
    ).length;

  const filtered = resources.filter((doc) => {
    const matchType =
      filterType === "all" || (doc.file_type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    return (
      matchType &&
      (!q ||
        (doc.name || "").toLowerCase().includes(q) ||
        (doc.category || "").toLowerCase().includes(q))
    );
  });

  return (
    <InnerTabCon>
      <div className="subjectResources">
        <div className="sr2-header">
          <div className="sr2-header-left">
            <h2 className="sr2-title">Resources</h2>
            <p className="sr2-subtitle">
              {resources.length} {resources.length === 1 ? "file" : "files"} for {subjectName}
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                setIsEditMode(false);
                setSelectedDoc(null);
                setForm(DEFAULT_FORM);
                setSelectedFile(null);
                setShowFormPanel(true);
              }}
            >
              Upload Resource
            </Button>
          )}
        </div>

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

        <div className="sr2-tabs">
          {FILE_TYPES.map((type) => (
            <button
              key={type}
              className={`sr2-tab ${filterType === type ? "active" : ""}`}
              onClick={() => setFilterType(type)}
            >
              {type === "all"
                ? `All (${typeCount("all")})`
                : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading resources..." />}

        {!loading &&
          (filtered.length === 0 ? (
            <div className="sr2-empty">
              <h3>No resources found</h3>
              <p>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No resources uploaded yet."}
              </p>
              {searchQuery && (
                <button className="sr2-clear-btn" onClick={() => setSearchQuery("")}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="sr2-grid">
              {filtered.map((doc) => (
                <ResourceCard
                  key={doc.resource_id}
                  doc={doc}
                  onDownload={handleDownload}
                  onEdit={openEdit}
                  onDelete={(d) => {
                    if (!canDelete) {
                      addNotification("No permission to delete.", "error");
                      return;
                    }
                    setDocToDelete(d);
                  }}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              ))}
            </div>
          ))}

        <SlideInMenu isShow={showFormPanel} onClose={() => setShowFormPanel(false)} width="520px">
          <div className="rp-container">
            <div className="rp-header">
              <span className="rp-header-deco" aria-hidden="true" />
              <div className="rp-header-content">
                <div className="rp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="17,8 12,3 7,8"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="3"
                      x2="12"
                      y2="15"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="rp-header-text">
                  <h2>{isEditMode ? "Edit Resource" : "Upload Resource"}</h2>
                  <p>
                    {isEditMode
                      ? "Update resource details"
                      : `Add a new file for ${subjectName}`}
                  </p>
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
                        <p className="rp-file-size">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rp-file-placeholder">
                      <span className="rp-file-placeholder-icon">📁</span>
                      <p>Click to browse file</p>
                      <span>PDF, DOC, XLS, PPT, ZIP, Images</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.jpg,.jpeg,.png"
                  />
                </div>
              )}
              <FormInput
                label="Resource Name *"
                type="text"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="e.g. Mathematics Curriculum Guide"
              />
              <FormInput
                label="Category"
                type="text"
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
                placeholder="e.g. Reference, Assessment..."
              />
              <FormInput
                label="Description"
                type="textarea"
                value={form.description}
                onChange={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Brief description..."
                height="80px"
              />
            </div>
            <div className="rp-footer">
              <Button variant="secondary" onClick={() => setShowFormPanel(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {isEditMode ? "Save Changes" : "Upload Resource"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

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

export default SubjectResources;
