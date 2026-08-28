// AdminLayout.jsx
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./AdminLayout.css";
import Saidbar from "../../Admin_components/saidbar/Saidbar";
import Topbar from "../../Admin_components/topbar/Topbar";
import SubscriptionExpiredBanner from "../../../../components/SubscriptionExpiredBanner/SubscriptionExpiredBanner";
import { useBlockExpiredMutations } from "../../../../hooks/useBlockExpiredMutations";
import { useSubscriptionAccess } from "../../../../hooks/useSubscriptionAccess";

const AdminLayout = ({ children, schoolId }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { schoolId: paramSchoolId } = useParams();
  const resolvedSchoolId = paramSchoolId || schoolId;
  const { canMutate } = useSubscriptionAccess();

  useBlockExpiredMutations();

  const handleMenuClick = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const handleCloseSidebar = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`AdminLayout${!canMutate ? " AdminLayout--sub-banner" : ""}`}>
      <Topbar
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuClick={handleMenuClick}
      />

      <div className="al_saidNContentSec">
        <Saidbar isMobileOpen={isMobileMenuOpen} onClose={handleCloseSidebar} />

        <div
          className="al_content"
          onClick={() => isMobileMenuOpen && handleCloseSidebar()}
        >
          <SubscriptionExpiredBanner
            settingsPath={
              resolvedSchoolId
                ? `/admin/${resolvedSchoolId}/settings/subscriptions?tab=upgrade`
                : undefined
            }
          />
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
