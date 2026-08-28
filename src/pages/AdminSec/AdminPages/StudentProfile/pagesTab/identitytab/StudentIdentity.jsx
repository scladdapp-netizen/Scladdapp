import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import StudentInfoCard from "../../components/studentInfoCard/StudentInfoCard";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import {
  useFetchStudentDetail,
  useCloseAdmission,
} from "../../../../../../api_call";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import "./StudentIdentity.css";

const StudentIdentity = () => {
  const { schoolId, studentId } = useParams();
  const { studentData, refetch: refreshStudentData } = useFetchStudentDetail(
    schoolId,
    studentId
  );
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Permission helper
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canDelete = isSuperAdmin || !!admin?.permissions?.students?.delete;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.students?.edit;
  const { loading: closingAdmission, closeAdmission } = useCloseAdmission();

  // Check if student has graduated (has an alumni record)
  const [alumniRecord, setAlumniRecord] = useState(null);
  useEffect(() => {
    if (!studentId) return;
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/alumni/school/${schoolId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const found = (d.data || []).find((a) => a.student_id === studentId);
          setAlumniRecord(found || null);
        }
      })
      .catch(() => {});
  }, [studentId, schoolId]);
  const [showRemovePanel, setShowRemovePanel] = useState(false);
  const [removeRemarks, setRemoveRemarks] = useState("");
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleResendInvite = async () => {
    const student = studentData?.student;
    if (!student?.student_id) return;
    setIsSendingInvite(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/student/${student.student_id}/resend-invite`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const result = await res.json();
      if (result.success) {
        addNotification(result.message || "Invite link sent successfully", "success");
        setShowInvitePanel(false);
      } else {
        addNotification(result.message || "Failed to send invite link", "error");
      }
    } catch {
      addNotification("An error occurred while sending the invite link", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleExportStudent = async () => {
    try {
      if (!studentData || !studentData.student) {
        addNotification("No student data to export", "error");
        return;
      }

      const { student, admissions, guardians } = studentData;
      const primaryGuardian =
        guardians?.find((g) => g.is_primary) || guardians?.[0];
      const activeAdmission =
        admissions?.find((a) => a.school_id === schoolId) ||
        admissions?.find((a) => a.active_status) ||
        admissions?.[0];
      const schoolName =
        user?.school?.school_name ||
        activeAdmission?.school_name ||
        "School";
      const classLabel =
        activeAdmission?.admission_class || student.current_class || "";
      const initials = (student.full_name || "?")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      const loadPhotoDataUrl = async (url) => {
        if (!url) return null;
        if (String(url).startsWith("data:")) return url;
        try {
          const res = await fetch(url, { mode: "cors", credentials: "omit" });
          if (!res.ok) throw new Error("fetch failed");
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || 128;
            canvas.height = img.naturalHeight || 128;
            canvas.getContext("2d").drawImage(img, 0, 0);
            return canvas.toDataURL("image/jpeg", 0.92);
          } catch {
            return null;
          }
        }
      };

      const photoDataUrl = await loadPhotoDataUrl(student.student_photo);

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentW = pageW - margin * 2;
      let y = 0;

      const ensureSpace = (need = 40) => {
        if (y + need > pageH - 48) {
          doc.addPage();
          y = 40;
        }
      };

      // ── Black header with photo ──
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 110, "F");

      const avatarX = margin + 32;
      const avatarY = 55;
      const avatarR = 28;

      if (photoDataUrl) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 112;
          canvas.height = 112;
          const ctx = canvas.getContext("2d");
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = photoDataUrl;
          });
          ctx.beginPath();
          ctx.arc(56, 56, 56, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, 0, 0, 112, 112);
          doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", margin, 27, 56, 56);
        } catch {
          doc.setFillColor(255, 255, 255);
          doc.circle(avatarX, avatarY, avatarR, "F");
      doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(17, 17, 17);
          doc.text(initials, avatarX, avatarY + 5, { align: "center" });
        }
      } else {
        doc.setFillColor(255, 255, 255);
        doc.circle(avatarX, avatarY, avatarR, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(17, 17, 17);
        doc.text(initials, avatarX, avatarY + 5, { align: "center" });
      }

      const textX = margin + 72;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(student.full_name || "Student Profile", textX, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(190, 190, 190);
      doc.text(
        [student.admission_number, classLabel, student.gender].filter(Boolean).join("  ·  ") || "Student",
        textX,
        60
      );
      doc.setFontSize(8.5);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `ID ${student.student_id?.substring(0, 16) || "N/A"}  ·  ${new Date().toLocaleString()}`,
        textX,
        76
      );
      y = 130;

      const drawSection = (title) => {
        ensureSpace(36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 5, pageW - margin, y + 5);
        y += 18;
      };

      // 2-column professional field grid
      const drawFields = (pairs) => {
        const colW = contentW / 2;
        const rowH = 28;
        for (let i = 0; i < pairs.length; i += 2) {
          ensureSpace(rowH + 4);
          const left = pairs[i];
          const right = pairs[i + 1];
          const drawOne = (item, x) => {
            if (!item) return;
        doc.setFont("helvetica", "bold");
            doc.setFontSize(7.5);
            doc.setTextColor(150, 150, 150);
            doc.text(String(item[0]).toUpperCase(), x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
            doc.setTextColor(17, 17, 17);
            const lines = doc.splitTextToSize(String(item[1] || "—"), colW - 12);
            doc.text(lines[0], x, y + 12);
          };
          drawOne(left, margin);
          if (right) drawOne(right, margin + colW);
          y += rowH;
        }
      y += 8;
      };

      drawSection("Student Information");
      drawFields([
        ["Full Name", student.full_name],
        ["Admission No.", student.admission_number],
        ["Date of Birth", student.date_of_birth],
        ["Gender", student.gender],
        ["Email", student.email],
        ["Phone", student.phone],
        ["WhatsApp", student.whatsapp],
        ["Religion", student.religion],
        ["Nationality", student.nationality],
      ]);

      drawSection("Identity / bio");
      drawFields([
        ["Place of Birth", student.place_of_birth],
        ["LGA of Origin", student.lga_of_origin],
        ["State of Origin", student.state_of_origin],
        ["Tribe / Ethnic Group", student.tribe],
        ["NIN", student.nin],
        ["Number of Siblings", student.number_of_siblings],
        ["Position in Family", student.family_position],
        ["Lives With", student.lives_with],
        ["Blood Group", student.blood_group],
        ["Genotype", student.genotype],
      ]);

      drawSection("Residence");
      drawFields([
        ["House / Street", student.house_number_street],
        ["Area / Estate", student.area_estate],
        ["City", student.city],
        ["LGA of Residence", student.lga_of_residence],
        ["State of Residence", student.state_of_residence],
        ["Landmark", student.landmark],
      ]);

      drawSection("Emergency Contact");
      drawFields([
        ["Name", student.emergency_contact_name],
        ["Relationship", student.emergency_contact_relationship],
        ["Phone", student.emergency_contact_phone],
        ["WhatsApp", student.emergency_contact_whatsapp],
      ]);

      drawSection("Academic Information");
      drawFields([
        ["Admission Number", student.admission_number],
        ["Current Class", classLabel],
        ["Admission Date", activeAdmission?.admitted_date],
        ["Session", activeAdmission?.admission_session],
      ]);

      if (primaryGuardian) {
        drawSection("Guardian Information");
        drawFields([
          ["Guardian Name", primaryGuardian.guardian_name],
          ["Relationship", primaryGuardian.guardian_relationship],
          ["Phone", primaryGuardian.guardian_phone],
          ["WhatsApp", primaryGuardian.guardian_whatsapp],
          ["Email", primaryGuardian.guardian_email],
          ["Occupation", primaryGuardian.guardian_occupation],
        ]);
      }

      // Soft fade footer on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(236, 236, 236);
        doc.line(margin, pageH - 30, pageW - margin, pageH - 30);
      doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(180, 180, 180);
        doc.text(schoolName, margin, pageH - 16);
        doc.text("ScladApp", pageW - margin, pageH - 16, { align: "right" });
      }

      doc.save(`student_${(student.full_name || "profile").replace(/\s+/g, "_")}.pdf`);
      addNotification("Student profile exported as PDF", "success");
    } catch (error) {
      console.error("Export error:", error);
      addNotification("Failed to export student data", "error");
    }
  };

  const handlePrintStudent = () => {
    try {
      if (!studentData || !studentData.student) {
        addNotification("No student data to print", "error");
        return;
      }

      const { student, admissions, guardians } = studentData;
      const primaryGuardian =
        guardians?.find((g) => g.is_primary) || guardians?.[0];
      const activeAdmission =
        admissions?.find((a) => a.school_id === schoolId) ||
        admissions?.find((a) => a.active_status) ||
        admissions?.[0];
      const schoolName =
        user?.school?.school_name ||
        activeAdmission?.school_name ||
        "School";
      const classLabel =
        activeAdmission?.admission_class || student.current_class || "";
      const isActive = activeAdmission?.active_status === true;

      const esc = (v) =>
        String(v || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      const val = (v) => (v ? esc(v) : '<span style="color:#bbb">—</span>');

      const field = (label, value) => `
        <div class="field">
          <div class="flabel">${esc(label)}</div>
          <div class="fval">${val(value)}</div>
        </div>`;

      const section = (title, fields) => `
        <div class="section">
          <div class="section-head">
            <span class="section-title">${esc(title)}</span>
          </div>
          <div class="grid">${fields}</div>
        </div>`;

      const photo = student.student_photo
        ? `<img src="${esc(student.student_photo)}" class="avatar" alt="photo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
           <div class="avatar-placeholder" style="display:none">${esc((student.full_name || "?").charAt(0).toUpperCase())}</div>`
        : `<div class="avatar-placeholder">${esc((student.full_name || "?").charAt(0).toUpperCase())}</div>`;

      const html = `<!DOCTYPE html>
<html lang="en">
          <head>
<meta charset="UTF-8"/>
<title>Student Profile — ${esc(student.full_name)}</title>
            <style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#111;padding:32px 24px}
.wrap{max-width:820px;margin:0 auto}
.header{background:#111;border-radius:16px;padding:28px 32px;overflow:hidden;margin-bottom:20px;position:relative}
.header::before{content:"";position:absolute;width:160px;height:160px;border-radius:50%;border:20px solid rgba(255,255,255,0.05);top:-50px;right:-40px}
.header-inner{position:relative;z-index:1;display:flex;align-items:center;gap:20px}
.avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.18);flex-shrink:0}
.avatar-placeholder{width:72px;height:72px;border-radius:50%;background:rgba(255,255,255,0.1);border:2px solid rgba(255,255,255,0.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:24px;font-weight:700}
.header-name{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.15;margin-bottom:6px}
.header-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.badge{display:inline-flex;align-items:center;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.12)}
.header-id{font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.print-date{font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px}
.card{background:#fff;border-radius:16px;padding:28px 32px;border:1px solid #e8e8e8}
.section{margin-bottom:24px}
.section:last-child{margin-bottom:0}
.section-head{margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e8e8e8}
.section-title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#111}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px}
.flabel{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#aaa;margin-bottom:3px}
.fval{font-size:12.5px;font-weight:600;color:#111;line-height:1.4}
.footer{margin-top:18px;display:flex;align-items:center;justify-content:space-between;padding:10px 4px;opacity:.35}
.footer-school{font-size:10px;font-weight:600;color:#111;letter-spacing:.02em}
.footer-brand{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#111}
@media print{
  body{background:#fff;padding:0}
  .header{border-radius:0;margin-bottom:0}
  .card{border-radius:0;border:none;border-top:1px solid #e8e8e8}
  .section{page-break-inside:avoid}
  .footer{opacity:.28}
}
@media (max-width:640px){.grid{grid-template-columns:1fr 1fr}}
            </style>
          </head>
          <body>
<div class="wrap">
            <div class="header">
    <div class="header-inner">
      ${photo}
      <div>
        <div class="header-name">${esc(student.full_name || "Student Profile")}</div>
        <div class="header-meta">
          ${student.admission_number ? `<span class="badge">${esc(student.admission_number)}</span>` : ""}
          ${classLabel ? `<span class="badge">${esc(classLabel)}</span>` : ""}
          ${student.gender ? `<span class="badge">${esc(student.gender)}</span>` : ""}
          <span class="badge">${isActive ? "● Active" : "○ Inactive"}</span>
            </div>
        <div class="header-id">ID: ${esc(student.student_id?.substring(0, 16) || "N/A")}</div>
        <div class="print-date">Printed ${new Date().toLocaleString()}</div>
            </div>
    </div>
            </div>

  <div class="card">
    ${section("Student Information",
      field("Full Name", student.full_name) +
      field("Admission No.", student.admission_number) +
      field("Date of Birth", student.date_of_birth) +
      field("Gender", student.gender) +
      field("Email", student.email) +
      field("Phone", student.phone) +
      field("WhatsApp", student.whatsapp) +
      field("Religion", student.religion) +
      field("Nationality", student.nationality)
    )}
    ${section("Identity / bio",
      field("Place of Birth", student.place_of_birth) +
      field("LGA of Origin", student.lga_of_origin) +
      field("State of Origin", student.state_of_origin) +
      field("Tribe / Ethnic Group", student.tribe) +
      field("NIN", student.nin) +
      field("Number of Siblings", student.number_of_siblings) +
      field("Position in Family", student.family_position) +
      field("Lives With", student.lives_with) +
      field("Blood Group", student.blood_group) +
      field("Genotype", student.genotype)
    )}
    ${section("Residence",
      field("House Number / Street", student.house_number_street) +
      field("Area / Estate", student.area_estate) +
      field("City", student.city) +
      field("LGA of Residence", student.lga_of_residence) +
      field("State of Residence", student.state_of_residence) +
      field("Landmark", student.landmark)
    )}
    ${section("Emergency Contact",
      field("Name", student.emergency_contact_name) +
      field("Relationship", student.emergency_contact_relationship) +
      field("Phone", student.emergency_contact_phone) +
      field("WhatsApp", student.emergency_contact_whatsapp)
    )}
    ${section("Academic Information",
      field("Admission Number", student.admission_number) +
      field("Current Class", classLabel) +
      field("Admission Date", activeAdmission?.admitted_date) +
      field("Session", activeAdmission?.admission_session)
    )}
            ${
              primaryGuardian
        ? section(
            "Guardian Information",
            field("Guardian Name", primaryGuardian.guardian_name) +
              field("Relationship", primaryGuardian.guardian_relationship) +
              field("Phone", primaryGuardian.guardian_phone) +
              field("WhatsApp", primaryGuardian.guardian_whatsapp) +
              field("Email", primaryGuardian.guardian_email) +
              field("Occupation", primaryGuardian.guardian_occupation)
          )
        : ""
    }
  </div>

  <div class="footer">
    <span class="footer-school">${esc(schoolName)}</span>
    <span class="footer-brand">ScladApp</span>
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
          </body>
</html>`;

      const w = window.open("", "_blank");
      w.document.open();
      w.document.write(html);
      w.document.close();
      addNotification("Print dialog opened", "success");
    } catch (error) {
      console.error("Print error:", error);
      addNotification("Failed to open print dialog", "error");
    }
  };

  const handleRemoveFromSchool = async () => {
    try {
      if (!studentData || !studentData.admissions) {
        addNotification("No admission data found", "error");
        return;
      }

      // Get the active admission for this school
      const activeAdmission = studentData.admissions.find(
        (a) => a.school_id === schoolId && a.active_status === true
      );

      if (!activeAdmission) {
        addNotification("No active admission found for this school", "error");
        return;
      }

      // Close the admission
      const result = await closeAdmission(
        activeAdmission.admission_id,
        new Date().toISOString().split("T")[0],
        removeRemarks || "Student removed from school"
      );

      if (result.success) {
        addNotification(
          `${studentData.student.full_name} has been removed from the school`,
          "success"
        );
        setShowRemovePanel(false);
        setRemoveRemarks("");

        // Refresh student data to reflect the change
        if (refreshStudentData) {
          await refreshStudentData();
        }
      } else {
        addNotification(result.message || "Failed to remove student", "error");
      }
    } catch (error) {
      console.error("Remove student error:", error);
      addNotification("Failed to remove student from school", "error");
    }
  };

  const handleOpenEdit = () => {
    if (!canEdit) {
      addNotification("You do not have permission to edit student information.", "error");
      return;
    }
    if (!studentData?.student) return;
    const s = studentData.student;
    setEditForm({
      fullName: s.full_name || "",
      email: s.email || "",
      phone: s.phone || "",
      whatsapp: s.whatsapp || "",
      dateOfBirth: s.date_of_birth || "",
      gender: s.gender || "",
      religion: s.religion || "",
      nationality: s.nationality || "",
      stateOfOrigin: s.state_of_origin || "",
      placeOfBirth: s.place_of_birth || "",
      lgaOfOrigin: s.lga_of_origin || "",
      tribe: s.tribe || "",
      nin: s.nin || "",
      numberOfSiblings: s.number_of_siblings || "",
      familyPosition: s.family_position || "",
      livesWith: s.lives_with || "",
      bloodGroup: s.blood_group || "",
      genotype: s.genotype || "",
      houseNumberStreet: s.house_number_street || "",
      areaEstate: s.area_estate || "",
      city: s.city || "",
      lgaOfResidence: s.lga_of_residence || "",
      stateOfResidence: s.state_of_residence || "",
      landmark: s.landmark || "",
      emergencyContactName: s.emergency_contact_name || "",
      emergencyContactPhone: s.emergency_contact_phone || "",
      emergencyContactWhatsapp: s.emergency_contact_whatsapp || "",
      emergencyContactRelationship: s.emergency_contact_relationship || "",
      studentPhoto: s.student_photo || null,
    });
    setEditPhotoPreview(s.student_photo || null);
    setShowEditPanel(true);
  };

  const handleEditPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditPhotoPreview(ev.target.result);
      setEditForm(prev => ({ ...prev, studentPhoto: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/student/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, modified_by: user?.admin?.admin_id || user?.user_id }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Student updated successfully!", "success");
        setShowEditPanel(false);
        refreshStudentData();
      } else {
        addNotification(data.message || "Failed to update student", "error");
      }
    } catch {
      addNotification("Failed to update student", "error");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <InnerTabCon>
      {/* Admission Status Card */}
      {studentData &&
        studentData.admissions &&
        studentData.admissions.length > 0 &&
        (() => {
          // Get the admission for THIS school (filter by schoolId)
          const schoolAdmission = studentData.admissions.find(
            (a) => a.school_id === schoolId
          );

          if (!schoolAdmission) return null;

          const isActive = schoolAdmission.active_status === true;
          const isGraduated = !!alumniRecord;

          const statusClass = isGraduated ? "graduated" : isActive ? "active" : "inactive";
          const statusLabel = isGraduated ? "🎓 GRADUATED" : isActive ? "✓ ACTIVE" : "✗ INACTIVE";

          return (
            <div className={`si-status-card ${statusClass}`}>
              <div className="si-status-inner">
              <div className="si-status-header">
                <h3 className="si-status-title">Admission Status</h3>
                <span className="si-status-badge">{statusLabel}</span>
              </div>

              <div className="si-status-grid">
                <div className="si-status-item">
                  <span className="si-status-label">Admission Date</span>
                  <span className="si-status-value">
                    {schoolAdmission.admitted_date
                      ? new Date(schoolAdmission.admitted_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                      : "N/A"}
                  </span>
                </div>

                {!isActive && schoolAdmission.close_date && (
                  <div className="si-status-item">
                    <span className="si-status-label">Close Date</span>
                    <span className="si-status-value">
                      {new Date(schoolAdmission.close_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                )}

                <div className="si-status-item">
                  <span className="si-status-label">Session</span>
                  <span className="si-status-value">{schoolAdmission.admission_session || "N/A"}</span>
                </div>

                <div className="si-status-item">
                  <span className="si-status-label">Class</span>
                  <span className="si-status-value">{schoolAdmission.admission_class || "N/A"}</span>
                </div>
              </div>

              {isGraduated && (
                <div className="si-status-extra">
                  <span className="si-status-label">Graduation Date</span>
                  <span className={`si-status-value grad`}>
                    {alumniRecord.graduation_date
                      ? new Date(alumniRecord.graduation_date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                      : alumniRecord.graduation_session_name || "—"}
                  </span>
                </div>
              )}

              {!isActive && schoolAdmission.remarks && (
                <div className="si-status-extra">
                  <span className="si-status-label">Removal Reason</span>
                  <span className="si-status-remarks">{schoolAdmission.remarks}</span>
                </div>
              )}
              </div>
            </div>
          );
        })()}

      <StudentInfoCard
        studentData={studentData}
        schoolId={schoolId}
        onExport={handleExportStudent}
        onPrint={handlePrintStudent}
        onEdit={handleOpenEdit}
        onResendInvite={() => setShowInvitePanel(true)}
        onRemoveFromSchool={() => {
          if (!canDelete) {
            addNotification("You do not have permission to remove students from school.", "error");
            return;
          }
          setShowRemovePanel(true);
        }}
      />

      {/* Resend Invite Panel */}
      <SlideInMenu isShow={showInvitePanel} onClose={() => setShowInvitePanel(false)} width="480px">
        <div className="si-pwd-panel">
          <div className="si-pwd-header">
            <span className="si-pwd-deco" aria-hidden="true" />
            <div className="si-pwd-header-content">
              <div className="si-pwd-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <h2 className="si-pwd-title">Resend Invite Link</h2>
                <p className="si-pwd-subtitle">{studentData?.student?.full_name}</p>
              </div>
            </div>
          </div>
          <div className="si-pwd-body">
            <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8e8e8" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 6 }}>What happens when you resend?</div>
              <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "The previous invite link is immediately invalidated",
                  "A new secure link is generated and sent to their email",
                  "The new link expires in 48 hours",
                  "The student sets their own password via the link",
                ].map((t) => (
                  <li key={t} style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 2 }}>Sending to</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{studentData?.student?.email}</div>
              </div>
            </div>
          </div>
          <div className="si-pwd-footer">
            <Button variant="secondary" onClick={() => setShowInvitePanel(false)} disabled={isSendingInvite}>Cancel</Button>
            <Button onClick={handleResendInvite} disabled={isSendingInvite}>
              {isSendingInvite ? "Sending..." : "Send Invite Link"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Remove from School Panel */}
      <SlideInMenu
        isShow={showRemovePanel}
        onClose={() => { setShowRemovePanel(false); setRemoveRemarks(""); }}
        width="500px"
      >
        <div className="si-remove-container">
          <div className="si-remove-header">
            <span className="si-remove-deco" aria-hidden="true" />
            <div className="si-remove-header-content">
              <div className="si-remove-icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                  <path d="M3 19c0-3.9 3.6-7 8-7s8 3.1 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M15 4l6 6M21 4l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3>Remove Student from School</h3>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>

          <div className="si-remove-body">
            <div className="si-remove-student-info">
              <span className="si-remove-student-name">{studentData?.student?.full_name}</span>
              <span className="si-remove-student-id">{studentData?.student?.student_id}</span>
            </div>

            <div className="si-remove-warn">
              ⚠️ You are about to remove this student from the school. This will set the admission status to inactive.
            </div>

            <div>
              <p className="si-remove-effects-title">Removing this student will:</p>
              <ul className="si-remove-effects">
                <li>Set the admission status to inactive</li>
                <li>Record the close date as today</li>
                <li>Prevent access to school resources</li>
                <li>Remove from active student lists</li>
                <li>Preserve all historical records and data</li>
              </ul>
            </div>

            <div className="si-remove-field">
              <label>Reason for Removal (Optional)</label>
              <textarea
                value={removeRemarks}
                onChange={e => setRemoveRemarks(e.target.value)}
                placeholder="e.g. Graduated, Transferred, Withdrawn..."
              />
            </div>

            <p className="si-remove-danger-note">The student can be re-enrolled later if needed.</p>
          </div>

          <div className="si-remove-footer">
            <Button variant="secondary" onClick={() => { setShowRemovePanel(false); setRemoveRemarks(""); }} disabled={closingAdmission}>Cancel</Button>
            <Button variant="danger" onClick={handleRemoveFromSchool} disabled={closingAdmission}>
              {closingAdmission ? "Removing..." : "Remove Student"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Edit Student Panel */}
      <SlideInMenu isShow={showEditPanel} onClose={() => setShowEditPanel(false)} width="620px">
        <div className="si-edit-container">
          <div className="si-edit-header">
            <span className="si-edit-deco"  aria-hidden="true" />
            <span className="si-edit-deco2" aria-hidden="true" />
            <div className="si-edit-header-content">
              <div className="si-edit-header-icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="si-edit-header-text">
                <h2>Edit Student</h2>
                <p>Update student information</p>
              </div>
            </div>
          </div>

          <div className="si-edit-body">
            {/* Photo row */}
            <div className="si-edit-photo-row">
              <div className="si-edit-photo-wrap">
                {editPhotoPreview
                  ? <img src={editPhotoPreview} alt="Photo" />
                  : <span className="si-edit-photo-placeholder">👤</span>
                }
              </div>
              <div className="si-edit-photo-info">
                <p className="si-edit-photo-title">Profile Photo</p>
                <label className="si-edit-photo-change">
                  Change Photo
                  <input type="file" accept="image/*" className="si-hidden-input" onChange={handleEditPhotoChange} />
                </label>
              </div>
            </div>

            <div className="si-edit-section-title">Personal Information</div>
            <div className="si-edit-grid">
              {[
                { label: "Full Name *", key: "fullName", type: "text" },
                { label: "Date of Birth", key: "dateOfBirth", type: "date" },
                { label: "Email", key: "email", type: "email" },
                { label: "Phone", key: "phone", type: "text" },
                { label: "WhatsApp number", key: "whatsapp", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} className="si-edit-field">
                  <label>{label}</label>
                  <input type={type} value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
              <div className="si-edit-field">
                <label>Gender</label>
                <select value={editForm.gender || ""} onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="si-edit-section-title">Identity / bio</div>
            <div className="si-edit-grid">
              {[
                { label: "Religion", key: "religion", type: "text" },
                { label: "Nationality", key: "nationality", type: "text" },
                { label: "State of Origin", key: "stateOfOrigin", type: "text" },
                { label: "LGA of origin", key: "lgaOfOrigin", type: "text" },
                { label: "Place of birth", key: "placeOfBirth", type: "text" },
                { label: "Tribe / ethnic group", key: "tribe", type: "text" },
                { label: "NIN", key: "nin", type: "text" },
                { label: "Number of siblings", key: "numberOfSiblings", type: "text" },
                { label: "Position in the family", key: "familyPosition", type: "text" },
                { label: "Blood Group", key: "bloodGroup", type: "text" },
                { label: "Genotype", key: "genotype", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key} className="si-edit-field">
                  <label>{label}</label>
                  <input type={type} value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            <div className="si-edit-field">
                <label>Lives with</label>
                <select value={editForm.livesWith || ""} onChange={e => setEditForm(p => ({ ...p, livesWith: e.target.value }))}>
                  <option value="">— Select —</option>
                  <option value="Both parents">Both parents</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Single parent">Single parent</option>
                  <option value="Orphan">Orphan</option>
                </select>
              </div>
            </div>

            <div className="si-edit-section-title">Residence</div>
            <div className="si-edit-grid">
              {[
                { label: "House number / street", key: "houseNumberStreet" },
                { label: "Area / estate", key: "areaEstate" },
                { label: "City", key: "city" },
                { label: "LGA of residence", key: "lgaOfResidence" },
                { label: "State of residence", key: "stateOfResidence" },
                { label: "Landmark", key: "landmark" },
              ].map(({ label, key }) => (
                <div key={key} className="si-edit-field">
                  <label>{label}</label>
                  <input type="text" value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div className="si-edit-section-title">Emergency Contact</div>
            <div className="si-edit-grid">
              {[
                { label: "Name", key: "emergencyContactName" },
                { label: "Relationship", key: "emergencyContactRelationship" },
                { label: "Phone", key: "emergencyContactPhone" },
                { label: "WhatsApp number", key: "emergencyContactWhatsapp" },
              ].map(({ label, key }) => (
                <div key={key} className="si-edit-field">
                  <label>{label}</label>
                  <input type="text" value={editForm[key] || ""} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>

          <div className="si-edit-footer">
            <Button variant="secondary" onClick={() => setShowEditPanel(false)} disabled={editSaving}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving || !editForm.fullName}>
              {editSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default StudentIdentity;
