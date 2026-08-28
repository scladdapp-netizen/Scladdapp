import React, { useEffect, useCallback, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ServerSmartTable from "../../../../components/ServerSmartTable/ServerSmartTable";
import CenterModal from "../../../../components/CenterModal/CenterModal";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import ReportCardPreview from "../../../../components/ReportCardPreview/ReportCardPreview";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import "./AdminSubseasionStudentReport.css";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

/* ── Inline SVG icons ─────────────────────────────────────────────────────── */
const IcoDots = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="5" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
    <circle cx="11" cy="17" r="1.5" fill="currentColor"/>
  </svg>
);
const IcoReport = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <rect x="4" y="2" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <path d="M8 7h6M8 11h6M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoPublish = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M11 3v12M6 8l5-5 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 18h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IcoUnpublish = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M11 19V7M6 14l5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const IcoEye = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M2 11s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <circle cx="11" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const IcoEmail = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <rect x="3" y="5" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
    <path d="M4 7.2 11 12l7-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoTrash = () => (
  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
    <path d="M3 6h16M8 6V4h6v2M5 6l1 13h10l1-13M9 10v5M13 10v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const AdminSubseasionStudentReport = ({ setsetsubId }) => {
  const { subseasionId, schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.student_report?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.student_report?.edit;
  const canRead   = isSuperAdmin || !!admin?.permissions?.student_report?.read;

  const [tableData, setTableData]           = useState([]);
  const [bulkLoading, setBulkLoading]       = useState(false);
  const [bulkMsg, setBulkMsg]               = useState(null);
  const [reloadTick, setReloadTick]         = useState(0);
  const triggerReload = () => setReloadTick((t) => t + 1);

  const [modalOpen, setModalOpen]           = useState(false);
  const [modalType, setModalType]           = useState(null);
  const [modalContext, setModalContext]     = useState(null);
  const [teacherRemark, setTeacherRemark]   = useState("");
  const [principalRemark, setPrincipalRemark] = useState("");
  const [overrideRemarks, setOverrideRemarks] = useState(false);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [previewOpen, setPreviewOpen]       = useState(false);
  const [previewData, setPreviewData]       = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (subseasionId && setsetsubId) setsetsubId(subseasionId);
  }, [subseasionId]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setOpenDropdownId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRowCreateReport = (row, e) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (!canCreate) { addNotification("No permission to create reports.", "error"); return; }
    setTeacherRemark(""); setPrincipalRemark(""); setOverrideRemarks(false);
    setModalType("create");
    setModalContext({ clearSel: () => {}, reload: triggerReload, targets: [row], withReport: row.has_report ? [row] : [] });
    setModalOpen(true);
  };

  const handleRowPublish = async (row, publish, e) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (!canEdit) { addNotification("No permission to publish results.", "error"); return; }
    await fetch(`${API}/api/student-report/student/${row.student_id}/subsession/${subseasionId}/report-card`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: publish, modified_by: user?.admin?.admin_id || user?.user_id }),
    });
    triggerReload();
  };

  const handleRowViewReport = async (row, e) => {
    e.stopPropagation();
    setOpenDropdownId(null);
    if (!canRead) { addNotification("No permission to view reports.", "error"); return; }
    setPreviewData(null); setPreviewOpen(true); setPreviewLoading(true);
    try {
      const res = await fetch(`${API}/api/student-report/student/${row.student_id}/subsession/${subseasionId}/preview`);
      const data = await res.json();
      if (data.success) setPreviewData(data.data);
    } catch (_) {}
    setPreviewLoading(false);
  };

  const fetchData = useCallback(async (params) => {
    try {
      const query = new URLSearchParams({
        page: params.page || 1, limit: params.limit || 20,
        search: params.search || "", sortBy: params.sortBy || "student_name",
        sortOrder: params.sortOrder || "asc",
      });
      const res = await fetch(`${API}/api/student-report/subsession/${subseasionId}/report-cards?${query}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const result = await res.json();
      if (result.success) {
        const mapped = result.data.map((r) => ({ ...r, id: r.assignment_id }));
        setTableData(mapped);
        return { success: true, data: mapped, pagination: result.pagination };
      }
      return result;
    } catch (err) {
      return { success: false, data: [], message: err.message };
    }
  }, [subseasionId, reloadTick]);

  const handleCreateReports = (ids, clearSel, reload) => {
    const targets = tableData.filter((r) => ids.includes(r.id));
    if (!targets.length) return;
    const withReport = targets.filter((r) => r.has_report);
    setTeacherRemark(""); setPrincipalRemark(""); setOverrideRemarks(false);
    setModalType("create");
    setModalContext({ clearSel, reload, targets, withReport });
    setModalOpen(true);
  };

  const handleModalConfirm = async () => {
    const { targets, clearSel, reload } = modalContext;
    setBulkLoading(true); setModalOpen(false);
    let done = 0;
    for (const row of targets) {
      if (row.has_report && !overrideRemarks) continue;
      await fetch(`${API}/api/student-report/student/${row.student_id}/subsession/${subseasionId}/report-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_remark: teacherRemark || null, principal_remark: principalRemark || null, modified_by: user?.admin?.admin_id || user?.user_id }),
      });
      done++;
    }
    setBulkLoading(false);
    setBulkMsg({ type: "success", text: `${done} report card(s) created/updated.` });
    clearSel(); reload();
  };

  const handlePublish = (ids, clearSel, reload) => {
    const selected = tableData.filter((r) => ids.includes(r.id));
    const noReport = selected.filter((r) => !r.has_report);
    const withReport = selected.filter((r) => r.has_report);
    const alreadyPublished = withReport.filter((r) => r.is_published);
    const toPublish = withReport.filter((r) => !r.is_published);
    setModalType("publish");
    setModalContext({ clearSel, reload, toPublish, alreadyPublished, noReport });
    setModalOpen(true);
  };

  const handlePublishConfirm = async () => {
    const { toPublish, clearSel, reload } = modalContext;
    if (!toPublish.length) { setModalOpen(false); return; }
    setBulkLoading(true); setModalOpen(false);
    for (const row of toPublish) {
      await fetch(`${API}/api/student-report/student/${row.student_id}/subsession/${subseasionId}/report-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: true, modified_by: user?.admin?.admin_id || user?.user_id }),
      });
    }
    setBulkLoading(false);
    setBulkMsg({ type: "success", text: `Published ${toPublish.length} report card(s).` });
    clearSel(); reload();
  };

  const handleSendEmail = async (ids, clearSel, reload) => {
    if (!canEdit) { addNotification("No permission to send result emails.", "error"); return; }
    const selected = tableData.filter((r) => ids.includes(r.id));
    const published = selected.filter((r) => r.has_report && r.is_published);
    const notPublished = selected.filter((r) => r.has_report && !r.is_published);
    const noReport = selected.filter((r) => !r.has_report);
    const noEmail = published.filter((r) => !r.email);
    const toSend = published.filter((r) => r.email);

    let quota = null;
    try {
      const qRes = await fetch(`${API}/api/student-report/email-quota`);
      const qData = await qRes.json();
      if (qData.success) quota = qData.data;
    } catch (_) {}

    setModalType("email");
    setModalContext({ clearSel, reload, toSend, notPublished, noReport, noEmail, published, quota });
    setModalOpen(true);
  };

  const handleSendEmailConfirm = async () => {
    const { toSend, clearSel, reload } = modalContext || {};
    if (!toSend?.length) { setModalOpen(false); return; }
    setBulkLoading(true); setModalOpen(false);
    try {
      const res = await fetch(`${API}/api/student-report/subsession/${subseasionId}/send-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_ids: toSend.map((r) => r.student_id),
          modified_by: user?.admin?.admin_id || user?.user_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const d = data.data || {};
        setBulkMsg({
          type: "success",
          text: `Emails: ${d.sent || 0} sent, ${d.queued || 0} queued. Skipped ${d.skipped_not_published || 0} not published, ${d.skipped_no_email || 0} without email.`,
        });
        addNotification(data.message || "Result emails processed", "success");
      } else {
        setBulkMsg({ type: "error", text: data.message || "Failed to send emails" });
        addNotification(data.message || "Failed to send emails", "error");
      }
    } catch (err) {
      setBulkMsg({ type: "error", text: err.message || "Failed to send emails" });
      addNotification("Failed to send emails", "error");
    }
    setBulkLoading(false);
    clearSel?.();
    reload?.();
  };

  const handleViewDetails = (row) => {
    navigate(`/admin/${schoolId}/Profile/${row.student_id}/${subseasionId}/report`);
  };

  const reportStatusBadge = (row) => {
    if (!row.has_report) return <span className="asr-badge asr-badge-none">No Report</span>;
    return row.is_published
      ? <span className="asr-badge asr-badge-published">Published</span>
      : <span className="asr-badge asr-badge-draft">Draft</span>;
  };

  const columns = [
    { label: "Student Name", accessor: "student_name",
      render: (v) => <span className="asr-student-name">{v}</span> },
    { label: "Admission No.", accessor: "admission_number",
      render: (v) => <span className="asr-mono">{v}</span> },
    { label: "Class", accessor: "class_name" },
    { label: "Report Status", accessor: "has_report", render: (_, row) => reportStatusBadge(row) },
    {
      label: "Actions", accessor: "actions", searchable: false,
      render: (_, row) => (
        <div className="asr-action-wrap" ref={openDropdownId === row.id ? dropdownRef : null}
          onClick={(e) => e.stopPropagation()}>
          <button className="asr-action-btn" onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(openDropdownId === row.id ? null : row.id);
          }}>
            <IcoDots />
          </button>
          {openDropdownId === row.id && (
            <div className="asr-action-menu">
              <button className="asr-action-item" disabled={row.has_report}
                onClick={(e) => handleRowCreateReport(row, e)}>
                <IcoReport /> Create Report
              </button>
              {!row.is_published ? (
                <button className="asr-action-item" disabled={!row.has_report}
                  onClick={(e) => handleRowPublish(row, true, e)}>
                  <IcoPublish /> Publish Result
                </button>
              ) : (
                <button className="asr-action-item asr-action-danger"
                  onClick={(e) => handleRowPublish(row, false, e)}>
                  <IcoUnpublish /> Unpublish
                </button>
              )}
              <button className="asr-action-item" disabled={!row.has_report}
                onClick={(e) => handleRowViewReport(row, e)}>
                <IcoEye /> View Report
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  const bulkActions = [
    {
      label: bulkLoading ? "Working..." : "Create Report",
      className: "btn-primary", disabled: bulkLoading,
      onClick: (ids, clearSel, reload) => handleCreateReports(ids, clearSel, reload),
    },
    {
      label: bulkLoading ? "Working..." : "Publish Results",
      className: "btn-success", disabled: bulkLoading,
      onClick: (ids, clearSel, reload) => handlePublish(ids, clearSel, reload),
    },
    {
      label: bulkLoading ? "Working..." : "Send Email",
      className: "btn-primary", disabled: bulkLoading,
      onClick: (ids, clearSel, reload) => handleSendEmail(ids, clearSel, reload),
    },
    {
      label: "Clear", className: "", disabled: bulkLoading,
      onClick: (_ids, clearSel) => { clearSel(); setBulkMsg(null); },
    },
  ];

  return (
    <div className="asr-container">
      <InnerTabCon>
        <div className="asr-header">
          <h2>Student Report</h2>
          <p>All students in this subsession with their report card status</p>
        </div>

        {bulkMsg && (
          <div className={`asr-bulk-msg asr-bulk-msg-${bulkMsg.type}`}>{bulkMsg.text}</div>
        )}

        <ServerSmartTable
          columns={columns}
          fetchData={fetchData}
          onRowClick={handleViewDetails}
          enableSelect
          onSelectChange={() => setBulkMsg(null)}
          bulkActions={bulkActions}
          showcreatbut={false}
          reloadKey={reloadTick}
        />
      </InnerTabCon>

      {/* ── Create / Publish modal ── */}
      <CenterModal isShow={modalOpen} onClose={() => setModalOpen(false)} size="small">

        {modalType === "create" && (
          <div className="asr-modal">
            <div className="asr-modal-header">
              <span className="asr-modal-deco" aria-hidden="true" />
              <div className="asr-modal-header-content">
                <div className="asr-modal-icon"><IcoReport /></div>
                <div>
                  <h3>Create Report Cards</h3>
                  <p>Creating for <strong>{modalContext?.targets?.length}</strong> student(s)
                    {modalContext?.withReport?.length > 0 && (
                      <> · <span className="asr-warn">{modalContext.withReport.length} already have a report</span></>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="asr-modal-body">
              <div className="asr-modal-field">
                <label>Teacher's Remark</label>
                <textarea rows={3} placeholder="Enter teacher's remark (optional)"
                  value={teacherRemark} onChange={(e) => setTeacherRemark(e.target.value)} />
              </div>
              <div className="asr-modal-field">
                <label>Principal's Remark</label>
                <textarea rows={3} placeholder="Enter principal's remark (optional)"
                  value={principalRemark} onChange={(e) => setPrincipalRemark(e.target.value)} />
              </div>
              {modalContext?.withReport?.length > 0 && (
                <label className="asr-modal-override">
                  <input type="checkbox" checked={overrideRemarks}
                    onChange={(e) => setOverrideRemarks(e.target.checked)} />
                  Override remarks for students that already have a report
                </label>
              )}
            </div>
            <div className="asr-modal-footer">
              <button className="asr-modal-btn asr-modal-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="asr-modal-btn asr-modal-btn-primary" onClick={handleModalConfirm} disabled={bulkLoading}>Confirm</button>
            </div>
          </div>
        )}

        {modalType === "publish" && (
          <div className="asr-modal">
            <div className="asr-modal-header">
              <span className="asr-modal-deco" aria-hidden="true" />
              <div className="asr-modal-header-content">
                <div className="asr-modal-icon"><IcoPublish /></div>
                <div>
                  <h3>Publish Report Cards</h3>
                  <p><strong>{modalContext?.toPublish?.length}</strong> report card(s) will be published</p>
                </div>
              </div>
            </div>
            <div className="asr-modal-body">
              {modalContext?.noReport?.length > 0 && (
                <div className="asr-modal-info">
                  <span className="asr-warn">{modalContext.noReport.length} student(s) have no report</span> — will be skipped.
                </div>
              )}
              {modalContext?.alreadyPublished?.length > 0 && (
                <div className="asr-modal-info">
                  <span className="asr-warn">{modalContext.alreadyPublished.length} already published</span> — will be skipped.
                </div>
              )}
              {modalContext?.toPublish?.length === 0 && (
                <div className="asr-modal-info asr-warn">Nothing to publish in this selection.</div>
              )}
            </div>
            <div className="asr-modal-footer">
              <button className="asr-modal-btn asr-modal-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              {modalContext?.toPublish?.length > 0 && (
                <button className="asr-modal-btn asr-modal-btn-publish" onClick={handlePublishConfirm} disabled={bulkLoading}>Publish</button>
              )}
            </div>
          </div>
        )}

        {modalType === "email" && (
          <div className="asr-modal">
            <div className="asr-modal-header">
              <span className="asr-modal-deco" aria-hidden="true" />
              <div className="asr-modal-header-content">
                <div className="asr-modal-icon"><IcoEmail /></div>
                <div>
                  <h3>Send Result Emails</h3>
                  <p>
                    <strong>{modalContext?.toSend?.length || 0}</strong> published report(s) will receive email
                  </p>
                </div>
              </div>
            </div>
            <div className="asr-modal-body">
              {modalContext?.notPublished?.length > 0 && (
                <div className="asr-modal-info">
                  <span className="asr-warn">{modalContext.notPublished.length} not published</span> — email will not be sent.
                </div>
              )}
              {modalContext?.noReport?.length > 0 && (
                <div className="asr-modal-info">
                  <span className="asr-warn">{modalContext.noReport.length} have no report</span> — will be skipped.
                </div>
              )}
              {modalContext?.noEmail?.length > 0 && (
                <div className="asr-modal-info">
                  <span className="asr-warn">{modalContext.noEmail.length} published with no email</span> — will be skipped.
                </div>
              )}
              {modalContext?.quota && (
                <div className="asr-modal-info">
                  Email quota today: <strong>{modalContext.quota.remaining}</strong> of {modalContext.quota.daily_limit} remaining
                  {modalContext.quota.queued > 0 && <> · {modalContext.quota.queued} already queued</>}
                  {(modalContext.toSend?.length || 0) > (modalContext.quota.remaining || 0) && (
                    <> — extras will be queued for the next period.</>
                  )}
                </div>
              )}
              {(!modalContext?.toSend || modalContext.toSend.length === 0) && (
                <div className="asr-modal-info asr-warn">Nothing to email in this selection. Publish results first.</div>
              )}
            </div>
            <div className="asr-modal-footer">
              <button className="asr-modal-btn asr-modal-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              {modalContext?.toSend?.length > 0 && (
                <button className="asr-modal-btn asr-modal-btn-primary" onClick={handleSendEmailConfirm} disabled={bulkLoading}>
                  {bulkLoading ? "Sending..." : "Send Email"}
                </button>
              )}
            </div>
          </div>
        )}

      </CenterModal>

      {/* ── Preview panel ── */}
      <SlideInMenu isShow={previewOpen} onClose={() => setPreviewOpen(false)} width="780px">
        <div className="asr-preview-container">
          <div className="asr-preview-header">
            <span className="asr-preview-deco" aria-hidden="true" />
            <span className="asr-preview-deco2" aria-hidden="true" />
            <div className="asr-preview-header-content">
              <div className="asr-preview-icon">
                <IcoReport />
              </div>
              <div className="asr-preview-header-text">
                <h2>Report Card Preview</h2>
                <p>Student academic performance report</p>
              </div>
            </div>
          </div>
          <div className="asr-preview-body">
            {previewLoading && <p className="asr-preview-empty">Loading preview...</p>}
            {!previewLoading && previewData && (
              <ReportCardPreview template={previewData.template} student={previewData.student} />
            )}
            {!previewLoading && !previewData && (
              <p className="asr-preview-empty">No preview data available.</p>
            )}
          </div>
        </div>
      </SlideInMenu>
    </div>
  );
};

export default AdminSubseasionStudentReport;
