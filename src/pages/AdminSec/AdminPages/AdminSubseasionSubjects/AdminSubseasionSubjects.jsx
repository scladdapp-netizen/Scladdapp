import { useEffect } from "react";
import "./AdminSubseasionSubjects.css";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import SmartTable from "../../../../components/SmartTable/SmartTable";

const subjectData = [
  {
    subjectId: "S001",
    subjectName: "Mathematics",
    class: "5",
    section: "A",
    teacher: "Mr. John Doe",
    bookname: "Esential c0 maths",
  },
  {
    subjectId: "S002",
    subjectName: "Biology",
    class: "6",
    section: "B",
    teacher: "Mrs. Jane Lee",
    bookname: "Esential lo bio",
  },
  // Add more subjects as needed
];

const subjectColumns = [
  {
    label: "Subject ID",
    accessor: "subjectId",
  },
  {
    label: "Subject Name",
    accessor: "subjectName",
    render: (v) => <b>{v}</b>,
  },
  { label: "Class", accessor: "class" },
  { label: "Section", accessor: "section" },
  { label: "Teacher", accessor: "teacher" },
  { label: "Book Name", accessor: "bookname" },
  {
    label: "Actions",
    accessor: "actions",
    searchable: false,
    render: (_, row) => (
      <span
        className="action-link"
        style={{ color: "#5bba4aff", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          handleViewSubject(row);
        }}
      >
        View <FaArrowRight size={12} />
      </span>
    ),
  },
];

const AdminSubseasionSubjects = ({ setsetsubId }) => {
  const { subseasionId, schoolId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setsetsubId(subseasionId);
  }, [subseasionId]);

  const handleSubjectClick = (subject) => {
    // Navigate to subject profile with school ID
    const url = `/admin/${schoolId}/subjects/${subject.subjectId}/overview`;
    console.log("Navigating to:", url);
    console.log("Current schoolId:", schoolId);
    console.log("Subject ID:", subject.subjectId);
    navigate(url);
  };

  const handleViewSubject = (subject) => {
    // Navigate to subject profile with current subsession
    navigate(
      `/admin/${schoolId}/subjects/${subject.subjectId}/${subseasionId}/classes`
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

  return (
    <div>
      <div className="spts">
        <h2>Subjects</h2>
      </div>
      <SmartTable
        columns={subjectColumns}
        data={subjectData}
        onRowClick={(subject) => handleSubjectClick(subject)}
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

export default AdminSubseasionSubjects;
