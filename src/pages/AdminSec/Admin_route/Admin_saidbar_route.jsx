import { Route, Routes } from "react-router-dom";
import AdminPages from "./Admin_seasion_tab_raute";
import AdminLayout from "../AdminLayout/Admin_overull_layout/AdminLayout.jsx";
import StudentDetailRoute from "./Student_detail_sidebar_route.jsx";
import ClassDetailRoute from "./Class_detail_sidebar_route.jsx";
import SubjectDetailRoute from "./Subject_detail_sidebar_route.jsx";
import TeacherDetailRoute from "./Teacher_detail_sidebar_route.jsx";
import StaffDetailRoute from "./Staff_detail_sidebar_route.jsx";
import AdminDetailRoute from "./Admin_detail_sidebar_route.jsx";
import SchoolDirectoryRoute from "./School_directory_route.jsx";
import CommunicationRoute from "./Communication_route.jsx";
import FeeBillingRoute from "./Fee_billing_route.jsx";
import AlumniRoute from "./Alumni_route.jsx";
import TemplatesRoute from "./Templates_route.jsx";
import SettingsRoute from "./Settings_route.jsx";
import SchoolData from "../AdminPages/Settings/SchoolData/SchoolData.jsx";
import SchoolWebsite from "../AdminPages/Settings/SchoolData/SchoolWebsite.jsx";
import StudentDetailTopTab from "../Admin_components/StudentDetailTopTab/StudentDetailTopTab.jsx";
import Dashboard from "../AdminPages/Dashboard/Dashboard.jsx";
import SubscriptionGuard from "../../../components/SubscriptionGuard/SubscriptionGuard.jsx";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard.jsx";
import NotificationDetail from "../AdminPages/Communication/Notifications/NotificationDetail/NotificationDetail.jsx";
import AIWebsiteEditor from "../AdminPages/AIWebsiteEditor/AIWebsiteEditor.jsx";
import WebsiteBriefPage from "../AdminPages/WebsiteBrief/WebsiteBriefPage.jsx";
import EditTemplatePage from "../AdminPages/Templates/EditTemplatePage/EditTemplatePage.jsx";
import EditAnnouncementTemplatePage from "../AdminPages/Templates/EditAnnouncementTemplatePage/EditAnnouncementTemplatePage.jsx";

const Dash = () => {
  return <div>dash</div>;
};

const SchoolPage = () => (
  <StudentDetailTopTab
    title="School"
    subtitle="Manage your school profile, bio, resources and gallery"
    route={[
      { label: "Profile",   link: "/profile" },
      { label: "Bio",       link: "/bio" },
      { label: "Resources", link: "/resources" },
      { label: "Gallery",   link: "/gallery" },
      { label: "Website",   link: "/website" },
    ]}
  >
    <Routes>
      <Route path="/"          element={<SchoolData defaultTab="profile"   hideInternalTabs />} />
      <Route path="/profile"   element={<SchoolData defaultTab="profile"   hideInternalTabs />} />
      <Route path="/bio"       element={<SchoolData defaultTab="bio"       hideInternalTabs />} />
      <Route path="/resources" element={<SchoolData defaultTab="resources" hideInternalTabs />} />
      <Route path="/gallery"   element={<SchoolData defaultTab="gallery"   hideInternalTabs />} />
      <Route path="/website"   element={<SchoolWebsite />} />
    </Routes>
  </StudentDetailTopTab>
);

const Admin = () => {
  console.log("Admin component rendered");
  console.log("Current URL:", window.location.pathname);

  return (
    <Routes>
      {/* ── Full-screen pages (no sidebar/layout) ── */}
      <Route path="/school/website/ai-editor" element={<AIWebsiteEditor />} />
      <Route path="/school/website/brief"     element={<WebsiteBriefPage />} />
      <Route path="/templates/edit/:templateId" element={<SubscriptionGuard><SubAdminGuard permission="report_template"><EditTemplatePage /></SubAdminGuard></SubscriptionGuard>} />
      <Route path="/templates/announcement/edit/:templateId" element={<SubscriptionGuard><SubAdminGuard permission="announcement_template"><EditAnnouncementTemplatePage /></SubAdminGuard></SubscriptionGuard>} />

      {/* ── Standard layout ── */}
      <Route path="/*" element={
        <AdminLayout schoolId={"323232323"}>
          <Routes>
            <Route path="/" element={<SubscriptionGuard><SubAdminGuard permission="dashboard"><Dashboard /></SubAdminGuard></SubscriptionGuard>} />
            <Route path="/acedemic_seasion/*" element={<SubscriptionGuard><AdminPages /></SubscriptionGuard>} />
            <Route path="/school_directory/*" element={<SubscriptionGuard><SchoolDirectoryRoute /></SubscriptionGuard>} />
            <Route path="/communication/notifications/:notificationId/*" element={<SubscriptionGuard><SubAdminGuard permission="communication"><NotificationDetail /></SubAdminGuard></SubscriptionGuard>} />
            <Route path="/communication/*" element={<SubscriptionGuard><CommunicationRoute /></SubscriptionGuard>} />
            <Route path="/fee_billing/*" element={<SubscriptionGuard><FeeBillingRoute /></SubscriptionGuard>} />
            <Route path="/alumni/*" element={<SubscriptionGuard><AlumniRoute /></SubscriptionGuard>} />
            <Route path="/templates/*" element={<SubscriptionGuard><TemplatesRoute /></SubscriptionGuard>} />
            <Route path="/settings/*" element={<SubAdminGuard><SettingsRoute /></SubAdminGuard>} />
            <Route path="/school/*" element={<SubscriptionGuard><SubAdminGuard blockAll><SchoolPage /></SubAdminGuard></SubscriptionGuard>} />
            <Route path="/Profile/:studentId/*" element={<SubscriptionGuard><StudentDetailRoute /></SubscriptionGuard>} />
            <Route path="/Class/:classId/*" element={<SubscriptionGuard><ClassDetailRoute /></SubscriptionGuard>} />
            <Route path="/subjects/:subjectId/*" element={<SubscriptionGuard><SubjectDetailRoute /></SubscriptionGuard>} />
            <Route path="/teachers/:teacherId/*" element={<SubscriptionGuard><TeacherDetailRoute /></SubscriptionGuard>} />
            <Route path="/staff/:staffId/*" element={<SubscriptionGuard><StaffDetailRoute /></SubscriptionGuard>} />
            <Route path="/admins/:adminId/*" element={<SubscriptionGuard><AdminDetailRoute /></SubscriptionGuard>} />
          </Routes>
        </AdminLayout>
      } />
    </Routes>
  );
};

export default Admin;
