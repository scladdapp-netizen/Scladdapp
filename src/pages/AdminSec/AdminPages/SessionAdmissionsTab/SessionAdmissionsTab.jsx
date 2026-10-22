import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import "./SessionAdmissionsTab.css";

const SessionAdmissionsTab = () => {
  const { schoolId, seasionId } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });

  // Fetch student admissions for this session (only admission method)
  const fetchSessionAdmissions = useCallback(
    async (params) => {
      try {
        console.log("Fetching session admissions for session:", seasionId);
        console.log("Params:", params);

        const queryParams = new URLSearchParams({
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || "",
          searchField: params.searchField || "",
          sortBy: params.sortBy || "assignment_date",
          sortOrder: params.sortOrder || "desc",
          assignmentMethod: "admission", // Filter only admissions
        });

        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/student-class-assignment/session/${seasionId}?${queryParams}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Map the data to include student information
          const mappedData = result.data.map((assignment) => ({
            assignment_id: assignment.assignment_id,
            student_id: assignment.student_id,
            student_name: assignment.student_name || "Unknown",
            class_id: assignment.class_id,
            admission_class: assignment.class_name,
            stream: assignment.stream || "N/A",
            admitted_date: assignment.assignment_date || assignment.assigned_date,
            admission_session: assignment.session_name,
            active_status: assignment.is_active,
            remarks: assignment.remarks,
          }));

          // Prefer server-wide stats (not page-only counts)
          if (result.stats) {
            setStats({
              active: result.stats.active || 0,
              inactive: result.stats.inactive || 0,
              total: result.stats.total || 0,
            });
          } else {
            const active = mappedData.filter((a) => a.active_status).length;
            const total = result.pagination?.totalItems || mappedData.length;
            setStats({
              active,
              inactive: Math.max(0, total - active),
              total,
            });
          }

          return {
            success: true,
            data: mappedData,
            pagination: result.pagination,
          };
        }

        return result;
      } catch (error) {
        console.error("Error fetching session admissions:", error);
        return {
          success: false,
          data: [],
          message: error.message || "Failed to fetch session admissions",
        };
      }
    },
    [seasionId]
  );

  const openStudentProfile = (admission) => {
    const id = admission?.student_id;
    if (!id) return;
    navigate(`/admin/${schoolId}/Profile/${id}`);
  };

  const handleExport = ({ format, columns: cols, selectedIds: ids }) => {
    // The export modal passes back selectedIds — use them as the row identifiers
    const headers = ["student_id", "student_name", "admission_class", "stream", "admitted_date", "active_status"];
    const selectedCols = cols && cols.length ? cols : headers;

    // Build a note row since we only have IDs at this point (full data is server-side)
    const csv = [
      selectedCols.join(","),
      ...ids.map(id => selectedCols.map(h => h === "student_id" ? `"${id}"` : '""').join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admissions-${seasionId}.${format || "csv"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      label: "Student ID",
      accessor: "student_id",
      render: (v) => <span className="sa-id-pill">{v}</span>,
    },
    {
      label: "Student Name",
      accessor: "student_name",
      render: (v) => <span className="sa-name">{v}</span>,
    },
    { label: "Class",  accessor: "admission_class" },
    { label: "Stream", accessor: "stream" },
    {
      label: "Admitted",
      accessor: "admitted_date",
      render: (v) => v ? new Date(v).toLocaleDateString() : "N/A",
    },
    {
      label: "Status",
      accessor: "active_status",
      render: (v) => (
        <span className={`sa-status-pill ${v ? "active" : "inactive"}`}>
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  return (
    <div className="session-admissionss">
      <InnerTabCon>
        {/* ── Stat cards ── */}
        <div className="sa-stats">
          <div className="sa-stat-card">
            <div className="sa-stat-ico">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 19c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M14 5l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </div>
            <div className="sa-stat-body">
              <span className="sa-stat-label">Active</span>
              <span className="sa-stat-value">{stats.active}</span>
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-ico">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M3 19c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M9 5l-2 2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
              </svg>
            </div>
            <div className="sa-stat-body">
              <span className="sa-stat-label">Inactive</span>
              <span className="sa-stat-value">{stats.inactive}</span>
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-ico">
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="8" cy="7" r="3.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M16 8v6M13 11h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="sa-stat-body">
              <span className="sa-stat-label">Total</span>
              <span className="sa-stat-value">{stats.total}</span>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="sa-tablewrap">
          <ServerSmartTable
            columns={columns}
            fetchData={fetchSessionAdmissions}
            onRowClick={(r) => openStudentProfile(r)}
            maxRowsPerPage={20}
            enableSelect
            exportDefaults={{
              includeColumns: ["student_id", "student_name", "admission_class", "stream", "admitted_date", "active_status"],
              format: "csv",
            }}
            showcreatbut={false}
          />
        </div>
      </InnerTabCon>
    </div>
  );
};

export default SessionAdmissionsTab;
