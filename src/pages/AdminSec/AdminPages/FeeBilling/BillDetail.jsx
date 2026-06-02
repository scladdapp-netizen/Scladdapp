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
  const { getBillById, getRecipientsPaginated, deleteBill, updateBillStatus } = useBill();
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
                  onRowClick={(row) => setSelectedRecipient(row)}
                  initialPageSize={15}
                  showcreatbut={false}
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

              {/* Payment history */}
              <div className="bd-rp-section">
                <span className="bd-rp-section-title">
                  Payment History ({(selectedRecipient.payments || []).length})
                </span>
                {(selectedRecipient.payments || []).length === 0 ? (
                  <p className="bd-rp-empty">No payments recorded.</p>
                ) : (
                  <div className="bd-rp-payments">
                    {selectedRecipient.payments.map((p, i) => (
                      <div key={p.payment_id || i} className="bd-rp-payment-item">
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
