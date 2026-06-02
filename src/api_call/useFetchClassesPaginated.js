import { useState } from "react";

const useFetchClassesPaginated = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getClassesPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        searchField = "",
        sortBy = "created_at",
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
        `http://localhost:3000/class/school/${schoolId}/paginated?${queryParams}`
      );

      const result = await response.json();
      setLoading(false);

      if (!result.success) {
        setError(result.message || "Failed to fetch classes");
      }

      return result;
    } catch (err) {
      console.error("Fetch paginated classes error:", err);
      setError(err.message || "Failed to fetch classes");
      setLoading(false);
      return {
        success: false,
        error: err.message,
        message: "Failed to fetch classes",
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    getClassesPaginated,
    clearError,
  };
};

export default useFetchClassesPaginated;
