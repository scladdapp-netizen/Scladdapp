import { useCallback, useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtRelease, cbtReleasePreview } from "../../api_call/useCbt";
import { ConfirmDialog } from "./CbtModal";
import { fmt } from "./cbtUtils";

const CbtRelease = ({ testId, onBack, go }) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState([]);

  const load = useCallback(async () => {
    const res = await cbtReleasePreview(testId);
    if (res.success) setData(res.data);
    else setError(res.message || "Could not load the release review.");
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={onBack}>Back to tests</button></div>;
  if (!data) return <div className="cbt-card cbt-empty">Preparing the review...</div>;

  const { test, blockers, destination, rows, not_attempted: notAttempted } = data;
  const toRelease = rows.filter((row) => row.release_status !== "released" || row.sync_status === "failed");
  const replacing = rows.filter((row) => row.replaces_existing).length;
  const done = toRelease.length === 0 && rows.length > 0;

  const release = async () => {
    setBusy(true);
    const res = await cbtRelease(testId);
    setBusy(false);
    setConfirm(false);
    if (res.code === "partial") {
      setFailures(res.failures || []);
      addNotification(res.message, "error");
    } else if (!res.success) {
      addNotification(res.message || "Could not release the results.", "error");
    } else {
      setFailures([]);
      addNotification(`Results released to ${res.data.released} student${res.data.released === 1 ? "" : "s"} and written to the score sheet.`, "success");
    }
    load();
  };

  return (
    <div className="cbt-edit">
      <div className="cbt-editor-head">
        <div className="cbt-head-copy">
          <h1>Release results</h1>
          <p className="cbt-muted">{test.title} · {test.class_name}</p>
        </div>
        <div className="cbt-actions">
          <button type="button" className="cbt-ghost" onClick={onBack}>Back</button>
          <button type="button" className="cbt-ghost" onClick={() => go("results", { testId })}>View results</button>
          <button type="button" className="cbt-btn" disabled={blockers.length > 0 || toRelease.length === 0} onClick={() => setConfirm(true)}>
            {done ? "Nothing to release" : `Release ${toRelease.length} result${toRelease.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      <section className="cbt-card">
        <h2 className="cbt-section">Destination</h2>
        <p className="cbt-modal-text">
          Scores are written to <strong>{destination.field}</strong> (out of {destination.max}) for {destination.subject_name}. Students see their results in their report area only after release.
        </p>
        {blockers.length > 0 && (
          <div className="cbt-error-banner" role="alert">
            {blockers.map((message) => <p className="cbt-error" key={message}>{message}</p>)}
          </div>
        )}
        {replacing > 0 && <p className="cbt-note">{replacing} student{replacing === 1 ? " already has" : "s already have"} a different {destination.field} score. Releasing replaces it.</p>}
        {notAttempted > 0 && <p className="cbt-muted">{notAttempted} assigned student{notAttempted === 1 ? "" : "s"} did not attempt the test. Their score sheet is left unchanged.</p>}
        {failures.length > 0 && <p className="cbt-error">{failures.length} score{failures.length === 1 ? "" : "s"} could not be written. Press release again to retry.</p>}
      </section>

      <div className="cbt-table-wrap">
        <table className="cbt-table">
          <thead>
            <tr>
              <th>Student</th>
              <th className="is-num">Marks</th>
              <th className="is-num">Percentage</th>
              <th className="is-num">Score ({destination.field})</th>
              <th className="is-num">Currently on sheet</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="cbt-empty">No submitted attempts yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row.attempt_id}>
                <td><strong>{row.full_name}</strong></td>
                <td className="is-num">{fmt(row.marks_earned)} / {fmt(row.marks_possible)}</td>
                <td className="is-num">{fmt(row.percentage)}%</td>
                <td className="is-num">{fmt(row.normalized_score)} / {destination.max}</td>
                <td className="is-num">{row.current_sheet_value === null ? "—" : fmt(row.current_sheet_value)}</td>
                <td>
                  {row.release_status === "released" && row.sync_status !== "failed" ? <span className="cbt-pill is-released">Released</span>
                    : row.sync_status === "failed" ? <span className="cbt-pill is-closed">Retry needed</span>
                    : <span className="cbt-pill is-graded">Ready</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Release these results?"
          message={`${toRelease.length} student${toRelease.length === 1 ? "" : "s"} will be able to see their results, and their scores will be written to ${destination.field} on the score sheet and report cards.${replacing ? ` ${replacing} existing score${replacing === 1 ? "" : "s"} will be replaced.` : ""}`}
          confirmLabel="Release results"
          busy={busy}
          onConfirm={release}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
};

export default CbtRelease;
