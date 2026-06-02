import React, { useEffect } from "react";
import "./AdminSubseasionStudents.css";
import { useNavigate, useParams } from "react-router-dom";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import { FaArrowRight } from "react-icons/fa";

const studentData = [
  {
    studentId: "S001",
    photo: "/images/john.jpg",
    name: "John Doe",
    class: "5",
    section: "A",
    stream: "Science",
    dob: "2012-01-05",
    gender: "M",
    parentName: "Jane Doe",
    contact: "08012345678",
    status: "Active",
  },
  // Add more students as needed
];

const columns = [
  {
    label: "ID",
    accessor: "studentId",
  },
  {
    label: "Passport",
    accessor: "photo",
    render: (v) =>
      v ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <img src={v} style={{ width: 28, height: 28, borderRadius: 999 }} />
        </div>
      ) : (
        ""
      ),
  },
  {
    label: "Name",
    accessor: "name",
    render: (v) => <b>{v}</b>,
  },
  { label: "Class", accessor: "class" },
  { label: "Section", accessor: "section" },
  { label: "DOB", accessor: "dob" },
  { label: "Gender", accessor: "gender" },
  { label: "Stream", accessor: "stream" },
  { label: "Parent Name", accessor: "parentName" },
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
          alert(`Edit/View student: ${row.name}`);
        }}
      >
        View <FaArrowRight size={12} />
      </span>
    ),
  },
];

// export { classData, columns };

const AdminSubseasionStudents = ({ setsetsubId }) => {
  const { subseasionId, schoolId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setsetsubId(subseasionId);
  }, [subseasionId]);

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

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/Profile/${r.studentId}`);
  };

  return (
    <div>
      <div className="spts">
        <h2>Students</h2>
      </div>
      <SmartTable
        columns={columns}
        data={studentData}
        onRowClick={handleClick}
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

export default AdminSubseasionStudents;
