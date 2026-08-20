import React from "react";
import "./LogIn.css";
import { useNavigate, useParams } from "react-router-dom";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button/Button";
import RoleSelectionModal from "../../components/RoleSelectionModal/RoleSelectionModal";
import { uselogin } from "./uselogin";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import LoginLeftPanel from "./LoginLeftPanel";

const LogIn = ({ schoolId: propSchoolId = null }) => {
  const navigate = useNavigate();
  const { schoolId: paramSchoolId } = useParams();
  const schoolId = propSchoolId || paramSchoolId || null;
  const { theme, setTheme, resolved } = useTheme();

  const {
    email, setEmail,
    password, setPassword,
    loading,
    activeTab,
    handleTabChange,
    handleLogin,
    showRoleSelection,
    setShowRoleSelection,
    pendingUserData,
    handleRoleSelect,
  } = uselogin();

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
    <div className="login-page">
      {/* Theme toggle */}
      <button className="login-theme-toggle" onClick={cycleTheme} title={`Theme: ${theme}`}>
        <ThemeIcon />
      </button>

      {/* Left panel */}
      <div className="login-left">
        <LoginLeftPanel schoolId={schoolId} />
      </div>

      {/* Right — form */}
      <div className="login-right">
        <div className="login-card">
          {/* Mobile brand */}
          <div className="login-card-brand">
            <div className="login-card-brand-icon">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="white" />
                <path d="M1 8l7 3.5L15 8" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
                <path d="M1 11.5l7 3.5 7-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
              </svg>
            </div>
            <span className="login-card-brand-name">Scladapp</span>
          </div>

          {/* Header */}
          <div className="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {/* Fields */}
          <div className="login-fields">
            <FormInput
              label="Email Address"
              type="text"
              value={email}
              onChange={setEmail}
              placeholder={`Enter your ${activeTab} email`}
              width="100%"
              isActive={true}
              maxLength={100}
            />
            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Enter your password"
              width="100%"
              isActive={true}
              maxLength={20}
            />
          </div>

          {/* Actions */}
          <div className="login-actions">
            <button className="login-forgot" onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              loadingText="Signing in..."
              disabled={!email || !password}
              onClick={() => handleLogin()}
            >
              Sign in as {activeTab === "admin" ? "Admin" : "Teacher"}
            </Button>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <button className="login-footer-link" onClick={() => navigate("/forgot-password")}>
              Need help?
            </button>
            <span className="login-footer-sep">•</span>
            <button className="login-footer-link" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleSelection && pendingUserData && (
        <RoleSelectionModal
          isOpen={showRoleSelection}
          onSelectRole={handleRoleSelect}
          staffData={pendingUserData.staff}
          adminData={pendingUserData.admin}
        />
      )}
    </div>
  );
};

export default LogIn;
