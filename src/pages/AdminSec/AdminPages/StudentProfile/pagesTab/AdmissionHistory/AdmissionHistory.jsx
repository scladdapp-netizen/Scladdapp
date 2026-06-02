import { useState } from "react";
import "./AdmissionHistory.css";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import { useParams } from "react-router-dom";
import { useFetchStudentDetail } from "../../../../../../api_call";
import LoadingData from "../../../../../../components/LoadingData";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import jsPDF from "jspdf";

const AdmissionHistory = () => {
  const { schoolId, studentId } = useParams();
  const { addNotification } = useNotification();
  const [showDetailMenu, setShowDetailMenu] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const { studentData, loading, error } = useFetchStudentDetail(schoolId, studentId);

  if (loading) return <InnerTabCon><LoadingData message="Loading admission history..." /></InnerTabCon>;
  if (error) return <InnerTabCon><div style={{ padding: "40px 20px", color: "#dc3545", textAlign: "center" }}><h3>Error</h3><p>{error}</p></div></InnerTabCon>;

  const admissionData = studentData?.admissions || [];
  const studentName = studentData?.student?.full_name || "Student";

  const getStatusLabel = (admission) => {
    if (admission.is_graduated) return "Graduated";
    if (admission.active_status) return "Active";
    if (admission.close_date) return "Closed";
    return "Inactive";
  };

  const getStatusClass = (label) => {
    switch (label) {
      case "Active":    return "success";
      case "Graduated": return "info";
      case "Closed":    return "warning";
      default:          return "danger";
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString() : "N/A";

  const handleExportPDF = () => {
    if (!admissionData.length) { addNotification("No records to export.", "error"); return; }
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth(); const margin = 18; let y = 20;
    doc.setFillColor(17,17,17); doc.rect(0,0,pageW,28,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Admission History", margin, 12);
    doc.setFontSize(9); doc.setFont("helvetica","normal");
    doc.text(`Student: ${studentName}`, margin, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW-margin, 20, { align:"right" });
    y = 38;
    admissionData.forEach((r) => {
      const cardH = 48;
      if (y+cardH > 280) { doc.addPage(); y = 20; }
      doc.setFillColor(247,247,247); doc.roundedRect(margin,y,pageW-margin*2,cardH,4,4,"F");
      doc.setDrawColor(232,232,232); doc.roundedRect(margin,y,pageW-margin*2,cardH,4,4,"S");
      doc.setTextColor(17,17,17); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text(r.admission_session||"N/A", margin+4, y+10);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(136,136,136);
      doc.text(`${r.admission_type||"N/A"}  •  ${r.admission_term||"N/A"}  •  ${getStatusLabel(r)}`, margin+4, y+17);
      doc.setDrawColor(232,232,232); doc.line(margin+4,y+21,margin+pageW-margin*2-4,y+21);
      const fields=[["Class",r.admission_class_name||r.admission_class||"N/A"],["Admitted",fmt(r.admitted_date)],["Closed",fmt(r.close_date)],["Type",r.admission_type||"N/A"]];
      const colW=(pageW-margin*2-8)/4;
      fields.forEach((f,fi)=>{
        const fx=margin+4+fi*colW; const fy=y+27;
        doc.setTextColor(170,170,170); doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.text(f[0].toUpperCase(),fx,fy);
        doc.setTextColor(17,17,17); doc.setFontSize(8); doc.setFont("helvetica","normal");
        doc.text(doc.splitTextToSize(f[1],colW-2)[0],fx,fy+5);
      });
      y+=cardH+8;
    });
    doc.save(`${studentName.replace(/\s+/g,"_")}_AdmissionHistory.pdf`);
    addNotification("PDF exported!", "success");
  };

  const handlePrint = () => {
    if (!admissionData.length) { addNotification("No records to print.", "error"); return; }
    const w = window.open("","_blank");
    w.document.open();
    w.document.write(`<html><head><title>Admission History</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;font-weight:800;margin:0 0 4px}.sub{font-size:12px;color:#888;margin:0 0 20px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #e8e8e8;border-radius:10px;overflow:hidden}.ch{background:#f7f7f7;padding:12px 16px;border-bottom:1px solid #e8e8e8;display:flex;justify-content:space-between;align-items:flex-start}.sess{font-size:13px;font-weight:800;margin:0 0 3px}.meta{font-size:11px;color:#888}.badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase}.active{background:#dcfce7;color:#166534}.graduated{background:#dbeafe;color:#1e40af}.closed{background:#fef9c3;color:#854d0e}.inactive{background:#fecaca;color:#991b1b}.cb{padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px}.f label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}.f span{font-size:12px;color:#111}@media print{body{margin:12px}}</style></head><body>
    <h1>Admission History</h1><p class="sub">Student: ${studentName} | ${new Date().toLocaleDateString()}</p>
    <div class="grid">${admissionData.map(r=>{const s=getStatusLabel(r).toLowerCase();return`<div class="card"><div class="ch"><div><div class="sess">${r.admission_session||"N/A"}</div><div class="meta">${r.admission_type||"N/A"} • ${r.admission_term||"N/A"}</div></div><span class="badge ${s}">${getStatusLabel(r)}</span></div><div class="cb"><div class="f"><label>Class</label><span>${r.admission_class_name||r.admission_class||"N/A"}</span></div><div class="f"><label>Admitted</label><span>${fmt(r.admitted_date)}</span></div><div class="f"><label>Closed</label><span>${fmt(r.close_date)}</span></div><div class="f"><label>Type</label><span>${r.admission_type||"N/A"}</span></div></div></div>`;}).join("")}</div>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close();},400);
  };

  const AdmissionCard = ({ record }) => {
    const status = getStatusLabel(record);
    return (
      <div className="admissionCard" onClick={() => { setSelectedRecord(record); setShowDetailMenu(true); }}>
        <div className="admissionCardHeader">
          <div className="schoolLogoWrap">
            {record.school_logo && typeof record.school_logo === "string" && record.school_logo.length > 0 ? (
              <img src={record.school_logo} alt={record.school_name || "School"} className="schoolLogoImg" />
            ) : (
              <div className="schoolLogoPlaceholder">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            )}
          </div>
          <div className="schoolInfo">
            <h3 className="schoolName">{record.school_name || "Unknown School"}</h3>
            <div className="schoolMeta">
              <span className="schoolType">{record.admission_type || "N/A"}</span>
              <span className="schoolLocation">{record.admission_term || "N/A"}</span>
            </div>
          </div>
          <div className="admissionStatus">
            <span className={`statusBadge ${getStatusClass(status)}`}>{status}</span>
          </div>
        </div>
        <div className="admissionCardBody">
          <div className="admissionDetails">
            <div className="detailRow">
              <InfoField label="Class" value={record.admission_class_name || record.admission_class || "N/A"} />
              <InfoField label="Admission ID" value={record.admission_id?.substring(0, 14) || "N/A"} />
            </div>
            <div className="detailRow">
              <InfoField label="Admitted" value={fmt(record.admitted_date)} />
              <InfoField
                label={record.close_date ? "Closed" : "Duration"}
                value={record.close_date ? fmt(record.close_date) : record.admitted_date ? `${Math.floor((new Date()-new Date(record.admitted_date))/(365.25*24*60*60*1000))} yrs` : "N/A"}
              />
            </div>
          </div>
        </div>
        <div className="admissionCardFooter">
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
      <div className="admissionHistory">
        <div className="admissionHeader">
          <div className="admissionHeaderLeft">
            <h2 className="admissionTitle">Admission History</h2>
            <p className="admissionSubtitle">
              {admissionData.length === 0 ? "No records found" : `${admissionData.length} ${admissionData.length === 1 ? "admission" : "admissions"}`}
            </p>
          </div>
          <div className="topExButton">
            <Button variant="secondary" onClick={handleExportPDF}>Export PDF</Button>
            <Button variant="secondary" onClick={handlePrint}>Print</Button>
          </div>
        </div>

        {admissionData.length === 0 ? (
          <div className="admission-empty">
            <h3>No Admission Records</h3>
            <p>No admission history available for this student.</p>
          </div>
        ) : (
          <div className="admissionRecords">
            {admissionData.map((record) => (
              <AdmissionCard key={record.admission_id} record={record} />
            ))}
          </div>
        )}

        {/* Detail Panel */}
        <SlideInMenu isShow={showDetailMenu} onClose={() => setShowDetailMenu(false)} width="560px">
          <div className="ap-container">
            <div className="ap-header">
              <span className="ap-header-deco" aria-hidden="true" />
              <div className="ap-header-content">
                <div className="ap-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.7"/>
                  </svg>
                </div>
                <div className="ap-header-text">
                  <h2>{selectedRecord?.school_name || selectedRecord?.admission_session || "Admission"}</h2>
                  <p>Admission record details</p>
                </div>
              </div>
            </div>
            <div className="ap-body">
              {selectedRecord && (<>
                <div className="ap-section">
                  <span className="ap-section-title">Admission Details</span>
                  <div className="ap-grid">
                    <InfoField label="School" value={selectedRecord.school_name || "N/A"} />
                    <InfoField label="Session" value={selectedRecord.admission_session || "N/A"} />
                    <InfoField label="Term" value={selectedRecord.admission_term || "N/A"} />
                    <InfoField label="Class" value={selectedRecord.admission_class_name || selectedRecord.admission_class || "N/A"} />
                    <InfoField label="Type" value={selectedRecord.admission_type || "N/A"} />
                    <InfoField label="Admitted Date" value={fmt(selectedRecord.admitted_date)} />
                    <InfoField label="Close Date" value={fmt(selectedRecord.close_date)} />
                    <InfoField label="Status" value={getStatusLabel(selectedRecord)} />
                    <InfoField label="Admission ID" value={selectedRecord.admission_id || "N/A"} />
                  </div>
                </div>
                {selectedRecord.is_graduated && (
                  <div className="ap-section">
                    <span className="ap-section-title">Graduation</span>
                    <div className="ap-grid">
                      <InfoField label="Graduated ID" value={selectedRecord.graduated_id || "N/A"} />
                      <InfoField label="Graduation Session" value={selectedRecord.graduation_session_name || "N/A"} />
                    </div>
                  </div>
                )}
                {(selectedRecord.previous_school || selectedRecord.transfer_certificate || selectedRecord.remarks) && (
                  <div className="ap-section">
                    <span className="ap-section-title">Additional Information</span>
                    <div className="ap-grid">
                      {selectedRecord.previous_school && <InfoField label="Previous School" value={selectedRecord.previous_school} />}
                      {selectedRecord.transfer_certificate && <InfoField label="Transfer Certificate" value={selectedRecord.transfer_certificate} />}
                      {selectedRecord.remarks && <InfoField label="Remarks" value={selectedRecord.remarks} />}
                    </div>
                  </div>
                )}
                <div className="ap-section">
                  <span className="ap-section-title">System</span>
                  <div className="ap-grid">
                    <InfoField label="Created By" value={selectedRecord.created_by || "N/A"} />
                    <InfoField label="Created At" value={selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : "N/A"} />
                    <InfoField label="Updated At" value={selectedRecord.updated_at ? new Date(selectedRecord.updated_at).toLocaleString() : "N/A"} />
                  </div>
                </div>
              </>)}
            </div>
            <div className="ap-footer">
              <Button variant="secondary" onClick={() => setShowDetailMenu(false)}>Close</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default AdmissionHistory;
