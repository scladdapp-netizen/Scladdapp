import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtAbsent, cbtAddTime, cbtAssignments, cbtCounted, cbtEndSession, cbtRoster, cbtStartSessions } from "../../api_call/useCbt";
import { CbtModal, ConfirmDialog } from "./CbtModal";
import CbtRowMenu from "./CbtRowMenu";
import { STATUS_LABEL, fmt, formatClock } from "./cbtUtils";

const POLL_MS = 8000;
const STATS = [
  ["assigned", "Assigned"],
  ["not_started", "Not started"],
  ["in_progress", "Writing now"],
  ["awaiting_marking", "Awaiting marking"],
  ["graded", "Marked"],
  ["released", "Released"],
];
const VIEWS = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "Writing now" },
  { id: "finished", label: "Finished" },
];
const FINISHED = ["awaiting_marking", "graded", "released"];

const timeOf = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "");

/**
 * The sitting: every student on one screen. The teacher picks students and starts their
 * countdown, watches them write, ends or extends a sitting, and lets finished students rewrite.
 */
const CbtSitting = ({ testId, onAssign, onChanged, go }) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [view, setView] = useState("all");
  const [now, setNow] = useState(() => Date.now());
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [pick, setPick] = useState("");
  const offset = useRef(0);

  const load = useCallback(
    async (silent = false) => {
      const res = await cbtRoster(testId);
      if (!res.success) {
        if (!silent) setError(res.message || "Could not load the students.");
        return;
      }
      offset.current = new Date(res.data.server_now).getTime() - Date.now();
      setError("");
      setData(res.data);
    },
    [testId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const writing = data?.stats.in_progress || 0;
  useEffect(() => {
    if (!writing) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [writing, load]);

  const rows = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (term && !`${row.full_name} ${row.admission_number || ""}`.toLowerCase().includes(term)) return false;
      if (view === "not_started") return row.assigned && (row.state === "not_started" || row.state === "absent");
      if (view === "in_progress") return row.state === "in_progress";
      if (view === "finished") return FINISHED.includes(row.state);
      return true;
    });
  }, [data, search, view]);

  if (error && !data) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={() => load()}>Try again</button></div>;
  if (!data) return <div className="cbt-card cbt-empty">Loading students...</div>;

  const { test, stats } = data;
  const live = test.status === "published";

  if (test.status === "draft") {
    return (
      <div className="cbt-card cbt-empty">
        <p className="cbt-modal-text">This test is still a draft. Assign the students who will write it to make it ready.</p>
        <button type="button" className="cbt-btn" onClick={onAssign}>Assign students</button>
      </div>
    );
  }

  const byId = new Map(data.rows.map((row) => [row.student_id, row]));
  const picked = [...selected].map((id) => byId.get(id)).filter(Boolean);
  const canStart = (row) => row.assigned && (row.state === "not_started" || row.state === "absent");
  const canRewrite = (row) => row.assigned && (row.state === "awaiting_marking" || row.state === "graded");
  const startIds = picked.filter(canStart).map((row) => row.student_id);
  const rewriteIds = picked.filter(canRewrite).map((row) => row.student_id);

  const visibleIds = rows.filter((row) => row.assigned).map((row) => row.student_id);
  const allShown = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (allShown ? next.delete(id) : next.add(id)));
      return next;
    });
  const toggleOne = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const close = () => {
    setDialog(null);
    setReason("");
    setMinutes(5);
    setPick("");
  };
  const refresh = async () => {
    await load(true);
    if (onChanged) onChanged();
  };

  const report = (res, past) => {
    if (!res.success) {
      addNotification(res.message || "That did not work.", "error");
      return false;
    }
    const skipped = res.data?.skipped || [];
    if (res.data?.started) addNotification(`${past} ${res.data.started} student${res.data.started === 1 ? "" : "s"}.`, "success");
    if (skipped.length) addNotification(`${skipped[0].full_name}: ${skipped[0].message}${skipped.length > 1 ? ` (and ${skipped.length - 1} more skipped)` : ""}`, "error");
    return true;
  };

  const startNow = async () => {
    setBusy(true);
    const res = await cbtStartSessions(testId, { kind: "start", student_ids: dialog.ids });
    setBusy(false);
    report(res, "Started");
    close();
    setSelected(new Set());
    refresh();
  };

  const rewriteNow = async () => {
    setBusy(true);
    const res = await cbtStartSessions(testId, { kind: "rewrite", student_ids: dialog.ids, reason });
    setBusy(false);
    if (!report(res, "Started a rewrite for")) return;
    close();
    setSelected(new Set());
    refresh();
  };

  const addTimeNow = async () => {
    setBusy(true);
    const res = await cbtAddTime(testId, dialog.row.writing_attempt_id, Number(minutes));
    setBusy(false);
    if (!res.success) return addNotification(res.message || "Could not add time.", "error");
    addNotification(`Added ${minutes} minute${Number(minutes) === 1 ? "" : "s"} for ${dialog.row.full_name}.`, "success");
    close();
    return refresh();
  };

  const endNow = async () => {
    setBusy(true);
    const res = await cbtEndSession(testId, dialog.row.writing_attempt_id);
    setBusy(false);
    if (!res.success) addNotification(res.message || "Could not end the sitting.", "error");
    else addNotification(`${dialog.row.full_name}'s test was submitted.`, "success");
    close();
    refresh();
  };

  const toggleAbsent = async (row) => {
    const res = await cbtAbsent(testId, row.student_id, row.state !== "absent");
    if (!res.success) return addNotification(res.message || "Could not update that student.", "error");
    return refresh();
  };

  const assignOne = async (row) => {
    const res = await cbtAssignments(testId, { add: [row.student_id], remove: [] });
    if (!res.success) return addNotification(res.message || "Could not assign that student.", "error");
    addNotification(`${row.full_name} can now be started.`, "success");
    return refresh();
  };

  const savePick = async () => {
    setBusy(true);
    const res = await cbtCounted(testId, dialog.row.student_id, pick || null);
    setBusy(false);
    if (!res.success) return addNotification(res.message || "Could not change the counted attempt.", "error");
    addNotification("The chosen attempt will be the one that counts.", "success");
    close();
    return refresh();
  };

  const actionsFor = (row) => {
    const items = [];
    if (!row.assigned) {
      if (live) items.push({ label: "Assign to this test", onClick: () => assignOne(row) });
      return items;
    }
    if (canStart(row) && live) {
      items.push({ label: "Start", onClick: () => setDialog({ kind: "start", ids: [row.student_id] }) });
      items.push({ label: row.state === "absent" ? "Clear absent" : "Mark absent", onClick: () => toggleAbsent(row) });
    }
    if (row.state === "in_progress") {
      items.push({ label: "Add time", onClick: () => setDialog({ kind: "time", row }) });
      items.push({ label: "End now", danger: true, onClick: () => setDialog({ kind: "end", row }) });
    }
    if (FINISHED.includes(row.state)) {
      if (row.counted_attempt_id) items.push({ label: row.state === "awaiting_marking" ? "Mark answers" : "Review answers", onClick: () => go("marking", { attemptId: row.counted_attempt_id }) });
      if (canRewrite(row) && live) items.push({ label: "Allow rewrite", onClick: () => setDialog({ kind: "rewrite", ids: [row.student_id], names: [row.full_name] }) });
      if (row.attempts_count > 1 && row.release_status !== "released") {
        items.push({ label: "Choose counted attempt", onClick: () => { setPick(row.counted_attempt_id || ""); setDialog({ kind: "counted", row }); } });
      }
    }
    return items;
  };

  const timeCell = (row) => {
    if (row.state !== "in_progress" || !row.ends_at) return "—";
    const left = new Date(row.ends_at).getTime() - (now + offset.current);
    return left <= 0 ? <span className="cbt-clock is-low">Time up</span> : <span className={`cbt-clock${left <= 60000 ? " is-low" : ""}`}>{formatClock(left)}</span>;
  };

  return (
    <div className="cbt-edit">
      <div className="cbt-stats">
        {STATS.map(([key, label]) => (
          <div className="cbt-stat" key={key}>
            <span>{label}</span>
            <strong>{stats[key]}</strong>
          </div>
        ))}
      </div>

      {test.status === "closed" && <p className="cbt-note">This test is closed, so students cannot be started. Reopen it from the top of the page to start or rewrite.</p>}

      <div className="cbt-section-row">
        <div className="cbt-chips" role="tablist" aria-label="Show students">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={view === item.id} className={`cbt-chip${view === item.id ? " is-on" : ""}`} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="cbt-inline" style={{ marginTop: 0 }}>
          <input className="cbt-search" placeholder="Search students" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="button" className="cbt-ghost" onClick={() => load()}>Refresh</button>
          {live && <button type="button" className="cbt-ghost" onClick={onAssign}>Add students</button>}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="cbt-bulk" role="region" aria-label="Selected students">
          <strong>{selected.size} selected</strong>
          <div className="cbt-inline" style={{ marginTop: 0 }}>
            <button type="button" className="cbt-btn" disabled={!live || startIds.length === 0} onClick={() => setDialog({ kind: "start", ids: startIds })}>
              Start {startIds.length || ""}
            </button>
            <button
              type="button"
              className="cbt-ghost"
              disabled={!live || rewriteIds.length === 0}
              onClick={() => setDialog({ kind: "rewrite", ids: rewriteIds, names: picked.filter(canRewrite).map((row) => row.full_name) })}
            >
              Allow rewrite {rewriteIds.length || ""}
            </button>
            <button type="button" className="cbt-link" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        </div>
      )}

      <div className="cbt-table-wrap">
        <table className="cbt-table">
          <thead>
            <tr>
              <th className="cbt-check-col"><input type="checkbox" checked={allShown} onChange={toggleAll} disabled={visibleIds.length === 0} aria-label="Select all shown" /></th>
              <th>Student</th>
              <th>Status</th>
              <th className="is-num">Time left</th>
              <th className="is-num">Answered</th>
              <th className="is-num">Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="cbt-empty">No students match.</td></tr>}
            {rows.map((row) => (
              <tr key={row.student_id} className={row.assigned ? "" : "is-muted"}>
                <td className="cbt-check-col">
                  <input type="checkbox" checked={selected.has(row.student_id)} disabled={!row.assigned} onChange={() => toggleOne(row.student_id)} aria-label={`Select ${row.full_name}`} />
                </td>
                <td><strong>{row.full_name}</strong>{row.admission_number && <span className="cbt-sub">{row.admission_number}</span>}</td>
                <td>
                  <span className={`cbt-pill is-${row.state}`}>{STATUS_LABEL[row.state] || row.state}</span>
                  {row.attempts_count > 1 && <span className="cbt-pill">Attempt {row.attempt_number}</span>}
                </td>
                <td className="is-num">{timeCell(row)}</td>
                <td className="is-num">
                  {row.state === "in_progress" ? `${row.answered} / ${test.question_count}` : "—"}
                  {row.state === "in_progress" && row.last_saved_at && <span className="cbt-sub">saved {timeOf(row.last_saved_at)}</span>}
                </td>
                <td className="is-num">
                  {row.marks_earned === null ? "—" : `${fmt(row.marks_earned)} / ${fmt(test.total_marks)}`}
                  {row.state === "awaiting_marking" && <span className="cbt-sub">needs marking</span>}
                </td>
                <td><CbtRowMenu items={actionsFor(row)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog?.kind === "start" && (
        <ConfirmDialog
          title="Start the countdown?"
          message={`${dialog.ids.length} student${dialog.ids.length === 1 ? "" : "s"} will get ${test.duration_minutes} minutes, starting now. They then enter the exam code on their own device.`}
          confirmLabel="Start now"
          busy={busy}
          onConfirm={startNow}
          onCancel={close}
        />
      )}

      {dialog?.kind === "end" && (
        <ConfirmDialog
          title="End this sitting now?"
          message={`${dialog.row.full_name}'s answers so far will be submitted and they cannot write any more.`}
          confirmLabel="End sitting"
          danger
          busy={busy}
          onConfirm={endNow}
          onCancel={close}
        />
      )}

      {dialog?.kind === "rewrite" && (
        <CbtModal
          title="Allow a rewrite"
          onClose={close}
          locked={busy}
          footer={
            <>
              <button type="button" className="cbt-ghost" onClick={close} disabled={busy}>Cancel</button>
              <button type="button" className="cbt-btn" onClick={rewriteNow} disabled={busy || !reason.trim()}>{busy ? "Starting..." : "Start rewrite"}</button>
            </>
          }
        >
          <p className="cbt-modal-text">
            {dialog.names.length === 1 ? dialog.names[0] : `${dialog.names.length} students`} will get a fresh attempt with {test.duration_minutes} minutes, starting now. The earlier attempt is kept, and you choose which score counts.
          </p>
          <label className="cbt-field">
            Reason for the rewrite
            <input value={reason} maxLength={500} onChange={(event) => setReason(event.target.value)} placeholder="For example: power cut during the test" />
          </label>
        </CbtModal>
      )}

      {dialog?.kind === "time" && (
        <CbtModal
          title="Add time"
          onClose={close}
          locked={busy}
          footer={
            <>
              <button type="button" className="cbt-ghost" onClick={close} disabled={busy}>Cancel</button>
              <button type="button" className="cbt-btn" onClick={addTimeNow} disabled={busy || !(Number(minutes) >= 1 && Number(minutes) <= 120)}>{busy ? "Adding..." : "Add time"}</button>
            </>
          }
        >
          <p className="cbt-modal-text">Give {dialog.row.full_name} extra minutes. This is recorded in the activity log.</p>
          <div className="cbt-inline" style={{ marginTop: 0 }}>
            {[5, 10, 15].map((value) => (
              <button key={value} type="button" className={`cbt-chip${Number(minutes) === value ? " is-on" : ""}`} onClick={() => setMinutes(value)}>{value} min</button>
            ))}
            <input type="number" min="1" max="120" value={minutes} onChange={(event) => setMinutes(event.target.value)} style={{ width: 90 }} aria-label="Minutes to add" />
          </div>
        </CbtModal>
      )}

      {dialog?.kind === "counted" && (
        <CbtModal
          title="Which attempt counts?"
          onClose={close}
          locked={busy}
          footer={
            <>
              <button type="button" className="cbt-ghost" onClick={close} disabled={busy}>Cancel</button>
              <button type="button" className="cbt-btn" onClick={savePick} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
            </>
          }
        >
          <p className="cbt-modal-text">{dialog.row.full_name} wrote more than once. The attempt you choose is marked, released and written to the report card.</p>
          <div className="cbt-students">
            {dialog.row.attempts
              .filter((item) => item.status === "submitted")
              .map((item) => (
                <label key={item.attempt_id} className="cbt-person">
                  <span>
                    <input type="radio" name="counted" checked={pick === item.attempt_id} onChange={() => setPick(item.attempt_id)} />
                    Attempt {item.attempt_number}
                  </span>
                  <span className="cbt-muted">{item.marks_earned === null ? "—" : `${fmt(item.marks_earned)} / ${fmt(test.total_marks)}`}</span>
                </label>
              ))}
          </div>
          <button type="button" className="cbt-link" onClick={() => setPick("")}>Use the latest attempt automatically</button>
        </CbtModal>
      )}
    </div>
  );
};

export default CbtSitting;
