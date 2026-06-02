import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Fetches a single teacher-subject assignment by assignmentId.
 * Returns { assignment, loading }
 */
const useTeacherSubjectAssignment = (assignmentId) => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading]       = useState(!!assignmentId);

  useEffect(() => {
    if (!assignmentId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/teacher-subject/assignment/${assignmentId}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setAssignment(res.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assignmentId]);

  return { assignment, loading };
};

export default useTeacherSubjectAssignment;
