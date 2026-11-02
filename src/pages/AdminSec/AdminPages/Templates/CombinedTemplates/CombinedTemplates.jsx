import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useCombinedTemplate } from "../../../../../api_call/useCombinedTemplate";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { generateDefaultReportHtml } from "../../../../../utils/generateDefaultReportHtml";
import { FaPlus } from "react-icons/fa";

const EMPTY_FORM = {
  name: "",
  description: "",
  gradingFields: [{ fieldName: "", weight: 0, maxScore: "" }],
  gradingScheme: [{ gradeLetter: "", minRange: "", maxRange: "", gradePoint: "", passFail: "Pass" }],
  totalWeight: 0,
  behavioralTraits: [],
};

const formatCardDate = (v) => {
  if (!v) return "â€”";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const CombinedTemplates = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { createTemplate, getTemplatesBySchool, updateTemplate, deleteTemplate, duplicateTemplate, updateTemplateStatus } = useCombinedTemplate();

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

  // How much of 0â€“100% the grade ranges cover (overlaps counted once), and what is left uncovered.
  const schemeCoverage = (() => {
    const covered = new Array(101).fill(false);
    formData.gradingScheme.forEach((s) => {
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
      else if (start !== null) { gaps.push(start === p - 1 ? `${start}%` : `${start}â€“${p - 1}%`); start = null; }
    }
    const percent = Math.round((covered.filter(Boolean).length / 101) * 100);
    return { percent, gaps, full: gaps.length === 0 };
  })();
  const isSchemeValid = schemeCoverage.full && overlaps.length === 0;

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
    navigate(`/admin/${schoolId}/templates/editor/new`);
  };

  const openEdit = (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit templates.", "error");
      return;
    }
    navigate(`/admin/${schoolId}/templates/editor/${template.template_id}`);
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
        // Update â€” keep existing html_template / html_template_draft from the visual editor
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
        // Create â€” seed with default report HTML
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
          // Update â€” just close and refresh
          addNotification("Template updated", "success");
          setIsCreateMenuOpen(false);
          fetchTemplates();
        } else {
          // Create â€” navigate straight to edit page
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
    if (result.success) { addNotification("Template deleted", "success"); fetchTemplates(); }
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
    if (result.success) { addNotification(`Template ${newStatus}`, "success"); fetchTemplates(); }
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
                <div key={t.template_id} className="template-card ct-tcard" onClick={() => navigate(`/admin/${schoolId}/templates/detail/${t.template_id}`)}>
                  <div className="ct-tcard-top">
                    <h4 className="ct-tcard-title" title={t.name}>{t.name}</h4>
                    <span className={`ct-tcard-status ${t.status}`}><i />{t.status}</span>
                  </div>
                  {t.description
                    ? <p className="ct-tcard-desc">{t.description}</p>
                    : <p className="ct-tcard-desc is-empty">No description</p>}
                  <div className="ct-tcard-stats">
                    <div className="ct-tcard-stat"><b>{(t.grading_fields || []).length}</b><span>Fields</span></div>
                    <div className="ct-tcard-stat"><b>{(t.grading_scheme || []).length}</b><span>Grades</span></div>
                    <div className="ct-tcard-stat"><b>{(t.class_overrides || []).length}</b><span>Class setups</span></div>
                  </div>
                  <div className="ct-tcard-foot">
                    {t.level ? <span className="ct-tcard-level">{t.level}</span> : <span />}
                    <span className="ct-tcard-date" title={t.created_by ? `Created by ${t.created_by}` : undefined}>Modified {formatCardDate(t.last_modified)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </InnerTabCon>
  );
};

export default CombinedTemplates;

