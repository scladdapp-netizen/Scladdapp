import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtRoster, cbtStartSessions } from "../../api_call/useCbt";
import { CbtModal } from "./CbtModal";
import { fmt } from "./cbtUtils";

const STATS = [
  ["assigned", "Assigned"],
  ["not_started", "Not started"],
  ["in_progress", "Writing now"],
  ["awaiting_marking", "Awaiting marking"],
  ["graded", "Marked"],
  ["released", "Released"],
];

const NEXT_STEP = {
  draft: "When this test is complete, every student in the class for this term is assigned. Nothing starts until you start them.",
  published: "Press Start test session, set how long it lasts, and each student gets a link. They do not sign in.",
  closed: "On the Students tab, open a finished student to mark short answers. Reopen the test if someone still needs to write.",
};

const durationLabel = (total) => {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (mins) parts.push(`${mins} minute${mins === 1 ? "" : "s"}`);
  return parts.join(" ") || "0 minutes";
};

/** The test at a glance, and the button that starts the whole class. */
const CbtOverview = ({ test, initialStats = null, onChanged, onClose, onReopen, onEdit }) => {
  const { addNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(1);
  const [mins, setMins] = useState(0);
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState(null);
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    if (initialStats) setStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    let live = true;
    const pull = async () => {
      const res = await cbtRoster(test.test_id);
      if (live && res.success) setStats(res.data.stats);
    };
    pull();
    if (test.status !== "published") return () => { live = false; };
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") pull();
    }, 8000);
    return () => {
      live = false;
      clearInterval(poll);
    };
  }, [test]);

  const facts = [
    ["Class", test.class_name || "—"],
    ["Subject", test.subject_name],
    ["Questions", test.questions.length],
    ["Total marks", fmt(test.total_marks)],
    ["Feeds", test.grading_field ? `${test.grading_field} (out of ${test.assessment_max})` : "—"],
    ["Explanations", test.release_explanations ? "Shown with released results" : "Not shown to students"],
  ];

  const sittingMinutes = () => {
    const h = Number(hours);
    const m = Number(mins);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 10 || m < 0 || m > 59) return null;
    const total = h * 60 + m;
    return total >= 1 && total <= 600 ? total : null;
  };

  const openStart = () => {
    const total = Math.max(1, Number(test.duration_minutes) || 60);
    setHours(Math.floor(total / 60));
    setMins(total % 60);
    setOpen(true);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addNotification("Link copied.", "success");
    } catch {
      addNotification("Could not copy. Select the link and copy it yourself.", "error");
    }
  };

  const startNow = async () => {
    const duration = sittingMinutes();
    if (!duration) return addNotification("Set a duration between 1 minute and 10 hours.", "error");
    setBusy(true);
    const roster = await cbtRoster(test.test_id);
    if (!roster.success) {
      setBusy(false);
      return addNotification(roster.message || "Could not load the class.", "error");
    }
    const ids = (roster.data.rows || [])
      .filter((row) => row.assigned && (row.state === "not_started" || row.state === "absent"))
      .map((row) => row.student_id);
    if (ids.length === 0) {
      setBusy(false);
      setOpen(false);
      return addNotification("Everyone in this class has already been started.", "error");
    }
    const res = await cbtStartSessions(test.test_id, { kind: "start", student_ids: ids, duration_minutes: duration });
    setBusy(false);
    if (!res.success) return addNotification(res.message || "Could not start the session.", "error");
    const skipped = res.data?.skipped || [];
    if (res.data?.started) addNotification(`Started ${res.data.started} student${res.data.started === 1 ? "" : "s"}.`, "success");
    if (skipped.length) addNotification(`${skipped[0].full_name}: ${skipped[0].message}${skipped.length > 1 ? ` (and ${skipped.length - 1} more skipped)` : ""}`, "error");
    setOpen(false);
    if (onChanged) onChanged();
    const next = res.data?.links || [];
    if (next.length) setLinks(next);
  };

  const duration = sittingMinutes();

  if (!stats) return <div className="cbt-card cbt-empty">Opening test...</div>;

  return (
    <div className="cbt-stack">
      <div className="cbt-overview-head">
        <h2>Overview</h2>
        <div className="cbt-inline cbt-overview-actions">
          <button type="button" className="cbt-ghost" onClick={onEdit}>Edit CBT</button>
          {test.status === "published" && <button type="button" className="cbt-btn" onClick={openStart}>Start test session</button>}
          {test.status === "published" && <button type="button" className="cbt-ghost is-danger-text" onClick={onClose}>Close test</button>}
          {test.status === "closed" && <button type="button" className="cbt-btn" onClick={onReopen}>Reopen test</button>}
        </div>
      </div>
      <div className="cbt-overview-stats">
        {STATS.map(([key, label]) => (
          <div className={`cbt-stat${key === "in_progress" && stats[key] > 0 ? " is-live" : ""}`} key={key}>
            <span className="cbt-stat-label">{label}</span>
            <strong className="cbt-stat-value">{stats[key]}</strong>
          </div>
        ))}
      </div>
      <section className="cbt-card">
        <h2 className="cbt-section">Test</h2>
        <dl className="cbt-facts-grid">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="cbt-note">{NEXT_STEP[test.status]}</p>
        {test.instructions && (
          <>
            <h3 className="cbt-subhead">Instructions students see</h3>
            <p className="cbt-modal-text cbt-pre">{test.instructions}</p>
          </>
        )}
      </section>

      {open && (
        <CbtModal
          title="Start test session"
          onClose={() => { if (!busy) setOpen(false); }}
          locked={busy}
          footer={
            <>
              <button type="button" className="cbt-ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button type="button" className="cbt-btn" onClick={startNow} disabled={busy || !duration}>{busy ? "Starting..." : "Start now"}</button>
            </>
          }
        >
          <p className="cbt-modal-text">
            Everyone in {test.class_name || "this class"} who has not started will have {duration ? durationLabel(duration) : "a duration you set"}, starting now. Each student gets a link. They open it and write. They do not sign in.
          </p>
          <div className="cbt-inline" style={{ marginTop: 0 }}>
            <label className="cbt-field">Hours
              <input type="number" min="0" max="10" value={hours} onChange={(event) => setHours(event.target.value)} />
            </label>
            <label className="cbt-field">Minutes
              <input type="number" min="0" max="59" value={mins} onChange={(event) => setMins(event.target.value)} />
            </label>
          </div>
        </CbtModal>
      )}

      {links && (
        <CbtModal
          title="Exam links"
          onClose={() => setLinks(null)}
          wide
          footer={<button type="button" className="cbt-btn" onClick={() => setLinks(null)}>Done</button>}
        >
          <p className="cbt-modal-text">Give each student their own link. The first code is their seat and the second is this session. The link works until their time runs out.</p>
          {links.map((row) => {
            const href = `${window.location.origin}/exam/${row.student_code}/${row.session_code}`;
            return (
              <div className="cbt-code is-link" key={`${row.session_code}-${row.student_code}`}>
                <span>
                  <strong>{row.full_name}</strong>
                  <span className="cbt-code-link">{href}</span>
                </span>
                <button type="button" className="cbt-ghost" onClick={() => copyText(href)}>Copy link</button>
              </div>
            );
          })}
        </CbtModal>
      )}
    </div>
  );
};

export default CbtOverview;
