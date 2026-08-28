import { useState, useEffect } from "react";
import Button from "../../../components/Button/Button";
import { useNavigate } from "react-router-dom";
import { PaystackButton } from "react-paystack";
import useSubscription from "../../../api_call/useSubscription";

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
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [durationError, setDurationError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const { agreeTerms, setAgreeTerms } = subscriptionData;
  const { getPlans } = useSubscription();
  const navigate = useNavigate();
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  useEffect(() => {
    getPlans().then((res) => { if (res.success) setAvailablePlans(res.data); });
  }, []);

  if (!selectedPlan && availablePlans.length > 0) setSelectedPlan(availablePlans[0]);

  /* ── helpers ── */
  const getCycleLabel = () => billingCycle === "monthly" ? "month" : billingCycle === "quarterly" ? "quarter" : "year";
  const getMonthsInCycle = () => billingCycle === "monthly" ? 1 : billingCycle === "quarterly" ? 3 : 12;
  const getDiscountPct = () => billingCycle === "quarterly" ? "10%" : billingCycle === "yearly" ? "20%" : null;

  const getMonthlyPrice = (plan = selectedPlan) => {
    if (!plan || plan.plan_type === "Free") return 0;
    if (billingCycle === "monthly") return parseFloat(plan.monthly_price) || 0;
    if (billingCycle === "quarterly") return parseFloat(plan.quataly_price) || 0;
    return parseFloat(plan.yearly_price) || 0;
  };
  const getStandardMonthlyPrice = (plan = selectedPlan) =>
    (!plan || plan.plan_type === "Free") ? 0 : parseFloat(plan.monthly_price) || 0;
  const getCyclePeriodPrice = (plan = selectedPlan) => getMonthlyPrice(plan) * getMonthsInCycle();
  const getTotalMonths = () => duration * getMonthsInCycle();
  const getTotalPrice = (plan = selectedPlan) =>
    (!plan || plan.plan_type === "Free") ? 0 : getMonthlyPrice(plan) * getTotalMonths();

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

  const paystackProps = {
    email: adminData.adminEmail,
    amount: Math.floor(Number(getTotalPrice()) * 100) || 100,
    metadata: {
      custom_fields: [
        { display_name: "School Name", variable_name: "school_name", value: schoolData.school_name },
        { display_name: "Plan Name", variable_name: "plan_name", value: selectedPlan?.plan_name },
        { display_name: "Billing Cycle", variable_name: "billing_cycle", value: billingCycle },
        { display_name: "Admin email", variable_name: "adminEmail", value: adminData.adminEmail },
        { display_name: "Duration", variable_name: "duration", value: `${duration} ${getCycleLabel()}(s)` },
      ],
    },
    publicKey,
    text: paymentProcessing ? "Verifying..." : "Pay with Paystack",
    onSuccess: async (response) => {
      setLoading(true);
      await handleSubmit();
      setLoading(false);
    },
    onClose: () => {
      setPaymentProcessing(false);
      alert("Payment cancelled. You can try again.");
    },
  };

  return (
    <div className="stepform s4-root">
      {/* Loading overlay */}
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

      {/* Page title */}
      <div className="s4-page-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.7"/>
          <path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
        </svg>
        <h3>Review &amp; Subscribe</h3>
      </div>

      {/* ── School header card ── */}
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

      {/* ── Two-column info grid ── */}
      <div className="s4-info-grid">
        {/* Admin */}
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

        {/* School info */}
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

      {/* ── Plan selection ── */}
      <div className="s4-section-label">Select Plan</div>
      <div className="s4-plans-grid">
        {availablePlans.map((plan) => (
          <div
            key={plan.$id}
            onClick={() => {
              const p = availablePlans.find(x => x.$id === plan.$id);
              if (p) { setSelectedPlan(p); if (p.plan_type === "Free") { setDuration(1); setBillingCycle("monthly"); } }
            }}
            className={`s4-plan-card${selectedPlan?.$id === plan.$id ? " s4-plan-selected" : ""}`}
          >
            <div className="s4-plan-name">{plan.plan_name}</div>
            <div className="s4-plan-desc">{plan.description}</div>
            {plan.plan_type === "Free" ? (
              <div className="s4-plan-price">Free</div>
            ) : (
              <div className="s4-plan-pricing">
                <div className="s4-plan-price">${getMonthlyPrice(plan).toLocaleString()}<span>/mo</span></div>
                {billingCycle !== "monthly" && (
                  <div className="s4-plan-original">${getStandardMonthlyPrice(plan).toLocaleString()}/mo</div>
                )}
                {getDiscountPct() && <div className="s4-plan-save">Save {getDiscountPct()}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Billing options ── */}
      {selectedPlan && selectedPlan.plan_type !== "Free" && (
        <div className="s4-card s4-billing-card">
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
          </div>

          {/* Features */}
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
              {selectedPlan.features_enabled?.split(",").map((f, i) => (
                <div key={i} className="s4-feature-item">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {f.trim()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Payment summary ── */}
      {selectedPlan && (
        <div className="s4-summary">
          <div className="s4-summary-title">Payment Summary</div>
          <div className="s4-summary-rows">
            <div className="s4-summary-row"><span>Plan</span><strong>{selectedPlan.plan_name}</strong></div>
            {selectedPlan.plan_type !== "Free" && (
              <>
                <div className="s4-summary-row"><span>Billing</span><strong>{billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}</strong></div>
                <div className="s4-summary-row"><span>Duration</span><strong>{duration} {getCycleLabel()}(s) · {getTotalMonths()} months</strong></div>
                <div className="s4-summary-row"><span>Rate</span><strong>₦{getMonthlyPrice().toLocaleString()}/month</strong></div>
              </>
            )}
          </div>
          <div className="s4-summary-divider" />
          <div className="s4-summary-total">
            <span>Total</span>
            <strong>₦{getTotalPrice().toLocaleString()}</strong>
          </div>
          {getDiscountPct() && selectedPlan.plan_type !== "Free" && (
            <div className="s4-summary-saving">You're saving {getDiscountPct()} vs monthly billing</div>
          )}
        </div>
      )}

      {/* ── Terms + CTA ── */}
      <div className="s4-footer">
        <label className="s4-terms">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
          />
          <span>I agree to the <a href="#">Terms and Conditions</a></span>
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
          {selectedPlan?.plan_type === "Free" ? (
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
