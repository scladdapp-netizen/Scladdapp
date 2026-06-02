const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for subsession (term) operations
 */
export const useSubsession = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Create a new subsession
   */
  const createSubsession = async (subsessionData) => {
    try {
      console.log("Creating subsession with data:", subsessionData);

      const response = await fetch(`${API_BASE_URL}/subsession`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subsessionData),
      });

      const result = await handleApiResponse(response);
      console.log("Create subsession response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsession created successfully",
      };
    } catch (err) {
      console.error("Create subsession error:", err);
      const errorMessage = err.message || "Failed to create subsession";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get subsessions by session ID
   */
  const getSubsessionsBySessionId = async (sessionId) => {
    try {
      console.log("Fetching subsessions for session ID:", sessionId);

      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/subsession/session/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get subsessions response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsessions retrieved successfully",
      };
    } catch (err) {
      console.error("Get subsessions error:", err);
      const errorMessage = err.message || "Failed to fetch subsessions";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get subsessions by school ID
   */
  const getSubsessionsBySchoolId = async (schoolId) => {
    try {
      console.log("Fetching subsessions for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/subsession/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get subsessions response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsessions retrieved successfully",
      };
    } catch (err) {
      console.error("Get subsessions error:", err);
      const errorMessage = err.message || "Failed to fetch subsessions";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get subsession by ID
   */
  const getSubsessionById = async (termId) => {
    try {
      console.log("Fetching subsession with ID:", termId);

      if (!termId) {
        throw new Error("Term ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/subsession/${termId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get subsession response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsession retrieved successfully",
      };
    } catch (err) {
      console.error("Get subsession error:", err);
      const errorMessage = err.message || "Failed to fetch subsession";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Update subsession
   */
  const updateSubsession = async (termId, subsessionData) => {
    try {
      console.log(
        "Updating subsession with ID:",
        termId,
        "Data:",
        subsessionData
      );

      const response = await fetch(`${API_BASE_URL}/subsession/${termId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subsessionData),
      });

      const result = await handleApiResponse(response);
      console.log("Update subsession response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsession updated successfully",
      };
    } catch (err) {
      console.error("Update subsession error:", err);
      const errorMessage = err.message || "Failed to update subsession";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Update subsession status
   */
  const updateSubsessionStatus = async (termId, status, modifiedBy = null) => {
    try {
      console.log("Updating subsession status:", termId, "Status:", status);

      const response = await fetch(
        `${API_BASE_URL}/subsession/${termId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, modified_by: modifiedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update subsession status response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subsession status updated successfully",
      };
    } catch (err) {
      console.error("Update subsession status error:", err);
      const errorMessage = err.message || "Failed to update subsession status";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Delete subsession
   */
  const deleteSubsession = async (termId, deletedBy = null) => {
    try {
      console.log("Deleting subsession with ID:", termId);

      const response = await fetch(`${API_BASE_URL}/subsession/${termId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);
      console.log("Delete subsession response:", result);

      return {
        success: true,
        message: result.message || "Subsession deleted successfully",
      };
    } catch (err) {
      console.error("Delete subsession error:", err);
      const errorMessage = err.message || "Failed to delete subsession";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    createSubsession,
    getSubsessionsBySessionId,
    getSubsessionsBySchoolId,
    getSubsessionById,
    updateSubsession,
    updateSubsessionStatus,
    deleteSubsession,
  };
};
