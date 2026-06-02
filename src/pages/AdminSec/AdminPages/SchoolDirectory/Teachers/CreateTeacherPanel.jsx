import React, { useState, useEffect } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useStaffInfo, useTeacherInfo } from "../../../../../api_call";
import { useParams } from "react-router-dom";

/* ── Icon ─────────────────────────────────────────────────────────────────── */
const IcoTeacher = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M2 19c0-3.3 2.7-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M17 10v5M14.5 12.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const CreateTeacherPanel = ({ isShow, onClose, onTeacherCreated }) => {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getStaffBySchoolId, loading: staffLoading } = useStaffInfo();
  const { createTeacher, loading: teacherLoading } = useTeacherInfo();

  const [teacherCode, setTeacherCode] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isShow && schoolId) loadStaffData();
  }, [isShow, schoolId]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      const result = await getStaffBySchoolId(schoolId);
      if (result.success) {
        setStaffList(result.data.filter(s => s.is_active && s.record_status === "active"));
      } else {
        addNotification("Failed to load staff data", "error");
        setStaffList([]);
      }
    } catch (e) {
      console.error("Error loading staff:", e);
      addNotification("Error loading staff data", "error");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedStaff = staffList.find(s => s.staff_id === selectedStaffId);

  const handleCreateTeacher = async () => {
    if (!teacherCode.trim()) { addNotification("Please enter a teacher code", "error"); return; }
    if (!selectedStaff)      { addNotification("Please select a staff member", "error"); return; }
    try {
      setLoading(true);
      const result = await createTeacher({
        staff_id: selectedStaff.staff_id,
        teacher_code: teacherCode.trim(),
        school_id: schoolId,
        appointed_by: user?.admin?.admin_id || user?.staff?.staff_id || null,
      });
      if (result.success) {
        addNotification(`${selectedStaff.full_name} assigned as teacher (${teacherCode})!`, "success");
        onTeacherCreated?.(result.data);
        resetForm(); onClose();
      } else {
        addNotification(result.message || "Failed to create teacher", "error");
      }
    } catch (e) {
      console.error("Error creating teacher:", e);
      addNotification("Failed to create teacher", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setTeacherCode(""); setSelectedStaffId(""); };
  const handleClose = () => { resetForm(); onClose(); };
  const isFormValid = teacherCode.trim() && selectedStaff && !loading && !teacherLoading;
  const isBusy = loading || staffLoading || teacherLoading;

  return (
    <SlideInMenu isShow={isShow} onClose={handleClose} width="600px">
      <div className="ctp-container">

        {/* ── Header ── */}
        <div className="ctp-header">
          <span className="ctp-header-deco"  aria-hidden="true" />
          <span className="ctp-header-deco2" aria-hidden="true" />
          <div className="ctp-header-content">
            <div className="ctp-header-icon"><IcoTeacher /></div>
            <div className="ctp-header-text">
              <h2>Create New Teacher</h2>
              <p>Assign a staff member as a teacher with a unique code</p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ctp-body">
          {isBusy ? (
            <div className="ctp-loading">
              <LoadingData message={teacherLoading ? "Creating teacher..." : "Loading staff data..."} />
            </div>
          ) : (
            <>
              {/* Teacher Code */}
              <div className="ctp-field-group">
                <FormInput
                  label="Teacher Code *"
                  value={teacherCode}
                  onChange={setTeacherCode}
                  placeholder="e.g., TCH001"
                />
                <p className="ctp-hint">This will be the unique identifier for the teacher</p>
              </div>

              {/* Staff Selection */}
              <div className="ctp-field-group">
                <SearchableSelect
                  label="Select Staff Member *"
                  options={staffList.map(s => ({
                    label: s.full_name,
                    value: s.staff_id,
                    subtitle: `${s.position} · ${s.department} · ${s.email}`,
                  }))}
                  value={selectedStaffId}
                  onChange={setSelectedStaffId}
                  displayKey="label"
                  valueKey="value"
                  searchKeys={["label", "subtitle"]}
                  placeholder="Search by name, email, or department..."
                  required
                />
                {staffList.length === 0 && (
                  <p className="ctp-warn">No available staff members found.</p>
                )}
              </div>

              {/* Selected staff preview */}
              {selectedStaff && (
                <div className="ctp-staff-card">
                  <div className="ctp-staff-card-header">
                    <div className="ctp-staff-avatar">
                      {selectedStaff.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ctp-staff-info">
                      <span className="ctp-staff-name">{selectedStaff.full_name}</span>
                      <span className="ctp-staff-meta">{selectedStaff.position} · {selectedStaff.department}</span>
                    </div>
                    <span className="ctp-staff-badge">Selected</span>
                  </div>
                  <div className="ctp-staff-details">
                    {[
                      ["Staff ID",  selectedStaff.staff_id],
                      ["Email",     selectedStaff.email],
                      ["Position",  selectedStaff.position],
                      ["Department",selectedStaff.department],
                    ].map(([label, value]) => (
                      <div key={label} className="ctp-detail-row">
                        <span className="ctp-detail-label">{label}</span>
                        <span className="ctp-detail-value">{value || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="ctp-footer">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreateTeacher} disabled={!isFormValid}>
            {loading ? "Creating..." : "Create Teacher"}
          </Button>
        </div>

      </div>
    </SlideInMenu>
  );
};

export default CreateTeacherPanel;
