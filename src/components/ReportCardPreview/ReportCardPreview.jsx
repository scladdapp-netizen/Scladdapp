import { useEffect, useState, useId } from "react";
import "./ReportCardPreview.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const MOCK = {
  studentName: "Amina Yusuf",
  gender: "Female",
  class: "JSS 2A",
  session: "2024/2025",
  term: "First Term",
  admissionId: "ADM/2021/0042",
  dob: "2010-06-15",
  profileImg: null,
  schoolName: "Greenfield Academy",
  schoolAddress: "12 Education Road, Kaduna",
  schoolPhone: "+234 800 000 0000",
  schoolEmail: "info@greenfieldacademy.edu.ng",
  schoolLogo: null,
  subjects: [
    { name: "Mathematics",      scores: { ft: 18, st: 27, ex: 44 }, total: 89, grade: "A", position: "2nd" },
    { name: "English Language", scores: { ft: 20, st: 30, ex: 48 }, total: 98, grade: "A", position: "1st" },
    { name: "Basic Science",    scores: { ft: 15, st: 22, ex: 38 }, total: 75, grade: "B", position: "3rd" },
    { name: "Social Studies",   scores: { ft: 17, st: 25, ex: 40 }, total: 82, grade: "A", position: "2nd" },
    { name: "Civic Education",  scores: { ft: 12, st: 20, ex: 35 }, total: 67, grade: "C", position: "4th" },
  ],
  attendance: { opened: 90, present: 85, absent: 5, excused: 2, rate: "94%" },
  position: "3rd / 40",
  teacherRemark: "Amina is a dedicated and hardworking student.",
  principalRemark: "An outstanding performance this term. Keep up the excellent work.",
  traits: {
    "Self-Control": "Excellent",
    "Time Management": "Very Good",
    "Problem Solving": "Good",
    "Responsibility": "Excellent",
  },
};

// ── Build the subject table headers HTML ──────────────────────────────────────
const buildHeaders = (gradingFields) => {
  const cols = gradingFields
    .map((f) => `<th>${f.field_name}<span style="font-weight:400;opacity:.7;font-size:8px">/${f.max_score}</span></th>`)
    .join("");
  return `<th class="rc-subj">Subject</th>${cols}<th>Total</th><th>Grade</th><th>Position</th>`;
};

// ── Build subject rows HTML ───────────────────────────────────────────────────
const buildRows = (subjects, gradingFields) =>
  subjects.map((row) => {
    const cells = gradingFields
      .map((f) => `<td>${row.scores?.[f.field_name] ?? "—"}</td>`)
      .join("");
    return `<tr>
      <td class="rc-subj">${row.name}</td>
      ${cells}
      <td class="rc-total">${row.total ?? "—"}</td>
      <td><span class="rc-badge">${row.grade ?? "—"}</span></td>
      <td>${row.position ?? "—"}</td>
    </tr>`;
  }).join("");

// ── Build footer totals row HTML ──────────────────────────────────────────────
const buildFooter = (subjects, gradingFields) => {
  const colTotals = gradingFields
    .map((f) => `<td>${subjects.reduce((s, r) => s + (Number(r.scores?.[f.field_name]) || 0), 0)}</td>`)
    .join("");
  const grandTotal = subjects.reduce((s, r) => s + (Number(r.total) || 0), 0);
  return `<td class="rc-subj"><strong>Total</strong></td>${colTotals}<td class="rc-total"><strong>${grandTotal}</strong></td><td></td><td></td>`;
};

// ── Build traits rows HTML ────────────────────────────────────────────────────
const buildTraits = (traits, behavioralTraits) =>
  behavioralTraits.map((t) =>
    `<div class="rc-trait-row"><span>${t}</span><span class="rc-trait-val">${traits?.[t] ?? "—"}</span></div>`
  ).join("");

