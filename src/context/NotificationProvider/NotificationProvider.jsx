// NotificationProvider.jsx
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import "./notifications.css";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

const AUTO_DISMISS_MS = 4500;
const EXIT_MS = 320;
const MAX_VISIBLE = 4;

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
  const timersRef = useRef(new Map());
  const idRef = useRef(0);

  const clearTimers = useCallback((id) => {
    const timers = timersRef.current.get(id);
    if (!timers) return;
    if (timers.dismiss) clearTimeout(timers.dismiss);
    if (timers.remove) clearTimeout(timers.remove);
    timersRef.current.delete(id);
  }, []);

  const removeNotification = useCallback((id) => {
    clearTimers(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [clearTimers]);

  const startSlideOut = useCallback((id) => {
    clearTimers(id);
    setNotifications((prev) => {
      const target = prev.find((n) => n.id === id);
      if (!target || target.leaving) return prev;
      return prev.map((n) => (n.id === id ? { ...n, leaving: true } : n));
    });
    const remove = setTimeout(() => removeNotification(id), EXIT_MS);
    timersRef.current.set(id, { dismiss: null, remove });
  }, [clearTimers, removeNotification]);

  const scheduleDismiss = useCallback((id) => {
    clearTimers(id);
    const dismiss = setTimeout(() => startSlideOut(id), AUTO_DISMISS_MS);
    timersRef.current.set(id, { dismiss, remove: null });
  }, [clearTimers, startSlideOut]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timers) => {
        if (timers.dismiss) clearTimeout(timers.dismiss);
        if (timers.remove) clearTimeout(timers.remove);
      });
      timersRef.current.clear();
    };
  }, []);

  const addNotification = useCallback((message, type = "info") => {
    const text = String(message || "").trim();
    if (!text) return;

    idRef.current += 1;
    const candidateId = `${Date.now()}-${idRef.current}`;
    let idToSchedule = candidateId;

    setNotifications((prev) => {
      const existing = prev.find(
        (n) => !n.leaving && n.message === text && n.type === type
      );

      if (existing) {
        idToSchedule = existing.id;
        return [
          { ...existing, leaving: false },
          ...prev.filter((n) => n.id !== existing.id),
        ];
      }

      const next = [
        { id: candidateId, message: text, type, leaving: false, entered: false },
        ...prev.filter((n) => !n.leaving),
      ];
      const capped = next.slice(0, MAX_VISIBLE);
      next.slice(MAX_VISIBLE).forEach((n) => clearTimers(n.id));
      return capped;
    });

    // Schedule after the state update call (not inside the updater)
    scheduleDismiss(idToSchedule);
  }, [clearTimers, scheduleDismiss]);

  const markEntered = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id && !n.entered ? { ...n, entered: true } : n))
    );
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container" aria-live="polite" aria-relevant="additions">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification notification--${n.type}${
              n.leaving ? " is-leaving" : n.entered ? "" : " is-entering"
            }`}
            role="status"
            onAnimationEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              if (n.leaving) removeNotification(n.id);
              else if (!n.entered) markEntered(n.id);
            }}
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
