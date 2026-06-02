import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useCombinedTemplate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      const fullError = data.errors ? `${errorMessage}\n${data.errors.join("\n")}` : errorMessage;
      throw new Error(fullError);
    }
    return data;
  };

  const createTemplate = async (templateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getTemplatesBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/school/${schoolId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, count: result.count };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateId, templateData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/${templateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/${templateId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });
      const result = await handleApiResponse(response);
      return { success: true, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const duplicateTemplate = async (templateId, createdBy) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/${templateId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ created_by: createdBy }),
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTemplateStatus = async (templateId, status, modifiedBy) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/${templateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, modified_by: modifiedBy }),
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const checkIsAssigned = async (templateId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/grading-template/${templateId}/is-assigned`);
      const result = await handleApiResponse(response);
      return { success: true, assigned: result.assigned };
    } catch (err) {
      return { success: false, assigned: false };
    }
  };

  const getReportCardThemes = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const url = schoolId
        ? `${API_BASE_URL}/api/report-card-theme?school_id=${schoolId}`
        : `${API_BASE_URL}/api/report-card-theme`;
      const response = await fetch(url);
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTemplate,
    getTemplatesBySchool,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    updateTemplateStatus,
    checkIsAssigned,
    getReportCardThemes,
  };
};

export default useCombinedTemplate;
