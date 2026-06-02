import { useState, useEffect } from "react";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

const useStudentAlumni = (studentId) => {
  const [alumni, setAlumni]                   = useState(null);
  const [certificates, setCertificates]       = useState([]);
  const [graduationSession, setGraduationSession] = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    fetch(`${API}/api/alumni/student/${studentId}`)
      .then((r) => r.json())
      .then(async (res) => {
        if (!res.success) { setLoading(false); return; }
        const alumniData = res.data;
        setAlumni(alumniData);

        // Fetch graduation session to get academic_year_start_date
        if (alumniData.graduation_session_id) {
          try {
            const sessRes = await fetch(`${API}/session/${alumniData.graduation_session_id}`);
            const sessData = await sessRes.json();
            if (sessData.success) setGraduationSession(sessData.data);
          } catch (_) {}
        }

        // Fetch certificates
        try {
          const certRes = await fetch(`${API}/api/alumni-certificates/alumni/${alumniData.alumni_id}`);
          const certData = await certRes.json();
          if (certData.success) setCertificates(certData.data || []);
        } catch (_) {}

        setLoading(false);
      })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [studentId]);

  return { alumni, certificates, graduationSession, loading, error };
};

const updateAlumni = async (alumniId, fields) => {
  try {
    const res = await fetch(`${API}/api/alumni/${alumniId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export { updateAlumni };
export default useStudentAlumni;
