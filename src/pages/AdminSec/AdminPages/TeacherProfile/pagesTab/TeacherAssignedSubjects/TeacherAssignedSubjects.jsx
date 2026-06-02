import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import SearchableSelect from "../../../../../../components/SearchableSelect/SearchableSelect";
import Button from "../../../../../../components/Button/Button";
import { useTeacherSubjects } from "../../../../../../api_call/useTeacherSubjects";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { FaEllipsisV } from "react-icons/fa";
import "./TeacherAssignedSubjects.css";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const RowDropdown = ({ assignmentId, row, isOpen, onToggle, onClose, onView, onDeactivate, deactivating }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="tas-row-dropdown">
      <button className="tas-row-btn" onClick={onToggle}>
        <FaEllipsisV size={11} />
      </button>
      {isOpen && (
        <div className="tas-row-menu">
          <button className="tas-row-menu-item" onClick={onView}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
            View
          </button>
          {row.is_active && (
            <button className="tas-row-menu-item danger" onClick={onDeactivate} disabled={deactivating}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="2"/></svg>
              {deactivating ? "..." : "Deactivate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const TeacherAssignedSubjects = ({ teacherData }) => {
  const teacherId  = teacherData?.teacher?.teacher_id;
  const schoolId   = teacherData?.teacher?.school_id;
  const teacherName = teacherData?.teacher?.staff?.full_name || "this teacher";
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { makeTeacherSubjectsFetcher } = useTeacherSubjects();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.teachers?.edit;

  const [isPanelOpen, setIsPanelOpen]         = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [saving, setSaving]                   = useState(false);
  const [reloadKey, setReloadKey]             = useState(0);
  const [panelLoading, setPanelLoading]       = useState(false);
  const [deactivating, setDeactivating]       = useState(null);
  const [openDropdown, setOpenDropdown]       = useState(null);
  const [isHistoryOpen, setIsHistoryOpen]     = useState(false);
  const [historyData, setHistoryData]         = useState([]);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [deletingId, setDeletingId]           = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  useEffect(() => {
    if (!isHistoryOpen || !teacherId) return;
    setHistoryLoading(true);
    fetch(`${API_BASE_URL}/teacher-subject/teacher/${teacherId}?limit=200&history=true`)
      .then(r => r.json())
      .then(res => setHistoryData(res.success ? res.data : []))
      .catch(() => setHistoryData([]))
      .finally(() => setHistoryLoading(false));
  }, [isHistoryOpen, teacherId]);

  const handleDeleteHistory = async (assignmentId) => {
    if (!canEdit) { addNotification("No permission to delete assignment records.", "error"); return; }
    if (!window.confirm("Permanently delete this assignment record?")) return;
    setDeletingId(assignmentId);
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject/${assignmentId}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) { addNotification("Assignment deleted", "success"); setHistoryData(p => p.filter(a => a.assignment_id !== assignmentId)); }
      else addNotification(result.message || "Failed to delete", "error");
    } catch { addNotification("Failed to delete", "error"); }
    finally { setDeletingId(null); }
  };

  const handleDeactivate = async () => {
    if (!canEdit) { addNotification("No permission to deactivate.", "error"); setDeactivateTarget(null); return; }
    if (!deactivateTarget) return;
    setDeactivating(deactivateTarget.assignment_id);
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject/${deactivateTarget.assignment_id}/deactivate`, { method: "PATCH" });
      const result = await res.json();
      if (result.success) { addNotification("Assignment deactivated", "success"); setReloadKey(k => k + 1); setDeactivateTarget(null); }
      else addNotification(result.message || "Failed to deactivate", "error");
    } catch { addNotification("Failed to deactivate", "error"); }
    finally { setDeactivating(null); }
  };

  useEffect(() => {
    if (!isPanelOpen || !schoolId || !teacherId) return;
    setPanelLoading(true);
    Promise.all([
      fetch(`${API_BASE_URL}/subject/school/${schoolId}`).then(r => r.json()),
      fetch(`${API_BASE_URL}/teacher-subject/teacher/${teacherId}?limit=200`).then(r => r.json()),
      fetch(`${API_BASE_URL}/class-subject/school/${schoolId}/active`).then(r => r.json()),
    ])
      .then(([subjectsRes, teacherAssignRes, classSubjectRes]) => {
        const allSubjects = subjectsRes.success ? subjectsRes.data : [];
        const assignedIds = new Set((teacherAssignRes.success ? teacherAssignRes.data : []).map(a => a.subject_id));
        const classMap = {};
        if (classSubjectRes.success) classSubjectRes.data.forEach(ca => { classMap[ca.subject_id] = { class_name: ca.class_name, class_code: ca.class_code }; });
        setAvailableSubjects(
          allSubjects.filter(s => !assignedIds.has(s.subject_id)).map(s => {
            const cls = classMap[s.subject_id];
            return { value: s.subject_id, label: s.subject_name, subtitle: cls ? `${s.subject_code} • ${cls.class_name}` : s.subject_code };
          })
        );
      })
      .catch(() => addNotification("Failed to load subjects", "error"))
      .finally(() => setPanelLoading(false));
  }, [isPanelOpen, schoolId, teacherId]);

  const fetchData = useMemo(() => (teacherId ? makeTeacherSubjectsFetcher(teacherId, false) : null), [teacherId, reloadKey]);

  const handleAssign = async () => {
    if (!selectedSubjectId) return addNotification("Please select a subject", "error");
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/teacher-subject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_id: teacherId, subject_id: selectedSubjectId, school_id: schoolId, start_date: new Date().toISOString().split("T")[0] }),
      });
      const result = await res.json();
      if (result.success) {
        addNotification("Subject assigned successfully", "success");
        setIsPanelOpen(false); setSelectedSubjectId(""); setReloadKey(k => k + 1);
      } else addNotification(result.message || "Failed to assign subject", "error");
    } catch { addNotification("Failed to assign subject", "error"); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      label: "Subject", accessor: "subject_name",
      render: (value, row) => (
        <div className="tas-subject-cell">
          <div className="tas-subject-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="tas-subject-name">{value}</p>
            <span className="tas-subject-code">{row.subject_code}</span>
          </div>
        </div>
      ),
    },
    {
      label: "Class", accessor: "class_name",
      render: (value, row) => (
        <div className="tas-class-cell">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="tas-class-icon">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="tas-class-name">{value}</p>
            <span className="tas-class-code">{row.class_code}</span>
          </div>
        </div>
      ),
    },
    {
      label: "Start Date", accessor: "start_date",
      render: (value) => value ? new Date(value).toLocaleDateString() : "—",
    },
    {
      label: "Status", accessor: "is_active", searchable: false,
      render: (value) => (
        <span className={`tas-status ${value ? "active" : "inactive"}`}>
          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      label: "Actions", accessor: "assignment_id", searchable: false,
      render: (assignmentId, row) => (
        <RowDropdown
          assignmentId={assignmentId} row={row}
          isOpen={openDropdown === assignmentId}
          onToggle={(e) => { e.stopPropagation(); setOpenDropdown(p => p === assignmentId ? null : assignmentId); }}
          onClose={() => setOpenDropdown(null)}
          onView={() => { setOpenDropdown(null); navigate(`/admin/${schoolId}/subjects/${row.subject_id}`); }}
          onDeactivate={() => { setOpenDropdown(null); setDeactivateTarget(row); }}
          deactivating={deactivating === assignmentId}
        />
      ),
    },
  ];

  const selectedSubject = availableSubjects.find(o => o.value === selectedSubjectId);
  const [subjectCode, subjectClass] = (selectedSubject?.subtitle || "").split(" • ");

  return (
    <InnerTabCon>
      <div className="teacher-assigned-subjects">

        {/* Header */}
        <div className="tas-header">
          <div className="tas-header-left">
            <h2 className="tas-title">Assigned Subjects</h2>
            <p className="tas-subtitle">Subjects currently assigned to this teacher with class details</p>
          </div>
          <div className="tas-header-right">
            <button className="tas-btn tas-btn-secondary" onClick={() => setIsHistoryOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              History
            </button>
          </div>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          enableSelect={false}
          showcreatbut={true}
          creattext="Assign Subject"
          onCreate={() => {
            if (!canEdit) { addNotification("No permission to assign subjects.", "error"); return; }
            setIsPanelOpen(true);
          }}
          initialPageSize={20}
          reloadKey={reloadKey}
        />

        {/* History Panel */}
        <SlideInMenu isShow={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} width="520px">
          <div className="tas-panel">
            <div className="tas-panel-header default">
              <span className="tas-panel-header-deco" aria-hidden="true" />
              <div className="tas-panel-header-content">
                <div className="tas-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                </div>
                <div className="tas-panel-header-text">
                  <h2>Assignment History</h2>
                  <p>Inactive subject assignments for this teacher</p>
                </div>
              </div>
            </div>
            <div className="tas-panel-body">
              {historyLoading ? (
                <p className="tas-panel-empty">Loading history...</p>
              ) : historyData.length === 0 ? (
                <p className="tas-panel-empty">No assignment history found.</p>
              ) : (
                historyData.map((item) => (
                  <div key={item.assignment_id} className="tas-history-card">
                    <div className="tas-history-card-top">
                      <div className="tas-history-card-info">
                        <div className="tas-history-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div>
                          <p className="tas-history-name">{item.subject_name}</p>
                          <p className="tas-history-code">{item.subject_code}</p>
                        </div>
                      </div>
                      <span className="tas-status inactive">Inactive</span>
                    </div>
                    <div className="tas-history-class">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                      {item.class_name}
                      {item.class_code && <span style={{ color: "#888888", fontWeight: 600, fontSize: 11 }}>({item.class_code})</span>}
                    </div>
                    <div className="tas-history-dates">
                      <div className="tas-history-date-item">
                        <span className="tas-history-date-label">Start Date</span>
                        <span className="tas-history-date-value">{item.start_date ? new Date(item.start_date).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="tas-history-date-item">
                        <span className="tas-history-date-label">End Date</span>
                        <span className="tas-history-date-value">{item.end_date ? new Date(item.end_date).toLocaleDateString() : "—"}</span>
                      </div>
                    </div>
                    <div className="tas-history-actions">
                      <button className="tas-history-delete-btn" onClick={() => handleDeleteHistory(item.assignment_id)} disabled={deletingId === item.assignment_id}>
                        {deletingId === item.assignment_id ? "Deleting..." : "🗑 Delete"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SlideInMenu>

        {/* Assign Subject Panel */}
        <SlideInMenu isShow={isPanelOpen} onClose={() => { setIsPanelOpen(false); setSelectedSubjectId(""); }} width="500px">
          <div className="tas-panel">
            <div className="tas-panel-header default">
              <span className="tas-panel-header-deco" aria-hidden="true" />
              <div className="tas-panel-header-content">
                <div className="tas-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="tas-panel-header-text">
                  <h2>Assign Subject</h2>
                  <p>Assign a subject to {teacherName}</p>
                </div>
              </div>
            </div>
            <div className="tas-panel-body">
              <div className="tas-info-box info">
                Only subjects not yet assigned to this teacher are shown. Each subject also displays its assigned class.
              </div>

              <div>
                <span className="tas-section-label">Select Subject</span>
                {panelLoading ? (
                  <p className="tas-panel-empty">Loading subjects...</p>
                ) : availableSubjects.length === 0 ? (
                  <p className="tas-panel-empty">All subjects are already assigned to this teacher.</p>
                ) : (
                  <SearchableSelect
                    placeholder="Search by name, code or class..."
                    options={availableSubjects}
                    value={selectedSubjectId}
                    onChange={setSelectedSubjectId}
                    searchKeys={["label", "subtitle"]}
                  />
                )}
              </div>

              {selectedSubjectId && selectedSubject && (
                <div className="tas-selected-preview">
                  <span className="tas-selected-preview-label">Selected Subject</span>
                  <div className="tas-selected-preview-top">
                    <div className="tas-selected-preview-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="tas-selected-preview-name">{selectedSubject.label}</p>
                      <p className="tas-selected-preview-code">{subjectCode}</p>
                    </div>
                  </div>
                  {subjectClass ? (
                    <div className="tas-selected-preview-class">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                      {subjectClass}
                    </div>
                  ) : (
                    <p className="tas-selected-preview-no-class">No class assigned to this subject yet</p>
                  )}
                </div>
              )}
            </div>
            <div className="tas-panel-footer">
              <Button variant="secondary" onClick={() => { setIsPanelOpen(false); setSelectedSubjectId(""); }} disabled={saving}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedSubjectId || saving || panelLoading}>
                {saving ? "Assigning..." : "Assign Subject"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Deactivate Confirmation Panel */}
        <SlideInMenu isShow={!!deactivateTarget} onClose={() => setDeactivateTarget(null)} width="420px">
          {deactivateTarget && (
            <div className="tas-panel">
              <div className="tas-panel-header danger">
                <span className="tas-panel-header-deco" aria-hidden="true" />
                <div className="tas-panel-header-content">
                  <div className="tas-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.7"/></svg>
                  </div>
                  <div className="tas-panel-header-text">
                    <h2>Deactivate Assignment</h2>
                    <p>This will move it to history</p>
                  </div>
                </div>
              </div>
              <div className="tas-panel-body">
                <div className="tas-selected-preview">
                  <p className="tas-selected-preview-name">{deactivateTarget.subject_name}</p>
                  <p className="tas-selected-preview-code">{deactivateTarget.class_name}</p>
                </div>
                <div className="tas-info-box warn">
                  ⚠️ You are about to deactivate this subject assignment.
                </div>
                <p className="tas-effects-title">This will:</p>
                <ul className="tas-effects">
                  <li>Mark the assignment as inactive</li>
                  <li>Set today as the end date</li>
                  <li>Move it to assignment history</li>
                  <li>Preserve all historical data</li>
                </ul>
              </div>
              <div className="tas-panel-footer">
                <Button variant="secondary" onClick={() => setDeactivateTarget(null)} disabled={!!deactivating}>Cancel</Button>
                <Button variant="danger" onClick={handleDeactivate} disabled={!!deactivating}>
                  {deactivating ? "Deactivating..." : "Deactivate"}
                </Button>
              </div>
            </div>
          )}
        </SlideInMenu>

      </div>
    </InnerTabCon>
  );
};

export default TeacherAssignedSubjects;
