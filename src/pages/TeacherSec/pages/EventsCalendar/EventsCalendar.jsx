import { useState, useEffect } from "react";
import { useParams, Routes, Route, Navigate } from "react-router-dom";
import useSchoolEvents from "../../../../api_call/useSchoolEvents";
import useSchoolCalendar from "../../../../api_call/useSchoolCalendar";
import { useSession } from "../../../../api_call/useSession";
import StudentDetailTopTab from "../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import Button from "../../../../components/Button/Button";
import InfoField from "../../../../components/infoField/InfoField";
import "../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "./EventsCalendar.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const STATUS_EVENT = { Upcoming: "ev-badge-blue", Ongoing: "ev-badge-green", Completed: "ev-badge-grey", Cancelled: "ev-badge-red" };
const STATUS_CAL   = { Scheduled: "ev-badge-blue", Completed: "ev-badge-grey", Cancelled: "ev-badge-red" };
const TYPE_COLORS  = { Academic:"#eff6ff", Sports:"#f0fdf4", Cultural:"#fdf4ff", Holiday:"#fff7ed", Meeting:"#f0f9ff", General:"#f4f4f4" };

const StatusBadge = ({ value, type = "event" }) => {
  const map = type === "event" ? STATUS_EVENT : STATUS_CAL;
  return <span className={`ev-badge ${map[value] || "ev-badge-grey"}`}>{value || "—"}</span>;
};

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="ev-search-wrap">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="ev-search-icon">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <input className="ev-search" type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    {value && <button className="ev-search-clear" onClick={() => onChange("")}>×</button>}
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="ev-empty">
    <span className="ev-empty-icon">{icon}</span>
    <p>{message}</p>
  </div>
);

/** Active academic window from GET /session/school/:id/active */
const matchesActiveSession = (ctx) => (row) => {
  if (!ctx?.sessionId) return false;
  if (String(row.session_id || "") !== String(ctx.sessionId)) return false;
  if (ctx.subsessionId) return String(row.subsession_id || "") === String(ctx.subsessionId);
  return true;
};

