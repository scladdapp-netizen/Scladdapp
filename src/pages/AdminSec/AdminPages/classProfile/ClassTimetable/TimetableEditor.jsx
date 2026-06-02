import { useState, useEffect } from "react";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import { useTimetableTemplate } from "../../../../../api_call";
import useAITimetable from "../../../../../api_call/useAITimetable";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import "./TimetableEditor.css";

const BASE = `${import.meta.env.VITE_API_BASE_URL}`;
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const streams = [
  { id: "science",    name: "Science Stream",       color: "#10b981" },
  { id: "arts",       name: "Arts Stream",           color: "#3b82f6" },
  { id: "commercial", name: "Commercial Stream",     color: "#f59e0b" },
  { id: "general",    name: "General (All Streams)", color: "#6b7280" },
];

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const IcoX = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoAI = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="2" fill="currentColor" opacity="0.3"/>
  </svg>
);
const IcoCal = () => (
  <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const TimetableEditor = ({
  timetableData = [],
  className,
  classId,
  schoolId,
  subsessionId,
  onClose,
  onSave,
  saving = false,
  generatedBy,
  onTimetableChange,
}) => {
  const [entries, setEntries] = useState(timetableData.filter((e) => e.start && e.end));
  const [form, setForm] = useState({ day: "", subjectIds: [], start: "", end: "" });
  const [editingId, setEditingId] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // AI panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const { generating, generate } = useAITimetable();
  const { getTimetableTemplatesBySchool } = useTimetableTemplate();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!aiPanelOpen || !schoolId) return;
    setTemplatesLoading(true);
    getTimetableTemplatesBySchool(schoolId)
      .then((res) => { if (res.success) setTemplates(res.data || []); })
      .finally(() => setTemplatesLoading(false));
  }, [aiPanelOpen, schoolId]);

  const handleAIGenerate = async () => {
    const result = await generate({
      templateId: selectedTemplateId,
      schoolId,
      subsessionId,
      classId,
      notes: aiNotes,
      generatedBy: generatedBy || null,
    });
    if (result.success && result.entries) {
      // Apply generated entries directly into the editor
      const updated = result.entries.filter((e) => e.start && e.end);
      setEntries(updated);
      onTimetableChange && onTimetableChange(updated);
      addNotification("AI timetable generated — review and save.", "success");
      setAiPanelOpen(false);
    } else {
      addNotification(result.message || "AI generation failed.", "error");
    }
  };

  const parseField = (v) => {
    if (!v || typeof v === "object") return v;
    try { return JSON.parse(v); } catch { return v; }
  };

  // Sync entries when parent timetableData changes (e.g. on open)
  useEffect(() => {
    setEntries(timetableData.filter((e) => e.start && e.end));
  }, [timetableData]);

  // Fetch real subjects assigned to this class
  useEffect(() => {
    if (!classId) return;
    setLoadingSubjects(true);
    fetch(`${BASE}/api/class-subjects/${classId}?limit=100`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          // Map to the shape the editor needs
          const mapped = json.data.map((s) => ({
            subjectId: s.subject_id,
            subjectName: s.subject_name,
            subjectCode: s.subject_code,
            teacher: s.teacher_name || "Not assigned",
            stream: s.stream || "general",
          }));
          setAvailableSubjects(mapped);
        }
      })
      .catch(() => setAvailableSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, [classId]);

  const subjectOptions = availableSubjects.map((s) => ({
    value: s.subjectId,
    label: s.subjectName,
    subtitle: `${s.subjectCode} • ${s.teacher}`,
    ...s,
  }));

  const getSelectedSubjects = () =>
    availableSubjects.filter((s) => form.subjectIds.includes(s.subjectId));

  const updateEntries = (next) => {
    setEntries(next);
    onTimetableChange && onTimetableChange(next);
  };

  const handleAddOrEdit = () => {
    if (!form.day || form.subjectIds.length === 0 || !form.start || !form.end) return;

    const selected = getSelectedSubjects();
    const streamIds = [...new Set(selected.map((s) => s.stream))];
    let primaryStream, streamColor, streamName;

    if (streamIds.length === 1) {
      primaryStream = streamIds[0];
      const st = streams.find((s) => s.id === primaryStream);
      streamColor = st?.color || "#6b7280";
      streamName = st?.name || "General";
    } else {
      primaryStream = "mixed";
      streamColor = "#6b7280";
      streamName = "Mixed Streams";
    }

    const entryData = {
      day: form.day,
      start: form.start,
      end: form.end,
      subjects: selected.map((s) => {
        const st = streams.find((x) => x.id === s.stream);
        return {
          id: s.subjectId,
          name: s.subjectName,
          code: s.subjectCode,
          teacher: s.teacher,
          stream: s.stream,
          streamName: st?.name || "General",
          displayName: `${s.subjectName} (${st?.name || "General"})`,
        };
      }),
      stream: primaryStream,
      streamName,
      streamColor,
      name:
        selected.length === 1
          ? `${selected[0].subjectName} (${streams.find((s) => s.id === selected[0].stream)?.name || "General"})`
          : `${selected.length} Subjects`,
      teacher: selected.length === 1 ? selected[0].teacher : "Multiple Teachers",
    };

    if (editingId) {
      updateEntries(entries.map((e) => (e.id === editingId ? { ...e, ...entryData } : e)));
      setEditingId(null);
    } else {
      updateEntries([{ id: Date.now(), ...entryData }, ...entries]);
    }

    setForm({ day: "", subjectIds: [], start: "", end: "" });
  };

  const handleDelete = (id) => updateEntries(entries.filter((e) => e.id !== id));

  const handleEdit = (item) => {
    setForm({
      day: item.day,
      subjectIds: item.subjects ? item.subjects.map((s) => s.id) : [],
      start: item.start,
      end: item.end,
    });
    setEditingId(item.id);
  };

  const handleSubjectToggle = (val) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(val)
        ? prev.subjectIds.filter((id) => id !== val)
        : [...prev.subjectIds, val],
    }));
  };

  const removeSubject = (id) =>
    setForm((prev) => ({ ...prev, subjectIds: prev.subjectIds.filter((x) => x !== id) }));

  const [breakForm, setBreakForm] = useState({ day: "", name: "Break", start: "", end: "" });
  const [formTab, setFormTab] = useState("subject"); // "subject" | "break"

  const handleAddBreak = () => {
    if (!breakForm.day || !breakForm.name || !breakForm.start || !breakForm.end) return;
    updateEntries([{
      id: Date.now(),
      day: breakForm.day,
      start: breakForm.start,
      end: breakForm.end,
      name: breakForm.name,
      teacher: "",
      stream: "general",
      streamName: "Break",
      streamColor: "#9ca3af",
      subjects: [],
      isBreak: true,
    }, ...entries]);
    setBreakForm({ day: "", name: "Break", start: "", end: "" });
  };

  const isBreakFormComplete = breakForm.day && breakForm.name && breakForm.start && breakForm.end;
  const isFormComplete = form.day && form.subjectIds.length > 0 && form.start && form.end;

  return (
    <div className="timetable-editor">
      <div className="te-header">
        <span className="te-header-deco" aria-hidden="true" />
        <span className="te-header-deco2" aria-hidden="true" />
        <div className="te-header-content">
          <div className="te-header-icon"><IcoCal /></div>
          <div>
            <h2 className="te-title">Edit Timetable</h2>
            <p className="te-subtitle">Manage schedule entries for {className}</p>
          </div>
        </div>
      </div>

      <div className="te-content">
        {/* Form tabs */}
        <div className="te-tabs">
          {["subject", "break"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFormTab(tab)}
              className={`te-tab${formTab === tab ? " active" : ""}`}
            >
              {tab === "subject" ? "Add Subject" : "Add Break"}
            </button>
          ))}
        </div>

        {/* Subject form */}
        {formTab === "subject" && (
        <div className="te-form">

          <div className="te-field te-full">
            <label className="te-field-label">Day</label>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="te-select">
              <option value="">Select day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="te-field te-full">
            <label className="te-field-label">Subject</label>
            {loadingSubjects ? (
              <LoadingData message="Loading subjects..." />
            ) : (
              <SearchableSelect
                placeholder="Search and select subjects..."
                options={subjectOptions}
                value=""
                onChange={handleSubjectToggle}
                displayKey="label"
                valueKey="value"
                searchKeys={["label", "subjectCode", "teacher"]}
                maxDisplayItems={6}
              />
            )}
            {form.subjectIds.length > 0 && (
              <div className="te-subjects-list">
                {form.subjectIds.map((sid) => {
                  const s = availableSubjects.find((x) => x.subjectId === sid);
                  return (
                    <div key={sid} className="te-subject-tag">
                      <span>{s?.subjectName || sid}</span>
                      <button type="button" onClick={() => removeSubject(sid)} className="te-remove-subject">
                        <IcoX />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="te-field">
            <label className="te-field-label">Start Time</label>
            <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="te-input" />
          </div>

          <div className="te-field">
            <label className="te-field-label">End Time</label>
            <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="te-input" />
          </div>

          <button onClick={handleAddOrEdit} disabled={!isFormComplete}
            className={`te-add-btn te-full${!isFormComplete ? " disabled" : ""}`}>
            {editingId ? <><IcoEdit /> Update Entry</> : <><IcoPlus /> Add to Timetable</>}
          </button>

        </div>
        )}

        {/* Break form */}
        {formTab === "break" && (
        <div className="te-form">

          <div className="te-field te-full">
            <label className="te-field-label">Day</label>
            <select value={breakForm.day} onChange={(e) => setBreakForm({ ...breakForm, day: e.target.value })} className="te-select">
              <option value="">Select day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="te-field te-full">
            <label className="te-field-label">Break Name</label>
            <input type="text" value={breakForm.name} onChange={(e) => setBreakForm({ ...breakForm, name: e.target.value })}
              placeholder="e.g. Lunch, Short Break" className="te-input" />
          </div>

          <div className="te-field">
            <label className="te-field-label">Start Time</label>
            <input type="time" value={breakForm.start} onChange={(e) => setBreakForm({ ...breakForm, start: e.target.value })} className="te-input" />
          </div>

          <div className="te-field">
            <label className="te-field-label">End Time</label>
            <input type="time" value={breakForm.end} onChange={(e) => setBreakForm({ ...breakForm, end: e.target.value })} className="te-input" />
          </div>

          <button onClick={handleAddBreak} disabled={!isBreakFormComplete}
            className={`te-add-btn te-full${!isBreakFormComplete ? " disabled" : ""}`}>
            <IcoPlus /> Add Break
          </button>

        </div>
        )}

        {/* Entries list */}
        <div className="te-entries">
          <h3 className="te-entries-title">Schedule Entries ({entries.length})</h3>
          <div className="te-entries-list">
            {entries.length === 0 ? (
              <div className="te-empty-entries">
                <div className="te-empty-icon"><IcoCal /></div>
                <p>No entries yet.</p>
              </div>
            ) : (
              entries.map((item) => (
                <div key={item.id} className="te-entry-item">
                  <div className="te-entry-content">
                    <div className="te-entry-day">{item.day}</div>
                    <div className="te-entry-details">
                      <div className="te-entry-subjects">
                        {item.subjects && item.subjects.length > 1 ? (
                          <span>
                            {item.subjects.length} Subjects:{" "}
                            {item.subjects.map((s, i) => (
                              <span key={s.id}>
                                {s.name}{i < item.subjects.length - 1 && ", "}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span>{item.name}</span>
                        )}
                      </div>
                      <div className="te-entry-stream" style={{ color: item.streamColor }}>
                        {item.streamName}
                      </div>
                    </div>
                    <div className="te-entry-time">{item.start} – {item.end}</div>
                  </div>
                  <div className="te-entry-actions">
                    <button onClick={() => handleEdit(item)} className="te-edit-btn" title="Edit">
                      <IcoEdit />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="te-delete-btn" title="Delete">
                      <IcoTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="te-actions">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <button className="te-ai-btn" onClick={() => setAiPanelOpen(true)}>
          <IcoAI /> AI Generate
        </button>
        <Button variant="primary" onClick={() => onSave(entries)} disabled={saving}>
          {saving ? "Saving..." : "Save Timetable"}
        </Button>
      </div>

      {/* AI Generate Panel */}
      <SlideInMenu isShow={aiPanelOpen} onClose={() => setAiPanelOpen(false)} width="460px">
        <div className="te-ai-panel">

          <div className="te-ai-panel-header">
            <span className="te-ai-panel-deco" aria-hidden="true" />
            <span className="te-ai-panel-deco2" aria-hidden="true" />
            <div className="te-ai-panel-header-content">
              <div className="te-ai-panel-icon"><IcoAI /></div>
              <div className="te-ai-panel-header-text">
                <h3>AI Generate — {className}</h3>
                <p>Generate a timetable for this class only</p>
              </div>
            </div>
          </div>

          <div className="te-ai-panel-body">
            <div className="te-ai-field">
              <label>Timetable Template *</label>
              {templatesLoading ? (
                <p className="te-ai-hint">Loading...</p>
              ) : templates.length === 0 ? (
                <p className="te-ai-warn">No templates found.</p>
              ) : (
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="te-ai-select">
                  <option value="">— Select a template —</option>
                  {templates.map((t) => (
                    <option key={t.template_id || t.id} value={t.template_id || t.id}>
                      {t.name} {t.status ? `(${t.status})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedTemplateId && (() => {
              const tmpl = templates.find((t) => (t.template_id || t.id) === selectedTemplateId);
              if (!tmpl) return null;
              const tmplDays = parseField(tmpl.selected_days) || [];
              const periods  = parseField(tmpl.daily_periods) || {};
              const bks      = parseField(tmpl.breaks) || [];
              return (
                <div className="te-template-preview">
                  <p className="te-template-preview-title">Template Details</p>
                  <p className="te-template-row"><b>Days:</b> {Array.isArray(tmplDays) ? tmplDays.map((d) => d.slice(0, 3)).join(", ") : "—"}</p>
                  <p className="te-template-row"><b>Max period:</b> {tmpl.max_period_duration} min</p>
                  <div className="te-period-pills">
                    {Object.entries(periods).filter(([, v]) => v > 0).map(([d, c]) => (
                      <span key={d} className="te-period-pill">{d.slice(0, 3)}: {c}</span>
                    ))}
                  </div>
                  {bks.map((b, i) => <p key={i} className="te-break-item">{b.name} — {b.duration} min after period {b.after_period}</p>)}
                </div>
              );
            })()}

            <div className="te-ai-field">
              <label>Notes / Instructions</label>
              <textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)} rows={3}
                placeholder="e.g. Science stream in the morning, avoid double periods on Fridays..."
                className="te-ai-textarea" />
            </div>

            <div className="te-ai-info">
              <IcoAI />
              <p>Other class timetables will be passed to the AI to prevent subject and teacher conflicts.</p>
            </div>
          </div>

          <div className="te-ai-panel-footer">
            <Button variant="secondary" onClick={() => setAiPanelOpen(false)} disabled={generating}>Cancel</Button>
            <button className="te-ai-generate-btn" onClick={handleAIGenerate} disabled={generating || !selectedTemplateId}>
              <IcoAI /> {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default TimetableEditor;
