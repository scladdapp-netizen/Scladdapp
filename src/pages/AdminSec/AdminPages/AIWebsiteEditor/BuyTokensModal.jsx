import { useState, useCallback } from "react";
import { usePaystackPayment }   from "react-paystack";
import "./BuyTokensModal.css";

const API_BASE     = import.meta.env.VITE_API_BASE_URL    || "http://localhost:1234";
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

const PACKAGES = [
  { id: "starter",   name: "Starter",    emoji: "⚡", tokens: 10,  price: 500,  perToken: 50 },
  { id: "standard",  name: "Standard",   emoji: "🚀", tokens: 30,  price: 1200, perToken: 40, popular: true },
  { id: "pro",       name: "Pro",        emoji: "💎", tokens: 80,  price: 2800, perToken: 35 },
  { id: "unlimited", name: "Power Pack", emoji: "🔥", tokens: 200, price: 6000, perToken: 30 },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCoin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v1m0 8v1M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconCheck = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Paystack-powered pay button ───────────────────────────────────────────────
function PayButton({ pkg, schoolId, email, onSuccess, onFail, disabled }) {
  const config = {
    reference:  `ait_${schoolId}_${pkg.id}_${Date.now()}`,
    email:      email || "user@school.com",
    amount:     pkg.price * 100,   // Paystack expects kobo
    publicKey:  PAYSTACK_KEY,
    metadata: {
      custom_fields: [
        { display_name: "School ID",  variable_name: "school_id",  value: schoolId },
        { display_name: "Package",    variable_name: "package_id", value: pkg.id   },
        { display_name: "Tokens",     variable_name: "tokens",     value: pkg.tokens },
      ],
    },
  };

  const initPaystack = usePaystackPayment(config);

  const handleClick = () => {
    if (disabled) return;
    initPaystack({
      onSuccess: (res) => onSuccess(res, config.reference),
      onClose:   ()    => {},
    });
  };

  return (
    <button className="btm-pay-btn" onClick={handleClick} disabled={disabled}>
      {disabled
        ? <span className="btm-spinner" />
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
          </svg>
      }
      {disabled ? "Verifying…" : `Pay ₦${pkg.price.toLocaleString()} with Paystack`}
    </button>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function BuyTokensModal({
  isOpen,
  onClose,
  tokenCount,
  schoolId,
  email,
  onTokensPurchased,
}) {
  const [selected,  setSelected]  = useState("standard");
  const [verifying, setVerifying] = useState(false);
  const [success,   setSuccess]   = useState(null);
  const [error,     setError]     = useState(null);

  // ── ALL hooks must be before any early return ─────────────────────────────
  const handlePaystackSuccess = useCallback(async (_response, reference) => {
    setVerifying(true);
    setError(null);
    try {
      let authToken = "";
      try {
        const raw = sessionStorage.getItem("user");
        if (raw) authToken = JSON.parse(raw)?.token || "";
      } catch (_) {}

      const res  = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-tokens/verify`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify({ reference, packageId: selected }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message || "Verification failed");

      setSuccess({ tokensAdded: data.tokensAdded, newBalance: data.newBalance });
      onTokensPurchased?.(data.newBalance);
    } catch (err) {
      setError(err.message || "Something went wrong. Contact support if your payment was debited.");
    } finally {
      setVerifying(false);
    }
  }, [selected, schoolId, onTokensPurchased]);

  const handleClose = useCallback(() => {
    setSuccess(null);
    setError(null);
    onClose();
  }, [onClose]);

  // ── early return after all hooks ──────────────────────────────────────────
  if (!isOpen) return null;

  const pkg = PACKAGES.find((p) => p.id === selected);

  return (
    <div className="btm-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="btm-modal" role="dialog" aria-modal="true" aria-labelledby="btm-title">

        {/* header */}
        <div className="btm-header">
          <div className="btm-header-left">
            <div className="btm-header-icon"><IconCoin /></div>
            <div>
              <h2 className="btm-title" id="btm-title">Buy AI Tokens</h2>
              <p className="btm-subtitle">Each token = one AI edit to your site</p>
            </div>
          </div>
          <button className="btm-close" onClick={handleClose} aria-label="Close">×</button>
        </div>

        {/* current balance */}
        <div className="btm-balance">
          <span className="btm-balance-label">Current balance</span>
          <span className="btm-balance-count">{tokenCount}</span>
          <span className="btm-balance-unit">tokens remaining</span>
        </div>

        {/* ── success state ──────────────────────────────────────────────────── */}
        {success ? (
          <div className="btm-success">
            <div className="btm-success-icon"><IconCheck /></div>
            <p className="btm-success-title">Payment successful!</p>
            <p className="btm-success-body">
              <strong>{success.tokensAdded} tokens</strong> have been added to your account.
              Your new balance is <strong>{success.newBalance} tokens</strong>.
            </p>
            <button className="btm-done-btn" onClick={handleClose}>
              Done — Start Editing
            </button>
          </div>
        ) : (
          <>
            {/* packages */}
            <div className="btm-packages">
              <p className="btm-packages-label">Choose a package</p>
              {PACKAGES.map((p) => (
                <button
                  key={p.id}
                  className={[
                    "btm-package",
                    selected === p.id ? "btm-package--selected" : "",
                    p.popular          ? "btm-package--popular"  : "",
                  ].join(" ")}
                  onClick={() => { setSelected(p.id); setError(null); }}
                  aria-pressed={selected === p.id}
                  disabled={verifying}
                >
                  {p.popular && <span className="btm-popular-badge">Most Popular</span>}
                  <span className="btm-pkg-icon">{p.emoji}</span>
                  <div className="btm-pkg-info">
                    <p className="btm-pkg-name">{p.name}</p>
                    <p className="btm-pkg-tokens">
                      <strong>{p.tokens} tokens</strong> · ₦{p.perToken}/token
                    </p>
                  </div>
                  <div>
                    <span className="btm-pkg-price">₦{p.price.toLocaleString()}</span>
                    <span className="btm-pkg-per">one-time</span>
                  </div>
                  <div className="btm-radio">
                    <div className="btm-radio-inner" />
                  </div>
                </button>
              ))}
            </div>

            {/* footer */}
            <div className="btm-footer">
              {error && <p className="btm-error">{error}</p>}

              {pkg && (
                <PayButton
                  pkg={pkg}
                  schoolId={schoolId}
                  email={email}
                  onSuccess={handlePaystackSuccess}
                  disabled={verifying}
                />
              )}

              <p className="btm-pay-note">
                Secured by{" "}
                <a href="https://paystack.com" target="_blank" rel="noreferrer">Paystack</a>.
                Tokens credited instantly after payment.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
