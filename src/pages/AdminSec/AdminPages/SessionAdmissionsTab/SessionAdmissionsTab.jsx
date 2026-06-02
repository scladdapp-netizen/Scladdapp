import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import InfoField from "../../../../components/infoField/InfoField";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import "./SessionAdmissionsTab.css";

const SessionAdmissionsTab = () => {
  const { schoolId, seasionId } = useParams();
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 });
  const [selectedIds, setSelectedIds] = useState([]);

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
            admitted_date: assignment.assignment_date,
            admission_session: assignment.session_name,
            active_status: assignment.is_active,
            remarks: assignment.remarks,
          }));

          // Update stats
          const active = mappedData.filter((a) => a.active_status).length;
          const total = result.pagination?.totalItems || mappedData.length;
          setStats({
            active,
            inactive: total - active,
            total,
          });

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

  const handleViewDetails = (admission) => {
    setSelectedAdmission(admission);
    setIsDetailMenuOpen(true);
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
            onRowClick={(r) => handleViewDetails(r)}
            maxRowsPerPage={20}
            enableSelect
            onSelectChange={setSelectedIds}
            exportDefaults={{
              includeColumns: ["student_id", "student_name", "admission_class", "stream", "admitted_date", "active_status"],
              format: "csv",
            }}
            showcreatbut={false}
          />
        </div>
      </InnerTabCon>

      {/* ── Detail panel ── */}
      <SlideInMenu isShow={isDetailMenuOpen} onClose={() => setIsDetailMenuOpen(false)} width="500px">
        {selectedAdmission && (
          <div className="sa-detail-container">

            {/* Header */}
            <div className="sa-detail-header">
              <span className="sa-detail-header-deco" aria-hidden="true" />
              <span className="sa-detail-header-deco2" aria-hidden="true" />
              <div className="sa-detail-header-content">
                <div className="sa-detail-avatar">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M3 19c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="sa-detail-header-text">
                  <h2>{selectedAdmission.student_name}</h2>
                  <p>ID: {selectedAdmission.student_id}</p>
                </div>
                <span className={`sa-status-pill ${selectedAdmission.active_status ? "active" : "inactive"}`}>
                  {selectedAdmission.active_status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="sa-detail-body">
              <div className="sa-detail-section">
                <p className="sa-detail-section-title">Admission Info</p>
                <div className="sa-detail-grid">
                  <InfoField label="Assignment ID" value={selectedAdmission.assignment_id} />
                  <InfoField label="Admitted Date" value={selectedAdmission.admitted_date ? new Date(selectedAdmission.admitted_date).toLocaleDateString() : "N/A"} />
                  <InfoField label="Class"   value={selectedAdmission.admission_class} />
                  <InfoField label="Stream"  value={selectedAdmission.stream} />
                  <InfoField label="Session" value={selectedAdmission.admission_session || "N/A"} />
                </div>
              </div>

              {selectedAdmission.remarks && (
                <div className="sa-detail-section">
                  <p className="sa-detail-section-title">Remarks</p>
                  <p className="sa-remarks">{selectedAdmission.remarks}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sa-detail-footer">
              <Button variant="secondary" onClick={() => setIsDetailMenuOpen(false)}>Close</Button>
            </div>

          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default SessionAdmissionsTab;
