import { Route, Routes, useParams } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import StudentProfile from "../AdminPages/StudentProfile/StudentProfile";
import Student_detail_Layout from "../AdminLayout/Student_detail_Layout/Student_detail_Layout";
import StudentIdentity from "../AdminPages/StudentProfile/pagesTab/identitytab/StudentIdentity";
import StudentGuardian from "../AdminPages/StudentProfile/pagesTab/Guardians/StudentGuardian";
import StudentHealth from "../AdminPages/StudentProfile/pagesTab/Health/StudentHealth";
import AdmissionHistory from "../AdminPages/StudentProfile/pagesTab/AdmissionHistory/AdmissionHistory";
import ClassStudentInfo from "../AdminPages/StudentProfile/pagesTab/ClassStudentInfo/ClassStudentInfo";
import AtendanceStudentInfo from "../AdminPages/StudentProfile/pagesTab/AtendanceStudentInfo/AtendanceStudentInfo";
import ReportStudentInfo from "../AdminPages/StudentProfile/pagesTab/ReportStudentInfo/ReportStudentInfo";
import StudentResources from "../AdminPages/StudentProfile/pagesTab/StudentResources/StudentResources";
import LoadingData from "../../../components/LoadingData";
import { useFetchStudentDetail } from "../../../api_call";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

// Student Info routes (without subsession ID)
const StudentAdmissionHistory = () => <AdmissionHistory />;

// Session-specific routes (with subsession ID)
const StudentClass = () => <ClassStudentInfo />;
const StudentAttendance = () => <AtendanceStudentInfo />;
const StudentReport = () => <ReportStudentInfo />;

// Session data from sidebar (matching StutdentDetailSaidBar data exactly)
const sessionData = [
  {
    name: "2024-2023",
    subseasionname: "Frist term",
    subseasionId: "3232432423242422",
  },
  {
    name: "2025-4664",
    subseasionname: " second term",
    subseasionId: "242423232324244",
  },
  {
    name: "2024-4242",
    subseasionname: " thurd term",
    subseasionId: "2424242424242424",
  },
  {
    name: "2035-2424",
    subseasionname: " Frist term",
    subseasionId: "2432535323214352",
  },
  {
    name: "2024-1322",
    subseasionname: " thurd term",
    subseasionId: "2423243522432524",
  },
];

const StudentDetailRoute = () => {
  return (
    <Routes>
      {/* Default route - shows StudentProfile */}
      <Route
        path="/"
        element={
          <StudentDetailWrapper>
            <StudentIdentity />
          </StudentDetailWrapper>
        }
      />

      {/* Student Info routes (no subsession ID needed) */}
      <Route
        path="/identity"
        element={
          <StudentDetailWrapper>
            <StudentIdentity />
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/guardians"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="students">
              <StudentGuardian />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/health"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="students">
              <StudentHealth />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/admission-history"
        element={
          <StudentDetailWrapper>
            <StudentAdmissionHistory />
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/resources"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="students">
              <StudentResources />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />

      {/* Session-specific routes (require subsession ID) */}
      <Route
        path="/:subseasion"
        element={
          <StudentDetailWrapper>
            <StudentProfile />
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/:subseasion/class"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="students">
              <StudentClass />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/:subseasion/attendance"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="students">
              <StudentAttendance />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />
      <Route
        path="/:subseasion/report"
        element={
          <StudentDetailWrapper>
            <SubAdminGuard permission="student_report">
              <StudentReport />
            </SubAdminGuard>
          </StudentDetailWrapper>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const StudentDetailWrapper = ({ children }) => {
  const { schoolId, studentId, subseasion } = useParams();

  // Fetch student data
  const { studentData, loading, error, refetch } = useFetchStudentDetail(
    schoolId,
    studentId
  );

  // Show loading state
  if (loading) {
    return (
      <Student_detail_Layout
        title="Loading..."
        subtitle="Please wait"
        route={[]}
      >
        <LoadingData
          message="Loading student information..."
          style={{ margin: "40px 0" }}
        />
      </Student_detail_Layout>
    );
  }

  // Show error state
  if (error) {
    return (
      <Student_detail_Layout
        title="Error"
        subtitle="Failed to load student"
        route={[]}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#dc3545",
          }}
        >
          <h3>Error Loading Student</h3>
          <p>{error}</p>
          <button
            onClick={refetch}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Retry
          </button>
        </div>
      </Student_detail_Layout>
    );
  }

  // Show no data state
  if (!studentData) {
    return (
      <Student_detail_Layout
        title="No Data"
        subtitle="Student not found"
        route={[]}
      >
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#6c757d",
          }}
        >
          <h3>No Student Data</h3>
          <p>Student information not found.</p>
        </div>
      </Student_detail_Layout>
    );
  }

  const { student, admissions, guardians, sessions = [] } = studentData;

  // Get current session data
  const getCurrentSession = () => {
    if (subseasion) {
      return sessionData.find((session) => session.subseasionId === subseasion);
    }
    return null;
  };

  const currentSession = getCurrentSession();

  // Get most recent active admission
  const activeAdmission =
    admissions?.find((a) => a.active_status) || admissions?.[0];

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Define routes based on context
  const getRoutes = () => {
    if (subseasion) {
      // Session-specific routes
      return [
        { label: "Class", link: "/class" },
        { label: "Attendance", link: "/attendance" },
        { label: "Report", link: "/report" },
      ];
    } else {
      // Student info routes
      return [
        { label: "Identity", link: "/identity" },
        { label: "Guardians", link: "/guardians" },
        { label: "Health", link: "/health" },
        { label: "Resources", link: "/resources" },
        { label: "Admission History", link: "/admission-history" },
      ];
    }
  };

  const getTitle = () => {
    const title =
      subseasion && currentSession
        ? `${student.full_name} - ${currentSession.name}`
        : student.full_name;
    console.log("StudentDetailWrapper - Generated Title:", title);
    console.log("StudentDetailWrapper - Subseasion:", subseasion);
    console.log("StudentDetailWrapper - Current Session:", currentSession);
    return title;
  };

  const getSubtitle = () => {
    const subtitle =
      subseasion && currentSession
        ? `${currentSession.subseasionname} • ${
            activeAdmission?.admission_class || "N/A"
          } • ${student.student_status || "Active"}`
        : `Student ID: ${student.student_id?.substring(0, 16) || "N/A"} • ${
            activeAdmission?.admission_class || "N/A"
          } • Admitted: ${formatDate(activeAdmission?.admitted_date)}`;
    console.log("StudentDetailWrapper - Generated Subtitle:", subtitle);
    return subtitle;
  };

  const handleStudentUpdate = async (formData) => {
    console.log("Updating student:", studentId, formData);
    // Add your update logic here
    return { success: true };
  };

  // Sample edit fields for student
  const studentEditFields = [
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
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
      required: true,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      placeholder: "Enter email address",
    },
  ];

  return (
    <Student_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Student"
      fields={studentEditFields}
      route={getRoutes()}
      data={student}
      onSubmit={handleStudentUpdate}
      sessionData={sessions}
    >
      {children || <StudentProfile />}
    </Student_detail_Layout>
  );
};

export default StudentDetailRoute;
