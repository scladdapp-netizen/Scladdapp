import { useState, useEffect, useCallback } from "react";

const BASE = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Loads all classes for a school, then loads each class's timetable
 * for the given subsession in parallel.
 */
const useSubsessionTimetable = (schoolId, subsessionId) => {
  const [classes, setClasses] = useState([]);
  const [timetables, setTimetables] = useState({}); // { classId: entries[] }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!schoolId || !subsessionId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all classes for the school
      const classRes = await fetch(`${BASE}/class/school/${schoolId}`);
      const classJson = await classRes.json();
      if (!classJson.success) throw new Error(classJson.message || "Failed to load classes");

      const allClasses = classJson.data || [];
      setClasses(allClasses);

      // 2. Fetch timetable for each class in parallel
      const results = await Promise.allSettled(
        allClasses.map((cls) =>
          fetch(`${BASE}/api/class-timetable/${cls.class_id}/subsession/${subsessionId}`)
            .then((r) => r.json())
            .then((json) => ({ classId: cls.class_id, entries: json.success ? (json.data?.entries || []) : [] }))
            .catch(() => ({ classId: cls.class_id, entries: [] }))
        )
      );

      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          map[r.value.classId] = r.value.entries;
        }
      });
      setTimetables(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [schoolId, subsessionId]);

  useEffect(() => { load(); }, [load]);

  const saveTimetable = async (classId, entries, modifiedBy = null) => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/class-timetable/${classId}/subsession/${subsessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school_id: schoolId, entries, modified_by: modifiedBy }),
      });
      const json = await res.json();
      if (json.success) {
        setTimetables((prev) => ({ ...prev, [classId]: json.data?.entries || entries }));
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { classes, timetables, loading, saving, error, refetch: load, saveTimetable };
};

export default useSubsessionTimetable;
