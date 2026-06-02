import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useSubjectResource = () => {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
    return data;
  };

  const getBySubject = async (subjectId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-resources/subject/${subjectId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    } finally { setLoading(false); }
  };

  const createResource = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-resources`, {
        method: "POST",
        body: formData,
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  const updateResource = async (resourceId, payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  const incrementDownload = async (resourceId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-resources/${resourceId}/download`, { method: "PATCH" });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteResource = async (resourceId, deletedBy = null) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subject-resources/${resourceId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  return { loading, getBySubject, createResource, updateResource, incrementDownload, deleteResource };
};

export default useSubjectResource;
