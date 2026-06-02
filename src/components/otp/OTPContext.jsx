// OTPContext.jsx
import { createContext, useContext, useState } from "react";

const OTPContext = createContext();

export const OTPProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [otp, setOtp] = useState(null);
  const [onSuccess, setOnSuccess] = useState(() => () => {});

  const openOTPModal = (generatedOTP, callback) => {
    setOtp(generatedOTP);
    setOnSuccess(() => callback);
    setIsOpen(true);
  };

  const closeOTPModal = () => {
    setIsOpen(false);
    setOtp(null);
    setOnSuccess(() => () => {});
  };

  const verifyOTP = (enteredOTP) => {
    if (enteredOTP === otp) {
      onSuccess();
      closeOTPModal();
      return true;
    }
    return false;
  };

  return (
    <OTPContext.Provider
      value={{ isOpen, openOTPModal, closeOTPModal, verifyOTP }}
    >
      {children}
    </OTPContext.Provider>
  );
};

export const useOTP = () => useContext(OTPContext);
