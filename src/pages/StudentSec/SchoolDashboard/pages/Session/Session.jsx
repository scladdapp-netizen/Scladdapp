import { useState, useRef } from "react";
import { Routes, Route, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useFetchStudentDetail from "../../../../../api_call/useFetchStudentDetail";
import SessionSidebar from "./SessionSidebar";
import StudentDetailTopTab from "../../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import Class         from "./pages/Class";
import ClassSubjects  from "./pages/ClassSubjects";
import ClassTimetable from "./pages/ClassTimetable";
import Attendance     from "./pages/Attendance";
import Report         from "./pages/Report";
import Events         from "./pages/Events";
import Calendar       from "./pages/Calendar";
import LoadingData    from "../../../../../components/LoadingData/LoadingData";
import "../../../../AdminSec/AdminLayout/UnifiedLayout.css";

const Session = () => {
  const { studentId, schoolId } = useParams();
  const { user } = useAuth();
  const location = useLocation();

  const sid = user?.student?.student_id || studentId;
  const { studentData, loading } = useFetchStudentDetail(schoolId, sid);

  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  const sessions = studentData?.sessions || [];

  const handleTouchStart = (e) => { startX.current = e.touches[0].clientX; };
  const handleTouchMove  = (e) => { if (startX.current < 20 && e.touches[0].clientX > 80) setOpen(true); };
  const handleTouchEnd   = () => { startX.current = 0; };

  // Detect if a subseasion is selected from the URL
  const parts = location.pathname.split("/session/");
  const subseasionId = parts[1]?.split("/")[0];
  const hasSubseasion = !!subseasionId;

  // Find session/subsession names for the title
  let sessionTitle = "Session";
  let sessionSubtitle = "Select a tab to view details";
  if (hasSubseasion) {
    for (const s of sessions) {
      const sub = s.subsessions?.find((ss) => ss.subsession_id === subseasionId);
      if (sub) {
        sessionTitle = s.session_name;
        sessionSubtitle = sub.subsession_name;
        break;
      }
    }
  }

  if (loading) return <LoadingData message="Loading sessions..." />;

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
        <SessionSidebar sessionData={sessions} activeSubseasion={subseasionId} />
      </div>

      <div className="apt_right" onClick={() => open && setOpen(false)}>
        {hasSubseasion ? (
          <StudentDetailTopTab
            title={sessionTitle}
            subtitle={sessionSubtitle}
            route={[
              { label: "Class",      link: "/class" },
              { label: "Subjects",   link: "/subjects" },
              { label: "Timetable",  link: "/timetable" },
              { label: "Attendance", link: "/attendance" },
              { label: "Report",     link: "/report" },
              { label: "Events",     link: "/events" },
              { label: "Calendar",   link: "/calendar" },
            ]}
          >
            <Routes>
              <Route path="/:subseasion/class"      element={<Class />} />
              <Route path="/:subseasion/subjects"   element={<ClassSubjects />} />
              <Route path="/:subseasion/timetable"  element={<ClassTimetable />} />
              <Route path="/:subseasion/attendance" element={<Attendance />} />
              <Route path="/:subseasion/report"     element={<Report />} />
              <Route path="/:subseasion/events"     element={<Events />} />
              <Route path="/:subseasion/calendar"   element={<Calendar />} />
            </Routes>
          </StudentDetailTopTab>
        ) : (
          <Routes>
            <Route path="/" element={
              <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Select a subsession from the sidebar</p>
              </div>
            } />
          </Routes>
        )}
      </div>
    </div>
  );
};

export default Session;
