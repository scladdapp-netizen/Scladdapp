import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSubscriptionDashboard = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/school/${schoolId}/dashboard`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const getPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/plans`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const upgradeSubscription = async (schoolId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/school/${schoolId}/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscription/school/${schoolId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getPaymentsPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "" } = params;
      const query = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/subscription/school/${schoolId}/payments/paginated?${query}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, getSubscriptionDashboard, getPlans, upgradeSubscription, cancelSubscription, getPaymentsPaginated };
};

export default useSubscription;
