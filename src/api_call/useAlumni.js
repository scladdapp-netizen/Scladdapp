import { useState, useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useAlumni = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const getAlumniPaginated = useCallback(async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "", searchField = "", year = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField, year }).toString();
      const res = await fetch(`${API_BASE_URL}/api/alumni/school/${schoolId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlumniBySchool = useCallback(async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni/school/${schoolId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAlumniById = useCallback(async (alumniId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni/${alumniId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  }, []);

  const createAlumni = useCallback(async (alumniData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/alumni`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alumniData),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students for a school (for the manual alumni select)
  const getStudentsBySchool = useCallback(async (schoolId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/school/${schoolId}`);
      const data = await res.json();
      return { success: data.success, data: data.data || [] };
    } catch (err) {
      return { success: false, data: [] };
    }
  }, []);

  return { loading, error, getAlumniPaginated, getAlumniBySchool, getAlumniById, createAlumni, getStudentsBySchool };
};

export default useAlumni;
