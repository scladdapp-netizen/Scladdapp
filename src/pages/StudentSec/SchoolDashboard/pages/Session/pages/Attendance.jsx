import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useSubsession } from "../../../../../../api_call/useSubsession";
import useAttendance from "../../../../../../api_call/useAttendance";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import AttendanceCalendar from "../../../../../../pages/AdminSec/AdminPages/StudentProfile/pagesTab/AtendanceStudentInfo/AttendanceCalendar";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import "../../../../../AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../../../../../TeacherSec/pages/ClassDashboard/pages/SessionAttendance/SessionAttendance.css";

const STATS = [
  { key: "present", label: "Present",  cls: "sa-stat present" },
  { key: "absent",  label: "Absent",   cls: "sa-stat absent"  },
  { key: "excused", label: "Excused",  cls: "sa-stat excused" },
  { key: "total",   label: "Total",    cls: "sa-stat-total"   },
];

const Attendance = () => {
  const { subseasion } = useParams();
  const { user } = useAuth();
  const { getSubsessionById } = useSubsession();
  const { getAttendanceBySubsession, getAttendanceSummary } = useAttendance();

  const studentId = user?.student?.student_id;

  const [subsessionInfo, setSubsessionInfo] = useState(null);
  const [subLoading, setSubLoading]         = useState(true);
  const [attendanceData, setAttendanceData] = useState({});
  const [summary, setSummary]               = useState(null);
  const [dataLoading, setDataLoading]       = useState(false);

  useEffect(() => {
    if (!subseasion) return;
    setSubLoading(true);
    getSubsessionById(subseasion).then((res) => {
      if (res.success) setSubsessionInfo(res.data);
      setSubLoading(false);
    });
  }, [subseasion]);

  useEffect(() => {
    if (!studentId || !subseasion) return;
    setDataLoading(true);
    Promise.all([
      getAttendanceBySubsession(studentId, subseasion),
      getAttendanceSummary(studentId, subseasion),
    ]).then(([recRes, sumRes]) => {
      if (recRes.success) {
        const map = {};
        (recRes.data || []).forEach((r) => { map[r.attendance_date] = r.status; });
        setAttendanceData(map);
      }
      if (sumRes.success) setSummary(sumRes.data);
      setDataLoading(false);
    });
  }, [studentId, subseasion]);

  const loading = subLoading || dataLoading;
  if (loading) return <LoadingData message="Loading attendance..." />;

  const rate = summary?.total > 0
    ? Math.round((summary.present / summary.total) * 100)
    : 0;

  // Total days = weekdays only from start → min(today, end)
  const computeTotalDays = () => {
    if (!subsessionInfo?.term_start_date || !subsessionInfo?.term_end_date) return summary?.total ?? 0;
    const start = new Date(subsessionInfo.term_start_date);
    const end   = new Date(subsessionInfo.term_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveEnd = today < end ? today : end;
    if (effectiveEnd < start) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= effectiveEnd) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };
  const totalDays = computeTotalDays();

  return (
    <InnerTabCon>
      <div className="classStudents">
        {/* Header */}
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Attendance</h2>
            <p className="cls-subtitle">
              {subsessionInfo?.term_name}
              {subsessionInfo?.term_start_date
                ? ` · ${subsessionInfo.term_start_date} – ${subsessionInfo.term_end_date}`
                : ""}
            </p>
          </div>
        </div>

        {/* Stats + Calendar side by side */}
        {subsessionInfo?.term_start_date && subsessionInfo?.term_end_date ? (
          <div className="att-layout">
            {summary && (
              <div className="att-stats-col">
                {STATS.map(({ key, label, cls }) => (
                  <div key={key} className="att-stat-card">
                    <span className={cls}>{key === "total" ? totalDays : (summary[key] ?? 0)}</span>
                    <span className="att-stat-label">{label}</span>
                  </div>
                ))}
                <div className="att-stat-card">
                  <span className={`sa-rate ${rate >= 75 ? "good" : "bad"}`}>{rate}%</span>
                  <span className="att-stat-label">Rate</span>
                </div>
              </div>
            )}
            <div className="att-calendar-wrap">
              <AttendanceCalendar
                startDate={subsessionInfo.term_start_date}
                endDate={subsessionInfo.term_end_date}
                attendanceData={attendanceData}
                canEdit={false}
                onAttendanceChange={() => {}}
              />
            </div>
          </div>
        ) : (
          <div className="cls-empty">
            <p>No attendance records found for this subsession.</p>
          </div>
        )}
      </div>
    </InnerTabCon>
  );
};

export default Attendance;
