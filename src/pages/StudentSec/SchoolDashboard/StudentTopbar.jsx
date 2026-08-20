import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useTheme } from "../../../context/ThemeContext/ThemeContext";
import { useSession } from "../../../api_call/useSession";
import { useFetchStudents } from "../../../api_call";
import useNotification from "../../../api_call/useNotification";
import "../../TeacherSec/StaffTopbar.css";
import "./StudentTopbar.css";

const StudentTopbar = ({ onMenuClick, isMobileMenuOpen }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { studentId, schoolId } = useParams();
  const { theme, setTheme } = useTheme();
  const { getActiveSession, getSessionsBySchool } = useSession();
  const { getAdmissionsByStudentId } = useFetchStudents();

  const { getUserUnreadCount } = useNotification();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [admissions, setAdmissions]       = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [bellShake,   setBellShake]       = useState(false);
  const profileRef = useRef(null);

  const student = user?.student;
  const school  = user?.school;

  const initials = student?.full_name
    ? student.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  const currentAdmission  = admissions.find((a) => a.school_id === schoolId);
  const currentSchoolName = currentAdmission?.school_name || school?.school_name || "School";
  const isGraduated = !!currentAdmission?.is_graduated;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!schoolId) return;
    getActiveSession(schoolId).then((res) => {
      if (res.success && res.data?.session) {
        setActiveSession(res.data);
      } else {
        // Fallback: pick the session explicitly marked "active" by status
        getSessionsBySchool(schoolId).then((r) => {
          if (r.success && r.data?.length) {
            const activeByStatus = r.data.find((s) => s.session_status === "active" && !s.is_archived);
            if (activeByStatus) setActiveSession({ session: activeByStatus, subsession: null });
          }
        });
      }
    });
  }, [schoolId]);

  useEffect(() => {
    if (!student?.student_id) return;
    getAdmissionsByStudentId(student.student_id).then((res) => {
      if (res.success) setAdmissions(res.data || []);
    });
  }, [student?.student_id]);

  // Poll unread notification count every 60 s
  useEffect(() => {
    if (!student?.student_id) return;
    const poll = async () => {
      const res = await getUserUnreadCount(student.student_id);
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
  }, [student?.student_id]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="sft_topbar">
      {/* Left — brand + menu */}
      <div className="sft_left">
        <button className="sft_menu_btn" onClick={(e) => { e.stopPropagation(); onMenuClick(); }}>
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
        <div className="sft_brand" onClick={() => navigate(`/student/${studentId}`)} style={{ cursor: "pointer" }}>
          <div className="sft_brand_icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white"/>
              <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
              <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.35"/>
            </svg>
          </div>
          <span className="sft_brand_text">Scladapp</span>
        </div>

        {/* Divider */}
        <div className="sft_brand_divider" />

        {/* School identity */}
        <div className="sft_school_brand">
          {(currentAdmission?.school_logo && typeof currentAdmission.school_logo === "string") ? (
            <img src={currentAdmission.school_logo} alt={currentSchoolName} className="sft_school_logo" />
          ) : (typeof school?.logo_url === "string" && school.logo_url) ? (
            <img src={school.logo_url} alt={currentSchoolName} className="sft_school_logo" />
          ) : (
            <div className="sft_school_logo_fallback">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M3 9l7-6 7 6v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5"/>
                <rect x="7" y="12" width="6" height="6" rx="1" fill="#111111" opacity="0.4"/>
              </svg>
            </div>
          )}
          <span className="sft_school_name">{currentSchoolName}</span>
        </div>
      </div>

      {/* Center — active session */}
      <div className="sft_center">
        {activeSession?.session ? (
          <div className="sft_session_pill">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="2.5" width="11" height="9.5" rx="1.5" stroke="#10b981" strokeWidth="1.3"/>
              <path d="M4 1v3M9 1v3" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M1 6h11" stroke="#10b981" strokeWidth="1.1" opacity="0.5"/>
            </svg>
            <span className="sft_session_name">{activeSession.session.session_name}</span>
            {activeSession.subsession && (
              <>
                <span className="sft_session_sep">·</span>
                <span className="sft_subsession_name">{activeSession.subsession.term_name}</span>
                <span className="sft_active_dot" title="Active"/>
              </>
            )}
          </div>
        ) : (
          <span className="sft_no_session">No active session</span>
        )}
      </div>

      {/* Right */}
      <div className="sft_right">
        {/* Notifications */}
        <button
          className={`sft_icon_btn sft_bell_btn${bellShake ? " sft_bell_shake" : ""}`}
          onClick={() => navigate(`/student/${studentId}/school/${schoolId}/notification`)}
          title="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2a5.5 5.5 0 00-5.5 5.5c0 2.2-.6 3.5-1.2 4.3-.3.4-.1 1 .4 1h12.6c.5 0 .7-.6.4-1-.6-.8-1.2-2.1-1.2-4.3A5.5 5.5 0 009 2z"
              stroke="#111111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
            <path d="M7 14.5a2 2 0 004 0" stroke="#111111" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
          </svg>
          {unreadCount > 0 && (
            <span className="sft_bell_badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        {/* Theme toggle */}
        <button
          className="sft_icon_btn"
          onClick={() => {
            const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
            setTheme(next);
          }}
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : theme === "system" ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="3" width="14" height="9" rx="1.5" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.5"/>
              <path d="M6 15h6M9 12v3" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3.5" fill="#111111" opacity="0.2" stroke="#111111" strokeWidth="1.5"/>
              <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
                stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
            </svg>
          )}
        </button>

        {/* Profile */}
        <div className="sft_profile_wrapper" ref={profileRef}>
          <button className="sft_avatar_btn" onClick={() => setIsProfileOpen((p) => !p)} title={student?.full_name}>
            <span className="sft_avatar_initials">{initials}</span>
          </button>

          {isProfileOpen && (
            <div className="sft_dropdown">
              {/* Header */}
              <div className="sft_pd_header">
                <div className="sft_pd_avatar_large">{initials}</div>
                <div className="sft_pd_header_info">
                  <p className="sft_pd_name">{student?.full_name || "Student"}</p>
                  <p className="sft_pd_email">{student?.email || "—"}</p>
                  <span className="sft_pd_badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {student?.admission_number || "Student"}
                  </span>
                </div>
              </div>

              <div className="sft_pd_divider"/>

              {/* Current school */}
              <div className="sft_pd_section">
                <div className="sft_pd_section_label">Current School</div>
                <div className="sft_pd_row">
                  {(currentAdmission?.school_logo && typeof currentAdmission.school_logo === "string") ? (
                    <img src={currentAdmission.school_logo} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                  ) : (typeof school?.logo_url === "string" && school.logo_url) ? (
                    <img src={school.logo_url} alt="" style={{ width: 18, height: 18, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="5" width="12" height="8" rx="1" stroke="#6b7280" strokeWidth="1.2"/>
                    <path d="M4 13V9h2v4M8 13V9h2v4" stroke="#6b7280" strokeWidth="1.1" strokeLinecap="round"/>
                    <path d="M1 5L7 1l6 4" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  )}
                  <span className="sft_pd_school_name">{currentSchoolName}</span>
                </div>
              </div>

              {/* Switch school */}
              {admissions.length > 1 && (
                <>
                  <div className="sft_pd_divider"/>
                  <div className="sft_pd_section">
                    <div className="sft_pd_section_label">Switch School</div>
                    {admissions.map((a) => {
                      const sid = a.school_id;
                      const isCurrent = sid === schoolId;
                      return (
                        <button
                          key={a.admission_id}
                          className={`st_switch_btn ${isCurrent ? "active" : ""}`}
                          onClick={() => { setIsProfileOpen(false); navigate(`/student/${studentId}/school/${sid}`); }}
                        >
                          {(a.school_logo && typeof a.school_logo === "string") ? (
                            <img src={a.school_logo} alt="" style={{ width: 20, height: 20, borderRadius: 5, objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                            <rect x="1" y="5" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <path d="M1 5L7 1l6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          )}
                          <div className="st_switch_info">
                            <span className="st_switch_name">{a.school_name || "School"}</span>
                            <span className="st_switch_class">{a.admission_class_name || "—"}</span>
                          </div>
                          {isCurrent && <span className="st_switch_dot"/>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Active session */}
              {!isGraduated && activeSession?.session && (
                <>
                  <div className="sft_pd_divider"/>
                  <div className="sft_pd_section">
                    <div className="sft_pd_section_label">Current Session</div>
                    <div className="sft_pd_row">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="2.5" width="11" height="9.5" rx="1.5" stroke="#10b981" strokeWidth="1.3"/>
                        <path d="M4 1v3M9 1v3" stroke="#10b981" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M1 6h11" stroke="#10b981" strokeWidth="1.1" opacity="0.5"/>
                      </svg>
                      <span className="sft_pd_school_name">{activeSession.session.session_name}</span>
                    </div>
                    {activeSession.subsession && (
                      <p className="sft_pd_meta">{activeSession.subsession.term_name}</p>
                    )}
                  </div>
                </>
              )}

              <div className="sft_pd_divider"/>

              {/* Sign out */}
              <div className="sft_pd_actions">
                <button className="sft_pd_action_btn danger" onClick={() => { setIsProfileOpen(false); handleLogout(); }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M9 10l3-3-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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

export default StudentTopbar;
