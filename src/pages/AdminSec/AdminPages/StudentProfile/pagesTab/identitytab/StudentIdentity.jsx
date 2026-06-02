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
    fetch(`http://localhost:3000/api/alumni/school/${schoolId}`)
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
        admissions?.find((a) => a.active_status) || admissions?.[0];

      // Create PDF content using jsPDF
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = 50;

      // Header
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 80, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("Student Profile", margin, 35);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(200, 200, 200);
      doc.text(`${student.full_name}  ·  ID: ${student.student_id?.substring(0, 16) || "N/A"}`, margin, 58);
      y = 110;

      const section = (title) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(136, 136, 136);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 4, pageW - margin, y + 4);
        y += 18;
      };

      const row = (label, value) => {
        if (y > 760) { doc.addPage(); y = 40; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(136, 136, 136);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(34, 34, 34);
        doc.text(String(value || "N/A"), margin + 140, y);
        y += 18;
      };

      section("Personal Information");
      row("Full Name",      student.full_name);
      row("Date of Birth",  student.date_of_birth);
      row("Gender",         student.gender);
      row("Email",          student.email);
      row("Phone",          student.phone);
      row("Religion",       student.religion);
      row("Nationality",    student.nationality);
      row("Blood Group",    student.blood_group);
      row("Genotype",       student.genotype);
      y += 8;

      section("Academic Information");
      row("Admission Number", student.admission_number);
      row("Current Class",    activeAdmission?.admission_class || student.current_class);
      row("Admission Date",   activeAdmission?.admitted_date);
      row("Session",          activeAdmission?.admission_session);
      y += 8;

      if (primaryGuardian) {
        section("Guardian Information");
        row("Guardian Name",  primaryGuardian.guardian_name);
        row("Relationship",   primaryGuardian.guardian_relationship);
        row("Phone",          primaryGuardian.guardian_phone);
        row("Email",          primaryGuardian.guardian_email);
        row("Occupation",     primaryGuardian.guardian_occupation);
        y += 8;
      }

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(`Generated on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 20);

      doc.save(`student_${student.full_name.replace(/\s+/g, "_")}.pdf`);
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
        admissions?.find((a) => a.active_status) || admissions?.[0];

      // Calculate age
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

      // Create a new window for printing
      const printWindow = window.open("", "_blank");
      const printContent = `
        <html>
          <head>
            <title>Student Profile - ${student.full_name}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .info-item { padding: 8px; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; }
              .section-title { font-size: 18px; font-weight: bold; margin: 20px 0 10px 0; color: #333; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Student Profile</h1>
              <h2>${student.full_name}</h2>
              <p>Student ID: ${student.student_id}</p>
            </div>
            
            <div class="section-title">Personal Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Full Name:</span> <span class="value">${
                student.full_name
              }</span></div>
              <div class="info-item"><span class="label">Date of Birth:</span> <span class="value">${
                student.date_of_birth || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Age:</span> <span class="value">${calculateAge(
                student.date_of_birth
              )}</span></div>
              <div class="info-item"><span class="label">Gender:</span> <span class="value">${
                student.gender || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Email:</span> <span class="value">${
                student.email || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Phone:</span> <span class="value">${
                student.phone || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Religion:</span> <span class="value">${
                student.religion || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Nationality:</span> <span class="value">${
                student.nationality || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Blood Group:</span> <span class="value">${
                student.blood_group || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Genotype:</span> <span class="value">${
                student.genotype || "N/A"
              }</span></div>
            </div>

            <div class="section-title">Academic Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Admission Number:</span> <span class="value">${
                student.admission_number || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Current Class:</span> <span class="value">${
                activeAdmission?.admission_class ||
                student.current_class ||
                "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Admission Date:</span> <span class="value">${
                activeAdmission?.admitted_date || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Session:</span> <span class="value">${
                activeAdmission?.admission_session || "N/A"
              }</span></div>
            </div>

            ${
              primaryGuardian
                ? `
            <div class="section-title">Guardian Information</div>
            <div class="info-grid">
              <div class="info-item"><span class="label">Guardian Name:</span> <span class="value">${
                primaryGuardian.guardian_name || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Relationship:</span> <span class="value">${
                primaryGuardian.guardian_relationship || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Phone:</span> <span class="value">${
                primaryGuardian.guardian_phone || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Email:</span> <span class="value">${
                primaryGuardian.guardian_email || "N/A"
              }</span></div>
              <div class="info-item"><span class="label">Occupation:</span> <span class="value">${
                primaryGuardian.guardian_occupation || "N/A"
              }</span></div>
            </div>
            `
                : ""
            }

            <p style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
              Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </p>
          </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

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
      dateOfBirth: s.date_of_birth || "",
      gender: s.gender || "",
      religion: s.religion || "",
      nationality: s.nationality || "",
      stateOfOrigin: s.state_of_origin || "",
      address: s.address || "",
      bloodGroup: s.blood_group || "",
      genotype: s.genotype || "",
      emergencyContactName: s.emergency_contact_name || "",
      emergencyContactPhone: s.emergency_contact_phone || "",
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
      const res = await fetch(`http://localhost:3000/student/${studentId}`, {
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
        onRemoveFromSchool={() => {
          if (!canDelete) {
            addNotification("You do not have permission to remove students from school.", "error");
            return;
          }
          setShowRemovePanel(true);
        }}
      />

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

            {/* Personal info */}
            <div className="si-edit-section-title">Personal Information</div>
            <div className="si-edit-grid">
              {[
                { label: "Full Name *", key: "fullName",    type: "text" },
                { label: "Email",       key: "email",       type: "email" },
                { label: "Phone",       key: "phone",       type: "text" },
                { label: "Date of Birth", key: "dateOfBirth", type: "date" },
                { label: "Religion",    key: "religion",    type: "text" },
                { label: "Nationality", key: "nationality", type: "text" },
                { label: "State of Origin", key: "stateOfOrigin", type: "text" },
                { label: "Blood Group", key: "bloodGroup",  type: "text" },
                { label: "Genotype",    key: "genotype",    type: "text" },
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

            <div className="si-edit-field">
              <label>Address</label>
              <textarea value={editForm.address || ""} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} rows={2} />
            </div>

            {/* Emergency contact */}
            <div className="si-edit-section-title">Emergency Contact</div>
            <div className="si-edit-grid-3">
              {[
                { label: "Name",         key: "emergencyContactName" },
                { label: "Phone",        key: "emergencyContactPhone" },
                { label: "Relationship", key: "emergencyContactRelationship" },
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
