import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useNotification = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResponse = async (res) => {
    const data = await res.json();
    if (!data.success) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const getNotificationsPaginated = async (schoolId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "", searchField = "" } = params;
      const query = new URLSearchParams({ page, limit, search, searchField }).toString();
      const res = await fetch(`${API_BASE_URL}/api/notifications/school/${schoolId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications`, {
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

  const getRecipientsPaginated = async (notificationId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "" } = params;
      const query = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/recipients/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  const getNotificationById = async (notificationId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false, data: null };
    } finally {
      setLoading(false);
    }
  };

  const getNotificationsBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/school/${schoolId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, count: data.count };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const getUserNotifications = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, count: data.count };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [] };
    } finally {
      setLoading(false);
    }
  };

  const getUserNotificationsPaginated = async (userId, params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { page = 1, limit = 15, search = "" } = params;
      const query = new URLSearchParams({ page, limit, search }).toString();
      const res = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}/paginated?${query}`);
      const data = await handleResponse(res);
      return { success: true, data: data.data, pagination: data.pagination };
    } catch (err) {
      setError(err.message);
      return { success: false, data: [], pagination: {} };
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (userNotificationId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/user/${userNotificationId}/read`,
        { method: "PATCH" }
      );
      const data = await handleResponse(res);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
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

  const getUserUnreadCount = async (userId) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}`);
      const data = await res.json();
      if (!data.success) return { success: false, count: 0 };
      const count = (data.data || []).filter((n) => !n.is_read).length;
      return { success: true, count };
    } catch {
      return { success: false, count: 0 };
    }
  };

  return {
    loading,
    error,
    getNotificationsPaginated,
    getRecipientsPaginated,
    getNotificationById,
    createNotification,
    getNotificationsBySchool,
    getUserNotifications,
    getUserNotificationsPaginated,
    getUserUnreadCount,
    markAsRead,
    deleteNotification,
  };
};

export default useNotification;
