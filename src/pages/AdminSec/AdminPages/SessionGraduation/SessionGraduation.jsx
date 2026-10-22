import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import "./SessionGraduation.css";

const SessionGraduation = () => {
  const { seasionId, schoolId } = useParams();
  const navigate = useNavigate();

  const openProfile = (alumni) => {
    const id = alumni?.alumniId || alumni?.id;
    if (!id) return;
    navigate(`/admin/${schoolId}/alumni/profile/${id}`);
  };

  const fetchGraduates = useCallback(async (params) => {
    try {
      const q = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || "",
        searchField: params.searchField || "",
        sortBy: "graduation_date",
        sortOrder: "desc",
      });
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alumni/session/${seasionId}?${q}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) {
        return {
          success: true,
          data: result.data.map((a) => ({
            id: a.alumni_id,
            alumniId: a.alumni_id,
            studentId: a.student_id,
            studentName: a.student_name || "Unknown",
            admissionNumber: a.admission_number || "N/A",
            finalClassName: a.final_class_name || "N/A",
            graduationDate: a.graduation_date,
            graduationSessionName: a.graduation_session_name,
            contactEmail: a.contact_email,
            contactPhone: a.contact_phone,
            contactAddress: a.contact_address,
            currentOccupation: a.current_occupation,
            remarks: a.remarks,
          })),
          pagination: result.pagination,
        };
      }
      return result;
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }, [seasionId]);

  const columns = [
    {
      label: "Student Name", accessor: "studentName",
      render: (v) => <span className="sg-name">{v}</span>,
    },
    {
      label: "Admission No.", accessor: "admissionNumber",
      render: (v) => <span className="sg-id-pill">{v}</span>,
    },
    { label: "Final Class", accessor: "finalClassName" },
    {
      label: "Graduation Date", accessor: "graduationDate",
      render: (v) => v ? new Date(v).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "N/A",
    },
    { label: "Email", accessor: "contactEmail" },
  ];

  return (
    <div className="sg-container">
      <InnerTabCon>
        <div className="sg-header">
          <h2>Graduation</h2>
          <p>All graduates of this academic session</p>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchGraduates}
          onRowClick={(r) => openProfile(r)}
          maxRowsPerPage={20}
          enableSelect
          exportDefaults={{
            includeColumns: ["studentName", "admissionNumber", "finalClassName", "graduationDate", "contactEmail", "contactPhone"],
            format: "csv",
          }}
          showcreatbut={false}
        />
      </InnerTabCon>
    </div>
  );
};

export default SessionGraduation;
