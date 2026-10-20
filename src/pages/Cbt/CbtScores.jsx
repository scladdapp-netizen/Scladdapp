import { useCallback, useEffect, useState } from "react";
import { cbtAnalysis, cbtResults } from "../../api_call/useCbt";
import { STATUS_LABEL, fmt, typeLabel } from "./cbtUtils";

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

/** Scores, class statistics, per-question results and the way into releasing results. */
const CbtScores = ({ testId, go }) => {
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [resultsRes, analysisRes] = await Promise.all([cbtResults(testId, "all"), cbtAnalysis(testId)]);
    if (!resultsRes.success) return setError(resultsRes.message || "Could not load the scores.");
    setError("");
    setResults(resultsRes.data);
    return setAnalysis(analysisRes.success ? analysisRes.data : null);
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !results) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={load}>Try again</button></div>;
  if (!results) return <div className="cbt-card cbt-empty">Loading scores...</div>;

  const { test, rows } = results;
  const summary = analysis?.summary;
  const canRelease = test.status === "closed";

  const exportCsv = () => {
    const header = ["Student", "Admission number", "Status", "Marks", "Marks possible", "Percentage", `Score out of ${test.assessment_max}`];
    const lines = rows.map((row) => [row.full_name, row.admission_number || "", STATUS_LABEL[row.status] || row.status, row.marks_earned ?? "", row.marks_possible ?? "", row.percentage ?? "", row.normalized_score ?? ""]);
    const csv = [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(test.title || "test").replace(/[^a-z0-9]+/gi, "-")}-scores.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="cbt-stack">
      <div className="cbt-stats">
        <div className="cbt-stat"><span>Submitted</span><strong>{summary ? summary.submitted : "—"}</strong></div>
        <div className="cbt-stat"><span>Marked</span><strong>{summary ? summary.graded : "—"}</strong></div>
        <div className="cbt-stat"><span>Average</span><strong>{summary?.average == null ? "—" : `${fmt(summary.average)}%`}</strong></div>
        <div className="cbt-stat"><span>Highest</span><strong>{summary?.highest == null ? "—" : `${fmt(summary.highest)}%`}</strong></div>
        <div className="cbt-stat"><span>Lowest</span><strong>{summary?.lowest == null ? "—" : `${fmt(summary.lowest)}%`}</strong></div>
        <div className="cbt-stat"><span>Pass rate (50%+)</span><strong>{summary?.pass_rate == null ? "—" : `${fmt(summary.pass_rate)}%`}</strong></div>
      </div>

      <section className="cbt-card">
        <div className="cbt-section-row">
          <h2 className="cbt-section">Scores</h2>
          <div className="cbt-inline" style={{ marginTop: 0 }}>
            <button type="button" className="cbt-ghost" onClick={load}>Refresh</button>
            <button type="button" className="cbt-ghost" onClick={exportCsv} disabled={rows.length === 0}>Export CSV</button>
            <button type="button" className="cbt-btn" disabled={!canRelease} title={canRelease ? "" : "Close the test before releasing results"} onClick={() => go("release")}>Release results</button>
          </div>
        </div>
        <p className="cbt-muted">Released scores are written to {test.grading_field} (out of {test.assessment_max}) on the score sheet and report cards. A student who wrote more than once is scored on the attempt you chose, or the latest one.</p>
        <div className="cbt-table-wrap" style={{ marginTop: 14 }}>
          <table className="cbt-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th className="is-num">Marks</th>
                <th className="is-num">Percentage</th>
                <th className="is-num">Score ({test.grading_field})</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={6} className="cbt-empty">No students are assigned yet.</td></tr>}
              {rows.map((row) => (
                <tr key={row.student_id}>
                  <td><strong>{row.full_name}</strong>{row.admission_number && <span className="cbt-sub">{row.admission_number}</span>}</td>
                  <td>
                    <span className={`cbt-pill is-${row.status}`}>{STATUS_LABEL[row.status]}</span>
                    {row.attempts_count > 1 && <span className="cbt-pill">{row.attempts_count} attempts</span>}
                  </td>
                  <td className="is-num">{row.marks_earned === null ? "—" : `${fmt(row.marks_earned)} / ${fmt(row.marks_possible)}`}</td>
                  <td className="is-num">{row.percentage === null ? "—" : `${fmt(row.percentage)}%`}</td>
                  <td className="is-num">{row.normalized_score === null ? "—" : `${fmt(row.normalized_score)} / ${fmt(test.assessment_max)}`}</td>
                  <td>
                    {row.attempt_id && ["awaiting_marking", "graded", "released"].includes(row.status) ? (
                      <button type="button" className="cbt-link" onClick={() => go("marking", { attemptId: row.attempt_id })}>{row.status === "awaiting_marking" ? "Mark" : "Review"}</button>
                    ) : (
                      <span className="cbt-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {analysis && analysis.questions.length > 0 && (
        <section className="cbt-card">
          <h2 className="cbt-section">Question by question</h2>
          <p className="cbt-muted">A low percentage correct points to a question students found hard, or one worth checking.</p>
          <div className="cbt-table-wrap" style={{ marginTop: 14 }}>
            <table className="cbt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th className="is-num">Answered</th>
                  <th className="is-num">Not answered</th>
                  <th className="is-num">Result</th>
                </tr>
              </thead>
              <tbody>
                {analysis.questions.map((item) => (
                  <tr key={item.question_id}>
                    <td>{item.number}</td>
                    <td className="cbt-clip">{item.prompt}</td>
                    <td>{typeLabel(item.type)}</td>
                    <td className="is-num">{item.answered}</td>
                    <td className="is-num">{item.blank}</td>
                    <td className="is-num">
                      {item.correct_percent !== null ? `${fmt(item.correct_percent)}% correct` : item.average_marks !== null ? `${fmt(item.average_marks)} / ${fmt(item.marks)} average` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default CbtScores;
