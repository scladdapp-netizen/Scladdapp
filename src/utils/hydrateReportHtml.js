/**
 * Replaces all {{placeholders}} in a saved html_template with demo data
 * so it can be rendered as a preview in the detail panel.
 *
 * Handles:
 *  - Student info placeholders
 *  - {{subjectTableRows}} — built from template.grading_fields + mock subjects
 *  - {{grandTotal}}
 *  - {{trait_*}} — built from template.behavioral_traits
 *  - Remarks
 *  - session / term
 */
export const hydrateReportHtml = (html, template) => {
  if (!html) return "";

  const gradingFields   = template?.grading_fields   ?? [];
  const gradingScheme   = template?.grading_scheme   ?? [];
  const behavioralTraits = template?.behavioral_traits ?? [];

  // ── Mock student data ───────────────────────────────────────────────────
  const mock = {
    studentName:     "Amina Yusuf",
    studentInitial:  "A",
    gender:          "Female",
    class:           "JSS 2A",
    session:         "2024/2025",
    term:            "First Term",
    admissionId:     "ADM/2021/0042",
    dob:             "2010-06-15",
    position:        "3rd / 40",
    attendanceOpened:  "90",
    attendancePresent: "85",
    attendanceAbsent:  "5",
    attendanceExcused: "2",
    attendanceRate:    "94%",
    teacherRemark:   "Amina is a dedicated and hardworking student who consistently performs well.",
    principalRemark: "An outstanding performance this term. Keep up the excellent work.",
  };

  // ── Mock subjects — one per grading field combination ───────────────────
  const mockSubjectNames = [
    "Mathematics", "English Language", "Basic Science",
    "Social Studies", "Civic Education", "Agricultural Science",
  ];

  const mockScoreValues = [18, 27, 44, 20, 30, 15, 22, 17, 25, 12, 16, 24];

  const mockSubjects = mockSubjectNames.slice(0, Math.min(5, mockSubjectNames.length)).map((name, si) => {
    const scores = {};
    let total = 0;
    gradingFields.forEach((f, fi) => {
      const val = mockScoreValues[(si * 3 + fi) % mockScoreValues.length];
      const capped = Math.min(val, Number(f.max_score) || val);
      scores[f.field_name] = capped;
      total += capped;
    });
    // determine grade
    const maxTotal = gradingFields.reduce((s, f) => s + (Number(f.max_score) || 0), 0);
    const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const gradeEntry = gradingScheme.find((g) => pct >= Number(g.min_range) && pct <= Number(g.max_range));
    const grade = gradeEntry?.grade_letter ?? "—";
    const positions = ["1st", "2nd", "3rd", "4th", "5th"];
    return { name, scores, total, grade, position: positions[si] ?? `${si + 1}th` };
  });

  // ── Build {{subjectTableRows}} ──────────────────────────────────────────
  const subjectTableRows = mockSubjects.map((row, i) => {
    const even = i % 2 === 0;
    const bg = even ? "#f9fafb" : "#ffffff";
    const scoreCells = gradingFields
      .map((f) => `<td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;background:${bg}">${row.scores[f.field_name] ?? "—"}</td>`)
      .join("");
    return `<tr>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:left;font-size:10px;font-weight:500;background:${bg}">${row.name}</td>
      ${scoreCells}
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;font-weight:700;background:${bg}">${row.total}</td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;background:${bg}">
        <span style="display:inline-block;padding:1px 5px;border-radius:8px;background:#111111;color:#ffffff;font-weight:700;font-size:9px">${row.grade}</span>
      </td>
      <td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:10px;color:#6b7280;background:${bg}">${row.position}</td>
    </tr>`;
  }).join("");

  // ── {{grandTotal}} ──────────────────────────────────────────────────────
  const grandTotal = mockSubjects.reduce((s, r) => s + r.total, 0);

  // ── Build replacement map ───────────────────────────────────────────────
  const replacements = {
    ...mock,
    subjectTableRows,
    grandTotal: String(grandTotal),
  };

  // trait placeholders: {{trait_Self_Control}}, {{trait_Punctuality}}, etc.
  const traitRatings = ["Excellent", "Very Good", "Good", "Excellent", "Needs Improvement", "Very Good"];
  behavioralTraits.forEach((t, i) => {
    const key = `trait_${t.replace(/[^a-zA-Z0-9]/g, "_")}`;
    replacements[key] = traitRatings[i % traitRatings.length];
  });

  // ── Replace all {{key}} occurrences ────────────────────────────────────
  return Object.entries(replacements).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{${key}}}`, val),
    html
  );
};
