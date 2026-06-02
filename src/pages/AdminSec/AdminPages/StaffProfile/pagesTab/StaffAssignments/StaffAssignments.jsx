import React, { useMemo, useState } from "react";
import SmartTable from "../../../../../../components/SmartTable/SmartTable";
import LoadingData from "../../../../../../components/LoadingData";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../../components/Button/Button";
import useStaffAssignments from "../../../../../../api_call/useStaffAssignments";
import "./StaffAssignments.css";

const TypeBadge = ({ type }) => {
  const map = {
    Teacher:    { bg: "#dbeafe", color: "#1e40af" },
    Admin:      { bg: "#ede9fe", color: "#6d28d9" },
    Headmaster: { bg: "#d1fae5", color: "#065f46" },
  };
  const s = map[type] || { bg: "#f0f0f0", color: "#555555" };
  return (
    <span className="sa-type-badge" style={{ background: s.bg, color: s.color }}>
      {type}
    </span>
  );
};

const StatusBadge = ({ active }) => (
  <span className={`sa-status-badge ${active ? "active" : "inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const StaffAssignments = ({ staffData }) => {
  const staff   = staffData?.staff || staffData;
  const staffId = staff?.staff_id;
  const schoolId = staff?.school_id;

  const { teacherAssignment, adminAssignment, headmasterAssignments, loading } = useStaffAssignments(staffId, schoolId);
  const [selectedRow, setSelectedRow] = useState(null);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—";

  const rows = useMemo(() => {
    const result = [];
    if (teacherAssignment) result.push({
      id: teacherAssignment.teacher_id,
      assignment_type: "Teacher",
      role_or_code: teacherAssignment.teacher_code,
      scope: "—",
      is_active: teacherAssignment.is_active,
      assigned_at: teacherAssignment.appointed_at,
      revoked_at: teacherAssignment.revoked_at || null,
      _raw: teacherAssignment, _type: "teacher",
    });
    if (adminAssignment) result.push({
      id: adminAssignment.admin_id,
      assignment_type: "Admin",
      role_or_code: adminAssignment.admin_role,
      scope: adminAssignment.access_scope,
      is_active: adminAssignment.is_active,
      assigned_at: adminAssignment.assigned_at,
      revoked_at: adminAssignment.revoked_at || null,
      _raw: adminAssignment, _type: "admin",
    });
    headmasterAssignments.forEach((hm) => result.push({
      id: hm.assignment_id,
      assignment_type: "Headmaster",
      role_or_code: hm.class_name || hm.class_id,
      scope: hm.class_code || "—",
      is_active: hm.is_active,
      assigned_at: hm.start_date,
      revoked_at: hm.end_date || null,
      _raw: hm, _type: "headmaster",
    }));
    return result;
  }, [teacherAssignment, adminAssignment, headmasterAssignments]);

  const columns = [
    {
      label: "Type", accessor: "assignment_type",
      render: (v) => <TypeBadge type={v} />,
    },
    { label: "Role / Code",   accessor: "role_or_code" },
    { label: "Access Scope",  accessor: "scope" },
    {
      label: "Status", accessor: "is_active",
      render: (v) => <StatusBadge active={v} />,
    },
    { label: "Assigned At", accessor: "assigned_at", render: fmt },
    { label: "Revoked At",  accessor: "revoked_at",  render: (v) => v ? fmt(v) : "—" },
  ];

  if (loading) return <InnerTabCon><LoadingData message="Loading assignments..." /></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="staff-assignments">

        <div className="assignments-header">
          <div>
            <h3>Assignments</h3>
            <p className="subtitle">Role assignments for this staff member</p>
          </div>
        </div>

        <SmartTable
          columns={columns}
          data={rows}
          onRowClick={(row) => setSelectedRow(row)}
          enableSelect={false}
          showcreatbut={false}
          maxRowsPerPage={10}
        />

        {/* Detail Panel */}
        <SlideInMenu isShow={!!selectedRow} onClose={() => setSelectedRow(null)} width="520px">
          {selectedRow && (
            <div className="sa-panel">
              <div className="sa-panel-header">
                <span className="sa-panel-deco" aria-hidden="true" />
                <div className="sa-panel-header-content">
                  <div className="sa-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.7"/>
                    </svg>
                  </div>
                  <div className="sa-panel-header-text">
                    <h2>{selectedRow.assignment_type} Assignment</h2>
                    <p>{selectedRow.role_or_code}</p>
                  </div>
                </div>
              </div>

              <div className="sa-panel-body">
                {selectedRow._type === "teacher" && (
                  <div className="sa-grid">
                    <InfoField label="Teacher ID"   value={selectedRow._raw.teacher_id} />
                    <InfoField label="Teacher Code" value={selectedRow._raw.teacher_code} />
                    <InfoField label="Status"       value={selectedRow._raw.is_active ? "Active" : "Inactive"} />
                    <InfoField label="Appointed At" value={fmt(selectedRow._raw.appointed_at)} />
                    {selectedRow._raw.revoked_at && <InfoField label="Revoked At" value={fmt(selectedRow._raw.revoked_at)} />}
                  </div>
                )}

                {selectedRow._type === "admin" && (
                  <div className="sa-grid">
                    <InfoField label="Admin ID"     value={selectedRow._raw.admin_id} />
                    <InfoField label="Admin Role"   value={selectedRow._raw.admin_role} />
                    <InfoField label="Access Scope" value={selectedRow._raw.access_scope} />
                    <InfoField label="Status"       value={selectedRow._raw.is_active ? "Active" : "Inactive"} />
                    <InfoField label="Assigned At"  value={fmt(selectedRow._raw.assigned_at)} />
                    {selectedRow._raw.revoked_at && <InfoField label="Revoked At" value={fmt(selectedRow._raw.revoked_at)} />}
                  </div>
                )}

                {selectedRow._type === "headmaster" && (
                  <div className="sa-grid">
                    <InfoField label="Assignment ID" value={selectedRow._raw.assignment_id} />
                    <InfoField label="Class"         value={selectedRow._raw.class_name || selectedRow._raw.class_id} />
                    <InfoField label="Class Code"    value={selectedRow._raw.class_code || "—"} />
                    <InfoField label="Status"        value={selectedRow._raw.is_active ? "Active" : "Inactive"} />
                    <InfoField label="Start Date"    value={fmt(selectedRow._raw.start_date)} />
                    <InfoField label="End Date"      value={selectedRow._raw.end_date ? fmt(selectedRow._raw.end_date) : "Ongoing"} />
                    {selectedRow._raw.notes && <InfoField label="Notes" value={selectedRow._raw.notes} />}
                  </div>
                )}
              </div>

              <div className="sa-panel-footer">
                <Button variant="secondary" onClick={() => setSelectedRow(null)}>Close</Button>
              </div>
            </div>
          )}
        </SlideInMenu>

      </div>
    </InnerTabCon>
  );
};

export default StaffAssignments;
