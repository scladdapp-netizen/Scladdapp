import { Routes, Route } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import Students from "./Students/Students";
import Classes from "./Classes/Classes";
import Teachers from "./Teachers/Teachers";
import Staff from "./Staff/Staff";
import Subjects from "./Subjects/Subjects";
import Admins from "./Admins/Admins";
import SubAdminGuard from "../../../../components/SubAdminGuard/SubAdminGuard";

const SchoolDirectory = () => {
  // Define the navigation routes for the top tabs
  const routes = [
    { label: "Students", link: "/students" },
    { label: "Classes", link: "/classes" },
    { label: "Teachers", link: "/teachers" },
    { label: "Staff", link: "/staff" },
    { label: "Subjects", link: "/subjects" },
    { label: "Admins", link: "/admins" },
  ];

  return (
    <StudentDetailTopTab
      title="School Directory"
      subtitle="Manage all school personnel and organizational structure"
      route={routes}
    >
      <Routes>
        <Route path="/" element={<SubAdminGuard permission="students"><Students /></SubAdminGuard>} />
        <Route path="/students" element={<SubAdminGuard permission="students"><Students /></SubAdminGuard>} />
        <Route path="/classes" element={<SubAdminGuard permission="classes"><Classes /></SubAdminGuard>} />
        <Route path="/teachers" element={<SubAdminGuard permission="teachers"><Teachers /></SubAdminGuard>} />
        <Route path="/staff" element={<SubAdminGuard permission="staff"><Staff /></SubAdminGuard>} />
        <Route path="/subjects" element={<SubAdminGuard permission="subject"><Subjects /></SubAdminGuard>} />
        <Route path="/admins" element={<SubAdminGuard><Admins /></SubAdminGuard>} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default SchoolDirectory;
