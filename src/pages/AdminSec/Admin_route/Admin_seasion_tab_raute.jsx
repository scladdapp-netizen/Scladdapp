import { useEffect, useState } from "react";
import { Route, Routes, useParams, useLocation } from "react-router-dom";
import NotFound from "../../NotFound/NotFound";
import StudentPromotion from "../AdminPages/StudentPromotion/StudentPromotion";
import SessionGraduation from "../AdminPages/SessionGraduation/SessionGraduation";
import SessionAdmissionsTab from "../AdminPages/SessionAdmissionsTab/SessionAdmissionsTab";
import ClassHeadmaster from "../AdminPages/ClassHeadmaster/ClassHeadmaster";
import SubjectTeacher from "../AdminPages/SubjectTeacher/SubjectTeacher";
import SeasionOverview from "../AdminPages/SeasionOverview/SeasionOverview";
import CreateSessionWizard from "../AdminPages/CreateSessionWizard/CreateSessionWizard";
import AcademicSessionList from "../AdminPages/AcademicSessionList/AcademicSessionList";
import AdminPageTabs from "../AdminLayout/Admin_acedemic_seasion_tab_layout/AdminPageTabs";
import AdminSeasionDetailTopTab from "../Admin_components/AdminSeasionDetailTopTab/AdminSeasionDetailTopTab";
import SubAdminGuard from "../../../components/SubAdminGuard/SubAdminGuard";

import SeasionData from "../../../data/SeasionData.json";
import AdminSubseasionClasses from "../AdminPages/AdminSubseasionClasses/AdminSubseasionClasses";
import AdminSubseasionStudents from "../AdminPages/AdminSubseasionStudents/AdminSubseasionStudents";
import AdminSubseasionSubjects from "../AdminPages/AdminSubseasionSubjects/AdminSubseasionSubjects";
import AdminSubseasionEvents from "../AdminPages/AdminSubseasionEvents/AdminSubseasionEvents";
import AdminSubseasionCalendar from "../AdminPages/AdminSubseasionCalendar/AdminSubseasionCalendar";
import AdminSubseasionIncomeExpenses from "../AdminPages/AdminSubseasionIncomeExpenses/AdminSubseasionIncomeExpenses";
import AdminSubseasionStudentReport from "../AdminPages/AdminSubseasionStudentReport/AdminSubseasionStudentReport";
import AdminSubseasionTimetable from "../AdminPages/AdminSubseasionTimetable/AdminSubseasionTimetable";

const Edit_Seasion_fields = [
  {
    name: "name",
    label: "Session Name",
    type: "text",
    placeholder: "e.g 2025/2026",
    required: true,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    required: true,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    required: true,
  },
];

const SubSeasionRoute = [
  { label: "School Events ", link: "/ss_events" },
  { label: "School Calendar ", link: "/ss_calendar" },
  { label: "Student Report", link: "/ss_student_report" },
  { label: "Timetable", link: "/ss_timetable" },
];

const SubsessionData = {
  name: "2025/2026 Session",
  startDate: "2025-09-01",
  endDate: "2026-07-31",
  status: "Active",
};

const Edit_SubSeasion_fields = [
  {
    name: "name",
    label: "Session Name",
    type: "text",
    placeholder: "e.g 2025/2026",
    required: true,
  },
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    required: true,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    required: true,
  },
];

const SeasionRoute = [
  { label: "Overview", link: "" },
  { label: "Admissions", link: "/admissions" },
  { label: "Students & Promotions", link: "/sp" },
  { label: "Graduation", link: "/graduation" },
];

const sessionData = {
  name: "2025/2026 Session",
  startDate: "2025-09-01",
  endDate: "2026-07-31",
  status: "Active",
};

// const Dash = ({ l, setsetsubId }) => {
//   const { subseasionId } = useParams();

//   useEffect(() => {
//     setsetsubId(subseasionId);
//   }, [subseasionId]);

//   return <div>{l}</div>;
// };

const SeasionDetailRoute = () => {
  const { schoolId, seasionId } = useParams();
  console.log(SeasionData[seasionId], seasionId);

  return (
    <AdminSeasionDetailTopTab
      fields={Edit_Seasion_fields}
      route={SeasionRoute}
      data={sessionData}
    >
      <Routes>
        <Route path="/" element={<SubAdminGuard permission="academic_sessions"><SeasionOverview /></SubAdminGuard>} />
        <Route path="/admissions" element={<SubAdminGuard permission="academic_sessions"><SessionAdmissionsTab /></SubAdminGuard>} />
        <Route path="/sp" element={<SubAdminGuard permission="academic_sessions"><StudentPromotion /></SubAdminGuard>} />
        <Route path="/graduation" element={<SubAdminGuard permission="academic_sessions"><SessionGraduation /></SubAdminGuard>} />
      </Routes>
    </AdminSeasionDetailTopTab>
  );
};
const SubseasionDetailRoute = () => {
  const { subseasionId } = useParams();
  const [setsubId, setsetsubId] = useState("");

  useEffect(() => {
    // Extract subseasionId from URL path
    const pathParts = window.location.pathname.split('/');
    const subseasionIdFromUrl = pathParts[pathParts.length - 1];
    if (subseasionIdFromUrl && subseasionIdFromUrl !== setsubId) {
      setsetsubId(subseasionIdFromUrl);
    }
  }, [window.location.pathname]);

  return (
    <AdminSeasionDetailTopTab
      fields={Edit_SubSeasion_fields}
      route={SubSeasionRoute}
      data={SubsessionData}
      type={"SudSeasion"}
      subseasionId={setsubId}
    >
      <Routes>
        <Route
          path="/ss_events/:subseasionId/*"
          element={<SubAdminGuard permission="school_event"><AdminSubseasionEvents setsetsubId={setsetsubId} /></SubAdminGuard>}
        />
        <Route
          path="/ss_calendar/:subseasionId/*"
          element={<SubAdminGuard permission="school_calendar"><AdminSubseasionCalendar setsetsubId={setsetsubId} /></SubAdminGuard>}
        />
        <Route
          path="/ss_student_report/:subseasionId/*"
          element={<SubAdminGuard permission="student_report"><AdminSubseasionStudentReport setsetsubId={setsetsubId} /></SubAdminGuard>}
        />
        <Route
          path="/ss_timetable/:subseasionId/*"
          element={<AdminSubseasionTimetable setsetsubId={setsetsubId} />}
        />
      </Routes>
    </AdminSeasionDetailTopTab>
  );
};

const AdminPages = () => {
  const location = useLocation();
  const isListPage = location.pathname.endsWith("/acedemic_seasion") || location.pathname.endsWith("/acedemic_seasion/");
  const isCreateSessionPage = location.pathname.includes("/create-session");

  return (
    <AdminPageTabs showSidebar={!isListPage && !isCreateSessionPage}>
      <Routes>
        <Route path="/" element={<AcademicSessionList />} />
        <Route path="/create-session" element={<CreateSessionWizard />} />
        <Route path="/sd/:seasionId/*" element={<SeasionDetailRoute />} />
        <Route path="/ssd/:seasionId/*" element={<SubseasionDetailRoute />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </AdminPageTabs>
  );
};

export default AdminPages;
