const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for teacher operations
 */
export const useTeacher = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Get all teachers by school ID
   */
  const getTeachersBySchoolId = async (schoolId) => {
    try {
      console.log("Fetching teachers for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get teachers response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Teachers retrieved successfully",
      };
    } catch (err) {
      console.error("Get teachers error:", err);
      const errorMessage = err.message || "Failed to fetch teachers";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get teacher by ID
   */
  const getTeacherById = async (teacherId) => {
    try {
      console.log("Fetching teacher with ID:", teacherId);

      if (!teacherId) {
        throw new Error("Teacher ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get teacher response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher retrieved successfully",
      };
    } catch (err) {
      console.error("Get teacher error:", err);
      const errorMessage = err.message || "Failed to fetch teacher";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    getTeachersBySchoolId,
    getTeacherById,
  };
};
