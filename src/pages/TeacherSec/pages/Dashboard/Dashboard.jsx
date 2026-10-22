import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaBell,
  FaBook,
  FaCalendarAlt,
  FaEdit,
  FaGraduationCap,
  FaPlay,
  FaUser,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useSession } from "../../../../api_call/useSession";
import useNotification from "../../../../api_call/useNotification";
import useSchoolEvents from "../../../../api_call/useSchoolEvents";
import useTeacherAssignments from "../Assignments/useTeacherAssignments";
import "../../../AdminSec/AdminPages/Dashboard/Dashboard.css";
import "./Dashboard.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const todayStamp = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toMinutes = (value) => {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const initialsOf = (value) => {
  const parts = String(value || "?").trim().split(/\s+/).filter(Boolean);
  const text = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || "?").slice(0, 2);
  return text.toUpperCase();
};

const StatTile = ({ icon, label, value, onClick }) => (
  <div
    className="stat-card is-link"
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
  >
    <div className="stat-card-body">
      <span className="stat-card-icon">{icon}</span>
      <p className="stat-label">{label}</p>
      <h2 className="stat-number">{value}</h2>
      <div className="stat-card-line" />
    </div>
  </div>
);

const Dashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const staff = user?.staff;
  const staffId = staff?.staff_id;
  const { getActiveSession } = useSession();
  const { getUserNotifications } = useNotification();
  const { getEventsBySchool } = useSchoolEvents();

  const { teacherAssignment, subjects, headmasterAssignments, loading: assignmentsLoading } =
    useTeacherAssignments(staffId, schoolId);

  const [sessionLabel, setSessionLabel] = useState("");
  const [subsessionId, setSubsessionId] = useState("");
  const [nextLesson, setNextLesson] = useState(null);
  const [unmarkedClass, setUnmarkedClass] = useState(null);
  const [notices, setNotices] = useState([]);
  const [events, setEvents] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [extrasLoading, setExtrasLoading] = useState(true);

  const activeSubjects = subjects.filter((s) => s.is_active !== false);
  const activeClasses = headmasterAssignments.filter((hm) => hm.is_active !== false);
  const subjectCards = (activeSubjects.length ? activeSubjects : subjects).slice(0, 4);
  const classCards = (activeClasses.length ? activeClasses : headmasterAssignments).slice(0, 4);

  useEffect(() => {
    if (!schoolId || !staffId) return;
    let cancelled = false;

    (async () => {
      setExtrasLoading(true);
      const [sessionRes, notesRes, eventsRes] = await Promise.all([
        getActiveSession(schoolId),
        getUserNotifications(staffId),
        getEventsBySchool(schoolId),
      ]);
      if (cancelled) return;

      const session = sessionRes.success ? sessionRes.data?.session : null;
      const term = sessionRes.success ? sessionRes.data?.subsession : null;
      const termId = term?.term_id || "";
      setSubsessionId(termId);
      setSessionLabel(
        [session?.session_name, term?.term_name].filter(Boolean).join(" · ")
      );

      const noteRows = notesRes.success ? notesRes.data || [] : [];
      const sortedNotes = [...noteRows].sort((a, b) => {
        if (!!a.is_read !== !!b.is_read) return a.is_read ? 1 : -1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      setUnreadCount(noteRows.filter((note) => !note.is_read).length);
      setNotices(sortedNotes.slice(0, 4));

      const today = todayStamp();
      const sessionId = session?.session_id;
      const upcoming = (eventsRes.success ? eventsRes.data || [] : [])
        .filter((event) => {
          if (!sessionId || String(event.session_id || "") !== String(sessionId)) return false;
          if (termId && String(event.subsession_id || "") !== String(termId)) return false;
          if (event.status === "Cancelled" || event.status === "Completed") return false;
          const date = String(event.event_date || "").slice(0, 10);
          return date && date >= today;
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      setEventCount(upcoming.length);
      setEvents(upcoming.slice(0, 3));
      setExtrasLoading(false);
    })();

    return () => { cancelled = true; };
  }, [schoolId, staffId]);

  useEffect(() => {
    if (assignmentsLoading || !subsessionId) return;
    let cancelled = false;

    const classMap = new Map();
    subjects.forEach((s) => {
      if (s.class_id) classMap.set(s.class_id, s.class_name || "Class");
    });
    headmasterAssignments.forEach((hm) => {
      if (hm.class_id) classMap.set(hm.class_id, hm.class_name || "Class");
    });

    (async () => {
      const dayName = DAY_NAMES[new Date().getDay()];
      const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
      const bundles = await Promise.all(
        [...classMap.entries()].map(async ([classId, className]) => {
          try {
            const res = await fetch(`${API}/api/class-timetable/${classId}/subsession/${subsessionId}`);
            const json = await res.json();
            const entries = json.success ? json.data?.entries || [] : [];
            return entries
              .filter((entry) => entry.day === dayName && !entry.isBreak)
              .map((entry) => ({
                classId,
                className,
                subject: entry.name || entry.subjects?.[0]?.name || "Lesson",
                start: entry.start,
                end: entry.end,
                startMins: toMinutes(entry.start),
              }));
          } catch {
            return [];
          }
        })
      );
      if (cancelled) return;
      const lessons = bundles.flat().filter((item) => item.startMins != null);
      lessons.sort((a, b) => a.startMins - b.startMins);
      const current = lessons.find((item) => item.startMins <= nowMins && toMinutes(item.end) > nowMins);
      const upcoming = lessons.find((item) => item.startMins > nowMins);
      setNextLesson(current || upcoming || lessons[lessons.length - 1] || null);
    })();

    return () => { cancelled = true; };
  }, [assignmentsLoading, subsessionId, subjects, headmasterAssignments]);

  useEffect(() => {
    if (assignmentsLoading || !subsessionId) return;
    const classes = headmasterAssignments.filter((hm) => hm.is_active !== false && hm.class_id).slice(0, 3);
    if (!classes.length) {
      setUnmarkedClass(null);
      return;
    }
    let cancelled = false;
    const today = todayStamp();

    (async () => {
      for (const hm of classes) {
        try {
          const res = await fetch(`${API}/api/class-attendance/${hm.class_id}/subsession/${subsessionId}`);
          const json = await res.json();
          const students = json.success ? json.data?.students || [] : [];
          const marked = students.some((student) => student.attendance?.[today]);
          if (students.length && !marked) {
            if (!cancelled) setUnmarkedClass(hm);
            return;
          }
        } catch {
          /* skip this class */
        }
      }
      if (!cancelled) setUnmarkedClass(null);
    })();

    return () => { cancelled = true; };
  }, [assignmentsLoading, subsessionId, headmasterAssignments]);

  const openAttendance = (classId) => {
    const id = classId || unmarkedClass?.class_id || activeClasses[0]?.class_id || headmasterAssignments[0]?.class_id;
    if (!id) {
      navigate(`/teacher/${schoolId}/assignments/headmaster`);
      return;
    }
    navigate(`/teacher/${schoolId}/class/${id}/attendance`, {
      state: subsessionId ? { subseasion: subsessionId } : undefined,
    });
  };

  const role = staff?.position || staff?.department || (teacherAssignment ? "Teacher" : "Staff");
  const lessonLabel = (() => {
    if (!nextLesson) return "";
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const endMins = toMinutes(nextLesson.end);
    if (nextLesson.startMins <= nowMins && endMins > nowMins) return "Now";
    if (nextLesson.startMins > nowMins) return "Next";
    return "Last today";
  })();

  const openLesson = () => {
    if (!nextLesson) return;
    const match = subjects.find(
      (item) => item.class_id === nextLesson.classId && item.subject_name === nextLesson.subject
    );
    if (match?.subject_id && match?.assignment_id) {
      navigate(`/teacher/${schoolId}/subject/${match.subject_id}/${match.assignment_id}`);
      return;
    }
    navigate(`/teacher/${schoolId}/class/${nextLesson.classId}/timetable`, {
      state: subsessionId ? { subseasion: subsessionId } : undefined,
    });
  };

  const school = user?.school;
  const portrait =
    (typeof staff?.staff_photo === "string" && staff.staff_photo.trim()) ||
    (typeof school?.logo_url === "string" && school.logo_url.trim()) ||
    "";
  const subjectCount = activeSubjects.length || subjects.length;
  const classCount = activeClasses.length || headmasterAssignments.length;
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const actions = [
    { label: "Mark attendance", icon: <FaUserCheck />, onClick: () => openAttendance() },
    { label: "My subjects", icon: <FaBook />, onClick: () => navigate(`/teacher/${schoolId}/assignments/subjects`) },
    { label: "My classes", icon: <FaUsers />, onClick: () => navigate(`/teacher/${schoolId}/assignments/headmaster`) },
    { label: "Notifications", icon: <FaBell />, onClick: () => navigate(`/teacher/${schoolId}/notifications`) },
    { label: "Calendar", icon: <FaCalendarAlt />, onClick: () => navigate(`/teacher/${schoolId}/events`) },
    { label: "Profile", icon: <FaUser />, onClick: () => navigate(`/teacher/${schoolId}/profile`) },
  ];

  return (
    <div className="dashboard-container staff-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          {staff?.full_name || "Staff"} — your classes, timetable and notices.
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="school-info-card card">
          <div className="school-info-content">
            <span className="sic-box sic-box-1" />
            <span className="sic-box sic-box-2" />
            <span className="sic-box sic-box-3" />
            <span className="sic-box sic-box-4" />
            <div className="school-info-left">
              <p className="school-info-label">{role}</p>
              <h2 className="school-name">{staff?.full_name || "Staff"}</h2>
              <p className="school-tagline">{school?.school_name || "Your school"}</p>
              <div className="school-contact">
                {sessionLabel ? <span>{sessionLabel}</span> : <span>No active session</span>}
                {staff?.department ? <span className="dot">•</span> : null}
                {staff?.department ? <span>{staff.department}</span> : null}
              </div>
              <button
                type="button"
                className="edit-school-btn"
                onClick={() => navigate(`/teacher/${schoolId}/profile`)}
              >
                <FaEdit /> My profile
              </button>
            </div>
            <div className="school-logo-stack">
              <div className="logo-card logo-card-back" />
              <div className="logo-card logo-card-front">
                {portrait
                  ? <img src={portrait} alt="" className="logo-img" />
                  : <FaGraduationCap className="logo-placeholder-icon" />}
                <span className="logo-card-label">{(staff?.full_name || "Staff").split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-row">
          <StatTile
            icon={<FaBook />}
            label="My subjects"
            value={assignmentsLoading ? "—" : subjectCount}
            onClick={() => navigate(`/teacher/${schoolId}/assignments/subjects`)}
          />
          <StatTile
            icon={<FaUsers />}
            label="Classes I head"
            value={assignmentsLoading ? "—" : classCount}
            onClick={() => navigate(`/teacher/${schoolId}/assignments/headmaster`)}
          />
          <StatTile
            icon={<FaBell />}
            label="Unread notices"
            value={extrasLoading ? "—" : unreadCount}
            onClick={() => navigate(`/teacher/${schoolId}/notifications`)}
          />
          <StatTile
            icon={<FaCalendarAlt />}
            label="Upcoming events"
            value={extrasLoading ? "—" : eventCount}
            onClick={() => navigate(`/teacher/${schoolId}/events`)}
          />
        </div>

        <div
          className={`session-status-card card${nextLesson ? " is-clickable" : ""}`}
          onClick={openLesson}
          role={nextLesson ? "button" : undefined}
          tabIndex={nextLesson ? 0 : undefined}
          onKeyDown={(event) => {
            if (!nextLesson) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openLesson();
            }
          }}
        >
          <div className="card-content">
            {!nextLesson ? (
              <div className="session-empty">
                <FaCalendarAlt size={36} color="#d1d5db" />
                <p className="session-empty-title">No class today</p>
                <p className="session-empty-sub">When a timetable is set, the next lesson shows here.</p>
              </div>
            ) : (
              <div className="session-inner">
                <div className="session-header">
                  <div className="session-header-left">
                    <span className="session-eyebrow"><FaCalendarAlt /> {lessonLabel || "Today"}</span>
                    <h3 className="session-name">{nextLesson.subject}</h3>
                    <span className="session-term">{nextLesson.className}</span>
                  </div>
                  <div className="session-status active">
                    <FaPlay className="status-icon" />
                    {lessonLabel || "Today"}
                  </div>
                </div>
                <div className="session-divider" />
                <div className="term-progress">
                  <div className="progress-info">
                    <span>
                      {nextLesson.start || "Time not set"}
                      {nextLesson.end ? ` – ${nextLesson.end}` : ""}
                    </span>
                    <span className="progress-pct">{sessionLabel || "This term"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className="attendance-card card is-clickable"
          onClick={() => openAttendance(unmarkedClass?.class_id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openAttendance(unmarkedClass?.class_id);
            }
          }}
        >
          <div className="card-content">
            <div className="attendance-inner">
              <div className="attendance-header">
                <div className="attendance-header-left">
                  <span className="attendance-eyebrow"><FaUserCheck /> Today's attendance</span>
                  <p className="attendance-date">{todayLabel}</p>
                </div>
              </div>
              <div className="attendance-empty">
                <FaUserCheck size={32} color="#d1d5db" />
                <p className="attendance-empty-title">
                  {unmarkedClass ? `${unmarkedClass.class_name} still open` : "Attendance is up to date"}
                </p>
                <p className="attendance-empty-sub">
                  {unmarkedClass
                    ? "Mark today's register."
                    : "Headed classes have a mark for today, or you do not head a class."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-actions-card card">
          <div className="card-content">
            <h3 className="card-title">Quick actions</h3>
            <div className="actions-grid">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="action-button"
                  style={{ "--action-color": "#111111" }}
                  onClick={action.onClick}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaBook /> My subjects</span>
          </div>
          <div className="activities-card-body">
            {subjectCards.length === 0 ? (
              <div className="activities-empty">No subject assigned yet.</div>
            ) : (
              <div className="activities-list">
                {subjectCards.map((item, index) => (
                  <Fragment key={item.assignment_id || item.subject_id}>
                    <button
                      type="button"
                      className="activity-row"
                      onClick={() => navigate(`/teacher/${schoolId}/subject/${item.subject_id}/${item.assignment_id}`)}
                    >
                      <div className="activity-avatar-initials">{initialsOf(item.subject_name)}</div>
                      <div className="activity-content">
                        <p className="activity-name">{item.subject_name}</p>
                        <p className="activity-desc">{item.class_name || "Class"}</p>
                      </div>
                      <span className="activity-badge">{item.class_name || "Class"}</span>
                    </button>
                    {index < subjectCards.length - 1 ? <div className="activity-divider-line" /> : null}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaUsers /> Classes I head</span>
          </div>
          <div className="activities-card-body">
            {classCards.length === 0 ? (
              <div className="activities-empty">No class head assignment yet.</div>
            ) : (
              <div className="activities-list">
                {classCards.map((item, index) => (
                  <Fragment key={item.assignment_id || item.class_id}>
                    <button
                      type="button"
                      className="activity-row"
                      onClick={() => navigate(`/teacher/${schoolId}/class/${item.class_id}`)}
                    >
                      <div className="activity-avatar-initials">{initialsOf(item.class_name)}</div>
                      <div className="activity-content">
                        <p className="activity-name">{item.class_name}</p>
                        <p className="activity-desc">{item.session_name || "Class"}</p>
                      </div>
                      <span className="activity-badge">Class</span>
                    </button>
                    {index < classCards.length - 1 ? <div className="activity-divider-line" /> : null}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaBell /> Notifications</span>
          </div>
          <div className="activities-card-body">
            {extrasLoading ? (
              <div className="activities-empty">Loading…</div>
            ) : notices.length === 0 ? (
              <div className="activities-empty">No notifications yet.</div>
            ) : (
              <div className="activities-list">
                {notices.map((note, index) => (
                  <Fragment key={note.user_notification_id || note.notification_id}>
                    <button
                      type="button"
                      className={`activity-row${note.is_read ? "" : " is-unread"}`}
                      onClick={() => navigate(`/teacher/${schoolId}/notifications`)}
                    >
                      <div className="activity-avatar-initials">{initialsOf(note.title || "Notification")}</div>
                      <div className="activity-content">
                        <p className="activity-name">{note.title || "Notification"}</p>
                        <p className="activity-desc">{note.is_read ? "Read" : "Unread"}</p>
                      </div>
                      <span className="activity-badge">{note.is_read ? "Read" : "Unread"}</span>
                    </button>
                    {index < notices.length - 1 ? <div className="activity-divider-line" /> : null}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaCalendarAlt /> Coming up</span>
          </div>
          <div className="activities-card-body">
            {extrasLoading ? (
              <div className="activities-empty">Loading…</div>
            ) : events.length === 0 ? (
              <div className="activities-empty">No upcoming events this term.</div>
            ) : (
              <div className="activities-list">
                {events.map((event, index) => (
                  <Fragment key={event.event_id || event.title}>
                    <button
                      type="button"
                      className="activity-row"
                      onClick={() => navigate(`/teacher/${schoolId}/events`)}
                    >
                      <div className="activity-avatar-initials">{initialsOf(event.title || "Event")}</div>
                      <div className="activity-content">
                        <p className="activity-name">{event.title || "Event"}</p>
                        <p className="activity-desc">{String(event.event_date || "").slice(0, 10) || event.status || "Event"}</p>
                      </div>
                      <span className="activity-badge">{String(event.event_date || "").slice(5, 10) || "Event"}</span>
                    </button>
                    {index < events.length - 1 ? <div className="activity-divider-line" /> : null}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
