import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Routes, Route } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SmartTable from "../../../../components/SmartTable/SmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import Button from "../../../../components/Button/Button";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import TargetAudienceSelector from "../Communication/Announcements/CreateAnnouncement/TargetAudienceSelector/TargetAudienceSelector";
import FeeActionDropdown from "./FeeActionDropdown";
import SchoolAccountsTab from "./SchoolAccountsTab";
import AdminSubseasionIncomeExpenses from "../AdminSubseasionIncomeExpenses/AdminSubseasionIncomeExpenses";
import "./FeeBillingDashboard.css";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useSchoolAccount } from "../../../../api_call/useSchoolAccount";
import useBill from "../../../../api_call/useBill";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Bills Tab Component
const BillsTab = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loading: submitting, createBill, getBillsBySchoolPaginated } = useBill();
  const { addNotification } = useNotification();
  const [refreshTable, setRefreshTable] = useState(0);

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.create;

  const fetchBillsData = useCallback(async (params) => {
    const result = await getBillsBySchoolPaginated(schoolId, params);
    if (result.success) {
      return {
        success: true,
        data: result.data.map((b) => ({
          bill_id: b.bill_id,
          fee_code: b.fee_code || "—",
          fee_name: b.fee_name,
          category: b.category || "—",
          total_amount: b.total_amount,
          currency: b.currency,
          target_type: b.target_type,
          recipients_count: b.recipients_count,
          paid_count: b.paid_count,
          status: b.status,
          created_by_name: b.created_by_name,
          created_at: b.created_at,
        })),
        pagination: result.pagination,
      };
    }
    return result;
  }, [schoolId, getBillsBySchoolPaginated]);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [resolvedRecipients, setResolvedRecipients] = useState([]);

  // Fee bill templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/fee-bill-template/school/${schoolId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setTemplates(d.data || []); })
      .catch(() => {});
  }, [schoolId]);

  // School accounts
  const [schoolAccountsList, setSchoolAccountsList] = useState([]);
  const { getSchoolAccountsBySchool } = useSchoolAccount();

  useEffect(() => {
    getSchoolAccountsBySchool(schoolId).then((res) => {
      if (res.success) {
        const accounts = res.data || [];
        setSchoolAccountsList(accounts);
        // Auto-select default account
        const defaultAcc = accounts.find((a) => a.is_default);
        if (defaultAcc) {
          setFormData((prev) => ({ ...prev, schoolAccount: defaultAcc.account_id }));
        }
      }
    });
  }, [schoolId]);

  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tmpl = templates.find((t) => t.template_id === templateId);
    if (!tmpl) return;
    const items = typeof tmpl.bill_items === "string" ? JSON.parse(tmpl.bill_items) : (tmpl.bill_items || []);
    setFormData((prev) => ({
      ...prev,
      feeName: tmpl.name || prev.feeName,
      description: tmpl.description || prev.description,
      category: tmpl.category || prev.category,
      amount: tmpl.total_amount ? String(tmpl.total_amount) : prev.amount,
    }));
  };

  // Form data for creating new fees
  const [formData, setFormData] = useState({
    feeCode: "",
    feeName: "",
    category: "Academic",
    description: "",
    amount: "",
    frequency: "Per Term",
    applicableClasses: "",
    mandatory: true,
    status: "Active",
    dueDate: "",
    lateFee: "",
    schoolAccount: "",
    targetType: "",
    selectedTargets: [],
    discounts: [],
    breakdown: [],
    notes: "",
  });

  // Sample school accounts data for fee collection
  const schoolAccounts = [
    {
      id: 1,
      accountName: "Greenwood School Main Account",
      accountNumber: "1234567890",
      bankName: "First Bank Nigeria",
      accountType: "Current",
    },
    {
      id: 2,
      accountName: "Greenwood School Savings",
      accountNumber: "0987654321",
      bankName: "GTBank",
      accountType: "Savings",
    },
    {
      id: 3,
      accountName: "Greenwood School Projects",
      accountNumber: "1122334455",
      bankName: "Access Bank",
      accountType: "Current",
    },
  ];

  // Sample fee billing categories/types data
  const billingData = [
    {
      id: 1,
      feeCode: "SCH-001",
      feeName: "School Fees",
      category: "Academic",
      description: "Tuition and academic fees for regular classes",
      amount: "₦120,000",
      frequency: "Per Term",
      applicableClasses: "All Classes",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-10",
      totalStudents: 450,
      collectionRate: "85%",
    },
    {
      id: 2,
      feeCode: "UNI-002",
      feeName: "Uniform Fees",
      category: "Uniform",
      description: "School uniform and sports wear fees",
      amount: "₦25,000",
      frequency: "Per Session",
      applicableClasses: "All Classes",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-05",
      totalStudents: 450,
      collectionRate: "92%",
    },
    {
      id: 3,
      feeCode: "BUS-003",
      feeName: "Transportation Fees",
      category: "Transport",
      description: "School bus transportation service fees",
      amount: "₦15,000",
      frequency: "Per Term",
      applicableClasses: "All Classes",
      mandatory: false,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2023-12-20",
      totalStudents: 180,
      collectionRate: "78%",
    },
    {
      id: 4,
      feeCode: "LAB-004",
      feeName: "Laboratory Fees",
      category: "Academic",
      description: "Science laboratory equipment and materials",
      amount: "₦8,000",
      frequency: "Per Term",
      applicableClasses: "Grade 9-12",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-15",
      totalStudents: 200,
      collectionRate: "88%",
    },
    {
      id: 5,
      feeCode: "LIB-005",
      feeName: "Library Fees",
      category: "Academic",
      description: "Library maintenance and book fees",
      amount: "₦5,000",
      frequency: "Per Session",
      applicableClasses: "All Classes",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2023-11-30",
      totalStudents: 450,
      collectionRate: "95%",
    },
    {
      id: 6,
      feeCode: "SPT-006",
      feeName: "Sports Fees",
      category: "Extracurricular",
      description: "Sports equipment and facility maintenance",
      amount: "₦10,000",
      frequency: "Per Session",
      applicableClasses: "All Classes",
      mandatory: false,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-08",
      totalStudents: 320,
      collectionRate: "72%",
    },
    {
      id: 7,
      feeCode: "EXM-007",
      feeName: "Examination Fees",
      category: "Academic",
      description: "Internal and external examination fees",
      amount: "₦12,000",
      frequency: "Per Term",
      applicableClasses: "Grade 10-12",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-12",
      totalStudents: 180,
      collectionRate: "90%",
    },
    {
      id: 8,
      feeCode: "ICT-008",
      feeName: "Computer/ICT Fees",
      category: "Technology",
      description: "Computer lab and ICT equipment fees",
      amount: "₦18,000",
      frequency: "Per Session",
      applicableClasses: "All Classes",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2024-01-20",
      totalStudents: 450,
      collectionRate: "87%",
    },
    {
      id: 9,
      feeCode: "MED-009",
      feeName: "Medical/Health Fees",
      category: "Health",
      description: "School clinic and health services",
      amount: "₦6,000",
      frequency: "Per Session",
      applicableClasses: "All Classes",
      mandatory: true,
      status: "Active",
      createdDate: "2023-08-15",
      lastUpdated: "2023-12-15",
      totalStudents: 450,
      collectionRate: "93%",
    },
    {
      id: 10,
      feeCode: "EXC-010",
      feeName: "Excursion Fees",
      category: "Extracurricular",
      description: "Educational trips and excursions",
      amount: "₦20,000",
      frequency: "Per Event",
      applicableClasses: "Grade 7-12",
      mandatory: false,
      status: "Inactive",
      createdDate: "2023-08-15",
      lastUpdated: "2023-10-25",
      totalStudents: 0,
      collectionRate: "0%",
    },
  ];

  // Columns for ServerSmartTable — matching real bill data
  const columns = [
    {
      label: "Fee Code",
      accessor: "fee_code",
      render: (v) => <span className="fbt-col-code">{v}</span>,
    },
    {
      label: "Fee Name",
      accessor: "fee_name",
      render: (v, row) => (
        <div className="fbt-col-name">
          <span className="fbt-col-name-main">{v}</span>
          <span className="fbt-col-name-sub">{row.category}</span>
        </div>
      ),
    },
    {
      label: "Amount",
      accessor: "total_amount",
      render: (v, row) => (
        <span className="fbt-col-amount">
          {row.currency} {Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      label: "Target",
      accessor: "target_type",
      render: (v) => (
        <span className="fbt-col-target">{v?.replace(/_/g, " ")}</span>
      ),
    },
    {
      label: "Recipients",
      accessor: "recipients_count",
      render: (v, row) => (
        <div className="fbt-col-recipients">
          <span className="fbt-col-recipients-total">{v}</span>
          <span className={`fbt-col-recipients-paid ${row.paid_count > 0 ? "has-paid" : ""}`}>
            {row.paid_count} paid
          </span>
        </div>
      ),
    },
    {
      label: "Status",
      accessor: "status",
      render: (v) => (
        <span className={`fbt-col-status ${v?.toLowerCase()}`}>{v}</span>
      ),
    },
    {
      label: "Created",
      accessor: "created_at",
      render: (v) => v ? new Date(v).toLocaleDateString() : "—",
    },
  ];

  const handleBulkDelete = async (ids) => {
    console.log("Bulk delete fees:", ids);
  };

  const handleExport = async (opts) => {
    console.log("Export fee structure:", opts);
  };

  const handleCreate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create fee bills.", "error");
      return;
    }
    handleCreateFee();
  };

  const handleCreateFee = () => {
    console.log("Create Fee button clicked");
    setIsCreateMenuOpen(true);
  };

  const handleSubmitFee = async () => {
    const tmpl = templates.find((t) => t.template_id === selectedTemplateId);
    const result = await createBill({
      school_id: schoolId,
      template_id: selectedTemplateId || null,
      fee_code: formData.feeCode || null,
      fee_name: tmpl?.name || formData.feeName,
      category: tmpl?.category || null,
      description: tmpl?.description || null,
      total_amount: tmpl?.total_amount || 0,
      currency: tmpl?.currency || "NGN",
      allow_installments: tmpl?.allow_installments || false,
      installment_count: tmpl?.installment_count || null,
      min_payment: tmpl?.min_payment || null,
      bill_items: tmpl?.bill_items || [],
      school_account_id: formData.schoolAccount || null,
      mandatory: formData.mandatory,
      status: formData.status,
      target_type: formData.targetType,
      targeted_users: resolvedRecipients,
      created_by_id: user?.admin?.admin_id || user?.staff?.staff_id || null,
      created_by_name: user?.admin?.username || user?.staff?.full_name || "Admin",
    });

    if (result.success) {
      addNotification("Fee bill created successfully", "success");
      setRefreshTable((k) => k + 1);
    } else {
      addNotification(result.message || "Failed to create fee bill", "error");
      return; // don't close the panel on error
    }

    setIsCreateMenuOpen(false);
    setSelectedTemplateId("");
    setResolvedRecipients([]);
    setFormData({
      feeCode: "",
      feeName: "",
      category: "Academic",
      description: "",
      amount: "",
      frequency: "Per Term",
      applicableClasses: "",
      mandatory: true,
      status: "Active",
      dueDate: "",
      lateFee: "",
      schoolAccount: "",
      targetType: "",
      selectedTargets: [],
      discounts: [],
      breakdown: [],
      notes: "",
    });
  };

  const handleRecipientsChange = (recipients) => {
    setResolvedRecipients(recipients);
  };

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (targetType, selectedTargets) => {
    setFormData((prev) => ({
      ...prev,
      targetType,
      selectedTargets,
    }));
  };

  const handleClick = (row) => {
    // Navigate to bill detail page with the bill ID
    navigate(`/admin/${schoolId}/fee_billing/bill/${row.id}`);
  };

  const handleViewFee = (fee) => {
    console.log("View fee:", fee.feeName);
    // Handle view fee functionality
  };

  const handleEditFee = (fee) => {
    console.log("Edit fee:", fee.feeName);
    // Handle edit fee functionality
  };

  const handleDuplicateFee = (fee) => {
    console.log("Duplicate fee:", fee.feeName);
    // Handle duplicate fee functionality
  };

  const handleToggleStatus = (fee) => {
    console.log(
      "Toggle status for fee:",
      fee.feeName,
      "Current status:",
      fee.status
    );
    // Handle toggle status functionality
  };

  return (
    <div className="fee-billing-tab">
      <InnerTabCon>
        <div className="fbt-header">
          <div className="fbt-header-left">
            <h2 className="fbt-title">Bills</h2>
            <p className="fbt-subtitle">Manage school fee bills and track payment collection</p>
          </div>
        </div>
        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchBillsData}
          onRowClick={(row) => navigate(`/admin/${schoolId}/fee_billing/bill/${row.bill_id}`)}
          enableSelect={true}
          onCreate={handleCreate}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Add New Fee"
          reloadKey={refreshTable}
        />
      </InnerTabCon>

      {/* Create New Fee */}
      <SlideInMenu
        isShow={isCreateMenuOpen}
        onClose={() => setIsCreateMenuOpen(false)}
        width="600px"
      >
        <div className="create-fee-container">
          <div className="cf-panel-header">
            <span className="cf-panel-deco" aria-hidden="true" />
            <div className="cf-panel-header-content">
              <div className="cf-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor"/>
                </svg>
              </div>
              <div className="cf-panel-header-text">
                <h2>Add New Fee</h2>
                <p>Create a new fee structure for your school</p>
              </div>
            </div>
          </div>

          <div className="create-fee-form">
            {/* Fee Bill Template Selector */}
            <div style={{ marginBottom: 16 }}>
              <SearchableSelect
                label="Fee Bill Template *"
                placeholder="Search and select a template..."
                options={templates.map((t) => ({
                  value: t.template_id,
                  label: t.name,
                  subtitle: `${t.category || ""} · ₦${t.total_amount?.toLocaleString() || 0}`,
                }))}
                value={selectedTemplateId}
                onChange={handleSelectTemplate}
                searchable={true}
              />
            </div>

            {/* Template detail preview */}
            {selectedTemplateId && (() => {
              const tmpl = templates.find((t) => t.template_id === selectedTemplateId);
              if (!tmpl) return null;
              const items = typeof tmpl.bill_items === "string" ? JSON.parse(tmpl.bill_items) : (tmpl.bill_items || []);
              return (
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Name", value: tmpl.name },
                      { label: "Category", value: tmpl.category },
                      { label: "Total Amount", value: `₦${tmpl.total_amount?.toLocaleString() || 0}` },
                      { label: "Currency", value: tmpl.currency },
                      { label: "Installments", value: tmpl.allow_installments ? `Yes (${tmpl.installment_count})` : "No" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", margin: "0 0 2px", textTransform: "uppercase" }}>{label}</p>
                        <p style={{ fontSize: 13, color: "#374151", margin: 0, fontWeight: 500 }}>{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {tmpl.description && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 12px" }}>{tmpl.description}</p>
                  )}
                  {items.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", margin: "0 0 6px", textTransform: "uppercase" }}>Bill Items</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {items.map((item, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
                            <span style={{ color: "#374151" }}>{item.item_name}</span>
                            <span style={{ fontWeight: 600, color: "#374151" }}>₦{Number(item.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="form-row">
              <FormInput
                label="Fee Code *"
                type="text"
                value={formData.feeCode}
                onChange={handleInputChange("feeCode")}
                placeholder="e.g., SCH-001, UNI-002"
              />

              <FormInput
                label="Fee Type"
                type="select"
                value={formData.mandatory}
                onChange={(value) =>
                  handleInputChange("mandatory")(value === "true")
                }
                options={[
                  { value: true, label: "Mandatory" },
                  { value: false, label: "Optional" },
                ]}
              />
            </div>

            <SearchableSelect
              label="School Account *"
              placeholder="Select account to receive payments..."
              options={schoolAccountsList.map((a) => ({
                value: a.account_id,
                label: `${a.account_name} — ${a.bank_name}`,
                subtitle: `${a.account_type} · ${a.account_number}${a.is_default ? " · Default" : ""}`,
              }))}
              value={formData.schoolAccount}
              onChange={(val) => handleInputChange("schoolAccount")(val)}
              searchable={true}
            />

            {/* Target Audience Selector */}
            <div className="target-audience-section">
              <label className="form-label">Applicable To *</label>
              <TargetAudienceSelector
                selectedType={formData.targetType}
                selectedTargets={formData.selectedTargets}
                onChange={handleTargetChange}
                onRecipientsChange={handleRecipientsChange}
                excludeTypes={["all_staff", "specific_staff"]}
              />
            </div>

            <FormInput
              label="Status"
              type="select"
              value={formData.status}
              onChange={handleInputChange("status")}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Draft", label: "Draft" },
              ]}
            />

            <FormInput
              label="Notes"
              type="textarea"
              value={formData.notes}
              onChange={handleInputChange("notes")}
              placeholder="Additional notes about this fee..."
              height="60px"
            />
          </div>

          <div className="create-fee-footer">
            <Button
              variant="secondary"
              onClick={() => setIsCreateMenuOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitFee}
              disabled={submitting || !selectedTemplateId || !formData.targetType}
            >
              {submitting ? "Creating..." : "Create Fee"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

// Main FeeBillingDashboard Component with Tabs
const FeeBillingDashboard = () => {
  // Define the navigation routes for the top tabs
  const routes = [
    { label: "Bills", link: "" },
    { label: "School Accounts", link: "/accounts" },
    { label: "Income & Expenses", link: "/income-expenses" },
  ];

  return (
    <StudentDetailTopTab
      title="Fee Billing Management"
      subtitle="Manage school fees, billing, and bank accounts"
      route={routes}
    >
      <Routes>
        <Route path="/" element={<BillsTab />} />
        <Route path="/accounts" element={<SchoolAccountsTab />} />
        <Route path="/income-expenses" element={<AdminSubseasionIncomeExpenses />} />
      </Routes>
    </StudentDetailTopTab>
  );
};

export default FeeBillingDashboard;
