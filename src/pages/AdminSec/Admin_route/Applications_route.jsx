import { Route, Routes } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import Applications from "../AdminPages/Applications/Applications";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

const ApplicationsRoute = () => (
  <Routes>
    <Route path="/" element={<SubAdminGuard permission="applications"><Applications /></SubAdminGuard>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default ApplicationsRoute;
