import { useRef, useState } from "react";
import { useOTP } from "./OTPContext";
import OTPInput from "../OTPInput";
import Button from "../Button/Button";
import "./OTPModal.css";

export const OTPModal = () => {
  const { isOpen, verifyOTP, closeOTPModal, onResend } = useOTP();
  const initialOTP = Array(6).fill("");
  const [enteredOTP, setEnteredOTP] = useState(initialOTP);
  const [error, setError]           = useState("");
  const [verifying, setVerifying]   = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendMsg, setResendMsg]   = useState("");
  const prevOTP = useRef(initialOTP);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const otpString = enteredOTP.join("");
    setVerifying(true);
    setError("");
    setResendMsg("");

    const result = await verifyOTP(otpString);

    setVerifying(false);

    if (!result.success) {
      setError(result.message || "Incorrect code. Please try again.");
      setTimeout(() => {
        setEnteredOTP(initialOTP);
        prevOTP.current = initialOTP;
        setError("");
      }, 2000);
    }
  };

  const handleResend = async () => {
    if (resending || !onResend) return;
    setResending(true);
    setResendMsg("");
    setError("");
    try {
      await onResend();
      setEnteredOTP(initialOTP);
      prevOTP.current = initialOTP;
      setResendMsg("A new code has been sent.");
      setTimeout(() => setResendMsg(""), 4000);
    } catch {
      setResendMsg("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="otp-overlay">
      <div className="otp-modal">

        {/* Icon */}
        <div className="otp-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
              stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Header */}
        <div className="otp-header">
          <h3>Verify your email</h3>
          <p>We sent a 6-digit code to your email address. Enter it below — it expires in 10 minutes.</p>
        </div>

        {/* OTP inputs */}
        <OTPInput
          value={enteredOTP}
          onChange={(val) => {
            prevOTP.current = val;
            setEnteredOTP(val);
          }}
          hasError={!!error}
        />

        {/* Error */}
        {error && (
          <div className="otp-error">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Resend confirmation */}
        {resendMsg && (
          <p className="otp-resend-msg">{resendMsg}</p>
        )}

        {/* Actions */}
        <div className="otp-actions">
          <Button variant="secondary" onClick={closeOTPModal} disabled={verifying || resending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={enteredOTP.some((d) => !d) || verifying || resending}
          >
            {verifying ? "Verifying…" : "Verify"}
          </Button>
        </div>

        {/* Resend link — only shown when a resend callback was provided */}
        {onResend && (
          <button
            type="button"
            className="otp-resend-btn"
            onClick={handleResend}
            disabled={resending || verifying}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        )}

        {!onResend && (
          <p className="otp-note">Didn't receive a code? Check your spam folder.</p>
        )}
      </div>
    </div>
  );
};
