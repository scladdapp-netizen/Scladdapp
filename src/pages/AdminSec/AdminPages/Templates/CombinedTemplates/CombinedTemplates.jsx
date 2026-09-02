import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import ReportCardPreview from "../../../../../components/ReportCardPreview/ReportCardPreview";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useCombinedTemplate } from "../../../../../api_call/useCombinedTemplate";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { generateDefaultReportHtml } from "../../../../../utils/generateDefaultReportHtml";
import { hydrateReportHtml } from "../../../../../utils/hydrateReportHtml";
import {
  FaPlus, FaEdit, FaCopy, FaTrash, FaBan, FaCheckCircle, FaExclamationTriangle,
} from "react-icons/fa";

const EMPTY_FORM = {
  name: "",
  description: "",
  gradingFields: [{ fieldName: "", weight: 0, maxScore: "" }],
  gradingScheme: [{ gradeLetter: "", minRange: "", maxRange: "", gradePoint: "", passFail: "Pass" }],
  totalWeight: 0,
  behavioralTraits: [],
};

const CombinedTemplates = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { createTemplate, getTemplatesBySchool, updateTemplate, deleteTemplate, duplicateTemplate, updateTemplateStatus, checkIsAssigned } = useCombinedTemplate();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.report_template?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.report_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.report_template?.delete;

  const [templates, setTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [traitInput, setTraitInput] = useState("");
  const [templateAssigned, setTemplateAssigned] = useState(false);

  useEffect(() => { fetchTemplates(); }, [schoolId]);

  const fetchTemplates = async () => {
    if (!schoolId) return;
    setDataLoading(true);
    try {
      const result = await getTemplatesBySchool(schoolId);
      setTemplates(result.success ? result.data : []);
      if (!result.success) addNotification(result.message || "Failed to fetch templates", "error");
    } catch {
      addNotification("Error fetching templates", "error");
      setTemplates([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Weight calculation
  useEffect(() => {
    const total = formData.gradingFields.reduce((s, f) => s + (parseInt(f.weight) || 0), 0);
    setFormData((prev) => ({ ...prev, totalWeight: total }));
  }, [formData.gradingFields]);

  const isWeightValid = formData.totalWeight === 100;

  const checkOverlaps = () => {
    const ranges = formData.gradingScheme
      .filter((s) => s.minRange !== "" && s.maxRange !== "")
      .map((s, i) => ({ i, min: parseInt(s.minRange), max: parseInt(s.maxRange), letter: s.gradeLetter }))
      .filter((r) => r.min <= r.max);
    const overlaps = [];
    for (let a = 0; a < ranges.length; a++)
      for (let b = a + 1; b < ranges.length; b++)
        if (ranges[a].min <= ranges[b].max && ranges[a].max >= ranges[b].min)
          overlaps.push(`${ranges[a].letter || "Grade " + (a + 1)} overlaps ${ranges[b].letter || "Grade " + (b + 1)}`);
    return overlaps;
  };
  const overlaps = checkOverlaps();

  const set = (field) => (value) => setFormData((p) => ({ ...p, [field]: value }));

  const setGradingField = (i, field, value) =>
    setFormData((p) => ({ ...p, gradingFields: p.gradingFields.map((f, idx) => idx === i ? { ...f, [field]: value } : f) }));

  const setScheme = (i, field, value) =>
    setFormData((p) => ({ ...p, gradingScheme: p.gradingScheme.map((s, idx) => idx === i ? { ...s, [field]: value } : s) }));

  const toggleTrait = (t) =>
    setFormData((p) => ({ ...p, behavioralTraits: p.behavioralTraits.includes(t) ? p.behavioralTraits.filter((x) => x !== t) : [...p.behavioralTraits, t] }));

  const addCustomTrait = () => {
    const val = traitInput.trim();
    if (!val) return;
    if (formData.behavioralTraits.includes(val)) return;
    setFormData((p) => ({ ...p, behavioralTraits: [...p.behavioralTraits, val] }));
    setTraitInput("");
  };

  const openCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create templates.", "error");
      return;
    }
    setSelectedTemplate(null);
    setFormData(EMPTY_FORM);
    setTraitInput("");
    setTemplateAssigned(false);
    setIsCreateMenuOpen(true);
  };

  const openEdit = async (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit templates.", "error");
      return;
    }
    setSelectedTemplate(template);
    const gf = template.grading_fields || [];
    const gs = template.grading_scheme || [];
    setFormData({
      name: template.name,
      description: template.description || "",
      gradingFields: gf.map((f) => ({ fieldName: f.field_name, weight: f.weight, maxScore: f.max_score || "" })),
      gradingScheme: gs.map((s) => ({ gradeLetter: s.grade_letter, minRange: s.min_range, maxRange: s.max_range, gradePoint: s.grade_point, passFail: s.pass_fail || "Pass" })),
      totalWeight: gf.reduce((sum, f) => sum + f.weight, 0),
      behavioralTraits: template.behavioral_traits || [],
    });
    setIsDetailMenuOpen(false);
    const result = await checkIsAssigned(template.template_id);
    setTemplateAssigned(result.assigned);
    setTraitInput("");
    setIsCreateMenuOpen(true);
  };

  const handleSubmit = async () => {
    if (!templateAssigned) {
      if (!formData.name.trim()) return addNotification("Template name is required", "error");
      if (!isWeightValid) return addNotification(`Total weight must be 100%. Current: ${formData.totalWeight}%`, "error");
    }

    setIsSubmitting(true);
    try {
      const gradingFields = formData.gradingFields.map((f) => ({ field_name: f.fieldName, weight: f.weight, max_score: f.maxScore || 0 }));
      const gradingScheme = formData.gradingScheme.map((s) => ({ grade_letter: s.gradeLetter, min_range: s.minRange, max_range: s.maxRange, grade_point: s.gradePoint, pass_fail: s.passFail }));
      const modifiedBy = user?.admin?.admin_id || user?.user_id;

      let payload;
      if (selectedTemplate) {
        // Update — keep existing html_template / html_template_draft from the visual editor
        payload = templateAssigned
          ? { modified_by: modifiedBy }
          : {
              name: formData.name,
              description: formData.description,
              grading_fields: gradingFields,
              grading_scheme: gradingScheme,
              behavioral_traits: formData.behavioralTraits,
              modified_by: modifiedBy,
            };
      } else {
        // Create — seed with default report HTML
        payload = {
          school_id: schoolId,
          name: formData.name,
          description: formData.description,
          grading_fields: gradingFields,
          grading_scheme: gradingScheme,
          behavioral_traits: formData.behavioralTraits,
          html_template: generateDefaultReportHtml({
            grading_fields: gradingFields,
            grading_scheme: gradingScheme,
            behavioral_traits: formData.behavioralTraits,
            school: user?.school || {},
          }),
          created_by: modifiedBy,
          modified_by: modifiedBy,
        };
      }

      const result = selectedTemplate
        ? await updateTemplate(selectedTemplate.template_id, payload)
        : await createTemplate(payload);

      if (result.success) {
        if (selectedTemplate) {
          // Update — just close and refresh
          addNotification("Template updated", "success");
          setIsCreateMenuOpen(false);
          fetchTemplates();
        } else {
          // Create — navigate straight to edit page
          addNotification("Template created", "success");
          setIsCreateMenuOpen(false);
          navigate(`/admin/${schoolId}/templates/edit/${result.data?.template_id || result.template_id}`);
        }
      } else {
        addNotification(result.message || "Failed to save template", "error");
      }
    } catch {
      addNotification("Error saving template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    if (!canCreate) {
      addNotification("You do not have permission to duplicate templates.", "error");
      return;
    }
    const result = await duplicateTemplate(template.template_id, user?.admin?.admin_id || user?.user_id);
    if (result.success) { addNotification("Template duplicated", "success"); fetchTemplates(); }
    else addNotification(result.message || "Failed to duplicate", "error");
  };

  const handleDelete = async (template) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete templates.", "error");
      return;
    }
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    const result = await deleteTemplate(template.template_id, user?.admin?.admin_id || user?.user_id);
    if (result.success) { addNotification("Template deleted", "success"); setIsDetailMenuOpen(false); fetchTemplates(); }
    else addNotification(result.message || "Failed to delete", "error");
  };

  const handleStatusToggle = async (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to change template status.", "error");
      return;
    }
    const newStatus = template.status === "active" ? "archived" : "active";
    if (!window.confirm(`${newStatus === "active" ? "Activate" : "Deactivate"} "${template.name}"?`)) return;
    const result = await updateTemplateStatus(template.template_id, newStatus, user?.admin?.admin_id || user?.user_id);
    if (result.success) { addNotification(`Template ${newStatus}`, "success"); setIsDetailMenuOpen(false); fetchTemplates(); }
    else addNotification(result.message || "Failed to update status", "error");
  };

  return (
    <InnerTabCon>
      <div className="templates-container">
        <div className="templates-header">
          <div className="templates-header-left">
            <h2>Grading Templates</h2>
            <p>Create and manage grading scales and report card layouts</p>
          </div>
          <div className="templates-actions">
            <Button onClick={openCreate}>
              <FaPlus size={14} style={{ marginRight: "8px" }} />
              Create Template
            </Button>
          </div>
        </div>

        <div className="template-section">
          <h3>Available Templates</h3>
          {dataLoading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <LoadingData message="Loading templates..." />
            </div>
          ) : templates.length === 0 ? (
            <div className="kk-template-empty-state">
              <p>No templates found</p>
              <Button onClick={openCreate}><FaPlus size={14} style={{ marginRight: "8px" }} />Create Template</Button>
            </div>
          ) : (
            <div className="template-grid">
              {templates.map((t) => (
                <div key={t.template_id} className="template-card" onClick={async () => { setSelectedTemplate(t); const r = await checkIsAssigned(t.template_id); setTemplateAssigned(r.assigned); setIsDetailMenuOpen(true); }} style={{ cursor: "pointer" }}>
                  <div className="template-card-header">
                    <h4 className="template-card-title">{t.name}</h4>
                    <span className={`template-card-status ${t.status}`}>{t.status}</span>
                  </div>
                  <p className="template-card-description">{t.description}</p>
                  <div className="template-details">
                    <div className="template-detail-item"><strong>Fields:</strong> {(t.grading_fields || []).length}</div>
                    <div className="template-detail-item"><strong>Grades:</strong> {(t.grading_scheme || []).length}</div>
                    <div className="template-detail-item"><strong>Level:</strong> {t.level}</div>
                    <div className="template-detail-item"><strong>Sections:</strong> {(t.sections || []).length}</div>
                  </div>
                  <div className="template-card-meta">
                    <span>Modified: {t.last_modified}</span>
                    <span>By: {t.created_by || "----"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create / Edit SlideInMenu */}
        <SlideInMenu isShow={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} width="820px">
          <div className="create-template-container">
            <div className="create-template-header">
              <h2>{selectedTemplate ? "Edit" : "Create"} Template</h2>
              <p>Define grading fields, scheme, and report card layout</p>
            </div>

            <div className="create-template-form">
              {templateAssigned && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", marginBottom: "8px" }}>
                  <FaExclamationTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5 }}>
                    This template is assigned to a subsession. Only the Theme and Primary Color can be edited. All other fields are locked and cannot be deleted.
                  </span>
                </div>
              )}
              {!selectedTemplate && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "#eff6ff", border: "1px solid #3b82f6", borderRadius: "8px", marginBottom: "8px" }}>
                  <FaExclamationTriangle size={16} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "#1e40af", lineHeight: 1.5 }}>
                    Make sure you enter the correct data before assigning this template to a subsession — once assigned, it cannot be edited or deleted.
                  </span>
                </div>
              )}
              <div style={{ position: "relative" }}>
                {templateAssigned && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "rgba(249,250,251,0.6)", cursor: "not-allowed" }} />
                )}
                <div style={templateAssigned ? { opacity: 0.5, pointerEvents: "none", userSelect: "none" } : {}}>
                <FormInput label="Template Name *" type="text" value={formData.name} onChange={set("name")} placeholder="e.g., Standard Template" />
                <FormInput label="Description" type="textarea" value={formData.description} onChange={set("description")} placeholder="Describe this template..." height="70px" />

                {/* ── Grading Fields ── */}
                <div className="grading-fields-section">
                  <div className="grading-fields-header">
                    <h3>Assessment Fields</h3>
                    <span className={`total-weight ${isWeightValid ? "valid" : "invalid"}`}>
                      Total: {formData.totalWeight}%
                      {!isWeightValid && <FaExclamationTriangle size={12} style={{ marginLeft: 4 }} />}
                    </span>
                    <Button variant="secondary" onClick={() => setFormData((p) => ({ ...p, gradingFields: [...p.gradingFields, { fieldName: "", weight: 0, maxScore: "" }] }))}>
                      <FaPlus size={12} /> Add Field
                    </Button>
                  </div>
                  {formData.gradingFields.map((f, i) => (
                    <div key={i} className="grading-field-row">
                      <FormInput label="Field Name" type="text" value={f.fieldName} onChange={(v) => setGradingField(i, "fieldName", v)} placeholder="e.g., ft" />
                      <FormInput label="Weight (%)" type="number" value={f.weight} onChange={(v) => setGradingField(i, "weight", parseInt(v) || 0)} placeholder="20" />
                      <FormInput label="Max Score" type="number" value={f.maxScore} onChange={(v) => setGradingField(i, "maxScore", v)} placeholder="20" />
                      {formData.gradingFields.length > 1 && (
                        <button className="remove-field-btn" onClick={() => setFormData((p) => ({ ...p, gradingFields: p.gradingFields.filter((_, idx) => idx !== i) }))}>
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!isWeightValid && <div className="weight-warning"><FaExclamationTriangle size={14} /><span>Total weight must equal 100%</span></div>}
                </div>

                {/* ── Grading Scheme ── */}
                <div className="grading-scheme-section">
                  <div className="grading-scheme-header">
                    <h3>Grading Scheme</h3>
                    <Button variant="secondary" onClick={() => setFormData((p) => ({ ...p, gradingScheme: [...p.gradingScheme, { gradeLetter: "", minRange: "", maxRange: "", gradePoint: "", passFail: "Pass" }] }))}>
                      <FaPlus size={12} /> Add Grade
                    </Button>
                  </div>
                  <div style={{ overflowX: "auto", width: "100%" }}>
                    <table className="scheme-edit-table">
                      <thead>
                        <tr>
                          <th>Grade</th>
                          <th>Min %</th>
                          <th>Max %</th>
                          <th>Points</th>
                          <th>Pass/Fail</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.gradingScheme.map((s, i) => (
                          <tr key={i}>
                            <td><FormInput type="text" value={s.gradeLetter} onChange={(v) => setScheme(i, "gradeLetter", v)} placeholder="A" /></td>
                            <td><FormInput type="number" value={s.minRange} onChange={(v) => setScheme(i, "minRange", v)} placeholder="80" /></td>
                            <td><FormInput type="number" value={s.maxRange} onChange={(v) => setScheme(i, "maxRange", v)} placeholder="100" /></td>
                            <td><FormInput type="number" value={s.gradePoint} onChange={(v) => setScheme(i, "gradePoint", v)} placeholder="4.0" /></td>
                            <td><FormInput type="select" value={s.passFail} onChange={(v) => setScheme(i, "passFail", v)} options={[{ value: "Pass", label: "Pass" }, { value: "Fail", label: "Fail" }]} /></td>
                            <td>
                              {formData.gradingScheme.length > 1 && (
                                <button className="remove-scheme-btn" onClick={() => setFormData((p) => ({ ...p, gradingScheme: p.gradingScheme.filter((_, idx) => idx !== i) }))}>
                                  <FaTrash size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {overlaps.length > 0 && <div className="range-warning"><FaExclamationTriangle size={14} /><span>{overlaps.join(", ")}</span></div>}
                </div>

                {/* ── Behavioral Traits ── */}
                <div className="behavioral-traits-section" style={{ marginTop: "16px" }}>
                  <h3>Behavioral Traits</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                    {["Neatness","Punctuality","Politeness","Honesty","Leadership","Cooperation","Attentiveness","Initiative","Self-Control","Respect for Others","Responsibility","Perseverance","Creativity","Problem Solving","Time Management","Teamwork"].map((t) => {
                      const selected = formData.behavioralTraits.includes(t);
                      return (
                        <button key={t} onClick={() => toggleTrait(t)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer", border: selected ? "1px solid #3b82f6" : "1px solid #d1d5db", background: selected ? "#eff6ff" : "#f9fafb", color: selected ? "#1d4ed8" : "#374151", fontWeight: selected ? 600 : 400 }}>
                          {selected ? "✓ " : "+ "}{t}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <input type="text" value={traitInput} onChange={(e) => setTraitInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomTrait()} placeholder="Or type a custom trait and press Add..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13 }} />
                    <Button variant="secondary" onClick={addCustomTrait}>Add</Button>
                  </div>
                  {formData.behavioralTraits.length > 0 && (
                    <div className="traits-grid">
                      {formData.behavioralTraits.map((t) => (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 13 }}>
                          <span style={{ flex: 1 }}>{t}</span>
                          <button onClick={() => toggleTrait(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", padding: 0, lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* ── Report Card Layout (Theme only — always editable) — removed ── */}
            </div>

            <div className="create-template-footer">
              <Button variant="secondary" onClick={() => setIsCreateMenuOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={(!templateAssigned && (!formData.name || !isWeightValid || overlaps.length > 0)) || isSubmitting}>
                {isSubmitting ? (selectedTemplate ? "Updating..." : "Creating...") : (selectedTemplate ? "Update Template" : "Create Template")}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Detail / View SlideInMenu */}
        <SlideInMenu isShow={isDetailMenuOpen} onClose={() => setIsDetailMenuOpen(false)} width="650px">
          {selectedTemplate && (() => {
            const gf = selectedTemplate.grading_fields || [];
            const gs = selectedTemplate.grading_scheme || [];
            return (
              <div className="template-detail-container">
                <div className="template-detail-header">
                  {templateAssigned && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", background: "#fef3c7", border: "1px solid #f59e0b", borderRadius: "8px", marginBottom: "12px" }}>
                      <FaExclamationTriangle size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "#92400e", lineHeight: 1.5 }}>
                        This template is assigned to a subsession. It cannot be deactivated or deleted.
                      </span>
                    </div>
                  )}
                  <div className="template-detail-title">
                    <h2>{selectedTemplate.name}</h2>
                    <span className={`template-card-status ${selectedTemplate.status}`}>{selectedTemplate.status}</span>
                  </div>
                  <p className="template-detail-description">{selectedTemplate.description}</p>
                  <div className="template-detail-meta">
                    <div className="template-meta-item"><strong>Modified:</strong> {selectedTemplate.last_modified}</div>
                    <div className="template-meta-item"><strong>Level:</strong> {selectedTemplate.level}</div>
                    <div className="template-meta-item"><strong>Layout:</strong> {selectedTemplate.layout}</div>
                    <div className="template-meta-item"><strong>Grade Display:</strong> {selectedTemplate.grade_display}</div>
                  </div>
                </div>

                <div className="template-detail-content">
                  {/* Assessment Fields */}
                  <div className="detail-section">
                    <h3>Assessment Fields ({gf.length})</h3>
                    <div className="assessment-fields-table">
                      <div className="fields-table-header"><span>Field</span><span>Weight</span><span>Max Score</span></div>
                      {gf.map((f, i) => (
                        <div key={i} className="fields-table-row">
                          <span>{f.field_name}</span><span>{f.weight}%</span><span>{f.max_score || "N/A"}</span>
                        </div>
                      ))}
                      <div className="fields-table-footer">
                        <span><strong>Total</strong></span>
                        <span><strong>{gf.reduce((s, f) => s + f.weight, 0)}%</strong></span>
                        <span></span>
                      </div>
                    </div>
                  </div>

                  {/* Grading Scheme */}
                  <div className="detail-section">
                    <h3>Grading Scheme ({gs.length} grades)</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table className="scheme-view-table">
                        <thead>
                          <tr>
                            <th>Grade</th>
                            <th>Min %</th>
                            <th>Max %</th>
                            <th>Points</th>
                            <th>Pass/Fail</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gs.map((s, i) => (
                            <tr key={i}>
                              <td>{s.grade_letter}</td>
                              <td>{s.min_range}%</td>
                              <td>{s.max_range}%</td>
                              <td>{s.grade_point}</td>
                              <td><span className={`pass-fail ${(s.pass_fail || "").toLowerCase()}`}>{s.pass_fail}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Report Card Info */}
                  {/* <div className="detail-section">
                    <h3>Report Card Settings</h3>
                    <div className="config-grid">
                      <div className="config-item"><strong>GPA:</strong> <span>{selectedTemplate.include_gpa ? "Yes" : "No"}</span></div>
                      <div className="config-item"><strong>Ranking:</strong> <span>{selectedTemplate.include_ranking ? "Yes" : "No"}</span></div>
                      <div className="config-item"><strong>Attendance:</strong> <span>{selectedTemplate.include_attendance ? "Yes" : "No"}</span></div>
                      <div className="config-item"><strong>Grade Display:</strong> <span>{selectedTemplate.grade_display}</span></div>
                      <div className="config-item"><strong>Level:</strong> <span>{selectedTemplate.level}</span></div>
                      <div className="config-item"><strong>Layout:</strong> <span>{selectedTemplate.layout}</span></div>
                    </div>
                  </div> */}


                  {/* Behavioral Traits */}
                  {(selectedTemplate.behavioral_traits || []).length > 0 && (
                    <div className="detail-section">
                      <h3>Behavioral Traits ({selectedTemplate.behavioral_traits.length})</h3>
                      <div className="behavioral-traits-overview">
                        {selectedTemplate.behavioral_traits.map((t, i) => (
                          <div key={i} className="trait-overview-item">
                            <span className="trait-number">{i + 1}</span>
                            <span className="trait-name">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview toggle */}
                  {/* <div className="detail-section">
                    ...
                  </div> */}

                  {/* Report Card Preview — always visible, renders saved html_template */}
                  <div className="detail-section" style={{ marginTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <h3 style={{ margin: 0 }}>Report Card Preview</h3>
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/admin/${schoolId}/templates/edit/${selectedTemplate.template_id}`)}
                      >
                        <FaEdit size={13} style={{ marginRight: 6 }} />
                        Edit Template
                      </Button>
                    </div>
                    {selectedTemplate.html_template
                      ? <div dangerouslySetInnerHTML={{ __html: hydrateReportHtml(selectedTemplate.html_template, selectedTemplate, user?.school || {}) }} />
                      : <ReportCardPreview template={selectedTemplate} school={user?.school} />
                    }
                  </div>
                </div>

                <div className="template-detail-actions">
                  <Button variant="secondary" onClick={() => openEdit(selectedTemplate)}><FaEdit size={14} style={{ marginRight: 8 }} />Edit</Button>
                  <Button variant="secondary" onClick={() => handleDuplicate(selectedTemplate)}><FaCopy size={14} style={{ marginRight: 8 }} />Duplicate</Button>
                  <Button variant={selectedTemplate.status === "active" ? "warning" : "success"} onClick={() => handleStatusToggle(selectedTemplate)} disabled={templateAssigned}>
                    {selectedTemplate.status === "active"
                      ? <><FaBan size={14} style={{ marginRight: 8 }} />Deactivate</>
                      : <><FaCheckCircle size={14} style={{ marginRight: 8 }} />Activate</>}
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(selectedTemplate)} disabled={templateAssigned}><FaTrash size={14} style={{ marginRight: 8 }} />Delete</Button>
                </div>
              </div>
            );
          })()}
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default CombinedTemplates;

