import "./TeacherInfoCard.css";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Button from "../../../../../../components/Button/Button";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import SearchableSelect from "../../../../../../components/SearchableSelect/SearchableSelect";
import useStaffInfo from "../../../../../../api_call/useStaffInfo";
import useTeacherInfo from "../../../../../../api_call/useTeacherInfo";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import {
  FaEllipsisV, FaHistory, FaExchangeAlt,
  FaUserTimes, FaUserTie, FaFileExport, FaPrint,
} from "react-icons/fa";

const TeacherInfoCard = ({
  teacherData,
  onViewPreviousAssignments,
  onDeactivateTeacher,
  isTeacherActive,
  refreshTeacherData,
}) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getStaffBySchoolId } = useStaffInfo();
  const { changeTeacherAssignment, loading: teacherLoading } = useTeacherInfo();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.teachers?.edit;

  const [showChangeAssignment, setShowChangeAssignment] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".tic-actions-wrap")) setShowDropdown(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape" && showDropdown) setShowDropdown(false); };
    if (showDropdown) setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDropdown]);

  const teacher = teacherData?.teacher || teacherData || {};
  const staff = teacher?.staff || {};
  const appointedBy = teacher?.appointed_by_admin || {};
  const teacherCode = teacher?.teacher_code || "N/A";
  const teacherId = teacher?.teacher_id || "N/A";
  const isActive = teacher?.is_active || false;
  const appointedAt = teacher?.appointed_at || null;

  useEffect(() => {
    if (!showChangeAssignment || !schoolId) return;
    setLoadingStaff(true);
    getStaffBySchoolId(schoolId)
      .then((result) => {
        if (result.success && result.data) {
          setAvailableStaff(result.data.filter((s) => s.staff_id !== staff.staff_id && s.is_active));
        } else {
          addNotification(result.message || "Failed to load staff list", "error");
        }
      })
      .catch(() => addNotification("Error loading staff list", "error"))
      .finally(() => setLoadingStaff(false));
  }, [showChangeAssignment, schoolId, staff.staff_id]);

  const handleSaveAssignment = async () => {
    if (!selectedStaff) { addNotification("Please select a staff member", "warning"); return; }
    const result = await changeTeacherAssignment(teacherId, selectedStaff, user?.admin?.admin_id);
    if (result.success) {
      addNotification("Teacher assignment changed successfully", "success");
      setShowChangeAssignment(false); setSelectedStaff("");
      if (refreshTeacherData) await refreshTeacherData();
    } else {
      addNotification(result.message || "Failed to change assignment", "error");
    }
  };

  const initials = (staff.full_name || "?").charAt(0).toUpperCase();

  return (
    <>
      <div className="tic-card">
        {/* Banner */}
        <div className="tic-banner">
          <span className="tic-banner-deco" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="tic-header">
          <div className="tic-avatar-wrap">
            {staff.staff_photo ? (
              <img src={staff.staff_photo} alt="Profile" className="tic-avatar"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
            ) : null}
            <div className="tic-avatar-fallback" style={{ display: staff.staff_photo ? "none" : "flex" }}>
              {initials}
            </div>
          </div>

          <div className="tic-header-info">
            <h3 className="tic-name">{staff.full_name || "Unknown Teacher"}</h3>
            <div className="tic-meta">
              <span className="tic-code">{teacherCode}</span>
              <span className={`tic-status-badge ${isActive ? "active" : "inactive"}`}>
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="tic-actions-wrap">
            <button className="tic-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
              <FaEllipsisV size={11} /> Actions
            </button>
            {showDropdown && (
              <div className="tic-dropdown">
                <button className="tic-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); onViewPreviousAssignments?.(); }}>
                  <FaHistory size={13} /> View Previous Assignments
                </button>
                <button className="tic-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowDropdown(false); if (!canEdit) { addNotification("No permission to change assignment.", "error"); return; } setShowChangeAssignment(true); }}>
                  <FaExchangeAlt size={13} /> Change Assignment
                </button>
                <button className={`tic-dropdown-item ${isTeacherActive ? "danger" : "success"}`}
                  onClick={(e) => { e.stopPropagation(); setShowDropdown(false); if (!canEdit) { addNotification("No permission.", "error"); return; } onDeactivateTeacher?.(); }}>
                  {isTeacherActive ? <><FaUserTimes size={13} /> Deactivate Teacher</> : <><FaUserTie size={13} /> Reactivate Teacher</>}
                </button>
                <div className="tic-dropdown-divider" />
                <button className="tic-dropdown-item" onClick={(e) => {
                  e.stopPropagation(); setShowDropdown(false);
                  const teacher = teacherData?.teacher || teacherData || {};
                  const s = teacher?.staff || {};
                  const apptBy = teacher?.appointed_by_admin || {};
                  const w = window.open("", "_blank");
                  w.document.open();
                  w.document.write(`<html><head><title>Teacher Profile - ${s.full_name || "Teacher"}</title>
                  <style>
                    body{font-family:Arial,sans-serif;margin:24px;color:#111}
                    h1{font-size:20px;font-weight:800;margin:0 0 4px}
                    .sub{font-size:13px;color:#888;margin:0 0 24px}
                    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin:20px 0 12px}
                    .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
                    .field label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}
                    .field span{font-size:12px;color:#111;font-weight:600}
                    @media print{body{margin:12px}}
                  </style></head><body>
                  <h1>${s.full_name || "Teacher"}</h1>
                  <p class="sub">Teacher Code: ${teacher.teacher_code || "N/A"} · ${teacher.is_active ? "Active" : "Inactive"} · Generated ${new Date().toLocaleDateString()}</p>
                  <div class="section-title">Teacher Information</div>
                  <div class="grid">
                    <div class="field"><label>Teacher Code</label><span>${teacher.teacher_code || "N/A"}</span></div>
                    <div class="field"><label>Staff ID</label><span>${s.staff_id || "N/A"}</span></div>
                    <div class="field"><label>Email</label><span>${s.email || "N/A"}</span></div>
                    <div class="field"><label>Phone</label><span>${s.phone || "N/A"}</span></div>
                    <div class="field"><label>Department</label><span>${s.department || "N/A"}</span></div>
                    <div class="field"><label>Experience</label><span>${s.experience_years ? s.experience_years + " yrs" : "N/A"}</span></div>
                    <div class="field"><label>Position</label><span>${s.position || "N/A"}</span></div>
                    <div class="field"><label>Status</label><span>${teacher.is_active ? "Active" : "Inactive"}</span></div>
                  </div>
                  <div class="section-title">Appointment Information</div>
                  <div class="grid">
                    <div class="field"><label>Appointed By</label><span>${apptBy.full_name || apptBy.username || "N/A"}</span></div>
                    <div class="field"><label>Appointed Role</label><span>${apptBy.admin_role || "N/A"}</span></div>
                    <div class="field"><label>Appointment Date</label><span>${teacher.appointed_at ? new Date(teacher.appointed_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"}</span></div>
                  </div>
                  </body></html>`);
                  w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 400);
                }}>
                  <FaPrint size={13} /> Print
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="tic-body">
          <div>
            <span className="tic-section-title">Teacher Information</span>
            <div className="tic-grid">
              <InfoField label="Teacher Code"  value={teacherCode} />
              <InfoField label="Staff ID"       value={staff.staff_id || "N/A"} />
              <InfoField label="Email"          value={staff.email || "N/A"} />
              <InfoField label="Phone"          value={staff.phone || "N/A"} />
              <InfoField label="Department"     value={staff.department || "N/A"} />
              <InfoField label="Experience"     value={staff.experience_years ? `${staff.experience_years} yrs` : "N/A"} />
            </div>
          </div>

          <div>
            <span className="tic-section-title">Staff Profile</span>
            <div className="tic-grid">
              <div>
                <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888888" }}>Full Staff Details</p>
                <button className="tic-link-chip" onClick={() => staff.staff_id && navigate(`/admin/${schoolId}/staff/${staff.staff_id}`)}>
                  View Staff Profile
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="tic-link-chev">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <InfoField label="Assignment Status" value={isActive ? "Currently Assigned" : "Not Assigned"} />
            </div>
          </div>

          <div>
            <span className="tic-section-title">Appointment Information</span>
            <div className="tic-grid">
              <InfoField label="Appointed By"   value={appointedBy.full_name || appointedBy.username || "Unknown"} />
              <InfoField label="Appointed Role" value={appointedBy.admin_role || "N/A"} />
              <InfoField label="Appointment Date" value={appointedAt ? new Date(appointedAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "N/A"} />
              <InfoField label="Position"       value={staff.position || "N/A"} />
            </div>
          </div>
        </div>
      </div>

      {/* Change Assignment Panel */}
      <SlideInMenu isShow={showChangeAssignment} onClose={() => { setShowChangeAssignment(false); setSelectedStaff(""); }} width="520px">
        <div className="ti-panel">
          <div className="ti-panel-header default">
            <span className="ti-panel-header-deco" aria-hidden="true" />
            <div className="ti-panel-header-content">
              <div className="ti-panel-header-icon">
                <FaExchangeAlt size={16} />
              </div>
              <div className="ti-panel-header-text">
                <h2>Change Staff Assignment</h2>
                <p>Assign a different staff member to this teacher</p>
              </div>
            </div>
          </div>
          <div className="ti-panel-body">
            <div className="ti-info-box current">
              <span className="ti-info-box-title">Current Assignment</span>
              <div className="ti-info-row"><span className="ti-info-row-label">Name:</span><span className="ti-info-row-value">{staff.full_name || "N/A"}</span></div>
              <div className="ti-info-row"><span className="ti-info-row-label">ID:</span><span className="ti-info-row-value">{staff.staff_id || "N/A"}</span></div>
              <div className="ti-info-row"><span className="ti-info-row-label">Dept:</span><span className="ti-info-row-value">{staff.department || "N/A"}</span></div>
            </div>

            <div>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#888888" }}>Select New Staff Member</p>
              {loadingStaff ? (
                <p className="ti-panel-empty">Loading staff members...</p>
              ) : availableStaff.length === 0 ? (
                <p className="ti-panel-empty">No available staff members found.</p>
              ) : (
                <SearchableSelect
                  placeholder="Search staff by name, email, department..."
                  options={availableStaff.map((s) => ({
                    value: s.staff_id,
                    label: s.full_name,
                    subtitle: `${s.staff_id} · ${s.role || "Staff"} · ${s.department || "N/A"}`,
                  }))}
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  displayKey="label" valueKey="value"
                  searchKeys={["label", "subtitle"]}
                  maxDisplayItems={10}
                />
              )}
              {selectedStaff && (
                <div className="ti-selected-preview" style={{ marginTop: 10 }}>
                  {availableStaff.find((s) => s.staff_id === selectedStaff)?.full_name}
                  <span style={{ color: "#888888", fontWeight: 600, marginLeft: 8, fontSize: 11 }}>
                    {availableStaff.find((s) => s.staff_id === selectedStaff)?.department || ""}
                  </span>
                </div>
              )}
            </div>

            <div className="ti-info-box warn">
              ⚠️ Changing the staff assignment will update the teacher entity and be recorded in the assignment history.
            </div>
          </div>
          <div className="ti-panel-footer">
            <Button variant="secondary" onClick={() => { setShowChangeAssignment(false); setSelectedStaff(""); }} disabled={teacherLoading}>Cancel</Button>
            <Button onClick={handleSaveAssignment} disabled={!selectedStaff || teacherLoading || loadingStaff}>
              {teacherLoading ? "Changing..." : "Change Assignment"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </>
  );
};

export default TeacherInfoCard;
