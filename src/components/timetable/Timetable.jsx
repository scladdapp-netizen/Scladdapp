import { useState, useEffect } from "react";
import "./Timetable.css";

// ---- Helper: stream colors ----
const getStreamColor = (stream) => {
  const colors = {
    science: "#10b981",
    arts: "#3b82f6",
    commercial: "#f59e0b",
    general: "#6b7280",
    mixed: "#8b5cf6",
  };
  return colors[stream] || colors.general;
};

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const getAllDaysFromData = (data) => {
  const uniqueDays = [...new Set(data.map((item) => item.day))];
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return dayOrder.filter((day) => uniqueDays.includes(day));
};

// ---- Period detail modal ----
const PeriodModal = ({ isOpen, onClose, periodData }) => {
  if (!isOpen || !periodData) return null;
  const isMulti = periodData.subjects && periodData.subjects.length > 1;

  return (
    <div className="period-modal-overlay" onClick={onClose}>
      <div className="period-modal" onClick={(e) => e.stopPropagation()}>
        <div className="period-modal-header">
          <h3 className="period-modal-title">
            {isMulti ? "Multiple Subjects" : periodData.name}
          </h3>
          <button className="period-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="period-modal-content">
          <div className="period-info-section">
            <div className="period-info-item">
              <span className="period-info-label">Day:</span>
              <span className="period-info-value">{periodData.day}</span>
            </div>
            <div className="period-info-item">
              <span className="period-info-label">Time:</span>
              <span className="period-info-value">{periodData.start} – {periodData.end}</span>
            </div>
            {periodData.streamName && (
              <div className="period-info-item">
                <span className="period-info-label">Stream:</span>
                <span className="period-info-value period-stream" style={{ color: periodData.streamColor }}>
                  {periodData.streamName}
                </span>
              </div>
            )}
          </div>

          {isMulti ? (
            <div className="subjects-list">
              <h4 className="subjects-list-title">Subjects ({periodData.subjects.length})</h4>
              {periodData.subjects.map((subject) => (
                <div key={subject.id} className="subject-card">
                  <div className="subject-card-header">
                    <span className="subject-name">
                      {subject.displayName || `${subject.name} (${subject.streamName || "General"})`}
                    </span>
                    <span className="subject-stream-badge" style={{ backgroundColor: getStreamColor(subject.stream), color: "white" }}>
                      {subject.streamName || "General"}
                    </span>
                  </div>
                  <div className="subject-card-details">
                    <div className="subject-detail">
                      <span className="subject-detail-label">Code:</span>
                      <span className="subject-detail-value">{subject.code}</span>
                    </div>
                    <div className="subject-detail">
                      <span className="subject-detail-label">Teacher:</span>
                      <span className="subject-detail-value">{subject.teacher}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="single-subject-details">
              {periodData.subjects && periodData.subjects[0] && (
                <>
                  <div className="period-info-item">
                    <span className="period-info-label">Subject Code:</span>
                    <span className="period-info-value">{periodData.subjects[0].code}</span>
                  </div>
                  <div className="period-info-item">
                    <span className="period-info-label">Teacher:</span>
                    <span className="period-info-value">{periodData.subjects[0].teacher}</span>
                  </div>
                  <div className="period-info-item">
                    <span className="period-info-label">Stream:</span>
                    <span className="period-info-value period-stream" style={{ color: getStreamColor(periodData.subjects[0].stream) }}>
                      {periodData.subjects[0].streamName || "General"}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Animated cell for multi-subject (table view) ----
const AnimatedSubjectCell = ({ subjects, start, end, subjectId, onClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (subjects.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % subjects.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [subjects.length]);

  if (!subjects || subjects.length === 0) return null;

  const currentSubject = subjects[currentIndex];
  const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
  const getCurrentColor = () => colors[currentIndex % colors.length];

  return (
    <div className="animated-subject-container" onClick={onClick}>
      {subjects.length > 1 && (
        <div className="subject-count-badge">{subjects.length}</div>
      )}
      <div
        className="subject-content-container"
        style={{ borderColor: getCurrentColor(), animation: subjects.length > 1 ? "borderPulse 3s infinite" : "none" }}
      >
        <div className="subject-content-animated" key={`${subjectId}-${currentIndex}`}>
          <div className="subject-title">
            {currentSubject.displayName || `${currentSubject.name} (${currentSubject.streamName || "General"})`}
          </div>
          {currentSubject.teacher && (
            <div className="subject-teacher">{currentSubject.teacher}</div>
          )}
        </div>
        <div className="subject-time">{start} – {end}</div>
      </div>
    </div>
  );
};

// ---- Icons ----
const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const TableIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const ChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// ---- List View ----
const TimetableListView = ({ days, groupedByDay, onEntryClick }) => {
  const topicColors = {};
  const getColorForTopic = (topic) => {
    if (!topicColors[topic]) {
      const palette = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
      topicColors[topic] = palette[Object.keys(topicColors).length % palette.length];
    }
    return topicColors[topic];
  };

  return (
    <div className="timetable-list-wrapper">
      {days.map((day) => {
        const entries = [...(groupedByDay[day] || [])].sort(
          (a, b) => toMinutes(a.start) - toMinutes(b.start)
        );

        return (
          <div key={day} className="timetable-list-day">
            <div className="timetable-list-day-header">
              <span className="timetable-list-day-name">{day}</span>
              <span className="timetable-list-day-count">
                {entries.length} period{entries.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="timetable-list-entries">
              {entries.map((subj) => {
                const isBreak = !!subj.isBreak || /break|lunch|recess|interval/i.test(subj.name || "");
                const isMulti = !isBreak && subj.subjects && subj.subjects.length > 1;
                const accentColor = isBreak
                  ? "#9ca3af"
                  : (subj.streamColor || getColorForTopic(subj.name));

                let displayName = subj.name;
                let teacherName = subj.teacher || null;
                let streamLabel = subj.streamName || null;
                let streamColor = accentColor;

                if (isBreak) {
                  displayName = subj.name || "Break";
                  teacherName = null;
                  streamLabel = "Break";
                  streamColor = "#9ca3af";
                } else if (!isMulti && subj.subjects && subj.subjects[0]) {
                  const s = subj.subjects[0];
                  displayName = s.displayName || `${s.name} (${s.streamName || "General"})`;
                  teacherName = s.teacher || null;
                  streamLabel = s.streamName || "General";
                  streamColor = getStreamColor(s.stream);
                }

                return (
                  <div
                    key={subj.id}
                    className={`timetable-list-entry${isBreak ? " is-break" : ""}`}
                    onClick={() => onEntryClick(subj)}
                  >
                    {/* Left accent bar */}
                    <div
                      className="timetable-list-entry-accent"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Time column */}
                    <div className="timetable-list-entry-time">
                      <span className="timetable-list-time-start">{subj.start}</span>
                      <span className="timetable-list-time-end">{subj.end}</span>
                    </div>

                    {/* Content */}
                    <div className="timetable-list-entry-content">
                      {isMulti ? (
                        <>
                          <span className="timetable-list-subject-name">
                            Multiple Subjects
                          </span>
                          <div className="timetable-list-multi-badge">
                            {subj.subjects.slice(0, 3).map((s, i) => (
                              <span key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span
                                  className="timetable-list-multi-dot"
                                  style={{ backgroundColor: getStreamColor(s.stream) }}
                                />
                                {s.name}
                                {i < Math.min(subj.subjects.length, 3) - 1 && <span style={{ color: "#ddd" }}>·</span>}
                              </span>
                            ))}
                            {subj.subjects.length > 3 && (
                              <span>+{subj.subjects.length - 3} more</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="timetable-list-subject-name">{displayName}</span>
                          <div className="timetable-list-meta-row">
                            {teacherName && (
                              <span className="timetable-list-subject-teacher">{teacherName}</span>
                            )}
                            {streamLabel && (
                              <span
                                className="timetable-list-subject-stream"
                                style={{ backgroundColor: streamColor }}
                              >
                                {streamLabel}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- Table View (original) ----
const TimetableTableView = ({ days, groupedByDay, hours, startMinutes, totalMinutes, getStyle, onPeriodClick }) => {
  const topicColors = {};
  const getColorForTopic = (topic) => {
    if (!topicColors[topic]) {
      const r = Math.floor(50 + Math.random() * 205);
      const g = Math.floor(50 + Math.random() * 205);
      const b = Math.floor(50 + Math.random() * 205);
      topicColors[topic] = `rgb(${r}, ${g}, ${b})`;
    }
    return topicColors[topic];
  };

  const dayShort = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

  return (
    <div className="timetable-wrapper" style={{ "--hours": hours.length }}>
      <div className="time-header">
        <div className="day-label-placeholder" />
        {hours.map((h) => (
          <div key={h} className="time-cell">{String(h).padStart(2, "0")}:00</div>
        ))}
      </div>

      <div className="timetable-body">
        {days.map((day) => (
          <div key={day} className="day-row">
            <div className="day-label">{dayShort[day]}</div>
            <div className="day-track">
              {groupedByDay[day].map((subj) => {
                const isBreak = !!subj.isBreak || /break|lunch|recess|interval/i.test(subj.name || "");
                const isMulti = !isBreak && subj.subjects && subj.subjects.length > 1;
                return (
                  <div
                    key={subj.id}
                    className={`subject ${isBreak ? "break-period" : isMulti ? "multi-subject" : "single-subject"}`}
                    style={{
                      ...getStyle(subj.start, subj.end),
                      border: `2px solid ${isBreak ? "#9ca3af" : (subj.streamColor || getColorForTopic(subj.name))}`,
                      cursor: "pointer",
                      ...(isBreak
                        ? {
                            background: "repeating-linear-gradient(135deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px)",
                            opacity: 0.95,
                          }
                        : {}),
                    }}
                    onClick={() => onPeriodClick(subj)}
                  >
                    {isBreak ? (
                      <div className="single-subject-content break-content">
                        <div className="subject-title">{subj.name || "Break"}</div>
                        <div className="subject-time">{subj.start} – {subj.end}</div>
                      </div>
                    ) : isMulti ? (
                      <AnimatedSubjectCell
                        subjects={subj.subjects}
                        start={subj.start}
                        end={subj.end}
                        subjectId={subj.id}
                        onClick={(e) => { e.stopPropagation(); onPeriodClick(subj); }}
                      />
                    ) : (
                      <div className="single-subject-content">
                        <div className="subject-title">
                          {subj.subjects && subj.subjects.length === 1
                            ? subj.subjects[0].displayName || `${subj.subjects[0].name} (${subj.subjects[0].streamName || "General"})`
                            : subj.name}
                        </div>
                        {subj.teacher && <div className="subject-teacher">{subj.teacher}</div>}
                        <div className="subject-time">{subj.start} – {subj.end}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---- Main export ----
export default function Timetable({ timetableData = [], defaultView = "table" }) {
  const [view, setView] = useState(defaultView); // "table" is default
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days = getAllDaysFromData(timetableData);

  const handlePeriodClick = (periodData) => {
    setSelectedPeriod(periodData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPeriod(null);
  };

  // Table view calculations
  const starts = timetableData.map((s) => toMinutes(s.start));
  const ends   = timetableData.map((s) => toMinutes(s.end));
  const fallbackStart = 8 * 60;
  const fallbackEnd   = 18 * 60;
  const minStart  = starts.length ? Math.min(...starts) : fallbackStart;
  const maxEnd    = ends.length   ? Math.max(...ends)   : fallbackEnd;
  const startHour = Math.floor(minStart / 60);
  const endHour   = Math.ceil(maxEnd / 60);
  const startMinutes  = startHour * 60;
  const totalMinutes  = endHour * 60 - startMinutes;
  const hoursCount    = Math.max(1, endHour - startHour);
  const hours         = Array.from({ length: hoursCount }, (_, i) => startHour + i);

  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetableData.filter((item) => item.day === day);
    return acc;
  }, {});

  const getStyle = (start, end) => {
    const left  = ((toMinutes(start) - startMinutes) / totalMinutes) * 100;
    const width = ((toMinutes(end) - toMinutes(start)) / totalMinutes) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div>
      {/* View toggle */}
      <div className="timetable-view-toggle">
        <button
          className={`toggle-btn${view === "list" ? " active" : ""}`}
          onClick={() => setView("list")}
        >
          <ListIcon /> List
        </button>
        <button
          className={`toggle-btn${view === "table" ? " active" : ""}`}
          onClick={() => setView("table")}
        >
          <TableIcon /> Table
        </button>
      </div>

      {/* View content */}
      {view === "list" ? (
        <TimetableListView
          days={days}
          groupedByDay={groupedByDay}
          onEntryClick={handlePeriodClick}
        />
      ) : (
        <TimetableTableView
          days={days}
          groupedByDay={groupedByDay}
          hours={hours}
          startMinutes={startMinutes}
          totalMinutes={totalMinutes}
          getStyle={getStyle}
          onPeriodClick={handlePeriodClick}
        />
      )}

      {/* Period Details Modal (shared) */}
      <PeriodModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        periodData={selectedPeriod}
      />
    </div>
  );
}
