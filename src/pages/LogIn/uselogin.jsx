import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { useOTP } from "../../components/otp/OTPContext";
import { useAuth } from "../../context/AuthContext/AuthContext";

export const uselogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);

  const { addNotification } = useNotification();
  const { openOTPModal } = useOTP();
  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail("");
    setPassword("");
  };

  const handleRoleSelect = (selectedRole) => {
    setShowRoleSelection(false);

    const userInfo =
      selectedRole === "admin" ? pendingUserData.admin : pendingUserData.staff;

    if (userInfo && userInfo.two_fac_auth) {
      // OTP already sent by the backend during login — open the verify modal
      openOTPModal(null, async (enteredOtp) => {
        const result = await verifyOtpWithBackend(
          pendingUserData.email || email,
          enteredOtp
        );
        if (result.success) {
          completeLogin(pendingUserData, navigate, selectedRole);
          addNotification("Login successful!", "success");
          return true; // tell OTPContext to close the modal
        } else {
          addNotification(result.message || "Incorrect OTP", "error");
          return { success: false, message: result.message || "Incorrect OTP" };
        }
      });
    } else {
      completeLogin(pendingUserData, navigate, selectedRole);
      addNotification("Login successful!", "success");
    }
  };

  // Calls the backend to verify the OTP
  const verifyOtpWithBackend = async (userEmail, otp) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, otp }),
        }
      );
      return await res.json();
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      addNotification("Please enter both email and password", "error");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password }, navigate);

      if (result.success) {
        if (result.requiresRoleSelection) {
          setPendingUserData(result.userData);
          setShowRoleSelection(true);
        } else if (result.requiresOTP) {
          // OTP was sent to the user's email by the backend — just open the modal
          openOTPModal(null, async (enteredOtp) => {
            const verifyResult = await verifyOtpWithBackend(
              result.email || email,
              enteredOtp
            );
            if (verifyResult.success) {
              completeLogin(result.userData, navigate);
              addNotification("Login successful!", "success");
              return true; // tell OTPContext to close the modal
            } else {
              addNotification(verifyResult.message || "Incorrect OTP", "error");
              return { success: false, message: verifyResult.message || "Incorrect OTP" };
            }
          });
        } else {
          addNotification("Login successful!", "success");
        }
      } else {
        addNotification(result.error || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      addNotification("An error occurred during login", "error");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    setLoading,
    activeTab,
    setActiveTab,
    handleTabChange,
    handleLogin,
    showRoleSelection,
    setShowRoleSelection,
    pendingUserData,
    handleRoleSelect,
  };
};
