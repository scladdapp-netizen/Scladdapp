import React, { useState, useEffect } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useTeacherInfo } from "../../../../../api_call";
import { useParams } from "react-router-dom";

/* ── Inline SVG icon ──────────────────────────────────────────────────────── */
const IcoClass = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="3" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M2 8h18" stroke="currentColor" strokeWidth="1.4" opacity="0.5"/>
    <path d="M7 12h8M7 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const AddClassPanel = ({
  isShow,
  onClose,
  formData,
  onFormChange,
  onSubmit,
  loading = false,
  isEditMode = false,
}) => {
  const { schoolId } = useParams();
  const { getTeachersBySchoolId } = useTeacherInfo();

  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  useEffect(() => {
    if (isShow && schoolId && !isEditMode) fetchTeachers();
  }, [isShow, schoolId, isEditMode]);

  const fetchTeachers = async () => {
    setLoadingTeachers(true);
    try {
      const result = await getTeachersBySchoolId(schoolId);
      if (result.success && result.data) {
        setTeachers(
          result.data
            .filter((t) => t.is_active === true && t.staff)
            .map((t) => ({
              value: t.teacher_id,
              label: `${t.staff.full_name} (${t.teacher_code})`,
              email: t.staff.email,
            }))
        );
      }
    } catch (e) {
      console.error("Error fetching teachers:", e);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const isFormValid = formData.className && formData.classCode && formData.classSection && formData.classType;

  return (
    <SlideInMenu isShow={isShow} onClose={onClose} width="600px">
      <div className="acp-container">

        {/* ── Header ── */}
        <div className="acp-header">
          <span className="acp-header-deco"  aria-hidden="true" />
          <span className="acp-header-deco2" aria-hidden="true" />
          <div className="acp-header-content">
            <div className="acp-header-icon"><IcoClass /></div>
            <div className="acp-header-text">
              <h2>{isEditMode ? "Edit Class" : "Add New Class"}</h2>
              <p>{isEditMode ? "Update class information" : "Create a new class with basic information"}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="acp-body">
          {loadingTeachers && !isEditMode ? (
            <div className="acp-loading"><LoadingData /></div>
          ) : (
            <>
              <div className="acp-section-title">Class Information</div>

              <div className="acp-form">
                <div className="acp-form-row">
                  <FormInput label="Class Name *" type="text" value={formData.className}
                    onChange={onFormChange("className")} placeholder="e.g., Grade 10 Science" disabled={loading} />
                  <FormInput label="Class Code *" type="text" value={formData.classCode}
                    onChange={onFormChange("classCode")} placeholder="e.g., G10-SCI-A" disabled={loading} />
                </div>

                <div className="acp-form-row">
                  <FormInput label="Class Section *" type="select" value={formData.classSection}
                    onChange={onFormChange("classSection")} disabled={loading}
                    options={[
                      { value: "A", label: "Section A" },
                      { value: "B", label: "Section B" },
                      { value: "C", label: "Section C" },
                      { value: "D", label: "Section D" },
                      { value: "E", label: "Section E" },
                    ]}
                  />
                  <FormInput label="Class Type *" type="select" value={formData.classType}
                    onChange={onFormChange("classType")} disabled={loading}
                    options={[
                      { value: "Regular", label: "Regular" },
                      { value: "Advanced", label: "Advanced" },
                      { value: "Honors", label: "Honors" },
                      { value: "Remedial", label: "Remedial" },
                      { value: "Special", label: "Special" },
                    ]}
                  />
                </div>

                <FormInput label="Room Number" type="text" value={formData.roomNumber}
                  onChange={onFormChange("roomNumber")} placeholder="e.g., Room 101" disabled={loading} />

                {!isEditMode && (
                  <div className="acp-teacher-field">
                    <div className="acp-teacher-label">Class Teacher (Headmaster)</div>
                    <SearchableSelect
                      options={teachers}
                      value={formData.teacherId}
                      onChange={onFormChange("teacherId")}
                      placeholder="Search and select a teacher..."
                      disabled={loading}
                    />
                    <p className="acp-teacher-hint">Optional: Assign a teacher as the class headmaster</p>

                    {formData.teacherId && (() => {
                      const t = teachers.find(t => t.value === formData.teacherId);
                      if (!t) return null;
                      return (
                        <div className="acp-teacher-card">
                          <div className="acp-teacher-avatar">
                            {t.label.charAt(0).toUpperCase()}
                          </div>
                          <div className="acp-teacher-info">
                            <span className="acp-teacher-name">{t.label.split(" (")[0]}</span>
                            <span className="acp-teacher-meta">{t.label.match(/\(([^)]+)\)/)?.[1]} · {t.email}</span>
                          </div>
                          <span className="acp-teacher-role-badge">Headmaster</span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="acp-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmit} disabled={loading || !isFormValid}>
            {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Class" : "Create Class")}
          </Button>
        </div>

      </div>
    </SlideInMenu>
  );
};

export default AddClassPanel;
