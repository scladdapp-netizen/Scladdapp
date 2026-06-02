import { useState } from "react";
import "./AdminCredentials.css";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import { useAdmin } from "../../../../../../api_call/useAdmin";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";

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

const ACTIONS = ["read", "create", "edit", "delete"];

const normalisePermissions = (raw) => {
  const base = Object.fromEntries(
    MODULES.map((m) => [m.id, { read: false, create: false, edit: false, delete: false }])
  );
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  MODULES.forEach((m) => {
    if (raw[m.id] && typeof raw[m.id] === "object") {
      base[m.id] = {
        read:   !!raw[m.id].read,
        create: !!raw[m.id].create,
        edit:   !!raw[m.id].edit,
        delete: !!raw[m.id].delete,
      };
    }
  });
  return base;
};

const AdminCredentials = ({ adminData, refreshAdminData }) => {
  const { updateAdmin, loading } = useAdmin();
  const { addNotification } = useNotification();

  const admin = adminData?.admin;
  const [editMode, setEditMode] = useState(false);
  const [permissions, setPermissions] = useState(() => normalisePermissions(admin?.permissions));
  const [accessScope, setAccessScope] = useState(admin?.access_scope || "limited");

  const syncFromProps = () => {
    setPermissions(normalisePermissions(admin?.permissions));
    setAccessScope(admin?.access_scope || "limited");
  };

  const handleScopeChange = (scope) => {
    setAccessScope(scope);
    if (scope === "full") {
      setPermissions(Object.fromEntries(
        MODULES.map((m) => [m.id, { read: true, create: true, edit: true, delete: true }])
      ));
    } else {
      setPermissions(Object.fromEntries(
        MODULES.map((m) => [m.id, { read: false, create: false, edit: false, delete: false }])
      ));
    }
  };

  const toggleAction = (moduleId, action) => {
    setPermissions((prev) => {
      const current = prev[moduleId];
      const newVal = !current[action];
      const updated = { ...current, [action]: newVal };
      if (action !== "read" && newVal) updated.read = true;
      if (action === "read" && !newVal) { updated.create = false; updated.edit = false; updated.delete = false; }
      return { ...prev, [moduleId]: updated };
    });
  };

  const toggleModule = (moduleId) => {
    setPermissions((prev) => {
      const allOn = Object.values(prev[moduleId]).every(Boolean);
      return { ...prev, [moduleId]: { read: !allOn, create: !allOn, edit: !allOn, delete: !allOn } };
    });
  };

  const handleSave = async () => {
    const res = await updateAdmin(admin.admin_id, { permissions, access_scope: accessScope });
    if (res.success) {
      addNotification("Permissions updated successfully", "success");
      setEditMode(false);
      if (refreshAdminData) refreshAdminData();
    } else {
      addNotification(res.message || "Failed to update permissions", "error");
    }
  };

  const handleCancel = () => { syncFromProps(); setEditMode(false); };

  if (!admin) {
    return (
      <InnerTabCon>
        <div className="acred-empty">No admin data available.</div>
      </InnerTabCon>
    );
  }

  return (
    <InnerTabCon>
      <div className="acred-wrap">

        <div className="acred-header">
          <div className="acred-header-left">
            <div className="acred-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="acred-title">Permissions & Access Rights</h2>
              <p className="acred-subtitle">
                {admin.admin_role} · Access scope:&nbsp;
                <span className={`acred-scope-label ${accessScope === "full" ? "full" : ""}`}>
                  {accessScope === "full" ? "Full Access" : "Limited Access"}
                </span>
              </p>
            </div>
          </div>
          <div className="acred-header-actions">
            {editMode ? (
              <>
                <Button variant="secondary" onClick={handleCancel} disabled={loading}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)}>Edit Permissions</Button>
            )}
          </div>
        </div>

        {editMode && (
          <div className="acred-scope-row">
            <span className="acred-scope-row-label">Access Scope:</span>
            {["limited", "full"].map((s) => (
              <label key={s} className="acred-scope-option">
                <input
                  type="radio"
                  name="access_scope"
                  value={s}
                  checked={accessScope === s}
                  onChange={() => handleScopeChange(s)}
                />
                {s === "full" ? "Full Access" : "Limited Access"}
              </label>
            ))}
          </div>
        )}

        <div className="acred-table">
          <div className="acred-table-head">
            <div className="acred-col-module">Module</div>
            {ACTIONS.map((a) => (
              <div key={a} className={`acred-col-action acred-col-${a}`}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </div>
            ))}
            <div className="acred-col-all">All</div>
          </div>

          {MODULES.map((mod, i) => {
            const perms = permissions[mod.id] || { read: false, create: false, edit: false, delete: false };
            const allOn = ACTIONS.every((a) => perms[a]);
            const anyOn = ACTIONS.some((a) => perms[a]);

            return (
              <div
                key={mod.id}
                className={`acred-table-row ${allOn ? "all-on" : anyOn ? "any-on" : ""} ${i === MODULES.length - 1 ? "last" : ""}`}
              >
                <div className="acred-col-module acred-mod-label">{mod.label}</div>

                {ACTIONS.map((action) => {
                  const isReadLocked = action === "read" && (perms.create || perms.edit || perms.delete);
                  return (
                    <div key={action} className="acred-col-action">
                      {editMode ? (
                        <label className={`acred-check-label ${isReadLocked ? "locked" : ""}`}>
                          <input
                            type="checkbox"
                            checked={perms[action]}
                            onChange={() => !isReadLocked && toggleAction(mod.id, action)}
                            className="acred-check-input"
                          />
                          <span className={`acred-check-box acred-check-${action} ${perms[action] ? "checked" : ""}`}>
                            {perms[action] && (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                        </label>
                      ) : (
                        <span className={`acred-check-box acred-check-${action} ${perms[action] ? "checked" : "empty"}`}>
                          {perms[action] ? (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="acred-col-all">
                  {editMode ? (
                    <label className="acred-check-label">
                      <input
                        type="checkbox"
                        checked={allOn}
                        onChange={() => toggleModule(mod.id)}
                        className="acred-check-input"
                      />
                      <span className={`acred-check-box acred-check-all ${allOn ? "checked" : ""}`}>
                        {allOn && (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                    </label>
                  ) : (
                    <span className={`acred-check-box acred-check-all ${allOn ? "checked" : "empty"}`}>
                      {allOn ? (
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="acred-legend">
          {ACTIONS.map((action) => (
            <div key={action} className="acred-legend-item">
              <span className={`acred-legend-dot acred-check-${action} checked`} />
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </div>
          ))}
          <div className="acred-legend-item">
            <span className="acred-legend-dot acred-check-all checked" />
            All granted
          </div>
        </div>

      </div>
    </InnerTabCon>
  );
};

export default AdminCredentials;
