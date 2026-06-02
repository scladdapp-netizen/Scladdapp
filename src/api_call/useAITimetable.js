import { useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for AI timetable generation.
 * - Pass classId for single-class mode (used from TimetableEditor)
 * - Omit classId for all-class mode (used from AdminSubseasionTimetable)
 */
const useAITimetable = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generate = async ({ templateId, schoolId, subsessionId, classId = null, notes, generatedBy = null }) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ai-timetable/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: schoolId,
          subsession_id: subsessionId,
          template_id: templateId,
          class_id: classId || undefined,
          notes: notes || "",
          generated_by: generatedBy,
        }),
      });
      const data = await res.json();
      return data; // { success, message, data, entries? }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setGenerating(false);
    }
  };

  return { generating, error, generate };
};

export default useAITimetable;
