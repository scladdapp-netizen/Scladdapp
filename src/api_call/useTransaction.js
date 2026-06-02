import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const createTransaction = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions`, {
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

  // Paginated — for the table
  const getTransactionsPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "", searchField = "", type = "", startDate = "", endDate = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField, type, startDate, endDate }).toString();
      const res = await fetch(`${API_BASE_URL}/api/transactions/school/${schoolId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination, summary: data.summary };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {}, summary: {} };
    } finally {
      setLoading(false);
    }
  };

  // Summary only — for stats cards and chart (fetches all within date range, no pagination)
  const getTransactionsSummary = async (schoolId, days) => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      const query = new URLSearchParams({ page: 1, limit: 9999, startDate, endDate }).toString();
      const res = await fetch(`${API_BASE_URL}/api/transactions/school/${schoolId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, summary: data.summary };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], summary: { totalIncome: 0, totalExpenses: 0, netBalance: 0 } };
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = async (transactionId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
        method: "PUT",
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

  const deleteTransaction = async (transactionId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/${transactionId}`, {
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

  return { loading, error, createTransaction, getTransactionsPaginated, getTransactionsSummary, updateTransaction, deleteTransaction };
};

export default useTransaction;
