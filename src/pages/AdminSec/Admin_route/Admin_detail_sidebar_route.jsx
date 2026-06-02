import { Route, Routes, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import NotFound from "../../NotFound/NotFound";
import Admin_detail_Layout from "../AdminLayout/Admin_detail_Layout/Admin_detail_Layout";
import AdminIdentity from "../AdminPages/AdminProfile/pagesTab/AdminIdentity/AdminIdentity";
import AdminCredentials from "../AdminPages/AdminProfile/pagesTab/AdminCredentials/AdminCredentials";
import AdminSecurity from "../AdminPages/AdminProfile/pagesTab/AdminSecurity/AdminSecurity";
import AdminActivity from "../AdminPages/AdminProfile/pagesTab/AdminActivity/AdminActivity";
import { useAdmin } from "../../../api_call/useAdmin";
import LoadingData from "../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../context/NotificationProvider/NotificationProvider";

// Admin Info routes (without subsession ID - Overall/Permanent)
const AdminIdentityPage = ({ adminData, onAdminUpdate, refreshAdminData, onToggleStatus, adminStatus }) => (
  <AdminIdentity
    adminData={adminData}
    onAdminUpdate={onAdminUpdate}
    refreshAdminData={refreshAdminData}
    onToggleStatus={onToggleStatus}
    adminStatus={adminStatus}
  />
);
const AdminCredentialsPage = ({
  adminData,
  onAdminUpdate,
  refreshAdminData,
}) => (
  <AdminCredentials
    adminData={adminData}
    onAdminUpdate={onAdminUpdate}
    refreshAdminData={refreshAdminData}
  />
);
const AdminSecurityPage = ({ adminData, onAdminUpdate, refreshAdminData }) => (
  <AdminSecurity
    adminData={adminData}
    onAdminUpdate={onAdminUpdate}
    refreshAdminData={refreshAdminData}
  />
);

// Session-specific routes (with subsession ID)
const AdminActivityPage = ({ adminData, onAdminUpdate, refreshAdminData }) => (
  <AdminActivity
    adminData={adminData}
    onAdminUpdate={onAdminUpdate}
    refreshAdminData={refreshAdminData}
  />
);

// Sample edit fields for admin
const adminEditFields = [
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

const AdminDetailRoute = () => {
  return (
    <Routes>
      {/* Default route - shows AdminProfile */}
      <Route
        path="/"
        element={
          <AdminDetailWrapper>
            <AdminIdentityPage />
          </AdminDetailWrapper>
        }
      />

      {/* Admin Info routes (no subsession ID needed - Overall/Permanent) */}
      <Route
        path="/identity"
        element={
          <AdminDetailWrapper>
            <AdminIdentityPage />
          </AdminDetailWrapper>
        }
      />
      <Route
        path="/permissions"
        element={
          <AdminDetailWrapper>
            <AdminCredentialsPage />
          </AdminDetailWrapper>
        }
      />
      <Route
        path="/security"
        element={
          <AdminDetailWrapper>
            <AdminSecurityPage />
          </AdminDetailWrapper>
        }
      />
      <Route
        path="/activity"
        element={
          <AdminDetailWrapper>
            <AdminActivityPage />
          </AdminDetailWrapper>
        }
      />

      {/* Catch all for not found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component that handles the layout and title/subtitle logic
const AdminDetailWrapper = ({ children }) => {
  const { adminId, schoolId } = useParams();
  const { updateAdmin, loading, error } = useAdmin();
  const { addNotification } = useNotification();

  const [adminData, setAdminData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState("active");

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Fetch admin data on component mount
  useEffect(() => {
    fetchAdminData();
  }, [adminId]);

  const fetchAdminData = async () => {
    if (!adminId) return;

    setDataLoading(true);
    try {
      console.log(
        "AdminDetailWrapper - Fetching admin detail for ID:",
        adminId
      );

      // Use the detail endpoint to get admin with staff info
      const response = await fetch(`${API_BASE_URL}/admin/${adminId}/detail`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      console.log("AdminDetailWrapper - Fetch result:", result);

      if (result.success) {
        console.log("AdminDetailWrapper - Setting admin data:", result.data);
        console.log("=== ADMIN DETAIL FETCHED ===");
        console.log("Admin:", result.data.admin);
        console.log("Staff:", result.data.staff);
        console.log("Sessions:", result.data.sessions);
        console.log("============================");
        setAdminData(result.data);
        setAdminStatus(result.data?.admin?.is_active ? "active" : "inactive");
      } else {
        console.error("AdminDetailWrapper - Fetch failed:", result.message);
        addNotification(
          result.message || "Failed to fetch admin data",
          "error"
        );
        setAdminData(null);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      addNotification("Error fetching admin data", "error");
      setAdminData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Show loading state for entire page
  if (dataLoading) {
    return (
      <LoadingData
        message="Loading admin profile..."
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
  if (error && !adminData) {
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
        <h2>Error Loading Admin Profile</h2>
        <p>Error: {error}</p>
        <button
          onClick={fetchAdminData}
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

  // Show not found if no admin data
  if (!adminData) {
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
        <h2>Admin Not Found</h2>
        <p>The administrator with ID "{adminId}" could not be found.</p>
      </div>
    );
  }

  // Define routes based on context
  const getRoutes = () => {
    return [
      { label: "Identity",     link: "/identity" },
      { label: "Permissions",  link: "/permissions" },
      { label: "Security",     link: "/security" },
      { label: "Activity",     link: "/activity" },
    ];
  };

  const getTitle = () => "Admin Profile";

  const getSubtitle = () => {
    const admin = adminData?.admin;
    const staff = adminData?.staff;
    const displayName = staff?.full_name || admin?.username || "Unknown Admin";
    const displayPosition = staff?.position || admin?.admin_role || "Administrator";
    const displayStatus = admin?.is_active ? "Active" : "Inactive";
    return `${displayName} • Admin ID: ${admin?.admin_id} • ${displayPosition} • ${displayStatus}`;
  };

  const handleAdminUpdate = async (formData) => {
    try {
      const result = await updateAdmin(adminId, formData);
      if (result.success) {
        addNotification("Admin profile updated successfully", "success");
        fetchAdminData();
        return { success: true };
      } else {
        addNotification(result.message || "Failed to update admin profile", "error");
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error("Error updating admin:", err);
      addNotification("Error updating admin profile", "error");
      return { success: false, error: err.message };
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = adminStatus === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`http://localhost:3000/admin/${adminId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus === "active" }),
      });
      const result = await res.json();
      if (result.success) {
        setAdminStatus(newStatus);
        addNotification(`Admin ${newStatus === "active" ? "activated" : "deactivated"} successfully`, newStatus === "active" ? "success" : "warning");
        fetchAdminData();
      } else {
        addNotification(result.message || "Failed to update admin status", "error");
      }
    } catch {
      addNotification("An error occurred while updating admin status", "error");
    }
  };

  // Clone children and pass adminData and refresh function as props
  const childrenWithProps = React.cloneElement(children, {
    adminData,
    onAdminUpdate: handleAdminUpdate,
    refreshAdminData: fetchAdminData,
    onToggleStatus: handleToggleStatus,
    adminStatus,
  });

  return (
    <Admin_detail_Layout
      title={getTitle()}
      subtitle={getSubtitle()}
      buttonText="Edit Admin"
      fields={adminEditFields}
      route={getRoutes()}
      data={adminData}
      onSubmit={handleAdminUpdate}
    >
      {childrenWithProps || <AdminProfile adminData={adminData} />}
    </Admin_detail_Layout>
  );
};

export default AdminDetailRoute;
