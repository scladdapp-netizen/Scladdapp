import { useState, useRef } from "react";
import { Routes, Route, useParams, useLocation } from "react-router-dom";
import SubjectDashboardSidebar from "./SubjectDashboardSidebar";
import StudentDetailTopTab from "../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import SubjectInfo      from "./pages/SubjectInfo/SubjectInfo";
import SubjectBooks     from "./pages/SubjectBooks/SubjectBooks";
import SubjectResources from "./pages/SubjectResources/SubjectResources";
import Assessment       from "./pages/Assessment/Assessment";
import useFetchSubjectDetail from "../../../../api_call/useFetchSubjectDetail";
import "../../../../pages/AdminSec/AdminLayout/UnifiedLayout.css";

const NON_SESSION_TABS = [
  { label: "Subject Info",      link: "/info" },
  { label: "Subject Books",     link: "/books" },
  { label: "Subject Resources", link: "/resources" },
];

const SESSION_TABS = [
  { label: "Assessment", link: "/assessment" },
];

const SubjectDashboard = () => {
  const { schoolId, subjectId, assignmentId } = useParams();
  const location = useLocation();
  const { subjectData, loading } = useFetchSubjectDetail(schoolId, subjectId);

  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  const sessions = subjectData?.sessions || [];
  const subject  = subjectData?.subject;
  const title    = subject?.subject_name || "Subject";
  const subtitle = subject ? `${subject.subject_code} • ${subject.is_active ? "Active" : "Inactive"}` : "";

  // Detect if a subsession is active from the URL
  const base = assignmentId
    ? `/teacher/${schoolId}/subject/${subjectId}/${assignmentId}`
    : `/teacher/${schoolId}/subject/${subjectId}`;
  const afterBase = location.pathname.replace(base, "");
  const isSessionRoute = afterBase.startsWith("/assessment/");
  const activeSubseasion = isSessionRoute ? afterBase.replace("/assessment/", "") : null;

  // Find session/subsession names for the session header
  let sessionTitle = title;
  let sessionSubtitle = subtitle;
  if (activeSubseasion) {
    for (const s of sessions) {
      const sub = s.subsessions?.find((ss) => ss.subsession_id === activeSubseasion);
      if (sub) {
        sessionTitle = s.session_name;
        sessionSubtitle = sub.subsession_name;
        break;
      }
    }
  }

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove  = (e) => {
    if (startX.current < 20 && e.touches[0].clientX > 80) setOpen(true);
  };
  const handleTouchEnd   = () => { startX.current = 0; };

  if (loading) {
    return <div style={{ padding: "32px", color: "#6b7280" }}>Loading subject...</div>;
  }

  return (
    <div
      className="apt_main"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile drag handle */}
      <div className="apt_drag_handle" onClick={() => setOpen(true)}>
        <div className="apt_mb" />
      </div>

      {/* Sidebar */}
      <div className={`apt_left ${open ? "open" : ""}`}>
        <SubjectDashboardSidebar sessionData={sessions} />
      </div>

      {/* Content */}
      <div className="apt_right" onClick={() => open && setOpen(false)}>
        {isSessionRoute ? (
          <StudentDetailTopTab
            title={sessionTitle}
            subtitle={sessionSubtitle}
            route={SESSION_TABS}
          >
            <Routes>
              <Route path="/assessment/:subseasionId" element={<Assessment subjectData={subjectData} />} />
            </Routes>
          </StudentDetailTopTab>
        ) : (
          <StudentDetailTopTab
            title={title}
            subtitle={subtitle}
            route={NON_SESSION_TABS}
          >
            <Routes>
              <Route path="/"          element={<SubjectInfo subjectData={subjectData} />} />
              <Route path="/info"      element={<SubjectInfo subjectData={subjectData} />} />
              <Route path="/books"     element={<SubjectBooks subjectData={subjectData} />} />
              <Route path="/resources" element={<SubjectResources subjectData={subjectData} />} />
            </Routes>
          </StudentDetailTopTab>
        )}
      </div>
    </div>
  );
};

export default SubjectDashboard;
