const API = `${import.meta.env.VITE_API_BASE_URL}/api/support-tickets`;

const useSupportTicket = () => {

  /** Create a new ticket. payload can include a File as `attachment`. */
  const createTicket = async ({ attachment, ...fields }) => {
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, v));
      if (attachment instanceof File) fd.append("attachment", attachment);

      const res  = await fetch(API, { method: "POST", body: fd });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error" };
    }
  };

  /** Get all tickets for the current user. */
  const getMyTickets = async ({ user_id, user_type }) => {
    try {
      const res  = await fetch(`${API}?user_id=${user_id}&user_type=${user_type}`);
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error" };
    }
  };

  /** Get single ticket + messages. */
  const getTicketDetail = async (ticketId) => {
    try {
      const res  = await fetch(`${API}/${ticketId}`);
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error" };
    }
  };

  /** Add a message to a ticket. payload can include a File as `attachment`. */
  const addMessage = async (ticketId, { attachment, ...fields }) => {
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => v != null && fd.append(k, v));
      if (attachment instanceof File) fd.append("attachment", attachment);

      const res  = await fetch(`${API}/${ticketId}/messages`, { method: "POST", body: fd });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, message: "Network error" };
    }
  };

  return { createTicket, getMyTickets, getTicketDetail, addMessage };
};

export default useSupportTicket;
