import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SmartTable from "../../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import SearchableSelect from "../../../../../components/SearchableSelect/SearchableSelect";
import Button from "../../../../../components/Button/Button";
import { FaArrowRight, FaUser, FaGraduationCap } from "react-icons/fa";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import "./Teachers.css";

const Teachers = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const [showAddTeacherMenu, setShowAddTeacherMenu] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    qualification: "",
    experience: "",
    specialization: "",
    joiningDate: "",
    employeeId: "",
    department: "",
    role: "Assistant Teacher",
    teachingLoad: "",
    assignedStaff: [],
    subjects: [],
  });

  // Sample staff data for assignment
  const availableStaff = [
    {
      id: "STF001",
      name: "John Smith",
      email: "john.smith@school.edu",
      phone: "+234 801 111 2222",
      qualification: "M.Sc Mathematics, B.Ed",
      department: "Science Department",
      currentRole: "Administrative Staff",
      experience: "5 years",
      photo: "/images/john.jpg",
    },
    {
      id: "STF002",
      name: "Emily Johnson",
      email: "emily.johnson@school.edu",
      phone: "+234 802 333 4444",
      qualification: "B.A English Literature, PGDE",
      department: "Languages Department",
      currentRole: "Library Assistant",
      experience: "3 years",
      photo: "/images/emily.jpg",
    },
    {
      id: "STF003",
      name: "Michael Davis",
      email: "michael.davis@school.edu",
      phone: "+234 803 555 6666",
      qualification: "B.Sc Computer Science",
      department: "Technology Department",
      currentRole: "IT Support",
      experience: "7 years",
      photo: "/images/michael.jpg",
    },
    {
      id: "STF004",
      name: "Sarah Wilson",
      email: "sarah.wilson@school.edu",
      phone: "+234 804 777 8888",
      qualification: "B.Sc Chemistry, B.Ed",
      department: "Science Department",
      currentRole: "Lab Assistant",
      experience: "4 years",
      photo: "/images/sarah.jpg",
    },
  ];

  // Sample subjects and classes for assignment
  const availableSubjects = [
    { id: "MATH", name: "Mathematics" },
    { id: "ENG", name: "English Language" },
    { id: "PHY", name: "Physics" },
    { id: "CHEM", name: "Chemistry" },
    { id: "BIO", name: "Biology" },
    { id: "HIST", name: "History" },
    { id: "GEO", name: "Geography" },
    { id: "CS", name: "Computer Science" },
    { id: "FRENCH", name: "French" },
    { id: "LIT", name: "Literature" },
  ];

  const availableClasses = [
    { id: "CLS001", name: "Grade 9A" },
    { id: "CLS002", name: "Grade 9B" },
    { id: "CLS003", name: "Grade 10A" },
    { id: "CLS004", name: "Grade 10B" },
    { id: "CLS005", name: "Grade 11A" },
    { id: "CLS006", name: "Grade 11B" },
    { id: "CLS007", name: "Grade 12A" },
    { id: "CLS008", name: "Grade 12B" },
  ];

  // Enhanced teachers data with more comprehensive information
  const teachersData = [
    {
      teacherId: "TCH001",
      photo: "/images/sarah.jpg",
      name: "Mrs. Sarah Johnson",
      email: "sarah.johnson@school.edu",
      phone: "+234 801 234 5678",
      subjects: ["Mathematics", "Physics"],
      classes: ["Grade 10A", "Grade 11A"],
      department: "Science Department",
      qualification: "M.Sc Mathematics, B.Ed",
      experience: "8 years",
      joiningDate: "2018-08-15",
      status: "Active",
      rating: 4.8,
      totalStudents: 58,
      role: "Head Teacher",
    },
    {
      teacherId: "TCH002",
      photo: "/images/david.jpg",
      name: "Mr. David Wilson",
      email: "david.wilson@school.edu",
      phone: "+234 802 345 6789",
      subjects: ["Chemistry", "Biology"],
      classes: ["Grade 10B", "Grade 11B"],
      department: "Science Department",
      qualification: "B.Sc Chemistry, PGDE",
      experience: "12 years",
      joiningDate: "2016-03-10",
      status: "Active",
      rating: 4.6,
      totalStudents: 49,
      role: "Senior Teacher",
    },
    {
      teacherId: "TCH003",
      photo: "/images/michael.jpg",
      name: "Dr. Michael Brown",
      email: "michael.brown@school.edu",
      phone: "+234 803 456 7890",
      subjects: ["English", "Literature"],
      classes: ["Grade 9A", "Grade 10A"],
      department: "Languages Department",
      qualification: "Ph.D English Literature",
      experience: "15 years",
      joiningDate: "2014-09-01",
      status: "Active",
      rating: 4.9,
      totalStudents: 52,
      role: "Head Teacher",
    },
    {
      teacherId: "TCH004",
      photo: "/images/lisa.jpg",
      name: "Ms. Lisa Anderson",
      email: "lisa.anderson@school.edu",
      phone: "+234 804 567 8901",
      subjects: ["History", "Geography"],
      classes: ["Grade 9B", "Grade 10B"],
      department: "Social Studies Department",
      qualification: "B.A History, B.Ed",
      experience: "6 years",
      joiningDate: "2021-01-15",
      status: "On Leave",
      rating: 4.4,
      totalStudents: 45,
      role: "Assistant Teacher",
    },
    {
      teacherId: "TCH005",
      photo: "/images/robert.jpg",
      name: "Mr. Robert Davis",
      email: "robert.davis@school.edu",
      phone: "+234 805 678 9012",
      subjects: ["Computer Science", "ICT"],
      classes: ["Grade 11A", "Grade 12A"],
      department: "Technology Department",
      qualification: "B.Sc Computer Science",
      experience: "10 years",
      joiningDate: "2019-07-01",
      status: "Active",
      rating: 4.7,
      totalStudents: 38,
      role: "Senior Teacher",
    },
    {
      teacherId: "TCH006",
      photo: "/images/maria.jpg",
      name: "Mrs. Maria Martinez",
      email: "maria.martinez@school.edu",
      phone: "+234 806 789 0123",
      subjects: ["French", "Spanish"],
      classes: ["Grade 10A", "Grade 11B"],
      department: "Languages Department",
      qualification: "B.A Modern Languages",
      experience: "7 years",
      joiningDate: "2020-02-15",
      status: "Active",
      rating: 4.5,
      totalStudents: 41,
      role: "Senior Teacher",
    },
  ];

  // Updated columns matching Students component structure
  const columns = [
    {
      label: "ID",
      accessor: "teacherId",
    },
    {
      label: "Photo",
      accessor: "photo",
      render: (v, row) => (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          {v ? (
            <img
              src={v}
              alt={row.name}
              style={{ width: 28, height: 28, borderRadius: "50%" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="teacher-photo-fallback"
            style={{
              display: v ? "none" : "flex",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {row.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
        </div>
      ),
    },
    {
      label: "Name",
      accessor: "name",
      render: (v) => <b>{v}</b>,
    },
    {
      label: "Email",
      accessor: "email",
      render: (v) => (
        <span style={{ fontSize: "13px", color: "#6b7280" }}>{v}</span>
      ),
    },
    {
      label: "Phone",
      accessor: "phone",
      render: (v) => (
        <span style={{ fontSize: "13px", color: "#6b7280" }}>{v}</span>
      ),
    },
    {
      label: "Department",
      accessor: "department",
      render: (v) => <span style={{ fontSize: "13px" }}>{v}</span>,
    },
    {
      label: "Experience",
      accessor: "experience",
      render: (v) => <span style={{ fontSize: "13px" }}>{v}</span>,
    },
    {
      label: "Status",
      accessor: "status",
      render: (value) => (
        <span
          className={`status-badge ${value.toLowerCase().replace(" ", "-")}`}
          style={{
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "500",
            backgroundColor: value === "Active" ? "#dcfce7" : "#fef3c7",
            color: value === "Active" ? "#166534" : "#92400e",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      label: "Actions",
      accessor: "actions",
      searchable: false,
      render: (val, row) => (
        <span
          className="action-link"
          style={{ color: "#5bba4aff", cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            handleViewTeacher(row);
          }}
        >
          View <FaArrowRight size={12} />
        </span>
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
    setShowAddTeacherMenu(true);
  };

  const handleCreateTeacher = () => {
    // Validate required fields
    if (
      !teacherForm.firstName ||
      !teacherForm.lastName ||
      !teacherForm.email ||
      !teacherForm.phone
    ) {
      addNotification("Please fill in all required fields", "error");
      return;
    }

    if (teacherForm.subjects.length === 0) {
      addNotification("Please assign at least one subject", "error");
      return;
    }

    // Generate teacher ID
    const generatedId = `TCH${String(Date.now()).slice(-6)}`;

    // Create new teacher
    const newTeacher = {
      teacherId: generatedId,
      name: `${teacherForm.firstName} ${teacherForm.lastName}`,
      email: teacherForm.email,
      phone: teacherForm.phone,
      photo: null,
      subjects: teacherForm.subjects.map((s) => s.name),
      assignedStaff: teacherForm.assignedStaff.map((s) => s.name),
      department: teacherForm.department,
      qualification: teacherForm.qualification,
      experience: teacherForm.experience
        ? `${teacherForm.experience} years`
        : "",
      role: teacherForm.role,
      specialization: teacherForm.specialization,
      teachingLoad: teacherForm.teachingLoad,
      status: "Active",
      joiningDate:
        teacherForm.joiningDate || new Date().toISOString().split("T")[0],
      dateOfBirth: teacherForm.dateOfBirth,
      gender: teacherForm.gender,
      address: teacherForm.address,
      employeeId: teacherForm.employeeId,
      rating: 0,
      totalStudents: 0,
    };

    // Simulate API call
    setTimeout(() => {
      addNotification(
        `${teacherForm.firstName} ${teacherForm.lastName} has been successfully created as a teacher!`,
        "success"
      );

      // Reset form
      setShowAddTeacherMenu(false);
      setTeacherForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        qualification: "",
        experience: "",
        specialization: "",
        joiningDate: "",
        employeeId: "",
        department: "",
        role: "Assistant Teacher",
        teachingLoad: "",
        assignedStaff: [],
        subjects: [],
      });
    }, 1000);
  };

  const handleStaffSelect = (staff) => {
    if (!teacherForm.assignedStaff.find((s) => s.id === staff.id)) {
      setTeacherForm((prev) => ({
        ...prev,
        assignedStaff: [...prev.assignedStaff, staff],
      }));
    }
  };

  const handleSubjectSelect = (subject) => {
    if (!teacherForm.subjects.find((s) => s.id === subject.id)) {
      setTeacherForm((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subject],
      }));
    }
  };

  const removeStaff = (staffId) => {
    setTeacherForm((prev) => ({
      ...prev,
      assignedStaff: prev.assignedStaff.filter((s) => s.id !== staffId),
    }));
  };

  const removeSubject = (subjectId) => {
    setTeacherForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
    }));
  };

  const handleFormChange = (field) => (value) => {
    setTeacherForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClick = (r) => {
    navigate(`/admin/${schoolId}/teachers/${r.teacherId}`);
  };

  const handleViewTeacher = (teacher) => {
    navigate(`/admin/${schoolId}/teachers/${teacher.teacherId}`);
  };

  return (
    <div>
      <div className="spts">
        <h2>Teachers</h2>
        <p className="subtitle">
          All teaching staff with their subjects, departments, and contact
          information
        </p>
      </div>
      <SmartTable
        columns={columns}
        data={teachersData}
        onRowClick={handleClick}
        enableSelect={true}
        onSelectChange={(ids) => console.log("selected changed", ids)}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        onCreate={handleCreate}
        maxRowsPerPage={15}
        showcreatbut={true}
        creattext="Add Teacher"
      />

      {/* Add Teacher SlideInMenu */}
      <SlideInMenu
        isShow={showAddTeacherMenu}
        onClose={() => {
          setShowAddTeacherMenu(false);
          setAssignmentMethod("");
          setCurrentStep(1);
          setSelectedStaff(null);
          setTeacherInfo({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            dateOfBirth: "",
            gender: "",
            address: "",
            employeeId: "",
            qualification: "",
            experience: "",
            specialization: "",
            joiningDate: "",
          });
          setNewTeacherForm({
            staffId: "",
            subjects: [],
            classes: [],
            department: "",
            role: "Assistant Teacher",
            specialization: "",
            teachingLoad: "",
          });
        }}
        width="700px"
      >
        <div className="add-teacher-container" style={{ padding: "24px" }}>
          <div className="add-teacher-header">
            <h2>Create New Teacher</h2>
            <div
              className="step-indicator"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "40px",
                margin: "20px 0",
              }}
            >
              <div
                className={`step ${currentStep >= 1 ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: currentStep >= 1 ? "#3b82f6" : "#e5e7eb",
                    color: currentStep >= 1 ? "white" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    marginBottom: "5px",
                  }}
                >
                  1
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: currentStep >= 1 ? "#3b82f6" : "#6b7280",
                    fontWeight: "500",
                  }}
                >
                  Personal Info
                </span>
              </div>
              <div
                className={`step ${currentStep >= 2 ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: currentStep >= 2 ? "#3b82f6" : "#e5e7eb",
                    color: currentStep >= 2 ? "white" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    marginBottom: "5px",
                  }}
                >
                  2
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: currentStep >= 2 ? "#3b82f6" : "#6b7280",
                    fontWeight: "500",
                  }}
                >
                  Professional Info
                </span>
              </div>
              <div
                className={`step ${currentStep >= 3 ? "active" : ""}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: currentStep >= 3 ? "#3b82f6" : "#e5e7eb",
                    color: currentStep >= 3 ? "white" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                    marginBottom: "5px",
                  }}
                >
                  3
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: currentStep >= 3 ? "#3b82f6" : "#6b7280",
                    fontWeight: "500",
                  }}
                >
                  Staff & Subjects
                </span>
              </div>
            </div>
          </div>

          <div
            className="step-content"
            style={{ minHeight: "400px", marginBottom: "30px" }}
          >
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div>
                <h3
                  style={{
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Personal Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <FormInput
                    label="First Name *"
                    value={teacherInfo.firstName}
                    onChange={handleTeacherInfoChange("firstName")}
                    placeholder="Enter first name"
                  />
                  <FormInput
                    label="Last Name *"
                    value={teacherInfo.lastName}
                    onChange={handleTeacherInfoChange("lastName")}
                    placeholder="Enter last name"
                  />
                  <FormInput
                    label="Email Address *"
                    type="email"
                    value={teacherInfo.email}
                    onChange={handleTeacherInfoChange("email")}
                    placeholder="Enter email address"
                  />
                  <FormInput
                    label="Phone Number *"
                    value={teacherInfo.phone}
                    onChange={handleTeacherInfoChange("phone")}
                    placeholder="Enter phone number"
                  />
                  <FormInput
                    label="Date of Birth"
                    type="date"
                    value={teacherInfo.dateOfBirth}
                    onChange={handleTeacherInfoChange("dateOfBirth")}
                  />
                  <FormInput
                    label="Gender"
                    type="select"
                    value={teacherInfo.gender}
                    onChange={handleTeacherInfoChange("gender")}
                    options={[
                      { value: "", label: "Select Gender" },
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </div>
                <FormInput
                  label="Address"
                  value={teacherInfo.address}
                  onChange={handleTeacherInfoChange("address")}
                  placeholder="Enter full address"
                />
              </div>
            )}

            {/* Step 2: Professional Information */}
            {currentStep === 2 && (
              <div>
                <h3
                  style={{
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Professional Information
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "20px",
                    marginBottom: "20px",
                  }}
                >
                  <FormInput
                    label="Employee ID *"
                    value={teacherInfo.employeeId}
                    onChange={handleTeacherInfoChange("employeeId")}
                    placeholder="Enter employee ID"
                  />
                  <FormInput
                    label="Qualification *"
                    value={teacherInfo.qualification}
                    onChange={handleTeacherInfoChange("qualification")}
                    placeholder="e.g., B.Ed, M.A, Ph.D"
                  />
                  <FormInput
                    label="Years of Experience"
                    type="number"
                    value={teacherInfo.experience}
                    onChange={handleTeacherInfoChange("experience")}
                    placeholder="Enter years of experience"
                  />
                  <FormInput
                    label="Specialization"
                    value={teacherInfo.specialization}
                    onChange={handleTeacherInfoChange("specialization")}
                    placeholder="e.g., Mathematics, Science, English"
                  />
                  <FormInput
                    label="Joining Date *"
                    type="date"
                    value={teacherInfo.joiningDate}
                    onChange={handleTeacherInfoChange("joiningDate")}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Staff Assignment & Subjects */}
            {currentStep === 3 && (
              <div>
                <h3
                  style={{
                    color: "#1f2937",
                    fontSize: "20px",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Staff Assignment & Subjects
                </h3>

                {/* Staff Selection */}
                <div
                  className="staff-selection"
                  style={{ marginBottom: "24px" }}
                >
                  <SearchableSelect
                    label="Select Staff Member *"
                    subtitle="Choose from available staff"
                    data={availableStaff}
                    onSelect={handleStaffSelect}
                    displayKey="name"
                    searchKeys={["name", "email", "department", "currentRole"]}
                    placeholder="Search staff by name, email, or department..."
                    renderItem={(staff) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, #4f46e5, #7c3aed)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", color: "#1f2937" }}>
                            {staff.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6b7280" }}>
                            {staff.currentRole} • {staff.department}
                          </div>
                          <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                            {staff.qualification}
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {selectedStaff && (
                  <div
                    style={{
                      marginBottom: "24px",
                      padding: "16px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 12px 0", color: "#166534" }}>
                      Selected Staff Member
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          Name:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            marginLeft: "8px",
                            fontWeight: "600",
                          }}
                        >
                          {selectedStaff.name}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          Current Role:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            marginLeft: "8px",
                          }}
                        >
                          {selectedStaff.currentRole}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          Department:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            marginLeft: "8px",
                          }}
                        >
                          {selectedStaff.department}
                        </span>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            fontWeight: "500",
                          }}
                        >
                          Experience:
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#1f2937",
                            marginLeft: "8px",
                          }}
                        >
                          {selectedStaff.experience}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStaff && (
                  <div>
                    {/* Subject Assignment */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4
                        style={{
                          margin: "0 0 16px 0",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                          paddingBottom: "8px",
                        }}
                      >
                        Subject Assignment
                      </h4>
                      <SearchableSelect
                        label="Assign Subjects *"
                        subtitle="Select subjects this teacher will teach"
                        data={availableSubjects}
                        onSelect={handleSubjectSelect}
                        displayKey="name"
                        searchKeys={["name"]}
                        placeholder="Search and select subjects..."
                        renderItem={(subject) => (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <FaGraduationCap color="#4f46e5" size={16} />
                            <div
                              style={{ fontWeight: "600", color: "#1f2937" }}
                            >
                              {subject.name}
                            </div>
                          </div>
                        )}
                      />
                      {newTeacherForm.subjects.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontWeight: "500",
                            }}
                          >
                            Assigned Subjects:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            {newTeacherForm.subjects.map((subject) => (
                              <span
                                key={subject.id}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#dbeafe",
                                  color: "#1e40af",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {subject.name}
                                <button
                                  onClick={() => removeSubject(subject.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1e40af",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "0",
                                    marginLeft: "4px",
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Class Assignment */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4
                        style={{
                          margin: "0 0 16px 0",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                          paddingBottom: "8px",
                        }}
                      >
                        Class Assignment
                      </h4>
                      <SearchableSelect
                        label="Assign Classes"
                        subtitle="Select classes this teacher will handle"
                        data={availableClasses}
                        onSelect={handleClassSelect}
                        displayKey="name"
                        searchKeys={["name"]}
                        placeholder="Search and select classes..."
                        renderItem={(classItem) => (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "4px",
                                backgroundColor: "#4f46e5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: "bold",
                              }}
                            >
                              {classItem.name.split(" ")[1] ||
                                classItem.name.charAt(0)}
                            </div>
                            <div
                              style={{ fontWeight: "600", color: "#1f2937" }}
                            >
                              {classItem.name}
                            </div>
                          </div>
                        )}
                      />
                      {newTeacherForm.classes.length > 0 && (
                        <div style={{ marginTop: "12px" }}>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#6b7280",
                              fontWeight: "500",
                            }}
                          >
                            Assigned Classes:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginTop: "8px",
                            }}
                          >
                            {newTeacherForm.classes.map((classItem) => (
                              <span
                                key={classItem.id}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                  borderRadius: "12px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                {classItem.name}
                                <button
                                  onClick={() => removeClass(classItem.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#166534",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    padding: "0",
                                    marginLeft: "4px",
                                  }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Teaching Details */}
                    <div style={{ marginBottom: "24px" }}>
                      <h4
                        style={{
                          margin: "0 0 16px 0",
                          color: "#374151",
                          borderBottom: "1px solid #e5e7eb",
                          paddingBottom: "8px",
                        }}
                      >
                        Teaching Details
                      </h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "16px",
                        }}
                      >
                        <FormInput
                          label="Teacher Role"
                          type="select"
                          value={newTeacherForm.role}
                          onChange={handleFormChange("role")}
                          options={[
                            {
                              value: "Assistant Teacher",
                              label: "Assistant Teacher",
                            },
                            {
                              value: "Senior Teacher",
                              label: "Senior Teacher",
                            },
                            { value: "Head Teacher", label: "Head Teacher" },
                            {
                              value: "Subject Coordinator",
                              label: "Subject Coordinator",
                            },
                          ]}
                        />
                        <FormInput
                          label="Teaching Load"
                          value={newTeacherForm.teachingLoad}
                          onChange={handleFormChange("teachingLoad")}
                          placeholder="e.g., 20 hours per week"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {currentStep > 1 && (
                <Button variant="secondary" onClick={handlePreviousStep}>
                  Previous
                </Button>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginLeft: currentStep === 1 ? "auto" : "0",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowAddTeacherMenu(false)}
                >
                  Cancel
                </Button>

                {currentStep < 3 ? (
                  <Button
                    variant="primary"
                    onClick={handleNextStep}
                    disabled={!isStepValid()}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleAssignStaff}
                    disabled={!isStepValid()}
                    style={{
                      backgroundColor: "#10b981",
                      borderColor: "#10b981",
                    }}
                  >
                    Create Teacher
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default Teachers;
