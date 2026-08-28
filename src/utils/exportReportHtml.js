/**
 * exportReportHtml
 *
 * Exports a student report card using report-card theme HTML / grading
 * html_template / generated default HTML, then downloads a PDF file
 * (html2canvas + jsPDF) — does not open the browser print dialog.
 *
 * @param {object} params
 * @param {string}   params.htmlTemplate  - HTML with {{placeholders}}
 * @param {string}   [params.themeCss]    - optional theme CSS ({{primaryColor}} supported)
 * @param {object}   params.template      - grading template (fields, scheme, traits, styling)
 * @param {object}   params.school
 * @param {object}   params.studentData
 * @param {Array}    params.tableRows     - [{ subject_name, scores, position? }]
 * @param {object}   params.traitScores
 * @param {object}   params.classAverage
 * @param {number}   params.classPos
 * @param {number}   params.totalStudents
 * @param {number}   params.grandTotal
 * @param {object}   [params.subjectPositions] - { [subject_id]: number }
 */
export const exportReportHtml = async ({
  htmlTemplate,
  themeCss = "",
  template,
  school,
  studentData,
  tableRows,
  traitScores,
  classAverage,
  classPos,
  totalStudents,
  grandTotal,
  subjectPositions = {},
}) => {
  if (!htmlTemplate) {
    console.warn("exportReportHtml: no htmlTemplate provided");
    return;
  }

  const gradingFields = template?.grading_fields ?? [];
  const gradingScheme = template?.grading_scheme ?? [];
  const behavioralTraits = template?.behavioral_traits ?? [];
  const primaryColor = template?.styling?.primaryColor || "#111111";

  const maxTotal = gradingFields.reduce((s, f) => s + Number(f.max_score), 0);

  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "—";
    const pct = (total / maxTotal) * 100;
    const match = gradingScheme.find(
      (g) => pct >= Number(g.min_range) && pct <= Number(g.max_range)
    );
    return match ? match.grade_letter : "—";
  };

  const subjectTableHeaders = (() => {
    const cols = gradingFields
      .map(
        (f) =>
          `<th style="text-align:center">${f.field_name}<span style="font-weight:400;opacity:.7;font-size:8px">/${f.max_score}</span></th>`
      )
      .join("");
    return `<th style="text-align:left">Subject</th>${cols}<th style="text-align:center">Total</th><th style="text-align:center">Grade</th><th style="text-align:center">Position</th>`;
  })();

  const enrichedRows = (tableRows || []).map((row) => {
    const total = row.scores
      ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0)
      : 0;
    const pos =
      row.position ||
      (row.subject_id && subjectPositions[row.subject_id]
        ? String(subjectPositions[row.subject_id])
        : "—");
    return {
      name: row.subject_name || row.name || "—",
      scores: row.scores || {},
      total,
      grade: getGrade(total),
      position: pos,
    };
  });

  const subjectTableRows = enrichedRows
    .map((row) => {
      const scoreCells = gradingFields
        .map(
          (f) =>
            `<td style="text-align:center">${row.scores?.[f.field_name] ?? "—"}</td>`
        )
        .join("");
      return `<tr>
      <td style="text-align:left;font-weight:500">${row.name}</td>
      ${scoreCells}
      <td style="text-align:center;font-weight:700">${row.total}</td>
      <td style="text-align:center">
        <span style="display:inline-block;padding:1px 5px;border-radius:8px;background:#111111;color:#ffffff;font-weight:700;font-size:9px">${row.grade}</span>
      </td>
      <td style="text-align:center">${row.position}</td>
    </tr>`;
    })
    .join("");

  const subjectTableFooter = (() => {
    const colTotals = gradingFields
      .map(
        (f) =>
          `<td style="text-align:center">${enrichedRows.reduce(
            (s, r) => s + (Number(r.scores?.[f.field_name]) || 0),
            0
          )}</td>`
      )
      .join("");
    const total =
      grandTotal ??
      enrichedRows.reduce((s, r) => s + (Number(r.total) || 0), 0);
    return `<td style="text-align:left"><strong>Total</strong></td>${colTotals}<td style="text-align:center"><strong>${total}</strong></td><td></td><td></td>`;
  })();

  const traitsRows = behavioralTraits
    .map(
      (t) =>
        `<div class="rc-trait-row"><span>${t}</span><span class="rc-trait-val">${traitScores?.[t] ?? "—"}</span></div>`
    )
    .join("");

  const traitReplacements = {};
  behavioralTraits.forEach((t) => {
    const key = `trait_${t.replace(/[^a-zA-Z0-9]/g, "_")}`;
    traitReplacements[key] = traitScores?.[t] ?? "—";
  });

  const schoolLogoHtml = school?.logo_url
    ? `<img src="${school.logo_url}" alt="logo" class="rc-logo-img" style="width:40px;height:40px;object-fit:contain;border-radius:50%" crossorigin="anonymous"/>`
    : school?.school_name?.charAt(0) ?? "S";

  const studentInitialHtml = studentData?.profileImg
    ? `<img src="${studentData.profileImg}" alt="student" style="width:100%;height:100%;object-fit:cover" crossorigin="anonymous"/>`
    : studentData?.studentName?.charAt(0) ?? "S";

  const positionStr =
    classPos > 0
      ? `${classPos} / ${totalStudents || "—"}`
      : studentData?.position ?? "—";

  const computedGrand =
    grandTotal ??
    enrichedRows.reduce((s, r) => s + (Number(r.total) || 0), 0);

  const replacements = {
    schoolInitial: schoolLogoHtml,
    schoolName: school?.school_name || "",
    schoolAddress: school?.address || "",
    schoolPhone: school?.phone_number || "",
    schoolEmail: school?.email || "",
    studentInitial: studentInitialHtml,
    studentName: studentData?.studentName ?? "—",
    gender: studentData?.gender ?? "—",
    class: studentData?.class ?? "—",
    session: studentData?.session ?? "—",
    term: studentData?.term ?? "—",
    admissionId: studentData?.admissionId ?? "—",
    dob: studentData?.dob ?? "—",
    position: positionStr,
    attendanceOpened: studentData?.attendance?.opened ?? "—",
    attendancePresent: studentData?.attendance?.present ?? "—",
    attendanceAbsent: studentData?.attendance?.absent ?? "—",
    attendanceExcused: studentData?.attendance?.excused ?? "—",
    attendanceRate: studentData?.attendance?.rate ?? "—",
    teacherRemark: studentData?.teacherRemark ?? "—",
    principalRemark: studentData?.principalRemark ?? "—",
    primaryColor,
    subjectTableHeaders,
    subjectTableRows,
    subjectTableFooter,
    traitsRows,
    grandTotal: String(computedGrand),
    classAverage: classAverage?.average != null ? String(classAverage.average) : "—",
    ...traitReplacements,
  };

  const hydratedHtml = Object.entries(replacements).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val ?? ""),
    htmlTemplate
  );

  const scopedCss = (themeCss || "")
    .replaceAll("{{primaryColor}}", primaryColor)
    .replace(/\.rc\b/g, ".rc-export-page .rc");

  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:794px;pointer-events:none;opacity:0;z-index:-1;";
  host.innerHTML = `
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      .rc-export-page {
        width: 794px;
        min-height: 1123px;
        margin: 0;
        background: #fff;
        overflow: hidden;
        font-family: Arial, Helvetica, sans-serif;
      }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      ${scopedCss}
    </style>
    <div class="rc-export-page">${hydratedHtml}</div>
  `;
  document.body.appendChild(host);

  const pageEl = host.querySelector(".rc-export-page");

  try {
    const images = [...host.querySelectorAll("img")];
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    // Brief paint settle for fonts/layout
    await new Promise((r) => setTimeout(r, 150));

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: pageEl.scrollWidth,
      height: pageEl.scrollHeight,
      windowWidth: pageEl.scrollWidth,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;

    while (heightLeft > 1) {
      position = heightLeft - imgH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pageH;
    }

    const safeName = String(studentData?.studentName || "Student")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 40);
    const safeTerm = String(studentData?.term || "Term")
      .replace(/[^\w\-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 30);
    pdf.save(`Report_${safeName}_${safeTerm}.pdf`);
  } catch (err) {
    console.error("exportReportHtml PDF download failed:", err);
    alert("Could not export the report PDF. Please try again.");
  } finally {
    host.remove();
  }
};

