import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../../components/LoadingData/LoadingData";
import Timetable from "../../../../../../components/timetable/Timetable";
import { useClassTimetable, listFromTimetablePayload } from "../../../../../../api_call/useClassTimetable";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassTimetable/ClassTimetable.css";
import "../../../../../../pages/AdminSec/AdminPages/classProfile/ClassStudents/ClassStudents.css";
import "../SessionAttendance/SessionAttendance.css";

const SessionTimetable = () => {
  const { classId } = useParams();
  const location   = useLocation();
  const subseasion = location.state?.subseasion;
  const { loading, loadTimetable } = useClassTimetable();
  const [timetables, setTimetables] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const activeTimetable = timetables.find((item) => item.timetable_id === activeId) || timetables[0] || null;
  const entries = activeTimetable?.entries || [];

  useEffect(() => {
    if (!classId || !subseasion) return;
    loadTimetable(classId, subseasion).then((data) => {
      const list = listFromTimetablePayload(data);
      setTimetables(list);
      setActiveId(list[0]?.timetable_id || null);
    });
  }, [classId, subseasion]);

  return (
    <InnerTabCon>
      <div className="classStudents">
        <div className="cls-header">
          <div className="cls-header-left">
            <h2 className="cls-title">Timetable</h2>
            <p className="cls-subtitle">Weekly schedules for this class. A class can have more than one.</p>
          </div>
        </div>

        {loading ? (
          <LoadingData message="Loading timetable..." />
        ) : entries.length === 0 ? (
          <div className="cls-empty">
            <p>No timetable set for this term yet.</p>
          </div>
        ) : (
          <>
            {timetables.length > 1 && (
              <div className="ctTabs" role="tablist">
                {timetables.map((item) => (
                  <button
                    key={item.timetable_id}
                    type="button"
                    className={`ctTab${item.timetable_id === activeTimetable?.timetable_id ? " active" : ""}`}
                    onClick={() => setActiveId(item.timetable_id)}
                  >
                    {item.name || "Timetable"}
                  </button>
                ))}
              </div>
            )}
            <Timetable timetableData={entries} />
          </>
        )}
      </div>
    </InnerTabCon>
  );
};

export default SessionTimetable;
