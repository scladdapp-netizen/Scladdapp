import React, { useState } from "react";
import {
  FaArrowRight,
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaUser,
  FaSchool,
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import InfoField from "../../../../components/infoField/InfoField";
import "./ClassHeadmaster.css";

// Available staff members
const availableStaff = [
  {
    value: "staff001",
    label: "Mrs. Grace Okon",
    subtitle: "Mathematics Teacher",
  },
  { value: "staff002", label: "Mr. John Adebayo", subtitle: "English Teacher" },
  {
    value: "staff003",
    label: "Mrs. Fatima Hassan",
    subtitle: "Science Teacher",
  },
  {
    value: "staff004",
    label: "Mr. Emmanuel Okafor",
    subtitle: "History Teacher",
  },
  {
    value: "staff005",
    label: "Mrs. Aisha Bello",
    subtitle: "Chemistry Teacher",
  },
  { value: "staff006", label: "Mr. David Okoro", subtitle: "Physics Teacher" },
  { value: "staff007", label: "Mrs. Sarah Ahmed", subtitle: "Biology Teacher" },
  {
    value: "staff008",
    label: "Mr. Peter Nwankwo",
    subtitle: "Geography Teacher",
  },
];

const classData = [
  {
    id: 1,
    name: "JSS1 A",
    level: "Junior Secondary",
    students: 42,
    capacity: 45,
    headmaster: {
      id: "staff001",
      name: "Mrs. Grace Okon",
      img: "/images/grace.jpg",
      subject: "Mathematics",
      assignedDate: "2024-09-01",
    },
    assigned: true,
  },
  {
    id: 2,
    name: "JSS1 B",
    level: "Junior Secondary",
    students: 40,
    capacity: 45,
    headmaster: {
      id: "staff001", // Same staff assigned to multiple classes
      name: "Mrs. Grace Okon",
      img: "/images/grace.jpg",
      subject: "Mathematics",
      assignedDate: "2024-09-01",
    },
    assigned: true,
  },
  {
    id: 3,
    name: "SS3 Science",
    level: "Senior Secondary",
    students: 38,
    capacity: 40,
    headmaster: null,
    assigned: false,
  },
  {
    id: 4,
    name: "JSS2 A",
    level: "Junior Secondary",
    students: 35,
    capacity: 40,
    headmaster: {
      id: "staff002",
      name: "Mr. John Adebayo",
      img: "/images/john.jpg",
      subject: "English",
      assignedDate: "2024-08-15",
    },
    assigned: true,
  },
  {
    id: 5,
    name: "SS1 Arts",
    level: "Senior Secondary",
    students: 32,
    capacity: 35,
    headmaster: null,
    assigned: false,
  },
  {
    id: 6,
    name: "JSS3 B",
    level: "Junior Secondary",
    students: 38,
    capacity: 40,
    headmaster: {
      id: "staff003",
      name: "Mrs. Fatima Hassan",
      img: "/images/fatima.jpg",
      subject: "Science",
      assignedDate: "2024-09-10",
    },
    assigned: true,
  },
];

const ClassHeadmaster = () => {
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState(classData);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form states
  const [selectedStaff, setSelectedStaff] = useState("");

  // Check if staff is assigned to multiple classes
  const getStaffAssignmentCount = (staffId) => {
    return classes.filter(
      (cls) => cls.headmaster && cls.headmaster.id === staffId
    ).length;
  };

  // Check if staff has multiple assignments
  const hasMultipleAssignments = (staffId) => {
    return getStaffAssignmentCount(staffId) > 1;
  };

  // Handle action menu click
  const handleActionClick = (e, classItem) => {
    e.stopPropagation();
    setSelectedClass(classItem);
    setShowActionMenu(showActionMenu === classItem.id ? null : classItem.id);
  };

  // Handle view assignment details
  const handleViewDetails = (classItem) => {
    setSelectedClass(classItem);
    setShowAssignmentDetails(true);
    setShowActionMenu(null);
  };

  // Handle edit assignment
  const handleEditAssignment = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStaff(classItem.headmaster ? classItem.headmaster.id : "");
    setShowEditAssignment(true);
    setShowActionMenu(null);
  };

  // Handle assign new headmaster
  const handleAssignHeadmaster = (classItem) => {
    setSelectedClass(classItem);
    setSelectedStaff("");
    setShowEditAssignment(true);
    setShowActionMenu(null);
  };

  // Handle save assignment changes
  const handleSaveAssignmentChanges = async () => {
    if (selectedClass && selectedStaff) {
      setIsLoading(true);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const selectedStaffInfo = availableStaff.find(
          (staff) => staff.value === selectedStaff
        );

        const updatedClass = {
          ...selectedClass,
          headmaster: {
            id: selectedStaff,
            name: selectedStaffInfo.label,
            img: `/images/${selectedStaff}.jpg`,
            subject: selectedStaffInfo.subtitle.replace(" Teacher", ""),
            assignedDate: new Date().toISOString().split("T")[0],
          },
          assigned: true,
        };

        setClasses((prev) =>
          prev.map((cls) => (cls.id === selectedClass.id ? updatedClass : cls))
        );

        setSelectedClass(updatedClass);
        setShowEditAssignment(false);

        // Log assignment details
        console.log("Headmaster assignment updated:", {
          className: updatedClass.name,
          classLevel: updatedClass.level,
          headmasterName: selectedStaffInfo.label,
          headmasterId: selectedStaff,
          assignedDate: updatedClass.headmaster.assignedDate,
          multipleAssignments: hasMultipleAssignments(selectedStaff),
          timestamp: new Date().toISOString(),
        });

        // Reset form
        setSelectedStaff("");
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
    { label: "CLASS", accessor: "name", render: (v) => <b>{v}</b> },
    { label: "LEVEL", accessor: "level" },
    { label: "STUDENTS", accessor: "students" },
    { label: "CAPACITY", accessor: "capacity" },
    {
      label: "HEADMASTER",
      accessor: "headmaster",
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
        return <span style={{ color: "#d97706" }}>No headmaster assigned</span>;
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
                  Change Assignment
                </button>
              ) : (
                <button
                  className="action-option"
                  onClick={() => handleAssignHeadmaster(row)}
                >
                  <FaUser size={14} />
                  Assign Headmaster
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
    <div className="class-headmaster-container">
      <div className="spts">
        <h2>Classes & Headmasters</h2>
        <p>Manage class headmaster assignments and view assignment details</p>
      </div>

      <SmartTable
        columns={columns}
        data={classes}
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
        onClose={() => setShowAssignmentDetails(false)}
        width="600px"
      >
        {selectedClass && (
          <div className="assignment-details-container">
            <div className="assignment-details-header">
              <h3>Class Assignment Details</h3>
              <p>
                Created:{" "}
                {selectedClass.headmaster?.assignedDate || "Not assigned"}
              </p>
            </div>

            <div className="assignment-details-content">
              <div className="detail-section">
                <div className="detail-grid">
                  <InfoField label="Class Name" value={selectedClass.name} />
                  <InfoField label="Level" value={selectedClass.level} />
                  <InfoField
                    label="Students"
                    value={`${selectedClass.students}/${selectedClass.capacity}`}
                  />
                  {selectedClass.headmaster ? (
                    <>
                      <InfoField
                        label="Headmaster"
                        value={selectedClass.headmaster.name}
                      />
                      <InfoField
                        label="Subject"
                        value={selectedClass.headmaster.subject}
                      />
                      <InfoField
                        label="Assigned Date"
                        value={new Date(
                          selectedClass.headmaster.assignedDate
                        ).toLocaleDateString()}
                      />
                      {hasMultipleAssignments(selectedClass.headmaster.id) && (
                        <InfoField
                          label="Warning"
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
                              This staff is assigned to{" "}
                              {getStaffAssignmentCount(
                                selectedClass.headmaster.id
                              )}{" "}
                              classes
                            </span>
                          }
                        />
                      )}
                    </>
                  ) : (
                    <InfoField
                      label="Status"
                      value={
                        <span style={{ color: "#d97706" }}>
                          No headmaster assigned
                        </span>
                      }
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="assignment-details-footer">
              <div className="assignment-id">
                <small>Assignment ID: ASSIGN-{selectedClass.id}-2025</small>
              </div>
              <div className="footer-buttons">
                <Button
                  variant="secondary"
                  onClick={() => setShowAssignmentDetails(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowEditAssignment(true);
                  }}
                >
                  {selectedClass.assigned
                    ? "Change Assignment"
                    : "Assign Headmaster"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* Edit Assignment Slide-in Menu */}
      <SlideInMenu
        isShow={showEditAssignment}
        onClose={() => setShowEditAssignment(false)}
        width="700px"
      >
        {selectedClass && (
          <div className="edit-assignment-container">
            <div className="edit-assignment-header">
              <h3>
                {selectedClass.assigned
                  ? "Change Assignment"
                  : "Assign Headmaster"}
              </h3>
              <p>
                {selectedClass.assigned
                  ? "Change headmaster for"
                  : "Assign headmaster to"}{" "}
                {selectedClass.name}
              </p>
            </div>

            <div className="edit-assignment-content">
              {/* Current Assignment Info */}
              {selectedClass.headmaster && (
                <div className="current-assignment-info">
                  <h4>Current Assignment:</h4>
                  <div className="current-headmaster">
                    <img
                      src={selectedClass.headmaster.img}
                      alt={selectedClass.headmaster.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          selectedClass.headmaster.name
                        )}&background=6366f1&color=fff`;
                      }}
                    />
                    <div className="headmaster-info">
                      <span className="headmaster-name">
                        {selectedClass.headmaster.name}
                      </span>
                      <span className="headmaster-subject">
                        {selectedClass.headmaster.subject}
                      </span>
                      <span className="assigned-date">
                        Assigned:{" "}
                        {new Date(
                          selectedClass.headmaster.assignedDate
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff Selection */}
              <div className="staff-selection-section">
                <h4>
                  Select {selectedClass.assigned ? "New" : ""} Headmaster:
                </h4>
                <SearchableSelect
                  options={availableStaff}
                  value={selectedStaff}
                  onChange={setSelectedStaff}
                  placeholder="Search and select staff member..."
                  label="Staff Member"
                  required={true}
                />

                {/* Warning for multiple assignments */}
                {selectedStaff && hasMultipleAssignments(selectedStaff) && (
                  <div className="multiple-assignment-warning">
                    <FaExclamationTriangle size={16} />
                    <span>
                      This staff member is already assigned to{" "}
                      {getStaffAssignmentCount(selectedStaff)} other class(es).
                      Consider workload distribution.
                    </span>
                  </div>
                )}
              </div>

              {/* Class Information */}
              <div className="class-info-section">
                <h4>Class Information:</h4>
                <div className="class-info-grid">
                  <div className="info-item">
                    <label>Class:</label>
                    <span>{selectedClass.name}</span>
                  </div>
                  <div className="info-item">
                    <label>Level:</label>
                    <span>{selectedClass.level}</span>
                  </div>
                  <div className="info-item">
                    <label>Students:</label>
                    <span>
                      {selectedClass.students}/{selectedClass.capacity}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="edit-assignment-footer">
              <Button
                variant="secondary"
                onClick={() => setShowEditAssignment(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssignmentChanges}
                disabled={!selectedStaff || isLoading}
              >
                {isLoading
                  ? "Saving..."
                  : selectedClass.assigned
                  ? "Change Assignment"
                  : "Assign Headmaster"}
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default ClassHeadmaster;
