import { useCallback, useEffect, useState } from "react";
import { cbtAudit } from "../../api_call/useCbt";
import { formatDateTime } from "./cbtUtils";

const LABEL = {
  create_draft: "Draft created",
  delete_draft: "Draft deleted",
  publish: "Students assigned",
  assignments_changed: "Student access changed",
  code_regenerated: "New exam code created",
  deadline_extended: "Closing time changed",
  close: "Test closed",
  reopen: "Test reopened",
  archive: "Test archived",
  session_started: "Countdown started",
  rewrite_started: "Rewrite started",
  session_ended: "Sitting ended by teacher",
  time_added: "Time added",
  marked_absent: "Marked absent",
  absent_cleared: "Absent cleared",
  counted_attempt_set: "Counted attempt chosen",
  grade: "Answer marked",
  score_correction: "Correction after release",
  release: "Released to score sheet",
  score_updated: "Score sheet updated",
};

const detail = (row) => {
  if (row.action === "time_added" && row.next?.minutes) return `${row.next.minutes} minutes`;
  if ((row.action === "session_started" || row.action === "rewrite_started") && row.next?.attempt_number) return `Attempt ${row.next.attempt_number}`;
  if (row.action === "publish" && row.next?.students) return `${row.next.students} students`;
  if (row.action === "release" && row.next?.sheet_value !== undefined) return `Score ${row.next.sheet_value}${row.previous?.sheet_value != null ? ` (was ${row.previous.sheet_value})` : ""}`;
  return "";
};

/** Everything that happened to this test, newest first. */
const CbtActivity = ({ testId }) => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await cbtAudit(testId);
    if (res.success) {
      setRows(res.data);
      setError("");
    } else {
      setError(res.message || "Could not load the activity.");
    }
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !rows) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={load}>Try again</button></div>;
  if (!rows) return <div className="cbt-card cbt-empty">Loading activity...</div>;

  return (
    <section className="cbt-card">
      <div className="cbt-section-row">
        <h2 className="cbt-section">Activity</h2>
        <button type="button" className="cbt-ghost" onClick={load}>Refresh</button>
      </div>
      {rows.length === 0 && <p className="cbt-empty">Nothing has happened yet.</p>}
      <ul className="cbt-history">
        {rows.map((row) => (
          <li key={row.audit_id}>
            <strong>{LABEL[row.action] || row.action}</strong>
            {row.student_name && <span> · {row.student_name}</span>}
            {detail(row) && <span className="cbt-muted"> · {detail(row)}</span>}
            <span className="cbt-muted"> · {formatDateTime(row.at)} · {row.actor_role}</span>
            {row.reason && <span className="cbt-muted"> · {row.reason}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CbtActivity;
