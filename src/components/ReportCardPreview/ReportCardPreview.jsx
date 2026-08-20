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

const ReportCardPreview = ({ template, student, school }) => {
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

  const data = {
    ...(student || MOCK),
    // override school fields — use real school if provided, otherwise empty (never show mock school data)
    schoolName:    school?.school_name    || student?.schoolName    || "",
    schoolAddress: school?.address        || student?.schoolAddress || "",
    schoolPhone:   school?.phone_number   || student?.schoolPhone   || "",
    schoolEmail:   school?.email          || student?.schoolEmail   || "",
    schoolLogo:    school?.logo_url       || student?.schoolLogo    || null,
  };

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
    const scopedCss = themeData.css
      .replaceAll("{{primaryColor}}", primaryColor)
      .replace(/\.rc\b/g, `.${scopeClass} .rc`);
    const html = renderTemplate(themeData.html_template, data, template);
    return (
      <>
        <style>{scopedCss}</style>
        <div className={scopeClass} dangerouslySetInnerHTML={{ __html: html }} />
      </>
    );
  }

  // ── Fallback: React render — mirrors PDF export layout exactly ────────────
  const gradingFields = template.grading_fields ?? [];
  const gradingScheme = template.grading_scheme ?? [];
  const behavioralTraits = template.behavioral_traits ?? [];

  const maxTotal = gradingFields.reduce((s, f) => s + Number(f.max_score), 0);
  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "—";
    const pct = (total / maxTotal) * 100;
    const match = gradingScheme.find((g) => pct >= Number(g.min_range) && pct <= Number(g.max_range));
    return match ? match.grade_letter : "—";
  };

  const subjects = data.subjects ?? [];
  const subjectTotals = subjects.map((row) =>
    gradingFields.reduce((s, f) => s + (Number(row.scores?.[f.field_name]) || 0), 0)
  );
  const grandTotal = subjectTotals.reduce((s, v) => s + v, 0);

  // ── Shared inline styles (mirrors jsPDF export visual exactly) ────────────
  const th = { padding: "6px 8px", background: "#111111", color: "#ffffff", fontWeight: 700, fontSize: 9, textAlign: "center", whiteSpace: "nowrap" };
  const thL = { ...th, textAlign: "left" };
  const td = (even) => ({ padding: "5px 8px", borderBottom: "1px solid #f3f4f6", textAlign: "center", fontSize: 10, background: even ? "#f9fafb" : "#ffffff" });
  const tdL = (even) => ({ ...td(even), textAlign: "left" });
  const tfTd = { padding: "6px 8px", background: "#111111", color: "#ffffff", fontWeight: 700, fontSize: 10, textAlign: "center" };
  const tfTdL = { ...tfTd, textAlign: "left" };

  return (
    <div style={{ background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 8, overflow: "hidden", fontSize: 11, color: "#111111", fontFamily: "Arial, helvetica, sans-serif" }}>

      {/* ── 1. Header band — logo left | school info centre | title right ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
        {/* Logo */}
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#555555", flexShrink: 0, overflow: "hidden" }}>
          {data.schoolLogo
            ? <img src={data.schoolLogo} alt="logo" style={{ width: 40, height: 40, objectFit: "contain" }} />
            : (data.schoolName?.charAt(0) ?? "S")
          }
        </div>
        {/* School info */}
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#111111" }}>{data.schoolName}</p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#6b7280" }}>{data.schoolAddress}</p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#6b7280" }}>{data.schoolPhone} &nbsp;·&nbsp; {data.schoolEmail}</p>
        </div>
        {/* Right: title + date */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#111111" }}>STUDENT REPORT CARD</p>
          <p style={{ margin: "2px 0 0", fontSize: 8, color: "#9ca3af" }}>{data.session} · {data.term}</p>
        </div>
      </div>

      {/* ── 2. "STUDENT REPORT CARD" dark banner ── */}
      <div style={{ textAlign: "center", fontSize: 8, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#ffffff", background: "#111111", padding: "4px 0" }}>
        STUDENT REPORT CARD
      </div>

      {/* ── 3. Student info — photo left + 6-field grid right ── */}
      <div style={{ display: "flex", gap: 10, padding: "10px 14px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
        {/* Photo */}
        <div style={{ width: 48, height: 60, borderRadius: 4, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#888888", flexShrink: 0, border: "1px solid #d1d5db", overflow: "hidden" }}>
          {data.profileImg
            ? <img src={data.profileImg} alt="student" style={{ width: 48, height: 60, objectFit: "cover" }} />
            : (data.studentName?.charAt(0) ?? "S")
          }
        </div>
        {/* 6-field grid: 3 cols × 2 rows */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            [["Student", data.studentName], ["Class", data.class], ["Session", data.session]],
            [["Term",    data.term],         ["Admission ID", data.admissionId], ["Position", data.position]],
          ].map((row, ri) => (
            <div key={ri} style={{ display: "flex" }}>
              {row.map(([label, val]) => (
                <div key={label} style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#111111" }}>{val ?? "—"}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ── 4. Academic Scores — full width ── */}
        {gradingFields.length > 0 && (
          <div>
            <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#111111" }}>Academic Scores</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={thL}>SUBJECT</th>
                    {gradingFields.map((f) => (
                      <th key={f.field_name} style={th}>
                        {f.field_name.toUpperCase()}<span style={{ fontWeight: 400, opacity: 0.7, fontSize: 8 }}>/{f.max_score}</span>
                      </th>
                    ))}
                    <th style={th}>TOTAL</th>
                    <th style={th}>GRD</th>
                    <th style={th}>POS</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((row, i) => {
                    const total = subjectTotals[i];
                    const ev = i % 2 === 0;
                    return (
                      <tr key={i}>
                        <td style={{ ...tdL(ev), fontWeight: 500 }}>{row.name}</td>
                        {gradingFields.map((f) => (
                          <td key={f.field_name} style={td(ev)}>{row.scores?.[f.field_name] ?? "—"}</td>
                        ))}
                        <td style={{ ...td(ev), fontWeight: 700 }}>{total}</td>
                        <td style={td(ev)}>
                          <span style={{ display: "inline-block", padding: "1px 5px", borderRadius: 8, background: "#111111", color: "#ffffff", fontWeight: 700, fontSize: 9 }}>{getGrade(total)}</span>
                        </td>
                        <td style={{ ...td(ev), color: "#6b7280", fontSize: 9 }}>{row.position ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={tfTdL}>GRAND TOTAL</td>
                    {gradingFields.map((f) => (
                      <td key={f.field_name} style={tfTd}>
                        {subjects.reduce((s, r) => s + (Number(r.scores?.[f.field_name]) || 0), 0)}
                      </td>
                    ))}
                    <td style={tfTd}>{grandTotal}</td>
                    <td style={tfTd} /><td style={tfTd} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. Behavioral Traits (left) | Grading Scale (right) ── */}
        {(behavioralTraits.length > 0 || gradingScheme.length > 0) && (
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {/* Traits */}
            {behavioralTraits.length > 0 && (
              <div style={{ flex: "1 1 0", minWidth: 0 }}>
                <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#111111" }}>Behavioral Traits</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                  <thead>
                    <tr><th style={thL}>TRAIT</th><th style={th}>RATING</th></tr>
                  </thead>
                  <tbody>
                    {behavioralTraits.map((t, i) => {
                      const ev = i % 2 === 0;
                      return (
                        <tr key={i}>
                          <td style={tdL(ev)}>{t}</td>
                          <td style={{ ...td(ev), fontWeight: 600 }}>{data.traits?.[t] ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Grading Scale */}
            {gradingScheme.length > 0 && (
              <div style={{ flex: "0 0 148px" }}>
                <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "#111111" }}>Grading Scale</p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                  <thead>
                    <tr><th style={th}>GRADE</th><th style={th}>RANGE</th><th style={th}>P/F</th></tr>
                  </thead>
                  <tbody>
                    {gradingScheme.map((s, i) => {
                      const ev = i % 2 === 0;
                      return (
                        <tr key={i}>
                          <td style={{ ...td(ev), fontWeight: 700 }}>{s.grade_letter || "—"}</td>
                          <td style={td(ev)}>{s.min_range}–{s.max_range}%</td>
                          <td style={td(ev)}>{s.pass_fail ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 6. Remarks — no border, label + thin line + text ── */}
        <div style={{ display: "flex", gap: 12 }}>
          {[["Teacher's Remark", data.teacherRemark], ["Principal's Remark", data.principalRemark]].map(([label, text]) => (
            <div key={label} style={{ flex: 1 }}>
              <p style={{ margin: "0 0 3px", fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#9ca3af" }}>{label}</p>
              <div style={{ height: 1, background: "#e5e7eb", margin: "0 0 5px" }} />
              <p style={{ margin: 0, fontSize: 10, color: "#374151", fontStyle: "italic", lineHeight: 1.5 }}>{text ?? "No remark added."}</p>
            </div>
          ))}
        </div>

      </div>

      {/* ── 7. Footer band ── */}
      <div style={{ background: "#111111", color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px", fontSize: 8 }}>
        <span>{data.schoolName}</span>
        <span>{data.session} · {data.term}</span>
        <span>Page 1</span>
      </div>

    </div>
  );
};

export default ReportCardPreview;
