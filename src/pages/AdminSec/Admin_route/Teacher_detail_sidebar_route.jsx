import { Route, Routes, useParams } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import TeacherProfile from "../AdminPages/TeacherProfile/TeacherProfile";
import Teacher_detail_Layout from "../AdminLayout/Teacher_detail_Layout/Teacher_detail_Layout";
import TeacherIdentity from "../AdminPages/TeacherProfile/pagesTab/TeacherIdentity/TeacherIdentity";
import TeacherResources from "../AdminPages/TeacherProfile/pagesTab/TeacherResources/TeacherResources";
import TeacherActivity from "../AdminPages/TeacherProfile/pagesTab/TeacherActivity/TeacherActivity";
import TeacherAssignedSubjects from "../AdminPages/TeacherProfile/pagesTab/TeacherAssignedSubjects/TeacherAssignedSubjects";
import LoadingData from "../../../components/LoadingData/LoadingData";
import { use_fatch_teach_detail } from "../../../api_call";

import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

// Teacher Info routes (without subsession ID - Overall/Permanent)
const TeacherIdentityPage = ({ teacherData, refreshTeacherData }) => (
  <TeacherIdentity
    teacherData={teacherData}
    refreshTeacherData={refreshTeacherData}
  />
);
const TeacherResourcesPage = ({ teacherData }) => (
  <TeacherResources teacherData={teacherData} />
);

// Session-specific routes (with subsession ID)
const TeacherActivityPage = ({ teacherData }) => (
  <TeacherActivity teacherData={teacherData} />
);
const TeacherAssignedSubjectsPage = ({ teacherData }) => (
  <TeacherAssignedSubjects teacherData={teacherData} />
);

// Sample teacher data
const teacherData = {
  name: "Mr. David Wilson",
  teacherId: "TCH001",
  email: "david.wilson@school.edu",
  phone: "+1 (555) 123-4567",
  hireDate: "2020-08-15",
  status: "Active",
  specialization: "Mathematics",
  qualification: "M.Sc. Mathematics",
};

// Session data from sidebar (matching existing session structure)
const sessionData = [
  {
    name: "2024-2025",
    subseasionname: "First Term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2024-2025",
    subseasionname: "Second Term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-2025",
    subseasionname: "Third Term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2023-2024",
    subseasionname: "First Term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2023-2024",
    subseasionname: "Third Term",
    subseasionId: "2423243522432524",
  },
];

// Sample edit fields for teacher
const teacherEditFields = [
  {
    name: "firstName",
    label: "First Name",
    type: "text",
    placeholder: "Enter first name",
    required: true,
  },
  {
    name: "lastName",
    label: "Last Name",
    type: "text",
    placeholder: "Enter last name",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter email address",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "tel",
    placeholder: "Enter phone number",
    required: true,
  },
  {
    name: "specialization",
    label: "Specialization",
    type: "text",
    placeholder: "Enter subject specialization",
  },
];

const TeacherDetailRoute = () => {
  const { schoolId, teacherId } = useParams();
  const { teacherData, loading, error, refetch } = use_fatch_teach_detail(
    schoolId,
    teacherId
  );

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <LoadingData message="Loading teacher details..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#dc3545" }}>
        <p>Error: {error}</p>
        <button
          onClick={refetch}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show not found if no data
  if (!teacherData) {
    return <NotFound />;
  }

  return (
    <Routes>
      {/* Default route - shows TeacherProfile */}
      <Route
        path="/"
        element={
          <SubAdminGuard permission="teachers">
            <TeacherDetailWrapper teacherData={teacherData}>
              <TeacherIdentityPage teacherData={teacherData} refreshTeacherData={refetch} />
            </TeacherDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Teacher Info routes (no subsession ID needed - Overall/Permanent) */}
      <Route
        path="/identity"
        element={
          <SubAdminGuard permission="teachers">
            <TeacherDetailWrapper teacherData={teacherData}>
              <TeacherIdentityPage teacherData={teacherData} refreshTeacherData={refetch} />
            </TeacherDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/resources"
        element={
          <SubAdminGuard permission="teachers">
            <TeacherDetailWrapper teacherData={teacherData}>
              <TeacherResourcesPage teacherData={teacherData} />
            </TeacherDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/assigned-subjects"
        element={
          <SubAdminGuard permission="teachers">
            <TeacherDetailWrapper teacherData={teacherData}>
              <TeacherAssignedSubjectsPage teacherData={teacherData} />
            </TeacherDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Session-specific routes (require subsession ID) */}
      <Route
        path="/:subseasion"
        element={
          <TeacherDetailWrapper teacherData={teacherData}>
            <TeacherProfile teacherData={teacherData} />
          </TeacherDetailWrapper>
        }
      />
      <Route
        path="/:subseasion/activity"
        element={
          <TeacherDetailWrapper teacherData={teacherData}>
            <TeacherActivityPage teacherData={teacherData} />
          </TeacherDetailWrapper>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const TeacherDetailWrapper = ({ children, teacherData }) => {
  const { teacherId, subseasion } = useParams();

  // Get current session data
  const getCurrentSession = () => {
    if (subseasion) {
      return sessionData.find((session) => session.subseasionId === subseasion);
    }
    return null;
  };

  const currentSession = getCurrentSession();

  // Define routes based on context
  const getRoutes = () => {
    if (subseasion) {
      // Session-specific routes
      return [
        { label: "Activity", link: "/activity" },
      ];
    } else {
      // Teacher info routes (Overall/Permanent)
      return [
        { label: "Identity", link: "/identity" },
        { label: "Resources", link: "/resources" },
        { label: "Assigned Subjects", link: "/assigned-subjects" },
      ];
    }
  };

  const getTitle = () => {
    const title =
      subseasion && currentSession
        ? `Teacher Profile - ${currentSession.name}`
        : "Teacher Profile";
    return title;
  };

  const getSubtitle = () => {
    const teacherName = teacherData?.teacher?.staff?.full_name || "Unknown Teacher";
    const teacherCode = teacherData?.teacher?.teacher_code || "N/A";
    const status = teacherData?.teacher?.is_active ? "Active" : "Inactive";

    const subtitle =
      subseasion && currentSession
        ? `${teacherName} • ${currentSession.subseasionname} • ${status}`
        : `${teacherName} • Teacher Code: ${teacherCode} • ${status}`;
    return subtitle;
  };

  const handleTeacherUpdate = async (formData) => {
    console.log("Updating teacher:", teacherId, formData);
    // Add your update logic here
    return { success: true };
  };

  return (
    <Teacher_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Teacher"
      fields={teacherEditFields}
      route={getRoutes()}
      data={teacherData}
      onSubmit={handleTeacherUpdate}
    >
      {children || <TeacherProfile />}
    </Teacher_detail_Layout>
  );
};

export default TeacherDetailRoute;
