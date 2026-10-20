import { useCallback, useEffect, useMemo, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtGet, cbtGrade, cbtQuestionAnswers } from "../../api_call/useCbt";
import { fmt } from "./cbtUtils";

const marksError = (value, max) => {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Enter a number.";
  if (number < 0 || number > Number(max)) return `0 to ${max}.`;
  if (Math.abs(number * 100 - Math.round(number * 100)) > 1e-6) return "Two decimals at most.";
  return "";
};

/** Mark one short question for every student in turn, which is quicker and fairer than student by student. */
const CbtMarkByQuestion = ({ testId }) => {
  const { addNotification } = useNotification();
  const [shorts, setShorts] = useState(null);
  const [questionId, setQuestionId] = useState("");
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await cbtGet(testId);
      if (!res.success) return setError(res.message || "Could not load the questions.");
      const list = res.data.questions.map((question, index) => ({ ...question, number: index + 1 })).filter((question) => question.type === "short");
      setShorts(list);
      return setQuestionId(list[0]?.question_id || "");
    })();
  }, [testId]);

  const load = useCallback(async () => {
    if (!questionId) return;
    setData(null);
    const res = await cbtQuestionAnswers(testId, questionId);
    if (!res.success) return setError(res.message || "Could not load the answers.");
    setError("");
    const next = {};
    res.data.rows.forEach((row) => {
      next[row.attempt_id] = { marks: row.awarded_marks ?? "", feedback: row.feedback || "", original: `${row.awarded_marks ?? ""}|${row.feedback || ""}` };
    });
    setDraft(next);
    return setData(res.data);
  }, [testId, questionId]);

  useEffect(() => {
    load();
  }, [load]);

  const dirtyRows = useMemo(() => (data ? data.rows.filter((row) => draft[row.attempt_id] && `${draft[row.attempt_id].marks}|${draft[row.attempt_id].feedback}` !== draft[row.attempt_id].original) : []), [data, draft]);

  if (error && !data && !shorts) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p></div>;
  if (!shorts) return <div className="cbt-card cbt-empty">Loading...</div>;
  if (shorts.length === 0) return <div className="cbt-card cbt-empty">This test has no short-answer questions, so there is nothing to mark by hand.</div>;

  const max = data?.question.marks;
  const hasErrors = data ? data.rows.some((row) => marksError(draft[row.attempt_id]?.marks, max)) : false;
  const needsReason = dirtyRows.some((row) => row.released);
  const set = (id, patch) => setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async () => {
    if (hasErrors) return addNotification("Fix the marks highlighted in red.", "error");
    if (needsReason && !reason.trim()) return addNotification("Add a reason for correcting a released result.", "error");
    setSaving(true);
    let failed = "";
    for (const row of dirtyRows) {
      const entry = draft[row.attempt_id];
      const res = await cbtGrade(testId, row.attempt_id, {
        reason: row.released ? reason : "",
        grades: [{ question_id: questionId, marks: entry.marks === "" ? null : Number(entry.marks), feedback: entry.feedback }],
      });
      if (!res.success) {
        failed = `${row.full_name}: ${res.message || "could not save."}`;
        break;
      }
    }
    setSaving(false);
    if (failed) addNotification(failed, "error");
    else addNotification(`Saved marks for ${dirtyRows.length} student${dirtyRows.length === 1 ? "" : "s"}.`, "success");
    setReason("");
    await load();
  };

  return (
    <div className="cbt-stack">
      <section className="cbt-card">
        <div className="cbt-section-row">
          <label className="cbt-field cbt-grow">
            Question
            <select value={questionId} onChange={(event) => setQuestionId(event.target.value)} disabled={saving}>
              {shorts.map((question) => (
                <option key={question.question_id} value={question.question_id}>
                  {question.number}. {question.prompt.slice(0, 80) || "Untitled question"}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="cbt-btn" onClick={save} disabled={saving || dirtyRows.length === 0 || hasErrors}>
            {saving ? "Saving..." : dirtyRows.length ? `Save ${dirtyRows.length} change${dirtyRows.length === 1 ? "" : "s"}` : "No changes"}
          </button>
        </div>
        {data && <p className="cbt-modal-text cbt-pre">{data.question.prompt}</p>}
        {data && <p className="cbt-muted">Worth {fmt(max)} marks. Leave marks blank to come back to an answer later.</p>}
        {needsReason && (
          <label className="cbt-field" style={{ marginTop: 12 }}>
            Reason for correcting a released result
            <input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          </label>
        )}
      </section>

      {!data && <div className="cbt-card cbt-empty">Loading answers...</div>}
      {data && data.rows.length === 0 && <div className="cbt-card cbt-empty">No student has submitted this test yet.</div>}
      {data && (
        <div className="cbt-q-list">
          {data.rows.map((row) => {
            const entry = draft[row.attempt_id] || { marks: "", feedback: "" };
            const problem = marksError(entry.marks, max);
            return (
              <div className={`cbt-q${problem ? " is-error" : ""}`} key={row.attempt_id}>
                <div className="cbt-q-top">
                  <strong>{row.full_name}</strong>
                  {row.released && <span className="cbt-pill is-released">Released</span>}
                </div>
                <div className="cbt-mark-body">
                  <div>
                    <p className="cbt-option-label">Answer</p>
                    <p className="cbt-answer">{row.answer.trim() ? row.answer : "No answer"}</p>
                  </div>
                  <div className="cbt-mark-entry">
                    <label className={`cbt-field${problem ? " is-error" : ""}`}>
                      Marks (0 to {fmt(max)})
                      <input type="number" min="0" max={max} step="0.25" value={entry.marks} onChange={(event) => set(row.attempt_id, { marks: event.target.value })} />
                      {problem && <span className="cbt-error">{problem}</span>}
                    </label>
                    <label className="cbt-field">
                      Feedback
                      <textarea value={entry.feedback} onChange={(event) => set(row.attempt_id, { feedback: event.target.value })} />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CbtMarkByQuestion;
