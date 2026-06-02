const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for fetching subjects with server-side pagination
 */
const useFetchSubjectsPaginated = () => {
  /**
   * Get subjects with pagination, search, and sorting
   */
  const getSubjectsPaginated = async (schoolId, params = {}) => {
    try {
      console.log("Fetching paginated subjects for school:", schoolId);
      console.log("Params:", params);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      // Build query string
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.search) queryParams.append("search", params.search);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}/subject/school/${schoolId}/paginated?${queryParams.toString()}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log("Paginated subjects response:", result);

      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: result.message || "Subjects retrieved successfully",
      };
    } catch (err) {
      console.error("Get paginated subjects error:", err);
      return {
        success: false,
        error: err.message || "Failed to fetch subjects",
        message: err.message || "Failed to fetch subjects",
      };
    }
  };

  return {
    getSubjectsPaginated,
  };
};

export default useFetchSubjectsPaginated;
