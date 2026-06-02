import { useState, useEffect, useCallback } from "react";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

const useStudentBills = (userId) => {
  const [bills, setBills]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchBills = useCallback(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/api/bills/user/${userId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setBills(res.data || []);
        else setError(res.message);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const recordPayment = async (billId, userBillId, paymentData) => {
    try {
      const res = await fetch(`${API}/api/bills/${billId}/recipients/${userBillId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh bills after payment
        fetchBills();
        return { success: true, data: data.data };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return { bills, loading, error, refetch: fetchBills, recordPayment };
};

export default useStudentBills;
