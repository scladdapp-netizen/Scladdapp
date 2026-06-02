import { Route, Routes, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import NotFound from "../../NotFound/NotFound";
import Class_detail_Layout from "../AdminLayout/Class_detail_Layout/Class_detail_Layout";
import ClassOverview from "../AdminPages/classProfile/ClassOverview/ClassOverview";
import ClassResources from "../AdminPages/classProfile/ClassResources/ClassResources";
import ClassStudents from "../AdminPages/classProfile/ClassStudents/ClassStudents";
import ClassSubjects from "../AdminPages/classProfile/ClassSubjects/ClassSubjects";
import ClassTimetable from "../AdminPages/classProfile/ClassTimetable/ClassTimetable";
import ClassAttendance from "../AdminPages/classProfile/ClassAttendance/ClassAttendance";
import ClassHeadmaster from "../AdminPages/classProfile/ClassHeadmaster/ClassHeadmaster";
import LoadingData from "../../../components/LoadingData";
import { useClass } from "../../../api_call/useClass";
import { useNotification } from "../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../context/AuthContext/AuthContext";

import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

// Class Info routes (without subsession ID - Overall/Permanent)
const ClassOverviewPage = ({ classData, onClassUpdate, refreshClassData }) => (
  <ClassOverview
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

const ClassResourcesPage = ({ classData, onClassUpdate, refreshClassData }) => (
  <ClassResources
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

// Session-specific routes (with subsession ID)
const ClassStudentsPage = ({ classData, onClassUpdate, refreshClassData }) => (
  <ClassStudents
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

const ClassSubjectsPage = ({ classData, onClassUpdate, refreshClassData }) => (
  <ClassSubjects
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

const ClassTimetablePage = ({ classData, onClassUpdate, refreshClassData }) => (
  <ClassTimetable
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

const ClassAttendancePage = ({
  classData,
  onClassUpdate,
  refreshClassData,
}) => (
  <ClassAttendance
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

const ClassHeadmasterPage = ({
  classData,
  onClassUpdate,
  refreshClassData,
}) => (
  <ClassHeadmaster
    classData={classData}
    onClassUpdate={onClassUpdate}
    refreshClassData={refreshClassData}
  />
);

// Session data (matching the structure from other components)
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

// Sample edit fields for class
const classEditFields = [
  {
    name: "className",
    label: "Class Name",
    type: "text",
    placeholder: "Enter class name",
    required: true,
  },
  {
    name: "classCode",
    label: "Class Code",
    type: "text",
    placeholder: "Enter class code",
    required: true,
  },
  {
    name: "classSection",
    label: "Section",
    type: "text",
    placeholder: "Enter section",
    required: true,
  },
  {
    name: "roomNumber",
    label: "Room Number",
    type: "text",
    placeholder: "Enter room number",
  },
];

const ClassDetailRoute = () => {
  return (
    <Routes>
      {/* Default route - shows ClassOverview */}
      <Route
        path="/"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassOverviewPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Class Info routes (no subsession ID needed - Overall/Permanent) */}
      <Route
        path="/overview"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassOverviewPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/resources"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassResourcesPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/subjects"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassSubjectsPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/headmaster"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassHeadmasterPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Session-specific routes (require subsession ID) */}
      <Route
        path="/:subseasion/students"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassStudentsPage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/:subseasion/timetable"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassTimetablePage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/:subseasion/attendance"
        element={
          <SubAdminGuard permission="classes">
            <ClassDetailWrapper>
              <ClassAttendancePage />
            </ClassDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const ClassDetailWrapper = ({ children }) => {
  const { classId, subseasion, schoolId } = useParams();
  const { updateClass, loading, error } = useClass();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [classData, setClassData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Fetch class data on component mount
  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    if (!classId) return;

    setDataLoading(true);
    try {
      console.log(
        "ClassDetailWrapper - Fetching class detail for ID:",
        classId
      );

      // Use the detail endpoint to get class with headmaster assignment info
      const response = await fetch(`${API_BASE_URL}/class/${classId}/detail`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      console.log("ClassDetailWrapper - Fetch result:", result);

      if (result.success) {
        console.log("ClassDetailWrapper - Setting class data:", result.data);
        console.log("=== CLASS DETAIL FETCHED ===");
        console.log("Class:", result.data.class);
        console.log("Headmaster Assignments:", result.data.headmaster_assignments);
        console.log("Sessions:", result.data.sessions);
        console.log("============================");
        setClassData(result.data);
      } else {
        console.error("ClassDetailWrapper - Fetch failed:", result.message);
        addNotification(
          result.message || "Failed to fetch class data",
          "error"
        );
        setClassData(null);
      }
    } catch (err) {
      console.error("Error fetching class data:", err);
      addNotification("Error fetching class data", "error");
      setClassData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Show loading state for entire page
  if (dataLoading) {
    return (
      <LoadingData
        message="Loading class profile..."
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  // Show error state
  if (error && !classData) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "#dc3545",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Error Loading Class Profile</h2>
        <p>Error: {error}</p>
        <button
          onClick={fetchClassData}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Show not found if no class data
  if (!classData) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Class Not Found</h2>
        <p>The class with ID "{classId}" could not be found.</p>
      </div>
    );
  }

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
        { label: "Students", link: "/students" },
        { label: "Timetable", link: "/timetable" },
        { label: "Attendance", link: "/attendance" },
      ];
    } else {
      // Class info routes (Overall/Permanent)
      return [
        { label: "Overview", link: "/overview" },
        { label: "Resources", link: "/resources" },
        { label: "Subjects", link: "/subjects" },
        { label: "Headmaster", link: "/headmaster" },
      ];
    }
  };

  const getTitle = () => {
    // classData now contains {class, headmaster_assignments}
    const classInfo = classData?.class || classData;

    const title =
      subseasion && currentSession
        ? `${classInfo.class_name} - ${currentSession.name}`
        : `${classInfo.class_name}`;
    return title;
  };

  const getSubtitle = () => {
    // classData now contains {class, headmaster_assignments}
    const classInfo = classData?.class || classData;
    const activeHeadmaster = classData?.headmaster_assignments?.find(
      (h) => h.is_active === true
    );

    const subtitle =
      subseasion && currentSession
        ? `${currentSession.subseasionname} • ${classInfo.class_code} • Section ${classInfo.class_section} • ${classInfo.class_type}`
        : `Class ID: ${classInfo.class_id} • Code: ${
            classInfo.class_code
          } • Section: ${classInfo.class_section} • Room: ${
            classInfo.room_number || "N/A"
          } • Headmaster: ${activeHeadmaster?.teacher_name || "Not Assigned"}`;
    return subtitle;
  };

  const handleClassUpdate = async (formData) => {
    try {
      const result = await updateClass(classId, {
        ...formData,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });

      if (result.success) {
        addNotification("Class profile updated successfully", "success");
        // Refresh class data
        fetchClassData();
        return { success: true };
      } else {
        addNotification(
          result.message || "Failed to update class profile",
          "error"
        );
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error("Error updating class:", err);
      addNotification("Error updating class profile", "error");
      return { success: false, error: err.message };
    }
  };

  // Clone children and pass classData and refresh function as props
  const childrenWithProps = React.cloneElement(children, {
    classData,
    onClassUpdate: handleClassUpdate,
    refreshClassData: fetchClassData,
  });

  return (
    <Class_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Class"
      fields={classEditFields}
      route={getRoutes()}
      data={classData}
      onSubmit={handleClassUpdate}
    >
      {childrenWithProps || <ClassOverview classData={classData} />}
    </Class_detail_Layout>
  );
};

export default ClassDetailRoute;
