import React, { useEffect } from "react";
import "./CenterModal.css";

const CenterModal = ({
  isShow,
  onClose,
  children,
  size = "medium", // small, medium, large, xlarge
  closeOnOverlayClick = true,
}) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isShow) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isShow, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isShow) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isShow]);

  if (!isShow) return null;

  return (
    <div className="center-modal-container">
      {/* Overlay */}
      <div
        className="center-modal-overlay"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className={`center-modal-content ${size}`}>
        {/* Close button */}
        <button
          className="center-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Children content */}
        <div className="center-modal-children">{children}</div>
      </div>
    </div>
  );
};

export default CenterModal;
