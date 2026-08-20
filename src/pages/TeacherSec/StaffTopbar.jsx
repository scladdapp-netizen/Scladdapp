// StaffTopbar.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import { useSession } from "../../api_call/useSession";
import "./StaffTopbar.css";

const StaffTopbar = ({ isMobileMenuOpen, onMenuClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { theme, setTheme } = useTheme();
  const { getActiveSession } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const profileRef = useRef(null);

  const staff  = user?.staff;
  const school = user?.school;

  const displayName = staff?.full_name || staff?.email || "Staff";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Close profile on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch active session
  useEffect(() => {
    if (!schoolId) return;
    getActiveSession(schoolId).then((res) => {
      if (res.success && res.data?.session) setActiveSession(res.data);
    });
  }, [schoolId]);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleMenuClick = (e) => { e.stopPropagation(); onMenuClick(); };

  return (
    <div className="sft_topbar">
      {/* Left — brand */}
      <div className="sft_left">
        <button className="sft_menu_btn" onClick={handleMenuClick}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="sft_brand">
          <div className="sft_brand_icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white" />
              <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
              <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
            </svg>
          </div>
          <span className="sft_brand_text">Scladapp</span>
        </div>

        {/* Divider */}
        <div className="sft_brand_divider" />

        {/* School identity */}
        <div className="sft_school_brand">
          {(typeof school?.logo_url === "string" && school.logo_url) ? (
            <img src={school.logo_url} alt={school?.school_name} className="sft_school_logo" />
          ) : (
            <div className="sft_school_logo_fallback">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5"/>
                <rect x="7" y="12" width="6" height="6" rx="1" fill="#111111" opacity="0.4"/>
              </svg>
            </div>
          )}
          <span className="sft_school_name">{school?.school_name || "School"}</span>
        </div>
      </div>

      {/* Center — active session pill */}
      <div className="sft_center">
        {activeSession?.session ? (
          <div className="sft_session_pill">
            {/* calendar icon */}
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="2.5" width="11" height="9.5" rx="1.5" stroke="#10b981" strokeWidth="1.3" />
              <path d="M4 1v3M9 1v3" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
              <path d="M1 6h11" stroke="#10b981" strokeWidth="1.1" opacity="0.5" />
            </svg>
            <span className="sft_session_name">{activeSession.session.session_name}</span>
            {activeSession.subsession && (
              <>
                <span className="sft_session_sep">·</span>
                <span className="sft_subsession_name">{activeSession.subsession.term_name}</span>
                <span className="sft_active_dot" title="Active" />
              </>
            )}
          </div>
        ) : (
          <span className="sft_no_session">No active session</span>
        )}
      </div>

      {/* Right */}
      <div className="sft_right">
        {/* Theme toggle */}
        <button
          className="sft_icon_btn"
          onClick={() => {
            const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
            setTheme(next);
          }}
          title={`Theme: ${theme} (click to cycle)`}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 6a3 3 0 010 6" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            </svg>
          ) : theme === "system" ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="9" rx="1.5" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5" />
              <path d="M6 15h6M9 12v3" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3.5" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" />
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
                stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
            </svg>
          )}
        </button>

        {/* Profile */}
        <div className="sft_profile_wrapper" ref={profileRef}>
          <button
            className="sft_avatar_btn"
            onClick={() => setIsProfileOpen((p) => !p)}
            title={displayName}
          >
            {staff?.staff_photo ? (
              <img src={staff.staff_photo} alt={displayName} className="sft_avatar_img" />
            ) : (
              <span className="sft_avatar_initials">{initials}</span>
            )}
          </button>

          {isProfileOpen && (
            <div className="sft_dropdown">
              {/* Header */}
              <div className="sft_pd_header">
                <div className="sft_pd_avatar_large">{initials}</div>
                <div className="sft_pd_header_info">
                  <p className="sft_pd_name">{displayName}</p>
                  <p className="sft_pd_email">{staff?.email || "—"}</p>
                  <span className="sft_pd_badge">
                    {/* briefcase icon */}
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <rect x="1" y="3.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1" />
                      <path d="M3.5 3.5V2.5a1.5 1.5 0 013 0v1" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                    </svg>
                    {staff?.position || "Staff"}
                  </span>
                </div>
              </div>

              <div className="sft_pd_divider" />

              {/* School */}
              <div className="sft_pd_section">
                <div className="sft_pd_section_label">School</div>
                <div className="sft_pd_row">
                  {/* school building icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="5" width="12" height="8" rx="1" stroke="#6b7280" strokeWidth="1.2" />
                    <path d="M4 13V9h2v4M8 13V9h2v4" stroke="#6b7280" strokeWidth="1.1" strokeLinecap="round" />
                    <path d="M1 5L7 1l6 4" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sft_pd_school_name">{school?.school_name || "—"}</span>
                </div>
                {school?.address && <p className="sft_pd_meta">{school.address}</p>}
                {school?.email && <p className="sft_pd_meta">{school.email}</p>}
              </div>

              {/* Active session in dropdown */}
              {activeSession?.session && (
                <>
                  <div className="sft_pd_divider" />
                  <div className="sft_pd_section">
                    <div className="sft_pd_section_label">Current Session</div>
                    <div className="sft_pd_row">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="2.5" width="11" height="9.5" rx="1.5" stroke="#10b981" strokeWidth="1.3" />
                        <path d="M4 1v3M9 1v3" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M1 6h11" stroke="#10b981" strokeWidth="1.1" opacity="0.5" />
                      </svg>
                      <span className="sft_pd_school_name">{activeSession.session.session_name}</span>
                    </div>
                    {activeSession.subsession && (
                      <p className="sft_pd_meta">{activeSession.subsession.term_name}</p>
                    )}
                  </div>
                </>
              )}

              <div className="sft_pd_divider" />

              {/* Sign out */}
              <div className="sft_pd_actions">
                <button
                  className="sft_pd_action_btn danger"
                  onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                >
                  {/* sign out icon */}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <path d="M9 10l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTopbar;
