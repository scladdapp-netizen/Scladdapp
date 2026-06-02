import { useState } from "react";
import "./AttendanceCalendar.css";

const AttendanceCalendar = ({ startDate, endDate, attendanceData }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate));

  // Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get month info
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Check if we can navigate to previous/next month
  const canGoPrevious =
    new Date(year, month - 1, 1) >=
    new Date(start.getFullYear(), start.getMonth(), 1);
  const canGoNext =
    new Date(year, month + 1, 1) <=
    new Date(end.getFullYear(), end.getMonth(), 1);

  const goToPreviousMonth = () => {
    if (canGoPrevious) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const goToNextMonth = () => {
    if (canGoNext) {
      setCurrentMonth(new Date(year, month + 1, 1));
    }
  };

  // Check if date is weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Check if date is in duration
  const isInDuration = (date) => {
    return date >= start && date <= end;
  };

  // Get attendance status for a date
  const getAttendanceStatus = (date) => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    return attendanceData[dateStr] || null;
  };

  // Get icon for attendance status
  const getStatusIcon = (status) => {
    switch (status) {
      case "present":
        return "✓";
      case "absent":
        return "✗";
      case "excused":
        return "!";
      case "not_entered":
        return "?";
      default:
        return "";
    }
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isInRange = isInDuration(date);
      const isWeekendDay = isWeekend(date);
      const status = getAttendanceStatus(date);
      const icon = getStatusIcon(status);

      let dayClass = "calendar-day";
      if (!isInRange) dayClass += " disabled";

      // If there's attendance data, use that status regardless of weekend
      if (status) {
        dayClass += ` ${status}`;
      } else if (isWeekendDay && isInRange) {
        // Weekend with no data - still show as weekend
        dayClass += " weekend";
      } else if (isInRange) {
        // Weekday with no data - show as not entered
        dayClass += " not_entered";
      }

      days.push(
        <div key={day} className={dayClass}>
          <span className="day-number">{day}</span>
          {icon && <span className="status-icon">{icon}</span>}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="attendance-calendar">
      <div className="calendar-header">
        <button
          className={`nav-button ${!canGoPrevious ? "disabled" : ""}`}
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
        >
          ‹
        </button>
        <div className="header-center">
          <h3 className="month-year">
            {monthNames[month]} {year}
          </h3>
          <div className="date-range">
            {new Date(startDate + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            -{" "}
            {new Date(endDate + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
        <button
          className={`nav-button ${!canGoNext ? "disabled" : ""}`}
          onClick={goToNextMonth}
          disabled={!canGoNext}
        >
          ›
        </button>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-dot present"></div>
          <span>Present ✓</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot absent"></div>
          <span>Absent ✗</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot excused"></div>
          <span>Excused !</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot not_entered"></div>
          <span>Not Entered ?</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot weekend"></div>
          <span>Weekend</span>
        </div>
      </div>

      <div className="calendar-grid">
        <div className="weekday-header">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        <div className="calendar-days">{generateCalendarDays()}</div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
