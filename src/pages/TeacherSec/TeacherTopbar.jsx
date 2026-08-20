// TeacherTopbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaSignOutAlt, FaSchool, FaChalkboardTeacher, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import { useSession } from "../../api_call/useSession";
import useNotification from "../../api_call/useNotification";
import "./TeacherTopbar.css";

const TeacherTopbar = ({ isMobileMenuOpen, onMenuClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { theme, setTheme } = useTheme();
  const { getActiveSession } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [schoolLogoBroken, setSchoolLogoBroken] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bellShake, setBellShake]     = useState(false);
  const profileRef = useRef(null);

  const staff  = user?.staff;
  const school = user?.school;

  const { getUserUnreadCount } = useNotification();

  const displayName = staff?.full_name || staff?.email || "Staff";
  const staffPhotoUrl =
    (typeof staff?.staff_photo === "string" && staff.staff_photo.trim()) ||
    (typeof staff?.staffPhoto === "string" && staff.staffPhoto.trim()) ||
    "";

  const schoolLogoUrl =
    typeof school?.logo_url === "string" && school.logo_url.trim() ? school.logo_url.trim() : "";
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

  useEffect(() => {
    setAvatarBroken(false);
  }, [staffPhotoUrl]);

  useEffect(() => {
    setSchoolLogoBroken(false);
  }, [schoolLogoUrl]);

  // Fetch active session
  useEffect(() => {
    if (!schoolId) return;
    getActiveSession(schoolId).then((res) => {
      if (res.success && res.data?.session) setActiveSession(res.data);
    });
  }, [schoolId]);

  // Poll unread notification count every 2 min
  useEffect(() => {
    if (!staff?.staff_id) return;
    const poll = async () => {
      const res = await getUserUnreadCount(staff.staff_id);
      if (res.success && res.count !== unreadCount) {
        setUnreadCount(res.count);
        if (res.count > 0) {
          setBellShake(true);
          setTimeout(() => setBellShake(false), 820);
        }
      }
    };
    poll();
    const id = setInterval(poll, 120000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff?.staff_id]);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleMenuClick = (e) => { e.stopPropagation(); onMenuClick(); };

  return (
    <div className="st_topbar">
      {/* Left — brand */}
      <div className="st_topbar_left">
        <button className="st_menu_btn" onClick={handleMenuClick}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="st_brand">
          <div className="st_brand_icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white" />
              <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
              <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
            </svg>
          </div>
          <span className="st_brand_text">Scladapp</span>
        </div>

        {/* Divider */}
        <div className="st_brand_divider" />

        {/* School identity */}
        <div className="st_school_brand">
          {schoolLogoUrl && !schoolLogoBroken ? (
            <img
              src={schoolLogoUrl}
              alt={school?.school_name}
              className="st_school_logo"
              onError={() => setSchoolLogoBroken(true)}
            />
          ) : (
            <div className="st_school_logo_fallback">
              <FaSchool size={12} color="#6b7280" />
            </div>
          )}
          <span className="st_school_name">{school?.school_name || "School"}</span>
        </div>
      </div>

      {/* Center — active session */}
      <div className="st_topbar_center">
        {activeSession?.session ? (
          <div className="st_session_pill">
            <FaCalendarAlt size={12} color="#10b981" />
            <span className="st_session_name">{activeSession.session.session_name}</span>
            {activeSession.subsession && (
              <>
                <span className="st_session_sep">·</span>
                <span className="st_subsession_name">{activeSession.subsession.term_name}</span>
                <span className="st_active_dot" title="Active" />
              </>
            )}
          </div>
        ) : (
          <span className="st_no_session">No active session</span>
        )}
      </div>

      {/* Right */}
      <div className="st_topbar_right">
        {/* Notifications */}
        <button
          className={`st_icon_btn st_bell_btn${bellShake ? " st_bell_shake" : ""}`}
          onClick={() => navigate(`/teacher/${schoolId}/notifications`)}
          title="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2a5.5 5.5 0 00-5.5 5.5c0 2.2-.6 3.5-1.2 4.3-.3.4-.1 1 .4 1h12.6c.5 0 .7-.6.4-1-.6-.8-1.2-2.1-1.2-4.3A5.5 5.5 0 009 2z"
              stroke="#111111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            <path d="M7 14.5a2 2 0 004 0" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
          </svg>
          {unreadCount > 0 && (
            <span className="st_bell_badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        {/* Theme toggle — cycles light → dark → system */}
        <button
          className="st_icon_btn"
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
        <div className="st_profile_wrapper" ref={profileRef}>
          <button
            className="st_avatar_btn"
            onClick={() => setIsProfileOpen((p) => !p)}
            title={displayName}
          >
            {staffPhotoUrl && !avatarBroken ? (
              <img
                src={staffPhotoUrl}
                alt={displayName}
                className="st_avatar_img"
                onError={() => setAvatarBroken(true)}
              />
            ) : (
              <span className="st_avatar_initials">{initials}</span>
            )}
          </button>

          {isProfileOpen && (
            <div className="st_dropdown">
              {/* Header */}
              <div className="st_pd_header">
                <div className="st_pd_avatar_large">
                  {staffPhotoUrl && !avatarBroken ? (
                    <img
                      src={staffPhotoUrl}
                      alt={displayName}
                      className="st_pd_avatar_img"
                      onError={() => setAvatarBroken(true)}
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="st_pd_header_info">
                  <p className="st_pd_name">{displayName}</p>
                  <p className="st_pd_email">{staff?.email || "—"}</p>
                  <span className="st_pd_badge">
                    <FaChalkboardTeacher size={10} />
                    {staff?.position || "Staff"}
                  </span>
                </div>
              </div>

              <div className="st_pd_divider" />

              {/* School */}
              <div className="st_pd_section">
                <div className="st_pd_section_label">School</div>
                <div className="st_pd_school-brand">
                  <div className="st_pd_row">
                    {schoolLogoUrl && !schoolLogoBroken ? (
                      <img
                        src={schoolLogoUrl}
                        alt=""
                        className="st_pd_school_logo"
                        onError={() => setSchoolLogoBroken(true)}
                      />
                    ) : (
                      <FaSchool size={14} color="#6b7280" className="st_pd_school_icon_fallback" />
                    )}
                    <span className="st_pd_school_name">{school?.school_name || "—"}</span>
                  </div>
                  {school?.address && <p className="st_pd_meta st_pd_meta_block">{school.address}</p>}
                  {school?.email && <p className="st_pd_meta st_pd_meta_block">{school.email}</p>}
                </div>
              </div>

              <div className="st_pd_divider" />

              {/* Active session */}
              {activeSession?.session && (
                <>
                  <div className="st_pd_section">
                    <div className="st_pd_section_label">Current Session</div>
                    <div className="st_pd_row">
                      <FaCalendarAlt size={13} color="#10b981" />
                      <span className="st_pd_school_name">{activeSession.session.session_name}</span>
                    </div>
                    {activeSession.subsession && (
                      <p className="st_pd_meta">{activeSession.subsession.term_name}</p>
                    )}
                  </div>
                  <div className="st_pd_divider" />
                </>
              )}

              {/* Sign out */}
              <div className="st_pd_actions">
                <button
                  className="st_pd_action_btn danger"
                  onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                >
                  <FaSignOutAlt size={13} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTopbar;
