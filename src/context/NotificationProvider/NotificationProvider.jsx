// NotificationProvider.jsx
import React, { createContext, useContext, useState } from "react";
import "./notifications.css";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const NOTIFICATION_ICONS = {
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  ),
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications((prev) => [{ ...newNotification }, ...prev]);

    setTimeout(() => startSlideOut(id), 5000);
  };

  const startSlideOut = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, slideOut: true } : n))
    );
    setTimeout(() => removeNotification(id), 300);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container" aria-live="polite" aria-relevant="additions">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification notification--${n.type} ${
              n.slideOut ? "slide-out" : "slide-in"
            }`}
            role="status"
          >
            <div className="notification__icon">
              {NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.info}
            </div>
            <div className="notification__body">
              <p className="notification__message">{n.message}</p>
            </div>
            <button
              type="button"
              className="notification__close"
              onClick={() => startSlideOut(n.id)}
              aria-label="Dismiss notification"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
