import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useSubsession } from "../../../../../../api_call/useSubsession";
import useStudentClassAssignment from "../../../../../../api_call/useStudentClassAssignment";
import { useClassSubjects } from "../../../../../../api_call/useClassSubjects";
import { useSubjectBooks } from "../../../../../../api_call/useSubjectBooks";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../../../components/infoField/InfoField";
import Button from "../../../../../../components/Button/Button";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import "../../../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "./ClassSubjects.css";

const ClassSubjects = () => {
  const { subseasion } = useParams();
  const { user } = useAuth();
  const { getSubsessionById } = useSubsession();
  const { getAllByClass } = useClassSubjects();
  const { getBooksBySubject } = useSubjectBooks();

  const studentId = user?.student?.student_id;

  const [sessionId, setSessionId]             = useState(null);
  const [subsessionInfo, setSubsessionInfo]   = useState(null);
  const [subLoading, setSubLoading]           = useState(true);
  const [subjects, setSubjects]               = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [booksMap, setBooksMap]               = useState({});
  const [selected, setSelected]               = useState(null);

  useEffect(() => {
    if (!subseasion) return;
    setSubLoading(true);
    getSubsessionById(subseasion).then((res) => {
      if (res.success) { setSessionId(res.data?.session_id); setSubsessionInfo(res.data); }
      setSubLoading(false);
    });
  }, [subseasion]);

  const { assignment, loading: assignLoading } = useStudentClassAssignment(studentId, sessionId);

  useEffect(() => {
    if (!assignment?.class_id) return;
    setSubjectsLoading(true);
    getAllByClass(assignment.class_id).then((res) => {
      const data = res.data || [];
      setSubjects(data);
      setSubjectsLoading(false);
      Promise.all(
        data.map((s) =>
          getBooksBySubject(s.subject_id).then((r) => ({
            id: s.subject_id,
            books: (r.success ? r.data || [] : []).filter((b) => b.is_active),
          }))
        )
      ).then((results) => {
        const map = {};
        results.forEach(({ id, books }) => { map[id] = books; });
        setBooksMap(map);
      });
    });
  }, [assignment?.class_id]);

  const loading = subLoading || assignLoading || subjectsLoading;

  if (loading) return <LoadingData message="Loading subjects..." />;

  return (
    <InnerTabCon>
      <div className="classSubjects">
        <div className="csHeader">
          <div className="csHeaderLeft">
            <h2 className="csTitle">Subjects</h2>
            <p className="csSubtitle">
              {assignment?.class_name} · {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="cs-panel-empty">No subjects found for this class.</div>
        ) : (
          <div className="csTableContainer">
            <div className="cs-subjects-grid">
              {subjects.map((s) => {
                const books = booksMap[s.subject_id] || [];
                return (
                  <div key={s.subject_id} className="cs-subject-card" onClick={() => setSelected(s)}>
                    <div className="cs-subject-card-header">
                      <div className="cs-subject-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="cs-subject-card-info">
                        <p className="cs-subject-name">{s.subject_name}</p>
                        <span className="cs-subject-code">{s.subject_code}</span>
                      </div>
                    </div>
                    {s.teacher_name && (
                      <p className="cs-subject-teacher">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {s.teacher_name}
                      </p>
                    )}
                    <div className="cs-subject-card-footer">
                      <span className="cs-subject-books">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        {books.length > 0 ? `${books.length} book${books.length > 1 ? "s" : ""}` : "No books"}
                      </span>
                      <span className="cs-action-link">
                        View
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail panel */}
      <SlideInMenu isShow={!!selected} onClose={() => setSelected(null)} width="480px">
        {selected && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true"/>
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>{selected.subject_name}</h2>
                  <p>{selected.subject_code}</p>
                </div>
              </div>
            </div>
            <div className="cs-panel-body">
              <div className="cs-panel-grid">
                <InfoField label="Subject Name"  value={selected.subject_name} />
                <InfoField label="Subject Code"  value={selected.subject_code} />
                <InfoField label="Teacher"       value={selected.teacher_name} />
                <InfoField label="Teacher Email" value={selected.teacher_email} />
              </div>

              {/* Books */}
              {(booksMap[selected.subject_id] || []).length > 0 && (
                <>
                  <span className="sc-section-label">
                    Books ({(booksMap[selected.subject_id] || []).length})
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(booksMap[selected.subject_id] || []).map((b) => (
                      <div key={b.book_id} className="cs-history-card">
                        <div className="cs-history-card-top">
                          <div className="cs-history-card-info">
                            <div className="cs-history-icon">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                            <div style={{ flex: 1 }}>
                              <p className="cs-history-name">{b.title}</p>
                              {b.author && <p className="cs-history-code">by {b.author}</p>}
                            </div>
                          </div>
                          {b.type && <span className="cs-status inactive" style={{ textTransform: "none", flexShrink: 0 }}>{b.type}</span>}
                        </div>
                        {/* Extra info */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
                          {b.publisher        && <span style={{ fontSize: 11, color: "#888" }}>Publisher: <strong style={{ color: "#333" }}>{b.publisher}</strong></span>}
                          {b.edition          && <span style={{ fontSize: 11, color: "#888" }}>Edition: <strong style={{ color: "#333" }}>{b.edition}</strong></span>}
                          {b.publication_year && <span style={{ fontSize: 11, color: "#888" }}>Year: <strong style={{ color: "#333" }}>{b.publication_year}</strong></span>}
                          {b.isbn             && <span style={{ fontSize: 11, color: "#888" }}>ISBN: <strong style={{ color: "#333" }}>{b.isbn}</strong></span>}
                          {b.language         && <span style={{ fontSize: 11, color: "#888" }}>Language: <strong style={{ color: "#333" }}>{b.language}</strong></span>}
                          {b.level            && <span style={{ fontSize: 11, color: "#888" }}>Level: <strong style={{ color: "#333" }}>{b.level}</strong></span>}
                          {b.price            && <span style={{ fontSize: 11, color: "#888" }}>Price: <strong style={{ color: "#333" }}>₦{b.price}</strong></span>}
                        </div>
                        {b.description && (
                          <p style={{ fontSize: 12, color: "#666", marginTop: 6, lineHeight: 1.5 }}>{b.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {(booksMap[selected.subject_id] || []).length === 0 && (
                <p className="cs-panel-empty">No books assigned to this subject.</p>
              )}
            </div>
            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default ClassSubjects;
