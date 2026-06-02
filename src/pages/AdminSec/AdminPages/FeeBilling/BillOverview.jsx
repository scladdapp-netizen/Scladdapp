import { useState } from "react";
import Button from "../../../../components/Button/Button";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import "./BillOverview.css";

const BillOverview = ({ billData, onStatusChange, onDelete }) => {
  if (!billData) return null;
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit   = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.edit;

  const handleStatusClick = () => {
    if (!canEdit) { addNotification("No permission to change bill status.", "error"); return; }
    billData.status === "Active" ? setShowDeactivateModal(true) : setShowActivateModal(true);
  };

  const handleStatusConfirm = async (newStatus) => {
    setLoading(true);
    const res = await onStatusChange(newStatus);
    setLoading(false);
    if (res.success) {
      addNotification(`Bill ${newStatus.toLowerCase()}d`, "success");
      setShowDeactivateModal(false);
      setShowActivateModal(false);
    } else {
      addNotification(res.message || "Failed", "error");
    }
  };

  const items = (() => {
    try {
      return typeof billData.bill_items === "string"
        ? JSON.parse(billData.bill_items)
        : billData.bill_items || [];
    } catch { return []; }
  })();

  const metaCards = [
    { label: "Category",   value: billData.category || "—" },
    { label: "Target",     value: billData.target_type?.replace(/_/g, " ") || "—" },
    { label: "Status",     value: billData.status },
    { label: "Type",       value: billData.mandatory ? "Mandatory" : "Optional" },
    { label: "Recipients", value: String(billData.recipients_count ?? "—") },
    { label: "Paid",       value: String(billData.paid_count ?? "—") },
  ];

  return (
    <InnerTabCon>
      <div className="bo-wrap">

        <div className="bo-actions-row">
          <Button variant="secondary" onClick={handleStatusClick} disabled={loading}>
            {billData.status === "Active" ? "Deactivate" : "Activate"}
          </Button>
        </div>

        {/* Meta cards */}
        <div className="bo-meta-grid">
          {metaCards.map(({ label, value }) => (
            <div key={label} className="bo-meta-card">
              <span className="bo-meta-label">{label}</span>
              <span className="bo-meta-value">{value || "—"}</span>
            </div>
          ))}
        </div>

        {/* Amount */}
        <div className="bo-section">
          <span className="bo-section-title">Total Amount</span>
          <p className="bo-amount">
            {billData.currency} {Number(billData.total_amount).toLocaleString()}
          </p>
          {billData.allow_installments && (
            <p className="bo-installment-note">
              {billData.installment_count} installments · min ₦{Number(billData.min_payment || 0).toLocaleString()} each
            </p>
          )}
        </div>

        {/* Description */}
        {billData.description && (
          <div className="bo-section">
            <span className="bo-section-title">Description</span>
            <p className="bo-description-text">{billData.description}</p>
          </div>
        )}

        {/* Bill items */}
        {items.length > 0 && (
          <div className="bo-section bo-section-alt">
            <span className="bo-section-title">Bill Items</span>
            <div className="bo-items-list">
              {items.map((item, i) => (
                <div key={i} className="bo-item-row">
                  <span className="bo-item-name">{item.item_name}</span>
                  <span className="bo-item-amount">₦{Number(item.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="bo-item-total">
                <span>Total</span>
                <span>{billData.currency} {Number(billData.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Created info */}
        <div className="bo-section bo-section-alt">
          <span className="bo-section-title">Created</span>
          <div className="bo-created-row">
            <span>By {billData.created_by_name || "—"}</span>
            <span>{billData.created_at ? new Date(billData.created_at).toLocaleString() : "—"}</span>
          </div>
        </div>

      </div>

      {/* Deactivate panel */}
      <SlideInMenu isShow={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} width="420px">
        <div className="bo-confirm-panel">
          <div className="bo-confirm-header danger">
            <span className="bo-confirm-deco" aria-hidden="true" />
            <div className="bo-confirm-header-content">
              <div className="bo-confirm-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="bo-confirm-header-text">
                <h3>Deactivate Bill</h3>
                <p>This action can be reversed later</p>
              </div>
            </div>
          </div>
          <div className="bo-confirm-body">
            <div className="bo-confirm-name">{billData.fee_name}</div>
            <div className="bo-confirm-warn">You are about to deactivate this bill. It will be hidden from active fee listings but all records will be preserved.</div>
          </div>
          <div className="bo-confirm-footer">
            <Button variant="secondary" onClick={() => setShowDeactivateModal(false)} disabled={loading}>Cancel</Button>
            <Button variant="danger" onClick={() => handleStatusConfirm("Inactive")} disabled={loading}>
              {loading ? "Deactivating..." : "Deactivate Bill"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Activate panel */}
      <SlideInMenu isShow={showActivateModal} onClose={() => setShowActivateModal(false)} width="420px">
        <div className="bo-confirm-panel">
          <div className="bo-confirm-header success">
            <span className="bo-confirm-deco" aria-hidden="true" />
            <div className="bo-confirm-header-content">
              <div className="bo-confirm-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="bo-confirm-header-text">
                <h3>Activate Bill</h3>
                <p>Restore this bill to active status</p>
              </div>
            </div>
          </div>
          <div className="bo-confirm-body">
            <div className="bo-confirm-name">{billData.fee_name}</div>
            <div className="bo-confirm-info">Activating this bill will make it visible and active again for all recipients.</div>
          </div>
          <div className="bo-confirm-footer">
            <Button variant="secondary" onClick={() => setShowActivateModal(false)} disabled={loading}>Cancel</Button>
            <Button onClick={() => handleStatusConfirm("Active")} disabled={loading}>
              {loading ? "Activating..." : "Activate Bill"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default BillOverview;
