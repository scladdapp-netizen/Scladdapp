import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useSubject } from "../../../../../api_call/useSubject";
import useFetchSubjectsPaginated from "../../../../../api_call/useFetchSubjectsPaginated";
import AddSubjectPanel from "./AddSubjectPanel";
import "./Subjects.css";

const Subjects = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { loading, createSubject, deleteSubject } = useSubject();
  const { getSubjectsPaginated } = useFetchSubjectsPaginated();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.subject?.create;

  const [showAddSubjectMenu, setShowAddSubjectMenu] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0); // Trigger to refresh table
  const [newSubjectForm, setNewSubjectForm] = useState({
    subjectName: "",
    subjectCode: "",
    subjectDescription: "",
    stream: "",
    classTeacherRows: [{ class_id: "", teacher_id: "" }],
  });

  // Function to fetch subjects from backend (server-side pagination)
  const fetchSubjectsData = useCallback(
    async (params) => {
      console.log("\n========== FRONTEND FETCH DEBUG ==========");
      console.log("Fetching subjects with params:", params);

      const result = await getSubjectsPaginated(schoolId, params);

      console.log("Backend response:", result);

      if (result.success && result.data) {
        console.log(`Received ${result.data.length} subjects from backend`);
        console.log("First subject raw data:", result.data[0]);

        // Map backend data to frontend format for ServerSmartTable
        const mappedSubjects = result.data.map((subject) => ({
          subjectId: subject.subject_id,
          subjectCode: subject.subject_code,
          subjectName: subject.subject_name,
          stream: subject.stream || "—",
          status: subject.is_active ? "Active" : "Inactive",
          is_active: subject.is_active,
        }));

        console.log("First subject mapped data:", mappedSubjects[0]);
        console.log("==========================================\n");

        return {
          success: true,
          data: mappedSubjects,
          pagination: result.pagination,
        };
      }

      return result;
    },
    [schoolId, getSubjectsPaginated]
  );

  const columns = [
    {
      label: "ID",
      accessor: "subjectId",
      render: (v) => <span className="sub-mono">{v}</span>,
    },
    {
      label: "Code",
      accessor: "subjectCode",
      render: (v) => <span className="sub-code">{v}</span>,
    },
    {
      label: "Subject Name",
      accessor: "subjectName",
      render: (v) => <span className="sub-name">{v}</span>,
    },
    {
      label: "Stream",
      accessor: "stream",
      render: (v) => (
        <span className={v === "—" ? "sub-unassigned" : "sub-stream"}>{v}</span>
      ),
    },
    {
      label: "Status",
      accessor: "status",
      render: (v, row) => (
        <span className={`sub-badge ${row.is_active ? "sub-badge-active" : "sub-badge-inactive"}`}>{v}</span>
      ),
    },
  ];

  const handleBulkDelete = async (ids) => {
    try {
      // Delete each selected subject
      await Promise.all(ids.map((id) => deleteSubject(id, user?.admin?.admin_id || user?.user_id)));
      addNotification("Subjects deleted successfully", "success");
      // Refresh the table
      setRefreshTable((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting subjects:", error);
      addNotification("Failed to delete subjects", "error");
    }
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
    // show spinner, call backend to build CSV/XLSX etc.
  };

  const handleCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to add subjects.", "error");
      return;
    }
    setShowAddSubjectMenu(true);
  };

  const handleAddSubject = async () => {
    if (!newSubjectForm.subjectName || !newSubjectForm.subjectCode) {
      addNotification("Please fill in subject name and code", "error");
      return;
    }
    const rows = (newSubjectForm.classTeacherRows || []).filter((r) => r.class_id);
    if (rows.length === 0) {
      addNotification("Please assign at least one class", "error");
      return;
    }
    if (!schoolId) {
      addNotification("School information is missing", "error");
      return;
    }

    try {
      const response = await createSubject({
        subjectName: newSubjectForm.subjectName,
        subjectCode: newSubjectForm.subjectCode,
        subjectDescription: newSubjectForm.subjectDescription,
        stream: newSubjectForm.stream || null,
        school_id: schoolId,
        created_by: user?.admin?.admin_id || user?.user_id,
      });

      if (!response.success) {
        addNotification(response.message || "Failed to create subject", "error");
        return;
      }

      const subjectId = response.data.subject_id;

      // Assign each class (and optional teacher) in parallel
      await Promise.all(rows.map(async (row) => {
        // Class assignment
        try {
          const classRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/class-subject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject_id: subjectId, class_id: row.class_id, school_id: schoolId }),
          });
          const classData = await classRes.json();
          if (!classData.success) {
            addNotification(`Class assignment failed: ${classData.message}`, "warning");
          }
        } catch (e) {
          addNotification("Failed to assign a class", "warning");
        }

        // Teacher assignment (optional)
        if (row.teacher_id) {
          try {
            const teacherRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/teacher-subject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ subject_id: subjectId, teacher_id: row.teacher_id, school_id: schoolId, class_id: row.class_id }),
            });
            const teacherData = await teacherRes.json();
            if (!teacherData.success) {
              addNotification(`Teacher assignment failed: ${teacherData.message}`, "warning");
            }
          } catch (e) {
            addNotification("Failed to assign a teacher", "warning");
          }
        }
      }));

      addNotification(`Subject "${newSubjectForm.subjectName}" created successfully`, "success");
      setShowAddSubjectMenu(false);
      setNewSubjectForm({ subjectName: "", subjectCode: "", subjectDescription: "", stream: "", classTeacherRows: [{ class_id: "", teacher_id: "" }] });
      setRefreshTable((prev) => prev + 1);
    } catch (error) {
      addNotification(error.message || "An unexpected error occurred", "error");
    }
  };

  const handleFormChange = (field) => (value) => {
    setNewSubjectForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseAddSubjectPanel = () => {
    setShowAddSubjectMenu(false);
    setNewSubjectForm({ subjectName: "", subjectCode: "", subjectDescription: "", stream: "", classTeacherRows: [{ class_id: "", teacher_id: "" }] });
  };

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/subjects/${r.subjectId}`);
  };

  const handleViewSubject = (subject) => {
    navigate(`/admin/${schoolId}/subjects/${subject.subjectId}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="sub-header">
          <h2>Subjects</h2>
          <p>All academic subjects with their coordinators, departments, and enrollment information</p>
        </div>
        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchSubjectsData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Add Subject"
        />
      </InnerTabCon>

      <AddSubjectPanel
        isShow={showAddSubjectMenu}
        onClose={handleCloseAddSubjectPanel}
        formData={newSubjectForm}
        onFormChange={handleFormChange}
        onSubmit={handleAddSubject}
        loading={loading}
      />
    </div>
  );
};

export default Subjects;
