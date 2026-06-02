import { useState } from "react";

const useFetchTeachersPaginated = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getTeachersPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        searchField = "",
        sortBy = "appointed_at",
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
        `http://localhost:3000/teacher/school/${schoolId}/paginated?${queryParams}`
      );

      const result = await response.json();
      setLoading(false);

      if (!result.success) {
        setError(result.message || "Failed to fetch teachers");
      }

      return result;
    } catch (err) {
      console.error("Fetch paginated teachers error:", err);
      setError(err.message || "Failed to fetch teachers");
      setLoading(false);
      return {
        success: false,
        error: err.message,
        message: "Failed to fetch teachers",
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    getTeachersPaginated,
    clearError,
  };
};

export default useFetchTeachersPaginated;
