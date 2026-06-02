import "./StepIndicator.css";

const STEPS = [
  {
    label: "School Info",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H15v-5h-6v5H4a1 1 0 01-1-1V10.5z"
          stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "School Location",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 12 6 12s6-7.5 6-12c0-3.314-2.686-6-6-6z"
          stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    ),
  },
  {
    label: "Admin Info",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Review",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

const isCompleted = (stepNum, formData) => {
  switch (stepNum) {
    case 1:
      return !!(formData.school_logo && formData.school_name && formData.school_phone && formData.school_slogan && formData.school_email);
    case 2:
      return !!(formData.school_country && formData.school_address && formData.school_phone);
    case 3:
      return !!(formData.adminConfirmPassword && formData.adminEmail && formData.adminPassword && formData.adminUsername);
    default:
      return false;
  }
};

export default function StepIndicator({ current, formData }) {
  const currentNum = JSON.parse(current);

  return (
    <div className="si-root">
      {STEPS.map((step, index) => {
        const stepNum = index + 1;
        const completed = isCompleted(stepNum, formData);
        const active = currentNum === stepNum;
        const past = currentNum > stepNum;

        return (
          <div key={stepNum} className="si-item">
            {/* connector line */}
            {index !== 0 && (
              <div className={`si-line${past || active ? " si-line-done" : ""}`} />
            )}

            <div className={`si-box${active ? " si-box-active" : ""}${completed || past ? " si-box-done" : ""}`}>
              {completed || past ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step.icon
              )}
            </div>

            <span className={`si-label${active ? " si-label-active" : ""}${completed || past ? " si-label-done" : ""}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
