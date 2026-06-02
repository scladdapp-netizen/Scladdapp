import FormInput from "../components/FormInput";
import "./PasswordStrength.css";

const checks = [
  { key: "length",    label: "At least 8 characters" },
  { key: "uppercase", label: "One uppercase letter" },
  { key: "number",    label: "One number" },
  { key: "special",   label: "One special character" },
];

const strengthLabel = (s) => ["", "Weak", "Fair", "Good", "Strong"][s] || "";
const strengthColor = (s) => {
  if (s <= 1) return "#e55";
  if (s === 2) return "#f90";
  if (s === 3) return "#3b82f6";
  return "#22c55e";
};

export default function PasswordStrength({
  password,
  confirmPassword,
  passwordStrength,
  passwordChecks,
  onPasswordChange,
  onConfirmPasswordChange,
}) {
  const match = confirmPassword && password === confirmPassword;

  return (
    <div className="ps-root">
      {/* Password field — eye toggle is built into FormInput */}
      <FormInput
        label="Password"
        type="password"
        value={password}
        onChange={onPasswordChange}
        placeholder="Create a password"
        isActive={true}
      />

      {/* Strength bar */}
      {password?.length > 0 && (
        <div className="ps-strength">
          <div className="ps-bar-track">
            {[1, 2, 3, 4].map((seg) => (
              <div
                key={seg}
                className="ps-bar-seg"
                style={{
                  background: passwordStrength >= seg ? strengthColor(passwordStrength) : "#e0e0e0",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
          <span className="ps-strength-label" style={{ color: strengthColor(passwordStrength) }}>
            {strengthLabel(passwordStrength)}
          </span>
        </div>
      )}

      {/* Checks */}
      {password?.length > 0 && (
        <div className="ps-checks">
          {checks.map(({ key, label }) => (
            <div key={key} className={`ps-check${passwordChecks?.[key] ? " ps-check-pass" : ""}`}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                {passwordChecks?.[key]
                  ? <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  : <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
                }
              </svg>
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Confirm password — also gets eye toggle from FormInput */}
      <FormInput
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Repeat your password"
        isActive={true}
      />

      {/* Match indicator */}
      {confirmPassword?.length > 0 && (
        <div className={`ps-match${match ? " ps-match-ok" : " ps-match-err"}`}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            {match
              ? <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              : <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            }
          </svg>
          {match ? "Passwords match" : "Passwords do not match"}
        </div>
      )}
    </div>
  );
}
