import { useState } from "react";
import "./AdminSecurity.css";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import { useAdmin } from "../../../../../../api_call/useAdmin";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";

const AdminSecurity = ({ adminData, refreshAdminData }) => {
  const { updateAdmin, loading } = useAdmin();
  const { addNotification } = useNotification();

  const admin = adminData?.admin;
  const [twoFac, setTwoFac] = useState(!!admin?.two_fac_auth);
  const [saving, setSaving] = useState(false);

  const handleToggle2FA = async () => {
    const newVal = !twoFac;
    setSaving(true);
    const res = await updateAdmin(admin.admin_id, { two_fac_auth: newVal });
    setSaving(false);
    if (res.success) {
      setTwoFac(newVal);
      addNotification(`Two-factor authentication ${newVal ? "enabled" : "disabled"}`, "success");
      if (refreshAdminData) refreshAdminData();
    } else {
      addNotification(res.message || "Failed to update 2FA", "error");
    }
  };

  if (!admin) {
    return (
      <InnerTabCon>
        <div className="asec-empty">No admin data available.</div>
      </InnerTabCon>
    );
  }

  return (
    <InnerTabCon>
      <div className="asec-wrap">

        <div className="asec-header">
          <div className="asec-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 className="asec-title">Security</h2>
            <p className="asec-subtitle">Manage authentication settings for this admin account</p>
          </div>
        </div>

        <div className="asec-card">
          <div className="asec-card-left">
            <p className="asec-card-title">Two-Factor Authentication</p>
            <p className="asec-card-desc">
              Adds an extra layer of security by requiring a one-time code on every login.
              When enabled, the admin must verify their identity with an OTP in addition to their password.
            </p>
            <span className={`asec-badge ${twoFac ? "enabled" : "disabled"}`}>
              {twoFac ? "Enabled" : "Disabled"}
            </span>
          </div>

          <button
            className={`asec-toggle ${twoFac ? "on" : "off"}`}
            onClick={handleToggle2FA}
            disabled={saving}
            title={twoFac ? "Disable 2FA" : "Enable 2FA"}
          >
            <span className={`asec-toggle-thumb ${twoFac ? "on" : "off"}`} />
          </button>
        </div>

      </div>
    </InnerTabCon>
  );
};

export default AdminSecurity;
