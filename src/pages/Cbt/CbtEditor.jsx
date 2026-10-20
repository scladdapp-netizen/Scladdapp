import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { cbtCreate, cbtGet, cbtUpdate } from "../../api_call/useCbt";
import { ConfirmDialog } from "./CbtModal";
import {
  QUESTION_TYPES,
  STATUS_LABEL,
  blankQuestion,
  copyQuestion,
  fmt,
  formProblems,
  marksProblem,
  overMaxMessages,
  questionProblems,
  totalMarks,
  typeLabel,
} from "./cbtUtils";

const blankForm = (ctx, lockedClassId) => ({
  test_id: "",
  status: "draft",
  title: "",
  instructions: "",
  class_id: lockedClassId || (ctx.classes.length === 1 ? ctx.classes[0].class_id : ""),
  duration_minutes: 30,
  grading_field: "",
  release_explanations: false,
  questions: [],
});

const fromTest = (test) => ({
  test_id: test.test_id,
  status: test.status,
  title: test.title || "",
  instructions: test.instructions || "",
  class_id: test.class_id || "",
  duration_minutes: test.duration_minutes ?? "",
  grading_field: test.grading_field || "",
  release_explanations: Boolean(test.release_explanations),
  questions: (test.questions || []).map((question) => ({ ...question, options: (question.options || []).map((item) => ({ ...item })) })),
});

const payloadOf = (form) => ({
  title: form.title,
  instructions: form.instructions,
  class_id: form.class_id,
  duration_minutes: form.duration_minutes === "" ? null : Number(form.duration_minutes),
  grading_field: form.grading_field,
  release_explanations: form.release_explanations,
  questions: form.questions.map((question) => ({ ...question, marks: question.marks === "" ? NaN : Number(question.marks) })),
});

const snapshot = (form) => JSON.stringify(payloadOf(form));

