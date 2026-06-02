import { useState, useEffect } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStaffAssignments = (staffId, schoolId) => {
  const [teacherAssignment, setTeacherAssignment] = useState(null);
  const [adminAssignment, setAdminAssignment] = useState(null);
  const [headmasterAssignments, setHeadmasterAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = async () => {
    if (!staffId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    try {
      const [teacherRes, adminRes] = await Promise.allSettled([
        schoolId
          ? fetch(`${API_BASE_URL}/teacher/staff/${staffId}/school/${schoolId}`)
          : Promise.resolve(null),
        fetch(`${API_BASE_URL}/admin/staff/${staffId}`),
      ]);

      // Teacher
      if (teacherRes.status === "fulfilled" && teacherRes.value?.ok) {
        const data = await teacherRes.value.json();
        const teacher = data.success ? data.data : null;
        setTeacherAssignment(teacher);

        // If teacher exists, fetch headmaster assignments by teacher_id
        if (teacher?.teacher_id) {
          try {
            const hmRes = await fetch(`${API_BASE_URL}/headmaster/teacher/${teacher.teacher_id}`);
            if (hmRes.ok) {
              const hmData = await hmRes.json();
              setHeadmasterAssignments(hmData.success ? hmData.data : []);
            }
          } catch {
            setHeadmasterAssignments([]);
          }
        } else {
          setHeadmasterAssignments([]);
        }
      } else {
        setTeacherAssignment(null);
        setHeadmasterAssignments([]);
      }

      // Admin
      if (adminRes.status === "fulfilled" && adminRes.value?.ok) {
        const data = await adminRes.value.json();
        setAdminAssignment(data.success ? data.data : null);
      } else {
        setAdminAssignment(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [staffId, schoolId]);

  return { teacherAssignment, adminAssignment, headmasterAssignments, loading, error, refetch: fetchAssignments };
};

export default useStaffAssignments;
