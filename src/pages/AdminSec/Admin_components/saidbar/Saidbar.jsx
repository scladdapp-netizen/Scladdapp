// Saidbar.jsx
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { fetchUnseenApplicationsCount } from "../../../../api_call/useApplicationForm";
import FeedbackPanel from "../../../../components/FeedbackPanel/FeedbackPanel";
import "./saidbar.css";

/* ── 2-color SVG icons ─────────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="2" width="8" height="8" rx="2" fill="#111111" />
    <rect x="12" y="2" width="8" height="8" rx="2" fill="#111111" opacity="0.3" />
    <rect x="2" y="12" width="8" height="8" rx="2" fill="#111111" opacity="0.3" />
    <rect x="12" y="12" width="8" height="8" rx="2" fill="#111111" />
  </svg>
);

const IconSession = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2.5" stroke="#111111" strokeWidth="1.8" fill="none" />
    <path d="M7 2v4M15 2v4" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="6" y="10" width="4" height="4" rx="1" fill="#111111" />
    <rect x="12" y="10" width="4" height="4" rx="1" fill="#111111" opacity="0.35" />
  </svg>
);

const IconDirectory = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M4 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.6" />
    <path d="M8 12h6M8 15h4" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconCommunication = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 3V5z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <circle cx="8" cy="9" r="1.2" fill="#111111" />
    <circle cx="11" cy="9" r="1.2" fill="#111111" opacity="0.4" />
    <circle cx="14" cy="9" r="1.2" fill="#111111" />
  </svg>
);

const IconFee = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="18" height="13" rx="2.5" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <path d="M2 9h18" stroke="#111111" strokeWidth="1.6" />
    <rect x="5" y="13" width="4" height="2" rx="0.8" fill="#111111" />
    <rect x="11" y="13" width="6" height="2" rx="0.8" fill="#111111" opacity="0.4" />
  </svg>
);

const IconTemplates = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="2.5" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6" />
    <path d="M7 7h8M7 11h5M7 15h6" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="14" y="11" width="3" height="4" rx="1" fill="#111111" opacity="0.4" />
  </svg>
);

const IconApplications = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M6 3h10a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <path d="M8 8h6M8 12h6M8 16h4" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="16" cy="6" r="3" fill="#111111" opacity="0.35" />
  </svg>
);

const IconAlumni = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 3l8 4-8 4-8-4 8-4z" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3 11l8 4 8-4" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
    <path d="M3 15l8 4 8-4" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconSchool = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 10l8-7 8 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <rect x="8" y="13" width="6" height="6" rx="1" fill="#111111" opacity="0.5" />
    <path d="M11 3v3" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="9" y="8" width="4" height="3" rx="1" fill="#111111" />
  </svg>
);

const IconSettings = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="3" fill="#111111" />
    <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
      stroke="#111111" strokeWidth="1.6" strokeLinecap="round" opacity="0.4" />
    <circle cx="11" cy="11" r="5.5" stroke="#111111" strokeWidth="1.6" fill="none" opacity="0.2" />
  </svg>
);

const IconDocs = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="4" y="2" width="14" height="18" rx="2" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6" />
    <path d="M7 7h8M7 11h8M7 15h5" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconReport = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {/* arc / headband */}
    <path d="M12 3C7.58 3 4 6.58 4 11v1" stroke="#111111" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M20 11v1" stroke="#111111" strokeWidth="1.7" strokeLinecap="round"/>
    {/* left ear cup */}
    <rect x="2" y="12" width="4" height="6" rx="2" fill="#111111" opacity="0.85"/>
    {/* right ear cup */}
    <rect x="18" y="12" width="4" height="6" rx="2" fill="#111111" opacity="0.85"/>
    {/* chin strap */}
    <path d="M20 17.5C20 19.43 18.43 21 16.5 21H13" stroke="#111111" strokeWidth="1.7" strokeLinecap="round"/>
    {/* mic dot */}
    <circle cx="12" cy="21" r="1.3" fill="#111111"/>
  </svg>
);

/* ── Nav data ──────────────────────────────────────────────────────────── */
const mainNav = [
  { id: "dashboard",        name: "Dashboard",            path: "/",                  icon: <IconDashboard />,      exact: true },
  { id: "acedemic_seasion", name: "Academic Session",     path: "/acedemic_seasion",  icon: <IconSession /> },
  { id: "school_directory", name: "School Directory",     path: "/school_directory",  icon: <IconDirectory /> },
  { id: "communication",    name: "Communication",        path: "/communication",     icon: <IconCommunication /> },
  { id: "fee_billing",      name: "Fee Billing",          path: "/fee_billing",       icon: <IconFee /> },
  { id: "templates",        name: "Templates",            path: "/templates",         icon: <IconTemplates /> },
  { id: "alumni",           name: "Alumni",               path: "/alumni",            icon: <IconAlumni /> },
  { id: "applications",     name: "Applications",         path: "/applications",      icon: <IconApplications /> },
];

