export function formatEndDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);

  // Create date in UTC (no timezone shift)
  const date = new Date(Date.UTC(year, month - 1, day));

  // Add 11 months
  date.setUTCMonth(date.getUTCMonth() + 11);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Format date for display without timezone shifts
 * @param {string} dateStr - Date string in format "YYYY-MM-DD"
 * @returns {string} Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  // Split the date string and create date in UTC to avoid timezone shifts
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC", // Force UTC to prevent timezone conversion
  });
}
