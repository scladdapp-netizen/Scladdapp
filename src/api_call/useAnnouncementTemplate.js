import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for announcement template operations
 */
export const useAnnouncementTemplate = () => {
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
   * Create a new announcement template
   */
  const createAnnouncementTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating announcement template:", templateData);

      const response = await fetch(`${API_BASE_URL}/announcement-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create announcement template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Announcement template created successfully",
      };
    } catch (err) {
      console.error("Create announcement template error:", err);
      const errorMessage =
        err.message || "Failed to create announcement template";
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
   * Get all announcement templates for a school
   */
  const getAnnouncementTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching announcement templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/announcement-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get announcement templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message:
          result.message || "Announcement templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get announcement templates error:", err);
      const errorMessage =
        err.message || "Failed to fetch announcement templates";
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
   * Get a single announcement template by ID
   */
  const getAnnouncementTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching announcement template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/announcement-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get announcement template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Announcement template retrieved successfully",
      };
    } catch (err) {
      console.error("Get announcement template error:", err);
      const errorMessage =
        err.message || "Failed to fetch announcement template";
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
   * Update an announcement template
   */
  const updateAnnouncementTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating announcement template:", templateId, templateData);

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/announcement-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update announcement template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Announcement template updated successfully",
      };
    } catch (err) {
      console.error("Update announcement template error:", err);
      const errorMessage =
        err.message || "Failed to update announcement template";
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
   * Delete an announcement template
   */
  const deleteAnnouncementTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting announcement template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/announcement-template/${templateId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete announcement template response:", result);

      return {
        success: true,
        message: result.message || "Announcement template deleted successfully",
      };
    } catch (err) {
      console.error("Delete announcement template error:", err);
      const errorMessage =
        err.message || "Failed to delete announcement template";
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
   * Duplicate an announcement template
   */
  const duplicateAnnouncementTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating announcement template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/announcement-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate announcement template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Announcement template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate announcement template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate announcement template";
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
        `${API_BASE_URL}/announcement-template/${templateId}/status`,
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
    createAnnouncementTemplate,
    getAnnouncementTemplatesBySchool,
    getAnnouncementTemplateById,
    updateAnnouncementTemplate,
    deleteAnnouncementTemplate,
    duplicateAnnouncementTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useAnnouncementTemplate;
