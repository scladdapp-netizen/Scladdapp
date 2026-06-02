import { useState } from "react";
import { useParams } from "react-router-dom";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import Button from "../../../../../components/Button/Button";
import { Icons } from "../../../../../utils/icons";
import "./AddStudentToClass.css";

const AddStudentToClass = ({ onClose, onStudentAdded }) => {
  const { classId, schoolId } = useParams();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sample available students data (not currently in this class)
  const availableStudents = [
    {
      studentId: "STU009",
      fullName: "Sarah Johnson",
      admissionNumber: "ADM2024009",
      currentClass: "Grade 9B",
      age: 14,
      guardianName: "Mrs. Mary Johnson",
      status: "Active",
    },
    {
      studentId: "STU010",
      fullName: "David Wilson",
      admissionNumber: "ADM2024010",
      currentClass: "Grade 10B",
      age: 15,
      guardianName: "Mr. John Wilson",
      status: "Active",
    },
    {
      studentId: "STU011",
      fullName: "Lisa Brown",
      admissionNumber: "ADM2024011",
      currentClass: null, // No current class
      age: 14,
      guardianName: "Mrs. Jennifer Brown",
      status: "Active",
    },
    {
      studentId: "STU012",
      fullName: "Mark Davis",
      admissionNumber: "ADM2024012",
      currentClass: "Grade 9A",
      age: 13,
      guardianName: "Mr. Robert Davis",
      status: "Active",
    },
    {
      studentId: "STU013",
      fullName: "Emily Garcia",
      admissionNumber: "ADM2024013",
      currentClass: null,
      age: 14,
      guardianName: "Mrs. Carmen Garcia",
      status: "Active",
    },
  ];

  // Format students for SearchableSelect
  const studentOptions = availableStudents.map((student) => ({
    value: student.studentId,
    label: student.fullName,
    subtitle: `${student.admissionNumber} • ${
      student.currentClass || "No current class"
    }`,
    ...student,
  }));

  // Get selected student details
  const getSelectedStudent = () => {
    return availableStudents.find((s) => s.studentId === selectedStudentId);
  };

  const selectedStudent = getSelectedStudent();

  const handleAssignStudent = async () => {
    if (!selectedStudentId) return;

    setIsLoading(true);
    try {
      // Simulate API call to assign student to class
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log(`Assigning student ${selectedStudentId} to class ${classId}`);

      // Call the callback to refresh the student list
      if (onStudentAdded) {
        onStudentAdded(selectedStudent);
      }

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error assigning student:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-student-to-class">
      {/* Header */}
      <div className="astc-header">
        <div className="astc-header-content">
          <Icons.UserPlus size={24} color="#4f46e5" />
          <div>
            <h2 className="astc-title">Add Student to Class</h2>
            <p className="astc-subtitle">
              Assign a student to this class for the current academic session
            </p>
          </div>
        </div>
        <button className="astc-close-btn" onClick={onClose}>
          <Icons.X size={20} />
        </button>
      </div>

      {/* Form */}
      <div className="astc-form">
        <div className="astc-form-group">
          <SearchableSelect
            label="Select Student"
            placeholder="Search by name or admission number..."
            options={studentOptions}
            value={selectedStudentId}
            onChange={setSelectedStudentId}
            displayKey="label"
            valueKey="value"
            searchKeys={["label", "admissionNumber", "currentClass"]}
            maxDisplayItems={8}
            required
          />
        </div>

        {/* Selected Student Details */}
        {selectedStudent && (
          <div className="astc-student-details">
            <h3 className="astc-details-title">Student Information</h3>
            <div className="astc-details-grid">
              <div className="astc-detail-item">
                <span className="astc-detail-label">Full Name:</span>
                <span className="astc-detail-value">
                  {selectedStudent.fullName}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Student ID:</span>
                <span className="astc-detail-value">
                  {selectedStudent.studentId}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Admission Number:</span>
                <span className="astc-detail-value">
                  {selectedStudent.admissionNumber}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Age:</span>
                <span className="astc-detail-value">
                  {selectedStudent.age} years
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Current Class:</span>
                <span
                  className={`astc-detail-value ${
                    !selectedStudent.currentClass ? "no-class" : ""
                  }`}
                >
                  {selectedStudent.currentClass || "No current class"}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Guardian:</span>
                <span className="astc-detail-value">
                  {selectedStudent.guardianName}
                </span>
              </div>
              <div className="astc-detail-item">
                <span className="astc-detail-label">Status:</span>
                <span
                  className={`astc-status ${selectedStudent.status.toLowerCase()}`}
                >
                  {selectedStudent.status}
                </span>
              </div>
            </div>

            {/* Warning for students with current class */}
            {selectedStudent.currentClass && (
              <div className="astc-warning">
                <Icons.AlertTriangle size={16} color="#f59e0b" />
                <span>
                  This student is currently assigned to{" "}
                  {selectedStudent.currentClass}. Assigning them to this class
                  will remove them from their current class.
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
          onClick={handleAssignStudent}
          disabled={!selectedStudentId || isLoading}
          loading={isLoading}
        >
          {isLoading ? "Assigning..." : "Assign Student"}
        </Button>
      </div>
    </div>
  );
};

export default AddStudentToClass;
