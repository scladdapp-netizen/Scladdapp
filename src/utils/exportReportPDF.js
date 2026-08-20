import jsPDF from "jspdf";

/**
 * Shared PDF export for student report cards.
 * Used by both the student-facing Report.jsx and admin ReportStudentInfo.jsx.
 *
 * Layout (top → bottom):
 *  1. Header band  — school logo (left) | school name/info (middle) | "STUDENT REPORT CARD" label (right)
 *  2. Student info — 3-column label/value grid (full width)
 *  3. Profile photo (left, ~28mm sq) beside re-stated key student fields (right)
 *  4. Academic Scores table (left ~65%) | Grading Scale key table (right ~35%)  ← side-by-side
 *  5. Behavioral Traits table (left) | Rating Key table (right)                  ← side-by-side
 *  6. Remarks — no border, label + thin divider + text
 *  7. Footer band
 */
export const exportReportPDF = async ({
  studentName,
  className,
  sessionName,
  termName,
  profileImg,
  school,
  gradingFields,
  gradingScheme,
  behavioralTraits,
  traitScores,
  tableRows,
  subjectPositions,
  grandTotal,
  classAverage,
  classPos,
  totalStudents,
  reportCard,
}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const col2 = pageW / 2;
  let y = 0;

  const maxTotal = gradingFields.reduce((s, f) => s + Number(f.max_score), 0);

  const getGrade = (total) => {
    if (!gradingScheme.length || maxTotal === 0) return "—";
    const pct = (total / maxTotal) * 100;
    const match = gradingScheme.find(
      (g) => pct >= Number(g.min_range) && pct <= Number(g.max_range)
    );
    return match ? match.grade_letter : "—";
  };

  // ── Helper: load URL → dataURL via canvas ────────────────────────────────
  const loadImage = (url) =>
    new Promise((resolve) => {
      if (!url) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const [logoData, photoData] = await Promise.all([
    loadImage(school?.logo_url),
    loadImage(profileImg),
  ]);

  // ── 1. Header band ───────────────────────────────────────────────────────
  const headerH = 42;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, headerH, "F");
  doc.setDrawColor(229, 231, 235);
  doc.line(0, headerH, pageW, headerH);

  // School logo — far left, no background
  const logoSize = 24;
  if (logoData) {
    try { doc.addImage(logoData, "JPEG", margin, 9, logoSize, logoSize); } catch {}
  }
  // no placeholder when logo is missing — leave space clean

  // School name + contact — beside logo
  const schoolInfoX = margin + logoSize + 6;
  doc.setTextColor(17, 17, 17);
  doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text(school?.school_name || "School Name", schoolInfoX, 16);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100);
  if (school?.address) doc.text(school.address, schoolInfoX, 22);
  const contact = [school?.phone_number, school?.email].filter(Boolean).join("   ");
  if (contact) doc.text(contact, schoolInfoX, 28);

  // Report card title — far right
  doc.setTextColor(17, 17, 17); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text("STUDENT REPORT CARD", pageW - margin, 16, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text(`${sessionName}  ·  ${termName}`, pageW - margin, 23, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 30, { align: "right" });

  y = headerH + 8;

  // ── 2. Student info grid — photo LEFT, 6 fields fill the rest ────────────
  const photoSize  = 28;
  const photoGap   = 8;
  const infoStartX = margin + photoSize + photoGap;
  const infoW      = pageW - infoStartX - margin;
  const iColW      = infoW / 3;

  // Draw photo (or nothing) on the left
  if (photoData) {
    try {
      doc.addImage(photoData, "JPEG", margin, y, photoSize, photoSize);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, photoSize, photoSize);
    } catch {}
  }
  // no placeholder box when photo is missing — leave space clean

  // 6 info fields in a 3-col × 2-row grid to the right of the photo
  const infoItems = [
    ["Student",   studentName],
    ["Class",     className],
    ["Session",   sessionName],
    ["Term",      termName],
    ["Class Avg", classAverage ? `${classAverage.average}%` : "—"],
    ["Position",  classPos > 0 ? `${classPos} / ${totalStudents || "—"}` : "—"],
  ];
  infoItems.forEach(([label, value], i) => {
    const cx = infoStartX + (i % 3) * iColW;
    const cy = y + 5 + Math.floor(i / 3) * 11;
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150, 150, 150);
    doc.text(label.toUpperCase(), cx, cy);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
    doc.text(String(value ?? "—"), cx, cy + 5);
  });

  y += photoSize + 10;

  // ── 4. Academic Scores — full width ─────────────────────────────────────
  const fullW = pageW - margin * 2;
  const gap   = 5;
  const keyW  = 52;

  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
  doc.text("Academic Scores", margin, y);
  y += 5;

  const subjectColW = 46;
  const scoreColW   = Math.min(
    18,
    (fullW - subjectColW - 20 - 14 - 14) / Math.max(gradingFields.length, 1)
  );
  const totalColW = 20;
  const gradeColW = 14;
  const posColW   = 14;

  // Header
  doc.setFillColor(17, 17, 17);
  doc.rect(margin, y, fullW, 7, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
  let cx = margin + 3;
  doc.text("SUBJECT", cx, y + 5); cx += subjectColW;
  gradingFields.forEach((f) => {
    doc.text(`${f.field_name}/${f.max_score}`, cx, y + 5, { maxWidth: scoreColW - 1 });
    cx += scoreColW;
  });
  doc.text("TOTAL", cx, y + 5); cx += totalColW;
  doc.text("GRD",   cx, y + 5); cx += gradeColW;
  doc.text("POS",   cx, y + 5);
  y += 7;

  // Data rows
  const scoreRowH = 6.5;
  tableRows.forEach((row, idx) => {
    const total = row.scores
      ? gradingFields.reduce((s, f) => s + (Number(row.scores[f.field_name]) || 0), 0)
      : null;
    const grade = total !== null ? getGrade(total) : "—";
    const pos   = subjectPositions[row.subject_id] ?? "—";

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, fullW, scoreRowH, "F");
    }
    doc.setTextColor(17, 17, 17); doc.setFontSize(8); doc.setFont("helvetica", "normal");
    cx = margin + 3;
    doc.text(row.subject_name, cx, y + 4.5, { maxWidth: subjectColW - 2 }); cx += subjectColW;
    gradingFields.forEach((f) => {
      const v = row.scores ? (row.scores[f.field_name] ?? "—") : "—";
      doc.text(String(v), cx, y + 4.5); cx += scoreColW;
    });
    doc.setFont("helvetica", "bold");
    doc.text(total !== null ? String(total) : "—", cx, y + 4.5); cx += totalColW;
    doc.text(grade, cx, y + 4.5); cx += gradeColW;
    doc.text(String(pos), cx, y + 4.5);
    doc.setFont("helvetica", "normal");
    y += scoreRowH;
  });

  // Grand total footer
  doc.setFillColor(17, 17, 17);
  doc.rect(margin, y, fullW, 7, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
  cx = margin + 3;
  doc.text("GRAND TOTAL", cx, y + 5);
  cx += subjectColW + gradingFields.length * scoreColW;
  doc.text(String(grandTotal), cx, y + 5);
  y += 14;

  // ── 5. Behavioral Traits (left) | Grading Scale (right) ──────────────────
  if (behavioralTraits.length > 0 || gradingScheme.length > 0) {
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text("Behavioral Traits", margin, y); y += 5;

    const traitTableW  = fullW - keyW - gap;
    const traitNameW   = traitTableW * 0.72;
    const traitKeyX    = margin + traitTableW + gap;
    const traitRowH    = 6.5;
    const traitHeaderH = 7;

    // Left header — Traits
    doc.setFillColor(17, 17, 17);
    doc.rect(margin, y, traitTableW, traitHeaderH, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text("TRAIT", margin + 3, y + 5);
    doc.text("RATING", margin + traitNameW + 3, y + 5);

    // Right header — Grading Scale
    doc.setFillColor(17, 17, 17);
    doc.rect(traitKeyX, y, keyW, traitHeaderH, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont("helvetica", "bold");
    doc.text("GRADING SCALE", traitKeyX + keyW / 2, y + 5, { align: "center" });

    y += traitHeaderH;

    const maxRows = Math.max(behavioralTraits.length, gradingScheme.length);

    for (let i = 0; i < maxRows; i++) {
      const trait  = behavioralTraits[i] || null;
      const scheme = gradingScheme[i]    || null;

      if (i % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        if (trait)  doc.rect(margin,    y, traitTableW, traitRowH, "F");
        if (scheme) doc.rect(traitKeyX, y, keyW,        traitRowH, "F");
      }

      if (trait) {
        const rating = traitScores?.[trait] || "—";
        doc.setTextColor(17, 17, 17); doc.setFontSize(8); doc.setFont("helvetica", "normal");
        doc.text(trait, margin + 3, y + 4.3, { maxWidth: traitNameW - 4 });
        doc.setFont("helvetica", "bold");
        doc.text(String(rating), margin + traitNameW + 3, y + 4.3);
        doc.setFont("helvetica", "normal");
      }

      if (scheme) {
        doc.setTextColor(17, 17, 17); doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(scheme.grade_letter || "—", traitKeyX + 4, y + 4.3);
        doc.setFont("helvetica", "normal");
        doc.text(`${scheme.min_range}–${scheme.max_range}%`, traitKeyX + 12, y + 4.3);
      }

      y += traitRowH;
    }

    y += 10;
  }

  // ── 6. Remarks — no border, label + thin line + text ─────────────────────
  if (reportCard?.teacher_remark || reportCard?.principal_remark) {
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(17, 17, 17);
    doc.text("Remarks", margin, y); y += 7;

    const remarkW = (pageW - margin * 2 - 10) / 2;

    [
      ["Teacher's Remark",   reportCard.teacher_remark],
      ["Principal's Remark", reportCard.principal_remark],
    ].forEach(([label, text], i) => {
      const rx = margin + i * (remarkW + 10);

      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(150, 150, 150);
      doc.text(label.toUpperCase(), rx, y);

      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(rx, y + 2, rx + remarkW, y + 2);

      doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
      const lines = doc.splitTextToSize(text || "No remark added.", remarkW);
      doc.text(lines.slice(0, 3), rx, y + 8);
    });

    y += 24;
  }

  // ── 7. Footer band ────────────────────────────────────────────────────────
  doc.setFillColor(17, 17, 17);
  doc.rect(0, pageH - 12, pageW, 12, "F");
  doc.setTextColor(150, 150, 150); doc.setFontSize(7); doc.setFont("helvetica", "normal");
  doc.text(school?.school_name || "", margin, pageH - 5);
  doc.text(`${sessionName}  ·  ${termName}`, col2, pageH - 5, { align: "center" });
  doc.text("Page 1", pageW - margin, pageH - 5, { align: "right" });

  doc.save(`report_${studentName.replace(/\s+/g, "_")}_${termName}.pdf`);
};
