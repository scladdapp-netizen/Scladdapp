import { useParams } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import StudentInfoCard from "./components/studentInfoCard/StudentInfoCard";
import StudentClass from "./components/StudentClass/StudentClass";
import StudentDocuments from "./components/StudentDocuments/StudentDocuments";
import AttendanceOverview from "./components/AttendanceOverview/AttendanceOverview";
import StudentSubSessionBill from "./components/StudentSubSessionBill/StudentSubSessionBill";
import StudentSemesterReport from "./components/StudentSemesterReport/StudentSemesterReport";
import BehaviorAssessment from "./components/BehaviorAssessment/BehaviorAssessment";
import { useFetchStudentDetail } from "../../../../api_call";
import "./StudentProfile.css";

const StudentProfile = () => {
  const { schoolId, studentId, subseasion } = useParams();

  // Fetch student data (this will use cached data if already fetched by wrapper)
  const { studentData } = useFetchStudentDetail(schoolId, studentId);

  console.log(
    "Student Profile - schoolId:",
    schoolId,
    "studentId:",
    studentId,
    "subseasion:",
    subseasion
  );
  console.log("Student Data:", studentData);

  return (
    <>
      <div className="spTopTiyle">
        <div className="sprighttopsec">
          <h2>Student Info</h2>
          <p>Session: 2025 / 2026 • Term 2 </p>
        </div>
        <div className="spleftsec">
          <Button variant="secondary">Export</Button>
          <Button variant="secondary">Print</Button>
        </div>
      </div>
      {/* /////////////////////////////////////////////////// */}
      <div className="spcontent">
        <div className="spcleftsec">
          <StudentInfoCard studentData={studentData} />
          <StudentClass />
          <StudentDocuments />
        </div>
        <div className="spcrightsec">
          <AttendanceOverview />
          <StudentSubSessionBill />
        </div>
      </div>
      <div className="StudentReport">
        <BehaviorAssessment />
        <StudentSemesterReport />
      </div>
    </>
  );
};

export default StudentProfile;
