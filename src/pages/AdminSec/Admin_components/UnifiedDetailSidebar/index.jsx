// Export the main component and configurations
export { default as UnifiedDetailSidebar } from "./UnifiedDetailSidebar";
export * from "./sidebarConfigs";

// Convenience wrapper components for each entity type
import UnifiedDetailSidebar from "./UnifiedDetailSidebar";
import {
  studentSidebarConfig,
  teacherSidebarConfig,
  staffSidebarConfig,
  classSidebarConfig,
  subjectSidebarConfig,
  adminSidebarConfig,
} from "./sidebarConfigs";

// Pre-configured sidebar components
export const StudentSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={studentSidebarConfig.entityType}
    profileItems={studentSidebarConfig.profileItems}
    sessionItems={studentSidebarConfig.sessionItems}
    profileSectionTitle={studentSidebarConfig.profileSectionTitle}
    profileSectionIcon={studentSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);

export const TeacherSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={teacherSidebarConfig.entityType}
    profileItems={teacherSidebarConfig.profileItems}
    sessionItems={teacherSidebarConfig.sessionItems}
    profileSectionTitle={teacherSidebarConfig.profileSectionTitle}
    profileSectionIcon={teacherSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);

export const StaffSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={staffSidebarConfig.entityType}
    profileItems={staffSidebarConfig.profileItems}
    sessionItems={staffSidebarConfig.sessionItems}
    profileSectionTitle={staffSidebarConfig.profileSectionTitle}
    profileSectionIcon={staffSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);

export const ClassSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={classSidebarConfig.entityType}
    profileItems={classSidebarConfig.profileItems}
    sessionItems={classSidebarConfig.sessionItems}
    profileSectionTitle={classSidebarConfig.profileSectionTitle}
    profileSectionIcon={classSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);

export const SubjectSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={subjectSidebarConfig.entityType}
    profileItems={subjectSidebarConfig.profileItems}
    sessionItems={subjectSidebarConfig.sessionItems}
    profileSectionTitle={subjectSidebarConfig.profileSectionTitle}
    profileSectionIcon={subjectSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);

export const AdminSidebar = ({ sessionData = [] }) => (
  <UnifiedDetailSidebar
    entityType={adminSidebarConfig.entityType}
    profileItems={adminSidebarConfig.profileItems}
    sessionItems={adminSidebarConfig.sessionItems}
    profileSectionTitle={adminSidebarConfig.profileSectionTitle}
    profileSectionIcon={adminSidebarConfig.profileSectionIcon}
    sessionData={sessionData}
  />
);
