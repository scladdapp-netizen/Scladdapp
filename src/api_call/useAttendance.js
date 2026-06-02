import { useState, useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mark or update attendance
  const markAttendance = useCallback(async (attendanceData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/student-attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(attendanceData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to mark attendance");
      }

      setLoading(false);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Get attendance records for a subsession
  const getAttendanceBySubsession = useCallback(async (studentId, subsessionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student-attendance/student/${studentId}/subsession/${subsessionId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch attendance");
      }

      setLoading(false);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Get attendance summary
  const getAttendanceSummary = useCallback(async (studentId, subsessionId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student-attendance/summary/student/${studentId}/subsession/${subsessionId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch attendance summary");
      }

      setLoading(false);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  // Delete attendance record
  const deleteAttendance = useCallback(async (studentId, subsessionId, date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/student-attendance/student/${studentId}/subsession/${subsessionId}/date/${date}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete attendance");
      }

      setLoading(false);
      return { success: true };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    loading,
    error,
    markAttendance,
    getAttendanceBySubsession,
    getAttendanceSummary,
    deleteAttendance,
  };
};

export default useAttendance;
