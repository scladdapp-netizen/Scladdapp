import { useState } from "react";

const useStaffInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL - adjust this to match your backend URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  // Build request body — uses FormData when a photo File is present, JSON otherwise
  const buildBody = (staffData) => {
    const { staffPhoto, ...rest } = staffData;
    const hasFile = staffPhoto instanceof File;

    if (hasFile) {
      const form = new FormData();
      form.append("staff_photo", staffPhoto);
      Object.entries(rest).forEach(([k, v]) => {
        if (v !== null && v !== undefined) form.append(k, v);
      });
      return { body: form, headers: {} }; // let browser set Content-Type with boundary
    }

    // No file — keep existing URL string if present
    return {
      body: JSON.stringify({ ...rest, staffPhoto: staffPhoto || undefined }),
      headers: { "Content-Type": "application/json" },
    };
  };

  // Create staff member
  const createStaff = async (staffData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating staff with data:", staffData);

      const { body, headers } = buildBody(staffData);
      const response = await fetch(`${API_BASE_URL}/staff`, {
        method: "POST",
        headers,
        body,
      });

      const result = await handleApiResponse(response);

      console.log("Staff created successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Staff member created successfully",
      };
    } catch (err) {
      console.error("Create staff error:", err);
      const errorMessage = err.message || "Failed to create staff member";
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

  // Update staff member
  const updateStaff = async (staffId, staffData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updating staff with ID:", staffId, "Data:", staffData);

      if (!staffId) {
        throw new Error("Staff ID is required for update");
      }

      const { body, headers } = buildBody(staffData);
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: "PUT",
        headers,
        body,
      });

      const result = await handleApiResponse(response);

      console.log("Staff updated successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Staff member updated successfully",
      };
    } catch (err) {
      console.error("Update staff error:", err);
      const errorMessage = err.message || "Failed to update staff member";
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

  // Delete staff member
  const deleteStaff = async (staffId, deletedBy = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Deleting staff with ID:", staffId);

      if (!staffId) {
        throw new Error("Staff ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);

      console.log("Staff deleted successfully:", result);
      return {
        success: true,
        message: result.message || "Staff member deleted successfully",
      };
    } catch (err) {
      console.error("Delete staff error:", err);
      const errorMessage = err.message || "Failed to delete staff member";
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

  // Get staff member by ID
  const getStaffById = async (staffId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching staff with ID:", staffId);

      if (!staffId) {
        throw new Error("Staff ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/staff/${staffId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("Staff fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Staff member retrieved successfully",
      };
    } catch (err) {
      console.error("Get staff error:", err);
      const errorMessage = err.message || "Failed to retrieve staff member";
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

  // Get all staff for a school
  const getStaffBySchoolId = async (schoolId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching staff for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/staff/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      console.log("School staff fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Staff members retrieved successfully",
      };
    } catch (err) {
      console.error("Get school staff error:", err);
      const errorMessage = err.message || "Failed to retrieve staff members";
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

  // Change staff password
  const changePassword = async (staffId, currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await handleApiResponse(response);
      return { success: true, message: result.message };
    } catch (err) {
      const errorMessage = err.message || "Failed to change password";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Toggle 2FA for staff
  const toggleTwoFactorAuth = async (staffId, enabled) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}/two-factor-auth`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const result = await handleApiResponse(response);
      return { success: true, data: result.data, message: result.message };
    } catch (err) {
      const errorMessage = err.message || "Failed to update 2FA setting";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    error,

    // Actions
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    getStaffBySchoolId,
    changePassword,
    toggleTwoFactorAuth,
    clearError,
  };
};

export default useStaffInfo;
