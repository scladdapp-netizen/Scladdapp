import { useState, useEffect } from "react";
import "./AtendanceStudentInfo.css";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import AttendanceCalendar from "./AttendanceCalendar";
import { useParams } from "react-router-dom";
import { useAttendance } from "../../../../../../api_call";
import { useSubsession } from "../../../../../../api_call/useSubsession";
import { useSession } from "../../../../../../api_call/useSession";
import LoadingData from "../../../../../../components/LoadingData";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";

const AtendanceStudentInfo = () => {
  const { schoolId, studentId, subseasion } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.students?.edit;

  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [attendanceSummary, setAttendanceSummary] = useState({
    present: 0,
    absent: 0,
    excused: 0,
    total: 0,
  });
  const [subsessionInfo, setSubsessionInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    loading,
    markAttendance,
    getAttendanceBySubsession,
    getAttendanceSummary,
    deleteAttendance,
  } = useAttendance();

  const { getSubsessionById } = useSubsession();
  const { getSessionById } = useSession();

  // Fetch subsession dates from backend using the subsession ID
  useEffect(() => {
    const fetchSubsessionInfo = async () => {
      try {
        console.log("hhhhhhhhhh Fetching subsession info for subseasion ID:", subseasion);
        
        // Fetch the specific subsession by ID using the hook
        const subsessionResult = await getSubsessionById(subseasion);
        console.log("hhhhhhhhhh Subsession result:", subsessionResult);

        if (subsessionResult.success && subsessionResult.data) {
          const subsession = subsessionResult.data;
          console.log("hhhhhhhhhh Found subsession:", subsession);
          console.log("hhhhhhhhhh Subsession dates - start:", subsession.term_start_date, "end:", subsession.term_end_date);
          
          setSubsessionInfo(subsession);
          
          // Fetch the session info using the session_id from subsession
          if (subsession.session_id) {
            const sessionResult = await getSessionById(subsession.session_id);
            console.log("hhhhhhhhhh Session result:", sessionResult);
            
            if (sessionResult.success && sessionResult.data) {
              console.log("hhhhhhhhhh Found session:", sessionResult.data);
              setSessionInfo(sessionResult.data);
            }
          }
        } else {
          console.error("hhhhhhhhhh Failed to fetch subsession:", subsessionResult);
        }
      } catch (err) {
        console.error("hhhhhhhhhh Error fetching subsession info:", err);
      }
    };

    if (subseasion) {
      fetchSubsessionInfo();
    }
  }, [subseasion, getSubsessionById, getSessionById]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!studentId || !subseasion) {
        console.log("hhhhhhhhhh Missing studentId or subseasion:", { studentId, subseasion });
        return;
      }

      console.log("hhhhhhhhhh Fetching attendance for:", { studentId, subseasion });

      const recordsResult = await getAttendanceBySubsession(studentId, subseasion);
      console.log("hhhhhhhhhh Records result:", recordsResult);

      const summaryResult = await getAttendanceSummary(studentId, subseasion);
      console.log("hhhhhhhhhh Summary result:", summaryResult);

      if (recordsResult.success) {
        // Convert array to object with date as key
        const recordsObj = {};
        recordsResult.data.forEach((record) => {
          recordsObj[record.attendance_date] = record.status;
        });
        console.log("hhhhhhhhhh Converted records object:", recordsObj);
        setAttendanceRecords(recordsObj);
      } else {
        console.error("hhhhhhhhhh Failed to fetch records:", recordsResult.error);
      }

      if (summaryResult.success) {
        console.log("hhhhhhhhhh Setting summary:", summaryResult.data);
        setAttendanceSummary(summaryResult.data);
      } else {
        console.error("hhhhhhhhhh Failed to fetch summary:", summaryResult.error);
      }
    };

    fetchAttendance();
  }, [studentId, subseasion, getAttendanceBySubsession, getAttendanceSummary]);

  // Handle attendance change
  const handleAttendanceChange = async (dateStr, newStatus) => {
    console.log("hhhhhhhhhh Updating attendance for date:", dateStr, "new status:", newStatus);
    
    setIsUpdating(true);
    const previousStatus = attendanceRecords[dateStr];
    const previousSummary = { ...attendanceSummary };

    // Optimistically update UI
    setAttendanceRecords((prev) => {
      const updated = { ...prev };
      if (newStatus === null) {
        delete updated[dateStr];
      } else {
        updated[dateStr] = newStatus;
      }
      return updated;
    });

    // Update summary optimistically
    setAttendanceSummary((prev) => {
      const updated = { ...prev };
      
      // Remove old status count
      if (previousStatus) {
        if (previousStatus === "present") updated.present--;
        else if (previousStatus === "absent") updated.absent--;
        else if (previousStatus === "excused") updated.excused--;
        updated.total--;
      }
      
      // Add new status count
      if (newStatus) {
        if (newStatus === "present") updated.present++;
        else if (newStatus === "absent") updated.absent++;
        else if (newStatus === "excused") updated.excused++;
        updated.total++;
      }
      
      return updated;
    });

    // Make API call
    try {
      if (newStatus === null) {
        // Delete attendance
        console.log("hhhhhhhhhh Deleting attendance for date:", dateStr);
        const result = await deleteAttendance(studentId, subseasion, dateStr);
        console.log("hhhhhhhhhh Delete result:", result);
        
        if (!result.success) {
          // Revert on error
          setAttendanceRecords((prev) => ({
            ...prev,
            [dateStr]: previousStatus,
          }));
          setAttendanceSummary(previousSummary);
          alert(`Failed to delete attendance: ${result.error}`);
        }
      } else {
        // Mark/update attendance
        console.log("hhhhhhhhhh Marking attendance with data:", {
          student_id: studentId,
          school_id: schoolId,
          session_id: sessionInfo?.session_id,
          subsession_id: subseasion,
          attendance_date: dateStr,
          status: newStatus,
        });
        
        const result = await markAttendance({
          student_id: studentId,
          school_id: schoolId,
          session_id: sessionInfo?.session_id,
          subsession_id: subseasion,
          attendance_date: dateStr,
          status: newStatus,
          marked_by: "admin", // You can get this from auth context
        });
        
        console.log("hhhhhhhhhh Mark attendance result:", result);

        if (!result.success) {
          // Revert on error
          setAttendanceRecords((prev) => {
            const updated = { ...prev };
            if (previousStatus) {
              updated[dateStr] = previousStatus;
            } else {
              delete updated[dateStr];
            }
            return updated;
          });
          setAttendanceSummary(previousSummary);
          alert(`Failed to mark attendance: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("hhhhhhhhhh Error updating attendance:", error);
      // Revert on error
      setAttendanceRecords((prev) => {
        const updated = { ...prev };
        if (previousStatus) {
          updated[dateStr] = previousStatus;
        } else {
          delete updated[dateStr];
        }
        return updated;
      });
      setAttendanceSummary(previousSummary);
      alert(`Error updating attendance: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state only if we don't have any data yet
  if (loading && !subsessionInfo && Object.keys(attendanceRecords).length === 0) {
    return (
      <InnerTabCon>
        <LoadingData
          message="Loading attendance information..."
          style={{ margin: "40px 0" }}
        />
      </InnerTabCon>
    );
  }

  // Generate fallback dates from attendance records if subsession info is not available
  const getCalendarDates = () => {
    if (subsessionInfo) {
      console.log("hhhhhhhhhh Using subsession dates:", {
        startDate: subsessionInfo.term_start_date,
        endDate: subsessionInfo.term_end_date
      });
      return {
        startDate: subsessionInfo.term_start_date,
        endDate: subsessionInfo.term_end_date,
      };
    }
    
    console.log("hhhhhhhhhh No subsession info, using fallback");
    
    // Use attendance records to determine date range
    const dates = Object.keys(attendanceRecords);
    if (dates.length > 0) {
      dates.sort();
      const firstDate = new Date(dates[0]);
      const lastDate = new Date(dates[dates.length - 1]);
      
      // Expand range to include full months
      const startDate = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
      const endDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
      
      console.log("hhhhhhhhhh Using attendance records dates:", {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });
      
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };
    }
    
    // Default fallback: current month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    console.log("hhhhhhhhhh Using current month fallback:", {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const calendarDates = getCalendarDates();
  console.log("hhhhhhhhhh Final calendar dates being passed to AttendanceCalendar:", calendarDates);

  // Total days = weekdays only from start → min(today, end)
  const computeTotalDays = () => {
    if (!subsessionInfo?.term_start_date || !subsessionInfo?.term_end_date) return attendanceSummary.total;
    const start = new Date(subsessionInfo.term_start_date);
    const end   = new Date(subsessionInfo.term_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const effectiveEnd = today < end ? today : end;
    if (effectiveEnd < start) return 0;
    let count = 0;
    const cur = new Date(start);
    while (cur <= effectiveEnd) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };
  const totalDays = computeTotalDays();

  // Use totalDays (weekday count) as the denominator for percentages
  const presentPercentage = totalDays > 0 ? (attendanceSummary.present / totalDays) * 100 : 0;
  const absentPercentage  = totalDays > 0 ? (attendanceSummary.absent  / totalDays) * 100 : 0;
  const excusedPercentage = totalDays > 0 ? (attendanceSummary.excused / totalDays) * 100 : 0;

  return (
    <InnerTabCon>
      <div className="attendanceStudentInfo">
        <div className="attendanceHeader">
          <div className="attendanceHeaderLeft">
            <h2 className="attendanceTitle">
              Attendance in {sessionInfo?.session_name || "Session"} -{" "}
              {subsessionInfo?.term_name || "Term"}
            </h2>
            <p className="attendanceSubtitle">
              {subsessionInfo 
                ? "Comprehensive attendance tracking and analysis for the current academic session"
                : "Loading subsession information..."}
            </p>
          </div>
          <div className="attendanceHeaderRight">
            <Button variant="secondary">Export</Button>
            <Button variant="secondary">Print</Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="attendanceContent">
          {/* Attendance Overview */}
          <div className="attendanceOverviewSection">
            <div className="overviewPanelHeader">
              <h3 className="overviewTitle">Attendance Overview</h3>
              <p className="overviewSubtitle">
                {sessionInfo?.session_name || "Session"} · {subsessionInfo?.term_name || "Term"}
              </p>
            </div>
            <div className="overviewPanelBody">

            <div className="attendanceStats">
              <div className="statCard present-card">
                <div className="statLabel">Present</div>
                <div className="statValue">{attendanceSummary.present}</div>
              </div>
              <div className="statCard absent-card">
                <div className="statLabel">Absent</div>
                <div className="statValue">{attendanceSummary.absent}</div>
              </div>
              <div className="statCard excused-card">
                <div className="statLabel">Excused</div>
                <div className="statValue">{attendanceSummary.excused}</div>
              </div>
              <div className="statCard total-card">
                <div className="statLabel">Total Days</div>
                <div className="statValue">{totalDays}</div>
              </div>
            </div>

            <div className="rateCard">
              <div className="rateLabel">Attendance Rate</div>
              <div className="rateValue">{presentPercentage.toFixed(1)}%</div>
              <div className="rateBar">
                <div className="rateBarFill" style={{ width: `${presentPercentage}%` }} />
              </div>
            </div>

            </div>
          </div>

          {/* Attendance Calendar */}
          <div className="calendarSection">
            <div className="calendarSectionHeader">
              <h3>Attendance Calendar</h3>
              <p>Click on weekdays to mark or edit attendance</p>
            </div>
            <div className="calendarSectionBody">
            <AttendanceCalendar
              startDate={calendarDates.startDate}
              endDate={calendarDates.endDate}
              attendanceData={attendanceRecords}
              onAttendanceChange={handleAttendanceChange}
              isUpdating={isUpdating}
              canEdit={canEdit}
              onPermissionDenied={() => addNotification("You do not have permission to edit attendance.", "error")}
            />
            </div>
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

export default AtendanceStudentInfo;
