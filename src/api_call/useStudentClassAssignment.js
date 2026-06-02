import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Fetches the active class assignment for a student in a given session.
 * Also fetches the class detail (headmaster, subjects count, etc.)
 */
const useStudentClassAssignment = (studentId, sessionId) => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!studentId || !sessionId) { setLoading(false); return; }

    setLoading(true);
    setError(null);

    fetch(`${API}/api/student-class-assignment/student/${studentId}/session/${sessionId}/active`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAssignment(res.data);
        else setError(res.message || "No active assignment found");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [studentId, sessionId]);

  return { assignment, loading, error };
};

export default useStudentClassAssignment;
