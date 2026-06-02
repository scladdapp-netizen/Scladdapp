import "./StaffPerformance.css";
import { useState, useCallback } from "react";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../../../components/ServerSmartTable/ServerSmartTable";
import FormInput from "../../../../../../components/FormInput";
import InfoField from "../../../../../../components/infoField/InfoField";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import useStaffPerformance from "../../../../../../api_call/useStaffPerformance";

const getRatingStyle = (rating) => {
  const map = {
    "Outstanding":       { bg: "rgba(245,158,11,0.15)", color: "#b45309" },
    "Excellent":         { bg: "rgba(16,185,129,0.15)", color: "#065f46" },
    "Very Good":         { bg: "rgba(59,130,246,0.15)", color: "#1e40af" },
    "Good":              { bg: "rgba(245,158,11,0.12)", color: "#92400e" },
    "Satisfactory":      { bg: "rgba(156,163,175,0.2)", color: "#374151" },
    "Needs Improvement": { bg: "rgba(239,68,68,0.15)",  color: "#991b1b" },
  };
  return map[rating] || { bg: "#f0f0f0", color: "#555555" };
};

const getStatusColor = (s) => ({
  "Completed":   "#16a34a",
  "In Progress": "#d97706",
  "Scheduled":   "#2563eb",
  "Overdue":     "#cc3333",
}[s] || "#888888");

const RatingBadge = ({ rating }) => {
  const { bg, color } = getRatingStyle(rating);
  return <span className="perf-rating-badge" style={{ background: bg, color }}>{rating}</span>;
};

const RATING_OPTIONS = [
  { value: "Outstanding",       label: "Outstanding" },
  { value: "Excellent",         label: "Excellent" },
  { value: "Very Good",         label: "Very Good" },
  { value: "Good",              label: "Good" },
  { value: "Satisfactory",      label: "Satisfactory" },
  { value: "Needs Improvement", label: "Needs Improvement" },
  { value: "Not Rated",         label: "Not Rated" },
];

const EMPTY_FORM = {
  evaluation_type: "", evaluation_period: "", evaluator: "", evaluator_role: "",
  evaluation_date: "", status: "Scheduled", overall_rating: "Good", comments: "",
  categories: [], strengths: [], areas_for_improvement: [], goals: [],
};

