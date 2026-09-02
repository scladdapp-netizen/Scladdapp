import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

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

// ── Token balance ─────────────────────────────────────────────────────────────
export function useAITokenBalance(schoolId) {
  const [balance,  setBalance]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  const fetch_ = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/tokens`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setBalance(data.data.balance);
    } catch (_) {}
    finally { setLoading(false); }
  }, [schoolId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { balance, loading, refetch: fetch_, setBalance };
}

// ── Available models ──────────────────────────────────────────────────────────
export function useAIWebsiteModels(schoolId) {
  const [models,  setModels]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schoolId) return;
    fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/models`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setModels(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [schoolId]);

  return { models, loading };
}

// ── AI edit call ──────────────────────────────────────────────────────────────
/**
 * Returns { editing, error, callEdit }
 *
 * callEdit({ prompt, fullHtml, sectionHtml, element, configId })
 *   → { success, newHtml, tokensUsed, newBalance, message } | { success:false, message, code? }
 */
export function useAIWebsiteEdit(schoolId) {
  const [editing, setEditing] = useState(false);
  const [error,   setError]   = useState(null);

  const callEdit = useCallback(async ({ prompt, fullHtml, sectionId, sectionHtml, element, configId }) => {
    setEditing(true);
    setError(null);
    try {
      const res  = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/edit`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ prompt, fullHtml, sectionId, sectionHtml, element, configId }),
      });
      const data = await res.json();
      if (!res.ok && !data.message) {
        data.message = `Request failed (${res.status})`;
        data.success = false;
      }
      if (!data.success) setError(data.message || "AI edit failed");
      return data;
    } catch (err) {
      const msg = err.message || "Network error";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setEditing(false);
    }
  }, [schoolId]);

  return { editing, error, callEdit };
}

// ── Image upload ──────────────────────────────────────────────────────────────
/**
 * Upload an image to Cloudinary via the backend.
 * If `oldPublicId` is supplied, the backend deletes the old image first.
 *
 * @param {string}  schoolId
 * @param {File}    file          — the File object from <input type="file">
 * @param {string}  [oldPublicId] — Cloudinary public_id of the image being replaced
 * @returns {Promise<{ success: boolean, url?: string, public_id?: string, message?: string }>}
 */
export async function uploadWebsiteImage(schoolId, file, oldPublicId = null) {
  const formData = new FormData();
  formData.append("image", file);
  if (oldPublicId) formData.append("oldPublicId", oldPublicId);

  let token = "";
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) token = JSON.parse(raw)?.token || "";
  } catch (_) {}

  const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return res.json();
}

// ── Image delete ──────────────────────────────────────────────────────────────
/**
 * Delete a Cloudinary image by public_id.
 */
export async function deleteWebsiteImage(schoolId, publicId) {
  let token = "";
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) token = JSON.parse(raw)?.token || "";
  } catch (_) {}

  const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/delete-image`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ public_id: publicId }),
  });
  return res.json();
}

// ── Draft save ────────────────────────────────────────────────────────────────
export async function saveDraftHtml(schoolId, html) {
  const res  = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/draft`, {
    method:  "PATCH",
    headers: authHeaders(),
    body:    JSON.stringify({ html }),
  });
  return res.json();
}

// ── Draft fetch ───────────────────────────────────────────────────────────────
export async function fetchDraftHtml(schoolId) {
  const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/draft`, {
    headers: authHeaders(),
  });
  return res.json();
}

// ── Live published HTML fetch ─────────────────────────────────────────────────
export async function fetchLiveHtml(schoolId) {
  const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-website/live`, {
    headers: authHeaders(),
  });
  return res.json();
}
