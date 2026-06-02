import "./StaffActivity.css";
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
  General:     { bg: "#f0f0f0", color: "#555555" },
};

const statusColors = {
  success: { bg: "#dcfce7", color: "#166534" },
  failed:  { bg: "#fecaca", color: "#cc3333" },
};

const actionLabels = {
  upload_resource:   "Upload Resource",
  update_resource:   "Update Resource",
  delete_resource:   "Delete Resource",
  upload_credential: "Upload Credential",
  update_credential: "Update Credential",
  delete_credential: "Delete Credential",
};

const StaffActivity = ({ staffData }) => {
  const staff   = staffData?.staff || staffData;
  const staffId = staff?.staff_id;

  const { getActivityPaginated } = useStaffActivity();
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchData = useCallback(
    (params) => getActivityPaginated(staffId, params),
    [staffId, getActivityPaginated]
  );

  const columns = [
    {
      label: "Action", accessor: "action",
      render: (v) => <span className="act-action-label">{actionLabels[v] || v}</span>,
    },
    {
      label: "Category", accessor: "category",
      render: (v) => {
        const c = categoryColors[v] || categoryColors.General;
        return <span className="act-badge" style={{ background: c.bg, color: c.color }}>{v}</span>;
      },
    },
    { label: "Description", accessor: "description" },
    {
      label: "Status", accessor: "status",
      render: (v) => {
        const c = statusColors[v] || statusColors.success;
        return <span className="act-badge" style={{ background: c.bg, color: c.color }}>{v}</span>;
      },
    },
    {
      label: "Date & Time", accessor: "performed_at",
      render: (v) => v ? new Date(v).toLocaleString() : "—",
    },
  ];

  return (
    <InnerTabCon>
      <div className="staffActivity">
        <div className="actHeader">
          <div className="actHeaderLeft">
            <h2 className="actTitle">Activity Log</h2>
            <p className="actSubtitle">Audit trail of actions performed by this staff member</p>
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

        {/* Detail Panel */}
        <SlideInMenu isShow={!!selectedLog} onClose={() => setSelectedLog(null)} width="520px">
          {selectedLog && (
            <div className="act-panel">
              <div className="act-panel-header">
                <span className="act-panel-deco" aria-hidden="true" />
                <div className="act-panel-header-content">
                  <div className="act-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="act-panel-header-text">
                    <h2>{actionLabels[selectedLog.action] || selectedLog.action}</h2>
                    <p>{selectedLog.category}</p>
                  </div>
                </div>
              </div>
              <div className="act-panel-body">
                <div className="act-detail-grid">
                  <InfoField label="Log ID"       value={selectedLog.log_id} />
                  <InfoField label="Action"       value={actionLabels[selectedLog.action] || selectedLog.action} />
                  <InfoField label="Category"     value={selectedLog.category} />
                  <InfoField label="Status"       value={selectedLog.status} />
                  <InfoField label="Performed At" value={selectedLog.performed_at ? new Date(selectedLog.performed_at).toLocaleString() : "—"} />
                  <InfoField label="Description"  value={selectedLog.description} />
                </div>
              </div>
              <div className="act-panel-footer">
                <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
              </div>
            </div>
          )}
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default StaffActivity;
