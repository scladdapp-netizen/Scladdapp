import { useState } from "react";

const useSchoolEvents = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  // Create school event
  const createEvent = async (eventData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating event with data:", eventData);

      const response = await fetch(`${API_BASE_URL}/api/school-events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      const result = await handleApiResponse(response);

      console.log("Event created successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Event created successfully",
      };
    } catch (err) {
      console.error("Create event error:", err);
      const errorMessage = err.message || "Failed to create event";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Update school event
  const updateEvent = async (eventId, eventData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updating event with ID:", eventId, "Data:", eventData);

      if (!eventId) {
        throw new Error("Event ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      const result = await handleApiResponse(response);

      console.log("Event updated successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Event updated successfully",
      };
    } catch (err) {
      console.error("Update event error:", err);
      const errorMessage = err.message || "Failed to update event";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Delete school event
  const deleteEvent = async (eventId, deletedBy = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Deleting event with ID:", eventId);

      if (!eventId) {
        throw new Error("Event ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-events/${eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);

      console.log("Event deleted successfully:", result);
      return {
        success: true,
        message: result.message || "Event deleted successfully",
      };
    } catch (err) {
      console.error("Delete event error:", err);
      const errorMessage = err.message || "Failed to delete event";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get event by ID
  const getEventById = async (eventId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching event with ID:", eventId);

      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-events/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("Event fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Event retrieved successfully",
      };
    } catch (err) {
      console.error("Get event error:", err);
      const errorMessage = err.message || "Failed to retrieve event";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get events for subsession with pagination
  const getEventsPaginated = async (subsessionId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events for subsession:", subsessionId, "Params:", params);

      if (!subsessionId) {
        throw new Error("Subsession ID is required");
      }

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || "",
        searchField: params.searchField || "",
        sortBy: params.sortBy || "event_date",
        sortOrder: params.sortOrder || "desc",
      });

      const response = await fetch(
        `${API_BASE_URL}/api/school-events/subsession/${subsessionId}?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      console.log("Events fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: result.message || "Events retrieved successfully",
      };
    } catch (err) {
      console.error("Get events error:", err);
      const errorMessage = err.message || "Failed to retrieve events";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        data: [],
        pagination: null,
      };
    } finally {
      setLoading(false);
    }
  };

  // Get all events for a school
  const getEventsBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching events for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-events/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("School events fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "School events retrieved successfully",
      };
    } catch (err) {
      console.error("Get school events error:", err);
      const errorMessage = err.message || "Failed to retrieve school events";
      setError(errorMessage);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    loading,
    error,

    // Actions
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getEventsPaginated,
    getEventsBySchool,
    clearError,
  };
};

export default useSchoolEvents;