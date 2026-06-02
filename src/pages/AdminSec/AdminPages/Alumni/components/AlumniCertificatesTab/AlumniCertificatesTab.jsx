import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../../components/Button/Button";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import useAlumniCertificate from "../../../../../../api_call/useAlumniCertificate";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import "./AlumniCertificatesTab.css";

const STATUS_COLORS = {
  Verified: { color: "#166534", bg: "#dcfce7" },
  Pending:  { color: "#92400e", bg: "#fef3c7" },
  Rejected: { color: "#dc2626", bg: "#fee2e2" },
};

const FileIcon = ({ type }) => {
  if (type === "pdf") return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="#dc2626"/>
      <path d="M10 8h10l6 6v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <path d="M20 8v6h6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <text x="18" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">PDF</text>
    </svg>
  );
  if (["jpg","jpeg","png","gif","webp"].includes(type)) return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="#10b981"/>
      <rect x="8" y="8" width="20" height="20" rx="3" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <circle cx="13" cy="13" r="2" fill="rgba(255,255,255,0.8)"/>
      <path d="M8 24l6-6 4 4 3-3 7 7" stroke="rgba(255,255,255,0.8)" strokeWidth="1.4" fill="none"/>
    </svg>
  );
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="8" fill="#6b7280"/>
      <path d="M10 8h10l6 6v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
      <path d="M20 8v6h6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
    </svg>
  );
};

