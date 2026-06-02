import { useState, useEffect } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import Button from "../../../../../components/Button/Button";
import "./MarkAttendancePanel.css";

const STATUSES = ["present", "absent", "excused"];
const STATUS_LABEL = { present: "Present", absent: "Absent", excused: "Excused" };

/**
 * Props:
 * - isOpen: bool
 * - onClose: fn
 * - subsessionInfo: { term_start_date, term_end_date, term_name, session_id }
 * - students: [{ id, name }]  — the class student list
 * - schoolId, classId, subsessionId
 * - onSaved: fn() — called after successful save so parent can reload
 * - saveAttendanceChange: fn from useClassAttendance
 */
const MarkAttendancePanel = ({
  isOpen,
  onClose,
  subsessionInfo,
  students = [],
  schoolId,
  classId,
  subsessionId,
  onSaved,
  saveAttendanceChange,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const minDate = subsessionInfo?.term_start_date || today;
  const maxDate = subsessionInfo?.term_end_date || today;

  // clamp default date to subsession range
  const defaultDate = today >= minDate && today <= maxDate ? today : minDate;

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [records, setRecords] = useState({}); // { studentId: status }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // When panel opens or date changes, load existing attendance for that day
  useEffect(() => {
    if (!isOpen || !selectedDate || !subsessionId) return;
    fetchDayAttendance(selectedDate);
  }, [isOpen, selectedDate, subsessionId]);

  // Reset date when panel opens
  useEffect(() => {
    if (isOpen) {
      const d = today >= minDate && today <= maxDate ? today : minDate;
      setSelectedDate(d);
      setError(null);
    }
  }, [isOpen]);

  const fetchDayAttendance = async (date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/class-attendance/${classId}/subsession/${subsessionId}/date/${date}`
      );
      const json = await res.json();
      if (json.success) {
        // Build map from returned records
        const map = {};
        // Pre-fill all students as empty (unmarked)
        students.forEach((s) => { map[s.id] = ""; });
        // Overlay existing records
        json.data.forEach((r) => { map[r.student_id] = r.status; });
        setRecords(map);
      } else {
        // No records yet — just blank out all students
        const map = {};
        students.forEach((s) => { map[s.id] = ""; });
        setRecords(map);
      }
    } catch {
      const map = {};
      students.forEach((s) => { map[s.id] = ""; });
      setRecords(map);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleStatusChange = (studentId, status) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const map = {};
    students.forEach((s) => { map[s.id] = status; });
    setRecords(map);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const promises = students
        .filter((s) => records[s.id]) // only save marked ones
        .map((s) =>
          saveAttendanceChange({
            studentId: s.id,
            date: selectedDate,
            status: records[s.id],
            schoolId,
            classId,
            sessionId: subsessionInfo?.session_id,
            subsessionId,
          })
        );
      await Promise.all(promises);
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setError("Failed to save some records. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const markedCount = students.filter((s) => records[s.id]).length;

  return (
    <SlideInMenu isShow={isOpen} onClose={onClose} position="rightt" width="480px">
      <div className="map_panel">
        {/* Header */}
        <div className="map_header">
          <span className="map_header_deco" aria-hidden="true" />
          <div className="map_header_top">
            <div className="map_header_icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="map_header_text">
              <h2 className="map_title">Mark Attendance</h2>
              {subsessionInfo && (
                <p className="map_subtitle">
                  {subsessionInfo.term_name} · {subsessionInfo.term_start_date} – {subsessionInfo.term_end_date}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Date picker */}
        <div className="map_date_row">
          <label className="map_date_label">Select Date</label>
          <input
            type="date"
            className="map_date_input"
            value={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={handleDateChange}
          />
        </div>

        {/* Quick mark all */}
        <div className="map_bulk_row">
          <span className="map_bulk_label">Mark all as:</span>
          <div className="map_bulk_btns">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`map_bulk_btn map_bulk_${s}`}
                onClick={(e) => { e.stopPropagation(); handleMarkAll(s); }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Student list */}
        <div className="map_list_container">
          {loading ? (
            <LoadingData message="Loading attendance..." />
          ) : (
            <div className="map_list">
              {students.length === 0 && (
                <p className="map_empty">No students in this class.</p>
              )}
              {students.map((student) => (
                <div key={student.id} className="map_row">
                  <div className="map_student_info">
                    <span className="map_student_name">{student.name}</span>
                    <span className="map_student_id">{student.id}</span>
                  </div>
                  <div className="map_status_btns">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`map_status_btn map_status_${s} ${
                          records[student.id] === s ? "map_status_active" : ""
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(student.id, s); }}
                      >
                        {s === "present" ? "P" : s === "absent" ? "A" : "E"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="map_footer">
          <div className="map_footer_info">
            {markedCount} / {students.length} marked
          </div>
          {error && <p className="map_error">{error}</p>}
          <div className="map_footer_actions">
            <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        </div>
      </div>
    </SlideInMenu>
  );
};

export default MarkAttendancePanel;
