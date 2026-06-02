import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for class operations
 */
export const useClass = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Create a new class
   */
  const createClass = async (classData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating class with data:", classData);

      const response = await fetch(`${API_BASE_URL}/class`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
      });

      const result = await handleApiResponse(response);
      console.log("Create class response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Class created successfully",
      };
    } catch (err) {
      console.error("Create class error:", err);
      const errorMessage = err.message || "Failed to create class";
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

  /**
   * Get all classes by school ID
   */
  const getClassesBySchoolId = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching classes for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/class/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get classes response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Classes retrieved successfully",
      };
    } catch (err) {
      console.error("Get classes error:", err);
      const errorMessage = err.message || "Failed to fetch classes";
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

  /**
   * Get class by ID
   */
  const getClassById = async (classId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching class with ID:", classId);

      if (!classId) {
        throw new Error("Class ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get class response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Class retrieved successfully",
      };
    } catch (err) {
      console.error("Get class error:", err);
      const errorMessage = err.message || "Failed to fetch class";
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

  /**
   * Update class
   */
  const updateClass = async (classId, classData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating class with ID:", classId, "Data:", classData);

      if (!classId) {
        throw new Error("Class ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
      });

      const result = await handleApiResponse(response);
      console.log("Update class response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Class updated successfully",
      };
    } catch (err) {
      console.error("Update class error:", err);
      const errorMessage = err.message || "Failed to update class";
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

  /**
   * Delete class (soft delete)
   */
  const deleteClass = async (classId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting class with ID:", classId);

      if (!classId) {
        throw new Error("Class ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);
      console.log("Delete class response:", result);

      return {
        success: true,
        message: result.message || "Class deleted successfully",
      };
    } catch (err) {
      console.error("Delete class error:", err);
      const errorMessage = err.message || "Failed to delete class";
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

  /**
   * Update class status
   */
  const updateClassStatus = async (classId, isActive, modifiedBy = null, schoolId = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/class/${classId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive, modified_by: modifiedBy, school_id: schoolId }),
      });

      const result = await handleApiResponse(response);
      console.log("Update class status response:", result);

      return {
        success: true,
        message: result.message || "Class status updated successfully",
      };
    } catch (err) {
      console.error("Update class status error:", err);
      const errorMessage = err.message || "Failed to update class status";
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

  /**
   * Hard delete class (permanently remove)
   */
  const hardDeleteClass = async (classId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/class/${classId}/hard`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);
      console.log("Hard delete class response:", result);

      return {
        success: true,
        message: result.message || "Class permanently deleted",
      };
    } catch (err) {
      console.error("Hard delete class error:", err);
      const errorMessage = err.message || "Failed to permanently delete class";
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
    loading,
    error,
    createClass,
    getClassesBySchoolId,
    getClassById,
    updateClass,
    deleteClass,
    updateClassStatus,
    hardDeleteClass,
    clearError,
  };
};
