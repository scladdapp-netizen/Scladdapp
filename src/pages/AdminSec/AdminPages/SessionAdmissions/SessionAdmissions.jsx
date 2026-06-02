import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FaEye, FaUserPlus, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import InfoField from "../../../../components/infoField/InfoField";
import "./SessionAdmissions.css";

const SessionAdmissions = () => {
  const { seasionId } = useParams();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);

  // Demo data - replace with API call
  const demoAdmissions = [
    {
      admission_id: "ADM001",
      student_name: "John Doe",
      student_id: "STU001",
      admitted_date: "2026-01-15",
      admission_class: "Grade 10A",
      admission_session: "2025/2026",
      admission_term: "First Term",
      admission_type: "new",
      active_status: true,
      previous_school: null,
      remarks: "Excellent academic record",
    },
    {
      admission_id: "ADM002",
      student_name: "Jane Smith",
      student_id: "STU002",
      admitted_date: "2026-01-20",
      admission_class: "Grade 9B",
      admission_session: "2025/2026",
      admission_term: "First Term",
      admission_type: "transfer",
      active_status: true,
      previous_school: "ABC High School",
      remarks: "Transfer from another school",
    },
    {
      admission_id: "ADM003",
      student_name: "Michael Johnson",
      student_id: "STU003",
      admitted_date: "2026-02-01",
      admission_class: "Grade 11A",
      admission_session: "2025/2026",
      admission_term: "Second Term",
      admission_type: "new",
      active_status: false,
      previous_school: null,
      remarks: "Admission cancelled",
      close_date: "2026-02-10",
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setAdmissions(demoAdmissions);
      setLoading(false);
    }, 500);
  }, [seasionId]);

  const columns = [
    {
      label: "Admission ID",
      accessor: "admission_id",
      render: (v) => <span className="sa-admission-id">{v}</span>,
    },
    {
      label: "Student Name",
      accessor: "student_name",
      render: (v) => <strong>{v}</strong>,
    },
    {
      label: "Student ID",
      accessor: "student_id",
    },
    {
      label: "Admitted Date",
      accessor: "admitted_date",
      render: (v) => new Date(v).toLocaleDateString(),
    },
    {
      label: "Class",
      accessor: "admission_class",
    },
    {
      label: "Term",
      accessor: "admission_term",
    },
    {
      label: "Type",
      accessor: "admission_type",
      render: (v) => (
        <span className={`sa-type-badge ${v}`}>
          {v === "new" ? "New" : "Transfer"}
        </span>
      ),
    },
    {
      label: "Status",
      accessor: "active_status",
      render: (v) => (
        <span className={`sa-status-badge ${v ? "active" : "inactive"}`}>
          {v ? (
            <>
              <FaCheckCircle /> Active
            </>
          ) : (
            <>
              <FaTimesCircle /> Closed
            </>
          )}
        </span>
      ),
    },
  ];

  const handleViewDetails = (admission) => {
    setSelectedAdmission(admission);
    setIsDetailMenuOpen(true);
  };

  const actions = [
    {
      label: "View Details",
      icon: <FaEye />,
      onClick: handleViewDetails,
    },
  ];

  if (loading) {
    return (
      <div className="sa-loading">
        <div className="sa-spinner"></div>
        <p>Loading admissions...</p>
      </div>
    );
  }

  return (
    <div className="session-admissions">
      <div className="sa-header">
        <div className="sa-header-content">
          <h2 className="sa-title">Session Admissions</h2>
          <p className="sa-subtitle">
            Manage student admissions for this academic session
          </p>
        </div>
        <Button variant="primary" icon={<FaUserPlus />}>
          New Admission
        </Button>
      </div>

      <div className="sa-stats">
        <div className="sa-stat-card">
          <div className="sa-stat-icon active">
            <FaCheckCircle />
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-label">Active Admissions</p>
            <h3 className="sa-stat-value">
              {admissions.filter((a) => a.active_status).length}
            </h3>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon closed">
            <FaTimesCircle />
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-label">Closed Admissions</p>
            <h3 className="sa-stat-value">
              {admissions.filter((a) => !a.active_status).length}
            </h3>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon total">
            <FaUserPlus />
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-label">Total Admissions</p>
            <h3 className="sa-stat-value">{admissions.length}</h3>
          </div>
        </div>
      </div>

      <div className="sa-table-container">
        <SmartTable
          data={admissions}
          columns={columns}
          actions={actions}
          searchable={true}
          searchPlaceholder="Search by student name, ID, or admission ID..."
          itemsPerPage={10}
        />
      </div>

      {/* Detail Slide-in Menu */}
      <SlideInMenu
        isShow={isDetailMenuOpen}
        onClose={() => setIsDetailMenuOpen(false)}
        width="500px"
      >
        {selectedAdmission && (
          <div className="sa-detail-container">
            <div className="sa-detail-header">
              <h2>Admission Details</h2>
              <span
                className={`sa-status-badge ${
                  selectedAdmission.active_status ? "active" : "inactive"
                }`}
              >
                {selectedAdmission.active_status ? (
                  <>
                    <FaCheckCircle /> Active
                  </>
                ) : (
                  <>
                    <FaTimesCircle /> Closed
                  </>
                )}
              </span>
            </div>

            <div className="sa-detail-section">
              <h3>Student Information</h3>
              <div className="sa-detail-grid">
                <InfoField label="Student Name" value={selectedAdmission.student_name} />
                <InfoField label="Student ID" value={selectedAdmission.student_id} />
              </div>
            </div>

            <div className="sa-detail-section">
              <h3>Admission Information</h3>
              <div className="sa-detail-grid">
                <InfoField label="Admission ID" value={selectedAdmission.admission_id} />
                <InfoField
                  label="Admitted Date"
                  value={new Date(selectedAdmission.admitted_date).toLocaleDateString()}
                />
                <InfoField label="Class" value={selectedAdmission.admission_class} />
                <InfoField label="Session" value={selectedAdmission.admission_session} />
                <InfoField label="Term" value={selectedAdmission.admission_term} />
                <InfoField
                  label="Type"
                  value={selectedAdmission.admission_type === "new" ? "New" : "Transfer"}
                />
              </div>
            </div>

            {selectedAdmission.previous_school && (
              <div className="sa-detail-section">
                <h3>Transfer Information</h3>
                <div className="sa-detail-grid">
                  <InfoField
                    label="Previous School"
                    value={selectedAdmission.previous_school}
                  />
                </div>
              </div>
            )}

            {selectedAdmission.close_date && (
              <div className="sa-detail-section">
                <h3>Closure Information</h3>
                <div className="sa-detail-grid">
                  <InfoField
                    label="Close Date"
                    value={new Date(selectedAdmission.close_date).toLocaleDateString()}
                  />
                </div>
              </div>
            )}

            {selectedAdmission.remarks && (
              <div className="sa-detail-section">
                <h3>Remarks</h3>
                <p className="sa-remarks">{selectedAdmission.remarks}</p>
              </div>
            )}

            <div className="sa-detail-actions">
              <Button variant="secondary" onClick={() => setIsDetailMenuOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </div>
  );
};

export default SessionAdmissions;
