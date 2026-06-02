const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useAppFeedback = () => {
  const submitFeedback = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/app-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error" };
    }
  };

  return { submitFeedback };
};

export default useAppFeedback;
