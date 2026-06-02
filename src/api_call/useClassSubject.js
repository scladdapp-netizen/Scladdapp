const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for class-subject assignment operations
 */
export const useClassSubject = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Get active class-subject assignments by school ID
   */
  const getActiveClassSubjectAssignmentsBySchool = async (schoolId) => {
    try {
      console.log(
        "Fetching active class-subject assignments for school ID:",
        schoolId
      );

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-subject/school/${schoolId}/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get active class-subject assignments response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Active assignments retrieved successfully",
      };
    } catch (err) {
      console.error("Get active class-subject assignments error:", err);
      const errorMessage = err.message || "Failed to fetch active assignments";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    getActiveClassSubjectAssignmentsBySchool,
  };
};
