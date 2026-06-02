import { useState, useEffect } from "react";

const useFetchStudentDetail = (schoolId, studentId) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  useEffect(() => {
    const fetchStudentDetail = async () => {
      if (!schoolId || !studentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching student detail for:", { schoolId, studentId });

        const response = await fetch(
          `${API_BASE_URL}/student/${studentId}/detail?schoolId=${schoolId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || `HTTP error! status: ${response.status}`
          );
        }

        if (result.success) {
          console.log("Student detail fetched successfully:", result.data);
          setStudentData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch student detail");
        }
      } catch (err) {
        console.error("Fetch student detail error:", err);
        setError(err.message || "Failed to fetch student detail");
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetail();
  }, [schoolId, studentId]);

  // Refetch function
  const refetch = async () => {
    if (!schoolId || !studentId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/student/${studentId}/detail?schoolId=${schoolId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        setStudentData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch student detail");
      }
    } catch (err) {
      console.error("Refetch student detail error:", err);
      setError(err.message || "Failed to fetch student detail");
    } finally {
      setLoading(false);
    }
  };

  return {
    studentData,
    loading,
    error,
    refetch,
  };
};

export default useFetchStudentDetail;
