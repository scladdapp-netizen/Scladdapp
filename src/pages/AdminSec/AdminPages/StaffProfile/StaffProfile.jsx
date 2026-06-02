import React from "react";
import { useParams } from "react-router-dom";
import "./StaffProfile.css";

const StaffProfile = ({ staffData: propStaffData }) => {
  const { subseasion } = useParams();

  // Use staffData from props (passed by wrapper)
  const staffData = propStaffData;

  console.log("Staff Profile - staffData from props:", staffData);

  if (!staffData) {
    return (
      <div className="staff-profile">
        <div className="staff-profile-header">
          <h2>No Data</h2>
          <p>Staff information not found</p>
        </div>
      </div>
    );
  }

  const { staff, teacher_assignments, assignment_history } = staffData;

  return (
    <div className="staff-profile">
      <div className="staff-profile-header">
        <h2>Staff Overview</h2>
        <p>
          {subseasion
            ? "Session-specific staff information and performance metrics"
            : "Overall staff profile and permanent information"}
        </p>
      </div>

      <div className="staff-profile-content">
        {/* Staff Basic Information */}
        <div className="staff-overview-card">
          <h3>Staff Information</h3>
          <div className="staff-info-grid">
            <div className="info-item">
              <strong>Name:</strong> {staff.full_name}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {staff.email}
            </div>
            <div className="info-item">
              <strong>Phone:</strong> {staff.phone}
            </div>
            <div className="info-item">
              <strong>Position:</strong> {staff.position}
            </div>
            <div className="info-item">
              <strong>Department:</strong> {staff.department}
            </div>
            <div className="info-item">
              <strong>Role:</strong> {staff.role}
            </div>
            <div className="info-item">
              <strong>Employment Type:</strong> {staff.employment_type}
            </div>
            <div className="info-item">
              <strong>Status:</strong> {staff.employment_status}
            </div>
          </div>
        </div>

        {/* Teacher Assignments Information */}
        {teacher_assignments && teacher_assignments.length > 0 && (
          <div className="staff-overview-card">
            <h3>Teacher Assignments ({teacher_assignments.length})</h3>
            {teacher_assignments.map((assignment, index) => (
              <div
                key={assignment.teacher_id}
                className="teacher-assignment-info"
                style={{
                  marginBottom:
                    index < teacher_assignments.length - 1 ? "20px" : "0",
                  paddingBottom:
                    index < teacher_assignments.length - 1 ? "20px" : "0",
                  borderBottom:
                    index < teacher_assignments.length - 1
                      ? "1px solid #e5e7eb"
                      : "none",
                }}
              >
                <div className="info-item">
                  <strong>Teacher Code:</strong> {assignment.teacher_code}
                </div>
                <div className="info-item">
                  <strong>Teacher ID:</strong> {assignment.teacher_id}
                </div>
                <div className="info-item">
                  <strong>Status:</strong>{" "}
                  {assignment.is_active ? "Active" : "Inactive"}
                </div>
                <div className="info-item">
                  <strong>Appointed At:</strong>{" "}
                  {new Date(assignment.appointed_at).toLocaleDateString()}
                </div>
                {assignment.appointed_by_admin && (
                  <div className="info-item">
                    <strong>Appointed By:</strong>{" "}
                    {assignment.appointed_by_admin.full_name} (
                    {assignment.appointed_by_admin.admin_role})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Assignment History */}
        {assignment_history && assignment_history.length > 0 && (
          <div className="staff-overview-card">
            <h3>Teacher Assignment History ({assignment_history.length})</h3>
            <div className="assignment-history">
              {assignment_history.map((history) => (
                <div key={history.history_id} className="history-item">
                  <div className="history-date">
                    {new Date(history.changed_at).toLocaleString()}
                  </div>
                  <div className="history-details">
                    <p>
                      <strong>Teacher Code:</strong> {history.teacher_code}
                    </p>
                    <p>
                      <strong>From:</strong> {history.old_staff_name} (
                      {history.old_staff_email})
                    </p>
                    <p>
                      <strong>To:</strong> {history.new_staff_name} (
                      {history.new_staff_email})
                    </p>
                    <p>
                      <strong>Reason:</strong> {history.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Teacher Assignment Message */}
        {(!teacher_assignments || teacher_assignments.length === 0) && (
          <div className="staff-overview-card">
            <h3>Teacher Assignments</h3>
            <p>This staff member is not currently assigned as a teacher.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProfile;
