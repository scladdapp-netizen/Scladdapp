// NotificationProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import "./notifications.css";

const NotificationContext = createContext();
export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    const newNotification = { id, message, type };
    setNotifications((prev) => [{ ...newNotification }, ...prev]); // stack new on top

    // auto remove after 30 seconds (with fade out)
    setTimeout(() => startSlideOut(id), 30000);
  };

  const startSlideOut = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, slideOut: true } : n))
    );
    setTimeout(() => removeNotification(id), 300); // after animation
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`notification ${n.type} ${
              n.slideOut ? "slide-out" : "slide-in"
            }`}
          >
            <div className="notification-content">
              <span>{n.message}</span>
              <button className="close-btn" onClick={() => startSlideOut(n.id)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
