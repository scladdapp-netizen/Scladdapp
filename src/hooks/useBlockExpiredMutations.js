import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useNotification } from "../context/NotificationProvider/NotificationProvider";
import { useSubscriptionAccess } from "../hooks/useSubscriptionAccess";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const isAllowlistedUrl = (url) => {
  const path = String(url || "");
  return (
    path.includes("/api/subscription") ||
    path.includes("/api/support-tickets") ||
    path.includes("/api/app-feedback") ||
    path.includes("/login") ||
    path.includes("/set-password") ||
    path.includes("/forgot-password") ||
    path.includes("/api/otp")
  );
};

/**
 * Admin/Staff dashboards only:
 * - Always attach X-School-Id for backend subscription checks
 * - When subscription expired/missing, block mutating fetch calls (except renew APIs)
 */
export function useBlockExpiredMutations() {
  const access = useSubscriptionAccess();
  const { addNotification } = useNotification();
  const { schoolId } = useParams();

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
      const method = String(init?.method || "GET").toUpperCase();
      const url = typeof input === "string" ? input : input?.url || "";

      if (!access.canMutate && MUTATING.has(method) && !isAllowlistedUrl(url)) {
        addNotification(access.message, "error");
        return new Response(
          JSON.stringify({
            success: false,
            code:
              access.blockReason === "expired"
                ? "subscription_expired"
                : "subscription_missing",
            message: access.message,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (schoolId && !headers.has("X-School-Id")) {
        headers.set("X-School-Id", String(schoolId));
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [access.canMutate, access.message, access.blockReason, addNotification, schoolId]);
}
