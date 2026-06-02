import { useState, useEffect } from "react";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAdmin } from "../../../../../api_call/useAdmin";
import useStaffInfo from "../../../../../api_call/useStaffInfo";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

const IcoAdmin = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M3 19c0-3.9 3.6-7 8-7s8 3.1 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M15 3l1.5 1.5L19 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MODULES = [
  { id: "academic_sessions",        label: "Academic Sessions" },
  { id: "school_event",             label: "School Event" },
  { id: "school_calendar",          label: "School Calendar" },
  { id: "student_report",           label: "Student Reports" },
  { id: "students",                 label: "Students" },
  { id: "classes",                  label: "Classes" },
  { id: "teachers",                 label: "Teachers" },
  { id: "staff",                    label: "Staff" },
  { id: "subject",                  label: "Subject" },
  { id: "communication",            label: "Communication" },
  { id: "bill_income_expense",      label: "Bill, Income & Expenses" },
  { id: "school_account",           label: "School Account" },
  { id: "report_template",          label: "Report Template" },
  { id: "fee_billing_template",     label: "Fee Billing Template" },
  { id: "timetable_template",       label: "Timetable Template" },
  { id: "announcement_template",    label: "Announcement Template" },
  { id: "class_promotion_template", label: "Class Promotion Template" },
  { id: "graduate",                 label: "Graduate" },
];

const emptyPerms = () => Object.fromEntries(MODULES.map(m => [m.id, { read: false, create: false, edit: false, delete: false }]));
const allPerms  = () => Object.fromEntries(MODULES.map(m => [m.id, { read: true,  create: true,  edit: true,  delete: true  }]));

const ACTION_COLOR = { read: "#8b5cf6", create: "#166534", edit: "#1e40af", delete: "#991b1b" };
const ACTION_BG    = { read: "#f5f3ff", create: "#dcfce7", edit: "#dbeafe", delete: "#fecaca" };

