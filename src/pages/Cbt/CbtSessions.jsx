import { useCallback, useEffect, useRef, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtCancelSession, cbtSessions } from "../../api_call/useCbt";
import { ConfirmDialog } from "./CbtModal";
import { formatClock } from "./cbtUtils";

const POLL_MS = 8000;

/** Active sittings for one test. Cancelling one throws away what is still being written. */
const CbtSessions = ({ testId }) => {
  const { addNotification } = useNotification();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const offset = useRef(0);

  const load = useCallback(async (silent = false) => {
    const res = await cbtSessions(testId);
    if (!res.success) {
      if (!silent) setError(res.message || "Could not load test sessions.");
      return;
    }
    offset.current = new Date(res.data.server_now).getTime() - Date.now();
    setError("");
    setData(res.data);
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  const active = data?.sessions.length || 0;
  useEffect(() => {
    if (!active) return undefined;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") load(true);
    }, POLL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [active, load]);

  const cancel = async () => {
    if (!pending) return;
    setBusy(true);
    const res = await cbtCancelSession(testId, pending.session_code);
    setBusy(false);
    if (!res.success) return addNotification(res.message || "Could not cancel that session.", "error");
    addNotification(`Session ${pending.session_code} cancelled. ${res.data.cancelled} student${res.data.cancelled === 1 ? "" : "s"} can be started again.`, "success");
    setPending(null);
    return load();
  };

  if (error && !data) {
    return (
      <div className="cbt-card cbt-empty">
        <p className="cbt-error">{error}</p>
        <button type="button" className="cbt-btn" onClick={() => load()}>Try again</button>
      </div>
    );
  }
  if (!data) return <div className="cbt-card cbt-empty">Loading test sessions...</div>;

  const clock = (endsAt) => {
    const left = new Date(endsAt).getTime() - (now + offset.current);
    return left <= 0 ? <span className="cbt-clock is-low">Time up</span> : <span className={`cbt-clock${left <= 60000 ? " is-low" : ""}`}>{formatClock(left)}</span>;
  };

  return (
    <>
      {data.sessions.length === 0 ? (
        <div className="cbt-card cbt-empty">No active test session. Start one from the Overview tab.</div>
      ) : (
        <div className="cbt-table-wrap">
          <table className="cbt-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Students writing</th>
                <th className="is-num">Time left</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => (
                <tr key={session.session_code}>
                  <td>
                    <strong>{session.session_code}</strong>
                    <span className="cbt-sub">Started {new Date(session.started_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  </td>
                  <td>
                    {session.students}
                    <span className="cbt-sub">{session.names.join(", ")}</span>
                  </td>
                  <td className="is-num">{clock(session.ends_at)}</td>
                  <td>
                    <button type="button" className="cbt-ghost is-danger-text" onClick={() => setPending(session)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title={`Cancel session ${pending.session_code}?`}
          message={`${pending.students} student${pending.students === 1 ? "" : "s"} still writing will be stopped. Answers from this sitting are discarded, and those students can be started again.`}
          confirmLabel="Cancel session"
          danger
          busy={busy}
          onConfirm={cancel}
          onCancel={() => { if (!busy) setPending(null); }}
        />
      )}
    </>
  );
};

export default CbtSessions;
