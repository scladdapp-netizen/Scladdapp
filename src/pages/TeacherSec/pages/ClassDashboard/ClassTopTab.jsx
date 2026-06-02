import { useNavigate, useParams, useLocation } from "react-router-dom";
import "../SubjectDashboard/SubjectTopTab.css"; // reuse same styles

const PROFILE_TABS = [
  { label: "Class Info",      link: "/info" },
  { label: "Class Subjects",  link: "/subjects" },
  { label: "Class Resources", link: "/resources" },
];

const ClassTopTab = ({ classData, children }) => {
  const { schoolId, classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const base = `/teacher/${schoolId}/class/${classId}`;

  const cls      = classData?.class || classData;
  const title    = cls?.class_name || "Class";
  const subtitle = cls ? `${cls.class_code || ""} • ${cls.is_active ? "Active" : "Inactive"}` : "";

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

export default ClassTopTab;
