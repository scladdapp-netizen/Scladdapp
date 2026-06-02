import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useSubsession } from "../../../../../../api_call/useSubsession";
import useStudentClassAssignment from "../../../../../../api_call/useStudentClassAssignment";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import "../../../../../TeacherSec/pages/SubjectDashboard/pages/SubjectInfo/SubjectInfo.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

const Class = () => {
  const { subseasion } = useParams();
  const { user } = useAuth();
  const { getSubsessionById } = useSubsession();

  const studentId = user?.student?.student_id;

  const [sessionId, setSessionId]         = useState(null);
  const [subsessionInfo, setSubsessionInfo] = useState(null);
  const [subLoading, setSubLoading]       = useState(true);

  useEffect(() => {
    if (!subseasion) return;
    setSubLoading(true);
    getSubsessionById(subseasion).then((res) => {
      if (res.success && res.data) {
        setSessionId(res.data.session_id);
        setSubsessionInfo(res.data);
      }
      setSubLoading(false);
    });
  }, [subseasion]);

  const { assignment, loading: assignLoading, error } = useStudentClassAssignment(studentId, sessionId);
  const loading = subLoading || assignLoading;

  if (loading) return <LoadingData message="Loading class info..." />;

  return (
    <InnerTabCon>
      {error || !assignment ? (
        <div className="si-empty">No class assignment found for this subsession.</div>
      ) : (
        <div className="si-overview">
          <div className="si-card">
            {/* Banner */}
            <div className="si-banner">
              <span className="si-banner-deco" aria-hidden="true" />
            </div>

            {/* Header */}
            <div className="si-header">
              <div className="si-header-left">
                <div className="si-icon-wrap">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="si-header-text">
                  <h3>{assignment.class_name || "N/A"}</h3>
                  <p className="si-subtitle">{assignment.class_code || ""}</p>
                  <div className="si-badges">
                    <span className="si-badge active">✓ Active</span>
                    {subsessionInfo?.term_name && (
                      <span className="si-badge">{subsessionInfo.term_name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="si-body">
              <div>
                <span className="si-section-title">Class Assignment</span>
                <div className="si-grid">
                  <InfoField label="Class Name"    value={assignment.class_name} />
                  <InfoField label="Class Code"    value={assignment.class_code} />
                  <InfoField label="Session"       value={assignment.session_name} />
                  <InfoField label="Subsession"    value={assignment.subsession_name || subsessionInfo?.term_name} />
                  <InfoField label="Assigned Via"  value={assignment.assignment_method} />
                  <InfoField label="Assigned Date" value={fmt(assignment.assignment_date)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </InnerTabCon>
  );
};

export default Class;
