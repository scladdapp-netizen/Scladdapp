import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStudentReport from "../../../../../../api_call/useStudentReport";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import { exportReportPDF } from "../../../../../../utils/exportReportPDF";
import { exportReportHtml, resolveReportExportTemplate } from "../../../../../../utils/exportReportHtml";
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
    subsessionData, classData, previewData,
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
  const handleExportPDF = async () => {
    const studentName = previewData?.student?.studentName
      || subsessionData?.student_name
      || classData?.student_name
      || user?.student?.full_name
      || "Student";
    const className   = classData?.class_name || previewData?.student?.class || "—";
    const sessionName = classData?.session_name || subsessionData?.session_name || previewData?.student?.session || "—";
    const termName    = subsessionData?.term_name || classData?.subsession_name || previewData?.student?.term || "—";
    const profileImg  = previewData?.student?.profileImg || null;

    const exportRows = tableRows.map((row) => ({
      ...row,
      position: subjectPositions?.[row.subject_id]
        ? String(subjectPositions[row.subject_id])
        : "—",
    }));

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
            position:       classPos > 0 ? `${classPos} / ${rankings.length}` : "—",
            gender:         previewData?.student?.gender ?? "—",
            dob:            previewData?.student?.dob    ?? "—",
            profileImg,
            teacherRemark:   reportCard?.teacher_remark   ?? "",
            principalRemark: reportCard?.principal_remark ?? "",
            attendance:      previewData?.student?.attendance ?? null,
          },
          tableRows:         exportRows,
          traitScores:       traitScore?.traits ?? {},
          classAverage,
          classPos,
          totalStudents:     rankings.length,
          grandTotal,
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
      traitScores: traitScore?.traits ?? {},
      tableRows: exportRows,
      subjectPositions,
      grandTotal,
      classAverage,
      classPos,
      totalStudents: rankings.length,
      reportCard,
    });
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

          {/* Behavioral Traits + Remarks side by side */}
          {(behavioralTraits.length > 0 || reportCard?.teacher_remark || reportCard?.principal_remark) && (
            <div className="rsi-section-remarks-row">

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

            </div>
          )}

        </>)}
      </div>
    </InnerTabCon>
  );
};

export default Report;
