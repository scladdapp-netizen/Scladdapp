import { useState } from "react";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../components/infoField/InfoField";
import Button from "../../../../components/Button/Button";
import "./BillDetail.css";

const BillPayments = ({ billData }) => {
  const [showStudentDetailMenu, setShowStudentDetailMenu] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Sample student payment data for this bill
  const studentsPaymentData = [
    {
      id: 1,
      studentName: "John Doe",
      studentId: "STU001",
      class: "JSS 1A",
      rollNumber: "001",
      parentName: "Mr. James Doe",
      parentPhone: "08012345678",
      parentEmail: "james.doe@email.com",
      amountDue: 120000,
      amountPaid: 120000,
      balance: 0,
      paymentStatus: "Paid",
      paymentDate: "2024-01-15",
      paymentMethod: "Bank Transfer",
      transactionId: "TXN123456789",
      discountApplied: "Early Payment (5%)",
      discountAmount: 6316,
      originalAmount: 126316,
      dueDate: "2024-01-10",
      lateFee: 0,
      notes: "Payment completed on time with early payment discount",
      paymentHistory: [
        {
          date: "2024-01-15",
          amount: 120000,
          method: "Bank Transfer",
          reference: "BT20240115001",
          status: "Completed",
        },
      ],
    },
    {
      id: 2,
      studentName: "Jane Smith",
      studentId: "STU002",
      class: "JSS 1B",
      rollNumber: "002",
      parentName: "Mrs. Mary Smith",
      parentPhone: "08087654321",
      parentEmail: "mary.smith@email.com",
      amountDue: 120000,
      amountPaid: 80000,
      balance: 40000,
      paymentStatus: "Partial",
      paymentDate: "2024-01-20",
      paymentMethod: "Cash",
      transactionId: "CASH001",
      discountApplied: "None",
      discountAmount: 0,
      originalAmount: 120000,
      dueDate: "2024-01-10",
      lateFee: 5000,
      notes: "Partial payment made, balance outstanding",
      paymentHistory: [
        {
          date: "2024-01-20",
          amount: 80000,
          method: "Cash",
          reference: "CASH20240120001",
          status: "Completed",
        },
      ],
    },
    {
      id: 3,
      studentName: "Michael Johnson",
      studentId: "STU003",
      class: "JSS 1A",
      rollNumber: "003",
      parentName: "Dr. Robert Johnson",
      parentPhone: "08098765432",
      parentEmail: "robert.johnson@email.com",
      amountDue: 120000,
      amountPaid: 0,
      balance: 120000,
      paymentStatus: "Unpaid",
      paymentDate: null,
      paymentMethod: null,
      transactionId: null,
      discountApplied: "None",
      discountAmount: 0,
      originalAmount: 120000,
      dueDate: "2024-01-10",
      lateFee: 5000,
      notes: "Payment overdue, late fee applied",
      paymentHistory: [],
    },
    {
      id: 4,
      studentName: "Sarah Williams",
      studentId: "STU004",
      class: "JSS 1A",
      rollNumber: "004",
      parentName: "Mr. David Williams",
      parentPhone: "08076543210",
      parentEmail: "david.williams@email.com",
      amountDue: 120000,
      amountPaid: 108000,
      balance: 0,
      paymentStatus: "Paid",
      paymentDate: "2024-01-12",
      paymentMethod: "Online Payment",
      transactionId: "PAY987654321",
      discountApplied: "Sibling Discount (10%)",
      discountAmount: 12000,
      originalAmount: 120000,
      dueDate: "2024-01-10",
      lateFee: 0,
      notes: "Sibling discount applied, payment completed",
      paymentHistory: [
        {
          date: "2024-01-12",
          amount: 108000,
          method: "Online Payment",
          reference: "PAY20240112001",
          status: "Completed",
        },
      ],
    },
    {
      id: 5,
      studentName: "Fatima Abdullahi",
      studentId: "STU005",
      class: "JSS 2A",
      rollNumber: "005",
      parentName: "Alhaji Musa Abdullahi",
      parentPhone: "08054321098",
      parentEmail: "musa.abdullahi@email.com",
      amountDue: 120000,
      amountPaid: 60000,
      balance: 0,
      paymentStatus: "Paid",
      paymentDate: "2024-01-18",
      paymentMethod: "Bank Transfer",
      transactionId: "TXN789012345",
      discountApplied: "Staff Discount (50%)",
      discountAmount: 60000,
      originalAmount: 120000,
      dueDate: "2024-01-10",
      lateFee: 0,
      notes: "Staff discount applied - full payment completed",
      paymentHistory: [
        {
          date: "2024-01-18",
          amount: 60000,
          method: "Bank Transfer",
          reference: "BT20240118001",
          status: "Completed",
        },
      ],
    },
    {
      id: 6,
      studentName: "Emmanuel Okafor",
      studentId: "STU006",
      class: "JSS 3A",
      rollNumber: "006",
      parentName: "Dr. Peter Okafor",
      parentPhone: "08098765432",
      parentEmail: "peter.okafor@email.com",
      amountDue: 120000,
      amountPaid: 120000,
      balance: 0,
      paymentStatus: "Pending",
      paymentDate: "2024-01-25",
      paymentMethod: "Cheque",
      transactionId: "CHQ001",
      discountApplied: "None",
      discountAmount: 0,
      originalAmount: 120000,
      dueDate: "2024-01-10",
      lateFee: 0,
      notes: "Cheque submitted - awaiting bank clearance",
      paymentHistory: [
        {
          date: "2024-01-25",
          amount: 120000,
          method: "Cheque",
          reference: "CHQ20240125001",
          status: "Pending",
        },
      ],
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid":
        return { bg: "#d1fae5", text: "#065f46" };
      case "Partial":
        return { bg: "#fef3c7", text: "#92400e" };
      case "Unpaid":
        return { bg: "#fecaca", text: "#991b1b" };
      case "Pending":
        return { bg: "#e0e7ff", text: "#3730a3" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString()}`;
  };

  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowStudentDetailMenu(true);
  };

  const handleRecordPayment = (student) => {
    console.log("Record payment for:", student.studentName);
    // Handle record payment functionality
  };

  const handleSendReminder = (student) => {
    console.log("Send reminder to:", student.studentName);
    // Handle send reminder functionality
  };

  const handleBulkAction = (selectedIds) => {
    console.log("Bulk action for students:", selectedIds);
    // Handle bulk actions like sending reminders, recording payments, etc.
  };

  const handleSelectionChange = (selectedIds) => {
    setSelectedStudentIds(selectedIds);
  };

  const columns = [
    {
      accessor: "studentInfo",
      label: "Student Information",
      render: (_, student) => (
        <div className="student-info-cell">
          <div className="student-name">{student.studentName}</div>
          <div className="student-details">
            {student.studentId} • {student.class} • Roll: {student.rollNumber}
          </div>
        </div>
      ),
    },
    {
      accessor: "parentInfo",
      label: "Parent Information",
      render: (_, student) => (
        <div className="parent-info-cell">
          <div className="parent-name">{student.parentName}</div>
          <div className="parent-contact">{student.parentPhone}</div>
        </div>
      ),
    },
    {
      accessor: "amountDetails",
      label: "Amount Details",
      render: (_, student) => (
        <div className="amount-details-cell">
          <div className="amount-due">
            Due: {formatCurrency(student.amountDue)}
          </div>
          <div className="amount-paid">
            Paid: {formatCurrency(student.amountPaid)}
          </div>
          {student.balance > 0 && (
            <div className="amount-balance">
              Balance: {formatCurrency(student.balance)}
            </div>
          )}
        </div>
      ),
    },
    {
      accessor: "paymentStatus",
      label: "Payment Status",
      render: (status, student) => (
        <div className="payment-status-cell">
          <span
            className="payment-status-badge"
            style={{
              backgroundColor: getStatusColor(status).bg,
              color: getStatusColor(status).text,
            }}
          >
            {status}
          </span>
          {student.paymentDate && (
            <div className="payment-date">{student.paymentDate}</div>
          )}
        </div>
      ),
    },
    {
      accessor: "paymentMethod",
      label: "Payment Method",
      render: (method, student) => (
        <div className="payment-method-cell">
          {method ? (
            <>
              <div className="method">{method}</div>
              {student.transactionId && (
                <div className="transaction-id">{student.transactionId}</div>
              )}
            </>
          ) : (
            <span className="no-payment">No payment</span>
          )}
        </div>
      ),
    },
  ];

  // Calculate summary statistics
  const totalStudents = studentsPaymentData.length;
  const paidStudents = studentsPaymentData.filter(
    (s) => s.paymentStatus === "Paid"
  ).length;
  const partialStudents = studentsPaymentData.filter(
    (s) => s.paymentStatus === "Partial"
  ).length;
  const unpaidStudents = studentsPaymentData.filter(
    (s) => s.paymentStatus === "Unpaid"
  ).length;
  const pendingStudents = studentsPaymentData.filter(
    (s) => s.paymentStatus === "Pending"
  ).length;

  const totalCollected = studentsPaymentData.reduce(
    (sum, student) => sum + student.amountPaid,
    0
  );
  const totalOutstanding = studentsPaymentData.reduce(
    (sum, student) => sum + student.balance,
    0
  );

  return (
    <InnerTabCon>
      <div className="bill-payments">
        <div className="bill-payments-header">
          <div className="bill-payments-info">
            <h2>Student Payment Status for {billData.feeName}</h2>
          </div>
          <div className="bill-payments-actions">
            <Button variant="secondary">Export Report</Button>
            <Button variant="secondary">Send Bulk Reminder</Button>
            <Button>Record Payment</Button>
          </div>
        </div>

        <SmartTable
          data={studentsPaymentData}
          columns={columns}
          onRowClick={handleStudentClick}
          maxRowsPerPage={10}
          showcreatbut={false}
          enableSelect={true}
          onSelectChange={handleSelectionChange}
          onBulkDelete={handleBulkAction}
        />

        {/* Student Detail SlideInMenu */}
        <SlideInMenu
          isShow={showStudentDetailMenu}
          onClose={() => setShowStudentDetailMenu(false)}
          width="600px"
        >
          <div className="student-detail-slide-content">
            <div className="student-detail-slide-header">
              <div>
                <h2>Payment Details</h2>
                <p>
                  {selectedStudent?.studentName} • {selectedStudent?.studentId}
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setShowStudentDetailMenu(false)}
              >
                ×
              </button>
            </div>

            <div className="student-detail-slide-body">
              {selectedStudent && (
                <div className="student-detail-content">
                  <div className="detail-section">
                    <h3>Student Information</h3>
                    <div className="detail-grid">
                      <InfoField
                        label="Student Name"
                        value={selectedStudent.studentName}
                      />
                      <InfoField
                        label="Student ID"
                        value={selectedStudent.studentId}
                      />
                      <InfoField label="Class" value={selectedStudent.class} />
                      <InfoField
                        label="Roll Number"
                        value={selectedStudent.rollNumber}
                      />
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Parent Information</h3>
                    <div className="detail-grid">
                      <InfoField
                        label="Parent Name"
                        value={selectedStudent.parentName}
                      />
                      <InfoField
                        label="Phone"
                        value={selectedStudent.parentPhone}
                      />
                      <InfoField
                        label="Email"
                        value={selectedStudent.parentEmail}
                      />
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Payment Summary</h3>
                    <div className="detail-grid">
                      <InfoField
                        label="Original Amount"
                        value={formatCurrency(selectedStudent.originalAmount)}
                      />
                      <InfoField
                        label="Discount Applied"
                        value={selectedStudent.discountApplied}
                      />
                      <InfoField
                        label="Discount Amount"
                        value={formatCurrency(selectedStudent.discountAmount)}
                      />
                      <InfoField
                        label="Amount Due"
                        value={formatCurrency(selectedStudent.amountDue)}
                      />
                      <InfoField
                        label="Amount Paid"
                        value={formatCurrency(selectedStudent.amountPaid)}
                      />
                      <InfoField
                        label="Balance"
                        value={formatCurrency(selectedStudent.balance)}
                      />
                      <InfoField
                        label="Due Date"
                        value={selectedStudent.dueDate}
                      />
                      <InfoField
                        label="Late Fee"
                        value={formatCurrency(selectedStudent.lateFee)}
                      />
                      <InfoField
                        label="Payment Status"
                        value={selectedStudent.paymentStatus}
                      />
                    </div>
                  </div>

                  {selectedStudent.paymentHistory.length > 0 && (
                    <div className="detail-section">
                      <h3>Payment History</h3>
                      <div className="payment-history-list">
                        {selectedStudent.paymentHistory.map(
                          (payment, index) => (
                            <div key={index} className="payment-history-item">
                              <div className="payment-history-header">
                                <span className="payment-amount">
                                  {formatCurrency(payment.amount)}
                                </span>
                                <span className="payment-date">
                                  {payment.date}
                                </span>
                              </div>
                              <div className="payment-history-details">
                                <span>Method: {payment.method}</span>
                                <span>Reference: {payment.reference}</span>
                                <span className="payment-status">
                                  Status: {payment.status}
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {selectedStudent.notes && (
                    <div className="detail-section">
                      <h3>Notes</h3>
                      <div className="notes-content">
                        <p>{selectedStudent.notes}</p>
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
              {selectedStudent?.balance > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => handleSendReminder(selectedStudent)}
                >
                  Send Reminder
                </Button>
              )}
              <Button onClick={() => handleRecordPayment(selectedStudent)}>
                Record Payment
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default BillPayments;
