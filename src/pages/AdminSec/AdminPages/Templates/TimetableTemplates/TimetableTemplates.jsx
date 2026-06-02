import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Timetable from "../../../../../components/timetable/Timetable";
import { useTimetableTemplate } from "../../../../../api_call";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../../../components/SubAdminGuard/SubAdminGuard";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { FaPlus, FaEdit, FaCopy, FaTrash } from "react-icons/fa";

const TimetableTemplates = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    createTimetableTemplate,
    getTimetableTemplatesBySchool,
    updateTimetableTemplate,
    deleteTimetableTemplate,
    duplicateTimetableTemplate,
    updateTemplateStatus,
  } = useTimetableTemplate();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.timetable_template?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.timetable_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.timetable_template?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [timetableTemplates, setTimetableTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    loadTemplates();
  }, [schoolId]);

  const loadTemplates = async () => {
    setDataLoading(true);
    try {
      const result = await getTimetableTemplatesBySchool(schoolId);
      if (result.success) {
        // Transform backend data to frontend format
        const transformedTemplates = result.data.map((template) => ({
          id: template.template_id,
          name: template.name,
          description: template.description,
          status: template.status,
          lastModified: new Date(template.last_modified).toLocaleDateString(),
          createdBy: template.created_by || "System",
          type: template.type,
          dailyPeriods: template.daily_periods,
          selectedDays: template.selected_days,
          maxPeriodDuration: template.max_period_duration,
          dailySchedule: transformDailySchedule(template.daily_schedule),
          breaks: transformBreaks(template.breaks),
        }));
        setTimetableTemplates(transformedTemplates);
      } else {
        addNotification(result.message || "Failed to load templates", "error");
      }
    } catch (error) {
      console.error("Load templates error:", error);
      addNotification("Failed to load timetable templates", "error");
    } finally {
      setDataLoading(false);
    }
  };

  // Transform daily schedule from snake_case to camelCase
  const transformDailySchedule = (schedule) => {
    const transformed = {};
    Object.keys(schedule).forEach((day) => {
      transformed[day] = {
        startTime: schedule[day].start_time,
        endTime: schedule[day].end_time,
      };
    });
    return transformed;
  };

  // Transform breaks from snake_case to camelCase
  const transformBreaks = (breaks) => {
    return breaks.map((breakItem) => ({
      name: breakItem.name,
      duration: breakItem.duration,
      afterPeriod: breakItem.after_period,
      days: breakItem.days,
    }));
  };

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "weekly",
    dailyPeriods: {
      Monday: 8,
      Tuesday: 8,
      Wednesday: 8,
      Thursday: 8,
      Friday: 8,
      Saturday: 0,
      Sunday: 0,
    },
    selectedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    maxPeriodDuration: 40,
    dailySchedule: {
      Monday: { startTime: "08:00", endTime: "15:00" },
      Tuesday: { startTime: "08:00", endTime: "15:00" },
      Wednesday: { startTime: "08:00", endTime: "15:00" },
      Thursday: { startTime: "08:00", endTime: "15:00" },
      Friday: { startTime: "08:00", endTime: "15:00" },
      Saturday: { startTime: "08:00", endTime: "12:00" },
      Sunday: { startTime: "08:00", endTime: "12:00" },
    },
    breaks: [
      {
        name: "Morning Break",
        duration: 20,
        afterPeriod: 2,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    ],
  });

  // Validation functions
  const validateTimetableData = (data) => {
    const errors = [];

    // Check if at least one day is selected
    if (data.selectedDays.length === 0) {
      errors.push("At least one day must be selected");
    }

    // Check if selected days have periods
    data.selectedDays.forEach((day) => {
      if (data.dailyPeriods[day] <= 0) {
        errors.push(`${day} must have at least 1 period`);
      }
    });

    // Validate daily schedules
    data.selectedDays.forEach((day) => {
      const schedule = data.dailySchedule[day];
      const startMinutes = timeToMinutes(schedule.startTime);
      const endMinutes = timeToMinutes(schedule.endTime);

      if (startMinutes >= endMinutes) {
        errors.push(`${day}: End time must be after start time`);
      }

      // Calculate if there's enough time for all periods and breaks
      const totalMinutes = endMinutes - startMinutes;
      const periodsCount = data.dailyPeriods[day];
      const dayBreaks = data.breaks.filter((b) => b.days.includes(day));
      const totalBreakTime = dayBreaks.reduce((sum, b) => sum + b.duration, 0);
      const minRequiredTime = periodsCount * 15 + totalBreakTime; // Minimum 15 min per period

      if (totalMinutes < minRequiredTime) {
        errors.push(
          `${day}: Not enough time for ${periodsCount} periods and breaks (need at least ${minRequiredTime} minutes, have ${totalMinutes})`
        );
      }
    });

    // Validate breaks
    data.breaks.forEach((breakItem, index) => {
      if (!breakItem.name.trim()) {
        errors.push(`Break ${index + 1}: Name is required`);
      }

      if (breakItem.duration < 5) {
        errors.push(`Break ${index + 1}: Duration must be at least 5 minutes`);
      }

      if (breakItem.days.length === 0) {
        errors.push(`Break ${index + 1}: Must apply to at least one day`);
      }

      // Check if break comes after a valid period
      breakItem.days.forEach((day) => {
        if (data.selectedDays.includes(day)) {
          const periodsForDay = data.dailyPeriods[day];
          if (breakItem.afterPeriod >= periodsForDay) {
            errors.push(
              `Break ${index + 1}: Cannot come after period ${
                breakItem.afterPeriod
              } on ${day} (only ${periodsForDay} periods)`
            );
          }
        }
      });
    });

    return errors;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Generate sample timetable data for preview
  const generatePreviewData = (templateData) => {
    const sampleSubjects = [
      "Mathematics",
      "English",
      "Science",
      "History",
      "Geography",
      "Art",
      "Music",
      "PE",
      "Chemistry",
      "Physics",
    ];
    const previewData = [];
    let subjectIndex = 0;

    templateData.selectedDays.forEach((day) => {
      const schedule = templateData.dailySchedule[day];
      const periodsCount = templateData.dailyPeriods[day];
      const startMinutes = timeToMinutes(schedule.startTime);
      const endMinutes = timeToMinutes(schedule.endTime);
      const dayBreaks = templateData.breaks.filter((b) => b.days.includes(day));

      // Calculate available time for periods
      const totalBreakTime = dayBreaks.reduce((sum, b) => sum + b.duration, 0);
      const availableTime = endMinutes - startMinutes - totalBreakTime;
      const periodDuration = Math.min(
        templateData.maxPeriodDuration,
        Math.floor(availableTime / periodsCount)
      );

      let currentTime = startMinutes;

      for (let period = 1; period <= periodsCount; period++) {
        // Check if there's a break after this period
        const breakAfterPeriod = dayBreaks.find(
          (b) => b.afterPeriod === period
        );

        const periodStart = minutesToTime(currentTime);
        const periodEnd = minutesToTime(currentTime + periodDuration);

        previewData.push({
          id: `${day}-${period}`,
          day: day,
          name: sampleSubjects[subjectIndex % sampleSubjects.length],
          start: periodStart,
          end: periodEnd,
        });

        currentTime += periodDuration;
        subjectIndex++;

        // Add break time if there's a break after this period
        if (breakAfterPeriod) {
          currentTime += breakAfterPeriod.duration;
        }
      }
    });

    return previewData;
  };

  const typeOptions = [
    { value: "weekly", label: "Weekly Schedule" },
    { value: "block", label: "Block Schedule" },
    { value: "elementary", label: "Elementary Schedule" },
    { value: "exam", label: "Exam Schedule" },
    { value: "custom", label: "Custom Schedule" },
  ];

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDailyPeriodsChange = (day, periods) => {
    setFormData((prev) => ({
      ...prev,
      dailyPeriods: { ...prev.dailyPeriods, [day]: parseInt(periods) || 0 },
    }));
  };

  const handleDayToggle = (day) => {
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }));
  };

  const handleDailyScheduleChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      dailySchedule: {
        ...prev.dailySchedule,
        [day]: { ...prev.dailySchedule[day], [field]: value },
      },
    }));
  };

  const handleBreakChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.map((breakItem, i) =>
        i === index ? { ...breakItem, [field]: value } : breakItem
      ),
    }));
  };

  const handleBreakDayToggle = (breakIndex, day) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.map((breakItem, i) =>
        i === breakIndex
          ? {
              ...breakItem,
              days: breakItem.days.includes(day)
                ? breakItem.days.filter((d) => d !== day)
                : [...breakItem.days, day],
            }
          : breakItem
      ),
    }));
  };

  const addBreak = () => {
    setFormData((prev) => ({
      ...prev,
      breaks: [
        ...prev.breaks,
        {
          name: "Break",
          duration: 15,
          afterPeriod: 3,
          days: [...prev.selectedDays],
        },
      ],
    }));
  };

  const removeBreak = (index) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index),
    }));
  };

  const handleCreateTemplate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create timetable templates.", "error");
      return;
    }
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      type: "weekly",
      dailyPeriods: {
        Monday: 8,
        Tuesday: 8,
        Wednesday: 8,
        Thursday: 8,
        Friday: 8,
        Saturday: 0,
        Sunday: 0,
      },
      selectedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      maxPeriodDuration: 40,
      dailySchedule: {
        Monday: { startTime: "08:00", endTime: "15:00" },
        Tuesday: { startTime: "08:00", endTime: "15:00" },
        Wednesday: { startTime: "08:00", endTime: "15:00" },
        Thursday: { startTime: "08:00", endTime: "15:00" },
        Friday: { startTime: "08:00", endTime: "15:00" },
        Saturday: { startTime: "08:00", endTime: "12:00" },
        Sunday: { startTime: "08:00", endTime: "12:00" },
      },
      breaks: [
        {
          name: "Morning Break",
          duration: 20,
          afterPeriod: 2,
          days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        },
      ],
    });
  };

  const handleEditTemplate = (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit timetable templates.", "error");
      return;
    }
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      dailyPeriods: template.dailyPeriods,
      selectedDays: template.selectedDays,
      maxPeriodDuration: template.maxPeriodDuration,
      dailySchedule: template.dailySchedule,
      breaks: template.breaks,
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsDetailMenuOpen(true);
  };

  const handlePreview = () => {
    const errors = validateTimetableData(formData);
    if (errors.length > 0) {
      // Show validation errors as notifications
      errors.forEach((error) => {
        addNotification(error, "error");
      });
      return;
    }
    setIsPreviewOpen(true);
  };

  const handleSubmit = async () => {
    const errors = validateTimetableData(formData);
    if (errors.length > 0) {
      // Show validation errors as notifications
      errors.forEach((error) => {
        addNotification(error, "error");
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Transform formData to backend format (camelCase to snake_case)
      const backendData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        daily_periods: formData.dailyPeriods,
        selected_days: formData.selectedDays,
        max_period_duration: formData.maxPeriodDuration,
        daily_schedule: transformDailyScheduleToBackend(formData.dailySchedule),
        breaks: transformBreaksToBackend(formData.breaks),
        created_by: user?.admin?.admin_id || user?.user_id,
        modified_by: user?.admin?.admin_id || user?.user_id,
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateTimetableTemplate(
          selectedTemplate.id,
          backendData
        );
      } else {
        // Create new template
        result = await createTimetableTemplate(backendData);
      }

      if (result.success) {
        addNotification(
          result.message ||
            `Timetable template ${
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
      addNotification("Failed to save timetable template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transform daily schedule to backend format
  const transformDailyScheduleToBackend = (schedule) => {
    const transformed = {};
    Object.keys(schedule).forEach((day) => {
      transformed[day] = {
        start_time: schedule[day].startTime,
        end_time: schedule[day].endTime,
      };
    });
    return transformed;
  };

  // Transform breaks to backend format
  const transformBreaksToBackend = (breaks) => {
    return breaks.map((breakItem) => ({
      name: breakItem.name,
      duration: breakItem.duration,
      after_period: breakItem.afterPeriod,
      days: breakItem.days,
    }));
  };

  const handleDuplicate = async (template) => {
    if (!canCreate) {
      addNotification("You do not have permission to duplicate timetable templates.", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await duplicateTimetableTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(
          "Timetable template duplicated successfully",
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
      addNotification("Failed to duplicate timetable template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete timetable templates.", "error");
      return;
    }
    if (
      !window.confirm(`Are you sure you want to delete "${template.name}"?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteTimetableTemplate(template.id, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification("Timetable template deleted successfully", "success");
        setIsDetailMenuOpen(false);
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Failed to delete template", "error");
      }
    } catch (error) {
      console.error("Delete error:", error);
      addNotification("Failed to delete timetable template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusToggle = async (template, newStatus) => {
    setIsSubmitting(true);
    try {
      const result = await updateTemplateStatus(template.id, newStatus, user?.admin?.admin_id || user?.user_id);
      if (result.success) {
        addNotification(`Template ${newStatus} successfully`, "success");
        await loadTemplates(); // Reload templates
      } else {
        addNotification(result.message || "Failed to update status", "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      addNotification("Failed to update template status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SubAdminGuard permission="timetable_template">
    <InnerTabCon>
      {dataLoading ? (
        <LoadingData />
      ) : (
        <div className="templates-container">
          <div className="templates-header">
            <div className="templates-header-left">
              <h2>Timetable Templates</h2>
              <p>
                Create and manage timetable layouts for different scheduling
                needs
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
            <h3>Available Timetable Templates</h3>
            {timetableTemplates.length === 0 ? (
              <div className="kk-template-empty-state">
                <p>No timetable templates found</p>
                <p style={{ fontSize: "14px" }}>Create your first timetable template to get started</p>
                <Button onClick={handleCreateTemplate}><FaPlus size={14} style={{ marginRight: "8px" }} />Create Template</Button>
              </div>
            ) : (
            <div className="template-grid">
              {timetableTemplates.map((template) => (
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
                      <strong>Type:</strong> {template.type}
                    </div>
                    <div className="template-detail-item">
                      <strong>Days:</strong> {template.selectedDays.length}{" "}
                      days/week
                    </div>
                    <div className="template-detail-item">
                      <strong>Max Duration:</strong>{" "}
                      {template.maxPeriodDuration} min
                    </div>
                    <div className="template-detail-item">
                      <strong>Breaks:</strong> {template.breaks.length}
                    </div>
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
                  {selectedTemplate ? "Edit" : "Create"} Timetable Template
                </h2>
                <p>Configure your timetable structure and layout</p>
              </div>

              <div className="create-template-form">
                <div className="form-row">
                  <FormInput
                    label="Template Name *"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange("name")}
                    placeholder="e.g., Standard Weekly Timetable"
                  />

                  <FormInput
                    label="Schedule Type"
                    type="select"
                    value={formData.type}
                    onChange={handleInputChange("type")}
                    options={typeOptions}
                  />
                </div>

                <FormInput
                  label="Description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleInputChange("description")}
                  placeholder="Describe this timetable template..."
                  height="80px"
                />

                {/* Days Selection */}
                <div className="days-selection-section">
                  <h3>Days per Week</h3>
                  <p>Select which days to include in your timetable:</p>
                  <div className="days-grid">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day) => (
                      <label key={day} className="day-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.selectedDays.includes(day)}
                          onChange={() => handleDayToggle(day)}
                        />
                        <span>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Periods per Day */}
                <div className="periods-section">
                  <h3>Periods per Day</h3>
                  <p>Set the number of periods for each selected day:</p>
                  <div className="periods-grid">
                    {formData.selectedDays.map((day) => (
                      <div key={day} className="period-day-item">
                        <FormInput
                          label={day}
                          type="number"
                          value={formData.dailyPeriods[day]}
                          onChange={(value) =>
                            handleDailyPeriodsChange(day, value)
                          }
                          min="0"
                          max="12"
                          placeholder="8"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Max Period Duration */}
                <FormInput
                  label="Max Period Duration (minutes)"
                  type="number"
                  value={formData.maxPeriodDuration}
                  onChange={handleInputChange("maxPeriodDuration")}
                  placeholder="40"
                  min="15"
                  max="120"
                />

                {/* Daily Schedule Times */}
                <div className="daily-schedule-section">
                  <h3>Daily Schedule Times</h3>
                  <p>Set start and end times for each day:</p>
                  <div className="schedule-grid">
                    {formData.selectedDays.map((day) => (
                      <div key={day} className="schedule-day-item">
                        <h4>{day}</h4>
                        <div className="time-inputs">
                          <FormInput
                            label="Start Time"
                            type="time"
                            value={formData.dailySchedule[day].startTime}
                            onChange={(value) =>
                              handleDailyScheduleChange(day, "startTime", value)
                            }
                          />
                          <FormInput
                            label="End Time"
                            type="time"
                            value={formData.dailySchedule[day].endTime}
                            onChange={(value) =>
                              handleDailyScheduleChange(day, "endTime", value)
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaks Section */}
                <div className="breaks-section">
                  <div className="breaks-header">
                    <h3>Break Configuration</h3>
                    <Button variant="secondary" onClick={addBreak}>
                      <FaPlus size={12} /> Add Break
                    </Button>
                  </div>
                  <p>Configure breaks with duration and timing:</p>

                  {formData.breaks.map((breakItem, index) => (
                    <div key={index} className="break-configuration">
                      <div className="break-basic-info">
                        <FormInput
                          label="Break Name"
                          type="text"
                          value={breakItem.name}
                          onChange={(value) =>
                            handleBreakChange(index, "name", value)
                          }
                          placeholder="Morning Break"
                        />
                        <FormInput
                          label="Duration (minutes)"
                          type="number"
                          value={breakItem.duration}
                          onChange={(value) =>
                            handleBreakChange(
                              index,
                              "duration",
                              parseInt(value) || 0
                            )
                          }
                          placeholder="20"
                          min="5"
                          max="120"
                        />
                        <FormInput
                          label="After Period"
                          type="number"
                          value={breakItem.afterPeriod}
                          onChange={(value) =>
                            handleBreakChange(
                              index,
                              "afterPeriod",
                              parseInt(value) || 1
                            )
                          }
                          placeholder="2"
                          min="1"
                          max="12"
                        />
                      </div>

                      <div className="break-days-selection">
                        <h5>Apply to Days:</h5>
                        <div className="break-days-grid">
                          {formData.selectedDays.map((day) => (
                            <label key={day} className="break-day-checkbox">
                              <input
                                type="checkbox"
                                checked={breakItem.days.includes(day)}
                                onChange={() =>
                                  handleBreakDayToggle(index, day)
                                }
                              />
                              <span>{day.substring(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.breaks.length > 1 && (
                        <button
                          className="remove-break-btn"
                          onClick={() => removeBreak(index)}
                        >
                          <FaTrash size={12} /> Remove Break
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview Section */}
              {isPreviewOpen && (
                <div className="timetable-preview-section">
                  <div className="preview-header">
                    <h3>📅 Timetable Preview</h3>
                    <button
                      className="close-preview-btn"
                      onClick={() => setIsPreviewOpen(false)}
                    >
                      ✕ Close Preview
                    </button>
                  </div>
                  <div className="preview-content">
                    <Timetable timetableData={generatePreviewData(formData)} />
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
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={isSubmitting}
                >
                  Preview
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.name ||
                    formData.selectedDays.length === 0 ||
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
                      <strong>Type:</strong> {selectedTemplate.type}
                    </div>
                  </div>
                </div>

                <div className="template-detail-content">
                  {/* Schedule Configuration */}
                  <div className="detail-section">
                    <h3>Schedule Configuration</h3>
                    <div className="config-grid">
                      <div className="config-item">
                        <strong>Selected Days:</strong>
                        <span>{selectedTemplate.selectedDays.join(", ")}</span>
                      </div>
                      <div className="config-item">
                        <strong>Max Period Duration:</strong>
                        <span>
                          {selectedTemplate.maxPeriodDuration} minutes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Daily Periods */}
                  <div className="detail-section">
                    <h3>Daily Periods</h3>
                    <div className="periods-overview">
                      {selectedTemplate.selectedDays.map((day) => (
                        <div key={day} className="period-overview-item">
                          <span className="day-name">{day}</span>
                          <span className="period-count">
                            {selectedTemplate.dailyPeriods[day]} periods
                          </span>
                          <span className="time-range">
                            {selectedTemplate.dailySchedule[day].startTime} -{" "}
                            {selectedTemplate.dailySchedule[day].endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Breaks Configuration */}
                  <div className="detail-section">
                    <h3>
                      Breaks Configuration ({selectedTemplate.breaks.length})
                    </h3>
                    <div className="breaks-overview">
                      {selectedTemplate.breaks.map((breakItem, index) => (
                        <div key={index} className="break-overview-item">
                          <div className="break-info">
                            <span className="break-name">{breakItem.name}</span>
                            <span className="break-details">
                              {breakItem.duration} min after period{" "}
                              {breakItem.afterPeriod}
                            </span>
                          </div>
                          <div className="break-days">
                            <strong>Days:</strong> {breakItem.days.join(", ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timetable Preview */}
                  <div className="detail-section">
                    <h3>Timetable Preview</h3>
                    <div className="timetable-preview-container">
                      <Timetable
                        timetableData={generatePreviewData(selectedTemplate)}
                      />
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
                    Duplicate
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(selectedTemplate)}
                    disabled={isSubmitting}
                  >
                    <FaTrash size={14} style={{ marginRight: "8px" }} />
                    Delete
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

export default TimetableTemplates;