/**
 * Resolve which HTML (+ CSS) to use for export — same priority as ReportCardPreview:
 * 1) report-card theme (styling.theme_id)
 * 2) grading template html_template
 * 3) generated default HTML
 */
export const resolveReportExportTemplate = async (template, school = {}) => {
  const API = `${import.meta.env.VITE_API_BASE_URL}`;
  const themeId = template?.styling?.theme_id;

  if (themeId) {
    try {
      const res = await fetch(`${API}/api/report-card-theme/${themeId}`);
      const data = await res.json();
      if (data.success && data.data?.html_template) {
        return {
          htmlTemplate: data.data.html_template,
          themeCss: data.data.css || "",
          source: "theme",
        };
      }
    } catch (err) {
      console.warn("Failed to load report card theme for export:", err);
    }
  }

  if (template?.html_template) {
    return {
      htmlTemplate: template.html_template,
      themeCss: "",
      source: "grading_html",
    };
  }

  const { generateDefaultReportHtml } = await import("./generateDefaultReportHtml");
  return {
    htmlTemplate: generateDefaultReportHtml({
      grading_fields: template?.grading_fields || [],
      grading_scheme: template?.grading_scheme || [],
      behavioral_traits: template?.behavioral_traits || [],
      school,
    }),
    themeCss: "",
    source: "default",
  };
};
