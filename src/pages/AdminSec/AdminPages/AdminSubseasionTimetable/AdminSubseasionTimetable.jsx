import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Timetable from "../../../../components/timetable/Timetable";
import TimetableEditor from "../classProfile/ClassTimetable/TimetableEditor";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import useSubsessionTimetable from "../../../../api_call/useSubsessionTimetable";
import useAITimetable from "../../../../api_call/useAITimetable";
import { useTimetableTemplate } from "../../../../api_call";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import "./AdminSubseasionTimetable.css";

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const IcoAI = () => (
  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <circle cx="11" cy="11" r="2" fill="currentColor" opacity="0.3"/>
  </svg>
);
const IcoCal = () => (
  <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const AdminSubseasionTimetable = () => {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const pathParts = window.location.pathname.split("/");
  const subsessionId = pathParts[pathParts.length - 1];

  const { classes, timetables, loading, saving, error, saveTimetable, refetch } =
    useSubsessionTimetable(schoolId, subsessionId);

  const { generating, generate } = useAITimetable();
  const { getTimetableTemplatesBySchool } = useTimetableTemplate();

  const [editorOpen, setEditorOpen]               = useState(false);
  const [activeClass, setActiveClass]             = useState(null);
  const [editorEntries, setEditorEntries]         = useState([]);
  const [aiPanelOpen, setAiPanelOpen]             = useState(false);
  const [templates, setTemplates]                 = useState([]);
  const [templatesLoading, setTemplatesLoading]   = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [aiNotes, setAiNotes]                     = useState("");

  useEffect(() => {
    if (!aiPanelOpen || !schoolId) return;
    setTemplatesLoading(true);
    getTimetableTemplatesBySchool(schoolId)
      .then((res) => { if (res.success) setTemplates(res.data || []); })
      .finally(() => setTemplatesLoading(false));
  }, [aiPanelOpen, schoolId]);

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const openEditor = (cls) => {
    if (!canEdit) { addNotification("No permission to edit timetables.", "error"); return; }
    setActiveClass(cls);
    setEditorEntries(timetables[cls.class_id] || []);
    setEditorOpen(true);
  };

  const handleSave = async (entries) => {
    if (!activeClass) return;
    const ok = await saveTimetable(activeClass.class_id, entries, user?.admin?.admin_id || user?.user_id);
    if (ok) {
      addNotification(`Timetable saved for ${activeClass.class_name}`, "success");
      setEditorOpen(false);
    } else {
      addNotification("Failed to save timetable", "error");
    }
  };

  const handleAIGenerate = async () => {
    const result = await generate({
      templateId: selectedTemplateId, schoolId, subsessionId,
      notes: aiNotes, generatedBy: user?.admin?.admin_id || user?.user_id,
    });
    if (result.success) {
      addNotification(result.message || "Timetables generated successfully!", "success");
      setAiPanelOpen(false);
      refetch();
    } else {
      addNotification(result.message || "AI generation failed.", "error");
    }
  };

  const parseField = (val) => {
    if (!val) return null;
    if (typeof val === "object") return val;
    try { return JSON.parse(val); } catch { return null; }
  };

  const selectedTemplate = templates.find((t) => (t.template_id || t.id) === selectedTemplateId);

  if (loading) return <LoadingData message="Loading timetables..." />;
  if (error)   return <div className="ast-error">{error}</div>;

  return (
    <div className="ast-container">
      <InnerTabCon>
        {/* ── Header ── */}
        <div className="ast-header">
          <div className="ast-header-row">
            <div>
              <h2>Subsession Timetables</h2>
              <p>{classes.length} class{classes.length !== 1 ? "es" : ""} in this subsession</p>
            </div>
            <button className="ast-ai-btn" onClick={() => setAiPanelOpen(true)}>
              <IcoAI /> AI Generate All Timetables
            </button>
          </div>
        </div>

        {/* ── Class cards ── */}
        <div className="ast-grid">
          {classes.map((cls) => {
            const entries = timetables[cls.class_id] || [];
            const hasTimetable = entries.length > 0;
            return (
              <div key={cls.class_id} className="ast-card">
                <div className="ast-card-header">
                  <div className="ast-card-info">
                    <h3 className="ast-class-name">{cls.class_name}</h3>
                    <span className="ast-class-code">{cls.class_code}</span>
                  </div>
                  <div className="ast-card-actions">
                    {hasTimetable ? (
                      <button className="ast-card-btn ast-card-btn-edit" onClick={() => openEditor(cls)}>
                        <IcoEdit /> Edit
                      </button>
                    ) : (
                      <button className="ast-card-btn ast-card-btn-create" onClick={() => openEditor(cls)}>
                        <IcoPlus /> Create Timetable
                      </button>
                    )}
                  </div>
                </div>
                {hasTimetable ? (
                  <div className="ast-timetable-wrap">
                    <Timetable timetableData={entries} />
                  </div>
                ) : (
                  <div className="ast-empty">
                    <div className="ast-empty-icon"><IcoCal /></div>
                    <p className="ast-empty-text">No timetable yet for this class</p>
                    <p className="ast-empty-hint">Click "Create Timetable" to get started</p>
                  </div>
                )}
              </div>
            );
          })}

          {classes.length === 0 && (
            <div className="ast-no-classes">
              <div className="ast-no-classes-icon"><IcoCal /></div>
              <p>No classes found for this subsession.</p>
            </div>
          )}
        </div>
      </InnerTabCon>

      {/* ── Editor panel ── */}
      <SlideInMenu isShow={editorOpen} onClose={() => setEditorOpen(false)} width="680px">
        {activeClass && (
          <TimetableEditor
            timetableData={editorEntries}
            className={activeClass.class_name}
            classId={activeClass.class_id}
            schoolId={schoolId}
            subsessionId={subsessionId}
            onClose={() => setEditorOpen(false)}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </SlideInMenu>

      {/* ── AI Generate panel ── */}
      <SlideInMenu isShow={aiPanelOpen} onClose={() => setAiPanelOpen(false)} width="520px">
        <div className="ast-ai-container">

          <div className="ast-ai-header">
            <span className="ast-ai-deco" aria-hidden="true" />
            <span className="ast-ai-deco2" aria-hidden="true" />
            <div className="ast-ai-header-content">
              <div className="ast-ai-icon"><IcoAI /></div>
              <div className="ast-ai-header-text">
                <h2>AI Timetable Generator</h2>
                <p>Generate timetables for all classes automatically</p>
              </div>
            </div>
          </div>

          <div className="ast-ai-body">

            {/* Template selector */}
            <div className="ast-ai-field">
              <label>Timetable Template *</label>
              {templatesLoading ? (
                <p className="ast-ai-hint">Loading templates...</p>
              ) : templates.length === 0 ? (
                <p className="ast-ai-warn">No templates found. Create one in Templates → Timetable Templates.</p>
              ) : (
                <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="ast-ai-select">
                  <option value="">— Select a template —</option>
                  {templates.map((t) => (
                    <option key={t.template_id || t.id} value={t.template_id || t.id}>
                      {t.name} {t.status ? `(${t.status})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Template detail preview */}
            {selectedTemplate && (() => {
              const days    = parseField(selectedTemplate.selected_days) || [];
              const periods = parseField(selectedTemplate.daily_periods) || {};
              const breaks  = parseField(selectedTemplate.breaks) || [];
              return (
                <div className="ast-template-preview">
                  <p className="ast-template-preview-title">Template Details</p>
                  <div className="ast-template-grid">
                    <div className="ast-template-item">
                      <span className="ast-template-label">Name</span>
                      <span className="ast-template-value">{selectedTemplate.name}</span>
                    </div>
                    <div className="ast-template-item">
                      <span className="ast-template-label">Type</span>
                      <span className="ast-template-value" style={{ textTransform: "capitalize" }}>{selectedTemplate.type || "—"}</span>
                    </div>
                    <div className="ast-template-item">
                      <span className="ast-template-label">Max Period</span>
                      <span className="ast-template-value">{selectedTemplate.max_period_duration} min</span>
                    </div>
                    <div className="ast-template-item">
                      <span className="ast-template-label">School Days</span>
                      <span className="ast-template-value">
                        {Array.isArray(days) ? days.map((d) => d.slice(0, 3)).join(", ") : "—"}
                      </span>
                    </div>
                  </div>
                  {Object.keys(periods).length > 0 && (
                    <div className="ast-template-periods">
                      <span className="ast-template-label">Periods Per Day</span>
                      <div className="ast-period-pills">
                        {Object.entries(periods).filter(([, v]) => v > 0).map(([day, count]) => (
                          <span key={day} className="ast-period-pill">{day.slice(0, 3)}: {count}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(breaks) && breaks.length > 0 && (
                    <div className="ast-template-breaks">
                      <span className="ast-template-label">Breaks</span>
                      {breaks.map((b, i) => (
                        <p key={i} className="ast-break-item">{b.name} — {b.duration} min after period {b.after_period}</p>
                      ))}
                    </div>
                  )}
                  {selectedTemplate.description && (
                    <p className="ast-template-desc">{selectedTemplate.description}</p>
                  )}
                </div>
              );
            })()}

            {/* Notes */}
            <div className="ast-ai-field">
              <label>Additional Notes / Instructions</label>
              <textarea
                value={aiNotes}
                onChange={(e) => setAiNotes(e.target.value)}
                placeholder="e.g. Science classes should be in the morning, avoid double periods on Fridays..."
                rows={4}
                className="ast-ai-textarea"
              />
            </div>

            {/* Info banner */}
            <div className="ast-ai-info">
              <IcoAI />
              <p>The AI will generate timetables for all <strong>{classes.length}</strong> classes using the selected template and your instructions.</p>
            </div>
          </div>

          <div className="ast-ai-footer">
            <Button variant="secondary" onClick={() => setAiPanelOpen(false)} disabled={generating}>Cancel</Button>
            <button className="ast-ai-generate-btn" onClick={handleAIGenerate}
              disabled={generating || !selectedTemplateId}>
              <IcoAI /> {generating ? "Generating..." : "Generate Timetables"}
            </button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default AdminSubseasionTimetable;
