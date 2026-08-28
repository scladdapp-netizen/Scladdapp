import { useState } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import TeacherSidebar from "./TeacherSidebar";
import TeacherTopbar from "./TeacherTopbar";
import Assignments from "./pages/Assignments/Assignments";
import Notifications from "./pages/Notifications/Notifications";
import EventsCalendar from "./pages/EventsCalendar/EventsCalendar";
import Profile from "./pages/Profile/Profile";
import SubjectDashboard from "./pages/SubjectDashboard/SubjectDashboard";
import ClassDashboard from "./pages/ClassDashboard/ClassDashboard";
import SchoolInfo from "../StudentSec/SchoolDashboard/pages/SchoolInfo/SchoolInfo";
import SubscriptionExpiredBanner from "../../components/SubscriptionExpiredBanner/SubscriptionExpiredBanner";
import { useBlockExpiredMutations } from "../../hooks/useBlockExpiredMutations";
import { useSubscriptionAccess } from "../../hooks/useSubscriptionAccess";
import "./TeacherSec.css";

const TeacherSec = () => {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { canMutate } = useSubscriptionAccess();

  useBlockExpiredMutations();

  return (
    <div className={`t_layout${!canMutate ? " t_layout--sub-banner" : ""}`}>
      <TeacherTopbar
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuClick={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <div className="t_said_n_content">
        <TeacherSidebar
          isMobileOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <div
          className="t_content"
          onClick={() => isMobileMenuOpen && setIsMobileMenuOpen(false)}
        >
          <SubscriptionExpiredBanner
            settingsPath={
              user?.admin
                ? `/admin/${schoolId}/settings/subscriptions?tab=upgrade`
                : undefined
            }
          />
          <Routes>
            <Route path="/" element={<Navigate to={`/teacher/${schoolId}/assignments`} replace />} />
            <Route path="/assignments/*" element={<Assignments />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/events/*" element={<EventsCalendar />} />
            <Route path="/school/*" element={<SchoolInfo />} />
            <Route path="/profile/*" element={<Profile />} />
            <Route path="/subject/:subjectId/:assignmentId/*" element={<SubjectDashboard />} />
            <Route path="/subject/:subjectId/*" element={<SubjectDashboard />} />
            <Route path="/class/:classId/*" element={<ClassDashboard />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TeacherSec;
