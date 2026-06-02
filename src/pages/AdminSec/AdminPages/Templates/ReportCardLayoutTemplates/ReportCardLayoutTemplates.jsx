import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useReportCardTemplate } from "../../../../../api_call/useReportCardTemplate";
import {
  FaPlus,
  FaEdit,
  FaCopy,
  FaTrash,
  FaGraduationCap,
  FaFileAlt,
  FaChartBar,
  FaUser,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";

const ReportCardLayoutTemplates = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const {
    createReportCardTemplate,
    getReportCardTemplatesBySchool,
    updateReportCardTemplate,
    deleteReportCardTemplate,
    duplicateReportCardTemplate,
    updateTemplateStatus,
  } = useReportCardTemplate();

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportCardTemplates, setReportCardTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch report card templates on component mount
  useEffect(() => {
    fetchReportCardTemplates();
  }, [schoolId]);

  const fetchReportCardTemplates = async () => {
    if (!schoolId) return;

    setDataLoading(true);
    try {
      const result = await getReportCardTemplatesBySchool(schoolId);

      if (result.success) {
        setReportCardTemplates(result.data);
      } else {
        addNotification(
          result.message || "Failed to fetch report card templates",
          "error"
        );
        setReportCardTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching report card templates:", error);
      addNotification("Error fetching report card templates", "error");
      setReportCardTemplates([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Sample report card templates data (removed - now using API)
  const sampleReportCardTemplates = [
    {
      id: 1,
      name: "Elementary Report Card",
      description:
        "Colorful and engaging report card design for elementary students",
      status: "active",
      lastModified: "2024-01-15",
      createdBy: "Elementary Coordinator",
      level: "Elementary",
      layout: "Portrait",
      gradeDisplay: "descriptive",
      includeGPA: false,
      includeRanking: false,
      includeAttendance: true,
      styling: {
        theme: "colorful",
        primaryColor: "#3b82f6",
        headerStyle: "decorative",
        fontFamily: "Arial",
      },
      sections: [
        "Student Information",
        "Student Photo",
        "Academic Performance",
        "Behavioral Assessment",
        "Teacher Comments",
        "Parent Signature",
      ],
      behavioralTraits: [
        "Neatness",
        "Punctuality",
        "Politeness",
        "Honesty",
        "Leadership",
        "Cooperation",
        "Attentiveness",
        "Initiative",
        "Self-Control",
        "Respect for Others",
      ],
      sampleData: {
        studentName: "Emma Johnson",
        class: "Grade 3A",
        session: "2023/2024 Academic Year",
        term: "First Term",
        subjects: [
          { name: "Mathematics", grade: "Excellent", score: "95%" },
          { name: "English Language", grade: "Very Good", score: "88%" },
          { name: "Science", grade: "Excellent", score: "92%" },
          { name: "Social Studies", grade: "Good", score: "82%" },
          { name: "Art & Craft", grade: "Excellent", score: "96%" },
        ],
        behavioralTraits: [
          { trait: "Neatness", rating: "Excellent", score: 5 },
          { trait: "Punctuality", rating: "Very Good", score: 4 },
          { trait: "Politeness", rating: "Excellent", score: 5 },
          { trait: "Honesty", rating: "Excellent", score: 5 },
          { trait: "Leadership", rating: "Good", score: 3 },
          { trait: "Cooperation", rating: "Very Good", score: 4 },
          { trait: "Attentiveness", rating: "Excellent", score: 5 },
          { trait: "Initiative", rating: "Good", score: 3 },
          { trait: "Self-Control", rating: "Very Good", score: 4 },
          { trait: "Respect for Others", rating: "Excellent", score: 5 },
        ],
        attendance: { present: 85, absent: 5, total: 90 },
        teacherComment:
          "Emma is an exceptional student who shows great enthusiasm for learning. She participates actively in class discussions and helps her classmates.",
        principalComment: "Keep up the excellent work!",
      },
    },
    {
      id: 2,
      name: "Secondary School Report",
      description:
        "Professional report card template for secondary school students",
      status: "active",
      lastModified: "2024-01-12",
      createdBy: "Academic Officer",
      level: "Secondary",
      layout: "Portrait",
      gradeDisplay: "letter",
      includeGPA: true,
      includeRanking: true,
      includeAttendance: true,
      styling: {
        theme: "professional",
        primaryColor: "#1f2937",
        headerStyle: "modern",
        fontFamily: "Times New Roman",
      },
      sections: [
        "Student Details",
        "Subject Grades",
        "Behavioral Assessment",
        "GPA Calculation",
        "Class Ranking",
        "Attendance Record",
        "Principal's Remarks",
      ],
      behavioralTraits: [
        "Neatness",
        "Punctuality",
        "Politeness",
        "Honesty",
        "Leadership",
        "Cooperation",
        "Attentiveness",
        "Initiative",
        "Self-Control",
        "Respect for Authority",
      ],
      sampleData: {
        studentName: "Michael Chen",
        class: "SS2 Science",
        session: "2023/2024 Academic Year",
        term: "Second Term",
        subjects: [
          { name: "Mathematics", grade: "A", score: "92%" },
          { name: "Physics", grade: "B+", score: "87%" },
          { name: "Chemistry", grade: "A-", score: "89%" },
          { name: "Biology", grade: "A", score: "94%" },
          { name: "English Language", grade: "B", score: "83%" },
          { name: "Further Mathematics", grade: "A", score: "91%" },
        ],
        behavioralTraits: [
          { trait: "Neatness", rating: "Good", score: 3 },
          { trait: "Punctuality", rating: "Excellent", score: 5 },
          { trait: "Politeness", rating: "Very Good", score: 4 },
          { trait: "Honesty", rating: "Excellent", score: 5 },
          { trait: "Leadership", rating: "Very Good", score: 4 },
          { trait: "Cooperation", rating: "Good", score: 3 },
          { trait: "Attentiveness", rating: "Excellent", score: 5 },
          { trait: "Initiative", rating: "Very Good", score: 4 },
          { trait: "Self-Control", rating: "Good", score: 3 },
          { trait: "Respect for Authority", rating: "Excellent", score: 5 },
        ],
        gpa: 3.8,
        ranking: "5th out of 45 students",
        attendance: { present: 88, absent: 2, total: 90 },
        teacherComment:
          "Michael demonstrates strong analytical skills and consistent academic performance.",
        principalComment:
          "Excellent academic progress. Continue the good work.",
      },
    },
    {
      id: 3,
      name: "Skills-Based Assessment",
      description:
        "Competency-based report card focusing on skills development",
      status: "active",
      lastModified: "2024-01-10",
      createdBy: "Curriculum Specialist",
      level: "All Levels",
      layout: "Landscape",
      gradeDisplay: "points",
      includeGPA: false,
      includeRanking: false,
      includeAttendance: true,
      styling: {
        theme: "minimal",
        primaryColor: "#059669",
        headerStyle: "minimal",
        fontFamily: "Helvetica",
      },
      sections: [
        "Core Competencies",
        "Skills Assessment",
        "Learning Objectives",
        "Progress Indicators",
        "Development Areas",
      ],
      sampleData: {
        studentName: "Sarah Williams",
        class: "Year 8",
        session: "2023/2024 Academic Year",
        term: "Third Term",
        competencies: [
          { name: "Critical Thinking", level: "Proficient", score: "4.2/5.0" },
          { name: "Communication", level: "Advanced", score: "4.8/5.0" },
          { name: "Collaboration", level: "Proficient", score: "4.0/5.0" },
          { name: "Creativity", level: "Advanced", score: "4.6/5.0" },
          { name: "Digital Literacy", level: "Developing", score: "3.5/5.0" },
        ],
        attendance: { present: 87, absent: 3, total: 90 },
        teacherComment:
          "Sarah shows excellent progress in most competency areas with particular strength in communication and creativity.",
        principalComment: "Well-rounded development across all skill areas.",
      },
    },
    {
      id: 4,
      name: "Bilingual Report Card",
      description:
        "Dual-language report card template (English/Local Language)",
      status: "draft",
      lastModified: "2024-01-08",
      createdBy: "Language Coordinator",
      level: "All Levels",
      layout: "Portrait",
      gradeDisplay: "percentage",
      includeGPA: true,
      includeRanking: false,
      includeAttendance: true,
      styling: {
        theme: "classic",
        primaryColor: "#7c3aed",
        headerStyle: "classic",
        fontFamily: "Georgia",
      },
      sections: [
        "Student Information (Bilingual)",
        "Subject Performance",
        "Behavioral Assessment",
        "Language Proficiency",
        "Cultural Activities",
        "Parent Conference Notes",
      ],
      behavioralTraits: [
        "Neatness",
        "Punctuality",
        "Politeness",
        "Honesty",
        "Leadership",
        "Cooperation",
        "Respect for Others",
        "Communication Skills",
      ],
      sampleData: {
        studentName: "Adaora Okafor / أدورا أوكافور",
        class: "JSS 2B",
        session: "2023/2024 Academic Year",
        term: "First Term",
        subjects: [
          { name: "Mathematics / الرياضيات", grade: "85%", score: "85%" },
          {
            name: "English Language / اللغة الإنجليزية",
            grade: "78%",
            score: "78%",
          },
          { name: "Hausa Language / اللغة الهوسا", grade: "92%", score: "92%" },
          {
            name: "Social Studies / الدراسات الاجتماعية",
            grade: "80%",
            score: "80%",
          },
          {
            name: "Basic Science / العلوم الأساسية",
            grade: "88%",
            score: "88%",
          },
        ],
        behavioralTraits: [
          { trait: "Neatness / النظافة", rating: "Very Good", score: 4 },
          { trait: "Punctuality / الالتزام بالوقت", rating: "Good", score: 3 },
          { trait: "Politeness / الأدب", rating: "Excellent", score: 5 },
          { trait: "Honesty / الصدق", rating: "Very Good", score: 4 },
          { trait: "Leadership / القيادة", rating: "Good", score: 3 },
          { trait: "Cooperation / التعاون", rating: "Very Good", score: 4 },
          {
            trait: "Cultural Respect / احترام الثقافة",
            rating: "Excellent",
            score: 5,
          },
          {
            trait: "Language Use / استخدام اللغة",
            rating: "Very Good",
            score: 4,
          },
        ],
        gpa: 3.2,
        attendance: { present: 86, absent: 4, total: 90 },
        teacherComment:
          "Adaora shows excellent proficiency in local language and good progress in other subjects.",
        principalComment:
          "Good bilingual development. Encourage continued practice in both languages.",
      },
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: "All Levels",
    layout: "Portrait",
    sections: [],
    behavioralTraits: [],
    gradeDisplay: "letter",
    includeGPA: true,
    includeRanking: false,
    includeAttendance: true,
    styling: {
      theme: "professional",
      primaryColor: "#3b82f6",
      headerStyle: "modern",
      fontFamily: "Arial",
    },
  });

  const levelOptions = [
    { value: "Elementary", label: "Elementary" },
    { value: "Secondary", label: "Secondary" },
    { value: "All Levels", label: "All Levels" },
  ];

  const layoutOptions = [
    { value: "Portrait", label: "Portrait" },
    { value: "Landscape", label: "Landscape" },
  ];

  const availableSections = [
    "Student Information",
    "Student Photo",
    "Academic Performance",
    "Subject Grades",
    "GPA Calculation",
    "Class Ranking",
    "Attendance Record",
    "Behavioral Assessment",
    "Extracurricular Activities",
    "Teacher Comments",
    "Principal's Remarks",
    "Parent Signature",
    "Skills Assessment",
    "Learning Objectives",
    "Progress Indicators",
    "Development Areas",
  ];

  const availableBehavioralTraits = [
    "Neatness",
    "Punctuality",
    "Politeness",
    "Honesty",
    "Leadership",
    "Cooperation",
    "Attentiveness",
    "Initiative",
    "Self-Control",
    "Respect for Others",
    "Respect for Authority",
    "Responsibility",
    "Perseverance",
    "Creativity",
    "Problem Solving",
    "Communication Skills",
    "Teamwork",
    "Time Management",
    "Organization",
    "Following Instructions",
  ];

  const themeOptions = [
    { value: "professional", label: "Professional" },
    { value: "colorful", label: "Colorful" },
    { value: "minimal", label: "Minimal" },
    { value: "classic", label: "Classic" },
  ];

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStylingChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      styling: { ...prev.styling, [field]: value },
    }));
  };

  const handleSectionToggle = (section) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
  };

  const handleBehavioralTraitToggle = (trait) => {
    setFormData((prev) => ({
      ...prev,
      behavioralTraits: prev.behavioralTraits.includes(trait)
        ? prev.behavioralTraits.filter((t) => t !== trait)
        : [...prev.behavioralTraits, trait],
    }));
  };

  const handleCreateTemplate = () => {
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      level: "All Levels",
      layout: "Portrait",
      sections: [],
      behavioralTraits: [],
      gradeDisplay: "letter",
      includeGPA: true,
      includeRanking: false,
      includeAttendance: true,
      styling: {
        theme: "professional",
        primaryColor: "#3b82f6",
        headerStyle: "modern",
        fontFamily: "Arial",
      },
    });
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    const sections = template.sections || [];
    const behavioralTraits =
      template.behavioral_traits || template.behavioralTraits || [];
    const styling = template.styling || {
      theme: "professional",
      primary_color: "#3b82f6",
      header_style: "modern",
      font_family: "Arial",
    };

    setFormData({
      name: template.name,
      description: template.description,
      level: template.level,
      layout: template.layout,
      sections: sections,
      behavioralTraits: behavioralTraits,
      gradeDisplay: template.grade_display || template.gradeDisplay,
      includeGPA:
        template.include_gpa !== undefined
          ? template.include_gpa
          : template.includeGPA,
      includeRanking:
        template.include_ranking !== undefined
          ? template.include_ranking
          : template.includeRanking,
      includeAttendance:
        template.include_attendance !== undefined
          ? template.include_attendance
          : template.includeAttendance,
      styling: styling,
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsDetailMenuOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.name.trim() === "") {
      addNotification("Template name is required", "error");
      return;
    }

    if (formData.sections.length === 0) {
      addNotification("At least one section is required", "error");
      return;
    }

    // Validate behavioral traits if Behavioral Assessment is selected
    if (
      formData.sections.includes("Behavioral Assessment") &&
      formData.behavioralTraits.length === 0
    ) {
      addNotification(
        "At least one behavioral trait is required when Behavioral Assessment section is included",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const templateData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        level: formData.level,
        layout: formData.layout,
        grade_display: formData.gradeDisplay,
        include_gpa: formData.includeGPA,
        include_ranking: formData.includeRanking,
        include_attendance: formData.includeAttendance,
        sections: formData.sections,
        behavioral_traits: formData.behavioralTraits,
        styling: formData.styling,
        created_by: null, // TODO: Get from auth context
        modified_by: null, // TODO: Get from auth context
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateReportCardTemplate(
          selectedTemplate.template_id,
          templateData
        );
      } else {
        // Create new template
        result = await createReportCardTemplate(templateData);
      }

      if (result.success) {
        addNotification(
          selectedTemplate
            ? "Report card template updated successfully"
            : "Report card template created successfully",
          "success"
        );
        setIsCreateMenuOpen(false);
        // Refresh templates list
        fetchReportCardTemplates();
      } else {
        addNotification(
          result.message ||
            `Failed to ${
              selectedTemplate ? "update" : "create"
            } report card template`,
          "error"
        );
      }
    } catch (error) {
      console.error("Submit report card template error:", error);
      addNotification("Error submitting report card template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleDuplicate = async (template) => {
    try {
      const result = await duplicateReportCardTemplate(
        template.template_id,
        null // TODO: Get from auth context
      );

      if (result.success) {
        addNotification(
          "Report card template duplicated successfully",
          "success"
        );
        // Refresh templates list
        fetchReportCardTemplates();
      } else {
        addNotification(
          result.message || "Failed to duplicate report card template",
          "error"
        );
      }
    } catch (error) {
      console.error("Duplicate template error:", error);
      addNotification("Error duplicating report card template", "error");
    }
  };

  const handleDelete = async (template) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteReportCardTemplate(template.template_id);

      if (result.success) {
        addNotification("Report card template deleted successfully", "success");
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchReportCardTemplates();
      } else {
        addNotification(
          result.message || "Failed to delete report card template",
          "error"
        );
      }
    } catch (error) {
      console.error("Delete template error:", error);
      addNotification("Error deleting report card template", "error");
    }
  };

  const handleStatusToggle = async (template) => {
    const newStatus = template.status === "active" ? "archived" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    if (
      !window.confirm(`Are you sure you want to ${action} "${template.name}"?`)
    ) {
      return;
    }

    try {
      const result = await updateTemplateStatus(
        template.template_id,
        newStatus,
        null // TODO: Get from auth context
      );

      if (result.success) {
        addNotification(
          `Report card template ${action}d successfully`,
          "success"
        );
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchReportCardTemplates();
      } else {
        addNotification(
          result.message || `Failed to ${action} report card template`,
          "error"
        );
      }
    } catch (error) {
      console.error(`${action} template error:`, error);
      addNotification(`Error ${action}ing report card template`, "error");
    }
  };

  return (
    <InnerTabCon>
      <div className="templates-container">
        <div className="templates-header">
          <div className="templates-header-left">
            <h2>Report Card Layout Templates</h2>
            <p>
              Design and customize report card layouts for different grade
              levels
            </p>
          </div>
          <div className="templates-actions">
            <Button onClick={handleCreateTemplate}>
              <FaPlus size={14} style={{ marginRight: "8px" }} />
              Create Template
            </Button>
          </div>
        </div>

        <div className="template-section">
          <h3>Available Report Card Templates</h3>

          {dataLoading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <LoadingData message="Loading report card templates..." />
            </div>
          ) : reportCardTemplates.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#6b7280",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                No report card templates found
              </p>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
                Create your first report card template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <FaPlus size={14} style={{ marginRight: "8px" }} />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="template-grid">
              {reportCardTemplates.map((template) => {
                const sections = template.sections || [];
                const gradeDisplay =
                  template.grade_display || template.gradeDisplay;

                return (
                  <div
                    key={template.template_id || template.id}
                    className="template-card"
                    onClick={() => handleViewTemplate(template)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="template-card-header">
                      <h4 className="template-card-title">{template.name}</h4>
                      <span
                        className={`template-card-status ${template.status}`}
                      >
                        {template.status}
                      </span>
                    </div>
                    <p className="template-card-description">
                      {template.description}
                    </p>
                    <div className="template-details">
                      <div className="template-detail-item">
                        <strong>Level:</strong> {template.level}
                      </div>
                      <div className="template-detail-item">
                        <strong>Layout:</strong> {template.layout}
                      </div>
                      <div className="template-detail-item">
                        <strong>Sections:</strong> {sections.length}
                      </div>
                      <div className="template-detail-item">
                        <strong>Grade Display:</strong> {gradeDisplay}
                      </div>
                    </div>
                    <div className="report-sections-preview">
                      <strong>Key Sections:</strong>
                      <ul>
                        {sections.slice(0, 3).map((section, index) => (
                          <li key={index}>{section}</li>
                        ))}
                        {sections.length > 3 && (
                          <li>+{sections.length - 3} more sections</li>
                        )}
                      </ul>
                    </div>
                    <div className="template-card-meta">
                      <span>
                        Modified:{" "}
                        {template.last_modified || template.lastModified}
                      </span>
                      <span>
                        By:{" "}
                        {template.created_by || template.createdBy || "----"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create/Edit Template SlideInMenu */}
        <SlideInMenu
          isShow={isCreateMenuOpen}
          onClose={() => setIsCreateMenuOpen(false)}
          width="700px"
        >
          <div className="create-template-container">
            <div className="create-template-header">
              <h2>
                {selectedTemplate ? "Edit" : "Create"} Report Card Template
              </h2>
              <p>Design your report card layout and structure</p>
            </div>

            <div className="create-template-form">
              <div className="form-row">
                <FormInput
                  label="Template Name *"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  placeholder="e.g., Elementary Report Card"
                />

                <FormInput
                  label="Grade Level"
                  type="select"
                  value={formData.level}
                  onChange={handleInputChange("level")}
                  options={levelOptions}
                />
              </div>

              <FormInput
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Describe this report card template..."
                height="80px"
              />

              <div className="form-row">
                <FormInput
                  label="Layout Orientation"
                  type="select"
                  value={formData.layout}
                  onChange={handleInputChange("layout")}
                  options={layoutOptions}
                />

                <FormInput
                  label="Grade Display"
                  type="select"
                  value={formData.gradeDisplay}
                  onChange={handleInputChange("gradeDisplay")}
                  options={[
                    { value: "letter", label: "Letter Grades (A, B, C)" },
                    { value: "percentage", label: "Percentage (85%, 90%)" },
                    { value: "points", label: "Points (4.0, 3.5)" },
                    {
                      value: "descriptive",
                      label: "Descriptive (Excellent, Good)",
                    },
                  ]}
                />
              </div>

              <div className="template-options-section">
                <h3>Report Card Options</h3>
                <div className="options-grid">
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.includeGPA}
                      onChange={(e) =>
                        handleInputChange("includeGPA")(e.target.checked)
                      }
                    />
                    <span>Include GPA Calculation</span>
                  </label>
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.includeRanking}
                      onChange={(e) =>
                        handleInputChange("includeRanking")(e.target.checked)
                      }
                    />
                    <span>Include Class Ranking</span>
                  </label>
                  <label className="option-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.includeAttendance}
                      onChange={(e) =>
                        handleInputChange("includeAttendance")(e.target.checked)
                      }
                    />
                    <span>Include Attendance Record</span>
                  </label>
                </div>
              </div>

              <div className="template-sections-section">
                <h3>Report Card Sections</h3>
                <p>Select the sections to include in your report card:</p>
                <div className="sections-grid">
                  {availableSections.map((section) => (
                    <label key={section} className="section-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.sections.includes(section)}
                        onChange={() => handleSectionToggle(section)}
                      />
                      <span>{section}</span>
                      {section === "Behavioral Assessment" && (
                        <small
                          style={{
                            display: "block",
                            color: "#6b7280",
                            fontSize: "11px",
                            marginTop: "2px",
                          }}
                        >
                          (Selecting this will show behavioral traits options
                          below)
                        </small>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Behavioral Traits Selection */}
              {formData.sections.includes("Behavioral Assessment") && (
                <div
                  className="behavioral-traits-section"
                  style={{ border: "2px solid #3b82f6", background: "#eff6ff" }}
                >
                  <h3 style={{ color: "#1e40af" }}>
                    🎯 Behavioral Traits Selection
                  </h3>
                  <p>
                    <strong>
                      Select the specific behavioral traits to assess in your
                      report card:
                    </strong>
                  </p>
                  <div className="traits-grid">
                    {availableBehavioralTraits.map((trait) => (
                      <label key={trait} className="trait-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.behavioralTraits.includes(trait)}
                          onChange={() => handleBehavioralTraitToggle(trait)}
                        />
                        <span>{trait}</span>
                      </label>
                    ))}
                  </div>
                  {formData.behavioralTraits.length > 0 && (
                    <div className="selected-traits-preview">
                      <strong>
                        ✅ Selected Traits ({formData.behavioralTraits.length}):
                      </strong>
                      <div className="selected-traits-list">
                        {formData.behavioralTraits.map((trait, index) => (
                          <span key={trait} className="selected-trait-tag">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.behavioralTraits.length === 0 && (
                    <div
                      style={{
                        padding: "12px",
                        background: "#fef3c7",
                        border: "1px solid #f59e0b",
                        borderRadius: "6px",
                        marginTop: "12px",
                      }}
                    >
                      <strong style={{ color: "#92400e" }}>
                        ⚠️ No behavioral traits selected
                      </strong>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: "13px",
                          color: "#92400e",
                        }}
                      >
                        Please select at least one behavioral trait to assess,
                        or uncheck "Behavioral Assessment" in the sections
                        above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="template-styling-section">
                <h3>Design & Styling</h3>
                <div className="form-row">
                  <FormInput
                    label="Theme"
                    type="select"
                    value={formData.styling.theme}
                    onChange={handleStylingChange("theme")}
                    options={themeOptions}
                  />

                  <FormInput
                    label="Primary Color"
                    type="color"
                    value={formData.styling.primaryColor}
                    onChange={handleStylingChange("primaryColor")}
                  />
                </div>

                <div className="form-row">
                  <FormInput
                    label="Header Style"
                    type="select"
                    value={formData.styling.headerStyle}
                    onChange={handleStylingChange("headerStyle")}
                    options={[
                      { value: "modern", label: "Modern" },
                      { value: "classic", label: "Classic" },
                      { value: "minimal", label: "Minimal" },
                      { value: "decorative", label: "Decorative" },
                    ]}
                  />

                  <FormInput
                    label="Font Family"
                    type="select"
                    value={formData.styling.fontFamily}
                    onChange={handleStylingChange("fontFamily")}
                    options={[
                      { value: "Arial", label: "Arial" },
                      { value: "Times New Roman", label: "Times New Roman" },
                      { value: "Helvetica", label: "Helvetica" },
                      { value: "Georgia", label: "Georgia" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Section */}
            {isPreviewOpen && (
              <div className="template-preview-section">
                <div className="preview-header">
                  <h3>📋 Template Preview</h3>
                  <button
                    className="close-preview-btn"
                    onClick={() => setIsPreviewOpen(false)}
                  >
                    ✕ Close Preview
                  </button>
                </div>
                <div className="preview-content">
                  <div
                    className={`report-card-preview ${formData.layout.toLowerCase()} ${
                      formData.styling.theme
                    }`}
                    style={{
                      fontFamily: formData.styling.fontFamily,
                      "--primary-color": formData.styling.primaryColor,
                    }}
                  >
                    {/* Report Card Header */}
                    <div className="report-header">
                      <div className="school-logo">
                        <div className="logo-placeholder">
                          <FaGraduationCap size={32} />
                        </div>
                      </div>
                      <div className="school-info">
                        <h2>[School Name]</h2>
                        <p>[School Address]</p>
                        <h3>STUDENT REPORT CARD</h3>
                      </div>
                      <div className="report-session">
                        <p>
                          <strong>Session:</strong> 2023/2024 Academic Year
                        </p>
                        <p>
                          <strong>Term:</strong> First Term
                        </p>
                      </div>
                    </div>

                    {/* Student Information */}
                    {formData.sections.includes("Student Information") ||
                    formData.sections.includes("Student Details") ? (
                      <div className="student-info-section">
                        <h4>Student Information</h4>
                        <div className="student-details">
                          <div className="student-photo">
                            <FaUser size={40} />
                          </div>
                          <div className="student-data">
                            <p>
                              <strong>Name:</strong> [Student Name]
                            </p>
                            <p>
                              <strong>Class:</strong> [Class/Grade]
                            </p>
                            <p>
                              <strong>Student ID:</strong> STU/2024/001
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Academic Performance */}
                    {formData.sections.includes("Academic Performance") ||
                    formData.sections.includes("Subject Grades") ? (
                      <div className="academic-section">
                        <h4>Academic Performance</h4>
                        <table className="grades-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Score</th>
                              <th>Grade</th>
                              <th>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Mathematics</td>
                              <td>92%</td>
                              <td className="grade-cell">A</td>
                              <td>Excellent</td>
                            </tr>
                            <tr>
                              <td>English Language</td>
                              <td>88%</td>
                              <td className="grade-cell">B+</td>
                              <td>Very Good</td>
                            </tr>
                            <tr>
                              <td>Science</td>
                              <td>85%</td>
                              <td className="grade-cell">B</td>
                              <td>Good</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : null}

                    {/* Behavioral Assessment */}
                    {formData.sections.includes("Behavioral Assessment") &&
                    formData.behavioralTraits &&
                    formData.behavioralTraits.length > 0 ? (
                      <div className="behavioral-section">
                        <h4>Behavioral Assessment</h4>
                        <div className="behavioral-traits-grid">
                          {formData.behavioralTraits.map((traitName, index) => {
                            // Generate sample data for preview
                            const traitScores = {
                              Neatness: { rating: "Very Good", score: 4 },
                              Punctuality: { rating: "Excellent", score: 5 },
                              Politeness: { rating: "Excellent", score: 5 },
                              Honesty: { rating: "Excellent", score: 5 },
                              Leadership: { rating: "Good", score: 3 },
                              Cooperation: { rating: "Very Good", score: 4 },
                              Attentiveness: { rating: "Excellent", score: 5 },
                              Initiative: { rating: "Good", score: 3 },
                              "Self-Control": { rating: "Very Good", score: 4 },
                              "Respect for Others": {
                                rating: "Excellent",
                                score: 5,
                              },
                              "Respect for Authority": {
                                rating: "Excellent",
                                score: 5,
                              },
                              Responsibility: { rating: "Very Good", score: 4 },
                              Perseverance: { rating: "Good", score: 3 },
                              Creativity: { rating: "Very Good", score: 4 },
                              "Problem Solving": { rating: "Good", score: 3 },
                              "Communication Skills": {
                                rating: "Very Good",
                                score: 4,
                              },
                              Teamwork: { rating: "Excellent", score: 5 },
                              "Time Management": { rating: "Good", score: 3 },
                              Organization: { rating: "Very Good", score: 4 },
                              "Following Instructions": {
                                rating: "Excellent",
                                score: 5,
                              },
                            };

                            const traitData = traitScores[traitName] || {
                              rating: "Good",
                              score: 3,
                            };

                            return (
                              <div key={index} className="trait-item">
                                <div className="trait-info">
                                  <span className="trait-name">
                                    {traitName}
                                  </span>
                                  <span className="trait-rating">
                                    {traitData.rating}
                                  </span>
                                </div>
                                <div className="trait-score">
                                  <div className="score-bar">
                                    <div
                                      className="score-fill"
                                      style={{
                                        width: `${
                                          (traitData.score / 5) * 100
                                        }%`,
                                      }}
                                    ></div>
                                  </div>
                                  <span className="score-text">
                                    {traitData.score}/5
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* GPA and Ranking */}
                    {(formData.includeGPA || formData.includeRanking) && (
                      <div className="summary-section">
                        {formData.includeGPA && (
                          <div className="gpa-section">
                            <strong>GPA: 3.8</strong>
                          </div>
                        )}
                        {formData.includeRanking && (
                          <div className="ranking-section">
                            <strong>
                              Class Position: 5th out of 45 students
                            </strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attendance */}
                    {formData.includeAttendance && (
                      <div className="attendance-section">
                        <h4>Attendance Record</h4>
                        <div className="attendance-stats">
                          <span>Days Present: 88</span>
                          <span>Days Absent: 2</span>
                          <span>Total Days: 90</span>
                          <span>Attendance Rate: 98%</span>
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {formData.sections.includes("Teacher Comments") && (
                      <div className="comments-section">
                        <div className="teacher-comment">
                          <h5>Class Teacher's Comment:</h5>
                          <p>
                            [Student] demonstrates excellent academic
                            performance and positive behavioral traits.
                          </p>
                          <p>
                            <strong>Signature:</strong> ________________
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.sections.includes("Principal's Remarks") && (
                      <div className="comments-section">
                        <div className="principal-comment">
                          <h5>Principal's Comment:</h5>
                          <p>
                            Keep up the excellent work and continue to strive
                            for excellence.
                          </p>
                          <p>
                            <strong>Signature:</strong> ________________
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Parent Signature */}
                    {formData.sections.includes("Parent Signature") && (
                      <div className="parent-section">
                        <div className="signature-area">
                          <p>
                            <strong>Parent/Guardian Signature:</strong>{" "}
                            ________________
                          </p>
                          <p>
                            <strong>Date:</strong> ________________
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="create-template-footer">
              <Button
                variant="secondary"
                onClick={() => setIsCreateMenuOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button variant="secondary" onClick={handlePreview}>
                Preview
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  formData.sections.length === 0 ||
                  (formData.sections.includes("Behavioral Assessment") &&
                    formData.behavioralTraits.length === 0) ||
                  isSubmitting
                }
              >
                {isSubmitting
                  ? selectedTemplate
                    ? "Updating..."
                    : "Creating..."
                  : selectedTemplate
                  ? "Update Template"
                  : "Create Template"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Template Detail SlideInMenu */}
        <SlideInMenu
          isShow={isDetailMenuOpen}
          onClose={() => setIsDetailMenuOpen(false)}
          width="900px"
        >
          {selectedTemplate && (
            <div className="template-detail-container">
              <div className="template-detail-header">
                <div className="template-detail-title">
                  <h2>{selectedTemplate.name}</h2>
                  <span
                    className={`template-card-status ${selectedTemplate.status}`}
                  >
                    {selectedTemplate.status}
                  </span>
                </div>
                <p className="template-detail-description">
                  {selectedTemplate.description}
                </p>
                <div className="template-detail-meta">
                  <div className="template-meta-item">
                    <strong>Last Modified:</strong>{" "}
                    {selectedTemplate.lastModified}
                  </div>
                  <div className="template-meta-item">
                    <strong>Created By:</strong> {selectedTemplate.createdBy}
                  </div>
                  <div className="template-meta-item">
                    <strong>Grade Level:</strong> {selectedTemplate.level}
                  </div>
                  <div className="template-meta-item">
                    <strong>Layout:</strong> {selectedTemplate.layout}
                  </div>
                </div>
              </div>

              <div className="template-detail-content">
                {/* Template Configuration Section */}
                <div className="detail-section">
                  <h3>
                    <FaFileAlt size={16} style={{ marginRight: "8px" }} />
                    Template Configuration
                  </h3>
                  <div className="config-grid">
                    <div className="config-item">
                      <strong>Grade Display:</strong>
                      <span>
                        {selectedTemplate.grade_display ||
                          selectedTemplate.gradeDisplay}
                      </span>
                    </div>
                    <div className="config-item">
                      <strong>Include GPA:</strong>
                      <span>
                        {(
                          selectedTemplate.include_gpa !== undefined
                            ? selectedTemplate.include_gpa
                            : selectedTemplate.includeGPA
                        )
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="config-item">
                      <strong>Include Ranking:</strong>
                      <span>
                        {(
                          selectedTemplate.include_ranking !== undefined
                            ? selectedTemplate.include_ranking
                            : selectedTemplate.includeRanking
                        )
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="config-item">
                      <strong>Include Attendance:</strong>
                      <span>
                        {(
                          selectedTemplate.include_attendance !== undefined
                            ? selectedTemplate.include_attendance
                            : selectedTemplate.includeAttendance
                        )
                          ? "Yes"
                          : "No"}
                      </span>
                    </div>
                    <div className="config-item">
                      <strong>Theme:</strong>
                      <span>
                        {selectedTemplate.styling?.theme || "professional"}
                      </span>
                    </div>
                    <div className="config-item">
                      <strong>Font Family:</strong>
                      <span>
                        {selectedTemplate.styling?.font_family ||
                          selectedTemplate.styling?.fontFamily ||
                          "Arial"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections Overview */}
                <div className="detail-section">
                  <h3>
                    <FaChartBar size={16} style={{ marginRight: "8px" }} />
                    Report Card Sections (
                    {(selectedTemplate.sections || []).length})
                  </h3>
                  <div className="sections-overview">
                    {(selectedTemplate.sections || []).map((section, index) => (
                      <div key={index} className="section-item">
                        <span className="section-number">{index + 1}</span>
                        <span className="section-name">{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Behavioral Traits Overview */}
                {(selectedTemplate.sections || []).includes(
                  "Behavioral Assessment"
                ) &&
                  (selectedTemplate.behavioral_traits ||
                    selectedTemplate.behavioralTraits) &&
                  (
                    selectedTemplate.behavioral_traits ||
                    selectedTemplate.behavioralTraits
                  ).length > 0 && (
                    <div className="detail-section">
                      <h3>
                        <FaUser size={16} style={{ marginRight: "8px" }} />
                        Selected Behavioral Traits (
                        {
                          (
                            selectedTemplate.behavioral_traits ||
                            selectedTemplate.behavioralTraits
                          ).length
                        }
                        )
                      </h3>
                      <div className="behavioral-traits-overview">
                        {(
                          selectedTemplate.behavioral_traits ||
                          selectedTemplate.behavioralTraits
                        ).map((trait, index) => (
                          <div key={index} className="trait-overview-item">
                            <span className="trait-number">{index + 1}</span>
                            <span className="trait-name">{trait}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Report Card Preview */}
                <div className="detail-section">
                  <h3>
                    <FaGraduationCap size={16} style={{ marginRight: "8px" }} />
                    Report Card Preview
                  </h3>
                  <div className="report-card-preview-container">
                    <div
                      className={`report-card-preview ${selectedTemplate.layout.toLowerCase()} ${
                        selectedTemplate.styling.theme
                      }`}
                      style={{
                        fontFamily: selectedTemplate.styling.fontFamily,
                        "--primary-color":
                          selectedTemplate.styling.primaryColor,
                      }}
                    >
                      {/* Report Card Header */}
                      <div className="report-header">
                        <div className="school-logo">
                          <div className="logo-placeholder">
                            <FaGraduationCap size={32} />
                          </div>
                        </div>
                        <div className="school-info">
                          <h2>[School Name]</h2>
                          <p>[School Address]</p>
                          <h3>STUDENT REPORT CARD</h3>
                        </div>
                        <div className="report-session">
                          <p>
                            <strong>Session:</strong>{" "}
                            {selectedTemplate.sampleData?.session ||
                              "2023/2024 Academic Year"}
                          </p>
                          <p>
                            <strong>Term:</strong>{" "}
                            {selectedTemplate.sampleData?.term || "First Term"}
                          </p>
                        </div>
                      </div>

                      {/* Student Information */}
                      {selectedTemplate.sections.includes(
                        "Student Information"
                      ) ||
                      selectedTemplate.sections.includes("Student Details") ||
                      selectedTemplate.sections.includes(
                        "Student Information (Bilingual)"
                      ) ? (
                        <div className="student-info-section">
                          <h4>Student Information</h4>
                          <div className="student-details">
                            <div className="student-photo">
                              <FaUser size={40} />
                            </div>
                            <div className="student-data">
                              <p>
                                <strong>Name:</strong>{" "}
                                {selectedTemplate.sampleData?.studentName ||
                                  "[Student Name]"}
                              </p>
                              <p>
                                <strong>Class:</strong>{" "}
                                {selectedTemplate.sampleData?.class ||
                                  "[Class/Grade]"}
                              </p>
                              <p>
                                <strong>Student ID:</strong> STU/2024/001
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Academic Performance / Subject Grades */}
                      {(selectedTemplate.sections.includes(
                        "Academic Performance"
                      ) ||
                        selectedTemplate.sections.includes("Subject Grades") ||
                        selectedTemplate.sections.includes(
                          "Subject Performance"
                        )) &&
                      selectedTemplate.sampleData?.subjects ? (
                        <div className="academic-section">
                          <h4>Academic Performance</h4>
                          <table className="grades-table">
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Remark</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedTemplate.sampleData.subjects.map(
                                (subject, index) => (
                                  <tr key={index}>
                                    <td>{subject.name}</td>
                                    <td>{subject.score}</td>
                                    <td className="grade-cell">
                                      {subject.grade}
                                    </td>
                                    <td>
                                      {subject.grade === "A" ||
                                      subject.grade === "Excellent"
                                        ? "Excellent"
                                        : subject.grade === "B" ||
                                          subject.grade === "Very Good"
                                        ? "Very Good"
                                        : "Good"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : null}

                      {/* Behavioral Assessment Section */}
                      {selectedTemplate.sections.includes(
                        "Behavioral Assessment"
                      ) &&
                      selectedTemplate.behavioralTraits &&
                      selectedTemplate.behavioralTraits.length > 0 ? (
                        <div className="behavioral-section">
                          <h4>Behavioral Assessment</h4>
                          <div className="behavioral-traits-grid">
                            {selectedTemplate.behavioralTraits.map(
                              (traitName, index) => {
                                // Try to find existing sample data for this trait
                                const existingTrait =
                                  selectedTemplate.sampleData.behavioralTraits?.find(
                                    (trait) =>
                                      trait.trait === traitName ||
                                      trait.trait.includes(traitName)
                                  );

                                // Generate consistent sample data based on trait name
                                const generateSampleData = (trait) => {
                                  const traitScores = {
                                    Neatness: { rating: "Very Good", score: 4 },
                                    Punctuality: {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                    Politeness: {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                    Honesty: { rating: "Excellent", score: 5 },
                                    Leadership: { rating: "Good", score: 3 },
                                    Cooperation: {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    Attentiveness: {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                    Initiative: { rating: "Good", score: 3 },
                                    "Self-Control": {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    "Respect for Others": {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                    "Respect for Authority": {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                    Responsibility: {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    Perseverance: { rating: "Good", score: 3 },
                                    Creativity: {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    "Problem Solving": {
                                      rating: "Good",
                                      score: 3,
                                    },
                                    "Communication Skills": {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    Teamwork: { rating: "Excellent", score: 5 },
                                    "Time Management": {
                                      rating: "Good",
                                      score: 3,
                                    },
                                    Organization: {
                                      rating: "Very Good",
                                      score: 4,
                                    },
                                    "Following Instructions": {
                                      rating: "Excellent",
                                      score: 5,
                                    },
                                  };

                                  return (
                                    traitScores[trait] || {
                                      rating: "Good",
                                      score: 3,
                                    }
                                  );
                                };

                                const traitData = existingTrait || {
                                  trait: traitName,
                                  ...generateSampleData(traitName),
                                };

                                return (
                                  <div key={index} className="trait-item">
                                    <div className="trait-info">
                                      <span className="trait-name">
                                        {traitData.trait}
                                      </span>
                                      <span className="trait-rating">
                                        {traitData.rating}
                                      </span>
                                    </div>
                                    <div className="trait-score">
                                      <div className="score-bar">
                                        <div
                                          className="score-fill"
                                          style={{
                                            width: `${
                                              (traitData.score / 5) * 100
                                            }%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="score-text">
                                        {traitData.score}/5
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* Skills/Competencies Section */}
                      {(selectedTemplate.sections.includes(
                        "Core Competencies"
                      ) ||
                        selectedTemplate.sections.includes(
                          "Skills Assessment"
                        )) &&
                      selectedTemplate.sampleData?.competencies ? (
                        <div className="competencies-section">
                          <h4>Core Competencies</h4>
                          <div className="competencies-grid">
                            {selectedTemplate.sampleData.competencies.map(
                              (comp, index) => (
                                <div key={index} className="competency-item">
                                  <span className="competency-name">
                                    {comp.name}
                                  </span>
                                  <span className="competency-level">
                                    {comp.level}
                                  </span>
                                  <span className="competency-score">
                                    {comp.score}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : null}

                      {/* GPA and Ranking */}
                      <div className="summary-section">
                        {selectedTemplate.includeGPA &&
                          selectedTemplate.sampleData?.gpa && (
                            <div className="gpa-section">
                              <strong>
                                GPA: {selectedTemplate.sampleData.gpa}
                              </strong>
                            </div>
                          )}
                        {selectedTemplate.includeRanking &&
                          selectedTemplate.sampleData?.ranking && (
                            <div className="ranking-section">
                              <strong>
                                Class Position:{" "}
                                {selectedTemplate.sampleData.ranking}
                              </strong>
                            </div>
                          )}
                      </div>

                      {/* Attendance */}
                      {selectedTemplate.includeAttendance &&
                        selectedTemplate.sampleData?.attendance && (
                          <div className="attendance-section">
                            <h4>Attendance Record</h4>
                            <div className="attendance-stats">
                              <span>
                                Days Present:{" "}
                                {selectedTemplate.sampleData.attendance.present}
                              </span>
                              <span>
                                Days Absent:{" "}
                                {selectedTemplate.sampleData.attendance.absent}
                              </span>
                              <span>
                                Total Days:{" "}
                                {selectedTemplate.sampleData.attendance.total}
                              </span>
                              <span>
                                Attendance Rate:{" "}
                                {Math.round(
                                  (selectedTemplate.sampleData.attendance
                                    .present /
                                    selectedTemplate.sampleData.attendance
                                      .total) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Comments */}
                      {(selectedTemplate.sections.includes(
                        "Teacher Comments"
                      ) ||
                        selectedTemplate.sections.includes(
                          "Principal's Remarks"
                        )) && (
                        <div className="comments-section">
                          {selectedTemplate.sampleData?.teacherComment && (
                            <div className="teacher-comment">
                              <h5>Class Teacher's Comment:</h5>
                              <p>
                                {selectedTemplate.sampleData.teacherComment}
                              </p>
                              <p>
                                <strong>Signature:</strong> ________________
                              </p>
                            </div>
                          )}
                          {selectedTemplate.sampleData?.principalComment && (
                            <div className="principal-comment">
                              <h5>Principal's Comment:</h5>
                              <p>
                                {selectedTemplate.sampleData.principalComment}
                              </p>
                              <p>
                                <strong>Signature:</strong> ________________
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Parent Signature */}
                      {selectedTemplate.sections.includes(
                        "Parent Signature"
                      ) && (
                        <div className="parent-section">
                          <div className="signature-area">
                            <p>
                              <strong>Parent/Guardian Signature:</strong>{" "}
                              ________________
                            </p>
                            <p>
                              <strong>Date:</strong> ________________
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="template-detail-actions">
                <Button
                  variant="secondary"
                  onClick={() => handleEditTemplate(selectedTemplate)}
                >
                  <FaEdit size={14} style={{ marginRight: "8px" }} />
                  Edit Template
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDuplicate(selectedTemplate)}
                >
                  <FaCopy size={14} style={{ marginRight: "8px" }} />
                  Duplicate
                </Button>
                <Button
                  variant={
                    selectedTemplate.status === "active" ? "warning" : "success"
                  }
                  onClick={() => handleStatusToggle(selectedTemplate)}
                >
                  {selectedTemplate.status === "active" ? (
                    <>
                      <FaBan size={14} style={{ marginRight: "8px" }} />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <FaCheckCircle size={14} style={{ marginRight: "8px" }} />
                      Activate
                    </>
                  )}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(selectedTemplate)}
                >
                  <FaTrash size={14} style={{ marginRight: "8px" }} />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default ReportCardLayoutTemplates;

