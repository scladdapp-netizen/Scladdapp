const BASE = `${import.meta.env.VITE_API_BASE_URL}/api/cbt`;

const token = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null")?.token || "";
  } catch {
    return "";
  }
};

/** Every call carries the signed login token. Never throws: callers read `success` and `message`. */
const call = async (method, path, body) => {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { success: false, message: "Request failed", ...data, status: res.status };
  } catch {
    return { success: false, message: "Could not reach the server. Check your connection.", status: 0, offline: true };
  }
};

const query = (params) => new URLSearchParams(params).toString();

// ── Staff ─────────────────────────────────────────────────────────────────────
export const cbtContext = (subjectId, subsessionId) => call("GET", `/context?${query({ subject_id: subjectId, subsession_id: subsessionId })}`);
export const cbtList = (subjectId, subsessionId, { page = 1, limit = 20, search = "", searchField = "", classId = "" } = {}) =>
  call("GET", `/tests?${query({ subject_id: subjectId, subsession_id: subsessionId, page, limit, search, searchField, class_id: classId })}`);
export const cbtGet = (testId) => call("GET", `/tests/${testId}`);
export const cbtCreate = (body) => call("POST", "/tests", body);
export const cbtUpdate = (testId, body) => call("PATCH", `/tests/${testId}`, body);
export const cbtDelete = (testId) => call("DELETE", `/tests/${testId}`);
export const cbtValidation = (testId) => call("GET", `/tests/${testId}/validation`);
export const cbtStudents = (testId) => call("GET", `/tests/${testId}/students`);
export const cbtPublish = (testId, body) => call("POST", `/tests/${testId}/publish`, body);
export const cbtAssignments = (testId, body) => call("PATCH", `/tests/${testId}/assignments`, body);
export const cbtNewCode = (testId) => call("POST", `/tests/${testId}/access-code`, {});
export const cbtDeadline = (testId, closesAt) => call("PATCH", `/tests/${testId}/deadline`, { closes_at: closesAt });
export const cbtClose = (testId) => call("POST", `/tests/${testId}/close`, {});
export const cbtResults = (testId, filter = "all") => call("GET", `/tests/${testId}/results?${query({ filter })}`);
export const cbtAttempt = (testId, attemptId) => call("GET", `/tests/${testId}/attempts/${attemptId}`);
export const cbtGrade = (testId, attemptId, body) => call("PATCH", `/tests/${testId}/attempts/${attemptId}/grades`, body);
export const cbtReleasePreview = (testId) => call("GET", `/tests/${testId}/release-preview`);
export const cbtRelease = (testId) => call("POST", `/tests/${testId}/release`, {});
export const cbtAudit = (testId) => call("GET", `/tests/${testId}/audit`);
export const cbtRoster = (testId) => call("GET", `/tests/${testId}/roster`);
export const cbtAnalysis = (testId) => call("GET", `/tests/${testId}/analysis`);
export const cbtQuestionAnswers = (testId, questionId) => call("GET", `/tests/${testId}/questions/${questionId}/answers`);
export const cbtStartSessions = (testId, body) => call("POST", `/tests/${testId}/sessions`, body);
export const cbtEndSession = (testId, attemptId) => call("POST", `/tests/${testId}/attempts/${attemptId}/end`, {});
export const cbtAddTime = (testId, attemptId, minutes) => call("PATCH", `/tests/${testId}/attempts/${attemptId}/time`, { minutes });
export const cbtAbsent = (testId, studentId, absent) => call("PATCH", `/tests/${testId}/students/${studentId}/absent`, { absent });
export const cbtCounted = (testId, studentId, attemptId) => call("PATCH", `/tests/${testId}/students/${studentId}/counted`, { attempt_id: attemptId });
export const cbtReopen = (testId) => call("POST", `/tests/${testId}/reopen`, {});

// ── Student ───────────────────────────────────────────────────────────────────
export const examAccess = (code) => call("POST", "/exam/access", { code });
export const examStart = (testId, code) => call("POST", `/exam/${testId}/start`, { code });
export const examResume = (attemptId) => call("GET", `/exam/attempts/${attemptId}`);
export const examSave = (attemptId, answers) => call("PUT", `/exam/attempts/${attemptId}/answers`, { answers });
export const examSubmit = (attemptId, answers) => call("POST", `/exam/attempts/${attemptId}/submit`, { answers });
export const examResults = (subsessionId) => call("GET", `/exam/results${subsessionId ? `?${query({ subsession_id: subsessionId })}` : ""}`);
export const examResult = (attemptId) => call("GET", `/exam/results/${attemptId}`);
