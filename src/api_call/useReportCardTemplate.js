import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for report card template operations
 */
export const useReportCardTemplate = () => {
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
   * Create a new report card template
   */
  const createReportCardTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating report card template:", templateData);

      const response = await fetch(`${API_BASE_URL}/report-card-template`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const result = await handleApiResponse(response);
      console.log("Create report card template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Report card template created successfully",
      };
    } catch (err) {
      console.error("Create report card template error:", err);
      const errorMessage =
        err.message || "Failed to create report card template";
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
   * Get all report card templates for a school
   */
  const getReportCardTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching report card templates for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/report-card-template/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get report card templates response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message:
          result.message || "Report card templates retrieved successfully",
      };
    } catch (err) {
      console.error("Get report card templates error:", err);
      const errorMessage =
        err.message || "Failed to fetch report card templates";
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
   * Get a single report card template by ID
   */
  const getReportCardTemplateById = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching report card template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/report-card-template/${templateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get report card template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Report card template retrieved successfully",
      };
    } catch (err) {
      console.error("Get report card template error:", err);
      const errorMessage =
        err.message || "Failed to fetch report card template";
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
   * Update a report card template
   */
  const updateReportCardTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating report card template:", templateId, templateData);

      if (!templateId) {
        throw new Error("Template ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/report-card-template/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update report card template response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Report card template updated successfully",
      };
    } catch (err) {
      console.error("Update report card template error:", err);
      const errorMessage =
        err.message || "Failed to update report card template";
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
   * Delete a report card template
   */
  const deleteReportCardTemplate = async (templateId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting report card template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/report-card-template/${templateId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete report card template response:", result);

      return {
        success: true,
        message: result.message || "Report card template deleted successfully",
      };
    } catch (err) {
      console.error("Delete report card template error:", err);
      const errorMessage =
        err.message || "Failed to delete report card template";
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
   * Duplicate a report card template
   */
  const duplicateReportCardTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Duplicating report card template:", templateId);

      if (!templateId) {
        throw new Error("Template ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/report-card-template/${templateId}/duplicate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ created_by: createdBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Duplicate report card template response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Report card template duplicated successfully",
      };
    } catch (err) {
      console.error("Duplicate report card template error:", err);
      const errorMessage =
        err.message || "Failed to duplicate report card template";
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
        `${API_BASE_URL}/report-card-template/${templateId}/status`,
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
    createReportCardTemplate,
    getReportCardTemplatesBySchool,
    getReportCardTemplateById,
    updateReportCardTemplate,
    deleteReportCardTemplate,
    duplicateReportCardTemplate,
    updateTemplateStatus,
    clearError,
  };
};

export default useReportCardTemplate;
