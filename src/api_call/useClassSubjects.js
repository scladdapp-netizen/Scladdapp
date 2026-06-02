const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useClassSubjects = () => {
  const makeClassSubjectsFetcher = (classId) => {
    return async ({ page = 1, limit = 20, search = "", searchField = "" }) => {
      try {
        const params = new URLSearchParams({ page, limit });
        if (search) params.set("search", search);
        if (searchField) params.set("searchField", searchField);
        const res = await fetch(`${API_BASE_URL}/api/class-subjects/${classId}?${params}`);
        const data = await res.json();
        return data;
      } catch (err) {
        return { success: false, message: err.message || "Failed to load subjects" };
      }
    };
  };

  // Fetch all subjects for a class (no pagination)
  const getAllByClass = async (classId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/class-subjects/${classId}?limit=200`);
      const data = await res.json();
      return data.success ? { success: true, data: data.data || [] } : { success: false, data: [] };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  };

  return { makeClassSubjectsFetcher, getAllByClass };
};

export default useClassSubjects;
