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
   *   primary_color, secondary_color, font_style, theme,
   *   sections: [{ id, label, layoutId, content, notes, order }],
   *   final_notes
   * }
   */
  const saveDraft = async (schoolId, briefPayload) => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/schools/${schoolId}/website-request`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify(briefPayload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data, message: data.message };
    } catch (err) { setError(err.message); return { success: false, message: err.message }; }
    finally { setLoading(false); }
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

  return { loading, error, getRequest, saveDraft, submitRequest, cancelRequest };
};

export default useWebsiteRequest;
