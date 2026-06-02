import { useState } from "react";
import "./UnifiedDetailSidebar.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";

const UnifiedDetailSidebar = ({
  entityType, // 'student', 'teacher', 'staff', 'class', 'subject', 'admin'
  profileItems, // Array of profile navigation items
  sessionItems, // Array of session-specific navigation items
  profileSectionTitle = "Profile", // Title for profile section
  profileSectionIcon = Icons.Home, // Icon for profile section
  sessionData = [], // Session data from backend
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Create a properly cased component reference
  const ProfileSectionIcon = profileSectionIcon;

  // Get the entity ID from params based on entity type
  const getEntityId = () => {
    switch (entityType) {
      case "student":
        return params.studentId;
      case "teacher":
        return params.teacherId;
      case "staff":
        return params.staffId;
      case "class":
        return params.classId;
      case "subject":
        return params.subjectId;
      case "admin":
        return params.adminId;
      default:
        return null;
    }
  };

  // Get the base route path based on entity type
  const getBasePath = () => {
    const { schoolId } = params;
    const entityId = getEntityId();

    switch (entityType) {
      case "student":
        return `/admin/${schoolId}/Profile/${entityId}`;
      case "teacher":
        return `/admin/${schoolId}/teachers/${entityId}`;
      case "staff":
        return `/admin/${schoolId}/staff/${entityId}`;
      case "class":
        return `/admin/${schoolId}/Class/${entityId}`;
      case "subject":
        return `/admin/${schoolId}/subjects/${entityId}`;
      case "admin":
        return `/admin/${schoolId}/admins/${entityId}`;
      default:
        return "";
    }
  };

  const { subseasion } = params;
  const [expandedSession, setExpandedSession] = useState(subseasion);
  const [expandedProfileInfo, setExpandedProfileInfo] = useState(false);

  // Function to check if profile item is active
  const isProfileItemActive = (itemId) => {
    return (
      location.pathname.includes(`/${getEntityId()}/${itemId}`) && !subseasion
    );
  };

  // Function to check if session navigation item is active
  const isSessionItemActive = (navId, sessionId) => {
    return location.pathname.includes(`/${sessionId}/${navId}`);
  };

  const handleSessionClick = (sessionId) => {
    // Only expand/collapse, don't navigate
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  const handleProfileInfoClick = () => {
    // Navigate to default profile page (first item)
    if (profileItems && profileItems.length > 0) {
      handleProfileItemClick(profileItems[0].id);
    }
  };

  const handleProfileItemClick = (itemId) => {
    // Navigate to profile page (no subsession ID)
    const basePath = getBasePath();
    navigate(`${basePath}/${itemId}`);
  };

  const handleSessionItemClick = (sessionId, navId) => {
    const basePath = getBasePath();
    navigate(`${basePath}/${sessionId}/${navId}`);
  };

  return (
    <div className="unified-detail-sidebar">
      {/* Profile Info Section */}
      {profileItems && profileItems.length > 0 && (
        <div className="profile-info-section">
          <div className="session-folder">
            <div className="sidebar-item" onClick={handleProfileInfoClick}>
              <div className="indicator"></div>

              <div className="session-content">
                <ProfileSectionIcon size={16} color="#6b7280" />
                <div className="session-text">
                  <p
                    className={`session-name ${
                      expandedProfileInfo && "active-session"
                    }`}
                  >
                    {profileSectionTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Navigation items */}
            <div className="session-navigation">
              {profileItems.map((navItem) => (
                <div
                  key={navItem.id}
                  className={`nav-item ${
                    isProfileItemActive(navItem.id) ? "active" : ""
                  }`}
                  onClick={() => handleProfileItemClick(navItem.id)}
                >
                  <navItem.icon size={16} color="currentColor" />
                  <p>{navItem.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sessions List with nested navigation */}
      {sessionItems && sessionItems.length > 0 && sessionData && sessionData.length > 0 && (
        <div className="sessions-section">
          {[...sessionData].reverse().map((session) => {
            // Determine if this session is currently active
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isActiveSession = session.session_start_date && session.session_end_date
              ? today >= new Date(session.session_start_date) && today <= new Date(session.session_end_date)
              : false;

            return (
              <div key={session.session_id}>
                {session.subsessions && session.subsessions.map((subsession) => (
                  <div key={subsession.subsession_id} className="session-folder">
                    <div
                      className="sidebar-item"
                      onClick={() => handleSessionClick(subsession.subsession_id)}
                    >
                      {subsession.subsession_id === subseasion && (
                        <div className="indicator"></div>
                      )}

                      <div className="session-content">
                        <Icons.Folder size={16} color="#6b7280" />
                        <div className="session-text">
                          <p className={`session-name ${subsession.subsession_id === subseasion ? "active-session" : ""}`}>
                            {session.session_name}
                            {isActiveSession && (
                              <span style={{
                                display: "inline-block", width: 7, height: 7,
                                borderRadius: "50%", background: "#10b981",
                                marginLeft: 6, verticalAlign: "middle",
                                flexShrink: 0,
                              }} title="Active session" />
                            )}
                          </p>
                          <p className={`subsession-name ${subsession.subsession_id === subseasion ? "active-subsession" : ""}`}>
                            {subsession.subsession_name}
                          </p>
                        </div>
                      </div>
                    </div>

                    {expandedSession === subsession.subsession_id && (
                      <div className="session-navigation">
                        {sessionItems.map((navItem) => (
                          <div
                            key={navItem.id}
                            className={`nav-item ${isSessionItemActive(navItem.id, subsession.subsession_id) ? "active" : ""}`}
                            onClick={() => handleSessionItemClick(subsession.subsession_id, navItem.id)}
                          >
                            <navItem.icon size={16} color="currentColor" />
                            <p>{navItem.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UnifiedDetailSidebar;
