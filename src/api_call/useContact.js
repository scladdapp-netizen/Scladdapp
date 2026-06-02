const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useContact = () => {
  const sendMessage = async ({ name, email, subject, message }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error. Please try again." };
    }
  };

  return { sendMessage };
};

export default useContact;
