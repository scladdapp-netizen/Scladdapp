import { useState } from "react";

const useFetchStudentsPaginated = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStudentsPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        searchField = "",
        sortBy = "admitted_date",
        sortOrder = "desc",
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: search,
        searchField: searchField,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/student/school/${schoolId}/paginated?${queryParams}`
      );

      const result = await response.json();
      setLoading(false);

      if (!result.success) {
        setError(result.message || "Failed to fetch students");
      }

      return result;
    } catch (err) {
      console.error("Fetch paginated students error:", err);
      setError(err.message || "Failed to fetch students");
      setLoading(false);
      return {
        success: false,
        error: err.message,
        message: "Failed to fetch students",
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    getStudentsPaginated,
    clearError,
  };
};

export default useFetchStudentsPaginated;
