import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import FeedbackPanel from "../../components/FeedbackPanel/FeedbackPanel";
import "./TeacherSec.css";

/* ── 2-color SVG icons ─────────────────────────────────────────────────── */
const IconAssignments = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="3" width="16" height="16" rx="2.5" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6" />
    <path d="M7 7h8M7 11h5M7 15h6" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="14" y="11" width="3" height="4" rx="1" fill="#111111" opacity="0.4" />
  </svg>
);

const IconNotifications = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 3a6 6 0 016 6v3l1.5 2.5H3.5L5 12V9a6 6 0 016-6z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <path d="M9 17a2 2 0 004 0" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="11" cy="3" r="1.2" fill="#111111" opacity="0.4" />
  </svg>
);

const IconEvents = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2.5" stroke="#111111" strokeWidth="1.8" fill="none" />
    <path d="M7 2v4M15 2v4" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="6" y="10" width="4" height="4" rx="1" fill="#111111" />
    <rect x="12" y="10" width="4" height="4" rx="1" fill="#111111" opacity="0.35" />
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

const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="4" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
    <path d="M3 19c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5" />
  </svg>
);

const IconDocs = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="4" y="2" width="14" height="18" rx="2" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6" />
    <path d="M7 7h8M7 11h8M7 15h5" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const IconReport = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 3l8 4-8 4-8-4 8-4z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="15" cy="15" r="4" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.5" />
    <path d="M15 13v2.5M15 17h.01" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const NAV_ITEMS = [
  { id: "assignments",   name: "Assignments",          icon: <IconAssignments /> },
  { id: "notifications", name: "School Notifications", icon: <IconNotifications /> },
  { id: "events",        name: "Events & Calendar",    icon: <IconEvents /> },
  { id: "school",        name: "School",               icon: <IconSchool /> },
  { id: "profile",       name: "Profile",              icon: <IconProfile /> },
];

const TeacherSidebar = ({ isMobileOpen, onClose }) => {
  const { schoolId } = useParams();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { user } = useAuth();

  const staff  = user?.staff;
  const school = user?.school;

  const initials = staff?.full_name
    ? staff.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "T";

  const isActive = (id) =>
    location.pathname.startsWith(`/teacher/${schoolId}/${id}`);

  const toggleSidebar = (e) => {
    e?.stopPropagation();
    setExpanded((prev) => !prev);
  };

  useEffect(() => {
    if (isMobileOpen) setExpanded(true);
  }, [isMobileOpen]);

  const handleMouseEnter = () => { if (!isMobileOpen && !expanded) setHoverExpanded(true); };
  const handleMouseLeave = () => { if (!isMobileOpen && !expanded) setHoverExpanded(false); };

  const isExpanded = expanded || hoverExpanded;

  return (
    <>
      {isMobileOpen && (
        <div className="t_al_overlay" onClick={onClose} />
      )}

      <div
        className={`t_al_saidbar ${isExpanded ? "expanded" : ""} ${isMobileOpen ? "mobile-open" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`t_al_sb_nav ${isExpanded ? "expanded" : ""}`}>
          <div className="t_nav_items">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={`/teacher/${schoolId}/${item.id}`}
                className={`t_nav_link ${isActive(item.id) ? "active" : ""}`}
                title={!isExpanded ? item.name : ""}
                onClick={() => isMobileOpen && onClose()}
              >
                <span className="t_nav_icon">{item.icon}</span>
                {isExpanded && <span className="t_nav_text">{item.name}</span>}
              </Link>
            ))}
          </div>

          <div className="nav-bottom">
            <div className="nav-bottom-divider" />
            <button className="t_nav_link" title={!isExpanded ? "Documentation" : ""} onClick={() => {}}>
              <span className="t_nav_icon"><IconDocs /></span>
              {isExpanded && <span className="t_nav_text">Documentation</span>}
            </button>
            <button className="t_nav_link" title={!isExpanded ? "Report / Improvement Idea" : ""} onClick={() => setFeedbackOpen(true)}>
              <span className="t_nav_icon"><IconReport /></span>
              {isExpanded && <span className="t_nav_text">Report / Improvement Idea</span>}
            </button>
          </div>
        </div>

        {!isMobileOpen && (
          <div onClick={toggleSidebar} className="t_al_sb_toggle" />
        )}
      </div>

      <FeedbackPanel
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userType="teacher"
        userId={staff?.staff_id || ""}
        userName={staff?.full_name || staff?.email || "Teacher"}
        userEmail={staff?.email}
        schoolId={school?.school_id || schoolId}
        schoolName={school?.school_name}
      />
    </>
  );
};

export default TeacherSidebar;
