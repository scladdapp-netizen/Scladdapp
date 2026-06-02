import { useState } from "react";
import { useNavigate, useParams, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import StudentDetailTopTab from "../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import useTeacherAssignments from "./useTeacherAssignments";
import "./Assignments.css";

const Badge = ({ active }) => (
  <span className={`ta-badge ${active ? "ta-badge-active" : "ta-badge-inactive"}`}>
    {active ? "Active" : "Inactive"}
  </span>
);

const EmptyState = ({ message }) => <div className="ta-empty">{message}</div>;

/* ── Shared header + search inside InnerTabCon ── */
const TabHeader = ({ title, subtitle, searchQuery, onSearch }) => (
  <div className="ta-header">
    <div className="ta-header-text">
      <h1 className="ta-title">{title}</h1>
      <p className="ta-subtitle">{subtitle}</p>
    </div>
    <div className="ta-search-wrapper">
      <svg className="ta-search-icon" width="16" height="16" viewBox="0 0 22 22" fill="none">
        <circle cx="9.5" cy="9.5" r="6.5" stroke="#9ca3af" strokeWidth="1.8" />
        <path d="M14.5 14.5L19 19" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        className="ta-search-input"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
      />
      {searchQuery && (
        <button className="ta-search-clear" onClick={() => onSearch("")} title="Clear">×</button>
      )}
    </div>
  </div>
);

/* ── Subject Teacher tab ── */
const SubjectTeacherTab = ({ teacherAssignment, subjects, subjectsLoading, onCardClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = subjects.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.subject_name?.toLowerCase().includes(q) ||
      s.subject_code?.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q)
    );
  });

  if (!teacherAssignment) return (
    <InnerTabCon>
      <TabHeader title="Subject Teacher" subtitle="Subjects you are assigned to teach" searchQuery={searchQuery} onSearch={setSearchQuery} />
      <EmptyState message="You have not been assigned as a teacher yet." />
    </InnerTabCon>
  );

  if (subjectsLoading) return (
    <InnerTabCon>
      <TabHeader title="Subject Teacher" subtitle="Subjects you are assigned to teach" searchQuery={searchQuery} onSearch={setSearchQuery} />
      <div className="ta-loading">Loading subjects...</div>
    </InnerTabCon>
  );

  return (
    <InnerTabCon>
      <TabHeader title="Subject Teacher" subtitle="Subjects you are assigned to teach" searchQuery={searchQuery} onSearch={setSearchQuery} />
      {subjects.length === 0 ? (
        <EmptyState message="No subject assignments found." />
      ) : filtered.length === 0 ? (
        <EmptyState message="No subjects match your search." />
      ) : (
        <div className="ta-grid">
          {filtered.map((s) => (
            <button key={s.assignment_id} className="ta-card" onClick={() => onCardClick(s)}>
              <div className="ta-card-header">
                <div className="ta-card-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="3" width="16" height="16" rx="2.5" fill="#ffffff" opacity="0.9" />
                    <path d="M7 7h8M7 11h5M7 15h6" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <Badge active={s.is_active} />
              </div>
              <div className="ta-card-body">
                <p className="ta-card-title">{s.subject_name}</p>
                {s.subject_code && <p className="ta-card-code">{s.subject_code}</p>}
              </div>
              <div className="ta-card-footer">
                <span className="ta-card-meta-label">Class</span>
                <span className="ta-card-meta-value">{s.class_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Class Headmaster tab ── */
const ClassHeadmasterTab = ({ headmasterAssignments, onCardClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = headmasterAssignments.filter((hm) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      hm.class_name?.toLowerCase().includes(q) ||
      hm.class_code?.toLowerCase().includes(q) ||
      hm.session_name?.toLowerCase().includes(q)
    );
  });

  return (
    <InnerTabCon>
      <TabHeader title="Class Headmaster" subtitle="Classes you are assigned to manage" searchQuery={searchQuery} onSearch={setSearchQuery} />
      {headmasterAssignments.length === 0 ? (
        <EmptyState message="You have not been assigned as a class headmaster." />
      ) : filtered.length === 0 ? (
        <EmptyState message="No classes match your search." />
      ) : (
        <div className="ta-grid">
          {filtered.map((hm) => (
            <button key={hm.assignment_id} className="ta-card" onClick={() => onCardClick(hm)}>
              <div className="ta-card-header">
                <div className="ta-card-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 3l8 4-8 4-8-4 8-4z" fill="#ffffff" opacity="0.9" />
                    <path d="M3 11l8 4 8-4M3 15l8 4 8-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                  </svg>
                </div>
                <Badge active={hm.is_active} />
              </div>
              <div className="ta-card-body">
                <p className="ta-card-title">{hm.class_name}</p>
                {hm.class_code && <p className="ta-card-code">{hm.class_code}</p>}
              </div>
              <div className="ta-card-footer">
                <span className="ta-card-meta-label">Session</span>
                <span className="ta-card-meta-value">{hm.session_name || "—"}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </InnerTabCon>
  );
};

/* ── Main ── */
const Assignments = () => {
  const { user } = useAuth();
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const staffId = user?.staff?.staff_id;
  const schoolIdFromUser = user?.school?.school_id || schoolId;

  const { teacherAssignment, subjects, headmasterAssignments, loading, subjectsLoading } =
    useTeacherAssignments(staffId, schoolIdFromUser);

  const handleSubjectClick = (s) => navigate(
    `/teacher/${schoolIdFromUser}/subject/${s.subject_id}/${s.assignment_id}`
  );
  const handleHeadmasterClick = (hm) => navigate(`/teacher/${schoolIdFromUser}/class/${hm.class_id}`);

  return (
    <StudentDetailTopTab
      title="My Assignments"
      subtitle="Your current teaching and headmaster assignments"
      route={[
        { label: "Subject Teacher",  link: "/subjects" },
        { label: "Class Headmaster", link: "/headmaster" },
      ]}
    >
      <div className="ta-content">
        {loading ? (
          <InnerTabCon><div className="ta-loading">Loading assignments...</div></InnerTabCon>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to={`/teacher/${schoolIdFromUser}/assignments/subjects`} replace />} />
            <Route path="/subjects" element={
              <SubjectTeacherTab
                teacherAssignment={teacherAssignment}
                subjects={subjects}
                subjectsLoading={subjectsLoading}
                onCardClick={handleSubjectClick}
              />
            } />
            <Route path="/headmaster" element={
              <ClassHeadmasterTab
                headmasterAssignments={headmasterAssignments}
                onCardClick={handleHeadmasterClick}
              />
            } />
          </Routes>
        )}
      </div>
    </StudentDetailTopTab>
  );
};

export default Assignments;
