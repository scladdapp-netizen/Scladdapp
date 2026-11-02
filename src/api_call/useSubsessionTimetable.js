import { useState, useEffect, useCallback } from "react";
import { listFromTimetablePayload } from "./useClassTimetable";

const BASE = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Loads all classes for a school, then loads each class's timetables
 * for the given subsession in parallel. A class may have more than one.
 */
const useSubsessionTimetable = (schoolId, subsessionId) => {
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState({}); // { classId: timetable[] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!schoolId || !subsessionId) return;
    setLoading(true);
    setError(null);

    try {
      const classRes = await fetch(`${BASE}/class/school/${schoolId}`);
      const classJson = await classRes.json();
      if (!classJson.success) throw new Error(classJson.message || "Failed to load classes");

      const allClasses = classJson.data || [];
      setClasses(allClasses);

      const results = await Promise.allSettled(
        allClasses.map((cls) =>
          fetch(`${BASE}/api/class-timetable/${cls.class_id}/subsession/${subsessionId}`)
            .then((r) => r.json())
            .then((json) => ({
              classId: cls.class_id,
              timetables: json.success ? listFromTimetablePayload(json.data) : [],
            }))
            .catch(() => ({ classId: cls.class_id, timetables: [] }))
        )
      );

      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") map[r.value.classId] = r.value.timetables;
      });
      setTimetables(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, subsessionId]);

  useEffect(() => { load(); }, [load]);

  const saveTimetable = async (classId, entries, modifiedBy = null, meta = {}) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: schoolId,
          entries,
          modified_by: modifiedBy,
          timetable_id: meta.timetableId || undefined,
          name: meta.name || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) return null;
      setTimetables((prev) => {
        const list = prev[classId] || [];
        const idx = list.findIndex((item) => item.timetable_id === json.data?.timetable_id);
        const next = idx >= 0
          ? list.map((item, i) => (i === idx ? json.data : item))
          : [...list, json.data];
        return { ...prev, [classId]: next };
      });
      return json.data;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteTimetable = async (classId, timetableId) => {
    try {
      const res = await fetch(
        `${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}/${timetableId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (!json.success) return false;
      setTimetables((prev) => ({
        ...prev,
        [classId]: (prev[classId] || []).filter((item) => item.timetable_id !== timetableId),
      }));
      return true;
    } catch {
      return false;
    }
  };

  return { classes, timetables, loading, saving, error, refetch: load, saveTimetable, deleteTimetable };
};

export default useSubsessionTimetable;
