import { useState, useCallback } from "react";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useNotification from "../../../../../api_call/useNotification";
import StudentDetailTopTab from "../../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import "../../../../AdminSec/AdminPages/Communication/Notifications/Notifications.css";
import "../../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "../../../../TeacherSec/pages/Notifications/Notifications.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";

const Notification = () => {
  const { user } = useAuth();
  const { getUserNotificationsPaginated, getNotificationById, markAsRead } = useNotification();

  const userId = user?.student?.student_id;

  const [reloadKey, setReloadKey]         = useState(0);
  const [panelOpen, setPanelOpen]         = useState(false);
  const [selectedRow, setSelectedRow]     = useState(null);
  const [detail, setDetail]               = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(
    (params) => getUserNotificationsPaginated(userId, params),
    [userId]
  );

  const handleRowClick = async (row) => {
    setSelectedRow(row);
    setDetail(null);
    setPanelOpen(true);

    if (!row.is_read && row.user_notification_id) {
      markAsRead(row.user_notification_id).then(() => {
        setSelectedRow((prev) => prev ? { ...prev, is_read: true } : prev);
        setReloadKey((k) => k + 1);
      });
    }

    setDetailLoading(true);
    const res = await getNotificationById(row.notification_id);
    if (res.success) setDetail(res.data);
    setDetailLoading(false);
  };

  const columns = [
    {
      accessor: "title",
      label: "Title",
      searchable: true,
      render: (val, row) => (
        <div className="notification-title-cell">
          <div className="title-main" style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {!row.is_read && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#111111", flexShrink: 0, display: "inline-block" }}/>
            )}
            <span style={{ fontWeight: row.is_read ? 500 : 700 }}>{val || "—"}</span>
          </div>
          <div className="title-meta">By {row.created_by_name || "—"}</div>
        </div>
      ),
    },
    {
      accessor: "target_type",
      label: "Audience",
      render: (v) => <span className="notif-target-badge">{v ? v.replace(/_/g, " ") : "—"}</span>,
    },
    { accessor: "created_by_name", label: "Sent By", render: (v) => v || "—" },
    { accessor: "created_at", label: "Date", render: (v) => fmt(v) },
    {
      accessor: "is_read",
      label: "Status",
      render: (v) => (
        <span className={`cs-status ${v ? "inactive" : "active"}`}
          style={v ? { background: "#f4f4f4", color: "#888888" } : { background: "#f0f0f0", color: "#111111" }}>
          {v ? "Read" : "Unread"}
        </span>
      ),
    },
  ];

  return (
    <StudentDetailTopTab title="Notifications" subtitle="Notifications sent to you from the school" route={[]}>
      <InnerTabCon>
        <div className="notifications-container">
          <div className="notif-header">
            <div className="notif-header-left">
              <h2 className="notif-title">Notifications</h2>
              <p className="notif-subtitle">Notifications sent to you from the school</p>
            </div>
          </div>

          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            onRowClick={handleRowClick}
            enableSelect={false}
            showcreatbut={false}
            initialPageSize={20}
            reloadKey={reloadKey}
          />
        </div>
      </InnerTabCon>

      <SlideInMenu isShow={panelOpen} onClose={() => setPanelOpen(false)} width="600px">
        <div className="cs-panel">
          <div className="cs-panel-header default">
            <span className="cs-panel-header-deco" aria-hidden="true"/>
            <div className="cs-panel-header-content">
              <div className="cs-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="cs-panel-header-text">
                <h2>{selectedRow?.title || "Notification"}</h2>
                <p>{fmt(selectedRow?.created_at)}{selectedRow?.created_by_name ? ` · by ${selectedRow.created_by_name}` : ""}</p>
              </div>
            </div>
          </div>

          {/* {(selectedRow?.target_type || selectedRow?.delivery_channels) && (
            <div style={{ padding: "12px 24px", borderBottom: "1px solid #e8e8e8", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedRow.target_type && (
                <span className="notif-target-badge">{selectedRow.target_type.replace(/_/g, " ")}</span>
              )}
              {selectedRow.delivery_channels && (
                <span style={{ padding: "2px 8px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "#f0fdf4", color: "#166534" }}>
                  {selectedRow.delivery_channels}
                </span>
              )}
              <span className={`cs-status ${selectedRow.is_read ? "inactive" : "active"}`}
                style={selectedRow.is_read ? { background: "#f4f4f4", color: "#888888" } : { background: "#f0f0f0", color: "#111111" }}>
                {selectedRow.is_read ? "Read" : "Unread"}
              </span>
            </div>
          )} */}

          <div className="cs-panel-body">
            {detailLoading ? (
              <LoadingData message="Loading notification..." />
            ) : detail?.resolved_content ? (
              <div className="notif-content" dangerouslySetInnerHTML={{ __html: detail.resolved_content }}/>
            ) : (
              <p className="cs-panel-empty">No content available.</p>
            )}
          </div>

          <div className="cs-panel-footer">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Close</Button>
          </div>
        </div>
      </SlideInMenu>
    </StudentDetailTopTab>
  );
};

export default Notification;
