import { Route, Routes, useParams } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import Subject_detail_Layout from "../AdminLayout/Subject_detail_Layout/Subject_detail_Layout";
import SubjectOverview from "../AdminPages/subjectProfile/SubjectOverview/SubjectOverview";
import SubjectResources from "../AdminPages/subjectProfile/SubjectResources/SubjectResources";
import SubjectClasses from "../AdminPages/subjectProfile/SubjectClasses/SubjectClasses";
import SubjectTeachers from "../AdminPages/subjectProfile/SubjectTeachers/SubjectTeachers";
import SubjectBooks from "../AdminPages/subjectProfile/SubjectBooks/SubjectBooks";
import SubjectAssessments from "../AdminPages/subjectProfile/SubjectAssessments/SubjectAssessments";
import useFetchSubjectDetail from "../../../api_call/useFetchSubjectDetail";
import { useSubject } from "../../../api_call/useSubject";
import LoadingData from "../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

// Session data (matching the structure from other components)
const sessionData = [
  {
    name: "2024-2023",
    subseasionname: "First term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2025-4664",
    subseasionname: "Second term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-4242",
    subseasionname: "Third term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2035-2424",
    subseasionname: "First term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2024-1322",
    subseasionname: "Third term",
    subseasionId: "2423243522432524",
  },
];

// Sample edit fields for subject
const subjectEditFields = [
  {
    name: "subjectName",
    label: "Subject Name",
    type: "text",
    placeholder: "Enter subject name",
    required: true,
  },
  {
    name: "subjectCode",
    label: "Subject Code",
    type: "text",
    placeholder: "Enter subject code",
    required: true,
  },
  {
    name: "category",
    label: "Category",
    type: "select",
    options: [
      { value: "Core Subject", label: "Core Subject" },
      { value: "Elective", label: "Elective" },
      { value: "Science", label: "Science" },
      { value: "Arts", label: "Arts" },
      { value: "Technology", label: "Technology" },
    ],
    required: true,
  },
  {
    name: "department",
    label: "Department",
    type: "text",
    placeholder: "Enter department",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Enter subject description",
  },
];

const SubjectDetailRoute = () => {
  console.log("SubjectDetailRoute component rendered");

  return (
    <Routes>
      {/* Session-specific routes (require subsession ID) - More specific routes first */}
      <Route
        path="/:subseasion/assessments"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectAssessments />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Subject Info routes (no subsession ID needed) */}
      <Route
        path="/classes"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectClasses />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/teachers"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectTeachers />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/books"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectBooks />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/resources"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectResources />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/overview"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectOverview />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Default route - shows SubjectOverview */}
      <Route
        path="/"
        element={
          <SubAdminGuard permission="subject">
            <SubjectDetailWrapper>
              <SubjectOverview />
            </SubjectDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const SubjectDetailWrapper = ({ children }) => {
  const { schoolId, subjectId, subseasion } = useParams();
  const { addNotification } = useNotification();
  const { updateSubject } = useSubject();
  const { user } = useAuth();

  // Fetch subject detail data
  const { subjectData, loading, error, refetch } = useFetchSubjectDetail(
    schoolId,
    subjectId
  );

  console.log("SubjectDetailWrapper rendered", {
    schoolId,
    subjectId,
    subseasion,
  });
  console.log("Subject data:", subjectData);

  // Get current session data
  const getCurrentSession = () => {
    if (subseasion) {
      return sessionData.find((session) => session.subseasionId === subseasion);
    }
    return null;
  };

  const currentSession = getCurrentSession();
  console.log("Current session:", currentSession);

  // Define routes based on context
  const getRoutes = () => {
    const routes = subseasion
      ? [{ label: "Assessments", link: `/assessments` }]
      : [
          { label: "Overview", link: `` }, // Empty link for default route
          { label: "Classes", link: `/classes` },
          { label: "Teachers", link: `/teachers` },
          { label: "Books", link: `/books` },
          { label: "Resources", link: `/resources` },
        ];

    console.log("Generated routes:", routes, "Subseasion:", subseasion);
    return routes;
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <LoadingData />
        <p style={{ marginTop: "20px", color: "#6b7280" }}>
          Loading subject details...
        </p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontSize: "16px" }}>Error: {error}</p>
        <button
          onClick={refetch}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show not found state
  if (!subjectData || !subjectData.subject) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#6b7280", fontSize: "16px" }}>Subject not found</p>
      </div>
    );
  }

  const subject = subjectData.subject;

  const getTitle = () => {
    const title =
      subseasion && currentSession
        ? `${subject.subject_name} - ${currentSession.name}`
        : subject.subject_name;
    console.log("Generated title:", title);
    return title;
  };

  const getSubtitle = () => {
    const subtitle =
      subseasion && currentSession
        ? `${currentSession.subseasionname} • ${subject.subject_code} • ${
            subject.is_active ? "Active" : "Inactive"
          }`
        : `Subject Code: ${subject.subject_code} • ${
            subject.is_active ? "Active" : "Inactive"
          }`;
    console.log("Generated subtitle:", subtitle);
    return subtitle;
  };

  const handleSubjectUpdate = async (formData) => {
    console.log("Updating subject:", subjectId, formData);

    try {
      const result = await updateSubject(subjectId, {
        ...formData,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });

      if (result.success) {
        addNotification("Subject updated successfully", "success");
        await refetch(); // Refresh subject data
        return { success: true };
      } else {
        addNotification(result.message || "Failed to update subject", "error");
        return { success: false, error: result.message };
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      addNotification("Failed to update subject", "error");
      return { success: false, error: error.message };
    }
  };

  return (
    <Subject_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Subject"
      fields={subjectEditFields}
      route={getRoutes()}
      data={subjectData}
      onSubmit={handleSubjectUpdate}
    >
      {children ? (
        // Clone children and pass subjectData and refetch as props
        children.type ? (
          <children.type
            {...children.props}
            subjectData={subjectData}
            onSubjectUpdate={handleSubjectUpdate}
            refreshSubjectData={refetch}
          />
        ) : (
          children
        )
      ) : (
        <SubjectOverview
          subjectData={subjectData}
          onSubjectUpdate={handleSubjectUpdate}
          refreshSubjectData={refetch}
        />
      )}
    </Subject_detail_Layout>
  );
};

export default SubjectDetailRoute;
