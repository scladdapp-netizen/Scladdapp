import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import "./SubjectInfo.css";

const STREAM_LABELS = {
  science:    "Science Stream",
  arts:       "Arts Stream",
  commercial: "Commercial Stream",
  general:    "General (All Streams)",
};

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

const SubjectInfo = ({ subjectData }) => {
  const subjectInfo   = subjectData?.subject || {};
  const isActive      = subjectInfo.is_active;
  const activeClass   = subjectData?.class_assignments?.find((c) => c.is_active) ?? subjectData?.class_assignments?.[0];

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
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="si-header-text">
                <h3>{subjectInfo.subject_name || "N/A"}</h3>
                <p className="si-subtitle">
                  {subjectInfo.subject_code} · {subjectInfo.subject_id}
                </p>
                <div className="si-badges">
                  <span className={`si-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "✓ Active" : "✗ Inactive"}
                  </span>
                  {subjectInfo.stream && (
                    <span className="si-badge">
                      {STREAM_LABELS[subjectInfo.stream] || subjectInfo.stream}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="si-body">
            {/* Basic info */}
            <div>
              <span className="si-section-title">Basic Information</span>
              <div className="si-grid">
                <InfoField label="Subject Name" value={subjectInfo.subject_name || "N/A"} />
                <InfoField label="Subject Code" value={subjectInfo.subject_code || "N/A"} />
                <InfoField label="Subject ID"   value={subjectInfo.subject_id   || "N/A"} />
                <InfoField label="Stream"       value={STREAM_LABELS[subjectInfo.stream] || subjectInfo.stream || "No stream"} />
                <InfoField label="Status"       value={isActive ? "Active" : "Inactive"} />
                <InfoField label="Class"        value={activeClass?.class_name || "N/A"} />
                <InfoField label="Created"      value={fmt(subjectInfo.created_at)} />
              </div>
            </div>

            {/* Description */}
            {subjectInfo.subject_description && (
              <div>
                <span className="si-section-title">Description</span>
                <p className="si-description">{subjectInfo.subject_description}</p>
              </div>
            )}


          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

export default SubjectInfo;
