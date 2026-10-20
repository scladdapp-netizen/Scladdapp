import { useCallback, useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtAttempt, cbtGrade } from "../../api_call/useCbt";
import { fmt, formatDateTime } from "./cbtUtils";

const ACTION_LABEL = {
  grade: "Marked",
  score_correction: "Correction after release",
  release: "Released to score sheet",
  score_updated: "Score sheet updated",
};

const marksError = (value, max) => {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  if (!Number.isFinite(number)) return "Enter a number.";
  if (number < 0 || number > Number(max)) return `Marks must be between 0 and ${max}.`;
  if (Math.abs(number * 100 - Math.round(number * 100)) > 1e-6) return "Use at most two decimal places.";
  return "";
};

const CbtMarking = ({ testId, attemptId, onBack }) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await cbtAttempt(testId, attemptId);
    if (!res.success) return setError(res.message || "Could not open this attempt.");
    setData(res.data);
    const next = {};
    res.data.items.forEach((item) => {
      if (item.question.type === "short") next[item.question.question_id] = { marks: item.awarded_marks ?? "", feedback: item.feedback || "" };
    });
    setDraft(next);
  }, [testId, attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={onBack}>Back</button></div>;
  if (!data) return <div className="cbt-card cbt-empty">Opening attempt...</div>;

  const { attempt, student, test, items, history } = data;
  const released = attempt.release_status === "released";
  const shorts = items.filter((item) => item.question.type === "short");
  const errors = shorts.map((item) => marksError(draft[item.question.question_id]?.marks, item.question.marks));
  const hasErrors = errors.some(Boolean);
  const pendingCount = shorts.filter((item) => draft[item.question.question_id]?.marks === "").length;
  const set = (id, patch) => setDraft((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const save = async () => {
    if (hasErrors) return addNotification("Fix the marks highlighted in red.", "error");
    if (released && !reason.trim()) return addNotification("Add a reason for correcting a released result.", "error");
    setSaving(true);
    const res = await cbtGrade(testId, attemptId, {
      reason,
      grades: shorts.map((item) => ({
        question_id: item.question.question_id,
        marks: draft[item.question.question_id].marks === "" ? null : Number(draft[item.question.question_id].marks),
        feedback: draft[item.question.question_id].feedback,
      })),
    });
    setSaving(false);
    if (!res.success) return addNotification(res.message || "Could not save the marks.", "error");
    addNotification(released ? "Correction saved and the score sheet updated." : pendingCount ? "Progress saved." : "Marks saved.", "success");
    setReason("");
    load();
  };

  return (
    <div className="cbt-edit">
      <div className="cbt-editor-head">
        <div className="cbt-head-copy">
          <h1>{student.full_name}</h1>
          <p className="cbt-muted">
            {test.title} · submitted {formatDateTime(attempt.submitted_at)}
            {attempt.submit_reason === "timeout" ? " (time ran out)" : attempt.submit_reason === "closed" ? " (test closed)" : ""}
          </p>
          <p className="cbt-hint is-ready">
            {fmt(attempt.marks_earned)} / {fmt(attempt.marks_possible)} marks · {fmt(attempt.percentage)}%
            {attempt.normalized_score !== null && ` · ${fmt(attempt.normalized_score)} / ${fmt(attempt.normalized_max)} on the score sheet`}
            {attempt.grading_status !== "graded" && " · some answers still need marking"}
            {released && " · released"}
          </p>
        </div>
        <div className="cbt-actions">
          <button type="button" className="cbt-ghost" onClick={onBack}>Back</button>
          {shorts.length > 0 && (
            <button type="button" className="cbt-btn" onClick={save} disabled={saving || hasErrors}>
              {saving ? "Saving..." : released ? "Save correction" : "Save marks"}
            </button>
          )}
        </div>
      </div>

      {released && shorts.length > 0 && (
        <section className="cbt-card">
          <p className="cbt-muted">Results for this student have been released. A correction updates what the student sees and the score sheet, and is recorded.</p>
          <label className="cbt-field">
            Reason for the correction
            <input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} />
          </label>
        </section>
      )}

      <div className="cbt-q-list">
        {items.map((item) => {
          const { question } = item;
          const objective = question.type !== "short";
          const chosen = (question.options || []).find((option) => option.id === item.answer);
          const correct = (question.options || []).find((option) => option.id === question.correct_option_id);
          const entry = draft[question.question_id];
          const error = shorts.includes(item) ? errors[shorts.indexOf(item)] : "";
          return (
            <div className={`cbt-q${error ? " is-error" : ""}`} key={question.question_id}>
              <div className="cbt-q-top">
                <strong><span className="cbt-num">{item.number}</span>{question.prompt}</strong>
                <span className="cbt-muted">{objective ? `${fmt(item.awarded_marks)} / ${fmt(question.marks)}` : `${question.marks} marks`}</span>
              </div>
              <div className="cbt-mark-body">
                <div>
                  <p className="cbt-option-label">Student's answer</p>
                  {objective ? (
                    <p className={`cbt-answer${item.awarded_marks > 0 ? " is-right" : " is-wrong"}`}>{chosen ? chosen.text : "No answer"}</p>
                  ) : (
                    <p className="cbt-answer">{item.answer.trim() ? item.answer : "No answer"}</p>
                  )}
                  {objective && item.awarded_marks <= 0 && correct && <p className="cbt-muted">Correct answer: {correct.text}</p>}
                  {!objective && (
                    <div className="cbt-private">
                      <p className="cbt-option-label">For you only</p>
                      {question.expected_answer && <p><strong>Expected:</strong> {question.expected_answer}</p>}
                      {question.marking_guide && <p><strong>Marking guide:</strong> {question.marking_guide}</p>}
                      {question.grading_notes && <p><strong>Notes:</strong> {question.grading_notes}</p>}
                      {!question.expected_answer && !question.marking_guide && !question.grading_notes && <p className="cbt-muted">No expected answer was written.</p>}
                    </div>
                  )}
                </div>
                {!objective && entry && (
                  <div className="cbt-mark-entry">
                    <label className={`cbt-field${error ? " is-error" : ""}`}>
                      Marks (0 to {question.marks})
                      <input type="number" min="0" max={question.marks} step="0.25" value={entry.marks} onChange={(event) => set(question.question_id, { marks: event.target.value })} />
                      {error && <span className="cbt-error">{error}</span>}
                    </label>
                    <label className="cbt-field">
                      Feedback to the student
                      <textarea value={entry.feedback} onChange={(event) => set(question.question_id, { feedback: event.target.value })} />
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <section className="cbt-card">
          <h2 className="cbt-section">History</h2>
          <ul className="cbt-history">
            {history.map((row) => (
              <li key={row.audit_id}>
                <strong>{ACTION_LABEL[row.action] || row.action}</strong>
                <span className="cbt-muted"> · {formatDateTime(row.at)} · {row.actor_role}</span>
                {row.reason && <span className="cbt-muted"> · {row.reason}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default CbtMarking;
