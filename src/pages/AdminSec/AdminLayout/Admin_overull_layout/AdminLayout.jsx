// AdminLayout.jsx
import React, { useState } from "react";
import "./AdminLayout.css";
import Saidbar from "../../Admin_components/saidbar/Saidbar";
import Topbar from "../../Admin_components/topbar/Topbar";

const AdminLayout = ({ children, schoolId }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="AdminLayout">
      {/* Topbar */}
      <Topbar
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuClick={handleMenuClick}
      />

      {/* Sidebar and Content */}
      <div className="al_saidNContentSec">
        {/* Sidebar - pass schoolId */}
        <Saidbar isMobileOpen={isMobileMenuOpen} onClose={handleCloseSidebar} />

        {/* Content */}
        <div
          className="al_content"
          onClick={() => isMobileMenuOpen && handleCloseSidebar()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
