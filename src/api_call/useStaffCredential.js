import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStaffCredential = () => {
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
      const res = await fetch(`${API_BASE_URL}/api/staff-credential/staff/${staffId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], message: err.message };
    } finally { setLoading(false); }
  };

  const createCredential = async (formData) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-credential`, {
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

  const updateCredential = async (credentialId, payload) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-credential/${credentialId}`, {
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

  const incrementDownload = async (credentialId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-credential/${credentialId}/download`, { method: "PATCH" });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteCredential = async (credentialId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-credential/${credentialId}`, { method: "DELETE" });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  return { loading, error, getByStaff, createCredential, updateCredential, incrementDownload, deleteCredential };
};

export default useStaffCredential;
