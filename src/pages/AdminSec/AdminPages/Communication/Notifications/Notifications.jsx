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
    deliveryChannels: ["Web"],
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
    {
      label: "Channels",
      accessor: "delivery_channels",
      render: (v) => (
        <span className="notif-target-badge">{v || "—"}</span>
      ),
    },
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
      fetch(`${import.meta.env.VITE_API_BASE_URL}/announcement-template/school/${schoolId}`)
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
      return val || match;
    });
  };

  const handleSubmitNotification = async () => {
    if (!selectedTemplate) return;
    const resolved_content = resolveContent(selectedTemplate.content);
    const title = resolveContent(selectedTemplate.subject || selectedTemplate.name).replace(/<[^>]*>/g, "");
    const isGuardianTarget =
      formData.targetType === "all_guardians" || formData.targetType === "specific_guardians";
    // For guardian targets don't force-add Web (guardians have no web account)
    const deliveryChannels = isGuardianTarget
      ? formData.deliveryChannels.filter((c) => c !== "Web")
      : Array.from(new Set(["Web", ...formData.deliveryChannels]));
    const result = await createNotification({
      school_id: schoolId,
      title,
      resolved_content,
      template_id: selectedTemplate?.template_id || null,
      placeholder_values: placeholderValues,
      delivery_channels: deliveryChannels,
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
    setFormData({ targetType: "", selectedTargets: [], deliveryChannels: ["Web"] });
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
                  {/* <div className="cn-preview-title-box">
                    <span className="cn-preview-box-label">Title Preview</span>
                    <div dangerouslySetInnerHTML={{ __html: resolveContent(selectedTemplate.subject || selectedTemplate.name) }} />
                  </div> */}
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

              {/* ── Delivery Method ── */}
              <div>
                <span className="cn-template-label" style={{ display: "block", marginBottom: 10 }}>Delivery Method</span>
                {(() => {
                  const isGuardianTarget =
                    formData.targetType === "all_guardians" ||
                    formData.targetType === "specific_guardians";
                  return (
                    <div className="cn-delivery-grid">

                      {/* Web Notification — always on normally; inactive for guardian targets */}
                      <button
                        type="button"
                        className={
                          isGuardianTarget
                            ? "cn-delivery-card cn-delivery-card--disabled"
                            : "cn-delivery-card selected cn-delivery-card--locked"
                        }
                        disabled
                      >
                        <span className="cn-delivery-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                          </svg>
                        </span>
                        <span className="cn-delivery-name">
                          Web Notification
                          {isGuardianTarget
                            ? <span className="cn-delivery-soon">N/A for Guardians</span>
                            : <span className="cn-delivery-locked-badge">Always On</span>
                          }
                        </span>
                        <span className="cn-delivery-desc">
                          {isGuardianTarget
                            ? "Guardians don't have a web dashboard account"
                            : "Shows in the recipient's dashboard on the web app"
                          }
                        </span>
                        <span className="cn-delivery-check">
                          {!isGuardianTarget && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                      </button>

                      {/* Email Notification — locked on for guardian targets */}
                      <button
                        type="button"
                        className={`cn-delivery-card${formData.deliveryChannels.includes("Email") ? " selected" : ""}${isGuardianTarget ? " cn-delivery-card--locked" : ""}`}
                        disabled={isGuardianTarget}
                        onClick={() => {
                          if (isGuardianTarget) return;
                          setFormData((p) => ({
                            ...p,
                            deliveryChannels: p.deliveryChannels.includes("Email")
                              ? p.deliveryChannels.filter((c) => c !== "Email")
                              : [...p.deliveryChannels, "Email"],
                          }));
                        }}
                      >
                        <span className="cn-delivery-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        </span>
                        <span className="cn-delivery-name">
                          Email Notification
                          {isGuardianTarget && (
                            <span className="cn-delivery-locked-badge">Required</span>
                          )}
                        </span>
                        <span className="cn-delivery-desc">Sent directly to recipient email addresses</span>
                        <span className="cn-delivery-check">
                          {formData.deliveryChannels.includes("Email") ? "✓" : ""}
                        </span>
                      </button>

                      {/* Popup Notification — coming soon */}
                      <button
                        type="button"
                        className="cn-delivery-card cn-delivery-card--disabled"
                        disabled
                      >
                        <span className="cn-delivery-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                        </span>
                        <span className="cn-delivery-name">
                          Popup Notification
                          <span className="cn-delivery-soon">Coming Soon</span>
                        </span>
                        <span className="cn-delivery-desc">Real-time browser push notifications</span>
                        <span className="cn-delivery-check" />
                      </button>

                      {/* WhatsApp — coming soon */}
                      <button
                        type="button"
                        className="cn-delivery-card cn-delivery-card--disabled"
                        disabled
                      >
                        <span className="cn-delivery-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                          </svg>
                        </span>
                        <span className="cn-delivery-name">
                          WhatsApp
                          <span className="cn-delivery-soon">Coming Soon</span>
                        </span>
                        <span className="cn-delivery-desc">Send messages via WhatsApp Business</span>
                        <span className="cn-delivery-check" />
                      </button>

                    </div>
                  );
                })()}
              </div>

              <div>
                <span className="cn-template-label" style={{ display: "block", marginBottom: 8 }}>Target Audience *</span>
                <TargetAudienceSelector
                  selectedType={formData.targetType}
                  selectedTargets={formData.selectedTargets}
                  onChange={(targetType, selectedTargets) => {
                    const isGuardian = targetType === "all_guardians" || targetType === "specific_guardians";
                    setFormData((p) => ({
                      ...p,
                      targetType,
                      selectedTargets,
                      // Guardian targets: remove Web (n/a), force Email on
                      // All other targets: restore Web, keep current Email state
                      deliveryChannels: isGuardian
                        ? Array.from(new Set([...p.deliveryChannels.filter((c) => c !== "Web"), "Email"]))
                        : Array.from(new Set([...p.deliveryChannels.filter((c) => c !== "Web"), "Web"])),
                    }));
                  }}
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
