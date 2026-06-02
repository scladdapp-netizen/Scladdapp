import { Route, Routes, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import NotFound from "../../NotFound/NotFound";
import StaffProfile from "../AdminPages/StaffProfile/StaffProfile";
import Staff_detail_Layout from "../AdminLayout/Staff_detail_Layout/Staff_detail_Layout";
import StaffIdentity from "../AdminPages/StaffProfile/pagesTab/StaffIdentity/StaffIdentity";
import StaffCredentials from "../AdminPages/StaffProfile/pagesTab/StaffCredentials/StaffCredentials";
import StaffResources from "../AdminPages/StaffProfile/pagesTab/StaffResources/StaffResources";
import StaffAssignments from "../AdminPages/StaffProfile/pagesTab/StaffAssignments/StaffAssignments";
import StaffActivity from "../AdminPages/StaffProfile/pagesTab/StaffActivity/StaffActivity";
import StaffPerformance from "../AdminPages/StaffProfile/pagesTab/StaffPerformance/StaffPerformance";
import LoadingData from "../../../components/LoadingData";
import { useStaffInfo } from "../../../api_call";
import { useNotification } from "../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../context/AuthContext/AuthContext";

import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

// Staff Info routes (without subsession ID - Overall/Permanent)
const StaffIdentityPage = ({ staffData, onStaffUpdate, refreshStaffData }) => (
  <StaffIdentity
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);
const StaffCredentialsPage = ({
  staffData,
  onStaffUpdate,
  refreshStaffData,
}) => (
  <StaffCredentials
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);
const StaffResourcesPage = ({ staffData, onStaffUpdate, refreshStaffData }) => (
  <StaffResources
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);

// Session-specific routes (with subsession ID)
const StaffAssignmentsPage = ({
  staffData,
  onStaffUpdate,
  refreshStaffData,
}) => (
  <StaffAssignments
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);
const StaffActivityPage = ({ staffData, onStaffUpdate, refreshStaffData }) => (
  <StaffActivity
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);
const StaffPerformancePage = ({
  staffData,
  onStaffUpdate,
  refreshStaffData,
}) => (
  <StaffPerformance
    staffData={staffData}
    onStaffUpdate={onStaffUpdate}
    refreshStaffData={refreshStaffData}
  />
);

// Sample staff data
const staffData = {
  name: "Mr. John Anderson",
  staffId: "STF001",
  email: "john.anderson@school.edu",
  phone: "+1 (555) 987-6543",
  hireDate: "2018-08-01",
  status: "Active",
  position: "Principal",
  department: "Administration",
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

// Sample edit fields for staff
const staffEditFields = [
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
    name: "position",
    label: "Position",
    type: "text",
    placeholder: "Enter position",
  },
];

const StaffDetailRoute = () => {
  return (
    <Routes>
      {/* Default route - shows StaffIdentity */}
      <Route
        path="/"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffIdentityPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Staff Info routes (no subsession ID needed - Overall/Permanent) */}
      <Route
        path="/identity"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffIdentityPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/credentials"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffCredentialsPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/resources"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffResourcesPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/assignments"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffAssignmentsPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/activity"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffActivityPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/performance"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffPerformancePage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Session-specific routes (require subsession ID) */}
      <Route
        path="/:subseasion"
        element={
          <StaffDetailWrapper>
            <StaffProfile />
          </StaffDetailWrapper>
        }
      />
      <Route
        path="/:subseasion/activity"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffActivityPage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />
      <Route
        path="/:subseasion/performance"
        element={
          <SubAdminGuard permission="staff">
            <StaffDetailWrapper>
              <StaffPerformancePage />
            </StaffDetailWrapper>
          </SubAdminGuard>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const StaffDetailWrapper = ({ children }) => {
  const { staffId, subseasion, schoolId } = useParams();
  const { updateStaff, loading, error } = useStaffInfo();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [staffData, setStaffData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Fetch staff data on component mount
  useEffect(() => {
    fetchStaffData();
  }, [staffId]);

  const fetchStaffData = async () => {
    if (!staffId) return;

    setDataLoading(true);
    try {
      console.log(
        "StaffDetailWrapper - Fetching staff detail for ID:",
        staffId
      );

      // Use the detail endpoint to get staff with teacher assignment info
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}/detail`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      console.log("StaffDetailWrapper - Fetch result:", result);

      if (result.success) {
        console.log("StaffDetailWrapper - Setting staff data:", result.data);
        setStaffData(result.data);
      } else {
        console.error("StaffDetailWrapper - Fetch failed:", result.message);
        addNotification(
          result.message || "Failed to fetch staff data",
          "error"
        );
        setStaffData(null);
      }
    } catch (err) {
      console.error("Error fetching staff data:", err);
      addNotification("Error fetching staff data", "error");
      setStaffData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Show loading state for entire page
  if (dataLoading) {
    return (
      <LoadingData
        message="Loading staff profile..."
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
  if (error && !staffData) {
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
        <h2>Error Loading Staff Profile</h2>
        <p>Error: {error}</p>
        <button
          onClick={fetchStaffData}
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

  // Show not found if no staff data
  if (!staffData) {
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
        <h2>Staff Not Found</h2>
        <p>The staff member with ID "{staffId}" could not be found.</p>
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
        { label: "Activity", link: "/activity" },
        { label: "Performance", link: "/performance" },
      ];
    } else {
      // Staff info routes (Overall/Permanent)
      return [
        { label: "Identity", link: "/identity" },
        { label: "Credentials", link: "/credentials" },
        { label: "Resources", link: "/resources" },
        { label: "Assignments", link: "/assignments" },
        { label: "Activity", link: "/activity" },
        { label: "Performance", link: "/performance" },
      ];
    }
  };

  const getTitle = () => {
    const title =
      subseasion && currentSession
        ? `Staff Profile - ${currentSession.name}`
        : "Staff Profile";
    return title;
  };

  const getSubtitle = () => {
    // staffData now contains {staff, teacher_assignment, assignment_history}
    const staff = staffData?.staff || staffData;

    const subtitle =
      subseasion && currentSession
        ? `${staff.full_name} • ${currentSession.subseasionname} • ${staff.position} • ${staff.employment_status}`
        : `${staff.full_name} • Staff ID: ${staff.staff_id} • ${
            staff.position
          } • Joined: ${new Date(staff.joining_date).toLocaleDateString()}`;
    return subtitle;
  };

  const handleStaffUpdate = async (formData) => {
    try {
      const result = await updateStaff(staffId, {
        ...formData,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });

      if (result.success) {
        addNotification("Staff profile updated successfully", "success");
        // Refresh staff data
        fetchStaffData();
        return { success: true };
      } else {
        addNotification(
          result.message || "Failed to update staff profile",
          "error"
        );
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error("Error updating staff:", err);
      addNotification("Error updating staff profile", "error");
      return { success: false, error: err.message };
    }
  };

  // Clone children and pass staffData and refresh function as props
  const childrenWithProps = React.cloneElement(children, {
    staffData,
    onStaffUpdate: handleStaffUpdate,
    refreshStaffData: fetchStaffData,
  });

  return (
    <Staff_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Staff"
      fields={staffEditFields}
      route={getRoutes()}
      data={staffData}
      onSubmit={handleStaffUpdate}
    >
      {childrenWithProps || <StaffProfile staffData={staffData} />}
    </Staff_detail_Layout>
  );
};

export default StaffDetailRoute;
