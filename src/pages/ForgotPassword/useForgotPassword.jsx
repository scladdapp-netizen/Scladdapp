import { useState } from "react";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useForgotPassword = () => {
  const { addNotification } = useNotification();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleNext = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        addNotification("Reset link sent! Check your email.", "success");
      } else {
        addNotification(data.message || "Something went wrong.", "error");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      addNotification("Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, loading, sent, handleNext };
};

export default useForgotPassword;
