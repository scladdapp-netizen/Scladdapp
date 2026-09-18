import { useEffect, useState } from "react";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import {
  fetchApplicationFormConfig,
  saveApplicationFormConfig,
} from "../../../../../api_call/useApplicationForm";
import "./SchoolData.css";
import "./ApplicationFormFieldsPanel.css";

const LOCKED_FIELD_IDS = new Set(["email"]);

export default function ApplicationFormFieldsPanel({ schoolId, open, onClose, isActive = true }) {
  const [sections, setSections] = useState([]);
  const [enabled, setEnabled] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !schoolId) return;
    setLoading(true);
    setError(null);
    fetchApplicationFormConfig(schoolId)
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load settings");
        setSections(res.data.sections || []);
        const next = new Set(res.data.enabled_fields || []);
        LOCKED_FIELD_IDS.forEach((id) => next.add(id));
        setEnabled(next);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, schoolId]);

  const toggleField = (fieldId) => {
    if (LOCKED_FIELD_IDS.has(fieldId)) return;
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      LOCKED_FIELD_IDS.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleSection = (section) => {
    const ids = section.fields.map((f) => f.id);
    const toggleable = ids.filter((id) => !LOCKED_FIELD_IDS.has(id));
    if (!toggleable.length) return;
    const allOn = toggleable.every((id) => enabled.has(id));
    setEnabled((prev) => {
      const next = new Set(prev);
      toggleable.forEach((id) => {
        if (allOn) next.delete(id);
        else next.add(id);
      });
      LOCKED_FIELD_IDS.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleSave = async () => {
    const payload = new Set(enabled);
    LOCKED_FIELD_IDS.forEach((id) => payload.add(id));
    if (payload.size === 0) {
      setError("Select at least one field.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await saveApplicationFormConfig(schoolId, {
        enabled_fields: [...payload],
        is_active: isActive,
      });
      if (!res.success) throw new Error(res.message || "Failed to save");
      onClose(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlideInMenu isShow={open} onClose={() => onClose(false)} width="520px">
      <div className="affp-panel sd-panel">
        <div className="sd-panel-header">
          <span className="sd-panel-deco" aria-hidden="true" />
          <div className="sd-panel-header-content">
            <div className="sd-panel-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
            <div className="sd-panel-header-text">
              <h2>Configure Application Form</h2>
              <p>Choose which fields parents see on the public form</p>
            </div>
          </div>
        </div>

        <div className="sd-panel-body affp-body">
          {error && <div className="affp-error">{error}</div>}
          {loading ? (
            <div className="affp-loading">
              <div className="affp-spinner" />
              <span>Loading fields…</span>
            </div>
          ) : (
            sections.map((section) => {
              const sectionIds = section.fields.map((f) => f.id);
              const toggleable = sectionIds.filter((id) => !LOCKED_FIELD_IDS.has(id));
              const allOn = toggleable.length > 0 && toggleable.every((id) => enabled.has(id));
              const someOn = sectionIds.some((id) => enabled.has(id));
              const countOn = sectionIds.filter((id) => enabled.has(id)).length;

              return (
                <div key={section.id} className="affp-section">
                  <div className="affp-section-head">
                    <div>
                      <h4>{section.title}</h4>
                      <span className="affp-section-count">{countOn}/{sectionIds.length} selected</span>
                    </div>
                    {toggleable.length > 0 && (
                      <button type="button" className="affp-section-toggle" onClick={() => toggleSection(section)}>
                        {allOn ? "Deselect all" : "Select all"}
                      </button>
                    )}
                  </div>

                  <div className={`affp-fields${someOn && !allOn ? " affp-fields--partial" : ""}`}>
                    {section.fields.map((field) => {
                      const locked = field.locked || LOCKED_FIELD_IDS.has(field.id);
                      const isOn = enabled.has(field.id) || locked;
                      return (
                        <label
                          key={field.id}
                          className={`affp-field${isOn ? " affp-field--on" : ""}${locked ? " affp-field--locked" : ""}`}
                          title={locked ? "Required — cannot be disabled" : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={isOn}
                            disabled={locked}
                            onChange={() => toggleField(field.id)}
                          />
                          <span className="affp-field-check" aria-hidden="true" />
                          <span className="affp-field-content">
                            <strong>
                              {field.label}
                              {locked && <span className="affp-required-tag">Required</span>}
                            </strong>
                            <small>{field.type}</small>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="sd-panel-footer">
          <Button variant="secondary" onClick={() => onClose(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </SlideInMenu>
  );
}