const bottomNav = [
  { id: "school",         name: "School",                    path: "/school",   icon: <IconSchool /> },
  { id: "settings",       name: "Settings",                  path: "/settings", icon: <IconSettings /> },
  { id: "divider",        divider: true },
  { id: "documentation",  name: "Documentation",             path: "/docs",     absolute: true, icon: <IconDocs /> },
  { id: "report",         name: "Help & Report",             path: null,        icon: <IconReport /> },
];

/* ── Component ─────────────────────────────────────────────────────────── */
const Saidbar = ({ isMobileOpen, onClose }) => {
  const { schoolId } = useParams();
  const [expanded, setExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [unseenApplications, setUnseenApplications] = useState(0);
  const location = useLocation();
  const { user } = useAuth();

  const admin  = user?.admin  || user?.staff || {};
  const school = user?.school || {};

  const isActive = (path, exact = false) => {
    const fullPath = `/admin/${schoolId}${path}`;
    return exact
      ? location.pathname === fullPath
      : location.pathname.startsWith(fullPath);
  };

  const toggleSidebar = (e) => {
    e?.stopPropagation();
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (isMobileOpen) setExpanded(true);
  }, [isMobileOpen]);

  useEffect(() => {
    if (!schoolId) return;

    const loadUnseenCount = () => {
      fetchUnseenApplicationsCount(schoolId)
        .then((res) => {
          if (res.success) setUnseenApplications(res.data?.count || 0);
        })
        .catch(() => setUnseenApplications(0));
    };

    loadUnseenCount();
    window.addEventListener("applications-unseen-updated", loadUnseenCount);
    return () => window.removeEventListener("applications-unseen-updated", loadUnseenCount);
  }, [schoolId, location.pathname]);

  const handleMouseEnter = () => { if (!isMobileOpen && !expanded) setHoverExpanded(true); };
  const handleMouseLeave = () => { if (!isMobileOpen && !expanded) setHoverExpanded(false); };

  const isExpanded = expanded || hoverExpanded;

  const renderBadge = (itemId) => {
    if (itemId !== "applications" || unseenApplications <= 0) return null;
    const label = unseenApplications > 99 ? "99+" : unseenApplications;
    return <span className="nav-badge" aria-label={`${unseenApplications} unread applications`}>{label}</span>;
  };

  const renderLink = (item) => {
    if (item.divider) {
      return <div key={item.id} className="nav-bottom-divider" />;
    }
    if (!item.path) {
      return (
        <button
          key={item.id}
          className="nav-link"
          title={!isExpanded ? item.name : ""}
          onClick={() => { if (item.id === "report") setFeedbackOpen(true); }}
        >
        <span className="nav-icon">{item.icon}</span>
        {isExpanded && <span className="nav-text">{item.name}</span>}
        {renderBadge(item.id)}
      </button>
      );
    }
    const linkTo = item.absolute ? item.path : `/admin/${schoolId}${item.path}`;
    const linkActive = item.absolute
      ? location.pathname.startsWith(item.path)
      : isActive(item.path, item.exact);
    return (
      <Link
        key={item.id}
        to={linkTo}
        className={`nav-link ${linkActive ? "active" : ""}`}
        title={!isExpanded ? item.name : ""}
        onClick={() => isMobileOpen && onClose()}
      >
        <span className="nav-icon">{item.icon}</span>
        {isExpanded && <span className="nav-text">{item.name}</span>}
        {renderBadge(item.id)}
      </Link>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div className="al_overlay" onClick={onClose} style={{ zIndex: 10 }} />
      )}

      <div
        className={`al_saidbar ${isExpanded ? "expanded" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
        style={{ zIndex: 10 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`al_sb_nav ${isExpanded ? "expanded" : ""}`}>
          <div className="said_top_bar" />

          {/* Main nav */}
          <div className="nav-items">
            {mainNav.map(renderLink)}
          </div>

          {/* Bottom nav — School & Settings */}
          <div className="nav-bottom">
            <div className="nav-bottom-divider" />
            {bottomNav.map(renderLink)}
          </div>
        </div>

        {!isMobileOpen && (
          <div onClick={toggleSidebar} className="al_sb_toggle" />
        )}
      </div>

      <FeedbackPanel
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userType={user?.current_role || (user?.admin ? "admin" : "staff")}
        userId={admin?.admin_id || admin?.staff_id || ""}
        userName={admin?.full_name || admin?.email || "Admin"}
        userEmail={admin?.email}
        schoolId={school?.school_id || schoolId}
        schoolName={school?.school_name}
      />
    </>
  );
};

export default Saidbar;
