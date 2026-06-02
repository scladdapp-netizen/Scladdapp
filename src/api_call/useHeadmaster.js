const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for headmaster operations
 */
export const useHeadmaster = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Assign headmaster to a class
   */
  const assignHeadmaster = async (assignmentData) => {
    try {
      console.log("Assigning headmaster with data:", assignmentData);

      const response = await fetch(`${API_BASE_URL}/headmaster`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      });

      const result = await handleApiResponse(response);
      console.log("Assign headmaster response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Headmaster assigned successfully",
      };
    } catch (err) {
      console.error("Assign headmaster error:", err);
      const errorMessage = err.message || "Failed to assign headmaster";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get active headmaster for a class
   */
  const getActiveHeadmasterByClassId = async (classId) => {
    try {
      console.log("Fetching active headmaster for class ID:", classId);

      if (!classId) {
        throw new Error("Class ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/headmaster/class/${classId}/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get active headmaster response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Active headmaster retrieved successfully",
      };
    } catch (err) {
      console.error("Get active headmaster error:", err);
      const errorMessage = err.message || "Failed to fetch active headmaster";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get all headmaster assignments for a class (including history)
   */
  const getHeadmastersByClassId = async (classId) => {
    try {
      console.log("Fetching headmasters for class ID:", classId);

      if (!classId) {
        throw new Error("Class ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/headmaster/class/${classId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get headmasters response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Headmasters retrieved successfully",
      };
    } catch (err) {
      console.error("Get headmasters error:", err);
      const errorMessage = err.message || "Failed to fetch headmasters";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get all active headmasters by school ID
   */
  const getActiveHeadmastersBySchoolId = async (schoolId) => {
    try {
      console.log("Fetching active headmasters for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/headmaster/school/${schoolId}/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get active headmasters response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Active headmasters retrieved successfully",
      };
    } catch (err) {
      console.error("Get active headmasters error:", err);
      const errorMessage = err.message || "Failed to fetch active headmasters";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Remove headmaster (deactivate assignment)
   */
  const removeHeadmaster = async (assignmentId) => {
    try {
      console.log("Removing headmaster with assignment ID:", assignmentId);

      if (!assignmentId) {
        throw new Error("Assignment ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/headmaster/${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Remove headmaster response:", result);

      return {
        success: true,
        message: result.message || "Headmaster removed successfully",
      };
    } catch (err) {
      console.error("Remove headmaster error:", err);
      const errorMessage = err.message || "Failed to remove headmaster";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    assignHeadmaster,
    getActiveHeadmasterByClassId,
    getHeadmastersByClassId,
    getActiveHeadmastersBySchoolId,
    removeHeadmaster,
  };
};
