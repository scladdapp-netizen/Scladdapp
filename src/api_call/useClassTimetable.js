import { useState, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}`;

export function listFromTimetablePayload(data) {
  if (Array.isArray(data?.timetables)) return data.timetables;
  if (Array.isArray(data?.entries) && (data.entries.length || data.timetable_id)) {
    return [{
      timetable_id: data.timetable_id || "legacy",
      name: data.name || "Timetable",
      entries: data.entries || [],
    }];
  }
  return [];
}

export function entriesFromTimetablePayload(data) {
  const timetables = listFromTimetablePayload(data);
  if (timetables.length) return timetables.flatMap((item) => item.entries || []);
  return data?.entries || [];
}

export function useClassTimetable() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadTimetable = useCallback(async (classId, subsessionId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}`
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to load timetable");
      return json.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTimetable = useCallback(async (classId, subsessionId, schoolId, entries, modifiedBy = null, meta = {}) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            school_id: schoolId,
            entries,
            modified_by: modifiedBy,
            timetable_id: meta.timetableId || undefined,
            name: meta.name || undefined,
          }),
        }
      );
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Failed to save timetable");
      return json.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteTimetable = useCallback(async (classId, subsessionId, timetableId) => {
    try {
      const res = await fetch(
        `${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}/${timetableId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      return json.success;
    } catch {
      return false;
    }
  }, []);

  return { loading, saving, error, loadTimetable, saveTimetable, deleteTimetable };
}

export default useClassTimetable;