/* ── Events Tab ── */
const EventsTab = ({ schoolId }) => {
  const { getEventsBySchool } = useSchoolEvents();
  const { getActiveSession } = useSession();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [scopeLabel, setScopeLabel] = useState("");
  const [noActiveSession, setNoActiveSession] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    setLoading(true);
    setNoActiveSession(false);
    setScopeLabel("");
    (async () => {
      const [activeRes, eventsRes] = await Promise.all([
        getActiveSession(schoolId),
        getEventsBySchool(schoolId),
      ]);
      if (cancelled) return;
      const raw = eventsRes.success ? (eventsRes.data || []) : [];
      const session = activeRes.success ? activeRes.data?.session : null;
      const sub = activeRes.success ? activeRes.data?.subsession : null;
      if (!session?.session_id) {
        setNoActiveSession(true);
        setItems([]);
        setLoading(false);
        return;
      }
      const ctx = {
        sessionId: session.session_id,
        subsessionId: sub?.term_id || null,
      };
      const sn = session.session_name || "Current session";
      const tn = sub?.term_name;
      setScopeLabel(tn ? `${sn} · ${tn}` : sn);
      const pred = matchesActiveSession(ctx);
      setItems(raw.filter(pred).sort((a, b) => new Date(b.event_date) - new Date(a.event_date)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  const filtered = items.filter((e) => {
    const q = search.toLowerCase();
    return !q || (e.title||"").toLowerCase().includes(q) || (e.category||"").toLowerCase().includes(q) || (e.location||"").toLowerCase().includes(q);
  });

  return (
    <InnerTabCon>
      <div className="ev-container">
        <div className="notif-header">
          <div className="notif-header-left">
            <h2 className="notif-title">School Events</h2>
            <p className="notif-subtitle">
              {noActiveSession
                ? "No active academic session for today's date."
                : `${items.length} event${items.length !== 1 ? "s" : ""} for current session${scopeLabel ? ` · ${scopeLabel}` : ""}`}
            </p>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, category or location..." />

        {loading ? <LoadingData message="Loading events..." /> : noActiveSession ? (
          <EmptyState icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } message="There is no active session or term for today. Events are shown only for the current session." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          } message={search ? `No results for "${search}"` : "No events for the current session."} />
        ) : (
          <div className="ev-grid">
            {filtered.map((e) => (
              <div key={e.event_id} className="ev-card" onClick={() => setSelected(e)}>
                <div className="ev-card-header">
                  <div className="ev-card-icon" style={{ background: "#eff6ff" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="ev-card-info">
                    <p className="ev-card-title">{e.title}</p>
                    <p className="ev-card-date">{fmt(e.event_date)}{e.event_time ? ` · ${e.event_time}` : ""}</p>
                  </div>
                  <StatusBadge value={e.status} type="event" />
                </div>

                <div className="ev-card-meta">
                  {e.location  && <div className="ev-meta-item"><span className="ev-meta-label">Location</span><span className="ev-meta-value">{e.location}</span></div>}
                  {e.category  && <div className="ev-meta-item"><span className="ev-meta-label">Category</span><span className="ev-meta-value">{e.category}</span></div>}
                  {e.organizer && <div className="ev-meta-item"><span className="ev-meta-label">Organizer</span><span className="ev-meta-value">{e.organizer}</span></div>}
                  {e.participants && <div className="ev-meta-item"><span className="ev-meta-label">Participants</span><span className="ev-meta-value">{e.participants}</span></div>}
                </div>

                {e.description && <p className="ev-card-desc">{e.description}</p>}

                {(e.session_name || e.subsession_name) && (
                  <div className="ev-card-tags">
                    {e.session_name    && <span className="ev-tag">{e.session_name}</span>}
                    {e.subsession_name && <span className="ev-tag">{e.subsession_name}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <SlideInMenu isShow={!!selected} onClose={() => setSelected(null)} width="520px">
        {selected && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true" />
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{selected.title}</h2>
                  <p>{fmt(selected.event_date)}{selected.event_time ? ` · ${selected.event_time}` : ""}</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Status"       value={selected.status} />
                <InfoField label="Location"     value={selected.location} />
                <InfoField label="Category"     value={selected.category} />
                <InfoField label="Organizer"    value={selected.organizer} />
                <InfoField label="Participants" value={selected.participants} />
                <InfoField label="Session"      value={selected.session_name} />
                <InfoField label="Subsession"   value={selected.subsession_name} />
              </div>
              {selected.description && (
                <>
                  <span className="sc-section-label">Description</span>
                  <p className="ev-detail-desc">{selected.description}</p>
                </>
              )}
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

/* ── Calendar Tab ── */
const CalendarTab = ({ schoolId }) => {
  const { getCalendarItemsBySchool } = useSchoolCalendar();
  const { getActiveSession } = useSession();
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);
  const [scopeLabel, setScopeLabel] = useState("");
  const [noActiveSession, setNoActiveSession] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    setLoading(true);
    setNoActiveSession(false);
    setScopeLabel("");
    (async () => {
      const [activeRes, calRes] = await Promise.all([
        getActiveSession(schoolId),
        getCalendarItemsBySchool(schoolId),
      ]);
      if (cancelled) return;
      const raw = calRes.success ? (calRes.data || []) : [];
      const session = activeRes.success ? activeRes.data?.session : null;
      const sub = activeRes.success ? activeRes.data?.subsession : null;
      if (!session?.session_id) {
        setNoActiveSession(true);
        setItems([]);
        setLoading(false);
        return;
      }
      const ctx = {
        sessionId: session.session_id,
        subsessionId: sub?.term_id || null,
      };
      const sn = session.session_name || "Current session";
      const tn = sub?.term_name;
      setScopeLabel(tn ? `${sn} · ${tn}` : sn);
      const pred = matchesActiveSession(ctx);
      setItems(raw.filter(pred).sort((a, b) => new Date(a.calendar_date) - new Date(b.calendar_date)));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  const filtered = items.filter((c) => {
    const q = search.toLowerCase();
    return !q || (c.title||"").toLowerCase().includes(q) || (c.type||"").toLowerCase().includes(q) || (c.location||"").toLowerCase().includes(q);
  });

  return (
    <InnerTabCon>
      <div className="ev-container">
        <div className="notif-header">
          <div className="notif-header-left">
            <h2 className="notif-title">School Calendar</h2>
            <p className="notif-subtitle">
              {noActiveSession
                ? "No active academic session for today's date."
                : `${items.length} item${items.length !== 1 ? "s" : ""} for current session${scopeLabel ? ` · ${scopeLabel}` : ""}`}
            </p>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, type or location..." />

        {loading ? <LoadingData message="Loading calendar..." /> : noActiveSession ? (
          <EmptyState icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          } message="There is no active session or term for today. Calendar entries are shown only for the current session." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          } message={search ? `No results for "${search}"` : "No calendar items for the current session."} />
        ) : (
          <div className="ev-grid">
            {filtered.map((c) => (
              <div key={c.calendar_id} className="ev-card" onClick={() => setSelected(c)}>
                <div className="ev-card-header">
                  <div className="ev-card-icon" style={{ background: TYPE_COLORS[c.type] || "#f4f4f4" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  </div>
                  <div className="ev-card-info">
                    <p className="ev-card-title">{c.title}</p>
                    <p className="ev-card-date">{fmt(c.calendar_date)}{c.calendar_time ? ` · ${c.calendar_time}` : ""}</p>
                  </div>
                  <StatusBadge value={c.status} type="calendar" />
                </div>

                <div className="ev-card-meta">
                  {c.type       && <div className="ev-meta-item"><span className="ev-meta-label">Type</span><span className="ev-meta-value">{c.type}</span></div>}
                  {c.location   && <div className="ev-meta-item"><span className="ev-meta-label">Location</span><span className="ev-meta-value">{c.location}</span></div>}
                  {c.duration   && <div className="ev-meta-item"><span className="ev-meta-label">Duration</span><span className="ev-meta-value">{c.duration}</span></div>}
                  {c.priority   && <div className="ev-meta-item"><span className="ev-meta-label">Priority</span><span className="ev-meta-value">{c.priority}</span></div>}
                  {c.participants && <div className="ev-meta-item ev-meta-full"><span className="ev-meta-label">Participants</span><span className="ev-meta-value">{c.participants}</span></div>}
                </div>

                {c.description && <p className="ev-card-desc">{c.description}</p>}

                {(c.session_name || c.subsession_name) && (
                  <div className="ev-card-tags">
                    {c.session_name    && <span className="ev-tag">{c.session_name}</span>}
                    {c.subsession_name && <span className="ev-tag">{c.subsession_name}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      <SlideInMenu isShow={!!selected} onClose={() => setSelected(null)} width="520px">
        {selected && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true" />
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{selected.title}</h2>
                  <p>{fmt(selected.calendar_date)}{selected.calendar_time ? ` · ${selected.calendar_time}` : ""}</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Status"       value={selected.status} />
                <InfoField label="Type"         value={selected.type} />
                <InfoField label="Location"     value={selected.location} />
                <InfoField label="Duration"     value={selected.duration} />
                <InfoField label="Priority"     value={selected.priority} />
                <InfoField label="Participants" value={selected.participants} />
                <InfoField label="Session"      value={selected.session_name} />
                <InfoField label="Subsession"   value={selected.subsession_name} />
              </div>
              {selected.description && (
                <>
                  <span className="sc-section-label">Description</span>
                  <p className="ev-detail-desc">{selected.description}</p>
                </>
              )}
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

/* ── Main ── */
const EventsCalendar = () => {
  const { schoolId } = useParams();

  return (
    <StudentDetailTopTab
      title="Events & Calendar"
      subtitle="School events and academic calendar"
      route={[
        { label: "School Events",   link: "/school-events" },
        { label: "School Calendar", link: "/school-calendar" },
      ]}
    >
      <Routes>
        <Route path="/" element={<Navigate to={`/teacher/${schoolId}/events/school-events`} replace />} />
        <Route path="/school-events"   element={<EventsTab   schoolId={schoolId} />} />
        <Route path="/school-calendar" element={<CalendarTab schoolId={schoolId} />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default EventsCalendar;
