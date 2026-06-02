import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import Button from "../../../../components/Button/Button";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import useAlumni from "../../../../api_call/useAlumni";
import { useSession } from "../../../../api_call/useSession";
import "./AlumniDashboard.css";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";

const AlumniDashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { getAlumniPaginated, getAlumniBySchool, createAlumni, getStudentsBySchool } = useAlumni();
  const { getActiveSession } = useSession();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.graduate?.create;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState("All");
  const [graduationYears, setGraduationYears] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshTable, setRefreshTable] = useState(0);
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentsRaw, setStudentsRaw] = useState([]);

  const [formData, setFormData] = useState({
    selectedStudent: null,
    contactEmail: "",
    contactPhone: "",
    currentAddress: "",
    notes: "",
  });

  useEffect(() => {
    if (!schoolId) return;
    getAlumniBySchool(schoolId).then((res) => {
      if (res.success) {
        const years = [
          ...new Set(
            (res.data || []).map((a) =>
              a.graduation_date ? new Date(a.graduation_date).getFullYear().toString() : null
            ).filter(Boolean)
          ),
        ].sort((a, b) => b - a);
        setGraduationYears(years);
        setTotalCount(res.data?.length || 0);
      }
    });
  }, [schoolId, refreshTable]);

  const fetchData = useCallback(async (params) => {
    const result = await getAlumniPaginated(schoolId, {
      ...params,
      year: selectedYear === "All" ? "" : selectedYear,
    });
    if (result.success) {
      return {
        success: true,
        data: result.data.map((a) => ({
          alumni_id: a.alumni_id,
          fullName: a.student_name || "—",
          graduationYear: a.graduation_date ? new Date(a.graduation_date).getFullYear() : "—",
          finalClass: a.final_class_name || "—",
          contactEmail: a.contact_email || "—",
          contactPhone: a.contact_phone || "—",
          gender: a.gender || "—",
          graduation_date: a.graduation_date,
          _raw: a,
        })),
        pagination: result.pagination,
      };
    }
    return result;
  }, [schoolId, selectedYear, getAlumniPaginated]);

  const columns = [
    {
      label: "Name",
      accessor: "fullName",
      render: (v) => <span className="mm-col-name">{v}</span>,
    },
    {
      label: "Graduation Year",
      accessor: "graduationYear",
      render: (v) => <span className="mm-col-year">{v}</span>,
    },
    {
      label: "Final Class",
      accessor: "finalClass",
      render: (v) => <span className="mm-col-class">{v}</span>,
    },
    {
      label: "Contact",
      accessor: "contactEmail",
      render: (v, row) => (
        <div className="mm-col-contact">
          <span className="mm-col-contact-email">{v}</span>
          <span className="mm-col-contact-phone">{row.contactPhone}</span>
        </div>
      ),
    },
    {
      label: "Gender",
      accessor: "gender",
      render: (v) => <span className="mm-col-gender">{v}</span>,
    },
  ];

  const handleCreate = () => {
    if (!canCreate) { addNotification("You do not have permission to add alumni.", "error"); return; }
    if (studentOptions.length === 0) {
      getStudentsBySchool(schoolId).then((res) => {
        if (res.success) {
          setStudentsRaw(res.data || []);
          setStudentOptions(
            (res.data || []).map((s) => ({
              value: s.student_id,
              label: s.full_name || s.student_name || "Unknown",
              subtitle: `${s.admission_number || ""} · ${s.current_class || ""}`.trim().replace(/^·\s*/, ""),
            }))
          );
        }
      });
    }
    setIsCreateMenuOpen(true);
  };

  const handleSubmitAlumni = async () => {
    if (!formData.selectedStudent) { addNotification("Please select a student", "error"); return; }
    const sessionRes = await getActiveSession(schoolId);
    const activeSession = sessionRes.success ? sessionRes.data?.session : null;
    if (!activeSession) { addNotification("No active session found.", "error"); return; }
    const student = studentsRaw.find((s) => s.student_id === formData.selectedStudent.id);
    const currentYear = new Date().getFullYear();
    const result = await createAlumni({
      student_id: formData.selectedStudent.id,
      school_id: schoolId,
      graduation_session_id: activeSession.session_id,
      graduation_session_name: activeSession.session_name,
      graduation_date: `${currentYear}-06-30`,
      final_class: student?.current_class || null,
      final_class_name: student?.current_class || null,
      contact_email: formData.contactEmail,
      contact_phone: formData.contactPhone,
      contact_address: formData.currentAddress,
      remarks: formData.notes,
      created_by: user?.admin?.admin_id || user?.user_id,
    });
    if (result.success) {
      addNotification("Alumni added successfully", "success");
      setRefreshTable((k) => k + 1);
      setIsCreateMenuOpen(false);
      setFormData({ selectedStudent: null, contactEmail: "", contactPhone: "", currentAddress: "", notes: "" });
    } else {
      addNotification(result.message || "Failed to add alumni", "error");
    }
  };

  const handleStudentSelect = (studentId) => {
    const student = studentsRaw.find((s) => s.student_id === studentId);
    if (student) {
      setFormData((prev) => ({
        ...prev,
        selectedStudent: { id: student.student_id, fullName: student.full_name, currentClass: student.current_class, email: student.email, phone: student.phone, gender: student.gender },
        contactEmail: student.email || "",
        contactPhone: student.phone || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, selectedStudent: null, contactEmail: "", contactPhone: "" }));
    }
  };

  return (
    <div className="mm-alumni-dashboard">

      {/* Year filter tabs with title */}
      <div className="mm-year-filter">
        <div className="mm-year-filter-top">
          <div className="mm-year-filter-text">
            <h2 className="mm-alumni-title">Alumni Directory</h2>
            <p className="mm-alumni-subtitle">Manage and track your school's alumni network</p>
          </div>
        </div>
        <div className="mm-year-tabs">
          <button
            className={`mm-year-tab ${selectedYear === "All" ? "active" : ""}`}
            onClick={() => setSelectedYear("All")}
          >
            All ({totalCount})
          </button>
          {graduationYears.map((year) => (
            <button
              key={year}
              className={`mm-year-tab ${selectedYear === year.toString() ? "active" : ""}`}
              onClick={() => setSelectedYear(year.toString())}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      <InnerTabCon>
        {/* Stats */}
        <div className="mm-alumni-stats">
          <div className="mm-stat-card">
            <span className="mm-stat-number">{totalCount}</span>
            <span className="mm-stat-label">
              {selectedYear === "All" ? "Total Alumni" : `Alumni from ${selectedYear}`}
            </span>
          </div>
          <div className="mm-stat-card">
            <span className="mm-stat-number">{graduationYears.length}</span>
            <span className="mm-stat-label">Graduation Years</span>
          </div>
        </div>

        <ServerSmartTable
          key={`${selectedYear}-${refreshTable}`}
          columns={columns}
          fetchData={fetchData}
          onRowClick={(row) => navigate(`/admin/${schoolId}/alumni/profile/${row.alumni_id}`)}
          enableSelect={true}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="+ Add Manual Alumni"
          reloadKey={refreshTable}
        />
      </InnerTabCon>

      {/* Add Alumni Panel */}
      <SlideInMenu isShow={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} width="600px">
        <div className="mm-create-panel">
          <div className="mm-create-panel-header">
            <span className="mm-create-panel-deco" aria-hidden="true" />
            <div className="mm-create-panel-header-content">
              <div className="mm-create-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="mm-create-panel-header-text">
                <h2>Add Manual Alumni</h2>
                <p>Add alumni records for graduates not in the system</p>
              </div>
            </div>
          </div>

          <div className="mm-create-panel-body">
            <SearchableSelect
              label="Select Student"
              placeholder="Search by name or student ID..."
              options={studentOptions}
              value={formData.selectedStudent?.id || ""}
              onChange={handleStudentSelect}
              searchable={true}
            />

            {formData.selectedStudent && (
              <div className="mm-selected-student">
                <h4 className="mm-selected-student-name">{formData.selectedStudent.fullName}</h4>
                <div className="mm-selected-student-details">
                  <span>Class: {formData.selectedStudent.currentClass}</span>
                  <span>Gender: {formData.selectedStudent.gender}</span>
                  <span>Email: {formData.selectedStudent.email}</span>
                  <span>Phone: {formData.selectedStudent.phone}</span>
                </div>
              </div>
            )}

            <div className="mm-form-row">
              <FormInput label="Contact Email" type="email" value={formData.contactEmail}
                onChange={(v) => setFormData((p) => ({ ...p, contactEmail: v }))} placeholder="Enter email address" />
              <FormInput label="Contact Phone" type="text" value={formData.contactPhone}
                onChange={(v) => setFormData((p) => ({ ...p, contactPhone: v }))} placeholder="Enter phone number" />
            </div>

            <FormInput label="Current Address" type="text" value={formData.currentAddress}
              onChange={(v) => setFormData((p) => ({ ...p, currentAddress: v }))} placeholder="Enter current address" />

            <FormInput label="Notes" type="textarea" value={formData.notes}
              onChange={(v) => setFormData((p) => ({ ...p, notes: v }))} placeholder="Additional notes..." height="60px" />
          </div>

          <div className="mm-create-panel-footer">
            <Button variant="secondary" onClick={() => setIsCreateMenuOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitAlumni} disabled={!formData.selectedStudent}>Add Alumni</Button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default AlumniDashboard;
