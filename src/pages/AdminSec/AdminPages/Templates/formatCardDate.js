// "2026-10-13T09:49:26.857Z" or "10/6/2026" -> "Oct 13, 2026" (falls back to the raw text)
export const formatCardDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default formatCardDate;
