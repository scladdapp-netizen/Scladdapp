import { useState, useEffect, use } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../../context/NotificationProvider/NotificationProvider";
import { useAlert } from "../../../context/AlertProvider/AlertProvider";
import { sendOTPEmail } from "../../../services/emailService";
import { generateOTP, hashPassword } from "../../../utils/passwordUtils";
import { isValidEmail } from "../../../services/isValidEmail";
import { useOTP } from "../../../components/otp/OTPContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";

export const useSchoolSetups = () => {
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { showAlert } = useAlert();
  const { openOTPModal } = useOTP();
  const { school_setup } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState(() => {
    const saved = sessionStorage.getItem("selectedPlan");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (location?.state?.plan) {
      setSelectedPlan(location.state.plan);
      sessionStorage.setItem(
        "selectedPlan",
        JSON.stringify(location.state.plan)
      );
    }
  }, [location]);

  useEffect(() => {
    if (selectedPlan) {
      sessionStorage.setItem("selectedPlan", JSON.stringify(selectedPlan));
    }
  }, [selectedPlan]);

  const [isLoading, setIsLoading] = useState(false);

  const initialCycle = location.state?.priceView || "yearly";
  const currentStep = parseInt(params.step || "1", 10);

  const [billingCycle, setBillingCycle] = useState(initialCycle);
  const [duration, setDuration] = useState(1);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [paymentData, setPaymentData] = useState(null);

  const [loadingSetup, setLoadingSetup] = useState(false);

  const [schoolData, setSchoolData] = useState({
    school_name: "",
    school_slogan: "",
    school_country: "",
    school_state: "",
    school_address: "",
    school_phone: "",
    school_email: "",
    school_logo: "",
  });
  const [adminData, setAdminData] = useState({
    adminUsername: "",
    adminEmail: "",
    emailVerify: false,
    adminPassword: "",
    adminConfirmPassword: "",
    passwordStrength: 0,
    passwordChecks: {
      length: false,
      uppercase: false,
      number: false,
      special: false,
    },
    showPassword: false,
  });
  ///////////////////////////
  ///////////////////////////
  ///////////////////////////

  // OTP Data
  const [otpData, setOtpData] = useState({
    otp: Array(6).fill(""),
    otpError: false,
    otpVerified: false,
    generatedOtp: "",
    isSendingOtp: false,
  });

  const getCyclePrice = () => {
    const prices = {
      monthly: selectedPlan?.monthly_price,
      quarterly: selectedPlan?.quataly_price * 3,
      yearly: selectedPlan?.yearly_price * 12,
    };

    const price = prices[billingCycle] || prices.yearly || 0;
    return Number(price) || 0;
  };

  const getTotalPrice = () => {
    const cyclePrice = getCyclePrice();
    const numDuration = Number(duration) || 1;

    // Direct multiplication: cycle price × duration
    return cyclePrice * numDuration;
  };

  const total_amount = getTotalPrice().toLocaleString();

  ///////////////////////////
  ///////////////////////////
  ///////////////////////////
  // Load subscription plans on component mount
  const updateSchoolData = (field, value) => {
    setSchoolData((prev) => ({ ...prev, [field]: value }));
  };
  ///////////////////////////
  ///////////////////////////
  ///////////////////////////

  const updateAdminData = (field, value) => {
    setAdminData((prev) => ({ ...prev, [field]: value }));
  };
  ///////////////////////////
  ///////////////////////////
  ///////////////////////////

  const updateOtpData = (field, value) => {
    setOtpData((prev) => ({ ...prev, [field]: value }));
  };

  ///////////////////////////
  ///////////////////////////
  ///////////////////////////
  ///////////////////////////

  // Navigation
  const goToStep = (step) => {
    navigate(`/setup/${step}`, { state: location.state });
  };

  ///////////////////////////
  ///////////////////////////ne
  ///////////////////////////
  const validateStep = (step) => {
    if (step === 1) {
      if (!schoolData.school_logo)
        return addNotification("Please provide a school logo image.", "error");
      if (!schoolData.school_name)
        return addNotification("Please enter your school name.", "error");
      if (!schoolData.school_slogan)
        return addNotification("Please enter your school slogan.", "error");
      if (!schoolData.school_phone)
        return addNotification("Please enter a school phone number.", "error");
      if (!schoolData.school_email)
        return addNotification("Please enter a school email.", "error");
      if (!isValidEmail(schoolData.school_email))
        return addNotification("Enter a valid school email address.", "error");
    }

    if (step === 2) {
      if (!schoolData.school_country)
        return addNotification("Select your school's country.", "error");
      if (!schoolData.school_state)
        return addNotification("Enter your school's state.", "error");
      if (!schoolData.school_address)
        return addNotification("Enter your school's address.", "error");
    }

    if (step === 3) {
      if (!adminData.adminUsername)
        return addNotification("Admin username is required.", "error");
      if (!adminData.adminEmail)
        return addNotification("Admin email is required.", "error");
      if (!isValidEmail(adminData.adminEmail))
        return addNotification("Enter a valid admin email address.", "error");
      if (!adminData.adminPassword)
        return addNotification("Password cannot be empty.", "error");
      if (!adminData.adminConfirmPassword)
        return addNotification("Confirm Password cannot be empty.", "error");
      if (adminData.passwordStrength < 4)
        return addNotification("Your password is too weak.", "error");
      if (adminData.adminPassword !== adminData.adminConfirmPassword)
        return addNotification("Passwords do not match.", "error");
    }

    if (step === 4) {
      // const joinedOtp = otpData.otp.join("");
      // if (joinedOtp.length !== 6) {
      //   updateOtpData("otpError", true);
      //   return addNotification("Enter a valid 6-digit OTP.", "error");
      // }
      // if (!verifyOtp(otpData.otp)) {
      //   return false;
      // }
    }

    if (step === 6 && !agreeTerms) {
      return addNotification(
        "You must agree to the Terms and Conditions.",
        "error"
      );
    }

    return true;
  };
  ///////////////////////
  ///////////////////////
  ///////////////////////
  const onPaymentSuccess = async (response) => {
    addNotification("Payment succesful", "info");
  };
  ///////////////////////
  ///////////////////////
  ///////////////////////
  // Paystack close callback
  const onPaymentClose = () => {
    addNotification("Payment was cancelled", "info");
  };
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  ///////////////////////
  const getTotalMonths = () => {
    // For Free Plan, always return 1 month
    if (selectedPlan && selectedPlan.plan_type === "Free") {
      return 1;
    }

    const monthsPerCycle = {
      monthly: 1,
      quarterly: 3,
      yearly: 12,
    };

    const cycleMonths = monthsPerCycle[billingCycle] || 1;
    return cycleMonths * (Number(duration) || 1);
  };
  // Update functions

  // OTP Functions
  const sendOtp = async () => {
    if (otpData.isSendingOtp) return;

    setIsLoading(true);
    updateOtpData("isSendingOtp", true);

    const otp = generateOTP();
    updateOtpData("generatedOtp", otp);

    const emailResult = await sendOTPEmail(
      adminData.adminEmail,
      otp,
      schoolData.school_name
    );

    updateOtpData("isSendingOtp", false);

    setIsLoading(false);
    if (emailResult.success) {
      addNotification("OTP sent successfully to your email", "success");
      return true;
    } else {
      addNotification(
        "Failed to send OTP. Please check your email and try again.",
        "error"
      );
      return false;
    }
  };

  const verifyOtp = (enteredOtp) => {
    const joinedOtp = enteredOtp.join("");
    if (joinedOtp === otpData.generatedOtp) {
      updateOtpData("otpVerified", true);
      updateOtpData("otpError", false);
      addNotification("Email verified successfully!", "success");
      return true;
    } else {
      updateOtpData("otpError", true);
      addNotification("Invalid OTP. Please try again.", "error");
      return false;
    }
  };

  const handleNext = async (step) => {
    if (!validateStep(currentStep)) return;

    if (step === 3) {
      setIsLoading(true);
      try {
        // 1. Check email doesn't already exist
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/setup/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: adminData.adminEmail }),
        });
        const data = await res.json();
        if (data.exists) {
          addNotification("This email is already registered. Please use a different email.", "error");
          return;
        }

        // 2. Send OTP to the admin email
        const otpRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/setup/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: adminData.adminEmail }),
        });
        const otpResult = await otpRes.json();
        if (!otpResult.success) {
          addNotification(otpResult.message || "Failed to send OTP. Please try again.", "error");
          return;
        }

        addNotification("OTP sent to " + adminData.adminEmail, "success");

        // 3. Open the shared OTP modal — same one used in login
        openOTPModal(null, async (enteredOtp) => {
          try {
            const vRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/setup/verify-otp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: adminData.adminEmail, otp: enteredOtp }),
            });
            const vData = await vRes.json();
            if (vData.success) {
              updateAdminData("emailVerify", true);
              navigate("/setup/4");
              return { success: true };
            }
            return { success: false, message: vData.message || "Incorrect OTP." };
          } catch {
            return { success: false, message: "Could not verify OTP. Check your connection." };
          }
        }, async () => {
          // Resend callback
          const rRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/setup/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: adminData.adminEmail }),
          });
          const rData = await rRes.json();
          if (!rData.success) throw new Error(rData.message || "Failed to resend.");
        });
      } catch {
        addNotification("Could not verify email. Please check your connection.", "error");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    navigate(`/setup/${step + 1}`);
  };

  const handleBack = (step) => navigate(`/setup/${step - 1}`);

  // Handle invalid steps
  useEffect(() => {
    if (isNaN(currentStep) || currentStep < 1 || currentStep > 6) {
      goToStep(1);
    }
  }, [currentStep]);

  const handlePaystackClick = () => {
    if (!agreeTerms) {
      addNotification(
        "Please agree to the terms and conditions before proceeding with payment.",
        "error"
      );

      return;
    }
  };

  const handleSubmit = async () => {
    const totalMonths = getTotalMonths();

    const result = await school_setup(
      adminData,
      schoolData,
      totalMonths,
      selectedPlan,
      billingCycle,
      total_amount,
      duration,
      agreeTerms,
      navigate // Pass navigate function
    );

    if (result.success) {
      addNotification("School setup completed successfully!", "success");
    } else {
      addNotification(result.error || "Setup failed", "error");
    }
  };

  return {
    selectedPlan,
    setSelectedPlan,
    billingCycle,
    setBillingCycle,
    duration,
    setDuration,
    agreeTerms,
    setAgreeTerms,
    schoolData: {
      ...schoolData,
      updateSchoolData,
    },
    adminData: {
      ...adminData,
      updateAdminData,
      isValidEmail,
    },
    otpData: {
      ...otpData,
      updateOtpData,
      sendOtp,
      verifyOtp,
    },
    subscriptionData: {
      agreeTerms,
      setAgreeTerms,
    },
    isLoading,
    handleNext,
    handleBack,
    handleSubmit,
    goToStep,
    validateStep,
    paymentData, // Add this prop
    onPaymentSuccess, // Add this prop
    onPaymentClose,
    total_amount,
    loadingSetup,
    handlePaystackClick,
  };
};
