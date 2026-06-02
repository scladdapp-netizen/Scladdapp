import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import InfoField from "../../../../../../components/infoField/InfoField";
import Button from "../../../../../../components/Button/Button";
import { useClassStudents } from "../../../../../../api_call/useClassStudents";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;
const TABS = ["Identity", "Health", "Guardian"];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—";

const medicalRecordTitle = (r) =>
  r.diagnosis || r.chronic_conditions || r.symptoms || r.record_type || "Medical record";

/** [fieldKey, label] for StudentMedicalRecord — only fields with values are rendered */
const MEDICAL_DETAIL_FIELDS = [
  ["record_type", "Type"],
  ["diagnosis", "Diagnosis"],
  ["symptoms", "Symptoms"],
  ["treatment", "Treatment"],
  ["prescription", "Prescription"],
  ["doctor_name", "Doctor"],
  ["hospital_clinic", "Hospital / clinic"],
  ["doctor_phone", "Doctor phone"],
  ["allergies", "Allergies"],
  ["chronic_conditions", "Chronic conditions"],
  ["medications", "Medications"],
];

const SessionStudents = () => {
  const { classId, schoolId } = useParams();
  const location  = useLocation();
  const subseasion = location.state?.subseasion;
  const { makeClassStudentsFetcher } = useClassStudents();

  const [activeTab, setActiveTab]         = useState("Identity");
  const [panelOpen, setPanelOpen]         = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentDetail, setStudentDetail] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [medicalLoading, setMedicalLoading] = useState(false);

  const student = studentDetail?.student;

  const fetchData = useMemo(
    () => makeClassStudentsFetcher(classId, subseasion),
    [classId, subseasion]
  );

  useEffect(() => {
    if (!panelOpen || activeTab !== "Health" || !student?.student_id) return;
    const ac = new AbortController();
    setMedicalLoading(true);
    fetch(`${API}/api/student-medical-record/student/${student.student_id}`, { signal: ac.signal })
      .then((res) => res.json())
      .then((json) => {
        if (ac.signal.aborted) return;
        if (json.success && Array.isArray(json.data)) setMedicalRecords(json.data);
        else setMedicalRecords([]);
      })
      .catch(() => {
        if (!ac.signal.aborted) setMedicalRecords([]);
      })
      .finally(() => {
        setMedicalLoading(false);
      });
    return () => {
      ac.abort();
    };
  }, [panelOpen, activeTab, student?.student_id]);

  const handleRowClick = async (row) => {
    setPanelOpen(true);
    setActiveTab("Identity");
    setStudentDetail(null);
    setMedicalRecords([]);
    setDetailLoading(true);
    try {
      const res  = await fetch(`${API}/student/${row.student_id}/detail?schoolId=${schoolId || row.school_id || ""}`);
      const data = await res.json();
      if (data.success) setStudentDetail(data.data);
    } catch (_) {}
    setDetailLoading(false);
  };

  const columns = [
    {
      accessor: "full_name",
      label: "Student",
      searchable: true,
      render: (val, row) => (
        <div className="cls-name-cell">
          <div className="cls-avatar">
            {row.student_photo
              ? <img src={row.student_photo} alt={val} />
              : (val || "?").charAt(0).toUpperCase()}
          </div>
          <span className="cls-student-name">{val || "—"}</span>
        </div>
      ),
    },
    { accessor: "admission_number", label: "Admission No." },
    { accessor: "gender",           label: "Gender" },
    {
      accessor: "date_of_birth",
      label: "Date of Birth",
      searchable: false,
      render: (v) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—",
    },
    {
      accessor: "student_status",
      label: "Status",
      searchable: false,
      render: (v) => (
        <span className={`cls-status ${v === "active" ? "active" : "inactive"}`}>{v || "—"}</span>
      ),
    },
  ];

  return (
    <InnerTabCon>
      <div className="classStudents">
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Students</h2>
            <p className="cls-subtitle">Students enrolled in this class for the selected subsession</p>
          </div>
        </div>

        <div className="cls-table-container">
          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            onRowClick={handleRowClick}
            enableSelect={false}
            showcreatbut={false}
            initialPageSize={20}
            reloadKey={`${classId}-${subseasion}`}
          />
        </div>
      </div>

      {/* Student detail panel */}
      <SlideInMenu isShow={panelOpen} onClose={() => setPanelOpen(false)} width="560px">
        <div className="cs-panel">
          {/* Header */}
          <div className="cs-panel-header default">
            <span className="cs-panel-header-deco" aria-hidden="true" />
            <div className="cs-panel-header-content">
              <div className="cs-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
                </svg>
              </div>
              <div className="cs-panel-header-text">
                {detailLoading ? (
                  <h2>Loading...</h2>
                ) : student ? (
                  <>
                    <h2>{student.full_name}</h2>
                    <p>{student.admission_number} · {student.student_status}</p>
                  </>
                ) : (
                  <h2>Student Detail</h2>
                )}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          {!detailLoading && student && (
            <div className="ss-tabs">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  className={`ss-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="cs-panel-body">
            {detailLoading ? (
              <LoadingData message="Loading student information..." />
            ) : !student ? (
              <p className="cs-panel-empty">Failed to load student data.</p>
            ) : (
              <>
                {activeTab === "Identity" && (
                  <div className="cs-panel-grid">
                    <InfoField label="Full Name"      value={student.full_name} />
                    <InfoField label="Admission No." value={student.admission_number} />
                    <InfoField label="Date of Birth"   value={fmt(student.date_of_birth)} />
                    <InfoField label="Gender"          value={student.gender} />
                    <InfoField label="Email"           value={student.email} />
                    <InfoField label="Phone"           value={student.phone} />
                    <InfoField label="Religion"        value={student.religion} />
                    <InfoField label="Nationality"     value={student.nationality} />
                    <InfoField label="State of Origin" value={student.state_of_origin} />
                    <InfoField label="Address"         value={student.address} />
                    <InfoField label="Status"          value={student.student_status} />
                  </div>
                )}

                {activeTab === "Guardian" && (
                  studentDetail.guardians?.length ? (
                    <div className="ss-guardian-stack">
                      {studentDetail.guardians.map((g, i) => (
                        <div key={g.guardian_id || i} className="ss-guardian-card">
                          <div className="ss-guardian-top">
                            <span className="ss-guardian-name">{g.guardian_name}</span>
                            {g.is_primary ? (
                              <span className="ss-primary-badge">Primary</span>
                            ) : null}
                          </div>
                          <div className="cs-panel-grid ss-guardian-grid">
                            <InfoField label="Relationship" value={g.guardian_relationship} />
                            <InfoField label="Phone"        value={g.guardian_phone} />
                            <InfoField label="Email"        value={g.guardian_email} />
                            <InfoField label="Occupation"   value={g.guardian_occupation} />
                            <InfoField label="Address"      value={g.guardian_address} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="cs-panel-empty">No guardian records found.</p>
                  )
                )}

                {activeTab === "Health" && (
                  <div className="ss-guardian-stack">
                    <div className="ss-guardian-card">
                      <div className="ss-guardian-top">
                        <span className="ss-guardian-name">Basic health</span>
                      </div>
                      <div className="cs-panel-grid ss-guardian-grid">
                        <InfoField label="Blood Group"        value={student.blood_group} />
                        <InfoField label="Genotype"           value={student.genotype} />
                        <InfoField label="Emergency Contact"  value={student.emergency_contact_name} />
                        <InfoField label="Emergency Phone"    value={student.emergency_contact_phone} />
                        <InfoField label="Emergency Relation" value={student.emergency_contact_relationship} />
                      </div>
                    </div>
                    {medicalLoading ? (
                      <div className="ss-health-records-loading">
                        <LoadingData message="Loading medical records..." />
                      </div>
                    ) : medicalRecords.length === 0 ? (
                      <p className="cs-panel-empty ss-health-empty">No medical records on file.</p>
                    ) : (
                      medicalRecords.map((r, i) => (
                        <div key={r.record_id || i} className="ss-guardian-card">
                          <div className="ss-guardian-top">
                            <span className="ss-guardian-name ss-guardian-name--multiline">
                              {medicalRecordTitle(r)}
                            </span>
                            <span className="ss-health-record-date">{fmt(r.record_date)}</span>
                          </div>
                          <div className="cs-panel-grid ss-guardian-grid">
                            {MEDICAL_DETAIL_FIELDS.map(([key, label]) =>
                              r[key] ? <InfoField key={key} label={label} value={String(r[key])} /> : null
                            )}
                            {r.follow_up_required ? (
                              <InfoField
                                label="Follow-up"
                                value={
                                  r.follow_up_date
                                    ? `Yes — ${fmt(r.follow_up_date)}`
                                    : "Yes"
                                }
                              />
                            ) : null}
                            {r.notes ? <InfoField label="Notes" value={r.notes} /> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="cs-panel-footer">
            <Button variant="secondary" onClick={() => setPanelOpen(false)}>Close</Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default SessionStudents;
