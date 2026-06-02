import { useState, useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useAlumniCertificate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const getCertificates = useCallback(async (alumniId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni-certificates/alumni/${alumniId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) { setError(err.message); return { success: false, data: [] }; }
    finally { setLoading(false); }
  }, []);

  const uploadCertificate = useCallback(async (formData) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni-certificates`, {
        method: "POST",
        body: formData, // FormData — no Content-Type header, browser sets it
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) { setError(err.message); return { success: false, message: err.message }; }
    finally { setLoading(false); }
  }, []);

  const updateStatus = useCallback(async (certificateId, status, modifiedBy = null) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni-certificates/${certificateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, modified_by: modifiedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) { setError(err.message); return { success: false }; }
    finally { setLoading(false); }
  }, []);

  const deleteCertificate = useCallback(async (certificateId, deletedBy = null) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni-certificates/${certificateId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) { setError(err.message); return { success: false }; }
    finally { setLoading(false); }
  }, []);

  return { loading, error, getCertificates, uploadCertificate, updateStatus, deleteCertificate };
};

export default useAlumniCertificate;
