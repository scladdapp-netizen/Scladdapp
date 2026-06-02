import { useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStaffPerformance = () => {
  const getPerformancePaginated = useCallback(async (staffId, params = {}) => {
    try {
      const { page = 1, limit = 10, search = "", searchField = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField }).toString();
      const res = await fetch(`${API_BASE_URL}/api/staff-performance/${staffId}/paginated?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const createPerformance = useCallback(async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-performance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const updatePerformance = useCallback(async (id, payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-performance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const deletePerformance = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff-performance/${id}`, {
        method: "DELETE",
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  return { getPerformancePaginated, createPerformance, updatePerformance, deletePerformance };
};

export default useStaffPerformance;
