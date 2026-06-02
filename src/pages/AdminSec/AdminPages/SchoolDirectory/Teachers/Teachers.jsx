import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import CreateTeacherPanel from "./CreateTeacherPanel";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import {
  useTeacherInfo,
  useFetchTeachersPaginated,
} from "../../../../../api_call";
import "./Teachers.css";

const Teachers = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { deleteTeacher } = useTeacherInfo();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.teachers?.create;
  const {
    getTeachersPaginated,
    loading: fetchLoading,
    error: fetchError,
  } = useFetchTeachersPaginated();

  const [showAddTeacherMenu, setShowAddTeacherMenu] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch function for ServerSmartTable
  const fetchTeachersData = async (params) => {
    if (!schoolId) return { success: false, data: [], pagination: {} };

    try {
      const result = await getTeachersPaginated(schoolId, params);
      return result;
    } catch (err) {
      console.error("Error fetching teachers data:", err);
      addNotification("Error fetching teachers data", "error");
      return { success: false, data: [], pagination: {} };
    }
  };

  const columns = [
    {
      label: "ID",
      accessor: "teacher_id",
      render: (v) => <span className="tch-mono">{v ? v.substring(0, 8) : "N/A"}</span>,
    },
    {
      label: "Code",
      accessor: "teacher_code",
      render: (v) => <span className="tch-code">{v || "N/A"}</span>,
    },
    {
      label: "Teacher Name",
      accessor: "staff",
      render: (_, row) => <span className="tch-name">{row.staff?.full_name || "N/A"}</span>,
    },
    {
      label: "Email",
      accessor: "staff",
      render: (_, row) => <span className="tch-email">{row.staff?.email || "N/A"}</span>,
    },
    {
      label: "Appointed At",
      accessor: "appointed_at",
      render: (v) => (
        <span className="tch-date">
          {v ? new Date(v).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"}
        </span>
      ),
    },
    {
      label: "Appointed By",
      accessor: "appointed_by",
      render: (_, row) => {
        const adm = row.appointed_by_admin;
        if (!adm) return <span className="tch-unassigned">N/A</span>;
        return (
          <div className="tch-appointed-by">
            <span className="tch-appointed-name">{adm.full_name || adm.username || adm.email || "Unknown"}</span>
            <span className="tch-appointed-role">{adm.admin_role || "Admin"}</span>
          </div>
        );
      },
    },
    {
      label: "Status",
      accessor: "is_active",
      render: (v) => (
        <span className={`tch-badge ${v ? "tch-badge-active" : "tch-badge-inactive"}`}>
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;

    try {
      // ids are teacher_codes, we need to delete by teacher_id
      const deletePromises = ids.map((teacherCode) => {
        // For server-side pagination, we need to fetch teacher by code first
        // For now, we'll use the teacher_code as identifier
        // Note: This assumes teacher_code is unique, which it should be
        return deleteTeacher(teacherCode, user?.admin?.admin_id || user?.user_id);
      });

      const results = await Promise.all(deletePromises);

      const successCount = results.filter((r) => r && r.success).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        addNotification(
          `${successCount} teacher(s) deleted successfully`,
          "success"
        );
        // Trigger refresh
        setRefreshTrigger((prev) => prev + 1);
      }

      if (failCount > 0) {
        addNotification(`Failed to delete ${failCount} teacher(s)`, "error");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      addNotification("Error deleting teachers", "error");
    }
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
  };

  const handleCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to add teachers.", "error");
      return;
    }
    setShowAddTeacherMenu(true);
  };

  const handleTeacherCreated = (newTeacher) => {
    // Handle the newly created teacher - refresh the list
    console.log("New teacher created:", newTeacher);

    // Show success notification
    addNotification(`Teacher created successfully!`, "success");

    // Trigger refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/teachers/${r.teacher_id}`);
  };

  const handleViewTeacher = (teacher) => {
    navigate(`/admin/${schoolId}/teachers/${teacher.teacher_id}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="tch-header">
          <h2>Teachers</h2>
          <p>All teaching staff with their subjects, departments, and contact information</p>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchTeachersData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          showcreatbut={true}
          creattext="Add Teacher"
          getRowId={(row) => row.teacher_code}
          refreshTrigger={refreshTrigger}
          reloadKey={refreshTrigger}
          defaultSortBy="appointed_at"
          defaultSortOrder="desc"
        />
      </InnerTabCon>

      {/* Create Teacher Panel */}
      <CreateTeacherPanel
        isShow={showAddTeacherMenu}
        onClose={() => setShowAddTeacherMenu(false)}
        onTeacherCreated={handleTeacherCreated}
      />
    </div>
  );
};

export default Teachers;
