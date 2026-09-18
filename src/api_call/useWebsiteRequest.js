import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

function authHeaders() {
  let token = "";
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) token = JSON.parse(raw)?.token || "";
  } catch (_) {}
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const useWebsiteRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const getRequest = async (schoolId) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) { setError(err.message); return { success: false, data: null }; }
    finally { setLoading(false); }
  };

  /**
   * saveDraft — sends the structured brief as JSON.
   * briefPayload: {
   *   primary_color, secondary_color, background_color, font_style, theme,
   *   pages: [{ id, title, slug, order, sections: [...] }],
   *   sections: [...] // legacy / home mirror
   *   final_notes
   * }
   */
  const saveDraft = async (schoolId, briefPayload, opts = {}) => {
    const silent = !!opts.silent;
    if (!silent) { setLoading(true); setError(null); }
    try {
      const res  = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify(briefPayload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data, message: data.message };
    } catch (err) {
      if (!silent) setError(err.message);
      return { success: false, message: err.message };
    }
    finally { if (!silent) setLoading(false); }
  };

  const submitRequest = async (schoolId) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request/submit`, {
        method:  "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, message: data.message };
    } catch (err) { setError(err.message); return { success: false, message: err.message }; }
    finally { setLoading(false); }
  };

  const cancelRequest = async (schoolId) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, message: data.message };
    } catch (err) { setError(err.message); return { success: false }; }
    finally { setLoading(false); }
  };

  const setCustomDomain = async (schoolId, domain) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request/custom-domain`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to save domain");
      return { success: true, data: data.data, dns: data.dns, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const verifyCustomDomain = async (schoolId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request/custom-domain/verify`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Verification failed");
        return {
          success: false,
          message: data.message || "Verification failed",
          data: data.data || null,
          dns_detail: data.dns_detail || null,
        };
      }
      return { success: true, data: data.data, message: data.message, site_url: data.site_url };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message, data: null };
    } finally {
      setLoading(false);
    }
  };

  const removeCustomDomain = async (schoolId) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request/custom-domain`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to remove domain");
      return { success: true, data: data.data, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getRequest,
    saveDraft,
    submitRequest,
    cancelRequest,
    setCustomDomain,
    verifyCustomDomain,
    removeCustomDomain,
  };
};

export default useWebsiteRequest;
