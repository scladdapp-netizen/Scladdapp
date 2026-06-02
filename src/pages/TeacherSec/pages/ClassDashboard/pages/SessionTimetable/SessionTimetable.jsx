import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import Timetable from "../../../../../../components/timetable/Timetable";
import { useClassTimetable } from "../../../../../../api_call/useClassTimetable";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../SessionAttendance/SessionAttendance.css";

const SessionTimetable = () => {
  const { classId } = useParams();
  const location   = useLocation();
  const subseasion = location.state?.subseasion;
  const { loading, loadTimetable } = useClassTimetable();
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!classId || !subseasion) return;
    loadTimetable(classId, subseasion).then((data) => {
      setEntries(data?.entries || []);
    });
  }, [classId, subseasion]);

  return (
    <InnerTabCon>
      <div className="classStudents">
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Timetable</h2>
            <p className="cls-subtitle">Weekly schedule for this class in the selected subsession</p>
          </div>
        </div>

        {loading ? (
          <LoadingData message="Loading timetable..." />
        ) : entries.length === 0 ? (
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

export default SessionTimetable;
