import { useState, useEffect } from "react";
import "./SubjectDetailSaidBar.css";
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
  { id: "classes", label: "Classes", icon: Icons.Class },
  { id: "teachers", label: "Teachers", icon: Icons.Identity },
  { id: "books", label: "Books", icon: Icons.Report },
  { id: "curriculum", label: "Curriculum", icon: Icons.Class },
  { id: "assessments", label: "Assessments", icon: Icons.Report },
  { id: "materials", label: "Materials", icon: Icons.Report },
];

const subjectInfoItems = [
  { id: "overview", label: "Overview", icon: Icons.Identity },
  { id: "resources", label: "Resources", icon: Icons.AdmissionHistory },
];

const SubjectDetailSaidBar = () => {
  const { subseasion, subjectId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSession, setExpandedSession] = useState(subseasion || null);
  const [isSubjectInfoExpanded, setIsSubjectInfoExpanded] = useState(
    !subseasion
  );

  // Sync expanded session with URL parameter
  useEffect(() => {
    setExpandedSession(subseasion || null);
    // Collapse Subject Info when a session is active
    setIsSubjectInfoExpanded(!subseasion);
  }, [subseasion]);

  // Function to check if subject info item is active
  const isSubjectInfoItemActive = (itemId) => {
    if (itemId === "overview") {
      // Overview is active when we're at the base subject path or explicitly at /overview
      return (
        (location.pathname ===
          `/admin/${schoolId || "323232323"}/subjects/${subjectId}` ||
          location.pathname ===
            `/admin/${
              schoolId || "323232323"
            }/subjects/${subjectId}/overview`) &&
        !subseasion
      );
    }
    return (
      location.pathname.includes(`/subjects/${subjectId}/${itemId}`) &&
      !subseasion
    );
  };

  // Function to check if navigation item is active
  const isNavigationItemActive = (navId) => {
    return location.pathname.includes(`/${subseasion}/${navId}`);
  };

  const handleSessionClick = (sessionId) => {
    console.log("Session clicked:", sessionId);
    console.log("Current expandedSession:", expandedSession);
    console.log("Current subseasion from URL:", subseasion);

    // Expand/collapse the session
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      // Navigate back to subject info when collapsing
      navigate(`/admin/${schoolId || "323232323"}/subjects/${subjectId}`);
    } else {
      setExpandedSession(sessionId);
      // Navigate to the session's default page (classes) when expanding
      const newUrl = `/admin/${
        schoolId || "323232323"
      }/subjects/${subjectId}/${sessionId}/classes`;
      console.log("Navigating to:", newUrl);
      navigate(newUrl);
    }
  };

  const handleSubjectInfoClick = () => {
    // Toggle Subject Info expansion
    if (isSubjectInfoExpanded) {
      setIsSubjectInfoExpanded(false);
    } else {
      setIsSubjectInfoExpanded(true);
      // Navigate to overview when expanding
      handleSubjectInfoItemClick("overview");
    }
  };

  const handleSubjectInfoItemClick = (itemId) => {
    // Navigate to subject info page (no subsession ID)
    if (itemId === "overview") {
      // For overview, navigate to the base subject path
      navigate(`/admin/${schoolId || "323232323"}/subjects/${subjectId}`);
    } else {
      // For other items like resources
      navigate(
        `/admin/${schoolId || "323232323"}/subjects/${subjectId}/${itemId}`
      );
    }
  };

  const handleNavigationItemClick = (navId) => {
    console.log("Navigation item clicked:", navId);
    console.log("Current expandedSession:", expandedSession);

    // Navigate to session-specific page (with subsession ID)
    if (expandedSession) {
      const newUrl = `/admin/${
        schoolId || "323232323"
      }/subjects/${subjectId}/${expandedSession}/${navId}`;
      console.log("Navigating to:", newUrl);
      navigate(newUrl);
    }
  };

  return (
    <div className="subjectDetailSaidBar">
      {/* Subject Info Section */}
      <div className="subjectInfoSection">
        <div className="sessionFolder">
          <div
            className="subjectDetailSaidBar_item"
            onClick={handleSubjectInfoClick}
          >
            <div className="ind"></div>

            <div className="sessionContent">
              <Icons.Home size={16} color="#6b7280" />
              <div className="sessionText">
                <p className="seasionname active_ssd_seasion">Subject Info</p>
              </div>
            </div>
          </div>

          {/* Subject Info Navigation items - only show when expanded */}
          {isSubjectInfoExpanded && (
            <div className="sessionNavigation">
              {subjectInfoItems.map((navItem) => (
                <div
                  key={navItem.id}
                  className={`sdsbitem ${
                    isSubjectInfoItemActive(navItem.id) ? "active" : ""
                  }`}
                  onClick={() => handleSubjectInfoItemClick(navItem.id)}
                >
                  <navItem.icon
                    size={18}
                    color={
                      isSubjectInfoItemActive(navItem.id)
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
      </div>

      {/* Sessions List with nested navigation */}
      <div className="sessionsSection">
        <div className="sessionSectionHeader">
          <p className="sectionTitle">Session Navigation</p>
        </div>
        {data.map((item) => (
          <div key={item.subseasionId} className="sessionFolder">
            <div
              className="subjectDetailSaidBar_item"
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

export default SubjectDetailSaidBar;
