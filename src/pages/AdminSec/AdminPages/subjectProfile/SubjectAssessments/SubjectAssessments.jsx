import { useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import "./SubjectAssessments.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import { useSubjectAssessments } from "../../../../../api_call/useSubjectAssessments";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";

/**
 * Double-tap tracker for mobile — fires callback on second tap within 300ms.
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

  const tapTracker = useRef(createTapTracker());

  const [gradingFields, setGradingFields] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  // Inline editing state
  // activeCell: { studentId, fieldName, maxScore } | null
  const [activeCell, setActiveCell] = useState(null);
  const [cellValue, setCellValue] = useState("");
  const [cellError, setCellError] = useState("");
  // Per-cell saving spinners: Set of "studentId:fieldName" strings
  const [savingCells, setSavingCells] = useState(new Set());
  // Local score overrides after save: { [studentId]: { [fieldName]: value, has_score: true } }
  const [scoreOverrides, setScoreOverrides] = useState({});

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

  // Open a cell for editing
  const openCell = (studentId, fieldName, maxScore, currentValue, hasScore) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit scores.", "error");
      return;
    }
    setActiveCell({ studentId, fieldName, maxScore, hasScore });
    setCellValue(currentValue !== null && currentValue !== undefined ? String(currentValue) : "");
    setCellError("");
  };

  const handleCellChange = (value, maxScore) => {
    setCellValue(value);
    if (value !== "") {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > Number(maxScore)) {
        setCellError(`0 – ${maxScore}`);
      } else {
        setCellError("");
      }
    } else {
      setCellError("");
    }
  };

  const commitCell = async (rowData) => {
    if (!activeCell || cellError) { setActiveCell(null); return; }

    const { studentId, fieldName, maxScore, hasScore } = activeCell;

    // Resolve current value from overrides or row
    const currentOverrides = scoreOverrides[studentId] ?? {};
    const prevVal = currentOverrides[fieldName] !== undefined
      ? currentOverrides[fieldName]
      : (rowData?.scores?.[fieldName] ?? null);

    const newVal = cellValue === "" ? null : Number(cellValue);

    // No change — close silently
    if (newVal === prevVal || (newVal === null && prevVal === null)) {
      setActiveCell(null);
      return;
    }

    const savedCell = { ...activeCell };
    setActiveCell(null);

    // Optimistic update
    const mergedOverrides = { ...currentOverrides, [fieldName]: newVal, _hasScore: hasScore };
    setScoreOverrides((prev) => ({ ...prev, [studentId]: mergedOverrides }));

    // Per-cell spinner
    const cellKey = `${studentId}:${fieldName}`;
    setSavingCells((prev) => new Set(prev).add(cellKey));

    // Build full scores object for this student
    const existingScores = { ...(rowData?.scores ?? {}), ...currentOverrides };
    const newScores = { ...existingScores, [fieldName]: newVal };
    // Remove internal keys
    delete newScores._hasScore;

    let res;
    if (hasScore || currentOverrides._hasScore) {
      res = await updateScore(studentId, newScores);
    } else {
      res = await createScore(studentId, newScores);
    }

    setSavingCells((prev) => { const s = new Set(prev); s.delete(cellKey); return s; });

    if (res?.success) {
      addNotification("Score saved", "success");
      // Mark student as has_score after first create
      setScoreOverrides((prev) => ({
        ...prev,
        [studentId]: { ...(prev[studentId] ?? {}), [fieldName]: newVal, _hasScore: true },
      }));
    } else {
      // Roll back
      setScoreOverrides((prev) => {
        const next = { ...prev };
        if (next[studentId]) {
          delete next[studentId][fieldName];
          if (Object.keys(next[studentId]).filter(k => k !== '_hasScore').length === 0) {
            delete next[studentId];
          }
        }
        return next;
      });
      addNotification(res?.message || "Failed to save score", "error");
    }
  };

  // Build dynamic score columns — each cell is inline-editable
  const scoreColumns = gradingFields.map((f) => ({
    accessor: `scores.${f.field_name}`,
    label: `${f.field_name.toUpperCase()} (/${f.max_score})`,
    render: (_, row) => {
      const studentId = row.student_id;
      const override = scoreOverrides[studentId];
      const effectiveHasScore = override?._hasScore ?? row.has_score;
      const val = override?.[f.field_name] !== undefined
        ? override[f.field_name]
        : (row.scores?.[f.field_name] ?? null);

      const isActive = activeCell?.studentId === studentId && activeCell?.fieldName === f.field_name;
      const cellKey = `${studentId}:${f.field_name}`;
      const isSaving = savingCells.has(cellKey);

      // We return content only — ServerSmartTable wraps it in <td>
      // Use a div that captures double-click and stops row-level click propagation
      return (
        <div
          className={`sa-inline-cell${isActive ? " sa-cell-active" : ""}`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            openCell(studentId, f.field_name, f.max_score, val, effectiveHasScore);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            tapTracker.current(
              `score:${studentId}:${f.field_name}`,
              () => openCell(studentId, f.field_name, f.max_score, val, effectiveHasScore),
              e
            );
          }}
          title="Double-click to edit"
        >
          {isActive ? (
            <div className="rsi-inline-edit-wrap" onClick={(e) => e.stopPropagation()}>
              <input
                className={`rsi-inline-input${cellError ? " rsi-input-error" : ""}`}
                type="number"
                min="0"
                max={f.max_score}
                value={cellValue}
                autoFocus
                onChange={(e) => handleCellChange(e.target.value, f.max_score)}
                onBlur={() => commitCell(row)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.target.blur();
                  if (e.key === "Escape") setActiveCell(null);
                }}
              />
              {cellError && <span className="rsi-inline-error">{cellError}</span>}
            </div>
          ) : (
            <span className="rsi-cell-display">
              {!effectiveHasScore ? (
                <span className="sa-score-empty">—</span>
              ) : val !== null && val !== undefined ? (
                val
              ) : (
                <span className="sa-score-zero">0</span>
              )}
              {isSaving && <span className="rsi-cell-spinner" />}
            </span>
          )}
        </div>
      );
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
      render: (val, row) => {
        const override = scoreOverrides[row.student_id];
        const effectiveHasScore = override?._hasScore ?? row.has_score;
        if (!effectiveHasScore) return <span className="sa-no-score">No score</span>;
        // Recalculate total from overrides if any
        if (override) {
          const total = gradingFields.reduce((sum, f) => {
            const v = override[f.field_name] !== undefined
              ? override[f.field_name]
              : (row.scores?.[f.field_name] ?? 0);
            return sum + (Number(v) || 0);
          }, 0);
          return <span className="sa-score-total">{total}</span>;
        }
        return <span className="sa-score-total">{val ?? "—"}</span>;
      },
    },
  ];

  return (
    <InnerTabCon>
      <div className="subjectAssessments">
        <div className="assessmentsHeader">
          <div className="assessmentsHeaderLeft">
            <h2 className="assessmentsTitle">Student Assessments</h2>
            <p className="assessmentsSubtitle">
              Double-click a score cell to edit · Scores for this subject in the selected subsession
            </p>
          </div>
        </div>

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          showcreatbut={false}
          initialPageSize={20}
          reloadKey={reloadKey}
        />
      </div>
    </InnerTabCon>
  );
};

export default SubjectAssessments;
