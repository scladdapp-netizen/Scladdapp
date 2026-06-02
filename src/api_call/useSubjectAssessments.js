import { useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/student-report`;

export const useSubjectAssessments = (subjectId, subsessionId, modifiedBy = null) => {
  const fetchScores = useCallback(
    async ({ page = 1, limit = 20, search = "" } = {}) => {
      const params = new URLSearchParams({ page, limit, search });
      const res = await fetch(
        `${BASE}/subject/${subjectId}/subsession/${subsessionId}/scores?${params}`
      );
      return await res.json();
    },
    [subjectId, subsessionId]
  );

  const updateScore = useCallback(
    async (studentId, scores) => {
      try {
        const res = await fetch(
          `${BASE}/student/${studentId}/subsession/${subsessionId}/subject/${subjectId}/scores`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scores, modified_by: modifiedBy }),
          }
        );
        return await res.json();
      } catch (err) {
        return { success: false, message: err.message };
      }
    },
    [subjectId, subsessionId, modifiedBy]
  );

  const createScore = useCallback(
    async (studentId, scores) => {
      try {
        const res = await fetch(
          `${BASE}/student/${studentId}/subsession/${subsessionId}/subject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject_id: subjectId, scores, modified_by: modifiedBy }),
          }
        );
        return await res.json();
      } catch (err) {
        return { success: false, message: err.message };
      }
    },
    [subjectId, subsessionId, modifiedBy]
  );

  return { fetchScores, updateScore, createScore };
};
