import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate, Routes, Route } from "react-router-dom";
import { useFetchStudents } from "../../api_call";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import SchoolDashboard from "./SchoolDashboard/SchoolDashboard";
import "./StudentSec.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";

const StudentHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { getAdmissionsByStudentId } = useFetchStudents();

  const { theme, setTheme } = useTheme();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading]       = useState(true);

  const student  = user?.student || {};
  const school   = user?.school  || {};
  const initials = student.full_name
    ? student.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "S";

  useEffect(() => {
    if (!student.student_id) return;
    getAdmissionsByStudentId(student.student_id).then((res) => {
      if (res.success) setAdmissions(res.data || []);
      setLoading(false);
    });
  }, [student.student_id]);

  return (
    <div className="ss-page">
      {/* ── Hero ── */}
      <div className="ss-hero">
        <span className="ss-hero-deco" aria-hidden="true" />
        <div className="ss-hero-body">
          <div className="ss-hero-left">
            <div className="ss-avatar">
              {student.student_photo ? (
                <img src={student.student_photo} alt={student.full_name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              ) : initials}
            </div>
            <div className="ss-hero-text">
              <h1 className="ss-name">{student.full_name || "Student"}</h1>
              <p className="ss-meta">{student.admission_number} · {student.gender || "Student"}</p>
            </div>
          </div>

          <div className="ss-hero-actions">
            <button className="ss-icon-btn" onClick={() => {
              const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
              setTheme(next);
            }} title={`Theme: ${theme}`}>
              {theme === "dark" ? (
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : theme === "system" ? (
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="9" rx="1.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 15h6M9 12v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="3.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"/>
                </svg>
              )}
            </button>
            <button className="ss-logout-btn" onClick={() => { logout(); navigate("/login"); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* ── Admissions ── */}
      <div className="ss-body">
        <div className="ss-section-header">
          <h3 className="ss-section-title">My Admissions</h3>
          <p className="ss-section-sub">{admissions.length} school{admissions.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="ss-empty">Loading admissions...</div>
        ) : admissions.length === 0 ? (
          <div className="ss-empty">No admission records found.</div>
        ) : (
          <div className="ss-grid">
            {admissions.map((a) => {
              const sid = a.school_id || school.school_id;
              return (
                <div
                  key={a.admission_id}
                  className={`ss-card ${a.active_status ? "ss-card-active" : ""}`}
                  onClick={() => navigate(`/student/${student.student_id}/school/${sid}`)}
                >
                  {/* Card header */}
                  <div className="ss-card-header">
                    <div className="ss-card-school-icon">
                      {(a.school_logo && typeof a.school_logo === "string") ? (
                        <img src={a.school_logo} alt={a.school_name} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 8 }} />
                      ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      )}
                    </div>
                    <div className="ss-card-school-info">
                      <p className="ss-card-school">{a.school_name || "—"}</p>
                      {a.is_graduated && (
                        <span className="ss-badge ss-badge-gold">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                            <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          {a.graduation_date ? new Date(a.graduation_date).getFullYear() : "Graduated"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="ss-card-details">
                    {[
                      ["Admitted",  fmt(a.admitted_date)],
                      ["Class",     a.admission_class_name || "—"],
                      ["Session",   a.admission_session || "—"],
                      ["Term",      a.admission_term    || "—"],
                      ["Type",      a.admission_type    || "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="ss-card-row">
                        <span className="ss-card-row-label">{label}</span>
                        <span className="ss-card-row-value">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Graduation body indicator */}
                  {a.is_graduated && (
                    <div className="ss-grad-banner">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 14L18.16 10.83C18.706 11.5 19 12.32 19 13.2V17.4C19 18.836 15.866 20 12 20C8.134 20 5 18.836 5 17.4V13.2C5 12.32 5.294 11.5 5.84 10.83L12 14Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>
                        Graduated{a.final_class_name ? ` · ${a.final_class_name}` : ""}{a.graduation_date ? ` · ${new Date(a.graduation_date).getFullYear()}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="ss-card-footer">
                    <div className="ss-footer-badges">
                      {a.active_status && <span className="ss-current-tag">Current</span>}
                    </div>
                    <span className="ss-card-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentSec = () => (
  <Routes>
    <Route path="/school/:schoolId/*" element={<SchoolDashboard />} />
    <Route path="/*" element={<StudentHome />} />
  </Routes>
);

export default StudentSec;
