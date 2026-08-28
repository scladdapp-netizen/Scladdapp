import React, { useState } from "react";
import "./StaffIdentity.css";
import StaffInfoCard from "../../components/staffInfoCard/StaffInfoCard";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import StaffFormPanel from "../../../SchoolDirectory/Staff/StaffFormPanel";
import Button from "../../../../../../components/Button/Button";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";

const StaffIdentity = ({ staffData: propStaffData, onStaffUpdate, refreshStaffData }) => {
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.staff?.edit;

  const [showEditStaffMenu, setShowEditStaffMenu]     = useState(false);
  const [showPasswordModal, setShowPasswordModal]     = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal]     = useState(false);
  const [isUpdating, setIsUpdating]                   = useState(false);

  const staffData = propStaffData?.staff || propStaffData;
  const [staffStatus, setStaffStatus] = useState(staffData?.record_status || "active");

  const currentStaffData = staffData ? {
    staff_id: staffData.staff_id,
    fullName: staffData.full_name || "",
    email: staffData.email || "",
    phone: staffData.phone || "",
    whatsapp: staffData.whatsapp || "",
    position: staffData.position || "",
    department: staffData.department || "",
    qualification: staffData.qualification || "",
    experienceYears: staffData.experience_years || "",
    experience: staffData.experience_years ?? "",
    employmentType: staffData.employment_type || "",
    joiningDate: staffData.joining_date || "",
    emergencyContact: staffData.emergency_contact_name || "",
    emergencyContactPhone: staffData.emergency_contact_phone || "",
    emergencyContactRelationship: staffData.emergency_contact_relationship || "",
    emergencyContactWhatsapp: staffData.emergency_contact_whatsapp || "",
    dateOfBirth: staffData.date_of_birth || "",
    gender: staffData.gender || "",
    religion: staffData.religion || "",
    maritalStatus: staffData.marital_status || "",
    nationality: staffData.nationality || "",
    stateOfOrigin: staffData.state_of_origin || "",
    placeOfBirth: staffData.place_of_birth || "",
    lgaOfOrigin: staffData.lga_of_origin || "",
    tribe: staffData.tribe || "",
    nin: staffData.nin || staffData.national_id || "",
    houseNumberStreet: staffData.house_number_street || "",
    areaEstate: staffData.area_estate || "",
    city: staffData.city || "",
    lgaOfResidence: staffData.lga_of_residence || "",
    stateOfResidence: staffData.state_of_residence || "",
    landmark: staffData.landmark || "",
    bloodGroup: staffData.blood_group || "",
    genotype: staffData.genotype || "",
    staffPhoto: staffData.staff_photo || "",
  } : null;

  const handleUpdateStaff = async () => {
    if (refreshStaffData) await refreshStaffData();
    setShowEditStaffMenu(false);
  };

  const handleToggleStatus = async () => {
    const newStatus = staffStatus === "active" ? "inactive" : "active";
    setIsUpdating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/staff/${staffData.staff_id}/record-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordStatus: newStatus, modified_by: user?.admin?.admin_id || user?.user_id }),
      });
      const result = await res.json();
      if (result.success) {
        setStaffStatus(newStatus);
        addNotification(`Staff record ${newStatus === "active" ? "activated" : "deactivated"} successfully`, newStatus === "active" ? "success" : "warning");
        setShowDeactivateModal(false);
        setShowActivateModal(false);
        if (refreshStaffData) await refreshStaffData();
      } else {
        addNotification(result.message || "Failed to update staff record status", "error");
      }
    } catch {
      addNotification("An error occurred while updating staff record status", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!staffData) { addNotification("No staff data to export", "error"); return; }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40; let y = 50;

      // ── Header banner ──
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 90, "F");

      // Profile photo in header
      if (staffData.staff_photo) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve; img.onerror = reject;
            img.src = staffData.staff_photo;
          });
          const canvas = document.createElement("canvas");
          canvas.width = 60; canvas.height = 60;
          const ctx = canvas.getContext("2d");
          ctx.beginPath(); ctx.arc(30, 30, 30, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(img, 0, 0, 60, 60);
          const imgData = canvas.toDataURL("image/jpeg");
          doc.addImage(imgData, "JPEG", margin, 15, 60, 60);
        } catch { /* skip photo if load fails */ }
      }

      const textX = staffData.staff_photo ? margin + 72 : margin;
      doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(255,255,255);
      doc.text(staffData.full_name || "Staff Profile", textX, 38);
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(180,180,180);
      doc.text(`${staffData.position || ""}${staffData.department ? "  ·  " + staffData.department : ""}  ·  ID: ${staffData.staff_id || "N/A"}`, textX, 56);
      doc.setFontSize(9); doc.setTextColor(140,140,140);
      doc.text(`Generated ${new Date().toLocaleString()}`, textX, 72);
      y = 115;

      const section = (title) => {
        if (y > 750) { doc.addPage(); y = 40; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(136,136,136);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(220,220,220); doc.line(margin, y+4, pageW-margin, y+4);
        y += 20;
      };

      const row = (label, value) => {
        if (y > 760) { doc.addPage(); y = 40; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(136,136,136);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(34,34,34);
        const val = String(value || "N/A");
        const lines = doc.splitTextToSize(val, pageW - margin - 160);
        doc.text(lines, margin + 150, y);
        y += lines.length > 1 ? lines.length * 13 : 16;
      };

      section("Staff Information");
      row("Full Name",        staffData.full_name);
      row("Staff ID",         staffData.staff_id);
      row("Date of Birth",    staffData.date_of_birth);
      row("Gender",           staffData.gender);
      row("Email",            staffData.email);
      row("Phone",            staffData.phone);
      row("WhatsApp",         staffData.whatsapp);
      row("Religion",         staffData.religion);
      row("Marital Status",   staffData.marital_status);
      row("Nationality",      staffData.nationality);
      y += 6;

      section("Identity / bio");
      row("Place of Birth",   staffData.place_of_birth);
      row("LGA of Origin",    staffData.lga_of_origin);
      row("State of Origin",  staffData.state_of_origin);
      row("Tribe / Ethnic Group", staffData.tribe);
      row("NIN",              staffData.nin || staffData.national_id);
      row("Blood Group",      staffData.blood_group);
      row("Genotype",         staffData.genotype);
      y += 6;

      section("Residence");
      row("House / Street",     staffData.house_number_street);
      row("Area / Estate",      staffData.area_estate);
      row("City",               staffData.city);
      row("LGA of Residence",   staffData.lga_of_residence);
      row("State of Residence", staffData.state_of_residence);
      row("Landmark",           staffData.landmark);
      y += 6;

      section("Employment Information");
      row("Position",         staffData.position);
      row("Department",       staffData.department);
      row("Qualification",    staffData.qualification);
      row("Experience",       staffData.experience_years ? `${staffData.experience_years} years` : null);
      row("Employment Type",  staffData.employment_type);
      row("Joining Date",     staffData.joining_date);
      y += 6;

      section("Emergency Contact");
      row("Name",             staffData.emergency_contact_name);
      row("Relationship",     staffData.emergency_contact_relationship);
      row("Phone",            staffData.emergency_contact_phone);
      row("WhatsApp",         staffData.emergency_contact_whatsapp);

      doc.save(`staff_${(staffData.full_name || "profile").replace(/\s+/g,"_")}.pdf`);
      addNotification("Staff profile exported as PDF", "success");
    } catch (err) {
      console.error(err);
      addNotification("Failed to export staff data", "error");
    }
  };

  const handlePrintStaff = () => {
    if (!staffData) { addNotification("No staff data to print", "error"); return; }

    const esc = (v) => String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const val = (v) => v ? esc(v) : '<span style="color:#bbb">—</span>';

    const field = (label, value) => `
      <div class="field">
        <div class="flabel">${esc(label)}</div>
        <div class="fval">${val(value)}</div>
      </div>`;

    const section = (title, svgPath, fields) => `
      <div class="section">
        <div class="section-head">
          <div class="section-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
          </div>
          <span class="section-title">${esc(title)}</span>
        </div>
        <div class="grid">${fields}</div>
      </div>`;

    const photo = staffData.staff_photo
      ? `<img src="${esc(staffData.staff_photo)}" class="avatar" alt="photo" onerror="this.style.display='none'"/>`
      : `<div class="avatar-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Staff Profile — ${esc(staffData.full_name)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#111;padding:32px 24px}

/* ── outer wrap with decorative shapes ── */
.wrap{max-width:820px;margin:0 auto;position:relative}
.wrap::before{content:"";position:absolute;width:200px;height:200px;border-radius:50%;border:24px solid rgba(0,0,0,0.04);top:-70px;right:-60px;pointer-events:none}
.wrap::after{content:"";position:absolute;width:80px;height:80px;border-radius:14px;border:2px solid rgba(0,0,0,0.05);bottom:40px;right:80px;transform:rotate(22deg);pointer-events:none}
.dc{position:absolute;width:130px;height:130px;border-radius:50%;border:16px solid rgba(0,0,0,0.03);bottom:-50px;left:-40px;pointer-events:none}
.db{position:absolute;width:44px;height:44px;border-radius:9px;border:1.5px solid rgba(0,0,0,0.06);top:22px;left:220px;transform:rotate(14deg);pointer-events:none}

/* ── header card ── */
.header{position:relative;z-index:1;background:#111;border-radius:16px;padding:28px 32px;overflow:hidden;margin-bottom:20px}
.header::before{content:"";position:absolute;width:160px;height:160px;border-radius:50%;border:20px solid rgba(255,255,255,0.05);top:-50px;right:-40px}
.header::after{content:"";position:absolute;width:70px;height:70px;border-radius:12px;border:2px solid rgba(255,255,255,0.06);bottom:20px;right:60px;transform:rotate(22deg)}
.header-inner{position:relative;z-index:1;display:flex;align-items:center;gap:20px}
.avatar{width:64px;height:64px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.15);flex-shrink:0}
.avatar-placeholder{width:64px;height:64px;border-radius:14px;background:rgba(255,255,255,0.08);border:2px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.header-text{flex:1}
.header-name{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.03em;line-height:1.15;margin-bottom:5px}
.header-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.8);font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.12)}
.badge svg{opacity:.7}
.header-id{font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.print-date{font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px}

/* ── content card ── */
.card{position:relative;z-index:1;background:#fff;border-radius:16px;padding:28px 32px;border:1px solid #e8e8e8;overflow:hidden}
.card::before{content:"";position:absolute;width:120px;height:120px;border-radius:50%;border:14px solid rgba(0,0,0,0.03);top:-35px;right:-25px}

/* ── section ── */
.section{margin-bottom:24px}
.section:last-child{margin-bottom:0}
.section-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e8e8e8}
.section-icon{width:26px;height:26px;border-radius:7px;background:#111;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.section-title{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#111}

/* ── fields grid ── */
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px 16px}
.field{}
.flabel{font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#aaa;margin-bottom:3px}
.fval{font-size:12.5px;font-weight:600;color:#111;line-height:1.4}

/* ── footer ── */
.footer{margin-top:20px;display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:#fff;border-radius:12px;border:1px solid #e8e8e8}
.footer-brand{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#111}
.footer-note{font-size:10px;color:#bbb}

@media print{
  body{background:#fff;padding:0}
  .wrap::before,.wrap::after,.dc,.db{display:none}
  .header{border-radius:0;margin-bottom:0}
  .card{border-radius:0;border:none;border-top:1px solid #e8e8e8}
  .footer{border-radius:0}
  .section{page-break-inside:avoid}
}
</style>
</head>
<body>
<div class="wrap">
  <span class="dc"></span>
  <span class="db"></span>

  <!-- Header -->
  <div class="header">
    <div class="header-inner">
      ${photo}
      <div class="header-text">
        <div class="header-name">${esc(staffData.full_name || "Staff Profile")}</div>
        <div class="header-meta">
          ${staffData.position ? `<span class="badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>${esc(staffData.position)}</span>` : ""}
          ${staffData.department ? `<span class="badge"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>${esc(staffData.department)}</span>` : ""}
          ${staffData.employment_type ? `<span class="badge">${esc(staffData.employment_type)}</span>` : ""}
          <span class="badge" style="background:${staffData.record_status === "active" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)"}">
            ${staffData.record_status === "active" ? "● Active" : "○ Inactive"}
          </span>
        </div>
        <div class="header-id">ID: ${esc(staffData.staff_id || "N/A")}</div>
        <div class="print-date">Printed ${new Date().toLocaleString()}</div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="card">

    ${section("Staff Information",
      '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>',
      field("Full Name", staffData.full_name) +
      field("Date of Birth", staffData.date_of_birth) +
      field("Gender", staffData.gender) +
      field("Email", staffData.email) +
      field("Phone", staffData.phone) +
      field("WhatsApp", staffData.whatsapp) +
      field("Religion", staffData.religion) +
      field("Marital Status", staffData.marital_status) +
      field("Nationality", staffData.nationality)
    )}

    ${section("Identity / bio",
      '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>',
      field("Place of Birth", staffData.place_of_birth) +
      field("LGA of Origin", staffData.lga_of_origin) +
      field("State of Origin", staffData.state_of_origin) +
      field("Tribe / Ethnic Group", staffData.tribe) +
      field("NIN", staffData.nin || staffData.national_id) +
      field("Blood Group", staffData.blood_group) +
      field("Genotype", staffData.genotype)
    )}

    ${section("Residence",
      '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      field("House Number / Street", staffData.house_number_street) +
      field("Area / Estate", staffData.area_estate) +
      field("City", staffData.city) +
      field("LGA of Residence", staffData.lga_of_residence) +
      field("State of Residence", staffData.state_of_residence) +
      field("Landmark", staffData.landmark)
    )}

    ${section("Employment Information",
      '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
      field("Position", staffData.position) +
      field("Department", staffData.department) +
      field("Qualification", staffData.qualification) +
      field("Experience", staffData.experience_years ? staffData.experience_years + " years" : null) +
      field("Employment Type", staffData.employment_type) +
      field("Joining Date", staffData.joining_date)
    )}

    ${section("Emergency Contact",
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
      field("Name", staffData.emergency_contact_name) +
      field("Relationship", staffData.emergency_contact_relationship) +
      field("Phone", staffData.emergency_contact_phone) +
      field("WhatsApp", staffData.emergency_contact_whatsapp)
    )}

  </div>

  <!-- Footer -->
  <div class="footer">
    <span class="footer-brand">ScladApp</span>
    <span class="footer-note">School Management Platform &nbsp;·&nbsp; Confidential</span>
    <span class="footer-note">${esc(staffData.staff_id || "")}</span>
  </div>
