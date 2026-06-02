const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useClassStudents = () => {
  /**
   * Returns a fetchData function compatible with ServerSmartTable.
   * Calls GET /api/class-students/:classId/subsession/:subsessionId
   */
  const makeClassStudentsFetcher = (classId, subsessionId) => {
    return async ({ page = 1, limit = 20, search = "", searchField = "" }) => {
      try {
        const params = new URLSearchParams({ page, limit });
        if (search) params.set("search", search);
        if (searchField) params.set("searchField", searchField);

        const res = await fetch(
          `${API_BASE_URL}/api/class-students/${classId}/subsession/${subsessionId}?${params}`
        );
        const data = await res.json();
        return data; // already has { success, data, pagination }
      } catch (err) {
        console.error("useClassStudents error:", err);
        return { success: false, message: err.message || "Failed to load students" };
      }
    };
  };

  return { makeClassStudentsFetcher };
};

export default useClassStudents;
