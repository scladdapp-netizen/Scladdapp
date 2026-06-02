import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for fee bill template operations
 */
export const useFeeBillTemplate = () => {
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
   * Create a new fee bill template
   */
  const createFeeBillTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating fee bill template:", templateData);

      const response = await fetch(`${API_BASE_URL}/fee-bill-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create fee bill template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Fee bill template created successfully",
      };
    } catch (err) {
      console.error("Create fee bill template error:", err);
      const errorMessage = err.message || "Failed to create fee bill template";
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
   * Get all fee bill templates for a school
   */
  const getFeeBillTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching fee bill templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/fee-bill-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get fee bill templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message: result.message || "Fee bill templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get fee bill templates error:", err);
      const errorMessage = err.message || "Failed to fetch fee bill templates";
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
   * Get a single fee bill template by ID
   */
  const getFeeBillTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching fee bill template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/fee-bill-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get fee bill template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Fee bill template retrieved successfully",
      };
    } catch (err) {
      console.error("Get fee bill template error:", err);
      const errorMessage = err.message || "Failed to fetch fee bill template";
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
   * Update a fee bill template
   */
  const updateFeeBillTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating fee bill template:", templateId, templateData);

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/fee-bill-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update fee bill template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Fee bill template updated successfully",
      };
    } catch (err) {
      console.error("Update fee bill template error:", err);
      const errorMessage = err.message || "Failed to update fee bill template";
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
   * Delete a fee bill template
   */
  const deleteFeeBillTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting fee bill template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/fee-bill-template/${templateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete fee bill template response:", result);

      return {
        success: true,
        message: result.message || "Fee bill template deleted successfully",
      };
    } catch (err) {
      console.error("Delete fee bill template error:", err);
      const errorMessage = err.message || "Failed to delete fee bill template";
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
   * Duplicate a fee bill template
   */
  const duplicateFeeBillTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating fee bill template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/fee-bill-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate fee bill template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Fee bill template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate fee bill template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate fee bill template";
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
        `${API_BASE_URL}/fee-bill-template/${templateId}/status`,
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
    createFeeBillTemplate,
    getFeeBillTemplatesBySchool,
    getFeeBillTemplateById,
    updateFeeBillTemplate,
    deleteFeeBillTemplate,
    duplicateFeeBillTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useFeeBillTemplate;
