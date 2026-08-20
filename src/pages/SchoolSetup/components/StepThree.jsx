import Button from "../../../components/Button/Button";
import FormInput from "../../../components/FormInput";
import PasswordStrength from "../../../utils/PasswordStrength";

export default function StepThree({
  onNext,
  onBack,
  adminUsername,
  adminEmail,
  adminPassword,
  adminConfirmPassword,
  passwordStrength,
  passwordChecks,
  showPassword,
  updateAdminData,
  isLoading,
  emailVerify,
}) {
  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    updateAdminData("passwordChecks", checks);
    const passed = Object.values(checks).filter(Boolean).length;
    updateAdminData("passwordStrength", passed);
  };

  const handlePasswordChange = (value) => {
    updateAdminData("adminPassword", value);
    checkPasswordStrength(value);
  };

  return (
    <div className="stepform">
      <FormInput
        label="Admin Username"
        type="text"
        value={adminUsername}
        onChange={(value) => updateAdminData("adminUsername", value)}
      />

      <div style={{ position: "relative" }}>
        <FormInput
          label="Admin Email"
          type="email"
          value={adminEmail}
          onChange={(value) => updateAdminData("adminEmail", value)}
        />
        {emailVerify && (
          <span style={{
            position: "absolute", right: 12, bottom: 10,
            fontSize: 12, fontWeight: 600, color: "#16a34a",
            background: "#dcfce7", padding: "2px 8px", borderRadius: 20,
          }}>
            ✓ Verified
          </span>
        )}
      </div>

      <PasswordStrength
        password={adminPassword}
        confirmPassword={adminConfirmPassword}
        passwordStrength={passwordStrength}
        passwordChecks={passwordChecks}
        onPasswordChange={handlePasswordChange}
        onConfirmPasswordChange={(value) =>
          updateAdminData("adminConfirmPassword", value)
        }
      />

      <div className="sbl">
        <Button
          variant="primary"
          onClick={onNext}
          loading={isLoading}
          loadingText="Checking..."
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
