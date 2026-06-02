import { Routes, Route } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import Notifications from "./Notifications/Notifications";
import SubAdminGuard from "../../../../components/SubAdminGuard/SubAdminGuard";

const Communication = () => {
  const routes = [
    { label: "Notifications", link: "/notifications" },
  ];

  return (
    <StudentDetailTopTab
      title="Communication"
      subtitle="Manage school notifications"
      route={routes}
    >
      <Routes>
        <Route path="/" element={<SubAdminGuard permission="communication"><Notifications /></SubAdminGuard>} />
        <Route path="/notifications" element={<SubAdminGuard permission="communication"><Notifications /></SubAdminGuard>} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default Communication;
