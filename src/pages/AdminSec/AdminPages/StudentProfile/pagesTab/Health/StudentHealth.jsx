import { useState, useRef, useEffect } from "react";
import "./StudentHealth.css";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../../components/FormInput";
import { useParams } from "react-router-dom";
import { useFetchStudentDetail, useMedicalRecords } from "../../../../../../api_call";
import LoadingData from "../../../../../../components/LoadingData";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import jsPDF from "jspdf";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";

const StudentHealth = () => {
  const { schoolId, studentId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.students?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.students?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.students?.delete;

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDetailMenu, setShowDetailMenu] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef(null);

  const emptyForm = {
    record_date: new Date().toISOString().split("T")[0],
    record_type: "general", diagnosis: "", symptoms: "", treatment: "",
    prescription: "", doctor_name: "", hospital_clinic: "", doctor_phone: "",
    allergies: "", chronic_conditions: "", medications: "", notes: "",
    follow_up_required: false, follow_up_date: "",
  };
  const [formData, setFormData] = useState(emptyForm);

  const { studentData, loading, error, refetch } = useFetchStudentDetail(schoolId, studentId);
  const { loading: medicalLoading, createMedicalRecord, updateMedicalRecord, deleteMedicalRecord } = useMedicalRecords();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) return <InnerTabCon><LoadingData message="Loading medical records..." /></InnerTabCon>;
  if (error) return <InnerTabCon><div style={{ padding: "40px 20px", color: "#dc3545", textAlign: "center" }}><h3>Error</h3><p>{error}</p></div></InnerTabCon>;

  const medicalRecords = studentData?.medical_records || [];
  const studentName = studentData?.student?.full_name || "Student";

  const getRecordTypeLabel = (type) => {
    const map = { general: "General", checkup: "Checkup", illness: "Illness", injury: "Injury", vaccination: "Vaccination", allergy: "Allergy", chronic_condition: "Chronic Condition" };
    return map[type?.toLowerCase()] || type || "N/A";
  };

  const handleAddRecord = () => {
    if (!canCreate) { addNotification("No permission to add records.", "error"); return; }
    setIsEditMode(false); setFormData(emptyForm); setShowAddMenu(true);
  };

  const handleEditRecord = (record) => {
    if (!canEdit) { addNotification("No permission to edit records.", "error"); return; }
    setIsEditMode(true); setSelectedRecord(record);
    setFormData({
      record_date: record.record_date || emptyForm.record_date,
      record_type: record.record_type || "general",
      diagnosis: record.diagnosis || "", symptoms: record.symptoms || "",
      treatment: record.treatment || "", prescription: record.prescription || "",
      doctor_name: record.doctor_name || "", hospital_clinic: record.hospital_clinic || "",
      doctor_phone: record.doctor_phone || "", allergies: record.allergies || "",
      chronic_conditions: record.chronic_conditions || "", medications: record.medications || "",
      notes: record.notes || "", follow_up_required: record.follow_up_required || false,
      follow_up_date: record.follow_up_date || "",
    });
    setShowDetailMenu(false); setOpenDropdown(null); setShowAddMenu(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // FormInput-compatible setter (receives value directly, not event)
  const setField = (name) => (value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!formData.diagnosis) { addNotification("Please enter a diagnosis.", "error"); return; }
    const recordData = { student_id: studentId, school_id: schoolId, ...formData, created_by: admin?.admin_id || "admin" };
    const result = isEditMode && selectedRecord
      ? await updateMedicalRecord(selectedRecord.record_id, recordData)
      : await createMedicalRecord(recordData);
    if (result.success) {
      addNotification(isEditMode ? "Record updated!" : "Record added!", "success");
      setShowAddMenu(false); refetch();
    } else {
      addNotification(result.error || "Failed to save record.", "error");
    }
  };

  const handleDeleteRecord = (record) => {
    if (!canDelete) { addNotification("No permission to delete records.", "error"); return; }
    setOpenDropdown(null);
    setDeleteTarget(record);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteMedicalRecord(deleteTarget.record_id);
    if (result.success) {
      addNotification("Record deleted.", "success");
      setDeleteTarget(null);
      refetch();
    } else {
      addNotification(result.error || "Failed to delete.", "error");
    }
    setDeleting(false);
  };

  const handleExportPDF = () => {
    if (!medicalRecords.length) { addNotification("No records to export.", "error"); return; }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth(); const margin = 18; let y = 20;
    doc.setFillColor(17,17,17); doc.rect(0,0,pageW,28,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Medical Records", margin, 12);
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(`Student: ${studentName}`, margin, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW-margin, 20, { align:"right" });
    y = 38;
    medicalRecords.forEach((r) => {
      const cardH = 58;
      if (y+cardH > 280) { doc.addPage(); y = 20; }
      doc.setFillColor(247,247,247); doc.roundedRect(margin,y,pageW-margin*2,cardH,4,4,"F");
      doc.setDrawColor(232,232,232); doc.roundedRect(margin,y,pageW-margin*2,cardH,4,4,"S");
      doc.setTextColor(17,17,17); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text(r.diagnosis||"Medical Record", margin+4, y+10);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(136,136,136);
      doc.text(`${getRecordTypeLabel(r.record_type)}  •  ${r.record_date?new Date(r.record_date).toLocaleDateString():"N/A"}`, margin+4, y+17);
      doc.setDrawColor(232,232,232); doc.line(margin+4,y+21,margin+pageW-margin*2-4,y+21);
      const fields=[["Doctor",r.doctor_name||"N/A"],["Hospital",r.hospital_clinic||"N/A"],["Symptoms",r.symptoms||"N/A"],["Treatment",r.treatment||"N/A"]];
      const colW=(pageW-margin*2-8)/2;
      fields.forEach((f,fi)=>{
        const col=fi%2; const row=Math.floor(fi/2);
        const fx=margin+4+col*colW; const fy=y+27+row*13;
        doc.setTextColor(170,170,170); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(f[0].toUpperCase(),fx,fy);
        doc.setTextColor(17,17,17); doc.setFontSize(8.5); doc.setFont("helvetica","normal");
        doc.text(doc.splitTextToSize(f[1],colW-4)[0],fx,fy+5);
      });
      y+=cardH+8;
    });
    doc.save(`${studentName.replace(/\s+/g,"_")}_MedicalRecords.pdf`);
    addNotification("PDF exported!", "success");
  };

  const handlePrint = () => {
    if (!medicalRecords.length) { addNotification("No records to print.", "error"); return; }
    const w = window.open("","_blank");
    w.document.open();
    w.document.write(`<html><head><title>Medical Records</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;font-weight:800;margin:0 0 4px}.sub{font-size:12px;color:#888;margin:0 0 20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #e8e8e8;border-radius:10px;overflow:hidden}.ch{background:#f7f7f7;padding:12px 16px;border-bottom:1px solid #e8e8e8}.diag{font-size:13px;font-weight:800;margin:0 0 3px}.meta{font-size:11px;color:#888}.cb{padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.f label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}.f span{font-size:12px;color:#111}@media print{body{margin:12px}}</style></head><body><h1>Medical Records</h1><p class="sub">Student: ${studentName} | ${new Date().toLocaleDateString()}</p><div class="grid">${medicalRecords.map(r=>`<div class="card"><div class="ch"><div class="diag">${r.diagnosis||"Medical Record"}</div><div class="meta">${getRecordTypeLabel(r.record_type)} • ${r.record_date?new Date(r.record_date).toLocaleDateString():"N/A"}</div></div><div class="cb"><div class="f"><label>Doctor</label><span>${r.doctor_name||"N/A"}</span></div><div class="f"><label>Hospital</label><span>${r.hospital_clinic||"N/A"}</span></div><div class="f"><label>Symptoms</label><span>${r.symptoms||"N/A"}</span></div><div class="f"><label>Treatment</label><span>${r.treatment||"N/A"}</span></div></div></div>`).join("")}</div></body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close();},400);
  };

  // ── Card component ──────────────────────────────────────────────────────
  const MedicalRecordCard = ({ record }) => {
    const isOpen = openDropdown === record.record_id;
    const btnRef = useRef(null);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (!isOpen && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
      setOpenDropdown(isOpen ? null : record.record_id);
    };

    return (
      <div className="medicalRecordCard" onClick={() => { setSelectedRecord(record); setShowDetailMenu(true); }}>
        {/* Header */}
        <div className="medicalRecordCardHeader">
          <div className="recordInfo">
            <h3 className="recordTitle">{record.diagnosis || "Medical Record"}</h3>
            <div className="recordMeta">
              <span className="recordType">{getRecordTypeLabel(record.record_type)}</span>
              <span className="recordDate">{record.record_date ? new Date(record.record_date).toLocaleDateString() : "N/A"}</span>
            </div>
          </div>
          {/* Dropdown menu */}
          <div className="rec-menu-wrap" onClick={e => e.stopPropagation()}>
            <button ref={btnRef} className="rec-menu-btn" onClick={handleToggle} title="Options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
              </svg>
            </button>
            {isOpen && (
              <div
                ref={dropdownRef}
                className="rec-dropdown"
                style={{ top: dropdownPos.top, right: dropdownPos.right }}
                onClick={e => e.stopPropagation()}
              >
                <button className="rec-dropdown-item" onClick={() => handleEditRecord(record)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                  Edit
                </button>
                <button className="rec-dropdown-item rec-dropdown-danger" onClick={() => handleDeleteRecord(record)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body — structured 2-col grid */}
        <div className="medicalRecordCardBody">
          <div className="rec-body-grid">
            <div className="rec-body-field">
              <span className="rec-body-label">Doctor</span>
              <span className="rec-body-value">{record.doctor_name || "—"}</span>
            </div>
            <div className="rec-body-field">
              <span className="rec-body-label">Hospital / Clinic</span>
              <span className="rec-body-value">{record.hospital_clinic || "—"}</span>
            </div>
            {record.symptoms && (
              <div className="rec-body-field rec-body-full">
                <span className="rec-body-label">Symptoms</span>
                <span className="rec-body-value">{record.symptoms}</span>
              </div>
            )}
            {record.treatment && (
              <div className="rec-body-field rec-body-full">
                <span className="rec-body-label">Treatment</span>
                <span className="rec-body-value">{record.treatment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="medicalRecordCardFooter">
          <div className="viewDetails">
            <span>View details</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <InnerTabCon>
      <div className="studentHealth">
        <div className="healthHeader">
          <div className="healthHeaderLeft">
            <h2 className="healthTitle">Medical Records</h2>
            <p className="healthSubtitle">
              {medicalRecords.length === 0 ? "No records found" : `${medicalRecords.length} ${medicalRecords.length === 1 ? "record" : "records"}`}
            </p>
          </div>
          <div className="topExButton">
            <Button variant="secondary" onClick={handleExportPDF}>Export PDF</Button>
            <Button variant="secondary" onClick={handlePrint}>Print</Button>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </div>
        </div>

        {medicalRecords.length === 0 ? (
          <div className="health-empty">
            <h3>No Medical Records</h3>
            <p>No medical records available for this student.</p>
            <Button onClick={handleAddRecord}>Add Record</Button>
          </div>
        ) : (
          <div className="medicalRecords">
            {medicalRecords.map((record) => (
              <MedicalRecordCard key={record.record_id} record={record} />
            ))}
          </div>
        )}

        {/* ── Add / Edit Panel ── */}
        <SlideInMenu isShow={showAddMenu} onClose={() => setShowAddMenu(false)} width="600px">
          <div className="hp-container">
            <div className="hp-header">
              <span className="hp-header-deco" aria-hidden="true" />
              <div className="hp-header-content">
                <div className="hp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="hp-header-text">
                  <h2>{isEditMode ? "Edit Medical Record" : "Add Medical Record"}</h2>
                  <p>{isEditMode ? "Update the record details" : "Add a new record for this student"}</p>
                </div>
              </div>
            </div>
            <div className="hp-body">
              {/* Record Info */}
              <div className="hp-section">
                <span className="hp-section-title">Record Information</span>
                <div className="hp-form-grid">
                  <FormInput label="Record Date *" type="date" value={formData.record_date} onChange={setField("record_date")} />
                  <FormInput label="Record Type *" type="select" value={formData.record_type} onChange={setField("record_type")}
                    options={[
                      { value: "general", label: "General" },
                      { value: "checkup", label: "Checkup" },
                      { value: "illness", label: "Illness" },
                      { value: "injury", label: "Injury" },
                      { value: "vaccination", label: "Vaccination" },
                      { value: "allergy", label: "Allergy" },
                      { value: "chronic_condition", label: "Chronic Condition" },
                    ]}
                  />
                </div>
              </div>
              {/* Medical Details */}
              <div className="hp-section">
                <span className="hp-section-title">Medical Details</span>
                <FormInput label="Diagnosis / Title *" type="text" value={formData.diagnosis} onChange={setField("diagnosis")} placeholder="Enter diagnosis or title" />
                <FormInput label="Symptoms" type="textarea" value={formData.symptoms} onChange={setField("symptoms")} placeholder="Describe symptoms" height="70px" />
                <FormInput label="Treatment" type="textarea" value={formData.treatment} onChange={setField("treatment")} placeholder="Describe treatment given" height="70px" />
                <FormInput label="Prescription" type="textarea" value={formData.prescription} onChange={setField("prescription")} placeholder="Enter prescription details" height="70px" />
              </div>
              {/* Medical Professional */}
              <div className="hp-section">
                <span className="hp-section-title">Medical Professional</span>
                <div className="hp-form-grid">
                  <FormInput label="Doctor Name" type="text" value={formData.doctor_name} onChange={setField("doctor_name")} placeholder="Doctor's name" />
                  <FormInput label="Hospital / Clinic" type="text" value={formData.hospital_clinic} onChange={setField("hospital_clinic")} placeholder="Hospital or clinic name" />
                </div>
                <FormInput label="Doctor Phone" type="text" value={formData.doctor_phone} onChange={setField("doctor_phone")} placeholder="Phone number" />
              </div>
              {/* Additional Info */}
              <div className="hp-section">
                <span className="hp-section-title">Additional Information</span>
                <FormInput label="Allergies" type="textarea" value={formData.allergies} onChange={setField("allergies")} placeholder="List any allergies" height="60px" />
                <FormInput label="Chronic Conditions" type="textarea" value={formData.chronic_conditions} onChange={setField("chronic_conditions")} placeholder="List any chronic conditions" height="60px" />
                <FormInput label="Current Medications" type="textarea" value={formData.medications} onChange={setField("medications")} placeholder="List current medications" height="60px" />
                <FormInput label="Notes" type="textarea" value={formData.notes} onChange={setField("notes")} placeholder="Additional notes" height="60px" />
              </div>
              {/* Follow-up */}
              <div className="hp-section">
                <span className="hp-section-title">Follow-up</span>
                <FormInput label="Follow-up Required" type="checkbox" value={formData.follow_up_required} onChange={setField("follow_up_required")} />
                {formData.follow_up_required && (
                  <FormInput label="Follow-up Date" type="date" value={formData.follow_up_date} onChange={setField("follow_up_date")} />
                )}
              </div>
            </div>
            <div className="hp-footer">
              <Button variant="secondary" onClick={() => setShowAddMenu(false)} disabled={medicalLoading}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={medicalLoading}>
                {medicalLoading ? "Saving..." : isEditMode ? "Update Record" : "Save Record"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* ── Detail Panel ── */}
        <SlideInMenu isShow={showDetailMenu} onClose={() => setShowDetailMenu(false)} width="600px">
          <div className="hp-container">
            <div className="hp-header">
              <span className="hp-header-deco" aria-hidden="true" />
              <div className="hp-header-content">
                <div className="hp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="hp-header-text">
                  <h2>{selectedRecord?.diagnosis || "Medical Record"}</h2>
                  <p>Record details</p>
                </div>
              </div>
            </div>
            <div className="hp-body">
              {selectedRecord && (<>
                <div className="hp-detail-section">
                  <span className="hp-detail-section-title">Record Information</span>
                  <div className="hp-detail-grid">
                    <InfoField label="Record Type" value={getRecordTypeLabel(selectedRecord.record_type)} />
                    <InfoField label="Record Date" value={selectedRecord.record_date ? new Date(selectedRecord.record_date).toLocaleDateString() : "N/A"} />
                    <InfoField label="Record ID" value={selectedRecord.record_id || "N/A"} />
                  </div>
                </div>
                <div className="hp-detail-section">
                  <span className="hp-detail-section-title">Medical Details</span>
                  <div className="hp-detail-grid">
                    <InfoField label="Diagnosis" value={selectedRecord.diagnosis || "N/A"} />
                    <InfoField label="Symptoms" value={selectedRecord.symptoms || "N/A"} />
                    <InfoField label="Treatment" value={selectedRecord.treatment || "N/A"} />
                    <InfoField label="Prescription" value={selectedRecord.prescription || "N/A"} />
                  </div>
                </div>
                <div className="hp-detail-section">
                  <span className="hp-detail-section-title">Medical Professional</span>
                  <div className="hp-detail-grid">
                    <InfoField label="Doctor Name" value={selectedRecord.doctor_name || "N/A"} />
                    <InfoField label="Hospital / Clinic" value={selectedRecord.hospital_clinic || "N/A"} />
                    <InfoField label="Doctor Phone" value={selectedRecord.doctor_phone || "N/A"} />
                  </div>
                </div>
                {(selectedRecord.allergies || selectedRecord.chronic_conditions || selectedRecord.medications || selectedRecord.notes) && (
                  <div className="hp-detail-section">
                    <span className="hp-detail-section-title">Additional Information</span>
                    <div className="hp-detail-grid">
                      {selectedRecord.allergies && <InfoField label="Allergies" value={selectedRecord.allergies} />}
                      {selectedRecord.chronic_conditions && <InfoField label="Chronic Conditions" value={selectedRecord.chronic_conditions} />}
                      {selectedRecord.medications && <InfoField label="Medications" value={selectedRecord.medications} />}
                      {selectedRecord.notes && <InfoField label="Notes" value={selectedRecord.notes} />}
                    </div>
                  </div>
                )}
                {selectedRecord.follow_up_required && (
                  <div className="hp-detail-section">
                    <span className="hp-detail-section-title">Follow-up</span>
                    <div className="hp-detail-grid">
                      <InfoField label="Follow-up Required" value="Yes" />
                      {selectedRecord.follow_up_date && <InfoField label="Follow-up Date" value={new Date(selectedRecord.follow_up_date).toLocaleDateString()} />}
                    </div>
                  </div>
                )}
              </>)}
            </div>
            <div className="hp-footer">
              <Button variant="secondary" onClick={() => setShowDetailMenu(false)}>Close</Button>
              <Button onClick={() => { setShowDetailMenu(false); handleEditRecord(selectedRecord); }}>Edit Record</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>

      <DeleteConfirmPanel
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Medical Record"
        description="You are about to permanently remove this medical record."
        itemName={deleteTarget?.diagnosis || "Medical Record"}
      />
    </InnerTabCon>
  );
};

export default StudentHealth;
