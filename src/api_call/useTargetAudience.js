import { useState, useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useTargetAudience = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClasses = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/class/school/${schoolId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return (data.data || []).map((c) => ({
        id: c.class_id,
        name: c.class_name,
        type: "class",
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students assigned to a class in the currently active session only
  const fetchStudentsByClass = useCallback(async (schoolId, classId) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get active session
      const sessionRes = await fetch(`${API_BASE_URL}/session/school/${schoolId}/active`);
      const sessionData = await sessionRes.json();
      if (!sessionData.success || !sessionData.data?.session) {
        return [];
      }
      const activeSessionId = sessionData.data.session.session_id;

      // 2. Get assignments for this class filtered by active session
      const assignRes = await fetch(
        `${API_BASE_URL}/api/student-class-assignment/class/${classId}?sessionId=${activeSessionId}`
      );
      const assignData = await assignRes.json();
      if (!assignData.success) return [];
      const assignments = assignData.data || [];

      // 3. Fetch each student's details
      const students = await Promise.all(
        assignments.map(async (a) => {
          try {
            const sRes = await fetch(`${API_BASE_URL}/student/${a.student_id}`);
            const sData = await sRes.json();
            const s = sData.data || sData;
            return {
              id: a.student_id,
              name: s.full_name || a.student_id,
              class: a.class_name,
              email: s.email || "",
              type: "student",
            };
          } catch {
            return { id: a.student_id, name: a.student_id, class: a.class_name, email: "", type: "student" };
          }
        })
      );

      return students;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/student/school/${schoolId}/paginated?page=1&limit=9999`
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return (data.data || []).map((s) => ({
        id: s.student_id,
        name: s.full_name,
        class: s.current_class_name || "No class assigned",
        level: s.current_class_name || "",
        email: s.email || "",
        type: "student",
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/staff/school/${schoolId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return (data.data || []).map((s) => ({
        id: s.staff_id,
        name: s.full_name,
        role: s.position || s.job_title || "",
        department: s.department || "",
        category: s.role || "support",
        email: s.email || "",
        type: "staff",
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlumni = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni/school/${schoolId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return (data.data || []).map((a) => ({
        id: a.alumni_id,
        name: a.student_name || a.alumni_id,
        graduationYear: a.graduation_date
          ? new Date(a.graduation_date).getFullYear().toString()
          : a.graduation_session_name?.match(/\d{4}/)?.[0] || "Unknown",
        graduationClass: a.final_class_name || "",
        currentOccupation: a.current_occupation || "",
        email: a.contact_email || "",
        type: "alumni",
      }));
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, fetchClasses, fetchStudentsByClass, fetchStudents, fetchStaff, fetchAlumni };
};

export default useTargetAudience;
