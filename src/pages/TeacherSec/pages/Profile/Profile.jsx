import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import useStaffInfo from "../../../../api_call/useStaffInfo";
import StudentDetailTopTab from "../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../components/infoField/InfoField";
import Button from "../../../../components/Button/Button";
import "../SubjectDashboard/pages/SubjectInfo/SubjectInfo.css";
import "./Profile.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const SectionCard = ({ title, children }) => (
  <div className="al-section">
    <span className="si-section-title">{title}</span>
    <div className="si-grid">{children}</div>
  </div>
);

/* ── Identity tab ── */
const IdentityTab = ({ staff, logout, navigate }) => {
  const [avatarBroken, setAvatarBroken] = useState(false);

  const staffPhotoUrl =
    (typeof staff.staff_photo === "string" && staff.staff_photo.trim()) ||
    (typeof staff.staffPhoto === "string" && staff.staffPhoto.trim()) ||
    "";

  const initials = staff.full_name
    ? staff.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "T";

  const isActive = staff.employment_status === "active" || staff.is_active;

  return (
    <InnerTabCon>
      <div className="si-overview">
        <div className="si-card">
          {/* Banner */}
          <div className="si-banner" />

          {/* Header */}
          <div className="si-header">
            <div className="si-header-left">
              <div className="si-icon-wrap pf-icon-wrap-round">
                {staffPhotoUrl && !avatarBroken ? (
                  <img
                    src={staffPhotoUrl}
                    alt={staff.full_name || "Profile"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                    onError={() => setAvatarBroken(true)}
                  />
                ) : (
                  <span className="pf-initials">{initials}</span>
                )}
              </div>
              <div className="si-header-text">
                <h3>{staff.full_name || "Teacher"}</h3>
                <p className="si-subtitle">{staff.position || staff.department || "Staff Member"}</p>
                <div className="si-badges">
                  <span className={`si-badge ${isActive ? "active" : "inactive"}`}>
                    {staff.employment_status || (isActive ? "Active" : "Inactive")}
                  </span>
                  {staff.employment_type && <span className="si-badge">{staff.employment_type}</span>}
                  {staff.department && <span className="si-badge">{staff.department}</span>}
                </div>
              </div>
            </div>

            {/* Sign out button */}
            <button className="pf-signout-btn" onClick={() => { logout(); navigate("/"); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sign Out
            </button>
          </div>

          {/* Body */}
          <div className="si-body">
            <SectionCard title="Staff Information">
              <InfoField label="Full Name"     value={staff.full_name} />
              <InfoField label="Staff ID"      value={staff.staff_id} />
              <InfoField label="Date of Birth" value={fmt(staff.date_of_birth)} />
              <InfoField label="Gender"        value={staff.gender} />
              <InfoField label="Email"         value={staff.email} />
              <InfoField label="Phone"         value={staff.phone} />
              <InfoField label="WhatsApp"      value={staff.whatsapp} />
              <InfoField label="Religion"      value={staff.religion} />
              <InfoField label="Marital Status" value={staff.marital_status} />
              <InfoField label="Nationality"   value={staff.nationality} />
            </SectionCard>

            <SectionCard title="Identity / bio">
              <InfoField label="Place of Birth"       value={staff.place_of_birth} />
              <InfoField label="LGA of Origin"        value={staff.lga_of_origin} />
              <InfoField label="State of Origin"      value={staff.state_of_origin} />
              <InfoField label="Tribe / Ethnic Group" value={staff.tribe} />
              <InfoField label="NIN"                  value={staff.nin || staff.national_id} />
              <InfoField label="Blood Group"          value={staff.blood_group} />
              <InfoField label="Genotype"             value={staff.genotype} />
            </SectionCard>

            <SectionCard title="Residence">
              <InfoField label="House Number / Street" value={staff.house_number_street} />
              <InfoField label="Area / Estate"         value={staff.area_estate} />
              <InfoField label="City"                  value={staff.city} />
              <InfoField label="LGA of Residence"      value={staff.lga_of_residence} />
              <InfoField label="State of Residence"    value={staff.state_of_residence} />
              <InfoField label="Landmark"              value={staff.landmark} />
            </SectionCard>

            <SectionCard title="Emergency Contact">
              <InfoField label="Name"         value={staff.emergency_contact_name} />
              <InfoField label="Relationship" value={staff.emergency_contact_relationship} />
              <InfoField label="Phone"        value={staff.emergency_contact_phone} />
              <InfoField label="WhatsApp"     value={staff.emergency_contact_whatsapp} />
            </SectionCard>

            <SectionCard title="Employment Details">
              <InfoField label="Position"        value={staff.position} />
              <InfoField label="Department"      value={staff.department} />
              <InfoField label="Employment Type" value={staff.employment_type} />
              <InfoField label="Joining Date"    value={fmt(staff.joining_date)} />
              <InfoField label="Qualification"   value={staff.qualification} />
            </SectionCard>
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

/* ── Security tab ── */
const SecurityTab = ({ staff }) => {
  const { addNotification } = useNotification();
  const { changePassword, toggleTwoFactorAuth } = useStaffInfo();

  // Password form
  const [form, setForm]     = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // 2FA
  const [twoFA, setTwoFA]         = useState(!!staff?.two_factor_auth);
  const [twoFASaving, setTwoFASaving] = useState(false);

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.current)             errs.current = "Current password is required";
    if (!form.next)                errs.next    = "New password is required";
    else if (form.next.length < 8) errs.next    = "Must be at least 8 characters";
    if (!form.confirm)             errs.confirm = "Please confirm your new password";
    else if (form.next !== form.confirm) errs.confirm = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const res = await changePassword(staff?.staff_id, form.current, form.next);
    setSaving(false);
    if (res.success) {
      addNotification("Password updated successfully", "success");
      setForm({ current: "", next: "", confirm: "" });
    } else {
      addNotification(res.message || "Failed to update password", "error");
    }
  };

  const handleToggle2FA = async () => {
    const next = !twoFA;
    setTwoFASaving(true);
    const res = await toggleTwoFactorAuth(staff?.staff_id, next);
    setTwoFASaving(false);
    if (res.success) {
      setTwoFA(next);
      addNotification(`Two-factor authentication ${next ? "enabled" : "disabled"}`, "success");
    } else {
      addNotification(res.message || "Failed to update 2FA setting", "error");
    }
  };

  const fields = [
    { key: "current", label: "Current Password",     type: "password", placeholder: "Enter current password" },
    { key: "next",    label: "New Password",          type: "password", placeholder: "At least 8 characters" },
    { key: "confirm", label: "Confirm New Password",  type: "password", placeholder: "Re-enter new password" },
  ];

  return (
    <InnerTabCon>
      <div className="si-overview">
        <div className="si-card">
          <div className="si-banner" />
          <div className="si-header">
            <div className="si-header-left">
              <div className="si-icon-wrap">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="si-header-text">
                <h3>Security Settings</h3>
                <p className="si-subtitle">Manage your password and account security</p>
              </div>
            </div>
          </div>

          <div className="si-body">
            {/* ── Change Password ── */}
            <div className="al-section">
              <span className="si-section-title">Change Password</span>
              <form className="pf-sec-form" onSubmit={handleSubmit} noValidate>
                {fields.map(({ key, label, type, placeholder }) => (
                  <div key={key} className="pf-sec-field">
                    <label className="pf-sec-label">{label}</label>
                    <input
                      className={`pf-sec-input${errors[key] ? " pf-sec-input--error" : ""}`}
                      type={type}
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      autoComplete={key === "current" ? "current-password" : "new-password"}
                    />
                    {errors[key] && <span className="pf-sec-error">{errors[key]}</span>}
                  </div>
                ))}
                <div className="pf-sec-actions">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </div>

            {/* ── Two-Factor Authentication ── */}
            <div className="al-section">
              <span className="si-section-title">Two-Factor Authentication</span>
              <div className="pf-2fa-row">
                <div className="pf-2fa-info">
                  <div className="pf-2fa-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="pf-2fa-title">Extra layer of security</p>
                    <p className="pf-2fa-desc">
                      {twoFA
                        ? "2FA is enabled. Your account has extra protection."
                        : "Enable 2FA to add an extra layer of protection to your account."}
                    </p>
                  </div>
                </div>
                <button
                  className={`pf-2fa-toggle${twoFA ? " pf-2fa-toggle--on" : ""}`}
                  onClick={handleToggle2FA}
                  disabled={twoFASaving}
                  type="button"
                  title={twoFA ? "Disable 2FA" : "Enable 2FA"}
                >
                  <span className="pf-2fa-thumb" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

/* ── Main ── */
const Profile = () => {
  const { user, logout } = useAuth();
  const { schoolId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getStaffById } = useStaffInfo();

  const [staff, setStaff] = useState(user?.staff || {});
  const basePath = `/teacher/${schoolId}/profile`;

  useEffect(() => {
    const id = user?.staff?.staff_id;
    if (!id) return;
    getStaffById(id).then((res) => {
      if (res.success && res.data) setStaff(res.data.staff || res.data);
    });
  }, [user?.staff?.staff_id]);

  return (
    <StudentDetailTopTab
      title={staff.full_name || "My Profile"}
      subtitle={staff.position || staff.department || "Teacher Profile"}
      route={[
        { label: "Identity", link: "/identity" },
        { label: "Security", link: "/security" },
      ]}
    >
      <Routes>
        <Route path="/"          element={<Navigate to={`${basePath}/identity`} replace />} />
        <Route path="/identity"  element={<IdentityTab staff={staff} logout={logout} navigate={navigate} />} />
        <Route path="/security"  element={<SecurityTab staff={staff} />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default Profile;
