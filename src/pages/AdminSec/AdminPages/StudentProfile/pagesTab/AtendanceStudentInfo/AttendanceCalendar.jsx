import { useState } from "react";

const AttendanceCalendar = ({
  startDate,
  endDate,
  attendanceData,
  onAttendanceChange,
  isUpdating = false,
  canEdit = true,
  onPermissionDenied,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate));
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  // Parse dates - set to midnight local time for accurate comparison
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

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
    // Normalize all dates to midnight for accurate comparison
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startNormalized = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endNormalized = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    return checkDate >= startNormalized && checkDate <= endNormalized;
  };

  // Get attendance status for a date
  const getAttendanceStatus = (date) => {
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD format
    return attendanceData[dateStr] || null;
  };

  // Handle attendance status change
  const handleAttendanceClick = (date) => {
    if (!isInDuration(date) || isWeekend(date)) return;
    if (!canEdit) {
      onPermissionDenied && onPermissionDenied();
      return;
    }

    const dateStr = date.toISOString().split("T")[0];
    setSelectedDate(date);
    setSelectedDateStr(dateStr);
    setShowEditPopup(true);
  };

  // Handle status selection from popup
  const handleStatusSelect = (newStatus) => {
    if (onAttendanceChange && selectedDateStr) {
      onAttendanceChange(selectedDateStr, newStatus);
    }
    setShowEditPopup(false);
    setSelectedDate(null);
    setSelectedDateStr("");
  };

  // Close popup
  const closePopup = () => {
    setShowEditPopup(false);
    setSelectedDate(null);
    setSelectedDateStr("");
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

    console.log("hhhhhhhhhh generateCalendarDays - Start");
    console.log("hhhhhhhhhh Subsession dates:", { startDate, endDate });
    console.log("hhhhhhhhhh Current month:", { year, month, daysInMonth });
    console.log("hhhhhhhhhh Start date normalized:", start);
    console.log("hhhhhhhhhh End date normalized:", end);

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

      // Check if this day is in the start month but before the start date
      const isBeforeStartInSameMonth = 
        year === start.getFullYear() && 
        month === start.getMonth() && 
        day < start.getDate();

      // Check if this day is in the end month but after the end date
      const isAfterEndInSameMonth = 
        year === end.getFullYear() && 
        month === end.getMonth() && 
        day > end.getDate();

      console.log(`hhhhhhhhhh Day ${day}:`, {
        date: date.toISOString().split('T')[0],
        isInRange,
        isWeekendDay,
        status,
        isBeforeStartInSameMonth,
        isAfterEndInSameMonth
      });

      // If date is not in range, check if it's in the boundary months
      if (!isInRange) {
        // If it's in the start or end month but outside the range, show with border only
        if (isBeforeStartInSameMonth || isAfterEndInSameMonth) {
          days.push(
            <div 
              key={day} 
              className="calendar-day out-of-range"
              title={`Outside subsession range`}
            ></div>
          );
        } else {
          // Completely outside the subsession months - show empty
          days.push(<div key={day} className="calendar-day empty"></div>);
        }
        continue;
      }

      let dayClass = "calendar-day";

      // If there's attendance data, use that status regardless of weekend
      if (status) {
        dayClass += ` ${status}`;
      } else if (isWeekendDay) {
        // Weekend with no data - still show as weekend
        dayClass += " weekend";
      } else {
        // Weekday with no data - show as not entered
        dayClass += " not_entered";
      }

      days.push(
        <div
          key={day}
          className={dayClass}
          onClick={() => handleAttendanceClick(date)}
          style={{
            cursor: !isWeekendDay && canEdit ? "pointer" : "default",
            position: "relative",
          }}
          title={
            !isWeekendDay && canEdit
              ? `Click to change attendance for ${date.toLocaleDateString()}`
              : ""
          }
        >
          <span className="day-number">{day}</span>
          {icon && <span className="status-icon">{icon}</span>}
          {!isWeekendDay && canEdit && (
            <div className="edit-indicator">
              <span className="edit-hint">Click to edit</span>
            </div>
          )}
        </div>
      );
    }

    console.log("hhhhhhhhhh Total days rendered:", days.length);
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

      {/* Attendance Edit Popup */}
      {showEditPopup && selectedDate && (
        <div className="attendance-popup-overlay" onClick={closePopup}>
          <div
            className="attendance-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {isUpdating && (
              <div className="popup-loading-overlay">
                <div className="popup-spinner"></div>
                <span>Updating...</span>
              </div>
            )}
            
            <div className="popup-header">
              <h3>Edit Attendance</h3>
              <button className="popup-close" onClick={closePopup} disabled={isUpdating}>
                ×
              </button>
            </div>

            <div className="popup-content">
              <div className="selected-date">
                <strong>
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>

              <div className="current-status">
                <span>Current Status: </span>
                <span
                  className={`status-badge ${
                    attendanceData[selectedDateStr] || "not-set"
                  }`}
                >
                  {attendanceData[selectedDateStr] ? (
                    <>
                      {getStatusIcon(attendanceData[selectedDateStr])}{" "}
                      {attendanceData[selectedDateStr].charAt(0).toUpperCase() +
                        attendanceData[selectedDateStr].slice(1)}
                    </>
                  ) : (
                    "? Not Set"
                  )}
                </span>
              </div>

              <div className="status-options">
                <h4>Select Attendance Status:</h4>
                <div className="status-buttons">
                  <button
                    className="status-button present"
                    onClick={() => handleStatusSelect("present")}
                    disabled={isUpdating}
                  >
                    <span className="status-icon">✓</span>
                    <span>Present</span>
                  </button>

                  <button
                    className="status-button absent"
                    onClick={() => handleStatusSelect("absent")}
                    disabled={isUpdating}
                  >
                    <span className="status-icon">✗</span>
                    <span>Absent</span>
                  </button>

                  <button
                    className="status-button excused"
                    onClick={() => handleStatusSelect("excused")}
                    disabled={isUpdating}
                  >
                    <span className="status-icon">!</span>
                    <span>Excused</span>
                  </button>

                  <button
                    className="status-button remove"
                    onClick={() => handleStatusSelect(null)}
                    disabled={isUpdating}
                  >
                    <span className="status-icon">⌫</span>
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
