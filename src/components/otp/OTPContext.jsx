import { createContext, useContext, useState } from "react";

const OTPContext = createContext();

export const OTPProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [onVerify, setOnVerify] = useState(() => async () => ({ success: true }));
  const [onResend, setOnResend] = useState(null); // optional resend callback

  /**
   * Open the OTP modal.
   * @param {null} _ignored        - No longer used (OTP lives on the backend)
   * @param {function} verifyCallback - async (enteredOtp: string) => { success, message }
   * @param {function} [resendCallback] - optional async () => void, called when user clicks Resend
   */
  const openOTPModal = (_ignored, verifyCallback, resendCallback = null) => {
    setOnVerify(() => verifyCallback);
    setOnResend(resendCallback ? () => resendCallback : null);
    setIsOpen(true);
  };

  const closeOTPModal = () => {
    setIsOpen(false);
    setOnVerify(() => async () => ({ success: true }));
    setOnResend(null);
  };

  const verifyOTP = async (enteredOTP) => {
    const result = await onVerify(enteredOTP);
    const ok = result === true || (result && result.success);
    if (ok) {
      closeOTPModal();
      return { success: true };
    }
    return {
      success: false,
      message: (result && result.message) || "Incorrect code. Please try again.",
    };
  };

  return (
    <OTPContext.Provider value={{ isOpen, openOTPModal, closeOTPModal, verifyOTP, onResend }}>
      {children}
    </OTPContext.Provider>
  );
};

export const useOTP = () => useContext(OTPContext);
