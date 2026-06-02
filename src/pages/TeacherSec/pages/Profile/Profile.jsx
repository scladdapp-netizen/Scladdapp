import { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import "./Profile.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

const InfoRow = ({ label, value, children }) =>
  (value || children) ? (
    <div className="pf-info-row">
      <div className="pf-info-icon">{children}</div>
      <div className="pf-info-text">
        <span className="pf-info-label">{label}</span>
        <span className="pf-info-value">{value}</span>
      </div>
    </div>
  ) : null;

const SectionCard = ({ title, children }) => (
  <div className="pf-section-card">
    <h3 className="pf-section-heading">{title}</h3>
    <div className="pf-section-body">{children}</div>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="pf-stat">
    <span className="pf-stat-value">{value || "—"}</span>
    <span className="pf-stat-label">{label}</span>
  </div>
);

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [avatarBroken, setAvatarBroken] = useState(false);

  const staff  = user?.staff  || {};
  const school = user?.school || {};

  const staffPhotoUrl =
    (typeof staff.staff_photo === "string" && staff.staff_photo.trim()) ||
    (typeof staff.staffPhoto === "string" && staff.staffPhoto.trim()) ||
    "";

  useEffect(() => {
    setAvatarBroken(false);
  }, [staffPhotoUrl]);

  const initials = staff.full_name
    ? staff.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "T";

  const isActive = staff.employment_status === "active" || staff.is_active;

  return (
    <div className="pf-page">
      {/* ── Hero section ── */}
      <div className="pf-hero-section">
        <div className="pf-cover" />

        {/* Avatar + name row */}
        <div className="pf-identity">
          <div className="pf-avatar-wrap">
            {staffPhotoUrl && !avatarBroken ? (
              <img
                src={staffPhotoUrl}
                alt={staff.full_name || "Profile"}
                className="pf-avatar-img"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <div className="pf-avatar">{initials}</div>
            )}
            <span className={`pf-online-dot ${isActive ? "active" : "inactive"}`} />
          </div>

          <div className="pf-identity-text">
            <h1 className="pf-full-name">{staff.full_name || "Teacher"}</h1>
            <p className="pf-position">{staff.position || staff.department || "Staff Member"}</p>
            <div className="pf-badges">
              <span className={`pf-badge ${isActive ? "badge-green" : "badge-red"}`}>
                {staff.employment_status || (isActive ? "Active" : "Inactive")}
              </span>
              {staff.employment_type && <span className="pf-badge badge-blue">{staff.employment_type}</span>}
              {staff.department      && <span className="pf-badge badge-purple">{staff.department}</span>}
            </div>
          </div>

          <button className="pf-signout-btn" onClick={() => { logout(); navigate("/"); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Sign Out
          </button>
        </div>

        {/* Stats row */}
        <div className="pf-stats-row">
          <StatItem label="Staff ID"      value={staff.staff_id?.slice(-8)} />
          <div className="pf-stat-divider" />
          <StatItem label="Joined"        value={fmt(staff.joining_date)} />
          <div className="pf-stat-divider" />
          <StatItem label="Department"    value={staff.department} />
          <div className="pf-stat-divider" />
          <StatItem label="Qualification" value={staff.qualification} />
        </div>
      </div>

      {/* ── Content grid ── */}
      <InnerTabCon>
        <div className="pf-content-grid">
        {/* Left column */}
        <div className="pf-col">
          <SectionCard title="Contact Information">
            <InfoRow label="Email" value={staff.email}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </InfoRow>
            <InfoRow label="Phone" value={staff.phone}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </InfoRow>
            <InfoRow label="Address" value={staff.address}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </InfoRow>
          </SectionCard>

          <SectionCard title="Personal Details">
            <div className="pf-detail-grid">
              {[
                ["Gender",        staff.gender],
                ["Date of Birth", fmt(staff.date_of_birth)],
                ["Nationality",   staff.nationality],
                ["Religion",      staff.religion],
                ["Blood Group",   staff.blood_group],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="pf-detail-item">
                  <span className="pf-detail-label">{l}</span>
                  <span className="pf-detail-value">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="pf-col">
          <SectionCard title="Employment Details">
            <div className="pf-detail-grid">
              {[
                ["Position",        staff.position],
                ["Department",      staff.department],
                ["Employment Type", staff.employment_type],
                ["Joining Date",    fmt(staff.joining_date)],
                ["Qualification",   staff.qualification],
                ["Status",          staff.employment_status],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} className="pf-detail-item">
                  <span className="pf-detail-label">{l}</span>
                  <span className="pf-detail-value">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* <div className="pf-section-card">
            <div className="pf-section-body pf-school-row-wrap">
              <div className="pf-school-row">
                {school.logo_url && typeof school.logo_url === "string" ? (
                  <img src={school.logo_url} alt={school.school_name} className="pf-school-logo" />
                ) : (
                  <div className="pf-school-logo-ph">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div>
                  <p className="pf-school-name">{school.school_name || "—"}</p>
                  {school.motto && <p className="pf-school-motto">"{school.motto}"</p>}
                </div>
              </div>
            </div>
            <div className="pf-section-body">
              <div className="pf-detail-grid">
                {[
                  ["Email",   school.email],
                  ["Phone",   school.phone_number],
                  ["Address", school.address],
                  ["Country", school.country],
                  ["State",   school.state],
                  ["Website", school.website],
                ].filter(([, v]) => v).map(([l, v]) => (
                  <div key={l} className="pf-detail-item">
                    <span className="pf-detail-label">{l}</span>
                    <span className="pf-detail-value">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div> */}
        </div>
      </div>
      </InnerTabCon>
    </div>
  );
};

export default Profile;
