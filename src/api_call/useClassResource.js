import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

export const useClassResource = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleApiResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  };

  // GET all resources for a class
  const getByClass = async (classId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/class-resource/class/${classId}`);
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // POST create — sends multipart/form-data
  const createResource = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      // formData is a FormData object (includes file + fields)
      const response = await fetch(`${API_BASE_URL}/api/class-resource`, {
        method: "POST",
        body: formData, // no Content-Type header — browser sets multipart boundary
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

  // PATCH increment download count
  const incrementDownload = async (resourceId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/class-resource/${resourceId}/download`,
        { method: "PATCH" }
      );
      const result = await handleApiResponse(response);
      return { success: true, data: result.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // DELETE
  const deleteResource = async (resourceId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/class-resource/${resourceId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );
      const result = await handleApiResponse(response);
      return { success: true, message: result.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getByClass, createResource, incrementDownload, deleteResource };
};

export default useClassResource;
