import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import "../../../SubjectDashboard/pages/SubjectInfo/SubjectInfo.css";

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

const ClassInfo = ({ classData }) => {
  const cls      = classData?.class || {};
  const isActive = cls.is_active;

  return (
    <InnerTabCon>
      <div className="si-overview">
        <div className="si-card">

          {/* Banner */}
          <div className="si-banner">
            <span className="si-banner-deco" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="si-header">
            <div className="si-header-left">
              <div className="si-icon-wrap">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="si-header-text">
                <h3>{cls.class_name || "N/A"}</h3>
                <p className="si-subtitle">
                  {cls.class_code} · {cls.class_id}
                </p>
                <div className="si-badges">
                  <span className={`si-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "✓ Active" : "✗ Inactive"}
                  </span>
                  {cls.class_type && (
                    <span className="si-badge">{cls.class_type}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="si-body">
            <div>
              <span className="si-section-title">Basic Information</span>
              <div className="si-grid">
                <InfoField label="Class Name"  value={cls.class_name    || "N/A"} />
                <InfoField label="Class Code"  value={cls.class_code    || "N/A"} />
                <InfoField label="Class ID"    value={cls.class_id      || "N/A"} />
                <InfoField label="Section"     value={cls.class_section || "N/A"} />
                <InfoField label="Type"        value={cls.class_type    || "N/A"} />
                <InfoField label="Room"        value={cls.room_number   || "N/A"} />
                <InfoField label="Status"      value={isActive ? "Active" : "Inactive"} />
                <InfoField label="Created"     value={fmt(cls.created_at)} />
              </div>
            </div>

            {cls.description && (
              <div>
                <span className="si-section-title">Description</span>
                <p className="si-description">{cls.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

export default ClassInfo;
