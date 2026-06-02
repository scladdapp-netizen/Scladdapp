import { useState, useEffect } from "react";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import FormInput from "../../../../components/FormInput";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import "./AddSubsessionPanel.css";
import { useCombinedTemplate } from "../../../../api_call/useCombinedTemplate";

const AddSubsessionPanel = ({
  isOpen,
  onClose,
  formData,
  formErrors,
  onInputChange,
  onSave,
  sessionName,
  isEditMode = false,
  schoolId,
}) => {
  const { getTemplatesBySchool } = useCombinedTemplate();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (isOpen && schoolId) {
      setLoadingTemplates(true);
      getTemplatesBySchool(schoolId)
        .then((result) => { if (result.success) setTemplates(result.data || []); })
        .finally(() => setLoadingTemplates(false));
    }
  }, [isOpen, schoolId]);

  const hasErrors = Object.keys(formErrors).length > 0;

  const isFormValid =
    formData.name &&
    formData.code &&
    formData.startDate &&
    formData.endDate &&
    !hasErrors &&
    (isEditMode || formData.gradingTemplateId);

  const selectedTemplate = formData.gradingTemplateId
    ? templates.find((t) => t.template_id === formData.gradingTemplateId)
    : null;

  return (
    <SlideInMenu isShow={isOpen} onClose={onClose} width="550px">
      <div className="asp-container">

        {/* ── Header ── */}
        <div className="asp-header">
          <span className="asp-header-deco" aria-hidden="true" />
          <span className="asp-header-deco2" aria-hidden="true" />
          <div className="asp-header-content">
            <h2 className="asp-header-title">
              {isEditMode ? "Edit Subsession" : "Add New Subsession"}
            </h2>
            <p className="asp-header-sub">
              {isEditMode
                ? "Update subsession details and dates"
                : "Create a new term for this academic session"}
            </p>
            {sessionName && (
              <div className="asp-session-pill">
                <svg width="11" height="11" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                  <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                Session: <span>{sessionName}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Warning bar (add mode only) ── */}
        {!isEditMode && (
          <div className="asp-warning">
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <path d="M11 3l8.5 15H2.5L11 3z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M11 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="11" cy="16" r="1" fill="currentColor"/>
            </svg>
            Template is required and cannot be changed later. Choose carefully.
          </div>
        )}

        {/* ── Body (scrollable) ── */}
        <div className="asp-body">
          <FormInput
            label="Subsession Name *"
            type="text"
            value={formData.name}
            onChange={(v) => onInputChange("name", v)}
            placeholder="e.g., First Term"
          />
          <FormInput
            label="Subsession Code *"
            type="text"
            value={formData.code}
            onChange={(v) => onInputChange("code", v)}
            placeholder="e.g., T1"
          />
          <FormInput
            label="Start Date *"
            type="date"
            value={formData.startDate}
            onChange={(v) => onInputChange("startDate", v)}
          />
          <FormInput
            label="End Date *"
            type="date"
            value={formData.endDate}
            onChange={(v) => onInputChange("endDate", v)}
          />

          {/* Template section — add mode only */}
          {!isEditMode && (
            <div className="asp-template-section">
              <p className="asp-template-label">Grading Template *</p>
              <SearchableSelect
                placeholder={loadingTemplates ? "Loading templates…" : "Search and select a template…"}
                options={templates.map((t) => ({
                  value: t.template_id,
                  label: t.name,
                  subtitle: t.description,
                }))}
                value={formData.gradingTemplateId || ""}
                onChange={(value) => {
                  const selected = templates.find((t) => t.template_id === value);
                  onInputChange("gradingTemplateId", value || null);
                  onInputChange("gradingTemplateName", selected ? selected.name : null);
                }}
                displayKey="label"
                valueKey="value"
                searchKeys={["label", "subtitle"]}
                required
              />

              {selectedTemplate ? (
                <div className="asp-template-selected">
                  <span className="asp-template-selected-eyebrow">Selected Template</span>
                  <span className="asp-template-selected-name">{selectedTemplate.name}</span>
                  {selectedTemplate.description && (
                    <span className="asp-template-selected-desc">{selectedTemplate.description}</span>
                  )}
                </div>
              ) : (
                <div className="asp-template-empty">
                  <svg width="28" height="28" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.35 }}>
                    <rect x="3" y="3" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                    <path d="M7 7h8M7 11h5M7 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  <span>No template selected yet</span>
                </div>
              )}
            </div>
          )}

          {/* Validation errors */}
          {hasErrors && (
            <div className="asp-errors">
              {formErrors.startDate && (
                <div className="asp-error-msg">
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M11 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="11" cy="15.5" r="1" fill="currentColor"/>
                  </svg>
                  {formErrors.startDate}
                </div>
              )}
              {formErrors.endDate && (
                <div className="asp-error-msg">
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M11 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="11" cy="15.5" r="1" fill="currentColor"/>
                  </svg>
                  {formErrors.endDate}
                </div>
              )}
              {formErrors.overlap && (
                <div className="asp-error-msg">
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M11 7v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="11" cy="15.5" r="1" fill="currentColor"/>
                  </svg>
                  {formErrors.overlap}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer (fixed) ── */}
        <div className="asp-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={!isFormValid}>
            {isEditMode ? "Save Changes" : "Create Subsession"}
          </Button>
        </div>

      </div>
    </SlideInMenu>
  );
};

export default AddSubsessionPanel;
