import { useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStaffActivity = () => {
  const getActivityPaginated = useCallback(async (staffId, params = {}) => {
    try {
      const { page = 1, limit = 20, search = "", searchField = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField }).toString();
      const res = await fetch(`${API_BASE_URL}/api/staff-activity/staff/${staffId}/paginated?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const getAdminActivityPaginated = useCallback(async (adminId, params = {}) => {
    try {
      const { page = 1, limit = 20, search = "", searchField = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField }).toString();
      const res = await fetch(`${API_BASE_URL}/api/staff-activity/admin/${adminId}/paginated?${query}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  return { getActivityPaginated, getAdminActivityPaginated };
};

export default useStaffActivity;
