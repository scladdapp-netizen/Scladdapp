import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaBell,
  FaBook,
  FaCalendarAlt,
  FaEdit,
  FaGraduationCap,
  FaKey,
  FaMoneyBillWave,
  FaPlay,
  FaUser,
  FaUserCheck,
} from "react-icons/fa";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useSession } from "../../../../../api_call/useSession";
import useNotification from "../../../../../api_call/useNotification";
import useSchoolEvents from "../../../../../api_call/useSchoolEvents";
import useStudentBills from "../../../../../api_call/useStudentBills";
import useStudentClassAssignment from "../../../../../api_call/useStudentClassAssignment";
import { examResults } from "../../../../../api_call/useCbt";
import "../../../../AdminSec/AdminPages/Dashboard/Dashboard.css";
import "./Dashboard.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MARK_LABEL = { present: "Present", absent: "Absent", excused: "Excused" };

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

const money = (amount) => {
  const number = Number(amount);
  if (!Number.isFinite(number)) return "";
  return `₦${number.toLocaleString()}`;
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
  const { studentId, schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const student = user?.student;
  const sid = student?.student_id || studentId;
  const { getActiveSession } = useSession();
  const { getUserNotifications } = useNotification();
  const { getEventsBySchool } = useSchoolEvents();

  const [sessionId, setSessionId] = useState("");
  const [subsessionId, setSubsessionId] = useState("");
  const [sessionLabel, setSessionLabel] = useState("");
  const [notices, setNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [events, setEvents] = useState([]);
  const [eventCount, setEventCount] = useState(0);
  const [results, setResults] = useState([]);
  const [resultCount, setResultCount] = useState(0);
  const [extrasLoading, setExtrasLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState(null);
  const [todayMark, setTodayMark] = useState("");

  const { assignment, loading: classLoading } = useStudentClassAssignment(sid, sessionId);
  const { bills, loading: billsLoading } = useStudentBills(sid);

  const base = `/student/${studentId}/school/${schoolId}`;
  const termPath = (page) => (
    subsessionId ? `${base}/session/${subsessionId}/${page}` : `${base}/session`
  );

  useEffect(() => {
    if (!schoolId || !sid) return;
    let cancelled = false;

    (async () => {
      setExtrasLoading(true);
      const [sessionRes, notesRes, eventsRes] = await Promise.all([
        getActiveSession(schoolId),
        getUserNotifications(sid),
        getEventsBySchool(schoolId),
      ]);
      if (cancelled) return;

      const session = sessionRes.success ? sessionRes.data?.session : null;
      const term = sessionRes.success ? sessionRes.data?.subsession : null;
      const termId = term?.term_id || "";
      setSessionId(session?.session_id || "");
      setSubsessionId(termId);
      setSessionLabel([session?.session_name, term?.term_name].filter(Boolean).join(" · "));

      const noteRows = notesRes.success ? notesRes.data || [] : [];
      const sortedNotes = [...noteRows].sort((a, b) => {
        if (!!a.is_read !== !!b.is_read) return a.is_read ? 1 : -1;
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
      setUnreadCount(noteRows.filter((note) => !note.is_read).length);
      setNotices(sortedNotes.slice(0, 4));

      const today = todayStamp();
      const activeSessionId = session?.session_id;
      const upcoming = (eventsRes.success ? eventsRes.data || [] : [])
        .filter((event) => {
          if (!activeSessionId || String(event.session_id || "") !== String(activeSessionId)) return false;
          if (termId && String(event.subsession_id || "") !== String(termId)) return false;
          if (event.status === "Cancelled" || event.status === "Completed") return false;
          const date = String(event.event_date || "").slice(0, 10);
          return date && date >= today;
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
      setEventCount(upcoming.length);
      setEvents(upcoming.slice(0, 3));

      if (termId) {
        const resultRes = await examResults(termId);
        const rows = resultRes.success ? resultRes.data || [] : [];
        if (!cancelled) {
          setResultCount(rows.length);
          setResults(rows.slice(0, 3));
        }
      } else if (!cancelled) {
        setResultCount(0);
        setResults([]);
      }
      setExtrasLoading(false);
    })();

    return () => { cancelled = true; };
  }, [schoolId, sid]);

  useEffect(() => {
    if (!assignment?.class_id || !subsessionId) {
      setNextLesson(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/class-timetable/${assignment.class_id}/subsession/${subsessionId}`);
        const json = await res.json();
        if (cancelled) return;
        const dayName = DAY_NAMES[new Date().getDay()];
        const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
        const lessons = (json.success ? json.data?.entries || [] : [])
          .filter((entry) => entry.day === dayName && !entry.isBreak)
          .map((entry) => ({
            subject: entry.name || entry.subjects?.[0]?.name || "Lesson",
            start: entry.start,
            end: entry.end,
            startMins: toMinutes(entry.start),
          }))
          .filter((item) => item.startMins != null)
          .sort((a, b) => a.startMins - b.startMins);
        const current = lessons.find((item) => item.startMins <= nowMins && toMinutes(item.end) > nowMins);
        const upcoming = lessons.find((item) => item.startMins > nowMins);
        setNextLesson(current || upcoming || lessons[lessons.length - 1] || null);
      } catch {
        if (!cancelled) setNextLesson(null);
      }
    })();
    return () => { cancelled = true; };
  }, [assignment?.class_id, subsessionId]);

  useEffect(() => {
    if (!sid || !subsessionId) {
      setTodayMark("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/student-attendance/student/${sid}/subsession/${subsessionId}`);
        const json = await res.json();
        if (cancelled) return;
        const today = todayStamp();
        const row = (json.success ? json.data || [] : []).find(
          (item) => String(item.attendance_date || "").slice(0, 10) === today
        );
        setTodayMark(row?.status || "");
      } catch {
        if (!cancelled) setTodayMark("");
      }
    })();
    return () => { cancelled = true; };
  }, [sid, subsessionId]);

  const openBills = bills
    .filter((bill) => bill.payment_status === "unpaid" || bill.payment_status === "partial")
    .sort((a, b) => new Date(a.due_date || "9999-12-31") - new Date(b.due_date || "9999-12-31"));

  const school = user?.school;
  const portrait =
    (typeof student?.student_photo === "string" && student.student_photo.trim()) ||
    (typeof school?.logo_url === "string" && school.logo_url.trim()) ||
    "";
  const className = assignment?.class_name || "";
  const lessonLabel = (() => {
    if (!nextLesson) return "";
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
    const endMins = toMinutes(nextLesson.end);
    if (nextLesson.startMins <= nowMins && endMins > nowMins) return "Now";
    if (nextLesson.startMins > nowMins) return "Next";
    return "Last today";
  })();
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const actions = [
    { label: "Timetable", icon: <FaCalendarAlt />, onClick: () => navigate(termPath("timetable")) },
    { label: "Attendance", icon: <FaUserCheck />, onClick: () => navigate(termPath("attendance")) },
    { label: "Report", icon: <FaBook />, onClick: () => navigate(termPath("report")) },
    { label: "Bills", icon: <FaMoneyBillWave />, onClick: () => navigate(`${base}/bill`) },
    { label: "Notifications", icon: <FaBell />, onClick: () => navigate(`${base}/notification`) },
    { label: "Profile", icon: <FaUser />, onClick: () => navigate(`${base}/alumni`) },
    { label: "Exam code", icon: <FaKey />, onClick: () => navigate(`${base}/exam`) },
  ];

  return (
    <div className="dashboard-container student-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          {student?.full_name || "Student"} — your class, timetable and notices.
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
              <p className="school-info-label">{className || "Student"}</p>
              <h2 className="school-name">{student?.full_name || "Student"}</h2>
              <p className="school-tagline">{school?.school_name || "Your school"}</p>
              <div className="school-contact">
                {sessionLabel ? <span>{sessionLabel}</span> : <span>No active session</span>}
                {student?.admission_number ? <span className="dot">•</span> : null}
                {student?.admission_number ? <span>{student.admission_number}</span> : null}
              </div>
              <button type="button" className="edit-school-btn" onClick={() => navigate(`${base}/alumni`)}>
                <FaEdit /> My profile
              </button>
            </div>
            <div className="school-logo-stack">
              <div className="logo-card logo-card-back" />
              <div className="logo-card logo-card-front">
                {portrait
                  ? <img src={portrait} alt="" className="logo-img" />
                  : <FaGraduationCap className="logo-placeholder-icon" />}
                <span className="logo-card-label">{(student?.full_name || "Student").split(" ")[0]}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-row">
          <StatTile
            icon={<FaMoneyBillWave />}
            label="Bills due"
            value={billsLoading ? "—" : openBills.length}
            onClick={() => navigate(`${base}/bill`)}
          />
          <StatTile
            icon={<FaBell />}
            label="Unread notices"
            value={extrasLoading ? "—" : unreadCount}
            onClick={() => navigate(`${base}/notification`)}
          />
          <StatTile
            icon={<FaCalendarAlt />}
            label="Upcoming events"
            value={extrasLoading ? "—" : eventCount}
            onClick={() => navigate(termPath("events"))}
          />
          <StatTile
            icon={<FaBook />}
            label="Released results"
            value={extrasLoading ? "—" : resultCount}
            onClick={() => navigate(termPath("report"))}
          />
        </div>

        <div
          className={`session-status-card card${nextLesson ? " is-clickable" : ""}`}
          onClick={() => nextLesson && navigate(termPath("timetable"))}
          role={nextLesson ? "button" : undefined}
          tabIndex={nextLesson ? 0 : undefined}
          onKeyDown={(event) => {
            if (!nextLesson) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate(termPath("timetable"));
            }
          }}
        >
          <div className="card-content">
            {!nextLesson ? (
              <div className="session-empty">
                <FaCalendarAlt size={36} color="#d1d5db" />
                <p className="session-empty-title">{classLoading ? "Loading timetable" : "No class today"}</p>
                <p className="session-empty-sub">When a timetable is set, the next lesson shows here.</p>
              </div>
            ) : (
              <div className="session-inner">
                <div className="session-header">
                  <div className="session-header-left">
                    <span className="session-eyebrow"><FaCalendarAlt /> {lessonLabel || "Today"}</span>
                    <h3 className="session-name">{nextLesson.subject}</h3>
                    <span className="session-term">{className || "Your class"}</span>
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
          onClick={() => navigate(termPath("attendance"))}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              navigate(termPath("attendance"));
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
                <p className="attendance-empty-title">{MARK_LABEL[todayMark] || "Not marked yet"}</p>
                <p className="attendance-empty-sub">This is your own mark for today.</p>
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
            <span className="activities-eyebrow"><FaMoneyBillWave /> Bills due</span>
          </div>
          <div className="activities-card-body">
            {billsLoading ? (
              <div className="activities-empty">Loading…</div>
            ) : openBills.length === 0 ? (
              <div className="activities-empty">No bills due.</div>
            ) : (
              <div className="activities-list">
                {openBills.slice(0, 3).map((bill, index) => (
                  <Fragment key={bill.user_bill_id || index}>
                    <button type="button" className="activity-row" onClick={() => navigate(`${base}/bill`)}>
                      <div className="activity-avatar-initials">{initialsOf(bill.bill?.fee_name || "Bill")}</div>
                      <div className="activity-content">
                        <p className="activity-name">{bill.bill?.fee_name || "Bill"}</p>
                        <p className="activity-desc">
                          {bill.due_date ? `Due ${String(bill.due_date).slice(0, 10)}` : "No due date"}
                          {money(bill.amount_due) ? ` · ${money(bill.amount_due)}` : ""}
                        </p>
                      </div>
                      <span className="activity-badge">{bill.payment_status || "Due"}</span>
                    </button>
                    {index < Math.min(openBills.length, 3) - 1 ? <div className="activity-divider-line" /> : null}
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
                  <Fragment key={note.user_notification_id || note.notification_id || index}>
                    <button
                      type="button"
                      className={`activity-row${note.is_read ? "" : " is-unread"}`}
                      onClick={() => navigate(`${base}/notification`)}
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
                  <Fragment key={event.event_id || event.title || index}>
                    <button type="button" className="activity-row" onClick={() => navigate(termPath("events"))}>
                      <div className="activity-avatar-initials">{initialsOf(event.title || "Event")}</div>
                      <div className="activity-content">
                        <p className="activity-name">{event.title || "Event"}</p>
                        <p className="activity-desc">{String(event.event_date || "").slice(0, 10) || "Event"}</p>
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

        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaBook /> Released results</span>
          </div>
          <div className="activities-card-body">
            {extrasLoading ? (
              <div className="activities-empty">Loading…</div>
            ) : results.length === 0 ? (
              <div className="activities-empty">No released results this term.</div>
            ) : (
              <div className="activities-list">
                {results.map((row, index) => (
                  <Fragment key={row.attempt_id || index}>
                    <button type="button" className="activity-row" onClick={() => navigate(termPath("report"))}>
                      <div className="activity-avatar-initials">{initialsOf(row.subject_name || row.title || "Result")}</div>
                      <div className="activity-content">
                        <p className="activity-name">{row.title || "Test"}</p>
                        <p className="activity-desc">{row.subject_name || "Subject"}</p>
                      </div>
                      <span className="activity-badge">
                        {Number.isFinite(Number(row.percentage)) ? `${Math.round(Number(row.percentage))}%` : "Result"}
                      </span>
                    </button>
                    {index < results.length - 1 ? <div className="activity-divider-line" /> : null}
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
