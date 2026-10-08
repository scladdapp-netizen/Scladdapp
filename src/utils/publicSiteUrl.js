const SITE_DOMAIN = String(import.meta.env.VITE_SITE_DOMAIN || "scladapp.site")
  .trim()
  .toLowerCase()
  .replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");

// A stored /sites/<slug> link is shown as https://<slug>.scladapp.site.
export const publicSiteUrl = (storedUrl) => {
  if (!storedUrl) return storedUrl;
  try {
    const url = new URL(storedUrl);
    const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    const slug = parts[0] === "sites" ? String(parts[1] || "").toLowerCase() : "";
    if (slug && SITE_DOMAIN) return `https://${slug}.${SITE_DOMAIN}`;
    return storedUrl;
  } catch (_) {
    return storedUrl;
  }
};
