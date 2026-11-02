import { Route, Routes } from "react-router-dom";
import Templates from "../AdminPages/Templates/Templates";
import GradingTemplatePage from "../AdminPages/Templates/GradingTemplatePage/GradingTemplatePage";
import GradingTemplateDetail from "../AdminPages/Templates/GradingTemplateDetail/GradingTemplateDetail";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

const TemplatesRoute = () => {
  return (
    <Routes>
      <Route path="/editor/new" element={<SubAdminGuard permission="report_template"><GradingTemplatePage /></SubAdminGuard>} />
      <Route path="/editor/:templateId" element={<SubAdminGuard permission="report_template"><GradingTemplatePage /></SubAdminGuard>} />
      <Route path="/detail/:templateId" element={<SubAdminGuard permission="report_template"><GradingTemplateDetail /></SubAdminGuard>} />
      <Route path="/" element={<SubAdminGuard permission="report_template"><Templates /></SubAdminGuard>} />
      <Route path="/:tab" element={<SubAdminGuard permission="report_template"><Templates /></SubAdminGuard>} />
    </Routes>
  );
};

export default TemplatesRoute;
