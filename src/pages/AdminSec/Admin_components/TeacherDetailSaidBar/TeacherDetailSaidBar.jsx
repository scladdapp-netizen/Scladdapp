import { useState } from "react";
import "./TeacherDetailSaidBar.css";
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

const teacherInfoItems = [
  { id: "identity", label: "Identity", icon: Icons.Identity },
  { id: "resources", label: "Resources", icon: Icons.Class },
  { id: "assigned-subjects", label: "Assigned Subjects", icon: Icons.Subject },
];

const TeacherDetailSaidBar = () => {
  const { subseasion, teacherId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSession, setExpandedSession] = useState(subseasion);
  const [expandedTeacherInfo, setExpandedTeacherInfo] = useState(false);

  // Function to check if teacher info item is active
  const isTeacherInfoItemActive = (itemId) => {
    return (
      location.pathname.includes(`/teachers/${teacherId}/${itemId}`) &&
      !subseasion
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

  const handleTeacherInfoClick = () => {
    // Navigate to default teacher info page (identity)
    handleTeacherInfoItemClick("identity");
  };

  const handleTeacherInfoItemClick = (itemId) => {
    // Navigate to teacher info page (no subsession ID)
    navigate(`/admin/${schoolId}/teachers/${teacherId}/${itemId}`);
  };

  const handleNavigationItemClick = (navId) => {
    // Navigate to session-specific page (with subsession ID)
    if (expandedSession) {
      navigate(
        `/admin/${schoolId}/teachers/${teacherId}/${expandedSession}/${navId}`
      );
    }
  };

  return (
    <div className="TeacherDetailSaidBar">
      {/* Teacher Info Section */}
      <div className="teacherInfoSection">
        <div className="sessionFolder">
          <div
            className="TeacherDetailSaidBar_item"
            onClick={handleTeacherInfoClick}
          >
            <div className="ind"></div>

            <div className="sessionContent">
              <Icons.Guardians size={16} color="#6b7280" />
              <div className="sessionText">
                <p
                  className={`seasionname ${
                    expandedTeacherInfo && "active_ssd_seasion"
                  }`}
                >
                  Teacher Profile
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Info Navigation items */}
          <div className="sessionNavigation">
            {teacherInfoItems.map((navItem) => (
              <div
                key={navItem.id}
                className={`sdsbitem ${
                  isTeacherInfoItemActive(navItem.id) ? "active" : ""
                }`}
                onClick={() => handleTeacherInfoItemClick(navItem.id)}
              >
                <navItem.icon
                  size={18}
                  color={
                    isTeacherInfoItemActive(navItem.id) ? "#4f46e5" : "#6b7280"
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
              className="TeacherDetailSaidBar_item"
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

export default TeacherDetailSaidBar;
