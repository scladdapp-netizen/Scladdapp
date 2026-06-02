import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { FaCrown, FaLock, FaCalendarTimes } from "react-icons/fa";
import Button from "../Button/Button";
import "./SubscriptionGuard.css";

const SubscriptionGuard = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { schoolId } = useParams();

  const subscription = user?.subscription;
  const school = user?.school || {};
  const isSuperAdmin = user?.admin?.admin_role === "Super Admin";
  const now = new Date();
  const isExpired = subscription && new Date(subscription.end_date) <= now;
  const isActive =
    subscription &&
    (subscription.subscription_status === "active" ||
      subscription.subscription_status === "trialing") &&
    !isExpired;

  if (!isActive) {
    const expiredOn = subscription?.end_date
      ? new Date(subscription.end_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

    const renewalItems = [
      "Instant access restored",
      "All data preserved",
      "Continue from where you left off",
    ];

    return (
      <div className="sg-wrap">
        <div className="sg-card">

          {/* Icon */}
          <div className="sg-icon-wrap">
            {isExpired ? <FaCalendarTimes /> : <FaLock />}
          </div>

          {/* Title */}
          <h2 className="sg-title">
            {isExpired ? "Subscription Expired" : "No Active Subscription"}
          </h2>

          {/* School name */}
          {school.school_name && (
            <p className="sg-school-name">{school.school_name}</p>
          )}

          {/* Expiry badge */}
          {expiredOn && (
            <div className="sg-expiry-badge">
              <FaCalendarTimes style={{ fontSize: 11 }} />
              Expired on {expiredOn}
            </div>
          )}

          {/* Description */}
          <p className="sg-desc">
            {isExpired
              ? "Your school's subscription has expired. Renew your plan to restore full access for your staff, teachers, and students."
              : "Your school does not have an active subscription. A subscription is required to access the school management system."}
          </p>

          {/* After renewal */}
          <div className="sg-renewal-box">
            <p className="sg-renewal-title">After Renewal</p>
            {renewalItems.map((item) => (
              <div key={item} className="sg-renewal-item">
                <span className="sg-renewal-dot" />
                {item}
              </div>
            ))}
          </div>

          {/* CTA */}
          {isSuperAdmin ? (
            <>
              <Button
                onClick={() =>
                  navigate(
                    `/admin/${schoolId}/settings/subscriptions?tab=upgrade`
                  )
                }
              >
                <FaCrown style={{ marginRight: 6 }} />
                {isExpired ? "Renew Subscription" : "View Plans"}
              </Button>
              <p className="sg-settings-link">
                You can still access{" "}
                <span onClick={() => navigate(`/admin/${schoolId}/settings`)}>
                  Settings
                </span>{" "}
                to manage your subscription.
              </p>
            </>
          ) : (
            <div className="sg-contact-box">
              <p className="sg-contact-title">Contact Your Administrator</p>
              <p className="sg-contact-desc">
                You don&apos;t have permission to manage subscriptions. Please
                ask the Super Admin of{" "}
                <strong>{school.school_name || "your school"}</strong> to renew
                the subscription to restore your access.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default SubscriptionGuard;
