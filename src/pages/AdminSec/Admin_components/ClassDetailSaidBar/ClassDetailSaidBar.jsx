import { useState } from "react";
import "./ClassDetailSaidBar.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";

const data = [
  {
    name: "2024-2023",
    subseasionname: "First term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2025-4664",
    subseasionname: "Second term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-4242",
    subseasionname: "Third term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2035-2424",
    subseasionname: "First term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2024-1322",
    subseasionname: "Third term",
    subseasionId: "2423243522432524",
  },
];

const sessionNavigationItems = [
  { id: "students", label: "Students", icon: Icons.Identity },
  { id: "subjects", label: "Subjects", icon: Icons.Report },
  { id: "timetable", label: "Timetable", icon: Icons.Report },
  { id: "attendance", label: "Attendance", icon: Icons.Attendance },
];

const classInfoItems = [
  { id: "overview", label: "Overview", icon: Icons.Class },
  { id: "resources", label: "Resources", icon: Icons.AdmissionHistory },
  { id: "headmaster", label: "Headmaster", icon: Icons.Guardians },
];

const ClassDetailSaidBar = () => {
  const { subseasion, classId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSession, setExpandedSession] = useState(subseasion);

  // Function to check if class info item is active
  const isClassInfoItemActive = (itemId) => {
    if (itemId === "overview") {
      return (
        location.pathname.endsWith(`/Class/${classId}`) ||
        location.pathname.endsWith(`/Class/${classId}/overview`)
      );
    }
    return location.pathname.endsWith(`/Class/${classId}/${itemId}`);
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

  const handleClassInfoClick = () => {
    // Navigate to overview by default
    handleClassInfoItemClick("overview");
  };

  const handleClassInfoItemClick = (itemId) => {
    // Navigate to class info page (no subsession ID)
    navigate(`/admin/${schoolId || "323232323"}/Class/${classId}/${itemId}`);
  };

  const handleNavigationItemClick = (navId) => {
    // Navigate to session-specific page (with subsession ID)
    if (expandedSession) {
      navigate(
        `/admin/${
          schoolId || "323232323"
        }/Class/${classId}/${expandedSession}/${navId}`
      );
    }
  };

  return (
    <div className="classDetailSaidBar">
      {/* Class Info Section */}
      <div className="classInfoSection">
        <div className="sessionFolder">
          <div
            className="classDetailSaidBar_item"
            onClick={handleClassInfoClick}
          >
            <div className="ind"></div>

            <div className="sessionContent">
              <Icons.Home size={16} color="#6b7280" />
              <div className="sessionText">
                <p className="seasionname active_ssd_seasion">Class Info</p>
              </div>
            </div>
          </div>

          {/* Class Info Navigation items */}
          <div className="sessionNavigation">
            {classInfoItems.map((navItem) => (
              <div
                key={navItem.id}
                className={`sdsbitem ${
                  isClassInfoItemActive(navItem.id) ? "active" : ""
                }`}
                onClick={() => handleClassInfoItemClick(navItem.id)}
              >
                <navItem.icon
                  size={18}
                  color={
                    isClassInfoItemActive(navItem.id) ? "#4f46e5" : "#6b7280"
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
              className="classDetailSaidBar_item"
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

export default ClassDetailSaidBar;
