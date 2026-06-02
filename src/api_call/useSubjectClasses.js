import { useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useSubjectClasses = () => {
  const getClassesBySubject = useCallback(async (subjectId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/by-subject/${subjectId}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const getAllClasses = useCallback(async (schoolId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/class/school/${schoolId}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const assignClassToSubject = useCallback(async ({ subject_id, class_id, school_id }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject_id, class_id, school_id }),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const deactivateClassAssignment = useCallback(async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${assignmentId}/deactivate`, {
        method: "PATCH",
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const deleteClassAssignment = useCallback(async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${assignmentId}`, {
        method: "DELETE",
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const restoreClassAssignment = useCallback(async (assignmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${assignmentId}/restore`, {
        method: "PATCH",
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  return { getClassesBySubject, getAllClasses, assignClassToSubject, deactivateClassAssignment, deleteClassAssignment, restoreClassAssignment };
};

export default useSubjectClasses;
