import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Routes, Route } from "react-router-dom";
import useBill from "../../../../api_call/useBill";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import BillOverview from "./BillOverview";
import BillReports from "./BillReports";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import "./BillDetail.css";

const BillDetail = () => {
  const { billId, schoolId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getBillById, getRecipientsPaginated, deleteBill, updateBillStatus, recordPayment, updatePayment, deletePayment } = useBill();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit   = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.delete;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allRecipients, setAllRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "Cash", reference: "", note: "" });
  const [payError, setPayError] = useState("");
  const [paying, setPaying] = useState(false);
  const [tableReloadKey, setTableReloadKey] = useState(0);

  // edit payment state
  const [editingPayment, setEditingPayment] = useState(null); // payment object being edited
  const [editForm, setEditForm] = useState({ amount: "", method: "Cash", reference: "", note: "" });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // delete payment state
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const base = `/admin/${schoolId}/fee_billing/bill/${billId}`;
  const tabs = [
    { label: "Overview",   path: base },
    { label: "Recipients", path: `${base}/recipients` },
    { label: "Reports",    path: `${base}/reports` },
  ];

  const isActive = (path) => {
    if (path === base) return location.pathname === base || location.pathname === `${base}/`;
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    getBillById(billId).then((res) => {
      if (res.success) setBill(res.data);
      setLoading(false);
    });
    getRecipientsPaginated(billId, { page: 1, limit: 9999 }).then((res) => {
      if (res.success) setAllRecipients(res.data || []);
    });
  }, [billId]);

  const refreshBill = () => {
    getBillById(billId).then((res) => { if (res.success) setBill(res.data); });
  };

  const openRecipient = (row) => {
    setSelectedRecipient(row);
    setPayForm({ amount: "", method: "Cash", reference: "", note: "" });
    setPayError("");
  };

  const handlePay = async () => {
    if (!canEdit) { addNotification("No permission to record payments.", "error"); return; }
    const amount = parseFloat(payForm.amount);
    const remaining = (selectedRecipient.amount_due || 0) - (selectedRecipient.amount_paid || 0);
    if (!amount || amount <= 0) { setPayError("Enter a valid amount."); return; }
    if (amount > remaining)     { setPayError(`Amount cannot exceed balance of ₦${remaining.toLocaleString()}.`); return; }
    if (bill.allow_installments && bill.min_payment && amount < bill.min_payment) {
      setPayError(`Minimum installment is ₦${Number(bill.min_payment).toLocaleString()}.`); return;
    }
    setPaying(true); setPayError("");
    const res = await recordPayment(billId, selectedRecipient.user_bill_id, {
      amount,
      payment_method:   payForm.method,
      reference:        payForm.reference || null,
      note:             payForm.note     || null,
      recorded_by_name: admin?.username || user?.full_name || user?.username || "Admin",
    }, admin?.admin_id || user?.user_id);
    setPaying(false);
    if (res.success) {
      addNotification("Payment recorded successfully.", "success");
      setSelectedRecipient(res.data);
      setPayForm({ amount: "", method: "Cash", reference: "", note: "" });
      refreshBill();
      setTableReloadKey((k) => k + 1);
    } else {
      setPayError(res.message || "Payment failed. Please try again.");
    }
  };

  const openEditPayment = (p) => {
    setEditingPayment(p);
    setEditForm({
      amount:    String(p.amount),
      method:    p.payment_method || "Cash",
      reference: p.reference || "",
      note:      p.note      || "",
    });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!canEdit) { addNotification("No permission to edit payments.", "error"); return; }
    const amount = parseFloat(editForm.amount);
    const otherPaid = (selectedRecipient.payments || [])
      .filter((p) => p.payment_id !== editingPayment.payment_id)
      .reduce((s, p) => s + p.amount, 0);
    const maxAllowed = (selectedRecipient.amount_due || 0) - otherPaid;
    if (!amount || amount <= 0) { setEditError("Enter a valid amount."); return; }
    if (amount > maxAllowed)    { setEditError(`Amount cannot exceed ₦${maxAllowed.toLocaleString()}.`); return; }
    setEditSaving(true); setEditError("");
    const res = await updatePayment(billId, selectedRecipient.user_bill_id, editingPayment.payment_id, {
      amount,
      payment_method:   editForm.method,
      reference:        editForm.reference || null,
      note:             editForm.note      || null,
      modified_by_name: admin?.username   || user?.full_name || user?.username || "Admin",
      modified_by_id:   admin?.admin_id    || user?.user_id,
    });
    setEditSaving(false);
    if (res.success) {
      addNotification("Payment updated.", "success");
      setSelectedRecipient(res.data);
      setEditingPayment(null);
      refreshBill();
      setTableReloadKey((k) => k + 1);
    } else {
      setEditError(res.message || "Update failed.");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!canDelete) { addNotification("No permission to delete payments.", "error"); return; }
    setDeletingPaymentId(paymentId);
    const res = await deletePayment(billId, selectedRecipient.user_bill_id, paymentId, admin?.admin_id || user?.user_id);
    setDeletingPaymentId(null);
    setDeleteConfirmId(null);
    if (res.success) {
      addNotification("Payment deleted.", "success");
      setSelectedRecipient(res.data);
      refreshBill();
      setTableReloadKey((k) => k + 1);
    } else {
      addNotification(res.message || "Delete failed.", "error");
    }
  };

  const fetchRecipients = useCallback(
    async (params) => getRecipientsPaginated(billId, params),
    [billId]
  );

  const recipientColumns = [
    { label: "Name", accessor: "user_name", render: (v) => v || "—" },
    { label: "Type", accessor: "user_type", render: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—" },
    { label: "Amount Due",  accessor: "amount_due",  render: (v) => `₦${Number(v).toLocaleString()}` },
    { label: "Amount Paid", accessor: "amount_paid", render: (v) => `₦${Number(v).toLocaleString()}` },
    {
      label: "Status",
      accessor: "payment_status",
      render: (v) => (
        <span className={`bd-pay-badge ${v}`}>{v}</span>
      ),
    },
    { label: "Paid At", accessor: "paid_at", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  ];

  if (loading) return <div className="bd-loading">Loading...</div>;
  if (!bill)   return <div className="bd-loading">Bill not found.</div>;

  const statusBg    = bill.status === "Active" ? "#dcfce7" : "#fee2e2";
  const statusColor = bill.status === "Active" ? "#166634" : "#dc2626";

  return (
    <>
      <div className="bd-page">

        {/* ── Banner ── */}
        <div className="bd-banner">
          <span className="bd-banner-deco" aria-hidden="true" />
          <div className="bd-banner-content">
            <div className="bd-banner-left">
              <button className="bd-back-btn" onClick={() => navigate(`/admin/${schoolId}/fee_billing`)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </button>
              <h1 className="bd-banner-title">{bill.fee_name}</h1>
              <p className="bd-banner-sub">
                {bill.fee_code ? `${bill.fee_code} · ` : ""}
                {bill.category || ""} · ₦{Number(bill.total_amount).toLocaleString()}
                {" · "}
                <span className="bd-status-pill" style={{ background: statusBg, color: statusColor }}>
                  {bill.status}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bd-tabs-bar">
          <div className="bd-tabs-nav">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                className={`bd-tab ${isActive(tab.path) ? "active" : ""}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="bd-content">
          <Routes>
            <Route path="/" element={
              <BillOverview
                billData={bill}
                onStatusChange={async (status) => {
                  if (!canEdit) { addNotification("No permission to change bill status.", "error"); return { success: false }; }
                  const res = await updateBillStatus(billId, status, user?.admin?.admin_id || user?.user_id);
                  if (res.success) refreshBill();
                  return res;
                }}
                onDelete={async () => {
                  if (!canDelete) { addNotification("No permission to delete this bill.", "error"); return { success: false }; }
                  const res = await deleteBill(billId, user?.admin?.admin_id || user?.user_id);
                  if (res.success) navigate(`/admin/${schoolId}/fee_billing`);
                  return res;
                }}
              />
            } />
            <Route path="/recipients" element={
              <InnerTabCon>
                <ServerSmartTable
                  columns={recipientColumns}
                  fetchData={fetchRecipients}
                  onRowClick={(row) => openRecipient(row)}
                  initialPageSize={15}
                  showcreatbut={false}
                  reloadKey={tableReloadKey}
                />
              </InnerTabCon>
            } />
            <Route path="/reports" element={<BillReports billData={bill} recipients={allRecipients} />} />
          </Routes>
        </div>
      </div>

      {/* ── Recipient detail panel ── */}
      <SlideInMenu isShow={!!selectedRecipient} onClose={() => setSelectedRecipient(null)} width="500px">
        {selectedRecipient && (
          <div className="bd-recipient-panel">
            <div className="bd-rp-header">
              <span className="bd-rp-deco" aria-hidden="true" />
              <div className="bd-rp-header-content">
                <div className="bd-rp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="bd-rp-header-text">
                  <h2>{selectedRecipient.user_name || "—"}</h2>
                  <p style={{ textTransform: "capitalize" }}>{selectedRecipient.user_type}</p>
                </div>
              </div>
            </div>

            <div className="bd-rp-body">
              {/* Summary cards */}
              <div className="bd-rp-summary-grid">
                {[
                  { label: "Amount Due",  value: `₦${Number(selectedRecipient.amount_due).toLocaleString()}` },
                  { label: "Amount Paid", value: `₦${Number(selectedRecipient.amount_paid).toLocaleString()}` },
                  { label: "Balance",     value: `₦${(Number(selectedRecipient.amount_due) - Number(selectedRecipient.amount_paid)).toLocaleString()}` },
                  { label: "Status",      value: selectedRecipient.payment_status },
                ].map(({ label, value }) => (
                  <div key={label} className="bd-rp-summary-card">
                    <span className="bd-rp-summary-label">{label}</span>
                    <span className="bd-rp-summary-value">{value}</span>
                  </div>
                ))}
              </div>

              {/* ── Add Payment form ── */}
              {canEdit && (selectedRecipient.amount_due - selectedRecipient.amount_paid) > 0 && (
                <div className="bd-rp-section">
                  <span className="bd-rp-section-title">Record Payment</span>

                  <div className="bd-rp-pay-row">
                    <div className="bd-rp-pay-field">
                      <label className="bd-rp-pay-label">Amount (₦) *</label>
                      <input
                        type="number"
                        className="bd-rp-pay-input"
                        min={bill.allow_installments && bill.min_payment ? bill.min_payment : 1}
                        max={selectedRecipient.amount_due - selectedRecipient.amount_paid}
                        placeholder={`Max ₦${(selectedRecipient.amount_due - selectedRecipient.amount_paid).toLocaleString()}`}
                        value={payForm.amount}
                        onChange={(e) => { setPayForm((p) => ({ ...p, amount: e.target.value })); setPayError(""); }}
                      />
                    </div>
                    <div className="bd-rp-pay-field">
                      <label className="bd-rp-pay-label">Method</label>
                      <select
                        className="bd-rp-pay-input"
                        value={payForm.method}
                        onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}
                      >
                        {["Cash", "Bank Transfer", "Card", "Cheque", "Online", "Other"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bd-rp-pay-field">
                    <label className="bd-rp-pay-label">Reference (optional)</label>
                    <input
                      type="text"
                      className="bd-rp-pay-input"
                      placeholder="Transaction ref / receipt no"
                      value={payForm.reference}
                      onChange={(e) => setPayForm((p) => ({ ...p, reference: e.target.value }))}
                    />
                  </div>

                  <div className="bd-rp-pay-field">
                    <label className="bd-rp-pay-label">Note (optional)</label>
                    <textarea
                      className="bd-rp-pay-input bd-rp-pay-textarea"
                      rows={2}
                      placeholder="Any additional notes..."
                      value={payForm.note}
                      onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                    />
                  </div>

                  {payError && <p className="bd-rp-pay-error">{payError}</p>}

                  <button
                    className="bd-rp-pay-btn"
                    onClick={handlePay}
                    disabled={paying}
                  >
                    {paying ? "Processing..." : "Record Payment"}
                  </button>
                </div>
              )}

              {/* Payment history */}
              <div className="bd-rp-section">
                <span className="bd-rp-section-title">
                  Payment History ({(selectedRecipient.payments || []).length})
                </span>
                {(selectedRecipient.payments || []).length === 0 ? (
                  <p className="bd-rp-empty">No payments recorded.</p>
                ) : (
                  <div className="bd-rp-payments">
                    {[...selectedRecipient.payments].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at)).map((p, i) => (
                      <div key={p.payment_id || i} className="bd-rp-payment-item">

                        {/* ── Edit mode ── */}
                        {editingPayment?.payment_id === p.payment_id ? (
                          <div className="bd-rp-edit-form">
                            <div className="bd-rp-pay-row">
                              <div className="bd-rp-pay-field">
                                <label className="bd-rp-pay-label">Amount (₦) *</label>
                                <input
                                  type="number"
                                  className="bd-rp-pay-input"
                                  value={editForm.amount}
                                  onChange={(e) => { setEditForm((f) => ({ ...f, amount: e.target.value })); setEditError(""); }}
                                />
                              </div>
                              <div className="bd-rp-pay-field">
                                <label className="bd-rp-pay-label">Method</label>
                                <select
                                  className="bd-rp-pay-input"
                                  value={editForm.method}
                                  onChange={(e) => setEditForm((f) => ({ ...f, method: e.target.value }))}
                                >
                                  {["Cash", "Bank Transfer", "Card", "Cheque", "Online", "Other"].map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="bd-rp-pay-field">
                              <label className="bd-rp-pay-label">Reference</label>
                              <input
                                type="text"
                                className="bd-rp-pay-input"
                                value={editForm.reference}
                                onChange={(e) => setEditForm((f) => ({ ...f, reference: e.target.value }))}
                              />
                            </div>
                            <div className="bd-rp-pay-field">
                              <label className="bd-rp-pay-label">Note</label>
                              <textarea
                                className="bd-rp-pay-input bd-rp-pay-textarea"
                                rows={2}
                                value={editForm.note}
                                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                              />
                            </div>
                            {editError && <p className="bd-rp-pay-error">{editError}</p>}
                            <div className="bd-rp-edit-actions">
                              <button className="bd-rp-edit-cancel-btn" onClick={() => setEditingPayment(null)} disabled={editSaving}>
                                Cancel
                              </button>
                              <button className="bd-rp-edit-save-btn" onClick={handleEditSave} disabled={editSaving}>
                                {editSaving ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </div>
                        ) : (

                          /* ── View mode ── */
                          <>
                            <div className="bd-rp-payment-top">
                              <span className="bd-rp-payment-amount">₦{Number(p.amount).toLocaleString()}</span>
                              <span className="bd-rp-payment-date">
                                {p.paid_at ? new Date(p.paid_at).toLocaleString() : "—"}
                              </span>
                            </div>
                            <div className="bd-rp-payment-meta">
                              {p.payment_method && <span style={{ textTransform: "capitalize" }}>{p.payment_method.replace(/_/g, " ")}</span>}
                              {p.reference && <span>Ref: {p.reference}</span>}
                              {p.recorded_by_name && <span>By: {p.recorded_by_name}</span>}
                            </div>
                            {p.note && <p className="bd-rp-payment-note">{p.note}</p>}

                            {/* action buttons */}
                            {(canEdit || canDelete) && (
                              <div className="bd-rp-payment-actions">
                                {canEdit && (
                                  <button className="bd-rp-action-btn edit" onClick={() => openEditPayment(p)}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Edit
                                  </button>
                                )}
                                {canDelete && (
                                  deleteConfirmId === p.payment_id ? (
                                    <div className="bd-rp-delete-confirm">
                                      <span>Delete?</span>
                                      <button
                                        className="bd-rp-action-btn danger"
                                        onClick={() => handleDeletePayment(p.payment_id)}
                                        disabled={deletingPaymentId === p.payment_id}
                                      >
                                        {deletingPaymentId === p.payment_id ? "..." : "Yes"}
                                      </button>
                                      <button className="bd-rp-action-btn" onClick={() => setDeleteConfirmId(null)}>No</button>
                                    </div>
                                  ) : (
                                    <button className="bd-rp-action-btn danger" onClick={() => setDeleteConfirmId(p.payment_id)}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                        <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      Delete
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="bd-rp-issued">
                Bill issued: {selectedRecipient.created_at ? new Date(selectedRecipient.created_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
        )}
      </SlideInMenu>
    </>
  );
};

export default BillDetail;
