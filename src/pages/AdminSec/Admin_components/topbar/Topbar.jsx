// Topbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaSignOutAlt, FaSchool, FaCrown, FaUserShield, FaEdit, FaCog, FaMoon, FaSun, FaSearch, FaGraduationCap, FaUsers, FaUser, FaChalkboardTeacher, FaBell, FaMoneyBillWave } from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../../../../context/ThemeContext/ThemeContext";
import useGlobalSearch from "../../../../api_call/useGlobalSearch";
import "./Topbar.css";

const Topbar = ({ isMobileMenuOpen, onMenuClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { theme, setTheme, resolved } = useTheme();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Apply theme
  // handled by ThemeContext

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

  // Close search on Escape, open on Ctrl+/ or Cmd+/
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") { setIsSearchOpen(false); return; }
      if (e.key === "/" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const admin = user?.admin;
  const school = user?.school;
  const subscription = user?.subscription;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const displayName = admin?.username || admin?.email || "Admin";
  const initials = displayName.slice(0, 2).toUpperCase();

  const { results: searchResults, loading: searchLoading, search: runSearch, clear: clearSearch } = useGlobalSearch(school?.school_id);

  const handleLogout = () => { logout(); navigate("/"); };

  const handleMenuClick = (e) => { e.stopPropagation(); onMenuClick(); };

  return (
    <>
      <div className="al_topbar">
        {/* Left — brand */}
        <div className="al_topbar_left">
          <button className="al_menu_btn" onClick={handleMenuClick}>
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
          <div className="al_brand" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="al_brand_icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white" />
                <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
              </svg>
            </div>
            <span className="al_brand_text">Scladapp</span>
          </div>
        </div>

        {/* Center — search trigger */}
        <div className="al_topbar_center">
          <button className="al_search_trigger" onClick={() => setIsSearchOpen(true)}>
            <FaSearch size={13} />
            <span>Search...</span>
            <kbd>Ctrl+/</kbd>
          </button>
        </div>

        {/* Right */}
        <div className="al_topbar_right">
          {/* Search icon (mobile) */}
          <button className="topbar-icon-btn al_search_mobile" onClick={() => setIsSearchOpen(true)} title="Search">
            <FaSearch size={15} />
          </button>

          {/* Theme toggle — cycles light → dark → system */}
          <button
            className="topbar-icon-btn"
            onClick={() => {
              const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
              setTheme(next);
            }}
            title={`Theme: ${theme} (click to cycle)`}
          >
            {theme === "dark" ? (
              /* moon */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M12 6a3 3 0 010 6" stroke="#111111" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
              </svg>
            ) : theme === "system" ? (
              /* monitor */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="3" width="14" height="9" rx="1.5" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5" />
                <path d="M6 15h6M9 12v3" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            ) : (
              /* sun */
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3.5" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" />
                <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
                  stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
              </svg>
            )}
          </button>

          {/* Settings */}
          <button className="topbar-icon-btn" onClick={() => navigate(`/admin/${schoolId}/settings`)} title="Settings">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" fill="#111111" />
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
                stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
              <circle cx="9" cy="9" r="4.5" stroke="#111111" strokeWidth="1.4" fill="none" opacity="0.18" />
            </svg>
          </button>

          {/* Profile */}
          <div className="profile-dropdown-wrapper" ref={profileRef}>
            <button className="profile-avatar-btn" onClick={() => setIsProfileOpen((p) => !p)} title={displayName}>
              <span className="profile-avatar-initials">{initials}</span>
            </button>

            {isProfileOpen && (
              <div className="profile-dropdown">
                {/* Header */}
                <div className="pd-header">
                  <div className="pd-avatar-large">{initials}</div>
                  <div className="pd-header-info">
                    <p className="pd-name">{displayName}</p>
                    <p className="pd-email">{admin?.email || "—"}</p>
                    <span className={`pd-role-badge ${isSuperAdmin ? "super" : "sub"}`}>
                      {isSuperAdmin ? <><FaCrown size={10} /> Super Admin</> : <><FaUserShield size={10} /> Sub Admin</>}
                    </span>
                  </div>
                </div>

                <div className="pd-divider" />

                {/* School */}
                <div className="pd-section">
                  <div className="pd-section-label">School</div>
                  <div className="pd-school-row">
                    <FaSchool size={14} color="#6b7280" />
                    <span className="pd-school-name">{school?.school_name || "—"}</span>
                  </div>
                  {school?.address && <p className="pd-school-meta">{school.address}</p>}
                  {school?.email && <p className="pd-school-meta">{school.email}</p>}
                  <button className="pd-edit-school-btn" onClick={() => { setIsProfileOpen(false); navigate(`/admin/${school?.school_id}/settings?school-tab=profile`); }}>
                    <FaEdit size={12} /> Edit School Profile
                  </button>
                </div>

                <div className="pd-divider" />

                {/* Subscription */}
                <div className="pd-section">
                  <div className="pd-section-label">Subscription</div>
                  <div className="pd-plan-row">
                    <FaCrown size={13} color="#7c3aed" />
                    <span className="pd-plan-name">{subscription?.plan_name || "Free Plan"}</span>
                    <span className={`pd-plan-status ${subscription?.subscription_status === "active" ? "active" : "inactive"}`}>
                      {subscription?.subscription_status || "inactive"}
                    </span>
                  </div>
                  {subscription?.end_date && (
                    <p className="pd-school-meta">
                      {new Date(subscription.end_date) < new Date() ? "Expired" : "Expires"}{" "}
                      {new Date(subscription.end_date).toLocaleDateString()}
                    </p>
                  )}
                  <button className="pd-edit-school-btn" onClick={() => { setIsProfileOpen(false); navigate(`/admin/${school?.school_id}/settings/subscriptions?tab=upgrade`); }}>
                    <FaCrown size={12} /> Upgrade Plan
                  </button>
                </div>

                <div className="pd-divider" />

                {/* Sign out */}
                <div className="pd-actions">
                  <button className="pd-action-btn danger" onClick={() => { setIsProfileOpen(false); handleLogout(); }}>
                    <FaSignOutAlt size={13} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="search-modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-input-row">
              <FaSearch size={16} color="rgba(255,255,255,0.45)" />
              <input
                ref={searchInputRef}
                type="text"
                className="search-modal-input"
                placeholder="Search students, classes, staff..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  runSearch(e.target.value);
                }}
              />
              {searchQuery && (
                <button className="search-modal-clear" onClick={() => { setSearchQuery(""); clearSearch(); }}>
                  <FaTimes size={14} />
                </button>
              )}
            </div>

            {/* Results */}
            {searchQuery.length >= 2 && (
              <div className="search-modal-results">
                {searchLoading ? (
                  <div className="search-modal-hint"><p>Searching...</p></div>
                ) : searchResults.length === 0 ? (
                  <div className="search-modal-hint"><p>No results for "{searchQuery}"</p></div>
                ) : (
                  searchResults.map((item) => {
                    const typeConfig = {
                      student:      { label: "Student",      initials: true },
                      class:        { label: "Class",        initials: false },
                      staff:        { label: "Staff",        initials: true },
                      teacher:      { label: "Teacher",      initials: true },
                      subject:      { label: "Subject",      initials: false },
                      admin:        { label: "Admin",        initials: true },
                      session:      { label: "Session",      initials: false },
                      graduate:     { label: "Graduate",     initials: true },
                      notification: { label: "Notification", initials: false },
                      bill:         { label: "Bill",         initials: false },
                    }[item._type] || { label: item._type, initials: false };

                    const initials2 = item._label?.slice(0, 2).toUpperCase() || "??";

                    return (
                      <button
                        key={`${item._type}-${item._id}`}
                        className="search-result-item"
                        onClick={() => {
                          const sid = school?.school_id;
                          if (item._type === "student") navigate(`/admin/${sid}/Profile/${item._id}`);
                          else if (item._type === "class") navigate(`/admin/${sid}/Class/${item._id}/overview`);
                          else if (item._type === "staff") navigate(`/admin/${sid}/staff/${item._id}`);
                          else if (item._type === "teacher") navigate(`/admin/${sid}/teachers/${item._id}/identity`);
                          else if (item._type === "subject") navigate(`/admin/${sid}/subjects/${item._id}/overview`);
                          else if (item._type === "admin") navigate(`/admin/${sid}/admins/${item._id}`);
                          else if (item._type === "session") navigate(`/admin/${sid}/acedemic_seasion/sd/${item._id}`);
                          else if (item._type === "graduate") navigate(`/admin/${sid}/alumni/profile/${item._id}`);
                          else if (item._type === "notification") navigate(`/admin/${sid}/communication/notifications/${item._id}`);
                          else if (item._type === "bill") navigate(`/admin/${sid}/fee_billing/bills/${item._id}`);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          clearSearch();
                        }}
                      >
                        {/* Avatar */}
                        <div className="sri-avatar">
                          {item._photo ? (
                            <img src={item._photo} alt={item._label} className="sri-avatar-img" />
                          ) : typeConfig.initials ? (
                            <span className="sri-avatar-initials">{initials2}</span>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="sri-avatar-svg">
                              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#111111" opacity="0.7" />
                              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#111111" opacity="0.3" />
                              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#111111" opacity="0.3" />
                              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#111111" opacity="0.7" />
                            </svg>
                          )}
                        </div>

                        {/* Info */}
                        <div className="search-result-info">
                          <span className="search-result-name">{item._label}</span>
                          {item._sub && <span className="search-result-sub">{item._sub}</span>}
                        </div>

                        {/* Type pill */}
                        <span className="sri-type-pill">{typeConfig.label}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {!searchQuery && (
              <div className="search-modal-hint">
                <p>Start typing to search across the system</p>
                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Press <kbd>Esc</kbd> to close</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
