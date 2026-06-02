import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useFeeBillTemplate } from "../../../../../api_call/useFeeBillTemplate";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubAdminGuard from "../../../../../components/SubAdminGuard/SubAdminGuard";
import {
  FaPlus,
  FaEdit,
  FaCopy,
  FaTrash,
  FaGripVertical,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaBan,
  FaCheckCircle,
} from "react-icons/fa";

const FeeBillTemplates = () => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const {
    createFeeBillTemplate,
    getFeeBillTemplatesBySchool,
    updateFeeBillTemplate,
    deleteFeeBillTemplate,
    duplicateFeeBillTemplate,
    updateTemplateStatus,
  } = useFeeBillTemplate();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.fee_billing_template?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.fee_billing_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.fee_billing_template?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [feeBillTemplates, setFeeBillTemplates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch fee bill templates on component mount
  useEffect(() => {
    fetchFeeBillTemplates();
  }, [schoolId]);

  const fetchFeeBillTemplates = async () => {
    if (!schoolId) return;

    setDataLoading(true);
    try {
      const result = await getFeeBillTemplatesBySchool(schoolId);

      if (result.success) {
        setFeeBillTemplates(result.data);
      } else {
        addNotification(
          result.message || "Failed to fetch fee bill templates",
          "error"
        );
        setFeeBillTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching fee bill templates:", error);
      addNotification("Error fetching fee bill templates", "error");
      setFeeBillTemplates([]);
    } finally {
      setDataLoading(false);
    }
  };

  // Sample fee bill templates data (removed - now using API)
  const sampleFeeBillTemplates = [
    {
      id: 1,
      name: "Termly Tuition Bill",
      description:
        "Standard bill for junior classes with comprehensive fee breakdown",
      status: "active",
      lastModified: "2024-01-15",
      createdBy: "Finance Manager",
      category: "Fees",
      billItems: [
        {
          itemName: "Tuition",
          amount: 50000,
          description: "Core academic fees",
        },
        {
          itemName: "Books & Supplies",
          amount: 10000,
          description: "Textbooks and learning materials",
        },
        {
          itemName: "Uniform",
          amount: 5000,
          description: "School attire",
        },
        {
          itemName: "Sports Fee",
          amount: 3000,
          description: "Athletic activities and equipment",
        },
      ],
      totalAmount: 68000,
      dueDateOption: "relative",
      dueDateValue: "30 days after term start",
      allowInstallments: true,
      installmentCount: 3,
      minPayment: 20000,
      lateFee: {
        type: "fixed",
        value: 500,
        unit: "per day",
      },
      currency: "NGN",
    },
    {
      id: 2,
      name: "Senior Class Fee Bill",
      description: "Comprehensive fee structure for senior secondary students",
      status: "active",
      lastModified: "2024-01-12",
      createdBy: "Accounts Officer",
      category: "Fees",
      billItems: [
        {
          itemName: "Tuition",
          amount: 75000,
          description: "Advanced academic program fees",
        },
        {
          itemName: "Laboratory Fee",
          amount: 15000,
          description: "Science lab equipment and materials",
        },
        {
          itemName: "Examination Fee",
          amount: 8000,
          description: "Internal and external examinations",
        },
        {
          itemName: "Library Fee",
          amount: 2000,
          description: "Library resources and maintenance",
        },
      ],
      totalAmount: 100000,
      dueDateOption: "fixed",
      dueDateValue: "2024-03-15",
      allowInstallments: true,
      installmentCount: 2,
      minPayment: 40000,
      lateFee: {
        type: "percentage",
        value: 5,
        unit: "% of total",
      },
      currency: "NGN",
    },
    {
      id: 3,
      name: "Boarding Fee Template",
      description:
        "Complete boarding house fees including accommodation and meals",
      status: "active",
      lastModified: "2024-01-10",
      createdBy: "Boarding Master",
      category: "Fees",
      billItems: [
        {
          itemName: "Accommodation",
          amount: 40000,
          description: "Dormitory accommodation",
        },
        {
          itemName: "Feeding",
          amount: 35000,
          description: "Three meals daily",
        },
        {
          itemName: "Laundry",
          amount: 5000,
          description: "Laundry services",
        },
        {
          itemName: "Security",
          amount: 3000,
          description: "24/7 security services",
        },
      ],
      totalAmount: 83000,
      dueDateOption: "relative",
      dueDateValue: "14 days after resumption",
      allowInstallments: false,
      installmentCount: 1,
      minPayment: 83000,
      lateFee: {
        type: "fixed",
        value: 1000,
        unit: "per day",
      },
      currency: "NGN",
    },
    {
      id: 4,
      name: "Extra-Curricular Activities Bill",
      description: "Fees for optional activities and clubs",
      status: "draft",
      lastModified: "2024-01-08",
      createdBy: "Activities Coordinator",
      category: "Fees",
      billItems: [
        {
          itemName: "Music Lessons",
          amount: 8000,
          description: "Individual music instruction",
        },
        {
          itemName: "Drama Club",
          amount: 5000,
          description: "Drama and theater activities",
        },
        {
          itemName: "Computer Club",
          amount: 12000,
          description: "Advanced computer programming",
        },
      ],
      totalAmount: 25000,
      dueDateOption: "fixed",
      dueDateValue: "2024-02-28",
      allowInstallments: true,
      installmentCount: 2,
      minPayment: 10000,
      lateFee: {
        type: "percentage",
        value: 3,
        unit: "% of total",
      },
      currency: "NGN",
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Fees",
    billItems: [
      {
        itemName: "",
        amount: 0,
        description: "",
      },
    ],
    totalAmount: 0,
    dueDateValue: "",
    allowInstallments: false,
    installmentCount: 1,
    minPayment: 0,
    currency: "NGN",
  });

  const currencyOptions = [
    { value: "NGN", label: "₦ Nigerian Naira (NGN)" },
    { value: "USD", label: "$ US Dollar (USD)" },
    { value: "GBP", label: "£ British Pound (GBP)" },
    { value: "EUR", label: "€ Euro (EUR)" },
  ];

  // Calculate total amount whenever bill items change
  useEffect(() => {
    const total = formData.billItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0
    );
    setFormData((prev) => ({ ...prev, totalAmount: total }));
  }, [formData.billItems]);

  // Format currency display
  const formatCurrency = (amount, currency = "NGN") => {
    const symbols = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };
    return `${symbols[currency] || "₦"}${amount.toLocaleString()}`;
  };

  const handleInputChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleBillItemChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      billItems: prev.billItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addBillItem = () => {
    setFormData((prev) => ({
      ...prev,
      billItems: [
        ...prev.billItems,
        {
          itemName: "",
          amount: 0,
          description: "",
        },
      ],
    }));
  };

  const removeBillItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      billItems: prev.billItems.filter((_, i) => i !== index),
    }));
  };

  const moveBillItem = (fromIndex, toIndex) => {
    setFormData((prev) => {
      const newItems = [...prev.billItems];
      const [movedItem] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, movedItem);
      return { ...prev, billItems: newItems };
    });
  };

  const handleCreateTemplate = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create fee bill templates.", "error");
      return;
    }
    setIsCreateMenuOpen(true);
    setSelectedTemplate(null);
    setFormData({
      name: "",
      description: "",
      category: "Fees",
      billItems: [
        {
          itemName: "",
          amount: 0,
          description: "",
        },
      ],
      totalAmount: 0,
      dueDateValue: "",
      allowInstallments: false,
      installmentCount: 1,
      minPayment: 0,
      currency: "NGN",
    });
  };

  const handleEditTemplate = (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit fee bill templates.", "error");
      return;
    }
    setSelectedTemplate(template);
    const billItems = template.bill_items || template.billItems;

    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      billItems: billItems.map((item) => ({
        itemName: item.item_name || item.itemName,
        amount: item.amount,
        description: item.description || "",
      })),
      totalAmount: template.total_amount || template.totalAmount,
      dueDateValue: template.due_date_value || template.dueDateValue || "",
      allowInstallments:
        template.allow_installments || template.allowInstallments || false,
      installmentCount:
        template.installment_count || template.installmentCount || 1,
      minPayment: template.min_payment || template.minPayment || 0,
      currency: template.currency || "NGN",
    });
    setIsCreateMenuOpen(true);
    setIsDetailMenuOpen(false);
  };

  const handleViewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsDetailMenuOpen(true);
  };

  const handleSubmit = async () => {
    if (formData.totalAmount <= 0) {
      addNotification("Total amount must be greater than 0", "error");
      return;
    }

    if (!formData.name || formData.name.trim() === "") {
      addNotification("Template name is required", "error");
      return;
    }

    if (formData.billItems.length === 0) {
      addNotification("At least one bill item is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const templateData = {
        school_id: schoolId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        bill_items: formData.billItems.map((item) => ({
          item_name: item.itemName,
          amount: item.amount,
          description: item.description || "",
        })),
        total_amount: formData.totalAmount,
        currency: formData.currency,
        due_date_value: formData.dueDateValue,
        allow_installments: formData.allowInstallments,
        installment_count: formData.allowInstallments
          ? formData.installmentCount
          : 1,
        min_payment: formData.allowInstallments ? formData.minPayment : 0,
        created_by: user?.admin?.admin_id || user?.user_id,
        modified_by: user?.admin?.admin_id || user?.user_id,
      };

      let result;
      if (selectedTemplate) {
        // Update existing template
        result = await updateFeeBillTemplate(
          selectedTemplate.template_id,
          templateData
        );
      } else {
        // Create new template
        result = await createFeeBillTemplate(templateData);
      }

      if (result.success) {
        addNotification(
          selectedTemplate
            ? "Fee bill template updated successfully"
            : "Fee bill template created successfully",
          "success"
        );
        setIsCreateMenuOpen(false);
        // Refresh templates list
        fetchFeeBillTemplates();
      } else {
        addNotification(
          result.message ||
            `Failed to ${
              selectedTemplate ? "update" : "create"
            } fee bill template`,
          "error"
        );
      }
    } catch (error) {
      console.error("Submit fee bill template error:", error);
      addNotification("Error submitting fee bill template", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (template) => {
    if (!canCreate) {
      addNotification("You do not have permission to duplicate fee bill templates.", "error");
      return;
    }
    try {
      const result = await duplicateFeeBillTemplate(
        template.template_id,
        user?.admin?.admin_id || user?.user_id
      );

      if (result.success) {
        addNotification("Fee bill template duplicated successfully", "success");
        // Refresh templates list
        fetchFeeBillTemplates();
      } else {
        addNotification(
          result.message || "Failed to duplicate fee bill template",
          "error"
        );
      }
    } catch (error) {
      console.error("Duplicate template error:", error);
      addNotification("Error duplicating fee bill template", "error");
    }
  };

  const handleDelete = async (template) => {
    if (!canDelete) {
      addNotification("You do not have permission to delete fee bill templates.", "error");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteFeeBillTemplate(template.template_id, user?.admin?.admin_id || user?.user_id);

      if (result.success) {
        addNotification("Fee bill template deleted successfully", "success");
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchFeeBillTemplates();
      } else {
        addNotification(
          result.message || "Failed to delete fee bill template",
          "error"
        );
      }
    } catch (error) {
      console.error("Delete template error:", error);
      addNotification("Error deleting fee bill template", "error");
    }
  };

  const handleStatusToggle = async (template) => {
    if (!canEdit) {
      addNotification("You do not have permission to change template status.", "error");
      return;
    }
    const newStatus = template.status === "active" ? "archived" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    if (
      !window.confirm(`Are you sure you want to ${action} "${template.name}"?`)
    ) {
      return;
    }

    try {
      const result = await updateTemplateStatus(
        template.template_id,
        newStatus,
        user?.admin?.admin_id || user?.user_id
      );

      if (result.success) {
        addNotification(`Fee bill template ${action}d successfully`, "success");
        setIsDetailMenuOpen(false);
        // Refresh templates list
        fetchFeeBillTemplates();
      } else {
        addNotification(
          result.message || `Failed to ${action} fee bill template`,
          "error"
        );
      }
    } catch (error) {
      console.error(`${action} template error:`, error);
      addNotification(`Error ${action}ing fee bill template`, "error");
    }
  };

  return (
    <SubAdminGuard permission="fee_billing_template">
    <InnerTabCon>
      <div className="templates-container">
        <div className="templates-header">
          <div className="templates-header-left">
            <h2>Fee Bill Templates</h2>
            <p>
              Design and customize fee invoices, receipts, and billing documents
            </p>
          </div>
          <div className="templates-actions">
            <Button onClick={handleCreateTemplate}>
              <FaPlus size={14} style={{ marginRight: "8px" }} />
              Create Template
            </Button>
          </div>
        </div>

        <div className="template-section">
          <h3>Available Fee Bill Templates</h3>

          {dataLoading ? (
            <div className="kk-template-empty-state">
              <LoadingData message="Loading fee bill templates..." />
            </div>
          ) : feeBillTemplates.length === 0 ? (
            <div className="kk-template-empty-state">
              <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
                No fee bill templates found
              </p>
              <p style={{ margin: "0 0 20px 0", fontSize: "14px" }}>
                Create your first fee bill template to get started
              </p>
              <Button onClick={handleCreateTemplate}>
                <FaPlus size={14} style={{ marginRight: "8px" }} />
                Create Template
              </Button>
            </div>
          ) : (
            <div className="template-grid">
              {feeBillTemplates.map((template) => {
                const billItems = template.bill_items || template.billItems;
                const totalAmount =
                  template.total_amount || template.totalAmount;
                const allowInstallments =
                  template.allow_installments || template.allowInstallments;
                const installmentCount =
                  template.installment_count || template.installmentCount;

                return (
                  <div
                    key={template.template_id || template.id}
                    className="template-card"
                    onClick={() => handleViewTemplate(template)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="template-card-header">
                      <h4 className="template-card-title">{template.name}</h4>
                      <span
                        className={`template-card-status ${template.status}`}
                      >
                        {template.status}
                      </span>
                    </div>
                    <p className="template-card-description">
                      {template.description}
                    </p>
                    <div className="template-details">
                      <div className="template-detail-item">
                        <strong>Bill Items:</strong> {billItems.length}
                      </div>
                      <div className="template-detail-item">
                        <strong>Total Amount:</strong>{" "}
                        {formatCurrency(totalAmount, template.currency)}
                      </div>
                      <div className="template-detail-item">
                        <strong>Installments:</strong>{" "}
                        {allowInstallments
                          ? `${installmentCount} payments`
                          : "Single payment"}
                      </div>
                    </div>
                    <div className="bill-items-preview">
                      <strong>Key Items:</strong>
                      <ul>
                        {billItems.slice(0, 3).map((item, index) => (
                          <li key={index}>
                            {item.item_name || item.itemName} (
                            {formatCurrency(item.amount, template.currency)})
                          </li>
                        ))}
                        {billItems.length > 3 && (
                          <li>+{billItems.length - 3} more items</li>
                        )}
                      </ul>
                    </div>
                    <div className="template-card-meta">
                      <span>
                        Modified:{" "}
                        {template.last_modified || template.lastModified}
                      </span>
                      <span>
                        By:{" "}
                        {template.created_by || template.createdBy || "----"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create/Edit Template SlideInMenu */}
        <SlideInMenu
          isShow={isCreateMenuOpen}
          onClose={() => setIsCreateMenuOpen(false)}
          width="900px"
        >
          <div className="create-template-container">
            <div className="create-template-header">
              <h2>{selectedTemplate ? "Edit" : "Create"} Fee Bill Template</h2>
              <p>Design your comprehensive fee billing template</p>
            </div>

            <div className="create-template-form">
              {/* Basic Information */}
              <div className="form-row">
                <FormInput
                  label="Template Name *"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  placeholder="e.g., Termly Tuition Bill"
                />

                <FormInput
                  label="Category"
                  type="select"
                  value={formData.category}
                  onChange={handleInputChange("category")}
                  options={[{ value: "Fees", label: "Fees" }]}
                  disabled
                />
              </div>

              <FormInput
                label="Description"
                type="textarea"
                value={formData.description}
                onChange={handleInputChange("description")}
                placeholder="e.g., Standard bill for junior classes"
                height="80px"
              />

              {/* Bill Items Section */}
              <div className="bill-items-section">
                <div className="bill-items-header">
                  <h3>Bill Items</h3>
                  <div className="total-amount-display">
                    <span className="total-label">Total:</span>
                    <span className="total-value">
                      {formatCurrency(formData.totalAmount, formData.currency)}
                    </span>
                  </div>
                  <Button variant="secondary" onClick={addBillItem}>
                    <FaPlus size={12} /> Add Item
                  </Button>
                </div>

                <div className="bill-items-table">
                  <div className="items-table-header">
                    <span></span>
                    <span>Item Name</span>
                    <span>Amount</span>
                    <span>Description</span>
                    <span>Actions</span>
                  </div>

                  {formData.billItems.map((item, index) => (
                    <div key={index} className="bill-item-row">
                      <div className="drag-handle">
                        {/* <FaGripVertical size={12} /> */}
                      </div>
                      <FormInput
                        type="text"
                        value={item.itemName}
                        onChange={(value) =>
                          handleBillItemChange(index, "itemName", value)
                        }
                        placeholder="e.g., Tuition"
                      />
                      <FormInput
                        type="number"
                        value={item.amount}
                        onChange={(value) =>
                          handleBillItemChange(
                            index,
                            "amount",
                            parseFloat(value) || 0
                          )
                        }
                        placeholder="50000"
                        min="0"
                      />
                      <FormInput
                        type="text"
                        value={item.description}
                        onChange={(value) =>
                          handleBillItemChange(index, "description", value)
                        }
                        placeholder="Core academic fees"
                      />
                      {formData.billItems.length > 1 && (
                        <button
                          className="remove-item-btn"
                          onClick={() => removeBillItem(index)}
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Options Section */}
              <div className="payment-options-section">
                <h3>Payment Options</h3>

                <div className="form-row">
                  <FormInput
                    label="Currency"
                    type="select"
                    value={formData.currency}
                    onChange={handleInputChange("currency")}
                    options={currencyOptions}
                  />

                  <FormInput
                    label="Due Date Description"
                    type="text"
                    value={formData.dueDateValue}
                    onChange={handleInputChange("dueDateValue")}
                    placeholder="e.g., 30 days after term start"
                  />
                </div>

                <div className="installments-section">
                  <label className="installment-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.allowInstallments}
                      onChange={(e) =>
                        handleInputChange("allowInstallments")(e.target.checked)
                      }
                    />
                    <span>Allow Installments</span>
                  </label>

                  {formData.allowInstallments && (
                    <div className="installment-details">
                      <div className="form-row">
                        <FormInput
                          label="Number of Installments"
                          type="number"
                          value={formData.installmentCount}
                          onChange={(value) =>
                            handleInputChange("installmentCount")(
                              parseInt(value) || 1
                            )
                          }
                          min="2"
                          max="12"
                        />

                        <FormInput
                          label="Minimum Payment"
                          type="number"
                          value={formData.minPayment}
                          onChange={(value) =>
                            handleInputChange("minPayment")(
                              parseFloat(value) || 0
                            )
                          }
                          placeholder="20000"
                          min="0"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="create-template-footer">
              <Button
                variant="secondary"
                onClick={() => setIsCreateMenuOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !formData.name ||
                  formData.billItems.length === 0 ||
                  formData.totalAmount <= 0 ||
                  isSubmitting
                }
              >
                {isSubmitting
                  ? selectedTemplate
                    ? "Updating..."
                    : "Creating..."
                  : selectedTemplate
                  ? "Update Template"
                  : "Create Template"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Template Detail SlideInMenu */}
        <SlideInMenu
          isShow={isDetailMenuOpen}
          onClose={() => setIsDetailMenuOpen(false)}
          width="700px"
        >
          {selectedTemplate &&
            (() => {
              const billItems =
                selectedTemplate.bill_items || selectedTemplate.billItems;
              const totalAmount =
                selectedTemplate.total_amount || selectedTemplate.totalAmount;
              const allowInstallments =
                selectedTemplate.allow_installments ||
                selectedTemplate.allowInstallments;
              const installmentCount =
                selectedTemplate.installment_count ||
                selectedTemplate.installmentCount;
              const minPayment =
                selectedTemplate.min_payment || selectedTemplate.minPayment;
              const dueDateValue =
                selectedTemplate.due_date_value ||
                selectedTemplate.dueDateValue;

              return (
                <div className="template-detail-container">
                  <div className="template-detail-header">
                    <div className="template-detail-title">
                      <h2>{selectedTemplate.name}</h2>
                      <span
                        className={`template-card-status ${selectedTemplate.status}`}
                      >
                        {selectedTemplate.status}
                      </span>
                    </div>
                    <p className="template-detail-description">
                      {selectedTemplate.description}
                    </p>
                    <div className="template-detail-meta">
                      <div className="template-meta-item">
                        <strong>Last Modified:</strong>{" "}
                        {selectedTemplate.last_modified ||
                          selectedTemplate.lastModified}
                      </div>
                      <div className="template-meta-item">
                        <strong>Created By:</strong>{" "}
                        {selectedTemplate.created_by ||
                          selectedTemplate.createdBy ||
                          "----"}
                      </div>
                      <div className="template-meta-item">
                        <strong>Category:</strong> {selectedTemplate.category}
                      </div>
                    </div>
                  </div>

                  <div className="template-detail-content">
                    {/* Bill Items Section */}
                    <div className="detail-section">
                      <h3>
                        <FaMoneyBillWave
                          size={16}
                          style={{ marginRight: "8px" }}
                        />
                        Bill Items ({billItems.length})
                      </h3>
                      <div className="bill-items-detail-table">
                        <div className="items-detail-header">
                          <span>Item Name</span>
                          <span>Amount</span>
                          <span>Description</span>
                        </div>
                        {billItems.map((item, index) => (
                          <div key={index} className="items-detail-row">
                            <span>{item.item_name || item.itemName}</span>
                            <span className="amount-cell">
                              {formatCurrency(
                                item.amount,
                                selectedTemplate.currency
                              )}
                            </span>
                            <span>{item.description}</span>
                          </div>
                        ))}
                        <div className="items-detail-footer">
                          <span>
                            <strong>Total Amount:</strong>
                          </span>
                          <span className="total-amount">
                            <strong>
                              {formatCurrency(
                                totalAmount,
                                selectedTemplate.currency
                              )}
                            </strong>
                          </span>
                          <span></span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Configuration Section */}
                    <div className="detail-section">
                      <h3>
                        <FaCalendarAlt
                          size={16}
                          style={{ marginRight: "8px" }}
                        />
                        Payment Configuration
                      </h3>
                      <div className="payment-config-grid">
                        <div className="config-item">
                          <strong>Currency:</strong>
                          <span>{selectedTemplate.currency}</span>
                        </div>
                        <div className="config-item">
                          <strong>Due Date:</strong>
                          <span>{dueDateValue || "Not specified"}</span>
                        </div>
                        <div className="config-item">
                          <strong>Installments:</strong>
                          <span>
                            {allowInstallments
                              ? `${installmentCount} payments allowed`
                              : "Single payment only"}
                          </span>
                        </div>
                        {allowInstallments && (
                          <div className="config-item">
                            <strong>Minimum Payment:</strong>
                            <span>
                              {formatCurrency(
                                minPayment,
                                selectedTemplate.currency
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bill Preview Section */}
                    <div className="detail-section">
                      <h3>Bill Preview</h3>
                      <div className="bill-preview-container">
                        <div className="mock-bill">
                          <div className="bill-header">
                            <div className="school-info">
                              <h4>[School Name]</h4>
                              <p>[School Address]</p>
                            </div>
                            <div className="bill-title">
                              <h3>FEE BILL</h3>
                              <p>Bill #: FB-2024-001</p>
                            </div>
                          </div>

                          <div className="student-info">
                            <p>
                              <strong>Student:</strong> [Student Name]
                            </p>
                            <p>
                              <strong>Class:</strong> [Class/Grade]
                            </p>
                            <p>
                              <strong>Session:</strong> 2023/2024
                            </p>
                          </div>

                          <div className="bill-items-preview">
                            <table>
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {billItems.map((item, index) => (
                                  <tr key={index}>
                                    <td>{item.item_name || item.itemName}</td>
                                    <td>
                                      {formatCurrency(
                                        item.amount,
                                        selectedTemplate.currency
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <th>Total Amount</th>
                                  <th>
                                    {formatCurrency(
                                      totalAmount,
                                      selectedTemplate.currency
                                    )}
                                  </th>
                                </tr>
                              </tfoot>
                            </table>
                          </div>

                          <div className="bill-footer">
                            <p>
                              <strong>Due Date:</strong>{" "}
                              {dueDateValue || "Not specified"}
                            </p>
                            {allowInstallments && (
                              <p>
                                <strong>Installments:</strong>{" "}
                                {installmentCount} payments allowed (Min:{" "}
                                {formatCurrency(
                                  minPayment,
                                  selectedTemplate.currency
                                )}
                                )
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="template-detail-actions">
                    <Button
                      variant="secondary"
                      onClick={() => handleEditTemplate(selectedTemplate)}
                    >
                      <FaEdit size={14} style={{ marginRight: "8px" }} />
                      Edit Template
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDuplicate(selectedTemplate)}
                    >
                      <FaCopy size={14} style={{ marginRight: "8px" }} />
                      Duplicate
                    </Button>
                    <Button
                      variant={
                        selectedTemplate.status === "active"
                          ? "warning"
                          : "success"
                      }
                      onClick={() => handleStatusToggle(selectedTemplate)}
                    >
                      {selectedTemplate.status === "active" ? (
                        <>
                          <FaBan size={14} style={{ marginRight: "8px" }} />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <FaCheckCircle
                            size={14}
                            style={{ marginRight: "8px" }}
                          />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(selectedTemplate)}
                    >
                      <FaTrash size={14} style={{ marginRight: "8px" }} />
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })()}
        </SlideInMenu>
      </div>
    </InnerTabCon>
    </SubAdminGuard>
  );
};

export default FeeBillTemplates;

