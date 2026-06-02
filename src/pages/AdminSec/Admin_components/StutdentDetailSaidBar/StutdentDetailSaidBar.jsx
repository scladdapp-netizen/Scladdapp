import { useState } from "react";
import "./StutdentDetailSaidBar.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";

const data = [
  {
    name: "2024-2023",
    subseasionname: "Frist term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2025-4664",
    subseasionname: " second term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-4242",
    subseasionname: " thurd term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2035-2424",
    subseasionname: " Frist term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2024-1322",
    subseasionname: " thurd term",
    subseasionId: "2423243522432524",
  },
];

const navigationItems = [
  { id: "class", label: "Class", icon: Icons.Class },
  { id: "attendance", label: "Attendance", icon: Icons.Attendance },
  { id: "report", label: "Report", icon: Icons.Report },
];

const studentInfoItems = [
  { id: "identity", label: "Identity", icon: Icons.Identity },
  { id: "guardians", label: "Guardians", icon: Icons.Guardians },
  { id: "health", label: "Health", icon: Icons.Health },
  {
    id: "admission-history",
    label: "Admission History",
    icon: Icons.AdmissionHistory,
  },
];

const StutdentDetailSaidBar = () => {
  const { subseasion, studentId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSession, setExpandedSession] = useState(subseasion);
  const [expandedStudentInfo, setExpandedStudentInfo] = useState(false);

  // Function to check if a route is active
  const isActiveRoute = (routePath) => {
    return location.pathname.endsWith(routePath);
  };

  // Function to check if student info item is active
  const isStudentInfoItemActive = (itemId) => {
    return (
      location.pathname.includes(`/Profile/${studentId}/${itemId}`) &&
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

  const handleStudentInfoClick = () => {
    // Only expand/collapse, don't navigate
    handleStudentInfoItemClick("identity");
  };

  const handleStudentInfoItemClick = (itemId) => {
    // Navigate to student info page (no subsession ID)
    navigate(`/admin/${schoolId}/Profile/${studentId}/${itemId}`);
  };

  const handleNavigationItemClick = (navId) => {
    // Navigate to session-specific page (with subsession ID)
    if (expandedSession) {
      navigate(
        `/admin/${schoolId}/Profile/${studentId}/${expandedSession}/${navId}`
      );
    }
  };

  return (
    <div className="StutdentDetailSaidBar">
      {/* Student Info Section */}
      <div className="studentInfoSection">
        <div className="sessionFolder">
          <div
            className="StutdentDetailSaidBar_item"
            onClick={handleStudentInfoClick}
          >
            <div className="ind"></div>

            <div className="sessionContent">
              <Icons.Home size={16} color="#6b7280" />
              <div className="sessionText">
                <p
                  className={`seasionname ${
                    expandedStudentInfo && "active_ssd_seasion"
                  }`}
                >
                  Student Info
                </p>
              </div>
            </div>
          </div>

          {/* Student Info Navigation items */}
          <div className="sessionNavigation">
            {studentInfoItems.map((navItem) => (
              <div
                key={navItem.id}
                className={`sdsbitem ${
                  isStudentInfoItemActive(navItem.id) ? "active" : ""
                }`}
                onClick={() => handleStudentInfoItemClick(navItem.id)}
              >
                <navItem.icon
                  size={18}
                  color={
                    isStudentInfoItemActive(navItem.id) ? "#4f46e5" : "#6b7280"
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
        {data.map((item) => (
          <div key={item.subseasionId} className="sessionFolder">
            <div
              className="StutdentDetailSaidBar_item"
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
                {navigationItems.map((navItem) => (
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

export default StutdentDetailSaidBar;
