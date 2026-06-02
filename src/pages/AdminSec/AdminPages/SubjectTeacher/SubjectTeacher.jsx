import React, { useState } from "react";
import {
  FaArrowRight,
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import InfoField from "../../../../components/infoField/InfoField";
import "./SubjectTeacher.css";

// Available teachers
const availableTeachers = [
  {
    value: "teacher001",
    label: "Mrs. Grace Okon",
    subtitle: "Mathematics Specialist",
  },
  {
    value: "teacher002",
    label: "Mr. John Adebayo",
    subtitle: "English Literature",
  },
  {
    value: "teacher003",
    label: "Mrs. Fatima Hassan",
    subtitle: "Science Teacher",
  },
  {
    value: "teacher004",
    label: "Mr. Emmanuel Okafor",
    subtitle: "History Teacher",
  },
  {
    value: "teacher005",
    label: "Mrs. Aisha Bello",
    subtitle: "Chemistry Teacher",
  },
  {
    value: "teacher006",
    label: "Mr. David Okoro",
    subtitle: "Physics Teacher",
  },
  {
    value: "teacher007",
    label: "Mrs. Sarah Ahmed",
    subtitle: "Biology Teacher",
  },
  {
    value: "teacher008",
    label: "Mr. Peter Nwankwo",
    subtitle: "Geography Teacher",
  },
];

const subjectTeacherData = [
  {
    id: 1,
    class: "JSS 2A",
    subject: "Mathematics",
    teacher: {
      id: "teacher001",
      name: "Mrs. Grace Okon",
      img: "/images/grace.jpg",
      specialization: "Mathematics",
      assignedDate: "2024-09-01",
      experience: "8 years",
    },
    assigned: true,
  },
  {
    id: 2,
    class: "JSS 2B",
    subject: "Mathematics",
    teacher: {
      id: "teacher001", // Same teacher assigned to multiple classes
      name: "Mrs. Grace Okon",
      img: "/images/grace.jpg",
      specialization: "Mathematics",
      assignedDate: "2024-09-01",
      experience: "8 years",
    },
    assigned: true,
  },
  {
    id: 3,
    class: "SS1 A",
    subject: "English Literature",
    teacher: null,
    assigned: false,
  },
  {
    id: 4,
    class: "JSS 3A",
    subject: "Science",
    teacher: {
      id: "teacher003",
      name: "Mrs. Fatima Hassan",
      img: "/images/fatima.jpg",
      specialization: "General Science",
      assignedDate: "2024-08-15",
      experience: "5 years",
    },
    assigned: true,
  },
  {
    id: 5,
    class: "SS2 B",
    subject: "Chemistry",
    teacher: null,
    assigned: false,
  },
  {
    id: 6,
    class: "JSS 1A",
    subject: "Geography",
    teacher: {
      id: "teacher008",
      name: "Mr. Peter Nwankwo",
      img: "/images/peter.jpg",
      specialization: "Geography",
      assignedDate: "2024-09-10",
      experience: "12 years",
    },
    assigned: true,
  },
];

const SubjectTeacher = () => {
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignments, setAssignments] = useState(subjectTeacherData);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form states
  const [selectedTeacher, setSelectedTeacher] = useState("");

  // Check if teacher is assigned to multiple subjects
  const getTeacherAssignmentCount = (teacherId) => {
    return assignments.filter(
      (assignment) => assignment.teacher && assignment.teacher.id === teacherId
    ).length;
  };

  // Check if teacher has multiple assignments
  const hasMultipleAssignments = (teacherId) => {
    return getTeacherAssignmentCount(teacherId) > 1;
  };

  // Handle action menu click
  const handleActionClick = (e, assignment) => {
    e.stopPropagation();
    setSelectedAssignment(assignment);
    setShowActionMenu(showActionMenu === assignment.id ? null : assignment.id);
  };

  // Handle view assignment details
  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setShowAssignmentDetails(true);
    setShowActionMenu(null);
  };

  // Handle edit assignment
  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedTeacher(assignment.teacher ? assignment.teacher.id : "");
    setShowAssignmentDetails(false); // Close details menu
    setShowEditAssignment(true);
    setShowActionMenu(null);
  };

  // Handle assign new teacher
  const handleAssignTeacher = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedTeacher("");
    setShowAssignmentDetails(false); // Close details menu
    setShowEditAssignment(true);
    setShowActionMenu(null);
  };

  // Handle save assignment changes
  const handleSaveAssignmentChanges = async () => {
    if (selectedAssignment && selectedTeacher) {
      setIsLoading(true);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const selectedTeacherInfo = availableTeachers.find(
          (teacher) => teacher.value === selectedTeacher
        );

        const updatedAssignment = {
          ...selectedAssignment,
          teacher: {
            id: selectedTeacher,
            name: selectedTeacherInfo.label,
            img: `/images/${selectedTeacher}.jpg`,
            specialization: selectedTeacherInfo.subtitle,
            assignedDate: new Date().toISOString().split("T")[0],
            experience: "N/A",
          },
          assigned: true,
        };

        setAssignments((prev) =>
          prev.map((assignment) =>
            assignment.id === selectedAssignment.id
              ? updatedAssignment
              : assignment
          )
        );

        setSelectedAssignment(updatedAssignment);
        setShowEditAssignment(false);
        setShowAssignmentDetails(false); // Close details menu too

        // Log assignment details
        console.log("Subject teacher assignment updated:", {
          className: updatedAssignment.class,
          subject: updatedAssignment.subject,
          teacherName: selectedTeacherInfo.label,
          teacherId: selectedTeacher,
          assignedDate: updatedAssignment.teacher.assignedDate,
          multipleAssignments: hasMultipleAssignments(selectedTeacher),
          timestamp: new Date().toISOString(),
        });

        // Reset form
        setSelectedTeacher("");
      } catch (error) {
        console.error("Error updating assignment:", error);
        alert("Failed to update assignment. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Close action menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setShowActionMenu(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const columns = [
    { label: "CLASS", accessor: "class", render: (v) => <b>{v}</b> },
    { label: "SUBJECT", accessor: "subject" },
    {
      label: "TEACHER",
      accessor: "teacher",
      render: (v, row) => {
        if (v) {
          const isMultiple = hasMultipleAssignments(v.id);
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img
                src={v.img}
                style={{ width: 28, height: 28, borderRadius: 999 }}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    v.name
                  )}&background=6366f1&color=fff`;
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    color: isMultiple ? "#d97706" : "inherit",
                    fontWeight: isMultiple ? "600" : "normal",
                  }}
                >
                  {v.name}
                </span>
                {isMultiple && (
                  <small style={{ color: "#d97706", fontSize: "11px" }}>
                    <FaExclamationTriangle
                      size={10}
                      style={{ marginRight: 4 }}
                    />
                    Multiple assignments
                  </small>
                )}
              </div>
            </div>
          );
        }
        return <span style={{ color: "#d97706" }}>No teacher assigned</span>;
      },
    },
    {
      label: "ACTIONS",
      accessor: "actions",
      searchable: false,
      render: (val, row) => (
        <div className="action-container">
          <button
            className="action-button"
            onClick={(e) => handleActionClick(e, row)}
          >
            <FaEllipsisV size={14} />
          </button>

          {showActionMenu === row.id && (
            <div className="action-dropdown">
              <button
                className="action-option"
                onClick={() => handleViewDetails(row)}
              >
                <FaEye size={14} />
                View Details
              </button>
              {row.assigned ? (
                <button
                  className="action-option"
                  onClick={() => handleEditAssignment(row)}
                >
                  <FaEdit size={14} />
                  Change Teacher
                </button>
              ) : (
                <button
                  className="action-option"
                  onClick={() => handleAssignTeacher(row)}
                >
                  <FaUser size={14} />
                  Assign Teacher
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  const handleBulkDelete = async (ids) => {
    console.log("delete", ids);
  };

  const handleExport = async (opts) => {
    console.log("export opts", opts);
  };

  const handleCreate = () => {
    console.log("create pressed");
  };

  return (
    <div className="subject-teacher-container">
      <div className="spts">
        <h2>Subjects & Teachers</h2>
        <p>Manage subject teacher assignments and view assignment details</p>
      </div>

      <SmartTable
        columns={columns}
        data={assignments}
        onRowClick={(r) => handleViewDetails(r)}
        enableSelect={true}
        onSelectChange={(ids) => console.log("selected changed", ids)}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        onCreate={handleCreate}
        maxRowsPerPage={15}
        showcreatbut={false}
      />

      {/* Assignment Details Slide-in Menu */}
      <SlideInMenu
        isShow={showAssignmentDetails && !showEditAssignment}
        onClose={() => {
          setShowAssignmentDetails(false);
          setSelectedAssignment(null);
        }}
        width="600px"
      >
        {selectedAssignment && (
          <div className="assignment-details-container">
            <div className="assignment-details-header">
              <h3>Subject Assignment Details</h3>
              <p>
                Created:{" "}
                {selectedAssignment.teacher?.assignedDate || "Not assigned"}
              </p>
            </div>

            <div className="assignment-details-content">
              <div className="detail-section">
                <h3>Assignment Information</h3>
                <div className="detail-grid">
                  <InfoField label="Class" value={selectedAssignment.class} />
                  <InfoField
                    label="Subject"
                    value={selectedAssignment.subject}
                  />
                  {selectedAssignment.teacher ? (
                    <>
                      <InfoField
                        label="Teacher"
                        value={selectedAssignment.teacher.name}
                      />
                      <InfoField
                        label="Specialization"
                        value={selectedAssignment.teacher.specialization}
                      />
                      <InfoField
                        label="Experience"
                        value={selectedAssignment.teacher.experience}
                      />
                      <InfoField
                        label="Assigned Date"
                        value={new Date(
                          selectedAssignment.teacher.assignedDate
                        ).toLocaleDateString()}
                      />
                    </>
                  ) : (
                    <InfoField
                      label="Status"
                      value={
                        <span style={{ color: "#d97706" }}>
                          No teacher assigned
                        </span>
                      }
                    />
                  )}
                </div>
              </div>

              {selectedAssignment.teacher &&
                hasMultipleAssignments(selectedAssignment.teacher.id) && (
                  <div className="detail-section">
                    <h3>Assignment Warning</h3>
                    <div className="detail-grid">
                      <InfoField
                        label="Multiple Assignments"
                        value={
                          <span
                            style={{
                              color: "#d97706",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <FaExclamationTriangle size={14} />
                            This teacher is assigned to{" "}
                            {getTeacherAssignmentCount(
                              selectedAssignment.teacher.id
                            )}{" "}
                            subjects
                          </span>
                        }
                      />
                    </div>
                  </div>
                )}
            </div>

            <div className="assignment-details-footer">
              <div className="assignment-id">
                <small>Assignment ID: SUBJ-{selectedAssignment.id}-2025</small>
              </div>
              <div className="footer-buttons">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAssignmentDetails(false);
                    setSelectedAssignment(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowAssignmentDetails(false); // Close details first
                    setShowEditAssignment(true);
                  }}
                >
                  {selectedAssignment.assigned
                    ? "Change Teacher"
                    : "Assign Teacher"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* Edit Assignment Slide-in Menu */}
      <SlideInMenu
        isShow={showEditAssignment}
        onClose={() => {
          setShowEditAssignment(false);
          setSelectedTeacher("");
        }}
        width="700px"
      >
        {selectedAssignment && (
          <div className="edit-assignment-container">
            <div className="edit-assignment-header">
              <h3>
                {selectedAssignment.assigned
                  ? "Change Teacher"
                  : "Assign Teacher"}
              </h3>
              <p>
                {selectedAssignment.assigned
                  ? "Change teacher for"
                  : "Assign teacher to"}{" "}
                {selectedAssignment.subject} in {selectedAssignment.class}
              </p>
            </div>

            <div className="edit-assignment-content">
              {/* Current Assignment Info */}
              {selectedAssignment.teacher && (
                <div className="current-assignment-info">
                  <h4>Current Assignment:</h4>
                  <div className="current-teacher">
                    <img
                      src={selectedAssignment.teacher.img}
                      alt={selectedAssignment.teacher.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedAssignment.teacher.name
                        )}&background=6366f1&color=fff`;
                      }}
                    />
                    <div className="teacher-info">
                      <span className="teacher-name">
                        {selectedAssignment.teacher.name}
                      </span>
                      <span className="teacher-specialization">
                        {selectedAssignment.teacher.specialization}
                      </span>
                      <span className="assigned-date">
                        Assigned:{" "}
                        {new Date(
                          selectedAssignment.teacher.assignedDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Selection */}
              <div className="teacher-selection-section">
                <h4>
                  Select {selectedAssignment.assigned ? "New" : ""} Teacher:
                </h4>
                <SearchableSelect
                  options={availableTeachers}
                  value={selectedTeacher}
                  onChange={setSelectedTeacher}
                  placeholder="Search and select teacher..."
                  label="Teacher"
                  required={true}
                />

                {/* Warning for multiple assignments */}
                {selectedTeacher && hasMultipleAssignments(selectedTeacher) && (
                  <div className="multiple-assignment-warning">
                    <FaExclamationTriangle size={16} />
                    <span>
                      This teacher is already assigned to{" "}
                      {getTeacherAssignmentCount(selectedTeacher)} other
                      subject(s). Consider workload distribution.
                    </span>
                  </div>
                )}
              </div>

              {/* Subject Information */}
              <div className="subject-info-section">
                <h4>Subject Information:</h4>
                <div className="subject-info-grid">
                  <InfoField label="Class" value={selectedAssignment.class} />
                  <InfoField
                    label="Subject"
                    value={selectedAssignment.subject}
                  />
                </div>
              </div>
            </div>

            <div className="edit-assignment-footer">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditAssignment(false);
                  setSelectedTeacher("");
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssignmentChanges}
                disabled={!selectedTeacher || isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : selectedAssignment.assigned
                  ? "Change Teacher"
                  : "Assign Teacher"}
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default SubjectTeacher;
