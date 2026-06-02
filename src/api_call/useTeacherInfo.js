import { useState } from "react";

const useTeacherInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL - adjust this to match your backend URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  // Create teacher (assign staff as teacher)
  const createTeacher = async (teacherData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating teacher with data:", teacherData);

      const response = await fetch(`${API_BASE_URL}/teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teacherData),
      });

      const result = await handleApiResponse(response);

      console.log("Teacher created successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher created successfully",
      };
    } catch (err) {
      console.error("Create teacher error:", err);
      const errorMessage = err.message || "Failed to create teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Update teacher
  const updateTeacher = async (teacherId, teacherData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updating teacher with ID:", teacherId, "Data:", teacherData);

      if (!teacherId) {
        throw new Error("Teacher ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teacherData),
      });

      const result = await handleApiResponse(response);

      console.log("Teacher updated successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher updated successfully",
      };
    } catch (err) {
      console.error("Update teacher error:", err);
      const errorMessage = err.message || "Failed to update teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Revoke teacher (soft delete - removes teacher role but keeps staff)
  const revokeTeacher = async (teacherId, revokedBy) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Revoking teacher with ID:", teacherId);

      if (!teacherId) {
        throw new Error("Teacher ID is required for revocation");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/${teacherId}/revoke`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ revoked_by: revokedBy }),
        }
      );

      const result = await handleApiResponse(response);

      console.log("Teacher revoked successfully:", result);
      return {
        success: true,
        message: result.message || "Teacher role revoked successfully",
      };
    } catch (err) {
      console.error("Revoke teacher error:", err);
      const errorMessage = err.message || "Failed to revoke teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Reactivate teacher (restore teacher role)
  const reactivateTeacher = async (teacherId, reactivatedBy) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Reactivating teacher with ID:", teacherId);

      if (!teacherId) {
        throw new Error("Teacher ID is required for reactivation");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/${teacherId}/reactivate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reactivated_by: reactivatedBy }),
        }
      );

      const result = await handleApiResponse(response);

      console.log("Teacher reactivated successfully:", result);
      return {
        success: true,
        message: result.message || "Teacher reactivated successfully",
      };
    } catch (err) {
      console.error("Reactivate teacher error:", err);
      const errorMessage = err.message || "Failed to reactivate teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Change teacher assignment
  const changeTeacherAssignment = async (teacherId, newStaffId, changedBy) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Changing teacher assignment:", { teacherId, newStaffId });

      if (!teacherId) {
        throw new Error("Teacher ID is required");
      }

      if (!newStaffId) {
        throw new Error("New staff ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/${teacherId}/change-assignment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_staff_id: newStaffId,
            changed_by: changedBy,
          }),
        }
      );

      const result = await handleApiResponse(response);

      console.log("Teacher assignment changed successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher assignment changed successfully",
      };
    } catch (err) {
      console.error("Change teacher assignment error:", err);
      const errorMessage = err.message || "Failed to change teacher assignment";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get teacher assignment history
  const getTeacherAssignmentHistory = async (teacherId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching teacher assignment history for ID:", teacherId);

      if (!teacherId) {
        throw new Error("Teacher ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/${teacherId}/assignment-history`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      console.log("Teacher assignment history fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Assignment history retrieved successfully",
      };
    } catch (err) {
      console.error("Get teacher assignment history error:", err);
      const errorMessage =
        err.message || "Failed to retrieve assignment history";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Delete teacher (hard delete)
  const deleteTeacher = async (teacherId, deletedBy = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Deleting teacher with ID:", teacherId);

      if (!teacherId) {
        throw new Error("Teacher ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/teacher/${teacherId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);

      console.log("Teacher deleted successfully:", result);
      return {
        success: true,
        message: result.message || "Teacher deleted successfully",
      };
    } catch (err) {
      console.error("Delete teacher error:", err);
      const errorMessage = err.message || "Failed to delete teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get teacher by ID
  const getTeacherById = async (teacherId) => {
    setLoading(true);
    setError(null);

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

      console.log("Teacher fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher retrieved successfully",
      };
    } catch (err) {
      console.error("Get teacher error:", err);
      const errorMessage = err.message || "Failed to retrieve teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get teacher by staff ID
  const getTeacherByStaffId = async (staffId, schoolId) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "Fetching teacher for staff ID:",
        staffId,
        "school ID:",
        schoolId
      );

      if (!staffId || !schoolId) {
        throw new Error("Staff ID and School ID are required");
      }

      const response = await fetch(
        `${API_BASE_URL}/teacher/staff/${staffId}/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      console.log("Teacher fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teacher retrieved successfully",
      };
    } catch (err) {
      console.error("Get teacher by staff ID error:", err);
      const errorMessage = err.message || "Failed to retrieve teacher";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get all teachers for a school
  const getTeachersBySchoolId = async (schoolId) => {
    setLoading(true);
    setError(null);

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

      console.log("School teachers fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Teachers retrieved successfully",
      };
    } catch (err) {
      console.error("Get school teachers error:", err);
      const errorMessage = err.message || "Failed to retrieve teachers";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    loading,
    error,

    // Actions
    createTeacher,
    updateTeacher,
    revokeTeacher,
    reactivateTeacher,
    deleteTeacher,
    getTeacherById,
    getTeacherByStaffId,
    getTeachersBySchoolId,
    changeTeacherAssignment,
    getTeacherAssignmentHistory,
    clearError,
  };
};

export default useTeacherInfo;
