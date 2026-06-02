import { useState } from "react";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import InfoField from "../../../../components/infoField/InfoField";
import Button from "../../../../components/Button/Button";
import "./BillDetail.css";

const BillStudents = ({ billData }) => {
  const [showStudentDetailMenu, setShowStudentDetailMenu] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Sample students data enrolled in this bill
  const studentsData = [
    {
      id: 1,
      studentId: "STU001",
      name: "John Doe",
      class: "JSS 1A",
      admissionNumber: "ADM2023001",
      paymentStatus: "Paid",
      amountPaid: "₦120,000",
      amountDue: "₦0",
      paymentDate: "2024-01-15",
      paymentMethod: "Bank Transfer",
      discountApplied: "Early Payment (5%)",
      originalAmount: "₦126,316",
      discountAmount: "₦6,316",
      parentName: "Mr. James Doe",
      parentPhone: "08012345678",
      parentEmail: "james.doe@email.com",
      enrollmentDate: "2024-01-10",
      dueDate: "2024-01-31",
      lateFee: "₦0",
      paymentHistory: [
        {
          date: "2024-01-15",
          amount: "₦120,000",
          method: "Bank Transfer",
          reference: "TXN123456789",
          status: "Completed",
        },
      ],
    },
    {
      id: 2,
      studentId: "STU002",
      name: "Jane Smith",
      class: "JSS 1B",
      admissionNumber: "ADM2023002",
      paymentStatus: "Partial",
      amountPaid: "₦80,000",
      amountDue: "₦40,000",
      paymentDate: "2024-01-20",
      paymentMethod: "Cash",
      discountApplied: "None",
      originalAmount: "₦120,000",
      discountAmount: "₦0",
      parentName: "Mrs. Mary Smith",
      parentPhone: "08087654321",
      parentEmail: "mary.smith@email.com",
      enrollmentDate: "2024-01-10",
      dueDate: "2024-01-31",
      lateFee: "₦5,000",
      paymentHistory: [
        {
          date: "2024-01-20",
          amount: "₦80,000",
          method: "Cash",
          reference: "CASH001",
          status: "Completed",
        },
      ],
    },
    {
      id: 3,
      studentId: "STU003",
      name: "Michael Johnson",
      class: "JSS 2A",
      admissionNumber: "ADM2023003",
      paymentStatus: "Pending",
      amountPaid: "₦0",
      amountDue: "₦120,000",
      paymentDate: null,
      paymentMethod: null,
      discountApplied: "Staff Discount (50%)",
      originalAmount: "₦120,000",
      discountAmount: "₦60,000",
      parentName: "Dr. Robert Johnson",
      parentPhone: "08098765432",
      parentEmail: "robert.johnson@email.com",
      enrollmentDate: "2024-01-10",
      dueDate: "2024-01-31",
      lateFee: "₦5,000",
      paymentHistory: [],
    },
    {
      id: 4,
      studentId: "STU004",
      name: "Sarah Williams",
      class: "JSS 1A",
      admissionNumber: "ADM2023004",
      paymentStatus: "Paid",
      amountPaid: "₦108,000",
      amountDue: "₦0",
      paymentDate: "2024-01-12",
      paymentMethod: "Online Payment",
      discountApplied: "Sibling Discount (10%)",
      originalAmount: "₦120,000",
      discountAmount: "₦12,000",
      parentName: "Mr. David Williams",
      parentPhone: "08076543210",
      parentEmail: "david.williams@email.com",
      enrollmentDate: "2024-01-10",
      dueDate: "2024-01-31",
      lateFee: "₦0",
      paymentHistory: [
        {
          date: "2024-01-12",
          amount: "₦108,000",
          method: "Online Payment",
          reference: "PAY987654321",
          status: "Completed",
        },
      ],
    },
    {
      id: 5,
      studentId: "STU005",
      name: "David Brown",
      class: "JSS 2B",
      admissionNumber: "ADM2023005",
      paymentStatus: "Overdue",
      amountPaid: "₦0",
      amountDue: "₦125,000",
      paymentDate: null,
      paymentMethod: null,
      discountApplied: "None",
      originalAmount: "₦120,000",
      discountAmount: "₦0",
      parentName: "Mrs. Lisa Brown",
      parentPhone: "08065432109",
      parentEmail: "lisa.brown@email.com",
      enrollmentDate: "2024-01-10",
      dueDate: "2024-01-31",
      lateFee: "₦5,000",
      paymentHistory: [],
    },
  ];

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return "#10b981";
      case "Partial":
        return "#f59e0b";
      case "Pending":
        return "#6b7280";
      case "Overdue":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getPaymentStatusBg = (status) => {
    switch (status) {
      case "Paid":
        return "#d1fae5";
      case "Partial":
        return "#fef3c7";
      case "Pending":
        return "#f3f4f6";
      case "Overdue":
        return "#fecaca";
      default:
        return "#f3f4f6";
    }
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowStudentDetailMenu(true);
  };

  const handleSendReminder = (student) => {
    console.log(
      "Send payment reminder to:",
      student?.name || "Unknown student"
    );
    // Handle send reminder functionality
  };

  const handleRecordPayment = (student) => {
    console.log("Record payment for:", student?.name || "Unknown student");
    // Handle record payment functionality
  };

  const columns = [
    {
      key: "studentInfo",
      label: "Student Information",
      render: (student) => (
        <div className="student-info-cell">
          <div className="student-name">{student.name}</div>
          <div className="student-details">
            {student.studentId} • {student.class} • {student.admissionNumber}
          </div>
        </div>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      render: (student) => (
        <div className="payment-status-cell">
          <span
            className="payment-status-badge"
            style={{
              backgroundColor: getPaymentStatusBg(student.paymentStatus),
              color: getPaymentStatusColor(student.paymentStatus),
            }}
          >
            {student.paymentStatus}
          </span>
        </div>
      ),
    },
    {
      key: "amounts",
      label: "Amount Details",
      render: (student) => (
        <div className="amount-details-cell">
          <div className="amount-paid">Paid: {student.amountPaid}</div>
          <div className="amount-due">Due: {student.amountDue}</div>
          {student.discountApplied !== "None" && (
            <div className="discount-applied">
              Discount: {student.discountApplied}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "parentInfo",
      label: "Parent Contact",
      render: (student) => (
        <div className="parent-info-cell">
          <div className="parent-name">{student.parentName}</div>
          <div className="parent-contact">{student.parentPhone}</div>
        </div>
      ),
    },
    {
      key: "paymentDate",
      label: "Payment Date",
      render: (student) => (
        <div className="payment-date-cell">
          {student.paymentDate ? (
            <div>
              <div className="payment-date">{student.paymentDate}</div>
              <div className="payment-method">{student.paymentMethod}</div>
            </div>
          ) : (
            <span className="no-payment">No payment yet</span>
          )}
        </div>
      ),
    },
  ];

  const actions = [
    {
      label: "View Details",
      onClick: handleStudentClick,
    },
    {
      label: "Send Reminder",
      onClick: handleSendReminder,
      condition: (student) => student.paymentStatus !== "Paid",
    },
    {
      label: "Record Payment",
      onClick: handleRecordPayment,
      condition: (student) => student.paymentStatus !== "Paid",
    },
  ];

  return (
    <div className="bill-students">
      <div className="bill-students-header">
        <div className="bill-students-info">
          <h2>Students Enrolled in {billData.feeName}</h2>
          <p>
            Total: {studentsData.length} students • Collection Rate:{" "}
            {billData.collectionRate}
          </p>
        </div>
        <div className="bill-students-actions">
          <Button variant="secondary">Export List</Button>
          <Button variant="secondary">Send Bulk Reminder</Button>
          <Button>Record Bulk Payment</Button>
        </div>
      </div>

      <SmartTable
        data={studentsData}
        columns={columns}
        actions={actions}
        onRowClick={handleStudentClick}
        searchPlaceholder="Search students by name, ID, class, or parent..."
        emptyMessage="No students found for this bill"
      />

      {/* Student Detail SlideInMenu */}
      <SlideInMenu
        isShow={showStudentDetailMenu}
        onClose={() => setShowStudentDetailMenu(false)}
        width="700px"
      >
        <div className="student-detail-slide-content">
          <div className="student-detail-slide-header">
            <div>
              <h2>{selectedStudent?.name}</h2>
              <p>
                {selectedStudent?.studentId} • {selectedStudent?.class} •{" "}
                {selectedStudent?.admissionNumber}
              </p>
            </div>
            <button
              className="close-button"
              onClick={() => setShowStudentDetailMenu(false)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="student-detail-slide-body">
            {selectedStudent && (
              <div className="student-detail-content">
                <div className="detail-section">
                  <h3>Payment Information</h3>
                  <div className="detail-grid">
                    <InfoField
                      label="Payment Status"
                      value={selectedStudent?.paymentStatus || "N/A"}
                    />
                    <InfoField
                      label="Amount Paid"
                      value={selectedStudent?.amountPaid || "N/A"}
                    />
                    <InfoField
                      label="Amount Due"
                      value={selectedStudent?.amountDue || "N/A"}
                    />
                    <InfoField
                      label="Original Amount"
                      value={selectedStudent?.originalAmount || "N/A"}
                    />
                    <InfoField
                      label="Discount Applied"
                      value={selectedStudent?.discountApplied || "N/A"}
                    />
                    <InfoField
                      label="Discount Amount"
                      value={selectedStudent?.discountAmount || "N/A"}
                    />
                    <InfoField
                      label="Late Fee"
                      value={selectedStudent?.lateFee || "N/A"}
                    />
                    <InfoField
                      label="Due Date"
                      value={selectedStudent?.dueDate || "N/A"}
                    />
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Parent Information</h3>
                  <div className="detail-grid">
                    <InfoField
                      label="Parent Name"
                      value={selectedStudent?.parentName || "N/A"}
                    />
                    <InfoField
                      label="Phone Number"
                      value={selectedStudent?.parentPhone || "N/A"}
                    />
                    <InfoField
                      label="Email Address"
                      value={selectedStudent?.parentEmail || "N/A"}
                    />
                    <InfoField
                      label="Enrollment Date"
                      value={selectedStudent?.enrollmentDate || "N/A"}
                    />
                  </div>
                </div>

                {selectedStudent?.paymentHistory &&
                  selectedStudent?.paymentHistory.length > 0 && (
                    <div className="detail-section">
                      <h3>Payment History</h3>
                      <div className="payment-history-list">
                        {selectedStudent?.paymentHistory.map(
                          (payment, index) => (
                            <div key={index} className="payment-history-item">
                              <div className="payment-history-header">
                                <span className="payment-amount">
                                  {payment.amount}
                                </span>
                                <span className="payment-date">
                                  {payment.date}
                                </span>
                              </div>
                              <div className="payment-history-details">
                                <span>Method: {payment.method}</span>
                                <span>Reference: {payment.reference}</span>
                                <span
                                  className="payment-status"
                                  style={{
                                    color: getPaymentStatusColor(
                                      payment.status
                                    ),
                                  }}
                                >
                                  {payment.status}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="student-detail-slide-footer">
            <Button
              variant="secondary"
              onClick={() => setShowStudentDetailMenu(false)}
            >
              Close
            </Button>
            {selectedStudent?.paymentStatus !== "Paid" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleSendReminder(selectedStudent)}
                >
                  Send Reminder
                </Button>
                <Button onClick={() => handleRecordPayment(selectedStudent)}>
                  Record Payment
                </Button>
              </>
            )}
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default BillStudents;
