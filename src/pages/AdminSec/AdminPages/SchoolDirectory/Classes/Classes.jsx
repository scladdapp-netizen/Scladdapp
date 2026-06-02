import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useClass } from "../../../../../api_call/useClass";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useFetchClassesPaginated from "../../../../../api_call/useFetchClassesPaginated";
import AddClassPanel from "./AddClassPanel";
import "./Classes.css";

const Classes = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, createClass, deleteClass } = useClass();
  const { getClassesPaginated } = useFetchClassesPaginated();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.classes?.create;

  const [showAddClassMenu, setShowAddClassMenu] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0); // Trigger to refresh table
  const [newClassForm, setNewClassForm] = useState({
    className: "",
    classCode: "",
    classSection: "",
    classType: "",
    roomNumber: "",
    teacherId: "",
  });

  // Function to fetch classes from backend (server-side pagination)
  const fetchClassesData = useCallback(
    async (params) => {
      console.log("\n========== FRONTEND FETCH DEBUG ==========");
      console.log("Fetching classes with params:", params);

      const result = await getClassesPaginated(schoolId, params);

      console.log("Backend response:", result);

      if (result.success && result.data) {
        console.log(`Received ${result.data.length} classes from backend`);
        console.log("First class raw data:", result.data[0]);

        // Map backend data to frontend format for ServerSmartTable
        const mappedClasses = result.data.map((cls) => ({
          classId: cls.class_id,
          classCode: cls.class_code,
          className: cls.class_name,
          classTeacher: cls.headmaster_name || "Not Assigned",
          studentsCount: cls.students_count || 0,
          roomNumber: cls.room_number || "N/A",
          status: cls.is_active ? "Active" : "Inactive",
          is_active: cls.is_active,
        }));

        console.log("First class mapped data:", mappedClasses[0]);
        console.log("==========================================\n");

        return {
          success: true,
          data: mappedClasses,
          pagination: result.pagination,
        };
      }

      return result;
    },
    [schoolId, getClassesPaginated]
  );

  const columns = [
    {
      label: "ID",
      accessor: "classId",
      render: (v) => <span className="cls-mono">{v}</span>,
    },
    {
      label: "Code",
      accessor: "classCode",
      render: (v) => <span className="cls-code">{v}</span>,
    },
    {
      label: "Class Name",
      accessor: "className",
      render: (v) => <span className="cls-name">{v}</span>,
    },
    {
      label: "Class Teacher",
      accessor: "classTeacher",
      render: (v) => (
        <span className={v === "Not Assigned" ? "cls-unassigned" : "cls-teacher"}>{v}</span>
      ),
    },
    {
      label: "Students",
      accessor: "studentsCount",
      render: (v) => <span className="cls-count">{v}</span>,
    },
    {
      label: "Room",
      accessor: "roomNumber",
      render: (v) => <span className="cls-room">{v}</span>,
    },
    {
      label: "Status",
      accessor: "status",
      render: (v, row) => (
        <span className={`cls-badge ${row.is_active ? "cls-badge-active" : "cls-badge-inactive"}`}>{v}</span>
      ),
    },
  ];

  const handleBulkDelete = async (ids) => {
    try {
      // Delete each selected class
      await Promise.all(ids.map((id) => deleteClass(id, user?.admin?.admin_id || user?.user_id)));
      addNotification("Classes deleted successfully", "success");
      // Refresh the table
      setRefreshTable((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting classes:", error);
      addNotification("Failed to delete classes", "error");
    }
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
    // show spinner, call backend to build CSV/XLSX etc.
  };

  const handleCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to add classes.", "error");
      return;
    }
    setShowAddClassMenu(true);
  };

  const handleAddClass = async () => {
    // Validate required fields
    const requiredFields = [
      "className",
      "classCode",
      "classSection",
      "classType",
    ];
    const missingFields = requiredFields.filter(
      (field) => !newClassForm[field] || !newClassForm[field].toString().trim()
    );

    if (missingFields.length > 0) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    // Check if school ID is available
    if (!schoolId) {
      addNotification(
        "School information is missing. Please refresh the page and try again.",
        "error"
      );
      return;
    }

    try {
      console.log("Creating class with data:", {
        className: newClassForm.className,
        classCode: newClassForm.classCode,
        classSection: newClassForm.classSection,
        classType: newClassForm.classType,
        school_id: schoolId,
        created_by: user?.admin?.admin_id || user?.user_id,
      });

      // Create class via API
      const response = await createClass({
        className: newClassForm.className,
        classCode: newClassForm.classCode,
        classSection: newClassForm.classSection,
        classType: newClassForm.classType,
        roomNumber: newClassForm.roomNumber,
        school_id: schoolId,
        created_by: user?.admin?.admin_id || user?.user_id,
      });

      console.log("Create class response:", response);

      if (response.success) {
        const classId = response.data.class_id;

        // If a teacher was selected, assign as headmaster
        if (newClassForm.teacherId) {
          try {
            const headmasterResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/headmaster`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  class_id: classId,
                  teacher_id: newClassForm.teacherId,
                  school_id: schoolId,
                  assigned_by: user?.admin?.admin_id || user?.user_id,
                }),
              }
            );

            const headmasterResult = await headmasterResponse.json();
            if (!headmasterResult.success) {
              console.error("Failed to assign headmaster:", headmasterResult);
              addNotification(
                "Class created but failed to assign headmaster",
                "warning"
              );
            }
          } catch (error) {
            console.error("Error assigning headmaster:", error);
            addNotification(
              "Class created but failed to assign headmaster",
              "warning"
            );
          }
        }

        addNotification(
          response.message ||
            `Class ${newClassForm.className} created successfully!`,
          "success"
        );

        // Close panel and reset form
        setShowAddClassMenu(false);
        setNewClassForm({
          className: "",
          classCode: "",
          classSection: "",
          classType: "",
          roomNumber: "",
          teacherId: "",
        });

        // Refresh classes list
        await setRefreshTable((prev) => prev + 1);
      } else {
        // Show error from backend
        addNotification(response.message || "Failed to create class", "error");
      }
    } catch (error) {
      console.error("Error creating class:", error);
      addNotification(
        error.message || "An unexpected error occurred. Please try again.",
        "error"
      );
    }
  };

  const handleFormChange = (field) => (value) => {
    setNewClassForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseAddClassPanel = () => {
    setShowAddClassMenu(false);
    setNewClassForm({
      className: "",
      classCode: "",
      classSection: "",
      classType: "",
      roomNumber: "",
      teacherId: "",
    });
  };

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/Class/${r.classId}`);
  };

  const handleViewClass = (classItem) => {
    navigate(`/admin/${schoolId}/Class/${classItem.classId}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="cls-header">
          <h2>Classes</h2>
          <p>All classes in the school with their teachers, students, and room assignments</p>
        </div>
        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchClassesData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Add Class"
        />
      </InnerTabCon>

      {/* Add Class Panel */}
      <AddClassPanel
        isShow={showAddClassMenu}
        onClose={handleCloseAddClassPanel}
        formData={newClassForm}
        onFormChange={handleFormChange}
        onSubmit={handleAddClass}
        loading={loading}
      />
    </div>
  );
};

export default Classes;
