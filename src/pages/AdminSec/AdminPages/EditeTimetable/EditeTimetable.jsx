import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./EditeTimetable.css";
import Button from "../../../../components/Button/Button";
import Timetable from "../../../../components/timetable/Timetable";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const subjects = ["Math", "English", "Biology", "Physics", "Chemistry"];

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const IcoBack = () => (
  <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
    <path d="M14 5l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoPlus = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);

const EditeTimetable = ({
  timetableData = [],
  className: propClassName,
  onClose,
  onSave,
  isCreating = false,
}) => {
  const navigate = useNavigate();
  const { className: paramClassName } = useParams();
  const { state } = useLocation();

  const displayClassName = propClassName || paramClassName || "Class";

  const selectedTTToEdit =
    timetableData.length > 0
      ? timetableData
      : Array.isArray(state?.timetable)
      ? state.timetable
      : Object.values(state?.timetable || {}).flat();

  const [activeTab, setActiveTab] = useState("edit");
  const filteredEntries = selectedTTToEdit.filter((e) => e.start && e.end);
  const [entries, setEntries] = useState(filteredEntries);
  const [form, setForm] = useState({ day: "", name: "", start: "", end: "" });
  const [editingId, setEditingId] = useState(null);

  const handleAddOrEdit = () => {
    if (!form.day || !form.name || !form.start || !form.end) return;
    if (editingId) {
      setEntries((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...form } : e)));
      setEditingId(null);
    } else {
      setEntries((prev) => [{ id: Date.now(), ...form }, ...prev]);
    }
    setForm({ day: "", name: "", start: "", end: "" });
  };

  const handleDelete = (id) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const handleEdit = (item) => { setForm(item); setEditingId(item.id); };

  const handleSave = () => {
    if (onSave) onSave(entries);
    else navigate(-1);
  };

  const handleBack = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  const isFormComplete = form.day && form.name && form.start && form.end;

  return (
    <div className="ett-container">

      {/* ── Header ── */}
      <div className="ett-header">
        <span className="ett-header-deco" aria-hidden="true" />
        <span className="ett-header-deco2" aria-hidden="true" />
        <div className="ett-header-content">
          <button className="ett-back-btn" onClick={handleBack} aria-label="Go back">
            <IcoBack />
          </button>
          <div className="ett-header-text">
            <h2>{isCreating ? "Create" : "Edit"} Timetable — {displayClassName}</h2>
            <p>{isCreating ? "Create a new weekly schedule for the class" : "Modify the existing weekly schedule"}</p>
          </div>
          <div className="ett-header-actions">
            <Button onClick={handleSave}>Save Timetable</Button>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="ett-toolbar">
        <Button variant="secondary">Generate Timetable</Button>
        <Button variant="secondary">Copy Last Timetable</Button>
      </div>

      {/* ── Mobile tabs ── */}
      <div className="ett-mobile-tabs">
        <button className={activeTab === "edit" ? "active" : ""} onClick={() => setActiveTab("edit")}>Edit</button>
        <button className={activeTab === "preview" ? "active" : ""} onClick={() => setActiveTab("preview")}>Preview</button>
      </div>

      {/* ── Main layout ── */}
      <div className="ett-body">

        {/* Preview panel */}
        <div className={`ett-preview-panel ${activeTab === "preview" ? "show" : ""}`}>
          <Timetable timetableData={entries.filter((e) => e.start && e.end)} compact />
        </div>

        {/* Edit panel */}
        <div className={`ett-edit-panel ${activeTab === "edit" ? "show" : ""}`}>

          {/* Form */}
          <div className="ett-form">
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
              <option value="">Day</option>
              {days.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}>
              <option value="">Subject</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            <button className={`ett-form-submit${!isFormComplete ? " disabled" : ""}`}
              onClick={handleAddOrEdit} disabled={!isFormComplete}>
              {editingId ? <><IcoEdit /> Update</> : <><IcoPlus /> Add</>}
            </button>
          </div>

          {/* Entry list */}
          <div className="ett-entry-list">
            {entries.length === 0 && (
              <div className="ett-empty">
                <p>No entries yet. Use the form above to add periods.</p>
              </div>
            )}
            {entries.map((item) => (
              <div key={item.id} className="ett-entry" onDoubleClick={() => handleEdit(item)}>
                <div className="ett-entry-meta">
                  <span className="ett-entry-day">{item.day}</span>
                  <span className="ett-entry-subject">{item.name}</span>
                  <span className="ett-entry-time">{item.start} – {item.end}</span>
                </div>
                <div className="ett-entry-actions">
                  <button className="ett-entry-edit-btn" onClick={() => handleEdit(item)} title="Edit">
                    <IcoEdit />
                  </button>
                  <button className="ett-entry-delete-btn" onClick={() => handleDelete(item.id)} title="Delete">
                    <IcoTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EditeTimetable;
