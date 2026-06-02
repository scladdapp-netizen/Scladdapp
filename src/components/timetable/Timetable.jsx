import { useState, useEffect } from "react";
import "./Timetable.css";

// Modal component for showing period details
const PeriodModal = ({ isOpen, onClose, periodData }) => {
  if (!isOpen || !periodData) return null;

  const isMultiSubject = periodData.subjects && periodData.subjects.length > 1;

  return (
    <div className="period-modal-overlay" onClick={onClose}>
      <div className="period-modal" onClick={(e) => e.stopPropagation()}>
        <div className="period-modal-header">
          <h3 className="period-modal-title">
            {isMultiSubject ? "Multiple Subjects" : periodData.name}
          </h3>
          <button className="period-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="period-modal-content">
          <div className="period-info-section">
            <div className="period-info-item">
              <span className="period-info-label">Day:</span>
              <span className="period-info-value">{periodData.day}</span>
            </div>
            <div className="period-info-item">
              <span className="period-info-label">Time:</span>
              <span className="period-info-value">
                {periodData.start} – {periodData.end}
              </span>
            </div>
            {periodData.streamName && (
              <div className="period-info-item">
                <span className="period-info-label">Stream:</span>
                <span
                  className="period-info-value period-stream"
                  style={{ color: periodData.streamColor }}
                >
                  {periodData.streamName}
                </span>
              </div>
            )}
          </div>

          {isMultiSubject ? (
            <div className="subjects-list">
              <h4 className="subjects-list-title">
                Subjects ({periodData.subjects.length})
              </h4>
              {periodData.subjects.map((subject, index) => (
                <div key={subject.id} className="subject-card">
                  <div className="subject-card-header">
                    <span className="subject-name">
                      {subject.displayName ||
                        `${subject.name} (${subject.streamName || "General"})`}
                    </span>
                    <span
                      className="subject-stream-badge"
                      style={{
                        backgroundColor: getStreamColor(subject.stream),
                        color: "white",
                      }}
                    >
                      {subject.streamName || "General"}
                    </span>
                  </div>
                  <div className="subject-card-details">
                    <div className="subject-detail">
                      <span className="subject-detail-label">Code:</span>
                      <span className="subject-detail-value">
                        {subject.code}
                      </span>
                    </div>
                    <div className="subject-detail">
                      <span className="subject-detail-label">Teacher:</span>
                      <span className="subject-detail-value">
                        {subject.teacher}
                      </span>
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
                    <span className="period-info-value">
                      {periodData.subjects[0].code}
                    </span>
                  </div>
                  <div className="period-info-item">
                    <span className="period-info-label">Teacher:</span>
                    <span className="period-info-value">
                      {periodData.subjects[0].teacher}
                    </span>
                  </div>
                  <div className="period-info-item">
                    <span className="period-info-label">Stream:</span>
                    <span
                      className="period-info-value period-stream"
                      style={{
                        color: getStreamColor(periodData.subjects[0].stream),
                      }}
                    >
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

// Helper function to get stream colors
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

// Component for animated multi-subject display with border color changing
const AnimatedSubjectCell = ({ subjects, start, end, subjectId, onClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (subjects.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % subjects.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [subjects.length]);

  if (!subjects || subjects.length === 0) return null;

  const currentSubject = subjects[currentIndex];

  // Get current subject's color (you can customize this logic)
  const getCurrentColor = () => {
    const colors = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
    return colors[currentIndex % colors.length];
  };

  return (
    <div className="animated-subject-container" onClick={onClick}>
      {/* Notification badge - only show if multiple subjects */}
      {subjects.length > 1 && (
        <div className="subject-count-badge">{subjects.length}</div>
      )}

      {/* Subject content */}
      <div
        className="subject-content-container"
        style={{
          borderColor: getCurrentColor(),
          animation: subjects.length > 1 ? "borderPulse 3s infinite" : "none",
        }}
      >
        <div
          className="subject-content-animated"
          key={`${subjectId}-${currentIndex}`}
        >
          <div className="subject-title">
            {currentSubject.displayName ||
              `${currentSubject.name} (${
                currentSubject.streamName || "General"
              })`}
          </div>
          {currentSubject.teacher && (
            <div className="subject-teacher">{currentSubject.teacher}</div>
          )}
        </div>
        <div className="subject-time">
          {start} – {end}
        </div>
      </div>
    </div>
  );
};

// ---- utils ----
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

// Dynamic days based on timetable data
const getAllDaysFromData = (data) => {
  const uniqueDays = [...new Set(data.map((item) => item.day))];
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  return dayOrder.filter((day) => uniqueDays.includes(day));
};

export default function Timetable({ timetableData = [] }) {
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

  const starts = timetableData.map((s) => toMinutes(s.start));
  const ends = timetableData.map((s) => toMinutes(s.end));

  const fallbackStart = 8 * 60;
  const fallbackEnd = 18 * 60;

  const minStart = starts.length ? Math.min(...starts) : fallbackStart;
  const maxEnd = ends.length ? Math.max(...ends) : fallbackEnd;

  const startHour = Math.floor(minStart / 60);
  const endHour = Math.ceil(maxEnd / 60);

  const startMinutes = startHour * 60;
  const totalMinutes = endHour * 60 - startMinutes;

  const hoursCount = Math.max(1, endHour - startHour);
  const hours = Array.from({ length: hoursCount }, (_, i) => startHour + i);

  // map to store topic -> color
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

  // group data by day
  const groupedByDay = days.reduce((acc, day) => {
    acc[day] = timetableData.filter((item) => item.day === day);
    return acc;
  }, {});

  const getStyle = (start, end) => {
    const left = ((toMinutes(start) - startMinutes) / totalMinutes) * 100;
    const width = ((toMinutes(end) - toMinutes(start)) / totalMinutes) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  const dayShort = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  return (
    <div className="timetable-wrapper" style={{ "--hours": hours.length }}>
      {/* TIME HEADER */}
      <div className="time-header">
        <div className="day-label-placeholder" />
        {hours.map((h) => (
          <div key={h} className="time-cell">
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* BODY */}
      <div className="timetable-body">
        {days.map((day) => (
          <div key={day} className="day-row">
            <div className="day-label">{dayShort[day]}</div>

            <div className="day-track">
              {groupedByDay[day].map((subj) => {
                const isMultiSubject =
                  subj.subjects && subj.subjects.length > 1;

                return (
                  <div
                    key={subj.id}
                    className={`subject ${
                      isMultiSubject ? "multi-subject" : "single-subject"
                    }`}
                    style={{
                      ...getStyle(subj.start, subj.end),
                      border: `2px solid ${
                        subj.streamColor || getColorForTopic(subj.name)
                      }`,
                      cursor: "pointer",
                    }}
                    onClick={() => handlePeriodClick(subj)}
                  >
                    {isMultiSubject ? (
                      <AnimatedSubjectCell
                        subjects={subj.subjects}
                        start={subj.start}
                        end={subj.end}
                        subjectId={subj.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePeriodClick(subj);
                        }}
                      />
                    ) : (
                      <div className="single-subject-content">
                        <div className="subject-title">
                          {subj.subjects && subj.subjects.length === 1
                            ? subj.subjects[0].displayName ||
                              `${subj.subjects[0].name} (${
                                subj.subjects[0].streamName || "General"
                              })`
                            : subj.name}
                        </div>
                        {subj.teacher && (
                          <div className="subject-teacher">{subj.teacher}</div>
                        )}
                        <div className="subject-time">
                          {subj.start} – {subj.end}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Period Details Modal */}
      <PeriodModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        periodData={selectedPeriod}
      />
    </div>
  );
}
