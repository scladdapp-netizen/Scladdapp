import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for admin operations
 */
export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  };

  /**
   * Create admin from staff promotion
   */
  const createAdminFromStaff = async (adminData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating admin from staff with data:", adminData);

      const response = await fetch(`${API_BASE_URL}/admin/create-from-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });

      const result = await handleApiResponse(response);
      console.log("Create admin response:", result);

      return {
        success: true,
        data: result.data,
        message:
          result.message || "Staff promoted to administrator successfully",
      };
    } catch (err) {
      console.error("Create admin error:", err);
      const errorMessage =
        err.message || "Failed to promote staff to administrator";
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

  /**
   * Get all admins by school ID
   */
  const getAdminsBySchoolId = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching admins for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/admin/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get admins response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Admins retrieved successfully",
      };
    } catch (err) {
      console.error("Get admins error:", err);
      const errorMessage = err.message || "Failed to fetch admins";
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

  /**
   * Get admin by ID
   */
  const getAdminById = async (adminId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching admin with ID:", adminId);

      if (!adminId) {
        throw new Error("Admin ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Get admin response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Admin retrieved successfully",
      };
    } catch (err) {
      console.error("Get admin error:", err);
      const errorMessage = err.message || "Failed to fetch admin";
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

  /**
   * Update admin
   */
  const updateAdmin = async (adminId, adminData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating admin with ID:", adminId, "Data:", adminData);

      if (!adminId) {
        throw new Error("Admin ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminData),
      });

      const result = await handleApiResponse(response);
      console.log("Update admin response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Admin updated successfully",
      };
    } catch (err) {
      console.error("Update admin error:", err);
      const errorMessage = err.message || "Failed to update admin";
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

  /**
   * Delete admin
   */
  const deleteAdmin = async (adminId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting admin with ID:", adminId);

      if (!adminId) {
        throw new Error("Admin ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/admin/${adminId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);
      console.log("Delete admin response:", result);

      return {
        success: true,
        message: result.message || "Admin deleted successfully",
      };
    } catch (err) {
      console.error("Delete admin error:", err);
      const errorMessage = err.message || "Failed to delete admin";
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

  /**
   * Deactivate admin (soft delete)
   */
  const deactivateAdmin = async (adminId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deactivating admin with ID:", adminId);

      if (!adminId) {
        throw new Error("Admin ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/${adminId}/deactivate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Deactivate admin response:", result);

      return {
        success: true,
        message: result.message || "Admin deactivated successfully",
      };
    } catch (err) {
      console.error("Deactivate admin error:", err);
      const errorMessage = err.message || "Failed to deactivate admin";
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
    loading,
    error,
    createAdminFromStaff,
    getAdminsBySchoolId,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    deactivateAdmin,
    clearError,
  };
};

export default useAdmin;