const ListEditor = ({ label, items, onChange }) => {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (!v) return; onChange([...items, v]); setInput(""); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="perf-list-editor">
      <span className="perf-list-editor-label">{label}</span>
      <div className="perf-list-editor-add">
        <input className="perf-list-editor-input" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Type and press Enter or Add" />
        <button type="button" className="perf-list-editor-btn" onClick={add}>Add</button>
      </div>
      {items.length > 0 && (
        <div className="perf-list-editor-items">
          {items.map((item, i) => (
            <div key={i} className="perf-list-editor-item">
              <span>{item}</span>
              <button type="button" className="perf-list-editor-item-remove" onClick={() => remove(i)}>x</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryEditor = ({ categories, onChange }) => {
  const [newName, setNewName] = useState("");
  const addCat = () => {
    const name = newName.trim();
    if (!name || categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    onChange([...categories, { name, score: "", rating: "Not Rated", comments: "" }]);
    setNewName("");
  };
  const removeCat = (i) => onChange(categories.filter((_, idx) => idx !== i));
  const updateField = (i, field, value) => onChange(categories.map((c, idx) => idx === i ? { ...c, [field]: value } : c));
  return (
    <div>
      <div className="perf-cat-editor-add">
        <input className="perf-cat-editor-input" value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCat())}
          placeholder="Category name (e.g., Leadership)" />
        <button type="button" className="perf-cat-editor-btn" onClick={addCat}>Add</button>
      </div>
      {categories.length === 0 && <p className="perf-cat-editor-empty">No categories added yet.</p>}
      <div className="perf-cat-editor-list">
        {categories.map((cat, i) => (
          <div key={i} className="perf-cat-editor-item">
            <div className="perf-cat-editor-item-top">
              <span className="perf-cat-editor-item-name">{cat.name}</span>
              <button type="button" className="perf-cat-editor-remove" onClick={() => removeCat(i)}>x</button>
            </div>
            <div className="perf-cat-editor-item-grid">
              <FormInput label="Score (0-5)" type="number" value={cat.score}
                onChange={(v) => updateField(i, "score", v)} placeholder="e.g., 4.5" />
              <FormInput label="Rating" type="select" value={cat.rating}
                onChange={(v) => updateField(i, "rating", v)} options={RATING_OPTIONS} />
            </div>
            <FormInput label="Comments" value={cat.comments}
              onChange={(v) => updateField(i, "comments", v)} placeholder="Category comments..." />
          </div>
        ))}
      </div>
    </div>
  );
};

const StaffPerformance = ({ staffData }) => {
  const staff    = staffData?.staff || staffData;
  const staffId  = staff?.staff_id;
  const schoolId = staff?.school_id;

  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getPerformancePaginated, createPerformance, updatePerformance, deletePerformance } = useStaffPerformance();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.staff?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.staff?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.staff?.delete;

  const [selectedEval, setSelectedEval]           = useState(null);
  const [showDetail, setShowDetail]               = useState(false);
  const [showForm, setShowForm]                   = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode]               = useState(false);
  const [form, setForm]                           = useState(EMPTY_FORM);
  const [refreshKey, setRefreshKey]               = useState(0);

  const fetchData = useCallback((params) => getPerformancePaginated(staffId, params), [staffId, getPerformancePaginated]);
  const refresh = () => setRefreshKey((k) => k + 1);
  const setF = (field) => (v) => setForm((p) => ({ ...p, [field]: v }));

  const columns = [
    {
      label: "Evaluation", accessor: "evaluation_type",
      render: (v, row) => <div><p className="perf-eval-type">{v}</p><p className="perf-eval-period">{row.evaluation_period}</p></div>,
    },
    {
      label: "Evaluator", accessor: "evaluator",
      render: (v, row) => <div><p className="perf-eval-name">{v}</p><p className="perf-eval-role">{row.evaluator_role}</p></div>,
    },
    { label: "Date",   accessor: "evaluation_date", render: (v) => v ? new Date(v).toLocaleDateString() : "N/A" },
    { label: "Rating", accessor: "overall_rating",  render: (v) => <RatingBadge rating={v} /> },
    { label: "Status", accessor: "status",          render: (v) => <span className="perf-status" style={{ color: getStatusColor(v) }}>{v}</span> },
    { label: "Entered By", accessor: "entered_by_name", render: (v) => v || "N/A" },
  ];

  const handleRowClick = (row) => { setSelectedEval(row); setShowDetail(true); };

  const handleCreate = () => {
    if (!canCreate) { addNotification("No permission to create evaluations.", "error"); return; }
    setIsEditMode(false); setSelectedEval(null); setForm(EMPTY_FORM); setShowForm(true);
  };

  const handleEdit = (row) => {
    if (!canEdit) { addNotification("No permission to edit evaluations.", "error"); return; }
    setIsEditMode(true); setSelectedEval(row);
    setForm({
      evaluation_type: row.evaluation_type || "", evaluation_period: row.evaluation_period || "",
      evaluator: row.evaluator || "", evaluator_role: row.evaluator_role || "",
      evaluation_date: row.evaluation_date || "", status: row.status || "Scheduled",
      overall_rating: row.overall_rating || "Good", comments: row.comments || "",
      categories: row.categories ? Object.entries(row.categories).map(([name, cat]) => ({ name, score: cat.score ?? "", rating: cat.rating || "Not Rated", comments: cat.comments || "" })) : [],
      strengths: Array.isArray(row.strengths) ? [...row.strengths] : [],
      areas_for_improvement: Array.isArray(row.areas_for_improvement) ? [...row.areas_for_improvement] : [],
      goals: Array.isArray(row.goals) ? [...row.goals] : [],
    });
    setShowDetail(false); setShowForm(true);
  };

  const handleDeleteClick = (row) => {
    if (!canDelete) { addNotification("No permission to delete evaluations.", "error"); return; }
    setSelectedEval(row); setShowDetail(false); setShowDeleteConfirm(true);
  };

  const handleSubmit = async () => {
    if (!form.evaluation_type || !form.evaluator || !form.evaluation_date) {
      addNotification("Please fill in all required fields", "error"); return;
    }
    const payload = {
      ...form,
      categories: Object.fromEntries(form.categories.map(({ name, score, rating, comments }) => [name, { score: parseFloat(score) || 0, rating, comments }])),
      staff_id: staffId, school_id: schoolId,
      entered_by_id: admin?.admin_id || null,
      entered_by_name: admin?.full_name || admin?.username || null,
    };
    const result = isEditMode ? await updatePerformance(selectedEval.evaluation_id, payload) : await createPerformance(payload);
    if (result.success) {
      addNotification(isEditMode ? "Evaluation updated" : "Evaluation created", "success");
      setShowForm(false); refresh();
    } else addNotification(result.message || "Operation failed", "error");
  };

  const handleConfirmDelete = async () => {
    const result = await deletePerformance(selectedEval.evaluation_id);
    if (result.success) {
      addNotification("Evaluation deleted", "success");
      setShowDeleteConfirm(false); setSelectedEval(null); refresh();
    } else addNotification(result.message || "Delete failed", "error");
  };

  return (
    <InnerTabCon>
      <div className="staffPerformance">
        <div className="performanceHeader">
          <div className="performanceHeaderLeft">
            <h2 className="performanceTitle">Performance Evaluations</h2>
            <p className="performanceSubtitle">Staff performance reviews, leadership assessments, and professional development tracking</p>
          </div>
        </div>

        <ServerSmartTable
          key={refreshKey}
          columns={columns}
          fetchData={fetchData}
          onRowClick={handleRowClick}
          onCreate={handleCreate}
          creattext="New Evaluation"
          enableSelect={false}
          initialPageSize={10}
        />

        {/* Detail Panel */}
        <SlideInMenu isShow={showDetail} onClose={() => setShowDetail(false)} width="760px">
          {selectedEval && (
            <div className="perf-panel">
              <div className="perf-panel-header default">
                <span className="perf-panel-deco" aria-hidden="true" />
                <div className="perf-panel-header-content">
                  <div className="perf-panel-header-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="perf-panel-header-text">
                    <h2>{selectedEval.evaluation_type}</h2>
                    <p>{selectedEval.evaluation_period}</p>
                  </div>
                </div>
              </div>
              <div className="perf-panel-body">
                <div className="perf-section">
                  <span className="perf-section-title">Evaluation Overview</span>
                  <div className="perf-detail-grid">
                    <InfoField label="Evaluation Type" value={selectedEval.evaluation_type} />
                    <InfoField label="Period"          value={selectedEval.evaluation_period} />
                    <InfoField label="Evaluator"       value={selectedEval.evaluator + " (" + selectedEval.evaluator_role + ")"} />
                    <InfoField label="Date"            value={selectedEval.evaluation_date ? new Date(selectedEval.evaluation_date).toLocaleDateString() : "N/A"} />
                    <InfoField label="Status"          value={selectedEval.status} />
                    <InfoField label="Overall Rating"  value={selectedEval.overall_rating} />
                    <InfoField label="Entered By"      value={selectedEval.entered_by_name || "N/A"} />
                  </div>
                </div>

                {selectedEval.categories && Object.keys(selectedEval.categories).length > 0 && (
                  <div className="perf-section">
                    <span className="perf-section-title">Category Ratings</span>
                    {Object.entries(selectedEval.categories).map(([key, cat]) => (
                      <div key={key} className="perf-cat-card">
                        <div className="perf-cat-card-top">
                          <span className="perf-cat-name">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                          <div className="perf-cat-meta">
                            <RatingBadge rating={cat.rating} />
                            <span className="perf-cat-score">{cat.score}/5.0</span>
                          </div>
                        </div>
                        {cat.comments && <p className="perf-cat-comment">{cat.comments}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {selectedEval.strengths?.length > 0 && (
                  <div className="perf-section">
                    <span className="perf-section-title">Strengths</span>
                    <div className="perf-list">
                      {selectedEval.strengths.map((s, i) => <div key={i} className="perf-list-item strength">{s}</div>)}
                    </div>
                  </div>
                )}

                {selectedEval.areas_for_improvement?.length > 0 && (
                  <div className="perf-section">
                    <span className="perf-section-title">Areas for Improvement</span>
                    <div className="perf-list">
                      {selectedEval.areas_for_improvement.map((a, i) => <div key={i} className="perf-list-item improvement">{a}</div>)}
                    </div>
                  </div>
                )}

                {selectedEval.goals?.length > 0 && (
                  <div className="perf-section">
                    <span className="perf-section-title">Goals and Action Items</span>
                    <div className="perf-list">
                      {selectedEval.goals.map((g, i) => <div key={i} className="perf-list-item goal">{g}</div>)}
                    </div>
                  </div>
                )}

                {selectedEval.comments && (
                  <div className="perf-section">
                    <span className="perf-section-title">Overall Comments</span>
                    <p className="perf-comments">{selectedEval.comments}</p>
                  </div>
                )}
              </div>
              <div className="perf-panel-footer">
                <Button variant="secondary" onClick={() => setShowDetail(false)}>Close</Button>
                <Button variant="secondary" onClick={() => handleEdit(selectedEval)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDeleteClick(selectedEval)}>Delete</Button>
              </div>
            </div>
          )}
        </SlideInMenu>

        {/* Form Panel */}
        <SlideInMenu isShow={showForm} onClose={() => setShowForm(false)} width="760px">
          <div className="perf-panel">
            <div className="perf-panel-header default">
              <span className="perf-panel-deco" aria-hidden="true" />
              <div className="perf-panel-header-content">
                <div className="perf-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="perf-panel-header-text">
                  <h2>{isEditMode ? "Edit Evaluation" : "New Evaluation"}</h2>
                  <p>{isEditMode ? "Update performance evaluation" : "Add a new performance evaluation"}</p>
                </div>
              </div>
            </div>
            <div className="perf-panel-body">
              <span className="perf-form-section-title">Basic Information</span>
              <div className="perf-form-grid">
                <FormInput label="Evaluation Type *" value={form.evaluation_type} onChange={setF("evaluation_type")} placeholder="e.g., Annual Review" />
                <FormInput label="Evaluation Period" value={form.evaluation_period} onChange={setF("evaluation_period")} placeholder="e.g., 2024-2025" />
                <FormInput label="Evaluator Name *" value={form.evaluator} onChange={setF("evaluator")} placeholder="e.g., Dr. Michael Roberts" />
                <FormInput label="Evaluator Role" value={form.evaluator_role} onChange={setF("evaluator_role")} placeholder="e.g., Superintendent" />
                <FormInput label="Evaluation Date *" type="date" value={form.evaluation_date} onChange={setF("evaluation_date")} />
                <FormInput label="Status" type="select" value={form.status} onChange={setF("status")}
                  options={[{ value: "Scheduled", label: "Scheduled" }, { value: "In Progress", label: "In Progress" }, { value: "Completed", label: "Completed" }, { value: "Overdue", label: "Overdue" }]} />
                <FormInput label="Overall Rating" type="select" value={form.overall_rating} onChange={setF("overall_rating")}
                  options={RATING_OPTIONS.filter((o) => o.value !== "Not Rated")} />
              </div>

              <span className="perf-form-section-title">Category Ratings</span>
              <CategoryEditor categories={form.categories} onChange={(v) => setForm((p) => ({ ...p, categories: v }))} />

              <span className="perf-form-section-title">Strengths, Improvements and Goals</span>
              <ListEditor label="Strengths" items={form.strengths} onChange={(v) => setForm((p) => ({ ...p, strengths: v }))} />
              <ListEditor label="Areas for Improvement" items={form.areas_for_improvement} onChange={(v) => setForm((p) => ({ ...p, areas_for_improvement: v }))} />
              <ListEditor label="Goals and Action Items" items={form.goals} onChange={(v) => setForm((p) => ({ ...p, goals: v }))} />

              <span className="perf-form-section-title">Overall Comments</span>
              <FormInput label="Comments" value={form.comments} onChange={setF("comments")} placeholder="Enter overall evaluation comments" />
            </div>
            <div className="perf-panel-footer">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{isEditMode ? "Update Evaluation" : "Create Evaluation"}</Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Delete Confirm Panel */}
        <SlideInMenu isShow={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} width="420px">
          <div className="perf-panel">
            <div className="perf-panel-header danger">
              <span className="perf-panel-deco" aria-hidden="true" />
              <div className="perf-panel-header-content">
                <div className="perf-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="perf-panel-header-text">
                  <h2>Delete Evaluation</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
            </div>
            <div className="perf-panel-body">
              <div className="perf-delete-name">{selectedEval?.evaluation_type}</div>
              <div className="perf-delete-warn">This evaluation and all associated data will be permanently removed.</div>
            </div>
            <div className="perf-panel-footer">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleConfirmDelete}>Delete</Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default StaffPerformance;
