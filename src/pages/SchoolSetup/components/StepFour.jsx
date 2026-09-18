import { useState, useEffect, useMemo } from "react";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import useSubscription from "../../../api_call/useSubscription";
import {
  getPlanId,
  isFreePlan,
  getMonthlyRate,
  getMonthsInCycle,
  getSubscriptionTotal,
  formatNaira,
  resolveSelectedPlan,
} from "../../../utils/planPricing";

export default function StepFour({
  selectedPlan,
  setSelectedPlan,
  billingCycle,
  setBillingCycle,
  duration,
  setDuration,
  adminData,
  schoolData,
  subscriptionData,
  handlePaystackClick,
  handleSubmit,
}) {
  const [planState, setPlanState] = useState({
    status: "loading", // loading | ready | empty
    plans: [],
    livePlan: null,
  });
  const [loading, setLoading] = useState(false);
  const [durationError, setDurationError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { agreeTerms, setAgreeTerms } = subscriptionData;
  const { getPlans } = useSubscription();
  const navigate = useNavigate();
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  const preferredId = getPlanId(selectedPlan);
  const { status: plansStatus, plans: availablePlans, livePlan } = planState;
  const plansLoading = plansStatus === "loading";

  useEffect(() => {
    let cancelled = false;
    setPlanState({ status: "loading", plans: [], livePlan: null });

    getPlans().then((res) => {
      if (cancelled) return;
      const plans = res.success ? (res.data || []) : [];
      if (!plans.length) {
        setPlanState({ status: "empty", plans: [], livePlan: null });
        return;
      }
      const next = resolveSelectedPlan(
        plans,
        preferredId ? { plan_id: preferredId } : null
      );
      setPlanState({ status: "ready", plans, livePlan: next });
      setSelectedPlan(next);
    }).catch(() => {
      if (!cancelled) setPlanState({ status: "empty", plans: [], livePlan: null });
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── helpers (always use livePlan / plan from availablePlans) ── */
  const getCycleLabel = () =>
    billingCycle === "monthly" ? "month" : billingCycle === "quarterly" ? "quarter" : "year";
  const monthsInCycle = getMonthsInCycle(billingCycle);
  const getDiscountPct = () =>
    billingCycle === "quarterly" ? "10%" : billingCycle === "yearly" ? "20%" : null;
  const cycleHint =
    billingCycle === "quarterly" ? "billed quarterly" :
    billingCycle === "yearly" ? "billed yearly" : null;

  const monthlyRate = (plan) => getMonthlyRate(plan, billingCycle);
  const standardMonthly = (plan) => getMonthlyRate(plan, "monthly");
  const totalMonths = () => duration * monthsInCycle;
  const totalPrice = (plan = livePlan) =>
    getSubscriptionTotal(plan, billingCycle, duration);

  const handleDurationChange = (e) => {
    const value = e.target.value;
    if (value.includes(".")) { setDurationError("Whole numbers only"); return; }
    setDurationError("");
    const n = Number(value);
    const max = billingCycle === "monthly" ? 12 : billingCycle === "quarterly" ? 4 : 2;
    if (n < 1 || n > max) { setDurationError(`Must be between 1 and ${max}`); return; }
    setDuration(n);
  };

  const handlefreeplan = async () => { setLoading(true); await handleSubmit(); setLoading(false); };

  const selectPlan = (plan) => {
    setPlanState((prev) => ({ ...prev, livePlan: plan }));
    setSelectedPlan(plan);
    if (isFreePlan(plan)) setDuration(1);
  };

  const selectedId = getPlanId(livePlan);
  const planFeatures = useMemo(() => {
    if (!livePlan) return [];
    if (Array.isArray(livePlan.features)) return livePlan.features;
    return String(livePlan.features_enabled || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }, [livePlan]);

  const paystackProps = {
    email: adminData.adminEmail,
    amount: Math.floor(Number(totalPrice(livePlan)) * 100) || 100,
    metadata: {
      custom_fields: [
        { display_name: "School Name", variable_name: "school_name", value: schoolData.school_name },
        { display_name: "Plan Name", variable_name: "plan_name", value: livePlan?.plan_name },
        { display_name: "Billing Cycle", variable_name: "billing_cycle", value: billingCycle },
        { display_name: "Admin email", variable_name: "adminEmail", value: adminData.adminEmail },
        { display_name: "Duration", variable_name: "duration", value: `${duration} ${getCycleLabel()}(s)` },
      ],
    },
    publicKey,
    text: paymentProcessing ? "Verifying..." : "Pay with Paystack",
    onSuccess: async () => {
      setLoading(true);
      await handleSubmit();
      setLoading(false);
    },
    onClose: () => {
      setPaymentProcessing(false);
      alert("Payment cancelled. You can try again.");
    },
  };

  const showPricingUi = !plansLoading && !!livePlan;

  return (
    <div className="stepform s4-root">
      {loading && (
        <div className="s4-overlay">
          <div className="s4-overlay-inner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="s4-spinner">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" />
            </svg>
            <span>Processing...</span>
          </div>
        </div>
      )}

      <div className="s4-page-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
        <h3>Review &amp; Subscribe</h3>
      </div>

      <div className="s4-card">
        <div className="s4-school-header">
          <div className="s4-school-avatar">
            {schoolData.school_logo ? (
              <img
                src={schoolData.school_logo instanceof File ? URL.createObjectURL(schoolData.school_logo) : schoolData.school_logo}
                alt="Logo"
              />
            ) : (
              <span>{schoolData.school_name?.charAt(0) || "S"}</span>
            )}
          </div>
          <div>
            <div className="s4-school-name">{schoolData.school_name || "—"}</div>
            <div className="s4-school-sub">{schoolData.school_slogan || "Confirm your details before payment"}</div>
          </div>
        </div>
      </div>

      <div className="s4-info-grid">
        <div className="s4-card">
          <div className="s4-section-head">
            <span className="s4-section-title">Admin Account</span>
            <button className="s4-edit-btn" onClick={() => navigate("/setup/3")}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          </div>
          <div className="s4-info-rows">
            <div className="s4-info-row"><span>Username</span><strong>{adminData.adminUsername || "—"}</strong></div>
            <div className="s4-info-row"><span>Email</span><strong>{adminData.adminEmail || "—"}</strong></div>
          </div>
        </div>

        <div className="s4-card">
          <div className="s4-section-head">
            <span className="s4-section-title">School Info</span>
            <button className="s4-edit-btn" onClick={() => navigate("/setup/1")}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          </div>
          <div className="s4-info-rows">
            <div className="s4-info-row"><span>Email</span><strong>{schoolData.school_email || "—"}</strong></div>
            <div className="s4-info-row"><span>Phone</span><strong>{schoolData.school_phone || "—"}</strong></div>
            <div className="s4-info-row"><span>Address</span><strong>{schoolData.school_address || "—"}</strong></div>
            <div className="s4-info-row"><span>State</span><strong>{schoolData.school_state || "—"}</strong></div>
            <div className="s4-info-row"><span>Country</span><strong>{schoolData.school_country || "—"}</strong></div>
          </div>
        </div>
      </div>

      <div className="s4-section-label">Select Plan</div>

      {/* Billing cycle first — prices on cards follow this */}
      {!plansLoading && availablePlans.some((p) => !isFreePlan(p)) && (
        <div className="s4-card s4-billing-card s4-billing-card--top">
          <div className="s4-billing-row">
            <div className="s4-billing-field">
              <label className="fi-label">Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => { setBillingCycle(e.target.value); setDuration(1); setDurationError(""); }}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly — Save 10%</option>
                <option value="yearly">Yearly — Save 20%</option>
              </select>
            </div>
            {livePlan && !isFreePlan(livePlan) && (
              <div className="s4-billing-field">
                <label className="fi-label">Number of {getCycleLabel()}(s)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={handleDurationChange}
                  className={durationError ? "s4-input-error" : ""}
                />
                {durationError && <div className="s4-field-error">{durationError}</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {plansLoading ? (
        <div className="s4-card s4-plans-loading" role="status" aria-live="polite">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="s4-spinner" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" />
          </svg>
          <div className="s4-plans-loading__text">
            <strong>Loading subscription plans…</strong>
            <span>Fetching the latest prices</span>
          </div>
        </div>
      ) : availablePlans.length === 0 ? (
        <div className="s4-card" style={{ textAlign: "center", padding: "24px", color: "#888" }}>
          No subscription plans available. Please try again later.
        </div>
      ) : (
        <div className="s4-plans-grid">
          {availablePlans.map((plan) => {
            const id = getPlanId(plan);
            const selected = selectedId && selectedId === id;
            return (
              <div
                key={id || plan.plan_name}
                onClick={() => selectPlan(plan)}
                className={`s4-plan-card${selected ? " s4-plan-selected" : ""}`}
              >
                <div className="s4-plan-name">{plan.plan_name}</div>
                <div className="s4-plan-desc">{plan.description}</div>
                {isFreePlan(plan) ? (
                  <div className="s4-plan-price">Free</div>
                ) : (
                  <div className="s4-plan-pricing">
                    <div className="s4-plan-price">
                      {formatNaira(monthlyRate(plan))}
                      <span>/mo</span>
                    </div>
                    {cycleHint && (
                      <div className="s4-plan-cycle-hint">{cycleHint}</div>
                    )}
                    {billingCycle !== "monthly" && (
                      <div className="s4-plan-original">
                        {formatNaira(standardMonthly(plan))}/mo monthly
                      </div>
                    )}
                    {getDiscountPct() && (
                      <div className="s4-plan-save">Save {getDiscountPct()}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showPricingUi && !isFreePlan(livePlan) && (
        <div className="s4-card s4-billing-card">
          <div className="s4-features">
            <label className="fi-label">Included Features</label>
            <div className="s4-features-list">
              <div className="s4-feature-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Unlimited students
              </div>
              <div className="s4-feature-item">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Unlimited staff
              </div>
              {livePlan.max_subadmin != null && (
                <div className="s4-feature-item">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Up to {livePlan.max_subadmin} sub-admins
                </div>
              )}
              {planFeatures.map((f, i) => (
                <div key={i} className="s4-feature-item">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {plansLoading ? (
        <div className="s4-summary s4-summary--loading" role="status">
          <div className="s4-summary-title">Payment Summary</div>
          <div className="s4-summary-loading">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="s4-spinner" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20" />
            </svg>
            <span>Loading latest prices…</span>
          </div>
        </div>
      ) : showPricingUi ? (
        <div className="s4-summary">
          <div className="s4-summary-title">Payment Summary</div>
          <div className="s4-summary-rows">
            <div className="s4-summary-row"><span>Plan</span><strong>{livePlan.plan_name}</strong></div>
            {!isFreePlan(livePlan) && (
              <>
                <div className="s4-summary-row"><span>Billing</span><strong>{billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}</strong></div>
                <div className="s4-summary-row"><span>Duration</span><strong>{duration} {getCycleLabel()}(s) · {totalMonths()} months</strong></div>
                <div className="s4-summary-row"><span>Rate</span><strong>{formatNaira(monthlyRate(livePlan))}/month</strong></div>
              </>
            )}
          </div>
          <div className="s4-summary-divider" />
          <div className="s4-summary-total">
            <span>Total</span>
            <strong>{formatNaira(totalPrice(livePlan))}</strong>
          </div>
          {getDiscountPct() && !isFreePlan(livePlan) && (
            <div className="s4-summary-saving">You're saving {getDiscountPct()} vs monthly billing</div>
          )}
        </div>
      ) : null}

      <div className="s4-footer">
        <label className="s4-terms">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            disabled={plansLoading || !livePlan}
          />
          <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a></span>
        </label>

        {paymentProcessing && (
          <div className="s4-processing">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="s4-spinner">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="40 20"/>
            </svg>
            Verifying your payment...
          </div>
        )}

        <div className="s4-cta">
          {plansLoading || !livePlan ? (
            <div className="s4-paystack-disabled">Loading prices…</div>
          ) : isFreePlan(livePlan) ? (
            <Button type="submit" variant="primary" disabled={!agreeTerms} onClick={handlefreeplan}>
              Complete Registration
            </Button>
          ) : (
            <div onClick={handlePaystackClick} className="s4-paystack-wrap">
              {!agreeTerms ? (
                <div className="s4-paystack-disabled">Pay with Paystack</div>
              ) : (
                <PaystackButton {...paystackProps} className="s4-paystack-btn" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
