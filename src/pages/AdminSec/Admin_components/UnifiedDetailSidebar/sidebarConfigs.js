import { Icons } from "../../../../utils/icons";

// Student Sidebar Configuration
export const studentSidebarConfig = {
  entityType: "student",
  profileSectionTitle: "Student Info",
  profileSectionIcon: Icons.Home,
  profileItems: [
    { id: "identity", label: "Identity", icon: Icons.Identity },
    { id: "guardians", label: "Guardians", icon: Icons.Guardians },
    { id: "health", label: "Health", icon: Icons.Health },
    { id: "resources", label: "Resources", icon: Icons.Class },
    {
      id: "admission-history",
      label: "Admission History",
      icon: Icons.AdmissionHistory,
    },
  ],
  sessionItems: [
    { id: "class", label: "Class", icon: Icons.Class },
    { id: "attendance", label: "Attendance", icon: Icons.Attendance },
    { id: "report", label: "Report", icon: Icons.Report },
  ],
};

// Teacher Sidebar Configuration
export const teacherSidebarConfig = {
  entityType: "teacher",
  profileSectionTitle: "Teacher Profile",
  profileSectionIcon: Icons.Guardians,
  profileItems: [
    { id: "identity", label: "Identity", icon: Icons.Identity },
    { id: "resources", label: "Resources", icon: Icons.Class },
    { id: "assigned-subjects", label: "Assigned Subjects", icon: Icons.Subject },
  ],
  sessionItems: [
    { id: "activity", label: "Activity", icon: Icons.Report },
  ],
};

// Staff Sidebar Configuration
export const staffSidebarConfig = {
  entityType: "staff",
  profileSectionTitle: "Staff Profile",
  profileSectionIcon: Icons.Guardians,
  profileItems: [
    { id: "identity", label: "Identity", icon: Icons.Identity },
    { id: "credentials", label: "Credentials", icon: Icons.Disciplinary },
    { id: "resources", label: "Resources", icon: Icons.Class },
    { id: "assignments", label: "Assignments", icon: Icons.Class },
    { id: "activity", label: "Activity", icon: Icons.Report },
    { id: "performance", label: "Performance", icon: Icons.Disciplinary },
  ],
  sessionItems: [],
};

// Class Sidebar Configuration
export const classSidebarConfig = {
  entityType: "class",
  profileSectionTitle: "Class Profile",
  profileSectionIcon: Icons.Class,
  profileItems: [
    { id: "overview", label: "Overview", icon: Icons.Home },
    { id: "resources", label: "Resources", icon: Icons.Class },
    { id: "subjects", label: "Subjects", icon: Icons.Subject },
    { id: "headmaster", label: "Headmaster", icon: Icons.Guardians },
  ],
  sessionItems: [
    { id: "students", label: "Students", icon: Icons.Identity },
    { id: "timetable", label: "Timetable", icon: Icons.Report },
    { id: "attendance", label: "Attendance", icon: Icons.Attendance },
  ],
};

// Subject Sidebar Configuration
export const subjectSidebarConfig = {
  entityType: "subject",
  profileSectionTitle: "Subject Info",
  profileSectionIcon: Icons.Subject,
  profileItems: [
    { id: "overview", label: "Overview", icon: Icons.Home },
    { id: "classes", label: "Classes", icon: Icons.Class },
    { id: "teachers", label: "Teachers", icon: Icons.Guardians },
    { id: "books", label: "Books", icon: Icons.Class },
    { id: "resources", label: "Resources", icon: Icons.Class },
  ],
  sessionItems: [
    { id: "assessments", label: "Assessments", icon: Icons.Report },
  ],
};

// Admin Sidebar Configuration
export const adminSidebarConfig = {
  entityType: "admin",
  profileSectionTitle: "Admin Profile",
  profileSectionIcon: Icons.Guardians,
  profileItems: [
    { id: "identity", label: "Identity", icon: Icons.Identity },
    { id: "permissions", label: "Permissions", icon: Icons.Disciplinary },
    { id: "security", label: "Security", icon: Icons.Class },
    { id: "activity", label: "Activity", icon: Icons.Report },
  ],
  sessionItems: [],
};

// Helper function to get config by entity type
export const getSidebarConfig = (entityType) => {
  switch (entityType) {
    case "student":
      return studentSidebarConfig;
    case "teacher":
      return teacherSidebarConfig;
    case "staff":
      return staffSidebarConfig;
    case "class":
      return classSidebarConfig;
    case "subject":
      return subjectSidebarConfig;
    case "admin":
      return adminSidebarConfig;
    default:
      return null;
  }
};
