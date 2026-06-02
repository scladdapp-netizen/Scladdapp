import { useState } from "react";

/**
 * Custom hook for creating new students or enrolling existing students
 *
 * Two main workflows:
 * 1. Create New Student - Creates student + admission + user (if password provided)
 * 2. Enroll Existing Student - Creates admission for existing student
 */
const useCreateOrEnrollStudent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL - adjust this to match your backend URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  // Helper function to handle API responses
  const handleApiResponse = async (response) => {
    const data = await response.json();

    // Backend returns success: false for errors, even with 400 status
    // We need to check the success field, not just the HTTP status
    if (!data.success) {
      // Return the full error data structure from backend
      return data;
    }

    return data;
  };

  /**
   * Create a new student with admission
   * This is used when creating a brand new student from the "Create New Student" panel
   *
   * @param {Object} studentData - Student information
   * @returns {Object} Result with success status, student data, and admission data
   */
  const createStudent = async (studentData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Creating new student with data:", studentData);

      // Validate required fields (skip when FormData — backend validates)
      if (!(studentData instanceof FormData)) {
        if (
          !studentData.fullName ||
          !studentData.email ||
          !studentData.dateOfBirth ||
          !studentData.gender ||
          !studentData.school_id
        ) {
          throw new Error(
            "Missing required fields: fullName, email, dateOfBirth, gender, school_id"
          );
        }
      }

      const response = await fetch(`${API_BASE_URL}/student`, {
        method: "POST",
        body: studentData instanceof FormData
          ? studentData
          : JSON.stringify(studentData),
        ...(studentData instanceof FormData ? {} : { headers: { "Content-Type": "application/json" } }),
      });

      const result = await handleApiResponse(response);

      // Check if the backend returned success: false
      if (!result.success) {
        console.log("Student creation failed:", result);
        setError(result.message);
        return {
          success: false,
          error: result.error,
          message: result.message,
        };
      }

      console.log("Student created successfully:", result);
      return {
        success: true,
        data: {
          student_id: result.data.student_id,
          student: result.data.student,
          admission_id: result.data.admission_id,
          admission: result.data.admission,
        },
        message: result.message || "Student and admission created successfully",
      };
    } catch (err) {
      console.error("Create student error:", err);
      const errorMessage = err.message || "Failed to create student";
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
   * Enroll an existing student to a school
   * This is used when enrolling a student that already exists in the system
   *
   * @param {String} studentId - ID of the existing student
   * @param {Object} enrollmentData - Enrollment information
   * @returns {Object} Result with success status, student data, and admission data
   */
  const enrollExistingStudent = async (studentId, enrollmentData) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        "Enrolling existing student:",
        studentId,
        "with data:",
        enrollmentData
      );

      // Validate required fields
      if (!studentId) {
        throw new Error("Student ID is required");
      }

      if (!enrollmentData.school_id) {
        throw new Error("School ID is required for enrollment");
      }

      const response = await fetch(
        `${API_BASE_URL}/student/${studentId}/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enrollmentData),
        }
      );

      const result = await handleApiResponse(response);

      // Check if the backend returned success: false
      if (!result.success) {
        console.log("Enrollment failed:", result);
        setError(result.message);
        return {
          success: false,
          error: result.error,
          message: result.message,
          data: result.data || null, // Include any additional data (like existing admission info)
        };
      }

      console.log("Student enrolled successfully:", result);
      return {
        success: true,
        data: {
          student_id: result.data.student_id,
          student: result.data.student,
          admission_id: result.data.admission_id,
          admission: result.data.admission,
        },
        message: result.message || "Student enrolled successfully",
      };
    } catch (err) {
      console.error("Enroll student error:", err);
      const errorMessage = err.message || "Failed to enroll student";
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
   * Get student by ID
   * Used to search for existing students before enrollment
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
   * Get all students for a school
   *
   * @param {String} schoolId - ID of the school
   * @returns {Object} Result with success status and array of students
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
        data: result.data,
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
   * Update student information
   *
   * @param {String} studentId - ID of the student
   * @param {Object} studentData - Updated student information
   * @returns {Object} Result with success status and updated student data
   */
  const updateStudent = async (studentId, studentData) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Updating student with ID:", studentId, "Data:", studentData);

      if (!studentId) {
        throw new Error("Student ID is required for update");
      }

      const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(studentData),
      });

      const result = await handleApiResponse(response);

      console.log("Student updated successfully:", result);
      return {
        success: true,
        data: result.data,
        message: result.message || "Student updated successfully",
      };
    } catch (err) {
      console.error("Update student error:", err);
      const errorMessage = err.message || "Failed to update student";
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
   * Delete student (soft delete)
   *
   * @param {String} studentId - ID of the student
   * @returns {Object} Result with success status
   */
  const deleteStudent = async (studentId, deletedBy = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Deleting student with ID:", studentId);

      if (!studentId) {
        throw new Error("Student ID is required for deletion");
      }

      const response = await fetch(`${API_BASE_URL}/student/${studentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deleted_by: deletedBy }),
      });

      const result = await handleApiResponse(response);

      console.log("Student deleted successfully:", result);
      return {
        success: true,
        message: result.message || "Student deleted successfully",
      };
    } catch (err) {
      console.error("Delete student error:", err);
      const errorMessage = err.message || "Failed to delete student";
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
   * Used to check if student is already enrolled
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
    createStudent,
    enrollExistingStudent,
    getStudentById,
    getStudentsBySchoolId,
    getAdmissionsByStudentId,
    updateStudent,
    deleteStudent,
    clearError,
  };
};

export default useCreateOrEnrollStudent;
