import { useState, useCallback } from "react";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const useStudentReport = (modifiedBy = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subsessionData, setSubsessionData] = useState(null);
  const [templateData, setTemplateData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [studentScores, setStudentScores] = useState([]);
  const [traitScore, setTraitScore] = useState(null);
  const [classAverage, setClassAverage] = useState(null);
  const [subjectPositions, setSubjectPositions] = useState({});
  const [reportCard, setReportCard] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const fetchSubsession = useCallback(async (subsessionId, studentId) => {
    // Reset all state immediately so stale data doesn't show
    setSubsessionData(null);
    setTemplateData(null);
    setClassData(null);
    setClassSubjects([]);
    setStudentScores([]);
    setTraitScore(null);
    setClassAverage(null);
    setSubjectPositions({});
    setReportCard(null);
    setPreviewData(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/subsession/${subsessionId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to fetch subsession");
      console.log(".......... Subsession fetched:", data.data);
      setSubsessionData(data.data);

      // Fetch grading template if assigned
      if (data.data?.grading_template_id) {
        const tplRes = await fetch(`${API_BASE_URL}/grading-template/${data.data.grading_template_id}`);
        const tplData = await tplRes.json();
        if (tplRes.ok && tplData.success) {
          console.log(".......... Template fetched:", tplData.data);
          setTemplateData(tplData.data);
        }
      } else {
        setTemplateData(null);
      }

      // Fetch student's class assignment for this subsession's session
      if (data.data?.session_id) {
        const classRes = await fetch(
          `${API_BASE_URL}/api/student-class-assignment/student/${studentId}/session/${data.data.session_id}/active`
        );
        const classData = await classRes.json();
        if (classRes.ok && classData.success) {
          console.log(".......... Student class fetched:", classData.data);
          setClassData(classData.data);

          // Fetch all subjects for that class
          const subjRes = await fetch(
            `${API_BASE_URL}/class-subject/school/${data.data.school_id}/active`
          );
          const subjData = await subjRes.json();
          if (subjRes.ok && subjData.success) {
            const closeDate = data.data.term_end_date ? new Date(data.data.term_end_date) : null;
            const classSubjects = subjData.data.filter(
              (a) => a.class_id === classData.data.class_id &&
                (!closeDate || new Date(a.created_at) <= closeDate)
            );
            console.log(".......... Class subjects fetched:", classSubjects);
            setClassSubjects(classSubjects);
          }
        }

        // Fetch student scores for this subsession
        const scoresRes = await fetch(
          `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/scores`
        );
        const scoresData = await scoresRes.json();
        if (scoresRes.ok && scoresData.success) {
          console.log(".......... Student scores fetched:", scoresData.data);
          setStudentScores(scoresData.data);
        }

        // Fetch trait scores
        const traitRes = await fetch(
          `${API_BASE_URL}/api/student-trait-score/student/${studentId}/subsession/${subsessionId}`
        );
        const traitData = await traitRes.json();
        if (traitRes.ok && traitData.success) {
          console.log(".......... Trait scores fetched:", traitData.data);
          setTraitScore(traitData.data);
        }

        // Fetch class average — filter by class_id from the class assignment
        const avgClassId = classData.success ? classData.data.class_id : null;
        const avgUrl = avgClassId
          ? `${API_BASE_URL}/api/student-report/subsession/${subsessionId}/class-average?classId=${avgClassId}`
          : `${API_BASE_URL}/api/student-report/subsession/${subsessionId}/class-average`;
        const avgRes = await fetch(avgUrl);
        const avgData = await avgRes.json();
        if (avgRes.ok && avgData.success) {
          console.log(".......... Class average fetched:", avgData.data);
          setClassAverage(avgData.data);
        }

        // Fetch subject positions
        if (avgClassId) {
          const posRes = await fetch(
            `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/subject-positions?classId=${avgClassId}`
          );
          const posData = await posRes.json();
          if (posRes.ok && posData.success) {
            console.log(".......... Subject positions fetched:", posData.data);
            setSubjectPositions(posData.data);
          }
        }

        // Fetch report card (remarks + publish)
        const rcRes = await fetch(
          `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/report-card`
        );
        const rcData = await rcRes.json();
        if (rcRes.ok && rcData.success) {
          console.log(".......... Report card fetched:", rcData.data);
          setReportCard(rcData.data);
        } else {
          setReportCard(null);
        }

        // Fetch assembled preview data
        const pvRes = await fetch(
          `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/preview`
        );
        const pvData = await pvRes.json();
        if (pvRes.ok && pvData.success) {
          console.log(".......... Preview data fetched:", pvData.data);
          setPreviewData(pvData.data);
        }
      }

      setLoading(false);
      return { success: true, data: data.data };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  }, []);

  const saveScore = useCallback(async (studentId, subsessionId, subjectId, scores, hasExisting) => {
    try {
      let res, data;
      if (hasExisting) {
        res = await fetch(
          `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/subject/${subjectId}/scores`,
          { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores, modified_by: modifiedBy }) }
        );
      } else {
        res = await fetch(
          `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/subject`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject_id: subjectId, scores, modified_by: modifiedBy }) }
        );
      }
      data = await res.json();
      console.log(".......... Score saved:", data);
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [modifiedBy]);

  const saveTraitScore = useCallback(async (studentId, subsessionId, payload) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student-trait-score/student/${studentId}/subsession/${subsessionId}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
      );
      const data = await res.json();
      console.log(".......... Trait score saved:", data);
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  const saveReportCard = useCallback(async (studentId, subsessionId, payload) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/report-card`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, modified_by: modifiedBy }) }
      );
      const data = await res.json();
      console.log(".......... Report card saved:", data);
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [modifiedBy]);

  const createReport = useCallback(async (studentId, subsessionId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student-report/student/${studentId}/subsession/${subsessionId}/generate`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modified_by: modifiedBy }) }
      );
      const data = await res.json();
      console.log(".......... Report created:", data);
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [modifiedBy]);

  return { loading, error, subsessionData, templateData, classData, classSubjects, studentScores, traitScore, classAverage, subjectPositions, reportCard, previewData, fetchSubsession, saveScore, saveTraitScore, saveReportCard, createReport };
};

export default useStudentReport;
