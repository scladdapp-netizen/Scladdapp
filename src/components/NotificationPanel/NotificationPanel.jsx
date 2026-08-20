import { useState, useEffect, useRef } from "react";
import useAdminNotification from "../../api_call/useAdminNotification";
import "./NotificationPanel.css";

const TYPE_META = {
  info:    { color: "#2563eb", bg: "#eff6ff", label: "Info" },
  warning: { color: "#d97706", bg: "#fffbeb", label: "Warning" },
  success: { color: "#16a34a", bg: "#f0fdf4", label: "Success" },
  alert:   { color: "#dc2626", bg: "#fef2f2", label: "Alert" },
};

const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "Just now";
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const NotificationPanel = ({ schoolId, adminId, isOpen, onClose, onUnreadChange }) => {
  const { getNotifications, markAsRead, markAllAsRead } = useAdminNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen && schoolId && adminId) {
      loadNotifications();
    }
  }, [isOpen, schoolId, adminId]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    setLoading(true);
    const res = await getNotifications(schoolId, adminId);
    if (res.success) {
      setNotifications(res.data);
      const unread = res.data.filter((n) => !n.is_read).length;
      onUnreadChange?.(unread);
    }
    setLoading(false);
  };

  const handleMarkOne = async (notif) => {
    if (notif.is_read) return;
    setNotifications((prev) =>
      prev.map((n) => n._id === notif._id ? { ...n, is_read: true } : n)
    );
    await markAsRead(notif._id, adminId);
    const newUnread = notifications.filter((n) => !n.is_read && n._id !== notif._id).length;
    onUnreadChange?.(newUnread);
  };

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    onUnreadChange?.(0);
    await markAllAsRead(schoolId, adminId);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="np_panel" ref={panelRef}>
      {/* Header */}
      <div className="np_header">
        <div className="np_header_left">
          <span className="np_title">Notifications</span>
          {unreadCount > 0 && (
            <span className="np_unread_pill">{unreadCount} new</span>
          )}
        </div>
        <div className="np_header_right">
          {unreadCount > 0 && (
            <button className="np_mark_all_btn" onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
          <button className="np_close_btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="np_body">
        {loading ? (
          <div className="np_empty">
            <div className="np_spinner" />
            <p>Loading…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="np_empty">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5"/>
              <path d="M20 12a6 6 0 016 6v3l1.5 2.5h-15L14 21v-3a6 6 0 016-6z" stroke="#d1d5db" strokeWidth="1.5" fill="#e5e7eb"/>
              <path d="M18 27.5a2 2 0 004 0" stroke="#d1d5db" strokeWidth="1.5"/>
            </svg>
            <p>No notifications yet</p>
          </div>
        ) : (
          <ul className="np_list">
            {notifications.map((notif) => {
              const meta = TYPE_META[notif.type] || TYPE_META.info;
              return (
                <li
                  key={notif._id}
                  className={`np_item ${notif.is_read ? "np_item--read" : "np_item--unread"}`}
                  onClick={() => handleMarkOne(notif)}
                >
                  <div className="np_item_dot" style={{ background: meta.color }} />
                  <div className="np_item_body">
                    <div className="np_item_top">
                      <span className="np_item_title">{notif.title}</span>
                      <span className="np_item_time">{fmtRelative(notif.createdAt)}</span>
                    </div>
                    <p className="np_item_text">{notif.body}</p>
                    <span
                      className="np_item_type"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  {!notif.is_read && <div className="np_item_badge" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
