const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useTeacherSubjects = () => {
  /**
   * Returns a fetchData function compatible with ServerSmartTable.
   * Calls GET /teacher-subject/teacher/:teacherId
   */
  const makeTeacherSubjectsFetcher = (teacherId, history = false) => {
    return async ({ page = 1, limit = 20, search = "" }) => {
      try {
        const params = new URLSearchParams({ page, limit, history: history ? "true" : "false" });
        if (search) params.set("search", search);

        const res = await fetch(
          `${API_BASE_URL}/teacher-subject/teacher/${teacherId}?${params}`
        );
        const data = await res.json();
        return data; // { success, data, pagination }
      } catch (err) {
        console.error("useTeacherSubjects error:", err);
        return { success: false, message: err.message || "Failed to load subjects" };
      }
    };
  };

  return { makeTeacherSubjectsFetcher };
};

export default useTeacherSubjects;
