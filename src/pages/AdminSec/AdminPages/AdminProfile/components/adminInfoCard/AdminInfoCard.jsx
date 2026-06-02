import "./AdminInfoCard.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InfoField from "../../../../../../components/infoField/InfoField";

const AdminInfoCard = ({ adminData, refreshAdminData, onToggleStatus, adminStatus }) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".aic-actions-wrap")) setShowDropdown(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape") setShowDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDropdown]);

  const admin = adminData?.admin;
  const staff = adminData?.staff;
  if (!admin) return null;

  const displayName = staff?.full_name || admin?.username || "—";
  const displayPhoto = staff?.staff_photo;
  const initials = displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  const isSuperAdmin = admin?.admin_role?.toLowerCase().includes("super");
  const isActive = adminStatus === "active";

  const handleViewStaffProfile = () => {
    if (staff?.staff_id && schoolId) navigate(`/admin/${schoolId}/staff/${staff.staff_id}`);
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40; let y = 50;

      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(255, 255, 255);
      doc.text("Admin Profile", margin, 35);
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(200, 200, 200);
      doc.text(`${displayName}  ·  ${admin?.admin_role || "Admin"}`, margin, 58);
      y = 110;

      const section = (title) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(136, 136, 136);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(230, 230, 230); doc.line(margin, y + 4, pageW - margin, y + 4);
        y += 18;
      };
      const row = (label, value) => {
        if (y > 760) { doc.addPage(); y = 40; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(136, 136, 136);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(34, 34, 34);
        doc.text(String(value || "N/A"), margin + 140, y);
        y += 18;
      };

      section("Admin Information");
      row("Full Name", displayName);
      row("Admin ID", admin?.admin_id);
      row("Admin Role", admin?.admin_role);
      row("Access Scope", admin?.access_scope);
      row("Status", isActive ? "Active" : "Inactive");
      y += 8;

      section("Contact Information");
      row("Email", staff?.email || admin?.email);
      row("Phone", staff?.phone);
      row("Address", staff?.address);
      y += 8;

      section("Professional Information");
      row("Position", staff?.position);
      row("Department", staff?.department);
      row("Employment Type", staff?.employment_type);
      row("Qualification", staff?.qualification);
      row("Assigned Date", admin?.assigned_at ? new Date(admin.assigned_at).toLocaleDateString() : "N/A");

      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(170, 170, 170);
      doc.text(`Generated on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 20);
      doc.save(`admin_${displayName.replace(/\s+/g, "_")}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(`<html><head><title>Admin Profile - ${displayName}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;font-weight:800;margin:0 0 4px}.sub{font-size:12px;color:#888;margin:0 0 20px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin:18px 0 10px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.field label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}.field span{font-size:12px;color:#111;font-weight:600}@media print{body{margin:12px}}</style>
    </head><body>
    <h1>${displayName}</h1>
    <p class="sub">${admin?.admin_role || ""} · Generated ${new Date().toLocaleDateString()}</p>
    <div class="section-title">Admin Information</div>
    <div class="grid">
      <div class="field"><label>Full Name</label><span>${displayName}</span></div>
      <div class="field"><label>Admin ID</label><span>${admin?.admin_id || "N/A"}</span></div>
      <div class="field"><label>Admin Role</label><span>${admin?.admin_role || "N/A"}</span></div>
      <div class="field"><label>Email</label><span>${staff?.email || admin?.email || "N/A"}</span></div>
      <div class="field"><label>Phone</label><span>${staff?.phone || "N/A"}</span></div>
      <div class="field"><label>Status</label><span>${isActive ? "Active" : "Inactive"}</span></div>
    </div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 400);
  };

  return (
    <div className="aic-card">
      <div className="aic-banner">
        <span className="aic-banner-deco" aria-hidden="true" />
      </div>

      <div className="aic-header">
        <div className="aic-avatar-wrap">
          {displayPhoto ? (
            <img src={displayPhoto} alt="Profile" className="aic-avatar"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          ) : null}
          <div className="aic-avatar-fallback" style={{ display: displayPhoto ? "none" : "flex" }}>
            {initials}
          </div>
        </div>

        <div className="aic-header-info">
          <h3 className="aic-name">{displayName}</h3>
          <div className="aic-meta">
            <span className="aic-admin-id">{admin?.admin_id || "N/A"}</span>
            <span className={`aic-status-badge ${isActive ? "active" : "inactive"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="aic-actions-wrap">
          <button className="aic-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
            Actions
          </button>
          {showDropdown && (
            <div className="aic-dropdown">
              <button
                className={`aic-dropdown-item ${isActive && !isSuperAdmin ? "danger" : !isActive ? "success" : "disabled"}`}
                disabled={isSuperAdmin && isActive}
                onClick={() => {
                  if (isSuperAdmin && isActive) return;
                  onToggleStatus?.();
                  setShowDropdown(false);
                }}
              >
                {isActive ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      <path d="M15 4l6 6M21 4l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    </svg>
                    {isSuperAdmin ? "Cannot Deactivate Super Admin" : "Deactivate Admin"}
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                      <path d="M16 5l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Activate Admin
                  </>
                )}
              </button>
              <div className="aic-dropdown-divider" />
              <button className="aic-dropdown-item" onClick={() => { handleExportPDF(); setShowDropdown(false); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
                Export PDF
              </button>
              <button className="aic-dropdown-item" onClick={() => { handlePrint(); setShowDropdown(false); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
                Print
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="aic-body">
        <div>
          <span className="aic-section-title">Admin Information</span>
          <div className="aic-grid">
            <InfoField label="Full Name"    value={displayName} />
            <InfoField label="Admin ID"     value={admin?.admin_id || "N/A"} />
            <InfoField label="Admin Role"   value={admin?.admin_role || "N/A"} />
            <InfoField label="Access Scope" value={admin?.access_scope || "N/A"} />
            <InfoField label="Status"       value={isActive ? "Active" : "Inactive"} />
            <InfoField label="Assigned Date" value={admin?.assigned_at ? new Date(admin.assigned_at).toLocaleDateString() : "N/A"} />
            {admin?.revoked_at && (
              <InfoField label="Revoked Date" value={new Date(admin.revoked_at).toLocaleDateString()} />
            )}
          </div>
        </div>

        {staff && (
          <>
            <div>
              <span className="aic-section-title">Personal Information</span>
              <div className="aic-grid">
                <InfoField label="Date of Birth" value={staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString() : "N/A"} />
                <InfoField label="Gender"        value={staff.gender || "N/A"} />
                <InfoField label="Religion"      value={staff.religion || "N/A"} />
                <InfoField label="Nationality"   value={staff.nationality || "N/A"} />
                <InfoField label="Blood Group"   value={staff.blood_group || "N/A"} />
                <InfoField label="Genotype"      value={staff.genotype || "N/A"} />
              </div>
            </div>

            <div>
              <span className="aic-section-title">Contact Information</span>
              <div className="aic-grid">
                <InfoField label="Email"   value={staff.email || admin?.email || "N/A"} />
                <InfoField label="Phone"   value={staff.phone || "N/A"} />
                <InfoField label="Address" value={staff.address || "N/A"} />
              </div>
            </div>

            <div>
              <span className="aic-section-title">Professional Information</span>
              <div className="aic-grid">
                <InfoField label="Position"        value={staff.position || "N/A"} />
                <InfoField label="Department"      value={staff.department || "N/A"} />
                <InfoField label="Employment Type" value={staff.employment_type || "N/A"} />
                <InfoField label="Qualification"   value={staff.qualification || "N/A"} />
              </div>
            </div>
          </>
        )}

        {!staff && (
          <div>
            <span className="aic-section-title">Contact Information</span>
            <div className="aic-grid">
              <InfoField label="Email" value={admin?.email || "N/A"} />
            </div>
          </div>
        )}

        {staff?.staff_id && (
          <div className="aic-staff-link">
            <span className="aic-section-title">Associated Staff Profile</span>
            <p className="aic-staff-link-desc">This administrator is linked to a staff member profile.</p>
            <button className="aic-staff-link-btn" onClick={handleViewStaffProfile}>
              View Staff Profile
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminInfoCard;
