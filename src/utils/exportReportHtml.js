/**
 * exportReportHtml
 *
 * Exports a student report card using the html_template stored on the
 * grading template. Opens a browser print dialog (File → Save as PDF)
 * with the fully hydrated HTML pre-styled for A4 print.
 *
 * Falls back to nothing — caller must call exportReportPDF when
 * templateData.html_template is absent.
 *
 * @param {object} params
 * @param {string}   params.htmlTemplate  - raw html_template from the grading template (with {{placeholders}})
 * @param {object}   params.template      - full templateData object (grading_fields, grading_scheme, behavioral_traits, styling)
 * @param {object}   params.school        - school object (school_name, address, logo_url, …)
 * @param {object}   params.studentData   - { studentName, class, session, term, admissionId, position,
 *                                           profileImg, teacherRemark, principalRemark }
 * @param {Array}    params.tableRows     - [{ subject_name, scores: { fieldName: value }, … }]
 * @param {object}   params.traitScores   - { [traitName]: value }
 * @param {object}   params.classAverage  - { average, student_rankings }
 * @param {number}   params.classPos      - 1-based class position of this student
 * @param {number}   params.totalStudents - total students ranked
 * @param {number}   params.grandTotal    - pre-computed grand total score
 */
export const exportReportHtml = ({
  htmlTemplate,
  template,
  school,
  studentData,
  tableRows,
  traitScores,
  classAverage,
  classPos,
  totalStudents,
  grandTotal,
}) => {
  const gradingFields    = template?.grading_fields    ?? [];
  const gradingScheme    = template?.grading_scheme    ?? [];
  const behavioralTraits = template?.behavioral_traits ?? [];

  const maxTotal = gradingFields.reduce((s, f) => s + Number(f.max_score), 0);

  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "—";
    const pct = (total / maxTotal) * 100;
    const match = gradingScheme.find(
      (g) => pct >= Number(g.min_range) && pct <= Number(g.max_range)
    );
    return match ? match.grade_letter : "—";
  };

  // ── Build {{subjectTableRows}} ────────────────────────────────────────────
  const subjectTableRows = tableRows.map((row, i) => {
    const total = row.scores
      ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0)
      : 0;
    const grade = getGrade(total);
    const even = i % 2 === 0;
    const bg = even ? "rgba(249,250,251,0.7)" : "rgba(255,255,255,0.5)";

    const scoreCells = gradingFields
      .map((f) => `<td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;background:${bg}">${row.scores?.[f.field_name] ?? "—"}</td>`)
      .join("");

    return `<tr>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:left;font-size:10px;font-weight:500;background:${bg}">${row.subject_name}</td>
      ${scoreCells}
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;font-weight:700;background:${bg}">${total}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;background:${bg}">
        <span style="display:inline-block;padding:1px 5px;border-radius:8px;background:#111111;color:#ffffff;font-weight:700;font-size:9px">${grade}</span>
      </td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;color:#6b7280;background:${bg}">—</td>
    </tr>`;
  }).join("");

  // ── Build {{trait_*}} replacements ────────────────────────────────────────
  const traitReplacements = {};
  behavioralTraits.forEach((t) => {
    const key = `trait_${t.replace(/[^a-zA-Z0-9]/g, "_")}`;
    traitReplacements[key] = traitScores?.[t] ?? "—";
  });

  // ── Build the full replacement map ────────────────────────────────────────
  const schoolLogoHtml = school?.logo_url
    ? `<img src="${school.logo_url}" alt="logo" style="width:40px;height:40px;object-fit:contain;border-radius:50%"/>`
    : (school?.school_name?.charAt(0) ?? "S");

  const studentInitialHtml = studentData?.profileImg
    ? `<img src="${studentData.profileImg}" alt="student" style="width:100%;height:100%;object-fit:cover"/>`
    : (studentData?.studentName?.charAt(0) ?? "S");

  const positionStr = classPos > 0
    ? `${classPos} / ${totalStudents || "—"}`
    : (studentData?.position ?? "—");

  const replacements = {
    // School
    schoolInitial:  schoolLogoHtml,
    schoolName:     school?.school_name    || "",
    schoolAddress:  school?.address        || "",
    schoolPhone:    school?.phone_number   || "",
    schoolEmail:    school?.email          || "",
    // Student
    studentInitial: studentInitialHtml,
    studentName:    studentData?.studentName  ?? "—",
    gender:         studentData?.gender       ?? "—",
    class:          studentData?.class        ?? "—",
    session:        studentData?.session      ?? "—",
    term:           studentData?.term         ?? "—",
    admissionId:    studentData?.admissionId  ?? "—",
    dob:            studentData?.dob          ?? "—",
    position:       positionStr,
    // Attendance
    attendanceOpened:  studentData?.attendance?.opened  ?? "—",
    attendancePresent: studentData?.attendance?.present ?? "—",
    attendanceAbsent:  studentData?.attendance?.absent  ?? "—",
    attendanceExcused: studentData?.attendance?.excused ?? "—",
    attendanceRate:    studentData?.attendance?.rate    ?? "—",
    // Remarks
    teacherRemark:   studentData?.teacherRemark   ?? "—",
    principalRemark: studentData?.principalRemark ?? "—",
    // Scores
    subjectTableRows,
    grandTotal: String(grandTotal ?? 0),
    // Traits
    ...traitReplacements,
  };

  // ── Replace all {{placeholders}} ─────────────────────────────────────────
  const hydratedHtml = Object.entries(replacements).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    htmlTemplate
  );

  // ── Open print window ────────────────────────────────────────────────────
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Pop-up blocked. Please allow pop-ups for this site and try again.");
    return;
  }

  const studentName = studentData?.studentName?.replace(/\s+/g, "_") ?? "student";
  const term        = studentData?.term?.replace(/\s+/g, "_") ?? "report";

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Report Card — ${studentData?.studentName ?? "Student"}</title>
  <style>
    /* ── Print reset ── */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, Helvetica, sans-serif;
      background: #f0f0f0;
    }
    /* A4 page card */
    .rc-print-page {
      width: 794px;       /* 210mm at 96dpi */
      min-height: 1123px; /* 297mm at 96dpi */
      margin: 0 auto;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
      border-radius: 8px;
      overflow: hidden;
    }
    /* Print media — no background, fill page */
    @media print {
      body { background: none !important; padding: 0 !important; }
      .rc-print-page {
        width: 100% !important;
        min-height: 100% !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        margin: 0 !important;
      }
      @page {
        size: A4 portrait;
        margin: 10mm 12mm;
      }
    }
    /* thead/tfoot background — browsers strip backgrounds by default in print */
    thead, tfoot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style>
</head>
<body>
  <div class="rc-print-page">
    ${hydratedHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  <\/script>
</body>
</html>`);

  win.document.close();
};
