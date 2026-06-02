import "./AdminActivity.css";
import { useState, useCallback } from "react";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import InfoField from "../../../../../../components/infoField/InfoField";
import useStaffActivity from "../../../../../../api_call/useStaffActivity";

const categoryColors = {
  Resources:   { bg: "#dbeafe", color: "#1e40af" },
  Credentials: { bg: "#ede9fe", color: "#6d28d9" },
  General:     { bg: "#f3f4f6", color: "#374151" },
};

const statusColors = {
  success: { bg: "#dcfce7", color: "#166534" },
  failed:  { bg: "#fee2e2", color: "#dc2626" },
};

const Badge = ({ label, bg, color }) => (
  <span className="act-badge" style={{ background: bg, color }}>
    {label}
  </span>
);

const AdminActivity = ({ adminData }) => {
  const admin = adminData?.admin;
  const adminId = admin?.admin_id;

  const { getAdminActivityPaginated } = useStaffActivity();
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchData = useCallback(
    (params) => getAdminActivityPaginated(adminId, params),
    [adminId, getAdminActivityPaginated]
  );

  const columns = [
    {
      label: "Action",
      accessor: "action",
      render: (v) => (
        <span className="act-action-label">
          {v?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "—"}
        </span>
      ),
    },
    {
      label: "Category",
      accessor: "category",
      render: (v) => {
        const c = categoryColors[v] || categoryColors.General;
        return <Badge label={v || "General"} bg={c.bg} color={c.color} />;
      },
    },
    { label: "Description", accessor: "description" },
    {
      label: "Status",
      accessor: "status",
      render: (v) => {
        const c = statusColors[v] || statusColors.success;
        return <Badge label={v} bg={c.bg} color={c.color} />;
      },
    },
    {
      label: "Date & Time",
      accessor: "performed_at",
      render: (v) => v ? new Date(v).toLocaleString() : "—",
    },
  ];

  return (
    <InnerTabCon>
      <div className="adminActivity">
        <div className="aaHeader">
          <div className="aaHeaderLeft">
            <h2 className="aaTitle">Activity Log</h2>
            <p className="aaSubtitle">Audit trail of actions performed by this administrator</p>
          </div>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          onRowClick={(row) => setSelectedLog(row)}
          showcreatbut={false}
          enableSelect={false}
          initialPageSize={10}
        />

        <SlideInMenu isShow={!!selectedLog} onClose={() => setSelectedLog(null)} width="520px">
          <div className="act-panel">
            <div className="act-panel-header">
              <span className="act-panel-deco" aria-hidden="true" />
              <div className="act-panel-header-content">
                <div className="act-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="act-panel-header-text">
                  <h2>
                    {selectedLog?.action?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h2>
                  <p>{selectedLog?.category || "Activity Detail"}</p>
                </div>
              </div>
            </div>

            <div className="act-panel-body">
              <div className="act-detail-grid">
                <InfoField label="Log ID"       value={selectedLog?.log_id} />
                <InfoField label="Action"       value={selectedLog?.action?.replace(/_/g, " ")} />
                <InfoField label="Category"     value={selectedLog?.category} />
                <InfoField label="Status"       value={selectedLog?.status} />
                <InfoField label="Performed At" value={selectedLog?.performed_at ? new Date(selectedLog.performed_at).toLocaleString() : "—"} />
                <InfoField label="Description"  value={selectedLog?.description} />
              </div>
            </div>

            <div className="act-panel-footer">
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default AdminActivity;
