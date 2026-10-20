import { useCallback, useEffect, useState } from "react";
import { cbtResults } from "../../api_call/useCbt";
import { FILTERS, STATUS_LABEL, fmt, formatDateTime } from "./cbtUtils";

/** Every student's counted attempt with a way into marking it. Lives inside the test's detail page. */
const CbtResults = ({ testId, initialFilter = "all", go }) => {
  const [filter, setFilter] = useState(initialFilter);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await cbtResults(testId, filter);
    if (res.success) {
      setData(res.data);
      setError("");
    } else {
      setError(res.message || "Could not load results.");
    }
    setLoading(false);
  }, [testId, filter]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={load}>Try again</button></div>;
  if (!data) return <div className="cbt-card cbt-empty">Loading...</div>;

  const { test, rows } = data;

  return (
    <div className="cbt-edit">
      <div className="cbt-section-row">
        <div className="cbt-chips" role="tablist" aria-label="Filter students">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={`cbt-chip${filter === item.id ? " is-on" : ""}`} onClick={() => setFilter(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="cbt-ghost" onClick={load} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>

      <div className="cbt-table-wrap">
        <table className="cbt-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Status</th>
              <th>Submitted</th>
              <th className="is-num">Marks</th>
              <th className="is-num">Percentage</th>
              <th className="is-num">Scaled to {test.assessment_max}</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="cbt-empty">No students match this filter.</td></tr>}
            {rows.map((row) => (
              <tr key={row.student_id}>
                <td><strong>{row.full_name}</strong>{row.admission_number && <span className="cbt-sub">{row.admission_number}</span>}</td>
                <td>
                  <span className={`cbt-pill is-${row.status}`}>{STATUS_LABEL[row.status]}</span>
                  {row.attempts_count > 1 && <span className="cbt-pill">{row.attempts_count} attempts</span>}
                  {row.sync_status === "failed" && <span className="cbt-pill is-closed">Score not written</span>}
                </td>
                <td>{formatDateTime(row.submitted_at)}{row.submit_reason === "timeout" && <span className="cbt-sub">Time ran out</span>}{row.submit_reason === "closed" && <span className="cbt-sub">Test closed</span>}{row.submit_reason === "teacher" && <span className="cbt-sub">Ended by teacher</span>}</td>
                <td className="is-num">{row.marks_earned === null ? "—" : `${fmt(row.marks_earned)} / ${fmt(row.marks_possible)}`}</td>
                <td className="is-num">{row.percentage === null ? "—" : `${fmt(row.percentage)}%`}</td>
                <td className="is-num">{row.normalized_score === null ? "—" : fmt(row.normalized_score)}</td>
                <td>
                  {row.attempt_id && ["awaiting_marking", "graded", "released"].includes(row.status) ? (
                    <button type="button" className="cbt-link" onClick={() => go("marking", { attemptId: row.attempt_id, filter })}>
                      {row.status === "awaiting_marking" ? "Mark" : "Review"}
                    </button>
                  ) : (
                    <span className="cbt-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CbtResults;
