import { useState } from "react";

const useCloseAdmission = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const closeAdmission = async (admissionId, closeDate, remarks) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admission/${admissionId}/close`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            closeDate: closeDate || new Date().toISOString().split("T")[0],
            remarks: remarks || null,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setLoading(false);
        return {
          success: true,
          message: result.message || "Admission closed successfully",
        };
      } else {
        setError(result.message || "Failed to close admission");
        setLoading(false);
        return {
          success: false,
          message: result.message || "Failed to close admission",
        };
      }
    } catch (err) {
      console.error("Close admission error:", err);
      const errorMessage = err.message || "Failed to close admission";
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    closeAdmission,
    clearError,
  };
};

export default useCloseAdmission;