</div>
<script>window.onload=()=>{window.print();}</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  // Resend invite state
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleResendInvite = async () => {
    if (!staffData?.staff_id) return;
    setIsSendingInvite(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/staff/${staffData.staff_id}/resend-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (result.success) {
        addNotification(result.message || "Invite link sent successfully", "success");
        setShowPasswordModal(false);
      } else {
        addNotification(result.message || "Failed to send invite link", "error");
      }
    } catch {
      addNotification("An error occurred while sending the invite link", "error");
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <InnerTabCon>
      <StaffInfoCard
        staffData={staffData}
        onEditStaff={() => { if (!canEdit) { addNotification("No permission to edit staff.", "error"); return; } setShowEditStaffMenu(true); }}
        onPasswordManagement={() => setShowPasswordModal(true)}
        onToggleStatus={() => {
          if (!canEdit) { addNotification("No permission to change staff status.", "error"); return; }
          staffStatus === "active" ? setShowDeactivateModal(true) : setShowActivateModal(true);
        }}
        onExport={handleExportPDF}
        onPrint={handlePrintStaff}
        staffStatus={staffStatus}
      />

      {staffData && currentStaffData && (
        <StaffFormPanel
          isShow={showEditStaffMenu}
          onClose={() => setShowEditStaffMenu(false)}
          staffData={currentStaffData}
          onSubmit={handleUpdateStaff}
          isEditMode={true}
        />
      )}

      {/* Resend Invite Panel */}
      <SlideInMenu isShow={showPasswordModal} onClose={() => setShowPasswordModal(false)} width="480px">
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
                <p className="si-pwd-subtitle">{staffData?.full_name}</p>
              </div>
            </div>
          </div>
          <div className="si-pwd-body">
            {/* Info block */}
            <div style={{ background: "#f5f5f5", borderRadius: 12, padding: "16px 18px", border: "1px solid #e8e8e8" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#111", marginBottom: 6 }}>
                What happens when you resend?
              </div>
              <ul style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "The previous invite link is immediately invalidated",
                  "A new secure link is generated and sent to their email",
                  "The new link expires in 48 hours",
                  "The staff member sets their own password via the link",
                ].map((t) => (
                  <li key={t} style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>

            {/* Email display */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", border: "1.5px solid #e8e8e8", borderRadius: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888", marginBottom: 2 }}>Sending to</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{staffData?.email}</div>
              </div>
            </div>
          </div>
          <div className="si-pwd-footer">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} disabled={isSendingInvite}>Cancel</Button>
            <Button onClick={handleResendInvite} disabled={isSendingInvite}>
              {isSendingInvite ? "Sending..." : "Send Invite Link"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Deactivate Panel */}
      <SlideInMenu isShow={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} width="420px">
        <div className="si-confirm-panel">
          <div className="si-confirm-header danger">
            <span className="si-confirm-deco" aria-hidden="true" />
            <div className="si-confirm-header-content">
              <div className="si-confirm-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M15 4l6 6M21 4l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="si-confirm-header-text">
                <h3>Deactivate Staff</h3>
                <p>This action can be reversed later</p>
              </div>
            </div>
          </div>
          <div className="si-confirm-body">
            <div className="si-confirm-name">{staffData?.full_name}</div>
            <div className="si-confirm-warn">⚠️ You are about to deactivate this staff member's account.</div>
            <p className="si-confirm-effects-title">This will:</p>
            <ul className="si-confirm-effects">
              <li>Prevent the staff member from logging into the system</li>
              <li>Remove access to all staff resources and materials</li>
              <li>Hide the staff member from active staff lists</li>
              <li>Preserve all historical data and records</li>
            </ul>
          </div>
          <div className="si-confirm-footer">
            <Button variant="secondary" onClick={() => setShowDeactivateModal(false)} disabled={isUpdating}>Cancel</Button>
            <Button variant="danger" onClick={handleToggleStatus} disabled={isUpdating}>
              {isUpdating ? "Deactivating..." : "Deactivate Staff"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Activate Panel */}
      <SlideInMenu isShow={showActivateModal} onClose={() => setShowActivateModal(false)} width="420px">
        <div className="si-confirm-panel">
          <div className="si-confirm-header success">
            <span className="si-confirm-deco" aria-hidden="true" />
            <div className="si-confirm-header-content">
              <div className="si-confirm-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M16 5l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="si-confirm-header-text">
                <h3>Activate Staff</h3>
                <p>Restore this staff member to active status</p>
              </div>
            </div>
          </div>
          <div className="si-confirm-body">
            <div className="si-confirm-name">{staffData?.full_name}</div>
            <div className="si-confirm-info">✓ You are about to activate this staff member's account.</div>
            <p className="si-confirm-effects-title">This will:</p>
            <ul className="si-confirm-effects">
              <li>Restore staff member login access to the system</li>
              <li>Grant access to all staff resources and materials</li>
              <li>Show the staff member in active staff lists</li>
              <li>Restore all previous permissions and roles</li>
            </ul>
          </div>
          <div className="si-confirm-footer">
            <Button variant="secondary" onClick={() => setShowActivateModal(false)} disabled={isUpdating}>Cancel</Button>
            <Button onClick={handleToggleStatus} disabled={isUpdating}>
              {isUpdating ? "Activating..." : "Activate Staff"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default StaffIdentity;
