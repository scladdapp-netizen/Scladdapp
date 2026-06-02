import { Routes, Route } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import Subscriptions from "./Subscriptions/Subscriptions";
import SystemSettings from "./SystemSettings/SystemSettings";
import SchoolData from "./SchoolData/SchoolData";

const Settings = () => {
  const routes = [
    { label: "Subscriptions", link: "/subscriptions" },
    { label: "System Settings", link: "/system-settings" },
  ];

  return (
    <StudentDetailTopTab
      title="Settings & Subscriptions"
      subtitle="Manage your school's subscription plan, billing, and system preferences"
      route={routes}
    >
      <Routes>
        <Route path="/" element={<Subscriptions />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/system-settings" element={<SystemSettings />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default Settings;
