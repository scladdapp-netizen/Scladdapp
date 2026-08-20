import React, { useState } from "react";
import "./StudentInfoCard.css";
import { useNavigate } from "react-router-dom";
import InfoField from "../../../../../../components/infoField/InfoField";
import {
  FaEllipsisV,
  FaFileExport,
  FaPrint,
  FaUserTimes,
  FaEdit,
  FaPaperPlane,
} from "react-icons/fa";

const StudentInfoCard = ({
  studentData,
  onExport,
  onPrint,
  onRemoveFromSchool,
  onEdit,
  onResendInvite,
  schoolId,
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(".sic-actions-wrap")) {
        setShowDropdown(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showDropdown]);

  // If no data, show placeholder
  if (!studentData) {
    return (
      <div className="sic-card">
        <p className="sic-empty sic-empty-center">No student data available</p>
      </div>
    );
  }

  const { student, admissions, guardians } = studentData;

  // Get primary guardian or first guardian
  const primaryGuardian =
    guardians?.find((g) => g.is_primary) || guardians?.[0];

  // Get the admission for THIS school (filter by schoolId)
  const activeAdmission = schoolId
    ? admissions?.find((a) => a.school_id === schoolId)
    : admissions?.find((a) => a.active_status) || admissions?.[0];

  // Check if student has an active admission in THIS school
  const isActive = activeAdmission?.active_status === true;

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return `${age} years`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="sic-card">
        {/* ── Banner ── */}
        <div className="sic-banner">
          <span className="sic-banner-deco" aria-hidden="true" />
        </div>

        {/* ── Header ── */}
        <div className="sic-header">
          <div className="sic-avatar-wrap">
            {student.student_photo ? (
              <img src={student.student_photo} alt="Profile" className="sic-avatar"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
            ) : null}
            <div className="sic-avatar-fallback" style={{ display: student.student_photo ? "none" : "flex" }}>
              {(student.full_name || "?").charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="sic-header-info">
            <h3 className="sic-name">{student.full_name || "N/A"}</h3>
            <div className="sic-meta">
              <span className="sic-admission-no">{student.admission_number || student.student_id?.substring(0, 12) || "N/A"}</span>
              <span className={`sic-status-badge ${isActive ? "active" : "inactive"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="sic-actions-wrap">
            <button className="sic-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <FaEllipsisV size={12} /> Actions
            </button>
            {showDropdown && (
              <div className="sic-dropdown">
                <button className="sic-dropdown-item" onClick={() => { onEdit?.(); setShowDropdown(false); }}>
                  <FaEdit size={13} /> Edit Student
                </button>
                <button className="sic-dropdown-item" onClick={() => { onResendInvite?.(); setShowDropdown(false); }}>
                  <FaPaperPlane size={13} /> Resend Invite Link
                </button>
                <div className="sic-dropdown-divider" />
                <button className="sic-dropdown-item" onClick={() => { onExport?.(); setShowDropdown(false); }}>
                  <FaFileExport size={13} /> Export
                </button>
                <button className="sic-dropdown-item" onClick={() => { onPrint?.(); setShowDropdown(false); }}>
                  <FaPrint size={13} /> Print
                </button>
                <div className="sic-dropdown-divider" />
                <button
                  className={`sic-dropdown-item${isActive ? " danger" : ""}`}
                  onClick={() => { if (isActive) { onRemoveFromSchool?.(); setShowDropdown(false); } }}
                  disabled={!isActive}
                >
                  <FaUserTimes size={13} /> {isActive ? "Remove from School" : "Already Removed"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="sic-body">

          {/* Core info */}
          <div>
            <p className="sic-section-title">Student Information</p>
            <div className="sic-grid">
              <InfoField label="Full Name"        value={student.full_name || "N/A"} />
              <InfoField label="Student ID"       value={student.student_id ? student.student_id.substring(0, 16) : "N/A"} />
              <InfoField label="Date of Birth"    value={formatDate(student.date_of_birth)} />
              <InfoField label="Age"              value={calculateAge(student.date_of_birth)} />
              <InfoField label="Gender"           value={student.gender || "N/A"} />
              {/* <InfoField label="Class"            value={activeAdmission?.admission_class || student.current_class || "N/A"}
                linkTo={activeAdmission ? `/admin/${student.school_id}/class/${activeAdmission.admission_class}?student=${student.student_id}` : undefined} /> */}
              <InfoField label="Admission Number" value={student.admission_number || "N/A"} />
              <InfoField label="Email"            value={student.email || "N/A"} />
              <InfoField label="Phone"            value={student.phone || "N/A"} />
              <InfoField label="Religion"         value={student.religion || "N/A"} />
              <InfoField label="Nationality"      value={student.nationality || "N/A"} />
              <InfoField label="Blood Group"      value={student.blood_group || "N/A"} />
              <InfoField label="Genotype"         value={student.genotype || "N/A"} />
            </div>
          </div>

          {/* Guardians */}
          <div>
            <p className="sic-section-title">Contacts & Guardians</p>
            {primaryGuardian ? (
              <>
                <div className="sic-grid">
                  <InfoField label="Guardian Name"  value={primaryGuardian.guardian_name || "N/A"} />
                  <InfoField label="Relationship"   value={primaryGuardian.guardian_relationship || "N/A"} />
                  <InfoField label="Phone"          value={primaryGuardian.guardian_phone || "N/A"} />
                  <InfoField label="Email"          value={primaryGuardian.guardian_email || "N/A"} />
                  <InfoField label="Address"        value={primaryGuardian.guardian_address || student.address || "N/A"} />
                  <InfoField label="Occupation"     value={primaryGuardian.guardian_occupation || "N/A"} />
                </div>
                {guardians && guardians.length > 1 && (
                  <p className="sic-more-guardians">+{guardians.length - 1} additional guardian(s)</p>
                )}
              </>
            ) : (
              <p className="sic-empty">No guardian information available</p>
            )}
          </div>

          {/* Emergency contact */}
          {(student.emergency_contact_name || student.emergency_contact_phone) && (
            <div>
              <p className="sic-section-title">Emergency Contact</p>
              <div className="sic-grid">
                <InfoField label="Contact Name"  value={student.emergency_contact_name || "N/A"} />
                <InfoField label="Contact Phone" value={student.emergency_contact_phone || "N/A"} />
                <InfoField label="Relationship"  value={student.emergency_contact_relationship || "N/A"} />
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default StudentInfoCard;
