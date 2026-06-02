import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useGradingTemplate } from "../../../../../api_call/useGradingTemplate";
import {
  FaPlus,
  FaEdit,
  FaCopy,
  FaTrash,
  FaExclamationTriangle,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";

const GradingTemplates = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const {
    loading,
    createGradingTemplate,
    getGradingTemplatesBySchool,
    updateGradingTemplate,
    deleteGradingTemplate,
    duplicateGradingTemplate,
    updateTemplateStatus,
  } = useGradingTemplate();

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [gradingTemplates, setGradingTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch grading templates on component mount
  useEffect(() => {
    fetchGradingTemplates();
  }, [schoolId]);

  const fetchGradingTemplates = async () => {
    if (!schoolId) return;

    setDataLoading(true);
    try {
      const result = await getGradingTemplatesBySchool(schoolId);

      if (result.success) {
        setGradingTemplates(result.data);
      } else {
        addNotification(
          result.message || "Failed to fetch grading templates",
          "error"
        );
        setGradingTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching grading templates:", error);
      addNotification("Error fetching grading templates", "error");
      setGradingTemplates([]);
    } finally {
      setDataLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    gradingFields: [
      {
        fieldName: "",
        weight: 0,
        maxScore: "",
      },
    ],
    gradingScheme: [
      {
        gradeLetter: "",
        minRange: "",
        maxRange: "",
        gradePoint: "",
        passFail: "Yes",
      },
    ],
    totalWeight: 0,
  });

  const passFailOptions = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];

  // Calculate total weight whenever grading fields change
  useEffect(() => {
    const total = formData.gradingFields.reduce(
      (sum, field) => sum + (parseInt(field.weight) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, totalWeight: total }));
  }, [formData.gradingFields]);

  // Calculate range coverage for grading scheme
  const calculateRangeCoverage = () => {
    if (formData.gradingScheme.length === 0)
      return { min: 0, max: 0, isComplete: false };

    const ranges = formData.gradingScheme
      .filter((scheme) => scheme.minRange !== "" && scheme.maxRange !== "")
      .map((scheme) => ({
        min: parseInt(scheme.minRange) || 0,
        max: parseInt(scheme.maxRange) || 0,
      }));

    if (ranges.length === 0) return { min: 0, max: 0, isComplete: false };

    const minValue = Math.min(...ranges.map((r) => r.min));
    const maxValue = Math.max(...ranges.map((r) => r.max));
    const isComplete = minValue === 0 && maxValue === 100;

    return { min: minValue, max: maxValue, isComplete };
  };

  const rangeCoverage = calculateRangeCoverage();

  // Check for overlapping ranges
  const checkOverlappingRanges = () => {
    const validRanges = formData.gradingScheme
      .filter((scheme) => scheme.minRange !== "" && scheme.maxRange !== "")
      .map((scheme, index) => ({
        index,
        min: parseInt(scheme.minRange) || 0,
        max: parseInt(scheme.maxRange) || 0,
        gradeLetter: scheme.gradeLetter,
      }))
      .filter((range) => range.min <= range.max); // Only valid ranges where min <= max

    const overlaps = [];

    for (let i = 0; i < validRanges.length; i++) {
      for (let j = i + 1; j < validRanges.length; j++) {
        const range1 = validRanges[i];
        const range2 = validRanges[j];

        // Check if ranges overlap
        if (
          (range1.min <= range2.max && range1.max >= range2.min) ||
          (range2.min <= range1.max && range2.max >= range1.min)
        ) {
          overlaps.push({
            range1: `${range1.gradeLetter || "Grade " + (range1.index + 1)} (${
              range1.min
            }-${range1.max})`,
            range2: `${range2.gradeLetter || "Grade " + (range2.index + 1)} (${
              range2.min
            }-${range2.max})`,
          });
        }
      }
    }

    return overlaps;
  };

  const overlappingRanges = checkOverlappingRanges();
  const hasOverlaps = overlappingRanges.length > 0;

  // Check if a specific grading scheme row is involved in overlaps
  const isRowOverlapping = (rowIndex) => {
    const validRanges = formData.gradingScheme
      .filter((scheme) => scheme.minRange !== "" && scheme.maxRange !== "")
      .map((scheme, index) => ({
        index,
        min: parseInt(scheme.minRange) || 0,
        max: parseInt(scheme.maxRange) || 0,
      }))
      .filter((range) => range.min <= range.max);

    const currentRange = validRanges.find((range) => range.index === rowIndex);
    if (!currentRange) return false;

    // Check if current range overlaps with any other range
    for (let otherRange of validRanges) {
      if (otherRange.index !== rowIndex) {
        if (
          (currentRange.min <= otherRange.max &&
            currentRange.max >= otherRange.min) ||
          (otherRange.min <= currentRange.max &&
            otherRange.max >= currentRange.min)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGradingFieldChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      gradingFields: prev.gradingFields.map((gradingField, i) =>
        i === index ? { ...gradingField, [field]: value } : gradingField
      ),
    }));
  };

  const handleGradingSchemeChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      gradingScheme: prev.gradingScheme.map((scheme, i) =>
        i === index ? { ...scheme, [field]: value } : scheme
      ),
    }));
  };

  const addGradingField = () => {
    setFormData((prev) => ({
      ...prev,
      gradingFields: [
        ...prev.gradingFields,
        {
          fieldName: "",
          weight: 0,
          maxScore: "",
        },
      ],
    }));
  };

  const removeGradingField = (index) => {
    setFormData((prev) => ({
      ...prev,
      gradingFields: prev.gradingFields.filter((_, i) => i !== index),
    }));
  };

  const addGradingScheme = () => {
    setFormData((prev) => ({
      ...prev,
      gradingScheme: [
        ...prev.gradingScheme,
        {
          gradeLetter: "",
          minRange: "",
          maxRange: "",
          gradePoint: "",
          passFail: "Yes",
        },
      ],
    }));
  };

  const removeGradingScheme = (index) => {
    setFormData((prev) => ({
      ...prev,
      gradingScheme: prev.gradingScheme.filter((_, i) => i !== index),
    }));
  };

  const handleCreateTemplate = () => {
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      gradingFields: [
        {
          fieldName: "",
          weight: 0,
          maxScore: "",
        },
      ],
      gradingScheme: [
        {
          gradeLetter: "",
          minRange: "",
          maxRange: "",
          gradePoint: "",
          passFail: "Yes",
        },
      ],
      totalWeight: 0,
    });
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    const gradingFields = template.grading_fields || template.gradingFields;
    const gradingScheme = template.grading_scheme || template.gradingScheme;

    setFormData({
      name: template.name,
      description: template.description,
      gradingFields: gradingFields.map((field) => ({
        fieldName: field.field_name || field.fieldName,
        weight: field.weight,
        maxScore: field.max_score || field.maxScore || "",
      })),
      gradingScheme: gradingScheme.map((scheme) => ({
        gradeLetter: scheme.grade_letter || scheme.gradeLetter,
        minRange: scheme.min_range || scheme.minRange,
        maxRange: scheme.max_range || scheme.maxRange,
        gradePoint: scheme.grade_point || scheme.gradePoint,
        passFail: scheme.pass_fail || scheme.passFail || "Yes",
      })),
      totalWeight: gradingFields.reduce((sum, field) => sum + field.weight, 0),
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsDetailMenuOpen(true);
  };

  const handleSubmit = async () => {
    if (formData.totalWeight !== 100) {
      addNotification(
        `Total weight must equal 100%. Current total: ${formData.totalWeight}%`,
        "error"
      );
      return;
    }

    if (!formData.name || formData.name.trim() === "") {
      addNotification("Template name is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const templateData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        grading_fields: formData.gradingFields.map((field) => ({
          field_name: field.fieldName,
          weight: field.weight,
          max_score: field.maxScore || "",
        })),
        grading_scheme: formData.gradingScheme.map((scheme) => ({
          grade_letter: scheme.gradeLetter,
          min_range: scheme.minRange,
          max_range: scheme.maxRange,
          grade_point: scheme.gradePoint,
          pass_fail: scheme.passFail || "Yes",
        })),
        created_by: null, // TODO: Get from auth context
        modified_by: null, // TODO: Get from auth context
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateGradingTemplate(
          selectedTemplate.template_id,
          templateData
        );
      } else {
        // Create new template
        result = await createGradingTemplate(templateData);
      }

      if (result.success) {
        addNotification(
          selectedTemplate
            ? "Grading template updated successfully"
            : "Grading template created successfully",
          "success"
        );
        setIsCreateMenuOpen(false);
        // Refresh templates list
        fetchGradingTemplates();
      } else {
        addNotification(
          result.message ||
            `Failed to ${
              selectedTemplate ? "update" : "create"
            } grading template`,
          "error"
        );
      }
    } catch (error) {
      console.error("Submit grading template error:", error);
      addNotification("Error submitting grading template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const result = await duplicateGradingTemplate(
        template.template_id,
        null // TODO: Get from auth context
      );

      if (result.success) {
        addNotification("Grading template duplicated successfully", "success");
        // Refresh templates list
        fetchGradingTemplates();
      } else {
        addNotification(
          result.message || "Failed to duplicate grading template",
          "error"
        );
      }
    } catch (error) {
      console.error("Duplicate template error:", error);
      addNotification("Error duplicating grading template", "error");
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
      const result = await deleteGradingTemplate(template.template_id);

      if (result.success) {
        addNotification("Grading template deleted successfully", "success");
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchGradingTemplates();
      } else {
        addNotification(
          result.message || "Failed to delete grading template",
          "error"
        );
      }
    } catch (error) {
      console.error("Delete template error:", error);
      addNotification("Error deleting grading template", "error");
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
        addNotification(`Grading template ${action}d successfully`, "success");
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchGradingTemplates();
      } else {
        addNotification(
          result.message || `Failed to ${action} grading template`,
          "error"
        );
      }
    } catch (error) {
      console.error(`${action} template error:`, error);
      addNotification(`Error ${action}ing grading template`, "error");
    }
  };

  const isWeightValid = formData.totalWeight === 100;

  return (
    <InnerTabCon>
      <div className="templates-container">
        <div className="templates-header">
          <div className="templates-header-left">
            <h2>Grading Templates</h2>
            <p>
              Create and manage comprehensive grading scales and assessment
              templates
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
          <h3>Available Grading Templates</h3>

          {dataLoading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <LoadingData message="Loading grading templates..." />
            </div>
          ) : gradingTemplates.length === 0 ? (
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
                No grading templates found
              </p>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
                Create your first grading template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <FaPlus size={14} style={{ marginRight: "8px" }} />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="template-grid">
              {gradingTemplates.map((template) => (
                <div
                  key={template.template_id || template.id}
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
                      <strong>Assessment Fields:</strong>{" "}
                      {
                        (template.grading_fields || template.gradingFields)
                          .length
                      }
                    </div>
                    <div className="template-detail-item">
                      <strong>Grade Levels:</strong>{" "}
                      {
                        (template.grading_scheme || template.gradingScheme)
                          .length
                      }
                    </div>
                  </div>
                  <div className="grading-fields-preview">
                    <strong>Key Fields:</strong>
                    <ul>
                      {(template.grading_fields || template.gradingFields)
                        .slice(0, 3)
                        .map((field, index) => (
                          <li key={index}>
                            {field.field_name || field.fieldName} (
                            {field.weight}%)
                          </li>
                        ))}
                      {(template.grading_fields || template.gradingFields)
                        .length > 3 && (
                        <li>
                          +
                          {(template.grading_fields || template.gradingFields)
                            .length - 3}{" "}
                          more fields
                        </li>
                      )}
                    </ul>
                  </div>
                  <div className="template-card-meta">
                    <span>
                      Modified:{" "}
                      {template.last_modified || template.lastModified}
                    </span>
                    <span>By: {template.created_by || template.createdBy}</span>
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
          width="800px"
        >
          <div className="create-template-container">
            <div className="create-template-header">
              <h2>{selectedTemplate ? "Edit" : "Create"} Grading Template</h2>
              <p>Define assessment fields and grading scheme</p>
            </div>

            <div className="create-template-form">
              <FormInput
                label="Template Name *"
                type="text"
                value={formData.name}
                onChange={handleInputChange("name")}
                placeholder="e.g., Standard Grading Scale"
              />

              <FormInput
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="Describe this grading template..."
                height="80px"
              />

              {/* Assessment Fields Section */}
              <div className="grading-fields-section">
                <div className="grading-fields-header">
                  <h3>Assessment Fields</h3>
                  <div className="weight-indicator">
                    <span
                      className={`total-weight ${
                        isWeightValid ? "valid" : "invalid"
                      }`}
                    >
                      Total Weight: {formData.totalWeight}%
                      {!isWeightValid && (
                        <FaExclamationTriangle
                          size={12}
                          style={{ marginLeft: "4px" }}
                        />
                      )}
                    </span>
                  </div>
                  <Button variant="secondary" onClick={addGradingField}>
                    <FaPlus size={12} /> Add Field
                  </Button>
                </div>

                {formData.gradingFields.map((field, index) => (
                  <div key={index} className="grading-field-row">
                    <FormInput
                      label="Field Name"
                      type="text"
                      value={field.fieldName}
                      onChange={(value) =>
                        handleGradingFieldChange(index, "fieldName", value)
                      }
                      placeholder="e.g., First Test"
                    />
                    <FormInput
                      label="Weight (%)"
                      type="number"
                      value={field.weight}
                      onChange={(value) =>
                        handleGradingFieldChange(
                          index,
                          "weight",
                          parseInt(value) || 0
                        )
                      }
                      placeholder="20"
                      min="0"
                      max="100"
                    />
                    <FormInput
                      label="Max Score"
                      type="text"
                      value={field.maxScore}
                      onChange={(value) =>
                        handleGradingFieldChange(index, "maxScore", value)
                      }
                      placeholder="e.g., /30"
                    />
                    {formData.gradingFields.length > 1 && (
                      <button
                        className="remove-field-btn"
                        onClick={() => removeGradingField(index)}
                      >
                        <FaTrash size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {!isWeightValid && (
                  <div className="weight-warning">
                    <FaExclamationTriangle size={14} />
                    <span>
                      Total weight must equal 100%. Current total:{" "}
                      {formData.totalWeight}%
                    </span>
                  </div>
                )}
              </div>

              {/* Grading Scheme Section */}
              <div className="grading-scheme-section">
                <div className="grading-scheme-header">
                  <h3>Define Grading Scheme</h3>
                  <div className="range-indicator">
                    <span
                      className={`total-range ${
                        rangeCoverage.isComplete && !hasOverlaps
                          ? "valid"
                          : "invalid"
                      }`}
                    >
                      Range Coverage: {rangeCoverage.min}% - {rangeCoverage.max}
                      %
                      {(!rangeCoverage.isComplete || hasOverlaps) && (
                        <FaExclamationTriangle
                          size={12}
                          style={{ marginLeft: "4px" }}
                        />
                      )}
                    </span>
                  </div>
                  <p>
                    Add rows for final grade conversion (based on total % from
                    fields)
                  </p>
                  <Button variant="secondary" onClick={addGradingScheme}>
                    <FaPlus size={12} /> Add Grade
                  </Button>
                </div>

                <div className="grading-scheme-table">
                  <div className="scheme-table-header">
                    <span>Grade Letter</span>
                    <span>Min Range</span>
                    <span>Max Range</span>
                    <span>Grade Point</span>
                    <span>Pass/Fail</span>
                    <span>Actions</span>
                  </div>

                  {formData.gradingScheme.map((scheme, index) => (
                    <div
                      key={index}
                      className={`grading-scheme-row ${
                        isRowOverlapping(index) ? "overlapping" : ""
                      }`}
                    >
                      <FormInput
                        type="text"
                        value={scheme.gradeLetter}
                        onChange={(value) =>
                          handleGradingSchemeChange(index, "gradeLetter", value)
                        }
                        placeholder="e.g., A"
                      />
                      <FormInput
                        type="number"
                        value={scheme.minRange}
                        onChange={(value) =>
                          handleGradingSchemeChange(index, "minRange", value)
                        }
                        placeholder="70"
                        min="0"
                      />
                      <FormInput
                        type="number"
                        value={scheme.maxRange}
                        onChange={(value) =>
                          handleGradingSchemeChange(index, "maxRange", value)
                        }
                        placeholder="100"
                        min="0"
                      />
                      <FormInput
                        type="number"
                        value={scheme.gradePoint}
                        onChange={(value) =>
                          handleGradingSchemeChange(index, "gradePoint", value)
                        }
                        placeholder="5.0"
                        step="0.1"
                      />
                      <FormInput
                        type="select"
                        value={scheme.passFail}
                        onChange={(value) =>
                          handleGradingSchemeChange(index, "passFail", value)
                        }
                        options={passFailOptions}
                      />
                      {formData.gradingScheme.length > 1 && (
                        <button
                          className="remove-scheme-btn"
                          onClick={() => removeGradingScheme(index)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!rangeCoverage.isComplete && (
                  <div className="range-warning">
                    <FaExclamationTriangle size={14} />
                    <span>
                      Range should cover 0% - 100%. Current coverage:{" "}
                      {rangeCoverage.min}% - {rangeCoverage.max}%
                    </span>
                  </div>
                )}

                {hasOverlaps && (
                  <div className="range-warning">
                    <FaExclamationTriangle size={14} />
                    <div>
                      <span>Overlapping ranges detected:</span>
                      <ul style={{ marginTop: "8px", paddingLeft: "20px" }}>
                        {overlappingRanges.map((overlap, index) => (
                          <li key={index}>
                            {overlap.range1} overlaps with {overlap.range2}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="create-template-footer">
              <Button
                variant="secondary"
                onClick={() => setIsCreateMenuOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  formData.gradingFields.length === 0 ||
                  !isWeightValid ||
                  hasOverlaps ||
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
          width="600px"
        >
          {selectedTemplate &&
            (() => {
              const gradingFields =
                selectedTemplate.grading_fields ||
                selectedTemplate.gradingFields;
              const gradingScheme =
                selectedTemplate.grading_scheme ||
                selectedTemplate.gradingScheme;

              return (
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
                        {selectedTemplate.last_modified ||
                          selectedTemplate.lastModified}
                      </div>
                      <div className="template-meta-item">
                        <strong>Created By:</strong>{" "}
                        {selectedTemplate.created_by ||
                          selectedTemplate.createdBy ||
                          "----"}
                      </div>
                    </div>
                  </div>

                  <div className="template-detail-content">
                    {/* Assessment Fields Section */}
                    <div className="detail-section">
                      <h3>Assessment Fields ({gradingFields.length})</h3>
                      <div className="assessment-fields-table">
                        <div className="fields-table-header">
                          <span>Field Name</span>
                          <span>Weight (%)</span>
                          <span>Max Score</span>
                        </div>
                        {gradingFields.map((field, index) => (
                          <div key={index} className="fields-table-row">
                            <span>{field.field_name || field.fieldName}</span>
                            <span>{field.weight}%</span>
                            <span>
                              {field.max_score || field.maxScore || "N/A"}
                            </span>
                          </div>
                        ))}
                        <div className="fields-table-footer">
                          <span>
                            <strong>Total Weight:</strong>
                          </span>
                          <span>
                            <strong>
                              {gradingFields.reduce(
                                (sum, field) => sum + field.weight,
                                0
                              )}
                              %
                            </strong>
                          </span>
                          <span></span>
                        </div>
                      </div>
                    </div>

                    {/* Grading Scheme Section */}
                    <div className="detail-section">
                      <h3>Grading Scheme ({gradingScheme.length} grades)</h3>
                      <div className="grading-scheme-table">
                        <div className="scheme-table-header">
                          <span>Grade</span>
                          <span>Range</span>
                          <span>Grade Point</span>
                          <span>Pass/Fail</span>
                        </div>
                        {gradingScheme.map((scheme, index) => (
                          <div key={index} className="scheme-table-row">
                            <span>
                              {scheme.grade_letter || scheme.gradeLetter}
                            </span>
                            <span>
                              {scheme.min_range || scheme.minRange}% -{" "}
                              {scheme.max_range || scheme.maxRange}%
                            </span>
                            <span>
                              {scheme.grade_point || scheme.gradePoint}
                            </span>
                            <span
                              className={`pass-fail ${(
                                scheme.pass_fail || scheme.passFail
                              ).toLowerCase()}`}
                            >
                              {scheme.pass_fail || scheme.passFail}
                            </span>
                          </div>
                        ))}
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
                        selectedTemplate.status === "active"
                          ? "warning"
                          : "success"
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
                          <FaCheckCircle
                            size={14}
                            style={{ marginRight: "8px" }}
                          />
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
              );
            })()}
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default GradingTemplates;

