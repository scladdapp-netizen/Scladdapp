import React, { useState, useEffect } from "react";
import "./DynamicForm.css";
import AGButton from "../../components/Button/AGButton";
import FormInput from "../../components/FormInput";
import Button from "../../components/Button/Button";
import { useNotification } from "../../context/NotificationProvider/NotificationProvider";

const DynamicForm = ({
  // Required props
  title,
  fields,
  onSubmit,
  submitButtonText = "Create",

  // Optional props for update functionality
  initialData = null,
  isEdit = false,
  onCancel,
  onSuccess,
  createMoreOption = true,
  loadingText = "Creating...",
}) => {
  const { addNotification } = useNotification();

  // Initialize form data based on fields configuration
  const initializeFormData = () => {
    const data = {};
    fields.forEach((field) => {
      if (initialData && initialData[field.name] !== undefined) {
        // Don't set initial values for file inputs to avoid the error
        if (field.type === "file") {
          data[field.name] = null;
        } else {
          data[field.name] = initialData[field.name];
        }
      } else {
        if (field.type === "file") {
          data[field.name] = null;
        } else {
          data[field.name] =
            field.type === "checkbox" || field.type === "switch" ? false : "";
        }
      }
    });

    // Add createMore field if enabled
    if (createMoreOption && !isEdit) {
      data.createMore = false;
    }

    return data;
  };

  const [formData, setFormData] = useState(initializeFormData);
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initializeFormData());
    }
  }, [initialData]);

  const handleInputChange = (fieldName) => (value) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    return fields.every((field) => {
      if (field.required) {
        const value = formData[field.name];
        if (value === undefined || value === null) return false;
        if (typeof value === "string") return value.trim() !== "";
        return true;
      }
      return true;
    });
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      addNotification("Please fill all required fields", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare data for submission (exclude createMore field)
      const submissionData = { ...formData };
      if (submissionData.createMore !== undefined) {
        delete submissionData.createMore;
      }

      // Call the provided onSubmit function
      const result = await onSubmit(submissionData);

      if (result && !result.success) {
        throw new Error(result.error || "Submission failed");
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(result?.data || submissionData);
      }

      addNotification(
        `${isEdit ? "Updated" : "Created"} successfully!`,
        "success"
      );

      // Reset form or handle createMore logic
      if (!isEdit && !formData.createMore) {
        onCancel?.();
      } else if (!isEdit && formData.createMore) {
        // Reset form but keep createMore checked
        const resetData = initializeFormData();
        resetData.createMore = true;
        setFormData(resetData);
      } else {
        // For edit mode, just close or stay open based on your needs
        onCancel?.();
      }
    } catch (err) {
      addNotification(
        `Error ${isEdit ? "updating" : "creating"}: ${err.message || err}`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="creatclassmailcon">
      {/* Header */}
      <div className="saidbaerheader">
        <span className="df-header-deco" aria-hidden="true" />
        <span className="df-header-deco2" aria-hidden="true" />
        <div className="sbhleftsec">
          <p className="saidbaerheadertext">{title}</p>
          <p className="df-header-sub">
            {isEdit ? "Update the details below" : "Fill in the details below"}
          </p>
        </div>
        <div className="rbhrightsec">
          <button className="df-close-btn" onClick={handleCancel} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
              <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Notice bar */}
      <div className="df-notice">
        <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M11 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="11" cy="7.5" r="1" fill="currentColor"/>
        </svg>
        <span>Fields marked with * are required</span>
      </div>

      {/* Form Fields */}
      <div className="creatclassform">
        {fields.map((field) => (
          <FormInput
            key={field.name}
            type={field.type}
            label={field.label}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            height={field.height}
            value={formData[field.name]}
            onChange={handleInputChange(field.name)}
            dataType={field.dataType}
            required={field.required}
            options={field.options}
            disabled={field.disabled}
            multiple={field.multiple}
            accept={field.accept}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="sbbcon">
        {createMoreOption && !isEdit && (
          <>
            <div className="chk">
              <FormInput
                type="checkbox"
                value={formData.createMore}
                onChange={handleInputChange("createMore")}
              />
            </div>
            <p>Create more</p>
          </>
        )}
        <AGButton text={"Cancel"} onClick={handleCancel} variant="outline" />
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          loading={isLoading}
          loadingText={loadingText}
        >
          {submitButtonText}
        </Button>
      </div>
    </div>
  );
};

export default DynamicForm;
