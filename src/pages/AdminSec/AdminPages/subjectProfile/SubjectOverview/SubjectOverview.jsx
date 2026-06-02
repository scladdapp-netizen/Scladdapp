import { useState, useEffect } from "react";
import "./SubjectOverview.css";
import InfoField from "../../../../../components/infoField/InfoField";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import AddSubjectPanel from "../../SchoolDirectory/Subjects/AddSubjectPanel";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import { FaEllipsisV, FaEdit, FaPrint, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";

const STREAM_LABELS = {
  science:    "Science Stream",
  arts:       "Arts Stream",
  commercial: "Commercial Stream",
  general:    "General (All Streams)",
};

const SubjectOverview = ({ subjectData, onSubjectUpdate, refreshSubjectData }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;

  const [showEditMenu, setShowEditMenu]           = useState(false);
  const [editFormData, setEditFormData]           = useState({});
  const [isUpdating, setIsUpdating]               = useState(false);
  const [showDropdown, setShowDropdown]           = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  const subjectInfo = subjectData?.subject || subjectData || {};
  const isActive = subjectInfo.is_active;

  const fmt = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".so-actions-wrap")) setShowDropdown(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape" && showDropdown) setShowDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDropdown]);

  const handleEditSubject = () => {
    if (!canEdit) { addNotification("No permission to edit this subject.", "error"); setShowDropdown(false); return; }
    setEditFormData({
      subjectName: subjectInfo.subject_name || "",
      subjectCode: subjectInfo.subject_code || "",
      classId: subjectInfo.class_id || "",
      subjectDescription: subjectInfo.subject_description || "",
      stream: subjectInfo.stream || "",
    });
    setShowEditMenu(true); setShowDropdown(false);
  };

  const handleFormChange = (field) => (value) => setEditFormData((p) => ({ ...p, [field]: value }));

  const handlePrintSubject = () => {
    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(`<html><head><title>Subject - ${subjectInfo.subject_name}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;font-weight:800;margin:0 0 4px}.sub{font-size:12px;color:#888;margin:0 0 20px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin:18px 0 10px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.field label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}.field span{font-size:12px;color:#111;font-weight:600}@media print{body{margin:12px}}</style>
    </head><body>
    <h1>${subjectInfo.subject_name || "N/A"}</h1>
    <p class="sub">${subjectInfo.subject_code || ""} - ${isActive ? "Active" : "Inactive"} - Generated ${new Date().toLocaleDateString()}</p>
    <div class="section-title">Basic Information</div>
    <div class="grid">
      <div class="field"><label>Subject Name</label><span>${subjectInfo.subject_name || "N/A"}</span></div>
      <div class="field"><label>Subject Code</label><span>${subjectInfo.subject_code || "N/A"}</span></div>
      <div class="field"><label>Status</label><span>${isActive ? "Active" : "Inactive"}</span></div>
      <div class="field"><label>Stream</label><span>${STREAM_LABELS[subjectInfo.stream] || subjectInfo.stream || "N/A"}</span></div>
      <div class="field"><label>Created</label><span>${fmt(subjectInfo.created_at)}</span></div>
    </div>
    ${subjectInfo.subject_description ? `<div class="section-title">Description</div><p style="font-size:13px;color:#555;line-height:1.6">${subjectInfo.subject_description}</p>` : ""}
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 400);
    setShowDropdown(false);
  };

  const handleConfirmToggleStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const result = await onSubjectUpdate({
        subjectName: subjectInfo.subject_name,
        subjectCode: subjectInfo.subject_code,
        classId: subjectInfo.class_id,
        subjectDescription: subjectInfo.subject_description,
        is_active: newStatus,
      });
      if (result.success && refreshSubjectData) {
        await refreshSubjectData();
        setShowDeactivateModal(false);
        setShowActivateModal(false);
      } else {
        addNotification(result.error || `Failed to ${newStatus ? "activate" : "deactivate"} subject`, "error");
      }
    } catch {
      addNotification(`Failed to ${newStatus ? "activate" : "deactivate"} subject`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      const result = await onSubjectUpdate?.({
        subjectName: editFormData.subjectName,
        subjectCode: editFormData.subjectCode,
        classId: editFormData.classId,
        subjectDescription: editFormData.subjectDescription || null,
        stream: editFormData.stream || null,
      });
      if (result?.success) {
        setShowEditMenu(false);
        if (refreshSubjectData) await refreshSubjectData();
      } else {
        addNotification(result?.error || "Failed to update subject information", "error");
      }
    } catch {
      addNotification("Failed to update subject information", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <InnerTabCon>
      <div className="subject-overview">
        <div className="so-card">

          {/* Banner */}
          <div className="so-banner">
            <span className="so-banner-deco" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="so-header">
            <div className="so-header-left">
              <div className="so-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="so-header-text">
                <h3>{subjectInfo.subject_name || "N/A"}</h3>
                <p className="so-subtitle">
                  {subjectInfo.subject_code} · {subjectInfo.subject_id}
                </p>
                <div className="so-badges">
                  <span className={`so-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "✓ Active" : "✗ Inactive"}
                  </span>
                  {subjectInfo.stream && (
                    <span className="so-badge">{STREAM_LABELS[subjectInfo.stream] || subjectInfo.stream}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="so-header-actions">
              <div className="so-actions-wrap">
                <button className="so-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  <FaEllipsisV size={11} /> Actions
                </button>
                {showDropdown && (
                  <div className="so-dropdown">
                    <button className="so-dropdown-item" onClick={handleEditSubject}>
                      <FaEdit size={13} /> Edit Subject
                    </button>
                    <button className="so-dropdown-item" onClick={handlePrintSubject}>
                      <FaPrint size={13} /> Print
                    </button>
                    <div className="so-dropdown-divider" />
                    {isActive ? (
                      <button className="so-dropdown-item danger" onClick={() => { setShowDropdown(false); if (!canEdit) { addNotification("No permission.", "error"); return; } setShowDeactivateModal(true); }}>
                        <FaTimesCircle size={13} /> Deactivate Subject
                      </button>
                    ) : (
                      <button className="so-dropdown-item success" onClick={() => { setShowDropdown(false); if (!canEdit) { addNotification("No permission.", "error"); return; } setShowActivateModal(true); }}>
                        <FaCheckCircle size={13} /> Activate Subject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="so-body">
            <div>
              <span className="so-section-title">Basic Information</span>
              <div className="so-grid">
                <InfoField label="Subject Name" value={subjectInfo.subject_name || "N/A"} />
                <InfoField label="Subject Code" value={subjectInfo.subject_code || "N/A"} />
                <InfoField label="Subject ID"   value={subjectInfo.subject_id || "N/A"} />
                <InfoField label="Stream"       value={STREAM_LABELS[subjectInfo.stream] || subjectInfo.stream || "No stream"} />
                <InfoField label="Status"       value={isActive ? "Active" : "Inactive"} />
                <InfoField label="Created"      value={fmt(subjectInfo.created_at)} />
              </div>
            </div>

            {subjectInfo.subject_description && (
              <div>
                <span className="so-section-title">Description</span>
                <p className="so-description">{subjectInfo.subject_description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Panel */}
        <AddSubjectPanel
          isShow={showEditMenu}
          onClose={() => setShowEditMenu(false)}
          formData={editFormData}
          onFormChange={handleFormChange}
          onSubmit={handleSaveEdit}
          loading={isUpdating}
          isEditMode={true}
        />

        {/* Deactivate Panel */}
        <SlideInMenu isShow={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} width="420px">
          <div className="so-confirm-container">
            <div className="so-confirm-header danger">
              <span className="so-confirm-header-deco" aria-hidden="true" />
              <div className="so-confirm-header-content">
                <div className="so-confirm-header-icon">
                  <FaTimesCircle size={18} />
                </div>
                <div className="so-confirm-header-text">
                  <h3>Deactivate Subject</h3>
                  <p>This action can be reversed later</p>
                </div>
              </div>
            </div>
            <div className="so-confirm-body">
              <div className="so-confirm-name">{subjectInfo.subject_name}</div>
              <div className="so-confirm-warn">⚠️ You are about to deactivate this subject.</div>
              <p className="so-confirm-effects-title">This will:</p>
              <ul className="so-confirm-effects">
                <li>Make the subject inactive in the system</li>
                <li>Hide it from active subject lists</li>
                <li>Prevent new teacher assignments</li>
                <li>Preserve all historical data and records</li>
              </ul>
            </div>
            <div className="so-confirm-footer">
              <Button variant="secondary" onClick={() => setShowDeactivateModal(false)} disabled={isUpdating}>Cancel</Button>
              <Button variant="danger" onClick={() => handleConfirmToggleStatus(false)} disabled={isUpdating}>
                {isUpdating ? "Deactivating..." : "Deactivate Subject"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Activate Panel */}
        <SlideInMenu isShow={showActivateModal} onClose={() => setShowActivateModal(false)} width="420px">
          <div className="so-confirm-container">
            <div className="so-confirm-header success">
              <span className="so-confirm-header-deco" aria-hidden="true" />
              <div className="so-confirm-header-content">
                <div className="so-confirm-header-icon">
                  <FaCheckCircle size={18} />
                </div>
                <div className="so-confirm-header-text">
                  <h3>Activate Subject</h3>
                  <p>Restore this subject to active status</p>
                </div>
              </div>
            </div>
            <div className="so-confirm-body">
              <div className="so-confirm-name">{subjectInfo.subject_name}</div>
              <div className="so-confirm-info">✓ You are about to activate this subject.</div>
              <p className="so-confirm-effects-title">This will:</p>
              <ul className="so-confirm-effects">
                <li>Make the subject active in the system</li>
                <li>Show it in active subject lists</li>
                <li>Allow new teacher assignments</li>
                <li>Restore all previous settings and permissions</li>
              </ul>
            </div>
            <div className="so-confirm-footer">
              <Button variant="secondary" onClick={() => setShowActivateModal(false)} disabled={isUpdating}>Cancel</Button>
              <Button onClick={() => handleConfirmToggleStatus(true)} disabled={isUpdating}>
                {isUpdating ? "Activating..." : "Activate Subject"}
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default SubjectOverview;
