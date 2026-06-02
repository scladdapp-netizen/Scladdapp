import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useMemo } from "react";
import "./ClassSubjects.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../components/infoField/InfoField";
import Button from "../../../../../components/Button/Button";
import AddSubjectPanel from "../../SchoolDirectory/Subjects/AddSubjectPanel";
import { useClassSubjects } from "../../../../../api_call/useClassSubjects";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useSubject } from "../../../../../api_call/useSubject";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { FaEllipsisV } from "react-icons/fa";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const RowDropdown = ({ assignmentId, isOpen, onToggle, onClose, onView, onDeactivate }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="cs-row-dropdown">
      <button className="cs-row-btn" onClick={onToggle}>
        <FaEllipsisV size={11} />
      </button>
      {isOpen && (
        <div className="cs-row-menu">
          <button className="cs-row-menu-item" onClick={onView}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            View
          </button>
          <button className="cs-row-menu-item danger" onClick={onDeactivate}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2"/></svg>
            Deactivate
          </button>
        </div>
      )}
    </div>
  );
};

const ClassSubjects = () => {
  const { classId, subseasion, schoolId } = useParams();
  const { makeClassSubjectsFetcher } = useClassSubjects();
  const { addNotification } = useNotification();

  const [reloadKey, setReloadKey]       = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [detailRow, setDetailRow]       = useState(null);
  const [deactivateRow, setDeactivateRow] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData]   = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [restoringId, setRestoringId]   = useState(null);

  const { loading: subjectLoading, createSubject } = useSubject();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.classes?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSubjectForm, setNewSubjectForm] = useState({
    subjectName: "", subjectCode: "", classId: "", teacherId: "", subjectDescription: "", stream: "",
  });

  const handleFormChange = (field) => (value) => setNewSubjectForm((p) => ({ ...p, [field]: value }));
  const resetForm = () => setNewSubjectForm({ subjectName: "", subjectCode: "", classId: "", teacherId: "", subjectDescription: "", stream: "" });

  const handleAddSubject = async () => {
    if (!newSubjectForm.subjectName || !newSubjectForm.subjectCode)
      return addNotification("Subject name and code are required", "error");
    try {
      const response = await createSubject({
        subjectName: newSubjectForm.subjectName,
        subjectCode: newSubjectForm.subjectCode,
        subjectDescription: newSubjectForm.subjectDescription,
        stream: newSubjectForm.stream || null,
        school_id: schoolId,
        created_by: user?.admin?.admin_id || user?.user_id,
      });
      if (!response.success) return addNotification(response.message || "Failed to create subject", "error");

      const subjectId = response.data.subject_id;
      if (newSubjectForm.classId) {
        await fetch(`${API_BASE_URL}/class-subject`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: subjectId, class_id: newSubjectForm.classId, school_id: schoolId, assigned_by: user?.staff_id || user?.admin_id || null }),
        });
      }
      if (newSubjectForm.teacherId) {
        await fetch(`${API_BASE_URL}/teacher-subject`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: subjectId, teacher_id: newSubjectForm.teacherId, school_id: schoolId, assigned_by: user?.staff_id || user?.admin_id || null }),
        });
      }
      addNotification(`Subject "${newSubjectForm.subjectName}" created`, "success");
      setIsAddOpen(false); resetForm(); setReloadKey((k) => k + 1);
    } catch { addNotification("Failed to create subject", "error"); }
  };

  const fetchData = useMemo(() => makeClassSubjectsFetcher(classId), [classId, reloadKey]);

  useEffect(() => {
    if (!isHistoryOpen || !classId) return;
    setHistoryLoading(true);
    fetch(`${API_BASE_URL}/api/class-subjects/${classId}/history`)
      .then(r => r.json())
      .then(res => setHistoryData(res.success ? res.data : []))
      .catch(() => setHistoryData([]))
      .finally(() => setHistoryLoading(false));
  }, [isHistoryOpen, classId]);

  const handleDeactivate = async () => {
    if (!canEdit) { addNotification("No permission to deactivate subjects.", "error"); setDeactivateRow(null); return; }
    if (!deactivateRow) return;
    setDeactivating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${deactivateRow.assignment_id}/deactivate`, { method: "PATCH" });
      const result = await res.json();
      if (result.success) { addNotification("Subject deactivated", "success"); setDeactivateRow(null); setReloadKey(k => k + 1); }
      else addNotification(result.message || "Failed to deactivate", "error");
    } catch { addNotification("Failed to deactivate", "error"); }
    finally { setDeactivating(false); }
  };

  const handleRestoreHistory = async (assignmentId) => {
    if (!canEdit) { addNotification("No permission to restore subjects.", "error"); return; }
    setRestoringId(assignmentId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${assignmentId}/restore`, { method: "PATCH" });
      const result = await res.json();
      if (result.success) { addNotification("Subject restored", "success"); setHistoryData(p => p.filter(a => a.assignment_id !== assignmentId)); setReloadKey(k => k + 1); }
      else addNotification(result.message || "Failed to restore", "error");
    } catch { addNotification("Failed to restore", "error"); }
    finally { setRestoringId(null); }
  };

  const handleDeleteHistory = async (assignmentId) => {
    if (!canEdit) { addNotification("No permission to delete subject records.", "error"); return; }
    if (!window.confirm("Permanently delete this record?")) return;
    setDeletingId(assignmentId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${assignmentId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) { addNotification("Record deleted", "success"); setHistoryData(p => p.filter(a => a.assignment_id !== assignmentId)); }
      else addNotification(result.message || "Failed to delete", "error");
    } catch { addNotification("Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const columns = [
    {
      label: "Subject", accessor: "subject_name",
      render: (val, row) => (
        <div className="cs-subject-cell">
          <div className="cs-subject-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="cs-subject-name">{val}</p>
            <span className="cs-subject-code">{row.subject_code}</span>
          </div>
        </div>
      ),
    },
    { label: "Description", accessor: "subject_description" },
    { label: "Teacher", accessor: "teacher_name" },
    { label: "Teacher Email", accessor: "teacher_email" },
    {
      label: "Status", accessor: "is_active", searchable: false,
      render: (val) => (
        <span className={`cs-status ${val ? "active" : "inactive"}`}>
          {val ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      label: "Actions", accessor: "assignment_id", searchable: false,
      render: (assignmentId, row) => (
        <RowDropdown
          assignmentId={assignmentId}
          row={row}
          isOpen={openDropdown === assignmentId}
          onToggle={(e) => { e.stopPropagation(); setOpenDropdown(p => p === assignmentId ? null : assignmentId); }}
          onClose={() => setOpenDropdown(null)}
          onView={() => { setOpenDropdown(null); setDetailRow(row); }}
          onDeactivate={() => { setOpenDropdown(null); setDeactivateRow(row); }}
        />
      ),
    },
  ];

  return (
    <InnerTabCon>
    <div className="classSubjects">

      {/* Header */}
      <div className="csHeader">
        <div className="csHeaderLeft">
          <h2 className="csTitle">Subjects</h2>
          <p className="csSubtitle">All subjects assigned to this class</p>
        </div>
        <div className="csHeaderActions">
          <button className="cs-btn cs-btn-primary" onClick={() => {
            if (!canCreate) { addNotification("No permission to add subjects.", "error"); return; }
            setIsAddOpen(true);
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            Add Subject
          </button>
          <button className="cs-btn cs-btn-secondary" onClick={() => setIsHistoryOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            History
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="csTableContainer">
        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          enableSelect={false}
          showcreatbut={false}
          initialPageSize={20}
          reloadKey={`${classId}-${subseasion}-${reloadKey}`}
        />
      </div>

      {/* Add Subject Panel */}
      <AddSubjectPanel
        isShow={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm(); }}
        formData={newSubjectForm}
        onFormChange={handleFormChange}
        onSubmit={handleAddSubject}
        loading={subjectLoading}
        presetClassId={classId}
      />

      {/* View Detail Panel */}
      <SlideInMenu isShow={!!detailRow} onClose={() => setDetailRow(null)} width="480px">
        {detailRow && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true" />
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{detailRow.subject_name}</h2>
                  <p>Subject details</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Subject Name"  value={detailRow.subject_name} />
                <InfoField label="Subject Code"  value={detailRow.subject_code} />
                <InfoField label="Description"   value={detailRow.subject_description} />
                <InfoField label="Status"        value={detailRow.is_active ? "Active" : "Inactive"} />
                <InfoField label="Teacher"       value={detailRow.teacher_name} />
                <InfoField label="Teacher Email" value={detailRow.teacher_email} />
                <InfoField label="Teacher Phone" value={detailRow.teacher_phone} />
              </div>
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setDetailRow(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* Deactivate Confirmation Panel */}
      <SlideInMenu isShow={!!deactivateRow} onClose={() => setDeactivateRow(null)} width="420px">
        {deactivateRow && (
          <div className="cs-panel">
            <div className="cs-panel-header warning">
              <span className="cs-panel-header-deco" aria-hidden="true" />
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.7"/></svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>Deactivate Subject</h2>
                  <p>This will remove it from the active list</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-warn-box">
                Are you sure you want to deactivate <strong>{deactivateRow.subject_name}</strong> ({deactivateRow.subject_code}) from this class?
              </div>
              <div className="cs-panel-grid">
                <InfoField label="Subject" value={deactivateRow.subject_name} />
                <InfoField label="Code"    value={deactivateRow.subject_code} />
                <InfoField label="Teacher" value={deactivateRow.teacher_name} />
              </div>
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setDeactivateRow(null)} disabled={deactivating}>Cancel</Button>
              <Button variant="danger" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? "Deactivating..." : "Deactivate"}
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* History Panel */}
      <SlideInMenu isShow={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} width="520px">
        <div className="cs-panel">
          <div className="cs-panel-header neutral">
            <span className="cs-panel-header-deco" aria-hidden="true" />
            <div className="cs-panel-header-content">
              <div className="cs-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              </div>
              <div className="cs-panel-header-text">
                <h2>Subject History</h2>
                <p>Inactive subject assignments for this class</p>
              </div>
            </div>
          </div>
          <div className="cs-panel-body">
            {historyLoading ? (
              <p className="cs-panel-empty">Loading...</p>
            ) : historyData.length === 0 ? (
              <p className="cs-panel-empty">No history found.</p>
            ) : (
              historyData.map((item) => (
                <div key={item.assignment_id} className="cs-history-card">
                  <div className="cs-history-card-top">
                    <div className="cs-history-card-info">
                      <div className="cs-history-icon">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div>
                        <p className="cs-history-name">{item.subject_name}</p>
                        <p className="cs-history-code">{item.subject_code}</p>
                      </div>
                    </div>
                    <span className="cs-status inactive">Inactive</span>
                  </div>
                  <div className="cs-history-dates">
                    <div className="cs-history-date-item">
                      <span className="cs-history-date-label">Start Date</span>
                      <span className="cs-history-date-value">{item.start_date ? new Date(item.start_date).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="cs-history-date-item">
                      <span className="cs-history-date-label">End Date</span>
                      <span className="cs-history-date-value">{item.end_date ? new Date(item.end_date).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                  <div className="cs-history-actions">
                    <button className="cs-history-btn restore" onClick={() => handleRestoreHistory(item.assignment_id)} disabled={restoringId === item.assignment_id}>
                      {restoringId === item.assignment_id ? "Restoring..." : "♻ Restore"}
                    </button>
                    <button className="cs-history-btn delete" onClick={() => handleDeleteHistory(item.assignment_id)} disabled={deletingId === item.assignment_id}>
                      {deletingId === item.assignment_id ? "Deleting..." : "🗑 Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SlideInMenu>

    </div>
    </InnerTabCon>
  );
};

export default ClassSubjects;
