import { useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtDeadline, cbtNewCode } from "../../api_call/useCbt";
import { ConfirmDialog } from "./CbtModal";
import { fmt, formatDateTime, fromLocalInput } from "./cbtUtils";

const NEXT_STEP = {
  draft: "Assign the students who will write this test. Nothing starts until you start them.",
  published: "Open the Students tab, select students and press Start. When they finish, start the next group.",
  closed: "Mark any short answers, then release the results from the Scores tab. Reopen the test if someone still needs to write.",
};

/** The test at a glance, its exam code and the optional closing time. */
const CbtOverview = ({ test, onChanged, onAssign }) => {
  const { addNotification } = useNotification();
  const [closesAt, setClosesAt] = useState("");
  const [busy, setBusy] = useState("");
  const [confirmCode, setConfirmCode] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };

  const regenerate = async () => {
    setBusy("code");
    const res = await cbtNewCode(test.test_id);
    setBusy("");
    setConfirmCode(false);
    if (!res.success) return addNotification(res.message || "Could not change the code.", "error");
    addNotification("New exam code created. The old code no longer works.", "success");
    return onChanged();
  };

  const saveDeadline = async () => {
    setBusy("deadline");
    const res = await cbtDeadline(test.test_id, fromLocalInput(closesAt));
    setBusy("");
    if (!res.success) return addNotification(res.message || "Could not set the closing time.", "error");
    addNotification("Closing time saved.", "success");
    setClosesAt("");
    return onChanged();
  };

  const facts = [
    ["Class", test.class_name || "—"],
    ["Subject", test.subject_name],
    ["Questions", test.questions.length],
    ["Total marks", fmt(test.total_marks)],
    ["Duration", test.duration_minutes ? `${test.duration_minutes} minutes each` : "—"],
    ["Feeds", test.grading_field ? `${test.grading_field} (out of ${test.assessment_max})` : "—"],
    ["Closing time", test.status === "draft" ? "—" : test.closes_at ? formatDateTime(test.closes_at) : "None. Open until you close it"],
    ["Explanations", test.release_explanations ? "Shown with released results" : "Not shown to students"],
  ];

  return (
    <div className="cbt-stack">
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
        {test.status === "draft" && <div className="cbt-inline"><button type="button" className="cbt-btn" onClick={onAssign}>Assign students</button></div>}
      </section>

      {test.instructions && (
        <section className="cbt-card">
          <h2 className="cbt-section">Instructions students see</h2>
          <p className="cbt-modal-text cbt-pre">{test.instructions}</p>
        </section>
      )}

      {test.status !== "draft" && (
        <section className="cbt-card">
          <h2 className="cbt-section">Exam code</h2>
          <p className="cbt-muted">Students open the exam page and enter this code. It only lets in students assigned to the test, and only after you start them. There is no list of tests on the student dashboard.</p>
          <div className="cbt-code">
            <span className="cbt-code-value">{test.access_code}</span>
            <button type="button" className="cbt-ghost" onClick={() => copy(test.access_code, "code")}>{copied === "code" ? "Copied" : "Copy code"}</button>
            {test.status === "published" && <button type="button" className="cbt-ghost" onClick={() => setConfirmCode(true)}>Create a new code</button>}
          </div>
          <div className="cbt-code is-link">
            <span className="cbt-code-link">{window.location.origin}/exam</span>
            <button type="button" className="cbt-ghost" onClick={() => copy(`${window.location.origin}/exam`, "link")}>{copied === "link" ? "Copied" : "Copy link"}</button>
          </div>
        </section>
      )}

      {test.status === "published" && (
        <section className="cbt-card">
          <h2 className="cbt-section">Closing time (optional)</h2>
          <p className="cbt-muted">Without one, the test stays open until you close it. A closing time also ends any sitting still running at that moment.</p>
          <div className="cbt-inline">
            <input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
            <button type="button" className="cbt-btn" onClick={saveDeadline} disabled={busy === "deadline" || !closesAt}>{busy === "deadline" ? "Saving..." : "Set closing time"}</button>
          </div>
        </section>
      )}

      {confirmCode && (
        <ConfirmDialog
          title="Create a new exam code?"
          message="The current code stops working immediately. Students who are already writing can carry on, but anyone who has not entered the code yet needs the new one."
          confirmLabel="Create new code"
          busy={busy === "code"}
          onConfirm={regenerate}
          onCancel={() => setConfirmCode(false)}
        />
      )}
    </div>
  );
};

export default CbtOverview;
