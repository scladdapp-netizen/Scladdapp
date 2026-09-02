import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../components/Button/Button";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import {
  fetchApplications,
  fetchApplicationById,
  fetchApplicationFormConfig,
  updateApplicationStatus,
} from "../../../../api_call/useApplicationForm";
import "../Settings/SchoolData/SchoolData.css";
import "./Applications.css";

const STATUS_TABS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ status }) {
  return <span className={`app-status-pill app-status-pill--${status}`}>{status}</span>;
}

function formatFieldValue(field, value) {
  if (field?.type === "checkbox") return value ? "Yes" : "No";
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function ApplicationDetailPanel({ schoolId, applicationId, fieldMap, open, onClose, onUpdated, onSeen, onAdmit }) {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    if (!open || !applicationId) return;
    setLoading(true);
    fetchApplicationById(schoolId, applicationId)
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Failed to load application");
        setApplication(res.data);
        onSeen?.(applicationId);
      })
      .catch((err) => addNotification(err.message, "error"))
      .finally(() => setLoading(false));
  }, [open, applicationId, schoolId, addNotification, onSeen]);

  const handleStatus = async (status) => {
    if (!applicationId || saving) return;
    setSaving(true);
    try {
      const res = await updateApplicationStatus(schoolId, applicationId, { status });
      if (!res.success) throw new Error(res.message || "Failed to update status");
      setApplication(res.data);
      onUpdated?.();
      addNotification(res.message || "Status updated", "success");
    } catch (err) {
      addNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const sections = useMemo(() => {
    if (!application) return [];
    const data = application.data || {};
    const files = application.files || {};
    const grouped = new Map();

    Object.keys(data).forEach((fieldId) => {
      const field = fieldMap.get(fieldId);
      const sectionTitle = field?.sectionTitle || "Other";
      if (!grouped.has(sectionTitle)) grouped.set(sectionTitle, []);
      grouped.get(sectionTitle).push({
        id: fieldId,
        label: field?.label || fieldId,
        type: field?.type || "text",
        value: data[fieldId],
      });
    });

    Object.keys(files).forEach((fieldId) => {
      const field = fieldMap.get(fieldId);
      const sectionTitle = field?.sectionTitle || "Files";
      if (!grouped.has(sectionTitle)) grouped.set(sectionTitle, []);
      grouped.get(sectionTitle).push({
        id: fieldId,
        label: field?.label || files[fieldId]?.label || fieldId,
        type: "file",
        value: files[fieldId],
      });
    });

    return [...grouped.entries()].map(([title, fields]) => ({ title, fields }));
  }, [application, fieldMap]);

  return (
    <SlideInMenu isShow={open} onClose={onClose} width="560px">
      <div className="app-detail-panel sd-panel">
        <div className="sd-panel-header">
          <span className="sd-panel-deco" aria-hidden="true" />
          <div className="sd-panel-header-content">
            <div className="sd-panel-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="sd-panel-header-text">
              <h2>{application?.data?.full_name || "Application"}</h2>
              <p>{application?.application_id || "Loading…"}</p>
            </div>
          </div>
        </div>

        <div className="sd-panel-body app-detail-body">
          {loading ? (
            <div className="app-detail-loading">
              <div className="app-detail-spinner" />
              <span>Loading application…</span>
            </div>
          ) : application ? (
            <>
              <div className="app-detail-meta">
                <div className="app-detail-meta-item">
                  <span>Status</span>
                  <strong><StatusPill status={application.status} /></strong>
                </div>
                <div className="app-detail-meta-item">
                  <span>Submitted</span>
                  <strong>{formatDate(application.submitted_at)}</strong>
                </div>
                <div className="app-detail-meta-item">
                  <span>Class applying</span>
                  <strong>{application.data?.class_applying || "—"}</strong>
                </div>
                <div className="app-detail-meta-item">
                  <span>Guardian phone</span>
                  <strong>{application.data?.guardian_phone || "—"}</strong>
                </div>
              </div>

              {sections.map((section) => (
                <div key={section.title} className="app-detail-section">
                  <div className="app-detail-section-head">{section.title}</div>
                  <div className="app-detail-rows">
                    {section.fields.map((field) => (
                      <div key={field.id} className="app-detail-row">
                        <div className="app-detail-row-label">{field.label}</div>
                        <div className="app-detail-row-value">
                          {field.type === "file" && field.value?.url ? (
                            <a href={field.value.url} target="_blank" rel="noreferrer" className="app-detail-file">
                              {field.value.url.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) ? (
                                <img src={field.value.url} alt={field.label} />
                              ) : null}
                              View file
                            </a>
                          ) : (
                            formatFieldValue(field, field.value)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : null}
        </div>

        {application && (
          <div className="sd-panel-footer app-detail-footer">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            {application.status !== "rejected" && (
              <Button variant="secondary" disabled={saving} onClick={() => handleStatus("rejected")}>
                Reject
              </Button>
            )}
            {application.status !== "approved" && (
              <Button disabled={saving} onClick={() => onAdmit?.(application)}>
                Admit
              </Button>
            )}
            {application.status !== "pending" && (
              <Button variant="secondary" disabled={saving} onClick={() => handleStatus("pending")}>
                Mark pending
              </Button>
            )}
          </div>
        )}
      </div>
    </SlideInMenu>
  );
}

export default function Applications() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [fieldMap, setFieldMap] = useState(new Map());
  const [seenIds, setSeenIds] = useState(() => new Set());

  useEffect(() => {
    if (!schoolId) return;
    fetchApplicationFormConfig(schoolId).then((res) => {
      if (!res.success) return;
      const map = new Map();
      (res.data.sections || []).forEach((section) => {
        section.fields.forEach((field) => {
          map.set(field.id, { ...field, sectionTitle: section.title });
        });
      });
      setFieldMap(map);
    });
  }, [schoolId]);

  const fetchData = useCallback(async (params) => {
    const result = await fetchApplications(schoolId, {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: statusFilter === "all" ? "" : statusFilter,
    });

    if (result.success) {
      return {
        success: true,
        data: (result.data || []).map((row) => ({
          ...row,
          id: row.application_id,
          is_seen: seenIds.has(row.application_id) || row.is_seen,
        })),
        pagination: result.pagination,
      };
    }
    return result;
  }, [schoolId, statusFilter, seenIds]);

  const handleApplicationSeen = useCallback((applicationId) => {
    setSeenIds((prev) => {
      if (prev.has(applicationId)) return prev;
      const next = new Set(prev);
      next.add(applicationId);
      return next;
    });
    setReloadKey((k) => k + 1);
    window.dispatchEvent(new CustomEvent("applications-unseen-updated"));
  }, []);

  const handleAdmit = useCallback((application) => {
    if (!application) return;
    setDetailOpen(false);
    navigate(`/admin/${schoolId}/school_directory/students`, {
      state: {
        admitFromApplication: {
          applicationId: application.application_id,
          data: application.data || {},
          files: application.files || {},
        },
      },
    });
  }, [navigate, schoolId]);

  const columns = [
    {
      label: "Applicant",
      accessor: "full_name",
      render: (v, row) => (
        <span className="app-col-name-wrap">
          {!row.is_seen && <span className="app-unseen-dot" title="Unread" aria-label="Unread application" />}
          <span className="app-col-name">{v}</span>
        </span>
      ),
    },
    {
      label: "Class",
      accessor: "class_applying",
      render: (v) => <span className="app-col-muted">{v}</span>,
    },
    {
      label: "Guardian contact",
      accessor: "guardian_email",
      render: (v, row) => (
        <div className="app-col-contact">
          <span className="app-col-contact-email">{v}</span>
          <span className="app-col-contact-phone">{row.guardian_phone}</span>
        </div>
      ),
    },
    {
      label: "Status",
      accessor: "status",
      render: (v) => <StatusPill status={v} />,
    },
    {
      label: "Submitted",
      accessor: "submitted_at",
      render: (v) => <span className="app-col-muted">{formatDate(v)}</span>,
    },
  ];

  return (
    <div className="app-wrap">
      <div className="app-status-filter">
        <div className="app-status-filter-top">
          <h1 className="app-title">Applications</h1>
          <p className="app-subtitle">Review student applications submitted through your public form</p>
        </div>
        <div className="app-status-tabs">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`app-status-tab${statusFilter === tab.id ? " active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <InnerTabCon>
          <ServerSmartTable
            columns={columns}
            fetchData={fetchData}
            reloadKey={reloadKey}
            showcreatbut={false}
            onRowClick={(row) => {
              setSelectedId(row.application_id);
              setDetailOpen(true);
            }}
          />
        </InnerTabCon>
      </div>

      <ApplicationDetailPanel
        schoolId={schoolId}
        applicationId={selectedId}
        fieldMap={fieldMap}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdated={() => setReloadKey((k) => k + 1)}
        onSeen={handleApplicationSeen}
        onAdmit={handleAdmit}
      />
    </div>
  );
}
