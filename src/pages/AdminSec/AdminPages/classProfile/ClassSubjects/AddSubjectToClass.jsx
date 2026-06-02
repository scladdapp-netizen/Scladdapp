import { useState } from "react";
import { useParams } from "react-router-dom";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import Button from "../../../../../components/Button/Button";
import { Icons } from "../../../../../utils/icons";
import "./AddSubjectToClass.css";

const AddSubjectToClass = ({ onClose, onSubjectAdded }) => {
  const { classId, schoolId } = useParams();
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sample available subjects data (not currently assigned to this class)
  const availableSubjects = [
    {
      subjectId: "SUB009",
      subjectName: "Art & Design",
      subjectCode: "ART10A",
      category: "Arts",
      creditHours: 2,
      description: "Creative arts, drawing, painting, and design principles",
      prerequisites: "None",
      status: "Active",
      currentClasses: ["Grade 9A", "Grade 9B"],
    },
    {
      subjectId: "SUB010",
      subjectName: "Music",
      subjectCode: "MUS10A",
      category: "Arts",
      creditHours: 2,
      description: "Music theory, vocal training, and instrument practice",
      prerequisites: "None",
      status: "Active",
      currentClasses: ["Grade 8A"],
    },
    {
      subjectId: "SUB011",
      subjectName: "Physical Education",
      subjectCode: "PE10A",
      category: "Physical",
      creditHours: 2,
      description: "Physical fitness, sports, and health education",
      prerequisites: "None",
      status: "Active",
      currentClasses: [],
    },
    {
      subjectId: "SUB012",
      subjectName: "French Language",
      subjectCode: "FRE10A",
      category: "Language",
      creditHours: 3,
      description: "French language learning and cultural studies",
      prerequisites: "None",
      status: "Active",
      currentClasses: ["Grade 10B"],
    },
    {
      subjectId: "SUB013",
      subjectName: "Economics",
      subjectCode: "ECO10A",
      category: "Social Studies",
      creditHours: 3,
      description: "Basic economic principles and market systems",
      prerequisites: "Grade 9 Social Studies",
      status: "Active",
      currentClasses: ["Grade 11A"],
    },
  ];

  // Format subjects for SearchableSelect
  const subjectOptions = availableSubjects.map((subject) => ({
    value: subject.subjectId,
    label: subject.subjectName,
    subtitle: `${subject.subjectCode} • ${subject.category} • ${subject.creditHours} credits`,
    ...subject,
  }));

  // Get selected subject details
  const getSelectedSubject = () => {
    return availableSubjects.find((s) => s.subjectId === selectedSubjectId);
  };

  const selectedSubject = getSelectedSubject();

  const handleAssignSubject = async () => {
    if (!selectedSubjectId) return;

    setIsLoading(true);
    try {
      // Simulate API call to assign subject to class
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Assigning subject ${selectedSubjectId} to class ${classId}`);

      // Call the callback to refresh the subject list
      if (onSubjectAdded) {
        onSubjectAdded(selectedSubject);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error assigning subject:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSubject = () => {
    // Navigate to subjects page in new tab
    const url = `http://localhost:5173/admin/${schoolId}/school_directory/subjects`;
    window.open(url, "_blank");
  };

  const handleRefresh = () => {
    // Refresh the available subjects list
    console.log("Refreshing subjects list...");
    // In a real app, this would refetch the subjects from the API
  };

  return (
    <div className="add-subject-to-class">
      {/* Header */}
      <div className="astc-header">
        <div className="astc-header-content">
          <Icons.Subject size={24} color="#4f46e5" />
          <div>
            <h2 className="astc-title">Add Subject to Class</h2>
            <p className="astc-subtitle">
              Assign a subject to this class for the current academic session
            </p>
          </div>
        </div>
        <button className="astc-close-btn" onClick={onClose}>
          <Icons.X size={20} />
        </button>
      </div>
      {/* Action Buttons */}
      <div className="astc-action-buttons">
        <button
          type="button"
          className="astc-action-btn create-btn"
          onClick={handleCreateNewSubject}
          title="Create a new subject"
        >
          <Icons.Plus size={16} />
          <span>Create New Subject</span>
          <Icons.ExternalLink size={14} />
        </button>
        <button
          type="button"
          className="astc-action-btn refresh-btn"
          onClick={handleRefresh}
          title="Refresh subjects list"
        >
          <Icons.Refresh size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Form */}
      <div className="astc-form">
        <div className="astc-form-group">
          <SearchableSelect
            label="Select Subject"
            placeholder="Search by subject name or code..."
            options={subjectOptions}
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
            displayKey="label"
            valueKey="value"
            searchKeys={["label", "subjectCode", "category"]}
            maxDisplayItems={8}
            required
          />
        </div>

        {/* Selected Subject Details */}
        {selectedSubject && (
          <div className="astc-subject-details">
            <h3 className="astc-details-title">Subject Information</h3>
            <div className="astc-details-grid">
              <div className="astc-detail-item">
                <span className="astc-detail-label">Subject Name:</span>
                <span className="astc-detail-value">
                  {selectedSubject.subjectName}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Subject ID:</span>
                <span className="astc-detail-value">
                  {selectedSubject.subjectId}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Subject Code:</span>
                <span className="astc-detail-value">
                  {selectedSubject.subjectCode}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Category:</span>
                <span className="astc-detail-value">
                  {selectedSubject.category}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Credit Hours:</span>
                <span className="astc-detail-value">
                  {selectedSubject.creditHours} credits
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Prerequisites:</span>
                <span className="astc-detail-value">
                  {selectedSubject.prerequisites}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Status:</span>
                <span
                  className={`astc-status ${selectedSubject.status.toLowerCase()}`}
                >
                  {selectedSubject.status}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="astc-description">
              <span className="astc-detail-label">Description:</span>
              <p className="astc-description-text">
                {selectedSubject.description}
              </p>
            </div>

            {/* Current Classes */}
            {selectedSubject.currentClasses &&
              selectedSubject.currentClasses.length > 0 && (
                <div className="astc-current-classes">
                  <span className="astc-detail-label">
                    Currently taught in:
                  </span>
                  <div className="astc-classes-list">
                    {selectedSubject.currentClasses.map((className, index) => (
                      <span key={index} className="astc-class-tag">
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Warning for subjects with many classes */}
            {selectedSubject.currentClasses &&
              selectedSubject.currentClasses.length > 2 && (
                <div className="astc-warning">
                  <Icons.AlertTriangle size={16} color="#f59e0b" />
                  <span>
                    This subject is already taught in{" "}
                    {selectedSubject.currentClasses.length} classes. Consider
                    teacher workload when assigning.
                  </span>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="astc-actions">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleAssignSubject}
          disabled={!selectedSubjectId || isLoading}
          loading={isLoading}
        >
          {isLoading ? "Assigning..." : "Assign Subject"}
        </Button>
      </div>
    </div>
  );
};

export default AddSubjectToClass;
