const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * downloadFile — reusable file download utility.
 *
 * For Cloudinary URLs: routes through the backend proxy to avoid CORS issues.
 * For other URLs: fetches directly as a blob.
 *
 * @param {string} url       - Direct URL to the file
 * @param {string} fileName  - Desired filename including extension
 */
const downloadFile = async (url, fileName) => {
  if (!url) throw new Error("No file URL provided");

  const name = fileName || "download";

  // Route Cloudinary files through the backend proxy
  const fetchUrl = url.includes("cloudinary.com")
    ? `${API_BASE}/api/download-proxy?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`
    : url;

  const response = await fetch(fetchUrl);
  if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);

  const blob = await response.blob();

  const ext = name.split(".").pop().toLowerCase();
  const mimeMap = {
    pdf:  "application/pdf",
    doc:  "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls:  "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt:  "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
    gif:  "image/gif",
    webp: "image/webp",
    svg:  "image/svg+xml",
    txt:  "text/plain",
    csv:  "text/csv",
    zip:  "application/zip",
  };

  const mimeType = (blob.type && blob.type !== "application/octet-stream")
    ? blob.type
    : (mimeMap[ext] || "application/octet-stream");

  const objectUrl = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const a = document.createElement("a");
  a.href     = objectUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
};

export default downloadFile;
