import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useSubsession } from "../../../../../../api_call/useSubsession";
import useStudentClassAssignment from "../../../../../../api_call/useStudentClassAssignment";
import { useClassTimetable } from "../../../../../../api_call/useClassTimetable";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import Timetable from "../../../../../../components/timetable/Timetable";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import "../../../../../AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../../../../../TeacherSec/pages/ClassDashboard/pages/SessionAttendance/SessionAttendance.css";

const ClassTimetable = () => {
  const { subseasion } = useParams();
  const { user } = useAuth();
  const { getSubsessionById } = useSubsession();
  const { loadTimetable } = useClassTimetable();

  const studentId = user?.student?.student_id;

  const [sessionId, setSessionId]           = useState(null);
  const [subsessionInfo, setSubsessionInfo] = useState(null);
  const [subLoading, setSubLoading]         = useState(true);
  const [entries, setEntries]               = useState([]);
  const [ttLoading, setTtLoading]           = useState(false);

  useEffect(() => {
    if (!subseasion) return;
    setSubLoading(true);
    getSubsessionById(subseasion).then((res) => {
      if (res.success) { setSessionId(res.data?.session_id); setSubsessionInfo(res.data); }
      setSubLoading(false);
    });
  }, [subseasion]);

  const { assignment, loading: assignLoading } = useStudentClassAssignment(studentId, sessionId);

  useEffect(() => {
    if (!assignment?.class_id || !subseasion) return;
    setTtLoading(true);
    loadTimetable(assignment.class_id, subseasion).then((data) => {
      setEntries(data?.entries || []);
      setTtLoading(false);
    });
  }, [assignment?.class_id, subseasion]);

  const loading = subLoading || assignLoading || ttLoading;

  if (loading) return <LoadingData message="Loading timetable..." />;

  return (
    <InnerTabCon>
      <div className="classStudents">
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Timetable</h2>
            <p className="cls-subtitle">
              {assignment?.class_name}{subsessionInfo?.term_name ? ` · ${subsessionInfo.term_name}` : ""}
            </p>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="cls-empty">
            <p>No timetable set for this subsession yet.</p>
          </div>
        ) : (
          <Timetable timetableData={entries} />
        )}
      </div>
    </InnerTabCon>
  );
};

export default ClassTimetable;
