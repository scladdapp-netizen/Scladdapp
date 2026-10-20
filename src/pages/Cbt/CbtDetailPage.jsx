import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtClose, cbtGet, cbtReopen } from "../../api_call/useCbt";
import InnerTabCon from "../../components/InnerTabCon/InnerTabCon";
import { ConfirmDialog } from "./CbtModal";
import CbtActivity from "./CbtActivity";
import CbtMarkByQuestion from "./CbtMarkByQuestion";
import CbtMarking from "./CbtMarking";
import CbtOverview from "./CbtOverview";
import CbtPublishModal from "./CbtPublishModal";
import CbtRelease from "./CbtRelease";
import CbtResults from "./CbtResults";
import CbtScores from "./CbtScores";
import CbtSitting from "./CbtSitting";
import { STATUS_LABEL } from "./cbtUtils";
import "./CbtDesk.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "marking", label: "Marking" },
  { id: "scores", label: "Scores" },
  { id: "activity", label: "Activity" },
];

// Same frame as the tests list: the grey content area, 1100px wide, with the same heading style.
const Shell = ({ children }) => (
  <InnerTabCon>
    <div className="cbt">{children}</div>
  </InnerTabCon>
);

/**
 * One test, run from start to finish: who writes it and when, marking, scores, release and the
 * activity log. Admins and teachers both land here from the tests list.
 */
const CbtDetailPage = ({ testId, listPath, editorPath }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [params, setParams] = useSearchParams();
  const [test, setTest] = useState(null);
  const [error, setError] = useState("");
  const [sub, setSub] = useState(null);
  const [markMode, setMarkMode] = useState("student");
  const [assigning, setAssigning] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const requested = params.get("tab");
  const tab = TABS.some((item) => item.id === requested) ? requested : "overview";
  const setTab = (id) => {
    setSub(null);
    setParams({ tab: id }, { replace: true });
  };

  const load = useCallback(async () => {
    const res = await cbtGet(testId);
    if (res.success) {
      setTest(res.data);
      setError("");
    } else {
      setError(res.message || "Could not open this test.");
    }
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  // The marking and release screens open over the current tab and return to it.
  const go = (name, extra = {}) => {
    if (name === "marking") setSub({ name: "marking", attemptId: extra.attemptId });
    else if (name === "release") setSub({ name: "release" });
    else if (name === "results") setTab("scores");
  };

  const runConfirm = async () => {
    setBusy(true);
    const res = confirm === "close" ? await cbtClose(testId) : await cbtReopen(testId);
    setBusy(false);
    setConfirm("");
    if (!res.success) return addNotification(res.message || "That did not work.", "error");
    addNotification(confirm === "close" ? "Test closed. Results are not released until you release them." : "Test reopened. You can start students again.", "success");
    return load();
  };

  const back = () => navigate(listPath);

  if (error && !test) {
    return (
      <Shell>
          <div className="cbt-card cbt-empty">
            <p className="cbt-error">{error}</p>
            <div className="cbt-inline" style={{ justifyContent: "center" }}>
              <button type="button" className="cbt-ghost" onClick={back}>Back to tests</button>
              <button type="button" className="cbt-btn" onClick={load}>Try again</button>
            </div>
          </div>
      </Shell>
    );
  }
  if (!test) return <Shell><div className="cbt-card cbt-empty">Opening test...</div></Shell>;

  const editable = test.status === "draft";

  return (
    <Shell>
        <div className="cbt-head is-flush">
          <div className="cbt-head-copy">
            <div className="cbt-title-row">
              <h1>{test.title || "Untitled test"}</h1>
              <span className={`cbt-pill is-${test.status}`}>{STATUS_LABEL[test.status]}</span>
              {test.release_state === "released" && <span className="cbt-pill is-released">Results released</span>}
            </div>
            <p className="cbt-muted">
              {test.class_name} · {test.subject_name} · {test.questions.length} questions · {test.total_marks} marks · {test.duration_minutes} minutes
            </p>
          </div>
          <div className="cbt-actions">
            <button type="button" className="cbt-ghost" onClick={back}>Back to tests</button>
            {editable && <button type="button" className="cbt-ghost" onClick={() => navigate(editorPath(testId))}>Edit test</button>}
            {editable && <button type="button" className="cbt-btn" onClick={() => setAssigning(true)}>Assign students</button>}
            {test.status === "published" && <button type="button" className="cbt-ghost is-danger-text" onClick={() => setConfirm("close")}>Close test</button>}
            {test.status === "closed" && <button type="button" className="cbt-btn" onClick={() => setConfirm("reopen")}>Reopen test</button>}
          </div>
        </div>

        <div className="cbt-tabs" role="tablist" aria-label="Test sections">
          {TABS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={`cbt-tab${tab === item.id ? " is-on" : ""}`} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>

        {sub?.name === "marking" && <CbtMarking testId={testId} attemptId={sub.attemptId} onBack={() => setSub(null)} />}
        {sub?.name === "release" && <CbtRelease testId={testId} onBack={() => setSub(null)} go={go} />}

        {!sub && tab === "overview" && <CbtOverview test={test} onChanged={load} onAssign={() => setAssigning(true)} />}
        {!sub && tab === "students" && <CbtSitting testId={testId} onAssign={() => setAssigning(true)} onChanged={load} go={go} />}
        {!sub && tab === "marking" && (
          <div className="cbt-stack">
            <div className="cbt-chips" role="tablist" aria-label="Marking view">
              <button type="button" role="tab" aria-selected={markMode === "student"} className={`cbt-chip${markMode === "student" ? " is-on" : ""}`} onClick={() => setMarkMode("student")}>By student</button>
              <button type="button" role="tab" aria-selected={markMode === "question"} className={`cbt-chip${markMode === "question" ? " is-on" : ""}`} onClick={() => setMarkMode("question")}>By question</button>
            </div>
            {markMode === "student" ? <CbtResults testId={testId} initialFilter="awaiting_marking" go={go} /> : <CbtMarkByQuestion testId={testId} />}
          </div>
        )}
        {!sub && tab === "scores" && <CbtScores testId={testId} go={go} />}
        {!sub && tab === "activity" && <CbtActivity testId={testId} />}

      {assigning && (
        <CbtPublishModal
          test={{ test_id: test.test_id, title: test.title, total_marks: test.total_marks, duration_minutes: test.duration_minutes }}
          onClose={() => setAssigning(false)}
          onDone={() => {
            setAssigning(false);
            load();
            setTab("students");
          }}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm === "close" ? "Close this test?" : "Reopen this test?"}
          message={
            confirm === "close"
              ? "Anything still being written is submitted as it stands, and nobody can start or continue. Results are not released automatically."
              : "Students can be started again, and finished students can be allowed to rewrite. Results that were already released stay released."
          }
          confirmLabel={confirm === "close" ? "Close test" : "Reopen test"}
          danger={confirm === "close"}
          busy={busy}
          onConfirm={runConfirm}
          onCancel={() => setConfirm("")}
        />
      )}
    </Shell>
  );
};

export default CbtDetailPage;
