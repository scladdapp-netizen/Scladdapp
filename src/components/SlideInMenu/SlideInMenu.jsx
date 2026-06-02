import React, { useEffect } from "react";
import "./SlideInMenu.css";

const SlideInMenu = ({
  isShow,
  onClose,
  children,
  position = "rightt",
  width = "400px",
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

  // Prevent body scroll when menu is open
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
    <div className="slide-in-menu-container">
      {/* Overlay */}
      <div className="slide-in-menu-overlay" onClick={onClose} />

      {/* Menu */}
      <div className={`slide-in-menu-content ${position}`} style={{ width }}>
        {/* Close button */}

        {/* Children content */}
        <div className="slide-in-menu-children">{children}</div>
      </div>
    </div>
  );
};

export default SlideInMenu;
