import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import useBill from "../../../../api_call/useBill";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import "./BillReports.css";

const Stat = ({ label, value, sub, color }) => (
  <div className="br-stat-card">
    <span className="br-stat-label">{label}</span>
    <span className="br-stat-value" style={color ? { color } : undefined}>{value}</span>
    {sub && <span className="br-stat-sub">{sub}</span>}
  </div>
);

const BillReports = ({ billData }) => {
  const { billId } = useParams();
  const { getRecipientsPaginated } = useBill();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!billId) return;
    setLoading(true);
    getRecipientsPaginated(billId, { page: 1, limit: 9999 }).then((res) => {
      if (res.success) setRecipients(res.data || []);
      setLoading(false);
    });
  }, [billId]);

  if (!billData) return null;
  if (loading) return <InnerTabCon><LoadingData message="Loading report data..." /></InnerTabCon>;

  const total    = recipients.length;
  const paid     = recipients.filter((r) => r.payment_status === "paid").length;
  const partial  = recipients.filter((r) => r.payment_status === "partial").length;
  const unpaid   = recipients.filter((r) => r.payment_status === "unpaid").length;

  const totalDue         = recipients.reduce((s, r) => s + Number(r.amount_due  || 0), 0);
  const totalCollected   = recipients.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
  const totalOutstanding = totalDue - totalCollected;
  const collectionRate   = total > 0 ? Math.round((paid / total) * 100) : 0;

  const methodMap = {};
  recipients.forEach((r) => {
    (r.payments || []).forEach((p) => {
      const m = p.payment_method || "Unknown";
      if (!methodMap[m]) methodMap[m] = { count: 0, total: 0 };
      methodMap[m].count += 1;
      methodMap[m].total += Number(p.amount || 0);
    });
  });
  const methods = Object.entries(methodMap).map(([method, data]) => ({ method, ...data }));

  const typeMap = {};
  recipients.forEach((r) => {
    const t = r.user_type || "unknown";
    if (!typeMap[t]) typeMap[t] = { total: 0, paid: 0, collected: 0 };
    typeMap[t].total += 1;
    if (r.payment_status === "paid") typeMap[t].paid += 1;
    typeMap[t].collected += Number(r.amount_paid || 0);
  });

  const rateColor = collectionRate >= 80 ? "#166634" : collectionRate >= 50 ? "#92400e" : "#dc2626";

  return (
    <InnerTabCon>
      <div className="br-wrap">

        {/* Summary stats */}
        <div className="br-stats-grid">
          <Stat label="Total Recipients" value={total} />
          <Stat label="Collection Rate"  value={`${collectionRate}%`} color={rateColor} />
          <Stat label="Total Expected"   value={`₦${totalDue.toLocaleString()}`} />
          <Stat label="Total Collected"  value={`₦${totalCollected.toLocaleString()}`} color="#166634" />
          <Stat label="Outstanding"      value={`₦${totalOutstanding.toLocaleString()}`} color={totalOutstanding > 0 ? "#dc2626" : "#166634"} />
          <Stat label="Avg per Recipient" value={total > 0 ? `₦${Math.round(totalCollected / total).toLocaleString()}` : "—"} />
        </div>

        {/* Payment status breakdown */}
        <div className="br-section">
          <span className="br-section-title">Payment Status Breakdown</span>
          <div className="br-status-grid">
            {[
              { label: "Paid",    count: paid,    cls: "paid" },
              { label: "Partial", count: partial, cls: "partial" },
              { label: "Unpaid",  count: unpaid,  cls: "unpaid" },
            ].map(({ label, count, cls }) => (
              <div key={label} className={`br-status-card ${cls}`}>
                <span className="br-status-count">{count}</span>
                <span className="br-status-label">{label}</span>
                <span className="br-status-pct">
                  {total > 0 ? `${Math.round((count / total) * 100)}%` : "0%"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By user type */}
        {Object.keys(typeMap).length > 0 && (
          <div className="br-section br-section-alt">
            <span className="br-section-title">By Recipient Type</span>
            <div className="br-type-list">
              {Object.entries(typeMap).map(([type, data]) => (
                <div key={type} className="br-type-row">
                  <span className="br-type-name">{type}</span>
                  <span className="br-type-detail">{data.total} recipients</span>
                  <span className="br-type-paid">{data.paid} paid</span>
                  <span className="br-type-collected">₦{data.collected.toLocaleString()} collected</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment methods */}
        {methods.length > 0 && (
          <div className="br-section br-section-alt">
            <span className="br-section-title">Payment Methods</span>
            <div className="br-method-list">
              {methods.map(({ method, count, total: amt }) => (
                <div key={method} className="br-method-row">
                  <span className="br-method-name">{method}</span>
                  <span className="br-method-count">{count} transaction{count !== 1 ? "s" : ""}</span>
                  <span className="br-method-amount">₦{amt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {methods.length === 0 && total > 0 && (
          <div className="br-empty">No payments recorded yet.</div>
        )}

      </div>
    </InnerTabCon>
  );
};

export default BillReports;
