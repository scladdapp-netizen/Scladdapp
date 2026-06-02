import { useState, useEffect } from "react";
import "./ClassStudentInfo.css";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import SearchableSelect from "../../../../../../components/SearchableSelect/SearchableSelect";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { useFetchStudentDetail } from "../../../../../../api_call";
import LoadingData from "../../../../../../components/LoadingData";

const ClassStudentInfo = () => {
  const { schoolId, studentId, subseasion } = useParams();
  const navigate = useNavigate();
  const [showChangeClassMenu, setShowChangeClassMenu] = useState(false);
  const { addNotification } = useNotification();

  // Permission helpers
  const { user } = useAuth();
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.students?.edit;
  const [classAssignment, setClassAssignment] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  const [changeClassForm, setChangeClassForm] = useState({
    newClass: "",
  });

  // Fetch student data including class assignments
  const { studentData, loading, error } = useFetchStudentDetail(
    schoolId,
    studentId
  );

  // Find the class assignment for the current subsession
  useEffect(() => {
    if (studentData && subseasion) {
      const { class_assignments = [], sessions = [] } = studentData;
      
      // Find the session that contains this subsession
      const currentSession = sessions.find((session) =>
        session.subsessions.some((sub) => sub.subsession_id === subseasion)
      );
      
      if (currentSession) {
        const currentSubsession = currentSession.subsessions.find(
          (sub) => sub.subsession_id === subseasion
        );
        
        setSessionInfo({
          session_id: currentSession.session_id,
          session_name: currentSession.session_name,
          subsession_id: currentSubsession?.subsession_id,
          subsession_name: currentSubsession?.subsession_name,
          term_status: currentSubsession?.term_status,
        });
        
        // Find class assignment for this session
        const assignment = class_assignments.find(
          (a) => a.session_id === currentSession.session_id && a.is_active
        );
        
        setClassAssignment(assignment);
      }
    }
  }, [studentData, subseasion]);

  // Show loading state
  if (loading) {
    return (
      <InnerTabCon>
        <LoadingData
          message="Loading class information..."
          style={{ margin: "40px 0" }}
        />
      </InnerTabCon>
    );
  }

  if (error) {
    return (
      <InnerTabCon>
        <div className="csi-state-box csi-state-error">
          <h3>Error Loading Class Information</h3>
          <p>{error}</p>
        </div>
      </InnerTabCon>
    );
  }

  if (!classAssignment) {
    return (
      <InnerTabCon>
        <div className="csi-state-box">
          <h3>No Class Assignment</h3>
          <p>This student is not assigned to any class for {sessionInfo?.session_name || "this session"}.</p>
        </div>
      </InnerTabCon>
    );
  }

  // Available classes for transfer
  const availableClasses = [
    {
      value: "Grade 10A",
      label: "Grade 10A - Science (Current)",
      disabled: true,
    },
    {
      value: "Grade 10B",
      label: "Grade 10B - Science",
      subtitle: "Mrs. Jennifer Davis - 28 students",
    },
    {
      value: "Grade 10C",
      label: "Grade 10C - Arts",
      subtitle: "Mr. Michael Brown - 30 students",
    },
    {
      value: "Grade 10D",
      label: "Grade 10D - Commerce",
      subtitle: "Mrs. Lisa Wilson - 25 students",
    },
    {
      value: "Grade 9A",
      label: "Grade 9A - General (Demotion)",
      subtitle: "Mr. Robert Taylor - 35 students",
    },
    {
      value: "Grade 11A",
      label: "Grade 11A - Science (Promotion)",
      subtitle: "Dr. Amanda Clark - 22 students",
    },
  ];

  const handleEditClass = () => {
    setShowEditMenu(true);
  };

  const handleChangeClass = () => {
    if (!canEdit) {
      addNotification("You do not have permission to change class.", "error");
      return;
    }
    setShowChangeClassMenu(true);
  };

  const handleChangeClassSubmit = () => {
    if (!changeClassForm.newClass) {
      addNotification("Please select a new class", "error");
      return;
    }

    // Simulate API call
    setTimeout(() => {
      const selectedClass = availableClasses.find(
        (c) => c.value === changeClassForm.newClass
      );

      addNotification(
        `Class change completed successfully! Student has been moved to ${selectedClass?.label}`,
        "success"
      );

      // Reset form and close menu
      setChangeClassForm({
        newClass: "",
      });
      setShowChangeClassMenu(false);

      // Show additional notification about next steps
      setTimeout(() => {
        addNotification(
          "The class teacher and academic coordinator have been notified about this change",
          "info"
        );
      }, 2000);
    }, 1000);
  };

  const handleFormChange = (field) => (value) => {
    setChangeClassForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <InnerTabCon>
      <div className="classStudentInfo">
        <div className="classHeader">
          <div className="classHeaderLeft">
            <h2 className="classTitle">
              {sessionInfo?.session_name || "Session"} — {sessionInfo?.subsession_name || "Term"}
            </h2>
            <p className="classSubtitle">Class assignment for this academic period</p>
          </div>
          <div className="classHeaderRight">
            {sessionInfo?.term_status === "active" && (
              <Button variant="secondary" onClick={handleChangeClass}>Change Class</Button>
            )}
          </div>
        </div>

        {/* Class Overview Card */}
        <div className="classOverview">
          <div className="overviewCard" onClick={() => navigate(`/admin/${schoolId}/Class/${classAssignment.class_id}`)}>
            <div className="overviewCardHeader">
              <span className="overviewHeaderDeco" aria-hidden="true" />
              <div className="overviewHeaderIcon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="overviewHeaderText">
                <h3>{classAssignment.class_name || "N/A"}</h3>
                <p>{classAssignment.session_name || "N/A"} · {classAssignment.subsession_name || "N/A"}</p>
              </div>
            </div>

            <div className="overviewCardBody">
              <div className="overviewGrid">
                <InfoField label="Class Name"         value={classAssignment.class_name || "N/A"} />
                <InfoField label="Session"            value={classAssignment.session_name || "N/A"} />
                <InfoField label="Term"               value={classAssignment.subsession_name || "N/A"} />
                <InfoField label="Assignment Method"  value={classAssignment.assignment_method || "N/A"} />
                <InfoField label="Assignment Date"    value={classAssignment.assignment_date ? new Date(classAssignment.assignment_date).toLocaleDateString() : "N/A"} />
                <InfoField label="Assigned By"        value={classAssignment.assigned_by || "N/A"} />
                {classAssignment.remarks && (
                  <InfoField label="Remarks" value={classAssignment.remarks} />
                )}
              </div>
            </div>

            <div className="overviewCardFooter">
              <span>View class profile</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Change Class Panel */}
        <SlideInMenu isShow={showChangeClassMenu} onClose={() => setShowChangeClassMenu(false)} width="560px">
          <div className="csp-container">
            <div className="csp-header">
              <span className="csp-header-deco" aria-hidden="true" />
              <div className="csp-header-content">
                <div className="csp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="csp-header-text">
                  <h2>Change Student Class</h2>
                  <p>Transfer to a different class this session</p>
                </div>
              </div>
            </div>

            <div className="csp-body">
              <div className="csi-current-class-box">
                <h4>Current Class</h4>
                <p className="csi-current-class-name">{classAssignment.class_name || "N/A"}</p>
                <p className="csi-current-class-session">Session: {classAssignment.session_name || "N/A"}</p>
              </div>

              <SearchableSelect
                label="New Class *"
                placeholder="Select new class for the student"
                options={availableClasses}
                value={changeClassForm.newClass}
                onChange={handleFormChange("newClass")}
                searchable={true}
              />

              <div className="csi-warn-box">
                ⚠️ This action will notify the current and new class teachers and the academic coordinator. Academic records will be transferred accordingly.
              </div>
            </div>

            <div className="csp-footer">
              <Button variant="secondary" onClick={() => { setShowChangeClassMenu(false); setChangeClassForm({ newClass: "" }); }}>Cancel</Button>
              <Button onClick={handleChangeClassSubmit} disabled={!changeClassForm.newClass}>Change Class</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default ClassStudentInfo;
