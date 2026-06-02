import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import { useClassPromotionTemplate } from "../../../../../api_call";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../../../components/SubAdminGuard/SubAdminGuard";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import {
  FaPlus,
  FaEdit,
  FaCopy,
  FaTrash,
  FaExternalLinkAlt,
  FaSync,
} from "react-icons/fa";

const ClassPromotionTemplates = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    createClassPromotionTemplate,
    getClassPromotionTemplatesBySchool,
    getClassesForSchool,
    updateClassPromotionTemplate,
    deleteClassPromotionTemplate,
    duplicateClassPromotionTemplate,
    updateTemplateStatus,
  } = useClassPromotionTemplate();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.class_promotion_template?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.class_promotion_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.class_promotion_template?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [promotionTemplates, setPromotionTemplates] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classesLoading, setClassesLoading] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    loadTemplates();
  }, [schoolId]);

  const loadTemplates = async () => {
    setDataLoading(true);
    try {
      const result = await getClassPromotionTemplatesBySchool(schoolId);
      if (result.success) {
        // Transform backend data to frontend format
        const transformedTemplates = result.data.map((template) => ({
          id: template.template_id,
          name: template.name,
          description: template.description,
          status: template.status,
          lastModified: new Date(template.last_modified).toLocaleDateString(),
          createdBy: template.created_by || "System",
          level: template.level,
          criteria: template.criteria,
          classPromotions: template.class_promotions.map((promotion) => ({
            fromClass: promotion.from_class,
            toClass: promotion.to_class,
          })),
          retentionPolicy: template.retention_policy,
          appealProcess: template.appeal_process,
          notifications: template.notifications,
        }));
        setPromotionTemplates(transformedTemplates);
      } else {
        addNotification(result.message || "Failed to load templates", "error");
      }
    } catch (error) {
      console.error("Load templates error:", error);
      addNotification("Failed to load class promotion templates", "error");
    } finally {
      setDataLoading(false);
    }
  };

  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const result = await getClassesForSchool(schoolId);
      if (result.success) {
        // Transform to options format
        const options = result.data.map((cls) => ({
          value: cls.class_id,
          label: cls.display_name,
        }));
        setClassOptions(options);
      } else {
        addNotification(result.message || "Failed to load classes", "error");
      }
    } catch (error) {
      console.error("Load classes error:", error);
      addNotification("Failed to load classes", "error");
    } finally {
      setClassesLoading(false);
    }
  };

  // Sample class promotion templates data (removed - now using API)
  const sampleTemplates = [];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: "All Levels",
    criteria: [{ type: "", weight: 0 }],
    classPromotions: [{ fromClass: "", toClass: "" }],
    retentionPolicy: "",
    appealProcess: "",
    notifications: {
      parents: true,
      students: true,
      teachers: true,
    },
  });

  const levelOptions = [
    { value: "Elementary", label: "Elementary" },
    { value: "Secondary", label: "Secondary" },
    { value: "All Levels", label: "All Levels" },
  ];

  const criteriaTypes = ["Overall GPA", "Academic Average", "Attendance Rate"];

  // Class options loaded from API (see classOptions state)

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const handleCriteriaChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.map((criterion, i) =>
        i === index ? { ...criterion, [field]: value } : criterion
      ),
    }));
  };

  const handleClassPromotionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      classPromotions: prev.classPromotions.map((promotion, i) =>
        i === index ? { ...promotion, [field]: value } : promotion
      ),
    }));
  };

  const addCriterion = () => {
    setFormData((prev) => ({
      ...prev,
      criteria: [...prev.criteria, { type: "", weight: 0 }],
    }));
  };

  const addClassPromotion = () => {
    setFormData((prev) => ({
      ...prev,
      classPromotions: [
        ...prev.classPromotions,
        { fromClass: "", toClass: "" },
      ],
    }));
  };

  const removeCriterion = (index) => {
    setFormData((prev) => ({
      ...prev,
      criteria: prev.criteria.filter((_, i) => i !== index),
    }));
  };

  const removeClassPromotion = (index) => {
    setFormData((prev) => ({
      ...prev,
      classPromotions: prev.classPromotions.filter((_, i) => i !== index),
    }));
  };

  const handleCreateClass = () => {
    // Open new tab to classes page
    window.open(
      "http://localhost:5174/admin/0808098080/school_directory/classes",
      "_blank"
    );
  };

  const handleRefreshClasses = async () => {
    await loadClasses();
    addNotification("Class list refreshed", "success");
  };

  const handleCreateTemplate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create class promotion templates.", "error");
      return;
    }
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      level: "All Levels",
      criteria: [{ type: "", weight: 0 }],
      classPromotions: [{ fromClass: "", toClass: "" }],
      retentionPolicy: "",
      appealProcess: "",
      notifications: {
        parents: true,
        students: true,
        teachers: true,
      },
    });
    // Load classes when opening create form
    loadClasses();
  };

  const handleEditTemplate = (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit class promotion templates.", "error");
      return;
    }
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      level: template.level,
      criteria: template.criteria,
      classPromotions: template.classPromotions || [
        { fromClass: "", toClass: "" },
      ],
      retentionPolicy: template.retentionPolicy || "",
      appealProcess: template.appealProcess || "",
      notifications: template.notifications || {
        parents: true,
        students: true,
        teachers: true,
      },
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);
    // Load classes when opening edit form
    loadClasses();
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsDetailMenuOpen(true);
    // Load classes when viewing details to show class names
    loadClasses();
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name) {
      addNotification("Template name is required", "error");
      return;
    }

    if (formData.classPromotions.length === 0) {
      addNotification(
        "At least one class promotion mapping is required",
        "error"
      );
      return;
    }

    // Criteria is optional - no validation needed

    setIsSubmitting(true);
    try {
      // Transform formData to backend format (camelCase to snake_case)
      const backendData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        level: formData.level,
        criteria: formData.criteria,
        class_promotions: formData.classPromotions.map((p) => ({
          from_class: p.fromClass,
          to_class: p.toClass,
        })),
        retention_policy: formData.retentionPolicy,
        appeal_process: formData.appealProcess,
        notifications: formData.notifications,
        created_by: user?.admin?.admin_id || user?.user_id,
        modified_by: user?.admin?.admin_id || user?.user_id,
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateClassPromotionTemplate(
          selectedTemplate.id,
          backendData
        );
      } else {
        // Create new template
        result = await createClassPromotionTemplate(backendData);
      }

      if (result.success) {
        addNotification(
          result.message ||
            `Class promotion template ${
              selectedTemplate ? "updated" : "created"
            } successfully`,
          "success"
        );
        setIsCreateMenuOpen(false);
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Operation failed", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      addNotification("Failed to save class promotion template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    if (!canCreate) {
      addNotification("You do not have permission to duplicate class promotion templates.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await duplicateClassPromotionTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(
          "Class promotion template duplicated successfully",
          "success"
        );
        await loadTemplates(); // Reload templates
      } else {
        addNotification(
          result.message || "Failed to duplicate template",
          "error"
        );
      }
    } catch (error) {
      console.error("Duplicate error:", error);
      addNotification("Failed to duplicate class promotion template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete class promotion templates.", "error");
      return;
    }
    if (
      !window.confirm(`Are you sure you want to delete "${template.name}"?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteClassPromotionTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(
          "Class promotion template deleted successfully",
          "success"
        );
        setIsDetailMenuOpen(false);
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Failed to delete template", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      addNotification("Failed to delete class promotion template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SubAdminGuard permission="class_promotion_template">
    <InnerTabCon>
      {dataLoading ? (
        <LoadingData />
      ) : (
        <div className="templates-container">
          <div className="templates-header">
            <div className="templates-header-left">
              <h2>Class Promotion Templates</h2>
              <p>
                Define promotion criteria and policies for student advancement
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
            <h3>Available Promotion Templates</h3>
            {promotionTemplates.length === 0 ? (
              <div className="kk-template-empty-state">
                <p>No promotion templates found</p>
                <p style={{ fontSize: "14px" }}>Create your first class promotion template to get started</p>
                <Button onClick={handleCreateTemplate}><FaPlus size={14} style={{ marginRight: "8px" }} />Create Template</Button>
              </div>
            ) : (
            <div className="template-grid">
              {promotionTemplates.map((template) => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => handleViewTemplate(template)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="template-card-header">
                    <h4 className="template-card-title">{template.name}</h4>
                    <span className={`template-card-status ${template.status}`}>
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
                      <strong>Criteria:</strong>{" "}
                      {
                        template.criteria.filter(
                          (c) => c.type && c.type.trim() !== ""
                        ).length
                      }{" "}
                      rules
                    </div>
                  </div>
                  <div className="promotion-criteria-preview">
                    <strong>Key Criteria:</strong>
                    <ul>
                      {template.criteria.slice(0, 2).map((criterion, index) => (
                        <li key={index}>
                          {criterion.type}: {criterion.weight}% weight
                        </li>
                      ))}
                      {template.criteria.length > 2 && (
                        <li>+{template.criteria.length - 2} more criteria</li>
                      )}
                    </ul>
                  </div>
                  <div className="template-card-meta">
                    <span>Modified: {template.lastModified}</span>
                    <span>By: {template.createdBy}</span>
                  </div>
                </div>
              ))}
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
                  {selectedTemplate ? "Edit" : "Create"} Promotion Template
                </h2>
                <p>Define promotion criteria and advancement policies</p>
              </div>

              <div className="create-template-form">
                <div className="form-row">
                  <FormInput
                    label="Template Name *"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="e.g., Standard Promotion Criteria"
                  />

                  <FormInput
                    label="Grade Level"
                    type="text"
                    value={formData.level}
                    onChange={handleInputChange("level")}
                    placeholder="e.g., Elementary, Secondary, All Levels"
                  />
                </div>

                <FormInput
                  label="Description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  placeholder="Describe this promotion template..."
                  height="80px"
                />

                <div className="class-promotion-section">
                  <div className="criteria-header">
                    <h3>Class Promotion Mapping</h3>
                    <div className="header-actions">
                      <button
                        type="button"
                        className="create-class-btn"
                        onClick={handleCreateClass}
                        title="Create New Class"
                      >
                        <FaExternalLinkAlt size={12} />
                      </button>
                      <button
                        type="button"
                        className="refresh-classes-btn"
                        onClick={handleRefreshClasses}
                        title="Refresh Class List"
                      >
                        <FaSync size={12} />
                      </button>
                      <Button variant="secondary" onClick={addClassPromotion}>
                        <FaPlus size={12} /> Add Promotion Rule
                      </Button>
                    </div>
                  </div>
                  <p className="section-description">
                    Define which classes students will be promoted to. Use{" "}
                    <strong>ALUMNI</strong> as the destination for graduating
                    students.
                  </p>

                  {formData.classPromotions.map((promotion, index) => (
                    <div key={index} className="criterion-row">
                      <div className="form-field">
                        <label>From Class</label>
                        <SearchableSelect
                          options={classOptions}
                          value={promotion.fromClass}
                          onChange={(value) =>
                            handleClassPromotionChange(
                              index,
                              "fromClass",
                              value
                            )
                          }
                          placeholder="Select current class"
                        />
                      </div>
                      <div className="form-field">
                        <label>To Class</label>
                        <SearchableSelect
                          options={classOptions}
                          value={promotion.toClass}
                          onChange={(value) =>
                            handleClassPromotionChange(index, "toClass", value)
                          }
                          placeholder="Select promotion class"
                        />
                      </div>
                      <div className="promotion-arrow">→</div>
                      {formData.classPromotions.length > 1 && (
                        <button
                          className="remove-criterion-btn"
                          onClick={() => removeClassPromotion(index)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* <div className="promotion-criteria-section">
                  <div className="criteria-header">
                    <h3>Promotion Criteria</h3>
                    <Button variant="secondary" onClick={addCriterion}>
                      <FaPlus size={12} /> Add Criterion
                    </Button>
                  </div>

                  {formData.criteria.map((criterion, index) => (
                    <div key={index} className="criterion-row">
                      <FormInput
                        label="Criterion Type"
                        type="select"
                        value={criterion.type}
                        onChange={(value) =>
                          handleCriteriaChange(index, "type", value)
                        }
                        options={criteriaTypes.map((type) => ({
                          value: type,
                          label: type,
                        }))}
                      />
                      <FormInput
                        label="Weight (%)"
                        type="number"
                        value={criterion.weight}
                        onChange={(value) =>
                          handleCriteriaChange(
                            index,
                            "weight",
                            parseInt(value) || 0
                          )
                        }
                        placeholder="0"
                        min="0"
                        max="100"
                      />
                      {formData.criteria.length > 1 && (
                        <button
                          className="remove-criterion-btn"
                          onClick={() => removeCriterion(index)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div> */}

                {/* <div className="policies-section">
                  <h3>Policies & Procedures</h3>
                  <FormInput
                    label="Retention Policy"
                    type="textarea"
                    value={formData.retentionPolicy}
                    onChange={handleInputChange("retentionPolicy")}
                    placeholder="Define what happens when students don't meet promotion criteria..."
                    height="80px"
                  />

                  <FormInput
                    label="Appeal Process"
                    type="textarea"
                    value={formData.appealProcess}
                    onChange={handleInputChange("appealProcess")}
                    placeholder="Describe the process for appealing promotion decisions..."
                    height="80px"
                  />
                </div> */}

                {/* <div className="notifications-section">
                  <h3>Notification Settings</h3>
                  <p>
                    Select who should be notified about promotion decisions:
                  </p>
                  <div className="notifications-grid">
                    <label className="notification-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.notifications.students}
                        onChange={(e) =>
                          handleNotificationChange("students")(e.target.checked)
                        }
                      />
                      <span>Notify Students</span>
                    </label>
                    <label className="notification-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.notifications.teachers}
                        onChange={(e) =>
                          handleNotificationChange("teachers")(e.target.checked)
                        }
                      />
                      <span>Notify Teachers</span>
                    </label>
                  </div>
                </div> */}
              </div>

              <div className="create-template-footer">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreateMenuOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="secondary" disabled={isSubmitting}>
                  Preview
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.name ||
                    formData.classPromotions.length === 0 ||
                    isSubmitting
                  }
                >
                  {isSubmitting
                    ? "Saving..."
                    : selectedTemplate
                    ? "Update"
                    : "Create"}{" "}
                  Template
                </Button>
              </div>
            </div>
          </SlideInMenu>

          {/* Template Detail SlideInMenu */}
          <SlideInMenu
            isShow={isDetailMenuOpen}
            onClose={() => setIsDetailMenuOpen(false)}
            width="800px"
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
                  </div>
                </div>

                <div className="template-detail-content">
                  {/* Promotion Criteria */}
                  <div className="detail-section">
                    <h3>Promotion Criteria</h3>
                    <div className="criteria-detail-table">
                      <div className="criteria-table-header">
                        <span>Criterion Type</span>
                        <span>Weight</span>
                      </div>
                      {selectedTemplate.criteria.map((criterion, index) => (
                        <div key={index} className="criteria-table-row">
                          <span>{criterion.type}</span>
                          <span>{criterion.weight}%</span>
                        </div>
                      ))}
                      <div className="criteria-table-footer">
                        <span>
                          <strong>Total Weight</strong>
                        </span>
                        <span>
                          <strong>
                            {selectedTemplate.criteria.reduce(
                              (sum, c) => sum + c.weight,
                              0
                            )}
                            %
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Class Promotion Mapping */}
                  <div className="detail-section">
                    <h3>Class Promotion Mapping</h3>
                    <div className="promotion-mapping-display">
                      {selectedTemplate.classPromotions &&
                      selectedTemplate.classPromotions.length > 0 ? (
                        <>
                          <p className="mapping-note">
                            <em>
                              Class promotion mappings define the progression
                              path for students. Use <strong>ALUMNI</strong> for
                              graduating students.
                            </em>
                          </p>
                          {classesLoading ? (
                            <p>Loading class names...</p>
                          ) : (
                            <div className="sample-mapping">
                              {selectedTemplate.classPromotions.map(
                                (promotion, index) => {
                                  const fromClass = classOptions.find(
                                    (c) => c.value === promotion.fromClass
                                  );
                                  const toClass = classOptions.find(
                                    (c) => c.value === promotion.toClass
                                  );

                                  return (
                                    <div
                                      key={index}
                                      className={`mapping-item ${
                                        promotion.toClass === "ALUMNI"
                                          ? "alumni-mapping"
                                          : ""
                                      }`}
                                    >
                                      <span className="from-class">
                                        {fromClass?.label ||
                                          promotion.fromClass}
                                      </span>
                                      <span className="arrow">→</span>
                                      <span
                                        className={`to-class ${
                                          promotion.toClass === "ALUMNI"
                                            ? "alumni"
                                            : ""
                                        }`}
                                      >
                                        {toClass?.label || promotion.toClass}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p>No class promotion mappings defined</p>
                      )}
                    </div>
                  </div>

                  {/* Template Configuration */}
                  <div className="detail-section">
                    <h3>Template Configuration</h3>
                    <div className="config-grid">
                      <div className="config-item">
                        <strong>Grade Level:</strong>
                        <span>{selectedTemplate.level || "Not specified"}</span>
                      </div>
                      <div className="config-item">
                        <strong>Total Criteria:</strong>
                        <span>
                          {selectedTemplate.criteria?.filter(
                            (c) => c.type && c.type.trim() !== ""
                          ).length || 0}{" "}
                          rules
                        </span>
                      </div>
                      <div className="config-item">
                        <strong>Class Mappings:</strong>
                        <span>
                          {selectedTemplate.classPromotions?.length || 0}{" "}
                          mappings
                        </span>
                      </div>
                      <div className="config-item">
                        <strong>Status:</strong>
                        <span
                          className={`status-badge ${selectedTemplate.status}`}
                        >
                          {selectedTemplate.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Policies & Procedures */}
                  <div className="detail-section">
                    <h3>Policies & Procedures</h3>
                    <div className="policies-display">
                      <div className="policy-item">
                        <h4>Retention Policy</h4>
                        <p>
                          {selectedTemplate.retentionPolicy ||
                            "No retention policy defined"}
                        </p>
                      </div>
                      <div className="policy-item">
                        <h4>Appeal Process</h4>
                        <p>
                          {selectedTemplate.appealProcess ||
                            "No appeal process defined"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="template-detail-actions">
                  <Button
                    variant="secondary"
                    onClick={() => handleEditTemplate(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaEdit size={14} style={{ marginRight: "8px" }} />
                    Edit Template
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDuplicate(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaCopy size={14} style={{ marginRight: "8px" }} />
                    {isSubmitting ? "Duplicating..." : "Duplicate"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaTrash size={14} style={{ marginRight: "8px" }} />
                    {isSubmitting ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}
          </SlideInMenu>
        </div>
      )}
    </InnerTabCon>
    </SubAdminGuard>
  );
};

export default ClassPromotionTemplates;

