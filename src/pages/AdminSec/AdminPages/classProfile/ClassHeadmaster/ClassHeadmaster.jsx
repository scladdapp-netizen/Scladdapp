import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ClassHeadmaster.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../components/infoField/InfoField";
import HeadmasterAssignment from "./HeadmasterAssignment";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useHeadmaster } from "../../../../../api_call/useHeadmaster";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";

const ClassHeadmaster = ({ classData, refreshClassData }) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getHeadmastersByClassId } = useHeadmaster();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const classInfo = classData?.class || classData || {};
  const classId = classInfo?.class_id;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignMenu, setShowAssignMenu] = useState(false);

  useEffect(() => { if (classId) fetchAssignments(); }, [classId]);

  const fetchAssignments = async () => {
    setLoading(true);
    const result = await getHeadmastersByClassId(classId);
    if (result.success) setAssignments(result.data || []);
    else addNotification(result.message || "Failed to load headmaster data", "error");
    setLoading(false);
  };

  const activeAssignment = assignments.find((a) => a.is_active === true);
  const history = assignments.filter((a) => !a.is_active);

  const fmt = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleSaveAssignment = async () => {
    await fetchAssignments();
    if (refreshClassData) refreshClassData();
    setShowAssignMenu(false);
  };

  if (loading) {
    return (
      <InnerTabCon>
        <LoadingData message="Loading headmaster data..." />
      </InnerTabCon>
    );
  }

  return (
    <InnerTabCon>
      <div className="classHeadmaster">

        {/* Header */}
        <div className="headmasterHeader">
          <div className="headmasterHeaderLeft">
            <h2 className="headmasterTitle">Class Headmaster</h2>
            <p className="headmasterSubtitle">
              {classInfo.class_name} · {classInfo.class_code} · Section {classInfo.class_section}
            </p>
          </div>
          <div className="headmasterHeaderRight">
            <Button onClick={() => {
              if (!canEdit) { addNotification("You do not have permission to assign a headmaster.", "error"); return; }
              setShowAssignMenu(true);
            }}>
              {activeAssignment ? "Change Headmaster" : "Assign Headmaster"}
            </Button>
          </div>
        </div>

        {/* Active Assignment Card */}
        {activeAssignment ? (
          <div className="currentAssignmentCard">
            {/* Banner */}
            <div className="chm-banner">
              <span className="chm-banner-deco" aria-hidden="true" />
            </div>

            {/* Card header */}
            <div className="chm-card-header">
              <div className="chm-avatar-wrap">
                <div className="chm-avatar">
                  {activeAssignment.teacher_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              </div>

              <div className="chm-card-name-wrap">
                <h3 className="chm-teacher-name">{activeAssignment.teacher_name}</h3>
                <div className="chm-teacher-meta">
                  <span className="chm-teacher-title">
                    {activeAssignment.teacher_job_title || activeAssignment.teacher_position || "Class Headmaster"}
                  </span>
                  <span className="chm-active-badge">
                    <span className="chm-active-dot" />
                    Active
                  </span>
                </div>
              </div>

              <div className="chm-card-actions">
                <Button variant="secondary" onClick={() => navigate(`/admin/${schoolId}/teachers/${activeAssignment.teacher_id}`)}>
                  View Profile
                </Button>
                {activeAssignment.teacher_email && (
                  <a href={`mailto:${activeAssignment.teacher_email}`} className="chm-contact-btn" title={activeAssignment.teacher_email}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
                {activeAssignment.teacher_phone && (
                  <a href={`tel:${activeAssignment.teacher_phone}`} className="chm-contact-btn" title={activeAssignment.teacher_phone}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="chm-card-body">
              <span className="chm-section-title">Assignment Details</span>
              <div className="chm-grid">
                <InfoField label="Email"           value={activeAssignment.teacher_email || "N/A"} />
                <InfoField label="Phone"           value={activeAssignment.teacher_phone || "N/A"} />
                <InfoField label="Gender"          value={activeAssignment.teacher_gender || "N/A"} />
                <InfoField label="Employment"      value={activeAssignment.teacher_employment_type || "N/A"} />
                <InfoField label="Assigned"        value={fmt(activeAssignment.start_date)} />
                <InfoField label="End Date"        value={activeAssignment.end_date ? fmt(activeAssignment.end_date) : "Ongoing"} />
                <InfoField label="Assigned By"     value={activeAssignment.assigned_by || "System"} />
                <InfoField label="Joining Date"    value={fmt(activeAssignment.teacher_joining_date)} />
              </div>
              {activeAssignment.notes && (
                <p className="chm-notes">{activeAssignment.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="chm-empty">
            <div className="chm-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>No Active Headmaster</h3>
            <p>This class does not have an active headmaster assigned.</p>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="chm-history">
            <span className="chm-history-title">Assignment History</span>
            <div className="chm-history-list">
              {history.map((a) => (
                <div key={a.assignment_id} className="chm-history-card">
                  <div className="chm-history-left">
                    <div className="chm-history-avatar">
                      {a.teacher_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="chm-history-name">{a.teacher_name}</p>
                      {(a.teacher_job_title || a.teacher_position) && (
                        <p className="chm-history-role">{a.teacher_job_title || a.teacher_position}</p>
                      )}
                      <p className="chm-history-dates">
                        {fmt(a.start_date)} — {a.end_date ? fmt(a.end_date) : "Present"}
                      </p>
                      {a.teacher_email && <p className="chm-history-email">{a.teacher_email}</p>}
                      {a.notes && <p className="chm-history-notes">{a.notes}</p>}
                    </div>
                  </div>
                  <span className="chm-inactive-badge">Inactive</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assign Panel */}
        <SlideInMenu isShow={showAssignMenu} onClose={() => setShowAssignMenu(false)} width="500px">
          <HeadmasterAssignment
            className={classInfo.class_name}
            classId={classId}
            onClose={() => setShowAssignMenu(false)}
            onSave={handleSaveAssignment}
            currentHeadmaster={activeAssignment
              ? { id: activeAssignment.teacher_id, fullName: activeAssignment.teacher_name, email: activeAssignment.teacher_email }
              : null}
          />
        </SlideInMenu>

      </div>
    </InnerTabCon>
  );
};

export default ClassHeadmaster;
