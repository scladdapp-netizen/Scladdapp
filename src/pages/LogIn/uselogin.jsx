import { useState, useEffect, use } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { generateOTP } from "../../utils/passwordUtils";
import { sendOTPEmail } from "../../services/emailService";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";
import { useOTP } from "../../components/otp/OTPContext";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useAlert } from "../../context/AlertProvider/AlertProvider";

export const uselogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);
  const { addNotification } = useNotification();
  const { openOTPModal } = useOTP();
  const { showAlert } = useAlert();
  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear form when switching tabs
    setEmail("");
    setPassword("");
  };

  const handleRoleSelect = (selectedRole) => {
    // Close role selection modal
    setShowRoleSelection(false);

    // Check if 2FA is required for the selected role
    const userInfo =
      selectedRole === "admin" ? pendingUserData.admin : pendingUserData.staff;

    if (userInfo && userInfo.two_fac_auth) {
      // Generate OTP for the selected role
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Show OTP modal
      showAlert(
        `Your OTP is: ${otp}. Please enter this code to complete login.`,
        () => {
          openOTPModal(otp, () => {
            // OTP verified, complete login with selected role
            completeLogin(pendingUserData, navigate, selectedRole);
            addNotification("Login successful!", "success");
          });
        },
        () => {
          addNotification("Login cancelled", "info");
        }
      );
    } else {
      // No 2FA, complete login directly
      completeLogin(pendingUserData, navigate, selectedRole);
      addNotification("Login successful!", "success");
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
          // Show role selection modal
          setPendingUserData(result.userData);
          setShowRoleSelection(true);
        } else if (result.requiresOTP) {
          // Show alert with generated OTP instead of sending email
          showAlert(
            `Your OTP is: ${result.otp}. Please enter this code to complete login.`,
            () => {
              // User clicked Continue, open OTP modal
              openOTPModal(result.otp, () => {
                // OTP verified successfully
                completeLogin(result.userData, navigate);
                addNotification("Login successful!", "success");
              });
            },
            () => {
              // User clicked Cancel
              addNotification("Login cancelled", "info");
            }
          );
        } else {
          // Login successful without 2FA or role selection
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
