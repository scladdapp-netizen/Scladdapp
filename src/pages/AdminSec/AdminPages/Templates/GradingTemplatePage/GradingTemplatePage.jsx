import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import FormInput from "../../../../../components/FormInput";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useCombinedTemplate } from "../../../../../api_call/useCombinedTemplate";
import { useClass } from "../../../../../api_call/useClass";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { generateDefaultReportHtml } from "../../../../../utils/generateDefaultReportHtml";
import { FaPlus, FaTrash, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import "../Templates.css";
import "./GradingTemplatePage.css";

const TRAITS = [
  "Neatness", "Punctuality", "Politeness", "Honesty", "Leadership", "Cooperation",
  "Attentiveness", "Initiative", "Self-Control", "Respect for Others", "Responsibility",
  "Perseverance", "Creativity", "Problem Solving", "Time Management", "Teamwork",
];

const blankFields = () => [{ fieldName: "FT", weight: 20, maxScore: 20 }, { fieldName: "ST", weight: 20, maxScore: 20 }, { fieldName: "Exam", weight: 60, maxScore: 60 }];
const blankScheme = () => [
  { gradeLetter: "A", minRange: 70, maxRange: 100, gradePoint: 4, passFail: "Pass" },
  { gradeLetter: "B", minRange: 60, maxRange: 69, gradePoint: 3, passFail: "Pass" },
  { gradeLetter: "C", minRange: 50, maxRange: 59, gradePoint: 2, passFail: "Pass" },
  { gradeLetter: "D", minRange: 40, maxRange: 49, gradePoint: 1, passFail: "Pass" },
  { gradeLetter: "F", minRange: 0, maxRange: 39, gradePoint: 0, passFail: "Fail" },
];

const toFields = (list) => (list || []).map((f) => ({ fieldName: f.field_name || "", weight: f.weight ?? 0, maxScore: f.max_score ?? "" }));
const toScheme = (list) => (list || []).map((s) => ({
  gradeLetter: s.grade_letter || "",
  minRange: s.min_range ?? "",
  maxRange: s.max_range ?? "",
  gradePoint: s.grade_point ?? "",
  passFail: s.pass_fail || "Pass",
}));
const fromFields = (list) => list.map((f) => ({ field_name: f.fieldName, weight: f.weight, max_score: f.maxScore || 0 }));
const fromScheme = (list) => list.map((s) => ({
  grade_letter: s.gradeLetter,
  min_range: s.minRange,
  max_range: s.maxRange,
  grade_point: s.gradePoint,
  pass_fail: s.passFail,
}));

const weightOf = (fields) => fields.reduce((sum, f) => sum + (parseInt(f.weight) || 0), 0);

const coverageOf = (scheme) => {
  const covered = new Array(101).fill(false);
  scheme.forEach((s) => {
    if (s.minRange === "" || s.maxRange === "") return;
    const lo = Math.max(0, parseInt(s.minRange));
    const hi = Math.min(100, parseInt(s.maxRange));
    if (Number.isNaN(lo) || Number.isNaN(hi) || lo > hi) return;
    for (let p = lo; p <= hi; p++) covered[p] = true;
  });
  const gaps = [];
  let start = null;
  for (let p = 0; p <= 101; p++) {
    if (p <= 100 && !covered[p]) { if (start === null) start = p; }
    else if (start !== null) { gaps.push(start === p - 1 ? `${start}%` : `${start}–${p - 1}%`); start = null; }
  }
  const overlaps = [];
  const ranges = scheme
    .map((s, i) => ({ i, min: parseInt(s.minRange), max: parseInt(s.maxRange), letter: s.gradeLetter }))
    .filter((r) => r.min <= r.max && sOk(r));
  for (let a = 0; a < ranges.length; a++) {
    for (let b = a + 1; b < ranges.length; b++) {
      if (ranges[a].min <= ranges[b].max && ranges[a].max >= ranges[b].min) {
        overlaps.push(`${ranges[a].letter || "Grade " + (a + 1)} overlaps ${ranges[b].letter || "Grade " + (b + 1)}`);
      }
    }
  }
  return { percent: Math.round((covered.filter(Boolean).length / 101) * 100), gaps, overlaps, full: gaps.length === 0 && overlaps.length === 0 };
};

function sOk(r) {
  return !Number.isNaN(r.min) && !Number.isNaN(r.max);
}

const classLabel = (c) => [c?.class_name, c?.class_section].filter(Boolean).join(" ") || c?.class_id || "Class";

const emptyForm = () => ({
  name: "",
  description: "",
  gradingFields: blankFields(),
  gradingScheme: blankScheme(),
  behavioralTraits: ["Neatness", "Punctuality", "Politeness", "Honesty"],
  classOverrides: [],
});

export default function GradingTemplatePage() {
  const { schoolId, templateId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { createTemplate, getTemplateById, updateTemplate, checkIsAssigned } = useCombinedTemplate();
  const { getClassesBySchoolId } = useClass();

  const [loading, setLoading] = useState(Boolean(templateId));
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(false);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [active, setActive] = useState("default");
  const [traitInput, setTraitInput] = useState("");

  const back = () => navigate(`/admin/${schoolId}/templates`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const classRes = await getClassesBySchoolId(schoolId);
      if (!cancelled && classRes.success) setClasses(classRes.data || []);
      if (!templateId) return;
      setLoading(true);
      const [tpl, lock] = await Promise.all([
        getTemplateById(templateId),
        checkIsAssigned(templateId),
      ]);
      if (cancelled) return;
      if (!tpl.success) {
        addNotification(tpl.message || "Could not open this template", "error");
        back();
        return;
      }
      const t = tpl.data;
      setForm({
        name: t.name || "",
        description: t.description || "",
        gradingFields: toFields(t.grading_fields).length ? toFields(t.grading_fields) : blankFields(),
        gradingScheme: toScheme(t.grading_scheme).length ? toScheme(t.grading_scheme) : blankScheme(),
        behavioralTraits: t.behavioral_traits || [],
        classOverrides: (t.class_overrides || []).map((row) => ({
          name: row.name || "",
          classIds: (row.class_ids || []).map(String),
          gradingFields: toFields(row.grading_fields),
          gradingScheme: toScheme(row.grading_scheme),
          behavioralTraits: row.behavioral_traits || [],
        })),
      });
      setAssigned(!!lock.assigned);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, templateId]);

  const slice = active === "default" ? form : form.classOverrides[active];
  const usedIds = useMemo(() => new Set(form.classOverrides.flatMap((row) => row.classIds)), [form.classOverrides]);
  const namesFor = (ids) => ids.map((id) => classLabel(classes.find((c) => String(c.class_id) === String(id)) || { class_id: id })).join(", ");

  const patchSlice = (partial) => {
    if (active === "default") setForm((p) => ({ ...p, ...partial }));
    else setForm((p) => ({
      ...p,
      classOverrides: p.classOverrides.map((row, i) => (i === active ? { ...row, ...partial } : row)),
    }));
  };

  const setField = (i, key, value) => patchSlice({
    gradingFields: slice.gradingFields.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)),
  });
  const setGrade = (i, key, value) => patchSlice({
    gradingScheme: slice.gradingScheme.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
  });
  const toggleTrait = (trait) => patchSlice({
    behavioralTraits: slice.behavioralTraits.includes(trait)
      ? slice.behavioralTraits.filter((t) => t !== trait)
      : [...slice.behavioralTraits, trait],
  });

  const weight = weightOf(slice?.gradingFields || []);
  const coverage = coverageOf(slice?.gradingScheme || []);
  const locked = assigned;
  const defaultClasses = classes.filter((c) => !usedIds.has(String(c.class_id)));
  const setupTitle = (row) => (row.name || "").trim() || "Untitled setup";
  const takenElsewhere = new Set(
    form.classOverrides
      .filter((_, i) => i !== active)
      .flatMap((row) => (row.classIds || []).map(String))
  );
  const toggleClass = (classId) => {
    const current = (slice.classIds || []).map(String);
    patchSlice({
      classIds: current.includes(classId) ? current.filter((id) => id !== classId) : [...current, classId],
    });
  };

  const addSetup = () => {
    const next = {
      name: "",
      classIds: [],
      gradingFields: form.gradingFields.map((f) => ({ ...f })),
      gradingScheme: form.gradingScheme.map((s) => ({ ...s })),
      behavioralTraits: [...form.behavioralTraits],
    };
    setForm((p) => ({ ...p, classOverrides: [...p.classOverrides, next] }));
    setActive(form.classOverrides.length);
    setTraitInput("");
  };

  const removeSetup = (index) => {
    setForm((p) => ({ ...p, classOverrides: p.classOverrides.filter((_, i) => i !== index) }));
    setActive("default");
  };

  const save = async () => {
    if (locked) return;
    if (!form.name.trim()) return addNotification("Template name is required", "error");
    if (weightOf(form.gradingFields) !== 100) return addNotification("The default assessment weights must add up to 100%", "error");
    if (!coverageOf(form.gradingScheme).full) return addNotification("The default grading scheme must cover 0% to 100% without overlaps", "error");
    for (let i = 0; i < form.classOverrides.length; i++) {
      const row = form.classOverrides[i];
      const label = row.name.trim() || namesFor(row.classIds) || `Class setup ${i + 1}`;
      if (!row.name.trim()) return addNotification(`Give “${label}” a name, such as SSS 3`, "error");
      if (!row.classIds.length) return addNotification(`Choose at least one class for “${label}”`, "error");
      if (weightOf(row.gradingFields) !== 100) return addNotification(`“${label}” score weights must add up to 100%`, "error");
      if (!coverageOf(row.gradingScheme).full) return addNotification(`“${label}” grades must cover 0% to 100% without overlaps`, "error");
    }

    setSaving(true);
    const modifiedBy = user?.admin?.admin_id || user?.user_id;
    const payload = {
      name: form.name,
      description: form.description,
      grading_fields: fromFields(form.gradingFields),
      grading_scheme: fromScheme(form.gradingScheme),
      behavioral_traits: form.behavioralTraits,
      class_overrides: form.classOverrides.map((row) => ({
        name: row.name,
        class_ids: row.classIds,
        grading_fields: fromFields(row.gradingFields),
        grading_scheme: fromScheme(row.gradingScheme),
        behavioral_traits: row.behavioralTraits,
      })),
      modified_by: modifiedBy,
    };

    const result = templateId
      ? await updateTemplate(templateId, payload)
      : await createTemplate({
          ...payload,
          school_id: schoolId,
          created_by: modifiedBy,
          html_template: generateDefaultReportHtml({
            grading_fields: payload.grading_fields,
            grading_scheme: payload.grading_scheme,
            behavioral_traits: payload.behavioral_traits,
            school: user?.school || {},
          }),
        });
    setSaving(false);
    if (!result.success) return addNotification(result.message || "Could not save the template", "error");
    addNotification(templateId ? "Template updated" : "Template created", "success");
    back();
  };

  if (loading || !slice) {
    return <div className="gte-page"><LoadingData message="Loading template..." /></div>;
  }

  return (
    <div className="gte-page">
      <header className="gte-top">
        <button type="button" className="gte-back" onClick={back}><FaArrowLeft size={12} /> Templates</button>
        <div className="gte-title">
          <h1>{templateId ? "Edit grading template" : "New grading template"}</h1>
          <p>Most classes share one mark sheet. If a class needs different scores, grades, or behaviour marks, add a class setup.</p>
        </div>
        <div className="gte-top-actions">
          <Button variant="secondary" onClick={back} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={locked || saving || !form.name.trim()}>{saving ? "Saving..." : "Save template"}</Button>
        </div>
      </header>

      {locked && (
        <div className="gte-lock">
          <FaExclamationTriangle size={14} />
          This template is already assigned to a term, so its assessments, grades, and traits are locked.
        </div>
      )}

      <div className="gte-layout">
        <aside className="gte-side">
          <div className="gte-side-label">Classes</div>
          <div role="button" tabIndex={0} className={`gte-group${active === "default" ? " is-on" : ""}`} onClick={() => setActive("default")} onKeyDown={(e) => { if (e.key === "Enter") setActive("default"); }}>
            <strong>All other classes</strong>
            <span>Shared scores, grades, and behaviour</span>
            <div className="gte-chips">
              {defaultClasses.length === 0 && <em>Every class has its own setup.</em>}
              {defaultClasses.map((c) => <span key={String(c.class_id)} className="gte-chip">{classLabel(c)}</span>)}
            </div>
          </div>
          {form.classOverrides.map((row, i) => (
            <div key={i} role="button" tabIndex={0} className={`gte-group${active === i ? " is-on" : ""}`} onClick={() => { setActive(i); setTraitInput(""); }} onKeyDown={(e) => { if (e.key === "Enter") { setActive(i); setTraitInput(""); } }}>
              <strong>{setupTitle(row)}</strong>
              <span>{row.classIds.length ? `${row.classIds.length} ${row.classIds.length === 1 ? "class" : "classes"}` : "No classes chosen yet"}</span>
              <div className="gte-chips">
                {row.classIds.map((id) => <span key={id} className="gte-chip">{classLabel(classes.find((c) => String(c.class_id) === String(id)) || { class_id: id })}</span>)}
              </div>
            </div>
          ))}
          {!locked && (
            <button type="button" className="gte-add" onClick={addSetup}>
              <FaPlus size={11} /> Add class setup
            </button>
          )}
        </aside>

        <div className={`gte-main${locked ? " is-locked" : ""}`}>
          {active === "default" ? (
            <div className="gte-identity">
              <FormInput label="Template name" type="text" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="For example, Senior school" />
              <FormInput label="Description" type="textarea" value={form.description} onChange={(v) => setForm((p) => ({ ...p, description: v }))} placeholder="A short note about this template" height="70px" />
              <div className="gte-default-note">
                <strong>Classes using this</strong>
                <p>Every class listed here uses the scores, grades, and behaviour marks below. A class leaves this list only when you give it its own setup.</p>
                <div className="gte-chips">
                  {defaultClasses.length === 0 && <em>No classes are on the default right now.</em>}
                  {defaultClasses.map((c) => <span key={String(c.class_id)} className="gte-chip">{classLabel(c)}</span>)}
                </div>
              </div>
            </div>
          ) : (
            <div className="gte-setup">
              <div className="gte-setup-top">
                <div>
                  <h2>Class setup</h2>
                  <p>Name this setup, then tick the classes that should use it instead of the default. Score sheets, report cards, and tests follow the setup.</p>
                </div>
                {!locked && <Button variant="secondary" onClick={() => removeSetup(active)}>Remove this setup</Button>}
              </div>
              <FormInput label="Setup name" type="text" value={slice.name || ""} onChange={(v) => patchSlice({ name: v })} placeholder="For example, SSS 3" />
              <div className="gte-choose">
                <div className="gte-choose-label">Which classes use this setup?</div>
                <div className="gte-choose-list">
                  {classes.filter((c) => !takenElsewhere.has(String(c.class_id))).map((c) => {
                    const id = String(c.class_id);
                    const on = (slice.classIds || []).map(String).includes(id);
                    return (
                      <label key={id} className={`gte-choose-item${on ? " is-on" : ""}`}>
                        <input type="checkbox" checked={on} onChange={() => toggleClass(id)} />
                        {classLabel(c)}
                      </label>
                    );
                  })}
                  {classes.filter((c) => !takenElsewhere.has(String(c.class_id))).length === 0 && <p>Every class already belongs to another setup.</p>}
                </div>
              </div>
            </div>
          )}

          <section className="grading-fields-section">
            <div className="grading-fields-header">
              <h3>Scores teachers enter</h3>
              <span className={`total-weight ${weight === 100 ? "valid" : "invalid"}`}>
                Total: {weight}%
                {weight !== 100 && <FaExclamationTriangle size={12} style={{ marginLeft: 4 }} />}
              </span>
              <Button variant="secondary" onClick={() => patchSlice({ gradingFields: [...slice.gradingFields, { fieldName: "", weight: 0, maxScore: "" }] })}>
                <FaPlus size={12} /> Add field
              </Button>
            </div>
            <p className="gte-help">These are the columns on the mark sheet, such as FT, ST, and Exam. The weights must add up to 100. Max score is the highest mark a teacher can type.</p>
            <div className="gte-fields">
              {slice.gradingFields.map((f, i) => (
                <div key={i} className="grading-field-row">
                  <FormInput label="Score name" type="text" value={f.fieldName} onChange={(v) => setField(i, "fieldName", v)} placeholder="FT, ST, TT, Exam" />
                  <FormInput label="Weight (%)" type="number" value={f.weight} onChange={(v) => setField(i, "weight", parseInt(v) || 0)} placeholder="20" />
                  <FormInput label="Max score" type="number" value={f.maxScore} onChange={(v) => setField(i, "maxScore", v)} placeholder="20" />
                  {slice.gradingFields.length > 1 && (
                    <button type="button" className="remove-field-btn" onClick={() => patchSlice({ gradingFields: slice.gradingFields.filter((_, idx) => idx !== i) })}>
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {weight !== 100 && <div className="weight-warning"><FaExclamationTriangle size={14} /><span>Weights must add up to 100%</span></div>}
          </section>

          <section className="grading-scheme-section">
            <div className="grading-scheme-header">
              <h3>How a percentage becomes a grade</h3>
              <span className={`total-weight ${coverage.full ? "valid" : "invalid"}`}>
                Covered: {coverage.percent}%
                {!coverage.full && <FaExclamationTriangle size={12} style={{ marginLeft: 4 }} />}
              </span>
              <Button variant="secondary" onClick={() => patchSlice({ gradingScheme: [...slice.gradingScheme, { gradeLetter: "", minRange: "", maxRange: "", gradePoint: "", passFail: "Pass" }] })}>
                <FaPlus size={12} /> Add grade
              </Button>
            </div>
            <p className="gte-help">Cover every score from 0% to 100%, with no two grades covering the same score. For example, A can be 70 to 100.</p>
            <div className="scheme-scroll">
              <table className="scheme-edit-table">
                <thead>
                  <tr><th>Grade</th><th>Min %</th><th>Max %</th><th>Points</th><th>Pass/Fail</th><th></th></tr>
                </thead>
                <tbody>
                  {slice.gradingScheme.map((s, i) => (
                    <tr key={i}>
                      <td><FormInput type="text" value={s.gradeLetter} onChange={(v) => setGrade(i, "gradeLetter", v)} placeholder="A" /></td>
                      <td><FormInput type="number" value={s.minRange} onChange={(v) => setGrade(i, "minRange", v)} placeholder="70" /></td>
                      <td><FormInput type="number" value={s.maxRange} onChange={(v) => setGrade(i, "maxRange", v)} placeholder="100" /></td>
                      <td><FormInput type="number" value={s.gradePoint} onChange={(v) => setGrade(i, "gradePoint", v)} placeholder="4" /></td>
                      <td><FormInput type="select" value={s.passFail} onChange={(v) => setGrade(i, "passFail", v)} options={[{ value: "Pass", label: "Pass" }, { value: "Fail", label: "Fail" }]} /></td>
                      <td>
                        {slice.gradingScheme.length > 1 && (
                          <button type="button" className="remove-scheme-btn" onClick={() => patchSlice({ gradingScheme: slice.gradingScheme.filter((_, idx) => idx !== i) })}>
                            <FaTrash size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {coverage.gaps.length > 0 && <div className="weight-warning"><FaExclamationTriangle size={14} /><span>Not covered: {coverage.gaps.join(", ")}</span></div>}
            {coverage.overlaps.length > 0 && <div className="range-warning"><FaExclamationTriangle size={14} /><span>{coverage.overlaps.join(", ")}</span></div>}
          </section>

          <section className="behavioral-traits-section bt-section">
            <div className="bt-head">
              <h3>Behaviour on the report card</h3>
              <span className="bt-count">{slice.behavioralTraits.length} selected</span>
            </div>
            <p className="bt-hint">Teachers tick these on the report card. Pick the ones this group of classes should have.</p>
            <div className="bt-chips">
              {TRAITS.map((trait) => {
                const on = slice.behavioralTraits.includes(trait);
                return (
                  <button key={trait} type="button" className={`bt-chip${on ? " is-on" : ""}`} onClick={() => toggleTrait(trait)}>
                    <span className="bt-chip-mark">{on ? "✓" : "+"}</span>{trait}
                  </button>
                );
              })}
            </div>
            <div className="bt-add">
              <input
                type="text"
                className="bt-input"
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const val = traitInput.trim();
                  if (!val || slice.behavioralTraits.includes(val)) return;
                  patchSlice({ behavioralTraits: [...slice.behavioralTraits, val] });
                  setTraitInput("");
                }}
                placeholder="Or type a custom trait and press Enter"
              />
              <Button variant="secondary" onClick={() => {
                const val = traitInput.trim();
                if (!val || slice.behavioralTraits.includes(val)) return;
                patchSlice({ behavioralTraits: [...slice.behavioralTraits, val] });
                setTraitInput("");
              }}>Add</Button>
            </div>
            {slice.behavioralTraits.length > 0 && (
              <div className="bt-selected">
                <div className="bt-selected-label">Selected</div>
                <div className="bt-selected-list">
                  {slice.behavioralTraits.map((trait, i) => (
                    <div key={trait} className="bt-tag">
                      <span className="bt-tag-num">{i + 1}</span>
                      <span className="bt-tag-name">{trait}</span>
                      <button type="button" className="bt-tag-x" onClick={() => toggleTrait(trait)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