// ── Replace all {{placeholders}} in the html_template ────────────────────────
const renderTemplate = (html, data, template) => {
  const gradingFields = template.grading_fields ?? [];
  const behavioralTraits = template.behavioral_traits ?? [];
  const subjects = data.subjects ?? [];

  const schoolInitial = data.schoolLogo
    ? `<img src="${data.schoolLogo}" class="rc-logo-img" alt="logo"/>`
    : (data.schoolName?.charAt(0) ?? "S");

  const studentInitial = data.profileImg
    ? `<img src="${data.profileImg}" alt="student"/>`
    : (data.studentName?.charAt(0) ?? "S");

  const map = {
    schoolInitial,
    schoolName:      data.schoolName      ?? "—",
    schoolAddress:   data.schoolAddress   ?? "—",
    schoolPhone:     data.schoolPhone     ?? "—",
    schoolEmail:     data.schoolEmail     ?? "—",
    studentInitial,
    studentName:     data.studentName     ?? "—",
    gender:          data.gender          ?? "—",
    class:           data.class           ?? "—",
    session:         data.session         ?? "—",
    term:            data.term            ?? "—",
    admissionId:     data.admissionId     ?? "—",
    dob:             data.dob             ?? "—",
    position:        data.position        ?? "—",
    attendanceOpened:  data.attendance?.opened  ?? "—",
    attendancePresent: data.attendance?.present ?? "—",
    attendanceAbsent:  data.attendance?.absent  ?? "—",
    attendanceExcused: data.attendance?.excused ?? "—",
    attendanceRate:    data.attendance?.rate    ?? "—",
    teacherRemark:   data.teacherRemark   ?? "—",
    principalRemark: data.principalRemark ?? "—",
    primaryColor:        template.styling?.primaryColor || "#3b82f6",
    subjectTableHeaders: buildHeaders(gradingFields),
    subjectTableRows:    buildRows(subjects, gradingFields),
    subjectTableFooter:  buildFooter(subjects, gradingFields),
    traitsRows:          buildTraits(data.traits ?? {}, behavioralTraits),
  };

  return Object.entries(map).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    html
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const ReportCardPreview = ({ template, student }) => {
  const uid = useId().replace(/:/g, "");
  const [themeData, setThemeData] = useState(null);
  const [themeLoading, setThemeLoading] = useState(false);

  const themeId = template?.styling?.theme_id;

  useEffect(() => {
    if (!themeId) { setThemeData(null); return; }
    setThemeLoading(true);
    fetch(`${API_BASE}/api/report-card-theme/${themeId}`)
      .then((r) => r.json())
      .then((res) => setThemeData(res.success ? res.data : null))
      .catch(() => setThemeData(null))
      .finally(() => setThemeLoading(false));
  }, [themeId]);

  if (!template) return null;

  const data = student || MOCK;

  // ── Loading state ─────────────────────────────────────────────────────────
  if (themeLoading) {
    return (
      <div className="rcp-theme-loading">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          style={{ animation: "spin 1s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        Loading theme...
      </div>
    );
  }

  // ── Theme-based render (html_template + css) ──────────────────────────────
  if (themeData?.html_template && themeData?.css) {
    const scopeClass = `rct-${uid}`;
    const primaryColor = template.styling?.primaryColor || "#3b82f6";
    // Scope the theme CSS to this instance and inject primaryColor
    const scopedCss = themeData.css
      .replaceAll("{{primaryColor}}", primaryColor)
      .replace(/\.rc\b/g, `.${scopeClass} .rc`);
    const html = renderTemplate(themeData.html_template, data, template);

    return (
      <>
        <style>{scopedCss}</style>
        <div
          className={scopeClass}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </>
    );
  }

  // ── Fallback: React render (no theme selected or theme has no html/css) ───
  const gradingFields = template.grading_fields ?? [];
  const primary = template.styling?.primaryColor || "#3b82f6";
  const themeClass = template.styling?.theme_name
    ? `rcp-theme-${template.styling.theme_name.toLowerCase().replace(/\s+/g, "-")}`
    : "rcp-theme-professional";

  return (
    <div className={`rcp-wrapper ${themeClass}`} style={{ "--rcp-primary": primary }}>

      <div className="rcp-header">
        <div className="rcp-logo">
          {data.schoolLogo
            ? <img src={data.schoolLogo} alt="School Logo" className="rcp-logo-img" />
            : <div className="rcp-logo-placeholder">{data.schoolName?.charAt(0) ?? "S"}</div>
          }
        </div>
        <div className="rcp-school-details">
          <h2 className="rcp-school-name">{data.schoolName}</h2>
          <p className="rcp-school-address">{data.schoolAddress}</p>
          <p className="rcp-school-contact">{data.schoolPhone} &nbsp;|&nbsp; {data.schoolEmail}</p>
        </div>
      </div>

      <div className="rcp-header-label">STUDENT REPORT CARD</div>

      <div className="rcp-student-section">
        <div className="rcp-student-photo">
          {data.profileImg
            ? <img src={data.profileImg} alt="Student" className="rcp-profile-img" />
            : <div className="rcp-profile-placeholder">{data.studentName?.charAt(0) ?? "S"}</div>
          }
        </div>
        <div className="rcp-student-fields">
          <div className="rcp-info-row">
            <div className="rcp-info-item"><span>Full Name</span><strong>{data.studentName}</strong></div>
            <div className="rcp-info-item"><span>Gender</span><strong>{data.gender}</strong></div>
            <div className="rcp-info-item"><span>Class</span><strong>{data.class}</strong></div>
          </div>
          <div className="rcp-info-row">
            <div className="rcp-info-item"><span>Session</span><strong>{data.session}</strong></div>
            <div className="rcp-info-item"><span>Term</span><strong>{data.term}</strong></div>
            <div className="rcp-info-item"><span>Admission ID</span><strong>{data.admissionId}</strong></div>
          </div>
          <div className="rcp-info-row">
            <div className="rcp-info-item"><span>Date of Birth</span><strong>{data.dob}</strong></div>
            <div className="rcp-info-item"><span>Position</span><strong>{data.position}</strong></div>
          </div>
        </div>
      </div>

      {gradingFields.length > 0 && (
        <div className="rcp-section">
          <div className="rcp-section-title">Academic Performance</div>
          <table className="rcp-table">
            <thead>
              <tr>
                <th>Subject</th>
                {gradingFields.map((f) => (
                  <th key={f.field_name}>{f.field_name}<span className="rcp-th-max">/{f.max_score}</span></th>
                ))}
                <th>Total</th><th>Grade</th><th>Position</th>
              </tr>
            </thead>
            <tbody>
              {(data.subjects ?? []).map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "rcp-row-even" : ""}>
                  <td className="rcp-subject-name">{row.name}</td>
                  {gradingFields.map((f) => (
                    <td key={f.field_name} className="rcp-score-cell">{row.scores?.[f.field_name] ?? "—"}</td>
                  ))}
                  <td className="rcp-total-cell">{row.total ?? "—"}</td>
                  <td><span className="rcp-grade-badge">{row.grade ?? "—"}</span></td>
                  <td className="rcp-position-cell">{row.position ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="rcp-tfoot-row">
                <td className="rcp-subject-name"><strong>Total</strong></td>
                {gradingFields.map((f) => (
                  <td key={f.field_name} className="rcp-score-cell">
                    {(data.subjects ?? []).reduce((s, r) => s + (Number(r.scores?.[f.field_name]) || 0), 0)}
                  </td>
                ))}
                <td className="rcp-total-cell">{(data.subjects ?? []).reduce((s, r) => s + (Number(r.total) || 0), 0)}</td>
                <td></td><td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="rcp-bottom-row">
        <div className="rcp-section rcp-bottom-col">
          <div className="rcp-section-title">Attendance</div>
          <table className="rcp-table">
            <tbody>
              <tr><td>Days Opened</td><td className="rcp-score-cell">{data.attendance?.opened ?? "—"}</td></tr>
              <tr className="rcp-row-even"><td>Days Present</td><td className="rcp-score-cell">{data.attendance?.present ?? "—"}</td></tr>
              <tr><td>Days Absent</td><td className="rcp-score-cell">{data.attendance?.absent ?? "—"}</td></tr>
              <tr className="rcp-row-even"><td>Days Excused</td><td className="rcp-score-cell">{data.attendance?.excused ?? "—"}</td></tr>
              <tr><td>Rate</td><td className="rcp-score-cell">{data.attendance?.rate ?? "—"}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="rcp-section rcp-bottom-col">
          <div className="rcp-section-title">Affective Domain</div>
          <table className="rcp-table">
            <tbody>
              {(template.behavioral_traits ?? []).map((trait, i) => (
                <tr key={i} className={i % 2 === 0 ? "rcp-row-even" : ""}>
                  <td className="rcp-subject-name">{trait}</td>
                  <td className="rcp-score-cell">{data.traits?.[trait] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rcp-bottom-row" style={{ marginTop: "4px" }}>
        <div className="rcp-section rcp-bottom-col">
          <div className="rcp-section-title">Teacher's Remark</div>
          <p className="rcp-remark-text">{data.teacherRemark ?? "—"}</p>
        </div>
        <div className="rcp-section rcp-bottom-col">
          <div className="rcp-section-title">Principal's Remark</div>
          <p className="rcp-remark-text">{data.principalRemark ?? "—"}</p>
        </div>
      </div>

    </div>
  );
};

export default ReportCardPreview;
