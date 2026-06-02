import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for subject operations
 */
export const useSubject = () => {
  const [loading, setLoading] = useState(false);

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Create a new subject
   */
  const createSubject = async (subjectData) => {
    setLoading(true);
    try {
      console.log("Creating subject with data:", subjectData);

      const response = await fetch(`${API_BASE_URL}/subject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subjectData),
      });

      const result = await handleApiResponse(response);
      console.log("Create subject response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subject created successfully",
      };
    } catch (err) {
      console.error("Create subject error:", err);
      const errorMessage = err.message || "Failed to create subject";

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
   * Get all subjects by school ID
   */
  const getSubjectsBySchoolId = async (schoolId) => {
    try {
      console.log("Fetching subjects for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/subject/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get subjects response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subjects retrieved successfully",
      };
    } catch (err) {
      console.error("Get subjects error:", err);
      const errorMessage = err.message || "Failed to fetch subjects";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Get subject by ID
   */
  const getSubjectById = async (subjectId) => {
    try {
      console.log("Fetching subject with ID:", subjectId);

      if (!subjectId) {
        throw new Error("Subject ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/subject/${subjectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get subject response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subject retrieved successfully",
      };
    } catch (err) {
      console.error("Get subject error:", err);
      const errorMessage = err.message || "Failed to fetch subject";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    }
  };

  /**
   * Update subject
   */
  const updateSubject = async (subjectId, subjectData) => {
    setLoading(true);
    try {
      console.log("Updating subject with ID:", subjectId, "Data:", subjectData);

      const response = await fetch(`${API_BASE_URL}/subject/${subjectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subjectData),
      });

      const result = await handleApiResponse(response);
      console.log("Update subject response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Subject updated successfully",
      };
    } catch (err) {
      console.error("Update subject error:", err);
      const errorMessage = err.message || "Failed to update subject";

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
   * Delete subject (soft delete)
   */
  const deleteSubject = async (subjectId, deletedBy = null) => {
    setLoading(true);
    try {
      console.log("Deleting subject with ID:", subjectId);

      const response = await fetch(`${API_BASE_URL}/subject/${subjectId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);
      console.log("Delete subject response:", result);

      return {
        success: true,
        message: result.message || "Subject deleted successfully",
      };
    } catch (err) {
      console.error("Delete subject error:", err);
      const errorMessage = err.message || "Failed to delete subject";

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createSubject,
    getSubjectsBySchoolId,
    getSubjectById,
    updateSubject,
    deleteSubject,
  };
};
