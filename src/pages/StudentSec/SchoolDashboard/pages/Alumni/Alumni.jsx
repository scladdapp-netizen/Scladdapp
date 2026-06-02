import { useState, useEffect } from "react";
import { useParams, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useStudentAlumni, { updateAlumni } from "../../../../../api_call/useStudentAlumni";
import useStudentResource from "../../../../../api_call/useStudentResource";
import downloadFile from "../../../../../utils/downloadFile";
import useFetchStudentDetail from "../../../../../api_call/useFetchStudentDetail";
import StudentDetailTopTab from "../../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../components/infoField/InfoField";
import ResourceCard from "../../../../../components/ResourceCard/ResourceCard";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import "../../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "../../../../AdminSec/AdminPages/Alumni/components/AlumniCertificatesTab/AlumniCertificatesTab.css";
import "../../../../AdminSec/AdminPages/Alumni/components/AlumniProfileTab/AlumniProfileTab.css";
import "../../../../TeacherSec/pages/SubjectDashboard/pages/SubjectInfo/SubjectInfo.css";
import "./Alumni.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";
const fmtMonth = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" }) : "—";

const SectionCard = ({ title, children }) => (
  <div className="al-section">
    <span className="si-section-title">{title}</span>
    <div className="si-grid">{children}</div>
  </div>
);

/* ── Identity tab ── */
const IdentityTab = ({ studentData, alumni, graduationSession, certificates, onAlumniUpdate }) => {
  const s = studentData?.student || {};
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const isGraduated = !!alumni && graduationSession?.academic_year_start_date
    ? new Date(graduationSession.academic_year_start_date) <= new Date()
    : false;

  const [editSection, setEditSection]   = useState(null); // "contact" | "status"
  const [showCerts, setShowCerts]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [editData, setEditData]         = useState({
    contact_email:      alumni?.contact_email      || "",
    contact_phone:      alumni?.contact_phone      || "",
    contact_address:    alumni?.contact_address    || "",
    current_occupation: alumni?.current_occupation || "",
    current_employer:   alumni?.current_employer   || "",
    current_position:   alumni?.current_position   || "",
  });

  const set = (field) => (e) => setEditData((p) => ({ ...p, [field]: e.target.value }));

  const handleSave = async () => {
    if (!alumni?.alumni_id) return;
    setSaving(true);
    const res = await updateAlumni(alumni.alumni_id, {
      ...editData,
      modified_by: user?.student?.student_id,
    });
    setSaving(false);
    if (res.success) {
      addNotification("Profile updated", "success");
      onAlumniUpdate?.({ ...alumni, ...editData });
      setEditSection(null);
    } else {
      addNotification(res.message || "Failed to update", "error");
    }
  };

  const API = `${import.meta.env.VITE_API_BASE_URL}`;

  return (
    <InnerTabCon>
      <div className="si-overview">
        <div className="si-card">
          {/* Banner */}
          <div className={`si-banner ${isGraduated ? "si-banner--grad" : ""}`}>
            <span className="si-banner-deco" aria-hidden="true"/>
          </div>

          {/* Header */}
          <div className="si-header">
            <div className="si-header-left">
              <div className="si-icon-wrap">
                {s.student_photo ? (
                  <img src={s.student_photo} alt={s.full_name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                </svg>
                )}
              </div>
              <div className="si-header-text">
                <h3>{s.full_name || "Student"}</h3>
                <p className="si-subtitle">{s.admission_number}</p>
                <div className="si-badges">
                  <span className={`si-badge ${s.student_status === "active" ? "active" : "inactive"}`}>
                    {s.student_status || "Student"}
                  </span>
                  {isGraduated && (
                    <span className="si-badge al-grad-badge">
                      🎓 Graduate {alumni.graduation_date ? new Date(alumni.graduation_date).getFullYear() : ""}
                    </span>
                  )}
                  {s.gender && <span className="si-badge">{s.gender}</span>}
                </div>
              </div>
            </div>
            {isGraduated && (
              <div style={{ paddingBottom: 4 }}>
                <Button variant="secondary" onClick={() => setShowCerts(true)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Certificates ({certificates.length})
                </Button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="si-body">
            <SectionCard title="Personal Information">
              <InfoField label="Full Name"        value={s.full_name} />
              <InfoField label="Admission No."    value={s.admission_number} />
              <InfoField label="Date of Birth"    value={fmt(s.date_of_birth)} />
              <InfoField label="Gender"           value={s.gender} />
              <InfoField label="Religion"         value={s.religion} />
              <InfoField label="Nationality"      value={s.nationality} />
              <InfoField label="State of Origin"  value={s.state_of_origin} />
              <InfoField label="Blood Group"      value={s.blood_group} />
            </SectionCard>

            <SectionCard title="Contact">
              <InfoField label="Email"   value={s.email} />
              <InfoField label="Phone"   value={s.phone} />
              <InfoField label="Address" value={s.address} />
            </SectionCard>

            {isGraduated && (
              <SectionCard title="Graduation Details">
                <InfoField label="Graduation Date"  value={fmtMonth(alumni.graduation_date)} />
                <InfoField label="Final Class"      value={alumni.final_class_name} />
                <InfoField label="Session"          value={alumni.graduation_session_name} />
                {alumni.current_occupation && <InfoField label="Occupation"   value={alumni.current_occupation} />}
                {alumni.current_employer   && <InfoField label="Employer"     value={alumni.current_employer} />}
                {alumni.achievements       && <InfoField label="Achievements" value={alumni.achievements} />}
              </SectionCard>
            )}

            {/* Contact Information (editable) */}
            {isGraduated && (
              <div className="mm-apt-card">
                <div className="mm-apt-card-header">
                  <h4 className="mm-apt-card-title">Contact Information</h4>
                  {editSection !== "contact" && (
                    <Button variant="secondary" onClick={() => setEditSection("contact")}>Edit</Button>
                  )}
                </div>
                {editSection === "contact" ? (
                  <div className="mm-apt-edit-form">
                    {[
                      ["Email",   "contact_email",   "email",   "Enter email"],
                      ["Phone",   "contact_phone",   "tel",     "Enter phone"],
                      ["Address", "contact_address", "text",    "Enter address"],
                    ].map(([label, field, type, ph]) => (
                      <div key={field} className="mm-apt-field">
                        <label className="mm-apt-field-label">{label}</label>
                        <input className="mm-apt-field-input" type={type}
                          value={editData[field]} onChange={set(field)} placeholder={ph}/>
                      </div>
                    ))}
                    <div className="mm-apt-form-actions">
                      <Button variant="secondary" onClick={() => setEditSection(null)} disabled={saving}>Cancel</Button>
                      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mm-apt-info-grid">
                    <InfoField label="Email"   value={alumni.contact_email   || "Not provided"} />
                    <InfoField label="Phone"   value={alumni.contact_phone   || "Not provided"} />
                    <InfoField label="Address" value={alumni.contact_address || "Not provided"} />
                  </div>
                )}
              </div>
            )}

            {/* Current Status (editable) */}
            {isGraduated && (
              <div className="mm-apt-card">
                <div className="mm-apt-card-header">
                  <h4 className="mm-apt-card-title">Current Status</h4>
                  {editSection !== "status" && (
                    <Button variant="secondary" onClick={() => setEditSection("status")}>Update</Button>
                  )}
                </div>
                {editSection === "status" ? (
                  <div className="mm-apt-edit-form">
                    {[
                      ["Occupation",         "current_occupation", "e.g., Software Engineer"],
                      ["Institution/Company","current_employer",   "e.g., University of Lagos"],
                      ["Course/Position",    "current_position",   "e.g., Computer Science"],
                    ].map(([label, field, ph]) => (
                      <div key={field} className="mm-apt-field">
                        <label className="mm-apt-field-label">{label}</label>
                        <input className="mm-apt-field-input" type="text"
                          value={editData[field]} onChange={set(field)} placeholder={ph}/>
                      </div>
                    ))}
                    <div className="mm-apt-form-actions">
                      <Button variant="secondary" onClick={() => setEditSection(null)} disabled={saving}>Cancel</Button>
                      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mm-apt-info-grid">
                    <InfoField label="Occupation"      value={alumni.current_occupation || "Not specified"} />
                    <InfoField label="Institution"     value={alumni.current_employer   || "Not specified"} />
                    <InfoField label="Course/Position" value={alumni.current_position   || "Not specified"} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificates panel */}
      <SlideInMenu isShow={showCerts} onClose={() => setShowCerts(false)} width="560px">
        <div className="cs-panel">
          <div className="cs-panel-header default">
            <span className="cs-panel-header-deco" aria-hidden="true"/>
            <div className="cs-panel-header-content">
              <div className="cs-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="cs-panel-header-text">
                <h2>Certificates & Documents</h2>
                <p>{certificates.length} document{certificates.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
          <div className="cs-panel-body">
            {certificates.length === 0 ? (
              <p className="cs-panel-empty">No certificates uploaded yet.</p>
            ) : (
              <div className="mm-cert-grid">
                {certificates.map((cert) => {
                  const STATUS_COLORS = {
                    Verified: { color: "#166534", bg: "#dcfce7" },
                    Pending:  { color: "#92400e", bg: "#fef3c7" },
                    Rejected: { color: "#dc2626", bg: "#fee2e2" },
                  };
                  const sc = STATUS_COLORS[cert.status] || STATUS_COLORS.Pending;
                  return (
                    <div key={cert.certificate_id} className="mm-cert-card">
                      <div className="mm-cert-thumb">
                        {["jpg","jpeg","png","gif","webp"].includes(cert.type) ? (
                          <img src={`${API}${cert.file_url}`} alt={cert.name} className="mm-cert-thumb-img"
                            onError={(e) => e.target.style.display = "none"}/>
                        ) : (
                          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <rect width="36" height="36" rx="8" fill={cert.type === "pdf" ? "#dc2626" : "#6b7280"}/>
                            <path d="M10 8h10l6 6v14a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
                            <path d="M20 8v6h6" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" fill="none"/>
                            <text x="18" y="26" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial, sans-serif">
                              {(cert.type || "FILE").toUpperCase().slice(0,4)}
                            </text>
                          </svg>
                        )}
                      </div>
                      <div className="mm-cert-info">
                        <div className="mm-cert-info-header">
                          <h4 className="mm-cert-name">{cert.name}</h4>
                          <span className="mm-cert-status-badge" style={{ background: sc.bg, color: sc.color }}>{cert.status}</span>
                        </div>
                        {cert.description && <p className="mm-cert-desc">{cert.description}</p>}
                        <div className="mm-cert-meta">
                          <span>{cert.size}</span>
                          <span>{cert.upload_date ? new Date(cert.upload_date).toLocaleDateString() : "—"}</span>
                        </div>
                        <div className="mm-cert-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="mm-cert-action-btn download" title="Download"
                            onClick={() => { const a = document.createElement("a"); a.href = `${API}${cert.file_url}`; a.download = cert.name; a.click(); }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="cs-panel-footer">
            <Button variant="secondary" onClick={() => setShowCerts(false)}>Close</Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

/* ── Guardians tab ── */
const GuardiansTab = ({ studentData }) => {
  const guardians = studentData?.guardians || [];
  return (
    <InnerTabCon>
      {guardians.length === 0 ? (
        <div className="cls-empty"><p>No guardian records found.</p></div>
      ) : (
        <div className="al-guardian-grid">
          {guardians.map((g, i) => (
            <div key={g.guardian_id || i} className={`al-guardian-card ${g.is_primary ? "primary" : ""}`}>
              <div className="al-guardian-card-header">
                <div className="al-guardian-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="al-guardian-name">{g.guardian_name || "Guardian"}</p>
                  <p className="al-guardian-rel">{g.guardian_relationship || "—"}</p>
                </div>
                {g.is_primary && <span className="si-badge active">Primary</span>}
              </div>
              <div className="al-guardian-body">
                <div className="si-grid">
                  <InfoField label="Phone"      value={g.guardian_phone} />
                  <InfoField label="Email"      value={g.guardian_email} />
                  <InfoField label="Occupation" value={g.guardian_occupation} />
                  <InfoField label="Address"    value={g.guardian_address} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Health tab ── */
const HealthTab = ({ studentData }) => {
  const records = studentData?.medical_records || [];
  const s = studentData?.student || {};
  return (
    <InnerTabCon>
      <div className="al-health-grid">
        {/* Health summary card */}
        {(s.blood_group || s.allergies || s.chronic_conditions) && (
          <div className="al-health-card">
            <div className="al-health-card-header">
              <div className="al-health-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="al-health-title">Health Summary</p>
                <p className="al-health-date">Basic health information</p>
              </div>
            </div>
            <div className="al-health-body">
              <div className="si-grid">
                <InfoField label="Blood Group"        value={s.blood_group} />
                <InfoField label="Genotype"           value={s.genotype} />
                <InfoField label="Allergies"          value={s.allergies} />
                <InfoField label="Chronic Conditions" value={s.chronic_conditions} />
                <InfoField label="Emergency Contact"  value={s.emergency_contact_name} />
                <InfoField label="Emergency Phone"    value={s.emergency_contact_phone} />
              </div>
            </div>
          </div>
        )}

        {/* Medical record cards */}
        {records.length === 0 && !s.blood_group && !s.allergies && !s.chronic_conditions ? (
          <div className="cls-empty"><p>No health records found.</p></div>
        ) : (
          records.map((r, i) => (
            <div key={r.record_id || i} className="al-health-card">
              <div className="al-health-card-header">
                <div className="al-health-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="al-health-title">{r.record_type || "Medical Record"}</p>
                  <p className="al-health-date">{fmt(r.record_date)}</p>
                </div>
              </div>
              <div className="al-health-body">
                <div className="si-grid">
                  <InfoField label="Diagnosis"    value={r.diagnosis} />
                  <InfoField label="Symptoms"     value={r.symptoms} />
                  <InfoField label="Treatment"    value={r.treatment} />
                  <InfoField label="Prescription" value={r.prescription} />
                  <InfoField label="Doctor"       value={r.doctor_name} />
                  <InfoField label="Hospital"     value={r.hospital_clinic} />
                  {r.notes && <InfoField label="Notes" value={r.notes} />}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </InnerTabCon>
  );
};

/* ── Resources tab ── */
const ResourcesTab = ({ studentData }) => {
  const studentId = studentData?.student?.student_id;
  const { getByStudent, incrementDownload } = useStudentResource();
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!studentId) return;
    getByStudent(studentId).then((res) => {
      if (res.success) setResources(res.data || []);
      setLoading(false);
    });
  }, [studentId]);

  const handleDownload = async (doc) => {
    try {
      await downloadFile(doc.file_url, doc.file_name || doc.name);
      await incrementDownload(doc.resource_id);
      setResources((prev) => prev.map((r) =>
        r.resource_id === doc.resource_id ? { ...r, download_count: (r.download_count || 0) + 1 } : r
      ));
    } catch {}
  };

  return (
    <InnerTabCon>
      {loading ? (
        <LoadingData message="Loading resources..." />
      ) : resources.length === 0 ? (
        <div className="cls-empty"><p>No resources found.</p></div>
      ) : (
        <div className="al-resource-grid">
          {resources.map((doc) => (
            <ResourceCard
              key={doc.resource_id}
              doc={{ ...doc, name: doc.resource_name || doc.name }}
              onDownload={handleDownload}
            />
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Admission History tab ── */
const AdmissionHistoryTab = ({ studentData }) => {
  const admissions = studentData?.admissions || [];
  return (
    <InnerTabCon>
      {admissions.length === 0 ? (
        <div className="cls-empty"><p>No admission records found.</p></div>
      ) : (
        <div className="al-admission-grid">
          {admissions.map((a, i) => (
            <div key={a.admission_id || i} className={`al-admission-card ${a.active_status ? "active" : ""}`}>
              <div className="al-admission-card-header">
                <div className="al-admission-card-icon">
                  {(a.school_logo && typeof a.school_logo === "string") ? (
                    <img src={a.school_logo} alt={a.school_name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="al-admission-card-info">
                  <p className="al-admission-school">{a.school_name || "School"}</p>
                  <p className="al-admission-class">{a.admission_class_name || a.admission_class || "—"}</p>
                </div>
                <span className={`si-badge ${a.active_status ? "active" : "inactive"}`}>
                  {a.active_status ? "Active" : "Closed"}
                </span>
              </div>
              <div className="al-admission-card-body">
                <div className="si-grid">
                  <InfoField label="Admission No." value={a.admission_number} />
                  <InfoField label="Admitted"      value={fmt(a.admitted_date)} />
                  <InfoField label="Session"       value={a.admission_session} />
                  <InfoField label="Term"          value={a.admission_term} />
                  <InfoField label="Type"          value={a.admission_type} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Main ── */
const Alumni = () => {
  const { user } = useAuth();
  const { schoolId } = useParams();
  const location = useLocation();

  const studentId = user?.student?.student_id;
  const { alumni: alumniRaw, certificates, loading: alumniLoading, graduationSession } = useStudentAlumni(studentId);
  const { studentData, loading: studentLoading } = useFetchStudentDetail(schoolId, studentId);
  const [alumni, setAlumni] = useState(alumniRaw);

  const loading = alumniLoading || studentLoading;
  const student = studentData?.student || user?.student || {};
  const basePath = location.pathname.split("/alumni")[0] + "/alumni";
  const isGraduated = !!alumni && graduationSession?.academic_year_start_date
    ? new Date(graduationSession.academic_year_start_date) <= new Date()
    : false;

  if (loading) return <LoadingData message="Loading profile..." />;

  return (
    <StudentDetailTopTab
      title={student.full_name || "My Profile"}
      subtitle={isGraduated ? `Graduate · ${student.admission_number || ""}` : student.admission_number || "Student Profile"}
      route={[
        { label: "Identity",          link: "/identity" },
        { label: "Guardians",         link: "/guardians" },
        { label: "Health",            link: "/health" },
        { label: "Resources",         link: "/resources" },
        { label: "Admission History", link: "/admission-history" },
      ]}
    >
      <Routes>
        <Route path="/" element={<Navigate to={`${basePath}/identity`} replace />} />
        <Route path="/identity"          element={<IdentityTab         studentData={studentData} alumni={alumni || alumniRaw} graduationSession={graduationSession} certificates={certificates} onAlumniUpdate={setAlumni} />} />
        <Route path="/guardians"         element={<GuardiansTab        studentData={studentData} />} />
        <Route path="/health"            element={<HealthTab           studentData={studentData} />} />
        <Route path="/resources"         element={<ResourcesTab        studentData={studentData} />} />
        <Route path="/admission-history" element={<AdmissionHistoryTab studentData={studentData} />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default Alumni;
