import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./SubjectTopTab.css";

const PROFILE_TABS = [
  { label: "Subject Info",      link: "/info" },
  { label: "Subject Books",     link: "/books" },
  { label: "Subject Resources", link: "/resources" },
];

const SubjectTopTab = ({ subjectData, children }) => {
  const { schoolId, subjectId } = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const base = `/teacher/${schoolId}/subject/${subjectId}`;

  const subject  = subjectData?.subject;
  const title    = subject?.subject_name || "Subject";
  const subtitle = subject ? `${subject.subject_code} • ${subject.is_active ? "Active" : "Inactive"}` : "";

  const isActive = (link) => location.pathname === `${base}${link}`;

  return (
    <div className="sdtt_main">
      <div className="sdtt_header">
        <h1 className="sdtt_title">{title}</h1>
        {subtitle && <p className="sdtt_subtitle">{subtitle}</p>}
        <div className="sdtt_tabs">
          {PROFILE_TABS.map((tab) => (
            <div
              key={tab.link}
              className={`sdtt_tab ${isActive(tab.link) ? "active" : ""}`}
              onClick={() => navigate(`${base}${tab.link}`)}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>
      <div className="sdtt_content">{children}</div>
    </div>
  );
};

export default SubjectTopTab;
