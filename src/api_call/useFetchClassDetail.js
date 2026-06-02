import { useState, useEffect } from "react";

const useFetchClassDetail = (schoolId, classId) => {
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  useEffect(() => {
    const fetchClassDetail = async () => {
      if (!schoolId || !classId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching class detail for:", { schoolId, classId });

        const response = await fetch(
          `${API_BASE_URL}/class/${classId}/detail`,
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
          console.log("Class detail fetched successfully:", result.data);
          setClassData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch class detail");
        }
      } catch (err) {
        console.error("Fetch class detail error:", err);
        setError(err.message || "Failed to fetch class detail");
        setClassData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetail();
  }, [schoolId, classId]);

  // Refetch function
  const refetch = async () => {
    if (!schoolId || !classId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/class/${classId}/detail`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || `HTTP error! status: ${response.status}`
        );
      }

      if (result.success) {
        setClassData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch class detail");
      }
    } catch (err) {
      console.error("Refetch class detail error:", err);
      setError(err.message || "Failed to fetch class detail");
    } finally {
      setLoading(false);
    }
  };

  return {
    classData,
    loading,
    error,
    refetch,
  };
};

export default useFetchClassDetail;
