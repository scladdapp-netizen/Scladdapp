import { useEffect, useState } from "react";
import { examResult, examResults } from "../../../../../../api_call/useCbt";
import "../../../../../Cbt/CbtDesk.css";

const fmt = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? String(Math.round(number * 100) / 100) : "—";
};

/** Released CBT results for this term. Nothing appears until the teacher releases them. */
const StudentCbtResults = ({ subsessionId }) => {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setOpen(null);
    setDetail(null);
    (async () => {
      const res = await examResults(subsessionId);
      if (alive && res.success) setRows(res.data);
    })();
    return () => {
      alive = false;
    };
  }, [subsessionId]);

  const show = async (attemptId) => {
    if (open === attemptId) {
      setOpen(null);
      return;
    }
    setOpen(attemptId);
    setDetail(null);
    setError("");
    setLoading(true);
    const res = await examResult(attemptId);
    setLoading(false);
    if (res.success) setDetail(res.data);
    else setError(res.message || "Could not open this result.");
  };

  if (rows.length === 0) return null;

  return (
    <div className="cbt rsi-section" style={{ marginTop: 16 }}>
      <div className="rsi-section-header">
        <span className="rsi-section-title">Test results</span>
      </div>
      <div className="cbt-table-wrap">
        <table className="cbt-table">
          <thead>
            <tr>
              <th>Test</th>
              <th>Subject</th>
              <th className="is-num">Marks</th>
              <th className="is-num">Percentage</th>
              <th className="is-num">Added to report</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.attempt_id}>
                <td><strong>{row.title}</strong></td>
                <td>{row.subject_name}</td>
                <td className="is-num">{fmt(row.marks_earned)} / {fmt(row.marks_possible)}</td>
                <td className="is-num">{fmt(row.percentage)}%</td>
                <td className="is-num">{fmt(row.normalized_score)} / {fmt(row.normalized_max)} <span className="cbt-sub">{row.assessment}</span></td>
                <td><button type="button" className="cbt-link" onClick={() => show(row.attempt_id)}>{open === row.attempt_id ? "Hide answers" : "Review answers"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="cbt-q-list" style={{ marginTop: 14 }}>
          {loading && <p className="cbt-empty">Loading...</p>}
          {error && <p className="cbt-error">{error}</p>}
          {detail && detail.items.map((item) => {
            const objective = item.type !== "short";
            const chosen = item.options.find((option) => option.id === item.answer);
            const correct = item.options.find((option) => option.id === item.correct_option_id);
            const right = objective && item.awarded_marks > 0;
            return (
              <div className="cbt-q" key={item.number}>
                <div className="cbt-q-top">
                  <strong><span className="cbt-num">{item.number}</span>{item.prompt}</strong>
                  <span className="cbt-muted">{fmt(item.awarded_marks)} / {fmt(item.marks)}</span>
                </div>
                <div style={{ padding: 16, display: "grid", gap: 8 }}>
                  <div>
                    <p className="cbt-option-label">Your answer</p>
                    <p className={`cbt-answer${objective ? (right ? " is-right" : " is-wrong") : ""}`}>
                      {objective ? (chosen ? chosen.text : "No answer") : (item.answer.trim() ? item.answer : "No answer")}
                    </p>
                  </div>
                  {objective && !right && correct && (
                    <div>
                      <p className="cbt-option-label">Correct answer</p>
                      <p className="cbt-answer is-right">{correct.text}</p>
                    </div>
                  )}
                  {item.feedback && (
                    <div>
                      <p className="cbt-option-label">Teacher's feedback</p>
                      <p className="cbt-answer">{item.feedback}</p>
                    </div>
                  )}
                  {item.explanation && (
                    <div>
                      <p className="cbt-option-label">Explanation</p>
                      <p className="cbt-answer">{item.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentCbtResults;
