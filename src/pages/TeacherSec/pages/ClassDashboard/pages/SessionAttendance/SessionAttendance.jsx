import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import { useClassAttendance } from "../../../../../../api_call/useClassAttendance";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "./SessionAttendance.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

const STATUS = {
  present: { bg: "#dcfce7", color: "#166534", label: "P" },
  absent:  { bg: "#fecaca", color: "#991b1b", label: "A" },
  excused: { bg: "#fef3c7", color: "#92400e", label: "E" },
};

const getWeekdays = (start, end) => {
  const days = [];
  const cur  = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return days;
};

const SessionAttendance = () => {
  const { classId, schoolId } = useParams();
  const location   = useLocation();
  const subseasion = location.state?.subseasion;
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { loading, loadAttendance } = useClassAttendance();

  const markedBy = user?.staff?.staff_id || user?.admin?.admin_id || user?.user_id;

  const [data, setData]           = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [markDate, setMarkDate]   = useState("");
  const [statuses, setStatuses]   = useState({});
  const [saving, setSaving]       = useState(false);

  const load = () => loadAttendance(classId, subseasion).then(setData);
  useEffect(() => { if (classId && subseasion) load(); }, [classId, subseasion]);

  const students   = data?.students || [];
  const subsession = data?.subsession;
  const startDate  = subsession?.term_start_date;
  const endDate    = subsession?.term_end_date;
  const weekdays   = startDate && endDate ? getWeekdays(startDate, endDate) : [];

  const openMarkPanel = () => {
    const today = new Date().toISOString().split("T")[0];
    const defaultDate = today >= startDate && today <= endDate ? today : endDate || today;
    setMarkDate(defaultDate);
    const initial = {};
    students.forEach((s) => { initial[s.id] = s.attendance?.[defaultDate] || "present"; });
    setStatuses(initial);
    setPanelOpen(true);
  };

  const handleDateChange = (date) => {
    setMarkDate(date);
    const initial = {};
    students.forEach((s) => { initial[s.id] = s.attendance?.[date] || "present"; });
    setStatuses(initial);
  };

  const handleSave = async () => {
    if (!markDate) return addNotification("Please select a date", "error");
    if (!subsession?.session_id) return addNotification("Session info missing", "error");
    setSaving(true);
    let successCount = 0;
    for (const student of students) {
      const status = statuses[student.id];
      if (!status) continue;
      try {
        const res = await fetch(`${API}/api/student-attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: student.id, school_id: schoolId || "",
            class_id: classId, session_id: subsession.session_id,
            subsession_id: subseasion, attendance_date: markDate,
            status, marked_by: markedBy,
          }),
        });
        const result = await res.json();
        if (result.success) successCount++;
      } catch (_) {}
    }
    setSaving(false);
    if (successCount > 0) {
      addNotification(`Attendance saved for ${successCount} student(s)`, "success");
      setPanelOpen(false);
      load();
    } else {
      addNotification("Failed to save attendance", "error");
    }
  };

  return (
    <InnerTabCon>
      <div className="classStudents">
        {/* Header */}
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Attendance</h2>
            <p className="cls-subtitle">
              {subsession?.term_name
                ? `${subsession.term_name} · ${startDate} – ${endDate}`
                : "Select a subsession to view attendance"}
            </p>
          </div>
          {students.length > 0 && (
            <Button onClick={openMarkPanel}>Mark Attendance</Button>
          )}
        </div>

        {loading ? (
          <LoadingData message="Loading attendance..." />
        ) : students.length === 0 ? (
          <div className="cls-empty">
            <p>No students found for this subsession.</p>
          </div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr className="sa-thead-row">
                  <th className="sa-th sa-th-sticky">Student</th>
                  {weekdays.map((d) => (
                    <th key={d} className="sa-th sa-th-day">{d.slice(5)}</th>
                  ))}
                  <th className="sa-th sa-th-stat">P</th>
                  <th className="sa-th sa-th-stat">A</th>
                  <th className="sa-th sa-th-stat">E</th>
                  <th className="sa-th sa-th-stat">Rate</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => {
                  const att     = s.attendance || {};
                  const present = Object.values(att).filter((v) => v === "present").length;
                  const absent  = Object.values(att).filter((v) => v === "absent").length;
                  const excused = Object.values(att).filter((v) => v === "excused").length;
                  const total   = present + absent + excused;
                  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;
                  return (
                    <tr key={s.id} className={`sa-row ${i % 2 === 0 ? "" : "alt"}`}>
                      <td className="sa-td sa-td-sticky sa-td-name">{s.name}</td>
                      {weekdays.map((d) => {
                        const status = att[d];
                        const st     = status ? STATUS[status] : null;
                        return (
                          <td key={d} className="sa-td sa-td-day">
                            {st ? (
                              <span className="sa-dot" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                            ) : (
                              <span className="sa-dot-empty">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="sa-td sa-td-stat">
                        <span className="sa-stat present">{present}</span>
                      </td>
                      <td className="sa-td sa-td-stat">
                        <span className="sa-stat absent">{absent}</span>
                      </td>
                      <td className="sa-td sa-td-stat">
                        <span className="sa-stat excused">{excused}</span>
                      </td>
                      <td className="sa-td sa-td-stat">
                        <span className={`sa-rate ${rate >= 75 ? "good" : "bad"}`}>
                          {total > 0 ? `${rate}%` : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Attendance Panel */}
      <SlideInMenu isShow={panelOpen} onClose={() => setPanelOpen(false)} width="520px">
        <div className="cs-panel">
          <div className="cs-panel-header default">
            <span className="cs-panel-header-deco" aria-hidden="true" />
            <div className="cs-panel-header-content">
              <div className="cs-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="cs-panel-header-text">
                <h2>Mark Attendance</h2>
                <p>{subsession?.term_name} · {startDate} – {endDate}</p>
              </div>
            </div>
          </div>

          <div className="cs-panel-body">
            <div className="sa-date-field">
              <label className="sa-date-label">Date *</label>
              <input
                type="date"
                value={markDate}
                min={startDate}
                max={endDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="sa-date-input"
              />
            </div>

            <div className="sa-student-list">
              {students.map((s) => (
                <div key={s.id} className="sa-student-row">
                  <span className="sa-student-row-name">{s.name}</span>
                  <div className="sa-status-btns">
                    {["present", "absent", "excused"].map((st) => (
                      <button
                        key={st}
                        className={`sa-status-btn ${statuses[s.id] === st ? "selected" : ""}`}
                        style={statuses[s.id] === st
                          ? { background: STATUS[st].bg, color: STATUS[st].color, borderColor: STATUS[st].color }
                          : {}}
                        onClick={() => setStatuses((p) => ({ ...p, [s.id]: st }))}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cs-panel-footer">
            <Button variant="secondary" onClick={() => setPanelOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SessionAttendance;
