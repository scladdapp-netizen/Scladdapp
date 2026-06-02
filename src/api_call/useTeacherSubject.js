const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for teacher-subject assignment operations
 */
export const useTeacherSubject = () => {
  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Assign teacher to subject
   */
  const assignTeacherToSubject = async (assignmentData) => {
    try {
      console.log("Assigning teacher to subject with data:", assignmentData);

      const response = await fetch(`${API_BASE_URL}/teacher-subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      });

      const result = await handleApiResponse(response);
      console.log("Assign teacher to subject response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher assigned to subject successfully",
      };
    } catch (err) {
      console.error("Assign teacher to subject error:", err);
      const errorMessage = err.message || "Failed to assign teacher to subject";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get active teacher-subject assignments by school ID
   */
  const getActiveTeacherSubjectAssignmentsBySchool = async (schoolId) => {
    try {
      console.log(
        "Fetching active teacher-subject assignments for school ID:",
        schoolId
      );

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher-subject/school/${schoolId}/active`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get active teacher-subject assignments response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Active assignments retrieved successfully",
      };
    } catch (err) {
      console.error("Get active teacher-subject assignments error:", err);
      const errorMessage = err.message || "Failed to fetch active assignments";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get teacher-subject assignments for a subject
   */
  const getTeacherSubjectAssignments = async (subjectId) => {
    try {
      console.log("Fetching teacher assignments for subject ID:", subjectId);

      if (!subjectId) {
        throw new Error("Subject ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher-subject/subject/${subjectId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get teacher-subject assignments response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Assignments retrieved successfully",
      };
    } catch (err) {
      console.error("Get teacher-subject assignments error:", err);
      const errorMessage = err.message || "Failed to fetch assignments";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Deactivate teacher-subject assignment
   */
  const deactivateTeacherSubjectAssignment = async (assignmentId) => {
    try {
      console.log(
        "Deactivating teacher-subject assignment with ID:",
        assignmentId
      );

      if (!assignmentId) {
        throw new Error("Assignment ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher-subject/${assignmentId}/deactivate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Deactivate teacher-subject assignment response:", result);

      return {
        success: true,
        message: result.message || "Assignment deactivated successfully",
      };
    } catch (err) {
      console.error("Deactivate teacher-subject assignment error:", err);
      const errorMessage = err.message || "Failed to deactivate assignment";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  return {
    assignTeacherToSubject,
    getActiveTeacherSubjectAssignmentsBySchool,
    getTeacherSubjectAssignments,
    deactivateTeacherSubjectAssignment,
  };
};
