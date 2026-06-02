import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SmartTable from "../../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import {
  FaArrowRight,
  FaTimes,
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUser,
  FaBriefcase,
  FaEdit,
} from "react-icons/fa";
import "./Parents.css";

const Parents = () => {
  const { schoolId } = useParams();
  const [selectedParent, setSelectedParent] = useState(null);
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false);

  // Enhanced parents data with comprehensive information
  const parentsData = [
    {
      parentId: "PAR001",
      photo: "/images/james.jpg",
      name: "Mr. James Smith",
      email: "james.smith@email.com",
      phone: "+234 801 234 5678",
      alternatePhone: "+234 802 345 6789",
      relationship: "Father",
      studentName: "John Smith",
      studentId: "STU001",
      studentClass: "Grade 10A",
      occupation: "Software Engineer",
      workplace: "Tech Solutions Ltd",
      address: "15 Victoria Island, Lagos",
      emergencyContact: "Mrs. Jane Smith",
      emergencyPhone: "+234 803 456 7890",
      status: "Active",
      registrationDate: "2023-09-01",
      lastContact: "2024-01-05",
    },
    {
      parentId: "PAR002",
      photo: "/images/mary.jpg",
      name: "Mrs. Mary Johnson",
      email: "mary.johnson@email.com",
      phone: "+234 804 567 8901",
      alternatePhone: "+234 805 678 9012",
      relationship: "Mother",
      studentName: "Emma Johnson",
      studentId: "STU002",
      studentClass: "Grade 10A",
      occupation: "Medical Doctor",
      workplace: "Lagos University Teaching Hospital",
      address: "22 Ikoyi Crescent, Lagos",
      emergencyContact: "Dr. Peter Johnson",
      emergencyPhone: "+234 806 789 0123",
      status: "Active",
      registrationDate: "2023-09-01",
      lastContact: "2024-01-03",
    },
    {
      parentId: "PAR003",
      photo: "/images/david.jpg",
      name: "Mr. David Brown",
      email: "david.brown@email.com",
      phone: "+234 807 890 1234",
      alternatePhone: "+234 808 901 2345",
      relationship: "Father",
      studentName: "Michael Brown",
      studentId: "STU003",
      studentClass: "Grade 10B",
      occupation: "Secondary School Teacher",
      workplace: "Government College Lagos",
      address: "8 Surulere Street, Lagos",
      emergencyContact: "Mrs. Linda Brown",
      emergencyPhone: "+234 809 012 3456",
      status: "Active",
      registrationDate: "2023-09-01",
      lastContact: "2024-01-04",
    },
    {
      parentId: "PAR004",
      photo: "/images/susan.jpg",
      name: "Mrs. Susan Davis",
      email: "susan.davis@email.com",
      phone: "+234 810 123 4567",
      alternatePhone: "+234 811 234 5678",
      relationship: "Mother",
      studentName: "Sarah Davis",
      studentId: "STU004",
      studentClass: "Grade 10B",
      occupation: "Registered Nurse",
      workplace: "General Hospital Lagos",
      address: "12 Mainland Avenue, Lagos",
      emergencyContact: "Mr. Robert Davis",
      emergencyPhone: "+234 812 345 6789",
      status: "Inactive",
      registrationDate: "2023-09-01",
      lastContact: "2023-12-15",
    },
    {
      parentId: "PAR005",
      photo: "/images/robert.jpg",
      name: "Mr. Robert Wilson",
      email: "robert.wilson@email.com",
      phone: "+234 813 456 7890",
      alternatePhone: "+234 814 567 8901",
      relationship: "Father",
      studentName: "Lisa Wilson",
      studentId: "STU005",
      studentClass: "Grade 11A",
      occupation: "Business Owner",
      workplace: "Wilson Trading Company",
      address: "5 Ikeja GRA, Lagos",
      emergencyContact: "Mrs. Grace Wilson",
      emergencyPhone: "+234 815 678 9012",
      status: "Active",
      registrationDate: "2022-09-01",
      lastContact: "2024-01-06",
    },
    {
      parentId: "PAR006",
      photo: "/images/maria.jpg",
      name: "Mrs. Maria Garcia",
      email: "maria.garcia@email.com",
      phone: "+234 816 789 0123",
      alternatePhone: "+234 817 890 1234",
      relationship: "Mother",
      studentName: "Carlos Garcia",
      studentId: "STU006",
      studentClass: "Grade 11A",
      occupation: "Accountant",
      workplace: "Garcia & Associates",
      address: "18 Lekki Phase 1, Lagos",
      emergencyContact: "Mr. Carlos Garcia Sr.",
      emergencyPhone: "+234 818 901 2345",
      status: "Active",
      registrationDate: "2022-09-01",
      lastContact: "2024-01-02",
    },
  ];

  // Updated columns matching other school directory components
  const columns = [
    {
      label: "ID",
      accessor: "parentId",
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
            className="parent-photo-fallback"
            style={{
              display: v ? "none" : "flex",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
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
      label: "Student",
      accessor: "studentName",
      render: (value, row) => (
        <div style={{ fontSize: "13px" }}>
          <div style={{ fontWeight: "500" }}>{value}</div>
          <div style={{ color: "#6b7280", fontSize: "12px" }}>
            {row.studentClass}
          </div>
        </div>
      ),
    },
    {
      label: "Relationship",
      accessor: "relationship",
      render: (v) => (
        <span
          className={`relationship-badge ${v.toLowerCase()}`}
          style={{
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "500",
            backgroundColor: v === "Father" ? "#dbeafe" : "#fce7f3",
            color: v === "Father" ? "#1e40af" : "#be185d",
          }}
        >
          {v}
        </span>
      ),
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
            backgroundColor: value === "Active" ? "#dcfce7" : "#fee2e2",
            color: value === "Active" ? "#166534" : "#991b1b",
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
            handleViewParent(row);
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
    console.log("Add parent pressed");
    handleAddParent();
  };

  const handleAddParent = () => {
    console.log("Add Parent button clicked");
    // Handle add parent functionality
  };

  const handleClick = (r) => {
    setSelectedParent(r);
    setIsSlideMenuOpen(true);
  };

  const handleViewParent = (parent) => {
    setSelectedParent(parent);
    setIsSlideMenuOpen(true);
  };

  const handleCloseSlideMenu = () => {
    setIsSlideMenuOpen(false);
    setSelectedParent(null);
  };

  const handleWhatsAppChat = (parent) => {
    // Format phone number for WhatsApp (remove spaces, dashes, and add country code if needed)
    const phoneNumber = parent.phone.replace(/\s+/g, "").replace(/-/g, "");
    const message = `Hello ${parent.name}, this is from ${parent.studentName}'s school. How can we assist you today?`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleEmailSend = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleEdit = (parent) => {
    console.log("Edit parent:", parent);
    // Handle edit functionality - could open a modal or navigate to edit page
  };

  return (
    <div>
      <div className="spts">
        <h2>Parents</h2>
        <p className="subtitle">
          All parent and guardian information with their contact details and
          associated students
        </p>
      </div>
      <SmartTable
        columns={columns}
        data={parentsData}
        onRowClick={handleClick}
        enableSelect={true}
        onSelectChange={(ids) => console.log("selected changed", ids)}
        onBulkDelete={handleBulkDelete}
        onExport={handleExport}
        onCreate={handleCreate}
        maxRowsPerPage={15}
        showcreatbut={true}
        creattext="Add Parent"
      />

      {/* Parent Details Slide Menu */}
      <SlideInMenu
        isShow={isSlideMenuOpen}
        onClose={handleCloseSlideMenu}
        position="rightt"
        width="500px"
      >
        {selectedParent && (
          <div className="parent-details-container">
            {/* Header */}
            <div className="parent-details-header">
              <button className="close-button" onClick={handleCloseSlideMenu}>
                <FaTimes size={20} />
              </button>
              <div className="parent-header-info">
                <div className="parent-photo-large">
                  {selectedParent.photo ? (
                    <img
                      src={selectedParent.photo}
                      alt={selectedParent.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="parent-photo-fallback-large"
                    style={{
                      display: selectedParent.photo ? "none" : "flex",
                    }}
                  >
                    {selectedParent.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </div>
                </div>
                <div className="parent-header-text">
                  <h2>{selectedParent.name}</h2>
                  <p className="parent-id">ID: {selectedParent.parentId}</p>
                  <span
                    className={`relationship-badge ${selectedParent.relationship.toLowerCase()}`}
                  >
                    {selectedParent.relationship}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="contact-actions">
              <button
                className="whatsapp-btn"
                onClick={() => handleWhatsAppChat(selectedParent)}
              >
                <FaWhatsapp size={18} />
                Chat on WhatsApp
              </button>
              <div className="small-actions">
                <button
                  className="email-btn-small"
                  onClick={() => handleEmailSend(selectedParent.email)}
                  title="Send Email"
                >
                  <FaEnvelope size={16} />
                </button>
                <button
                  className="edit-btn-small"
                  onClick={() => handleEdit(selectedParent)}
                  title="Edit Parent"
                >
                  <FaEdit size={16} />
                </button>
              </div>
            </div>

            {/* Details Sections */}
            <div className="parent-details-content">
              {/* Student Information */}
              <div className="detail-section">
                <h3>
                  <FaUser size={16} /> Student Information
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Student Name:</span>
                    <span className="detail-value">
                      {selectedParent.studentName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Student ID:</span>
                    <span className="detail-value">
                      {selectedParent.studentId}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Class:</span>
                    <span className="detail-value">
                      {selectedParent.studentClass}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="detail-section">
                <h3>
                  <FaEnvelope size={16} /> Contact Information
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Primary Phone:</span>
                    <span className="detail-value">{selectedParent.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Alternate Phone:</span>
                    <span className="detail-value">
                      {selectedParent.alternatePhone}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedParent.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">
                      {selectedParent.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="detail-section">
                <h3>
                  <FaBriefcase size={16} /> Professional Information
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Occupation:</span>
                    <span className="detail-value">
                      {selectedParent.occupation}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Workplace:</span>
                    <span className="detail-value">
                      {selectedParent.workplace}
                    </span>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="detail-section">
                <h3>
                  <FaMapMarkerAlt size={16} /> Emergency Contact
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Emergency Contact:</span>
                    <span className="detail-value">
                      {selectedParent.emergencyContact}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Emergency Phone:</span>
                    <span className="detail-value">
                      {selectedParent.emergencyPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="detail-section">
                <h3>
                  <FaUser size={16} /> Account Information
                </h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span
                      className={`status-badge ${selectedParent.status.toLowerCase()}`}
                    >
                      {selectedParent.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Registration Date:</span>
                    <span className="detail-value">
                      {selectedParent.registrationDate}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Contact:</span>
                    <span className="detail-value">
                      {selectedParent.lastContact}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default Parents;
