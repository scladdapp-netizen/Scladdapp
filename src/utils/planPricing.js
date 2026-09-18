/** Shared plan id + pricing helpers (setup, pricing, landing). */

export function getPlanId(plan) {
  if (!plan) return "";
  const id = plan.plan_id ?? plan.$id;
  return id == null ? "" : String(id);
}

export function isFreePlan(plan) {
  return String(plan?.plan_type || "").toLowerCase() === "free";
}

/** Per-month rate stored on the plan for the selected billing cycle. */
export function getMonthlyRate(plan, billingCycle = "monthly") {
  if (!plan || isFreePlan(plan)) return 0;
  if (billingCycle === "quarterly") return Number(plan.quataly_price) || 0;
  if (billingCycle === "yearly") return Number(plan.yearly_price) || 0;
  return Number(plan.monthly_price) || 0;
}

export function getMonthsInCycle(billingCycle = "monthly") {
  if (billingCycle === "quarterly") return 3;
  if (billingCycle === "yearly") return 12;
  return 1;
}

/** Price for one billing period (month / quarter / year). */
export function getCycleTotal(plan, billingCycle = "monthly") {
  return getMonthlyRate(plan, billingCycle) * getMonthsInCycle(billingCycle);
}

/** Full amount charged for duration × cycle. */
export function getSubscriptionTotal(plan, billingCycle = "monthly", duration = 1) {
  if (!plan || isFreePlan(plan)) return 0;
  return getCycleTotal(plan, billingCycle) * (Number(duration) || 1);
}

export function formatNaira(amount) {
  return `₦${(Number(amount) || 0).toLocaleString()}`;
}

/** Prefer live API plan; keep selection when ids match. */
export function resolveSelectedPlan(availablePlans, currentSelected) {
  if (!Array.isArray(availablePlans) || availablePlans.length === 0) {
    return currentSelected || null;
  }
  const currentId = getPlanId(currentSelected);
  if (currentId) {
    const match = availablePlans.find((p) => getPlanId(p) === currentId);
    if (match) return match;
  }
  return availablePlans[0];
}
