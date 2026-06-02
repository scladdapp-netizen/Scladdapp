import React from "react";
import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import FormInput from "../../components/FormInput";
import LoginLeftPanel from "../LogIn/LoginLeftPanel";
import useForgotPassword from "./useForgotPassword";
import { useTheme } from "../../context/ThemeContext/ThemeContext";

const ForgotPassword = () => {
  const { email, setEmail, loading, sent, handleNext } = useForgotPassword();
  const navigate = useNavigate();
  const { theme, setTheme, resolved } = useTheme();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  const ThemeIcon = () => {
    if (resolved === "dark") return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="#ffffff" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
    return (
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="3.5" fill="#111111" opacity="0.25" stroke="#111111" strokeWidth="1.5" />
        <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
          stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <div className="fp-page">
      {/* Theme toggle */}
      <button className="fp-theme-toggle" onClick={cycleTheme} title={`Theme: ${theme}`}>
        <ThemeIcon />
      </button>

      {/* Left panel */}
      <div className="fp-left">
        <LoginLeftPanel />
      </div>

      {/* Right — form */}
      <div className="fp-right">
        <div className="fp-card">
          {/* Mobile brand */}
          <div className="fp-card-brand">
            <div className="fp-card-brand-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white" />
                <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>
            <span className="fp-card-brand-name">Scladapp</span>
          </div>

          {/* Header */}
          <div className="fp-header">
            <h2>{sent ? "Check your inbox" : "Reset your password"}</h2>
            <p>
              {sent
                ? "A reset link has been sent to your email."
                : "Enter your email to receive a password reset link."}
            </p>
          </div>

          {!sent ? (
            <>
              <div className="fp-fields">
                <FormInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="Enter your registered email"
                  width="100%"
                  isActive={true}
                  required
                  maxLength={100}
                />
              </div>
              <div className="fp-actions">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  loadingText="Sending..."
                  disabled={!email}
                  onClick={handleNext}
                >
                  Send Reset Link
                </Button>
              </div>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p>Check your inbox and click the link to set a new password.</p>
              <p className="fp-success-note">The link expires in 1 hour.</p>
            </div>
          )}

          {/* Footer */}
          <div className="fp-footer">
            <button className="fp-footer-link" onClick={() => navigate("/login")}>
              Back to login
            </button>
            <span className="fp-footer-sep">•</span>
            <button className="fp-footer-link" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
