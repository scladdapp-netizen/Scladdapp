import { useState, useEffect } from "react";

const useFetchStaffDetail = (schoolId, staffId) => {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  useEffect(() => {
    const fetchStaffDetail = async () => {
      if (!schoolId || !staffId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching staff detail for:", { schoolId, staffId });

        const response = await fetch(
          `${API_BASE_URL}/staff/${staffId}/detail`,
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
          console.log("Staff detail fetched successfully:", result.data);
          console.log("=== STAFF DETAIL FETCHED ===");
          console.log("Staff:", result.data.staff);
          console.log("Teacher Assignments:", result.data.teacher_assignments);
          console.log("Sessions:", result.data.sessions);
          console.log("============================");
          setStaffData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch staff detail");
        }
      } catch (err) {
        console.error("Fetch staff detail error:", err);
        setError(err.message || "Failed to fetch staff detail");
        setStaffData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffDetail();
  }, [schoolId, staffId]);

  // Refetch function
  const refetch = async () => {
    if (!schoolId || !staffId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/staff/${staffId}/detail`, {
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
        setStaffData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch staff detail");
      }
    } catch (err) {
      console.error("Refetch staff detail error:", err);
      setError(err.message || "Failed to fetch staff detail");
    } finally {
      setLoading(false);
    }
  };

  return {
    staffData,
    loading,
    error,
    refetch,
  };
};

export default useFetchStaffDetail;
