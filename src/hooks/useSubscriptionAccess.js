import { useAuth } from "../context/AuthContext/AuthContext";

/**
 * Shared subscription access for Admin + Staff dashboards.
 * Students do not use this.
 */
export function getSubscriptionAccessFromUser(user) {
  const subscription = user?.subscription || null;
  if (!subscription) {
    return {
      canMutate: false,
      isActive: false,
      isExpired: false,
      isCancelled: false,
      hasSubscription: false,
      blockReason: "missing",
      subscription: null,
      message:
        "Renew your plan to continue with daily school activity.",
    };
  }

  const now = new Date();
  const end = subscription.end_date ? new Date(subscription.end_date) : null;
  const status = String(subscription.subscription_status || "").toLowerCase();
  const isCancelled = status === "cancelled" || status === "canceled";
  const isExpiredByDate = !!(end && end <= now);
  const isExpired = isExpiredByDate || status === "expired";
  const statusOk = status === "active" || status === "trialing";
  const isActive = !!(statusOk && end && end > now);

  if (isActive) {
    return {
      canMutate: true,
      isActive: true,
      isExpired: false,
      isCancelled: false,
      hasSubscription: true,
      blockReason: null,
      subscription,
      message: "",
    };
  }

  let message = "Renew your plan to continue with daily school activity.";
  let blockReason = "inactive";

  if (isCancelled) {
    blockReason = "cancelled";
    message = "Your subscription was cancelled. Renew to continue with daily school activity.";
  } else if (isExpired) {
    blockReason = "expired";
    message = "Your subscription has expired. Renew to continue with daily school activity.";
  }

  return {
    canMutate: false,
    isActive: false,
    isExpired,
    isCancelled,
    hasSubscription: true,
    blockReason,
    subscription,
    message,
  };
}

export function useSubscriptionAccess() {
  const { user } = useAuth();
  return getSubscriptionAccessFromUser(user);
}
