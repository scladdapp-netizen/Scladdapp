const API_BASE = String(
  import.meta.env.VITE_API_BASE_URL || "http://localhost:1234",
).replace(/\/$/, "");

// Hosted sites live at {VITE_API_BASE_URL}/sites/<slug>. Rewrite a stored
// localhost link so Copy and Visit follow the backend URL from the env.
export const publicSiteUrl = (storedUrl) => {
  if (!storedUrl) return storedUrl;
  try {
    const url = new URL(storedUrl);
    if (!url.pathname.startsWith("/sites/")) return storedUrl;
    const path = url.pathname.replace(/\/$/, "");
    return `${API_BASE}${path}${url.search}${url.hash}`;
  } catch (_) {
    return storedUrl;
  }
};
