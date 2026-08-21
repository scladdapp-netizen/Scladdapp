import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useBill = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const createBill = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const getBillsBySchoolPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "" } = params;
      const query = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/bills/school/${schoolId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  const getBillById = async (billId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const getRecipientsPaginated = async (billId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "" } = params;
      const query = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}/recipients/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async (billId, userBillId, payload, recordedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}/recipients/${userBillId}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, recorded_by_id: recordedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateBillStatus = async (billId, status, modifiedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, modified_by: modifiedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteBill = async (billId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });
      const data = await handleResponse(res);
      return { success: true, message: data.message };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (billId, userBillId, paymentId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}/recipients/${userBillId}/payment/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (billId, userBillId, paymentId, deletedById = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bills/${billId}/recipients/${userBillId}/payment/${paymentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted_by_id: deletedById }),
      });
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createBill, getBillsBySchoolPaginated, getBillById, getRecipientsPaginated, recordPayment, updatePayment, deletePayment, updateBillStatus, deleteBill };
};

export default useBill;
