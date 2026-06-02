import { useState } from "react";

const useFetchAdminsPaginated = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAdminsPaginated = async (schoolId, params = {}) => {
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
        `${import.meta.env.VITE_API_BASE_URL}/admin/school/${schoolId}/paginated?${queryParams}`
      );

      const result = await response.json();
      setLoading(false);

      if (!result.success) {
        setError(result.message || "Failed to fetch admins");
      }

      return result;
    } catch (err) {
      console.error("Fetch paginated admins error:", err);
      setError(err.message || "Failed to fetch admins");
      setLoading(false);
      return {
        success: false,
        error: err.message,
        message: "Failed to fetch admins",
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    getAdminsPaginated,
    clearError,
  };
};

export default useFetchAdminsPaginated;
