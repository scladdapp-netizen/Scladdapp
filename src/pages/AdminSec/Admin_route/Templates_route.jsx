import { Route, Routes } from "react-router-dom";
import Templates from "../AdminPages/Templates/Templates";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

const TemplatesRoute = () => {
  return (
    <Routes>
      <Route path="/" element={<SubAdminGuard permission="report_template"><Templates /></SubAdminGuard>} />
      <Route path="/:tab" element={<SubAdminGuard permission="report_template"><Templates /></SubAdminGuard>} />
    </Routes>
  );
};

export default TemplatesRoute;
