import { useState } from "react";
import { useSession } from "./useSession";
import { useSubsession } from "./useSubsession";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Custom hook to fetch sessions with their subsessions
 */
export const useSessionWithSubsessions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { getSessionsBySchool } = useSession();
  const { getSubsessionsBySchoolId } = useSubsession();

  /**
   * Fetch all sessions with their subsessions for a school
   */
  const getSessionsWithSubsessions = async (schoolId) => {
    setLoading(true);
    setError(null);

    try {
      if (!schoolId) {
        throw new Error("School ID is required");
      }

      // Fetch sessions
      const sessionsResult = await getSessionsBySchool(schoolId);
      
      if (!sessionsResult.success) {
        throw new Error(sessionsResult.message || "Failed to fetch sessions");
      }

      const sessions = sessionsResult.data || [];

      if (sessions.length === 0) {
        setLoading(false);
        return {
          success: true,
          data: [],
          message: "No sessions found",
        };
      }

      // Fetch all subsessions for the school
      const subsessionsResult = await getSubsessionsBySchoolId(schoolId);
      
      if (!subsessionsResult.success) {
        // If subsessions fail, still return sessions without subsessions
        console.warn("Failed to fetch subsessions:", subsessionsResult.message);
        const sessionsWithEmptySubsessions = sessions.map(session => ({
          ...session,
          subsessions: []
        }));

        setLoading(false);
        return {
          success: true,
          data: sessionsWithEmptySubsessions,
          message: "Sessions retrieved (subsessions unavailable)",
        };
      }

      const allSubsessions = subsessionsResult.data || [];

      // Map subsessions to their respective sessions
      const sessionsWithSubsessions = sessions.map(session => {
        const sessionSubsessions = allSubsessions.filter(
          sub => sub.session_id === session.session_id
        );

        return {
          ...session,
          subsessions: sessionSubsessions
        };
      });

      setLoading(false);
      return {
        success: true,
        data: sessionsWithSubsessions,
        message: "Sessions with subsessions retrieved successfully",
      };

    } catch (err) {
      console.error("Get sessions with subsessions error:", err);
      const errorMessage = err.message || "Failed to fetch sessions with subsessions";
      setError(errorMessage);
      setLoading(false);

      return {
        success: false,
        error: errorMessage,
        message: errorMessage,
        data: [],
      };
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    getSessionsWithSubsessions,
    clearError,
  };
};
