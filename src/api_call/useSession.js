const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useSession = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.message || `HTTP error! status: ${response.status}`;
      const fullError = data.errors
        ? `${errorMessage}\n${data.errors.join("\n")}`
        : errorMessage;
      throw new Error(fullError);
    }

    return data;
  };

  // Create a new session
  const createSession = async (sessionData) => {
    try {
      console.log("Creating session:", sessionData);

      const response = await fetch(`${API_BASE_URL}/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      const result = await handleApiResponse(response);
      console.log("Create session response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Session created successfully",
      };
    } catch (err) {
      console.error("Create session error:", err);
      const errorMessage = err.message || "Failed to create session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Get all sessions for a school
  const getSessionsBySchool = async (schoolId) => {
    try {
      console.log("Fetching sessions for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/session/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get sessions response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message: result.message || "Sessions retrieved successfully",
      };
    } catch (err) {
      console.error("Get sessions error:", err);
      const errorMessage = err.message || "Failed to fetch sessions";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Get a single session by ID
  const getSessionById = async (sessionId) => {
    try {
      console.log("Fetching session:", sessionId);

      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get session response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Session retrieved successfully",
      };
    } catch (err) {
      console.error("Get session error:", err);
      const errorMessage = err.message || "Failed to fetch session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Update a session
  const updateSession = async (sessionId, sessionData) => {
    try {
      console.log("Updating session:", sessionId, sessionData);

      if (!sessionId) {
        throw new Error("Session ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      const result = await handleApiResponse(response);
      console.log("Update session response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Session updated successfully",
      };
    } catch (err) {
      console.error("Update session error:", err);
      const errorMessage = err.message || "Failed to update session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Delete a session
  const deleteSession = async (sessionId, deletedBy = null) => {
    try {
      console.log("Deleting session:", sessionId);

      if (!sessionId) {
        throw new Error("Session ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);
      console.log("Delete session response:", result);

      return {
        success: true,
        message: result.message || "Session deleted successfully",
      };
    } catch (err) {
      console.error("Delete session error:", err);
      const errorMessage = err.message || "Failed to delete session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Update session status
  const updateSessionStatus = async (sessionId, status, modifiedBy = null) => {
    try {
      console.log("Updating session status:", sessionId, status);

      if (!sessionId) {
        throw new Error("Session ID is required");
      }

      if (!["draft", "completed", "active", "archived"].includes(status)) {
        throw new Error("Invalid status value");
      }

      const response = await fetch(
        `${API_BASE_URL}/session/${sessionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_status: status,
            modified_by: modifiedBy,
          }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update session status response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Session status updated successfully",
      };
    } catch (err) {
      console.error("Update session status error:", err);
      const errorMessage = err.message || "Failed to update session status";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Create a complete session with all related data
   * Includes: session, headmaster assignments, teacher-subject assignments, and subsessions
   */
  const createCompleteSession = async (completeSessionData) => {
    try {
      console.log("Creating complete session:", completeSessionData);

      const response = await fetch(`${API_BASE_URL}/session/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeSessionData),
      });

      const result = await handleApiResponse(response);
      console.log("Create complete session response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Complete session created successfully",
      };
    } catch (err) {
      console.error("Create complete session error:", err);
      const errorMessage = err.message || "Failed to create complete session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  // Get active session and subsession for a school (based on server date)
  const getActiveSession = async (schoolId) => {
    try {
      console.log("Fetching active session for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/session/school/${schoolId}/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get active session response:", result);

      return {
        success: true,
        data: result.data, // { session: {...}, subsession: {...} }
        message: result.message || "Active session retrieved successfully",
      };
    } catch (err) {
      console.error("Get active session error:", err);
      const errorMessage = err.message || "Failed to fetch active session";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    createSession,
    createCompleteSession,
    getSessionsBySchool,
    getSessionById,
    getActiveSession,
    updateSession,
    deleteSession,
    updateSessionStatus,
  };
};
