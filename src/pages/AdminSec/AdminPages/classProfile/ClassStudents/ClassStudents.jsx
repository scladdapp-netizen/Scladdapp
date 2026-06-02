import { useParams, useNavigate } from "react-router-dom";
import "./ClassStudents.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import { useClassStudents } from "../../../../../api_call/useClassStudents";

const ClassStudents = () => {
  const { classId, subseasion, schoolId } = useParams();
  const navigate = useNavigate();
  const { makeClassStudentsFetcher } = useClassStudents();

  const fetchData = makeClassStudentsFetcher(classId, subseasion);

  const columns = [
    {
      label: "Student",
      accessor: "full_name",
      render: (val, row) => (
        <div className="cls-name-cell">
          <div className="cls-avatar">
            {row.student_photo
              ? <img src={row.student_photo} alt={val} />
              : (val || "?").charAt(0).toUpperCase()
            }
          </div>
          <span className="cls-student-name">{val}</span>
        </div>
      ),
    },
    { label: "Admission No.", accessor: "admission_number" },
    { label: "Gender",        accessor: "gender" },
    {
      label: "Date of Birth",
      accessor: "date_of_birth",
      searchable: false,
      render: (val) =>
        val
          ? new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
    },
    { label: "Phone",         accessor: "phone" },
    { label: "Guardian",      accessor: "guardian_name" },
    { label: "Guardian Phone", accessor: "guardian_phone" },
    {
      label: "Status",
      accessor: "student_status",
      searchable: false,
      render: (val) => (
        <span className={`cls-status ${val === "active" ? "active" : "inactive"}`}>
          {val}
        </span>
      ),
    },
    {
      label: "",
      accessor: "actions",
      searchable: false,
      render: (_, row) => (
        <span
          className="cls-action-link"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/${schoolId}/Profile/${row.student_id}`); }}
        >
          View Profile
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      ),
    },
  ];

  return (
    <InnerTabCon>
      <div className="classStudents">

        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Students</h2>
            <p className="cls-subtitle">All students assigned to this class for this term</p>
          </div>
        </div>

        <div className="cls-table-container">
          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            onRowClick={(row) => navigate(`/admin/${schoolId}/Profile/${row.student_id}`)}
            enableSelect={true}
            showcreatbut={false}
            initialPageSize={20}
            reloadKey={`${classId}-${subseasion}`}
          />
        </div>

      </div>
    </InnerTabCon>
  );
};

export default ClassStudents;
