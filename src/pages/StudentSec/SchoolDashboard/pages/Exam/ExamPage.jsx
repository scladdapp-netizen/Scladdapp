import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { examAccess, examResume, examSave, examStart, examSubmit } from "../../../../../api_call/useCbt";
import { ConfirmDialog } from "../../../../Cbt/CbtModal";
import "../../../../Cbt/CbtDesk.css";
import "./Exam.css";

const STORE_KEY = "cbt-exam-attempt";
const SAVE_DELAY = 800;
const RETRY_DELAY = 5000;

const formatClock = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const when = (value) => (value ? new Date(value).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

const Sitting = ({ session, onFinished }) => {
  const { test, attempt, questions } = session;
  const [answers, setAnswers] = useState(() => {
    const map = {};
    session.responses.forEach((row) => {
      map[row.question_id] = row.answer || "";
    });
    return map;
  });
  const [flags, setFlags] = useState(() => {
    const map = {};
    session.responses.forEach((row) => {
      if (row.flagged) map[row.question_id] = true;
    });
    return map;
  });
  const [index, setIndex] = useState(0);
  const [saveState, setSaveState] = useState("saved");
  const [now, setNow] = useState(() => Date.now());
  const [asking, setAsking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const offset = useRef(new Date(session.server_now).getTime() - Date.now());
  const endAt = new Date(attempt.allowed_end_at).getTime();
  const answersRef = useRef(answers);
  const flagsRef = useRef(flags);
  const pending = useRef({});
  const inFlight = useRef(false);
  const timer = useRef(null);
  const finished = useRef(false);
  const submittingRef = useRef(false);
  const lastTry = useRef(0);

  const remaining = endAt - (now + offset.current);

  const finish = useCallback(
    (message) => {
      if (finished.current) return;
      finished.current = true;
      sessionStorage.removeItem(STORE_KEY);
      onFinished(message);
    },
    [onFinished]
  );

  const flush = useCallback(async () => {
    if (inFlight.current || finished.current) return;
    const batch = pending.current;
    const ids = Object.keys(batch);
    if (ids.length === 0) return;
    pending.current = {};
    inFlight.current = true;
    setSaveState("saving");
    const res = await examSave(attempt.attempt_id, ids.map((id) => ({ question_id: id, ...batch[id] })));
    inFlight.current = false;
    if (res.success) {
      setSaveState(Object.keys(pending.current).length ? "saving" : "saved");
      if (Object.keys(pending.current).length) timer.current = setTimeout(flush, SAVE_DELAY);
      return;
    }
    if (["expired", "closed", "submitted"].includes(res.code)) {
      finish(res.message || "Your test has ended.");
      return;
    }
    // Keep what failed so the next try sends it again, along with anything newer.
    ids.forEach((id) => {
      pending.current[id] = { ...batch[id], ...pending.current[id] };
    });
    setSaveState("error");
    timer.current = setTimeout(flush, RETRY_DELAY);
  }, [attempt.attempt_id, finish]);

  const queue = (id, patch) => {
    pending.current[id] = { ...pending.current[id], ...patch };
    clearTimeout(timer.current);
    setSaveState("saving");
    timer.current = setTimeout(flush, SAVE_DELAY);
  };

  const setAnswer = (id, value) => {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    queue(id, { answer: value });
  };
  const toggleFlag = (id) => {
    const next = { ...flagsRef.current, [id]: !flagsRef.current[id] };
    flagsRef.current = next;
    setFlags(next);
    queue(id, { flagged: Boolean(next[id]) });
  };

  const submit = useCallback(
    async (reason) => {
      if (submittingRef.current || finished.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setSubmitError("");
      clearTimeout(timer.current);
      const snapshot = questions.map((q) => ({ question_id: q.question_id, answer: answersRef.current[q.question_id] || "", flagged: Boolean(flagsRef.current[q.question_id]) }));
      const res = await examSubmit(attempt.attempt_id, snapshot);
      submittingRef.current = false;
      setSubmitting(false);
      if (res.success) {
        finish(reason === "time" ? "Time is up. Your answers have been submitted." : "Your test has been submitted.");
      } else {
        setSubmitError(res.message || "Could not submit. Check your connection and try again.");
      }
    },
    [attempt.attempt_id, questions, finish]
  );

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (remaining > 0 || finished.current) return;
    // If the connection is down, try again every few seconds rather than every tick.
    if (Date.now() - lastTry.current < RETRY_DELAY) return;
    lastTry.current = Date.now();
    submit("time");
  }, [remaining, submit]);

  useEffect(() => {
    const warn = (event) => {
      if (finished.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      clearTimeout(timer.current);
    };
  }, []);

  const question = questions[index];
  const answered = (q) => String(answers[q.question_id] || "").trim() !== "";
  const unanswered = questions.filter((q) => !answered(q)).length;
  const flaggedCount = questions.filter((q) => flags[q.question_id]).length;
  const low = remaining <= 60000;

  return (
    <div className="exam-sit">
      <div className="exam-bar">
        <div>
          <strong>{test.title}</strong>
          <span className="cbt-muted"> · {test.subject_name}</span>
        </div>
        <div className="exam-bar-right">
          <span className={`exam-save is-${saveState}`}>
            {saveState === "saved" ? "All answers saved" : saveState === "saving" ? "Saving..." : "Not saved. Retrying..."}
          </span>
          {saveState === "error" && <button type="button" className="cbt-ghost" onClick={() => { clearTimeout(timer.current); flush(); }}>Retry now</button>}
          <span className={`exam-clock${low ? " is-low" : ""}`} aria-live="off">{formatClock(remaining)}</span>
        </div>
      </div>

      <div className="exam-main">
        <div className="cbt-card exam-question">
          <p className="cbt-muted">Question {index + 1} of {questions.length} · {question.marks} mark{Number(question.marks) === 1 ? "" : "s"}</p>
          <p className="exam-prompt">{question.prompt}</p>
          {question.type === "short" ? (
            <textarea
              className="exam-short"
              value={answers[question.question_id] || ""}
              onChange={(event) => setAnswer(question.question_id, event.target.value)}
              placeholder="Type your answer"
              maxLength={5000}
            />
          ) : (
            <div className="exam-options" role="radiogroup">
              {question.options.map((option) => (
                <label key={option.id} className={`exam-option${answers[question.question_id] === option.id ? " is-on" : ""}`}>
                  <input type="radio" name={question.question_id} checked={answers[question.question_id] === option.id} onChange={() => setAnswer(question.question_id, option.id)} />
                  {option.text}
                </label>
              ))}
              {answers[question.question_id] && (
                <button type="button" className="cbt-link" onClick={() => setAnswer(question.question_id, "")}>Clear my answer</button>
              )}
            </div>
          )}
          <div className="exam-nav">
            <button type="button" className="cbt-ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>Previous</button>
            <button type="button" className={`cbt-ghost${flags[question.question_id] ? " is-flagged" : ""}`} onClick={() => toggleFlag(question.question_id)}>
              {flags[question.question_id] ? "Remove flag" : "Flag for review"}
            </button>
            {index < questions.length - 1 ? (
              <button type="button" className="cbt-btn" onClick={() => setIndex(index + 1)}>Next</button>
            ) : (
              <button type="button" className="cbt-btn" onClick={() => setAsking(true)}>Review and submit</button>
            )}
          </div>
        </div>

        <aside className="cbt-card exam-palette">
          <p className="cbt-section">Questions</p>
          <div className="exam-grid">
            {questions.map((q, i) => (
              <button
                key={q.question_id}
                type="button"
                className={`exam-dot${i === index ? " is-current" : ""}${answered(q) ? " is-answered" : ""}${flags[q.question_id] ? " is-flagged" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${answered(q) ? ", answered" : ", not answered"}${flags[q.question_id] ? ", flagged" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <p className="cbt-muted">{questions.length - unanswered} answered · {unanswered} not answered · {flaggedCount} flagged</p>
          <button type="button" className="cbt-btn exam-submit" onClick={() => setAsking(true)}>Submit test</button>
        </aside>
      </div>

      {asking && (
        <ConfirmDialog
          title="Submit your test?"
          message={`${unanswered > 0 ? `You have ${unanswered} question${unanswered === 1 ? "" : "s"} without an answer. ` : "All questions are answered. "}${flaggedCount > 0 ? `${flaggedCount} flagged for review. ` : ""}You cannot change your answers after submitting.${submitError ? ` ${submitError}` : ""}`}
          confirmLabel={submitError ? "Try again" : "Submit test"}
          busy={submitting}
          onConfirm={() => submit("student")}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
};

const ExamPage = () => {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [session, setSession] = useState(null);
  const [ended, setEnded] = useState("");

  // After a refresh, pick the attempt back up. The attempt belongs to the signed-in student.
  useEffect(() => {
    // The exam link brought them here, so the "go to the exam after login" note has done its job.
    sessionStorage.removeItem("post_login_path");
    const saved = sessionStorage.getItem(STORE_KEY);
    if (!saved) {
      setBusy(false);
      return;
    }
    (async () => {
      const res = await examResume(saved);
      if (res.success) setSession(res.data);
      else sessionStorage.removeItem(STORE_KEY);
      setBusy(false);
    })();
  }, []);

  const lookup = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const res = await examAccess(code);
    setBusy(false);
    if (!res.success) return setError(res.message || "Could not check that code.");
    setInfo(res.data);
  };

  const begin = async (testId = info?.test.test_id) => {
    setBusy(true);
    setError("");
    const res = await examStart(testId, code);
    setBusy(false);
    if (!res.success) return setError(res.message || "Could not start the test.");
    sessionStorage.setItem(STORE_KEY, res.data.attempt.attempt_id);
    return setSession(res.data);
  };

  const recheck = async () => {
    setBusy(true);
    const res = await examAccess(code);
    setBusy(false);
    if (res.success) setInfo(res.data);
  };

  // The teacher starts each student's countdown. While waiting, check every few seconds and go
  // straight into the test the moment it has been started.
  const beginRef = useRef(begin);
  beginRef.current = begin;
  const waiting = info?.state === "waiting";
  useEffect(() => {
    if (!waiting) return undefined;
    const timer = setInterval(async () => {
      const res = await examAccess(code);
      if (!res.success) return;
      if (res.data.state === "in_progress") {
        clearInterval(timer);
        beginRef.current(res.data.test.test_id);
      } else if (res.data.state !== "waiting") {
        setInfo(res.data);
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [waiting, code]);

  const finished = useCallback((message) => {
    setSession(null);
    setInfo(null);
    setEnded(message);
  }, []);

  const reset = () => {
    setInfo(null);
    setEnded("");
    setCode("");
    setError("");
  };

  const state = useMemo(() => info?.state, [info]);

  if (session) return <div className="cbt exam"><Sitting session={session} onFinished={finished} /></div>;

  return (
    <div className="cbt exam">
      <div className="exam-card cbt-card">
        <h1>Take a test</h1>

        {ended && (
          <>
            <p className="cbt-modal-text">{ended}</p>
            <p className="cbt-muted">Your teacher marks the test and releases results. You will find yours on the Report tab for the term once they are released.</p>
            <button type="button" className="cbt-btn" onClick={reset}>Done</button>
          </>
        )}

        {!ended && !info && (
          <form onSubmit={lookup}>
            <p className="cbt-muted">Enter the exam code your teacher gave you.</p>
            <label className="cbt-field">
              Exam code
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={12}
                disabled={busy}
              />
            </label>
            {error && <p className="cbt-error">{error}</p>}
            <button type="submit" className="cbt-btn" disabled={busy || code.replace(/[^A-Za-z0-9]/g, "").length < 8}>{busy ? "Checking..." : "Continue"}</button>
          </form>
        )}

        {!ended && info && (
          <>
            <h2 className="exam-test-title">{info.test.title}</h2>
            <p className="cbt-muted">{info.test.subject_name} · {info.test.class_name}</p>
            <ul className="cbt-facts">
              <li>{info.test.question_count} questions, {info.test.total_marks} marks</li>
              <li>{info.test.duration_minutes} minutes, counted from the moment your teacher starts you{info.test.closes_at ? `. Closes ${when(info.test.closes_at)}` : ""}</li>
              <li>Your answers are saved as you go.</li>
            </ul>
            {info.test.instructions && <div className="exam-instructions"><p className="cbt-option-label">Instructions</p><p>{info.test.instructions}</p></div>}
            {state === "waiting" && <p className="cbt-note">Waiting for your teacher to start your test. Keep this page open. It begins by itself when your teacher starts you.</p>}
            {state === "in_progress" && <p className="cbt-muted">Your test has started and your timer is running.</p>}
            {state === "closed" && <p className="cbt-note">This test is closed.</p>}
            {state === "submitted" && <p className="cbt-note">You have submitted this test. Results appear on your Report tab once your teacher releases them. If your teacher lets you rewrite, select Check again.</p>}
            {error && <p className="cbt-error">{error}</p>}
            <div className="cbt-inline">
              <button type="button" className="cbt-ghost" onClick={reset}>Back</button>
              {state === "submitted" && <button type="button" className="cbt-ghost" onClick={recheck} disabled={busy}>{busy ? "Checking..." : "Check again"}</button>}
              {state === "in_progress" && (
                <button type="button" className="cbt-btn" onClick={() => begin()} disabled={busy}>{busy ? "Opening..." : "Continue test"}</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
