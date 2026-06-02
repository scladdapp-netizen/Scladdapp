import { useState, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}`;

export function useClassAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAttendance = useCallback(async (classId, subsessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE}/api/class-attendance/${classId}/subsession/${subsessionId}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load attendance");
      return json.data; // { students: [...], subsession: {...} }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAttendanceChange = useCallback(
    async ({ studentId, date, status, schoolId, classId, sessionId, subsessionId }) => {
      try {
        const res = await fetch(`${BASE}/api/student-attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: studentId,
            school_id: schoolId,
            class_id: classId,
            session_id: sessionId,
            subsession_id: subsessionId,
            attendance_date: date,
            status,
            marked_by: "admin",
          }),
        });
        const json = await res.json();
        return json.success;
      } catch {
        return false;
      }
    },
    []
  );

  return { loading, error, loadAttendance, saveAttendanceChange };
}
