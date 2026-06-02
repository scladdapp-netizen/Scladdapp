import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useFetchStudentDetail from "../../../../../api_call/useFetchStudentDetail";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import "./SessionList.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS_CLASS = {
  active:    "sl-status-active",
  draft:     "sl-status-draft",
  completed: "sl-status-completed",
  archived:  "sl-status-archived",
};

const SessionList = () => {
  const { studentId, schoolId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use the same student detail hook as Session.jsx — already filters to student's sessions
  const sid = user?.student?.student_id || studentId;
  const { studentData, loading } = useFetchStudentDetail(schoolId, sid);

  // studentData.sessions are already filtered to sessions the student has records in
  const sessions = (studentData?.sessions || [])
    .slice()
    .sort((a, b) => new Date(b.session_start_date) - new Date(a.session_start_date));

  const handleSubsessionClick = (subsessionId) => {
    navigate(`/student/${studentId}/school/${schoolId}/session/${subsessionId}/class`);
  };

  if (loading) return <LoadingData message="Loading sessions..." />;

  return (
    <InnerTabCon>
      <div className="sl-container">
        <div className="sl-header">
          <h2 className="sl-title">Academic Sessions</h2>
          <p className="sl-subtitle">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
        </div>

        {sessions.length === 0 ? (
          <div className="sl-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="sl-empty-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <p>No academic sessions found.</p>
          </div>
        ) : (
          <div className="sl-sessions">
            {sessions.map((session) => {
              const today = new Date(); today.setHours(0,0,0,0);
              const isCurrentSession =
                session.session_start_date && session.session_end_date
                  ? today >= new Date(session.session_start_date) && today <= new Date(session.session_end_date)
                  : false;

              return (
                <div key={session.session_id} className={`sl-session ${isCurrentSession ? "sl-session-current" : ""}`}>
                  {/* Session header */}
                  <div className="sl-session-header">
                    <div className="sl-session-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.7"/>
                      </svg>
                    </div>
                    <div className="sl-session-info">
                      <div className="sl-session-name-row">
                        <h3 className="sl-session-name">{session.session_name}</h3>
                        {isCurrentSession && <span className="sl-current-dot" title="Current session"/>}
                      </div>
                      <p className="sl-session-dates">{fmt(session.session_start_date)} – {fmt(session.session_end_date)}</p>
                    </div>
                  </div>

                  {/* Subsessions */}
                  {session.subsessions?.length > 0 ? (
                    <div className="sl-subsessions">
                      {session.subsessions.map((sub) => (
                        <button
                          key={sub.subsession_id}
                          className="sl-sub"
                          onClick={() => handleSubsessionClick(sub.subsession_id)}
                        >
                          <div className="sl-sub-left">
                            <span className="sl-sub-name">{sub.subsession_name}</span>
                          </div>
                          <div className="sl-sub-right">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="sl-no-subs">No terms for this session.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </InnerTabCon>
  );
};

export default SessionList;
