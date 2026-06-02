import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import FormInput from "../../../../components/FormInput";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import {
  useSession,
  useSubsession,
  useHeadmaster,
  useClass,
  useTeacher,
  useSubject,
  useTeacherSubject,
  useClassSubject,
  useGradingTemplate,
  useClassPromotionTemplate,
  useFetchStudentsPaginated,
} from "../../../../api_call";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import {
  FaArrowLeft,
  FaCheck,
  FaCalendarAlt,
  FaCog,
  FaGraduationCap,
  FaChevronRight,
  FaChevronLeft,
  FaUsers,
  FaUserGraduate,
  FaUserTimes,
  FaSearch,
  FaPlus,
  FaSync,
} from "react-icons/fa";
import "./CreateSessionWizard.css";

const CreateSessionWizard = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { createCompleteSession, getSessionsBySchool } = useSession();
  const { getActiveHeadmastersBySchoolId } = useHeadmaster();
  const { getClassesBySchoolId } = useClass();
  const { getTeachersBySchoolId } = useTeacher();
  const { getSubjectsBySchoolId } = useSubject();
  const { getActiveTeacherSubjectAssignmentsBySchool } = useTeacherSubject();
  const { getActiveClassSubjectAssignmentsBySchool } = useClassSubject();
  const { getGradingTemplatesBySchool } = useGradingTemplate();
  const { getClassPromotionTemplatesBySchool } = useClassPromotionTemplate();
  const { getStudentsPaginated } = useFetchStudentsPaginated();
  const { user } = useAuth();

  // Track current active step (only one can be open at a time)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track skipped steps
  const [skippedSteps, setSkippedSteps] = useState({
    promotionGraduation: false,
    classHeadmasters: false,
    subjectTeachers: false,
  });

  // Validation errors for dates
  const [dateErrors, setDateErrors] = useState({
    startDate: "",
    endDate: "",
  });

  // Validation errors for subsessions
  const [subsessionErrors, setSubsessionErrors] = useState({});

  // Data loading states
  const [dataLoading, setDataLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [activeHeadmasters, setActiveHeadmasters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTeacherSubjectAssignments, setActiveTeacherSubjectAssignments] =
    useState([]);
  const [classSubjectAssignments, setClassSubjectAssignments] = useState([]);
  const [gradingTemplates, setGradingTemplates] = useState([]);
  const [promotionTemplates, setPromotionTemplates] = useState([]);
  
  // Real student and class data
  const [realStudents, setRealStudents] = useState([]);
  const [realClasses, setRealClasses] = useState([]);

  // Draft session guard
  const [hasDraftSession, setHasDraftSession] = useState(false);
  const [draftSessionName, setDraftSessionName] = useState("");

  // Check for existing draft session on mount
  useEffect(() => {
    const checkDraftSession = async () => {
      const result = await getSessionsBySchool(schoolId);
      if (result.success) {
        const draft = (result.data || []).find(
          (s) => s.session_status === "draft" && !s.is_archived
        );
        if (draft) {
          setHasDraftSession(true);
          setDraftSessionName(draft.session_name || "Unnamed Draft");
        }
      }
    };
    checkDraftSession();
  }, [schoolId]);

  // Form data state
  const [sessionData, setSessionData] = useState({
    // Step 1: Session Basics
    sessionName: "",
    sessionCode: "",
    startDate: "",
    endDate: "",

    // Step 2: Student Promotion & Graduation
    selectedPromotionTemplate: "",
    customPromotionRules: [],

    // Step 3: Class Headmaster Assignment
    classHeadmasters: [],

    // Step 4: Subject Teacher Assignment
    subjectTeachers: [],

    // Step 5: Create Subsessions
    subsessions: [
      {
        name: "First Term",
        code: "TERM1",
        startDate: "",
        endDate: "",
        isDefault: true,
        gradingTemplateId: null,
        gradingTemplateName: null,
      },
      {
        name: "Second Term",
        code: "TERM2",
        startDate: "",
        endDate: "",
        isDefault: true,
        gradingTemplateId: null,
        gradingTemplateName: null,
      },
      {
        name: "Third Term",
        code: "TERM3",
        startDate: "",
        endDate: "",
        isDefault: true,
        gradingTemplateId: null,
        gradingTemplateName: null,
      },
    ],
  });

  const sections = [
    {
      id: "sessionBasics",
      title: "Session Basics",
      description: "Set up session name, academic year and dates",
      icon: FaCalendarAlt,
      skippable: false,
      isValid: () =>
        sessionData.sessionName &&
        sessionData.sessionCode &&
        sessionData.startDate &&
        sessionData.endDate &&
        !dateErrors.startDate &&
        !dateErrors.endDate,
    },
    {
      id: "promotionGraduation",
      title: "Student Promotion & Graduation",
      description: "Select promotion template and graduation criteria",
      icon: FaGraduationCap,
      skippable: true,
      isValid: () =>
        skippedSteps.promotionGraduation ||
        sessionData.selectedPromotionTemplate !== "",
    },
    {
      id: "createSubsessions",
      title: "Create Subsessions",
      description: "Configure terms/semesters with default structure",
      icon: FaCog,
      skippable: false,
      isValid: () => {
        const allFilled = sessionData.subsessions.every(
          (sub) => 
            sub.name && 
            sub.code && 
            sub.startDate && 
            sub.endDate &&
            sub.gradingTemplateId
        );
        const noErrors = Object.values(subsessionErrors).every(
          (errors) => !errors || Object.keys(errors).length === 0
        );
        return allFilled && noErrors;
      },
    },
    {
      id: "review",
      title: "Review",
      description: "Review all settings and create session",
      icon: FaCheck,
      skippable: false,
      isValid: () => true,
    },
  ];

  const handleNext = () => {
    if (currentStep < sections.length - 1 && sections[currentStep].isValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    const currentSection = sections[currentStep];

    // Mark step as skipped
    if (currentSection.skippable) {
      setSkippedSteps((prev) => ({
        ...prev,
        [currentSection.id]: true,
      }));

      // Move to next step
      if (currentStep < sections.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const canProceed = () => {
    return sections[currentStep].isValid();
  };

  // Process real students for promotion analysis
  const processStudentsForPromotion = (selectedTemplateId) => {
    if (!realStudents.length || !realClasses.length) {
      return [];
    }

    // Find the selected template
    const selectedTemplate = promotionTemplates.find(
      t => t.template_id === selectedTemplateId
    );

    // Parse class promotions from template
    let classPromotionRules = [];
    if (selectedTemplate && selectedTemplate.class_promotions) {
      try {
        // Check if it's already an object or a string
        if (typeof selectedTemplate.class_promotions === 'string') {
          classPromotionRules = JSON.parse(selectedTemplate.class_promotions);
        } else if (Array.isArray(selectedTemplate.class_promotions)) {
          classPromotionRules = selectedTemplate.class_promotions;
        }
      } catch (error) {
        console.error("Error parsing class promotions:", error);
        console.log("class_promotions value:", selectedTemplate.class_promotions);
      }
    }

    return realStudents.map(student => {
      // Backend returns: student_id, full_name, current_class_name, current_class_id (from paginated endpoint)
      const studentId = student.student_id || student.studentId;
      const studentName = student.full_name || student.name;
      const currentClassName = student.current_class_name || student.currentClass;
      const currentClassId = student.current_class_id || student.currentClassId;
      
      // Find current class details from realClasses
      const currentClass = currentClassId 
        ? realClasses.find(cls => cls.class_id === currentClassId)
        : null;

      // Find next class using template's promotion rules
      const promotionResult = findNextClassFromTemplate(currentClass, classPromotionRules);

      return {
        id: studentId,
        name: studentName,
        currentClass: currentClassName || "Not Assigned",
        currentClassId: currentClassId || null,
        nextClass: promotionResult.nextClass 
          ? `${promotionResult.nextClass.class_name}${promotionResult.nextClass.class_section ? ` - ${promotionResult.nextClass.class_section}` : ''}` 
          : promotionResult.status === "graduate" ? "Graduate" : currentClassName || "Not Assigned",
        nextClassId: promotionResult.nextClass?.class_id || (promotionResult.status === "graduate" ? "ALUMNI" : currentClassId),
        status: promotionResult.status, // "promote", "demote", or "graduate"
        classAssignmentSession: student.class_assignment_session || null,
      };
    });
  };

  // Find next class based on template's promotion rules
  const findNextClassFromTemplate = (currentClass, promotionRules) => {
    if (!currentClass) {
      return { nextClass: null, status: "demote" }; // No current class, stays as demote
    }

    if (!promotionRules || promotionRules.length === 0) {
      // No promotion rules at all, everyone stays in current class (demote)
      return { nextClass: null, status: "demote" };
    }

    // Find the promotion rule for the current class
    const promotionRule = promotionRules.find(
      rule => rule.from_class === currentClass.class_id
    );

    if (!promotionRule) {
      // No promotion rule found for this class, student stays in current class (demote)
      return { nextClass: null, status: "demote" };
    }

    // Check if promoting to ALUMNI (graduation)
    if (promotionRule.to_class === "ALUMNI") {
      return { nextClass: null, status: "graduate" };
    }

    // Find the next class by ID
    const nextClass = realClasses.find(
      cls => cls.class_id === promotionRule.to_class && cls.is_active
    );

    if (!nextClass) {
      // Next class not found or not active, student stays in current class (demote)
      return { nextClass: null, status: "demote" };
    }

    // Student will be promoted to next class
    return { nextClass: nextClass, status: "promote" };
  };

  // Sample classes data - moved up to fix initialization order
  const sampleClasses = [
    {
      id: 1,
      name: "Grade 1A",
      currentHeadmaster: "Mrs. Johnson",
      level: "Elementary",
    },
    {
      id: 2,
      name: "Grade 1B",
      currentHeadmaster: "Mr. Smith",
      level: "Elementary",
    },
    {
      id: 3,
      name: "Grade 2A",
      currentHeadmaster: "Ms. Davis",
      level: "Elementary",
    },
    {
      id: 4,
      name: "Grade 3A",
      currentHeadmaster: "Mrs. Wilson",
      level: "Elementary",
    },
    {
      id: 5,
      name: "Grade 7A",
      currentHeadmaster: "Mr. Brown",
      level: "Secondary",
    },
    {
      id: 6,
      name: "Grade 8A",
      currentHeadmaster: "Ms. Taylor",
      level: "Secondary",
    },
  ];

  const sampleTeachers = [
    {
      id: 1,
      name: "Mrs. Johnson",
      subjects: [
        "Mathematics",
        "Mathematics-Pure Mathematics",
        "Mathematics-Applied Mathematics",
      ],
    },
    {
      id: 2,
      name: "Mr. Smith",
      subjects: ["English", "English-Literature", "English-Language"],
    },
    {
      id: 3,
      name: "Ms. Davis",
      subjects: ["History", "Geography"],
    },
    {
      id: 4,
      name: "Mrs. Wilson",
      subjects: ["Art", "Art-Visual Arts", "Art-Performing Arts"],
    },
    {
      id: 5,
      name: "Mr. Brown",
      subjects: ["Science-Physics", "Science-Chemistry"],
    },
    {
      id: 6,
      name: "Ms. Taylor",
      subjects: ["Science-Biology", "Mathematics"],
    },
    {
      id: 7,
      name: "Dr. Anderson",
      subjects: [
        "Computer Science-Programming",
        "Computer Science-Data Science",
      ],
    },
    {
      id: 8,
      name: "Prof. Williams",
      subjects: ["Science-Physics", "Science-Chemistry", "Science-Biology"],
    },
  ];

  const sampleSubjects = [
    { name: "Mathematics", stream: null },
    { name: "English", stream: null },
    { name: "Science", stream: "Physics" },
    { name: "Science", stream: "Chemistry" },
    { name: "Science", stream: "Biology" },
    { name: "History", stream: null },
    { name: "Geography", stream: null },
    { name: "Art", stream: "Visual Arts" },
    { name: "Art", stream: "Performing Arts" },
    { name: "Mathematics", stream: "Pure Mathematics" },
    { name: "Mathematics", stream: "Applied Mathematics" },
    { name: "English", stream: "Literature" },
    { name: "English", stream: "Language" },
    { name: "Computer Science", stream: "Programming" },
    { name: "Computer Science", stream: "Data Science" },
  ];

  // State for promotion analysis
  const [promotionAnalysis, setPromotionAnalysis] = useState(null);
  const [showStudentList, setShowStudentList] = useState(null); // 'promote', 'demote', 'graduate', or null
  const [studentOverrides, setStudentOverrides] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Sample data from previous session assignments
  const previousSessionAssignments = {
    // Class ID - Subject combinations with assigned teacher IDs (using stream format)
    "1-Mathematics": 1, // Grade 1A - Mathematics -> Mrs. Johnson
    "1-Mathematics-Pure Mathematics": 1, // Grade 1A - Mathematics/Pure Mathematics -> Mrs. Johnson
    "1-English": 2, // Grade 1A - English -> Mr. Smith
    "1-English-Literature": 2, // Grade 1A - English/Literature -> Mr. Smith
    "1-Science-Physics": 5, // Grade 1A - Science/Physics -> Mr. Brown
    "1-Art-Visual Arts": 4, // Grade 1A - Art/Visual Arts -> Mrs. Wilson
    "2-Mathematics": 6, // Grade 1B - Mathematics -> Ms. Taylor
    "2-English-Language": 2, // Grade 1B - English/Language -> Mr. Smith
    "2-Science-Chemistry": 5, // Grade 1B - Science/Chemistry -> Mr. Brown
    "2-History": 3, // Grade 1B - History -> Ms. Davis
    "3-Mathematics-Applied Mathematics": 1, // Grade 2A - Mathematics/Applied Mathematics -> Mrs. Johnson
    "3-English": 2, // Grade 2A - English -> Mr. Smith
    "3-Geography": 3, // Grade 2A - Geography -> Ms. Davis
    "3-Art-Performing Arts": 4, // Grade 2A - Art/Performing Arts -> Mrs. Wilson
    "4-Mathematics": 6, // Grade 3A - Mathematics -> Ms. Taylor
    "4-English-Literature": 2, // Grade 3A - English/Literature -> Mr. Smith
    "4-Science-Biology": 6, // Grade 3A - Science/Biology -> Ms. Taylor
    "4-Computer Science-Programming": 7, // Grade 3A - Computer Science/Programming -> Dr. Anderson
    "5-Mathematics-Pure Mathematics": 1, // Grade 7A - Mathematics/Pure Mathematics -> Mrs. Johnson
    "5-Science-Physics": 8, // Grade 7A - Science/Physics -> Prof. Williams
    "5-Science-Chemistry": 8, // Grade 7A - Science/Chemistry -> Prof. Williams
    "5-English": 2, // Grade 7A - English -> Mr. Smith
    "6-Science-Biology": 8, // Grade 8A - Science/Biology -> Prof. Williams
    "6-Mathematics": 1, // Grade 8A - Mathematics -> Mrs. Johnson
    "6-Computer Science-Data Science": 7, // Grade 8A - Computer Science/Data Science -> Dr. Anderson
    "6-English-Language": 2, // Grade 8A - English/Language -> Mr. Smith
  };

  // State for subject teacher assignments
  const [activeClassTab, setActiveClassTab] = useState(0); // Use index instead of level
  const [subjectTeacherAssignments, setSubjectTeacherAssignments] = useState(
    previousSessionAssignments // Initialize with previous session data
  );
  const [headmasterAssignments, setHeadmasterAssignments] = useState({});

  // Load data when steps are opened
  useEffect(() => {
    if (currentStep === 1) {
      // Student Promotion & Graduation step
      loadPromotionData();
    } else if (currentStep === 2) {
      // Create Subsessions step - load templates
      loadTemplateData();
    }
  }, [currentStep]);

  const loadPromotionData = async () => {
    setDataLoading(true);
    try {
      // Load promotion templates, students, and classes in parallel
      const [templatesResult, studentsResult, classesResult] = await Promise.all([
        getClassPromotionTemplatesBySchool(schoolId),
        getStudentsPaginated(schoolId, { page: 1, limit: 1000 }), // Get all students with their current classes
        getClassesBySchoolId(schoolId),
      ]);

      // Handle promotion templates
      if (templatesResult.success) {
        setPromotionTemplates(templatesResult.data || []);
      } else {
        addNotification(
          templatesResult.message || "Failed to load promotion templates",
          "error"
        );
        setPromotionTemplates([]);
      }

      // Handle students - backend already includes current_class_name and current_class_id
      if (studentsResult.success) {
        console.log("Loaded students from backend:", studentsResult.data.length);
        console.log("Sample student data:", studentsResult.data[0]);
        setRealStudents(studentsResult.data || []);
      } else {
        addNotification(
          studentsResult.message || "Failed to load students",
          "error"
        );
        setRealStudents([]);
      }

      // Handle classes
      if (classesResult.success) {
        const activeClasses = (classesResult.data || []).filter(cls => cls.is_active === true);
        setRealClasses(activeClasses);
      } else {
        addNotification(
          classesResult.message || "Failed to load classes",
          "error"
        );
        setRealClasses([]);
      }

    } catch (error) {
      console.error("Load promotion data error:", error);
      addNotification("Failed to load promotion data", "error");
      setPromotionTemplates([]);
      setRealStudents([]);
      setRealClasses([]);
    } finally {
      setDataLoading(false);
    }
  };

  const loadHeadmasterData = async () => {
    setDataLoading(true);
    try {
      // Fetch classes, teachers, and active headmasters in parallel
      const [classesResult, teachersResult, headmastersResult] =
        await Promise.all([
          getClassesBySchoolId(schoolId),
          getTeachersBySchoolId(schoolId),
          getActiveHeadmastersBySchoolId(schoolId),
        ]);

      if (classesResult.success) {
        setClasses(classesResult.data || []);
      } else {
        addNotification(
          classesResult.message || "Failed to load classes",
          "error"
        );
      }

      if (teachersResult.success) {
        setTeachers(teachersResult.data || []);
      } else {
        addNotification(
          teachersResult.message || "Failed to load teachers",
          "error"
        );
      }

      if (headmastersResult.success) {
        setActiveHeadmasters(headmastersResult.data || []);
        // Initialize headmaster assignments from active headmasters
        const initialAssignments = {};
        (headmastersResult.data || []).forEach((hm) => {
          initialAssignments[hm.class_id] = hm.teacher_id;
        });
        setHeadmasterAssignments(initialAssignments);
      } else {
        addNotification(
          headmastersResult.message || "Failed to load headmasters",
          "error"
        );
      }
    } catch (error) {
      console.error("Load headmaster data error:", error);
      addNotification("Failed to load data", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const loadSubjectTeacherData = async () => {
    setDataLoading(true);
    try {
      // Fetch subjects, class-subject assignments, and teacher-subject assignments
      const [subjectsResult, classSubjectResult, teacherSubjectResult] =
        await Promise.all([
          getSubjectsBySchoolId(schoolId),
          getActiveClassSubjectAssignmentsBySchool(schoolId),
          getActiveTeacherSubjectAssignmentsBySchool(schoolId),
        ]);

      if (subjectsResult.success) {
        const activeSubjects = (subjectsResult.data || []).filter(
          (s) => s.is_active === true
        );
        setSubjects(activeSubjects);
      } else {
        addNotification(
          subjectsResult.message || "Failed to load subjects",
          "error"
        );
      }

      if (classSubjectResult.success) {
        setClassSubjectAssignments(classSubjectResult.data || []);
      } else {
        addNotification(
          classSubjectResult.message ||
            "Failed to load class-subject assignments",
          "error"
        );
      }

      if (teacherSubjectResult.success) {
        setActiveTeacherSubjectAssignments(teacherSubjectResult.data || []);
        const initialAssignments = {};
        (teacherSubjectResult.data || []).forEach((assignment) => {
          initialAssignments[assignment.subject_id] = assignment.teacher_id;
        });
        setSubjectTeacherAssignments(initialAssignments);
      } else {
        addNotification(
          teacherSubjectResult.message || "Failed to load teacher assignments",
          "error"
        );
      }
    } catch (error) {
      console.error("Load subject teacher data error:", error);
      addNotification("Failed to load data", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const loadTemplateData = async () => {
    setDataLoading(true);
    try {
      const result = await getGradingTemplatesBySchool(schoolId);
      if (result.success) {
        setGradingTemplates(result.data || []);
      } else {
        addNotification(result.message || "Failed to load templates", "error");
      }
    } catch (error) {
      console.error("Load template data error:", error);
      addNotification("Failed to load templates", "error");
    } finally {
      setDataLoading(false);
    }
  };

  // Handle subject teacher assignment
  const handleSubjectTeacherAssignment = (classId, subject, teacherId) => {
    setSubjectTeacherAssignments((prev) => ({
      ...prev,
      [`${classId}-${subject}`]: teacherId,
    }));
  };

  // Get assigned teacher for a class-subject combination
  const getAssignedTeacher = (classId, subject) => {
    return subjectTeacherAssignments[`${classId}-${subject}`] || "";
  };

  // Check if assignment is from previous session
  const isFromPreviousSession = (classId, subject) => {
    const key = `${classId}-${subject}`;
    return (
      previousSessionAssignments.hasOwnProperty(key) &&
      subjectTeacherAssignments[key] === previousSessionAssignments[key]
    );
  };

  // Calculate review statistics
  const getReviewStatistics = () => {
    // Count headmaster changes
    const headmasterChanges = Object.keys(headmasterAssignments).length;

    // Count subject teacher changes
    const subjectChanges = Object.keys(subjectTeacherAssignments).filter(
      (key) => {
        return (
          !previousSessionAssignments.hasOwnProperty(key) ||
          subjectTeacherAssignments[key] !== previousSessionAssignments[key]
        );
      }
    ).length;

    // Count subsessions created (non-default ones)
    const customSubsessions = sessionData.subsessions.filter(
      (sub) => !sub.isDefault
    ).length;

    // Student promotion statistics
    const promotedStudents = getStudentsByStatus("promote").length;
    const demotedStudents = getStudentsByStatus("demote").length;
    const graduatedStudents = getStudentsByStatus("graduate").length;

    return {
      headmasterChanges,
      subjectChanges,
      customSubsessions,
      promotedStudents,
      demotedStudents,
      graduatedStudents,
      totalSubsessions: sessionData.subsessions.length,
    };
  };

  // Calculate promotion analysis when template is selected
  const calculatePromotionAnalysis = (templateId) => {
    if (!templateId) {
      setPromotionAnalysis(null);
      return;
    }

    const processedStudents = processStudentsForPromotion(templateId);
    
    const promoted = processedStudents.filter(
      (s) => getStudentStatus(s) === "promote"
    );
    const demoted = processedStudents.filter(
      (s) => getStudentStatus(s) === "demote"
    );
    const graduated = processedStudents.filter(
      (s) => getStudentStatus(s) === "graduate"
    );

    setPromotionAnalysis({
      promoted: promoted.length,
      demoted: demoted.length,
      graduated: graduated.length,
      students: {
        promote: promoted,
        demote: demoted,
        graduate: graduated,
      },
      totalStudents: processedStudents.length,
      lastSession: processedStudents.length > 0 && processedStudents[0].classAssignmentSession
        ? processedStudents[0].classAssignmentSession
        : "Previous Session",
      templateId: templateId, // Store template ID for later use
    });
  };

  // Handle template selection
  const handleTemplateSelection = (templateId) => {
    handleInputChange("selectedPromotionTemplate", templateId);
    calculatePromotionAnalysis(templateId);
  };

  // Handle student status override
  const handleStudentOverride = (studentId, newStatus) => {
    setStudentOverrides((prev) => ({
      ...prev,
      [studentId]: newStatus,
    }));
    // Recalculate analysis after override
    calculatePromotionAnalysis(sessionData.selectedPromotionTemplate);
  };

  // Get student's effective status (override or original)
  const getStudentStatus = (student) => {
    return studentOverrides[student.id] || student.status;
  };

  // Get filtered students by status with overrides applied
  const getStudentsByStatus = (status) => {
    const templateId = promotionAnalysis?.templateId || sessionData.selectedPromotionTemplate;
    const processedStudents = processStudentsForPromotion(templateId);
    return processedStudents.filter(
      (student) => getStudentStatus(student) === status
    );
  };

  // Filter students by search query
  const getFilteredStudents = (status) => {
    const students = getStudentsByStatus(status);
    if (!searchQuery.trim()) return students;

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toString().includes(searchQuery) ||
        student.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Handle opening student list
  const handleOpenStudentList = (status) => {
    setShowStudentList(status);
    setSearchQuery(""); // Reset search when opening new list
  };

  // Handle closing student list
  const handleCloseStudentList = () => {
    setShowStudentList(null);
    setSearchQuery("");
  };

  // Handle add template - opens class promotion templates in new tab
  const handleAddTemplate = () => {
    window.open(
      "http://localhost:5173/admin/0808098080/templates/class_promotion",
      "_blank"
    );
  };

  // Handle refresh templates - reload from API
  const handleRefreshTemplates = async () => {
    console.log("Refreshing promotion data...");
    await loadPromotionData();
    addNotification("Promotion data refreshed", "success");
    
    // Recalculate analysis if template is selected
    if (sessionData.selectedPromotionTemplate) {
      calculatePromotionAnalysis(sessionData.selectedPromotionTemplate);
    }
  };

  // Handle headmaster assignment change
  const handleHeadmasterChange = (classId, teacherId) => {
    setHeadmasterAssignments((prev) => ({
      ...prev,
      [classId]: teacherId,
    }));
  };

  // Get current headmaster for a class (either assigned or default)
  const getCurrentHeadmaster = (classItem) => {
    if (headmasterAssignments[classItem.id]) {
      // Find the teacher by ID
      const teacher = sampleTeachers.find(
        (t) => t.id === headmasterAssignments[classItem.id]
      );
      return teacher ? teacher.id : classItem.currentHeadmaster;
    }
    // Find the current headmaster's ID from the teacher list
    const currentTeacher = sampleTeachers.find(
      (t) => t.name === classItem.currentHeadmaster
    );
    return currentTeacher ? currentTeacher.id : "";
  };

  const handleInputChange = (field, value) => {
    setSessionData((prev) => ({ ...prev, [field]: value }));

    // Live validation for dates
    if (field === "startDate") {
      validateStartDate(value, sessionData.endDate);
      // Also revalidate all subsessions when session start date changes
      setTimeout(() => {
        sessionData.subsessions.forEach((subsession, index) => {
          if (subsession.startDate || subsession.endDate) {
            validateSubsession(index, 'startDate', subsession.startDate, value, sessionData.endDate);
          }
        });
      }, 0);
    } else if (field === "endDate") {
      validateEndDate(sessionData.startDate, value);
      // Also revalidate all subsessions when session end date changes
      setTimeout(() => {
        sessionData.subsessions.forEach((subsession, index) => {
          if (subsession.startDate || subsession.endDate) {
            validateSubsession(index, 'endDate', subsession.endDate, sessionData.startDate, value);
          }
        });
      }, 0);
    }
  };

  // Validate start date
  const validateStartDate = (startDate, endDate) => {
    if (!startDate) {
      setDateErrors((prev) => ({ ...prev, startDate: "" }));
      return;
    }

    const start = new Date(startDate);

    // Check if start date is after end date
    if (endDate) {
      const end = new Date(endDate);
      if (start >= end) {
        setDateErrors((prev) => ({
          ...prev,
          startDate: "Start date must be before end date",
        }));
        return;
      }
    }

    setDateErrors((prev) => ({ ...prev, startDate: "" }));
  };

  // Validate end date
  const validateEndDate = (startDate, endDate) => {
    if (!endDate) {
      setDateErrors((prev) => ({ ...prev, endDate: "" }));
      return;
    }

    const end = new Date(endDate);

    // Check if end date is before start date
    if (startDate) {
      const start = new Date(startDate);
      if (end <= start) {
        setDateErrors((prev) => ({
          ...prev,
          endDate: "End date must be after start date",
        }));
        return;
      }

      // Check if session duration is too short (less than 30 days)
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        setDateErrors((prev) => ({
          ...prev,
          endDate: "Session must be at least 30 days long",
        }));
        return;
      }

      // Check if session duration is too long (more than 2 years)
      if (diffDays > 730) {
        setDateErrors((prev) => ({
          ...prev,
          endDate: "Session cannot exceed 2 years",
        }));
        return;
      }
    }

    setDateErrors((prev) => ({ ...prev, endDate: "" }));
  };

  // Validate subsession dates - accepts optional session dates for when session dates change
  const validateSubsession = (index, field, value, sessionStartOverride = null, sessionEndOverride = null) => {
    const subsession = { ...sessionData.subsessions[index], [field]: value };
    const errors = {};

    // Use override values if provided, otherwise use current sessionData
    const effectiveSessionStart = sessionStartOverride || sessionData.startDate;
    const effectiveSessionEnd = sessionEndOverride || sessionData.endDate;

    // Check if dates are within session dates
    if (subsession.startDate && effectiveSessionStart) {
      const subStart = new Date(subsession.startDate);
      const sessionStart = new Date(effectiveSessionStart);
      
      if (subStart < sessionStart) {
        errors.startDate = "Subsession start date must be within session dates";
      }
    }

    if (subsession.endDate && effectiveSessionEnd) {
      const subEnd = new Date(subsession.endDate);
      const sessionEnd = new Date(effectiveSessionEnd);
      
      if (subEnd > sessionEnd) {
        errors.endDate = "Subsession end date must be within session dates";
      }
    }

    // Check if start date is before end date
    if (subsession.startDate && subsession.endDate) {
      const subStart = new Date(subsession.startDate);
      const subEnd = new Date(subsession.endDate);
      
      if (subStart >= subEnd) {
        errors.startDate = "Start date must be before end date";
      }
    }

    // Check for overlaps with other subsessions
    sessionData.subsessions.forEach((otherSub, otherIndex) => {
      if (otherIndex === index) return; // Skip self
      
      if (!otherSub.startDate || !otherSub.endDate) return; // Skip incomplete subsessions
      if (!subsession.startDate || !subsession.endDate) return; // Skip if current is incomplete

      const subStart = new Date(subsession.startDate);
      const subEnd = new Date(subsession.endDate);
      const otherStart = new Date(otherSub.startDate);
      const otherEnd = new Date(otherSub.endDate);

      // Check if dates overlap: start1 < end2 AND end1 > start2
      // This allows subsessions to touch at boundaries
      const overlaps = (subStart < otherEnd && subEnd > otherStart);
      
      if (overlaps) {
        errors.overlap = `Dates overlap with ${otherSub.name}`;
      }
    });

    // Update subsession errors
    setSubsessionErrors((prev) => ({
      ...prev,
      [index]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  // Validate all subsessions
  const validateAllSubsessions = () => {
    let allValid = true;
    sessionData.subsessions.forEach((subsession, index) => {
      const isValid = validateSubsession(index, 'startDate', subsession.startDate);
      if (!isValid) allValid = false;
    });
    return allValid;
  };

  const handleCancel = () => {
    navigate(`/admin/${schoolId}/acedemic_seasion`);
  };

  const handleCreateSession = async () => {
    if (hasDraftSession) {
      addNotification(
        `Cannot create a new session. A draft session "${draftSessionName}" already exists. Please delete it first.`,
        "error"
      );
      return;
    }
    setIsSubmitting(true);
    try {
      // Get current user info
      let userId, userName, userRole;

      if (user?.admin) {
        userId = user.admin.admin_id;
        userName = user.admin.username;
        userRole = "admin";
      } else if (user?.staff) {
        userId = user.staff.staff_id;
        userName = `${user.staff.first_name || ""} ${
          user.staff.last_name || ""
        }`.trim();
        userRole = "staff";
      } else if (user?.teacher) {
        userId = user.teacher.teacher_id;
        userName = `${user.teacher.first_name || ""} ${
          user.teacher.last_name || ""
        }`.trim();
        userRole = "teacher";
      } else {
        userId = null;
        userName = null;
        userRole = "unknown";
      }

      // Prepare subsessions
      const subsessionsToCreate = sessionData.subsessions.map((sub) => ({
        term_name: sub.name,
        term_code: sub.code,
        term_start_date: sub.startDate,
        term_end_date: sub.endDate,
        term_status: "draft",
        grading_template_id: sub.gradingTemplateId,
        grading_template_name: sub.gradingTemplateName,
      }));

      // Prepare student promotions/graduations (if not skipped)
      const studentPromotionsToCreate = [];
      if (!skippedSteps.promotionGraduation && promotionAnalysis) {
        // Get all students with their effective status (including overrides)
        const allStudents = [
          ...promotionAnalysis.students.promote,
          ...promotionAnalysis.students.demote,
          ...promotionAnalysis.students.graduate,
        ];

        allStudents.forEach((student) => {
          const effectiveStatus = getStudentStatus(student);
          studentPromotionsToCreate.push({
            student_id: student.id,
            status: effectiveStatus, // "promote", "demote", or "graduate"
            current_class_id: student.currentClassId,
            current_class_name: student.currentClass,
            next_class_id: student.nextClassId,
            next_class_name: student.nextClass,
          });
        });
      }

      // Prepare complete session data
      const completeSessionData = {
        school_id: schoolId,
        session_name: sessionData.sessionName,
        session_code: sessionData.sessionCode,
        academic_year_start_date: sessionData.startDate,
        academic_year_end_date: sessionData.endDate,
        session_status: "draft",
        created_by: userId,
        created_by_name: userName,
        created_by_role: userRole,
        subsessions: subsessionsToCreate,
        student_promotions: studentPromotionsToCreate,
      };

      console.log("Creating complete session with data:", completeSessionData);

      // Make single API call to create everything
      const result = await createCompleteSession(completeSessionData);

      if (result.success) {
        const { data } = result;

        // Build success message
        const messages = [];

        if (data.subsessions.successful > 0) {
          messages.push(`${data.subsessions.successful} subsession(s)`);
        }

        if (data.student_promotions) {
          const totalProcessed = data.student_promotions.promoted + data.student_promotions.demoted + data.student_promotions.graduated;
          if (totalProcessed > 0) {
            const promotionDetails = [];
            if (data.student_promotions.promoted > 0) promotionDetails.push(`${data.student_promotions.promoted} promoted`);
            if (data.student_promotions.demoted > 0) promotionDetails.push(`${data.student_promotions.demoted} demoted`);
            if (data.student_promotions.graduated > 0) promotionDetails.push(`${data.student_promotions.graduated} graduated`);
            messages.push(`${totalProcessed} student(s) (${promotionDetails.join(", ")})`);
          }
        }

        // Show warnings for failures
        if (data.subsessions.failed > 0) {
          addNotification(
            `${data.subsessions.failed} subsession(s) failed to create`,
            "warning"
          );
        }

        if (data.student_promotions && data.student_promotions.failed > 0) {
          addNotification(
            `${data.student_promotions.failed} student promotion(s) failed`,
            "warning"
          );
        }

        // Show success message
        if (messages.length > 0) {
          addNotification(
            `Academic session created successfully with ${messages.join(", ")}`,
            "success"
          );
        } else {
          addNotification("Academic session created successfully", "success");
        }

        navigate(`/admin/${schoolId}/acedemic_seasion`);
      } else {
        addNotification(result.message || "Failed to create session", "error");
      }
    } catch (error) {
      console.error("Create session error:", error);
      addNotification("Failed to create academic session", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSessionBasics = () => {
    const hasErrors = dateErrors.startDate || dateErrors.endDate;
    
    return (
      <div className="section-content">
        <div 
          className="form-grid" 
          style={{ 
            border: hasErrors ? "2px solid #ef4444" : "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "16px",
            position: "relative"
          }}
        >
          <FormInput
            label="Session Name *"
            type="text"
            value={sessionData.sessionName}
            onChange={(value) => handleInputChange("sessionName", value)}
            placeholder="e.g., 2026/2027 Academic Session"
          />

          <FormInput
            label="Session Code *"
            type="text"
            value={sessionData.sessionCode}
            onChange={(value) => handleInputChange("sessionCode", value)}
            placeholder="e.g., 2026-2027 or SY2627"
          />

          <FormInput
            label="Session Start Date *"
            type="date"
            value={sessionData.startDate}
            onChange={(value) => handleInputChange("startDate", value)}
          />

          <FormInput
            label="Session End Date *"
            type="date"
            value={sessionData.endDate}
            onChange={(value) => handleInputChange("endDate", value)}
          />

          {/* Error messages at the bottom */}
          {hasErrors && (
            <div className="wizard-error-box">
              {dateErrors.startDate && (
                <div className="wizard-error-msg">
                  <span>⚠</span>
                  <span>{dateErrors.startDate}</span>
                </div>
              )}
              {dateErrors.endDate && (
                <div className="wizard-error-msg">
                  <span>⚠</span>
                  <span>{dateErrors.endDate}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPromotionGraduation = () => (
    <div className="section-content">
      <div className="promotion-template-selection">
        <div className="create-template-selection-header">
          <div className="create-header-content">
            <h4>Select Promotion Template</h4>
            <p>
              Choose a template that defines how students will be promoted to
              the next level
            </p>
          </div>
          <div className="create-header-actions">
            <button
              type="button"
              className="template-action-btn add-template-btn"
              onClick={handleAddTemplate}
              title="Add New Template"
            >
              <FaPlus />
            </button>
            <button
              type="button"
              className="template-action-btn refresh-templates-btn"
              onClick={handleRefreshTemplates}
              title="Refresh Templates"
            >
              <FaSync />
            </button>
          </div>
        </div>

        <div className="template-grid">
          {dataLoading ? (
            <div className="template-loading">
              <LoadingData message="Loading promotion templates..." />
            </div>
          ) : promotionTemplates.length === 0 ? (
            <div className="no-templates">
              <div className="no-templates-icon">
                <FaGraduationCap size={48} />
              </div>
              <h4>No Promotion Templates Found</h4>
              <p>
                No promotion templates are available for this school. 
                Create a new template to get started.
              </p>
              <Button
                onClick={handleAddTemplate}
                style={{
                  marginTop: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <FaPlus />
                Create First Template
              </Button>
            </div>
          ) : (
            promotionTemplates.map((template) => (
              <div
                key={template.template_id}
                className={`promotion-template-card ${
                  sessionData.selectedPromotionTemplate === template.template_id
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleTemplateSelection(template.template_id)}
              >
                <div className="template-card-header">
                  <h4 className="template-card-title">{template.name}</h4>
                  <span className={`template-card-status ${template.status}`}>
                    {template.status}
                  </span>
                </div>
                <p className="template-card-description">
                  {template.description || "No description provided"}
                </p>
                <div className="template-card-meta">
                  <span>Level: {template.level}</span>
                  <span>
                    Last Modified: {new Date(template.last_modified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Promotion Analysis Summary */}
      {dataLoading ? (
        <div className="promotion-analysis">
          <LoadingData message="Loading students and calculating promotions..." />
        </div>
      ) : promotionAnalysis ? (
        <div className="promotion-analysis">
          {/* Header band */}
          <div className="pa-header">
            <div className="pa-header-left">
              <span className="pa-eyebrow">
                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                  <path d="M11 3l8 4-8 4-8-4 8-4z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                  <path d="M3 15l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Promotion Analysis
              </span>
              <p className="pa-sub">Based on <strong>{promotionAnalysis.lastSession}</strong> — click a card to view students</p>
            </div>
            <div className="pa-total">
              <span className="pa-total-num">{promotionAnalysis.totalStudents}</span>
              <span className="pa-total-lbl">total students</span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="analysis-cards">
            <div className="analysis-card promote" onClick={() => handleOpenStudentList("promote")}>
              <div className="card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M14 4l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
              </div>
              <div className="card-content">
                <span className="count">{getStudentsByStatus("promote").length}</span>
                <h5>To Be Promoted</h5>
              </div>
            </div>

            <div className="analysis-card demote" onClick={() => handleOpenStudentList("demote")}>
              <div className="card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M14 8l2-2-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                </svg>
              </div>
              <div className="card-content">
                <span className="count">{getStudentsByStatus("demote").length}</span>
                <h5>To Be Demoted</h5>
              </div>
            </div>

            <div className="analysis-card graduate" onClick={() => handleOpenStudentList("graduate")}>
              <div className="card-icon">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M11 3l8 4-8 4-8-4 11-4z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                  <path d="M17 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 16.5c0 1.4 1.3 2.5 3 2.5s3-1.1 3-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="card-content">
                <span className="count">{getStudentsByStatus("graduate").length}</span>
                <h5>To Graduate</h5>
              </div>
            </div>
          </div>
        </div>
      ) : realStudents.length === 0 ? (
        <div className="promotion-analysis">
          <div className="no-students">
            <div className="no-students-icon">
              <svg width="48" height="48" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.3 }}>
                <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h4>No Students Found</h4>
            <p>
              No active students found in the last session. 
              Make sure students are enrolled and have class assignments.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderClassHeadmasters = () => {
    if (dataLoading) {
      return (
        <div className="section-content">
          <LoadingData message="Loading classes and teachers..." />
        </div>
      );
    }

    // Get current headmaster name for a class
    const getCurrentHeadmasterName = (classId) => {
      const activeHM = activeHeadmasters.find((hm) => hm.class_id === classId);
      return activeHM ? activeHM.teacher_name : "No headmaster assigned";
    };

    return (
      <div className="section-content">
        <div className="headmaster-assignment">
          <h4>Class Headmaster Assignments</h4>
          <p>Review and update headmaster assignments for the new session</p>

          {classes.length === 0 ? (
            <div className="no-data-message">
              <p>No active classes found. Please create classes first.</p>
            </div>
          ) : (
            <div className="class-list">
              {classes.map((classItem) => (
                <div
                  key={classItem.class_id}
                  className="class-assignment-row-simple"
                >
                  <div className="class-info">
                    <h5>{classItem.class_name}</h5>
                    <span className="class-level">{classItem.class_type}</span>
                    <div className="current-headmaster-info">
                      <span className="current-label">Current Headmaster:</span>
                      <span className="current-name">
                        {getCurrentHeadmasterName(classItem.class_id)}
                      </span>
                    </div>
                  </div>
                  <div className="headmaster-assignment-input">
                    <SearchableSelect
                      label="Assign Headmaster"
                      subtitle="Select a teacher to be the class headmaster"
                      value={headmasterAssignments[classItem.class_id] || ""}
                      onChange={(value) =>
                        handleHeadmasterChange(classItem.class_id, value)
                      }
                      options={teachers.map((teacher) => {
                        // Find staff info for teacher
                        const staffInfo = teacher.staff || {};
                        return {
                          value: teacher.teacher_id,
                          label: staffInfo.full_name || "Unknown",
                          subtitle: `Code: ${teacher.teacher_code || "N/A"}`,
                        };
                      })}
                      placeholder="Keep current or select new"
                      displayKey="label"
                      valueKey="value"
                      searchKeys={["label", "subtitle"]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSubjectTeachers = () => {
    if (dataLoading) {
      return (
        <div className="section-content">
          <LoadingData message="Loading subjects and assignments..." />
        </div>
      );
    }

    // Get subjects for the active class
    const getClassSubjects = (classId) => {
      // Get subjects with direct class_id
      const directSubjects = subjects.filter((s) => s.class_id === classId);

      // Get subject IDs from class_subject_assignments
      const assignedSubjectIds = classSubjectAssignments
        .filter((a) => a.class_id === classId)
        .map((a) => a.subject_id);

      // Get subjects that are assigned through class_subject_assignments
      const assignedSubjects = subjects.filter((s) =>
        assignedSubjectIds.includes(s.subject_id)
      );

      // Combine both, removing duplicates
      const allSubjects = [...directSubjects];
      assignedSubjects.forEach((s) => {
        if (
          !allSubjects.find((existing) => existing.subject_id === s.subject_id)
        ) {
          allSubjects.push(s);
        }
      });

      return allSubjects;
    };

    // Get current teacher assignment for a subject
    const getCurrentTeacherForSubject = (subjectId) => {
      return subjectTeacherAssignments[subjectId] || "";
    };

    // Check if assignment is from previous session
    const isSubjectFromPreviousSession = (subjectId) => {
      const currentAssignment = activeTeacherSubjectAssignments.find(
        (a) => a.subject_id === subjectId
      );
      return (
        currentAssignment &&
        subjectTeacherAssignments[subjectId] === currentAssignment.teacher_id
      );
    };

    return (
      <div className="section-content">
        <div className="subject-teacher-assignment">
          <h4>Subject Teacher Assignments</h4>
          <p>Assign teachers to subjects for each class</p>

          {classes.length === 0 ? (
            <div className="no-data-message">
              <p>No active classes found. Please create classes first.</p>
            </div>
          ) : (
            <>
              {/* Individual Class Tabs */}
              <div className="class-tabs">
                {classes.map((classItem, index) => (
                  <button
                    key={classItem.class_id}
                    className={`class-tab ${
                      activeClassTab === index ? "active" : ""
                    }`}
                    onClick={() => setActiveClassTab(index)}
                  >
                    {classItem.class_name}
                    <span className="class-level-badge">
                      {classItem.class_type}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Class Content */}
              <div className="class-tab-content">
                {classes[activeClassTab] && (
                  <div className="class-subject-section">
                    <div className="class-header">
                      <h5>{classes[activeClassTab].class_name}</h5>
                      <span className="class-level">
                        {classes[activeClassTab].class_type}
                      </span>
                    </div>

                    {(() => {
                      const classSubjects = getClassSubjects(
                        classes[activeClassTab].class_id
                      );

                      if (classSubjects.length === 0) {
                        return (
                          <div className="no-data-message">
                            <p>
                              No subjects assigned to this class. Please assign
                              subjects first.
                            </p>
                          </div>
                        );
                      }

                      // Count assignments from previous session
                      const previousSessionCount = classSubjects.filter((s) =>
                        isSubjectFromPreviousSession(s.subject_id)
                      ).length;

                      return (
                        <>
                          {/* Previous Session Summary */}
                          {previousSessionCount > 0 && (
                            <div className="previous-session-summary">
                              <div className="summary-info">
                                <span className="summary-text">
                                  {previousSessionCount} of{" "}
                                  {classSubjects.length} assignments carried
                                  over from previous session
                                </span>
                                <button
                                  className="clear-all-btn"
                                  onClick={() => {
                                    const newAssignments = {
                                      ...subjectTeacherAssignments,
                                    };
                                    classSubjects.forEach((subject) => {
                                      delete newAssignments[subject.subject_id];
                                    });
                                    setSubjectTeacherAssignments(
                                      newAssignments
                                    );
                                  }}
                                >
                                  Clear All Assignments
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="subject-assignments">
                            {classSubjects.map((subject) => (
                              <div
                                key={subject.subject_id}
                                className="subject-row"
                              >
                                <div className="subject-info">
                                  <span className="subject-name">
                                    {subject.subject_name}
                                  </span>
                                  <span className="subject-code">
                                    ({subject.subject_code})
                                  </span>
                                  {isSubjectFromPreviousSession(
                                    subject.subject_id
                                  ) && (
                                    <span className="previous-session-badge">
                                      From Previous Session
                                    </span>
                                  )}
                                </div>
                                <SearchableSelect
                                  value={getCurrentTeacherForSubject(
                                    subject.subject_id
                                  )}
                                  onChange={(value) => {
                                    setSubjectTeacherAssignments((prev) => ({
                                      ...prev,
                                      [subject.subject_id]: value,
                                    }));
                                  }}
                                  options={teachers.map((teacher) => {
                                    const staffInfo = teacher.staff || {};
                                    return {
                                      value: teacher.teacher_id,
                                      label: staffInfo.full_name || "Unknown",
                                      subtitle: `Code: ${
                                        teacher.teacher_code || "N/A"
                                      }`,
                                    };
                                  })}
                                  placeholder="Select teacher"
                                  displayKey="label"
                                  valueKey="value"
                                  searchKeys={["label", "subtitle"]}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderCreateSubsessions = () => (
    <div className="section-content">
      <div className="subsessions-config">
        <div className="sc-header">
          <span className="sc-eyebrow">
            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
              <rect x="2" y="4" width="18" height="15" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
              <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
            </svg>
            Subsession Configuration
          </span>
          <p className="sc-sub">Configure the terms/semesters for this academic session</p>
        </div>

        {dataLoading ? (
          <LoadingData message="Loading templates..." />
        ) : (
          <>
            <div className="subsessions-list">
          {sessionData.subsessions.map((subsession, index) => {
            const hasErrors = subsessionErrors[index] && Object.keys(subsessionErrors[index]).length > 0;
            
            return (
              <div key={index} className={`sc-subsession-card${hasErrors ? " sc-has-errors" : ""}`}>
                {/* Card top row — term info + remove button */}
                <div className="sc-card-top">
                  <div className="sc-card-top-left">
                    <span className="sc-term-num">Term {index + 1}</span>
                    {subsession.name && <span className="sc-term-name">{subsession.name}</span>}
                    {subsession.isDefault && <span className="sc-default-badge">Default</span>}
                  </div>
                  <button
                    className="sc-remove-btn"
                    onClick={() => {
                      if (sessionData.subsessions.length > 1) {
                        if (subsession.isDefault) {
                          const confirmRemove = window.confirm(
                            `Are you sure you want to remove the default term "${subsession.name}"? This action cannot be undone.`
                          );
                          if (!confirmRemove) return;
                        }
                        const newSubsessions = sessionData.subsessions.filter((_, i) => i !== index);
                        setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                        setSubsessionErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors[index];
                          return newErrors;
                        });
                        setTimeout(() => {
                          newSubsessions.forEach((_, i) => {
                            validateSubsession(i, 'startDate', newSubsessions[i].startDate);
                          });
                        }, 0);
                      }
                    }}
                    disabled={sessionData.subsessions.length <= 1}
                    title={sessionData.subsessions.length <= 1 ? "At least one subsession is required" : "Remove"}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Remove
                  </button>
                </div>

                {/* Form grid */}
                <div className="sc-card-body">
                  <div className="sc-form-grid">
                    <div className="sc-field">
                      <FormInput
                        label="Subsession Name *"
                        type="text"
                        value={subsession.name}
                        onChange={(value) => {
                          const newSubsessions = [...sessionData.subsessions];
                          newSubsessions[index] = { ...newSubsessions[index], name: value };
                          setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                        }}
                        placeholder="e.g., First Term"
                      />
                    </div>
                    <div className="sc-field">
                      <FormInput
                        label="Term Code *"
                        type="text"
                        value={subsession.code}
                        onChange={(value) => {
                          const newSubsessions = [...sessionData.subsessions];
                          newSubsessions[index] = { ...newSubsessions[index], code: value };
                          setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                        }}
                        placeholder="e.g., TERM1"
                      />
                    </div>
                    <div className="sc-field">
                      <FormInput
                        label="Start Date *"
                        type="date"
                        value={subsession.startDate}
                        onChange={(value) => {
                          const newSubsessions = [...sessionData.subsessions];
                          newSubsessions[index] = { ...newSubsessions[index], startDate: value };
                          setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                          setTimeout(() => validateSubsession(index, 'startDate', value), 0);
                        }}
                      />
                    </div>
                    <div className="sc-field">
                      <FormInput
                        label="End Date *"
                        type="date"
                        value={subsession.endDate}
                        onChange={(value) => {
                          const newSubsessions = [...sessionData.subsessions];
                          newSubsessions[index] = { ...newSubsessions[index], endDate: value };
                          setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                          setTimeout(() => validateSubsession(index, 'endDate', value), 0);
                        }}
                      />
                    </div>
                  </div>

                  {/* Template section */}
                  <div className="sc-template-section">
                    <div className="sc-template-warning">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L2 21h20L12 3z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round"/>
                        <path d="M12 9v5" stroke="#111111" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="17.5" r="1" fill="#111111"/>
                      </svg>
                      <span>Templates are required and cannot be changed later. Choose carefully.</span>
                    </div>

                    <SearchableSelect
                      label="Grading Template *"
                      placeholder="Select template..."
                      options={gradingTemplates.map(t => ({
                        value: t.template_id,
                        label: t.name,
                        subtitle: t.description
                      }))}
                      value={subsession.gradingTemplateId || ""}
                      onChange={(value) => {
                        const newSubsessions = [...sessionData.subsessions];
                        const selectedTemplate = gradingTemplates.find(t => t.template_id === value);
                        newSubsessions[index] = {
                          ...newSubsessions[index],
                          gradingTemplateId: value || null,
                          gradingTemplateName: selectedTemplate ? selectedTemplate.name : null,
                        };
                        setSessionData((prev) => ({ ...prev, subsessions: newSubsessions }));
                      }}
                      displayKey="label"
                      valueKey="value"
                      searchKeys={["label", "subtitle"]}
                      required={true}
                    />

                    {subsession.gradingTemplateId ? (
                      <div className="sc-template-selected">
                        <span className="sc-template-selected-label">Selected Template</span>
                        <span className="sc-template-selected-name">{subsession.gradingTemplateName}</span>
                        {gradingTemplates.find(t => t.template_id === subsession.gradingTemplateId)?.description && (
                          <span className="sc-template-selected-desc">
                            {gradingTemplates.find(t => t.template_id === subsession.gradingTemplateId).description}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="sc-template-empty">
                        <svg width="28" height="28" viewBox="0 0 22 22" fill="none" style={{ opacity: 0.3 }}>
                          <rect x="3" y="3" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                          <path d="M7 7h8M7 11h5M7 15h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                        <span>No template selected</span>
                      </div>
                    )}
                  </div>

                  {/* Error messages at the bottom of subsession */}
                  {hasErrors && (
                    <div className="wizard-error-box">
                      {subsessionErrors[index]?.startDate && (
                        <div className="wizard-error-msg">
                          <span>⚠</span>
                          <span>{subsessionErrors[index].startDate}</span>
                        </div>
                      )}
                      {subsessionErrors[index]?.endDate && (
                        <div className="wizard-error-msg">
                          <span>⚠</span>
                          <span>{subsessionErrors[index].endDate}</span>
                        </div>
                      )}
                      {subsessionErrors[index]?.overlap && (
                        <div className="wizard-error-msg">
                          <span>⚠</span>
                          <span>{subsessionErrors[index].overlap}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            </div>
            );
          })}
        </div>

        <Button
          variant="secondary"
          onClick={() => {
            const newSubsession = {
              name: `Custom Period ${sessionData.subsessions.length + 1}`,
              code: `CUSTOM${sessionData.subsessions.length + 1}`,
              startDate: "",
              endDate: "",
              isDefault: false,
              gradingTemplateId: null,
              gradingTemplateName: null,
            };
            setSessionData((prev) => ({
              ...prev,
              subsessions: [...prev.subsessions, newSubsession],
            }));
          }}
        >
          Add Subsession
        </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderReview = () => {
    const stats = getReviewStatistics();

    return (
      <div className="section-content">
        <div className="review-section">
          <div className="review-header">
            <h4>Session Creation Review</h4>
            <p>
              Review all configurations and changes before creating the new
              academic session
            </p>
          </div>

          {/* Session Basic Information */}
          <div className="review-card">
            <h5>Session Information</h5>
            <div className="info-grid info-grid-row">
              <div className="info-item">
                <label>Session Name</label>
                <span>{sessionData.sessionName || "Not set"}</span>
              </div>
              <div className="info-item">
                <label>Duration</label>
                <span>
                  {sessionData.startDate || "Not set"} → {sessionData.endDate || "Not set"}
                </span>
              </div>
              <div className="info-item">
                <label>Promotion Template</label>
                <span>
                  {promotionTemplates.find(
                    (t) => t.template_id === sessionData.selectedPromotionTemplate
                  )?.name || "Not selected"}
                </span>
              </div>
            </div>
          </div>

          {/* Student Promotion Summary */}
          {promotionAnalysis && (
            <div className="promotion-analysis">
              {/* Header band */}
              <div className="pa-header">
                <div className="pa-header-left">
                  <span className="pa-eyebrow">
                    <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                      <path d="M11 3l8 4-8 4-8-4 8-4z" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                      <path d="M3 15l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Promotion Analysis
                  </span>
                  <p className="pa-sub">Based on <strong>{promotionAnalysis.lastSession}</strong> — click a card to view students</p>
                </div>
                <div className="pa-total">
                  <span className="pa-total-num">{promotionAnalysis.totalStudents}</span>
                  <span className="pa-total-lbl">total students</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="analysis-cards">
                <div className="analysis-card promote" onClick={() => handleOpenStudentList("promote")}>
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M14 4l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="card-content">
                    <span className="count">{getStudentsByStatus("promote").length}</span>
                    <h5>To Be Promoted</h5>
                  </div>
                </div>

                <div className="analysis-card demote" onClick={() => handleOpenStudentList("demote")}>
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      <path d="M14 8l2-2-2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                    </svg>
                  </div>
                  <div className="card-content">
                    <span className="count">{getStudentsByStatus("demote").length}</span>
                    <h5>To Be Demoted</h5>
                  </div>
                </div>

                <div className="analysis-card graduate" onClick={() => handleOpenStudentList("graduate")}>
                  <div className="card-icon">
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M11 3l8 4-8 4-8-4 11-4z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M3 11l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
                      <path d="M17 11v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M14 16.5c0 1.4 1.3 2.5 3 2.5s3-1.1 3-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="card-content">
                    <span className="count">{getStudentsByStatus("graduate").length}</span>
                    <h5>To Graduate</h5>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subsessions Details */}
          <div className="review-card">
            <h5>Subsessions Configuration</h5>
            <div className="subsessions-review">
              {sessionData.subsessions.map((subsession, index) => (
                <div key={index} className="subsession-review-item">
                  <div className="subsession-name">
                    {subsession.name}
                    {subsession.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                  <div className="subsession-dates">
                    {subsession.startDate || "No start date"} -{" "}
                    {subsession.endDate || "No end date"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ready to Create */}
          <div className="review-card ready-card">
            <div className="ready-content">
              <div className="ready-icon">
                <FaCheck />
              </div>
              <div className="ready-text">
                <h6>Ready to Create Session</h6>
                <p>
                  All configurations have been reviewed. Click "Create Session"
                  to finalize the new academic session.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSectionContent = (sectionId) => {
    switch (sectionId) {
      case "sessionBasics":
        return renderSessionBasics();
      case "promotionGraduation":
        return renderPromotionGraduation();
      case "classHeadmasters":
        return renderClassHeadmasters();
      case "subjectTeachers":
        return renderSubjectTeachers();
      case "createSubsessions":
        return renderCreateSubsessions();
      case "review":
        return renderReview();
      default:
        return null;
    }
  };

  const isStepCompleted = (stepIndex) => {
    return stepIndex < currentStep || sections[stepIndex].isValid();
  };

  const isStepActive = (stepIndex) => {
    return stepIndex === currentStep;
  };

  const canAccessStep = (stepIndex) => {
    if (stepIndex === 0) return true;
    return sections[stepIndex - 1].isValid();
  };

  return (
    <InnerTabCon>
      <div className="create-session-wizard">
        <div className="wizard-header">
          <div className="header-content">
            <h2>Create New Academic Session</h2>
            <p>Set up a new academic session with customized settings</p>
          </div>
          <Button variant="secondary" onClick={handleCancel}>
            <FaArrowLeft /> Cancel
          </Button>
        </div>

        <div className="wizard-list">
          {hasDraftSession && (
            <div className="draft-warning">
              ⚠ A draft session <strong>"{draftSessionName}"</strong> already exists. You must delete it before creating a new session.
            </div>
          )}
          {sections.map((section, index) => (
            <div key={section.id} className="list-item">
              <div
                className={`item-header ${
                  isStepActive(index) ? "active" : ""
                } ${isStepCompleted(index) ? "completed" : ""} ${
                  !canAccessStep(index) ? "disabled" : ""
                } ${skippedSteps[section.id] ? "skipped" : ""}`}
                onClick={() => {
                  // Allow clicking on step header to navigate to that step
                  if (canAccessStep(index) && !isStepActive(index)) {
                    setCurrentStep(index);
                  }
                }}
                style={{
                  cursor: canAccessStep(index) ? "pointer" : "not-allowed",
                }}
              >
                <div className="item-info">
                  <div className="item-icon">
                    {isStepCompleted(index) ? <FaCheck /> : <section.icon />}
                  </div>
                  <div className="item-text">
                    <h3>
                      {section.title}
                      {skippedSteps[section.id] && (
                        <span
                          style={{
                            marginLeft: "8px",
                            fontSize: "12px",
                            color: "#9ca3af",
                            fontWeight: "normal",
                          }}
                        >
                          (Skipped)
                        </span>
                      )}
                    </h3>
                    <p>{section.description}</p>
                  </div>
                </div>
              </div>

              {isStepActive(index) && (
                <div className="item-content">
                  {getSectionContent(section.id)}

                  <div className="step-navigation">
                    {currentStep > 0 && (
                      <Button variant="secondary" onClick={handlePrevious}>
                        <FaChevronLeft /> Previous
                      </Button>
                    )}

                    <div className="nav-spacer"></div>

                    {/* Show Skip button for skippable steps */}
                    {sections[currentStep].skippable &&
                      !skippedSteps[sections[currentStep].id] && (
                        <Button
                          variant="secondary"
                          onClick={handleSkip}
                          style={{ marginRight: "12px" }}
                        >
                          Skip
                        </Button>
                      )}

                    {currentStep < sections.length - 1 ? (
                      <Button onClick={handleNext} disabled={!canProceed()}>
                        Next <FaChevronRight />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleCreateSession}
                        disabled={!canProceed() || isSubmitting || hasDraftSession}
                        size="large"
                      >
                        <FaCheck />{" "}
                        {isSubmitting ? "Creating..." : "Create Session"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Student List SlideInMenu */}
      <SlideInMenu
        isShow={showStudentList !== null}
        onClose={handleCloseStudentList}
        width="600px"
      >
        <div className="student-list-container">
          <div className="student-list-header">
            <div className="sl-header-left">
              <span className="sl-eyebrow">
                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="7" r="4" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                Students to be{" "}
                {showStudentList === "promote" ? "Promoted" : showStudentList === "demote" ? "Demoted" : "Graduated"}
              </span>
              <p className="sl-sub">
                {showStudentList === "promote" && "Students who will advance to the next grade level"}
                {showStudentList === "demote" && "Students who will repeat their current grade"}
                {showStudentList === "graduate" && "Students who will graduate from the school"}
              </p>
            </div>
            <button className="sl-close-btn" onClick={handleCloseStudentList}>×</button>
          </div>

          <div className="search-section">
            <div className="search-input-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, ID, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="student-list-content">
            <div className="student-count">
              {getFilteredStudents(showStudentList).length} student(s) found
            </div>

            <div className="student-list">
              {getFilteredStudents(showStudentList).map((student) => (
                <div key={student.id} className="mm-student-row-slide">
                  <div className="mm-student-info">
                    <div className="mm-student-main-info">
                      <h6>{student.name}</h6>
                      <span className="mm-student-id">ID: {student.id}</span>
                    </div>
                    <div className="mm-student-class-info">
                      <span className="mm-student-class-label">Current Class:</span>
                      <span className="mm-student-class">{student.currentClass}</span>
                    </div>
                    {student.status === "promote" && student.nextClass && student.nextClass !== "Graduate" && (
                      <div className="mm-student-next-class promote">
                        <span className="mm-next-class-label">Will Promote To:</span>
                        <span className="mm-next-class-value">{student.nextClass}</span>
                      </div>
                    )}
                    {student.status === "demote" && (
                      <div className="mm-student-next-class demote">
                        <span className="mm-next-class-label">Will Remain In:</span>
                        <span className="mm-next-class-value">{student.currentClass}</span>
                      </div>
                    )}
                    {student.status === "graduate" && (
                      <div className="mm-student-next-class graduate">
                        <span className="mm-next-class-label">Will Graduate</span>
                        <span className="mm-next-class-value">Complete Education</span>
                      </div>
                    )}
                  </div>

                  <div className="mm-student-actions">
                    <SearchableSelect
                      label="Change Status"
                      value={getStudentStatus(student)}
                      onChange={(value) =>
                        handleStudentOverride(student.id, value)
                      }
                      options={[
                        { value: "promote", label: "Promote", subtitle: "Advance to next grade" },
                        { value: "demote",  label: "Demote",  subtitle: "Repeat current grade" },
                        { value: "graduate",label: "Graduate",subtitle: "Complete education" },
                      ]}
                      placeholder="Select new status"
                      displayKey="label"
                      valueKey="value"
                      searchKeys={["label", "subtitle"]}
                    />
                  </div>
                </div>
              ))}

              {getFilteredStudents(showStudentList).length === 0 && (
                <div className="no-students">
                  <p>No students found matching your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default CreateSessionWizard;
