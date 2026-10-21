import { useCallback, useEffect, useRef, useState } from "react";
import ServerSmartTable from "../../components/ServerSmartTable/ServerSmartTable";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtAbsent, cbtAddTime, cbtAssignments, cbtCounted, cbtEndSession, cbtRoster, cbtStartSessions } from "../../api_call/useCbt";
import { CbtModal, ConfirmDialog } from "./CbtModal";
import CbtRowMenu from "./CbtRowMenu";
import { STATUS_LABEL, fmt, formatClock } from "./cbtUtils";

const POLL_MS = 8000;
const VIEWS = [
  { id: "all", label: "All" },
  { id: "not_started", label: "Not started" },
  { id: "in_progress", label: "Writing now" },
  { id: "finished", label: "Finished" },
];
const FINISHED = ["awaiting_marking", "graded", "released"];

const timeOf = (value) => (value ? new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }) : "");

const durationLabel = (total) => {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const parts = [];
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (mins) parts.push(`${mins} minute${mins === 1 ? "" : "s"}`);
  return parts.join(" ") || "0 minutes";
};

/**
 * The sitting: every student on one screen. The teacher picks students and starts their
 * countdown, watches them write, ends or extends a sitting, and lets finished students rewrite.
 */
const CbtSitting = ({ testId, onChanged, go }) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("all");
  const [more, setMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [hours, setHours] = useState(1);
  const [mins, setMins] = useState(0);
  const [pick, setPick] = useState("");
  const offset = useRef(0);
  const rowsRef = useRef([]);
  const clearSelectionRef = useRef(() => {});
  const sigRef = useRef("");

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
      const sig = `${res.data.test?.status}|${(res.data.rows || []).map((row) =>
        [row.student_id, row.state, row.assigned, row.answered, row.marks_earned, row.ends_at, row.exam_path, row.attempts_count, row.release_status].join(":")
      ).join("|")}`;
      if (sig !== sigRef.current) {
        sigRef.current = sig;
        setReloadKey((key) => key + 1);
      }
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

  const fetchData = useCallback(async ({ page, limit, search }) => {
    const source = data?.rows || [];
    const term = String(search || "").trim().toLowerCase();
    const list = source.filter((row) => {
      if (view === "not_started" && !(row.assigned && (row.state === "not_started" || row.state === "absent"))) return false;
      if (view === "in_progress" && row.state !== "in_progress") return false;
      if (view === "finished" && !FINISHED.includes(row.state)) return false;
      if (!term) return true;
      return `${row.full_name || ""} ${row.admission_number || ""}`.toLowerCase().includes(term);
    });
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * limit;
    return {
      success: true,
      data: list.slice(start, start + limit).map((row) => ({ ...row, id: row.student_id })),
      pagination: {
        currentPage: safePage,
        totalPages,
        totalRecords: total,
        recordsPerPage: limit,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
        startIndex: total === 0 ? 0 : start + 1,
        endIndex: Math.min(start + limit, total),
      },
    };
  }, [data, view]);

  if (error && !data) return <div className="cbt-card cbt-empty"><p className="cbt-error">{error}</p><button type="button" className="cbt-btn" onClick={() => load()}>Try again</button></div>;
  if (!data) return <div className="cbt-card cbt-empty">Loading students...</div>;

  const { test } = data;
  const live = test.status === "published";
  rowsRef.current = data.rows;

  if (test.status === "draft") {
    return (
      <div className="cbt-card cbt-empty">
        <p className="cbt-modal-text">This test is still a draft. Finish it and save, and every student in the class for this term is assigned.</p>
      </div>
    );
  }

  const canStart = (row) => row.assigned && (row.state === "not_started" || row.state === "absent");
  const canRewrite = (row) => row.assigned && (row.state === "awaiting_marking" || row.state === "graded");

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

  const sittingMinutes = () => {
    const h = Number(hours);
    const m = Number(mins);
    if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 10 || m < 0 || m > 59) return null;
    const total = h * 60 + m;
    return total >= 1 && total <= 600 ? total : null;
  };

  const applyTestDuration = () => {
    const total = Math.max(1, Number(test.duration_minutes) || 60);
    setHours(Math.floor(total / 60));
    setMins(total % 60);
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
    const res = await cbtStartSessions(testId, { kind: "start", student_ids: dialog.ids, duration_minutes: duration });
    setBusy(false);
    if (!report(res, "Started")) return;
    clearSelectionRef.current();
    refresh();
    const links = res.data?.links || [];
    if (links.length) setDialog({ kind: "links", links });
    else close();
  };

  const rewriteNow = async () => {
    const duration = sittingMinutes();
    if (!duration) return addNotification("Set a duration between 1 minute and 10 hours.", "error");
    setBusy(true);
    const res = await cbtStartSessions(testId, { kind: "rewrite", student_ids: dialog.ids, reason, duration_minutes: duration });
    setBusy(false);
    if (!report(res, "Started a rewrite for")) return;
    clearSelectionRef.current();
    refresh();
    const links = res.data?.links || [];
    if (links.length) setDialog({ kind: "links", links });
    else close();
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
      items.push({ label: "Start test session", onClick: () => { applyTestDuration(); setDialog({ kind: "start", ids: [row.student_id] }); } });
      items.push({ label: row.state === "absent" ? "Clear absent" : "Mark absent", onClick: () => toggleAbsent(row) });
    }
    if (row.state === "in_progress") {
      items.push({ label: "Add time", onClick: () => setDialog({ kind: "time", row }) });
      items.push({ label: "End now", danger: true, onClick: () => setDialog({ kind: "end", row }) });
    }
    if (FINISHED.includes(row.state)) {
      if (row.counted_attempt_id) items.push({ label: row.state === "awaiting_marking" ? "Mark answers" : "Review answers", onClick: () => go("marking", { attemptId: row.counted_attempt_id }) });
      if (canRewrite(row) && live) items.push({ label: "Allow rewrite", onClick: () => { applyTestDuration(); setDialog({ kind: "rewrite", ids: [row.student_id], names: [row.full_name] }); } });
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

  const columns = [
    {
      accessor: "full_name",
      label: "Student",
      searchable: true,
      render: (value, row) => (
        <>
          <strong>{value}</strong>
          {row.admission_number && <span className="cbt-sub">{row.admission_number}</span>}
          {row.exam_path && (
            <span className="cbt-exam-link">
              <span className="cbt-exam-link-text">{`${window.location.origin}${row.exam_path}`}</span>
              <button type="button" className="cbt-copy" aria-label="Copy exam link" title="Copy exam link" onClick={(event) => { event.stopPropagation(); copyText(`${window.location.origin}${row.exam_path}`); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          )}
        </>
      ),
    },
    {
      accessor: "state",
      label: "Status",
      searchable: false,
      render: (value, row) => (
        <>
          <span className={`cbt-pill is-${value}`}>{STATUS_LABEL[value] || value}</span>
          {row.attempts_count > 1 && <span className="cbt-pill">Attempt {row.attempt_number}</span>}
        </>
      ),
    },
    { accessor: "ends_at", label: "Time left", searchable: false, render: (_, row) => timeCell(row) },
    {
      accessor: "answered",
      label: "Answered",
      searchable: false,
      render: (_, row) => (
        <>
          {row.state === "in_progress" ? `${row.answered} / ${test.question_count}` : "—"}
          {row.state === "in_progress" && row.last_saved_at && <span className="cbt-sub">saved {timeOf(row.last_saved_at)}</span>}
        </>
      ),
    },
    {
      accessor: "marks_earned",
      label: "Score",
      searchable: false,
      render: (_, row) => (
        <>
          {row.marks_earned === null ? "—" : `${fmt(row.marks_earned)} / ${fmt(test.total_marks)}`}
          {row.state === "awaiting_marking" && <span className="cbt-sub">needs marking</span>}
        </>
      ),
    },
    { accessor: "actions", label: "Actions", searchable: false, render: (_, row) => <CbtRowMenu items={actionsFor(row)} /> },
  ];

  const openBulk = (kind, ids) => {
    const rows = rowsRef.current.filter((row) => ids.includes(row.student_id));
    const chosen = rows.filter(kind === "start" ? canStart : canRewrite);
    if (chosen.length === 0) {
      addNotification(kind === "start" ? "None of the selected students can be started." : "None of the selected students can rewrite.", "error");
      return;
    }
    applyTestDuration();
    setDialog(kind === "start"
      ? { kind: "start", ids: chosen.map((row) => row.student_id) }
      : { kind: "rewrite", ids: chosen.map((row) => row.student_id), names: chosen.map((row) => row.full_name) });
  };

  return (
    <div className="cbt-edit">
      <p className="cbt-lead">
        Everyone assigned to this test is listed here.
        {more && " Filter who has not started, who is writing, and who has finished. Select students to start them together. Each one gets a link and does not sign in. Open a finished student to mark their answers."}
        {" "}
        <button type="button" className="cbt-link" onClick={() => setMore((open) => !open)}>{more ? "Show less" : "Read more"}</button>
      </p>
      {test.status === "closed" && <p className="cbt-note">This test is closed, so students cannot be started. Reopen it from the Overview tab to start or rewrite.</p>}

      <div className="cbt-chips" role="tablist" aria-label="Show students">
        {VIEWS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={view === item.id} className={`cbt-chip${view === item.id ? " is-on" : ""}`} onClick={() => setView(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="cbt-list-table">
        <ServerSmartTable
          key={view}
          columns={columns}
          fetchData={fetchData}
          enableSelect
          showcreatbut={false}
          onRowClick={(row) => { if (row.counted_attempt_id) go("marking", { attemptId: row.counted_attempt_id }); }}
          initialPageSize={20}
          reloadKey={reloadKey}
          bulkActions={[
            { label: "Start test session", disabled: !live, onClick: (ids, clear) => { clearSelectionRef.current = clear; openBulk("start", ids); } },
            { label: "Allow rewrite", disabled: !live, onClick: (ids, clear) => { clearSelectionRef.current = clear; openBulk("rewrite", ids); } },
          ]}
        />
      </div>

      {dialog?.kind === "start" && (
        <CbtModal
          title="Start test session"
          onClose={close}
          locked={busy}
          footer={
            <>
              <button type="button" className="cbt-ghost" onClick={close} disabled={busy}>Cancel</button>
              <button type="button" className="cbt-btn" onClick={startNow} disabled={busy || !sittingMinutes()}>{busy ? "Starting..." : "Start now"}</button>
            </>
          }
        >
          <p className="cbt-modal-text">
            {dialog.ids.length} student{dialog.ids.length === 1 ? "" : "s"} will have {sittingMinutes() ? durationLabel(sittingMinutes()) : "a duration you set"}, starting now. Each one gets a link. They open it and write. They do not sign in.
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

      {dialog?.kind === "links" && (
        <CbtModal
          title="Exam links"
          onClose={close}
          wide
          footer={<button type="button" className="cbt-btn" onClick={close}>Done</button>}
        >
          <p className="cbt-modal-text">Give each student their own link. The first code is their seat and the second is this session. The link works until their time runs out.</p>
          {dialog.links.map((row) => {
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
            {dialog.names.length === 1 ? dialog.names[0] : `${dialog.names.length} students`} will get a fresh attempt of {sittingMinutes() ? durationLabel(sittingMinutes()) : "the duration you set"}, starting now. The earlier attempt is kept, and you choose which score counts. Each student gets a new link.
          </p>
          <div className="cbt-inline" style={{ marginTop: 0 }}>
            <label className="cbt-field">Hours
              <input type="number" min="0" max="10" value={hours} onChange={(event) => setHours(event.target.value)} />
            </label>
            <label className="cbt-field">Minutes
              <input type="number" min="0" max="59" value={mins} onChange={(event) => setMins(event.target.value)} />
            </label>
          </div>
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
