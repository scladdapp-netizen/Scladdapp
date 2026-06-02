import { useEffect } from "react";
import "./AdminSubseasionClasses.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import SmartTable from "../../../../components/SmartTable/SmartTable";

const classListData = [
  {
    classId: "C001",
    className: "Grade 5",
    section: "A",
    teacher: "Mrs. Jane Doe",
    studentCount: 35,
  },
  {
    classId: "C002",
    className: "Grade 5",
    section: "B",
    teacher: "Mr. John Smith",
    studentCount: 32,
  },
  // Add more classes as needed
];

const AdminSubseasionClasses = ({ setsetsubId }) => {
  const { subseasionId, schoolId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setsetsubId(subseasionId);
  }, [subseasionId]);

  const handleClassClick = (classRow) => {
    // Navigate to class detail page
    const url = `/admin/${schoolId}/Class/${classRow.classId}/overview`;
    console.log("Navigating to:", url);
    console.log("Current schoolId:", schoolId);
    console.log("Class ID:", classRow.classId);
    navigate(url);
  };

  const handleViewEdit = (classRow) => {
    // Navigate to class detail page with current subsession
    navigate(
      `/admin/${schoolId}/Class/${classRow.classId}/${subseasionId}/students`
    );
  };

  const handleBulkDelete = async (ids) => {
    // call your API to delete; return when done
    console.log("delete", ids);
    // example: await api.deleteMany(ids)
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
    // show spinner, call backend to build CSV/XLSX etc.
  };

  const handleCreate = () => {
    // open create modal / navigate
    console.log("create pressed");
  };

  const classListColumns = [
    {
      label: "Class ID",
      accessor: "classId",
    },
    {
      label: "Class Name",
      accessor: "className",
      render: (v) => <b>{v}</b>,
    },
    { label: "Section", accessor: "section" },
    { label: "Teacher", accessor: "teacher" },
    {
      label: "# Students",
      accessor: "studentCount",
    },
    {
      label: "Actions",
      accessor: "actions",
      searchable: false,
      render: (val, row) => (
        <span
          className="action-link"
          style={{ color: "#5bba4aff", cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewEdit(row);
          }}
        >
          View / Edit <FaArrowRight size={12} />
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="spts">
        <h2>Classes</h2>
      </div>
      <SmartTable
        columns={classListColumns}
        data={classListData}
        onRowClick={handleClassClick}
        enableSelect={true}
        onSelectChange={(ids) => console.log("selected changed", ids)}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        onCreate={handleCreate}
        maxRowsPerPage={15}
        showcreatbut={false}
      />
    </div>
  );
};

export default AdminSubseasionClasses;
