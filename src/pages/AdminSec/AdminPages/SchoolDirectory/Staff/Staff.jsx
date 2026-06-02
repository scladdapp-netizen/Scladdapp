import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import StaffFormPanel from "./StaffFormPanel";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useStaffInfo, useFetchStaffPaginated } from "../../../../../api_call";
import "./Staff.css";

const Staff = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { deleteStaff, loading, error } = useStaffInfo();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.staff?.create;
  const { getStaffPaginated } = useFetchStaffPaginated();

  const [showAddStaffMenu, setShowAddStaffMenu] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0); // Trigger to refresh table

  // Function to fetch staff from backend (server-side pagination)
  const fetchStaffData = useCallback(
    async (params) => {
      const result = await getStaffPaginated(schoolId, params);

      if (result.success && result.data) {
        // Data is already in the correct format from backend
        return {
          success: true,
          data: result.data,
          pagination: result.pagination,
        };
      }

      return result;
    },
    [schoolId, getStaffPaginated]
  );

  const columns = [
    {
      label: "ID",
      accessor: "staff_id",
      render: (v) => <span className="stf-mono">{v ? v.substring(0, 8) : "N/A"}</span>,
    },
    {
      label: "Photo",
      accessor: "staff_photo",
      render: (v, row) => (
        <div className="stf-avatar-wrap">
          {v && typeof v === "string" ? (
            <>
              <img src={v} alt={row.full_name} className="stf-avatar"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="stf-avatar-fallback" style={{ display: "none" }}>
                {row.full_name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
            </>
          ) : (
            <div className="stf-avatar-fallback">
              {row.full_name?.split(" ").map(n => n[0]).join("").substring(0, 2) || "?"}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Name",
      accessor: "full_name",
      render: (v) => <span className="stf-name">{v}</span>,
    },
    {
      label: "Email",
      accessor: "email",
      render: (v) => <span className="stf-email">{v}</span>,
    },
    {
      label: "Position",
      accessor: "position",
      render: (v) => <span className="stf-position">{v}</span>,
    },
    {
      label: "Job Title",
      accessor: "job_title",
      render: (v) => <span className="stf-jobtitle">{v}</span>,
    },
    {
      label: "Phone",
      accessor: "phone",
      render: (v) => <span className="stf-phone">{v}</span>,
    },
    {
      label: "Status",
      accessor: "is_active",
      render: (v) => {
        const active = v === true || v === "true";
        return <span className={`stf-badge ${active ? "stf-badge-active" : "stf-badge-inactive"}`}>{active ? "Active" : "Inactive"}</span>;
      },
    },
  ];

  // Helper function to get role badge colors
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Senior Management":
        return { bg: "#fef3c7", text: "#92400e" };
      case "Management":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "Administrative":
        return { bg: "#e0e7ff", text: "#3730a3" };
      case "Technical Staff":
        return { bg: "#d1fae5", text: "#065f46" };
      case "Support Staff":
        return { bg: "#f3e8ff", text: "#6b21a8" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;

    try {
      const deletePromises = ids.map((id) => deleteStaff(id, user?.admin?.admin_id || user?.user_id));
      const results = await Promise.all(deletePromises);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        addNotification(
          `${successCount} staff member(s) deleted successfully`,
          "success"
        );
        // Refresh the table
        setRefreshTable((prev) => prev + 1);
      }

      if (failCount > 0) {
        addNotification(
          `Failed to delete ${failCount} staff member(s)`,
          "error"
        );
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      addNotification("Error deleting staff members", "error");
    }
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
  };

  const handleCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to add staff.", "error");
      return;
    }
    setShowAddStaffMenu(true);
  };

  const handleAddStaff = (staffData) => {
    // This function will be called by StaffFormPanel after successful API call
    console.log("Staff created successfully:", staffData);

    // Show success notification
    addNotification(
      `Staff member ${
        staffData.staff?.full_name || "Unknown"
      } created successfully!`,
      "success"
    );

    // Refresh the staff table
    setRefreshTable((prev) => prev + 1);

    // Show staff ID notification
    if (staffData.staff?.staff_id) {
      setTimeout(() => {
        addNotification(
          `Staff ID ${staffData.staff.staff_id} has been assigned`,
          "info"
        );
      }, 1500);
    }
  };

  const handleClick = (r) => {
    // Navigate to staff profile using the staff ID
    navigate(`/admin/${schoolId}/staff/${r.staff_id}`);
  };

  const handleViewStaff = (staff) => {
    // Navigate to staff profile using the staff ID
    navigate(`/admin/${schoolId}/staff/${staff.staff_id}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="stf-header">
          <h2>Staff</h2>
          <p>All non-teaching staff including administrative, support, and technical personnel</p>
        </div>
        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchStaffData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Add Staff"
        />
      </InnerTabCon>

      <StaffFormPanel
        isShow={showAddStaffMenu}
        onClose={() => setShowAddStaffMenu(false)}
        onSubmit={handleAddStaff}
        isEditMode={false}
      />
    </div>
  );
};

export default Staff;
