import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";

const PROFILE_ITEMS = [
  { id: "info",      label: "Subject Info",      icon: Icons.Home },
  { id: "books",     label: "Subject Books",     icon: Icons.Class },
  { id: "resources", label: "Subject Resources", icon: Icons.Class },
];

const SESSION_NAV = [
  { id: "assessment", label: "Assessment", icon: Icons.Report },
];

const SubjectDashboardSidebar = ({ sessionData = [] }) => {
  const { schoolId, subjectId, assignmentId, subseasionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const activeSubseasion = subseasionId || null;
  const [expandedSub, setExpandedSub] = useState(activeSubseasion || null);

  const base = assignmentId
    ? `/teacher/${schoolId}/subject/${subjectId}/${assignmentId}`
    : `/teacher/${schoolId}/subject/${subjectId}`;

  const isProfileActive = (id) =>
    location.pathname === `${base}/${id}` && !activeSubseasion;

  const isSessionNavActive = (subId, navId) =>
    location.pathname === `${base}/${navId}/${subId}`;

  const handleProfileClick = (id) => navigate(`${base}/${id}`);

  const handleSubsessionClick = (subId) =>
    setExpandedSub((prev) => (prev === subId ? null : subId));

  const handleSessionNavClick = (subId, navId) =>
    navigate(`${base}/${navId}/${subId}`);

  return (
    <div className="unified-detail-sidebar">
      {/* Profile section */}
      <div className="profile-info-section">
        <div className="session-folder">
          <div className="sidebar-item" onClick={() => handleProfileClick("info")}>
            <div className="session-content">
              <Icons.Home size={16} color="#6b7280" />
              <div className="session-text">
                <p className="session-name">Subject Info</p>
              </div>
            </div>
          </div>
          <div className="session-navigation">
            {PROFILE_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`nav-item ${isProfileActive(item.id) ? "active" : ""}`}
                onClick={() => handleProfileClick(item.id)}
              >
                <item.icon
                  size={18}
                  color={isProfileActive(item.id) ? "#4f46e5" : "#6b7280"}
                />
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions section */}
      {sessionData.length > 0 && (
        <div className="sessions-section">
          {[...sessionData].reverse().map((session) => {
            const today = new Date(); today.setHours(0,0,0,0);
            const isActive = session.session_start_date && session.session_end_date
              ? today >= new Date(session.session_start_date) && today <= new Date(session.session_end_date)
              : false;
            return session.subsessions?.map((sub) => (
              <div key={sub.subsession_id} className="session-folder">
                <div className="sidebar-item" onClick={() => handleSubsessionClick(sub.subsession_id)}>
                  {sub.subsession_id === activeSubseasion && <div className="indicator" />}
                  <div className="session-content">
                    <Icons.Folder size={16} color="#6b7280" />
                    <div className="session-text">
                      <p className={`session-name ${sub.subsession_id === activeSubseasion ? "active-session" : ""}`}>
                        {session.session_name}
                        {isActive && <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#10b981", marginLeft:6, verticalAlign:"middle" }} />}
                      </p>
                      <p className={`subsession-name ${sub.subsession_id === activeSubseasion ? "active-subsession" : ""}`}>
                        {sub.subsession_name}
                      </p>
                    </div>
                  </div>
                </div>
                {expandedSub === sub.subsession_id && (
                  <div className="session-navigation">
                    {SESSION_NAV.map((nav) => (
                      <div key={nav.id} className={`nav-item ${isSessionNavActive(sub.subsession_id, nav.id) ? "active" : ""}`}
                        onClick={() => handleSessionNavClick(sub.subsession_id, nav.id)}>
                        <nav.icon size={18} color={isSessionNavActive(sub.subsession_id, nav.id) ? "#4f46e5" : "#6b7280"} />
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

export default SubjectDashboardSidebar;
