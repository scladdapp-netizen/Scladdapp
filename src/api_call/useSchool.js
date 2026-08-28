import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useSchool = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProfile = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/profile`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (schoolId, profileData, logoFile = null) => {
    setLoading(true);
    setError(null);
    try {
      let body;
      let headers = {};
      if (logoFile) {
        body = new FormData();
        Object.entries(profileData).forEach(([k, v]) => {
          if (v === null || v === undefined) return;
          body.append(k, typeof v === "object" ? JSON.stringify(v) : v);
        });
        body.append("school_logo", logoFile);
      } else {
        body = JSON.stringify(profileData);
        headers = { "Content-Type": "application/json" };
      }
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/profile`, {
        method: "PATCH",
        headers,
        body,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getBio = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/bio`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, bio: data.bio };
    } catch (err) {
      setError(err.message);
      return { success: false, bio: "" };
    } finally {
      setLoading(false);
    }
  };

  const saveBio = async (schoolId, bio) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/bio`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const getWebsite = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const saveWebsite = async (schoolId, website) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ website }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const requestWebsite = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const cancelWebsiteRequest = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website/request`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getProfile, saveProfile, getBio, saveBio, getWebsite, saveWebsite, requestWebsite, cancelWebsiteRequest };
};

export default useSchool;
