import { Route, Routes } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import AlumniDashboard from "../AdminPages/Alumni/AlumniDashboard";
import AlumniProfile from "../AdminPages/Alumni/AlumniProfile";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

const AlumniRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<SubAdminGuard permission="graduate"><AlumniDashboard /></SubAdminGuard>} />
      <Route path="/profile/:alumniId" element={<SubAdminGuard permission="graduate"><AlumniProfile /></SubAdminGuard>} />
      <Route path="/profile/:alumniId/certificates" element={<SubAdminGuard permission="graduate"><AlumniProfile /></SubAdminGuard>} />
      <Route path="/profile/:alumniId/notifications" element={<SubAdminGuard permission="graduate"><AlumniProfile /></SubAdminGuard>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AlumniRoute;
