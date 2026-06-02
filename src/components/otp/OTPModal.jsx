import { useRef, useState } from "react";
import { useOTP } from "./OTPContext";
import OTPInput from "../OTPInput";
import Button from "../Button/Button";
import "./OTPModal.css";

export const OTPModal = () => {
  const { isOpen, verifyOTP, closeOTPModal } = useOTP();
  const initialOTP = Array(6).fill("");
  const [enteredOTP, setEnteredOTP] = useState(initialOTP);
  const [error, setError] = useState("");
  const prevOTP = useRef(initialOTP);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const otpString = enteredOTP.join("");
    if (!verifyOTP(otpString)) {
      setError("Incorrect code. Please try again.");
      setTimeout(() => {
        setEnteredOTP(prevOTP.current);
        setError("");
      }, 2000);
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

        {/* Actions */}
        <div className="otp-actions">
          <Button variant="secondary" onClick={closeOTPModal}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}
            disabled={enteredOTP.some(d => !d)}>
            Verify
          </Button>
        </div>

        {/* Footer note */}
        <p className="otp-note">Didn't receive a code? Check your spam folder.</p>
      </div>
    </div>
  );
};