const AlumniCertificatesTab = ({ alumniData }) => {
  const { alumniId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { loading, getCertificates, uploadCertificate, updateStatus, deleteCertificate } = useAlumniCertificate();

  const [certificates, setCertificates] = useState([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewCert, setViewCert] = useState(null);
  const [editCert, setEditCert] = useState(null);
  const [deleteCert, setDeleteCert] = useState(null);

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.graduate?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.graduate?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.graduate?.delete;

  const [uploadForm, setUploadForm] = useState({ name: "", description: "", file: null });
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const id = alumniId || alumniData?.alumni_id;

  useEffect(() => {
    if (!id) return;
    getCertificates(id).then((res) => { if (res.success) setCertificates(res.data); });
  }, [id]);

  const refresh = () => getCertificates(id).then((res) => { if (res.success) setCertificates(res.data); });

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type !== "dragleave"); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files[0]) setUploadForm((p) => ({ ...p, file: e.dataTransfer.files[0] }));
  };
  const handleFileSelect = (e) => { if (e.target.files[0]) setUploadForm((p) => ({ ...p, file: e.target.files[0] })); };

  const handleUploadSubmit = async () => {
    if (!canCreate) { addNotification("No permission to upload certificates.", "error"); return; }
    if (!uploadForm.file) { addNotification("Please select a file", "error"); return; }
    const fd = new FormData();
    fd.append("file", uploadForm.file);
    fd.append("alumni_id", id);
    fd.append("school_id", alumniData?.school_id || "");
    fd.append("name", uploadForm.name || uploadForm.file.name);
    fd.append("description", uploadForm.description);
    fd.append("uploaded_by_id", user?.admin?.admin_id || user?.staff?.staff_id || "");
    fd.append("uploaded_by_name", user?.admin?.username || user?.staff?.full_name || "Admin");
    const res = await uploadCertificate(fd);
    if (res.success) {
      addNotification("Certificate uploaded successfully", "success");
      setIsUploadOpen(false);
      setUploadForm({ name: "", description: "", file: null });
      refresh();
    } else {
      addNotification(res.message || "Upload failed", "error");
    }
  };

  const handleStatusToggle = async (cert) => {
    if (!canEdit) { addNotification("No permission to update certificate status.", "error"); return; }
    const next = cert.status === "Verified" ? "Pending" : "Verified";
    const res = await updateStatus(cert.certificate_id, next, user?.admin?.admin_id || user?.user_id);
    if (res.success) { addNotification(`Marked as ${next}`, "success"); refresh(); }
  };

  const handleStatusChange = async (certId, status) => {
    const res = await updateStatus(certId, status, user?.admin?.admin_id || user?.user_id);
    if (res.success) { addNotification(`Status updated to ${status}`, "success"); setEditCert(null); refresh(); }
  };

  const handleDelete = (cert) => {
    if (!canDelete) { addNotification("No permission to delete certificates.", "error"); return; }
    setDeleteCert(cert); setViewCert(null);
  };

  const confirmDelete = async () => {
    const res = await deleteCertificate(deleteCert.certificate_id, user?.admin?.admin_id || user?.user_id);
    if (res.success) { addNotification("Certificate deleted", "success"); setDeleteCert(null); refresh(); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

  return (
    <InnerTabCon>
      <div className="mm-cert-wrap">

        <div className="mm-cert-header">
          <div className="mm-cert-header-left">
            <h2 className="mm-cert-title">Certificates & Documents</h2>
            <p className="mm-cert-subtitle">Manage graduation certificates, transcripts, and official documents</p>
          </div>
          <Button onClick={() => {
            if (!canCreate) { addNotification("No permission to upload certificates.", "error"); return; }
            setIsUploadOpen(true);
          }}>Upload Certificate</Button>
        </div>

        {loading && <div className="mm-cert-loading">Loading...</div>}

        {!loading && (
          certificates.length === 0 ? (
            <div className="mm-cert-empty">
              <div className="mm-cert-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>No certificates uploaded</h3>
              <p>Upload graduation certificates, transcripts, and other official documents</p>
              <Button onClick={() => {
                if (!canCreate) { addNotification("No permission to upload certificates.", "error"); return; }
                setIsUploadOpen(true);
              }}>Upload First Certificate</Button>
            </div>
          ) : (
            <div className="mm-cert-grid">
              {certificates.map((cert) => {
                const sc = STATUS_COLORS[cert.status] || STATUS_COLORS.Pending;
                return (
                  <div key={cert.certificate_id} className="mm-cert-card" onClick={() => setViewCert(cert)}>
                    <div className="mm-cert-thumb">
                      <FileIcon type={cert.type} />
                      {["jpg","jpeg","png","gif","webp"].includes(cert.type) && (
                        <img src={`${import.meta.env.VITE_API_BASE_URL}${cert.file_url}`} alt={cert.name}
                          className="mm-cert-thumb-img" onError={(e) => e.target.style.display = "none"} />
                      )}
                    </div>
                    <div className="mm-cert-info">
                      <div className="mm-cert-info-header">
                        <h4 className="mm-cert-name">{cert.name}</h4>
                        <span className="mm-cert-status-badge" style={{ background: sc.bg, color: sc.color }}>{cert.status}</span>
                      </div>
                      {cert.description && <p className="mm-cert-desc">{cert.description}</p>}
                      <div className="mm-cert-meta">
                        <span>{cert.size}</span>
                        <span>{formatDate(cert.upload_date)}</span>
                      </div>
                      <div className="mm-cert-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="mm-cert-action-btn download" title="Download"
                          onClick={() => { const a = document.createElement("a"); a.href = `${import.meta.env.VITE_API_BASE_URL}${cert.file_url}`; a.download = cert.name; a.click(); }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        <button className={`mm-cert-action-btn verify ${cert.status === "Verified" ? "verified" : ""}`}
                          title={cert.status === "Verified" ? "Mark as Pending" : "Mark as Verified"}
                          onClick={() => handleStatusToggle(cert)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="mm-cert-action-btn edit" title="Edit"
                          onClick={() => {
                            if (!canEdit) { addNotification("No permission to edit certificates.", "error"); return; }
                            setEditCert(cert);
                          }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button className="mm-cert-action-btn delete" title="Delete" onClick={() => handleDelete(cert)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Upload Panel */}
      <SlideInMenu isShow={isUploadOpen} onClose={() => { setIsUploadOpen(false); setUploadForm({ name: "", description: "", file: null }); }} width="480px">
        <div className="mm-upload-panel">
          <div className="mm-upload-panel-header">
            <span className="mm-upload-panel-deco" aria-hidden="true" />
            <div className="mm-upload-panel-header-content">
              <div className="mm-upload-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="mm-upload-panel-header-text">
                <h2>Upload Certificate</h2>
                <p>PDF or image files up to 10MB</p>
              </div>
            </div>
          </div>
          <div className="mm-upload-panel-body">
            <div className={`mm-drop-zone ${dragActive ? "active" : ""} ${uploadForm.file ? "has-file" : ""}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileSelect} style={{ display: "none" }} />
              {uploadForm.file ? (
                <>
                  <div className="mm-drop-zone-icon">📎</div>
                  <p className="mm-drop-zone-filename">{uploadForm.file.name}</p>
                  <p className="mm-drop-zone-size">{(uploadForm.file.size / (1024 * 1024)).toFixed(1)} MB</p>
                </>
              ) : (
                <>
                  <div className="mm-drop-zone-icon">📁</div>
                  <p className="mm-drop-zone-text">Drag & drop or click to browse</p>
                  <p className="mm-drop-zone-hint">PDF, JPG, PNG, GIF, WebP (max 10MB)</p>
                </>
              )}
            </div>
            <div className="mm-upload-field">
              <label className="mm-upload-label">Certificate Name</label>
              <input className="mm-upload-input" value={uploadForm.name}
                onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Graduation Certificate 2026" />
            </div>
            <div className="mm-upload-field">
              <label className="mm-upload-label">Description</label>
              <textarea className="mm-upload-textarea" value={uploadForm.description}
                onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description..." />
            </div>
          </div>
          <div className="mm-upload-panel-footer">
            <Button variant="secondary" onClick={() => { setIsUploadOpen(false); setUploadForm({ name: "", description: "", file: null }); }}>Cancel</Button>
            <Button onClick={handleUploadSubmit} disabled={loading || !uploadForm.file}>
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* View Panel */}
      <SlideInMenu isShow={!!viewCert} onClose={() => setViewCert(null)} width="480px">
        {viewCert && (() => {
          const sc = STATUS_COLORS[viewCert.status] || STATUS_COLORS.Pending;
          return (
            <div className="mm-view-panel">
              <div className="mm-view-panel-header">
                <span className="mm-view-panel-deco" aria-hidden="true" />
                <div className="mm-view-panel-header-content">
                  <div className="mm-view-panel-header-icon"><FileIcon type={viewCert.type} /></div>
                  <div className="mm-view-panel-header-text">
                    <h2>{viewCert.name}</h2>
                    <span className="mm-view-status-badge" style={{ background: sc.bg, color: sc.color }}>{viewCert.status}</span>
                  </div>
                </div>
              </div>
              <div className="mm-view-panel-body">
                <div className="mm-view-preview">
                  {["jpg","jpeg","png","gif","webp"].includes(viewCert.type) ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL}${viewCert.file_url}`} alt={viewCert.name} className="mm-view-preview-img" />
                  ) : (
                    <div className="mm-view-preview-placeholder">
                      <FileIcon type={viewCert.type} />
                      <p>{viewCert.name}</p>
                    </div>
                  )}
                </div>
                <div className="mm-view-meta-grid">
                  {[
                    { label: "Type",        value: viewCert.type?.toUpperCase() },
                    { label: "Size",        value: viewCert.size },
                    { label: "Upload Date", value: formatDate(viewCert.upload_date) },
                    { label: "Uploaded By", value: viewCert.uploaded_by_name || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="mm-view-meta-card">
                      <span className="mm-view-meta-label">{label}</span>
                      <span className="mm-view-meta-value">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                {viewCert.description && (
                  <div className="mm-view-desc-card">
                    <span className="mm-view-meta-label">Description</span>
                    <p className="mm-view-desc-text">{viewCert.description}</p>
                  </div>
                )}
              </div>
              <div className="mm-view-panel-footer">
                <Button variant="secondary" onClick={() => { const a = document.createElement("a"); a.href = `${import.meta.env.VITE_API_BASE_URL}${viewCert.file_url}`; a.download = viewCert.name; a.click(); }}>Download</Button>
                <Button variant="secondary" onClick={() => { setViewCert(null); if (!canEdit) { addNotification("No permission to edit certificates.", "error"); return; } setEditCert(viewCert); }}>Edit</Button>
                <Button onClick={() => handleDelete(viewCert)}>Delete</Button>
              </div>
            </div>
          );
        })()}
      </SlideInMenu>

      {/* Edit Panel */}
      <SlideInMenu isShow={!!editCert} onClose={() => setEditCert(null)} width="480px">
        {editCert && (
          <div className="mm-edit-panel">
            <div className="mm-edit-panel-header">
              <span className="mm-edit-panel-deco" aria-hidden="true" />
              <div className="mm-edit-panel-header-content">
                <div className="mm-edit-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="mm-edit-panel-header-text">
                  <h2>Edit Certificate</h2>
                  <p>{editCert.name}</p>
                </div>
              </div>
            </div>
            <div className="mm-edit-panel-body">
              <span className="mm-edit-label">Status</span>
              <div className="mm-edit-status-row">
                {["Verified", "Pending", "Rejected"].map((s) => {
                  const sc = STATUS_COLORS[s];
                  const active = editCert.status === s;
                  return (
                    <button key={s}
                      className={`mm-edit-status-btn ${active ? "active" : ""}`}
                      style={active ? { borderColor: sc.color, background: sc.bg, color: sc.color } : {}}
                      onClick={() => setEditCert((p) => ({ ...p, status: s }))}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mm-edit-panel-footer">
              <Button variant="secondary" onClick={() => setEditCert(null)}>Cancel</Button>
              <Button onClick={() => handleStatusChange(editCert.certificate_id, editCert.status)} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* Delete Confirm */}
      <DeleteConfirmPanel
        isOpen={!!deleteCert}
        onClose={() => setDeleteCert(null)}
        onConfirm={confirmDelete}
        loading={loading}
        title="Delete Certificate"
        description="You are about to permanently delete this certificate. The file will be removed from the server and cannot be recovered."
        itemName={deleteCert?.name}
      />
    </InnerTabCon>
  );
};

export default AlumniCertificatesTab;
