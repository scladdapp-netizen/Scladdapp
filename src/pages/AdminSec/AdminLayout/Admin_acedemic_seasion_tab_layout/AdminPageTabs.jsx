import React, { useState, useRef } from "react";
import "./AdminPageTabs.css";
import APTtab from "../../Admin_components/Acedemic_seasion_tab_Saidbar/APTtab";

const AdminPageTabs = ({ children, showSidebar = true }) => {
  const [open, setOpen] = useState(false);
  const startX = useRef(0);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    if (startX.current < 20 && currentX > 80) {
      setOpen(true);
    }
  };

  const handleTouchEnd = () => {
    startX.current = 0;
  };

  return (
    <div
      className={`apt_main ${!showSidebar ? "no-sidebar" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showSidebar && (
        <>
          {/* Drag handle (mobile only via CSS) */}
          <div className="apt_drag_handle" onClick={() => setOpen(true)}>
            <div className="apt_mb"></div>
          </div>

          {/* Overlay — closes sidebar on tap, sits below sidebar, above content */}
          <div
            className={`apt_overlay ${open ? "open" : ""}`}
            onClick={() => setOpen(false)}
          />

          <div className={`apt_left ${open ? "open" : ""}`}>
            <APTtab />
          </div>
        </>
      )}

      <div className="apt_right">
        {children}
      </div>
    </div>
  );
};

export default AdminPageTabs;
