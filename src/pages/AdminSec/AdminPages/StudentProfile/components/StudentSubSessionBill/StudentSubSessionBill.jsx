import { useState } from "react";
import CenterModal from "../../../../../../components/CenterModal/CenterModal";
import "./StudentSubSessionBill.css";

const StudentSubSessionBill = () => {
  const [showAllBillsModal, setShowAllBillsModal] = useState(false);
  const [showBillDetailModal, setShowBillDetailModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Sample data with partial payments support
  const billingData = {
    session: "2025/2026",
    totalAmount: 8450,
    totalPaid: 7250,
    balanceDue: 1200,
    fees: [
      {
        id: 1,
        name: "Tuition Fee",
        description: "First Term 2025",
        amount: 5500,
        paidAmount: 5500,
        status: "PAID",
        dueDate: "2025-01-15",
        payments: [
          {
            id: 1,
            amount: 5500,
            date: "2025-01-10",
            method: "Bank Transfer",
            transactionId: "TXN-2025-001",
            status: "COMPLETED",
          },
        ],
      },
      {
        id: 2,
        name: "Laboratory Fee",
        description: "Science & Computer Labs",
        amount: 450,
        paidAmount: 450,
        status: "PAID",
        dueDate: "2025-01-20",
        payments: [
          {
            id: 2,
            amount: 450,
            date: "2025-01-18",
            method: "Credit Card",
            transactionId: "TXN-2025-002",
            status: "COMPLETED",
          },
        ],
      },
      {
        id: 3,
        name: "Library Fee",
        description: "Annual Library Access",
        amount: 200,
        paidAmount: 200,
        status: "PAID",
        dueDate: "2025-01-25",
        payments: [
          {
            id: 3,
            amount: 200,
            date: "2025-01-22",
            method: "Cash",
            transactionId: "TXN-2025-003",
            status: "COMPLETED",
          },
        ],
      },
      {
        id: 4,
        name: "Sports Fee",
        description: "Sports Activities & Equipment",
        amount: 300,
        paidAmount: 150,
        status: "PARTIALLY_PAID",
        dueDate: "2025-02-15",
        payments: [
          {
            id: 4,
            amount: 150,
            date: "2025-02-01",
            method: "Credit Card",
            transactionId: "TXN-2025-004",
            status: "COMPLETED",
          },
        ],
      },
      {
        id: 5,
        name: "Examination Fee",
        description: "First Term Examinations",
        amount: 200,
        paidAmount: 0,
        status: "NOT_PAID",
        dueDate: "2025-02-20",
        payments: [],
      },
      {
        id: 6,
        name: "Transport Fee",
        description: "School Bus Service",
        amount: 400,
        paidAmount: 0,
        status: "OVERDUE",
        dueDate: "2025-01-30",
        payments: [],
      },
      {
        id: 7,
        name: "Activity Fee",
        description: "Extracurricular Activities",
        amount: 150,
        paidAmount: 75,
        status: "PARTIALLY_PAID",
        dueDate: "2025-03-01",
        payments: [
          {
            id: 5,
            amount: 50,
            date: "2025-02-10",
            method: "Cash",
            transactionId: "TXN-2025-005",
            status: "COMPLETED",
          },
          {
            id: 6,
            amount: 25,
            date: "2025-02-15",
            method: "Credit Card",
            transactionId: "TXN-2025-006",
            status: "COMPLETED",
          },
        ],
      },
    ],
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "PAID":
        return "PAID";
      case "PARTIALLY_PAID":
        return "PARTIAL";
      case "NOT_PAID":
        return "UNPAID";
      case "OVERDUE":
        return "OVERDUE";
      default:
        return status;
    }
  };

  const handleBillClick = (bill) => {
    setSelectedBill(bill);
    setShowBillDetailModal(true);
  };

  const handleSeeMoreClick = () => {
    setShowAllBillsModal(true);
  };

  // Show only first 3 bills
  const displayedFees = billingData.fees.slice(0, 3);
  const remainingFeesCount = billingData.fees.length - 3;

  return (
    <>
      <div className="studentSubSessionBill">
        <div className="billHeader">
          <h3 className="billTitle">Academic Session Billing</h3>
          <div className="sessionBadge">{billingData.session}</div>
        </div>

        <div className="billSummary">
          <div className="summaryItem">
            <div className="summaryLabel">Total Amount</div>
            <div className="summaryValue total">
              {formatCurrency(billingData.totalAmount)}
            </div>
          </div>

          <div className="summaryItem">
            <div className="summaryLabel">Amount Paid</div>
            <div className="summaryValue paid">
              {formatCurrency(billingData.totalPaid)}
            </div>
          </div>

          <div className="summaryItem">
            <div className="summaryLabel">Balance Due</div>
            <div className="summaryValue due">
              {formatCurrency(billingData.balanceDue)}
            </div>
          </div>
        </div>

        <div className="feesList">
          {displayedFees.map((fee) => (
            <div
              key={fee.id}
              className="feeItem clickable"
              onClick={() => handleBillClick(fee)}
            >
              <div className="feeInfo">
                <div className="feeName">{fee.name}</div>
                <div className="feeDescription">{fee.description}</div>
                {fee.status === "PARTIALLY_PAID" && (
                  <div className="feeProgress">
                    {formatCurrency(fee.paidAmount)} of{" "}
                    {formatCurrency(fee.amount)} paid
                  </div>
                )}
              </div>

              <div className="feeRight">
                <div className="feeAmount">{formatCurrency(fee.amount)}</div>
                <div className={`feeStatus ${fee.status.toLowerCase()}`}>
                  {getStatusDisplay(fee.status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {remainingFeesCount > 0 && (
          <button className="seeMoreButton" onClick={handleSeeMoreClick}>
            <span>See More ({remainingFeesCount} more bills)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* All Bills Modal */}
      <CenterModal
        isShow={showAllBillsModal}
        onClose={() => setShowAllBillsModal(false)}
        size="medium"
      >
        <div className="modernModal">
          <div className="modalHeader">
            <div>
              <h2 className="modalTitle">All Session Bills</h2>
              <p className="modalSubtitle">
                Academic Session {billingData.session}
              </p>
            </div>
          </div>

          <div className="modalContent">
            {billingData.fees.map((fee) => (
              <div
                key={fee.id}
                className="modernBillItem"
                onClick={() => handleBillClick(fee)}
              >
                <div className="billItemLeft">
                  <div className="billItemName">{fee.name}</div>
                  <div className="billItemDesc">{fee.description}</div>
                  <div className="billItemDue">
                    Due: {formatDate(fee.dueDate)}
                  </div>
                  {fee.status === "PARTIALLY_PAID" && (
                    <div className="billItemProgress">
                      <div className="progressBar">
                        <div
                          className="progressFill"
                          style={{
                            width: `${(fee.paidAmount / fee.amount) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="progressText">
                        {formatCurrency(fee.paidAmount)} /{" "}
                        {formatCurrency(fee.amount)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="billItemRight">
                  <div className="billItemAmount">
                    {formatCurrency(fee.amount)}
                  </div>
                  <div className={`billItemStatus ${fee.status.toLowerCase()}`}>
                    {getStatusDisplay(fee.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CenterModal>

      {/* Bill Detail Modal */}
      <CenterModal
        isShow={showBillDetailModal}
        onClose={() => setShowBillDetailModal(false)}
        size="medium"
      >
        {selectedBill && (
          <div className="modernDetailModal">
            <div className="detailHeader">
              <div>
                <h2 className="detailTitle">{selectedBill.name}</h2>
                <p className="detailSubtitle">{selectedBill.description}</p>
              </div>
              <div
                className={`detailStatus ${selectedBill.status.toLowerCase()}`}
              >
                {getStatusDisplay(selectedBill.status)}
              </div>
            </div>

            <div className="detailContent">
              <div className="detailSection">
                <h3 className="sectionTitle">Bill Summary</h3>
                <div className="summaryGrid">
                  <div className="summaryRow">
                    <span>Total Amount</span>
                    <span className="amount">
                      {formatCurrency(selectedBill.amount)}
                    </span>
                  </div>
                  <div className="summaryRow">
                    <span>Amount Paid</span>
                    <span className="amount paid">
                      {formatCurrency(selectedBill.paidAmount)}
                    </span>
                  </div>
                  <div className="summaryRow">
                    <span>Balance Due</span>
                    <span className="amount due">
                      {formatCurrency(
                        selectedBill.amount - selectedBill.paidAmount
                      )}
                    </span>
                  </div>
                  <div className="summaryRow">
                    <span>Due Date</span>
                    <span>{formatDate(selectedBill.dueDate)}</span>
                  </div>
                </div>
              </div>

              {selectedBill.payments.length > 0 && (
                <div className="detailSection">
                  <h3 className="sectionTitle">Payment History</h3>
                  <div className="paymentsGrid">
                    {selectedBill.payments.map((payment) => (
                      <div key={payment.id} className="paymentItem">
                        <div className="paymentLeft">
                          <div className="paymentAmount">
                            {formatCurrency(payment.amount)}
                          </div>
                          <div className="paymentDate">
                            {formatDate(payment.date)}
                          </div>
                        </div>
                        <div className="paymentRight">
                          <div className="paymentMethod">{payment.method}</div>
                          <div className="paymentId">
                            {payment.transactionId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CenterModal>
    </>
  );
};

export default StudentSubSessionBill;
