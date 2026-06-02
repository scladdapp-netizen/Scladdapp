import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStaffResource = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
    return data;
  };

  const getByStaff = async (staffId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-resource/staff/${staffId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], message: err.message };
    } finally { setLoading(false); }
  };

  const createResource = async (formData) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-resource`, {
        method: "POST",
        body: formData, // FormData — no Content-Type header
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  const updateResource = async (resourceId, payload) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-resource/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  const incrementDownload = async (resourceId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-resource/${resourceId}/download`, { method: "PATCH" });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteResource = async (resourceId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-resource/${resourceId}`, { method: "DELETE" });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  return { loading, error, getByStaff, createResource, updateResource, incrementDownload, deleteResource };
};

export default useStaffResource;
