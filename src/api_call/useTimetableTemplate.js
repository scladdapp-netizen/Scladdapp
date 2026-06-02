import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for timetable template operations
 */
export const useTimetableTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      // Include validation errors if available
      const errorMessage =
        data.message || `HTTP error! status: ${response.status}`;
      const fullError = data.errors
        ? `${errorMessage}\n${data.errors.join("\n")}`
        : errorMessage;
      throw new Error(fullError);
    }

    return data;
  };

  /**
   * Create a new timetable template
   */
  const createTimetableTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating timetable template:", templateData);

      const response = await fetch(`${API_BASE_URL}/timetable-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create timetable template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Timetable template created successfully",
      };
    } catch (err) {
      console.error("Create timetable template error:", err);
      const errorMessage = err.message || "Failed to create timetable template";
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
   * Get all timetable templates for a school
   */
  const getTimetableTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching timetable templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get timetable templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message: result.message || "Timetable templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get timetable templates error:", err);
      const errorMessage = err.message || "Failed to fetch timetable templates";
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
   * Get a single timetable template by ID
   */
  const getTimetableTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching timetable template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get timetable template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Timetable template retrieved successfully",
      };
    } catch (err) {
      console.error("Get timetable template error:", err);
      const errorMessage = err.message || "Failed to fetch timetable template";
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
   * Update a timetable template
   */
  const updateTimetableTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating timetable template:", templateId, templateData);

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update timetable template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Timetable template updated successfully",
      };
    } catch (err) {
      console.error("Update timetable template error:", err);
      const errorMessage = err.message || "Failed to update timetable template";
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
   * Delete a timetable template
   */
  const deleteTimetableTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting timetable template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/${templateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete timetable template response:", result);

      return {
        success: true,
        message: result.message || "Timetable template deleted successfully",
      };
    } catch (err) {
      console.error("Delete timetable template error:", err);
      const errorMessage = err.message || "Failed to delete timetable template";
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
   * Duplicate a timetable template
   */
  const duplicateTimetableTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating timetable template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate timetable template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Timetable template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate timetable template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate timetable template";
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
   * Update template status
   */
  const updateTemplateStatus = async (templateId, status, modifiedBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating template status:", templateId, status);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      if (!["active", "draft", "archived"].includes(status)) {
        throw new Error("Invalid status value");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable-template/${templateId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, modified_by: modifiedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update template status response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Template status updated successfully",
      };
    } catch (err) {
      console.error("Update template status error:", err);
      const errorMessage = err.message || "Failed to update template status";
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
    createTimetableTemplate,
    getTimetableTemplatesBySchool,
    getTimetableTemplateById,
    updateTimetableTemplate,
    deleteTimetableTemplate,
    duplicateTimetableTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useTimetableTemplate;
