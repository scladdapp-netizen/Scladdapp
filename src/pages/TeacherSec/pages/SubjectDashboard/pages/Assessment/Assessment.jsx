import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import InfoField from "../../../../../../components/infoField/InfoField";
import { useSubjectAssessments } from "../../../../../../api_call/useSubjectAssessments";
import useTeacherSubjectAssignment from "../../../../../../api_call/useTeacherSubjectAssignment";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import "../../../../../../pages/AdminSec/AdminPages/subjectProfile/SubjectResources/SubjectResources.css";
import "../../../../../../pages/AdminSec/AdminPages/subjectProfile/SubjectClasses/SubjectClasses.css";
import "./Assessment.css";

const Assessment = ({ subjectData }) => {
  const { subjectId, assignmentId, subseasionId } = useParams();
  const subseasion = subseasionId;
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const modifiedBy = user?.staff?.staff_id || user?.admin?.admin_id || user?.user_id;

  // Fetch assignment from URL param to get class_id
  const { assignment: myAssignment } = useTeacherSubjectAssignment(assignmentId);
  const assignedClassId = myAssignment?.class_id || null;

  const { fetchScores, updateScore, createScore } = useSubjectAssessments(subjectId, subseasion, modifiedBy);

  const [gradingFields, setGradingFields] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [showDetail, setShowDetail]       = useState(false);
  const [editMode, setEditMode]           = useState(false);
  const [scoreForm, setScoreForm]         = useState({});
  const [saving, setSaving]               = useState(false);
  const [saveCount, setSaveCount]         = useState(0);

  useEffect(() => {
    setGradingFields([]);
    setSelected(null);
    setShowDetail(false);
    setEditMode(false);
  }, [subseasion]);

  // Refs updated synchronously so fetchData (stable) always reads latest values
  const assignedClassIdRef = useRef(assignedClassId);
  assignedClassIdRef.current = assignedClassId;

  const fetchScoresRef = useRef(fetchScores);
  fetchScoresRef.current = fetchScores;

  const fetchData = useCallback(async (params) => {
    const classId = assignedClassIdRef.current;
    const fetchParams = classId ? { ...params, limit: 1000, page: 1 } : params;
    const result = await fetchScoresRef.current(fetchParams);
    if (result.success && result.grading_fields?.length) {
      setGradingFields(result.grading_fields);
    }
    if (result.success && classId && Array.isArray(result.data)) {
      result.data = result.data.filter((row) => row.class_id === classId);
      const filtered = result.data.length;
      if (result.pagination) {
        result.pagination.totalRecords = filtered;
        result.pagination.totalPages   = Math.ceil(filtered / (result.pagination.recordsPerPage || 20)) || 1;
        result.pagination.hasNextPage  = false;
        result.pagination.hasPrevPage  = false;
        result.pagination.startIndex   = filtered === 0 ? 0 : 1;
        result.pagination.endIndex     = filtered;
      }
    }
    return result;
  }, []); // stable — reads via refs

  const handleRowClick = (row) => {
    setSelected(row);
    setEditMode(false);
    setScoreForm({});
    setShowDetail(true);
  };

  const openEditMode = () => {
    const initial = {};
    gradingFields.forEach((f) => {
      const val = selected.scores?.[f.field_name];
      initial[f.field_name] = val !== null && val !== undefined ? String(val) : "";
    });
    setScoreForm(initial);
    setEditMode(true);
  };

  const handleSave = async () => {
    for (const f of gradingFields) {
      const val = scoreForm[f.field_name];
      if (val === "" || val === undefined) continue;
      const num = Number(val);
      if (isNaN(num) || num < 0) { addNotification(`${f.field_name.toUpperCase()}: invalid value`, "error"); return; }
      if (num > Number(f.max_score)) { addNotification(`${f.field_name.toUpperCase()} cannot exceed ${f.max_score}`, "error"); return; }
    }
    const scores = {};
    gradingFields.forEach((f) => {
      const val = scoreForm[f.field_name];
      scores[f.field_name] = val !== "" && val !== undefined ? Number(val) : null;
    });
    setSaving(true);
    const res = selected.has_score
      ? await updateScore(selected.student_id, scores)
      : await createScore(selected.student_id, scores);
    setSaving(false);
    if (res.success) {
      addNotification("Scores saved", "success");
      setEditMode(false);
      setShowDetail(false);
      setSaveCount((k) => k + 1);
    } else {
      addNotification(res.message || "Failed to save scores", "error");
    }
  };

  const scoreColumns = gradingFields.map((f) => ({
    accessor: `scores.${f.field_name}`,
    label: `${f.field_name.toUpperCase()} (/${f.max_score})`,
    render: (_, row) => {
      if (!row.has_score) return <span className="as-no-score">—</span>;
      const val = row.scores?.[f.field_name];
      return val !== null && val !== undefined ? val : <span className="as-zero">0</span>;
    },
  }));

  const columns = [
    {
      accessor: "student_name",
      label: "Student Name",
      searchable: true,
      render: (val, row) => (
        <div>
          <div className="as-student-name">{val || "—"}</div>
          <div className="as-student-id">{row.student_id}</div>
        </div>
      ),
    },
    { accessor: "class_name", label: "Class", render: (val) => val || "—" },
    ...scoreColumns,
    {
      accessor: "total",
      label: "Total",
      render: (val, row) =>
        row.has_score
          ? <span className="as-total">{val ?? "—"}</span>
          : <span className="as-no-score-label">No score</span>,
    },
  ];

  return (
    <InnerTabCon>
      <div className="as-container">
        <div className="sr2-header">
          <div className="sr2-header-left">
            <h2 className="sr2-title">Student Assessments</h2>
            <p className="sr2-subtitle">
              {myAssignment?.class_name
                ? `Class: ${myAssignment.class_name} · Scores for the selected subsession`
                : "Scores for this subject in the selected subsession"}
            </p>
          </div>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          onRowClick={handleRowClick}
          showcreatbut={false}
          initialPageSize={20}
          reloadKey={`${subseasion}-${assignedClassId}-${saveCount}`}
        />
      </div>

      <SlideInMenu isShow={showDetail} onClose={() => { setShowDetail(false); setEditMode(false); }} width="500px">
        {selected && (
          <div className="sc-panel">
            <div className="sc-panel-header default">
              <span className="sc-panel-header-deco" aria-hidden="true" />
              <div className="sc-panel-header-content">
                <div className="sc-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="sc-panel-header-text">
                  <h2>{selected.student_name || "Student"}</h2>
                  <p>{selected.class_name || "—"}</p>
                </div>
              </div>
            </div>

            <div className="sc-panel-body">
              <div className="sc-detail-grid">
                <InfoField label="Student ID" value={selected.student_id} />
                <InfoField label="Class"      value={selected.class_name || selected.class_id || "—"} />
                <InfoField label="Teacher"    value={selected.teacher_name || "—"} />
              </div>

              <span className="sc-section-label">Scores</span>

              {editMode ? (
                <div className="as-score-form">
                  {gradingFields.map((f) => (
                    <div key={f.field_name} className="as-score-field">
                      <label className="as-score-label">
                        {f.field_name.toUpperCase()}
                        <span className="as-score-max"> (max {f.max_score})</span>
                      </label>
                      <input
                        type="number" min={0} max={Number(f.max_score)}
                        value={scoreForm[f.field_name] ?? ""}
                        onChange={(e) => setScoreForm((prev) => ({ ...prev, [f.field_name]: e.target.value }))}
                        className="as-score-input"
                        placeholder={`0 – ${f.max_score}`}
                      />
                    </div>
                  ))}
                </div>
              ) : !selected.has_score ? (
                <div className="as-empty-scores">No scores entered yet for this student.</div>
              ) : (
                <div className="as-scores-list">
                  {gradingFields.map((f) => (
                    <div key={f.field_name} className="as-score-row">
                      <span className="as-score-row-label">
                        {f.field_name.toUpperCase()}
                        <span className="as-score-max"> /{f.max_score}</span>
                      </span>
                      <span className="as-score-row-value">
                        {selected.scores?.[f.field_name] !== null && selected.scores?.[f.field_name] !== undefined
                          ? selected.scores[f.field_name] : "—"}
                      </span>
                    </div>
                  ))}
                  <div className="as-score-total-row">
                    <span>Total</span>
                    <span>{selected.total ?? "—"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="sc-panel-footer">
              {editMode ? (
                <>
                  <Button variant="secondary" onClick={() => setEditMode(false)} disabled={saving}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Scores"}</Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => { setShowDetail(false); setEditMode(false); }}>Close</Button>
                  <Button onClick={openEditMode}>{selected.has_score ? "Edit Scores" : "Enter Scores"}</Button>
                </>
              )}
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default Assessment;
