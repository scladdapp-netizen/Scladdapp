import { useState, useRef } from "react";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useStudentBills from "../../../../../api_call/useStudentBills";
import StudentDetailTopTab from "../../../../AdminSec/Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import "../../../../AdminSec/AdminPages/Communication/Notifications/Notifications.css";
import "../../../../AdminSec/AdminPages/classProfile/ClassSubjects/ClassSubjects.css";
import "./Bill.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const fmtFull = (d) =>
  d ? new Date(d).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—";
const fmtMoney = (amount, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount || 0);

const STATUS_CLASS = { paid: "bill-badge-paid", partial: "bill-badge-partial", unpaid: "bill-badge-unpaid" };

const Bill = () => {
  const { user } = useAuth();
  const studentId   = user?.student?.student_id;
  const studentName = user?.student?.full_name || "Student";
  const school      = user?.school || {};

  const { bills, loading, recordPayment } = useStudentBills(studentId);

  const [filter, setFilter]         = useState("all");
  const [selected, setSelected]     = useState(null);
  const [showReceipt, setShowReceipt] = useState(null);
  const [paying, setPaying]         = useState(false);
  const [payForm, setPayForm]       = useState({ amount: "", method: "Cash", reference: "", note: "" });
  const [payError, setPayError]     = useState("");
  const receiptRef = useRef(null);

  const filtered = bills.filter((b) => filter === "all" || b.payment_status === filter);
  const counts = {
    all:     bills.length,
    unpaid:  bills.filter((b) => b.payment_status === "unpaid").length,
    partial: bills.filter((b) => b.payment_status === "partial").length,
    paid:    bills.filter((b) => b.payment_status === "paid").length,
  };

  const totalDue  = bills.reduce((s, b) => s + (b.amount_due  || 0), 0);
  const totalPaid = bills.reduce((s, b) => s + (b.amount_paid || 0), 0);
  const balance   = totalDue - totalPaid;

  const openDetail = (b) => {
    setSelected(b);
    setPayForm({ amount: "", method: "Cash", reference: "", note: "" });
    setPayError("");
  };

  const handlePay = async () => {
    const amount = parseFloat(payForm.amount);
    if (!amount || amount <= 0) { setPayError("Enter a valid amount"); return; }
    const bill = selected?.bill || {};
    const remaining = (selected?.amount_due || 0) - (selected?.amount_paid || 0);
    if (amount > remaining) { setPayError(`Amount cannot exceed balance of ${fmtMoney(remaining, bill.currency)}`); return; }
    if (bill.allow_installments && bill.min_payment && amount < bill.min_payment) {
      setPayError(`Minimum installment is ${fmtMoney(bill.min_payment, bill.currency)}`); return;
    }
    setPaying(true); setPayError("");
    const res = await recordPayment(selected.bill_id, selected.user_bill_id, {
      amount, payment_method: payForm.method,
      reference: payForm.reference || null, note: payForm.note || null,
      recorded_by_id: studentId, recorded_by_name: studentName,
    });
    setPaying(false);
    if (res.success) {
      const latestPayment = res.data?.payments?.slice(-1)[0];
      setSelected(res.data);
      setShowReceipt({ ...latestPayment, bill: selected.bill, userBill: res.data });
    } else {
      setPayError(res.message || "Payment failed");
    }
  };

  const RECEIPT_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, sans-serif; background: #fff; color: #111; }
    .receipt-wrap { max-width: 420px; margin: 0 auto; padding: 32px 24px; }
    .receipt-header { text-align: center; padding-bottom: 20px; border-bottom: 2px dashed #e8e8e8; margin-bottom: 20px; }
    .receipt-logo { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid #e8e8e8; margin-bottom: 10px; }
    .receipt-logo-ph { width: 56px; height: 56px; border-radius: 12px; background: #f4f4f4; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 28px; }
    .receipt-school { font-size: 17px; font-weight: 800; color: #111; margin-bottom: 2px; }
    .receipt-addr   { font-size: 11px; color: #888; margin-bottom: 8px; }
    .receipt-title  { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 2px; }
    .receipt-id     { font-size: 11px; color: #aaa; }
    .receipt-section { padding: 12px 0; border-bottom: 1px dashed #e8e8e8; }
    .receipt-section-label { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #aaa; margin-bottom: 4px; }
    .receipt-section-value { font-size: 14px; font-weight: 700; color: #111; }
    .receipt-section-sub   { font-size: 12px; color: #888; margin-top: 2px; }
    .receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f7f7f7; }
    .receipt-row-label { font-size: 12px; color: #888; }
    .receipt-row-value { font-size: 12px; font-weight: 700; color: #111; }
    .receipt-amount-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 2px solid #111; margin-top: 8px; }
    .receipt-amount-label { font-size: 13px; font-weight: 700; color: #111; }
    .receipt-amount-value { font-size: 20px; font-weight: 800; color: #111; }
    .receipt-status { text-align: center; margin-top: 16px; }
    .receipt-badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-paid    { background: #dcfce7; color: #166534; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-unpaid  { background: #fecaca; color: #991b1b; }
    .receipt-thanks { text-align: center; margin-top: 16px; font-size: 11px; color: #aaa; }
    @media print { @page { size: A5; margin: 8mm; } body { padding: 0; } }
  `;

  const buildReceiptHTML = (r) => {
    const bill = r.bill || {};
    const userBill = r.userBill || {};
    const statusClass = { paid: "badge-paid", partial: "badge-partial", unpaid: "badge-unpaid" }[userBill.payment_status] || "badge-unpaid";
    const logoHtml = school.logo_url && typeof school.logo_url === "string"
      ? `<img src="${school.logo_url}" class="receipt-logo" alt="logo"/>`
      : `<div class="receipt-logo-ph">🏫</div>`;
    return `
      <div class="receipt-wrap">
        <div class="receipt-header">
          ${logoHtml}
          <div class="receipt-school">${school.school_name || "School"}</div>
          ${school.address ? `<div class="receipt-addr">${school.address}</div>` : ""}
          <div class="receipt-title">Payment Receipt</div>
          <div class="receipt-id">Receipt No: ${r.payment_id || "—"}</div>
        </div>
        <div class="receipt-section">
          <div class="receipt-section-label">Paid By</div>
          <div class="receipt-section-value">${studentName}</div>
        </div>
        <div class="receipt-section">
          <div class="receipt-section-label">Bill</div>
          <div class="receipt-section-value">${bill.fee_name || "—"}</div>
          ${bill.category ? `<div class="receipt-section-sub">${bill.category}</div>` : ""}
        </div>
        <div class="receipt-row"><span class="receipt-row-label">Payment Method</span><span class="receipt-row-value">${r.payment_method || "—"}</span></div>
        <div class="receipt-row"><span class="receipt-row-label">Reference</span><span class="receipt-row-value">${r.reference || "—"}</span></div>
        <div class="receipt-row"><span class="receipt-row-label">Date & Time</span><span class="receipt-row-value">${fmtFull(r.paid_at)}</span></div>
        <div class="receipt-row"><span class="receipt-row-label">Total Paid So Far</span><span class="receipt-row-value">${fmtMoney(userBill.amount_paid, bill.currency)}</span></div>
        <div class="receipt-row"><span class="receipt-row-label">Balance Remaining</span><span class="receipt-row-value">${fmtMoney((userBill.amount_due || 0) - (userBill.amount_paid || 0), bill.currency)}</span></div>
        <div class="receipt-amount-row">
          <span class="receipt-amount-label">Amount Paid</span>
          <span class="receipt-amount-value">${fmtMoney(r.amount, bill.currency)}</span>
        </div>
        <div class="receipt-status"><span class="receipt-badge ${statusClass}">${(userBill.payment_status || "").toUpperCase()}</span></div>
        <div class="receipt-thanks">Thank you for your payment.</div>
      </div>
    `;
  };

  const openReceiptWindow = (r, forExport = false) => {
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>Receipt</title><style>${RECEIPT_STYLES}</style></head><body>${buildReceiptHTML(r)}</body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const handlePrintReceipt = () => openReceiptWindow(showReceipt, false);
  const handleExportPdf    = () => openReceiptWindow(showReceipt, true);

  if (loading) return <LoadingData message="Loading bills..." />;

  return (
    <StudentDetailTopTab title="Bills & Payments" subtitle="Your active fee bills and payment history" route={[]}>
      <InnerTabCon>
        <div className="notifications-container">
          {/* Header */}

          {/* Summary */}
          <div className="bill-summary-row">
            <div className="bill-summary-card bill-sum-blue">
              <p className="bill-sum-value">{fmtMoney(totalDue)}</p>
              <p className="bill-sum-label">Total Due</p>
            </div>
            <div className="bill-summary-card bill-sum-green">
              <p className="bill-sum-value">{fmtMoney(totalPaid)}</p>
              <p className="bill-sum-label">Total Paid</p>
            </div>
            <div className={`bill-summary-card ${balance > 0 ? "bill-sum-red" : "bill-sum-green"}`}>
              <p className="bill-sum-value">{fmtMoney(balance)}</p>
              <p className="bill-sum-label">Balance</p>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="sr2-tabs" style={{ marginBottom: 16 }}>
            {["all", "unpaid", "partial", "paid"].map((f) => (
              <button key={f} className={`sr2-tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Cards */}
          {filtered.length === 0 ? (
            <div className="cs-panel-empty">No bills found.</div>
          ) : (
            <div className="bill-grid">
              {filtered.map((b) => {
                const bill = b.bill || {};
                return (
                  <div key={b.user_bill_id} className="bill-card" onClick={() => openDetail(b)}>
                    <div className="bill-card-top">
                      <div className="bill-card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                          <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.7"/>
                          <line x1="6" y1="15" x2="10" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <span className={`bill-badge ${STATUS_CLASS[b.payment_status] || "bill-badge-unpaid"}`}>
                        {b.payment_status}
                      </span>
                    </div>
                    <div>
                      <p className="bill-card-name">{bill.fee_name || "Bill"}</p>
                      <p className="bill-card-cat">{bill.category || "—"}</p>
                    </div>
                    <div className="bill-card-amounts">
                      <div>
                        <p className="bill-amount-label">Amount Due</p>
                        <p className="bill-amount-due">{fmtMoney(b.amount_due, bill.currency)}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p className="bill-amount-label">Paid</p>
                        <p className="bill-amount-paid">{fmtMoney(b.amount_paid, bill.currency)}</p>
                      </div>
                    </div>
                    {b.due_date && <p className="bill-due-date">Due: {fmt(b.due_date)}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </InnerTabCon>

      {/* Bill detail panel */}
      <SlideInMenu isShow={!!selected && !showReceipt} onClose={() => setSelected(null)} width="540px">
        {selected && (() => {
          const bill = selected.bill || {};
          const remaining = (selected.amount_due || 0) - (selected.amount_paid || 0);
          return (
            <div className="cs-panel">
              <div className="cs-panel-header default">
                <span className="cs-panel-header-deco" aria-hidden="true"/>
                <div className="cs-panel-header-content">
                  <div className="cs-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                      <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="1.7"/>
                    </svg>
                  </div>
                  <div className="cs-panel-header-text">
                    <h2>{bill.fee_name || "Bill"}</h2>
                    <p>{bill.category}</p>
                  </div>
                </div>
              </div>

              <div className="cs-panel-body">
                {/* Status + amounts */}
                <div style={{ marginBottom: 4 }}>
                  <span className={`bill-badge ${STATUS_CLASS[selected.payment_status] || "bill-badge-unpaid"}`}>
                    {selected.payment_status}
                  </span>
                </div>
                <div className="bill-detail-amounts">
                  {[
                    { label: "Due",     value: fmtMoney(selected.amount_due,  bill.currency), cls: "bill-sum-blue"  },
                    { label: "Paid",    value: fmtMoney(selected.amount_paid, bill.currency), cls: "bill-sum-green" },
                    { label: "Balance", value: fmtMoney(remaining, bill.currency),            cls: remaining > 0 ? "bill-sum-red" : "bill-sum-green" },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className={`bill-summary-card ${cls}`}>
                      <p className="bill-sum-value" style={{ fontSize: 14 }}>{value}</p>
                      <p className="bill-sum-label">{label}</p>
                    </div>
                  ))}
                </div>

                {bill.description && <p className="bill-desc">{bill.description}</p>}

                {/* Bill items */}
                {(bill.bill_items || []).length > 0 && (
                  <div>
                    <span className="sc-section-label">Bill Items</span>
                    <table className="bill-items-table">
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.bill_items.map((item, i) => (
                          <tr key={i}>
                            <td>
                              <span className="bill-item-name">{item.item_name}</span>
                              {item.description && <span className="bill-item-desc">{item.description}</span>}
                            </td>
                            <td className="bill-item-amount">{fmtMoney(item.amount, bill.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="bill-item-total-label">Total</td>
                          <td className="bill-item-total-val">{fmtMoney(bill.total_amount, bill.currency)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Installment info */}
                {bill.allow_installments && (
                  <div className="bill-installment-info">
                    <p className="bill-installment-title">Installment Plan</p>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <p className="bill-amount-label">Installments</p>
                        <p className="bill-installment-val">{bill.installment_count}</p>
                      </div>
                      <div>
                        <p className="bill-amount-label">Min. Payment</p>
                        <p className="bill-installment-val">{fmtMoney(bill.min_payment, bill.currency)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pay form */}
                {remaining > 0 && (
                  <div className="bill-pay-form">
                    <p className="bill-pay-title">Make a Payment</p>
                    <label className="sr-form-label">Amount ({bill.currency || "NGN"}) *</label>
                    <input
                      type="number"
                      className="sr-form-input"
                      min={bill.allow_installments && bill.min_payment ? bill.min_payment : 1}
                      max={remaining}
                      value={payForm.amount}
                      onChange={(e) => { setPayForm((p) => ({ ...p, amount: e.target.value })); setPayError(""); }}
                      placeholder={`Max: ${fmtMoney(remaining, bill.currency)}`}
                    />
                    {payError && <p className="bill-pay-error">{payError}</p>}
                    <Button onClick={handlePay} disabled={paying} style={{ marginTop: 8 }}>
                      {paying ? "Processing..." : "Pay Now"}
                    </Button>
                  </div>
                )}

                {/* Payment history */}
                {(selected.payments || []).length > 0 && (
                  <div>
                    <span className="sc-section-label">Payment History ({selected.payments.length})</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selected.payments.map((p) => (
                        <div key={p.payment_id} className="bill-payment-row"
                          onClick={() => setShowReceipt({ ...p, bill, userBill: selected })}>
                          <div>
                            <p className="bill-item-name">{fmtMoney(p.amount, bill.currency)}</p>
                            <p className="bill-item-desc">{p.payment_method || "—"} · {fmtFull(p.paid_at)}</p>
                          </div>
                          <span className="cs-action-link">
                            Receipt
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="cs-panel-footer">
                <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              </div>
            </div>
          );
        })()}
      </SlideInMenu>

      {/* Receipt panel */}
      <SlideInMenu isShow={!!showReceipt} onClose={() => setShowReceipt(null)} width="480px">
        {showReceipt && (
          <div className="cs-panel">
            <div className="cs-panel-header default">
              <span className="cs-panel-header-deco" aria-hidden="true"/>
              <div className="cs-panel-header-content">
                <div className="cs-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cs-panel-header-text">
                  <h2>Payment Receipt</h2>
                  <p>Receipt No: {showReceipt.payment_id}</p>
                </div>
              </div>
            </div>

            <div className="cs-panel-body">
              <div ref={receiptRef} className="bill-receipt">
                <div className="bill-receipt-school">
                  {school.logo_url && typeof school.logo_url === "string" ? (
                    <img src={school.logo_url} alt={school.school_name} className="bill-receipt-logo"/>
                  ) : (
                    <div className="bill-receipt-logo-ph">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <h3 className="bill-receipt-school-name">{school.school_name || "School"}</h3>
                  {school.address && <p className="bill-receipt-school-addr">{school.address}</p>}
                  <p className="bill-receipt-title">Payment Receipt</p>
                </div>

                <div className="bill-receipt-section">
                  <p className="bill-receipt-section-label">Paid By</p>
                  <p className="bill-receipt-section-value">{studentName}</p>
                </div>

                <div className="bill-receipt-section">
                  <p className="bill-receipt-section-label">Bill</p>
                  <p className="bill-receipt-section-value">{showReceipt.bill?.fee_name}</p>
                  <p className="bill-item-desc">{showReceipt.bill?.category}</p>
                </div>

                {[
                  ["Amount Paid",       fmtMoney(showReceipt.amount, showReceipt.bill?.currency)],
                  ["Payment Method",    showReceipt.payment_method || "—"],
                  ["Reference",         showReceipt.reference || "—"],
                  ["Date & Time",       fmtFull(showReceipt.paid_at)],
                  ["Total Paid So Far", fmtMoney(showReceipt.userBill?.amount_paid, showReceipt.bill?.currency)],
                  ["Balance Remaining", fmtMoney((showReceipt.userBill?.amount_due || 0) - (showReceipt.userBill?.amount_paid || 0), showReceipt.bill?.currency)],
                ].map(([label, value]) => (
                  <div key={label} className="bill-receipt-row">
                    <span className="bill-receipt-row-label">{label}</span>
                    <span className="bill-receipt-row-value">{value}</span>
                  </div>
                ))}

                <div className="bill-receipt-status">
                  <span className={`bill-badge ${STATUS_CLASS[showReceipt.userBill?.payment_status || "unpaid"] || "bill-badge-unpaid"}`}>
                    {(showReceipt.userBill?.payment_status || "").toUpperCase()}
                  </span>
                </div>
                <p className="bill-receipt-thanks">Thank you for your payment.</p>
              </div>
            </div>

            <div className="cs-panel-footer">
              <Button variant="secondary" onClick={() => setShowReceipt(null)}>Close</Button>
              <Button variant="secondary" onClick={handlePrintReceipt}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
                  <polyline points="6,9 6,2 18,2 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="6" y="14" width="12" height="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Print
              </Button>
              <Button onClick={handleExportPdf}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Export PDF
              </Button>
            </div>
          </div>
        )}
      </SlideInMenu>
    </StudentDetailTopTab>
  );
};

export default Bill;
