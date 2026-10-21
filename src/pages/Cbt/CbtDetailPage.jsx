import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtClose, cbtGet, cbtPublish, cbtReopen, cbtReset, cbtRoster } from "../../api_call/useCbt";
import InnerTabCon from "../../components/InnerTabCon/InnerTabCon";
import StudentDetailTopTab from "../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import { ConfirmDialog } from "./CbtModal";
import CbtMarking from "./CbtMarking";
import CbtOverview from "./CbtOverview";
import CbtSessions from "./CbtSessions";
import CbtSitting from "./CbtSitting";
import { STATUS_LABEL } from "./cbtUtils";
import "./CbtDesk.css";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "session", label: "Test session" },
];

// Same frame as the tests list: the grey content area, 1100px wide, with the same heading style.
const Shell = ({ children }) => (
  <InnerTabCon>
    <div className="cbt">{children}</div>
  </InnerTabCon>
);

/**
 * One test: the overview and the students who are writing it. Admins and teachers both land here
 * from the tests list.
 */
const CbtDetailPage = ({ testId, listPath, editorPath }) => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [params, setParams] = useSearchParams();
  const [test, setTest] = useState(null);
  const [stats, setStats] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sub, setSub] = useState(null);
  const [assignNote, setAssignNote] = useState("");
  const [confirm, setConfirm] = useState("");
  const assignTried = useRef("");
  const [busy, setBusy] = useState(false);

  const requested = params.get("tab");
  const tab = TABS.some((item) => item.id === requested) ? requested : "overview";
  const setTab = (id) => {
    setSub(null);
    setParams({ tab: id }, { replace: true });
  };

  const load = useCallback(async () => {
    const [res, roster] = await Promise.all([cbtGet(testId), cbtRoster(testId)]);
    if (res.success) {
      setTest(res.data);
      setError("");
    } else {
      setError(res.message || "Could not open this test.");
    }
    setStats(roster.success ? roster.data.stats : {
      assigned: 0, not_started: 0, in_progress: 0, awaiting_marking: 0, graded: 0, released: 0,
    });
    setReady(true);
  }, [testId]);

  useEffect(() => {
    load();
  }, [load]);

  // A finished draft is assigned to every student in the class for this term, with no extra step.
  useEffect(() => {
    if (!test || test.status !== "draft" || assignTried.current === test.test_id) return;
    assignTried.current = test.test_id;
    const testIdNow = test.test_id;
    (async () => {
      const res = await cbtPublish(testIdNow, {});
      if (res.success || res.code === "not_draft") {
        if (res.success) addNotification(`All ${res.assigned} students in the class for this term are assigned.`, "success");
        load();
        return;
      }
      const unfinished = (res.errors || []).some((item) => item.field !== "student_ids");
      if (!unfinished) setAssignNote(res.message || "The class could not be assigned.");
    })();
  }, [test, load, addNotification]);

  // Marking one student opens over the Students tab and returns to it.
  const go = (name, extra = {}) => {
    if (name === "marking") setSub({ name: "marking", attemptId: extra.attemptId });
  };

  const runConfirm = async () => {
    if (confirm === "edit") {
      setBusy(true);
      const res = test.status === "draft" ? { success: true } : await cbtReset(testId);
      setBusy(false);
      setConfirm("");
      if (!res.success) return addNotification(res.message || "That did not work.", "error");
      if (test.status !== "draft") addNotification("Answers, marks and assessment scores for this test were deleted.", "success");
      return navigate(editorPath(testId));
    }
    setBusy(true);
    const res = confirm === "close" ? await cbtClose(testId) : await cbtReopen(testId);
    setBusy(false);
    setConfirm("");
    if (!res.success) return addNotification(res.message || "That did not work.", "error");
    addNotification(confirm === "close" ? "Test closed. Results are not released until you release them." : "Test reopened. You can start students again.", "success");
    return load();
  };

  const back = () => navigate(listPath);
  const backButton = (
    <button type="button" className="cbt-back" onClick={back} aria-label="Back to tests">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  if (error && !test) {
    return (
      <StudentDetailTopTab title="Test" leading={backButton} route={[]}>
        <Shell>
          <div className="cbt-card cbt-empty">
            <p className="cbt-error">{error}</p>
            <div className="cbt-inline" style={{ justifyContent: "center" }}>
              <button type="button" className="cbt-ghost" onClick={back}>Back to tests</button>
              <button type="button" className="cbt-btn" onClick={load}>Try again</button>
            </div>
          </div>
        </Shell>
      </StudentDetailTopTab>
    );
  }
  if (!test || !ready) {
    return (
      <StudentDetailTopTab title="Test" leading={backButton} route={[]}>
        <Shell><div className="cbt-card cbt-empty">Opening test...</div></Shell>
      </StudentDetailTopTab>
    );
  }

  const subtitle = [
    test.class_name,
    test.subject_name,
    `${test.questions.length} questions`,
    `${test.total_marks} marks`,
    STATUS_LABEL[test.status],
    test.release_state === "released" ? "Results released" : "",
  ].filter(Boolean).join(" · ");

  return (
    <StudentDetailTopTab
      title={test.title || "Untitled test"}
      subtitle={subtitle}
      route={TABS.map((item) => ({ label: item.label, link: item.id }))}
      activeLink={tab}
      onTabSelect={setTab}
      leading={backButton}
    >
    <Shell>
        {sub?.name === "marking" && <CbtMarking testId={testId} attemptId={sub.attemptId} onBack={() => setSub(null)} />}

        {assignNote && <p className="cbt-note">{assignNote}</p>}
        {!sub && tab === "overview" && (
          <CbtOverview
            test={test}
            initialStats={stats}
            onChanged={load}
            onClose={() => setConfirm("close")}
            onReopen={() => setConfirm("reopen")}
            onEdit={() => setConfirm("edit")}
          />
        )}
        {!sub && tab === "students" && <CbtSitting testId={testId} onChanged={load} go={go} />}
        {!sub && tab === "session" && <CbtSessions testId={testId} />}

      {confirm && (
        <ConfirmDialog
          title={confirm === "edit" ? "Edit this CBT?" : confirm === "close" ? "Close this test?" : "Reopen this test?"}
          message={
            confirm === "edit"
              ? test.status === "draft"
                ? "You can change the questions and the class before anyone writes."
                : `Every answer, mark and assessment score recorded for "${test.title || "this test"}" will be deleted. The class starts this test again from the beginning. This cannot be undone.`
              : confirm === "close"
              ? "Anything still being written is submitted as it stands, and nobody can start or continue. Results are not released automatically."
              : "Students can be started again, and finished students can be allowed to rewrite. Results that were already released stay released."
          }
          confirmLabel={confirm === "edit" ? (test.status === "draft" ? "Edit CBT" : "Delete records and edit") : confirm === "close" ? "Close test" : "Reopen test"}
          danger={confirm === "close" || (confirm === "edit" && test.status !== "draft")}
          busy={busy}
          onConfirm={runConfirm}
          onCancel={() => setConfirm("")}
        />
      )}
    </Shell>
    </StudentDetailTopTab>
  );
};

export default CbtDetailPage;
