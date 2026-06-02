import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import Button from "../../../../components/Button/Button";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useSchoolAccount } from "../../../../api_call/useSchoolAccount";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../../components/SubAdminGuard/SubAdminGuard";
import SearchableSelect from "../../../../components/SearchableSelect/SearchableSelect";
import "./SchoolAccountsTab.css";

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const IconBank = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IconDelete = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IconEye = ({ open }) => open ? (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.7"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
) : (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

/* ── AccountForm — defined OUTSIDE parent to prevent remount on re-render ─── */
const AccountForm = ({ isEdit, formData, bankList, isSubmitting, onInputChange, onBankChange, onSubmit, onClose }) => (
  <div className="sa-panel">
    <div className="sa-panel-header">
      <span className="sa-panel-deco" aria-hidden="true" />
      <div className="sa-panel-header-content">
        <div className="sa-panel-header-icon"><IconBank /></div>
        <div className="sa-panel-header-text">
          <h2>{isEdit ? "Edit Account" : "Add School Account"}</h2>
          <p>{isEdit ? "Update bank account information" : "Add a new bank account for the school"}</p>
        </div>
      </div>
    </div>
    <div className="sa-panel-body">
      <FormInput label="Account Name *" type="text" value={formData.accountName}
        onChange={onInputChange("accountName")} placeholder="e.g., School Main Account" />
      <div className="sa-form-row">
        <FormInput label="Account Number *" type="text" value={formData.accountNumber}
          onChange={onInputChange("accountNumber")} placeholder="e.g., 1234567890" />
        <SearchableSelect
          label="Bank *"
          placeholder={bankList.length ? "Search bank..." : "Loading banks..."}
          options={bankList.map((b) => ({ value: b.code, label: b.name }))}
          value={formData.bankCode}
          onChange={onBankChange}
        />
      </div>
      <FormInput label="Account Type *" type="select" value={formData.accountType}
        onChange={onInputChange("accountType")}
        options={[
          { value: "Savings", label: "Savings" },
          { value: "Current", label: "Current" },
          { value: "Fixed Deposit", label: "Fixed Deposit" },
        ]} />
      <FormInput label="Description" type="textarea" value={formData.description}
        onChange={onInputChange("description")} placeholder="Enter account description..." height="80px" />
      <FormInput label="Set as Default Account" type="checkbox" value={formData.isDefault}
        onChange={onInputChange("isDefault")} />
    </div>
    <div className="sa-panel-footer">
      <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
      <Button onClick={onSubmit}
        disabled={!formData.accountName || !formData.accountNumber || !formData.bankName || (!isEdit && !formData.bankCode) || isSubmitting}>
        {isSubmitting ? (isEdit ? "Updating..." : "Verifying...") : (isEdit ? "Update Account" : "Add Account")}
      </Button>
    </div>
  </div>
);

const SchoolAccountsTab = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    loading,
    createSchoolAccount,
    getSchoolAccountsBySchool,
    updateSchoolAccount,
    deleteSchoolAccount,
    setDefaultAccount,
    verifyBankAccount,
    createPaystackSubaccount,
    getBankList,
  } = useSchoolAccount();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.school_account?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.school_account?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.school_account?.delete;

  const [isAddMenuOpen,    setIsAddMenuOpen]    = useState(false);
  const [isEditMenuOpen,   setIsEditMenuOpen]   = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedAccount,  setSelectedAccount]  = useState(null);
  const [visibleAccountNumbers, setVisibleAccountNumbers] = useState({});
  const [accountsData, setAccountsData] = useState([]);
  const [dataLoading,  setDataLoading]  = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verifyPopup,  setVerifyPopup]  = useState(null);
  const [bankList,     setBankList]     = useState([]);

  const [formData, setFormData] = useState({
    accountName: "", accountNumber: "", bankName: "", bankCode: "",
    accountType: "Savings", description: "", isDefault: false,
  });

  useEffect(() => {
    fetchAccounts();
    getBankList().then((res) => { if (res.success) setBankList(res.data); });
  }, [schoolId]);

  const fetchAccounts = async () => {
    if (!schoolId) return;
    setDataLoading(true);
    try {
      const result = await getSchoolAccountsBySchool(schoolId);
      if (result.success) setAccountsData(result.data);
      else { addNotification(result.message || "Failed to fetch accounts", "error"); setAccountsData([]); }
    } catch { addNotification("Error fetching school accounts", "error"); setAccountsData([]); }
    finally { setDataLoading(false); }
  };

  const handleInputChange = (field) => (value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleBankChange = (code) => {
    const bank = bankList.find((b) => b.code === code);
    setFormData((prev) => ({ ...prev, bankCode: code, bankName: bank?.name || "" }));
  };

  const resetForm = () => setFormData({
    accountName: "", accountNumber: "", bankName: "", bankCode: "",
    accountType: "Savings", description: "", isDefault: false,
  });

  const handleSubmit = async () => {
    if (!formData.accountName || !formData.accountNumber || !formData.bankName) {
      addNotification("Please fill in all required fields", "error"); return;
    }
    const bankCode = formData.bankCode?.trim();
    if (!bankCode) { addNotification("Please select a bank to verify the account.", "error"); return; }
    setIsSubmitting(true);
    try {
      const verify = await verifyBankAccount(formData.accountNumber, bankCode);
      if (!verify.success) {
        const msg = verify.message || "";
        addNotification(
          msg.toLowerCase().includes("daily limit") || msg.toLowerCase().includes("test bank")
            ? "Paystack test mode limit reached (3/day). Use account '0000000000' with code '001' to test."
            : msg || "Could not verify account. Check account number and bank.",
          "error"
        );
        return;
      }
      setVerifyPopup({ account_name: verify.account_name, account_number: verify.account_number, bank_code: bankCode });
    } catch { addNotification("Verification failed", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmAccount = async () => {
    const bankCode = verifyPopup?.bank_code;
    const accountName = formData.accountName;
    const accountNumber = formData.accountNumber;
    setVerifyPopup(null);
    setIsSubmitting(true);
    try {
      const sub = await createPaystackSubaccount({
        business_name: accountName, account_number: accountNumber,
        bank_code: bankCode, percentage_charge: 0,
      });
      if (!sub.success) { addNotification(sub.message || "Failed to create Paystack subaccount", "error"); return; }
      await saveAccount(sub.subaccount_code);
    } catch { addNotification("Failed to create subaccount", "error"); }
    finally { setIsSubmitting(false); }
  };

  const saveAccount = async (subaccount_code) => {
    setIsSubmitting(true);
    try {
      const result = await createSchoolAccount({
        school_id: schoolId,
        account_name: formData.accountName, account_number: formData.accountNumber,
        bank_name: formData.bankName, bank_code: formData.bankCode?.trim() || null,
        account_type: formData.accountType, description: formData.description,
        is_default: formData.isDefault, subaccount_code: subaccount_code || null,
        created_by: user?.admin?.admin_id || user?.user_id,
      });
      if (result.success) {
        addNotification("School account created successfully", "success");
        setIsAddMenuOpen(false); resetForm(); fetchAccounts();
      } else addNotification(result.message || "Failed to create school account", "error");
    } catch { addNotification("Error creating school account", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleEditSubmit = async () => {
    if (!formData.accountName || !formData.accountNumber || !formData.bankName) {
      addNotification("Please fill in all required fields", "error"); return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateSchoolAccount(selectedAccount.account_id, {
        account_name: formData.accountName, account_number: formData.accountNumber,
        bank_name: formData.bankName, account_type: formData.accountType,
        description: formData.description, is_default: formData.isDefault,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });
      if (result.success) {
        addNotification("School account updated successfully", "success");
        setIsEditMenuOpen(false); setSelectedAccount(null); resetForm(); fetchAccounts();
      } else addNotification(result.message || "Failed to update school account", "error");
    } catch { addNotification("Error updating school account", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleCreate = () => {
    if (!canCreate) { addNotification("No permission to add school accounts.", "error"); return; }
    resetForm(); setIsAddMenuOpen(true);
  };

  const handleEditAccount = (account) => {
    if (!canEdit) { addNotification("No permission to edit school accounts.", "error"); return; }
    setSelectedAccount(account);
    setFormData({
      accountName: account.account_name, accountNumber: account.account_number,
      bankName: account.bank_name, bankCode: account.bank_code || "",
      accountType: account.account_type, description: account.description || "",
      isDefault: account.is_default,
    });
    setIsEditMenuOpen(true);
  };

  const handleDeleteAccount = async (account) => {
    if (!canDelete) { addNotification("No permission to delete school accounts.", "error"); return; }
    if (account.is_default) { addNotification("Cannot delete default account. Set another as default first.", "error"); return; }
    if (!window.confirm(`Delete "${account.account_name}"? This cannot be undone.`)) return;
    try {
      const result = await deleteSchoolAccount(account.account_id, user?.admin?.admin_id || user?.user_id);
      if (result.success) { addNotification("Account deleted", "success"); setIsDetailMenuOpen(false); fetchAccounts(); }
      else addNotification(result.message || "Failed to delete account", "error");
    } catch { addNotification("Error deleting account", "error"); }
  };

  const handleSetDefault = async (account) => {
    if (!canEdit) { addNotification("No permission to change default account.", "error"); return; }
    if (account.is_default) { addNotification("Already set as default", "info"); return; }
    try {
      const result = await setDefaultAccount(account.account_id, user?.admin?.admin_id || user?.user_id);
      if (result.success) { addNotification("Default account updated", "success"); fetchAccounts(); }
      else addNotification(result.message || "Failed to set default", "error");
    } catch { addNotification("Error setting default account", "error"); }
  };

  const toggleVisibility = (id) =>
    setVisibleAccountNumbers((prev) => ({ ...prev, [id]: !prev[id] }));

  const mask = (num) => "•".repeat(num.length);

  const formatCurrency = (amount, currency = "NGN") =>
    `${currency === "NGN" ? "₦" : currency}${parseFloat(amount || 0).toLocaleString()}`;

  /* ── Panel form (shared for add/edit) — now defined outside, passed as props ── */

  return (
    <SubAdminGuard permission="school_account">
      <div className="sa-wrap">
        <InnerTabCon>

          {/* Header */}
          <div className="sa-header">
            <div className="sa-header-left">
              <h2 className="sa-title">School Bank Accounts</h2>
              <p className="sa-subtitle">Manage your school's bank accounts and financial information</p>
            </div>
            <Button onClick={handleCreate}>Add New Account</Button>
          </div>

          {/* Content */}
          {dataLoading ? (
            <div className="sa-loading"><LoadingData message="Loading school accounts..." /></div>
          ) : accountsData.length === 0 ? (
            <div className="sa-empty">
              <div className="sa-empty-icon"><IconBank /></div>
              <p className="sa-empty-title">No school accounts found</p>
              <p className="sa-empty-sub">Add your first school bank account to get started</p>
              <Button onClick={handleCreate}>Add New Account</Button>
            </div>
          ) : (
            <div className="sa-grid">
              {accountsData.map((account) => (
                <div key={account.account_id} className="sa-card" onClick={() => { setSelectedAccount(account); setIsDetailMenuOpen(true); }}>

                  {/* Card header */}
                  <div className="sa-card-header">
                    <div className="sa-card-icon"><IconBank /></div>
                    <div className="sa-card-info">
                      <h4 className="sa-card-name">{account.account_name}</h4>
                      <p className="sa-card-desc">{account.description || account.bank_name}</p>
                    </div>
                    <div className="sa-card-badges">
                      {account.is_default && <span className="sa-badge default">Default</span>}
                      <span className={`sa-badge status ${account.status?.toLowerCase()}`}>{account.status}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="sa-card-body">
                    <div className="sa-card-row">
                      <span className="sa-card-label">Account No.</span>
                      <div className="sa-card-acct-wrap">
                        <span className="sa-card-acct">
                          {visibleAccountNumbers[account.account_id] ? account.account_number : mask(account.account_number)}
                        </span>
                        <button className="sa-eye-btn" onClick={(e) => { e.stopPropagation(); toggleVisibility(account.account_id); }}>
                          <IconEye open={visibleAccountNumbers[account.account_id]} />
                        </button>
                      </div>
                    </div>
                    <div className="sa-card-row">
                      <span className="sa-card-label">Bank</span>
                      <span className="sa-card-value">{account.bank_name}</span>
                    </div>
                    <div className="sa-card-row">
                      <span className="sa-card-label">Type</span>
                      <span className={`sa-type-badge ${account.account_type?.toLowerCase()}`}>{account.account_type}</span>
                    </div>
                    {account.balance && (
                      <div className="sa-card-row">
                        <span className="sa-card-label">Balance</span>
                        <span className="sa-card-balance">{formatCurrency(account.balance, account.currency)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card actions */}
                  <div className="sa-card-actions">
                    {!account.is_default && (
                      <button className="sa-action-btn star" onClick={(e) => { e.stopPropagation(); handleSetDefault(account); }}>
                        <IconStar /> Set Default
                      </button>
                    )}
                    <button className="sa-action-btn edit" onClick={(e) => { e.stopPropagation(); handleEditAccount(account); }}>
                      <IconEdit /> Edit
                    </button>
                    <button className="sa-action-btn delete" disabled={account.is_default}
                      onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account); }}>
                      <IconDelete /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InnerTabCon>

        {/* Add panel */}
        <SlideInMenu isShow={isAddMenuOpen} onClose={() => { setIsAddMenuOpen(false); resetForm(); }} width="500px">
          <AccountForm
            isEdit={false}
            formData={formData}
            bankList={bankList}
            isSubmitting={isSubmitting}
            onInputChange={handleInputChange}
            onBankChange={handleBankChange}
            onSubmit={handleSubmit}
            onClose={() => { setIsAddMenuOpen(false); resetForm(); }}
          />
        </SlideInMenu>

        {/* Edit panel */}
        <SlideInMenu isShow={isEditMenuOpen} onClose={() => { setIsEditMenuOpen(false); setSelectedAccount(null); resetForm(); }} width="500px">
          <AccountForm
            isEdit={true}
            formData={formData}
            bankList={bankList}
            isSubmitting={isSubmitting}
            onInputChange={handleInputChange}
            onBankChange={handleBankChange}
            onSubmit={handleEditSubmit}
            onClose={() => { setIsEditMenuOpen(false); setSelectedAccount(null); resetForm(); }}
          />
        </SlideInMenu>

        {/* Detail panel */}
        <SlideInMenu isShow={isDetailMenuOpen} onClose={() => { setIsDetailMenuOpen(false); setSelectedAccount(null); }} width="520px">
          {selectedAccount && (
            <div className="sa-panel">
              <div className="sa-panel-header">
                <span className="sa-panel-deco" aria-hidden="true" />
                <div className="sa-panel-header-content">
                  <div className="sa-panel-header-icon"><IconBank /></div>
                  <div className="sa-panel-header-text">
                    <h2>{selectedAccount.account_name}</h2>
                    <p>{selectedAccount.bank_name}</p>
                  </div>
                </div>
              </div>
              <div className="sa-panel-body">

                <div className="sa-detail-section">
                  <span className="sa-detail-section-title">Basic Information</span>
                  <div className="sa-detail-grid">
                    {[
                      { label: "Account Name",   value: selectedAccount.account_name },
                      { label: "Bank Name",       value: selectedAccount.bank_name },
                      { label: "Account Type",    value: selectedAccount.account_type },
                      { label: "Status",          value: selectedAccount.status },
                      { label: "Default Account", value: selectedAccount.is_default ? "Yes" : "No" },
                    ].map(({ label, value }) => (
                      <div key={label} className="sa-detail-item">
                        <span className="sa-detail-label">{label}</span>
                        <span className="sa-detail-value">{value}</span>
                      </div>
                    ))}
                    <div className="sa-detail-item">
                      <span className="sa-detail-label">Account Number</span>
                      <div className="sa-acct-display">
                        <span className="sa-acct-num">
                          {visibleAccountNumbers[selectedAccount.account_id]
                            ? selectedAccount.account_number
                            : mask(selectedAccount.account_number)}
                        </span>
                        <button className="sa-eye-btn" onClick={() => toggleVisibility(selectedAccount.account_id)}>
                          <IconEye open={visibleAccountNumbers[selectedAccount.account_id]} />
                        </button>
                      </div>
                    </div>
                    {selectedAccount.description && (
                      <div className="sa-detail-item sa-detail-full">
                        <span className="sa-detail-label">Description</span>
                        <span className="sa-detail-value">{selectedAccount.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sa-detail-section">
                  <span className="sa-detail-section-title">History</span>
                  <div className="sa-detail-grid">
                    {[
                      { label: "Created",     value: selectedAccount.created_at ? new Date(selectedAccount.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                      { label: "Last Updated", value: selectedAccount.last_modified ? new Date(selectedAccount.last_modified).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
                      { label: "Created By",  value: selectedAccount.created_by || "—" },
                      { label: "Updated By",  value: selectedAccount.modified_by || "—" },
                    ].map(({ label, value }) => (
                      <div key={label} className="sa-detail-item">
                        <span className="sa-detail-label">{label}</span>
                        <span className="sa-detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sa-detail-actions">
                  {!selectedAccount.is_default && (
                    <button className="sa-action-btn star" onClick={() => { setIsDetailMenuOpen(false); handleSetDefault(selectedAccount); }}>
                      <IconStar /> Set as Default
                    </button>
                  )}
                  <button className="sa-action-btn edit" onClick={() => { setIsDetailMenuOpen(false); handleEditAccount(selectedAccount); }}>
                    <IconEdit /> Edit Account
                  </button>
                  <button className="sa-action-btn delete" disabled={selectedAccount.is_default}
                    onClick={() => { setIsDetailMenuOpen(false); handleDeleteAccount(selectedAccount); }}>
                    <IconDelete /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </SlideInMenu>

        {/* Paystack verify popup */}
        {verifyPopup && (
          <div className="sa-verify-overlay">
            <div className="sa-verify-modal">
              <div className="sa-verify-icon">
                <IconBank />
              </div>
              <h3 className="sa-verify-title">Is this your account?</h3>
              <p className="sa-verify-sub">Please confirm this account belongs to your school.</p>
              <div className="sa-verify-card">
                <div className="sa-verify-row">
                  <span className="sa-verify-label">Account Name</span>
                  <span className="sa-verify-value">{verifyPopup.account_name}</span>
                </div>
                <div className="sa-verify-row">
                  <span className="sa-verify-label">Account Number</span>
                  <span className="sa-verify-value">{verifyPopup.account_number}</span>
                </div>
              </div>
              <div className="sa-verify-btns">
                <Button variant="secondary" onClick={() => setVerifyPopup(null)}>No, go back</Button>
                <Button onClick={handleConfirmAccount} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Yes, this is mine"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SubAdminGuard>
  );
};

export default SchoolAccountsTab;
