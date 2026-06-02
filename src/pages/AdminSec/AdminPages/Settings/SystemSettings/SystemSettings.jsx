import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import FormInput from "../../../../../components/FormInput";
import { useTheme } from "../../../../../context/ThemeContext/ThemeContext";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import {
  FaPalette, FaLock, FaUserShield, FaDownload, FaCog, FaSave, FaKey,
} from "react-icons/fa";
import "./SystemSettings.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

const SystemSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const adminId = user?.admin?.admin_id;

  const getActiveTabFromUrl = () => {
    const tab = new URLSearchParams(location.search).get("tab");
    return ["theme", "security", "backup"].includes(tab) ? tab : "theme";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  useEffect(() => { setActiveTab(getActiveTabFromUrl()); }, [location.search]);
  const handleTabChange = (tab) => { setActiveTab(tab); navigate(`?tab=${tab}`, { replace: true }); };

  // ── Change Password state ─────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm)
      return addNotification("All password fields are required", "error");
    if (pwForm.next !== pwForm.confirm)
      return addNotification("New passwords do not match", "error");
    if (pwForm.next.length < 8)
      return addNotification("New password must be at least 8 characters", "error");

    setPwLoading(true);
    try {
      const res = await fetch(`${API}/admin/${adminId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Password updated successfully", "success");
        setPwForm({ current: "", next: "", confirm: "" });
      } else {
        addNotification(data.message || "Failed to update password", "error");
      }
    } catch {
      addNotification("Network error", "error");
    } finally {
      setPwLoading(false);
    }
  };

  // ── 2FA state ─────────────────────────────────────────────────────────────
  const [twoFac, setTwoFac] = useState(user?.admin?.two_fac_auth ?? false);
  const [twoFacLoading, setTwoFacLoading] = useState(false);

  const handleToggle2FA = async (val) => {
    setTwoFacLoading(true);
    try {
      const res = await fetch(`${API}/admin/${adminId}/two-fac-auth`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: val }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFac(data.data.two_fac_auth);
        addNotification(`2FA ${val ? "enabled" : "disabled"}`, "success");
      } else {
        addNotification(data.message || "Failed to update 2FA", "error");
      }
    } catch {
      addNotification("Network error", "error");
    } finally {
      setTwoFacLoading(false);
    }
  };

  const renderSecurity = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Security Settings</h3>
        <p>Manage your password and two-factor authentication</p>
      </div>

      <div className="security-sections">
        {/* Change Password */}
        <div className="security-card">
          <div className="card-header">
            <FaKey className="card-icon" />
            <div>
              <h4>Change Password</h4>
              <p>Update your account password</p>
            </div>
          </div>
          <div className="settings-form">
            <FormInput label="Current Password *" type="password" value={pwForm.current}
              onChange={(v) => setPwForm(p => ({ ...p, current: v }))} placeholder="Enter your current password" />
            <FormInput label="New Password *" type="password" value={pwForm.next}
              onChange={(v) => setPwForm(p => ({ ...p, next: v }))} placeholder="At least 8 characters" />
            <FormInput label="Confirm New Password *" type="password" value={pwForm.confirm}
              onChange={(v) => setPwForm(p => ({ ...p, confirm: v }))} placeholder="Repeat new password" />
            <div className="form-actions">
              <Button onClick={handleChangePassword} disabled={pwLoading}>
                <FaSave /> {pwLoading ? "Saving..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="security-card">
          <div className="card-header">
            <FaUserShield className="card-icon" />
            <div>
              <h4>Two-Factor Authentication</h4>
              <p>Require a verification code on login</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: twoFac ? "#166534" : "#888", background: twoFac ? "#dcfce7" : "#f3f4f6", padding: "3px 10px", borderRadius: 20 }}>
                {twoFac ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
          <div className="settings-form">
            <FormInput label="Enable 2FA for your account" type="checkbox"
              value={twoFac}
              onChange={(val) => handleToggle2FA(val)}
            />
            <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              When enabled, you will receive a verification code by email each time you log in.
            </p>
            {twoFacLoading && <p style={{ fontSize: 12, color: "#888" }}>Saving...</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="ss-theme-wrap">
      <div className="ss-theme-header">
        <h3 className="ss-theme-title">Theme & Appearance</h3>
        <p className="ss-theme-subtitle">Customize the look and feel of your school management system</p>
      </div>

      {/* Theme cards */}
      <div className="ss-theme-cards">
        {[
          {
            key: "light",
            label: "Light Mode",
            desc: "Clean and bright interface",
            preview: (
              <div className="ss-preview-mini ss-preview-light">
                <div className="ss-preview-topbar" />
                <div className="ss-preview-body">
                  <div className="ss-preview-sidebar" />
                  <div className="ss-preview-content">
                    <div className="ss-preview-card" />
                    <div className="ss-preview-card short" />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "dark",
            label: "Dark Mode",
            desc: "Easy on the eyes for low light",
            preview: (
              <div className="ss-preview-mini ss-preview-dark">
                <div className="ss-preview-topbar" />
                <div className="ss-preview-body">
                  <div className="ss-preview-sidebar" />
                  <div className="ss-preview-content">
                    <div className="ss-preview-card" />
                    <div className="ss-preview-card short" />
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: "system",
            label: "Auto (System)",
            desc: "Follows your device settings",
            preview: (
              <div className="ss-preview-mini ss-preview-auto">
                <div className="ss-preview-topbar" />
                <div className="ss-preview-body">
                  <div className="ss-preview-sidebar" />
                  <div className="ss-preview-content">
                    <div className="ss-preview-card" />
                    <div className="ss-preview-card short" />
                  </div>
                </div>
              </div>
            ),
          },
        ].map(({ key, label, desc, preview }) => (
          <div
            key={key}
            className={`ss-theme-card ${theme === key ? "selected" : ""}`}
            onClick={() => setTheme(key)}
          >
            {preview}
            <div className="ss-theme-card-info">
              <h5 className="ss-theme-card-label">{label}</h5>
              <p className="ss-theme-card-desc">{desc}</p>
            </div>
            {theme === key && (
              <div className="ss-theme-check">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ss-theme-actions">
        <Button onClick={() => {}}>Apply Theme</Button>
      </div>
    </div>
  );

  const renderBackupExport = () => (
    <div style={{ position: "relative" }}>
      {/* Coming Soon overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 10,
        background: "rgba(255,255,255,0.82)", backdropFilter: "blur(4px)",
        borderRadius: 12, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FaCog size={22} color="#fff" />
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Coming Soon</h3>
        <p style={{ margin: 0, fontSize: 13, color: "#888", textAlign: "center", maxWidth: 260 }}>
          Backup & export features are under development and will be available in a future update.
        </p>
      </div>

      {/* Blurred background content */}
      <div className="settings-section" style={{ filter: "blur(2px)", pointerEvents: "none", userSelect: "none" }}>
        <div className="section-header">
          <h3>Backup & Export</h3>
          <p>Manage data backups and exports</p>
        </div>
        <div className="backup-section">
          <div className="backup-options">
            <div className="backup-card">
              <h4>Full Data Export</h4>
              <p>Download complete school data</p>
              <Button><FaDownload /> Create Export</Button>
            </div>
            <div className="backup-card">
              <h4>Scheduled Backups</h4>
              <p>Automatically backup your data</p>
              <Button variant="secondary"><FaCog /> Configure Schedule</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InnerTabCon>
      <div className="system-settings-container">
        <div className="settings-tabs">
          <button className={`tab-button ${activeTab === "theme" ? "active" : ""}`} onClick={() => handleTabChange("theme")}>
            <FaPalette /> Theme
          </button>
          <button className={`tab-button ${activeTab === "security" ? "active" : ""}`} onClick={() => handleTabChange("security")}>
            <FaLock /> Security
          </button>
          <button className={`tab-button ${activeTab === "backup" ? "active" : ""}`} onClick={() => handleTabChange("backup")}>
            <FaDownload /> Backup
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "theme"    && renderThemeSettings()}
          {activeTab === "security" && renderSecurity()}
          {activeTab === "backup"   && renderBackupExport()}
        </div>
      </div>
    </InnerTabCon>
  );
};

export default SystemSettings;
