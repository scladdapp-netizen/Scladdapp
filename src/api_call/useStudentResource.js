import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStudentResource = () => {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
    return data;
  };

  const getByStudent = async (studentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student-resources/student/${studentId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, data: [], message: err.message };
    } finally { setLoading(false); }
  };

  const createResource = async (formData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student-resources`, {
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
      const res = await fetch(`${API_BASE_URL}/api/student-resources/${resourceId}`, {
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
      const res = await fetch(`${API_BASE_URL}/api/student-resources/${resourceId}/download`, { method: "PATCH" });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteResource = async (resourceId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student-resources/${resourceId}`, { method: "DELETE" });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  return { loading, getByStudent, createResource, updateResource, incrementDownload, deleteResource };
};

export default useStudentResource;
