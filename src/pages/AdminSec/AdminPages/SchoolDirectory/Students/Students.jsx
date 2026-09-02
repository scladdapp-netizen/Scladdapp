import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import {
  FaArrowRight,
  FaKey,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
  FaCopy,
  FaClock,
  FaPlus,
  FaTrash,
  FaStar,
} from "react-icons/fa";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import {
  useCreateOrEnrollStudent,
  useFetchStudents,
  useFetchStudentsPaginated,
  useClass,
  useSession,
  useSubsession,
} from "../../../../../api_call";
import { updateApplicationStatus } from "../../../../../api_call/useApplicationForm";
import { buildStudentPrefillFromApplication } from "../../../../../utils/applicationToStudentPrefill";
import "./Students.css";

const EMPTY_NEW_STUDENT_FORM = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  email: "",
  phone: "",
  whatsapp: "",
  religion: "",
  nationality: "",
  stateOfOrigin: "",
  placeOfBirth: "",
  lgaOfOrigin: "",
  tribe: "",
  nin: "",
  numberOfSiblings: "",
  familyPosition: "",
  livesWith: "",
  bloodGroup: "",
  genotype: "",
  houseNumberStreet: "",
  areaEstate: "",
  city: "",
  lgaOfResidence: "",
  stateOfResidence: "",
  landmark: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactWhatsapp: "",
  emergencyContactRelationship: "",
};

const emptyGuardian = (isPrimary = true) => ({
  id: Date.now() + Math.random(),
  guardianName: "",
  guardianRelationship: "",
  guardianPhone: "",
  guardianWhatsapp: "",
  guardianEmail: "",
  guardianAddress: "",
  guardianOccupation: "",
  isPrimary,
});

