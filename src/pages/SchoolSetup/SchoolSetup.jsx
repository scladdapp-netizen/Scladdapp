import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LoginLeftPanel from "../LogIn/LoginLeftPanel";
import StepIndicator from "./components/StepIndicator";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";
import StepFour from "./components/StepFour";
import { useSchoolSetups } from "./js/useSchoolSetup";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import "./wizard.css";

export default function SchoolSetup() {
  const params = useParams();
  const navigate = useNavigate();
  const currentStep = params.step || 1;
  const { theme, setTheme, resolved } = useTheme();

  const {
    isLoading,
    selectedPlan,
    billingCycle,
    setBillingCycle,
    duration,
    setDuration,
    schoolData,
    adminData,
    otpData,
    subscriptionData,
    handleNext,
    handleBack,
    handleSubmit,
    goToStep,
    validateStep,
    setSelectedPlan,
    paymentData,
    onPaymentSuccess,
    onPaymentClose,
    total_amount,
    loadingSetup,
    handlePaystackClick,
  } = useSchoolSetups();

  useEffect(() => {
    if (!schoolData.school_name && currentStep !== "1") {
      goToStep(1);
    }
  }, [schoolData]);

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
    <div className="wizard-container">
      {/* Theme toggle */}
      <button className="fp-theme-toggle" onClick={cycleTheme} title={`Theme: ${theme}`}>
        <ThemeIcon />
      </button>

      {/* Left panel */}
      <div className="left">
        <LoginLeftPanel />
      </div>

      {/* Right — form */}
      <div className="right">
        <div className="step">
          {/* Header */}
          <div className="stepform">
            <div className="ssutt">
              {currentStep !== "1" && (
                <div onClick={() => goToStep(Number(currentStep) - 1)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
              <div className="ssutt-title-row">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H15v-5h-6v5H4a1 1 0 01-1-1V10.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M8 3h8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
                <h2>School Registration {selectedPlan?.plan_name ? `(${selectedPlan.plan_name})` : ""}</h2>
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="stepform">
            <StepIndicator
              current={currentStep}
              formData={{ ...adminData, ...schoolData }}
            />
          </div>

          {/* Steps */}
          {currentStep === "1" && (
            <StepOne {...schoolData} onNext={() => handleNext(1)} />
          )}
          {currentStep === "2" && (
            <StepTwo
              onNext={() => handleNext(2)}
              onBack={() => handleBack(2)}
              {...schoolData}
            />
          )}
          {currentStep === "3" && (
            <StepThree
              isLoading={isLoading}
              onBack={() => handleBack(3)}
              {...adminData}
              onNext={() => handleNext(3)}
            />
          )}
          {currentStep === "4" && (
            <StepFour
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
              duration={duration}
              setDuration={setDuration}
              setSelectedPlan={setSelectedPlan}
              adminData={adminData}
              schoolData={schoolData}
              subscriptionData={subscriptionData}
              handlePaystackClick={handlePaystackClick}
              total_amount={total_amount}
              onBack={() => handleBack(4)}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}
        {/* Footer */}
          <div className="setup-footer">
            <button className="setup-footer-link" onClick={() => navigate("/")}>
              Back to home
            </button>
            <span className="setup-footer-sep">•</span>
            <button className="setup-footer-link" onClick={() => navigate("/login")}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
