import { useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./SubjectAssessments.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import { useSubjectAssessments } from "../../../../../api_call/useSubjectAssessments";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";

const SubjectAssessments = () => {
  const { subjectId, subseasion } = useParams();
  const { fetchScores, updateScore, createScore } = useSubjectAssessments(subjectId, subseasion);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.subject?.edit;

  const [gradingFields, setGradingFields] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [scoreForm, setScoreForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Wrap fetchScores to capture grading_fields from first response
  const fetchData = useCallback(
    async (params) => {
      const result = await fetchScores(params);
      if (result.success && result.grading_fields?.length) {
        setGradingFields(result.grading_fields);
      }
      return result;
    },
    [fetchScores]
  );

  const handleRowClick = (row) => {
    setSelected(row);
    setEditMode(false);
    setScoreForm({});
    setShowDetail(true);
  };

  const openEditMode = () => {
    if (!canEdit) {
      addNotification("You do not have permission to edit scores.", "error");
      return;
    }
    const initial = {};
    gradingFields.forEach((f) => {
      const val = selected?.scores?.[f.field_name];
      initial[f.field_name] = val !== null && val !== undefined ? String(val) : "";
    });
    setScoreForm(initial);
    setEditMode(true);
  };

  const handleSave = async () => {
    // Validate: all fields must be numbers within max
    for (const f of gradingFields) {
      const val = scoreForm[f.field_name];
      if (val === "" || val === undefined) continue; // allow empty (null)
      const num = Number(val);
      if (isNaN(num) || num < 0) {
        addNotification(`${f.field_name.toUpperCase()}: invalid value`, "error");
        return;
      }
      if (num > Number(f.max_score)) {
        addNotification(`${f.field_name.toUpperCase()} cannot exceed ${f.max_score}`, "error");
        return;
      }
    }

    // Build scores object — empty string → null
    const scores = {};
    gradingFields.forEach((f) => {
      const val = scoreForm[f.field_name];
      scores[f.field_name] = val !== "" && val !== undefined ? Number(val) : null;
    });

    setSaving(true);
    let res;
    if (selected.has_score) {
      res = await updateScore(selected.student_id, scores);
    } else {
      res = await createScore(selected.student_id, scores);
    }
    setSaving(false);

    if (res.success) {
      addNotification("Scores saved", "success");
      setEditMode(false);
      setShowDetail(false);
      setReloadKey((k) => k + 1);
    } else {
      addNotification(res.message || "Failed to save scores", "error");
    }
  };

  // Build dynamic score columns from grading_fields
  const scoreColumns = gradingFields.map((f) => ({
    accessor: `scores.${f.field_name}`,
    label: `${f.field_name.toUpperCase()} (/${f.max_score})`,
    render: (_, row) => {
      if (!row.has_score) return <span className="sa-score-empty">—</span>;
      const val = row.scores?.[f.field_name];
      return val !== null && val !== undefined ? val : <span className="sa-score-zero">0</span>;
    },
  }));

  const columns = [
    {
      accessor: "student_name",
      label: "Student Name",
      searchable: true,
      render: (val, row) => (
        <div>
          <p className="sa-student-name">{val || "—"}</p>
          <p className="sa-student-id">{row.student_id}</p>
        </div>
      ),
    },
    {
      accessor: "class_name",
      label: "Class",
      render: (val) => val || "—",
    },
    ...scoreColumns,
    {
      accessor: "total",
      label: "Total",
      render: (val, row) =>
        row.has_score ? (
          <span className="sa-score-total">{val ?? "—"}</span>
        ) : (
          <span className="sa-no-score">No score</span>
        ),
    },
  ];

  return (
    <InnerTabCon>
    <div className="subjectAssessments">
      <div className="assessmentsHeader">
        <div className="assessmentsHeaderLeft">
          <h2 className="assessmentsTitle">Student Assessments</h2>
          <p className="assessmentsSubtitle">Scores for this subject in the selected subsession</p>
        </div>
      </div>

      <ServerSmartTable
        columns={columns}
        fetchData={fetchData}
        onRowClick={handleRowClick}
        showcreatbut={false}
        initialPageSize={20}
        reloadKey={reloadKey}
      />

      {/* Detail / Score entry panel */}
      <SlideInMenu isShow={showDetail} onClose={() => { setShowDetail(false); setEditMode(false); }} width="500px">
        {selected && (
          <div className="sa-panel">
            <div className="sa-panel-header">
              <span className="sa-panel-header-deco" aria-hidden="true" />
              <div className="sa-panel-header-content">
                <div className="sa-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="sa-panel-header-text">
                  <h2>{selected.student_name || "Student"}</h2>
                  <p>{selected.class_name || selected.class_id || "—"}</p>
                </div>
              </div>
            </div>

            <div className="sa-panel-body">
              <div className="sa-info-row"><span className="sa-info-label">Student ID</span><span className="sa-info-value">{selected.student_id}</span></div>
              <div className="sa-info-row"><span className="sa-info-label">Teacher</span><span className="sa-info-value">{selected.teacher_name || "—"}</span></div>
              <div className="sa-divider" />

              {editMode ? (
                <>
                  <span className="sa-edit-title">{selected.has_score ? "Edit Scores" : "Enter Scores"}</span>
                  {gradingFields.map((f) => (
                    <div key={f.field_name} className="sa-field">
                      <label className="sa-field-label">
                        {f.field_name.toUpperCase()}
                        <span className="sa-field-max"> (max {f.max_score})</span>
                      </label>
                      <input
                        type="number" min={0} max={Number(f.max_score)}
                        className="sa-field-input"
                        value={scoreForm[f.field_name] ?? ""}
                        onChange={(e) => setScoreForm((prev) => ({ ...prev, [f.field_name]: e.target.value }))}
                        placeholder={`0 – ${f.max_score}`}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="sa-edit-title">Scores</span>
                    <Button variant="secondary" onClick={openEditMode}>
                      {selected.has_score ? "Edit Scores" : "Enter Scores"}
                    </Button>
                  </div>

                  {!selected.has_score ? (
                    <div className="sa-no-scores">No scores entered yet for this student.</div>
                  ) : (
                    <>
                      {gradingFields.map((f) => (
                        <div key={f.field_name} className="sa-score-row">
                          <div>
                            <span className="sa-score-row-label">{f.field_name.toUpperCase()}</span>
                            <span className="sa-score-row-max"> / {f.max_score}</span>
                          </div>
                          <span className="sa-score-row-value">
                            {selected.scores?.[f.field_name] !== null && selected.scores?.[f.field_name] !== undefined
                              ? selected.scores[f.field_name] : "—"}
                          </span>
                        </div>
                      ))}
                      <div className="sa-score-total-row">
                        <span>Total</span>
                        <span>{selected.total ?? "—"}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="sa-panel-footer">
              {editMode ? (
                <>
                  <Button variant="secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Scores"}</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
              )}
            </div>
          </div>
        )}
      </SlideInMenu>
    </div>
    </InnerTabCon>
  );
};

export default SubjectAssessments;
