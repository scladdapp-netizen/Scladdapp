import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import { useSubjectAssessments } from "../../../../../../api_call/useSubjectAssessments";
import useTeacherSubjectAssignment from "../../../../../../api_call/useTeacherSubjectAssignment";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import "./Assessment.css";

/**
 * Double-tap-to-edit tracker for touch devices.
 * Returns the same createTapTracker factory used in ReportStudentInfo.
 */
const createTapTracker = () => {
  let lastKey = null;
  let lastTime = 0;
  return (key, callback, e) => {
    const now = Date.now();
    if (key === lastKey && now - lastTime < 300) {
      e.preventDefault();
      callback();
      lastKey = null;
    } else {
      lastKey = key;
      lastTime = now;
    }
  };
};

const Assessment = ({ subjectData }) => {
  const { subjectId, assignmentId, subseasionId } = useParams();
  const subseasion = subseasionId;
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const modifiedBy = user?.staff?.staff_id || user?.admin?.admin_id || user?.user_id;

  const { assignment: myAssignment } = useTeacherSubjectAssignment(assignmentId);
  const assignedClassId = myAssignment?.class_id || null;

  const { fetchScores, updateScore, createScore } = useSubjectAssessments(subjectId, subseasion, modifiedBy);

  /* ── Data state ─────────────────────────────────────────────────────────── */
  const [rows, setRows]               = useState([]);
  const [gradingFields, setGradingFields] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState("");

  /* ── Inline editing ─────────────────────────────────────────────────────── */
  // activeCell: { studentId, fieldName, maxScore } | null
  const [activeCell, setActiveCell]   = useState(null);
  const [cellValue, setCellValue]     = useState("");
  const [cellError, setCellError]     = useState("");
  // Per-cell saving: Set of "studentId:fieldName"
  const [savingCells, setSavingCells] = useState(new Set());

  /* ── Local score overrides (optimistic) ─────────────────────────────────── */
  // { [studentId]: { [fieldName]: value } }
  const [scoreOverrides, setScoreOverrides] = useState({});
  // hasScore overrides (after first create)
  const [hasScoreSet, setHasScoreSet] = useState(new Set());

  const tapTracker = useRef(createTapTracker());

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchScores({ page: 1, limit: 1000, search: "" });
    setLoading(false);
    if (result.success) {
      let data = result.data || [];
      if (assignedClassId) data = data.filter((r) => r.class_id === assignedClassId);
      setRows(data);
      if (result.grading_fields?.length) setGradingFields(result.grading_fields);
      // Reset overrides on fresh load
      setScoreOverrides({});
      setHasScoreSet(new Set());
    }
  }, [fetchScores, assignedClassId]);

  useEffect(() => {
    if (subjectId && subseasion) load();
  }, [subjectId, subseasion, load]);

  /* ── Search filter (client-side since we fetched all) ───────────────────── */
  const filteredRows = search.trim()
    ? rows.filter((r) => (r.student_name || "").toLowerCase().includes(search.toLowerCase()))
    : rows;

  /* ── Open a cell for editing ─────────────────────────────────────────────── */
  const openCell = (studentId, fieldName, maxScore, currentValue) => {
    setActiveCell({ studentId, fieldName, maxScore });
    setCellValue(currentValue != null ? String(currentValue) : "");
    setCellError("");
  };

  const handleCellChange = (value, maxScore) => {
    setCellValue(value);
    const num = Number(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > Number(maxScore))) {
      setCellError(`Max ${maxScore}`);
    } else {
      setCellError("");
    }
  };

  /* ── Commit a cell edit ─────────────────────────────────────────────────── */
  const commitCell = async () => {
    if (!activeCell || cellError) { setActiveCell(null); return; }

    const { studentId, fieldName, maxScore } = activeCell;
    const row = rows.find((r) => r.student_id === studentId);
    if (!row) { setActiveCell(null); return; }

    // Resolve current displayed value (override or server)
    const currentVal = scoreOverrides[studentId]?.[fieldName] !== undefined
      ? scoreOverrides[studentId][fieldName]
      : (row.scores?.[fieldName] ?? null);

    const newVal = cellValue === "" ? null : Number(cellValue);

    // No change → close silently
    if (newVal === currentVal || (newVal === null && currentVal === null)) {
      setActiveCell(null);
      return;
    }

    const savedCell = { ...activeCell };
    setActiveCell(null);

    // Optimistic update
    setScoreOverrides((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [fieldName]: newVal },
    }));

    const cellKey = `${studentId}:${fieldName}`;
    setSavingCells((prev) => new Set(prev).add(cellKey));

    // Build full score map: merge server + existing overrides + new value
    const baseScores = row.scores ?? {};
    const merged = {
      ...baseScores,
      ...(scoreOverrides[studentId] ?? {}),
      [fieldName]: newVal,
    };

    const isExisting = row.has_score || hasScoreSet.has(studentId);
    const res = isExisting
      ? await updateScore(studentId, merged)
      : await createScore(studentId, merged);

    setSavingCells((prev) => { const s = new Set(prev); s.delete(cellKey); return s; });

    if (res?.success) {
      if (!isExisting) setHasScoreSet((prev) => new Set(prev).add(studentId));
      // Recompute total optimistically
      const allFields = gradingFields.reduce((acc, f) => {
        acc[f.field_name] = scoreOverrides[studentId]?.[f.field_name] !== undefined
          ? scoreOverrides[studentId][f.field_name]
          : (row.scores?.[f.field_name] ?? null);
        return acc;
      }, {});
      allFields[fieldName] = newVal;
      const newTotal = gradingFields.reduce((s, f) => s + (Number(allFields[f.field_name]) || 0), 0);
      setScoreOverrides((prev) => ({
        ...prev,
        [studentId]: { ...(prev[studentId] ?? {}), [fieldName]: newVal, __total: newTotal },
      }));
    } else {
      // Rollback
      setScoreOverrides((prev) => {
        const next = { ...prev };
        if (next[studentId]) {
          delete next[studentId][fieldName];
          if (Object.keys(next[studentId]).filter((k) => !k.startsWith("__")).length === 0)
            delete next[studentId];
        }
        return next;
      });
      addNotification(res?.message || "Failed to save score", "error");
    }
  };

  /* ── Resolved display value for a cell ─────────────────────────────────── */
  const getDisplayVal = (row, fieldName) => {
    const override = scoreOverrides[row.student_id];
    if (override && override[fieldName] !== undefined) return override[fieldName];
    if (row.has_score || hasScoreSet.has(row.student_id)) return row.scores?.[fieldName] ?? null;
    return null;
  };

  const getTotal = (row) => {
    const override = scoreOverrides[row.student_id];
    if (override?.__total !== undefined) return override.__total;
    if (row.has_score || hasScoreSet.has(row.student_id)) return row.total ?? null;
    return null;
  };

  const hasScore = (row) => row.has_score || hasScoreSet.has(row.student_id);

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <InnerTabCon>
      <div className="as-container">

        {/* Header */}
        <div className="sr2-header">
          <div className="sr2-header-left">
            <h2 className="sr2-title">Student Assessments</h2>
            <p className="sr2-subtitle">
              {myAssignment?.class_name
                ? `Class: ${myAssignment.class_name} · Double-click a score to edit`
                : "Double-click a score cell to edit inline"}
            </p>
          </div>
          {/* Search */}
          <div className="as-search-wrap">
            <input
              className="as-search-input"
              type="text"
              placeholder="Search student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingData message="Loading scores…" />
        ) : filteredRows.length === 0 ? (
          <div className="as-empty">No students found.</div>
        ) : (
          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr className="as-thead-row">
                  <th className="as-th as-th-sticky">Student</th>
                  {gradingFields.map((f) => (
                    <th key={f.field_name} className="as-th as-th-score">
                      {f.field_name.toUpperCase()}
                      <span className="as-th-max">/{f.max_score}</span>
                    </th>
                  ))}
                  <th className="as-th as-th-total">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, i) => {
                  const total = getTotal(row);
                  return (
                    <tr key={row.student_id} className={`as-row${i % 2 !== 0 ? " as-row-alt" : ""}`}>
                      {/* Name column */}
                      <td className="as-td as-td-sticky">
                        <div className="as-student-name">{row.student_name || "—"}</div>
                        <div className="as-student-id">{row.student_id}</div>
                      </td>

                      {/* Score columns */}
                      {gradingFields.map((f) => {
                        const isActive = activeCell?.studentId === row.student_id && activeCell?.fieldName === f.field_name;
                        const cellKey  = `${row.student_id}:${f.field_name}`;
                        const isSaving = savingCells.has(cellKey);
                        const displayVal = getDisplayVal(row, f.field_name);

                        return (
                          <td
                            key={f.field_name}
                            className={`as-td as-td-score as-editable-cell${isActive ? " as-cell-active" : ""}`}
                            onDoubleClick={() => openCell(row.student_id, f.field_name, f.max_score, displayVal)}
                            onTouchEnd={(e) => tapTracker.current(
                              `${row.student_id}:${f.field_name}`,
                              () => openCell(row.student_id, f.field_name, f.max_score, displayVal),
                              e
                            )}
                            title="Double-click to edit"
                          >
                            {isActive ? (
                              <div className="as-inline-wrap">
                                <input
                                  className={`as-inline-input${cellError ? " as-inline-input--error" : ""}`}
                                  type="number"
                                  min="0"
                                  max={f.max_score}
                                  value={cellValue}
                                  autoFocus
                                  onChange={(e) => handleCellChange(e.target.value, f.max_score)}
                                  onBlur={commitCell}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")  { e.target.blur(); }
                                    if (e.key === "Escape") { setActiveCell(null); }
                                  }}
                                />
                                {cellError && <span className="as-inline-error">{cellError}</span>}
                              </div>
                            ) : (
                              <span className="as-cell-display">
                                {displayVal != null
                                  ? displayVal
                                  : <span className="as-no-score">—</span>}
                                {isSaving && <span className="as-cell-spinner" />}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="as-td as-td-total">
                        {total != null
                          ? <span className="as-total">{total}</span>
                          : <span className="as-no-score-label">No score</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InnerTabCon>
  );
};

export default Assessment;
