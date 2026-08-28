const SOCIAL_PLATFORMS = [
  { id: "facebook", label: "Facebook", placeholder: "yourschool" },
  { id: "instagram", label: "Instagram", placeholder: "yourschool" },
  { id: "tiktok", label: "TikTok", placeholder: "yourschool" },
  { id: "linkedin", label: "LinkedIn", placeholder: "company/yourschool" },
];

const normalizeSocialHandle = (handle = "") =>
  String(handle)
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/^(facebook|instagram|tiktok|linkedin)\.com\//i, "")
    .replace(/^in\//i, "")
    .replace(/^company\//i, "")
    .replace(/\/+$/, "");

const socialProfileUrl = (platform, handle) => {
  const h = normalizeSocialHandle(handle);
  if (!h) return null;
  switch (String(platform || "").toLowerCase()) {
    case "facebook":
      return `https://facebook.com/${h}`;
    case "instagram":
      return `https://instagram.com/${h}`;
    case "tiktok":
      return `https://tiktok.com/@${h}`;
    case "linkedin":
      return h.includes("/") ? `https://linkedin.com/${h}` : `https://linkedin.com/in/${h}`;
    default:
      return null;
  }
};

const socialPlatformLabel = (platform) =>
  SOCIAL_PLATFORMS.find((p) => p.id === platform)?.label || platform;

/** Migrate legacy single instagram field into social_links when needed */
const normalizeSocialLinks = (school = {}) => {
  const links = Array.isArray(school.social_links)
    ? school.social_links
        .map((item) => ({
          platform: String(item?.platform || "").toLowerCase(),
          handle: normalizeSocialHandle(item?.handle || ""),
        }))
        .filter((item) => item.platform && item.handle)
    : [];

  if (!links.length && school.instagram) {
    links.push({
      platform: "instagram",
      handle: normalizeSocialHandle(school.instagram),
    });
  }

  return links;
};

export {
  SOCIAL_PLATFORMS,
  normalizeSocialHandle,
  socialProfileUrl,
  socialPlatformLabel,
  normalizeSocialLinks,
};
