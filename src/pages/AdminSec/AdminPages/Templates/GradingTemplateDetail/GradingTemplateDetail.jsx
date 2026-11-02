import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import ReportCardPreview from "../../../../../components/ReportCardPreview/ReportCardPreview";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useCombinedTemplate } from "../../../../../api_call/useCombinedTemplate";
import { useClass } from "../../../../../api_call/useClass";
import { hydrateReportHtml } from "../../../../../utils/hydrateReportHtml";
import { FaArrowLeft, FaEdit, FaCopy, FaTrash, FaBan, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import "../Templates.css";
import "../GradingTemplatePage/GradingTemplatePage.css";
import "./GradingTemplateDetail.css";

const classLabel = (c) => [c?.class_name, c?.class_section].filter(Boolean).join(" ") || c?.class_id || "Class";

const when = (value) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

function SetupView({ title, note, classNames, fields, scheme, traits }) {
  return (
    <div className="gtd-view ct-detail">
      <h2>{title}</h2>
      <p className="gtd-note">{note}</p>
      {classNames.length > 0 && (
        <div className="gte-chips">
          {classNames.map((name, i) => <span key={`${name}-${i}`} className="gte-chip">{name}</span>)}
        </div>
      )}

      <div className="detail-section ct-card">
        <h3>Scores teachers enter</h3>
        <div className="assessment-fields-table">
          <div className="fields-table-header"><span>Score</span><span>Weight</span><span>Highest mark</span></div>
          {(fields || []).map((field, i) => (
            <div key={i} className="fields-table-row">
              <span>{field.field_name}</span>
              <span>{field.weight}%</span>
              <span>{field.max_score || "—"}</span>
            </div>
          ))}
          <div className="fields-table-footer">
            <span><strong>Total</strong></span>
            <span><strong>{(fields || []).reduce((sum, field) => sum + (Number(field.weight) || 0), 0)}%</strong></span>
            <span />
          </div>
        </div>
      </div>

      <div className="detail-section ct-card">
        <h3>How a percentage becomes a grade</h3>
        <div className="scheme-scroll">
          <table className="scheme-view-table">
            <thead>
              <tr><th>Grade</th><th>From</th><th>To</th><th>Points</th><th>Result</th></tr>
            </thead>
            <tbody>
              {(scheme || []).map((row, i) => (
                <tr key={i}>
                  <td>{row.grade_letter}</td>
                  <td>{row.min_range}%</td>
                  <td>{row.max_range}%</td>
                  <td>{row.grade_point}</td>
                  <td>{row.pass_fail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="detail-section ct-card">
        <h3>Behaviour on the report card</h3>
        {(traits || []).length === 0 ? (
          <p className="gtd-note">No behaviour marks for this group.</p>
        ) : (
          <div className="gte-chips">
            {traits.map((trait) => <span key={trait} className="gte-chip">{trait}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GradingTemplateDetail() {
  const { schoolId, templateId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const { getTemplateById, deleteTemplate, duplicateTemplate, updateTemplateStatus, checkIsAssigned } = useCombinedTemplate();
  const { getClassesBySchoolId } = useClass();

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assigned, setAssigned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState("default");

  const admin = user?.admin;
  const isSuperAdmin = admin?.admin_role === "Super Admin" || (Array.isArray(admin?.permissions) && admin.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.report_template?.create;
  const canEdit = isSuperAdmin || !!admin?.permissions?.report_template?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.report_template?.delete;

  const back = () => navigate(`/admin/${schoolId}/templates`);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [tpl, lock, classRes] = await Promise.all([
        getTemplateById(templateId),
        checkIsAssigned(templateId),
        getClassesBySchoolId(schoolId),
      ]);
      if (cancelled) return;
      if (!tpl.success) {
        addNotification(tpl.message || "Could not open this template", "error");
        back();
        return;
      }
      setTemplate(tpl.data);
      setActive("default");
      setAssigned(!!lock.assigned);
      setClasses(classRes.success ? classRes.data || [] : []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId, templateId]);

  if (loading || !template) {
    return <div className="gte-page"><LoadingData message="Loading template..." /></div>;
  }

  const overrides = template.class_overrides || [];
  const namesFor = (ids) => (ids || []).map((id) => classLabel(classes.find((c) => String(c.class_id) === String(id)) || { class_id: id }));
  const used = new Set(overrides.flatMap((row) => (row.class_ids || []).map(String)));
  const defaultClasses = classes.filter((c) => !used.has(String(c.class_id)));
  const selected = typeof active === "number" ? overrides[active] || null : null;
  const view = selected
    ? {
        title: selected.name || "Class setup",
        note: "These classes use this setup instead of the default.",
        classNames: namesFor(selected.class_ids),
        fields: selected.grading_fields,
        scheme: selected.grading_scheme,
        traits: selected.behavioral_traits,
      }
    : {
        title: "All other classes",
        note: defaultClasses.length
          ? "These classes share the scores, grades, and behaviour marks below."
          : "Every class has its own setup. Nothing is left on the default.",
        classNames: defaultClasses.map(classLabel),
        fields: template.grading_fields,
        scheme: template.grading_scheme,
        traits: template.behavioral_traits,
      };
  const actor = user?.admin?.admin_id || user?.user_id;
  const inUse = template.status === "active";

  const duplicate = async () => {
    if (!canCreate) return addNotification("You do not have permission to duplicate templates.", "error");
    setBusy(true);
    const result = await duplicateTemplate(template.template_id, actor);
    setBusy(false);
    if (!result.success) return addNotification(result.message || "Could not duplicate the template", "error");
    addNotification("Template duplicated", "success");
    if (result.data?.template_id) navigate(`/admin/${schoolId}/templates/detail/${result.data.template_id}`);
  };

  const remove = async () => {
    if (!canDelete || assigned) return;
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    setBusy(true);
    const result = await deleteTemplate(template.template_id, actor);
    setBusy(false);
    if (!result.success) return addNotification(result.message || "Could not delete the template", "error");
    addNotification("Template deleted", "success");
    back();
  };

  const toggleStatus = async () => {
    if (!canEdit || assigned) return;
    const next = inUse ? "inactive" : "active";
    if (!window.confirm(inUse ? `Turn off "${template.name}"?` : `Turn on "${template.name}"?`)) return;
    setBusy(true);
    const result = await updateTemplateStatus(template.template_id, next, actor);
    setBusy(false);
    if (!result.success) return addNotification(result.message || "Could not update the template", "error");
    setTemplate(result.data || { ...template, status: next });
    addNotification(inUse ? "Template turned off" : "Template turned on", "success");
  };

  return (
    <div className="gte-page">
      <header className="gte-top">
        <button type="button" className="gte-back" onClick={back}><FaArrowLeft size={12} /> Templates</button>
        <div className="gte-title">
          <h1>{template.name}</h1>
          <p>{template.description || "No description yet."} Last changed {when(template.last_modified)}.</p>
        </div>
        <div className="gte-top-actions gtd-actions">
          {canEdit && (
            <Button onClick={() => navigate(`/admin/${schoolId}/templates/editor/${template.template_id}`)}>
              <FaEdit size={13} /> Edit scores and grades
            </Button>
          )}
          {canCreate && (
            <Button variant="secondary" onClick={duplicate} disabled={busy}><FaCopy size={13} /> Duplicate</Button>
          )}
          {canEdit && (
            <Button variant={inUse ? "warning" : "success"} onClick={toggleStatus} disabled={busy || assigned}>
              {inUse ? <FaBan size={13} /> : <FaCheckCircle size={13} />} {inUse ? "Turn off" : "Turn on"}
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={remove} disabled={busy || assigned}><FaTrash size={13} /> Delete</Button>
          )}
        </div>
      </header>

      <div className={`gtd-status ${inUse ? "is-on" : ""}`}>{inUse ? "In use" : "Turned off"}</div>

      {assigned && (
        <div className="gte-lock">
          <FaExclamationTriangle size={14} />
          This template is already used by a term, so it cannot be turned off or deleted.
        </div>
      )}

      <div className="gte-layout">
        <aside className="gte-side">
          <div className="gte-side-label">Classes</div>
          <div role="button" tabIndex={0} className={`gte-group${active === "default" ? " is-on" : ""}`} onClick={() => setActive("default")} onKeyDown={(e) => { if (e.key === "Enter") setActive("default"); }}>
            <strong>All other classes</strong>
            <span>Shared scores, grades, and behaviour</span>
            <div className="gte-chips">
              {defaultClasses.length === 0 && <em>Every class has its own setup.</em>}
              {defaultClasses.map((c) => <span key={String(c.class_id)} className="gte-chip">{classLabel(c)}</span>)}
            </div>
          </div>
          {overrides.map((row, i) => {
            const setupClasses = namesFor(row.class_ids);
            return (
              <div key={i} role="button" tabIndex={0} className={`gte-group${active === i ? " is-on" : ""}`} onClick={() => setActive(i)} onKeyDown={(e) => { if (e.key === "Enter") setActive(i); }}>
                <strong>{row.name || "Class setup"}</strong>
                <span>{setupClasses.length ? `${setupClasses.length} ${setupClasses.length === 1 ? "class" : "classes"}` : "No classes chosen yet"}</span>
                <div className="gte-chips">
                  {setupClasses.map((name, n) => <span key={`${name}-${n}`} className="gte-chip">{name}</span>)}
                </div>
              </div>
            );
          })}
          <div className="gte-side-label gtd-side-label">Report card</div>
          <div role="button" tabIndex={0} className={`gte-group${active === "report" ? " is-on" : ""}`} onClick={() => setActive("report")} onKeyDown={(e) => { if (e.key === "Enter") setActive("report"); }}>
            <strong>Report card</strong>
            <span>The printed page for this template</span>
          </div>
        </aside>

        <div className="gte-main">
          {active === "report" ? (
            <section className="gtd-report">
              <div className="gtd-preview-head">
                <div>
                  <h2>Report card</h2>
                  <p className="gtd-note">This is the printed page. Class setups change the scores and grades. They do not redraw this page by themselves.</p>
                </div>
                {canEdit && (
                  <Button variant="secondary" onClick={() => navigate(`/admin/${schoolId}/templates/edit/${template.template_id}`)}>
                    <FaEdit size={13} /> Edit report card
                  </Button>
                )}
              </div>
              <div className="gtd-preview">
                {template.html_template
                  ? <div dangerouslySetInnerHTML={{ __html: hydrateReportHtml(template.html_template, template, user?.school || {}) }} />
                  : <ReportCardPreview template={template} school={user?.school} />}
              </div>
            </section>
          ) : (
            <SetupView {...view} />
          )}
        </div>
      </div>
    </div>
  );
}
