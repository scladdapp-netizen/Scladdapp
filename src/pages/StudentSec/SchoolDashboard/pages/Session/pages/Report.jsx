import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStudentReport from "../../../../../../api_call/useStudentReport";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import jsPDF from "jspdf";
import "../../../../../AdminSec/AdminPages/StudentProfile/pagesTab/ReportStudentInfo/ReportStudentInfo.css";

const Report = () => {
  const { subseasion } = useParams();
  const { user } = useAuth();

  const studentId = user?.student?.student_id;
  const school    = user?.school || {};

  const {
    loading, fetchSubsession,
    templateData, studentScores, traitScore,
    classAverage, subjectPositions, reportCard,
    subsessionData, classData,
  } = useStudentReport(studentId);

  useEffect(() => {
    if (subseasion && studentId) fetchSubsession(subseasion, studentId);
  }, [subseasion, studentId]);

  const gradingFields  = templateData?.grading_fields  ?? [];
  const gradingScheme  = templateData?.grading_scheme  ?? [];
  const behavioralTraits = templateData?.behavioral_traits ?? [];
  const maxTotal = gradingFields.reduce((s, f) => s + Number(f.max_score), 0);

  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "";
    const pct = (total / maxTotal) * 100;
    const m = gradingScheme.find((g) => pct >= Number(g.min_range) && pct <= Number(g.max_range));
    return m ? m.grade_letter : "";
  };

  const subjectList = reportCard?.subjects?.length > 0 ? reportCard.subjects : [];
  const tableRows = subjectList.map((subject) => {
    const score = studentScores.find((s) => s.subject_id === subject.subject_id);
    return { subject_id: subject.subject_id, subject_name: subject.subject_name, scores: score?.scores ?? null };
  });

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
    let y = 0;

    const studentName = user?.student?.full_name || "Student";
    const className   = classData?.class_name || "—";
    const sessionName = classData?.session_name || "—";
    const termName    = subsessionData?.term_name || classData?.subsession_name || "—";

    // Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setDrawColor(229, 231, 235); doc.line(0, 38, pageW, 38);

    if (school.logo_url && typeof school.logo_url === "string") {
      try { doc.addImage(school.logo_url, "JPEG", margin, 6, 22, 22); } catch {}
    } else {
      doc.setFillColor(240, 240, 240); doc.circle(margin + 11, 17, 11, "F");
      doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "bold");
      doc.text("LOGO", margin + 11, 18, { align: "center" });
    }

    doc.setTextColor(17, 17, 17); doc.setFontSize(13); doc.setFont("helvetica", "bold");
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

    // Student info
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, "F");
    doc.setDrawColor(229, 231, 235); doc.roundedRect(margin, y, pageW - margin * 2, 28, 4, 4, "S");
    const infoItems = [
      ["Student", studentName], ["Class", className], ["Session", sessionName],
      ["Term", termName], ["Class Avg", classAverage ? `${classAverage.average}%` : "—"],
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

    // Scores table
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text("Academic Scores", margin, y); y += 6;
    const subjectColW = 52;
    const scoreColW = Math.min(18, (pageW - margin * 2 - subjectColW - 24 - 16 - 16) / Math.max(gradingFields.length, 1));
    const totalColW = 20; const gradeColW = 14; const posColW = 14;
    doc.setFillColor(17, 17, 17); doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    let cx = margin + 3;
    doc.text("SUBJECT", cx, y + 5); cx += subjectColW;
    gradingFields.forEach((f) => { doc.text(`${f.field_name}/${f.max_score}`, cx, y + 5, { maxWidth: scoreColW - 1 }); cx += scoreColW; });
    doc.text("TOTAL", cx, y + 5); cx += totalColW;
    doc.text("GRADE", cx, y + 5); cx += gradeColW;
    doc.text("POS", cx, y + 5);
    y += 7;
    tableRows.forEach((row, idx) => {
      const total = row.scores ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0) : null;
      if (idx % 2 === 0) { doc.setFillColor(249, 250, 251); doc.rect(margin, y, pageW - margin * 2, 6.5, "F"); }
      doc.setTextColor(17, 17, 17); doc.setFontSize(8); doc.setFont("helvetica", "normal");
      cx = margin + 3;
      doc.text(row.subject_name, cx, y + 4.5, { maxWidth: subjectColW - 2 }); cx += subjectColW;
      gradingFields.forEach((f) => { doc.text(String(row.scores ? (row.scores[f.field_name] ?? "—") : "—"), cx, y + 4.5); cx += scoreColW; });
      doc.setFont("helvetica", "bold");
      doc.text(total !== null ? String(total) : "—", cx, y + 4.5); cx += totalColW;
      doc.text(total !== null ? getGrade(total) : "—", cx, y + 4.5); cx += gradeColW;
      doc.text(String(subjectPositions[row.subject_id] ?? "—"), cx, y + 4.5);
      doc.setFont("helvetica", "normal"); y += 6.5;
    });
    doc.setFillColor(17, 17, 17); doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
    cx = margin + 3; doc.text("GRAND TOTAL", cx, y + 5); cx += subjectColW + gradingFields.length * scoreColW;
    doc.text(String(grandTotal), cx, y + 5); y += 14;

    // Traits
    if (behavioralTraits.length > 0 && traitScore?.traits) {
      doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
      doc.text("Behavioral Traits", margin, y); y += 6;
      const traitColW = (pageW - margin * 2) / 2 - 4;
      behavioralTraits.forEach((trait, i) => {
        const tx = margin + (i % 2) * (traitColW + 8);
        if (i % 2 === 0) { doc.setFillColor(249, 250, 251); doc.roundedRect(tx, y, traitColW, 6, 2, 2, "F"); }
        doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
        doc.text(trait, tx + 3, y + 4.2);
        doc.setFont("helvetica", "bold");
        doc.text(traitScore.traits[trait] || "—", tx + traitColW - 3, y + 4.2, { align: "right" });
        doc.setFont("helvetica", "normal");
        if (i % 2 === 1) y += 7;
      });
      if (behavioralTraits.length % 2 !== 0) y += 7;
      y += 6;
    }

    // Remarks
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
        doc.text(doc.splitTextToSize(text || "—", remarkW - 8).slice(0, 2), rx + 4, y + 13);
      });
      y += 28;
    }

    // Footer
    doc.setFillColor(17, 17, 17); doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "normal");
    doc.text(school.school_name || "", margin, pageH - 5);
    doc.text(`${sessionName}  ·  ${termName}`, pageW / 2, pageH - 5, { align: "center" });
    doc.text("Page 1", pageW - margin, pageH - 5, { align: "right" });

    doc.save(`report_${studentName.replace(/\s+/g, "_")}_${termName}.pdf`);
  };

  if (loading) return <InnerTabCon><LoadingData message="Loading report card..." /></InnerTabCon>;

  return (
    <InnerTabCon>
      <div className="rsi-wrap">

        {/* Top action bar — only when published */}
        {reportCard?.is_published && (
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
          </div>
          <div className="rsi-topbar-right">
            {reportCard?.is_published && (
              <button className="rsi-btn rsi-btn-outline" onClick={handleExportPDF}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export PDF
              </button>
            )}
          </div>
        </div>
        )}

        {/* No report */}
        {!reportCard && (
          <div className="rsi-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            No report card has been generated for this subsession yet.
          </div>
        )}

        {/* Not published */}
        {reportCard && !reportCard.is_published && (
          <div className="rsi-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Your report card has been prepared but is not yet published. Please check back later.
          </div>
        )}

        {reportCard?.is_published && (<>

          {/* Scores */}
          <div className="rsi-section">
            <div className="rsi-section-header">
              <span className="rsi-section-title">Academic Scores</span>
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
              </div>
              <div className="rsi-table-wrap">
                <table className="rsi-table">
                  <thead><tr><th>Trait</th><th>Rating</th></tr></thead>
                  <tbody>
                    {behavioralTraits.map((trait) => (
                      <tr key={trait}>
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
          {(reportCard?.teacher_remark || reportCard?.principal_remark) && (
            <div className="rsi-remarks-row">
              <div className="rsi-remark-card">
                <div className="rsi-remark-header"><span className="rsi-remark-title">Teacher's Remark</span></div>
                <p className={`rsi-remark-text ${!reportCard?.teacher_remark ? "rsi-remark-empty" : ""}`}>
                  {reportCard?.teacher_remark ?? "No remark added yet"}
                </p>
              </div>
              <div className="rsi-remark-card">
                <div className="rsi-remark-header"><span className="rsi-remark-title">Principal's Remark</span></div>
                <p className={`rsi-remark-text ${!reportCard?.principal_remark ? "rsi-remark-empty" : ""}`}>
                  {reportCard?.principal_remark ?? "No remark added yet"}
                </p>
              </div>
            </div>
          )}

        </>)}
      </div>
    </InnerTabCon>
  );
};

export default Report;
