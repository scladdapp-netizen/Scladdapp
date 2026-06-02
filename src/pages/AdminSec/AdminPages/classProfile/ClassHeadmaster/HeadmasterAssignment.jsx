import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import { useHeadmaster } from "../../../../../api_call/useHeadmaster";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import "./HeadmasterAssignment.css";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const HeadmasterAssignment = ({
  className,
  classId,
  onClose,
  onSave,
  currentHeadmaster = null,
}) => {
  const { schoolId } = useParams();
  const { assignHeadmaster } = useHeadmaster();
  const { addNotification } = useNotification();

  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [assignmentReason, setAssignmentReason] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    setLoadingTeachers(true);
    fetch(`${API_BASE_URL}/teacher/school/${schoolId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setTeachers(res.data || []);
        else addNotification("Failed to load teachers", "error");
      })
      .catch(() => addNotification("Failed to load teachers", "error"))
      .finally(() => setLoadingTeachers(false));
  }, [schoolId]);

  const teacherOptions = teachers.map((t) => ({
    value: t.teacher_id,
    label: t.staff?.full_name || "Unknown",
    subtitle: `${t.staff?.job_title || t.staff?.position || "Teacher"}${
      t.staff?.department ? " • " + t.staff.department : ""
    }`,
  }));

  const getSelectedTeacherInfo = () =>
    teachers.find((t) => t.teacher_id === selectedTeacher);

  const handleAssign = async () => {
    if (!selectedTeacher || !assignmentReason.trim()) {
      addNotification(
        "Please select a teacher and provide an assignment reason.",
        "error"
      );
      return;
    }
    setSubmitting(true);
    const result = await assignHeadmaster({
      class_id: classId,
      teacher_id: selectedTeacher,
      school_id: schoolId,
      notes: assignmentReason,
      start_date: new Date().toISOString().split("T")[0],
    });
    setSubmitting(false);
    if (result.success) {
      addNotification(
        result.message || "Headmaster assigned successfully",
        "success"
      );
      if (onSave) onSave();
    } else {
      addNotification(
        result.message || "Failed to assign headmaster",
        "error"
      );
    }
  };

  const isFormComplete = selectedTeacher && assignmentReason.trim();
  const teacher = getSelectedTeacherInfo();

  return (
    <div className="headmaster-assignment">
      <div className="ha-header">
        <span className="ha-header-deco" aria-hidden="true" />
        <div className="ha-header-content">
          <div className="ha-header-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h2 className="ha-title">Assign New Headmaster</h2>
            <p className="ha-subtitle">Select a teacher for {className}</p>
          </div>
        </div>
      </div>

      {currentHeadmaster && (
        <div className="ha-current-notice">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>
            Assigning a new headmaster will deactivate <strong>{currentHeadmaster.fullName}</strong> as the current headmaster.
          </span>
        </div>
      )}

      <div className="ha-content">
        <div className="ha-form-section">
          <label className="ha-form-label">Select Teacher</label>
          {loadingTeachers ? (
            <p style={{ color: "#888888", fontSize: 13, margin: 0 }}>Loading teachers...</p>
          ) : (
            <SearchableSelect
              placeholder="Search and select a teacher..."
              options={teacherOptions}
              value={selectedTeacher}
              onChange={setSelectedTeacher}
              displayKey="label"
              valueKey="value"
              searchKeys={["label", "subtitle"]}
              maxDisplayItems={6}
            />
          )}
        </div>

        {selectedTeacher && teacher && (
          <div className="ha-selected-teacher">
            <span className="ha-selected-title">Selected Teacher</span>
            <div className="ha-teacher-card">
              <div className="ha-teacher-header">
                <div className="ha-teacher-avatar">
                  {teacher.staff?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="ha-teacher-main">
                  <h5 className="ha-teacher-name">{teacher.staff?.full_name}</h5>
                  <p className="ha-teacher-title">
                    {teacher.staff?.job_title || teacher.staff?.position || "Teacher"}
                  </p>
                  {teacher.staff?.department && (
                    <p className="ha-teacher-department">{teacher.staff.department}</p>
                  )}
                </div>
                <div className="ha-teacher-meta">
                  {teacher.staff?.employment_type && (
                    <span className="ha-teacher-experience">{teacher.staff.employment_type}</span>
                  )}
                  <span className="ha-teacher-id">{teacher.teacher_id}</span>
                </div>
              </div>
              <div className="ha-teacher-contact">
                {teacher.staff?.email && (
                  <div className="ha-contact-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.7"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.7"/>
                    </svg>
                    <span>{teacher.staff.email}</span>
                  </div>
                )}
                {teacher.staff?.phone && (
                  <div className="ha-contact-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.08 6.08l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.7"/>
                    </svg>
                    <span>{teacher.staff.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="ha-form-section">
          <label className="ha-form-label">Assignment Reason / Notes *</label>
          <textarea
            value={assignmentReason}
            onChange={(e) => setAssignmentReason(e.target.value)}
            placeholder="Provide a reason for this headmaster assignment..."
            className="ha-form-textarea"
            rows={4}
          />
        </div>
      </div>

      <div className="ha-actions">
        <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button onClick={handleAssign} disabled={!isFormComplete || submitting}>
          {submitting ? "Assigning..." : "Assign Headmaster"}
        </Button>
      </div>
    </div>
  );
};

export default HeadmasterAssignment;
