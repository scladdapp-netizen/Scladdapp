import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import Button from "../../../../components/Button/Button";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import useTransaction from "../../../../api_call/useTransaction";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import SubAdminGuard from "../../../../components/SubAdminGuard/SubAdminGuard";
import "./AdminSubseasionIncomeExpenses.css";

const dateFilterOptions = [
  { value: 7,   label: "Last 7 days" },
  { value: 30,  label: "Last 30 days" },
  { value: 60,  label: "Last 60 days" },
  { value: 90,  label: "Last 90 days" },
  { value: 365, label: "Last year" },
];

const EMPTY_FORM = {
  type: "income", title: "", amount: "", category: "",
  description: "", date: "", paymentMethod: "", reference: "",
};

const AdminSubseasionIncomeExpenses = () => {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { loading: submitting, createTransaction, getTransactionsPaginated, getTransactionsSummary, updateTransaction } = useTransaction();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.bill_income_expense?.edit;

  const [dateFilter,           setDateFilter]           = useState(30);
  const [isAddMenuOpen,        setIsAddMenuOpen]        = useState(false);
  const [editingTransaction,   setEditingTransaction]   = useState(null);
  const [showDetail,           setShowDetail]           = useState(false);
  const [selectedTransaction,  setSelectedTransaction]  = useState(null);
  const [refreshTable,         setRefreshTable]         = useState(0);
  const [formData,             setFormData]             = useState(EMPTY_FORM);
  const [summary,              setSummary]              = useState({ totalIncome: 0, totalExpenses: 0, netBalance: 0 });
  const [chartData,            setChartData]            = useState([]);
  const [summaryLoading,       setSummaryLoading]       = useState(false);

  useEffect(() => {
    if (!schoolId) return;
    setSummaryLoading(true);
    getTransactionsSummary(schoolId, dateFilter).then((res) => {
      if (res.success) {
        setSummary(res.summary || { totalIncome: 0, totalExpenses: 0, netBalance: 0 });
        const grouped = {};
        (res.data || []).forEach((t) => {
          const label = t.date;
          if (!grouped[label]) grouped[label] = { date: label, income: 0, expenses: 0 };
          if (t.type === "income") grouped[label].income += t.amount;
          else grouped[label].expenses += t.amount;
        });
        setChartData(Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)));
      }
      setSummaryLoading(false);
    });
  }, [schoolId, dateFilter, refreshTable]);

  const fetchData = useCallback(async (params) => {
    const endDate   = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - dateFilter * 86400000).toISOString().split("T")[0];
    const result = await getTransactionsPaginated(schoolId, { ...params, startDate, endDate });
    if (result.success) {
      return {
        success: true,
        data: result.data.map((t) => ({
          transaction_id: t.transaction_id,
          type: t.type, title: t.title, description: t.description,
          amount: t.amount, currency: t.currency, category: t.category,
          date: t.date, payment_method: t.payment_method, reference: t.reference,
          status: t.status, created_by_name: t.created_by_name,
          approved_by_name: t.approved_by_name, _raw: t,
        })),
        pagination: result.pagination,
      };
    }
    return result;
  }, [schoolId, dateFilter, getTransactionsPaginated]);

  const columns = [
    {
      label: "Type",
      accessor: "type",
      render: (v) => (
        <span className={`ie-type-badge ${v}`}>
          {v === "income" ? "Income" : "Expense"}
        </span>
      ),
    },
    {
      label: "Title",
      accessor: "title",
      render: (v, row) => (
        <div className="ie-title-cell">
          <span className="ie-title-main">{v}</span>
          {/* {row.description && <span className="ie-title-sub">{row.description}</span>} */}
        </div>
      ),
    },
    {
      label: "Amount",
      accessor: "amount",
      render: (v, row) => (
        <span className={`ie-amount ${row.type}`}>
          {row.type === "expense" ? "-" : "+"}₦{Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      label: "Category",
      accessor: "category",
      render: (v) => v ? <span className="ie-category-badge">{v}</span> : "—",
    },
    {
      label: "Date",
      accessor: "date",
      render: (v) => <span className="ie-date">{v}</span>,
    },
    {
      label: "Method",
      accessor: "payment_method",
      render: (v) => <span className="ie-method">{v || "—"}</span>,
    },
    {
      label: "Reference",
      accessor: "reference",
      render: (v) => <span className="ie-reference">{v || "—"}</span>,
    },
  ];

  const handleInputChange = (field) => (value) => setFormData((p) => ({ ...p, [field]: value }));

  const openAdd = () => {
    if (!canCreate) { addNotification("No permission to add transactions.", "error"); return; }
    setEditingTransaction(null); setFormData(EMPTY_FORM); setIsAddMenuOpen(true);
  };

  const openEdit = (t) => {
    if (!canEdit) { addNotification("No permission to edit transactions.", "error"); return; }
    setEditingTransaction(t);
    setFormData({
      type: t.type, title: t.title, amount: String(t.amount),
      category: t.category || "", description: t.description || "",
      date: t.date, paymentMethod: t.payment_method || "", reference: t.reference || "",
    });
    setIsAddMenuOpen(true);
  };

  const handleSubmit = async () => {
    const payload = {
      school_id: schoolId, type: formData.type, title: formData.title,
      amount: formData.amount, category: formData.category || null,
      description: formData.description || null,
      date: formData.date || new Date().toISOString().split("T")[0],
      payment_method: formData.paymentMethod || null,
      reference: formData.reference || null,
      created_by_id: user?.admin?.admin_id || user?.staff?.staff_id || null,
      created_by_name: user?.admin?.username || user?.staff?.full_name || "Admin",
      modified_by_id: user?.admin?.admin_id || user?.staff?.staff_id || null,
    };
    const result = editingTransaction
      ? await updateTransaction(editingTransaction.transaction_id, payload)
      : await createTransaction(payload);
    if (result.success) {
      addNotification(`Transaction ${editingTransaction ? "updated" : "created"} successfully`, "success");
      setRefreshTable((k) => k + 1);
      setIsAddMenuOpen(false);
      setFormData(EMPTY_FORM);
    } else {
      addNotification(result.message || "Failed to save transaction", "error");
    }
  };

  return (
    <SubAdminGuard permission="bill_income_expense">
      <div className="ie-wrap">

        <InnerTabCon>
          {/* Header */}
          <div className="ie-header">
            <div className="ie-header-left">
              <h2 className="ie-title">Income & Expenses</h2>
              <p className="ie-subtitle">Track and manage school income and expenses</p>
            </div>
            <div className="ie-date-filter">
              <label htmlFor="dateFilter" className="ie-filter-label">Show:</label>
              <select
                id="dateFilter"
                value={dateFilter}
                onChange={(e) => setDateFilter(Number(e.target.value))}
                className="ie-filter-select"
              >
                {dateFilterOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats + Chart */}
          <div className="ie-stats-chart">

            {/* Stats panel */}
            <div className="ie-stats-panel">
              {summaryLoading ? (
                <div className="ie-stats-loading">Loading summary...</div>
              ) : (
                <div className="ie-stats-grid">
                  <div className="ie-stat-card income">
                    <span className="ie-stat-label">Total Income</span>
                    <span className="ie-stat-amount">₦{summary.totalIncome.toLocaleString()}</span>
                  </div>
                  <div className="ie-stat-card expense">
                    <span className="ie-stat-label">Total Expenses</span>
                    <span className="ie-stat-amount">₦{summary.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className={`ie-stat-card balance ${summary.netBalance >= 0 ? "positive" : "negative"}`}>
                    <span className="ie-stat-label">Net Balance</span>
                    <span className="ie-stat-amount">
                      {summary.netBalance >= 0 ? "+" : ""}₦{summary.netBalance.toLocaleString()}
                    </span>
                    <span className={`ie-stat-trend ${summary.netBalance >= 0 ? "positive" : "negative"}`}>
                      {summary.netBalance >= 0 ? "Surplus" : "Deficit"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="ie-chart-panel">
              <div className="ie-chart-header">
                <h3 className="ie-chart-title">Financial Trend</h3>
                <div className="ie-chart-legend">
                  <div className="ie-legend-item">
                    <span className="ie-legend-dot income" />
                    <span>Income</span>
                  </div>
                  <div className="ie-legend-item">
                    <span className="ie-legend-dot expense" />
                    <span>Expenses</span>
                  </div>
                </div>
              </div>
              <div className="ie-chart-container">
                {summaryLoading ? (
                  <div className="ie-chart-placeholder">Loading chart...</div>
                ) : chartData.length === 0 ? (
                  <div className="ie-chart-placeholder">No data for this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: "#888888" }} />
                      <YAxis axisLine={false} tickLine={false}
                        tick={{ fontSize: 11, fill: "#888888" }}
                        tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, fontSize: 12 }}
                        formatter={(v, name) => [`₦${Number(v).toLocaleString()}`, name === "income" ? "Income" : "Expenses"]}
                      />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2.5}
                        dot={{ fill: "#10b981", r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#f59e0b" strokeWidth={2.5}
                        dot={{ fill: "#f59e0b", r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Table with inline create button */}
          <ServerSmartTable
            key={`${refreshTable}-${dateFilter}`}
            columns={columns}
            fetchData={fetchData}
            onRowClick={(row) => { setSelectedTransaction(row._raw); setShowDetail(true); }}
            enableSelect={true}
            initialPageSize={15}
            showcreatbut={true}
            creattext="Add Transaction"
            onCreate={openAdd}
            reloadKey={refreshTable}
          />
        </InnerTabCon>

        {/* Add / Edit panel */}
        <SlideInMenu isShow={isAddMenuOpen} onClose={() => setIsAddMenuOpen(false)} width="500px">
          <div className="ie-panel">
            <div className="ie-panel-header">
              <span className="ie-panel-deco" aria-hidden="true" />
              <div className="ie-panel-header-content">
                <div className="ie-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="ie-panel-header-text">
                  <h2>{editingTransaction ? "Edit Transaction" : "Add Transaction"}</h2>
                  <p>{editingTransaction ? "Update transaction details" : "Record a new income or expense"}</p>
                </div>
              </div>
            </div>
            <div className="ie-panel-body">
              {/* Type toggle */}
              <div>
                <span className="ie-type-label">Type</span>
                <div className="ie-type-toggle">
                  {["income", "expense"].map((t) => (
                    <button
                      key={t}
                      className={`ie-type-btn ${t} ${formData.type === t ? "active" : ""}`}
                      onClick={() => handleInputChange("type")(t)}
                    >
                      {t === "income" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {t === "income" ? "Income" : "Expense"}
                    </button>
                  ))}
                </div>
              </div>

              <FormInput label="Title *" type="text" value={formData.title} onChange={handleInputChange("title")} placeholder="e.g. School Fees Collection" />
              <FormInput label="Amount *" type="text" value={formData.amount} onChange={handleInputChange("amount")} placeholder="e.g. 120000" />
              <FormInput label="Category" type="text" value={formData.category} onChange={handleInputChange("category")} placeholder="e.g. Tuition, Salaries, Utilities" />
              <FormInput label="Date" type="date" value={formData.date} onChange={handleInputChange("date")} />
              <FormInput label="Payment Method" type="select" value={formData.paymentMethod} onChange={handleInputChange("paymentMethod")}
                options={[
                  { value: "", label: "— Select —" },
                  { value: "bank_transfer", label: "Bank Transfer" },
                  { value: "cash", label: "Cash" },
                  { value: "online_payment", label: "Online Payment" },
                  { value: "cheque", label: "Cheque" },
                ]} />
              <FormInput label="Reference" type="text" value={formData.reference} onChange={handleInputChange("reference")} placeholder="e.g. TXN-001" />
              <FormInput label="Description" type="textarea" value={formData.description} onChange={handleInputChange("description")} placeholder="Optional notes..." height="80px" />
            </div>
            <div className="ie-panel-footer">
              <Button variant="secondary" onClick={() => setIsAddMenuOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !formData.title || !formData.amount}>
                {submitting ? "Saving..." : editingTransaction ? "Update" : "Add Transaction"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Detail panel */}
        <SlideInMenu isShow={showDetail} onClose={() => { setShowDetail(false); setSelectedTransaction(null); }} width="500px">
          {selectedTransaction && (
            <div className="ie-panel">
              <div className="ie-panel-header">
                <span className="ie-panel-deco" aria-hidden="true" />
                <div className="ie-panel-header-content">
                  <div className="ie-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="ie-panel-header-text">
                    <h2>{selectedTransaction.title}</h2>
                    <p style={{ textTransform: "capitalize" }}>{selectedTransaction.type}</p>
                  </div>
                </div>
              </div>
              <div className="ie-panel-body">
                <div className="ie-detail-grid">
                  {[
                    { label: "Amount",     value: `${selectedTransaction.type === "expense" ? "-" : "+"}₦${Number(selectedTransaction.amount).toLocaleString()}` },
                    { label: "Category",   value: selectedTransaction.category || "—" },
                    { label: "Date",       value: selectedTransaction.date },
                    { label: "Status",     value: selectedTransaction.status || "—" },
                    { label: "Method",     value: selectedTransaction.payment_method?.replace(/_/g, " ") || "—" },
                    { label: "Reference",  value: selectedTransaction.reference || "—" },
                    { label: "Created By", value: selectedTransaction.created_by_name || "—" },
                    { label: "Approved By",value: selectedTransaction.approved_by_name || "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="ie-detail-card">
                      <span className="ie-detail-label">{label}</span>
                      <span className="ie-detail-value">{value}</span>
                    </div>
                  ))}
                </div>

                {selectedTransaction.description && (
                  <div className="ie-detail-desc-card">
                    <span className="ie-detail-label">Description</span>
                    <p className="ie-detail-desc-text">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>
              <div className="ie-panel-footer">
                <Button variant="secondary" onClick={() => { setShowDetail(false); setSelectedTransaction(null); }}>Close</Button>
                <Button onClick={() => { setShowDetail(false); openEdit(selectedTransaction); }}>Edit</Button>
              </div>
            </div>
          )}
        </SlideInMenu>
      </div>
    </SubAdminGuard>
  );
};

export default AdminSubseasionIncomeExpenses;
