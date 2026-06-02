import { useEffect, useState, useCallback } from "react";
import "./AdminSubseasionCalendar.css";
import { useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import Button from "../../../../components/Button/Button";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useSchoolCalendar } from "../../../../api_call";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";

const IcoCal = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IcoClock = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M11 7v4l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IcoPin = () => (
  <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
    <path d="M11 2C8.2 2 6 4.2 6 7c0 4 5 11 5 11s5-7 5-11c0-2.8-2.2-5-5-5z" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <circle cx="11" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IcoDots = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="17" r="1.5" fill="currentColor"/>
  </svg>
);
const IcoEdit = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const getTypeColor = (type) => {
  const map = {
    Academic:    "academic",
    Holiday:     "holiday",
    Meeting:     "meeting",
    Examination: "examination",
    Sports:      "sports",
    Cultural:    "cultural",
  };
  return map[type] || "default";
};

const getPriorityColor = (p) => {
  if (p === "High")   return "priority-high";
  if (p === "Medium") return "priority-medium";
  return "priority-low";
};

const AdminSubseasionCalendar = ({ setsetsubId }) => {
  const { schoolId, seasionId, subseasionId } = useParams();
  const { createCalendarItem, updateCalendarItem, deleteCalendarItem, getCalendarItemsPaginated } = useSchoolCalendar();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.school_calendar?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.school_calendar?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.school_calendar?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isDeletePanelOpen, setIsDeletePanelOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", calendar_date: "", calendar_time: "",
    type: "Academic", location: "", duration: "", participants: "", priority: "Medium",
  });

  useEffect(() => { setsetsubId(subseasionId); }, [subseasionId, setsetsubId]);

  const fetchCalendarData = useCallback(
    async (params) => getCalendarItemsPaginated(subseasionId, params),
    [subseasionId, getCalendarItemsPaginated]
  );

  const handleBulkDelete = async (ids) => {
    if (!ids?.length) return;
    const results = await Promise.all(ids.map((id) => deleteCalendarItem(id, user?.admin?.admin_id || user?.user_id)));
    const ok   = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    if (ok)   addNotification(`${ok} item(s) deleted`, "success");
    if (fail) addNotification(`Failed to delete ${fail} item(s)`, "error");
    if (ok)   setRefreshTable((p) => p + 1);
  };

  const resetForm = () => {
    setIsCreateMenuOpen(false);
    setSelectedCalendarItem(null);
    setFormData({ title: "", description: "", calendar_date: "", calendar_time: "", type: "Academic", location: "", duration: "", participants: "", priority: "Medium" });
  };

  const handleCreate = () => {
    if (!canCreate) { addNotification("No permission to create calendar items.", "error"); return; }
    setSelectedCalendarItem(null);
    setFormData({ title: "", description: "", calendar_date: "", calendar_time: "", type: "Academic", location: "", duration: "", participants: "", priority: "Medium" });
    setIsCreateMenuOpen(true);
  };

  const handleViewCalendarItem = (item) => { setSelectedCalendarItem(item); setIsDetailMenuOpen(true); };
  const handleClick = (r) => { setOpenDropdown(null); handleViewCalendarItem(r); };

  const handleEditCalendarItem = (item) => {
    if (!canEdit) { addNotification("No permission to edit calendar items.", "error"); setOpenDropdown(null); return; }
    setSelectedCalendarItem(item);
    setFormData({
      title: item.title, description: item.description,
      calendar_date: item.calendar_date, calendar_time: item.calendar_time,
      type: item.type, location: item.location || "",
      duration: item.duration || "", participants: item.participants || "",
      priority: item.priority || "Medium",
    });
    setIsCreateMenuOpen(true);
  };

  const handleDeleteCalendarItem = (item) => {
    if (!canDelete) { addNotification("No permission to delete calendar items.", "error"); setOpenDropdown(null); return; }
    setDeleteItem(item);
    setIsDeletePanelOpen(true);
    setIsDetailMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    const result = await deleteCalendarItem(deleteItem.calendar_id, user?.admin?.admin_id || user?.user_id);
    if (result.success) {
      addNotification("Calendar item deleted!", "success");
      setRefreshTable((p) => p + 1);
      setIsDeletePanelOpen(false);
      setDeleteItem(null);
    } else {
      addNotification(`Failed: ${result.message}`, "error");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.calendar_date || !formData.calendar_time) {
      addNotification("Please fill in all required fields", "error"); return;
    }
    const calendarData = {
      school_id: schoolId, session_id: seasionId, subsession_id: subseasionId,
      title: formData.title, description: formData.description,
      calendar_date: formData.calendar_date, calendar_time: formData.calendar_time,
      type: formData.type || "Academic", location: formData.location,
      duration: formData.duration, participants: formData.participants || "All Students & Staff",
      priority: formData.priority || "Medium",
      created_by: user?.admin?.admin_id || user?.user_id,
      modified_by: user?.admin?.admin_id || user?.user_id,
    };
    const result = selectedCalendarItem
      ? await updateCalendarItem(selectedCalendarItem.calendar_id, calendarData)
      : await createCalendarItem(calendarData);
    if (result.success) {
      addNotification(selectedCalendarItem ? "Calendar item updated!" : "Calendar item created!", "success");
      setRefreshTable((p) => p + 1);
      resetForm();
    } else {
      addNotification(`Failed: ${result.message}`, "error");
    }
  };

  const handleInputChange = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const columns = [
    {
      label: "Calendar Item", accessor: "title",
      render: (v, row) => (
        <div className="asc-item-cell">
          <span className="asc-item-title">{v}</span>
          <span className="asc-item-desc">{row.description}</span>
        </div>
      ),
    },
    {
      label: "Date & Time", accessor: "calendar_date",
      render: (v, row) => (
        <div className="asc-datetime-cell">
          <span><IcoCal /> {v}</span>
          <span><IcoClock /> {row.calendar_time}</span>
        </div>
      ),
    },
    {
      label: "Location", accessor: "location",
      render: (v) => <span className="asc-location-cell"><IcoPin /> {v || "—"}</span>,
    },
    {
      label: "Type", accessor: "type",
      render: (v) => <span className={`asc-cat-pill asc-pill-${getTypeColor(v)}`}>{v}</span>,
    },
    {
      label: "Priority", accessor: "priority",
      render: (v) => <span className={`asc-cat-pill asc-pill-${getPriorityColor(v)}`}>{v}</span>,
    },
    { label: "Participants", accessor: "participants" },
    {
      label: "Actions", accessor: "actions", searchable: false,
      render: (_, row) => (
        <div className="asc-action-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="asc-action-btn" onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === row.calendar_id ? null : row.calendar_id);
          }}>
            <IcoDots />
          </button>
          {openDropdown === row.calendar_id && (
            <div className="asc-action-menu">
              <button className="asc-action-item" onClick={() => { setOpenDropdown(null); handleEditCalendarItem(row); }}>
                <IcoEdit /> Edit
              </button>
              <button className="asc-action-item asc-action-danger" onClick={() => handleDeleteCalendarItem(row)}>
                <IcoTrash /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="asc-container">
      <InnerTabCon>
        <div className="asc-header">
          <h2>School Calendar</h2>
          <p>Manage academic calendar and important dates for this subsession</p>
        </div>

        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchCalendarData}
          onRowClick={handleClick}
          enableSelect
          onBulkDelete={handleBulkDelete}
          onCreate={handleCreate}
          maxRowsPerPage={15}
          creattext="Add Calendar Item"
          exportDefaults={{ includeColumns: ["title", "calendar_date", "calendar_time", "type", "location", "priority", "participants"], format: "csv" }}
        />
      </InnerTabCon>

      {/* ── Create / Edit panel ── */}
      <SlideInMenu isShow={isCreateMenuOpen} onClose={resetForm} width="600px">
        <div className="asc-form-container">
          <div className="asc-form-header">
            <span className="asc-form-deco" aria-hidden="true" />
            <span className="asc-form-deco2" aria-hidden="true" />
            <div className="asc-form-header-content">
              <h2>{selectedCalendarItem ? "Edit Calendar Item" : "Add Calendar Item"}</h2>
              <p>{selectedCalendarItem ? "Update calendar item information" : "Create a new item for the school calendar"}</p>
            </div>
          </div>
          <div className="asc-form-body">
            <FormInput label="Title *" type="text" value={formData.title} onChange={handleInputChange("title")} placeholder="e.g., First Term Begins" />
            <FormInput label="Description *" type="textarea" value={formData.description} onChange={handleInputChange("description")} placeholder="Enter calendar item description..." height="80px" />
            <div className="asc-form-row">
              <FormInput label="Date *" type="date" value={formData.calendar_date} onChange={handleInputChange("calendar_date")} />
              <FormInput label="Time *" type="time" value={formData.calendar_time} onChange={handleInputChange("calendar_time")} />
            </div>
            <div className="asc-form-row">
              <FormInput label="Type" type="select" value={formData.type} onChange={handleInputChange("type")}
                options={[
                  { value: "Academic", label: "Academic" },
                  { value: "Holiday", label: "Holiday" },
                  { value: "Meeting", label: "Meeting" },
                  { value: "Examination", label: "Examination" },
                  { value: "Sports", label: "Sports" },
                  { value: "Cultural", label: "Cultural" },
                ]}
              />
              <FormInput label="Priority" type="select" value={formData.priority} onChange={handleInputChange("priority")}
                options={[
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
              />
            </div>
            <div className="asc-form-row">
              <FormInput label="Location" type="text" value={formData.location} onChange={handleInputChange("location")} placeholder="e.g., School Auditorium" />
              <FormInput label="Duration" type="text" value={formData.duration} onChange={handleInputChange("duration")} placeholder="e.g., Full Day, 2 Hours" />
            </div>
            <FormInput label="Participants" type="text" value={formData.participants} onChange={handleInputChange("participants")} placeholder="e.g., All Students & Staff" />
          </div>
          <div className="asc-form-footer">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.description || !formData.calendar_date || !formData.calendar_time}>
              {selectedCalendarItem ? "Update Calendar Item" : "Add Calendar Item"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* ── Detail panel ── */}
      <SlideInMenu isShow={isDetailMenuOpen} onClose={() => { setIsDetailMenuOpen(false); setSelectedCalendarItem(null); }} width="580px">
        {selectedCalendarItem && (
          <div className="asc-detail-container">
            <div className="asc-detail-header">
              <span className="asc-detail-deco" aria-hidden="true" />
              <span className="asc-detail-deco2" aria-hidden="true" />
              <div className="asc-detail-header-content">
                <div className="asc-detail-icon">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="4" width="18" height="15" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                    <circle cx="7" cy="14" r="1.2" fill="currentColor"/>
                    <circle cx="11" cy="14" r="1.2" fill="currentColor" opacity="0.4"/>
                  </svg>
                </div>
                <div className="asc-detail-header-text">
                  <h2>{selectedCalendarItem.title}</h2>
                  <p>{selectedCalendarItem.calendar_date} · {selectedCalendarItem.calendar_time}</p>
                </div>
                {(() => { return <span className={`asc-cat-pill asc-pill-${getPriorityColor(selectedCalendarItem.priority)}`} style={{ flexShrink: 0 }}>{selectedCalendarItem.priority}</span>; })()}
              </div>
            </div>

            <div className="asc-detail-body">
              <p className="asc-section-title">Calendar Info</p>
              <div className="asc-detail-grid">
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Location</span>
                  <span className="asc-detail-value">{selectedCalendarItem.location || "N/A"}</span>
                </div>
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Type</span>
                  <span className="asc-detail-value">
                    {(() => { const c = getTypeColor(selectedCalendarItem.type); return <span className="asc-cat-pill" style={{ background: c.bg, color: c.text }}>{selectedCalendarItem.type}</span>; })()}
                  </span>
                </div>
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Duration</span>
                  <span className="asc-detail-value">{selectedCalendarItem.duration || "N/A"}</span>
                </div>
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Participants</span>
                  <span className="asc-detail-value">{selectedCalendarItem.participants || "N/A"}</span>
                </div>
                <div className="asc-detail-item asc-detail-full">
                  <span className="asc-detail-label">Description</span>
                  <span className="asc-detail-value">{selectedCalendarItem.description}</span>
                </div>
              </div>

              <p className="asc-section-title" style={{ marginTop: 16 }}>Record</p>
              <div className="asc-detail-grid">
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Created</span>
                  <span className="asc-detail-value">{selectedCalendarItem.created_at ? new Date(selectedCalendarItem.created_at).toLocaleString() : "N/A"}</span>
                </div>
                <div className="asc-detail-item">
                  <span className="asc-detail-label">Created By</span>
                  <span className="asc-detail-value">{selectedCalendarItem.created_by_name || "N/A"}</span>
                </div>
              </div>

              <div className="asc-detail-actions">
                <Button onClick={() => { setIsDetailMenuOpen(false); handleEditCalendarItem(selectedCalendarItem); }}>
                  <IcoEdit /> Edit Item
                </Button>
                <Button variant="danger" onClick={() => handleDeleteCalendarItem(selectedCalendarItem)}>
                  <IcoTrash /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* ── Delete confirmation ── */}
      <SlideInMenu isShow={isDeletePanelOpen} onClose={() => { setIsDeletePanelOpen(false); setDeleteItem(null); }} width="460px">
        <div className="asc-delete-container">
          <div className="asc-delete-header">
            <span className="asc-delete-deco" aria-hidden="true" />
            <div className="asc-delete-header-content">
              <div className="asc-delete-icon"><IcoTrash /></div>
              <div>
                <h2>Delete Calendar Item</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="asc-delete-body">
            {deleteItem && (
              <div className="asc-delete-info">
                <span className="asc-delete-info-title">{deleteItem.title}</span>
                <span className="asc-delete-info-sub">{deleteItem.calendar_date} · {deleteItem.calendar_time}</span>
                <span className="asc-delete-info-sub">{deleteItem.type} · {deleteItem.priority} priority</span>
              </div>
            )}
            <div className="asc-delete-warning">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <path d="M11 3l8.5 15H2.5L11 3z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M11 9v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="11" cy="16" r="1" fill="#f59e0b"/>
              </svg>
              <p>Deleting this item will permanently remove it from the calendar.</p>
            </div>
          </div>
          <div className="asc-delete-footer">
            <Button variant="secondary" onClick={() => { setIsDeletePanelOpen(false); setDeleteItem(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Delete Item</Button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default AdminSubseasionCalendar;
