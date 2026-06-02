import { useState } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Hook for school account operations
 */
export const useSchoolAccount = () => {
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
   * Create a new school account
   */
  const createSchoolAccount = async (accountData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Creating school account:", accountData);

      const response = await fetch(`${API_BASE_URL}/school-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      });

      const result = await handleApiResponse(response);
      console.log("Create school account response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "School account created successfully",
      };
    } catch (err) {
      console.error("Create school account error:", err);
      const errorMessage = err.message || "Failed to create school account";
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
   * Get all school accounts for a school
   */
  const getSchoolAccountsBySchool = async (schoolId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching school accounts for school:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/school-account/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get school accounts response:", result);

      return {
        success: true,
        data: result.data,
        count: result.count,
        message: result.message || "School accounts retrieved successfully",
      };
    } catch (err) {
      console.error("Get school accounts error:", err);
      const errorMessage = err.message || "Failed to fetch school accounts";
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
   * Get a single school account by ID
   */
  const getSchoolAccountById = async (accountId) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching school account:", accountId);

      if (!accountId) {
        throw new Error("Account ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/school-account/${accountId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);
      console.log("Get school account response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "School account retrieved successfully",
      };
    } catch (err) {
      console.error("Get school account error:", err);
      const errorMessage = err.message || "Failed to fetch school account";
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
   * Update a school account
   */
  const updateSchoolAccount = async (accountId, accountData) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Updating school account:", accountId, accountData);

      if (!accountId) {
        throw new Error("Account ID is required for update");
      }

      const response = await fetch(
        `${API_BASE_URL}/school-account/${accountId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(accountData),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Update school account response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "School account updated successfully",
      };
    } catch (err) {
      console.error("Update school account error:", err);
      const errorMessage = err.message || "Failed to update school account";
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
   * Delete a school account
   */
  const deleteSchoolAccount = async (accountId, deletedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Deleting school account:", accountId);

      if (!accountId) {
        throw new Error("Account ID is required for deletion");
      }

      const response = await fetch(
        `${API_BASE_URL}/school-account/${accountId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted_by: deletedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Delete school account response:", result);

      return {
        success: true,
        message: result.message || "School account deleted successfully",
      };
    } catch (err) {
      console.error("Delete school account error:", err);
      const errorMessage = err.message || "Failed to delete school account";
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
   * Set account as default
   */
  const setDefaultAccount = async (accountId, modifiedBy = null) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Setting default account:", accountId);

      if (!accountId) {
        throw new Error("Account ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/school-account/${accountId}/default`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modified_by: modifiedBy }),
        }
      );

      const result = await handleApiResponse(response);
      console.log("Set default account response:", result);

      return {
        success: true,
        data: result.data,
        message: result.message || "Account set as default successfully",
      };
    } catch (err) {
      console.error("Set default account error:", err);
      const errorMessage = err.message || "Failed to set default account";
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

  // Fetch bank list from Paystack
  const getBankList = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/school-account/banks`);
      const result = await response.json();
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Verify bank account via Paystack
  const verifyBankAccount = async (account_number, bank_code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/school-account/verify?account_number=${account_number}&bank_code=${bank_code}`
      );
      const result = await response.json();
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Create Paystack subaccount
  const createPaystackSubaccount = async ({ business_name, account_number, bank_code, percentage_charge }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/school-account/subaccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_name, account_number, bank_code, percentage_charge }),
      });
      const result = await response.json();
      return result;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createSchoolAccount,
    getSchoolAccountsBySchool,
    getSchoolAccountById,
    updateSchoolAccount,
    deleteSchoolAccount,
    setDefaultAccount,
    verifyBankAccount,
    createPaystackSubaccount,
    getBankList,
    clearError,
  };
};

export default useSchoolAccount;
