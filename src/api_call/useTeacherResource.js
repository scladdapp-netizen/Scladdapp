import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useTeacherResource = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);
    return data;
  };

  const getByTeacher = async (teacherId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher-resource/teacher/${teacherId}`);
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher-resource`, {
        method: "POST",
        body: formData,
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const incrementDownload = async (resourceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher-resource/${resourceId}/download`, { method: "PATCH" });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteResource = async (resourceId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher-resource/${resourceId}`, { method: "DELETE" });
      const result = await handleApiResponse(response);
      return { success: true, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getByTeacher, createResource, incrementDownload, deleteResource };
};

export default useTeacherResource;
