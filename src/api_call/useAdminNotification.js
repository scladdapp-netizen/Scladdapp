const API = `${import.meta.env.VITE_API_BASE_URL}/api/admin-notifications`;

const useAdminNotification = () => {

  /** Get all notifications for a school, with is_read flag for a specific admin */
  const getNotifications = async (schoolId, adminId) => {
    try {
      const res  = await fetch(`${API}/school/${schoolId}?admin_id=${adminId}`);
      const data = await res.json();
      return data;
    } catch {
      return { success: false, data: [] };
    }
  };

  /** Get unread count only (lightweight — used for polling) */
  const getUnreadCount = async (schoolId, adminId) => {
    try {
      const res  = await fetch(`${API}/school/${schoolId}/unread-count?admin_id=${adminId}`);
      const data = await res.json();
      return data;
    } catch {
      return { success: false, count: 0 };
    }
  };

  /** Mark a single notification as read for this admin */
  const markAsRead = async (notificationId, adminId) => {
    try {
      const res  = await fetch(`${API}/${notificationId}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  };

  /** Mark all notifications as read for this admin */
  const markAllAsRead = async (schoolId, adminId) => {
    try {
      const res  = await fetch(`${API}/school/${schoolId}/read-all`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  };

  /** Create a new admin notification */
  const createNotification = async (payload) => {
    try {
      const res  = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  };

  /** Delete a notification */
  const deleteNotification = async (notificationId) => {
    try {
      const res  = await fetch(`${API}/${notificationId}`, { method: "DELETE" });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  };

  return { getNotifications, getUnreadCount, markAsRead, markAllAsRead, createNotification, deleteNotification };
};

export default useAdminNotification;
