import { useState } from "react";
import "./AdminDetailSaidBar.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";

const sessionData = [
  {
    name: "2024-2025",
    subseasionname: "First Term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2024-2025",
    subseasionname: "Second Term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-2025",
    subseasionname: "Third Term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2023-2024",
    subseasionname: "First Term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2023-2024",
    subseasionname: "Third Term",
    subseasionId: "2423243522432524",
  },
];

const sessionNavigationItems = [
  { id: "activity", label: "Activity", icon: Icons.Report },
];

const adminInfoItems = [
  { id: "identity", label: "Identity", icon: Icons.Identity },
  { id: "credentials", label: "Credentials", icon: Icons.Disciplinary },
  { id: "security", label: "Security", icon: Icons.Guardians },
];

const AdminDetailSaidBar = () => {
  const { subseasion, adminId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSession, setExpandedSession] = useState(subseasion);
  const [expandedAdminInfo, setExpandedAdminInfo] = useState(false);

  // Function to check if admin info item is active
  const isAdminInfoItemActive = (itemId) => {
    return (
      location.pathname.includes(`/admins/${adminId}/${itemId}`) && !subseasion
    );
  };

  // Function to check if navigation item is active
  const isNavigationItemActive = (navId) => {
    return location.pathname.includes(`/${subseasion}/${navId}`);
  };

  const handleSessionClick = (sessionId) => {
    // Only expand/collapse, don't navigate
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
    }
  };

  const handleAdminInfoClick = () => {
    // Navigate to default admin info page (identity)
    handleAdminInfoItemClick("identity");
  };

  const handleAdminInfoItemClick = (itemId) => {
    // Navigate to admin info page (no subsession ID)
    navigate(`/admin/${schoolId}/admins/${adminId}/${itemId}`);
  };

  const handleNavigationItemClick = (navId) => {
    // Navigate to session-specific page (with subsession ID)
    if (expandedSession) {
      navigate(
        `/admin/${schoolId}/admins/${adminId}/${expandedSession}/${navId}`
      );
    }
  };

  return (
    <div className="AdminDetailSaidBar">
      {/* Admin Info Section */}
      <div className="adminInfoSection">
        <div className="sessionFolder">
          <div
            className="AdminDetailSaidBar_item"
            onClick={handleAdminInfoClick}
          >
            <div className="ind"></div>

            <div className="sessionContent">
              <Icons.Guardians size={16} color="#6b7280" />
              <div className="sessionText">
                <p
                  className={`seasionname ${
                    expandedAdminInfo && "active_ssd_seasion"
                  }`}
                >
                  Admin Profile
                </p>
              </div>
            </div>
          </div>

          {/* Admin Info Navigation items */}
          <div className="sessionNavigation">
            {adminInfoItems.map((navItem) => (
              <div
                key={navItem.id}
                className={`sdsbitem ${
                  isAdminInfoItemActive(navItem.id) ? "active" : ""
                }`}
                onClick={() => handleAdminInfoItemClick(navItem.id)}
              >
                <navItem.icon
                  size={18}
                  color={
                    isAdminInfoItemActive(navItem.id) ? "#4f46e5" : "#6b7280"
                  }
                />
                <p>{navItem.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List with nested navigation */}
      <div className="sessionsSection">
        {sessionData.map((item) => (
          <div key={item.subseasionId} className="sessionFolder">
            <div
              className="AdminDetailSaidBar_item"
              onClick={() => handleSessionClick(item.subseasionId)}
            >
              {item.subseasionId === subseasion && <div className="ind"></div>}

              <div className="sessionContent">
                <Icons.Folder size={16} color="#6b7280" />
                <div className="sessionText">
                  <p
                    className={`seasionname ${
                      item.subseasionId === subseasion && "active_ssd_seasion"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p
                    className={`subseasionname ${
                      item.subseasionId === subseasion && "active_ssd_sub"
                    }`}
                  >
                    {item.subseasionname}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation items inside each session */}
            {expandedSession === item.subseasionId && (
              <div className="sessionNavigation">
                {sessionNavigationItems.map((navItem) => (
                  <div
                    key={navItem.id}
                    className={`sdsbitem ${
                      isNavigationItemActive(navItem.id) ? "active" : ""
                    }`}
                    onClick={() => handleNavigationItemClick(navItem.id)}
                  >
                    <navItem.icon
                      size={18}
                      color={
                        isNavigationItemActive(navItem.id)
                          ? "#4f46e5"
                          : "#6b7280"
                      }
                    />
                    <p>{navItem.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDetailSaidBar;
