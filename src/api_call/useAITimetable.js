import { useState, useEffect } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

function authHeaders() {
  let token = "";
  try {
    const raw = sessionStorage.getItem("user");
    if (raw) token = JSON.parse(raw)?.token || "";
  } catch (_) {}
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** List AI configs for timetable generation (config_id, label, model, is_active). */
export function useAITimetableModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/ai-timetable/models`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setModels(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { models, loading };
}

/**
 * Hook for AI timetable generation.
 * - Pass classId for single-class mode (used from TimetableEditor)
 * - Omit classId for all-class mode (used from AdminSubseasionTimetable)
 * - Pass configId to use a specific AIConfig (falls back to active timetable_generator config)
 */
const useAITimetable = () => {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generate = async ({
    templateId,
    schoolId,
    subsessionId,
    classId = null,
    notes,
    generatedBy = null,
    configId = null,
  }) => {
    setGenerating(true);
    setError(null);

    const controller = new AbortController();
    const timeoutMs = 180_000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}/api/ai-timetable/generate`, {
        method: "POST",
        headers: authHeaders(),
        signal: controller.signal,
        body: JSON.stringify({
          school_id: schoolId,
          subsession_id: subsessionId,
          template_id: templateId,
          class_id: classId || undefined,
          notes: notes || "",
          generated_by: generatedBy,
          configId: configId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data?.message) {
        return { success: false, message: `Server error (${res.status})` };
      }
      return data;
    } catch (err) {
      const message =
        err.name === "AbortError"
          ? "Generation timed out after 3 minutes. Try one class at a time or a faster model."
          : err.message;
      setError(message);
      return { success: false, message };
    } finally {
      clearTimeout(timeoutId);
      setGenerating(false);
    }
  };

  return { generating, error, generate };
};

export default useAITimetable;
