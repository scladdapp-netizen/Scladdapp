import { useEffect, useState, useCallback } from "react";
import "./AdminSubseasionEvents.css";
import { useParams } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import Button from "../../../../components/Button/Button";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../components/FormInput";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useSchoolEvents } from "../../../../api_call";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
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

const getCategoryColor = (cat) => {
  const map = {
    Academic:  { bg: "#dbeafe", text: "#1e40af" },
    Sports:    { bg: "#dcfce7", text: "#166534" },
    Cultural:  { bg: "#f3e8ff", text: "#6b21a8" },
    Social:    { bg: "#fef9c3", text: "#854d0e" },
  };
  return map[cat] || { bg: "#f4f4f4", text: "#555555" };
};

const AdminSubseasionEvents = ({ setsetsubId }) => {
  const { schoolId, seasionId, subseasionId } = useParams();
  const { createEvent, updateEvent, deleteEvent, getEventsPaginated } = useSchoolEvents();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.school_event?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.school_event?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.school_event?.delete;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [refreshTable, setRefreshTable] = useState(0);
  const [deleteEventItem, setDeleteEventItem] = useState(null);
  const [isDeletePanelOpen, setIsDeletePanelOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [formData, setFormData] = useState({
    title: "", description: "", event_date: "", event_time: "",
    location: "", category: "", organizer: "", participants: "",
  });

  useEffect(() => { setsetsubId(subseasionId); }, [subseasionId, setsetsubId]);

  const fetchEventsData = useCallback(
    async (params) => getEventsPaginated(subseasionId, params),
    [subseasionId, getEventsPaginated]
  );

  const handleBulkDelete = async (ids) => {
    if (!ids?.length) return;
    const results = await Promise.all(ids.map((id) => deleteEvent(id, user?.admin?.admin_id || user?.user_id)));
    const ok = results.filter((r) => r.success).length;
    const fail = results.length - ok;
    if (ok)   addNotification(`${ok} event(s) deleted`, "success");
    if (fail) addNotification(`Failed to delete ${fail} event(s)`, "error");
    if (ok)   setRefreshTable((p) => p + 1);
  };

  const handleCreate = () => {
    if (!canCreate) { addNotification("No permission to create events.", "error"); return; }
    setSelectedEvent(null);
    setFormData({ title: "", description: "", event_date: "", event_time: "", location: "", category: "", organizer: "", participants: "" });
    setIsCreateMenuOpen(true);
  };

  const handleViewEvent = (event) => { setSelectedEvent(event); setIsDetailMenuOpen(true); };
  const handleClick = (r) => { setOpenDropdown(null); handleViewEvent(r); };

  const handleEditEvent = (event) => {
    if (!canEdit) { addNotification("No permission to edit events.", "error"); setOpenDropdown(null); return; }
    setSelectedEvent(event);
    setFormData({ title: event.title, description: event.description, event_date: event.event_date,
      event_time: event.event_time, location: event.location, category: event.category,
      organizer: event.organizer || "", participants: event.participants || "" });
    setIsCreateMenuOpen(true);
  };

  const handleDeleteEvent = (event) => {
    if (!canDelete) { addNotification("No permission to delete events.", "error"); setOpenDropdown(null); return; }
    setDeleteEventItem(event);
    setIsDeletePanelOpen(true);
    setIsDetailMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteEventItem) return;
    const result = await deleteEvent(deleteEventItem.event_id, user?.admin?.admin_id || user?.user_id);
    if (result.success) {
      addNotification("Event deleted!", "success");
      setRefreshTable((p) => p + 1);
      setIsDeletePanelOpen(false);
      setDeleteEventItem(null);
    } else {
      addNotification(`Failed: ${result.message}`, "error");
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.event_date || !formData.event_time || !formData.location) {
      addNotification("Please fill in all required fields", "error"); return;
    }
    const eventData = {
      school_id: schoolId, session_id: seasionId, subsession_id: subseasionId,
      title: formData.title, description: formData.description,
      event_date: formData.event_date, event_time: formData.event_time,
      location: formData.location, category: formData.category || "General",
      organizer: formData.organizer, participants: formData.participants || "All Students",
      status: "Upcoming",
      created_by: user?.admin?.admin_id || user?.user_id,
      modified_by: user?.admin?.admin_id || user?.user_id,
    };
    const result = selectedEvent
      ? await updateEvent(selectedEvent.event_id, eventData)
      : await createEvent(eventData);
    if (result.success) {
      addNotification(selectedEvent ? "Event updated!" : "Event created!", "success");
      setRefreshTable((p) => p + 1);
      setIsCreateMenuOpen(false);
      setSelectedEvent(null);
      setFormData({ title: "", description: "", event_date: "", event_time: "", location: "", category: "", organizer: "", participants: "" });
    } else {
      addNotification(`Failed: ${result.message}`, "error");
    }
  };

  const handleInputChange = (field) => (value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const statusPill = (status) => {
    const map = { Upcoming: { bg: "#dbeafe", text: "#1e40af" }, Ongoing: { bg: "#fef9c3", text: "#854d0e" }, Completed: { bg: "#dcfce7", text: "#166534" } };
    const s = map[status] || { bg: "#f4f4f4", text: "#555555" };
    return <span className="ase-status-pill" style={{ background: s.bg, color: s.text }}>{status}</span>;
  };

  const columns = [
    {
      label: "Event", accessor: "title",
      render: (v, row) => (
        <div className="ase-event-cell">
          <span className="ase-event-title">{v}</span>
          <span className="ase-event-desc">{row.description}</span>
        </div>
      ),
    },
    {
      label: "Date & Time", accessor: "event_date",
      render: (v, row) => (
        <div className="ase-datetime-cell">
          <span><IcoCal /> {v}</span>
          <span><IcoClock /> {row.event_time}</span>
        </div>
      ),
    },
    {
      label: "Location", accessor: "location",
      render: (v) => <span className="ase-location-cell"><IcoPin /> {v}</span>,
    },
    {
      label: "Category", accessor: "category",
      render: (v) => {
        const c = getCategoryColor(v);
        return <span className="ase-cat-pill" style={{ background: c.bg, color: c.text }}>{v}</span>;
      },
    },
    { label: "Participants", accessor: "participants" },
    {
      label: "Actions", accessor: "actions", searchable: false,
      render: (_, row) => (
        <div className="ase-action-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="ase-action-btn" onClick={(e) => {
            e.stopPropagation();
            setOpenDropdown(openDropdown === row.event_id ? null : row.event_id);
          }}>
            <IcoDots />
          </button>
          {openDropdown === row.event_id && (
            <div className="ase-action-menu">
              <button className="ase-action-item" onClick={() => { setOpenDropdown(null); handleEditEvent(row); }}>
                <IcoEdit /> Edit
              </button>
              <button className="ase-action-item ase-action-danger" onClick={() => handleDeleteEvent(row)}>
                <IcoTrash /> Delete
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const resetForm = () => {
    setIsCreateMenuOpen(false);
    setSelectedEvent(null);
    setFormData({ title: "", description: "", event_date: "", event_time: "", location: "", category: "", organizer: "", participants: "" });
  };

  return (
    <div className="ase-container">
      <InnerTabCon>
        <div className="ase-header">
          <h2>School Events</h2>
          <p>Manage and organize school events for this subsession</p>
        </div>

        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchEventsData}
          onRowClick={handleClick}
          enableSelect
          onBulkDelete={handleBulkDelete}
          onCreate={handleCreate}
          maxRowsPerPage={15}
          creattext="Add Event"
          exportDefaults={{ includeColumns: ["title", "event_date", "event_time", "location", "category", "participants"], format: "csv" }}
        />
      </InnerTabCon>

      {/* ── Create / Edit panel ── */}
      <SlideInMenu isShow={isCreateMenuOpen} onClose={resetForm} width="600px">
        <div className="ase-form-container">
          <div className="ase-form-header">
            <span className="ase-form-deco" aria-hidden="true" />
            <span className="ase-form-deco2" aria-hidden="true" />
            <div className="ase-form-header-content">
              <h2>{selectedEvent ? "Edit Event" : "Add New Event"}</h2>
              <p>{selectedEvent ? "Update event information" : "Create a new school event"}</p>
            </div>
          </div>
          <div className="ase-form-body">
            <FormInput label="Event Title *" type="text" value={formData.title} onChange={handleInputChange("title")} placeholder="e.g., Annual Sports Day" />
            <FormInput label="Description *" type="textarea" value={formData.description} onChange={handleInputChange("description")} placeholder="Enter event description..." height="80px" />
            <div className="ase-form-row">
              <FormInput label="Date *" type="date" value={formData.event_date} onChange={handleInputChange("event_date")} />
              <FormInput label="Time *" type="time" value={formData.event_time} onChange={handleInputChange("event_time")} />
            </div>
            <FormInput label="Location *" type="text" value={formData.location} onChange={handleInputChange("location")} placeholder="e.g., School Auditorium" />
            <div className="ase-form-row">
              <FormInput label="Category" type="text" value={formData.category} onChange={handleInputChange("category")} placeholder="e.g., Academic, Sports" />
              <FormInput label="Organizer" type="text" value={formData.organizer} onChange={handleInputChange("organizer")} placeholder="e.g., Sports Dept." />
            </div>
            <FormInput label="Participants" type="text" value={formData.participants} onChange={handleInputChange("participants")} placeholder="e.g., All Students" />
          </div>
          <div className="ase-form-footer">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.description || !formData.event_date || !formData.event_time || !formData.location}>
              {selectedEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* ── Detail panel ── */}
      <SlideInMenu isShow={isDetailMenuOpen} onClose={() => { setIsDetailMenuOpen(false); setSelectedEvent(null); }} width="580px">
        {selectedEvent && (
          <div className="ase-detail-container">
            <div className="ase-detail-header">
              <span className="ase-detail-deco" aria-hidden="true" />
              <span className="ase-detail-deco2" aria-hidden="true" />
              <div className="ase-detail-header-content">
                <div className="ase-detail-icon">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="4" width="18" height="15" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                    <circle cx="7" cy="14" r="1.2" fill="currentColor"/>
                    <circle cx="11" cy="14" r="1.2" fill="currentColor" opacity="0.4"/>
                  </svg>
                </div>
                <div className="ase-detail-header-text">
                  <h2>{selectedEvent.title}</h2>
                  <p>{selectedEvent.event_date} · {selectedEvent.event_time}</p>
                </div>
                {statusPill(selectedEvent.status)}
              </div>
            </div>

            <div className="ase-detail-body">
              <p className="ase-section-title">Event Info</p>
              <div className="ase-detail-grid">
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Location</span>
                  <span className="ase-detail-value">{selectedEvent.location}</span>
                </div>
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Category</span>
                  <span className="ase-detail-value">
                    {(() => { const c = getCategoryColor(selectedEvent.category); return <span className="ase-cat-pill" style={{ background: c.bg, color: c.text }}>{selectedEvent.category}</span>; })()}
                  </span>
                </div>
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Organizer</span>
                  <span className="ase-detail-value">{selectedEvent.organizer || "N/A"}</span>
                </div>
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Participants</span>
                  <span className="ase-detail-value">{selectedEvent.participants || "N/A"}</span>
                </div>
                <div className="ase-detail-item ase-detail-full">
                  <span className="ase-detail-label">Description</span>
                  <span className="ase-detail-value">{selectedEvent.description}</span>
                </div>
              </div>

              <p className="ase-section-title" style={{ marginTop: 16 }}>Record</p>
              <div className="ase-detail-grid">
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Created</span>
                  <span className="ase-detail-value">{selectedEvent.created_at ? new Date(selectedEvent.created_at).toLocaleString() : "N/A"}</span>
                </div>
                <div className="ase-detail-item">
                  <span className="ase-detail-label">Created By</span>
                  <span className="ase-detail-value">{selectedEvent.created_by_name || "N/A"}</span>
                </div>
              </div>

              <div className="ase-detail-actions">
                <Button onClick={() => { setIsDetailMenuOpen(false); handleEditEvent(selectedEvent); }}>
                  <IcoEdit /> Edit Event
                </Button>
                <Button variant="danger" onClick={() => handleDeleteEvent(selectedEvent)}>
                  <IcoTrash /> Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </SlideInMenu>

      {/* ── Delete confirmation ── */}
      <SlideInMenu isShow={isDeletePanelOpen} onClose={() => { setIsDeletePanelOpen(false); setDeleteEventItem(null); }} width="460px">
        <div className="ase-delete-container">
          <div className="ase-delete-header">
            <span className="ase-delete-deco" aria-hidden="true" />
            <div className="ase-delete-header-content">
              <div className="ase-delete-icon">
                <IcoTrash />
              </div>
              <div>
                <h2>Delete Event</h2>
                <p>This action cannot be undone</p>
              </div>
            </div>
          </div>
          <div className="ase-delete-body">
            {deleteEventItem && (
              <div className="ase-delete-info">
                <span className="ase-delete-info-title">{deleteEventItem.title}</span>
                <span className="ase-delete-info-sub">{deleteEventItem.event_date} · {deleteEventItem.event_time}</span>
                <span className="ase-delete-info-sub">{deleteEventItem.location}</span>
              </div>
            )}
            <div className="ase-delete-warning">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <path d="M11 3l8.5 15H2.5L11 3z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M11 9v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="11" cy="16" r="1" fill="#f59e0b"/>
              </svg>
              <p>Deleting this event will permanently remove it and all associated data.</p>
            </div>
          </div>
          <div className="ase-delete-footer">
            <Button variant="secondary" onClick={() => { setIsDeletePanelOpen(false); setDeleteEventItem(null); }}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>Delete Event</Button>
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default AdminSubseasionEvents;
