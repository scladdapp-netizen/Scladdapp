import { useState, useRef } from "react";
import { Routes, Route, useParams, useLocation } from "react-router-dom";
import ClassDashboardSidebar from "./ClassDashboardSidebar";
import StudentDetailTopTab   from "../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import ClassInfo             from "./pages/ClassInfo/ClassInfo";
import ClassSubjects         from "./pages/ClassSubjects/ClassSubjects";
import ClassResources        from "./pages/ClassResources/ClassResources";
import SessionStudents       from "./pages/SessionStudents/SessionStudents";
import SessionTimetable      from "./pages/SessionTimetable/SessionTimetable";
import SessionAttendance     from "./pages/SessionAttendance/SessionAttendance";
import useFetchClassDetail   from "../../../../api_call/useFetchClassDetail";
import "../../../../pages/AdminSec/AdminLayout/UnifiedLayout.css";

const NON_SESSION_TABS = [
  { label: "Class Info",      link: "/info" },
  { label: "Class Subjects",  link: "/subjects" },
  { label: "Class Resources", link: "/resources" },
];

const SESSION_TABS = [
  { label: "Students",   link: "/students" },
  { label: "Timetable",  link: "/timetable" },
  { label: "Attendance", link: "/attendance" },
];

const ClassDashboard = () => {
  const { schoolId, classId } = useParams();
  const location = useLocation();
  const { classData, loading } = useFetchClassDetail(schoolId, classId);

  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  const sessions = classData?.sessions || [];
  const cls      = classData?.class || classData;
  const title    = cls?.class_name || "Class";
  const subtitle = cls ? `${cls.class_code || ""} • ${cls.is_active ? "Active" : "Inactive"}` : "";

  // Detect session route by checking if path ends with a session nav id
  const base = `/teacher/${schoolId}/class/${classId}`;
  const afterBase = location.pathname.replace(base, "");
  const SESSION_NAV_IDS = ["students", "timetable", "attendance"];
  const isSessionRoute = SESSION_NAV_IDS.some((id) => afterBase === `/${id}`);
  const activeSubseasion = isSessionRoute ? location.state?.subseasion : null;

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
    return <div style={{ padding: "32px", color: "#6b7280" }}>Loading class...</div>;
  }

  return (
    <div
      className="apt_main"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="apt_drag_handle" onClick={() => setOpen(true)}>
        <div className="apt_mb" />
      </div>

      <div className={`apt_left ${open ? "open" : ""}`}>
        <ClassDashboardSidebar sessionData={sessions} />
      </div>

      <div className="apt_right" onClick={() => open && setOpen(false)}>
        {isSessionRoute ? (
          <StudentDetailTopTab
            title={sessionTitle}
            subtitle={sessionSubtitle}
            route={SESSION_TABS}
          >
            <Routes>
              <Route path="/students"   element={<SessionStudents />} />
              <Route path="/timetable"  element={<SessionTimetable />} />
              <Route path="/attendance" element={<SessionAttendance />} />
            </Routes>
          </StudentDetailTopTab>
        ) : (
          <StudentDetailTopTab
            title={title}
            subtitle={subtitle}
            route={NON_SESSION_TABS}
          >
            <Routes>
              <Route path="/"          element={<ClassInfo classData={classData} />} />
              <Route path="/info"      element={<ClassInfo classData={classData} />} />
              <Route path="/subjects"  element={<ClassSubjects classData={classData} />} />
              <Route path="/resources" element={<ClassResources classData={classData} />} />
            </Routes>
          </StudentDetailTopTab>
        )}
      </div>
    </div>
  );
};

export default ClassDashboard;
