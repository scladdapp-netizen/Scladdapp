/**
 * Generates the default report card HTML string from a template + school info.
 *
 * Layout:
 *   1. Header band  — logo | school name/address | session/term
 *   2. Dark banner  — "STUDENT REPORT CARD"
 *   3. Student info strip
 *   4. Academic Scores table
 *   5. Behavioral Traits | Grading Scale
 *   6. Remarks
 *   7. Footer band
 *
 * Table header colours are set on <thead> so the admin can change them in one click.
 * All background colours use rgba so the school-logo watermark shows through.
 */
export const generateDefaultReportHtml = ({
  grading_fields = [],
  grading_scheme = [],
  behavioral_traits = [],
  school = {},
}) => {
  const schoolName    = school?.school_name  || "";
  const schoolAddress = school?.address      || "";
  const schoolPhone   = school?.phone_number || "";
  const schoolEmail   = school?.email        || "";
  const schoolLogo    = school?.logo_url     || "";

  const logoHtml = schoolLogo
    ? `<img src="${schoolLogo}" alt="logo" style="width:40px;height:40px;object-fit:contain;border-radius:50%"/>`
    : schoolName
      ? `<span>${schoolName.charAt(0).toUpperCase()}</span>`
      : `<span>S</span>`;

  // ── Watermark ────────────────────────────────────────────────────────────
  // Layered background on rc-content:
  //   layer 1 (top): white at 94% opacity — dims the watermark to ~6% visible
  //   layer 2 (bottom): the logo or SVG initial letter, centered 240×240px
  const watermarkBg = schoolLogo
    ? `url('${schoolLogo}')`
    : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='central' font-family='Arial,sans-serif' font-weight='900' font-size='200' fill='%23111111'%3E${encodeURIComponent(schoolName ? schoolName.charAt(0).toUpperCase() : "S")}%3C/text%3E%3C/svg%3E")`;

  const watermarkStyle = `background-image:linear-gradient(rgba(255,255,255,0.94),rgba(255,255,255,0.94)),${watermarkBg};background-repeat:repeat,no-repeat;background-position:0 0,center center;background-size:auto,240px 240px;`;

  // ── Score column headers ──────────────────────────────────────────────────
  const scoreCols = grading_fields
    .map((f) => `<th data-hle-id="rc-scores-th-${f.field_name.replace(/\s+/g, "_")}" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center;white-space:nowrap">${f.field_name.toUpperCase()}<span style="font-weight:400;opacity:.7;font-size:8px">/${f.max_score}</span></th>`)
    .join("");

  const tfootCols = grading_fields
    .map(() => `<td style="padding:6px 8px;font-weight:700;font-size:10px;text-align:center"></td>`)
    .join("");

  // ── Behavioral trait rows — rgba so watermark shows through ──────────────
  const traitRows = behavioral_traits
    .map((t, i) => `<tr style="background:${i % 2 === 0 ? "rgba(249,250,251,0.7)" : "rgba(255,255,255,0.5)"}">
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:left;font-size:10px">${t}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;font-weight:600">{{trait_${t.replace(/[^a-zA-Z0-9]/g, "_")}}}</td>
    </tr>`)
    .join("");

  // ── Grading scheme rows — rgba so watermark shows through ────────────────
  const schemeRows = grading_scheme
    .map((s, i) => `<tr style="background:${i % 2 === 0 ? "rgba(249,250,251,0.7)" : "rgba(255,255,255,0.5)"}">
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;font-weight:700">${s.grade_letter || "—"}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px">${s.min_range}–${s.max_range}%</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px">${s.pass_fail ?? "—"}</td>
    </tr>`)
    .join("");

  const hasSide = behavioral_traits.length > 0 || grading_scheme.length > 0;

  return `
<div data-hle-id="rc-root" style="background:#ffffff;border:1px solid #d1d5db;border-radius:8px;overflow:hidden;font-size:11px;color:#111111;font-family:Arial,Helvetica,sans-serif">

  <!-- rc-content carries the watermark as a layered background -->


    <!-- 1. Header band — rgba background so watermark shows through -->
    <div data-hle-id="rc-header" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.88);border-bottom:1px solid #e5e7eb">
      <div data-hle-id="rc-logo" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#555555;flex-shrink:0;overflow:hidden">
        ${logoHtml}
      </div>
      <div data-hle-id="rc-school-info" style="flex:1;text-align:center">
        <p data-hle-id="rc-school-name" style="margin:0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#111111">${schoolName}</p>
        <p data-hle-id="rc-school-address" style="margin:1px 0 0;font-size:9px;color:#6b7280">${schoolAddress}</p>
        <p data-hle-id="rc-school-contact" style="margin:1px 0 0;font-size:9px;color:#6b7280">${[schoolPhone, schoolEmail].filter(Boolean).join(" · ")}</p>
      </div>
      <div data-hle-id="rc-header-right" style="flex-shrink:0;text-align:right">
        <p data-hle-id="rc-header-title" style="margin:0;font-size:9px;font-weight:700;color:#111111">STUDENT REPORT CARD</p>
        <p data-hle-id="rc-header-session" style="margin:2px 0 0;font-size:8px;color:#9ca3af">{{session}} · {{term}}</p>
      </div>
    </div>

    <!-- 2. Dark banner -->
    <div data-hle-id="rc-banner" style="text-align:center;font-size:8px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#ffffff;background:#111111;padding:4px 0">
      STUDENT REPORT CARD
    </div>

    <!-- 3. Student info strip — rgba background -->
    <div data-hle-id="rc-student-strip" style="display:flex;gap:10px;padding:10px 14px;background:rgba(249,250,251,0.75);border-bottom:1px solid #e5e7eb">
      <div data-hle-id="rc-student-photo" style="width:48px;height:60px;border-radius:4px;background:#e5e7eb;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#888888;flex-shrink:0;border:1px solid #d1d5db;overflow:hidden">
        {{studentInitial}}
      </div>
      <div data-hle-id="rc-student-fields" style="flex:1;display:flex;flex-direction:column;gap:6px">
        <div data-hle-id="rc-student-row1" style="display:flex">
          <div data-hle-id="rc-field-name" style="flex:1">
            <p data-hle-id="rc-field-name-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Student</p>
            <p data-hle-id="rc-field-name-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{studentName}}</p>
          </div>
          <div data-hle-id="rc-field-class" style="flex:1">
            <p data-hle-id="rc-field-class-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Class</p>
            <p data-hle-id="rc-field-class-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{class}}</p>
          </div>
          <div data-hle-id="rc-field-session" style="flex:1">
            <p data-hle-id="rc-field-session-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Session</p>
            <p data-hle-id="rc-field-session-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{session}}</p>
          </div>
        </div>
        <div data-hle-id="rc-student-row2" style="display:flex">
          <div data-hle-id="rc-field-term" style="flex:1">
            <p data-hle-id="rc-field-term-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Term</p>
            <p data-hle-id="rc-field-term-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{term}}</p>
          </div>
          <div data-hle-id="rc-field-admid" style="flex:1">
            <p data-hle-id="rc-field-admid-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Admission ID</p>
            <p data-hle-id="rc-field-admid-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{admissionId}}</p>
          </div>
          <div data-hle-id="rc-field-pos" style="flex:1">
            <p data-hle-id="rc-field-pos-label" style="margin:0;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Position</p>
            <p data-hle-id="rc-field-pos-val" style="margin:0;font-size:10px;font-weight:600;color:#111111">{{position}}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div data-hle-id="rc-body" style="padding:12px 14px;display:flex;flex-direction:column;gap:12px">

      <!-- 4. Academic Scores -->
      ${grading_fields.length > 0 ? `
      <div data-hle-id="rc-scores-section">
        <p data-hle-id="rc-scores-title" style="margin:0 0 5px;font-size:10px;font-weight:700;color:#111111">Academic Scores</p>
        <div data-hle-id="rc-scores-scroll" style="overflow-x:auto">
          <table data-hle-id="rc-scores-table" style="width:100%;border-collapse:collapse;font-size:10px">
            <thead data-hle-id="rc-scores-thead" style="background:#111111;color:#ffffff">
              <tr data-hle-id="rc-scores-thead-row">
                <th data-hle-id="rc-scores-th-subject" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:left;white-space:nowrap">SUBJECT</th>
                ${scoreCols}
                <th data-hle-id="rc-scores-th-total" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center;white-space:nowrap">TOTAL</th>
                <th data-hle-id="rc-scores-th-grade" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center;white-space:nowrap">GRD</th>
                <th data-hle-id="rc-scores-th-pos" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center;white-space:nowrap">POS</th>
              </tr>
            </thead>
            <tbody data-hle-id="rc-scores-tbody">
              {{subjectTableRows}}
            </tbody>
            <tfoot data-hle-id="rc-scores-tfoot" style="background:#111111;color:#ffffff">
              <tr data-hle-id="rc-scores-tfoot-row">
                <td data-hle-id="rc-scores-grand-label" style="padding:6px 8px;font-weight:700;font-size:10px;text-align:left">GRAND TOTAL</td>
                ${tfootCols}
                <td data-hle-id="rc-scores-grand-total" style="padding:6px 8px;font-weight:700;font-size:10px;text-align:center">{{grandTotal}}</td>
                <td style="padding:6px 8px;font-weight:700;font-size:10px;text-align:center"></td>
                <td style="padding:6px 8px;font-weight:700;font-size:10px;text-align:center"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      ` : ""}

      <!-- 5. Traits + Grading Scale -->
      ${hasSide ? `
      <div data-hle-id="rc-side-section" style="display:flex;gap:12px;align-items:flex-start">
        ${behavioral_traits.length > 0 ? `
        <div data-hle-id="rc-traits" style="flex:1 1 0;min-width:0">
          <p data-hle-id="rc-traits-title" style="margin:0 0 5px;font-size:10px;font-weight:700;color:#111111">Behavioral Traits</p>
          <table data-hle-id="rc-traits-table" style="width:100%;border-collapse:collapse;font-size:10px">
            <thead data-hle-id="rc-traits-thead" style="background:#111111;color:#ffffff">
              <tr data-hle-id="rc-traits-thead-row">
                <th data-hle-id="rc-traits-th-trait" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:left">TRAIT</th>
                <th data-hle-id="rc-traits-th-rating" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center">RATING</th>
              </tr>
            </thead>
            <tbody data-hle-id="rc-traits-tbody">${traitRows}</tbody>
          </table>
        </div>
        ` : ""}
        ${grading_scheme.length > 0 ? `
        <div data-hle-id="rc-scheme" style="flex:0 0 148px">
          <p data-hle-id="rc-scheme-title" style="margin:0 0 5px;font-size:10px;font-weight:700;color:#111111">Grading Scale</p>
          <table data-hle-id="rc-scheme-table" style="width:100%;border-collapse:collapse;font-size:10px">
            <thead data-hle-id="rc-scheme-thead" style="background:#111111;color:#ffffff">
              <tr data-hle-id="rc-scheme-thead-row">
                <th data-hle-id="rc-scheme-th-grade" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center">GRADE</th>
                <th data-hle-id="rc-scheme-th-range" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center">RANGE</th>
                <th data-hle-id="rc-scheme-th-pf" style="padding:6px 8px;font-weight:700;font-size:9px;text-align:center">P/F</th>
              </tr>
            </thead>
            <tbody data-hle-id="rc-scheme-tbody">${schemeRows}</tbody>
          </table>
        </div>
        ` : ""}
      </div>
      ` : ""}

      <!-- 6. Remarks -->
      <div data-hle-id="rc-remarks" style="display:flex;gap:12px">
        <div data-hle-id="rc-remark-teacher" style="flex:1">
          <p data-hle-id="rc-remark-teacher-label" style="margin:0 0 3px;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Teacher's Remark</p>
          <div data-hle-id="rc-remark-teacher-line" style="height:1px;background:#e5e7eb;margin:0 0 5px"></div>
          <p data-hle-id="rc-remark-teacher-text" style="margin:0;font-size:10px;color:#374151;font-style:italic;line-height:1.5">{{teacherRemark}}</p>
        </div>
        <div data-hle-id="rc-remark-principal" style="flex:1">
          <p data-hle-id="rc-remark-principal-label" style="margin:0 0 3px;font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af">Principal's Remark</p>
          <div data-hle-id="rc-remark-principal-line" style="height:1px;background:#e5e7eb;margin:0 0 5px"></div>
          <p data-hle-id="rc-remark-principal-text" style="margin:0;font-size:10px;color:#374151;font-style:italic;line-height:1.5">{{principalRemark}}</p>
        </div>
      </div>

    </div>




</div>`.trim();
};


