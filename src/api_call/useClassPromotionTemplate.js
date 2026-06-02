import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for class promotion template operations
 */
export const useClassPromotionTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  /**
   * Create a new class promotion template
   */
  const createClassPromotionTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating class promotion template:", templateData);

      const response = await fetch(`${API_BASE_URL}/class-promotion-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create class promotion template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Class promotion template created successfully",
      };
    } catch (err) {
      console.error("Create class promotion template error:", err);
      const errorMessage =
        err.message || "Failed to create class promotion template";
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
   * Get all class promotion templates for a school
   */
  const getClassPromotionTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching class promotion templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get class promotion templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message:
          result.message || "Class promotion templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get class promotion templates error:", err);
      const errorMessage =
        err.message || "Failed to fetch class promotion templates";
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
   * Get classes for a school (for dropdown options)
   */
  const getClassesForSchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching classes for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/school/${schoolId}/classes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get classes response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
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
   * Get a single class promotion template by ID
   */
  const getClassPromotionTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching class promotion template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get class promotion template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Class promotion template retrieved successfully",
      };
    } catch (err) {
      console.error("Get class promotion template error:", err);
      const errorMessage =
        err.message || "Failed to fetch class promotion template";
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
   * Update a class promotion template
   */
  const updateClassPromotionTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "Updating class promotion template:",
        templateId,
        templateData
      );

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update class promotion template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Class promotion template updated successfully",
      };
    } catch (err) {
      console.error("Update class promotion template error:", err);
      const errorMessage =
        err.message || "Failed to update class promotion template";
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
   * Delete a class promotion template
   */
  const deleteClassPromotionTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting class promotion template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/${templateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete class promotion template response:", result);

      return {
        success: true,
        message:
          result.message || "Class promotion template deleted successfully",
      };
    } catch (err) {
      console.error("Delete class promotion template error:", err);
      const errorMessage =
        err.message || "Failed to delete class promotion template";
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
   * Duplicate a class promotion template
   */
  const duplicateClassPromotionTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating class promotion template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/class-promotion-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate class promotion template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Class promotion template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate class promotion template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate class promotion template";
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
        `${API_BASE_URL}/class-promotion-template/${templateId}/status`,
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
    createClassPromotionTemplate,
    getClassPromotionTemplatesBySchool,
    getClassesForSchool,
    getClassPromotionTemplateById,
    updateClassPromotionTemplate,
    deleteClassPromotionTemplate,
    duplicateClassPromotionTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useClassPromotionTemplate;
