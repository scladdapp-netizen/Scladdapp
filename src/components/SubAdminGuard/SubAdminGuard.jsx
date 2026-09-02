import { useAuth } from "../../context/AuthContext/AuthContext";
import { FaLock } from "react-icons/fa";
import "./SubAdminGuard.css";

/**
 * SubAdminGuard — blocks sub-admins from accessing a page if they don't
 * have the required permission key.
 *
 * Usage:
 *   <SubAdminGuard permission="dashboard">
 *     <Dashboard />
 *   </SubAdminGuard>
 *
 * Permission keys match the keys in admin.permissions object:
 *   academic_sessions, school_event, school_calendar,
 *   student_report, students, applications, classes, teachers, staff, subject,
 *   communication, bill_income_expense, school_account,
 *   report_template, fee_billing_template, timetable_template,
 *   announcement_template, class_promotion_template, graduate
 *
 * Super Admins (permissions === ["ALL"]) always pass through.
 */
const SubAdminGuard = ({ children, permission, blockAll = false }) => {
  const { user } = useAuth();
  const admin = user?.admin;

  // No admin object at all — not an admin, block access
  if (!admin) {
    return <Blocked adminRole="Staff" permission={permission} />;
  }

  const isSuperAdmin =
    admin.admin_role === "Super Admin" ||
    (Array.isArray(admin.permissions) && admin.permissions.includes("ALL"));

  // Super admin — always allow, even when blockAll is set
  if (isSuperAdmin) return children;

  // blockAll — blocks sub-admins entirely, regardless of permissions
  if (blockAll) {
    return (
      <Blocked
        adminRole={admin?.admin_role || "Admin"}
        permission={permission}
        blocked
      />
    );
  }

  const perms = admin.permissions;

  // If no permission key specified, block all sub-admins
  if (!permission) {
    return <Blocked adminRole={admin.admin_role} perms={perms} />;
  }

  const permEntry = perms?.[permission];
  const hasAccess = permEntry && permEntry.read === true;

  if (!hasAccess) {
    return (
      <Blocked
        adminRole={admin.admin_role}
        permission={permission}
        perms={perms}
      />
    );
  }

  return children;
};

const formatLabel = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ── Blocked screen ─────────────────────────────────────────────────────── */
const Blocked = ({ adminRole, permission, perms, blocked }) => {
  // Only the keys where read === true
  const readablePerms =
    !blocked && perms && typeof perms === "object" && !Array.isArray(perms)
      ? Object.entries(perms)
          .filter(([, val]) => val?.read === true)
          .map(([key]) => key)
      : [];

  return (
    <div className="sag-blocked">
      {/* Lock icon */}
      <div className="sag-icon-wrap">
        <FaLock />
      </div>

      {/* Title */}
      <h2 className="sag-title">Access Restricted</h2>

      {/* Role badge */}
      <span className="sag-role">{adminRole || "Admin"}</span>

      {/* Description */}
      <p className="sag-desc">
        {blocked
          ? "This section is not accessible from the admin panel. Please use the designated management area."
          : `You don't have permission to access${
              permission ? ` the "${formatLabel(permission)}" section` : " this page"
            }. Contact your Super Admin to request access.`}
      </p>

      {/* Only show the box if there are any readable permissions */}
      {readablePerms.length > 0 && (
        <div className="sag-perms-box">
          <p className="sag-perms-title">You have access to</p>
          <div className="sag-perms-grid">
            {readablePerms.map((key) => (
              <div key={key} className="sag-perm-item">
                <span className="sag-perm-dot" />
                {formatLabel(key)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdminGuard;
