import { useState } from "react";
import "./RoleSelectionModal.css";

const AdminIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
      stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StaffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ROLES = [
  {
    key: "admin",
    label: "Admin Dashboard",
    description: "Manage school operations, settings, and administrative features.",
    Icon: AdminIcon,
  },
  {
    key: "staff",
    label: "Staff Dashboard",
    description: "Access your profile, attendance, classes, and work-related features.",
    Icon: StaffIcon,
  },
];

const RoleSelectionModal = ({ isOpen, onSelectRole, staffData, adminData }) => {
  const [selectedRole, setSelectedRole] = useState(null);

  if (!isOpen) return null;

  const getMeta = (key) => {
    if (key === "admin") {
      const perms = adminData?.permissions;
      const permsArray = Array.isArray(perms) ? perms : typeof perms === "string" ? perms.split(",") : [];
      return {
        subtitle: adminData?.admin_role || "Administrator",
        badge: adminData?.access_scope === "full" ? "Full Access" : "Limited Access",
        tag: permsArray.includes("ALL") ? "All Permissions" : permsArray.length > 0 ? `${permsArray.length} Permissions` : "",
      };
    }
    return {
      subtitle: staffData?.position || staffData?.job_title || "Staff",
      badge: staffData?.role || "Staff",
      tag: staffData?.department || "",
    };
  };

  return (
    <div className="rsm-overlay" onClick={(e) => e.target === e.currentTarget && null}>
      <div className="rsm-modal">

        {/* Header */}
        <div className="rsm-header">
          <div className="rsm-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
              <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
              <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
              <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.7"/>
            </svg>
          </div>
          <h2>Choose your dashboard</h2>
          <p>You have multiple roles. Select which dashboard to open.</p>
        </div>

        {/* Role cards */}
        <div className="rsm-options">
          {ROLES.map(({ key, label, description, Icon }) => {
            const { subtitle, badge, tag } = getMeta(key);
            const active = selectedRole === key;
            return (
              <div
                key={key}
                className={`rsm-card${active ? " rsm-card-active" : ""}`}
                onClick={() => setSelectedRole(key)}
              >
                <div className={`rsm-card-icon${active ? " rsm-card-icon-active" : ""}`}>
                  <Icon />
                </div>

                <div className="rsm-card-body">
                  <div className="rsm-card-title">{label}</div>
                  <div className="rsm-card-subtitle">{subtitle}</div>
                  <div className="rsm-card-desc">{description}</div>
                  <div className="rsm-badges">
                    <span className={`rsm-badge${active ? " rsm-badge-active" : ""}`}>{badge}</span>
                    {tag && <span className="rsm-tag">{tag}</span>}
                  </div>
                </div>

                <div className={`rsm-check${active ? " rsm-check-active" : ""}`}>
                  <CheckIcon />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="rsm-footer">
          <button
            className="rsm-btn"
            onClick={() => selectedRole && onSelectRole(selectedRole)}
            disabled={!selectedRole}
          >
            {selectedRole
              ? `Continue to ${selectedRole === "admin" ? "Admin" : "Staff"} Dashboard`
              : "Select a dashboard to continue"}
            {selectedRole && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <p className="rsm-note">You can switch dashboards anytime from your profile menu.</p>
        </div>

      </div>
    </div>
  );
};

export default RoleSelectionModal;
