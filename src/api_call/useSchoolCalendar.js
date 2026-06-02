import { useState } from "react";

const useSchoolCalendar = () => {
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

  // Create calendar item
  const createCalendarItem = async (calendarData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating calendar item with data:", calendarData);

      const response = await fetch(`${API_BASE_URL}/api/school-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarData),
      });

      const result = await handleApiResponse(response);

      console.log("Calendar item created successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Calendar item created successfully",
      };
    } catch (err) {
      console.error("Create calendar item error:", err);
      const errorMessage = err.message || "Failed to create calendar item";
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

  // Update calendar item
  const updateCalendarItem = async (calendarId, calendarData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updating calendar item with ID:", calendarId, "Data:", calendarData);

      if (!calendarId) {
        throw new Error("Calendar ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-calendar/${calendarId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calendarData),
      });

      const result = await handleApiResponse(response);

      console.log("Calendar item updated successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Calendar item updated successfully",
      };
    } catch (err) {
      console.error("Update calendar item error:", err);
      const errorMessage = err.message || "Failed to update calendar item";
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

  // Delete calendar item
  const deleteCalendarItem = async (calendarId, deletedBy = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Deleting calendar item with ID:", calendarId);

      if (!calendarId) {
        throw new Error("Calendar ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-calendar/${calendarId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);

      console.log("Calendar item deleted successfully:", result);
      return {
        success: true,
        message: result.message || "Calendar item deleted successfully",
      };
    } catch (err) {
      console.error("Delete calendar item error:", err);
      const errorMessage = err.message || "Failed to delete calendar item";
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

  // Get calendar item by ID
  const getCalendarItemById = async (calendarId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching calendar item with ID:", calendarId);

      if (!calendarId) {
        throw new Error("Calendar ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-calendar/${calendarId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("Calendar item fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Calendar item retrieved successfully",
      };
    } catch (err) {
      console.error("Get calendar item error:", err);
      const errorMessage = err.message || "Failed to retrieve calendar item";
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

  // Get calendar items for subsession with pagination
  const getCalendarItemsPaginated = async (subsessionId, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching calendar items for subsession:", subsessionId, "Params:", params);

      if (!subsessionId) {
        throw new Error("Subsession ID is required");
      }

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || "",
        searchField: params.searchField || "",
        sortBy: params.sortBy || "calendar_date",
        sortOrder: params.sortOrder || "asc",
      });

      const response = await fetch(
        `${API_BASE_URL}/api/school-calendar/subsession/${subsessionId}?${queryParams}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      console.log("Calendar items fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: result.message || "Calendar items retrieved successfully",
      };
    } catch (err) {
      console.error("Get calendar items error:", err);
      const errorMessage = err.message || "Failed to retrieve calendar items";
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

  // Get all calendar items for a school
  const getCalendarItemsBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching calendar items for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/api/school-calendar/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("School calendar items fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "School calendar items retrieved successfully",
      };
    } catch (err) {
      console.error("Get school calendar items error:", err);
      const errorMessage = err.message || "Failed to retrieve school calendar items";
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
    createCalendarItem,
    updateCalendarItem,
    deleteCalendarItem,
    getCalendarItemById,
    getCalendarItemsPaginated,
    getCalendarItemsBySchool,
    clearError,
  };
};

export default useSchoolCalendar;