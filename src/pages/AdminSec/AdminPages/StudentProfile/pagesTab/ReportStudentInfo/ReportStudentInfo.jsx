import { useEffect, useState } from "react";
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
import jsPDF from "jspdf";

const ReportStudentInfo = () => {
  const { subseasion, studentId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();

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

  const [selectedRow, setSelectedRow] = useState(null);
  const [editScores, setEditScores] = useState({});
  const [scoreErrors, setScoreErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [selectedTrait, setSelectedTrait] = useState(null);
  const [editTraitValue, setEditTraitValue] = useState("");

  const [remarkPanel, setRemarkPanel] = useState(false);
  const [editTeacherRemark, setEditTeacherRemark] = useState("");
  const [editPrincipalRemark, setEditPrincipalRemark] = useState("");

  const [publishPanel, setPublishPanel] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
    return { subject_id: subject.subject_id, subject_name: subject.subject_name, scores: score?.scores ?? null, hasExisting: !!score };
  });

  const openRow = (row) => {
    if (!canEdit) { permNotify("You do not have permission to edit scores."); return; }
    setSelectedRow(row);
    setScoreErrors({});
    const init = {};
    gradingFields.forEach((f) => { init[f.field_name] = row.scores?.[f.field_name] ?? ""; });
    setEditScores(init);
  };

  const handleScoreChange = (fieldName, maxScore, value) => {
    setEditScores((p) => ({ ...p, [fieldName]: value }));
    const num = Number(value);
    if (value !== "" && (num > maxScore || num < 0)) {
      setScoreErrors((p) => ({ ...p, [fieldName]: `Max is ${maxScore}` }));
    } else {
      setScoreErrors((p) => { const n = { ...p }; delete n[fieldName]; return n; });
    }
  };

  const hasErrors = Object.keys(scoreErrors).length > 0;

  const handleSave = async () => {
    if (hasErrors) return;
    setSaving(true);
    const scores = {};
    gradingFields.forEach((f) => { scores[f.field_name] = editScores[f.field_name] === "" ? null : Number(editScores[f.field_name]); });
    await saveScore(studentId, subseasion, selectedRow.subject_id, scores, selectedRow.hasExisting);
    setSaving(false);
    setSelectedRow(null);
    reload();
  };

  const behavioralTraits = templateData?.behavioral_traits ?? [];

  const openTrait = (name) => {
    if (!canEdit) { permNotify("You do not have permission to edit traits."); return; }
    setSelectedTrait({ name, value: traitScore?.traits?.[name] ?? "" });
    setEditTraitValue(traitScore?.traits?.[name] ?? "");
  };

  const handleSaveTrait = async () => {
    setSaving(true);
    const updatedTraits = { ...(traitScore?.traits ?? {}), [selectedTrait.name]: editTraitValue || null };
    await saveTraitScore(studentId, subseasion, { traits: updatedTraits });
    setSaving(false);
    setSelectedTrait(null);
    reload();
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

  const grandTotal = tableRows.reduce((sum, row) => {
    if (!row.scores) return sum;
    return sum + gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0);
  }, 0);

  const rankings = classAverage?.student_rankings ?? [];
  const classPos = rankings.findIndex((r) => r.student_id === studentId) + 1;

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const col2 = pageW / 2;
    let y = 0;

    const school = user?.school || {};
    const studentName = subsessionData?.student_name || classData?.student_name || "Student";
    const className   = classData?.class_name || "—";
    const sessionName = classData?.session_name || subsessionData?.session_name || "—";
    const termName    = subsessionData?.term_name || classData?.subsession_name || "—";

    // ── Header band ──────────────────────────────────────────────────────────
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setDrawColor(229, 231, 235);
    doc.line(0, 38, pageW, 38);

    // School logo placeholder circle
    if (school.logo_url && typeof school.logo_url === "string") {
      try { doc.addImage(school.logo_url, "JPEG", margin, 6, 22, 22); } catch {}
    } else {
      doc.setFillColor(240, 240, 240);
      doc.circle(margin + 11, 17, 11, "F");
      doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text("LOGO", margin + 11, 18, { align: "center" });
    }

    doc.setTextColor(17, 17, 17);
    doc.setFontSize(13); doc.setFont("helvetica", "bold");
    doc.text(school.school_name || "School Name", margin + 28, 14);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
    doc.text(school.address || "", margin + 28, 20);
    doc.text(`${school.phone_number || ""}  ${school.email || ""}`, margin + 28, 26);

    doc.setTextColor(17, 17, 17); doc.setFontSize(9); doc.setFont("helvetica", "bold");
    doc.text("STUDENT REPORT CARD", pageW - margin, 14, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`${sessionName}  ·  ${termName}`, pageW - margin, 21, { align: "right" });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 28, { align: "right" });

    y = 46;

    // ── Student info card ────────────────────────────────────────────────────
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, "F");
    doc.setDrawColor(229, 231, 235); doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, "S");

    const infoItems = [
      ["Student", studentName],
      ["Class", className],
      ["Session", sessionName],
      ["Term", termName],
      ["Class Avg", classAverage ? `${classAverage.average}%` : "—"],
      ["Position", classPos > 0 ? `${classPos} / ${rankings.length}` : "—"],
    ];
    const colW = (pageW - margin * 2) / 3;
    infoItems.forEach(([label, value], i) => {
      const cx = margin + 6 + (i % 3) * colW;
      const cy = y + 8 + Math.floor(i / 3) * 12;
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150, 150, 150);
      doc.text(label.toUpperCase(), cx, cy);
      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
      doc.text(String(value), cx, cy + 5);
    });

    y += 36;

    // ── Scores table ─────────────────────────────────────────────────────────
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text("Academic Scores", margin, y); y += 6;

    // Table header
    const fieldCols = gradingFields.map((f) => ({ name: f.field_name, max: f.max_score }));
    const subjectColW = 52;
    const scoreColW   = Math.min(18, (pageW - margin * 2 - subjectColW - 24 - 16 - 16) / Math.max(fieldCols.length, 1));
    const totalColW   = 20; const gradeColW = 14; const posColW = 14;

    doc.setFillColor(17, 17, 17);
    doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    let cx = margin + 3;
    doc.text("SUBJECT", cx, y + 5); cx += subjectColW;
    fieldCols.forEach((f) => { doc.text(`${f.name}/${f.max}`, cx, y + 5, { maxWidth: scoreColW - 1 }); cx += scoreColW; });
    doc.text("TOTAL", cx, y + 5); cx += totalColW;
    doc.text("GRADE", cx, y + 5); cx += gradeColW;
    doc.text("POS", cx, y + 5);
    y += 7;

    tableRows.forEach((row, idx) => {
      const total = row.scores ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0) : null;
      const grade = total !== null ? getGrade(total) : "—";
      const pos   = subjectPositions[row.subject_id] ?? "—";

      if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, pageW - margin * 2, 6.5, "F"); }
      doc.setTextColor(17, 17, 17); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      cx = margin + 3;
      doc.text(row.subject_name, cx, y + 4.5, { maxWidth: subjectColW - 2 }); cx += subjectColW;
      fieldCols.forEach((f) => {
        const v = row.scores ? (row.scores[f.field_name] ?? "—") : "—";
        doc.text(String(v), cx, y + 4.5); cx += scoreColW;
      });
      doc.setFont("helvetica", "bold");
      doc.text(total !== null ? String(total) : "—", cx, y + 4.5); cx += totalColW;
      doc.text(grade, cx, y + 4.5); cx += gradeColW;
      doc.text(String(pos), cx, y + 4.5);
      doc.setFont("helvetica", "normal");
      y += 6.5;
    });

    // Grand total row
    doc.setFillColor(17, 17, 17); doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    cx = margin + 3;
    doc.text("GRAND TOTAL", cx, y + 5); cx += subjectColW + fieldCols.length * scoreColW;
    doc.text(String(grandTotal), cx, y + 5);
    y += 14;

    // ── Behavioral Traits ────────────────────────────────────────────────────
    if (behavioralTraits.length > 0 && traitScore?.traits) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
      doc.text("Behavioral Traits", margin, y); y += 6;

      const traitColW = (pageW - margin * 2) / 2 - 4;
      behavioralTraits.forEach((trait, i) => {
        const tx = margin + (i % 2) * (traitColW + 8);
        if (i % 2 === 0 && i > 0) y += 7;
        if (i === 0 || i % 2 === 0) {
          if (i % 2 === 0) {
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(tx, y, traitColW, 6, 2, 2, "F");
          }
        }
        const rating = traitScore.traits[trait] || "—";
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
        doc.text(trait, tx + 3, y + 4.2);
        doc.setFont("helvetica", "bold");
        doc.text(rating, tx + traitColW - 3, y + 4.2, { align: "right" });
        doc.setFont("helvetica", "normal");
        if (i % 2 === 1) y += 7;
      });
      if (behavioralTraits.length % 2 !== 0) y += 7;
      y += 6;
    }

    // ── Remarks ──────────────────────────────────────────────────────────────
    if (reportCard?.teacher_remark || reportCard?.principal_remark) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
      doc.text("Remarks", margin, y); y += 6;

      const remarkW = (pageW - margin * 2 - 8) / 2;
      [["Teacher's Remark", reportCard.teacher_remark], ["Principal's Remark", reportCard.principal_remark]].forEach(([label, text], i) => {
        const rx = margin + i * (remarkW + 8);
        doc.setFillColor(249, 250, 251); doc.roundedRect(rx, y, remarkW, 22, 3, 3, "F");
        doc.setDrawColor(229, 231, 235); doc.roundedRect(rx, y, remarkW, 22, 3, 3, "S");
        doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150, 150, 150);
        doc.text(label.toUpperCase(), rx + 4, y + 6);
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
        const lines = doc.splitTextToSize(text || "—", remarkW - 8);
        doc.text(lines.slice(0, 2), rx + 4, y + 13);
      });
      y += 28;
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFillColor(17, 17, 17); doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(school.school_name || "", margin, pageH - 5);
    doc.text(`${sessionName}  ·  ${termName}`, col2, pageH - 5, { align: "center" });
    doc.text(`Page 1`, pageW - margin, pageH - 5, { align: "right" });

    doc.save(`report_${studentName.replace(/\s+/g, "_")}_${termName}.pdf`);
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
              <span className="rsi-section-sub">Click a row to edit scores</span>
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
                      <tr key={row.subject_id} onClick={() => openRow(row)}>
                        <td className="rsi-subject-cell">{row.subject_name}</td>
                        {gradingFields.map((f) => <td key={f.field_name} className="rsi-score-cell">{row.scores ? (row.scores[f.field_name] ?? "—") : "—"}</td>)}
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

          {/* Behavioral Traits */}
          {behavioralTraits.length > 0 && (
            <div className="rsi-section">
              <div className="rsi-section-header">
                <span className="rsi-section-title">Behavioral Traits</span>
                <span className="rsi-section-sub">Click a row to edit</span>
              </div>
              <div className="rsi-table-wrap">
                <table className="rsi-table">
                  <thead>
                    <tr><th>Trait</th><th>Rating</th></tr>
                  </thead>
                  <tbody>
                    {behavioralTraits.map((trait) => (
                      <tr key={trait} onClick={() => openTrait(trait)}>
                        <td className="rsi-subject-cell">{trait}</td>
                        <td>
                          {traitScore?.traits?.[trait]
                            ? <span className="rsi-trait-badge">{traitScore.traits[trait]}</span>
                            : <span className="rsi-empty">Not set</span>}
                        </td>
                      </tr>
                    ))}
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

        {/* Score edit panel */}
        <SlideInMenu isShow={!!selectedRow} onClose={() => setSelectedRow(null)} width="420px">
          {selectedRow && (
            <div className="rsi-panel-body">
              <h2 className="rsi-panel-title">{selectedRow.subject_name}</h2>
              <div className="rsi-panel-fields">
                {gradingFields.map((f) => {
                  const isError = !!scoreErrors[f.field_name];
                  return (
                    <div key={f.field_name} className="rsi-field-row">
                      <label className="rsi-field-label">{f.field_name} <span className="rsi-field-max">(max {f.max_score})</span></label>
                      <input
                        type="number" min="0" max={f.max_score}
                        value={editScores[f.field_name] ?? ""}
                        onChange={(e) => handleScoreChange(f.field_name, f.max_score, e.target.value)}
                        className={`rsi-input ${isError ? "rsi-input-error" : ""}`}
                      />
                      {isError && <p className="rsi-error-msg">{scoreErrors[f.field_name]}</p>}
                    </div>
                  );
                })}
              </div>
              <div className="rsi-panel-actions">
                <Button variant="secondary" onClick={() => setSelectedRow(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || hasErrors}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          )}
        </SlideInMenu>

        {/* Trait edit panel */}
        <SlideInMenu isShow={!!selectedTrait} onClose={() => setSelectedTrait(null)} width="420px">
          {selectedTrait && (
            <div className="rsi-panel-body">
              <h2 className="rsi-panel-title">{selectedTrait.name}</h2>
              <div className="rsi-panel-fields">
                <div className="rsi-field-row">
                  <label className="rsi-field-label">Rating</label>
                  <select value={editTraitValue} onChange={(e) => setEditTraitValue(e.target.value)} className="rsi-select">
                    <option value="">— Select —</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                </div>
              </div>
              <div className="rsi-panel-actions">
                <Button variant="secondary" onClick={() => setSelectedTrait(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleSaveTrait} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </div>
          )}
        </SlideInMenu>

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
