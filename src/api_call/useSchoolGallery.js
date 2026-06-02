import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useSchoolGallery = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP error ${res.status}`);
    return data;
  };

  const getBySchool = async (schoolId, params = {}) => {
    setLoading(true); setError(null);
    try {
      const { page = 1, limit = 20, search = "" } = params;
      const q = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/school-gallery/${schoolId}?${q}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally { setLoading(false); }
  };

  const uploadImage = async (formData) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/school-gallery`, {
        method: "POST",
        body: formData,
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  const deleteImage = async (galleryId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/school-gallery/${galleryId}`, { method: "DELETE" });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally { setLoading(false); }
  };

  return { loading, error, getBySchool, uploadImage, deleteImage };
};

export default useSchoolGallery;
