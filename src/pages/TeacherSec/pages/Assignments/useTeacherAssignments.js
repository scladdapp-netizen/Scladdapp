import { useState, useEffect } from "react";
import useStaffAssignments from "../../../../api_call/useStaffAssignments";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Fetches both subject teacher and class headmaster assignments
 * for the logged-in teacher/staff member.
 */
const useTeacherAssignments = (staffId, schoolId) => {
  const {
    teacherAssignment,
    headmasterAssignments,
    loading: assignmentsLoading,
    error,
    refetch,
  } = useStaffAssignments(staffId, schoolId);

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    const teacherId = teacherAssignment?.teacher_id;
    if (!teacherId) {
      setSubjects([]);
      return;
    }
    setSubjectsLoading(true);
    fetch(`${API}/teacher-subject/teacher/${teacherId}?limit=100`)
      .then((r) => r.json())
      .then((res) => setSubjects(res.success ? res.data : []))
      .catch(() => setSubjects([]))
      .finally(() => setSubjectsLoading(false));
  }, [teacherAssignment?.teacher_id]);

  return {
    teacherAssignment,
    subjects,
    headmasterAssignments,
    loading: assignmentsLoading,
    subjectsLoading,
    error,
    refetch,
  };
};

export default useTeacherAssignments;
