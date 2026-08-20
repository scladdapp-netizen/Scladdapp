import { useParams } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import CombinedTemplates from "./CombinedTemplates/CombinedTemplates";
import FeeBillTemplates from "./FeeBillTemplates/FeeBillTemplates";
import TimetableTemplates from "./TimetableTemplates/TimetableTemplates";
import AnnouncementTemplates from "./AnnouncementTemplates/AnnouncementTemplates";
import ClassPromotionTemplates from "./ClassPromotionTemplates/ClassPromotionTemplates";
import "./Templates.css";

const Templates = () => {
  const { tab } = useParams();

  const tabRoutes = [
    { label: "Grading Templates", link: "" },
    { label: "Fee Bill Templates", link: "/fee_bill" },
    // { label: "Timetable Templates", link: "/timetable" },
    { label: "Announcement Templates", link: "/announcement" },
    { label: "Class Promotion Templates", link: "/class_promotion" },
  ];

  const renderTabContent = () => {
    switch (tab) {
      case "fee_bill":
        return <FeeBillTemplates />;
      case "timetable":
        return <TimetableTemplates />;
      case "announcement":
        return <AnnouncementTemplates />;
      case "class_promotion":
        return <ClassPromotionTemplates />;
      default:
        return <CombinedTemplates />;
    }
  };

  return (
    <StudentDetailTopTab
      title="Templates"
      subtitle="Manage and customize templates for various school operations"
      route={tabRoutes}
    >
      {renderTabContent()}
    </StudentDetailTopTab>
  );
};

export default Templates;

