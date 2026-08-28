import React, { useState } from "react";
import "./StaffInfoCard.css";
import InfoField from "../../../../../../components/infoField/InfoField";
import { FaEllipsisV, FaEdit, FaPaperPlane, FaFileExport, FaPrint, FaUserCheck, FaUserTimes } from "react-icons/fa";

const StaffInfoCard = ({
  staffData: propStaffData,
  onEditStaff,
  onPasswordManagement,
  onToggleStatus,
  onExport,
  onPrint,
  staffStatus = "active",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".sic2-actions-wrap")) setShowDropdown(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape" && showDropdown) setShowDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDropdown]);

  const actualStaffData = propStaffData?.staff || propStaffData;
  if (!actualStaffData) return null;

  const s = actualStaffData;
  const initials = (s.full_name || "?").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="sic2-card">
      {/* Banner */}
      <div className="sic2-banner">
        <span className="sic2-banner-deco" aria-hidden="true" />
      </div>

      {/* Header */}
      <div className="sic2-header">
        <div className="sic2-avatar-wrap">
          {s.staff_photo ? (
            <img src={s.staff_photo} alt="Profile" className="sic2-avatar"
              onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
          ) : null}
          <div className="sic2-avatar-fallback" style={{ display: s.staff_photo ? "none" : "flex" }}>
            {initials}
          </div>
        </div>

        <div className="sic2-header-info">
          <h3 className="sic2-name">{s.full_name || "Unknown Staff"}</h3>
          <div className="sic2-meta">
            <span className="sic2-staff-id">{s.staff_id || "N/A"}</span>
            <span className={`sic2-status-badge ${staffStatus === "active" ? "active" : "inactive"}`}>
              {staffStatus === "active" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="sic2-actions-wrap">
          <button className="sic2-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <FaEllipsisV size={11} /> Actions
          </button>
          {showDropdown && (
            <div className="sic2-dropdown">
              <button className="sic2-dropdown-item" onClick={() => { onEditStaff?.(); setShowDropdown(false); }}>
                <FaEdit size={13} /> Edit Staff Profile
              </button>
              <button className="sic2-dropdown-item" onClick={() => { onPasswordManagement?.(); setShowDropdown(false); }}>
                <FaPaperPlane size={13} /> Resend Invite Link
              </button>
              <button className={`sic2-dropdown-item ${staffStatus === "active" ? "danger" : "success"}`}
                onClick={() => { onToggleStatus?.(); setShowDropdown(false); }}>
                {staffStatus === "active" ? <><FaUserTimes size={13} /> Deactivate Staff</> : <><FaUserCheck size={13} /> Activate Staff</>}
              </button>
              <div className="sic2-dropdown-divider" />
              <button className="sic2-dropdown-item" onClick={() => { onExport?.(); setShowDropdown(false); }}>
                <FaFileExport size={13} /> Export PDF
              </button>
              <button className="sic2-dropdown-item" onClick={() => { onPrint?.(); setShowDropdown(false); }}>
                <FaPrint size={13} /> Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="sic2-body">
        <div>
          <span className="sic2-section-title">Staff Information</span>
          <div className="sic2-grid">
            <InfoField label="Full Name"     value={s.full_name || "N/A"} />
            <InfoField label="Staff ID"      value={s.staff_id || "N/A"} />
            <InfoField label="Position"      value={s.position || "N/A"} />
            <InfoField label="Department"    value={s.department || "N/A"} />
            <InfoField label="Date of Birth" value={s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString() : "N/A"} />
            <InfoField label="Gender"        value={s.gender || "N/A"} />
            <InfoField label="Email"         value={s.email || "N/A"} />
            <InfoField label="Phone"         value={s.phone || "N/A"} />
            <InfoField label="WhatsApp"      value={s.whatsapp || "N/A"} />
            <InfoField label="Religion"      value={s.religion || "N/A"} />
            <InfoField label="Marital Status" value={s.marital_status || "N/A"} />
            <InfoField label="Nationality"   value={s.nationality || "N/A"} />
          </div>
        </div>

        <div>
          <span className="sic2-section-title">Identity / bio</span>
          <div className="sic2-grid">
            <InfoField label="Place of Birth"       value={s.place_of_birth || "N/A"} />
            <InfoField label="LGA of Origin"        value={s.lga_of_origin || "N/A"} />
            <InfoField label="State of Origin"      value={s.state_of_origin || "N/A"} />
            <InfoField label="Tribe / Ethnic Group" value={s.tribe || "N/A"} />
            <InfoField label="NIN"                  value={s.nin || s.national_id || "N/A"} />
            <InfoField label="Blood Group"          value={s.blood_group || "N/A"} />
            <InfoField label="Genotype"             value={s.genotype || "N/A"} />
          </div>
        </div>

        <div>
          <span className="sic2-section-title">Residence</span>
          <div className="sic2-grid">
            <InfoField label="House Number / Street" value={s.house_number_street || "N/A"} />
            <InfoField label="Area / Estate"         value={s.area_estate || "N/A"} />
            <InfoField label="City"                  value={s.city || "N/A"} />
            <InfoField label="LGA of Residence"      value={s.lga_of_residence || "N/A"} />
            <InfoField label="State of Residence"    value={s.state_of_residence || "N/A"} />
            <InfoField label="Landmark"              value={s.landmark || "N/A"} />
          </div>
        </div>

        <div>
          <span className="sic2-section-title">Emergency Contact</span>
          <div className="sic2-grid">
            <InfoField label="Name"         value={s.emergency_contact_name || "N/A"} />
            <InfoField label="Relationship" value={s.emergency_contact_relationship || "N/A"} />
            <InfoField label="Phone"        value={s.emergency_contact_phone || "N/A"} />
            <InfoField label="WhatsApp"     value={s.emergency_contact_whatsapp || "N/A"} />
          </div>
        </div>

        <div>
          <span className="sic2-section-title">Employment Information</span>
          <div className="sic2-grid">
            <InfoField label="Qualification"   value={s.qualification || "N/A"} />
            <InfoField label="Experience"      value={s.experience_years ? `${s.experience_years} yrs` : "N/A"} />
            <InfoField label="Joining Date"    value={s.joining_date ? new Date(s.joining_date).toLocaleDateString() : "N/A"} />
            <InfoField label="Employment Type" value={s.employment_type || "N/A"} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffInfoCard;
