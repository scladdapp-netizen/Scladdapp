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
      <FormInput
        label="Admin Email"
        type="email"
        value={adminEmail}
        onChange={(value) => updateAdminData("adminEmail", value)}
      />
      {emailVerify && (
        <p style={{ color: "green", marginBottom: 30 }}>Email Verified</p>
      )}

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
          loadingText={"Loading..."}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
