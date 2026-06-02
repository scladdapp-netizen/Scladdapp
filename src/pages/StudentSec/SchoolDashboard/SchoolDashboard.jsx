import { useState } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import StudentTopbar  from "./StudentTopbar";
import StudentSidebar from "./StudentSidebar";
import SessionList  from "./pages/Session/SessionList";
import Session      from "./pages/Session/Session";
import SchoolInfo   from "./pages/SchoolInfo/SchoolInfo";
import Bill         from "./pages/Bill/Bill";
import Alumni       from "./pages/Alumni/Alumni";
import Notification from "./pages/Notification/Notification";
import "../../TeacherSec/TeacherSec.css";

const SchoolDashboard = () => {
  const { studentId, schoolId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const base = `/student/${studentId}/school/${schoolId}`;

  return (
    <div className="t_layout">
      <StudentTopbar
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuClick={() => setIsMobileMenuOpen((p) => !p)}
      />
      <div className="t_said_n_content">
        <StudentSidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div
          className="t_content"
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          <Routes>
            <Route path="/" element={<Navigate to={`${base}/session`} replace />} />
            <Route path="/session"      element={<SessionList />} />
            <Route path="/session/*"    element={<Session />} />
            <Route path="/school/*"     element={<SchoolInfo />} />
            <Route path="/bill"         element={<Bill />} />
            <Route path="/alumni/*"     element={<Alumni />} />
            <Route path="/notification" element={<Notification />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;