const composeResidenceAddress = (f) =>
  [
    f.houseNumberStreet,
    f.areaEstate,
    f.city,
    f.lgaOfResidence,
    f.stateOfResidence,
    f.landmark,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ") || null;

const Students = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const admitHandledRef = useRef(false);
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.students?.create;

  // Use the custom hooks for API calls
  const { loading, error, createStudent, enrollExistingStudent, clearError } =
    useCreateOrEnrollStudent();

  const {
    loading: loadingStudents,
    error: fetchError,
    getStudentById,
    getAdmissionsByStudentId,
  } = useFetchStudents();

  const { getStudentsPaginated } = useFetchStudentsPaginated();
  
  const { getClassesBySchoolId } = useClass();
  
  const { getActiveSession, getSessionsBySchool } = useSession();
  
  const { getSubsessionsBySessionId } = useSubsession();

  const [showNewStudentMenu, setShowNewStudentMenu] = useState(false);
  const [showPendingStudentsMenu, setShowPendingStudentsMenu] = useState(false);
  const [enrollmentMethod, setEnrollmentMethod] = useState(""); // "key" or "create"
  const [searchStudentId, setSearchStudentId] = useState(""); // Changed from enrollmentKey
  const [foundStudent, setFoundStudent] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [refreshTable, setRefreshTable] = useState(0); // Trigger to refresh table
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  
  // Classes state
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  
  // Active session state
  const [activeSession, setActiveSession] = useState(null);
  const [activeSubsession, setActiveSubsession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [noActiveSession, setNoActiveSession] = useState(false);
  
  // All sessions/subsessions for selection when no active session
  const [allSessions, setAllSessions] = useState([]);
  const [allSubsessions, setAllSubsessions] = useState([]);
  const [selectedSessionForStudent, setSelectedSessionForStudent] = useState("");
  const [selectedSubsessionForStudent, setSelectedSubsessionForStudent] = useState("");

  // New student form data
  const [newStudentForm, setNewStudentForm] = useState({ ...EMPTY_NEW_STUDENT_FORM });

  // Multiple guardians state
  const [guardians, setGuardians] = useState([emptyGuardian(true)]);
  const [admitApplicationId, setAdmitApplicationId] = useState(null);

  // Memoize class options to prevent infinite re-renders
  const classOptions = useMemo(() => {
    return classes.map((cls) => ({
      value: cls.class_id,
      label: `${cls.class_name}${cls.stream ? ` - ${cls.stream}` : ''}`,
    }));
  }, [classes]);

  // Function to fetch students from backend (server-side pagination)
  const fetchStudentsData = useCallback(
    async (params) => {
      console.log("\n========== FRONTEND FETCH DEBUG ==========");
      console.log("Fetching students with params:", params);

      const result = await getStudentsPaginated(schoolId, params);

      console.log("Backend response:", result);

      if (result.success && result.data) {
        console.log(`Received ${result.data.length} students from backend`);
        console.log("First student raw data:", result.data[0]);

        // Map backend data to frontend format for ServerSmartTable
        const mappedStudents = result.data.map((student) => ({
          studentId: student.student_id,
          photo: student.student_photo,
          name: student.full_name,
          email: student.email,
          phone: student.phone || "N/A",
          dob: student.date_of_birth,
          gender: student.gender,
          currentClass: student.current_class_name || "Not Assigned",
          currentClassStream: student.current_class_stream,
          classAssignmentMethod: student.class_assignment_method,
          classAssignmentSession: student.class_assignment_session,
          isClassFromPastSession: student.is_class_from_past_session,
          currentSessionExists: student.current_session_exists,
          admissionDate: student.admitted_date,
          guardianName: student.guardian_name,
          contact: student.emergency_contact_phone || "N/A",
          status: student.status, // "Active" or "Inactive"
          admissionId: student.admission_id,
          activeStatus: student.active_status,
        }));

        console.log("First student mapped data:", mappedStudents[0]);
        console.log(
          "Guardian name in mapped data:",
          mappedStudents[0]?.guardianName
        );
        console.log("==========================================\n");

        return {
          success: true,
          data: mappedStudents,
          pagination: result.pagination,
        };
      }

      return result;
    },
    [schoolId, getStudentsPaginated]
  );

  // Updated columns with Email and Phone instead of Class and Section
  const columns = [
    {
      label: "ID",
      accessor: "studentId",
      render: (v) => <span className="std-mono">{v}</span>,
    },
    {
      label: "Passport",
      accessor: "photo",
      render: (v, row) => (
        <div className="std-avatar-wrap">
          {v ? (
            <>
              <img src={v} className="std-avatar"
                onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }} />
              <div className="std-avatar-fallback" style={{ display: "none" }}>
                {v.split("/").pop().charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <div className="std-avatar-fallback">?</div>
          )}
        </div>
      ),
    },
    {
      label: "Name",
      accessor: "name",
      render: (v) => <span className="std-name">{v}</span>,
    },
    {
      label: "Class",
      accessor: "currentClass",
      render: (v, row) => {
        if (!v || v === "Not Assigned") {
          return <span className="std-badge std-badge-danger">Not Assigned</span>;
        }
        const displayText = row.currentClassStream ? `${v} - ${row.currentClassStream}` : v;
        const isPastWarning = row.isClassFromPastSession && row.currentSessionExists;
        const methodColor = { admission: "std-badge-green", promotion: "std-badge-blue", demotion: "std-badge-yellow" };
        return (
          <div className={`std-class-cell${isPastWarning ? " std-class-past" : ""}`}>
            <span className="std-class-name">{displayText}</span>
            {row.classAssignmentSession && (
              <span className={`std-class-session${isPastWarning ? " std-class-session-warn" : ""}`}>
                {row.classAssignmentSession}{isPastWarning && " (Past)"}
              </span>
            )}
            {row.classAssignmentMethod && !isPastWarning && (
              <span className={`std-badge ${methodColor[row.classAssignmentMethod] || "std-badge-gray"}`}>
                {row.classAssignmentMethod}
              </span>
            )}
          </div>
        );
      },
    },
    { label: "Gender", accessor: "gender" },
    {
      label: "Date of Admission",
      accessor: "admissionDate",
      render: (v) => (v ? new Date(v).toLocaleDateString() : "N/A"),
    },
    {
      label: "Guardian Name",
      accessor: "guardianName",
      render: (v) => v || "N/A",
    },
    {
      label: "Status",
      accessor: "status",
      render: (v) => (
        <span className={`std-badge ${v === "Active" ? "std-badge-green" : "std-badge-danger"}`}>{v}</span>
      ),
    },
  ];

  const handleBulkDelete = async (ids) => {
    // call your API to delete; return when done
    console.log("delete", ids);
    // example: await api.deleteMany(ids)
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
    // show spinner, call backend to build CSV/XLSX etc.
  };

  const handleCreate = async () => {
    if (!canCreate) {
      addNotification("You do not have permission to add students.", "error");
      return;
    }
    setShowNewStudentMenu(true);
    await checkActiveSession();
    await loadClasses();
  };

  const checkActiveSession = async () => {
    setLoadingSession(true);
    try {
      const result = await getActiveSession(schoolId);
      if (result.success && result.data.session) {
        setActiveSession(result.data.session);
        setActiveSubsession(result.data.subsession);
        setNoActiveSession(false);
      } else {
        // No active session, fetch all sessions to let user choose
        setActiveSession(null);
        setActiveSubsession(null);
        setNoActiveSession(true);
        
        // Fetch all sessions for this school
        const sessionsResult = await getSessionsBySchool(schoolId);
        if (sessionsResult.success && sessionsResult.data) {
          // Filter out archived sessions
          const availableSessions = sessionsResult.data.filter(s => !s.is_archived);
          
          if (availableSessions.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Separate past and future sessions
            const pastSessions = availableSessions
              .filter(s => new Date(s.academic_year_end_date) < today)
              .sort((a, b) => new Date(b.academic_year_end_date) - new Date(a.academic_year_end_date));
            
            const futureSessions = availableSessions
              .filter(s => new Date(s.academic_year_start_date) > today)
              .sort((a, b) => new Date(a.academic_year_start_date) - new Date(b.academic_year_start_date));
            
            // Get immediate past (most recent ended session)
            const immediatePast = pastSessions.length > 0 ? pastSessions[0] : null;
            
            // Get immediate upcoming (next session to start)
            const immediateUpcoming = futureSessions.length > 0 ? futureSessions[0] : null;
            
            setAllSessions([immediatePast, immediateUpcoming].filter(Boolean));
            
            // DO NOT auto-select - user must choose manually
            setSelectedSessionForStudent("");
            setSelectedSubsessionForStudent("");
            setAllSubsessions([]);
          } else {
            setAllSessions([]);
          }
        } else {
          setAllSessions([]);
        }
      }
    } catch (error) {
      console.error("Error checking active session:", error);
      setNoActiveSession(true);
      setAllSessions([]);
    } finally {
      setLoadingSession(false);
    }
  };
  
  const loadSubsessionsForSession = async (sessionId) => {
    try {
      const result = await getSubsessionsBySessionId(sessionId);
      if (result.success && result.data) {
        // Filter out archived subsessions and sort by date
        const availableSubsessions = result.data
          .filter(sub => !sub.is_archived)
          .sort((a, b) => new Date(b.term_start_date) - new Date(a.term_start_date));
        
        setAllSubsessions(availableSubsessions);
        
        // DO NOT auto-select - user must choose manually
        setSelectedSubsessionForStudent("");
      } else {
        setAllSubsessions([]);
        setSelectedSubsessionForStudent("");
      }
    } catch (error) {
      console.error("Error loading subsessions:", error);
      setAllSubsessions([]);
      setSelectedSubsessionForStudent("");
    }
  };
  
  const handleSessionChange = async (sessionId) => {
    setSelectedSessionForStudent(sessionId);
    if (sessionId) {
      await loadSubsessionsForSession(sessionId);
    } else {
      setAllSubsessions([]);
      setSelectedSubsessionForStudent("");
    }
  };

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const result = await getClassesBySchoolId(schoolId);
      if (result.success) {
        const classList = result.data || [];
        setClasses(classList);
        return classList;
      }
      addNotification(result.message || "Failed to load classes", "error");
      setClasses([]);
      return [];
    } catch (error) {
      console.error("Error loading classes:", error);
      addNotification("Failed to load classes", "error");
      setClasses([]);
      return [];
    } finally {
      setLoadingClasses(false);
    }
  };

  useEffect(() => {
    const payload = location.state?.admitFromApplication;
    if (!payload?.applicationId || admitHandledRef.current) return;

    admitHandledRef.current = true;

    const openAdmitFlow = async () => {
      if (!canCreate) {
        addNotification("You do not have permission to add students.", "error");
        return;
      }

      setShowNewStudentMenu(true);
      await checkActiveSession();
      const classList = await loadClasses();

      const prefill = buildStudentPrefillFromApplication(
        {
          application_id: payload.applicationId,
          data: payload.data || {},
          files: payload.files || {},
        },
        classList
      );

      setNewStudentForm({ ...EMPTY_NEW_STUDENT_FORM, ...prefill.form });
      setGuardians(prefill.guardians);
      setSelectedClass(prefill.selectedClassId || "");
      setAdmitApplicationId(prefill.applicationId);
      setEnrollmentMethod("create");

      if (prefill.photoUrl) {
        try {
          const res = await fetch(prefill.photoUrl);
          const blob = await res.blob();
          const ext = blob.type?.includes("png") ? "png" : "jpg";
          const file = new File([blob], `application-photo.${ext}`, { type: blob.type || "image/jpeg" });
          setProfilePhotoFile(file);
          setProfilePhotoPreview(prefill.photoUrl);
        } catch (_) {
          setProfilePhotoPreview(prefill.photoUrl);
        }
      }

      navigate(location.pathname, { replace: true, state: {} });
      addNotification("Application data loaded. Review and complete admission.", "success");
    };

    openAdmitFlow();
  }, [location.state, schoolId, canCreate, navigate, location.pathname, addNotification]);

  const handleAddStudent = () => {
    console.log("Add Student button clicked");
  };

  const handleSearchByKey = async () => {
    if (!searchStudentId.trim()) {
      addNotification("Please enter a student ID", "error");
      return;
    }

    try {
      // Call real API to search for student by ID
      const result = await getStudentById(searchStudentId.trim());

      if (result.success && result.data) {
        // Check if student is already enrolled in THIS school
        const admissionsResult = await getAdmissionsByStudentId(
          searchStudentId.trim()
        );

        if (admissionsResult.success && admissionsResult.data) {
          // Check if student has an active admission in THIS school
          const activeAdmissionInThisSchool = admissionsResult.data.find(
            (admission) =>
              admission.school_id === schoolId &&
              admission.active_status === true
          );

          if (activeAdmissionInThisSchool) {
            // Student is already enrolled - show error and don't display student info
            addNotification(
              `${result.data.full_name} is already enrolled in this school. The student has an active admission record.`,
              "error"
            );
            setFoundStudent(null);
            return;
          }
        }

        // Student is not enrolled - show student info
        const studentData = {
          fullName: result.data.full_name,
          studentId: result.data.student_id,
          dateOfBirth: result.data.date_of_birth,
          age: calculateAge(result.data.date_of_birth),
          gender: result.data.gender,
          guardianName: result.data.guardian_name || null,
          relationship: result.data.guardian_relationship || null,
          phone: result.data.guardian_phone || null,
          email: result.data.email,
          homeAddress: result.data.address || null,
          emergencyContact: result.data.emergency_contact_phone || null,
          permittedPickup: null, // Not in backend yet
          previousSchool: result.data.previous_school || null,
          currentClass: result.data.current_class || null,
        };

        setFoundStudent(studentData);
        addNotification(
          "Student found! Review the information below.",
          "success"
        );
      } else {
        addNotification(result.message || "Student not found", "error");
        setFoundStudent(null);
      }
    } catch (err) {
      console.error("Search student error:", err);
      addNotification("Failed to search for student", "error");
      setFoundStudent(null);
    }
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return `${age} years`;
  };

  const handleEnrollStudent = async () => {
    if (!foundStudent) return;

    // Validate class selection
    if (!selectedClass) {
      addNotification("Please select a class for the student", "error");
      return;
    }

    try {
      // Prepare enrollment data with session info
      const enrollmentData = {
        school_id: schoolId,
        admittedDate: new Date().toISOString().split("T")[0],
        admissionClass: selectedClass,
        admissionType: "new",
        updateStudentInfo: true,
        created_by: user?.admin?.admin_id || user?.user_id,
      };

      // Add session/subsession info based on what's available
      if (activeSession) {
        // Use active session
        enrollmentData.sessionId = activeSession.session_id;
        enrollmentData.sessionName = activeSession.session_name;
        enrollmentData.sessionCode = activeSession.session_code;
        enrollmentData.admissionSession = `${activeSession.session_name} (${activeSession.session_code})`;
        
        if (activeSubsession) {
          enrollmentData.subsessionId = activeSubsession.term_id;
          enrollmentData.subsessionName = activeSubsession.term_name;
          enrollmentData.subsessionCode = activeSubsession.term_code;
          enrollmentData.admissionTerm = activeSubsession.term_name;
        }
      } else if (selectedSessionForStudent && selectedSubsessionForStudent) {
        // Use manually selected session/subsession
        const selectedSession = allSessions.find(s => s.session_id === selectedSessionForStudent);
        const selectedSubsession = allSubsessions.find(sub => sub.term_id === selectedSubsessionForStudent);
        
        if (selectedSession) {
          enrollmentData.sessionId = selectedSession.session_id;
          enrollmentData.sessionName = selectedSession.session_name;
          enrollmentData.sessionCode = selectedSession.session_code;
          enrollmentData.admissionSession = `${selectedSession.session_name} (${selectedSession.session_code})`;
        }
        
        if (selectedSubsession) {
          enrollmentData.subsessionId = selectedSubsession.term_id;
          enrollmentData.subsessionName = selectedSubsession.term_name;
          enrollmentData.subsessionCode = selectedSubsession.term_code;
          enrollmentData.admissionTerm = selectedSubsession.term_name;
        }
      }

      console.log("Enrolling student with data:", enrollmentData);

      // Call real API to enroll existing student
      const result = await enrollExistingStudent(foundStudent.studentId, enrollmentData);

      if (result.success) {
        addNotification(
          `${foundStudent.fullName} has been successfully enrolled!`,
          "success"
        );

        // Reset form and close menu
        setShowNewStudentMenu(false);
        setSearchStudentId("");
        setFoundStudent(null);
        setEnrollmentMethod("");
        setSelectedClass("");
        setSelectedSessionForStudent("");
        setSelectedSubsessionForStudent("");

        // Refresh student list
        setRefreshTable((prev) => prev + 1);
      } else {
        addNotification(result.message || "Failed to enroll student", "error");
      }
    } catch (err) {
      console.error("Enroll student error:", err);
      addNotification("Failed to enroll student", "error");
    }
  };

  const handleCreateNewStudent = async () => {
    // Validate required fields
    const requiredFields = [
      "fullName",
      "dateOfBirth",
      "gender",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        !newStudentForm[field] || !newStudentForm[field].toString().trim()
    );

    if (missingFields.length > 0) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    // Validate guardians - at least one guardian with name and phone
    const validGuardians = guardians.filter(g => 
      g.guardianName.trim() && g.guardianPhone.trim()
    );

    if (validGuardians.length === 0) {
      addNotification("Please add at least one guardian with name and phone number", "error");
      return;
    }

    // Ensure there's a primary guardian
    const primaryGuardian = validGuardians.find(g => g.isPrimary);
    if (!primaryGuardian) {
      addNotification("Please select a primary guardian", "error");
      return;
    }

    // Validate class selection
    if (!selectedClass) {
      addNotification("Please select a class for the student", "error");
      return;
    }

    // Validate email format if provided
    if (newStudentForm.email && !isValidEmail(newStudentForm.email)) {
      addNotification("Please enter a valid email address", "error");
      return;
    }

    // Validate guardian emails if provided
    for (const guardian of validGuardians) {
      if (guardian.guardianEmail && !isValidEmail(guardian.guardianEmail)) {
        addNotification(`Please enter a valid email address for guardian: ${guardian.guardianName}`, "error");
        return;
      }
    }

    try {
      // Prepare data for backend API
      const studentData = {
        // Required fields
        fullName: newStudentForm.fullName.trim(),
        email: newStudentForm.email.trim() || `student${Date.now()}@temp.edu`,
        dateOfBirth: newStudentForm.dateOfBirth,
        gender: newStudentForm.gender,
        school_id: schoolId,

        // Personal information
        phone: newStudentForm.phone.trim() || null,
        whatsapp: newStudentForm.whatsapp.trim() || null,
        religion: newStudentForm.religion.trim() || null,
        nationality: newStudentForm.nationality.trim() || null,
        stateOfOrigin: newStudentForm.stateOfOrigin.trim() || null,
        placeOfBirth: newStudentForm.placeOfBirth.trim() || null,
        lgaOfOrigin: newStudentForm.lgaOfOrigin.trim() || null,
        tribe: newStudentForm.tribe.trim() || null,
        nin: newStudentForm.nin.trim() || null,
        numberOfSiblings: newStudentForm.numberOfSiblings.trim() || null,
        familyPosition: newStudentForm.familyPosition.trim() || null,
        livesWith: newStudentForm.livesWith || null,
        address: composeResidenceAddress(newStudentForm),
        houseNumberStreet: newStudentForm.houseNumberStreet.trim() || null,
        areaEstate: newStudentForm.areaEstate.trim() || null,
        city: newStudentForm.city.trim() || null,
        lgaOfResidence: newStudentForm.lgaOfResidence.trim() || null,
        stateOfResidence: newStudentForm.stateOfResidence.trim() || null,
        landmark: newStudentForm.landmark.trim() || null,
        bloodGroup: newStudentForm.bloodGroup || null,
        genotype: newStudentForm.genotype || null,

        // Admission information
        admissionDate: new Date().toISOString().split("T")[0],
        admissionClass: selectedClass, // Add selected class
        admissionType: "new",

        // Multiple guardians information
        guardians: validGuardians.map(guardian => ({
          guardianName: guardian.guardianName.trim(),
          guardianRelationship: guardian.guardianRelationship || null,
          guardianPhone: guardian.guardianPhone.trim(),
          guardianWhatsapp: (guardian.guardianWhatsapp || "").trim() || null,
          guardianEmail: guardian.guardianEmail.trim() || null,
          guardianAddress: guardian.guardianAddress.trim() || null,
          guardianOccupation: guardian.guardianOccupation.trim() || null,
          isPrimary: guardian.isPrimary,
        })),

        // Emergency contact
        emergencyContactName:
          newStudentForm.emergencyContactName.trim() || null,
        emergencyContactPhone:
          newStudentForm.emergencyContactPhone.trim() || null,
        emergencyContactWhatsapp:
          newStudentForm.emergencyContactWhatsapp.trim() || null,
        emergencyContactRelationship:
          newStudentForm.emergencyContactRelationship || null,

        // System fields
        created_by: user?.admin?.admin_id || user?.user_id,
      };

      // Add session/subsession info based on what's available
      if (activeSession) {
        // Use active session
        studentData.sessionId = activeSession.session_id;
        studentData.sessionName = activeSession.session_name;
        studentData.sessionCode = activeSession.session_code;
        studentData.admissionSession = `${activeSession.session_name} (${activeSession.session_code})`;
        
        if (activeSubsession) {
          studentData.subsessionId = activeSubsession.term_id;
          studentData.subsessionName = activeSubsession.term_name;
          studentData.subsessionCode = activeSubsession.term_code;
          studentData.admissionTerm = activeSubsession.term_name;
        }
      } else if (selectedSessionForStudent && selectedSubsessionForStudent) {
        // Use manually selected session/subsession
        const selectedSession = allSessions.find(s => s.session_id === selectedSessionForStudent);
        const selectedSubsession = allSubsessions.find(sub => sub.term_id === selectedSubsessionForStudent);
        
        if (selectedSession) {
          studentData.sessionId = selectedSession.session_id;
          studentData.sessionName = selectedSession.session_name;
          studentData.sessionCode = selectedSession.session_code;
          studentData.admissionSession = `${selectedSession.session_name} (${selectedSession.session_code})`;
        }
        
        if (selectedSubsession) {
          studentData.subsessionId = selectedSubsession.term_id;
          studentData.subsessionName = selectedSubsession.term_name;
          studentData.subsessionCode = selectedSubsession.term_code;
          studentData.admissionTerm = selectedSubsession.term_name;
        }
      }

      console.log("Creating student with data:", studentData);

      // Build FormData so the photo file can be sent
      const fd = new FormData();
      Object.entries(studentData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (typeof value === "object" && !Array.isArray(value)) {
          fd.append(key, JSON.stringify(value));
        } else if (Array.isArray(value)) {
          fd.append(key, JSON.stringify(value));
        } else {
          fd.append(key, value);
        }
      });
      if (profilePhotoFile) fd.append("profile_photo", profilePhotoFile);

      // Call real API to create student
      const result = await createStudent(fd);

      if (result.success) {
        addNotification(
          `Student ${newStudentForm.fullName} created! A password setup email has been sent to ${newStudentForm.email}.`,
          "success"
        );

        if (admitApplicationId) {
          try {
            await updateApplicationStatus(schoolId, admitApplicationId, { status: "approved" });
          } catch (_) {
            // Student created; don't block success flow if status update fails
          }
        }

        // Reset form and close menu
        setShowNewStudentMenu(false);
        setNewStudentForm({ ...EMPTY_NEW_STUDENT_FORM });
        
        // Reset guardians to single empty guardian
        setGuardians([emptyGuardian(true)]);
        setEnrollmentMethod("");
        setSelectedClass("");
        setSelectedSessionForStudent("");
        setSelectedSubsessionForStudent("");
        setProfilePhotoFile(null);
        setProfilePhotoPreview(null);
        setAdmitApplicationId(null);

        // Refresh student list
        setRefreshTable((prev) => prev + 1);
      } else {
        if (result.limitType === "students" || (result.message && result.message.includes("limit"))) {
          setStorageLimitMsg(result.message || "Student limit reached.");
          setStorageLimitOpen(true);
        } else {
          addNotification(result.message || "Failed to create student", "error");
        }
      }
    } catch (err) {
      console.error("Create student error:", err);
      addNotification("Failed to create student", "error");
    }
  };

  // Helper function to validate email
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleShowPendingStudents = () => {
    setShowPendingStudentsMenu(true);
  };

  const handleCopyToClipboard = (text, type) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        addNotification(`${type} copied to clipboard!`, "success");
      })
      .catch(() => {
        addNotification(`Failed to copy ${type}`, "error");
      });
  };

  const handleFormChange = (field) => (value) => {
    setNewStudentForm((prev) => ({ ...prev, [field]: value }));
  };

  // Guardian management functions
  const addGuardian = () => {
    setGuardians(prev => [
      ...prev,
      emptyGuardian(false),
    ]);
  };

  const removeGuardian = (guardianId) => {
    setGuardians(prev => {
      const filtered = prev.filter(g => g.id !== guardianId);
      // If we removed the primary guardian, make the first one primary
      if (filtered.length > 0 && !filtered.some(g => g.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const updateGuardian = (guardianId, field, value) => {
    setGuardians(prev => prev.map(guardian => 
      guardian.id === guardianId 
        ? { ...guardian, [field]: value }
        : guardian
    ));
  };

  const setPrimaryGuardian = (guardianId) => {
    setGuardians(prev => prev.map(guardian => ({
      ...guardian,
      isPrimary: guardian.id === guardianId
    })));
  };

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/Profile/${r.studentId}`);
  };

  const handleViewStudent = (student) => {
    navigate(`/admin/${schoolId}/Profile/${student.studentId}`);
  };

  return (
    <div>
      <InnerTabCon>
        <div className="std-header">
          <h2>Students</h2>
          <p>All students enrolled in the school across different grades and sections</p>
        </div>
        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchStudentsData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Add Student"
        />
      </InnerTabCon>

      {/* New Student SlideInMenu */}
      <SlideInMenu
        isShow={showNewStudentMenu}
        onClose={() => {
          setShowNewStudentMenu(false);
          setEnrollmentMethod("");
          setSearchStudentId("");
          setFoundStudent(null);
          setSelectedClass(""); // Reset selected class
          // Reset session selections
          setSelectedSessionForStudent("");
          setSelectedSubsessionForStudent("");
          setAllSubsessions([]);
          setNewStudentForm({ ...EMPTY_NEW_STUDENT_FORM });
          // Reset guardians to single empty guardian
          setGuardians([emptyGuardian(true)]);
          setAdmitApplicationId(null);
          clearError();
          setProfilePhotoFile(null);
          setProfilePhotoPreview(null);
        }}
        width="700px"
      >
        <div className="ns-container">
          {/* ── Panel header ── */}
          <div className="ns-header">
            <span className="ns-header-deco" aria-hidden="true" />
            <span className="ns-header-deco2" aria-hidden="true" />
            <div className="ns-header-content">
              <div className="ns-header-icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                  <path d="M2 19c0-3.3 2.7-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M16 9l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ns-header-text">
                <h2>Add New Student</h2>
                <p>Choose how you want to add a new student to the school</p>
              </div>
            </div>
          </div>
          <div className="ns-body">

            {/* Loading Session */}
            {loadingSession && (
              <div className="ns-loading-session">
                <LoadingData message="Checking active session..." />
              </div>
            )}
            
            {/* No Active Session - Show Session Selection or Error */}
            {!loadingSession && noActiveSession && (
              <div className="ns-session-outer">
                {allSessions.length === 0 ? (
                  // No sessions exist at all
                  <div className="ns-no-session">
                    <div className="ns-no-session-icon">⚠️</div>
                    <h3>No Session Available</h3>
                    <p>
                      You cannot add students until you create a session and subsession.
                      <br />
                      Please go to the Sessions page and create a new academic session first.
                    </p>
                    <Button
                      onClick={() => {
                        setShowNewStudentMenu(false);
                        navigate(`/admin/${schoolId}/Sessions`);
                      }}
                    >
                      Go to Sessions Page
                    </Button>
                  </div>
                ) : (
                  // Sessions exist but none are active - show cards for selection
                  <div className="ns-session-warn-box">
                    <div className="ns-session-warn-title">
                      <FaClock size={20} />
                      No Active Session for Today
                    </div>
                    <p className="ns-session-warn-sub">
                      Please select a session and term to use for this student admission.
                    </p>

                    {/* Session Cards */}
                    <div className="ns-session-cards">
                      {allSessions.map((session) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const sessionEnd = new Date(session.academic_year_end_date);
                        sessionEnd.setHours(0, 0, 0, 0);
                        const isPast = sessionEnd < today;

                        return (
                          <div
                            key={session.session_id}
                            onClick={() => handleSessionChange(session.session_id)}
                            className={`ns-session-card${selectedSessionForStudent === session.session_id ? " ns-session-card--selected" : ""}`}
                          >
                            <div className={`ns-session-card-type ${isPast ? "past" : "upcoming"}`}>
                              {isPast ? "📅 Immediate Past" : "🔜 Immediate Upcoming"}
                            </div>
                            <div className="ns-session-card-name">{session.session_name}</div>
                            <div className="ns-session-card-code">{session.session_code}</div>
                            <div className="ns-session-card-dates">
                              {new Date(session.academic_year_start_date).toLocaleDateString()} - {new Date(session.academic_year_end_date).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Subsession Selection */}
                    {selectedSessionForStudent && allSubsessions.length > 0 && (
                      <div className="ns-subsession-picker">
                        <span className="ns-field-label">Select Term/Subsession *</span>
                        <div className="ns-subsession-cards">
                          {allSubsessions.map((sub) => (
                            <div
                              key={sub.term_id}
                              onClick={() => setSelectedSubsessionForStudent(sub.term_id)}
                              className={`ns-subsession-card${selectedSubsessionForStudent === sub.term_id ? " ns-subsession-card--selected" : ""}`}
                            >
                              <div className="ns-subsession-card-name">{sub.term_name}</div>
                              <div className="ns-subsession-card-code">{sub.term_code}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {allSubsessions.length === 0 && selectedSessionForStudent && (
                      <div className="ns-warn-box">
                        ⚠️ This session has no subsessions. Please create subsessions for this session first.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Active Session Info */}
            {!loadingSession && activeSession && (
              <div className={`ns-info-box ${activeSubsession ? "ns-info-box--blue" : "ns-info-box--warn"}`}>
                <strong>Active Session:</strong> {activeSession.session_name} ({activeSession.session_code})
                {activeSubsession ? (
                  <>
                    <br />
                    <strong>Active Term:</strong> {activeSubsession.term_name} ({activeSubsession.term_code})
                  </>
                ) : (
                  <>
                    <br />
                    <strong>No active term found.</strong> The session is active but has no running subsession. Please go to Sessions and create or activate a term.
                  </>
                )}
              </div>
            )}

            {/* Selected Session Info (when no active session but user selected one) */}
            {!loadingSession && noActiveSession && selectedSessionForStudent && selectedSubsessionForStudent && (
              <div className="ns-info-box ns-info-box--green">
                <strong>Selected Session:</strong> {allSessions.find(s => s.session_id === selectedSessionForStudent)?.session_name} ({allSessions.find(s => s.session_id === selectedSessionForStudent)?.session_code})
                <br />
                <strong>Selected Term:</strong> {allSubsessions.find(sub => sub.term_id === selectedSubsessionForStudent)?.term_name} ({allSubsessions.find(sub => sub.term_id === selectedSubsessionForStudent)?.term_code})
              </div>
            )}

          {/* Form content — always rendered but visually blocked when no session/subsession selected */}
          {!loadingSession && (
            <div className={`ns-form-gate${
              (noActiveSession && !(selectedSessionForStudent && selectedSubsessionForStudent)) ||
              (!noActiveSession && activeSession && !activeSubsession)
                ? " ns-form-gate--blocked" : ""}`}>
              {(noActiveSession && !(selectedSessionForStudent && selectedSubsessionForStudent)) && (
                <div className="ns-form-gate-overlay">
                  <div className="ns-form-gate-msg">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    Select a session and term above to continue
                  </div>
                </div>
              )}
              {(!noActiveSession && activeSession && !activeSubsession) && (
                <div className="ns-form-gate-overlay">
                  <div className="ns-form-gate-msg">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    No active term — go to Sessions to create a subsession
                  </div>
                </div>
              )}
            <>
          {!enrollmentMethod && (
            <div className="ns-method-grid">
              <div
                className="ns-method-card"
                onClick={() => setEnrollmentMethod("key")}
              >
                <div className="ns-method-icon ns-method-icon--blue">
                  <FaKey size={22} />
                </div>
                <h3>Enroll Existing Student</h3>
                <p>Search for an existing student by ID and enroll them to this school</p>
              </div>

              <div
                className="ns-method-card"
                onClick={() => setEnrollmentMethod("create")}
              >
                <div className="ns-method-icon ns-method-icon--green">
                  <FaUserPlus size={22} />
                </div>
                <h3>Create New Student</h3>
                <p>Manually enter all student information to create a new profile</p>
              </div>
            </div>
          )}

          {enrollmentMethod === "key" && (
            <div className="ns-enroll-form">
              <div className="ns-form-info-box ns-form-info-box--blue">
                <strong>Enroll Existing Student</strong>
                <p>Enter the student ID to search for an existing student and enroll them to this school.</p>
              </div>

              <div className="ns-search-row">
                <div className="ns-search-input-wrap">
                  <FormInput
                    label="Student ID *"
                    type="text"
                    value={searchStudentId}
                    onChange={setSearchStudentId}
                    placeholder="Enter the student ID..."
                  />
                </div>
                <Button
                  onClick={handleSearchByKey}
                  disabled={!searchStudentId.trim() || loading}
                >
                  {loading ? "Searching..." : "Search Student"}
                </Button>
              </div>

              {foundStudent && (
                <div className="ns-found-student">
                  <div className="ns-found-student-header">
                    <span className="ns-found-title">Student Found</span>
                    <span className="std-badge std-badge-green">Ready to Enroll</span>
                  </div>

                  <div className="ns-info-grid">
                    <div className="ns-info-section">
                      <p className="ns-section-title">Basic Information</p>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Full Name</span>
                        <span className="ns-info-value">{foundStudent.fullName}</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Student ID</span>
                        <span className="ns-info-value">{foundStudent.studentId}</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Date of Birth</span>
                        <span className="ns-info-value">{foundStudent.dateOfBirth} ({foundStudent.age})</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Gender</span>
                        <span className="ns-info-value">{foundStudent.gender}</span>
                      </div>
                    </div>

                    <div className="ns-info-section">
                      <p className="ns-section-title">Guardian Information</p>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Guardian</span>
                        <span className="ns-info-value">{foundStudent.guardianName || "N/A"}</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Relationship</span>
                        <span className="ns-info-value">{foundStudent.relationship || "N/A"}</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Phone</span>
                        <span className="ns-info-value">{foundStudent.phone || "N/A"}</span>
                      </div>
                      <div className="ns-info-row">
                        <span className="ns-info-label">Email</span>
                        <span className="ns-info-value">{foundStudent.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ns-info-extra">
                    <div className="ns-info-row">
                      <span className="ns-info-label">Home Address</span>
                      <span className="ns-info-value">{foundStudent.homeAddress || "N/A"}</span>
                    </div>
                    <div className="ns-info-row">
                      <span className="ns-info-label">Emergency Contact</span>
                      <span className="ns-info-value">{foundStudent.emergencyContact || "N/A"}</span>
                    </div>
                    <div className="ns-info-row">
                      <span className="ns-info-label">Permitted Pickup</span>
                      <span className="ns-info-value">{foundStudent.permittedPickup || "N/A"}</span>
                    </div>
                  </div>

                  {/* Class Selection */}
                  <div className="ns-class-select">
                    {loadingClasses ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <LoadingData message="Loading classes..." />
                      </div>
                    ) : (
                      <SearchableSelect
                        label="Select Class *"
                        options={classOptions}
                        value={selectedClass}
                        onChange={setSelectedClass}
                        placeholder="Select a class for the student..."
                      />
                    )}
                  </div>

                  <div className="ns-warn-box">
                    ⚠️ Please verify all information is correct before enrolling the student.
                  </div>
                </div>
              )}

              <div className="ns-form-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnrollmentMethod("");
                    setFoundStudent(null);
                    setSearchStudentId("");
                    setSelectedClass(""); // Reset selected class
                    clearError();
                  }}
                >
                  Back
                </Button>
                {foundStudent && (
                  <Button
                    onClick={handleEnrollStudent}
                    disabled={loading || !selectedClass}
                  >
                    {loading ? "Enrolling..." : "Enroll Student"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {enrollmentMethod === "create" && (
            <div className="ns-enroll-form">
              <div className="ns-form-info-box ns-form-info-box--green">
                <strong>Create New Student</strong>
                <p>
                  {admitApplicationId
                    ? "Application details have been pre-filled. Review the information, then complete admission."
                    : "Fill in all the required information to create a new student profile. A temporary password will be generated."}
                </p>
              </div>

              <div className="ns-form-sections">
                {/* Basic Information */}
                <div className="ns-form-section">
                  <div className="ns-form-section-title">Basic Information</div>

                  {/* Profile Photo */}
                  <div className="ns-photo-upload">
                    <div
                      className="ns-photo-preview"
                      onClick={() => document.getElementById("ns-photo-input").click()}
                    >
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Preview" className="ns-photo-img" />
                      ) : (
                        <div className="ns-photo-placeholder">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                          </svg>
                          <span>Photo</span>
                        </div>
                      )}
                    </div>
                    <div className="ns-photo-info">
                      <p className="ns-photo-label">Profile Photo <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></p>
                      <p className="ns-photo-hint">JPG, PNG or WEBP · max 5MB</p>
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        <button className="ns-photo-btn" onClick={() => document.getElementById("ns-photo-input").click()}>
                          {profilePhotoFile ? "Change Photo" : "Upload Photo"}
                        </button>
                        {profilePhotoFile && (
                          <button className="ns-photo-btn ns-photo-btn--remove" onClick={() => { setProfilePhotoFile(null); setProfilePhotoPreview(null); }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      id="ns-photo-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { addNotification("Photo must be under 5MB", "error"); return; }
                        setProfilePhotoFile(file);
                        setProfilePhotoPreview(URL.createObjectURL(file));
                      }}
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Full Name *"
                      type="text"
                      value={newStudentForm.fullName}
                      onChange={handleFormChange("fullName")}
                      placeholder="Enter student's full name"
                    />
                    <FormInput
                      label="Date of Birth *"
                      type="date"
                      value={newStudentForm.dateOfBirth}
                      onChange={handleFormChange("dateOfBirth")}
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Gender *"
                      type="select"
                      value={newStudentForm.gender}
                      onChange={handleFormChange("gender")}
                      options={[
                        { value: "", label: "Select gender..." },
                        { value: "Male", label: "Male" },
                        { value: "Female", label: "Female" },
                      ]}
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      value={newStudentForm.email}
                      onChange={handleFormChange("email")}
                      placeholder="student@example.com"
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Phone"
                      type="tel"
                      value={newStudentForm.phone}
                      onChange={handleFormChange("phone")}
                      placeholder="+234 801 234 5678"
                    />
                    <FormInput
                      label="WhatsApp number"
                      type="tel"
                      value={newStudentForm.whatsapp}
                      onChange={handleFormChange("whatsapp")}
                      placeholder="+234 801 234 5678"
                    />
                  </div>

                  {/* Class Selection */}
                  <div className="ns-class-select">
                    {loadingClasses ? (
                      <div style={{ padding: "20px", textAlign: "center" }}>
                        <LoadingData message="Loading classes..." />
                      </div>
                    ) : (
                      <SearchableSelect
                        label="Select Class *"
                        options={classes.map((cls) => ({
                          value: cls.class_id,
                          label: `${cls.class_name} ${cls.stream ? `- ${cls.stream}` : ''}`,
                        }))}
                        value={selectedClass}
                        onChange={setSelectedClass}
                        placeholder="Select a class for the student..."
                      />
                    )}
                  </div>
                </div>

                {/* Identity / bio */}
                <div className="ns-form-section">
                  <div className="ns-form-section-title">Identity / bio</div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Religion"
                      type="select"
                      value={newStudentForm.religion}
                      onChange={handleFormChange("religion")}
                      options={[
                        { value: "", label: "Select religion..." },
                        { value: "Christianity", label: "Christianity" },
                        { value: "Islam", label: "Islam" },
                        { value: "Traditional", label: "Traditional" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                    <FormInput
                      label="Nationality"
                      type="text"
                      value={newStudentForm.nationality}
                      onChange={handleFormChange("nationality")}
                      placeholder="e.g., Nigerian"
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="State of Origin"
                      type="text"
                      value={newStudentForm.stateOfOrigin}
                      onChange={handleFormChange("stateOfOrigin")}
                      placeholder="e.g., Lagos"
                    />
                    <FormInput
                      label="LGA of origin"
                      type="text"
                      value={newStudentForm.lgaOfOrigin}
                      onChange={handleFormChange("lgaOfOrigin")}
                      placeholder="e.g., Ikeja"
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Place of birth"
                      type="text"
                      value={newStudentForm.placeOfBirth}
                      onChange={handleFormChange("placeOfBirth")}
                      placeholder="Town or city of birth"
                    />
                    <FormInput
                      label="Tribe / ethnic group"
                      type="text"
                      value={newStudentForm.tribe}
                      onChange={handleFormChange("tribe")}
                      placeholder="e.g., Yoruba"
                    />
                  </div>

                  <FormInput
                    label="National Identification Number (NIN)"
                    type="text"
                    value={newStudentForm.nin}
                    onChange={handleFormChange("nin")}
                    placeholder="11-digit NIN"
                  />

                  <div className="ns-form-row">
                    <FormInput
                      label="Number of siblings"
                      type="text"
                      value={newStudentForm.numberOfSiblings}
                      onChange={handleFormChange("numberOfSiblings")}
                      placeholder="e.g., 3"
                    />
                    <FormInput
                      label="Position in the family"
                      type="text"
                      value={newStudentForm.familyPosition}
                      onChange={handleFormChange("familyPosition")}
                      placeholder="e.g., 3rd of 5"
                    />
                  </div>

                  <FormInput
                    label="Lives with"
                    type="select"
                    value={newStudentForm.livesWith}
                    onChange={handleFormChange("livesWith")}
                    options={[
                      { value: "", label: "Select..." },
                      { value: "Both parents", label: "Both parents" },
                      { value: "Father", label: "Father" },
                      { value: "Mother", label: "Mother" },
                      { value: "Guardian", label: "Guardian" },
                      { value: "Single parent", label: "Single parent" },
                      { value: "Orphan", label: "Orphan" },
                    ]}
                  />

                  <div className="ns-form-row">
                    <FormInput
                      label="Blood Group"
                      type="select"
                      value={newStudentForm.bloodGroup}
                      onChange={handleFormChange("bloodGroup")}
                      options={[
                        { value: "", label: "Select blood group..." },
                        { value: "A+", label: "A+" },
                        { value: "A-", label: "A-" },
                        { value: "B+", label: "B+" },
                        { value: "B-", label: "B-" },
                        { value: "AB+", label: "AB+" },
                        { value: "AB-", label: "AB-" },
                        { value: "O+", label: "O+" },
                        { value: "O-", label: "O-" },
                      ]}
                    />
                    <FormInput
                      label="Genotype"
                      type="select"
                      value={newStudentForm.genotype}
                      onChange={handleFormChange("genotype")}
                      options={[
                        { value: "", label: "Select genotype..." },
                        { value: "AA", label: "AA" },
                        { value: "AS", label: "AS" },
                        { value: "AC", label: "AC" },
                        { value: "SS", label: "SS" },
                        { value: "SC", label: "SC" },
                      ]}
                    />
                  </div>
                </div>

                {/* Residence */}
                <div className="ns-form-section">
                  <div className="ns-form-section-title">Residence</div>

                  <div className="ns-form-row">
                    <FormInput
                      label="House number / street"
                      type="text"
                      value={newStudentForm.houseNumberStreet}
                      onChange={handleFormChange("houseNumberStreet")}
                      placeholder="e.g., 12 Adeola Street"
                    />
                    <FormInput
                      label="Area / estate"
                      type="text"
                      value={newStudentForm.areaEstate}
                      onChange={handleFormChange("areaEstate")}
                      placeholder="e.g., Magodo GRA"
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="City"
                      type="text"
                      value={newStudentForm.city}
                      onChange={handleFormChange("city")}
                      placeholder="e.g., Lagos"
                    />
                    <FormInput
                      label="LGA of residence"
                      type="text"
                      value={newStudentForm.lgaOfResidence}
                      onChange={handleFormChange("lgaOfResidence")}
                      placeholder="e.g., Kosofe"
                    />
                  </div>

                  <div className="ns-form-row">
                    <FormInput
                      label="State of residence"
                      type="text"
                      value={newStudentForm.stateOfResidence}
                      onChange={handleFormChange("stateOfResidence")}
                      placeholder="e.g., Lagos"
                    />
                    <FormInput
                      label="Landmark"
                      type="text"
                      value={newStudentForm.landmark}
                      onChange={handleFormChange("landmark")}
                      placeholder="e.g., Near Shoprite"
                    />
                  </div>
                </div>

                {/* Guardian Information */}
                <div className="ns-form-section">
                  <div className="ns-guardian-section-header">
                    <div className="ns-form-section-title" style={{ margin: 0, border: 0, padding: 0 }}>Guardian Information</div>
                    <button className="ns-guardian-btn" onClick={addGuardian}>
                      <FaPlus size={11} /> Add Guardian
                    </button>
                  </div>

                  {guardians.map((guardian, index) => (
                    <div
                      key={guardian.id}
                      className={`ns-guardian-card${guardian.isPrimary ? " ns-guardian-card--primary" : ""}`}
                    >
                      {/* Guardian Header */}
                      <div className="ns-guardian-card-header">
                        <div className="ns-guardian-title-row">
                          <span className="ns-guardian-card-title">Guardian {index + 1}</span>
                          {guardian.isPrimary && (
                            <span className="ns-guardian-primary-badge">
                              <FaStar size={9} /> Primary
                            </span>
                          )}
                        </div>

                        <div className="ns-guardian-actions">
                          {!guardian.isPrimary && (
                            <button
                              className="ns-guardian-btn"
                              onClick={() => setPrimaryGuardian(guardian.id)}
                              title="Set as primary guardian"
                            >
                              <FaStar size={9} /> Set Primary
                            </button>
                          )}
                          {guardians.length > 1 && (
                            <button
                              className="ns-guardian-btn ns-guardian-btn-danger"
                              onClick={() => removeGuardian(guardian.id)}
                              title="Remove guardian"
                            >
                              <FaTrash size={9} /> Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Guardian Form Fields */}
                      <div className="ns-guardian-card-body">
                      <div className="ns-form-row">
                        <FormInput
                          label={`Guardian Name ${guardian.isPrimary ? '*' : ''}`}
                          type="text"
                          value={guardian.guardianName}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianName', value)}
                          placeholder="Enter guardian's full name"
                        />
                        <FormInput
                          label="Relationship"
                          type="select"
                          value={guardian.guardianRelationship}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianRelationship', value)}
                          options={[
                            { value: "", label: "Select relationship..." },
                            { value: "Father", label: "Father" },
                            { value: "Mother", label: "Mother" },
                            { value: "Guardian", label: "Guardian" },
                            { value: "Uncle", label: "Uncle" },
                            { value: "Aunt", label: "Aunt" },
                            { value: "Grandparent", label: "Grandparent" },
                            { value: "Other", label: "Other" },
                          ]}
                        />
                      </div>

                      <div className="ns-form-row">
                        <FormInput
                          label={`Guardian Phone ${guardian.isPrimary ? '*' : ''}`}
                          type="tel"
                          value={guardian.guardianPhone}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianPhone', value)}
                          placeholder="+234 801 234 5678"
                        />
                        <FormInput
                          label="Guardian WhatsApp number"
                          type="tel"
                          value={guardian.guardianWhatsapp}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianWhatsapp', value)}
                          placeholder="+234 801 234 5678"
                        />
                      </div>

                      <div className="ns-form-row">
                        <FormInput
                          label="Guardian Email"
                          type="email"
                          value={guardian.guardianEmail}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianEmail', value)}
                          placeholder="guardian@example.com"
                        />
                        <FormInput
                          label="Guardian Occupation"
                          type="text"
                          value={guardian.guardianOccupation}
                          onChange={(value) => updateGuardian(guardian.id, 'guardianOccupation', value)}
                          placeholder="e.g., Engineer"
                        />
                      </div>

                      <FormInput
                        label="Guardian Address"
                        type="textarea"
                        value={guardian.guardianAddress}
                        onChange={(value) => updateGuardian(guardian.id, 'guardianAddress', value)}
                        placeholder="Enter guardian's address..."
                        height="60px"
                      />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Emergency Contact */}
                <div className="ns-form-section">
                  <div className="ns-form-section-title">Emergency Contact</div>

                  <div className="ns-form-row">
                    <FormInput
                      label="Name"
                      type="text"
                      value={newStudentForm.emergencyContactName}
                      onChange={handleFormChange("emergencyContactName")}
                      placeholder="Enter emergency contact name"
                    />
                    <FormInput
                      label="Relationship"
                      type="select"
                      value={newStudentForm.emergencyContactRelationship}
                      onChange={handleFormChange("emergencyContactRelationship")}
                      options={[
                        { value: "", label: "Select relationship..." },
                        { value: "Father", label: "Father" },
                        { value: "Mother", label: "Mother" },
                        { value: "Guardian", label: "Guardian" },
                        { value: "Uncle", label: "Uncle" },
                        { value: "Aunt", label: "Aunt" },
                        { value: "Sibling", label: "Sibling" },
                        { value: "Other", label: "Other" },
                      ]}
                    />
                  </div>
                  <div className="ns-form-row">
                    <FormInput
                      label="Phone"
                      type="tel"
                      value={newStudentForm.emergencyContactPhone}
                      onChange={handleFormChange("emergencyContactPhone")}
                      placeholder="+234 809 876 5432"
                    />
                    <FormInput
                      label="WhatsApp number"
                      type="tel"
                      value={newStudentForm.emergencyContactWhatsapp}
                      onChange={handleFormChange("emergencyContactWhatsapp")}
                      placeholder="+234 809 876 5432"
                    />
                  </div>
                </div>

                <div className="ns-form-section">
                  <div className="ns-form-section-title">Security & Access</div>
                  <div className="ns-invite-note">
                    <div className="ns-invite-note-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="ns-invite-note-text">
                      <p className="ns-invite-note-title">Password setup via email</p>
                      <p className="ns-invite-note-body">
                        A secure link will be sent to{" "}
                        <strong>{newStudentForm.email || "the student's email"}</strong> after
                        account creation. They'll use it to set their own password.
                      </p>
                      <span className="ns-invite-note-meta">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M12 7v5.5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Link expires in 48 hours
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ns-form-actions">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEnrollmentMethod("");
                    // Reset guardians to single empty guardian
                    setGuardians([emptyGuardian(true)]);
                  }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateNewStudent}
                  disabled={
                    loading ||
                    !newStudentForm.fullName ||
                    !newStudentForm.dateOfBirth ||
                    !newStudentForm.gender ||
                    !selectedClass ||
                    guardians.filter(g => g.guardianName.trim() && g.guardianPhone.trim()).length === 0
                  }
                >
                  {loading ? "Creating..." : "Create Student"}
                </Button>
              </div>
            </div>
          )}
          </>
            </div>
          )}
        </div>
      </div>
      </SlideInMenu>

      {/* Pending Students SlideInMenu */}
      <SlideInMenu
        isShow={showPendingStudentsMenu}
        onClose={() => setShowPendingStudentsMenu(false)}
        width="800px"
      >
        <div className="pending-students-container" style={{ padding: "24px" }}>
          <div className="pending-students-header">
            <h2>Pending Students</h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: "14px",
                margin: "8px 0 0 0",
              }}
            >
              Students created manually with enrollment keys and links
            </p>
          </div>

          {pendingStudents.length === 0 ? (
            <div
              className="no-pending-students"
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#6b7280",
              }}
            >
              <FaClock
                size={48}
                style={{ marginBottom: "16px", opacity: 0.5 }}
              />
              <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>
                No Pending Students
              </h3>
              <p style={{ margin: "0", fontSize: "14px" }}>
                Students created manually will appear here with their enrollment
                keys and links.
              </p>
            </div>
          ) : (
            <div
              className="pending-students-list"
              style={{ marginTop: "24px" }}
            >
              {pendingStudents.map((student) => (
                <div
                  key={student.id}
                  className="pending-student-card"
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "16px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                  }}
                >
                  <div
                    className="student-card-header"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "16px",
                    }}
                  >
                    <div className="student-info">
                      <h4
                        style={{
                          margin: "0 0 4px 0",
                          color: "#1f2937",
                          fontSize: "16px",
                          fontWeight: "600",
                        }}
                      >
                        {student.fullName}
                      </h4>
                      <p
                        style={{
                          margin: "0",
                          color: "#6b7280",
                          fontSize: "13px",
                        }}
                      >
                        Created:{" "}
                        {new Date(student.createdDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="student-status">
                      <span
                        style={{
                          padding: "4px 12px",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {student.status}
                      </span>
                    </div>
                  </div>

                  <div
                    className="enrollment-info"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div className="enrollment-link">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          Enrollment Link:
                        </span>
                        <button
                          onClick={() =>
                            handleCopyToClipboard(
                              student.enrollmentLink,
                              "Enrollment Link"
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "#10b981",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = "#059669";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = "#10b981";
                          }}
                        >
                          <FaCopy size={12} />
                          Copy
                        </button>
                      </div>
                      <div
                        style={{
                          backgroundColor: "#f0fdf4",
                          padding: "8px 12px",
                          borderRadius: "4px",
                          fontSize: "13px",
                          color: "#166534",
                          wordBreak: "break-all",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {student.enrollmentLink}
                      </div>
                    </div>
                  </div>

                  <div
                    className="card-actions"
                    style={{
                      display: "flex",
                      gap: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete ${student.fullName}? This action cannot be undone.`
                          )
                        ) {
                          setPendingStudents((prev) =>
                            prev.filter((s) => s.id !== student.id)
                          );
                          addNotification(
                            `${student.fullName} has been removed from pending students`,
                            "success"
                          );
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        borderRadius: "4px",
                        color: "#dc2626",
                        fontSize: "12px",
                        fontWeight: "500",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#fee2e2";
                        e.target.style.borderColor = "#fca5a5";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#fef2f2";
                        e.target.style.borderColor = "#fecaca";
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            className="pending-students-footer"
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #bae6fd",
            }}
          >
            <p
              style={{
                margin: "0",
                fontSize: "13px",
                color: "#0369a1",
                fontWeight: "500",
              }}
            >
              💡 Share the enrollment key or link with guardians to complete the
              student enrollment process.
            </p>
          </div>
        </div>
      </SlideInMenu>

      <SubscriptionLimitModal
        isOpen={storageLimitOpen}
        onClose={() => setStorageLimitOpen(false)}
        message={storageLimitMsg}
        title="Student Limit Reached"
      />
    </div>
  );
};

export default Students;
