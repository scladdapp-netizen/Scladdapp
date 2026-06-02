import { useState, useEffect } from "react";

const use_fatch_teach_detail = (schoolId, teacherId) => {
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      if (!schoolId || !teacherId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching teacher detail for:", { schoolId, teacherId });

        // Use the detail endpoint to get teacher with sessions
        const response = await fetch(
          `${API_BASE_URL}/teacher/${teacherId}/detail`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        console.log("Teacher detail fetch result:", result);

        if (result.success) {
          console.log("=== TEACHER DETAIL FETCHED ===");
          console.log("Teacher:", result.data.teacher);
          console.log("Sessions:", result.data.sessions);
          console.log("==============================");
          setTeacherData(result.data);
        } else {
          throw new Error(result.message || "Failed to fetch teacher detail");
        }
      } catch (err) {
        console.error("Fetch teacher detail error:", err);
        setError(err.message || "Failed to fetch teacher detail");
        setTeacherData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherDetail();
  }, [schoolId, teacherId]);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/${teacherId}/detail`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setTeacherData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch teacher detail");
      }
    } catch (err) {
      console.error("Refetch teacher detail error:", err);
      setError(err.message || "Failed to fetch teacher detail");
    } finally {
      setLoading(false);
    }
  };

  return {
    teacherData,
    loading,
    error,
    refetch,
  };
};

export default use_fatch_teach_detail;
