import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "./ReportStudentInfo.css";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import ReportCardPreview from "../../../../../../components/ReportCardPreview/ReportCardPreview";
import useStudentReport from "../../../../../../api_call/useStudentReport";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { exportReportPDF } from "../../../../../../utils/exportReportPDF";
import { exportReportHtml, resolveReportExportTemplate } from "../../../../../../utils/exportReportHtml";

/**
 * A single touch-tap tracker shared across cells.
 * We pass the cell's open-callback; it fires on the second tap within 300ms.
 * We store state in a module-level object per tracker instance returned by createTapTracker().
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

const ReportStudentInfo = () => {
  const { subseasion, studentId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Single tap tracker for double-tap-to-edit on mobile (touch devices)
  const tapTracker = useRef(createTapTracker());

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canRead   = isSuperAdmin || !!admin?.permissions?.student_report?.read;
  const canCreate = isSuperAdmin || !!admin?.permissions?.student_report?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.student_report?.edit;

  const permNotify = (msg) => addNotification(msg, "error");
  const {
    loading, fetchSubsession, templateData, classSubjects, studentScores,
    traitScore, classAverage, subjectPositions, reportCard, previewData,
    saveScore, saveTraitScore, saveReportCard, createReport,
    subsessionData, classData,
  } = useStudentReport(user?.admin?.admin_id || user?.user_id);

  // Local overrides — patch values after save without a full refetch
  // scoreOverrides: { [subjectId]: { [fieldName]: value } }
  const [scoreOverrides, setScoreOverrides] = useState({});
  // Track subjects whose score record was created this session (so we PATCH on subsequent saves)
  // hasExistingOverrides: Set of subjectId strings
  const [hasExistingOverrides, setHasExistingOverrides] = useState(new Set());
  // traitOverrides: { [traitName]: value }
  const [traitOverrides, setTraitOverrides] = useState({});
  // Per-cell saving spinners: Set of "subjectId:fieldName" strings
  const [savingCells, setSavingCells] = useState(new Set());
  // Per-trait saving spinners: Set of trait name strings
  const [savingTraits, setSavingTraits] = useState(new Set());

  // inline cell editing state — Academic Scores
  // activeCell: { subjectId, fieldName } | null
  const [activeCell, setActiveCell] = useState(null);
  const [cellValue, setCellValue] = useState("");
  const [cellError, setCellError] = useState("");

  // inline cell editing state — Behavioral Traits
  // activeTrait: traitName string | null
  const [activeTrait, setActiveTrait] = useState(null);
  const [traitCellValue, setTraitCellValue] = useState("");

  const [saving, setSaving] = useState(false);

  const [remarkPanel, setRemarkPanel] = useState(false);
  const [editTeacherRemark, setEditTeacherRemark] = useState("");
  const [editPrincipalRemark, setEditPrincipalRemark] = useState("");

  const [publishPanel, setPublishPanel] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create report card panel
  const [createPanel, setCreatePanel] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const openCreatePanel = () => {
    if (!canCreate) { permNotify("You do not have permission to create report cards."); return; }
    setSelectedSubjects(
      classSubjects.map((s) => ({
        subject_id:   s.subject_id,
        subject_name: s.subject_name,
        subject_code: s.subject_code || "—",
      }))
    );
    setCreatePanel(true);
  };

  const toggleSubject = (subject_id) => {
    setSelectedSubjects((prev) =>
      prev.some((s) => s.subject_id === subject_id)
        ? prev.filter((s) => s.subject_id !== subject_id)
        : [...prev, classSubjects.find((s) => s.subject_id === subject_id)]
    );
  };

  const handleCreateReport = async () => {
    setCreating(true);
    await saveReportCard(studentId, subseasion, { subjects: selectedSubjects });
    setCreating(false);
    setCreatePanel(false);
    reload();
  };

  // Add subject to report card panel
  const [addSubjectPanel, setAddSubjectPanel] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [subjectPanelSelected, setSubjectPanelSelected] = useState([]);

  const openAddSubjectPanel = () => {
    if (!canEdit) { permNotify("You do not have permission to edit report cards."); return; }
    const existing = new Set((reportCard?.subjects || []).map((s) => s.subject_id));
    // Pre-select subjects not already on the report card
    setSubjectPanelSelected(
      classSubjects
        .filter((s) => !existing.has(s.subject_id))
        .map((s) => ({ subject_id: s.subject_id, subject_name: s.subject_name, subject_code: s.subject_code || "—" }))
    );
    setAddSubjectPanel(true);
  };

  const toggleAddSubject = (subject_id) => {
    setSubjectPanelSelected((prev) =>
      prev.some((s) => s.subject_id === subject_id)
        ? prev.filter((s) => s.subject_id !== subject_id)
        : [...prev, classSubjects.find((s) => s.subject_id === subject_id)]
    );
  };

  const handleAddSubjects = async () => {
    setAddingSubject(true);
    const merged = [
      ...(reportCard?.subjects || []),
      ...subjectPanelSelected,
    ];
    await saveReportCard(studentId, subseasion, { subjects: merged });
    setAddingSubject(false);
    setAddSubjectPanel(false);
    reload();
  };

  const handleRemoveSubject = async (subject_id) => {
    const updated = (reportCard?.subjects || []).filter((s) => s.subject_id !== subject_id);
    await saveReportCard(studentId, subseasion, { subjects: updated });
    reload();
  };

  const reload = () => {
    if (subseasion && studentId) fetchSubsession(subseasion, studentId);
  };

  useEffect(() => { reload(); }, [subseasion, studentId]);

  const gradingFields = templateData?.grading_fields ?? [];
  const gradingScheme = templateData?.grading_scheme ?? [];
  const maxTotal = gradingFields.reduce((sum, f) => sum + Number(f.max_score), 0);

  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "";
    const pct = (total / maxTotal) * 100;
    const match = gradingScheme.find((g) => pct >= Number(g.min_range) && pct <= Number(g.max_range));
    return match ? match.grade_letter : "";
  };

  // If report card has snapshotted subjects, use those; otherwise fall back to fetched class subjects
  const subjectList = reportCard?.subjects?.length > 0 ? reportCard.subjects : classSubjects;
  const tableRows = subjectList.map((subject) => {
    const score = studentScores.find((s) => s.subject_id === subject.subject_id);
    // Merge any local overrides on top of the server scores
    const mergedScores = score?.scores
      ? { ...score.scores, ...(scoreOverrides[subject.subject_id] ?? {}) }
      : (scoreOverrides[subject.subject_id] ? { ...scoreOverrides[subject.subject_id] } : null);
    return {
      subject_id: subject.subject_id,
      subject_name: subject.subject_name,
      scores: mergedScores,
      // A record exists if it came from the server OR was created this session
      hasExisting: !!score || hasExistingOverrides.has(subject.subject_id),
    };
  });

  const behavioralTraits = templateData?.behavioral_traits ?? [];

  // ── Inline score cell editing ──────────────────────────────────────────────
  const openScoreCell = (subjectId, fieldName, maxScore, currentValue) => {
    if (!canEdit) { permNotify("You do not have permission to edit scores."); return; }
    setActiveCell({ subjectId, fieldName, maxScore });
    setCellValue(currentValue ?? "");
    setCellError("");
  };

  const handleCellChange = (value, maxScore) => {
    setCellValue(value);
    const num = Number(value);
    if (value !== "" && (num > maxScore || num < 0)) {
      setCellError(`Max is ${maxScore}`);
    } else {
      setCellError("");
    }
  };

  const commitScoreCell = async () => {
    if (!activeCell || cellError) return;
    const row = tableRows.find((r) => r.subject_id === activeCell.subjectId);
    if (!row) { setActiveCell(null); return; }

    // No change — close silently
    const prev = row.scores?.[activeCell.fieldName] ?? "";
    const newVal = cellValue === "" ? null : Number(cellValue);
    if (String(cellValue) === String(prev === null ? "" : prev)) {
      setActiveCell(null);
      return;
    }

    // Close input immediately
    const savedCell = { ...activeCell };
    setActiveCell(null);

    // Optimistic update in local state
    const optimisticScores = { ...(row.scores ?? {}), [savedCell.fieldName]: newVal };
    setScoreOverrides((prev) => ({
      ...prev,
      [savedCell.subjectId]: { ...(prev[savedCell.subjectId] ?? {}), [savedCell.fieldName]: newVal },
    }));

    // Show per-cell spinner
    const cellKey = `${savedCell.subjectId}:${savedCell.fieldName}`;
    setSavingCells((prev) => new Set(prev).add(cellKey));

    const res = await saveScore(studentId, subseasion, savedCell.subjectId, optimisticScores, row.hasExisting);

    // Remove spinner
    setSavingCells((prev) => { const s = new Set(prev); s.delete(cellKey); return s; });

    if (res?.success) {
      addNotification("Score updated successfully", "success");
      // If this was a newly created record (POST), mark the subject as hasExisting
      // so subsequent saves for other fields on the same subject use PATCH
      if (!row.hasExisting) {
        setHasExistingOverrides((prev) => new Set(prev).add(savedCell.subjectId));
      }
    } else {
      // Roll back optimistic update
      setScoreOverrides((prev) => {
        const next = { ...prev };
        if (next[savedCell.subjectId]) {
          delete next[savedCell.subjectId][savedCell.fieldName];
          if (Object.keys(next[savedCell.subjectId]).length === 0) delete next[savedCell.subjectId];
        }
        return next;
      });
      addNotification(res?.message || "Failed to save score", "error");
    }
  };

  // ── Inline trait cell editing ──────────────────────────────────────────────
  const openTraitCell = (traitName) => {
    if (!canEdit) { permNotify("You do not have permission to edit traits."); return; }
    setActiveTrait(traitName);
    // Use override value if present, otherwise server value
    setTraitCellValue(traitOverrides[traitName] !== undefined ? traitOverrides[traitName] : (traitScore?.traits?.[traitName] ?? ""));
  };

  const commitTraitCell = async (traitName, value) => {
    if (!traitName) return;

    const currentVal = traitOverrides[traitName] !== undefined ? traitOverrides[traitName] : (traitScore?.traits?.[traitName] ?? "");
    if (value === currentVal) {
      setActiveTrait(null);
      return;
    }

    // Close select immediately
    setActiveTrait(null);

    // Optimistic update
    setTraitOverrides((prev) => ({ ...prev, [traitName]: value || null }));

    // Show per-trait spinner
    setSavingTraits((prev) => new Set(prev).add(traitName));

    const allTraits = { ...(traitScore?.traits ?? {}), ...traitOverrides, [traitName]: value || null };
    const res = await saveTraitScore(studentId, subseasion, { traits: allTraits });

    // Remove spinner
    setSavingTraits((prev) => { const s = new Set(prev); s.delete(traitName); return s; });

    if (res?.success) {
      addNotification("Trait updated successfully", "success");
    } else {
      // Roll back
      setTraitOverrides((prev) => {
        const next = { ...prev };
        delete next[traitName];
        return next;
      });
      addNotification(res?.message || "Failed to save trait", "error");
    }
  };

  const openRemarkPanel = () => {
    if (!canEdit) { permNotify("You do not have permission to edit remarks."); return; }
    setEditTeacherRemark(reportCard?.teacher_remark ?? "");
    setEditPrincipalRemark(reportCard?.principal_remark ?? "");
    setRemarkPanel(true);
  };

  const handleSaveRemarks = async () => {
    setSaving(true);
    await saveReportCard(studentId, subseasion, { teacher_remark: editTeacherRemark, principal_remark: editPrincipalRemark });
    setSaving(false);
    setRemarkPanel(false);
    reload();
  };

  const handleTogglePublish = async (value) => {
    if (!canEdit) { permNotify("You do not have permission to publish report cards."); return; }
    setPublishing(true);
    await saveReportCard(studentId, subseasion, { is_published: value });
    setPublishing(false);
    setPublishPanel(false);
    reload();
  };

  const handleSendResultEmail = async () => {
    if (!reportCard?.is_published) {
      addNotification("Publish the report card before sending email", "error");
      return;
    }
    if (!canEdit) {
      permNotify("You do not have permission to send result emails.");
      return;
    }
    setSendingEmail(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subseasion}/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modified_by: user?.admin?.admin_id || user?.user_id }),
        }
      );
      const data = await res.json();
      if (data.success) {
        addNotification(data.message || "Result email sent", "success");
      } else {
        addNotification(data.message || "Failed to send result email", "error");
      }
    } catch {
      addNotification("Failed to send result email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const grandTotal = tableRows.reduce((sum, row) => {
    if (!row.scores) return sum;
    return sum + gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0);
  }, 0);

  const rankings = classAverage?.student_rankings ?? [];
  const classPos = rankings.findIndex((r) => r.student_id === studentId) + 1;

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    const school = user?.school || {};
    const studentName = previewData?.student?.studentName
      || subsessionData?.student_name
      || classData?.student_name
      || "Student";
    const className   = classData?.class_name || previewData?.student?.class || "—";
    const sessionName = classData?.session_name || subsessionData?.session_name || previewData?.student?.session || "—";
    const termName    = subsessionData?.term_name || classData?.subsession_name || previewData?.student?.term || "—";
    const profileImg  = previewData?.student?.profileImg || null;

    const rankings  = classAverage?.student_rankings ?? [];
    const classPosN = rankings.findIndex((r) => r.student_id === studentId) + 1;

    // Merge local score overrides into tableRows for export
    const exportRows = tableRows.map((row) => ({
      ...row,
      scores: row.scores
        ? { ...row.scores, ...(scoreOverrides[row.subject_id] ?? {}) }
        : (scoreOverrides[row.subject_id] ? { ...scoreOverrides[row.subject_id] } : null),
      position: subjectPositions?.[row.subject_id]
        ? String(subjectPositions[row.subject_id])
        : "—",
    }));

    const exportGrandTotal = exportRows.reduce((sum, row) => {
      if (!row.scores) return sum;
      return sum + gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0);
    }, 0);

    // Merge local trait overrides
    const exportTraitScores = { ...(traitScore?.traits ?? {}), ...traitOverrides };

    const tpl = previewData?.template || templateData;
    if (tpl) {
      const resolved = await resolveReportExportTemplate(tpl, school);
      if (resolved?.htmlTemplate) {
        await exportReportHtml({
          htmlTemplate: resolved.htmlTemplate,
          themeCss:     resolved.themeCss,
          template:     tpl,
          school,
          studentData: {
            studentName,
            class:          className,
            session:        sessionName,
            term:           termName,
            admissionId:    previewData?.student?.admissionId ?? "—",
            position:       classPosN > 0 ? `${classPosN} / ${rankings.length}` : "—",
            gender:         previewData?.student?.gender ?? "—",
            dob:            previewData?.student?.dob    ?? "—",
            profileImg,
            teacherRemark:   reportCard?.teacher_remark   ?? "",
            principalRemark: reportCard?.principal_remark ?? "",
            attendance:      previewData?.student?.attendance ?? null,
          },
          tableRows:         exportRows,
          traitScores:       exportTraitScores,
          classAverage,
          classPos:          classPosN,
          totalStudents:     rankings.length,
          grandTotal:        exportGrandTotal,
          subjectPositions,
        });
        return;
      }
    }

    // ── Fallback: jsPDF programmatic export ───────────────────────────────────
    exportReportPDF({
      studentName,
      className,
      sessionName,
      termName,
      profileImg,
      school,
      gradingFields,
      gradingScheme,
      behavioralTraits,
      traitScores: exportTraitScores,
      tableRows: exportRows,
      subjectPositions,
      grandTotal: exportGrandTotal,
      classAverage,
      classPos: classPosN,
      totalStudents: rankings.length,
      reportCard,
    });
  };

  return (
    <InnerTabCon>
      <div className="rsi-wrap">

        {loading && <LoadingData message="Loading report..." />}

        {!loading && (<>

          {/* Top action bar */}
          <div className="rsi-topbar">
            <div className="rsi-topbar-left">
              {classAverage && (
                <div className="rsi-stat-pill">
                  <span className="rsi-stat-label">Class Avg</span>
                  <span className="rsi-stat-value">{classAverage.average}%</span>
                </div>
              )}
              {classPos > 0 && (
                <div className="rsi-stat-pill">
                  <span className="rsi-stat-label">Position</span>
                  <span className="rsi-stat-value">{classPos} / {rankings.length}</span>
                </div>
              )}
              {classAverage && (
                <div className="rsi-stat-pill">
                  <span className="rsi-stat-label">Students</span>
                  <span className="rsi-stat-value">{classAverage.student_count}</span>
                </div>
              )}
            </div>
            <div className="rsi-topbar-right">
              {reportCard ? (
                <button className="rsi-btn rsi-btn-outline" onClick={handleExportPDF}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Export PDF
                </button>
              ) : (
                <button className="rsi-btn rsi-btn-create" onClick={openCreatePanel} disabled={creating}>
                  {creating ? "Creating..." : "Create Report Card"}
                </button>
              )}
              {reportCard?.is_published && (
                <button
                  className="rsi-btn rsi-btn-outline"
                  onClick={handleSendResultEmail}
                  disabled={sendingEmail}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="M4 7.5 12 13l8-5.5"/>
                  </svg>
                  {sendingEmail ? "Sending..." : "Send Email"}
                </button>
              )}
              <button
                className={`rsi-btn ${reportCard?.is_published ? "rsi-btn-published" : "rsi-btn-unpublished"}`}
                onClick={() => { if (!canEdit) { permNotify("You do not have permission to publish report cards."); return; } setPublishPanel(true); }}
              >
                <span className={`rsi-dot ${reportCard?.is_published ? "rsi-dot-green" : "rsi-dot-grey"}`} />
                {reportCard?.is_published ? "Published" : "Not Published"}
              </button>
            </div>
          </div>

          {/* No report notice */}
          {!reportCard && (
            <div className="rsi-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              No report card has been created for this student yet. Click "Create Report Card" to get started.
            </div>
          )}

          {/* Scores section */}
          <div className="rsi-section">
            <div className="rsi-section-header">
              <span className="rsi-section-title">Academic Scores</span>
              <span className="rsi-section-sub">Double-click a score cell to edit</span>
            </div>
            <div className="rsi-table-wrap">
              <table className="rsi-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    {gradingFields.map((f) => <th key={f.field_name}>{f.field_name}<span className="rsi-th-max">/{f.max_score}</span></th>)}
                    <th>Total</th>
                    <th>Grade</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => {
                    const total = row.scores ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0) : null;
                    return (
                      <tr key={row.subject_id}>
                        <td className="rsi-subject-cell">{row.subject_name}</td>
                        {gradingFields.map((f) => {
                          const isActive = activeCell?.subjectId === row.subject_id && activeCell?.fieldName === f.field_name;
                          const cellKey = `${row.subject_id}:${f.field_name}`;
                          const isSaving = savingCells.has(cellKey);
                          const displayVal = row.scores ? (row.scores[f.field_name] ?? "—") : "—";
                          return (
                            <td
                              key={f.field_name}
                              className={`rsi-score-cell rsi-editable-cell${isActive ? " rsi-cell-active" : ""}`}
                              onDoubleClick={() => openScoreCell(row.subject_id, f.field_name, f.max_score, row.scores?.[f.field_name])}
                              onTouchEnd={(e) => tapTracker.current(`score:${row.subject_id}:${f.field_name}`, () => openScoreCell(row.subject_id, f.field_name, f.max_score, row.scores?.[f.field_name]), e)}
                              title="Double-tap to edit"
                            >
                              {isActive ? (
                                <div className="rsi-inline-edit-wrap">
                                  <input
                                    className={`rsi-inline-input${cellError ? " rsi-input-error" : ""}`}
                                    type="number"
                                    min="0"
                                    max={f.max_score}
                                    value={cellValue}
                                    autoFocus
                                    onChange={(e) => handleCellChange(e.target.value, f.max_score)}
                                    onBlur={commitScoreCell}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { e.target.blur(); }
                                      if (e.key === "Escape") { setActiveCell(null); }
                                    }}
                                  />
                                  {cellError && <span className="rsi-inline-error">{cellError}</span>}
                                </div>
                              ) : (
                                <span className="rsi-cell-display">
                                  {displayVal}
                                  {isSaving && <span className="rsi-cell-spinner" />}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="rsi-total-cell">{total ?? "—"}</td>
                        <td>{total !== null ? <span className="rsi-grade-badge">{getGrade(total)}</span> : "—"}</td>
                        <td className="rsi-pos-cell">{subjectPositions[row.subject_id] ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="rsi-tfoot">
                    <td colSpan={gradingFields.length + 1} className="rsi-tfoot-label">Grand Total</td>
                    <td className="rsi-tfoot-val">{grandTotal}</td>
                    <td /><td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Behavioral Traits + Remarks side by side */}
          {(behavioralTraits.length > 0 || reportCard) && (
            <div className="rsi-section-remarks-row">

              {/* Behavioral Traits */}
              {behavioralTraits.length > 0 && (
                <div className="rsi-section">
                  <div className="rsi-section-header">
                    <span className="rsi-section-title">Behavioral Traits</span>
                    <span className="rsi-section-sub">Double-click a rating to edit</span>
                  </div>
                  <div className="rsi-table-wrap">
                    <table className="rsi-table">
                      <thead>
                        <tr><th>Trait</th><th>Rating</th></tr>
                      </thead>
                      <tbody>
                        {behavioralTraits.map((trait) => {
                          const isActive = activeTrait === trait;
                          const isSaving = savingTraits.has(trait);
                          const currentRating = traitOverrides[trait] !== undefined
                            ? traitOverrides[trait]
                            : (traitScore?.traits?.[trait] ?? "");
                          return (
                            <tr key={trait}>
                              <td className="rsi-subject-cell">{trait}</td>
                              <td
                                className={`rsi-editable-cell${isActive ? " rsi-cell-active" : ""}`}
                                onDoubleClick={() => openTraitCell(trait)}
                                onTouchEnd={(e) => tapTracker.current(`trait:${trait}`, () => openTraitCell(trait), e)}
                                title="Double-tap to edit"
                              >
                                {isActive ? (
                                  <select
                                    className="rsi-inline-select"
                                    value={traitCellValue}
                                    autoFocus
                                    onChange={(e) => setTraitCellValue(e.target.value)}
                                    onBlur={() => commitTraitCell(trait, traitCellValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") { e.target.blur(); }
                                      if (e.key === "Escape") { setActiveTrait(null); }
                                    }}
                                  >
                                    <option value="">— Select —</option>
                                    <option value="Excellent">Excellent</option>
                                    <option value="Very Good">Very Good</option>
                                    <option value="Good">Good</option>
                                    <option value="Needs Improvement">Needs Improvement</option>
                                  </select>
                                ) : (
                                  <span className="rsi-cell-display">
                                    {currentRating
                                      ? <span className="rsi-trait-badge">{currentRating}</span>
                                      : <span className="rsi-empty">Not set</span>}
                                    {isSaving && <span className="rsi-cell-spinner" />}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {reportCard && (
                <div className="rsi-remarks-row">
                  <div className="rsi-remark-card">
                    <div className="rsi-remark-header">
                      <span className="rsi-remark-title">Teacher's Remark</span>
                      <button className="rsi-edit-btn" onClick={openRemarkPanel}>
                        {reportCard?.teacher_remark ? "Edit" : "Add"}
                      </button>
                    </div>
                    <p className={`rsi-remark-text ${!reportCard?.teacher_remark ? "rsi-remark-empty" : ""}`}>
                      {reportCard?.teacher_remark ?? "No remark added yet"}
                    </p>
                  </div>
                  <div className="rsi-remark-card">
                    <div className="rsi-remark-header">
                      <span className="rsi-remark-title">Principal's Remark</span>
                      <button className="rsi-edit-btn" onClick={openRemarkPanel}>
                        {reportCard?.principal_remark ? "Edit" : "Add"}
                      </button>
                    </div>
                    <p className={`rsi-remark-text ${!reportCard?.principal_remark ? "rsi-remark-empty" : ""}`}>
                      {reportCard?.principal_remark ?? "No remark added yet"}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Subjects on Report */}
          {reportCard?.subjects?.length > 0 && (
            <div className="rsi-section">
              <div className="rsi-section-header">
                <span className="rsi-section-title">Subjects on Report </span>
                <button className="rsi-edit-btn" onClick={openAddSubjectPanel}>+ Add Subject</button>
              </div>
              <div className="rsi-table-wrap">
                <table className="rsi-table">
                  <thead>
                    <tr><th>Subject Name</th><th>Code</th><th></th></tr>
                  </thead>
                  <tbody>
                    {reportCard.subjects.map((s) => (
                      <tr key={s.subject_id}>
                        <td className="rsi-subject-cell">{s.subject_name}</td>
                        <td>{s.subject_code}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleRemoveSubject(s.subject_id)}
                            style={{
                              background: "none", border: "none", color: "#ef4444",
                              cursor: "pointer", fontSize: 13, padding: "2px 6px",
                            }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>)}

        {/* Preview Modal */}
        {previewOpen && (
          <div className="rsi-modal-overlay" onClick={() => setPreviewOpen(false)}>
            <div className="rsi-modal" onClick={(e) => e.stopPropagation()}>
              <div className="rsi-modal-header">
                <span className="rsi-modal-title">Report Card Preview</span>
                <button className="rsi-modal-close" onClick={() => setPreviewOpen(false)}>✕</button>
              </div>
              <div className="rsi-modal-body">
                {previewData
                  ? <ReportCardPreview template={previewData.template} student={previewData.student} />
                  : <p style={{ padding: "24px", color: "#6b7280" }}>Loading preview...</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* Remark edit panel */}
        <SlideInMenu isShow={remarkPanel} onClose={() => setRemarkPanel(false)} width="480px">
          <div className="rsi-panel-body">
            <h2 className="rsi-panel-title">Remarks</h2>
            <div className="rsi-panel-fields">
              <div className="rsi-field-row">
                <label className="rsi-field-label">Teacher's Remark</label>
                <textarea value={editTeacherRemark} onChange={(e) => setEditTeacherRemark(e.target.value)} rows={4} placeholder="Enter teacher's remark..." className="rsi-textarea" />
              </div>
              <div className="rsi-field-row">
                <label className="rsi-field-label">Principal's Remark</label>
                <textarea value={editPrincipalRemark} onChange={(e) => setEditPrincipalRemark(e.target.value)} rows={4} placeholder="Enter principal's remark..." className="rsi-textarea" />
              </div>
            </div>
            <div className="rsi-panel-actions">
              <Button variant="secondary" onClick={() => setRemarkPanel(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSaveRemarks} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Add Subject to Report Card panel */}
        <SlideInMenu isShow={addSubjectPanel} onClose={() => setAddSubjectPanel(false)} width="440px">
          <div className="rsi-panel-body">
            <h2 className="rsi-panel-title">Add Subject to Report Card</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
              Select subjects to add. Already included subjects are not shown.
            </p>
            {(() => {
              const existing = new Set((reportCard?.subjects || []).map((s) => s.subject_id));
              const available = classSubjects.filter((s) => !existing.has(s.subject_id));
              if (available.length === 0) return (
                <p style={{ color: "#f59e0b", fontSize: 13, marginBottom: 16 }}>
                  All class subjects are already on the report card.
                </p>
              );
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {available.map((s) => {
                    const checked = subjectPanelSelected.some((x) => x.subject_id === s.subject_id);
                    return (
                      <label
                        key={s.subject_id}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 12px", borderRadius: 8, cursor: "pointer",
                          border: `1px solid ${checked ? "#6ee7b7" : "#e5e7eb"}`,
                          background: checked ? "rgba(16,185,129,0.05)" : "#fafafa",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddSubject(s.subject_id)}
                          style={{ width: 16, height: 16, cursor: "pointer" }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{s.subject_name}</span>
                        {s.subject_code && s.subject_code !== "—" && (
                          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: "auto" }}>{s.subject_code}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              );
            })()}
            <div className="rsi-panel-actions">
              <Button variant="secondary" onClick={() => setAddSubjectPanel(false)} disabled={addingSubject}>Cancel</Button>
              <Button onClick={handleAddSubjects} disabled={addingSubject || subjectPanelSelected.length === 0}>
                {addingSubject ? "Adding..." : `Add ${subjectPanelSelected.length} Subject${subjectPanelSelected.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Create Report Card panel */}
        <SlideInMenu isShow={createPanel} onClose={() => setCreatePanel(false)} width="440px">
          <div className="rsi-panel-body">
            <h2 className="rsi-panel-title">Create Report Card</h2>
            <div className="rsi-panel-fields">
              <p className="rsi-panel-desc">
                The report card will be created with the following subjects. Uncheck any you want to exclude.
              </p>
              {classSubjects.length === 0 ? (
                <p className="rsi-panel-warn">No subjects found for this class.</p>
              ) : (
                <div className="rsi-subject-list">
                  {classSubjects.map((s) => {
                    const checked = selectedSubjects.some((x) => x.subject_id === s.subject_id);
                    return (
                      <label key={s.subject_id} className={`rsi-subject-item ${checked ? "checked" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(s.subject_id)}
                          className="rsi-subject-checkbox"
                        />
                        <span className="rsi-subject-name">{s.subject_name}</span>
                        {s.subject_code && s.subject_code !== "—" && (
                          <span className="rsi-subject-code">{s.subject_code}</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedSubjects.length === 0 && classSubjects.length > 0 && (
                <p className="rsi-panel-error">Select at least one subject.</p>
              )}
            </div>
            <div className="rsi-panel-actions">
              <Button variant="secondary" onClick={() => setCreatePanel(false)} disabled={creating}>Cancel</Button>
              <Button onClick={handleCreateReport} disabled={creating || selectedSubjects.length === 0}>
                {creating ? "Creating..." : `Create with ${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Publish panel */}
        <SlideInMenu isShow={publishPanel} onClose={() => setPublishPanel(false)} width="420px">
          <div className="rsi-panel-body">
            <h2 className="rsi-panel-title">
              {reportCard?.is_published ? "Unpublish Report Card" : "Publish Report Card"}
            </h2>
            <div className="rsi-panel-fields">
              <p className="rsi-panel-desc">
                {reportCard?.is_published
                  ? "This report card is currently visible to students and guardians. Unpublishing will hide it."
                  : "Publishing makes this report card visible. Make sure all scores and remarks are complete before publishing."}
              </p>

              <div className="rsi-publish-checklist">
                <div className="rsi-checklist-item">
                  <span className={`rsi-check-dot ${reportCard?.is_published ? "green" : "grey"}`} />
                  <span className="rsi-check-label">Status</span>
                  <span className={reportCard?.is_published ? "rsi-status-green" : "rsi-status-grey"}>
                    {reportCard?.is_published ? "Published" : "Not Published"}
                  </span>
                </div>
                {reportCard?.updated_at && (
                  <div className="rsi-checklist-item">
                    <span className="rsi-check-dot grey" />
                    <span className="rsi-check-label">Last Updated</span>
                    <span className="rsi-check-val">{new Date(reportCard.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="rsi-checklist-item">
                  <span className={`rsi-check-dot ${reportCard?.teacher_remark ? "green" : "red"}`} />
                  <span className="rsi-check-label">Teacher's Remark</span>
                  <span className={reportCard?.teacher_remark ? "rsi-status-green" : "rsi-status-red"}>
                    {reportCard?.teacher_remark ? "Added" : "Missing"}
                  </span>
                </div>
                <div className="rsi-checklist-item">
                  <span className={`rsi-check-dot ${reportCard?.principal_remark ? "green" : "red"}`} />
                  <span className="rsi-check-label">Principal's Remark</span>
                  <span className={reportCard?.principal_remark ? "rsi-status-green" : "rsi-status-red"}>
                    {reportCard?.principal_remark ? "Added" : "Missing"}
                  </span>
                </div>
              </div>
            </div>

            <div className="rsi-panel-actions">
              <Button variant="secondary" onClick={() => setPublishPanel(false)} disabled={publishing}>Cancel</Button>
              {reportCard?.is_published
                ? <button className="rsi-btn-danger" onClick={() => handleTogglePublish(false)} disabled={publishing}>{publishing ? "Saving..." : "Unpublish"}</button>
                : <Button onClick={() => handleTogglePublish(true)} disabled={publishing}>{publishing ? "Saving..." : "Publish"}</Button>
              }
            </div>
          </div>
        </SlideInMenu>

      </div>
    </InnerTabCon>
  );
};

export default ReportStudentInfo;
