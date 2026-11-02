import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ClassStudents.css";
import "../ClassTimetable/TimetableEditor.css";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import { useClassStudents } from "../../../../../api_call/useClassStudents";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";

const STUDENT_SEARCH_KEYS = ["label", "admission"];

const API = import.meta.env.VITE_API_BASE_URL;

const ClassStudents = ({ classData }) => {
  const { classId, subseasion, schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { makeClassStudentsFetcher } = useClassStudents();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const classInfo = classData?.class || classData || {};
  const className = [classInfo.class_name || classInfo.className, classInfo.class_section].filter(Boolean).join(" ") || "this class";

  const fetchData = makeClassStudentsFetcher(classId, subseasion);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      try {
        let pageNum = 1;
        let all = [];
        let more = true;
        while (more && pageNum <= 8) {
          const params = new URLSearchParams({ page: pageNum, limit: 50 });
          const res = await fetch(`${API}/api/class-students/${classId}/subsession/${subseasion}/candidates?${params}`);
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Could not load students");
          all = all.concat(data.data || []);
          more = !!data.pagination?.hasNextPage;
          pageNum += 1;
        }
        if (!cancelled) setRows(all);
      } catch (err) {
        if (!cancelled) addNotification(err.message || "Could not load students", "error");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, classId, subseasion]);

  const studentOptions = useMemo(() => rows.map((student) => ({
    value: String(student.student_id),
    label: student.full_name || "Student",
    admission: student.admission_number || "",
    subtitle: student.current_class
      ? `${student.admission_number || "No admission number"} · Currently in ${student.current_class}`
      : `${student.admission_number || "No admission number"} · Not in a class this session`,
  })), [rows]);

  const toggleStudent = (id) => {
    const key = String(id);
    setPicked((prev) => {
      if (prev.some((student) => String(student.student_id) === key)) {
        return prev.filter((student) => String(student.student_id) !== key);
      }
      const student = rows.find((item) => String(item.student_id) === key);
      return student ? [...prev, student] : prev;
    });
  };

  const closePanel = () => {
    setOpen(false);
    setPicked([]);
    setRows([]);
  };

  const addStudents = async () => {
    if (!picked.length) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/class-students/${classId}/subsession/${subseasion}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_ids: picked.map((student) => student.student_id),
          assigned_by: user?.admin?.admin_id || user?.user_id || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Could not add students");
      addNotification(data.message || "Students added", "success");
      closePanel();
      setReloadKey((n) => n + 1);
    } catch (err) {
      addNotification(err.message || "Could not add students", "error");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      label: "Student",
      accessor: "full_name",
      render: (val, row) => (
        <div className="cls-name-cell">
          <div className="cls-avatar">
            {row.student_photo
              ? <img src={row.student_photo} alt={val} />
              : (val || "?").charAt(0).toUpperCase()
            }
          </div>
          <span className="cls-student-name">{val}</span>
        </div>
      ),
    },
    { label: "Admission No.", accessor: "admission_number" },
    { label: "Gender",        accessor: "gender" },
    {
      label: "Date of Birth",
      accessor: "date_of_birth",
      searchable: false,
      render: (val) =>
        val
          ? new Date(val).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
          : "—",
    },
    { label: "Phone",         accessor: "phone" },
    { label: "Guardian",      accessor: "guardian_name" },
    { label: "Guardian Phone", accessor: "guardian_phone" },
    {
      label: "Status",
      accessor: "student_status",
      searchable: false,
      render: (val) => (
        <span className={`cls-status ${val === "active" ? "active" : "inactive"}`}>
          {val}
        </span>
      ),
    },
    {
      label: "",
      accessor: "actions",
      searchable: false,
      render: (_, row) => (
        <span
          className="cls-action-link"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/${schoolId}/Profile/${row.student_id}`); }}
        >
          View Profile
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      ),
    },
  ];

  return (
    <InnerTabCon>
      <div className="classStudents">

        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Students</h2>
            <p className="cls-subtitle">All students assigned to this class for this term</p>
          </div>
          <Button onClick={() => { setLoadingList(true); setOpen(true); }}>Add students</Button>
        </div>

        <div className="cls-table-container">
          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            onRowClick={(row) => navigate(`/admin/${schoolId}/Profile/${row.student_id}`)}
            enableSelect={true}
            showcreatbut={false}
            initialPageSize={20}
            reloadKey={`${classId}-${subseasion}-${reloadKey}`}
          />
        </div>

      </div>

      <SlideInMenu isShow={open} onClose={closePanel} position="rightt" width="620px">
        <div className="timetable-editor">
          <div className="te-header">
            <span className="te-header-deco" aria-hidden="true" />
            <span className="te-header-deco2" aria-hidden="true" />
            <div className="te-header-content">
              <div className="te-header-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="8" cy="7" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="15" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M3.5 17.5c.6-2.4 2.4-3.7 4.5-3.7s3.9 1.3 4.5 3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M13 13.8c1.5-.2 3 .6 3.8 2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="te-title">Add students</h2>
                <p className="te-subtitle">Assign students to {className}</p>
              </div>
            </div>
          </div>

          <div className="te-content">
            <div className="te-form">
              <div className="te-form-head">
                <div className="te-form-head-text">
                  <h3 className="te-form-title">Choose students</h3>
                  <p className="te-form-sub">Search by name or admission number. You can pick more than one.</p>
                </div>
              </div>

              <div className="te-form-sections">
                <section className="te-form-section">
                  <div className="te-form-section-label">Who</div>
                  <div className="te-form-section-body">
                    <div className="te-field te-full">
                      <label className="te-field-label">Students</label>
                      {loadingList ? (
                        <p className="te-form-sub">Loading students...</p>
                      ) : (
                        <SearchableSelect
                          placeholder="Search and select students..."
                          options={studentOptions}
                          value=""
                          onChange={toggleStudent}
                          displayKey="label"
                          valueKey="value"
                          searchKeys={STUDENT_SEARCH_KEYS}
                          maxDisplayItems={8}
                        />
                      )}
                      {picked.length > 0 && (
                        <div className="te-subjects-list">
                          {picked.map((student) => (
                            <div key={student.student_id} className="te-subject-tag">
                              <span>{student.full_name}</span>
                              <button
                                type="button"
                                className="te-remove-subject"
                                onClick={() => toggleStudent(student.student_id)}
                                aria-label={`Remove ${student.full_name}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {!loadingList && rows.length === 0 && (
                        <p className="te-form-sub">No students to add.</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="te-form-section">
                  <div className="te-form-section-label">Note</div>
                  <div className="te-form-section-body">
                    <div className="te-ai-info">
                      <p>If a student is already assigned to a class in this session, that class will be changed to this one.</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          <div className="te-actions">
            <button type="button" className="te-secondary-btn" onClick={closePanel} disabled={saving}>Cancel</button>
            <button
              type="button"
              className={`te-add-btn${!picked.length || saving ? " disabled" : ""}`}
              onClick={addStudents}
              disabled={!picked.length || saving}
            >
              {saving ? "Adding..." : picked.length ? `Add ${picked.length}` : "Add"}
            </button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default ClassStudents;
