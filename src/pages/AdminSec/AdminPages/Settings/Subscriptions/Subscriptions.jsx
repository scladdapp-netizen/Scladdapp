import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import { PaystackButton } from "react-paystack";
import { getPriceDetails } from "../../../../../components/ProductPricing/getPriceDetails";
import useSubscription from "../../../../../api_call/useSubscription";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useAlert } from "../../../../../context/AlertProvider/AlertProvider";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import jsPDF from "jspdf";
import {
  FaCreditCard,
  FaHistory,
  FaUpload,
  FaDownload,
  FaCheck,
  FaTimes,
  FaCrown,
  FaDatabase,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaArrowRight,
  FaCog,
  FaEye,
  FaFileInvoiceDollar,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import "./Subscriptions.css";

const Subscriptions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId } = useParams();
  const { user, updateSubscription } = useAuth();
  const { showAlert } = useAlert();
  const { addNotification } = useNotification();
  const { getSubscriptionDashboard, getPlans, upgradeSubscription, cancelSubscription, getPaymentsPaginated } = useSubscription();
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  const [cancelling, setCancelling] = useState(false);

  const getActiveTabFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    const validTabs = ["dashboard", "upgrade", "billing"];
    return validTabs.includes(tab) ? tab : "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromUrl());
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isBillingDetailOpen, setIsBillingDetailOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [priceView, setPriceView] = useState("monthly");

  // Real data
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [plans, setPlans] = useState([]);

  // Upgrade modal state
  const [upgradeBillingCycle, setUpgradeBillingCycle] = useState("monthly");
  const [upgradeDuration, setUpgradeDuration] = useState(1);
  const [upgrading, setUpgrading] = useState(false);

  const loadDashboard = () => {
    if (!schoolId) return;
    setDashboardLoading(true);
    getSubscriptionDashboard(schoolId).then((res) => {
      if (res.success) setDashboardData(res.data);
      setDashboardLoading(false);
    });
  };

  useEffect(() => { loadDashboard(); }, [schoolId]);

  useEffect(() => {
    getPlans().then((res) => { if (res.success) setPlans(res.data); });
  }, []);

  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.search]);

  // Function to handle tab changes and update URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`?tab=${tab}`, { replace: true });
  };

  // Fetch payments for ServerSmartTable
  const fetchPayments = useCallback(
    (params) => getPaymentsPaginated(schoolId, params),
    [schoolId]
  );

  const billingColumns = [
    {
      label: "Date",
      accessor: "payment_date",
      render: (v) => v ? new Date(v).toLocaleDateString() : "—",
    },
    {
      label: "Plan",
      accessor: "plan_name",
    },
    {
      label: "Billing Cycle",
      accessor: "billing_cycle",
      render: (v) => (
        <span className={`billing-cycle-badge ${v || "monthly"}`}>
          {v ? v.charAt(0).toUpperCase() + v.slice(1) : "—"}
        </span>
      ),
    },
    {
      label: "Amount",
      accessor: "amount_paid",
      render: (v, row) => (
        <span className="amount">
          {row.currency} {Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      label: "Method",
      accessor: "payment_method",
      render: (v) => v ? v.charAt(0).toUpperCase() + v.slice(1) : "—",
    },
    {
      label: "Status",
      accessor: "payment_status",
      render: (v) => (
        <span className={`status-badge ${v}`}>
          {v === "completed" ? <FaCheck /> : <FaTimes />}
          {v ? v.charAt(0).toUpperCase() + v.slice(1) : "—"}
        </span>
      ),
    },
    {
      label: "Ref",
      accessor: "provider_transaction_id",
      render: (v) => v ? <span style={{ fontSize: 11, color: "#6b7280" }}>{v}</span> : "—",
    },
  ];

  const getUsagePercentage = (current, limit) => {
    if (limit == null || limit <= 0) return 0;
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return "#ef4444";
    if (percentage >= 75) return "#f59e0b";
    return "#10b981";
  };

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setUpgradeBillingCycle("monthly");
    setUpgradeDuration(1);
    setIsUpgradeModalOpen(true);
  };

  // Price helpers for upgrade modal
  const getUpgradeMonthlyRate = () => {
    if (!selectedPlan) return 0;
    if (selectedPlan.plan_type === "Free") return 0;
    switch (upgradeBillingCycle) {
      case "quarterly": return parseFloat(selectedPlan.quataly_price) || 0;
      case "yearly": return parseFloat(selectedPlan.yearly_price) || 0;
      default: return parseFloat(selectedPlan.monthly_price) || 0;
    }
  };

  const getUpgradeTotalMonths = () => {
    const map = { monthly: 1, quarterly: 3, yearly: 12 };
    return (map[upgradeBillingCycle] || 1) * upgradeDuration;
  };

  const getUpgradeTotalAmount = () => {
    if (!selectedPlan || selectedPlan.plan_type === "Free") return 0;
    return getUpgradeMonthlyRate() * getUpgradeTotalMonths();
  };

  // Called after Paystack success (or free plan confirm)
  const handleConfirmUpgrade = async (transactionRef = null) => {
    if (!selectedPlan) return;
    setUpgrading(true);
    const totalMonths = getUpgradeTotalMonths();
    const amountPaid = getUpgradeTotalAmount();

    const res = await upgradeSubscription(schoolId, {
      plan_id: selectedPlan["$id"],
      billing_cycle: upgradeBillingCycle,
      total_months: totalMonths,
      amount_paid: amountPaid,
      transaction_reference: transactionRef,
      email: user?.admin?.email || "",
    });

    setUpgrading(false);
    setIsUpgradeModalOpen(false);

    if (res.success) {
      // Update session so SubscriptionGuard unblocks immediately
      updateSubscription(res.data.subscription);
      loadDashboard();
    }
  };

  const handleViewBilling = (billing) => {
    setSelectedBilling(billing);
    setIsBillingDetailOpen(true);
  };

  const handleDownloadInvoice = (billing) => {
    console.log("Downloading invoice:", billing.invoice);
    // Handle invoice download
  };

  const handleBillingRowClick = (row) => {
    handleViewBilling(row);
  };

  const handleCancelSubscription = () => {
    showAlert(
      "Cancel this subscription? You will keep view access, but add, edit, and delete will be locked until you renew.",
      async () => {
        setCancelling(true);
        const res = await cancelSubscription(schoolId);
        setCancelling(false);
        if (res.success) {
          updateSubscription(res.data.subscription);
          addNotification("Subscription cancelled.", "success");
          loadDashboard();
        } else {
          addNotification(res.message || "Failed to cancel subscription.", "error");
        }
      }
    );
  };

  const renderDashboard = () => {
    if (dashboardLoading) return <div style={{ padding: 24 }}>Loading...</div>;
    if (!dashboardData) return <div style={{ padding: 24 }}>No subscription data found.</div>;

    const { subscription, plan, usage } = dashboardData;
    const isExpired =
      new Date(subscription.end_date) < new Date() ||
      subscription.subscription_status === "cancelled" ||
      subscription.subscription_status === "expired";

    return (
    <div className="subscription-dashboard">
      {/* Expired banner */}
      {isExpired && (
        <div className="sub-expired-banner">
          <FaExclamationTriangle className="sub-banner-icon" />
          <div style={{ flex: 1 }}>
            <p className="sub-banner-title">Subscription Expired</p>
            <p className="sub-banner-desc">
              Your subscription expired on {new Date(subscription.end_date).toLocaleDateString()}. All features are currently blocked. Renew to restore access.
            </p>
          </div>
          <Button onClick={() => handleTabChange("upgrade")}>Renew Now</Button>
        </div>
      )}

      {/* Current Plan Overview */}
      <div className="plan-overview-card">
        <div className="plan-header">
          {/* Left — icon + name + status */}
          <div className="plan-header-left">
            <div className="plan-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
              </svg>
            </div>
            <div className="plan-header-meta">
              <h3 className="plan-header-name">{plan?.plan_name || "—"}</h3>
              <span className={`plan-status-badge ${isExpired ? "expired" : subscription.subscription_status}`}>
                {isExpired ? "Expired" : subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1)}
              </span>
            </div>
          </div>

          {/* Right — expiry date + days left */}
          <div className="plan-header-right">
            <div className="plan-header-date-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              <span>{isExpired ? "Expired on" : "Expires"} {new Date(subscription.end_date).toLocaleDateString()}</span>
            </div>
            <p className={`plan-header-days ${isExpired ? "expired" : ""}`}>
              {isExpired ? "Access suspended" : `${subscription.days_left} days remaining`}
            </p>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="usage-stats">
          <div className="usage-item">
            <div className="usage-header">
              <FaCrown className="usage-icon" />
              <span>Sub-Admins</span>
            </div>
            <div className="usage-bar">
              <div className="usage-numbers">
                {usage.subadmins.current} / {usage.subadmins.limit}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getUsagePercentage(usage.subadmins.current, usage.subadmins.limit)}%`,
                    backgroundColor: getUsageColor(getUsagePercentage(usage.subadmins.current, usage.subadmins.limit)),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="usage-item">
            <div className="usage-header">
              <FaDatabase className="usage-icon" />
              <span>Storage</span>
            </div>
            <div className="usage-bar">
              <div className="usage-numbers">
                {usage.storage.current} / {usage.storage.limit} {usage.storage.unit}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getUsagePercentage(usage.storage.current, usage.storage.limit)}%`,
                    backgroundColor: getUsageColor(getUsagePercentage(usage.storage.current, usage.storage.limit)),
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        {plan?.features?.length > 0 && (
          <div className="features-section">
            <h4>Included Features</h4>
            <div className="features-grid">
              {plan.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <FaCheck className="feature-check" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="plan-actions">
          <Button onClick={() => handleTabChange("upgrade")}>
            <FaUpload /> Upgrade Plan
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleTabChange("billing")}
          >
            <FaHistory /> View Billing History
          </Button>
          {!isExpired && (
            <Button
              variant="secondary"
              className="sub-cancel-btn"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              loading={cancelling}
              loadingText="Cancelling..."
            >
              <FaTimes /> Cancel Subscription
            </Button>
          )}
        </div>
      </div>
    </div>
  );};

  const renderUpgrade = () => {
    const currentPlanName = dashboardData?.plan?.plan_name || "";
    const endDate = dashboardData?.subscription?.end_date
      ? new Date(dashboardData.subscription.end_date).toLocaleDateString()
      : "—";

    return (
    <div className="upgrade-section">
      {/* Expiration banner */}
      {dashboardData?.subscription && (() => {
        const isExpired = new Date(dashboardData.subscription.end_date) < new Date()
          || dashboardData.subscription.subscription_status === "cancelled"
          || dashboardData.subscription.subscription_status === "expired";
        const daysLeft = dashboardData.subscription.days_left;
        if (isExpired) return (
          <div className="sub-expired-banner">
            <FaExclamationTriangle className="sub-banner-icon" />
            <div>
              <p className="sub-banner-title">Subscription Expired</p>
              <p className="sub-banner-desc">
                Expired on {endDate}. Choose a plan below to restore access.
              </p>
            </div>
          </div>
        );
        if (daysLeft <= 7) return (
          <div className="sub-warning-banner">
            <span style={{ fontSize: 20 }}>⏰</span>
            <div>
              <p className="sub-banner-title warning">Expiring Soon</p>
              <p className="sub-banner-desc warning">
                Your subscription expires on {endDate} ({daysLeft} day{daysLeft !== 1 ? "s" : ""} left). Renew now to avoid interruption.
              </p>
            </div>
          </div>
        );
        return null;
      })()}

      <div className="upgrade-header">
        <h3>Choose Your Plan</h3>
        <div className="price-toggle">
          <label>View Prices By:</label>
          <select
            value={priceView}
            onChange={(e) => setPriceView(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div className="mkml-plans-grid">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`mkml-plan-card ${plan.featured ? "featured" : ""} ${plan.plan_name === currentPlanName ? "current" : ""}`}
          >
            {plan.featured && <div className="mkml-featured-badge">Most Popular</div>}
            {plan.plan_name === currentPlanName && (() => {
              const isExpired = dashboardData?.subscription?.end_date
                ? new Date(dashboardData.subscription.end_date) < new Date()
                  || dashboardData.subscription.subscription_status === "cancelled"
                  || dashboardData.subscription.subscription_status === "expired"
                : false;
              return isExpired ? null : (
                <div className="mkml-current-badge">Current Plan</div>
              );
            })()}

            <div className="mkml-plan-header">
              <h4 className="mkml-plan-name">{plan.plan_name}</h4>
              <p className="mkml-plan-desc">{plan.description}</p>
            </div>

            <div className="mkml-plan-pricing">
              {getPriceDetails(plan, priceView)}
            </div>

            <div className="mkml-plan-features">
              {[
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/></svg>, text: "Unlimited students" },
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>, text: "Unlimited staff" },
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>, text: `Up to ${plan.max_subadmin} sub-admins` },
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: "Dashboard access" },
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: "Email support" },
                ...(plan.features || []).map(f => ({ icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, text: f })),
              ].map(({ icon, text }, i) => (
                <div key={i} className="mkml-feature-item">
                  <span className="mkml-feature-icon">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <div className="mkml-plan-action">
              {plan.plan_name === currentPlanName ? (
                (() => {
                  const isExpired = dashboardData?.subscription?.end_date
                    ? new Date(dashboardData.subscription.end_date) < new Date()
                      || dashboardData.subscription.subscription_status === "cancelled"
                      || dashboardData.subscription.subscription_status === "expired"
                    : false;
                  return isExpired
                    ? <Button onClick={() => handleUpgrade(plan)}>Renew</Button>
                    : <Button disabled>Current Plan</Button>;
                })()
              ) : plan.plan_type === "Free" ? null : (
                <Button onClick={() => handleUpgrade(plan)} variant={plan.featured ? "primary" : "secondary"}>
                  {plans.findIndex(p => p.plan_name === currentPlanName) > plans.findIndex(p => p.plan_name === plan.plan_name) ? "Downgrade" : "Upgrade"}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade Modal */}
      <SlideInMenu
        isShow={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        width="700px"
      >
        <div className="upgrade-modal">
          <div className="up-panel-header">
            <span className="up-panel-deco" aria-hidden="true" />
            <div className="up-panel-header-content">
              <div className="up-panel-header-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="up-panel-header-text">
                <h2>Upgrade to {selectedPlan?.plan_name}</h2>
                <p>Unlock more features and expand your school's capabilities</p>
              </div>
            </div>
          </div>

          {selectedPlan && (
            <div className="up-panel-body">
              <div className="up-comparison">
                <div className="up-plan-card current">
                  <span className="up-plan-badge">Current Plan</span>
                  <h4 className="up-plan-name">{currentPlanName}</h4>
                  <div className="up-plan-limits">
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/></svg>
                      <span>Unlimited students</span>
                    </div>
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      <span>Unlimited staff</span>
                    </div>
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
                      <span>{dashboardData?.usage?.subadmins?.limit || 0} sub-admins</span>
                    </div>
                  </div>
                </div>
                <div className="up-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="up-plan-card new">
                  <span className="up-plan-badge new">New Plan</span>
                  <h4 className="up-plan-name">{selectedPlan.plan_name}</h4>
                  <div className="up-plan-price">{getPriceDetails(selectedPlan, "monthly")}</div>
                  <div className="up-plan-limits">
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/></svg>
                      <span>Unlimited students</span>
                    </div>
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                      <span>Unlimited staff</span>
                    </div>
                    <div className="up-limit-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>
                      <span>{selectedPlan.max_subadmin} sub-admins</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="up-benefits">
                <span className="up-benefits-title">What you'll get</span>
                <div className="up-benefits-grid">
                  {[
                    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>, title: "More Sub-Admins", desc: `Up to ${selectedPlan.max_subadmin}`, inc: `+${parseInt(selectedPlan.max_subadmin) - (dashboardData?.usage?.subadmins?.limit || 0)}` },
                    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="1.7"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>, title: "More Storage", desc: "Enhanced capacity", inc: null },
                    { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>, title: "Priority Support", desc: "24/7 support", inc: null },
                  ].map(({ icon, title, desc, inc }) => (
                    <div key={title} className="up-benefit-item">
                      <div className="up-benefit-icon">{icon}</div>
                      <div className="up-benefit-text">
                        <span className="up-benefit-title">{title}</span>
                        <span className="up-benefit-desc">{desc}{inc && <span className="up-benefit-inc">{inc}</span>}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Billing options */}
              {selectedPlan.plan_type !== "Free" && (
                <div className="up-billing-options">
                  <span className="up-billing-options-title">Billing Options</span>
                  <div className="up-billing-fields">
                    <div className="up-billing-field">
                      <label className="up-billing-label">Billing Cycle</label>
                      <select className="up-billing-select"
                        value={upgradeBillingCycle}
                        onChange={(e) => { setUpgradeBillingCycle(e.target.value); setUpgradeDuration(1); }}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly (Save 10%)</option>
                        <option value="yearly">Yearly (Save 20%)</option>
                      </select>
                    </div>
                    <div className="up-billing-field">
                      <label className="up-billing-label">
                        Number of {upgradeBillingCycle === "monthly" ? "month(s)" : upgradeBillingCycle === "quarterly" ? "quarter(s)" : "year(s)"}
                      </label>
                      <input className="up-billing-input" type="number"
                        min={1}
                        max={upgradeBillingCycle === "monthly" ? 12 : upgradeBillingCycle === "quarterly" ? 4 : 2}
                        value={upgradeDuration}
                        onChange={(e) => setUpgradeDuration(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </div>
                  <div className="up-payment-summary">
                    <p className="up-payment-calc">₦{getUpgradeMonthlyRate().toLocaleString()}/month × {getUpgradeTotalMonths()} months</p>
                    <p className="up-payment-total">Total: ₦{getUpgradeTotalAmount().toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="up-billing-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
                <p>Your current subscription expires on <strong>{endDate}</strong>. Upgrading will start a new subscription immediately.</p>
              </div>
            </div>
          )}

          <div className="up-panel-footer">
            <Button variant="secondary" onClick={() => setIsUpgradeModalOpen(false)}>Cancel</Button>
            {selectedPlan && (
              selectedPlan.plan_type === "Free" ? (
                <Button onClick={() => handleConfirmUpgrade(null)} disabled={upgrading}>
                  {upgrading ? "Processing..." : "Confirm"}
                </Button>
              ) : (
                <PaystackButton
                  className="paystack-button"
                  email={user?.admin?.email || "admin@school.com"}
                  amount={Math.floor(getUpgradeTotalAmount() * 100) || 100}
                  publicKey={publicKey}
                  text={upgrading ? "Processing..." : "Pay with Paystack"}
                  metadata={{
                    custom_fields: [
                      { display_name: "Plan", variable_name: "plan_name", value: selectedPlan.plan_name },
                      { display_name: "Billing Cycle", variable_name: "billing_cycle", value: upgradeBillingCycle },
                      { display_name: "School ID", variable_name: "school_id", value: schoolId },
                    ],
                  }}
                  onSuccess={(response) => handleConfirmUpgrade(response.reference)}
                  onClose={() => {}}
                />
              )
            )}
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
  };

  const renderBilling = () => (
    <div className="billing-section">
      <div className="billing-header">
        <h3>Billing History</h3>
      </div>

      <ServerSmartTable
        columns={billingColumns}
        fetchData={fetchPayments}
        onRowClick={handleBillingRowClick}
        initialPageSize={15}
        showcreatbut={false}
      />
    </div>
  );

  return (
    <InnerTabCon>
      <div className="subscriptions-container">
        {/* Tab Navigation */}
        <div className="subscription-tabs">
          <button
            className={`tab-button ${
              activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => handleTabChange("dashboard")}
          >
            <FaCrown /> Current Plan
          </button>
          <button
            className={`tab-button ${activeTab === "upgrade" ? "active" : ""}`}
            onClick={() => handleTabChange("upgrade")}
          >
            <FaUpload /> Upgrade/Downgrade
          </button>
          <button
            className={`tab-button ${activeTab === "billing" ? "active" : ""}`}
            onClick={() => handleTabChange("billing")}
          >
            <FaHistory /> Billing History
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "dashboard" && renderDashboard()}
          {activeTab === "upgrade" && renderUpgrade()}
          {activeTab === "billing" && renderBilling()}
        </div>

        {/* Billing Detail Modal */}
        <SlideInMenu
          isShow={isBillingDetailOpen}
          onClose={() => setIsBillingDetailOpen(false)}
          width="720px"
        >
          {selectedBilling && (() => {
            const school = user?.school || {};
            const admin = user?.admin || {};
            const isCompleted = selectedBilling.payment_status === "completed";
            const periodStart = selectedBilling.billing_period_start
              ? new Date(selectedBilling.billing_period_start).toLocaleDateString()
              : "—";
            const periodEnd = selectedBilling.billing_period_end
              ? new Date(selectedBilling.billing_period_end).toLocaleDateString()
              : "—";
            const paidOn = selectedBilling.payment_date
              ? new Date(selectedBilling.payment_date).toLocaleString()
              : "—";
            const amount = Number(selectedBilling.amount_paid || 0);
            const currency = selectedBilling.currency || "NGN";

            const handleExport = () => {
              const doc = new jsPDF({ unit: "mm", format: "a4" });
              const pageW = doc.internal.pageSize.getWidth();
              const margin = 18;

              // Header band
              doc.setFillColor(17, 17, 17);
              doc.rect(0, 0, pageW, 32, "F");
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(15); doc.setFont("helvetica", "bold");
              doc.text("Payment Receipt", margin, 13);
              doc.setFontSize(9); doc.setFont("helvetica", "normal");
              doc.text(`ID: ${selectedBilling.payment_id}`, margin, 21);
              doc.text(paidOn, pageW - margin, 21, { align: "right" });

              let y = 44;

              // School info
              doc.setTextColor(17, 17, 17);
              doc.setFontSize(11); doc.setFont("helvetica", "bold");
              doc.text(school.school_name || "—", margin, y); y += 6;
              doc.setFontSize(9); doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 100, 100);
              if (school.email || admin?.email) { doc.text(school.email || admin.email, margin, y); y += 5; }
              if (school.phone_number) { doc.text(school.phone_number, margin, y); y += 5; }
              if (school.address) { doc.text(school.address, margin, y); y += 5; }

              y += 6;
              doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 8;

              // Plan & billing details
              const rows = [
                ["Plan", selectedBilling.plan_name || "—"],
                ["Billing Cycle", selectedBilling.billing_cycle || "—"],
                ["Period", `${periodStart} → ${periodEnd}`],
                ["Payment Method", selectedBilling.payment_method || "—"],
                ["Provider", selectedBilling.payment_provider || "—"],
                ["Transaction Ref", selectedBilling.provider_transaction_id || "—"],
                ["Status", (selectedBilling.payment_status || "").toUpperCase()],
              ];

              rows.forEach(([label, value]) => {
                doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(130, 130, 130);
                doc.text(label, margin, y);
                doc.setFont("helvetica", "normal"); doc.setTextColor(17, 17, 17);
                doc.text(String(value), margin + 50, y);
                y += 7;
              });

              y += 4;
              doc.setDrawColor(220, 220, 220); doc.line(margin, y, pageW - margin, y); y += 10;

              // Amount box
              const boxH = 22;
              doc.setFillColor(isCompleted ? 240 : 254, isCompleted ? 253 : 242, isCompleted ? 244 : 242);
              doc.roundedRect(margin, y, pageW - margin * 2, boxH, 4, 4, "F");
              doc.setFontSize(10); doc.setFont("helvetica", "bold");
              doc.setTextColor(isCompleted ? 22 : 220, isCompleted ? 163 : 38, isCompleted ? 74 : 38);
              doc.text("Amount Paid", margin + 6, y + 8);
              doc.setFontSize(16);
              doc.text(`${currency} ${amount.toLocaleString()}`, margin + 6, y + 17);

              doc.save(`receipt_${selectedBilling.payment_id}.pdf`);
            };

            return (
              <div className="billing-detail-modal">
                {/* Dark panel header */}
                <div className="bd-panel-header">
                  <span className="bd-panel-header-deco" aria-hidden="true" />
                  <div className="bd-panel-header-content">
                    <div className="bd-panel-header-icon">
                      <FaFileInvoiceDollar size={18} />
                    </div>
                    <div className="bd-panel-header-text">
                      <h2>Payment Receipt</h2>
                      <p>ID: {selectedBilling.payment_id}</p>
                    </div>
                    <span className={`bd-panel-header-status ${isCompleted ? "success" : "failed"}`}>
                      {isCompleted ? <FaCheck /> : <FaTimes />}
                      {selectedBilling.payment_status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Scrollable body */}
                <div className="bd-panel-body">

                  {/* School info */}
                  <div className="bd-billed-to">
                    <p className="bd-billed-label">Billed To</p>
                    <p className="bd-billed-name">{school.school_name || "—"}</p>
                    {school.address && <p className="bd-billed-addr">{school.address}</p>}
                    <div className="bd-billed-contacts">
                      {(school.email || admin.email) && (
                        <span className="bd-billed-contact">
                          <FaEnvelope style={{ fontSize: 11 }} /> {school.email || admin.email}
                        </span>
                      )}
                      {school.phone_number && (
                        <span className="bd-billed-contact">
                          <FaPhone style={{ fontSize: 11 }} /> {school.phone_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Plan + period */}
                  <div className="bd-detail-grid">
                    {[
                      { label: "Plan", value: selectedBilling.plan_name },
                      { label: "Billing Cycle", value: selectedBilling.billing_cycle?.charAt(0).toUpperCase() + selectedBilling.billing_cycle?.slice(1) },
                      { label: "Period Start", value: periodStart },
                      { label: "Period End", value: periodEnd },
                      { label: "Payment Date", value: paidOn },
                      { label: "Provider", value: selectedBilling.payment_provider?.charAt(0).toUpperCase() + selectedBilling.payment_provider?.slice(1) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bd-detail-card">
                        <span className="bd-detail-label">{label}</span>
                        <p className="bd-detail-value">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  {/* Payment method */}
                  <div className="bd-payment-method-card">
                    <p className="bd-billed-label">Payment Method</p>
                    <div className="bd-payment-method-inner">
                      <div className="bd-payment-icon-wrap">
                        <FaCreditCard style={{ color: "#2563eb", fontSize: 16 }} />
                      </div>
                      <div>
                        <p className="bd-payment-name">
                          {selectedBilling.payment_method?.charAt(0).toUpperCase() + selectedBilling.payment_method?.slice(1)}
                          {selectedBilling.payment_provider && selectedBilling.payment_provider !== "none"
                            ? ` via ${selectedBilling.payment_provider?.charAt(0).toUpperCase() + selectedBilling.payment_provider?.slice(1)}`
                            : ""}
                        </p>
                        {selectedBilling.provider_transaction_id && (
                          <p className="bd-payment-ref">Ref: {selectedBilling.provider_transaction_id}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className={`bd-amount-card ${isCompleted ? "success" : "failed"}`}>
                    <div>
                      <p className="bd-amount-label">Total Amount Paid</p>
                      <p className={`bd-amount-value ${isCompleted ? "success" : "failed"}`}>
                        {currency} {amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="bd-currency-label">Currency</p>
                      <p className="bd-currency-value">{currency}</p>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="bd-panel-footer">
                  <Button variant="secondary" onClick={() => setIsBillingDetailOpen(false)}>Close</Button>
                  <Button onClick={handleExport}>
                    <FaDownload style={{ marginRight: 6 }} /> Export Receipt
                  </Button>
                </div>
              </div>
            );
          })()}
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default Subscriptions;
