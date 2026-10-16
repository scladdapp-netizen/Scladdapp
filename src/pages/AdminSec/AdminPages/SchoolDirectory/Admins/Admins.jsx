import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import StatusFilterSwitch from "../../../../../components/StatusFilterSwitch/StatusFilterSwitch";
import PromoteStaffPanel from "./PromoteStaffPanel";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAdmin } from "../../../../../api_call/useAdmin";
import useFetchAdminsPaginated from "../../../../../api_call/useFetchAdminsPaginated";
import { FaUser } from "react-icons/fa";
import "./Admins.css";

const Admins = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { deleteAdmin } = useAdmin();
  const { getAdminsPaginated } = useFetchAdminsPaginated();

  const [showPromoteStaffMenu, setShowPromoteStaffMenu] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0); // Trigger to refresh table
  // "active" | "inactive" switch shown in the header
  const [statusFilter, setStatusFilter] = useState("active");
  const [statusCounts, setStatusCounts] = useState({ active: null, inactive: null });

  // Function to fetch admins from backend (server-side pagination)
  const fetchAdminsData = useCallback(
    async (params) => {
      const result = await getAdminsPaginated(schoolId, { ...params, status: statusFilter });
      if (result?.counts) setStatusCounts(result.counts);

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
    [schoolId, getAdminsPaginated, statusFilter]
  );

  const getRoleBadgeClass = (role) => {
    const r = String(role).toLowerCase();
    if (r.includes("super")) return "adm-role-super";
    if (r.includes("senior") || r.includes("head")) return "adm-role-senior";
    return "adm-role-default";
  };

  const getScopeBadgeClass = (scope) => {
    if (scope === "full")       return "adm-scope-full";
    if (scope === "department") return "adm-scope-dept";
    return "adm-scope-limited";
  };

  const columns = [
    {
      label: "ID",
      accessor: "admin_id",
      render: (v) => <span className="adm-mono">{v ? v.substring(0, 8) : "N/A"}</span>,
    },
    {
      label: "Photo",
      accessor: "staff_photo",
      render: (v, row) => {
        const name = row.full_name || row.username || "?";
        return (
          <div className="adm-avatar-wrap">
            {v && typeof v === "string" ? (
              <>
                <img src={v} alt={name} className="adm-avatar"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
                <div className="adm-avatar-fallback" style={{ display: "none" }}>
                  <FaUser />
                </div>
              </>
            ) : (
              <div className="adm-avatar-fallback">
                <FaUser />
              </div>
            )}
          </div>
        );
      },
    },
    {
      label: "Name",
      accessor: "full_name",
      render: (v, row) => (
        <div className="adm-name-cell">
          <span className="adm-name">{v || row.username}</span>
          {row.staff_id && <span className="adm-staff-id">Staff: {row.staff_id.substring(0, 8)}</span>}
        </div>
      ),
    },
    {
      label: "Email",
      accessor: "email",
      render: (v) => <span className="adm-email">{v}</span>,
    },
    {
      label: "Admin Role",
      accessor: "admin_role",
      render: (v) => <span className={`adm-role-badge ${getRoleBadgeClass(v)}`}>{v}</span>,
    },
    {
      label: "Access Scope",
      accessor: "access_scope",
      render: (v) => <span className={`adm-scope-badge ${getScopeBadgeClass(v)}`}>{v}</span>,
    },
    {
      label: "Position",
      accessor: "position",
      render: (v) => <span className={v ? "adm-position" : "adm-unassigned"}>{v || "N/A"}</span>,
    },
    {
      label: "Phone",
      accessor: "phone",
      render: (v) => <span className={v && v !== "N/A" ? "adm-phone" : "adm-unassigned"}>{v || "N/A"}</span>,
    },
    {
      label: "Status",
      accessor: "is_active",
      render: (v) => {
        const active = v === true || v === "true";
        return <span className={`adm-badge ${active ? "adm-badge-active" : "adm-badge-inactive"}`}>{active ? "Active" : "Inactive"}</span>;
      },
    },
  ];

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;

    try {
      const deletePromises = ids.map((id) => deleteAdmin(id));
      const results = await Promise.all(deletePromises);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        addNotification(
          `${successCount} admin(s) deleted successfully`,
          "success"
        );
        // Refresh the table
        setRefreshTable((prev) => prev + 1);
      }

      if (failCount > 0) {
        addNotification(`Failed to delete ${failCount} admin(s)`, "error");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      addNotification("Error deleting admins", "error");
    }
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
    // TODO: Implement export functionality
    addNotification("Export functionality coming soon", "info");
  };

  const handleCreate = () => {
    setShowPromoteStaffMenu(true);
  };

  const handlePromoteStaffClose = () => {
    setShowPromoteStaffMenu(false);
    // Refresh the table when panel closes (in case a promotion was successful)
    setRefreshTable((prev) => prev + 1);
  };

  const handleClick = (r) => {
    // Navigate to admin profile using the admin ID
    navigate(`/admin/${schoolId}/admins/${r.admin_id}`);
  };

  const handleViewAdmin = (admin) => {
    // Navigate to admin profile using the admin ID
    navigate(`/admin/${schoolId}/admins/${admin.admin_id}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="adm-header dir-header">
          <div className="dir-header-text">
            <h2>Administrators</h2>
            <p>System administrators with elevated privileges and access controls</p>
          </div>
          <StatusFilterSwitch
            value={statusFilter}
            onChange={setStatusFilter}
            counts={statusCounts}
            activeLabel="Active Admins"
            inactiveLabel="Inactive Admins"
            inactiveTitle="Administrators whose access has been deactivated"
            ariaLabel="Admins status filter"
          />
        </div>
        <ServerSmartTable
          key={`${refreshTable}-${statusFilter}`}
          columns={columns}
          fetchData={fetchAdminsData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Promote Staff"
        />
      </InnerTabCon>

      <PromoteStaffPanel
        isShow={showPromoteStaffMenu}
        onClose={handlePromoteStaffClose}
        schoolId={schoolId}
      />
    </div>
  );
};

export default Admins;
