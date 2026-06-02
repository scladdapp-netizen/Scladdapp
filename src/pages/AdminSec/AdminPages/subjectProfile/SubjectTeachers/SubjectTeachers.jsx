import { useParams, useNavigate } from "react-router-dom";
import "./SubjectTeachers.css";
import { useState, useEffect } from "react";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import { useSubjectTeachers } from "../../../../../api_call/useSubjectTeachers";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useTeacherInfo from "../../../../../api_call/useTeacherInfo";

const StatusBadge = ({ active }) => (
  <span className={`sc-status-badge ${active ? "active" : "inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const SubjectTeachers = ({ subjectData }) => {
  const { subjectId, schoolId } = useParams();
  const navigate = useNavigate();
  const { getTeachersBySubject, deactivateTeacherAssignment, deleteTeacherAssignment, reactivateTeacherAssignment, assignTeacherToSubject, getActiveClassesBySubject } = useSubjectTeachers();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getTeachersBySchoolId } = useTeacherInfo();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  // Fresh class assignments loaded from backend (not stale subjectData prop)
  const [classAssignments, setClassAssignments] = useState([]);

  const [showDeactivatePanel, setShowDeactivatePanel] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [reactivating, setReactivating] = useState(null);

  // Add teacher panel
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addClassId, setAddClassId] = useState("");
  const [addTeacherId, setAddTeacherId] = useState("");
  const [allTeachers, setAllTeachers] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  const subjectName = subjectData?.subject?.subject_name || "Subject";
  // classAssignments is loaded fresh in loadTeachers — not from stale subjectData prop

  const loadTeachers = () => {
    if (!subjectId) return;
    setLoading(true);
    // Fetch teachers + ALL class assignments (active + inactive) in parallel
    Promise.all([
      getTeachersBySubject(subjectId),
      fetch(`http://localhost:3000/api/class-subjects/by-subject/${subjectId}`)
        .then((r) => r.json())
        .catch(() => ({ success: false, data: [] })),
    ]).then(([teacherRes, classRes]) => {
      if (teacherRes.success) setTeachers(teacherRes.data);
      else setError(teacherRes.message);
      if (classRes.success) setClassAssignments(classRes.data || []);
      setLoading(false);
    });
  };

  useEffect(() => { loadTeachers(); }, [subjectId]);

  const classesWithNoActiveTeacher = classAssignments
    .filter((ca) => ca.is_active)
    .filter((ca) =>
      !teachers.some((t) => t.classes.some((c) => c.class_id === ca.class_id && c.is_active))
    );

  // Classes that are deactivated but still have teacher assignments (active or inactive)
  const deactivatedClasses = classAssignments
    .filter((ca) => !ca.is_active)
    .filter((ca) =>
      teachers.some((t) => t.classes.some((c) => c.class_id === ca.class_id))
    );

  const filtered = teachers.filter((t) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && t.is_active) ||
      (filter === "inactive" && !t.is_active);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (t.teacher_name || "").toLowerCase().includes(q) ||
      (t.teacher_email || "").toLowerCase().includes(q) ||
      t.classes.some((c) => (c.class_name || "").toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all:      teachers.length,
    active:   teachers.filter((t) => t.is_active).length,
    inactive: teachers.filter((t) => !t.is_active).length,
  };

  const openDeactivatePanel = (e, assignment, teacherName) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to deactivate teacher assignments.", "error");
      return;
    }
    setDeactivateTarget({ ...assignment, teacher_name: teacherName });
    setShowDeactivatePanel(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    const res = await deactivateTeacherAssignment(deactivateTarget.assignment_id);
    setDeactivating(false);
    if (res.success) {
      setShowDeactivatePanel(false);
      setDeactivateTarget(null);
      addNotification("Teacher assignment deactivated", "success");
      loadTeachers();
    } else {
      addNotification(res.message || "Failed to deactivate", "error");
    }
  };

  const openDeletePanel = (e, assignment, teacherName) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to delete teacher assignments.", "error");
      return;
    }
    setDeleteTarget({ ...assignment, teacher_name: teacherName });
    setShowDeletePanel(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteTeacherAssignment(deleteTarget.assignment_id);
    setDeleting(false);
    if (res.success) {
      setShowDeletePanel(false);
      setDeleteTarget(null);
      addNotification("Teacher assignment deleted", "success");
      loadTeachers();
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const handleReactivate = async (e, assignment) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to reactivate teacher assignments.", "error");
      return;
    }
    setReactivating(assignment.assignment_id);
    const res = await reactivateTeacherAssignment(assignment.assignment_id);
    setReactivating(null);
    if (res.success) {
      addNotification("Teacher assignment reactivated", "success");
      loadTeachers();
    } else {
      addNotification(res.message || "Failed to reactivate", "error");
    }
  };

  const openAddPanel = () => {
    if (!canEdit) {
      addNotification("You do not have permission to assign teachers.", "error");
      return;
    }
    setAddClassId("");
    setAddTeacherId("");
    setAddError(null);
    setAllTeachers([]);
    setActiveClasses([]);
    setShowAddPanel(true);
    setLoadingTeachers(true);
    // Fetch teachers and fresh active classes in parallel
    Promise.all([
      getTeachersBySchoolId(schoolId),
      getActiveClassesBySubject(subjectId),
    ]).then(([teacherRes, classRes]) => {
      setLoadingTeachers(false);
      if (teacherRes.success && teacherRes.data) {
        setAllTeachers(
          teacherRes.data
            .filter((t) => t.is_active && t.staff)
            .map((t) => ({ value: t.teacher_id, label: `${t.staff.full_name} (${t.teacher_code})` }))
        );
      }
      if (classRes.success) {
        setActiveClasses(classRes.data.map((c) => ({ value: c.class_id, label: c.class_name })));
      }
    });
  };

  const handleAddTeacher = async () => {
    if (!addClassId) { setAddError("Please select a class"); return; }
    if (!addTeacherId) { setAddError("Please select a teacher"); return; }
    setAdding(true);
    setAddError(null);
    const res = await assignTeacherToSubject({
      subject_id: subjectId,
      teacher_id: addTeacherId,
      class_id: addClassId,
      school_id: schoolId,
    });
    setAdding(false);
    if (res.success) {
      setShowAddPanel(false);
      addNotification("Teacher assigned successfully", "success");
      loadTeachers();
    } else {
      setAddError(res.message || "Failed to assign teacher");
    }
  };

  if (loading) return <InnerTabCon><LoadingData message="Loading teachers..." /></InnerTabCon>;
  if (error)   return <InnerTabCon><div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="subjectClasses">

        {/* Warning banners for deactivated classes */}
        {deactivatedClasses.map((ca) => (
          <div key={`deact-${ca.class_id}`} className="sc-warn-banner danger">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span><strong>{ca.class_name}</strong> is deactivated — teacher assignments for this class are inactive</span>
          </div>
        ))}

        {/* Warning banners for active classes with no active teacher */}
        {classesWithNoActiveTeacher.map((ca) => (
          <div key={ca.class_id} className="sc-warn-banner warn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>No teacher assigned for <strong>{ca.class_name}</strong></span>
          </div>
        ))}

        {/* Header */}
        <div className="scHeader">
          <div className="scHeaderLeft">
            <h2 className="scTitle">Teachers — {subjectName}</h2>
            <p className="scSubtitle">
              {counts.active} active · {counts.inactive} inactive · {counts.all} total
            </p>
          </div>
          <div className="scHeaderRight">
            <Button variant="primary" onClick={openAddPanel}>Add Teacher</Button>
          </div>
        </div>

        {/* Search */}
        <div className="scSearchContainer">
          <div className="scSearchInputWrapper">
            <input
              type="text"
              placeholder="Search by name, email or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="scSearchInput"
            />
            {search && (
              <button onClick={() => setSearch("")} className="scClearSearch">×</button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="scFilterTabs">
          {["all", "active", "inactive"].map((f) => (
            <button
              key={f}
              className={`scFilterTab ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="scEmptyState">
            <h3>No teachers found</h3>
            <p>{search ? `No results for "${search}"` : "No teachers assigned to this subject yet."}</p>
          </div>
        ) : (
          <div className="scClassesList">
            {filtered.map((t) => (
              <div
                key={t.teacher_id}
                className={`scClassCard ${!t.is_active ? "inactive" : ""}`}
                onClick={() => navigate(`/admin/${schoolId}/teachers/${t.teacher_id}`)}
              >
                <div className="scClassHeader">
                  <div className="scClassInfo">
                    <div className="scClassTitleRow">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="sc-teacher-avatar">
                          {t.profile_picture
                            ? <img src={t.profile_picture} alt={t.teacher_name} />
                            : (t.teacher_name?.charAt(0)?.toUpperCase() || "T")
                          }
                        </div>
                        <h3 className="scClassName">{t.teacher_name || "—"}</h3>
                      </div>
                      <StatusBadge active={t.is_active} />
                    </div>
                    <p className="scClassId">ID: {t.teacher_id} · {t.teacher_email || "—"}</p>
                  </div>
                </div>

                <div className="scClassBody">
                  <div className="scClassDetails">
                    {t.phone && (
                      <div className="scDetailItem">
                        <span className="scDetailLabel">Phone:</span>
                        <span className="scDetailValue">{t.phone}</span>
                      </div>
                    )}
                    {t.qualification && (
                      <div className="scDetailItem">
                        <span className="scDetailLabel">Qualification:</span>
                        <span className="scDetailValue">{t.qualification}</span>
                      </div>
                    )}
                  </div>

                  {/* Per-class assignment rows */}
                  <div className="sc-class-rows">
                    {t.classes.map((c) => (
                      <div
                        key={c.assignment_id}
                        className={`sc-class-row ${c.is_active ? "active" : "inactive"}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="sc-class-row-left">
                          <span className="sc-class-row-name">{c.class_name || "—"}</span>
                          <span className={`sc-status-badge ${c.is_active ? "active" : "inactive"}`}>
                            {c.is_active ? "Active" : "Inactive"}
                          </span>
                          {c.start_date && <span className="sc-class-row-date">from {c.start_date}</span>}
                        </div>
                        <div className="sc-class-row-actions">
                          {c.is_active ? (
                            <button className="sc-action-btn deactivate" onClick={(e) => openDeactivatePanel(e, c, t.teacher_name)}>
                              Deactivate
                            </button>
                          ) : (
                            <>
                              <button className="sc-action-btn reactivate" onClick={(e) => handleReactivate(e, c)} disabled={reactivating === c.assignment_id}>
                                {reactivating === c.assignment_id ? "..." : "Reactivate"}
                              </button>
                              <button className="sc-action-btn delete" onClick={(e) => openDeletePanel(e, c, t.teacher_name)}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="scClassFooter">
                  <div className="scViewDetails">
                    <span>View Teacher Profile</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Teacher Panel */}
      <SlideInMenu isShow={showAddPanel} onClose={() => setShowAddPanel(false)} width="420px">
        <div className="sc-panel">
          <div className="sc-panel-header default">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>Add Teacher</h2>
                <p>Assign a teacher to {subjectName}</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-field">
              <label className="sc-field-label">Class *</label>
              <SearchableSelect options={activeClasses} value={addClassId}
                onChange={(v) => { setAddClassId(v); setAddError(null); }}
                placeholder="Select a class..." disabled={loadingTeachers} />
            </div>
            <div className="sc-field">
              <label className="sc-field-label">Teacher *</label>
              {loadingTeachers ? (
                <p className="sc-panel-desc">Loading teachers...</p>
              ) : (
                <SearchableSelect options={allTeachers} value={addTeacherId}
                  onChange={(v) => { setAddTeacherId(v); setAddError(null); }}
                  placeholder="Select a teacher..." />
              )}
            </div>
            {addError && <p className="sc-panel-error">{addError}</p>}
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => setShowAddPanel(false)} disabled={adding}>Cancel</Button>
            <Button onClick={handleAddTeacher} disabled={adding || loadingTeachers || !addClassId || !addTeacherId}>
              {adding ? "Assigning..." : "Assign Teacher"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Deactivate Panel */}
      <SlideInMenu isShow={showDeactivatePanel} onClose={() => { setShowDeactivatePanel(false); setDeactivateTarget(null); }} width="420px">
        <div className="sc-panel">
          <div className="sc-panel-header danger">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" strokeWidth="1.7"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>Deactivate Teacher Assignment</h2>
                <p>The assignment will be marked inactive</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">
              {deactivateTarget?.teacher_name} — {deactivateTarget?.class_name || "this class"}
            </div>
            <div className="sc-panel-warn">⚠️ You can restore this assignment later.</div>
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => { setShowDeactivatePanel(false); setDeactivateTarget(null); }} disabled={deactivating}>Cancel</Button>
            <Button variant="danger" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Delete Panel */}
      <SlideInMenu isShow={showDeletePanel} onClose={() => { setShowDeletePanel(false); setDeleteTarget(null); }} width="420px">
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
                <h2>Delete Teacher Assignment</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">
              {deleteTarget?.teacher_name} — {deleteTarget?.class_name || "this class"}
            </div>
            <div className="sc-panel-danger">This will permanently remove the assignment record.</div>
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => { setShowDeletePanel(false); setDeleteTarget(null); }} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SubjectTeachers;
