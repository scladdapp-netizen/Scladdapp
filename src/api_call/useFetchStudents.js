import { useState } from "react";

/**
 * Custom hook for fetching students with their admission data
 *
 * This hook handles fetching students for a school, including their
 * admission information (active and inactive admissions).
 */
const useFetchStudents = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL - adjust this to match your backend URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    // Backend returns success: false for errors
    // We need to check the success field, not just the HTTP status
    if (!data.success) {
      // Return the full error data structure from backend
      return data;
    }

    return data;
  };

  /**
   * Get all students for a school with their admission data
   *
   * This fetches students based on admissions (not student.school_id)
   * and joins student data with admission data.
   *
   * @param {String} schoolId - ID of the school
   * @returns {Object} Result with success status and array of students with admission data
   */
  const getStudentsBySchoolId = async (schoolId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching students for school ID:", schoolId);

      if (!schoolId) {
        throw new Error("School ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/student/school/${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      // Check if the backend returned success: false
      if (!result.success) {
        console.log("Get school students failed:", result);
        setError(result.message);
        return {
          success: false,
          error: result.error,
          message: result.message,
        };
      }

      console.log("School students fetched successfully:", result);
      return {
        success: true,
        data: result.data, // Array of students with admission data
        message: result.message || "Students retrieved successfully",
      };
    } catch (err) {
      console.error("Get school students error:", err);
      const errorMessage = err.message || "Failed to retrieve students";
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
   * Get a single student by ID
   *
   * @param {String} studentId - ID of the student
   * @returns {Object} Result with success status and student data
   */
  const getStudentById = async (studentId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching student with ID:", studentId);

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await handleApiResponse(response);

      // Check if the backend returned success: false
      if (!result.success) {
        console.log("Student fetch failed:", result);
        setError(result.message);
        return {
          success: false,
          error: result.error,
          message: result.message,
        };
      }

      console.log("Student fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Student retrieved successfully",
      };
    } catch (err) {
      console.error("Get student error:", err);
      const errorMessage = err.message || "Failed to retrieve student";
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
   * Get all admissions for a student
   * Used to check enrollment status
   *
   * @param {String} studentId - ID of the student
   * @returns {Object} Result with success status and array of admissions
   */
  const getAdmissionsByStudentId = async (studentId) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching admissions for student ID:", studentId);

      if (!studentId) {
        throw new Error("Student ID is required");
      }

      const response = await fetch(
        `${API_BASE_URL}/admission/student/${studentId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await handleApiResponse(response);

      // Check if the backend returned success: false
      if (!result.success) {
        console.log("Get admissions failed:", result);
        setError(result.message);
        return {
          success: false,
          error: result.error,
          message: result.message,
        };
      }

      console.log("Admissions fetched successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Admissions retrieved successfully",
      };
    } catch (err) {
      console.error("Get admissions error:", err);
      const errorMessage = err.message || "Failed to retrieve admissions";
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
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    // State
    loading,
    error,

    // Actions
    getStudentsBySchoolId,
    getStudentById,
    getAdmissionsByStudentId,
    clearError,
  };
};

export default useFetchStudents;
