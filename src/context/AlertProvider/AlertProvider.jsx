import React, { createContext, useContext, useState } from "react";
import "./alert.css";

const AlertContext = createContext();
export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
  const [alertData, setAlertData] = useState({
    show: false,
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = (message, onConfirm, onCancel) => {
    setAlertData({ show: true, message, onConfirm, onCancel });
  };

  const handleConfirm = () => {
    if (alertData.onConfirm) alertData.onConfirm();
    setAlertData({ ...alertData, show: false });
  };

  const handleCancel = () => {
    if (alertData.onCancel) alertData.onCancel();
    setAlertData({ ...alertData, show: false });
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {alertData.show && (
        <div className="alert-overlay">
          <div className="alert-box zoom-in">
            <p className="alert-message">{alertData.message}</p>
            <div className="alert-actions">
              <button className="alert-btn cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="alert-btn confirm" onClick={handleConfirm}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};
