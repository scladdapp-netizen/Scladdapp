import React, { useState, useEffect } from "react";
import Button from "../../../../../../components/Button/Button";
import FormInput from "../../../../../../components/FormInput";
import TargetAudienceSelector from "./TargetAudienceSelector/TargetAudienceSelector";
import { FaPaperPlane, FaEye } from "react-icons/fa";
import "./CreateAnnouncement.css";

const CreateAnnouncement = ({
  onSubmit,
  onCancel,
  onPreview,
  initialData = null,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetType: "",
    selectedTargets: [],
    deliveryChannels: "Email",
    priority: "Medium",
    repliesAllowed: "Yes",
    scheduleOption: "send_now",
    scheduledDateTime: "",
    isUrgent: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        targetType: initialData.targetType || "",
        selectedTargets: initialData.selectedTargets || [],
        deliveryChannels: initialData.deliveryChannels || "Email",
        priority: initialData.priority || "Medium",
        repliesAllowed: initialData.repliesAllowed || "Yes",
        scheduleOption: initialData.scheduleOption || "send_now",
        scheduledDateTime: initialData.scheduledDateTime || "",
        isUrgent: initialData.isUrgent || false,
      });
    }
  }, [initialData]);

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTargetChange = (targetType, selectedTargets) => {
    setFormData((prev) => ({
      ...prev,
      targetType,
      selectedTargets,
    }));
  };

  const isFormValid = () => {
    return (
      formData.title.trim() !== "" &&
      formData.content.trim() !== "" &&
      formData.targetType !== "" &&
      formData.selectedTargets.length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      alert("Please fill all required fields and select target audience");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting announcement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    if (!isFormValid()) {
      alert("Please fill all required fields and select target audience");
      return;
    }
    onPreview(formData);
  };

  return (
    <div className="create-announcement-container">
      {/* Header */}
      <div className="create-announcement-header">
        <div className="header-left">
          <h2>{isEdit ? "Edit Announcement" : "Create New Announcement"}</h2>
          <p>Compose and target your school announcement</p>
        </div>
        <div className="header-right">
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="create-announcement-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <FormInput
            label="Announcement Title *"
            type="text"
            value={formData.title}
            onChange={handleInputChange("title")}
            placeholder="Enter announcement title (e.g., School Resumes 13 Jan)"
            maxLength={100}
          />

          <FormInput
            label="Content *"
            type="textarea"
            value={formData.content}
            onChange={handleInputChange("content")}
            placeholder="Enter announcement content..."
            height="120px"
            maxLength={1000}
          />
        </div>

        {/* Target Audience Selection */}
        <div className="form-section">
          <h3>Target Audience *</h3>
          <TargetAudienceSelector
            selectedType={formData.targetType}
            selectedTargets={formData.selectedTargets}
            onChange={handleTargetChange}
          />
        </div>

        {/* Delivery Settings */}
        <div className="form-section">
          <h3>Delivery Settings</h3>

          <div className="form-row">
            {/* <FormInput
              label="Delivery Channels *"
              type="select"
              value={formData.deliveryChannels}
              onChange={handleInputChange("deliveryChannels")}
              options={[
                { value: "Email", label: "Email Only" },
                { value: "SMS", label: "SMS Only" },
                { value: "App Push", label: "App Push Only" },
                { value: "Email,SMS", label: "Email + SMS" },
                { value: "Email,App Push", label: "Email + App Push" },
                { value: "SMS,App Push", label: "SMS + App Push" },
                { value: "Email,SMS,App Push", label: "All Channels" },
              ]}
            /> */}

            <FormInput
              label="Priority *"
              type="select"
              value={formData.priority}
              onChange={handleInputChange("priority")}
              options={[
                { value: "Low", label: "Low Priority" },
                { value: "Medium", label: "Medium Priority" },
                { value: "High", label: "High Priority" },
              ]}
            />
          </div>

          <div className="form-row">
            <FormInput
              label="Allow Replies *"
              type="select"
              value={formData.repliesAllowed}
              onChange={handleInputChange("repliesAllowed")}
              options={[
                { value: "Yes", label: "Yes - Allow recipients to reply" },
                { value: "No", label: "No - One-way announcement only" },
              ]}
            />

            <FormInput
              label="Schedule Option *"
              type="select"
              value={formData.scheduleOption}
              onChange={handleInputChange("scheduleOption")}
              options={[
                { value: "send_now", label: "Send Now" },
                { value: "schedule_later", label: "Schedule for Later" },
              ]}
            />
          </div>

          {formData.scheduleOption === "schedule_later" && (
            <FormInput
              label="Scheduled Date & Time *"
              type="date"
              value={formData.scheduledDateTime}
              onChange={handleInputChange("scheduledDateTime")}
            />
          )}

          <FormInput
            label="Mark as Urgent"
            type="checkbox"
            value={formData.isUrgent}
            onChange={handleInputChange("isUrgent")}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="create-announcement-footer">
        <div className="footer-left">
          <span className="target-summary">
            {formData.selectedTargets.length > 0 && (
              <>
                Targeting: {formData.selectedTargets.length} recipient
                {formData.selectedTargets.length !== 1 ? "s" : ""}
              </>
            )}
          </span>
        </div>

        <div className="footer-right">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handlePreview}
            disabled={!isFormValid()}
          >
            <FaEye size={14} style={{ marginRight: "8px" }} />
            Preview
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!isFormValid()}
            loading={isLoading}
            loadingText="Creating..."
          >
            <FaPaperPlane size={14} style={{ marginRight: "8px" }} />
            {isEdit ? "Update Announcement" : "Create Announcement"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAnnouncement;
