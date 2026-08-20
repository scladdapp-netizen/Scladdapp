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
    { label: "Name",     accessor: "user_name", render: (v) => v || "—" },
    { label: "Type",     accessor: "user_type", render: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—" },
    {
      label: "Email",
      accessor: "email_sent",
      render: (v, row) => {
        if (!row.email_address) {
          return <span className="nd-email-badge na">No Email</span>;
        }
        return (
          <div className="nd-email-cell">
            <span className={`nd-email-badge ${v ? "sent" : "not-sent"}`}>
              {v ? "✓ Sent" : "✗ Not Sent"}
            </span>
            <span className="nd-email-addr">{row.email_address}</span>
          </div>
        );
      },
    },
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
const stripSpanStyles = (html) =>
  html.replace(/<span([^>]*?)style="[^"]*"([^>]*?)>/gi, "<span$1$2>");

const CHANNEL_META = {
  "Web":   { label: "Web Notification", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  "Email": { label: "Email",            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  "App Push": { label: "Push",          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  "WhatsApp": { label: "WhatsApp",      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> },
};

const InfoTab = ({ notification, channels }) => {
  const channelList = Array.isArray(notification.delivery_channels)
    ? notification.delivery_channels
    : (notification.delivery_channels ? [notification.delivery_channels] : []);

  return (
  <div className="nd-info-tab">
    {/* Overview stat cards */}
    <div className="nd-stat-row">
      {[
        { label: "Target",   value: notification.target_type?.replace(/_/g, " ") },
        { label: "Sent At",  value: notification.created_at ? new Date(notification.created_at).toLocaleString() : "—" },
        { label: "Sent By",  value: notification.created_by_name },
      ].map(({ label, value }) => (
        <div key={label} className="nd-stat-card">
          <span className="nd-stat-label">{label}</span>
          <span className="nd-stat-value">{value || "—"}</span>
        </div>
      ))}

      {/* Delivery mode stat card */}
      <div className="nd-stat-card">
        <span className="nd-stat-label">Delivery</span>
        <div className="nd-channel-badges">
          {channelList.length > 0 ? channelList.map((ch) => {
            const meta = CHANNEL_META[ch] || { label: ch, icon: null };
            return (
              <span key={ch} className="nd-channel-badge">
                {meta.icon}
                {meta.label}
              </span>
            );
          }) : <span className="nd-stat-value">—</span>}
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="nd-section">
      <span className="nd-section-title">Content</span>
      <div
        className="nd-content-body"
        dangerouslySetInnerHTML={{ __html: stripSpanStyles(notification.resolved_content || "—") }}
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
};

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