const QuestionCard = ({ index, count, question, serverMessage, readOnly, marksLocked, overMessage, onChange, onMove, onCopy, onRemove }) => {
  const set = (patch) => onChange({ ...question, ...patch });
  const marksError = marksProblem(question) || overMessage || "";
  const blocking = questionProblems(question);
  const setOption = (id, text) => set({ options: question.options.map((item) => (item.id === id ? { ...item, text } : item)) });
  const removeOption = (id) => set({ options: question.options.filter((item) => item.id !== id), correct_option_id: question.correct_option_id === id ? "" : question.correct_option_id });
  const addOption = () => set({ options: [...question.options, { id: `o_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text: "" }] });

  return (
    <div className={`cbt-q${marksError || serverMessage ? " is-error" : ""}`}>
      <div className="cbt-q-top">
        <strong><span className="cbt-num">{index + 1}</span><span className={`cbt-type is-${question.type}`}>{typeLabel(question.type)}</span></strong>
        {!readOnly && (
          <div className="cbt-q-tools">
            <button type="button" className="cbt-link" disabled={index === 0} onClick={() => onMove(-1)}>Move up</button>
            <button type="button" className="cbt-link" disabled={index === count - 1} onClick={() => onMove(1)}>Move down</button>
            <button type="button" className="cbt-link" onClick={onCopy}>Duplicate</button>
            <button type="button" className="cbt-link is-danger" onClick={onRemove}>Remove</button>
          </div>
        )}
      </div>
      <div className="cbt-q-body">
        <label className="cbt-field">
          Question
          <textarea value={question.prompt} onChange={(event) => set({ prompt: event.target.value })} placeholder="Type the question" />
        </label>
        <label className={`cbt-field cbt-marks${marksError ? " is-error" : ""}`}>
          Marks
          <input
            type="number"
            min="0"
            step="0.25"
            value={marksLocked ? "" : question.marks}
            disabled={marksLocked}
            placeholder={marksLocked ? "—" : ""}
            onChange={(event) => set({ marks: event.target.value })}
          />
          {marksLocked && <span className="cbt-muted">Choose the report assessment first.</span>}
          {!marksLocked && marksError && <span className="cbt-error">{marksError}</span>}
        </label>
      </div>

      {question.type === "mcq" && (
        <div className="cbt-options">
          <p className="cbt-option-label">Options. Select the circle beside the correct answer.</p>
          {question.options.map((option, optionIndex) => (
            <div className="cbt-option" key={option.id}>
              <input type="radio" name={`correct-${question.question_id}`} checked={question.correct_option_id === option.id} onChange={() => set({ correct_option_id: option.id })} aria-label={`Option ${optionIndex + 1} is correct`} />
              <input value={option.text} onChange={(event) => setOption(option.id, event.target.value)} placeholder={`Option ${optionIndex + 1}`} />
              {!readOnly && question.options.length > 2 && (
                <button type="button" className="cbt-link is-danger" onClick={() => removeOption(option.id)}>Remove</button>
              )}
            </div>
          ))}
          {!readOnly && question.options.length < 8 && (
            <button type="button" className="cbt-add" onClick={addOption}>Add option</button>
          )}
        </div>
      )}

      {question.type === "truefalse" && (
        <div className="cbt-options cbt-tf">
          <p className="cbt-option-label">Correct answer</p>
          {question.options.map((option) => (
            <label key={option.id} className="cbt-choice">
              <input type="radio" name={`correct-${question.question_id}`} checked={question.correct_option_id === option.id} onChange={() => set({ correct_option_id: option.id })} />
              {option.text}
            </label>
          ))}
        </div>
      )}

      {question.type === "short" && (
        <p className="cbt-short-note">Students type their own answer. You mark it by hand after the test.</p>
      )}

      <div className="cbt-q-extra">
        <label className="cbt-field">
          Explanation (optional)
          <textarea value={question.explanation} onChange={(event) => set({ explanation: event.target.value })} placeholder="Shown with the result only if you allow it in the examination settings" />
        </label>
      </div>

      {(serverMessage || (blocking.length > 0 && !marksError)) && (
        <p className="cbt-q-hint">{serverMessage || blocking[0]}</p>
      )}
    </div>
  );
};

const CbtEditor = ({ ctx, testId, lockedClassId, onBack, onSaved }) => {
  const { addNotification } = useNotification();
  const [form, setForm] = useState(() => blankForm(ctx, lockedClassId));
  const [loading, setLoading] = useState(Boolean(testId));  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(() => snapshot(blankForm(ctx, lockedClassId)));
  const [saving, setSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [leaveAsk, setLeaveAsk] = useState(false);
  const readOnly = form.status !== "draft";
  const dirty = !readOnly && snapshot(form) !== saved;

  // The address can change after the first save of a new test; only the first id is loaded.
  const initialId = useRef(testId).current;

  useEffect(() => {
    if (!initialId) return;
    let alive = true;
    (async () => {
      const res = await cbtGet(initialId);
      if (!alive) return;
      if (!res.success) {
        setLoadError(res.message || "Could not open this test.");
      } else {
        const next = fromTest(res.data);
        setForm(next);
        setSaved(snapshot(next));
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [initialId]);

  const assessmentMax = useMemo(() => ctx.fields.find((item) => item.field_name === form.grading_field)?.max_score ?? null, [ctx.fields, form.grading_field]);
  const problems = useMemo(() => formProblems(form, assessmentMax), [form, assessmentMax]);
  const total = totalMarks(form.questions);
  const overMax = useMemo(() => overMaxMessages(form.questions, assessmentMax), [form.questions, assessmentMax]);
  const hasMarksError = form.questions.some((question) => marksProblem(question) || overMax[question.question_id]);
  const serverFor = (id) => serverErrors.find((item) => item.question_id === id)?.message || "";

  const edit = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    if (serverErrors.length) setServerErrors([]);
  };
  const setQuestion = (index, next) => edit({ questions: form.questions.map((item, i) => (i === index ? next : item)) });
  const move = (index, step) => {
    const list = [...form.questions];
    const [item] = list.splice(index, 1);
    list.splice(index + step, 0, item);
    edit({ questions: list });
  };

  const save = useCallback(async ({ leaving = false } = {}) => {
    if (hasMarksError) {
      addNotification("Fix the marks highlighted in red before saving.", "error");
      return null;
    }
    setSaving(true);
    const body = payloadOf(form);
    const res = form.test_id
      ? await cbtUpdate(form.test_id, body)
      : await cbtCreate({ ...body, subject_id: ctx.subject.subject_id, subsession_id: ctx.term.term_id });
    setSaving(false);
    if (!res.success) {
      setServerErrors(res.errors || []);
      addNotification(res.message || "Could not save the draft.", "error");
      return null;
    }
    const next = { ...form, test_id: res.data.test_id, status: res.data.status };
    setForm(next);
    setSaved(snapshot(next));
    if (onSaved && !leaving) onSaved(res.data.test_id);
    return res.data;
  }, [form, hasMarksError, ctx, addNotification, onSaved]);

  // Save the draft, then return to the tests list.
  const saveAndClose = async () => {
    const result = await save({ leaving: true });
    if (!result) return;
    addNotification("Test saved.", "success");
    onBack();
  };

  const leave = () => (dirty ? setLeaveAsk(true) : onBack());

  if (loading) return <div className="cbt-card cbt-empty">Opening test...</div>;
  if (loadError) {
    return (
      <div className="cbt-card cbt-empty">
        <p className="cbt-error">{loadError}</p>
        <button type="button" className="cbt-btn" onClick={onBack}>Back to tests</button>
      </div>
    );
  }

  const statusLabel = STATUS_LABEL[form.status] || "Draft";

  return (
    <div className="cbt-edit">
      <div className="cbt-editor-head">
        <div className="cbt-head-copy">
          <div className="cbt-title-row">
            <h1>{form.title.trim() || "New test"}</h1>
            <span className={`cbt-pill is-${form.status}`}>{statusLabel}</span>
            {dirty && <span className="cbt-dirty">Unsaved changes</span>}
          </div>
          <p className="cbt-muted">
            {ctx.subject.subject_name} · {ctx.term.term_name}
            {readOnly ? ` · This test is ${statusLabel.toLowerCase()}, so its content is locked.` : ""}
          </p>
        </div>
      </div>

      <fieldset className="cbt-fieldset cbt-split" disabled={readOnly}>
        <section className="cbt-card cbt-side">
          <h2 className="cbt-section">Details</h2>
          <div className="cbt-stack">
            <label className="cbt-field">
              Title
              <input value={form.title} maxLength={200} onChange={(event) => edit({ title: event.target.value })} placeholder="e.g. First continuous assessment" />
            </label>
            <label className="cbt-field">
              Class
              <select value={form.class_id} onChange={(event) => edit({ class_id: event.target.value })} disabled={Boolean(lockedClassId) || readOnly}>
                <option value="">Choose a class</option>
                {ctx.classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.class_name}</option>)}
              </select>
            </label>
            <label className="cbt-field">
              Report assessment
              <select value={form.grading_field} onChange={(event) => edit({ grading_field: event.target.value })}>
                <option value="">Choose the assessment this test feeds</option>
                {ctx.fields.map((item) => <option key={item.field_name} value={item.field_name}>{item.field_name} (out of {item.max_score})</option>)}
              </select>
            </label>
            <p className="cbt-muted">
              {assessmentMax
                ? `The question marks must add up to ${assessmentMax}. Each student's total goes into ${form.grading_field} on the score sheet once you release the results.`
                : "Choose this first. Question marks can only be entered once the assessment is known, and they must add up to its maximum score."}
            </p>
            <label className="cbt-field">
              Instructions
              <textarea value={form.instructions} onChange={(event) => edit({ instructions: event.target.value })} placeholder="What students should know before they begin" />
            </label>

            <h3 className="cbt-subhead">Examination settings</h3>
            <label className="cbt-field">
              Duration (minutes)
              <input type="number" min="1" max="600" value={form.duration_minutes} onChange={(event) => edit({ duration_minutes: event.target.value })} />
            </label>
            <label className="cbt-check">
              <input type="checkbox" checked={form.release_explanations} onChange={(event) => edit({ release_explanations: event.target.checked })} />
              Show question explanations to students after results are released
            </label>
            <p className="cbt-muted">The opening and closing times, and the students who can write it, are chosen when you publish.</p>
          </div>
        </section>

        <section className="cbt-card cbt-main">
          <div className="cbt-section-row">
            <h2 className="cbt-section">Questions</h2>
            <span className={`cbt-total${assessmentMax && total > assessmentMax ? " is-over" : assessmentMax && total === Number(assessmentMax) && form.questions.length ? " is-full" : ""}`}>
              {form.questions.length} question{form.questions.length === 1 ? "" : "s"} · {assessmentMax ? `${fmt(total)} / ${assessmentMax} marks` : `${fmt(total)} marks`}
            </span>
          </div>
          {!assessmentMax && <p className="cbt-note">Choose the report assessment under Details before adding marks.</p>}
          {form.questions.length === 0 && <p className="cbt-empty">No questions yet.</p>}
          <div className="cbt-q-list">
            {form.questions.map((question, index) => (
              <QuestionCard
                key={question.question_id}
                index={index}
                count={form.questions.length}
                question={question}
                serverMessage={serverFor(question.question_id)}
                readOnly={readOnly}
                marksLocked={!assessmentMax}
                overMessage={overMax[question.question_id]}
                onChange={(next) => setQuestion(index, next)}
                onMove={(step) => move(index, step)}
                onCopy={() => edit({ questions: [...form.questions.slice(0, index + 1), copyQuestion(question), ...form.questions.slice(index + 1)] })}
                onRemove={() => edit({ questions: form.questions.filter((_, i) => i !== index) })}
              />
            ))}
          </div>
          {!readOnly && (
            <div className="cbt-add-wrap">
              {addOpen ? (
                <div className="cbt-add-types">
                  {QUESTION_TYPES.map((type) => (
                    <button type="button" key={type.id} onClick={() => { edit({ questions: [...form.questions, blankQuestion(type.id)] }); setAddOpen(false); }}>{type.label}</button>
                  ))}
                </div>
              ) : null}
              <button type="button" className="cbt-add-question" onClick={() => setAddOpen((open) => !open)}>
                {addOpen ? "Cancel" : "Add question"}
              </button>
            </div>
          )}
        </section>
      </fieldset>

      <div className="cbt-bar" role="toolbar" aria-label="Test actions">
        <div className="cbt-bar-inner">
          <button type="button" className="cbt-ghost" onClick={leave}>Back</button>
          <div className="cbt-bar-status">
            {readOnly ? (
              <span className="cbt-muted">This test is {statusLabel.toLowerCase()}.</span>
            ) : problems.length ? (
              <span className="cbt-hint" role="status">{problems.length === 1 ? problems[0] : `${problems[0]} (${problems.length - 1} more to fix before publishing)`}</span>
            ) : (
              <span className="cbt-hint is-ready" role="status">Ready. After saving, open the test from the list to assign students.</span>
            )}
          </div>
          {!readOnly && (
            <div className="cbt-bar-actions">
              <button type="button" className="cbt-btn" onClick={saveAndClose} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            </div>
          )}
        </div>
      </div>

      {leaveAsk && (
        <ConfirmDialog
          title="Leave without saving?"
          message="You have unsaved changes to this draft. They will be lost."
          confirmLabel="Leave"
          danger
          onConfirm={onBack}
          onCancel={() => setLeaveAsk(false)}
        />
      )}
    </div>
  );
};

export default CbtEditor;
