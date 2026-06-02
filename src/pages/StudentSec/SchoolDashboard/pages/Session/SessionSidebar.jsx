import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../../utils/icons";

const SESSION_NAV = [
  { id: "class",      label: "Class",      icon: Icons.Class },
  { id: "subjects",   label: "Subjects",   icon: Icons.Subject },
  { id: "timetable",  label: "Timetable",  icon: Icons.Calendar },
  { id: "attendance", label: "Attendance", icon: Icons.Attendance },
  { id: "report",     label: "Report",     icon: Icons.Report },
  { id: "events",     label: "Events",     icon: Icons.Event },
  { id: "calendar",   label: "Calendar",   icon: Icons.Calendar },
];

const SessionSidebar = ({ sessionData = [], activeSubseasion }) => {
  const { studentId, schoolId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const subseasion = activeSubseasion;
  const [expandedSub, setExpandedSub] = useState(activeSubseasion || null);

  // Auto-expand when activeSubseasion changes
  useEffect(() => {
    if (activeSubseasion) setExpandedSub(activeSubseasion);
  }, [activeSubseasion]);

  const base = `/student/${studentId}/school/${schoolId}/session`;

  const isNavActive = (subId, navId) =>
    location.pathname.includes(`/${subId}/${navId}`);

  const handleSubsessionClick = (subId) =>
    setExpandedSub((prev) => (prev === subId ? null : subId));

  const handleNavClick = (subId, navId) =>
    navigate(`${base}/${subId}/${navId}`);

  return (
    <div className="unified-detail-sidebar">
      {sessionData.length === 0 ? (
        <div style={{ padding: "16px 12px", fontSize: 13, color: "#9ca3af" }}>
          No sessions available
        </div>
      ) : (
        <div className="sessions-section">
          {[...sessionData].reverse().map((session) => {
            const today = new Date(); today.setHours(0,0,0,0);
            const isActive = session.session_start_date && session.session_end_date
              ? today >= new Date(session.session_start_date) && today <= new Date(session.session_end_date)
              : false;

            return session.subsessions?.map((sub) => (
              <div key={sub.subsession_id} className="session-folder">
                <div
                  className="sidebar-item"
                  onClick={() => handleSubsessionClick(sub.subsession_id)}
                >
                  {sub.subsession_id === subseasion && <div className="indicator" />}
                  <div className="session-content">
                    <Icons.Folder size={16} color="#6b7280" />
                    <div className="session-text">
                      <p className={`session-name ${sub.subsession_id === subseasion ? "active-session" : ""}`}>
                        {session.session_name}
                        {isActive && (
                          <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#10b981", marginLeft:6, verticalAlign:"middle" }} />
                        )}
                      </p>
                      <p className={`subsession-name ${sub.subsession_id === subseasion ? "active-subsession" : ""}`}>
                        {sub.subsession_name}
                      </p>
                    </div>
                  </div>
                </div>

                {expandedSub === sub.subsession_id && (
                  <div className="session-navigation">
                    {SESSION_NAV.map((nav) => (
                      <div
                        key={nav.id}
                        className={`nav-item ${isNavActive(sub.subsession_id, nav.id) ? "active" : ""}`}
                        onClick={() => handleNavClick(sub.subsession_id, nav.id)}
                      >
                        <nav.icon
                          size={18}
                          color={isNavActive(sub.subsession_id, nav.id) ? "#4f46e5" : "#6b7280"}
                        />
                        <p>{nav.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ));
          })}
        </div>
      )}
    </div>
  );
};

export default SessionSidebar;
