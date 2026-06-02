import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServerSmartTable from "../../../../../components/ServerSmartTable/ServerSmartTable";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import TargetAudienceSelector from "../Announcements/CreateAnnouncement/TargetAudienceSelector/TargetAudienceSelector";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import useNotification from "../../../../../api_call/useNotification";
import { useNotification as useNotify } from "../../../../../context/NotificationProvider/NotificationProvider";
import "./Notifications.css";

const Notifications = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { loading: sending, createNotification, getNotificationsPaginated, deleteNotification } = useNotification();
  const { addNotification } = useNotify();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.communication?.create;

  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [refreshTable, setRefreshTable] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [resolvedRecipients, setResolvedRecipients] = useState([]);
  const [formData, setFormData] = useState({
    targetType: "",
    selectedTargets: [],
    deliveryChannels: "Email",
  });

  const fetchNotificationsData = useCallback(
    async (params) => {
      const result = await getNotificationsPaginated(schoolId, params);
      if (result.success) {
        return {
          success: true,
          data: result.data.map((n) => ({
            notification_id: n.notification_id,
            title: n.title,
            target_type: n.target_type,
            delivery_channels: Array.isArray(n.delivery_channels)
              ? n.delivery_channels.join(", ")
              : n.delivery_channels,
            recipients_count: n.recipients_count,
            read_count: n.read_count,
            created_by_name: n.created_by_name,
            created_at: n.created_at,
            _raw: n,
          })),
          pagination: result.pagination,
        };
      }
      return result;
    },
    [schoolId, getNotificationsPaginated]
  );

  const columns = [
    {
      label: "Title",
      accessor: "title",
      render: (v, row) => (
        <div className="notification-title-cell">
          <div className="title-main"> {v ? v.replace(/<[^>]*>/g, "") : "—"}</div>
          <div className="title-meta">By {row.created_by_name || "—"}</div>
        </div>
      ),
    },
    {
      label: "Target",
      accessor: "target_type",
      render: (v) => (
        <span className="notif-target-badge">{v?.replace(/_/g, " ")}</span>
      ),
    },
    { label: "Channels", accessor: "delivery_channels" },
    {
      label: "Recipients",
      accessor: "recipients_count",
      render: (v) => <span className="notif-count">{v}</span>,
    },
    {
      label: "Read",
      accessor: "read_count",
      render: (v, row) => (
        <span className={`notif-read-count ${v > 0 ? "has-reads" : "no-reads"}`}>
          {v} / {row.recipients_count}
        </span>
      ),
    },
    {
      label: "Sent At",
      accessor: "created_at",
      render: (v) => v ? new Date(v).toLocaleString() : "—",
    },
  ];

  const handleCreateNotification = () => {
    if (!canCreate) {
      addNotification("You do not have permission to send notifications.", "error");
      return;
    }
    setIsCreateMenuOpen(true);
    if (schoolId && templates.length === 0) {
      fetch(`http://localhost:3000/announcement-template/school/${schoolId}`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setTemplates(d.data || []); })
        .catch(() => {});
    }
  };

  const handleSelectTemplate = (templateId) => {
    const tmpl = templates.find((t) => t.template_id === templateId);
    setSelectedTemplate(tmpl || null);
    const init = {};
    (tmpl?.placeholders || []).forEach((p) => { init[p] = ""; });
    setPlaceholderValues(init);
  };

  const resolveContent = (content) => {
    if (!content) return "";
    return content.replace(/\{[^}]+\}/g, (match) => {
      const val = placeholderValues[match];
      if (val) return `<span style="background:#dbeafe;color:#1e40af;padding:1px 5px;border-radius:4px;font-weight:600">${val}</span>`;
      return `<span style="background:#fef3c7;color:#92400e;padding:1px 5px;border-radius:4px;font-weight:600">${match}</span>`;
    });
  };

  const handleSubmitNotification = async () => {
    if (!selectedTemplate) return;
    const resolved_content = resolveContent(selectedTemplate.content);
    const title = resolveContent(selectedTemplate.subject || selectedTemplate.name).replace(/<[^>]*>/g, "");
    const result = await createNotification({
      school_id: schoolId,
      title,
      resolved_content,
      template_id: selectedTemplate?.template_id || null,
      placeholder_values: placeholderValues,
      delivery_channels: formData.deliveryChannels.split(","),
      target_type: formData.targetType,
      targeted_users: resolvedRecipients,
      created_by_id: user?.admin?.admin_id || user?.staff?.staff_id || null,
      created_by_name: user?.admin?.username || user?.staff?.full_name || "Admin",
    });
    if (result.success) setRefreshTable((k) => k + 1);
    else addNotification(result.message || "Failed to send notification", "error");
    setIsCreateMenuOpen(false);
    setSelectedTemplate(null);
    setPlaceholderValues({});
    setResolvedRecipients([]);
    setFormData({ targetType: "", selectedTargets: [], deliveryChannels: "Email" });
  };

  return (
    <InnerTabCon>
      <div className="notifications-container">
        <div className="notif-header">
          <div className="notif-header-left">
            <h2 className="notif-title">Notifications</h2>
            <p className="notif-subtitle">Timeline of system alerts and custom notifications with delivery tracking</p>
          </div>
        </div>

        <ServerSmartTable
          key={refreshTable}
          columns={columns}
          fetchData={fetchNotificationsData}
          onRowClick={(row) => navigate(`/admin/${schoolId}/communication/notifications/${row.notification_id}`)}
          enableSelect={true}
          onCreate={handleCreateNotification}
          initialPageSize={15}
          showcreatbut={true}
          creattext="Send Custom Alert"
          reloadKey={refreshTable}
        />

        <SlideInMenu isShow={isCreateMenuOpen} onClose={() => setIsCreateMenuOpen(false)} width="600px">
          <div className="cn-panel">
            <div className="cn-panel-header">
              <span className="cn-panel-deco" aria-hidden="true" />
              <div className="cn-panel-header-content">
                <div className="cn-panel-header-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="cn-panel-header-text">
                  <h2>Send Custom Alert</h2>
                  <p>Create and send a notification to selected recipients</p>
                </div>
              </div>
            </div>

            <div className="cn-panel-body">
              {/* Template selector */}
              <div>
                <div className="cn-template-row">
                  <span className="cn-template-label">Announcement Template *</span>
                  <a
                    href={`http://localhost:5173/admin/${schoolId}/templates/announcement`}
                    target="_blank"
                    rel="noreferrer"
                    className="cn-template-link"
                  >
                    + Add Template
                  </a>
                </div>
                <select
                  className="cn-template-select"
                  value={selectedTemplate?.template_id || ""}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                >
                  <option value="">— Select a template —</option>
                  {templates.map((t) => (
                    <option key={t.template_id} value={t.template_id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Placeholder inputs + preview */}
              {selectedTemplate && (
                <div className="cn-preview-card">
                  {selectedTemplate.placeholders?.length > 0 && (
                    <div className="cn-placeholder-grid">
                      {selectedTemplate.placeholders.map((ph) => (
                        <div key={ph} className="cn-placeholder-field">
                          <label className="cn-placeholder-label">{ph}</label>
                          <input
                            className="cn-placeholder-input"
                            value={placeholderValues[ph] || ""}
                            onChange={(e) => setPlaceholderValues((prev) => ({ ...prev, [ph]: e.target.value }))}
                            placeholder={ph}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="cn-preview-title-box">
                    <span className="cn-preview-box-label">Title Preview</span>
                    <div dangerouslySetInnerHTML={{ __html: resolveContent(selectedTemplate.subject || selectedTemplate.name) }} />
                  </div>
                  <div className="cn-preview-content-box">
                    <span className="cn-preview-box-label">Content Preview</span>
                    <div dangerouslySetInnerHTML={{ __html: resolveContent(selectedTemplate.content) }} />
                  </div>
                </div>
              )}
{/* 
              <FormInput
                label="Delivery Channels"
                type="select"
                value={formData.deliveryChannels}
                onChange={(v) => setFormData((p) => ({ ...p, deliveryChannels: v }))}
                options={[
                  { value: "Email", label: "Email Only" },
                  { value: "App Push", label: "Push Notification Only" },
                  { value: "Email,App Push", label: "Email + Push Notification" },
                ]}
              /> */}

              <div>
                <span className="cn-template-label" style={{ display: "block", marginBottom: 8 }}>Target Audience *</span>
                <TargetAudienceSelector
                  selectedType={formData.targetType}
                  selectedTargets={formData.selectedTargets}
                  onChange={(targetType, selectedTargets) => setFormData((p) => ({ ...p, targetType, selectedTargets }))}
                  onRecipientsChange={setResolvedRecipients}
                />
              </div>
            </div>

            <div className="cn-panel-footer">
              <Button variant="secondary" onClick={() => setIsCreateMenuOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmitNotification}
                disabled={sending || !selectedTemplate || !formData.targetType}
              >
                {sending ? "Sending..." : "Send Alert"}
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default Notifications;
