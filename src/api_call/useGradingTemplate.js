import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for grading template operations
 */
export const useGradingTemplate = () => {
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
   * Create a new grading template
   */
  const createGradingTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating grading template:", templateData);

      const response = await fetch(`${API_BASE_URL}/grading-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create grading template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Grading template created successfully",
      };
    } catch (err) {
      console.error("Create grading template error:", err);
      const errorMessage = err.message || "Failed to create grading template";
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
   * Get all grading templates for a school
   */
  const getGradingTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching grading templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/grading-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get grading templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message: result.message || "Grading templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get grading templates error:", err);
      const errorMessage = err.message || "Failed to fetch grading templates";
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
   * Get a single grading template by ID
   */
  const getGradingTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching grading template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/grading-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get grading template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Grading template retrieved successfully",
      };
    } catch (err) {
      console.error("Get grading template error:", err);
      const errorMessage = err.message || "Failed to fetch grading template";
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
   * Update a grading template
   */
  const updateGradingTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating grading template:", templateId, templateData);

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/grading-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update grading template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Grading template updated successfully",
      };
    } catch (err) {
      console.error("Update grading template error:", err);
      const errorMessage = err.message || "Failed to update grading template";
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
   * Delete a grading template
   */
  const deleteGradingTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting grading template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/grading-template/${templateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete grading template response:", result);

      return {
        success: true,
        message: result.message || "Grading template deleted successfully",
      };
    } catch (err) {
      console.error("Delete grading template error:", err);
      const errorMessage = err.message || "Failed to delete grading template";
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
   * Duplicate a grading template
   */
  const duplicateGradingTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating grading template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/grading-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate grading template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Grading template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate grading template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate grading template";
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
        `${API_BASE_URL}/grading-template/${templateId}/status`,
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
    createGradingTemplate,
    getGradingTemplatesBySchool,
    getGradingTemplateById,
    updateGradingTemplate,
    deleteGradingTemplate,
    duplicateGradingTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useGradingTemplate;
