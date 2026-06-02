import React, { useState, useEffect } from "react";
import "./APTtab.css";
import Button from "../../../../components/Button/Button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Icons } from "../../../../utils/icons";
import { useSessionWithSubsessions } from "../../../../api_call/useSessionWithSubsessions";
import { useSubsession } from "../../../../api_call";
import AddSubsessionPanel from "../../AdminPages/SeasionOverview/AddSubsessionPanel";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";

/* ── Inline SVG icons (matching main sidebar style) ─────────────────── */
const IcoSearch = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <circle cx="9.5" cy="9.5" r="6" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IcoPlus = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IcoFolder = () => (
  <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
    <path d="M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V6z"
      fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const IcoChevron = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <path d="M6 9l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoOverview = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="2" width="8" height="8" rx="1.5" fill="currentColor"/>
    <rect x="12" y="2" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.35"/>
    <rect x="2" y="12" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.35"/>
    <rect x="12" y="12" width="8" height="8" rx="1.5" fill="currentColor"/>
  </svg>
);

const IcoAdmissions = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="14" height="15" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M6 8h6M6 11h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M14 13l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M18 9v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoStudents = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <circle cx="8" cy="7" r="3.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M15 9l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoGraduation = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <path d="M11 3l8 4-8 4-8-4 8-4z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    <path d="M17 11v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14.5 15.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const IcoEvents = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <circle cx="7" cy="14" r="1.2" fill="currentColor"/>
    <circle cx="11" cy="14" r="1.2" fill="currentColor" opacity="0.4"/>
    <circle cx="15" cy="14" r="1.2" fill="currentColor"/>
  </svg>
);

const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <rect x="6" y="12" width="4" height="4" rx="1" fill="currentColor"/>
  </svg>
);

const IcoReport = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z"
      fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M13 2v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M7 13h2v3H7zM10 11h2v5h-2zM13 15h2v1h-2z" fill="currentColor"/>
  </svg>
);

const IcoTimetable = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="2" width="18" height="18" rx="2" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M2 8h18M8 2v18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <rect x="10" y="10" width="4" height="4" rx="0.8" fill="currentColor"/>
    <rect x="15" y="10" width="4" height="4" rx="0.8" fill="currentColor" opacity="0.35"/>
  </svg>
);

const statusDot = (status) => {
  const colors = { active: "#22c55e", completed: "#3b82f6", draft: "#f59e0b", archived: "#6b7280" };
  return (
    <span className="apt-status-dot" style={{ background: colors[status] || "#6b7280" }} title={status} />
  );
};

const calcStatus = (startDate, endDate) => {
  if (!startDate || !endDate) return "draft";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (today < start) return "draft";
  if (today > end)   return "completed";
  return "active";
};

