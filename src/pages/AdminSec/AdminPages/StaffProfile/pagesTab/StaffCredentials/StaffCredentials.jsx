import React, { useState, useEffect } from "react";
import "./StaffCredentials.css";
import Button from "../../../../../../components/Button/Button";
import DocumentFormPanel from "./DocumentFormPanel";
import { Icons } from "../../../../../../utils/icons";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStaffCredential from "../../../../../../api_call/useStaffCredential";
import downloadFile from "../../../../../../utils/downloadFile";
import SubscriptionLimitModal from "../../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const StaffCredentials = ({ staffData }) => {
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, getByStaff, createCredential, updateCredential, deleteCredential, incrementDownload } = useStaffCredential();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.staff?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.staff?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.staff?.delete;

  const staff = staffData?.staff || staffData;
  const staffId = staff?.staff_id;
  const schoolId = staff?.school_id;

  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");

  const [credentials, setCredentials] = useState([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const load = async () => {
    if (!staffId) return;
    const res = await getByStaff(staffId);
    if (res.success) setCredentials(res.data);
  };

  useEffect(() => { load(); }, [staffId]);

  const getFileIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "pdf": return "📄";
      case "docx": case "doc": return "📝";
      case "png": case "jpg": case "jpeg": return "🖼️";
      case "xlsx": case "xls": return "📊";
      case "pptx": case "ppt": return "📋";
      default: return "📁";
    }
  };

  const getStatusColor = (s) => ({ Active: "#10b981", Expired: "#dc2626", Pending: "#f59e0b" }[s] || "#6b7280");
  const getVerifColor  = (s) => ({ Verified: "#10b981", Pending: "#f59e0b", Expired: "#dc2626", Rejected: "#dc2626" }[s] || "#6b7280");

  const isExpired      = (d) => d && new Date(d) < new Date();
  const isExpiringSoon = (d) => {
    if (!d) return false;
    const exp = new Date(d); const now = new Date();
    return exp > now && exp <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  };

  const handleDocClick = (doc) => { setSelectedDoc(doc); setShowDetailPanel(true); };

  const handleDownload = async (doc) => {
    if (!doc?.file_url) return;
    try {
      await downloadFile(doc.file_url, doc.fileName || `${doc.title}.${doc.type || "file"}`);
      await incrementDownload(doc.credential_id);
      setCredentials((prev) => prev.map((c) =>
        c.credential_id === doc.credential_id ? { ...c, downloadCount: (c.downloadCount || 0) + 1 } : c
      ));
    } catch (err) {
      addNotification(err.message || "Download failed", "error");
    }
  };

  const handleUpload = () => {
    if (!canCreate) {
      addNotification("You do not have permission to upload documents.", "error");
      return;
    }
    setIsEditMode(false); setSelectedDoc(null); setShowFormPanel(true);
  };

  const handleEdit = (doc) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit documents.", "error");
      return;
    }
    setIsEditMode(true); setSelectedDoc(doc); setShowDetailPanel(false); setShowFormPanel(true);
  };

  const handleDeleteClick = (doc) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete documents.", "error");
      return;
    }
    setDocToDelete(doc); setShowDeletePanel(true); setShowDetailPanel(false);
  };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    const res = await deleteCredential(docToDelete.credential_id);
    if (res.success) {
      addNotification("Document deleted", "success");
      setCredentials((prev) => prev.filter((c) => c.credential_id !== docToDelete.credential_id));
      setShowDeletePanel(false);
      setDocToDelete(null);
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const handleSubmit = async (formData, file) => {
    if (!formData.title || !formData.issuer) {
      return addNotification("Title and issuer are required", "error");
    }
    if (!isEditMode && !file) {
      return addNotification("Please select a file", "error");
    }

    if (isEditMode) {
      const res = await updateCredential(selectedDoc.credential_id, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        issuer: formData.issuer,
        documentNumber: formData.documentNumber,
        expiryDate: formData.expiryDate || null,
        isRequired: formData.isRequired,
        verificationStatus: formData.verificationStatus,
      });
      if (res.success) {
        addNotification("Document updated", "success");
        setCredentials((prev) => prev.map((c) => c.credential_id === selectedDoc.credential_id ? res.data : c));
        setShowFormPanel(false);
        setSelectedDoc(null);
      } else {
        addNotification(res.message || "Failed to update", "error");
      }
    } else {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("staff_id", staffId);
      fd.append("school_id", schoolId || "");
      fd.append("title", formData.title);
      fd.append("description", formData.description || "");
      fd.append("category", formData.category);
      fd.append("issuer", formData.issuer);
      fd.append("documentNumber", formData.documentNumber || "");
      fd.append("expiryDate", formData.expiryDate || "");
      fd.append("isRequired", formData.isRequired);
      fd.append("verificationStatus", formData.verificationStatus);

      const res = await createCredential(fd);
      if (res.success) {
        addNotification("Document uploaded", "success");
        setCredentials((prev) => [res.data, ...prev]);
        setShowFormPanel(false);
      } else {
        if (res.message && res.message.includes("Storage limit")) {
          setStorageLimitMsg(res.message);
          setStorageLimitOpen(true);
        } else {
          addNotification(res.message || "Failed to upload", "error");
        }
      }
    }
  };

  const fileTypes = ["all", "pdf", "docx", "png", "jpg"];

  const filtered = credentials.filter((doc) => {
    const matchType = filterType === "all" || (doc.type || "").toLowerCase() === filterType;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      (doc.title || "").toLowerCase().includes(q) ||
      (doc.fileName || "").toLowerCase().includes(q) ||
      (doc.category || "").toLowerCase().includes(q) ||
      (doc.issuer || "").toLowerCase().includes(q) ||
      (doc.documentNumber || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const typeCount = (type) => credentials.filter((d) =>
    (type === "all" || (d.type || "").toLowerCase() === type) &&
    (!searchQuery || (d.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (d.issuer || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ).length;

  return (
    <InnerTabCon>
      <div className="staffCredentials">
        <div className="scHeader">
          <div className="scHeaderLeft">
            <h2 className="scTitle">Credentials & Documents</h2>
            <p className="scSubtitle">Licenses, certificates, and required documentation</p>
          </div>
          <div className="scHeaderRight">
            <Button onClick={handleUpload}>Upload Document</Button>
          </div>
        </div>

        <div className="scSearchContainer">
          <div className="scSearchInputWrapper">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name, category, issuer, or document number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="scSearchInput"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="scClearSearch">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="scFilterTabs">
          {fileTypes.map((type) => (
            <button key={type} className={`scFilterTab ${filterType === type ? "active" : ""}`} onClick={() => setFilterType(type)}>
              {type === "all" ? `All Files (${typeCount("all")})` : `${type.toUpperCase()} (${typeCount(type)})`}
            </button>
          ))}
        </div>

        {loading && <LoadingData message="Loading credentials..." />}

        {!loading && (
          <div className="scDocumentsList">
            {filtered.map((doc) => (
              <div
                key={doc.credential_id}
                className={`scDocumentCard ${isExpired(doc.expiryDate) ? "expired" : ""} ${isExpiringSoon(doc.expiryDate) ? "expiring" : ""}`}
                onClick={() => handleDocClick(doc)}
              >
                <div className="scDocumentHeader">
                  <div className="scFileInfo">
                    <span className="scFileIcon">{getFileIcon(doc.type)}</span>
                    <div className="scFileDetails">
                      <div className="scFileTitleRow">
                        <div className="scFileCategory">
                          <Icons.Report size={16} color="#6b7280" />
                          <span>{doc.category}</span>
                        </div>
                        <div className="scFileBadges">
                          <div className="scTypeBadge">{(doc.type || "").toUpperCase()}</div>
                          <div className="scSizeBadge">{doc.size}</div>
                          {doc.isRequired && <div className="scRequiredBadge">Required</div>}
                        </div>
                      </div>
                      <h3 className="scDocumentTitle">{doc.title}</h3>
                      <p className="scFileName">{doc.fileName}</p>
                    </div>
                  </div>
                </div>
                <div className="scDocumentBody">
                  <div className="scDocumentDetails">
                    <div className="scDetailItem">
                      <span className="scDetailLabel">Status:</span>
                      <span className="scDetailValue" style={{ color: getStatusColor(doc.status) }}>{doc.status}</span>
                    </div>
                    <div className="scDetailItem">
                      <span className="scDetailLabel">Verification:</span>
                      <span className="scDetailValue" style={{ color: getVerifColor(doc.verificationStatus) }}>{doc.verificationStatus}</span>
                    </div>
                    <div className="scDetailItem">
                      <span className="scDetailLabel">Uploaded:</span>
                      <span className="scDetailValue">{doc.uploadDate}</span>
                    </div>
                    {doc.expiryDate && (
                      <div className="scDetailItem">
                        <span className="scDetailLabel">Expires:</span>
                        <span className={`scDetailValue ${isExpired(doc.expiryDate) ? "expired" : isExpiringSoon(doc.expiryDate) ? "expiring" : ""}`}>
                          {new Date(doc.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="scDocumentFooter">
                  <div className="scDocumentActions">
                    <button className="scDownloadIconButton" title="Download" onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                    <button className="scDeleteIconButton" title="Delete" onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc); }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="scViewDetails">
                    <span>View Details</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="scEmptyState">
                <Icons.AdmissionHistory size={48} color="#9ca3af" />
                <h3>No credentials found</h3>
                <p>{searchQuery ? `No results for "${searchQuery}"` : "No documents uploaded yet."}</p>
                {searchQuery && <button onClick={() => setSearchQuery("")} className="scClearSearchButton">Clear search</button>}
              </div>
            )}
          </div>
        )}

        {/* Detail Panel */}
        <SlideInMenu isShow={showDetailPanel} onClose={() => setShowDetailPanel(false)} width="700px">
          <div className="scSlideMenuContent">
            <div className="scSlideMenuHeader">
              <h2>{selectedDoc?.title}</h2>
              <p>{selectedDoc?.category} · {selectedDoc?.uploadDate}</p>
            </div>
            <div className="scSlideMenuBody">
              {selectedDoc && (
                <div className="scDocumentDetailContent">
                  <div className="scDetailSection">
                    <h3>Document Information</h3>
                    <div className="scDetailGrid">                      <InfoField label="Document Title" value={selectedDoc.title} />
                      <InfoField label="File Name" value={selectedDoc.fileName} />
                      <InfoField label="File Type" value={(selectedDoc.type || "").toUpperCase()} />
                      <InfoField label="File Size" value={selectedDoc.size} />
                      <InfoField label="Category" value={selectedDoc.category} />
                      <InfoField label="Document Number" value={selectedDoc.documentNumber} />
                    </div>
                  </div>
                  <div className="scDetailSection">
                    <h3>Status & Verification</h3>
                    <div className="scDetailGrid">
                      <InfoField label="Status" value={selectedDoc.status} />
                      <InfoField label="Verification Status" value={selectedDoc.verificationStatus} />
                      <InfoField label="Issuer" value={selectedDoc.issuer} />
                      <InfoField label="Upload Date" value={selectedDoc.uploadDate} />
                      {selectedDoc.expiryDate && <InfoField label="Expiry Date" value={selectedDoc.expiryDate} />}
                      <InfoField label="Required Document" value={selectedDoc.isRequired ? "Yes" : "No"} />
                      <InfoField label="Downloads" value={String(selectedDoc.downloadCount || 0)} />
                    </div>
                  </div>
                  {selectedDoc.description && (
                    <div className="scDetailSection">
                      <h3>Description</h3>
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{selectedDoc.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="scSlideMenuFooter">
              <Button variant="secondary" onClick={() => setShowDetailPanel(false)}>Close</Button>
              <Button variant="secondary" onClick={() => handleDownload(selectedDoc)}>Download</Button>
              <Button onClick={() => handleEdit(selectedDoc)}>Edit Document</Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Form Panel */}
        <DocumentFormPanel
          isShow={showFormPanel}
          onClose={() => { setShowFormPanel(false); setSelectedDoc(null); }}
          documentData={selectedDoc}
          onSubmit={handleSubmit}
          isEditMode={isEditMode}
        />

        <SlideInMenu isShow={showDeletePanel} onClose={() => { setShowDeletePanel(false); setDocToDelete(null); }} width="420px">
          <div className="scSlideMenuContent">
            <div className="scSlideMenuHeader">
              <h2>Delete Document</h2>
              <p>This action cannot be undone</p>
            </div>
            <div className="scSlideMenuBody">
              {docToDelete && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="scDetailSection">
                    <h3>Document</h3>
                    <div className="scDetailGrid">
                      <InfoField label="Title"    value={docToDelete.title} />
                      <InfoField label="Category" value={docToDelete.category} />
                      <InfoField label="Issuer"   value={docToDelete.issuer} />
                      <InfoField label="File"     value={docToDelete.fileName} />
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: "#fff0f0", border: "1px solid #fca5a5", borderLeft: "3px solid #cc3333", borderRadius: "8px", fontSize: "12px", fontWeight: 600, color: "#cc3333", lineHeight: 1.5 }}>
                    ⚠️ The file and all associated data will be permanently removed.
                  </div>
                </div>
              )}
            </div>
            <div className="scSlideMenuFooter">
              <Button variant="secondary" onClick={() => { setShowDeletePanel(false); setDocToDelete(null); }}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete}>Delete Document</Button>
            </div>
          </div>
        </SlideInMenu>

        <SubscriptionLimitModal
          isOpen={storageLimitOpen}
          onClose={() => setStorageLimitOpen(false)}
          message={storageLimitMsg}
        />
      </div>
    </InnerTabCon>
  );
};

export default StaffCredentials;
