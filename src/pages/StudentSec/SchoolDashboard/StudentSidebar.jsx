import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import useStudentBills from "../../../api_call/useStudentBills";
import FeedbackPanel from "../../../components/FeedbackPanel/FeedbackPanel";
import "../../TeacherSec/TeacherSec.css";

const IconSession = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 8h6M8 12h4" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconSchool = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 10l8-7 8 7v9a1 1 0 01-1 1H4a1 1 0 01-1-1V10z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6"/>
    <rect x="8" y="13" width="6" height="6" rx="1" fill="#111111" opacity="0.5"/>
  </svg>
);

const IconBill = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="4" width="16" height="14" rx="2" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6"/>
    <path d="M7 9h8M7 13h5" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <circle cx="15" cy="13" r="2" fill="#111111" opacity="0.4"/>
  </svg>
);

const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="8" r="4" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6"/>
    <path d="M3 19c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.5"/>
  </svg>
);

const IconNotification = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 3a6 6 0 016 6v3l1.5 2.5H3.5L5 12V9a6 6 0 016-6z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.6"/>
    <path d="M9 17a2 2 0 004 0" stroke="#111111" strokeWidth="1.6" strokeLinecap="round"/>
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
  { id: "session",      name: "Session",       icon: <IconSession /> },
  { id: "school",       name: "School",        icon: <IconSchool /> },
  { id: "bill",         name: "Bills",         icon: <IconBill /> },
  { id: "alumni",       name: "Profile",       icon: <IconProfile /> },
  { id: "notification", name: "Notifications", icon: <IconNotification /> },
];

const StudentSidebar = ({ isMobileOpen, onClose }) => {
  const { studentId, schoolId } = useParams();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { user } = useAuth();

  const student = user?.student || {};
  const school  = user?.school  || {};

  const { bills } = useStudentBills(student?.student_id);
  const unpaidCount = useMemo(
    () => bills.filter((b) => b.payment_status === "unpaid" || b.payment_status === "partial").length,
    [bills]
  );

  const base = `/student/${studentId}/school/${schoolId}`;
  const isActive = (id) => location.pathname.startsWith(`${base}/${id}`);

  const toggleSidebar = (e) => { e?.stopPropagation(); setExpanded((p) => !p); };

  useEffect(() => { if (isMobileOpen) setExpanded(true); }, [isMobileOpen]);

  const handleMouseEnter = () => { if (!isMobileOpen && !expanded) setHoverExpanded(true); };
  const handleMouseLeave = () => { if (!isMobileOpen && !expanded) setHoverExpanded(false); };

  const isExpanded = expanded || hoverExpanded;

  return (
    <>
      {isMobileOpen && <div className="t_al_overlay" onClick={onClose} />}

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
                to={`${base}/${item.id}`}
                className={`t_nav_link ${isActive(item.id) ? "active" : ""}`}
                title={!isExpanded ? item.name : ""}
                onClick={() => isMobileOpen && onClose()}
              >
                <span className="t_nav_icon">{item.icon}</span>
                {isExpanded && <span className="t_nav_text">{item.name}</span>}
                {item.id === "bill" && unpaidCount > 0 && (
                  <span className="t_nav_bill_badge">{unpaidCount > 99 ? "99+" : unpaidCount}</span>
                )}
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

        {!isMobileOpen && <div onClick={toggleSidebar} className="t_al_sb_toggle" />}
      </div>

      <FeedbackPanel
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userType="student"
        userId={student?.student_id || ""}
        userName={student?.full_name || student?.email || "Student"}
        userEmail={student?.email}
        schoolId={school?.school_id || schoolId}
        schoolName={school?.school_name}
      />
    </>
  );
};

export default StudentSidebar;
