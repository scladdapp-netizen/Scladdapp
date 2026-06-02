import "./AttendanceOverview.css";
import AttendanceCalendar from "./AttendanceCalendar";

const AttendanceOverview = () => {
  // Sample data - you can replace with real data
  const attendanceData = {
    present: 42,
    absent: 6,
    excusedAbsent: 2,
  };

  // Sample attendance records for calendar
  const attendanceRecords = {
    "2025-01-27": "present",
    "2025-01-28": "present",
    "2025-01-29": "absent",
    "2025-01-30": "present",
    "2025-01-31": "present",
    "2025-02-01": "present", // Weekend with data
    "2025-02-02": "excused", // Weekend with data
    "2025-02-03": "present",
    "2025-02-04": "excused",
    "2025-02-05": "present",
    "2025-02-06": "present",
    "2025-02-07": "absent",
    "2025-02-10": "present",
    "2025-02-11": "present",
    // "2025-02-12": not entered (weekday with no data)
    "2025-02-13": "excused",
    "2025-02-14": "present",
    "2025-02-15": "present", // Weekend with data
    "2025-02-16": "absent", // Weekend with data
    "2025-02-17": "present",
    "2025-02-18": "present",
    "2025-02-19": "absent",
    "2025-02-20": "present",
    "2025-02-21": "present",
    "2025-02-24": "present",
    "2025-02-25": "present",
    "2025-02-26": "present",
    "2025-02-27": "present",
    "2025-02-28": "absent",
    "2025-03-03": "present",
    "2025-03-04": "present",
    "2025-03-05": "present",
    "2025-03-06": "absent",
    "2025-03-07": "present",
    "2025-03-10": "present",
    "2025-03-11": "present",
    "2025-03-12": "present",
    "2025-03-13": "present",
    "2025-03-14": "present",
    "2025-03-17": "present",
    "2025-03-18": "present",
    "2025-03-19": "present",
    "2025-03-20": "present",
  };

  const total =
    attendanceData.present +
    attendanceData.absent +
    attendanceData.excusedAbsent;
  const presentPercentage = (attendanceData.present / total) * 100;
  const absentPercentage = (attendanceData.absent / total) * 100;
  const excusedPercentage = (attendanceData.excusedAbsent / total) * 100;

  return (
    <div className="attendanceOverview">
      <div className="title_con">
        <p className="title">Attendance Overview</p>
        <p className="title_sem">2025-2026 semester / first term</p>
      </div>

      <div className="chartContainer">
        <div className="circularChart">
          <svg width="120" height="120" viewBox="0 0 42 42" className="donut">
            <circle
              className="donut-hole"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
            />
            <circle
              className="donut-ring"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#f0f0f0"
              strokeWidth="3"
            />
            <circle
              className="donut-segment present"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={`${presentPercentage} ${
                100 - presentPercentage
              }`}
              strokeDashoffset="25"
            />
            <circle
              className="donut-segment absent"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray={`${absentPercentage} ${100 - absentPercentage}`}
              strokeDashoffset={`${25 - presentPercentage}`}
            />
            <circle
              className="donut-segment excused"
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeDasharray={`${excusedPercentage} ${
                100 - excusedPercentage
              }`}
              strokeDashoffset={`${25 - presentPercentage - absentPercentage}`}
            />
          </svg>
          <div className="chartCenter">
            <div className="totalDays">{total}</div>
            <div className="totalLabel">Days</div>
          </div>
        </div>

        <div className="chartLegend">
          <div className="legendItem">
            <div className="legendDot present"></div>
            <span className="legendLabel">Present</span>
            <span className="legendValue">{attendanceData.present}</span>
          </div>
          <div className="legendItem">
            <div className="legendDot absent"></div>
            <span className="legendLabel">Absent</span>
            <span className="legendValue">{attendanceData.absent}</span>
          </div>
          <div className="legendItem">
            <div className="legendDot excused"></div>
            <span className="legendLabel">Excused</span>
            <span className="legendValue">{attendanceData.excusedAbsent}</span>
          </div>
        </div>
      </div>

      <AttendanceCalendar
        startDate="2025-01-25"
        endDate="2025-03-20"
        attendanceData={attendanceRecords}
      />
    </div>
  );
};

export default AttendanceOverview;
