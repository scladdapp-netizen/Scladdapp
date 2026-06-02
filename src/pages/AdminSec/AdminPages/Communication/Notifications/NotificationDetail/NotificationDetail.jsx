import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Routes, Route, useLocation } from "react-router-dom";
import useNotification from "../../../../../../api_call/useNotification";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification as useNotify } from "../../../../../../context/NotificationProvider/NotificationProvider";
import "./NotificationDetail.css";

const NotificationDetail = () => {
  const { notificationId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getNotificationById, deleteNotification, getRecipientsPaginated } = useNotification();
  const { user } = useAuth();
  const { addNotification } = useNotify();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canDelete = isSuperAdmin || !!admin?.permissions?.communication?.delete;

  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const base = `/admin/${schoolId}/communication/notifications/${notificationId}`;
  const tabs = [
    { label: "Info", path: base },
    { label: "Recipients", path: `${base}/recipients` },
  ];

  const isActive = (path) => {
    if (path === base) return location.pathname === base || location.pathname === `${base}/`;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    getNotificationById(notificationId).then((res) => {
      if (res.success) setNotification(res.data);
      setLoading(false);
    });
  }, [notificationId]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteNotification(notificationId, user?.admin?.admin_id || user?.user_id);
    setDeleting(false);
    if (res.success) navigate(`/admin/${schoolId}/communication/notifications`);
    else addNotification(res.message || "Failed to delete", "error");
  };

  const fetchRecipients = useCallback(
    async (params) => getRecipientsPaginated(notificationId, params),
    [notificationId]
  );

  const recipientColumns = [
    { label: "Name",         accessor: "user_name",    render: (v) => v || "—" },
    { label: "Type",         accessor: "user_type",    render: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—" },
    {
      label: "Read",
      accessor: "is_read",
      render: (v) => (
        <span className={`nd-read-badge ${v ? "read" : "unread"}`}>
          {v ? "Read" : "Unread"}
        </span>
      ),
    },
    { label: "Read At",      accessor: "read_at",      render: (v) => v ? new Date(v).toLocaleString() : "—" },
    { label: "Delivered At", accessor: "delivered_at", render: (v) => v ? new Date(v).toLocaleString() : "—" },
  ];

  if (loading) return <div className="nd-loading">Loading...</div>;
  if (!notification) return <div className="nd-loading">Notification not found.</div>;

  const channels = Array.isArray(notification.delivery_channels)
    ? notification.delivery_channels.join(", ")
    : notification.delivery_channels;

  const titleClean = notification.title?.replace(/<[^>]*>/g, "") || "—";

  return (
    <div className="nd-page">
      {/* ── Banner header ── */}
      <div className="nd-banner">
        <span className="nd-banner-deco" aria-hidden="true" />
        <div className="nd-banner-content">
          <div className="nd-banner-left">
            <button
              className="nd-back-btn"
              onClick={() => navigate(`/admin/${schoolId}/communication/notifications`)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1 className="nd-banner-title">{titleClean}</h1>
            <p className="nd-banner-sub">
              Sent by {notification.created_by_name || "—"} &middot;{" "}
              {notification.created_at ? new Date(notification.created_at).toLocaleString() : "—"}
            </p>
          </div>
          {canDelete && (
            <Button
              variant="danger"
              onClick={() => setShowDeletePanel(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="nd-tabs-bar">
        <div className="nd-tabs-nav">
          {tabs.map((tab) => (
            <button
              key={tab.path}
              className={`nd-tab ${isActive(tab.path) ? "active" : ""}`}
              onClick={() => navigate(tab.path)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="nd-content">
        <Routes>
          <Route
            path="/"
            element={
              <InnerTabCon>
                <InfoTab notification={notification} channels={channels} />
              </InnerTabCon>
            }
          />
          <Route
            path="/recipients"
            element={
              <InnerTabCon>
                <RecipientsTab fetchRecipients={fetchRecipients} columns={recipientColumns} />
              </InnerTabCon>
            }
          />
        </Routes>
      </div>

      <DeleteConfirmPanel
        isOpen={showDeletePanel}
        onClose={() => setShowDeletePanel(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Notification"
        description="You are about to permanently delete this notification. All recipient records will also be removed."
        itemName={titleClean}
      />
    </div>
  );
};

/* ── Info tab ─────────────────────────────────────────────────────────────── */
const InfoTab = ({ notification, channels }) => (
  <div className="nd-info-tab">
    {/* Overview stat cards */}
    <div className="nd-stat-row">
      {[
        { label: "Target",   value: notification.target_type?.replace(/_/g, " ") },
        { label: "Channels", value: channels },
        { label: "Sent At",  value: notification.created_at ? new Date(notification.created_at).toLocaleString() : "—" },
        { label: "Sent By",  value: notification.created_by_name },
      ].map(({ label, value }) => (
        <div key={label} className="nd-stat-card">
          <span className="nd-stat-label">{label}</span>
          <span className="nd-stat-value">{value || "—"}</span>
        </div>
      ))}
    </div>

    {/* Content */}
    <div className="nd-section">
      <span className="nd-section-title">Content</span>
      <div
        className="nd-content-body"
        dangerouslySetInnerHTML={{ __html: notification.resolved_content || "—" }}
      />
    </div>

    {/* Placeholder values */}
    {notification.placeholder_values &&
      Object.keys(notification.placeholder_values).length > 0 && (
        <div className="nd-section">
          <span className="nd-section-title">Placeholder Values</span>
          <div className="nd-placeholder-grid">
            {Object.entries(notification.placeholder_values).map(([key, val]) => (
              <div key={key} className="nd-placeholder-row">
                <span className="nd-placeholder-key">{key}</span>
                <span className="nd-placeholder-val">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
  </div>
);

/* ── Recipients tab ───────────────────────────────────────────────────────── */
const RecipientsTab = ({ fetchRecipients, columns }) => (
  <ServerSmartTable
    columns={columns}
    fetchData={fetchRecipients}
    initialPageSize={15}
    showcreatbut={false}
  />
);

export default NotificationDetail;
