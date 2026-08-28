import { useNavigate, useParams } from "react-router-dom";
import { FaCalendarTimes, FaCrown, FaLock } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useSubscriptionAccess } from "../../hooks/useSubscriptionAccess";
import "./SubscriptionExpiredBanner.css";

/**
 * Sticky top banner for Admin / Staff dashboards when subscription
 * is missing or expired. Students do not render this.
 */
const SubscriptionExpiredBanner = ({ settingsPath }) => {
  const { user } = useAuth();
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const access = useSubscriptionAccess();

  if (access.canMutate) return null;

  const isSuperAdmin = user?.admin?.admin_role === "Super Admin";
  const renewPath =
    settingsPath ||
    (schoolId ? `/admin/${schoolId}/settings/subscriptions?tab=upgrade` : "/");

  return (
    <div className="seb-banner" role="status">
      <div className="seb-left">
        <span className="seb-icon">
          {access.isExpired ? <FaCalendarTimes /> : <FaLock />}
        </span>
        <div className="seb-text">
          <strong>
            {access.isCancelled
              ? "Subscription cancelled"
              : access.isExpired
                ? "Subscription expired"
                : "No active subscription"}
          </strong>
          <span>{access.message}</span>
        </div>
      </div>
      <div className="seb-actions">
        {isSuperAdmin ? (
          <button
            type="button"
            className="seb-btn"
            onClick={() => navigate(renewPath)}
          >
            <FaCrown /> Renew
          </button>
        ) : (
          <span className="seb-hint">Ask your Super Admin to renew</span>
        )}
      </div>
    </div>
  );
};

export default SubscriptionExpiredBanner;
