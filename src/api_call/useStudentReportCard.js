import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/**
 * Fetches a student's report card status and preview data for a subsession.
 * Only returns preview data if the report card is published.
 */
const useStudentReportCard = (studentId, subsessionId) => {
  const [reportCard, setReportCard]   = useState(null);  // { is_published, teacher_remark, ... }
  const [previewData, setPreviewData] = useState(null);  // { student, template }
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!studentId || !subsessionId) { setLoading(false); return; }

    setLoading(true);
    setError(null);
    setReportCard(null);
    setPreviewData(null);

    // Step 1: fetch report card status
    fetch(`${API}/api/student-report/student/${studentId}/subsession/${subsessionId}/report-card`)
      .then((r) => r.json())
      .then(async (res) => {
        if (!res.success) {
          // No report card yet
          setLoading(false);
          return;
        }

        const card = res.data;
        setReportCard(card);

        // Step 2: only fetch preview if published
        if (card.is_published) {
          try {
            const pvRes = await fetch(
              `${API}/api/student-report/student/${studentId}/subsession/${subsessionId}/preview`
            );
            const pvData = await pvRes.json();
            if (pvData.success) setPreviewData(pvData.data); // { student, template }
          } catch (_) {}
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [studentId, subsessionId]);

  return { reportCard, previewData, loading, error };
};

export default useStudentReportCard;
