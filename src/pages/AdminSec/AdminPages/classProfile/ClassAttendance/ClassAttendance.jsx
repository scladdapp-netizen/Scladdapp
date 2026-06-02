import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ClassAttendance.css";
import AttendanceTable from "../../../../../components/Atendance/AttendanceTable";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import Button from "../../../../../components/Button/Button";
import { useClassAttendance } from "../../../../../api_call/useClassAttendance";
import MarkAttendancePanel from "./MarkAttendancePanel";
import "./MarkAttendancePanel.css";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";

const ClassAttendance = () => {
  const { schoolId, classId, subseasion } = useParams();
  const navigate = useNavigate();
  const { loading, error, loadAttendance, saveAttendanceChange } = useClassAttendance();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const [attendanceData, setAttendanceData] = useState({ students: [] });
  const [subsessionInfo, setSubsessionInfo] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  // track previous data so we can diff on change
  const prevDataRef = useRef({ students: [] });

  const reload = () => {
    if (!classId || !subseasion) return;
    loadAttendance(classId, subseasion).then((result) => {
      if (result) {
        const data = { students: result.students };
        setAttendanceData(data);
        prevDataRef.current = data;
        setSubsessionInfo(result.subsession);
      }
    });
  };

  useEffect(() => {
    reload();
  }, [classId, subseasion]); // re-fetch when subsession changes

  const handleAttendanceChange = async (updatedData) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit attendance.", "error");
      return;
    }
    const prev = prevDataRef.current;

    // diff: find changed cells and save each one
    for (const newStudent of updatedData.students) {
      const oldStudent = prev.students.find((s) => s.id === newStudent.id);
      const oldAtt = oldStudent?.attendance || {};
      const newAtt = newStudent.attendance || {};

      // check all dates in new attendance
      for (const [date, status] of Object.entries(newAtt)) {
        if (oldAtt[date] !== status) {
          await saveAttendanceChange({
            studentId: newStudent.id,
            date,
            status,
            schoolId,
            classId,
            sessionId: subsessionInfo?.session_id,
            subsessionId: subseasion,
          });
        }
      }
    }

    setAttendanceData(updatedData);
    prevDataRef.current = updatedData;
  };

  const handleRowClick = (student) => {
    navigate(
      `/admin/${schoolId}/Profile/${student.id}/${subseasion}/attendance`
    );
  };

  const headerTitle = subsessionInfo
    ? `${subsessionInfo.term_name} — Attendance`
    : "Attendance";

  const headerSub = subsessionInfo
    ? `${subsessionInfo.term_start_date} – ${subsessionInfo.term_end_date}`
    : "";

  return (
    <InnerTabCon>
      <div className="classAttendance">
        <div className="caHeader">
          <div className="caHeaderContent">
            <div className="caHeaderLeft">
              <h1 className="caTitle">{headerTitle}</h1>
            </div>
            {headerSub && <p className="caSubtitle">{headerSub}</p>}
          </div>
          <div className="caHeaderActions">
            <Button onClick={() => {
              if (!canEdit) {
                addNotification("You do not have permission to mark attendance.", "error");
                return;
              }
              setPanelOpen(true);
            }}>Mark Attendance</Button>
          </div>
        </div>

        {loading && <LoadingData message="Loading attendance..." />}
        {error && <p className="ca-error">{error}</p>}

        {!loading && (
          <div className="caTableContainer">
            <AttendanceTable
              value={attendanceData}
              onChange={handleAttendanceChange}
              maxRowsPerPage={12}
              enableSelect={true}
              onRowClick={handleRowClick}
            />
          </div>
        )}
      </div>

      <MarkAttendancePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        subsessionInfo={subsessionInfo}
        students={attendanceData.students.map((s) => ({ id: s.id, name: s.name }))}
        schoolId={schoolId}
        classId={classId}
        subsessionId={subseasion}
        saveAttendanceChange={saveAttendanceChange}
        onSaved={reload}
      />
    </InnerTabCon>
  );
};

export default ClassAttendance;