const APTtab = ({}) => {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddSubsessionPanel, setShowAddSubsessionPanel] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [addFormData, setAddFormData] = useState({
    name: "", code: "", startDate: "", endDate: "",
    gradingTemplateId: null, gradingTemplateName: null,
    reportCardTemplateId: null, reportCardTemplateName: null,
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  const { schoolId, seasionId, subseasionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { getSessionsWithSubsessions, loading, error } = useSessionWithSubsessions();
  const { createSubsession } = useSubsession();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.academic_sessions?.create;

  const handleCreateSession = () => {
    if (!canCreate) { addNotification("You do not have permission to perform this action.", "error"); return; }
    navigate(`/admin/${schoolId}/acedemic_seasion/create-session`);
  };

  const handleCreateSubsession = (session) => {
    if (!canCreate) { addNotification("You do not have permission to perform this action.", "error"); return; }
    handleOpenAddSubsession(session);
  };

  const sessionTabItems = [
    { label: "Overview",               link: "",           icon: IcoOverview },
    { label: "Admissions",             link: "/admissions",icon: IcoAdmissions },
    { label: "Students & Promotions",  link: "/sp",        icon: IcoStudents },
    { label: "Graduation",             link: "/graduation",icon: IcoGraduation },
  ];

  const subSessionItems = [
    { name: "School Events",    link: "/ss_events",         icon: IcoEvents },
    { name: "School Calendar",  link: "/ss_calendar",       icon: IcoCalendar },
    { name: "Student Report",   link: "/ss_student_report", icon: IcoReport },
    { name: "Timetable",        link: "/ss_timetable",      icon: IcoTimetable },
  ];

  useEffect(() => { if (schoolId) fetchSessionsData(); }, [schoolId]);

  const fetchSessionsData = async () => {
    const result = await getSessionsWithSubsessions(schoolId);
    if (result.success) {
      const activeSessions = (result.data || [])
        .filter(s => !s.is_archived)
        .sort((a, b) => new Date(b.academic_year_start_date) - new Date(a.academic_year_start_date));
      setSessions(activeSessions);
    }
  };

  const toggleSession = (sessionId) => navigate(`/admin/${schoolId}/acedemic_seasion/sd/${sessionId}`);
  const toggleSub = (sessionId, termId) => navigate(`/admin/${schoolId}/acedemic_seasion/ssd/${sessionId}/ss_events/${termId}`);

  const handleOpenAddSubsession = (session) => {
    setSelectedSession(session);
    setAddFormData({ name: "", code: "", startDate: "", endDate: "", gradingTemplateId: null, gradingTemplateName: null, reportCardTemplateId: null, reportCardTemplateName: null });
    setAddFormErrors({});
    setShowAddSubsessionPanel(true);
  };

  const handleAddInputChange = (field, value) => {
    setAddFormData(prev => ({ ...prev, [field]: value }));
    validateAddSubsession(field, value);
  };

  const validateAddSubsession = (field, value) => {
    if (!selectedSession) return;
    const updatedData = { ...addFormData, [field]: value };
    const errors = {};
    if (updatedData.startDate && selectedSession.academic_year_start_date) {
      if (new Date(updatedData.startDate) < new Date(selectedSession.academic_year_start_date))
        errors.startDate = "Subsession start date must be within session dates";
    }
    if (updatedData.endDate && selectedSession.academic_year_end_date) {
      if (new Date(updatedData.endDate) > new Date(selectedSession.academic_year_end_date))
        errors.endDate = "Subsession end date must be within session dates";
    }
    if (updatedData.startDate && updatedData.endDate && new Date(updatedData.startDate) >= new Date(updatedData.endDate))
      errors.startDate = "Start date must be before end date";
    selectedSession.subsessions?.filter(s => !s.is_archived).forEach(otherSub => {
      if (!otherSub.term_start_date || !otherSub.term_end_date || !updatedData.startDate || !updatedData.endDate) return;
      const overlaps = new Date(updatedData.startDate) < new Date(otherSub.term_end_date) &&
                       new Date(updatedData.endDate) > new Date(otherSub.term_start_date);
      if (overlaps) errors.overlap = `Dates overlap with ${otherSub.term_name}`;
    });
    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAdd = async () => {
    if (!selectedSession) return;
    if (!addFormData.name || !addFormData.code || !addFormData.startDate || !addFormData.endDate) {
      addNotification("All fields are required", "error"); return;
    }
    if (!addFormData.gradingTemplateId || !addFormData.reportCardTemplateId) {
      addNotification("All templates are required", "error"); return;
    }
    if (!validateAddSubsession("endDate", addFormData.endDate)) return;
    const result = await createSubsession({
      school_id: schoolId, session_id: selectedSession.session_id,
      term_name: addFormData.name, term_code: addFormData.code,
      term_start_date: addFormData.startDate, term_end_date: addFormData.endDate,
      term_status: "draft",
      grading_template_id: addFormData.gradingTemplateId, grading_template_name: addFormData.gradingTemplateName,
      report_card_template_id: addFormData.reportCardTemplateId, report_card_template_name: addFormData.reportCardTemplateName,
      created_by: user?.admin?.admin_id || user?.user_id,
      created_by_name: user?.admin?.username || user?.admin?.full_name || null,
      created_by_role: "admin",
    });
    if (result.success) {
      setShowAddSubsessionPanel(false);
      setAddFormData({ name: "", code: "", startDate: "", endDate: "", gradingTemplateId: null, gradingTemplateName: null, reportCardTemplateId: null, reportCardTemplateName: null });
      setAddFormErrors({});
      addNotification("Subsession created successfully!", "success");
      fetchSessionsData();
    } else {
      addNotification(`Failed to create subsession: ${result.message}`, "error");
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return session.session_name?.toLowerCase().includes(q) ||
           session.session_code?.toLowerCase().includes(q) ||
           session.subsessions?.some(s => s.term_name?.toLowerCase().includes(q) || s.term_code?.toLowerCase().includes(q));
  });

  return (
    <div className="apt-root">
      {/* ── Top bar: search + create ── */}
      {!loading && sessions.length > 0 && (
        <div className="apt-topbar">
          <div className="apt-search-wrap">
            <span className="apt-search-ico"><IcoSearch /></span>
            <input
              className="apt-search-input"
              type="text"
              placeholder="Search sessions…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="apt-search-clear" onClick={() => setSearchQuery("")}>×</button>
            )}
          </div>
          <button className="apt-create-btn" onClick={handleCreateSession} title="Create New Session">
            <IcoPlus />
          </button>
        </div>
      )}

      {/* ── Empty: no sessions yet ── */}
      {!loading && sessions.length === 0 && (
        <div className="apt-empty-create">
          <button className="apt-create-full-btn" onClick={handleCreateSession}>
            <IcoPlus /> Create New Session
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="apt-state-box">
          <span className="apt-spinner" />
          <p>Loading sessions…</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="apt-state-box apt-state-error">
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M11 7v5M11 15v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p>{error}</p>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
        <div className="apt-state-box">
          <IcoSearch />
          <p>No sessions match your search</p>
        </div>
      )}

      {/* ── Session list ── */}
      {!loading && !error && filteredSessions.map(item => {
        const isSessionActive = location.pathname.includes(`/sd/${item.session_id}`) ||
                                location.pathname.includes(`/ssd/${item.session_id}`);
        return (
          <React.Fragment key={item.session_id}>
            <div className={`apt-session${isSessionActive ? " apt-session--open" : ""}`}>

              {/* Session row */}
              <div className="apt-session-row" onClick={() => toggleSession(item.session_id)}>
                {isSessionActive && <span className="apt-active-bar" />}
                <span className="apt-session-ico"><IcoFolder /></span>
                <span className="apt-session-name">{item.session_name}</span>
                {statusDot(calcStatus(item.academic_year_start_date, item.academic_year_end_date))}
              </div>

              {/* Session body */}
              <div className={`apt-session-body${isSessionActive ? " apt-open" : ""}`}>

                {/* Session-level tabs */}
                {sessionTabItems.map((t, i) => {
                  const isActive = location.pathname === `/admin/${schoolId}/acedemic_seasion/sd/${item.session_id}${t.link}`;
                  return (
                    <div key={i}
                      className={`apt-nav-item${isActive ? " apt-nav-item--active" : ""}`}
                      onClick={() => navigate(`/admin/${schoolId}/acedemic_seasion/sd/${item.session_id}${t.link}`)}
                    >
                      <span className="apt-nav-ico"><t.icon /></span>
                      <span className="apt-nav-label">{t.label}</span>
                    </div>
                  );
                })}

                {/* Subsessions */}
                {item.subsessions &&
                  item.subsessions
                    .filter(s => !s.is_archived)
                    .sort((a, b) => new Date(a.term_start_date) - new Date(b.term_start_date))
                    .map(sub => {
                      const isSubActive = location.pathname.includes(`/${sub.term_id}`);
                      return (
                        <React.Fragment key={sub.term_id}>
                          <div className={`apt-sub${isSubActive ? " apt-sub--open" : ""}`}>

                            {/* Subsession header */}
                            <div className="apt-sub-row" onClick={() => toggleSub(item.session_id, sub.term_id)}>
                              <span className={`apt-sub-chevron${isSubActive ? " apt-sub-chevron--open" : ""}`}>
                                <IcoChevron />
                              </span>
                              <span className="apt-sub-name">{sub.term_name}</span>
                              {statusDot(calcStatus(sub.term_start_date, sub.term_end_date))}
                            </div>

                            {/* Subsession nav items */}
                            <div className={`apt-sub-body${isSubActive ? " apt-open" : ""}`}>
                              {subSessionItems.map((t, i) => {
                                const isActive = location.pathname === `/admin/${schoolId}/acedemic_seasion/ssd/${item.session_id}${t.link}/${sub.term_id}`;
                                return (
                                  <div key={i}
                                    className={`apt-nav-item apt-nav-item--sub${isActive ? " apt-nav-item--active" : ""}`}
                                    onClick={() => navigate(`/admin/${schoolId}/acedemic_seasion/ssd/${item.session_id}${t.link}/${sub.term_id}`)}
                                  >
                                    <span className="apt-nav-ico"><t.icon /></span>
                                    <span className="apt-nav-label">{t.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                }

                {/* Add subsession */}
                {item.session_status === "active" && (
                  <div className="apt-add-sub-btn">
                    <Button variant="secondary" onClick={() => handleCreateSubsession(item)}>
                      + Add Subsession
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <AddSubsessionPanel
        isOpen={showAddSubsessionPanel}
        onClose={() => setShowAddSubsessionPanel(false)}
        formData={addFormData}
        formErrors={addFormErrors}
        onInputChange={handleAddInputChange}
        onSave={handleSaveAdd}
        sessionName={selectedSession?.session_name}
        schoolId={schoolId}
      />
    </div>
  );
};

export default APTtab;