const PromoteStaffPanel = ({ isShow, onClose, schoolId }) => {
  const { addNotification } = useNotification();
  const { createAdminFromStaff, loading } = useAdmin();
  const { getStaffBySchoolId, loading: staffLoading } = useStaffInfo();

  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");
  const [staffData, setStaffData] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [form, setForm] = useState({ staffId: "", admin_role: "", access_scope: "limited", permissions: emptyPerms(), two_fac_auth: false });

  useEffect(() => {
    if (!isShow || !schoolId) return;
    getStaffBySchoolId(schoolId).then(r => {
      if (r.success) setStaffData(r.data.filter(s => s.is_active === true));
      else { addNotification(r.message || "Failed to fetch staff", "error"); setStaffData([]); }
    });
  }, [isShow, schoolId]);

  const handleScopeChange = (scope) => setForm(p => ({ ...p, access_scope: scope, permissions: scope === "full" ? allPerms() : emptyPerms() }));
  const handleFormChange  = (field) => (value) => { if (field === "access_scope") { handleScopeChange(value); return; } setForm(p => ({ ...p, [field]: value })); };

  const handleStaffSelect = (staffId) => {
    const s = staffData.find(s => s.staff_id === staffId);
    if (s) { setSelectedStaff(s); setForm(p => ({ ...p, staffId: s.staff_id })); }
  };

  const toggleAction = (moduleId, action) => {
    setForm(p => {
      const cur = { ...p.permissions[moduleId] };
      const newVal = !cur[action];
      cur[action] = newVal;
      if (action !== "read" && newVal) cur.read = true;
      if (action === "read" && !newVal) { cur.create = false; cur.edit = false; cur.delete = false; }
      return { ...p, permissions: { ...p.permissions, [moduleId]: cur } };
    });
  };

  const toggleModule = (moduleId) => {
    setForm(p => {
      const allOn = Object.values(p.permissions[moduleId]).every(Boolean);
      return { ...p, permissions: { ...p.permissions, [moduleId]: { read: !allOn, create: !allOn, edit: !allOn, delete: !allOn } } };
    });
  };

  const handleSubmit = async () => {
    if (!selectedStaff)      { addNotification("Please select a staff member", "error"); return; }
    if (!form.admin_role)    { addNotification("Please enter an admin role", "error"); return; }
    const result = await createAdminFromStaff({
      staff_id: selectedStaff.staff_id, school_id: schoolId,
      username: selectedStaff.full_name, email: selectedStaff.email,
      password: "ChangeMe@123", admin_role: form.admin_role,
      access_scope: form.access_scope, permissions: form.permissions,
      is_active: true, assigned_by: null, two_fac_auth: form.two_fac_auth,
    });
    if (result.success) {
      addNotification(`${selectedStaff.full_name} promoted to Administrator!`, "success");
      handleClose();
    } else {
      if (result.limitType === "subadmin" || result.message?.includes("limit")) {
        setStorageLimitMsg(result.message || "Sub-admin limit reached."); setStorageLimitOpen(true);
      } else {
        addNotification(result.message || "Failed to promote staff", "error");
      }
    }
  };

  const handleClose = () => {
    setSelectedStaff(null);
    setForm({ staffId: "", admin_role: "", access_scope: "limited", permissions: emptyPerms(), two_fac_auth: false });
    onClose();
  };

  return (
    <>
      <SlideInMenu isShow={isShow} onClose={handleClose} width="820px">
        <div className="psp-container">

          {/* ── Header ── */}
          <div className="psp-header">
            <span className="psp-header-deco"  aria-hidden="true" />
            <span className="psp-header-deco2" aria-hidden="true" />
            <div className="psp-header-content">
              <div className="psp-header-icon"><IcoAdmin /></div>
              <div className="psp-header-text">
                <h2>Promote Staff to Administrator</h2>
                <p>Select a staff member and configure their admin role and permissions</p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="psp-body">

            {/* Staff selection */}
            <div className="psp-section">
              <div className="psp-section-title">Select Staff Member</div>
              {staffLoading ? (
                <LoadingData message="Loading staff members..." />
              ) : staffData.length === 0 ? (
                <div className="adm-unassigned" style={{ padding: "12px 0" }}>No active staff members found.</div>
              ) : (
                <SearchableSelect
                  placeholder="Search for staff member..."
                  options={staffData.map(s => ({ value: s.staff_id, label: s.full_name, subtitle: `${s.position || ""} · ${s.department || ""}` }))}
                  value={selectedStaff?.staff_id || ""}
                  onChange={handleStaffSelect}
                />
              )}

              {selectedStaff && (
                <div className="psp-staff-card">
                  <div className="psp-staff-card-header">
                    <div className="psp-staff-avatar">{selectedStaff.full_name.charAt(0).toUpperCase()}</div>
                    <div className="psp-staff-info">
                      <span className="psp-staff-name">{selectedStaff.full_name}</span>
                      <span className="psp-staff-meta">{selectedStaff.position} · {selectedStaff.department}</span>
                    </div>
                  </div>
                  <div className="psp-staff-details">
                    {[["Email", selectedStaff.email], ["Department", selectedStaff.department], ["Position", selectedStaff.position], ["Staff ID", selectedStaff.staff_id?.substring(0, 12)]].map(([label, value]) => (
                      <div key={label} className="psp-detail-row">
                        <span className="psp-detail-label">{label}</span>
                        <span className="psp-detail-value">{value || "N/A"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role & Access */}
            <div className="psp-section">
              <div className="psp-section-title">Admin Role & Access Level</div>
              <div className="psp-form-row">
                <FormInput label="Admin Role *" type="text" value={form.admin_role} onChange={handleFormChange("admin_role")} placeholder="e.g., Sub Admin, Department Head" />
                <FormInput label="Access Scope *" type="select" value={form.access_scope} onChange={handleFormChange("access_scope")}
                  options={[{ value: "limited", label: "Limited Access" }, { value: "full", label: "Full Access" }]} />
              </div>
              <label className="psp-2fa-label">
                <input type="checkbox" checked={form.two_fac_auth} onChange={e => setForm(p => ({ ...p, two_fac_auth: e.target.checked }))} />
                <div>
                  <p className="psp-2fa-title">Enable Two-Factor Authentication</p>
                  <p className="psp-2fa-hint">Require OTP verification for login</p>
                </div>
              </label>
            </div>

            {/* Permissions */}
            <div className="psp-section">
              <div className="psp-section-title">Permissions & Access Rights</div>
              <p className="psp-perms-hint">Configure access per module. "Full Access" above grants all permissions automatically.</p>

              <div className="psp-perms-table">
                <div className="psp-perms-head">
                  <div className="psp-perms-head-cell">Module</div>
                  {["Read","Create","Edit","Delete"].map(a => (
                    <div key={a} className="psp-perms-head-cell" style={{ color: ACTION_COLOR[a.toLowerCase()] }}>{a}</div>
                  ))}
                  <div className="psp-perms-head-cell">All</div>
                </div>

                {MODULES.map((mod, i) => {
                  const perms = form.permissions[mod.id];
                  const allOn = perms.create && perms.edit && perms.delete;
                  return (
                    <div key={mod.id} className={`psp-perms-row${allOn ? " all-on" : ""}`}>
                      <div className="psp-module-label">{mod.label}</div>
                      {["read","create","edit","delete"].map(action => {
                        const isLocked = action === "read" && (perms.create || perms.edit || perms.delete);
                        return (
                          <div key={action} className="psp-check-cell">
                            <div
                              className={`psp-checkbox${isLocked ? " locked" : ""}`}
                              style={{
                                borderColor: perms[action] ? ACTION_COLOR[action] : undefined,
                                background: perms[action] ? ACTION_BG[action] : undefined,
                              }}
                              onClick={() => !isLocked && toggleAction(mod.id, action)}
                            >
                              {perms[action] && (
                                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke={ACTION_COLOR[action]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="psp-check-cell">
                        <div
                          className="psp-checkbox"
                          style={{ borderColor: allOn ? "#111111" : undefined, background: allOn ? "#f4f4f4" : undefined }}
                          onClick={() => toggleModule(mod.id)}
                        >
                          {allOn && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Footer ── */}
          <div className="psp-footer">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !selectedStaff || !form.admin_role}>
              {loading ? "Promoting..." : "Promote to Administrator"}
            </Button>
          </div>

        </div>
      </SlideInMenu>

      <SubscriptionLimitModal
        isOpen={storageLimitOpen}
        onClose={() => setStorageLimitOpen(false)}
        message={storageLimitMsg}
        title="Sub-Admin Limit Reached"
      />
    </>
  );
};

export default PromoteStaffPanel;
