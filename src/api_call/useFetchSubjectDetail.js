import { useState, useEffect } from "react";

const useFetchSubjectDetail = (schoolId, subjectId) => {
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Base API URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  useEffect(() => {
    const fetchSubjectDetail = async () => {
      if (!schoolId || !subjectId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching subject detail for:", { schoolId, subjectId });

        const response = await fetch(
          `${API_BASE_URL}/subject/${subjectId}/detail`,
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
          console.log("Subject detail fetched successfully:", result.data);
          console.log("=== SUBJECT DETAIL FETCHED ===");
          console.log("Subject:", result.data.subject);
          console.log("Teacher Assignments:", result.data.teacher_assignments);
          console.log("Class Assignments:", result.data.class_assignments);
          console.log("Sessions:", result.data.sessions);
          console.log("==============================");
          setSubjectData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch subject detail");
        }
      } catch (err) {
        console.error("Fetch subject detail error:", err);
        setError(err.message || "Failed to fetch subject detail");
        setSubjectData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetail();
  }, [schoolId, subjectId]);

  // Refetch function
  const refetch = async () => {
    if (!schoolId || !subjectId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/subject/${subjectId}/detail`,
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
        setSubjectData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch subject detail");
      }
    } catch (err) {
      console.error("Refetch subject detail error:", err);
      setError(err.message || "Failed to fetch subject detail");
    } finally {
      setLoading(false);
    }
  };

  return {
    subjectData,
    loading,
    error,
    refetch,
  };
};

export default useFetchSubjectDetail;
