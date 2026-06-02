import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./SubjectClasses.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import useSubjectClasses from "../../../../../api_call/useSubjectClasses";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";

const StatusBadge = ({ active }) => (
  <span className={`sc-status-badge ${active ? "active" : "inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const SubjectClasses = ({ subjectData }) => {
  const { subjectId, schoolId } = useParams();
  const navigate = useNavigate();
  const { getClassesBySubject, getAllClasses, assignClassToSubject, deactivateClassAssignment, deleteClassAssignment, restoreClassAssignment } = useSubjectClasses();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Add class panel state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Deactivate panel state
  const [showDeactivatePanel, setShowDeactivatePanel] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  // Delete panel state
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reactivate state
  const [reactivating, setReactivating] = useState(null); // stores assignment_id being reactivated

  const subjectName = subjectData?.subject?.subject_name || "Subject";

  const loadAssignments = () => {
    if (!subjectId) return;
    setLoading(true);
    getClassesBySubject(subjectId).then((res) => {
      if (res.success) setAssignments(res.data);
      else setError(res.message || "Failed to load classes");
      setLoading(false);
    });
  };

  useEffect(() => { loadAssignments(); }, [subjectId]);

  const openAddPanel = () => {
    if (!canEdit) {
      addNotification("You do not have permission to add classes.", "error");
      return;
    }
    setSelectedClassId("");
    setAddError(null);
    setAllClasses([]);
    setShowAddPanel(true);
    setLoadingClasses(true);
    getAllClasses(schoolId).then((res) => {
      setLoadingClasses(false);
      if (res.success) {
        setAllClasses(res.data || res.classes || []);
      } else {
        addNotification(res.message || "Failed to load classes", "error");
      }
    });
  };

  const handleAddClass = async () => {
    if (!selectedClassId) { setAddError("Please select a class"); return; }
    setAdding(true);
    setAddError(null);
    const res = await assignClassToSubject({
      subject_id: subjectId,
      class_id: selectedClassId,
      school_id: schoolId,
    });
    setAdding(false);
    if (res.success) {
      setShowAddPanel(false);
      addNotification("Class assigned successfully", "success");
      loadAssignments();
    } else {
      setAddError(res.message || "Failed to assign class");
    }
  };

  const openDeactivatePanel = (e, assignment) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to deactivate class assignments.", "error");
      return;
    }
    setDeactivateTarget(assignment);
    setShowDeactivatePanel(true);
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    const res = await deactivateClassAssignment(deactivateTarget.assignment_id);
    setDeactivating(false);
    if (res.success) {
      setShowDeactivatePanel(false);
      setDeactivateTarget(null);
      addNotification("Class assignment deactivated", "success");
      loadAssignments();
    } else {
      addNotification(res.message || "Failed to deactivate", "error");
    }
  };

  const openDeletePanel = (e, assignment) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to delete class assignments.", "error");
      return;
    }
    setDeleteTarget(assignment);
    setShowDeletePanel(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteClassAssignment(deleteTarget.assignment_id);
    setDeleting(false);
    if (res.success) {
      setShowDeletePanel(false);
      setDeleteTarget(null);
      addNotification("Class assignment deleted", "success");
      loadAssignments();
    } else {
      addNotification(res.message || "Failed to delete", "error");
    }
  };

  const handleReactivate = async (e, assignment) => {
    e.stopPropagation();
    if (!canEdit) {
      addNotification("You do not have permission to reactivate class assignments.", "error");
      return;
    }
    setReactivating(assignment.assignment_id);
    const res = await restoreClassAssignment(assignment.assignment_id);
    setReactivating(null);
    if (res.success) {
      addNotification("Class assignment reactivated", "success");
      loadAssignments();
    } else {
      addNotification(res.message || "Failed to reactivate", "error");
    }
  };

  const filtered = assignments.filter((a) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && a.is_active) ||
      (filter === "inactive" && !a.is_active);
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (a.class_name || "").toLowerCase().includes(q) ||
      (a.class_code || "").toLowerCase().includes(q) ||
      (a.class_id   || "").toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all:      assignments.length,
    active:   assignments.filter((a) => a.is_active).length,
    inactive: assignments.filter((a) => !a.is_active).length,
  };

  const handleClassClick = (assignment) => {
    navigate(`/admin/${schoolId}/Class/${assignment.class_id}/overview`);
  };

  // Filter out already-assigned classes from the dropdown
  const assignedClassIds = new Set(assignments.map((a) => a.class_id));
  const availableClasses = allClasses.filter((c) => !assignedClassIds.has(c.class_id));

  if (loading) return <InnerTabCon><LoadingData message="Loading classes..." /></InnerTabCon>;
  if (error)   return <InnerTabCon><div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>{error}</div></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="subjectClasses">
        {/* Header */}
        <div className="scHeader">
          <div className="scHeaderLeft">
            <h2 className="scTitle">Classes — {subjectName}</h2>
            <p className="scSubtitle">
              {counts.active} active · {counts.inactive} inactive · {counts.all} total
            </p>
          </div>
          <div className="scHeaderRight">
            <Button variant="primary" onClick={openAddPanel}>Add Class</Button>
          </div>
        </div>

        {/* Search */}
        <div className="scSearchContainer">
          <div className="scSearchInputWrapper">
            <input
              type="text"
              placeholder="Search by class name or code..."
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
            <h3>No classes found</h3>
            <p>{search ? `No results for "${search}"` : "No classes assigned to this subject yet."}</p>
          </div>
        ) : (
          <div className="scClassesList">
            {filtered.map((a) => (
              <div
                key={a.assignment_id}
                className={`scClassCard ${!a.is_active ? "inactive" : ""}`}
                onClick={() => handleClassClick(a)}
              >
                <div className="scClassHeader">
                  <div className="scClassInfo">
                    <div className="scClassTitleRow">
                      <h3 className="scClassName">{a.class_name || "—"}</h3>
                      <StatusBadge active={a.is_active} />
                    </div>
                    <p className="scClassId">Code: {a.class_code || "—"} · ID: {a.class_id}</p>
                  </div>
                </div>

                <div className="scClassBody">
                  <div className="scClassDetails">
                    <div className="scDetailItem">
                      <span className="scDetailLabel">Assigned:</span>
                      <span className="scDetailValue">
                        {a.start_date ? new Date(a.start_date).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    {a.end_date && (
                      <div className="scDetailItem">
                        <span className="scDetailLabel">End Date:</span>
                        <span className="scDetailValue">
                          {new Date(a.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {a.notes && (
                      <div className="scDetailItem">
                        <span className="scDetailLabel">Notes:</span>
                        <span className="scDetailValue">{a.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="scClassFooter">
                  <div className="scViewDetails">
                    <span>View Class Profile</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {a.is_active ? (
                    <button className="sc-action-btn deactivate" onClick={(e) => openDeactivatePanel(e, a)}>
                      Deactivate
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="sc-action-btn reactivate" onClick={(e) => handleReactivate(e, a)} disabled={reactivating === a.assignment_id}>
                        {reactivating === a.assignment_id ? "Reactivating..." : "Reactivate"}
                      </button>
                      <button className="sc-action-btn delete" onClick={(e) => openDeletePanel(e, a)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Class Panel */}
      <SlideInMenu isShow={showAddPanel} onClose={() => setShowAddPanel(false)} width="420px">
        <div className="sc-panel">
          <div className="sc-panel-header default">
            <span className="sc-panel-header-deco" aria-hidden="true" />
            <div className="sc-panel-header-content">
              <div className="sc-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="sc-panel-header-text">
                <h2>Add Class to Subject</h2>
                <p>Assign a class to {subjectName}</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-field">
              <label className="sc-field-label">Select Class</label>
              {loadingClasses ? (
                <p className="sc-panel-desc">Loading classes...</p>
              ) : (
                <select className="sc-field-select" value={selectedClassId}
                  onChange={(e) => { setSelectedClassId(e.target.value); setAddError(null); }}>
                  <option value="">— Choose a class —</option>
                  {availableClasses.map((c) => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_name}{c.class_code ? ` (${c.class_code})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {!loadingClasses && availableClasses.length === 0 && allClasses.length > 0 && (
              <p className="sc-panel-warn">All classes are already assigned to this subject.</p>
            )}
            {addError && <p className="sc-panel-error">{addError}</p>}
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => setShowAddPanel(false)}>Cancel</Button>
            <Button onClick={handleAddClass} disabled={adding || loadingClasses}>
              {adding ? "Adding..." : "Add Class"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Delete Confirmation Panel */}
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
                <h2>Delete Class Assignment</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">{deleteTarget?.class_name || "This class"}</div>
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

      {/* Deactivate Confirmation Panel */}
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
                <h2>Deactivate Class Assignment</h2>
                <p>The assignment will be marked inactive</p>
              </div>
            </div>
          </div>
          <div className="sc-panel-body">
            <div className="sc-panel-name">{deactivateTarget?.class_name || "This class"}</div>
            <div className="sc-panel-warn">⚠️ This will stop the class from being associated with this subject. You can restore it later.</div>
          </div>
          <div className="sc-panel-footer">
            <Button variant="secondary" onClick={() => { setShowDeactivatePanel(false); setDeactivateTarget(null); }} disabled={deactivating}>Cancel</Button>
            <Button variant="danger" onClick={handleDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SubjectClasses;
