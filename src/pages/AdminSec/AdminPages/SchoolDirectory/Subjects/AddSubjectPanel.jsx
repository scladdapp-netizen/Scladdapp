import { useState, useEffect } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useTeacherInfo } from "../../../../../api_call";
import { useClass } from "../../../../../api_call/useClass";
import { useParams } from "react-router-dom";

const IcoSubject = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <path d="M4 3h14a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M7 7h8M7 11h8M7 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoPlus = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const emptyRow = () => ({ class_id: "", teacher_id: "" });

const AddSubjectPanel = ({
  isShow, onClose, formData, onFormChange, onSubmit, loading = false, isEditMode = false,
}) => {
  const { schoolId } = useParams();
  const { getTeachersBySchoolId } = useTeacherInfo();
  const { getClassesBySchoolId } = useClass();
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [classTeacherRows, setClassTeacherRows] = useState([emptyRow()]);

  useEffect(() => {
    if (isShow && schoolId && !isEditMode) { fetchData(); setClassTeacherRows([emptyRow()]); }
  }, [isShow, schoolId, isEditMode]);

  useEffect(() => { onFormChange("classTeacherRows")(classTeacherRows); }, [classTeacherRows]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const tr = await getTeachersBySchoolId(schoolId);
      if (tr.success && tr.data)
        setTeachers(tr.data.filter(t => t.is_active && t.staff).map(t => ({ value: t.teacher_id, label: `${t.staff.full_name} (${t.teacher_code})` })));
      const cr = await getClassesBySchoolId(schoolId);
      if (cr.success && cr.data)
        setClasses(cr.data.filter(c => c.is_active).map(c => ({ value: c.class_id, label: `${c.class_name} (${c.class_code})` })));
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  const updateRow = (i, f, v) => setClassTeacherRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addRow    = () => setClassTeacherRows(p => [...p, emptyRow()]);
  const removeRow = (i) => setClassTeacherRows(p => p.filter((_, idx) => idx !== i));

  const rowsValid = classTeacherRows.length > 0 && classTeacherRows.every(r => r.class_id && r.teacher_id);
  const canSubmit = !loading && formData.subjectName && formData.subjectCode && formData.stream && (isEditMode || rowsValid);

  return (
    <SlideInMenu isShow={isShow} onClose={onClose} width="620px">
      <div className="asp-container">

        {/* ── Header ── */}
        <div className="asp-header">
          <span className="asp-header-deco"  aria-hidden="true" />
          <span className="asp-header-deco2" aria-hidden="true" />
          <div className="asp-header-contentt">
            <div className="asp-header-icon"><IcoSubject /></div>
            <div className="asp-header-text">
              <h2>{isEditMode ? "Edit Subject" : "Add New Subject"}</h2>
              <p>{isEditMode ? "Update subject information" : "Create a new subject and assign it to classes"}</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="asp-body">
          {loadingData && !isEditMode ? (
            <LoadingData />
          ) : (
            <>
              <FormInput label="Subject Name *" type="text" value={formData.subjectName}
                onChange={onFormChange("subjectName")} placeholder="e.g., Mathematics" disabled={loading} />

              <FormInput label="Subject Code *" type="text" value={formData.subjectCode}
                onChange={onFormChange("subjectCode")} placeholder="e.g., MATH101" disabled={loading} />

              <FormInput label="Subject Description" type="textarea" value={formData.subjectDescription}
                onChange={onFormChange("subjectDescription")} placeholder="Enter subject description..." disabled={loading} height="70px" />

              {/* Stream */}
              <div>
                <label className="fi-label">Stream *</label>
                <select
                  value={formData.stream || ""}
                  onChange={e => onFormChange("stream")(e.target.value)}
                  disabled={loading}
                  className={`asp-stream-select${!formData.stream ? " invalid" : ""}`}
                >
                  <option value="">— Select a stream —</option>
                  <option value="science">Science Stream</option>
                  <option value="arts">Arts Stream</option>
                  <option value="commercial">Commercial Stream</option>
                  <option value="general">General (All Streams)</option>
                </select>
                {!formData.stream && <p className="asp-stream-error">Stream is required</p>}
              </div>

              {/* Class & Teacher Assignments */}
              {!isEditMode && (
                <>
                  <div className="asp-assignments-header">
                    <div>
                      <p className="asp-assignments-title">Class & Teacher Assignments</p>
                      <p className="asp-assignments-hint">Each class requires a teacher. One teacher can teach multiple classes.</p>
                    </div>
                    <button className="asp-add-row-btn" onClick={addRow} disabled={loading}>
                      <IcoPlus /> Add Class
                    </button>
                  </div>

                  {classTeacherRows.map((row, i) => {
                    const taken = new Set(classTeacherRows.filter((_, idx) => idx !== i).map(r => r.class_id).filter(Boolean));
                    const avail = classes.filter(c => !taken.has(c.value));
                    return (
                      <div key={i} className="asp-row-card">
                        <div className="asp-row-card-header">
                          <span className="asp-row-card-title">Assignment {i + 1}</span>
                          {classTeacherRows.length > 1 && (
                            <button className="asp-row-remove-btn" onClick={() => removeRow(i)} disabled={loading}>Remove</button>
                          )}
                        </div>
                        <div className="asp-row-card-body">
                          <div>
                            <label className="fi-label">Class *</label>
                            <SearchableSelect options={avail} value={row.class_id}
                              onChange={v => updateRow(i, "class_id", v)}
                              placeholder="Select a class..." disabled={loading} />
                          </div>
                          <div>
                            <label className="fi-label">Teacher *</label>
                            <SearchableSelect options={teachers} value={row.teacher_id}
                              onChange={v => updateRow(i, "teacher_id", v)}
                              placeholder="Select a teacher..." disabled={loading} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="asp-footer">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!canSubmit}>
            {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Subject" : "Create Subject")}
          </Button>
        </div>

      </div>
    </SlideInMenu>
  );
};

export default AddSubjectPanel;
