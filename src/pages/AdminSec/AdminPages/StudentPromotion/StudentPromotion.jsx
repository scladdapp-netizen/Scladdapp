import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../components/infoField/InfoField";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../components/Button/Button";
import "./StudentPromotion.css";

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const IcoUp = () => (
  <svg width="11" height="11" viewBox="0 0 22 22" fill="none">
    <path d="M11 18V4M5 10l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoDown = () => (
  <svg width="11" height="11" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M5 12l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoCap = () => (
  <svg width="11" height="11" viewBox="0 0 22 22" fill="none">
    <path d="M11 3l8 4-8 4-8-4 8-4z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  </svg>
);
const IcoDots = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="17" r="1.5" fill="currentColor"/>
  </svg>
);
const IcoEye = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M1 11s4-7 10-7 10 7 10 7-4 7-10 7S1 11 1 11z" stroke="currentColor" strokeWidth="1.7"/>
    <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
);

const statusConfig = {
  promotion: { label: "Promoted",      cls: "sp-badge-promoted",  Icon: IcoUp   },
  demotion:  { label: "Held Back",     cls: "sp-badge-held",      Icon: IcoDown },
  admission: { label: "New Admission", cls: "sp-badge-admission", Icon: IcoCap  },
};

const StatusBadge = ({ method }) => {
  const cfg = statusConfig[method] || statusConfig.admission;
  return (
    <span className={`sp-status-badge ${cfg.cls}`}>
      <cfg.Icon /> {cfg.label}
    </span>
  );
};

const StudentPromotion = () => {
  const { seasionId } = useParams();
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchStudentPromotions = useCallback(async (params) => {
    try {
      const q = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || "",
        searchField: params.searchField || "",
        sortBy: "assignment_date",
        sortOrder: "desc",
        assignmentMethod: "promotion,demotion",
      });
      const res = await fetch(
        `http://localhost:3000/api/student-class-assignment/session/${seasionId}?${q}`,
        { headers: { "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success) {
        return {
          success: true,
          data: result.data.map((a) => ({
            id: a.assignment_id,
            studentId: a.student_id,
            studentName: a.student_name || "Unknown",
            classId: a.class_id,
            className: a.class_name,
            stream: a.stream || "N/A",
            assignmentMethod: a.assignment_method,
            assignmentDate: a.assignment_date,
            sessionName: a.session_name,
            isActive: a.is_active,
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

  useEffect(() => {
    const close = () => setShowActionMenu(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const openDetails = (student) => {
    setSelected(student);
    setShowDetails(true);
    setShowActionMenu(null);
  };

  const columns = [
    { label: "Student ID",   accessor: "studentId",
      render: (v) => <span className="sp-id-pill">{v}</span> },
    { label: "Student Name", accessor: "studentName",
      render: (v) => <span className="sp-name">{v}</span> },
    { label: "Promoted Class",  accessor: "className" },
    { label: "Stream", accessor: "stream" },
    { label: "Status", accessor: "assignmentMethod",
      render: (v) => <StatusBadge method={v} /> },
    { label: "Date",   accessor: "assignmentDate",
      render: (v) => v ? new Date(v).toLocaleDateString() : "N/A" },
    {
      label: "Actions", accessor: "actions", searchable: false,
      render: (_, row) => (
        <div className="sp-action-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="sp-action-btn" onClick={(e) => {
            e.stopPropagation();
            setSelected(row);
            setShowActionMenu(showActionMenu === row.id ? null : row.id);
          }}>
            <IcoDots />
          </button>
          {showActionMenu === row.id && (
            <div className="sp-action-menu">
              <button className="sp-action-item" onClick={() => openDetails(row)}>
                <IcoEye /> View Details
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="sp-container">
      <InnerTabCon>
        <div className="sp-header">
          <h2>Students & Promotions</h2>
          <p>View student promotions and demotions for this session</p>
        </div>
        <ServerSmartTable
          columns={columns}
          fetchData={fetchStudentPromotions}
          onRowClick={(r) => openDetails(r)}
          maxRowsPerPage={20}
          enableSelect
          exportDefaults={{
            includeColumns: ["studentId", "studentName", "className", "stream", "assignmentMethod", "assignmentDate"],
            format: "csv",
          }}
          showcreatbut={false}
        />
      </InnerTabCon>

      {/* Detail panel */}
      <SlideInMenu isShow={showDetails} onClose={() => setShowDetails(false)} width="560px">
        {selected && (
          <div className="sp-detail-container">

            {/* Header */}
            <div className="sp-detail-header">
              <span className="sp-detail-deco" aria-hidden="true" />
              <span className="sp-detail-deco2" aria-hidden="true" />
              <div className="sp-detail-header-content">
                <div className="sp-detail-avatar">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M3 19c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="sp-detail-header-text">
                  <h2>{selected.studentName}</h2>
                  <p>ID: {selected.studentId}</p>
                </div>
                <StatusBadge method={selected.assignmentMethod} />
              </div>
            </div>

            {/* Body */}
            <div className="sp-detail-body">
              <p className="sp-detail-section-title">Assignment Info</p>
              <div className="sp-detail-grid">
                <InfoField label="Assignment ID"     value={selected.id} />
                <InfoField label="Date"              value={selected.assignmentDate ? new Date(selected.assignmentDate).toLocaleDateString() : "N/A"} />
                <InfoField label="Class"             value={selected.className} />
                <InfoField label="Stream"            value={selected.stream} />
                <InfoField label="Session"           value={selected.sessionName || "N/A"} />
                <InfoField label="Active"            value={selected.isActive ? "Yes" : "No"} />
                {selected.remarks && <InfoField label="Remarks" value={selected.remarks} />}
              </div>
            </div>

            {/* Footer */}
            <div className="sp-detail-footer">
              <Button variant="secondary" onClick={() => setShowDetails(false)}>Close</Button>
            </div>

          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default StudentPromotion;
