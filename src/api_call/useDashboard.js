import { useState, useEffect, useCallback } from "react";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const useDashboard = (schoolId) => {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [activeSession, setActiveSession] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [feePayments, setFeePayments] = useState(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeRange, setFeeRange] = useState("today");

  const [genderData, setGenderData] = useState([]);
  const [genderLoading, setGenderLoading] = useState(true);

  const [enrollmentTrend, setEnrollmentTrend] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);

  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [monthlyFinancials, setMonthlyFinancials] = useState([]);
  const [financialsLoading, setFinancialsLoading] = useState(true);

  const fetchFeePayments = useCallback((range) => {
    if (!schoolId) return;
    setFeeLoading(true);
    fetch(`${API_BASE}/api/schools/${schoolId}/fee-payments?range=${range}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setFeePayments(res.data); })
      .catch(() => {})
      .finally(() => setFeeLoading(false));
  }, [schoolId]);

  const changeFeeRange = (range) => {
    setFeeRange(range);
    fetchFeePayments(range);
  };

  useEffect(() => {
    if (!schoolId) return;

    const get = (url, setter, loadSetter) => {
      loadSetter(true);
      fetch(`${API_BASE}${url}`)
        .then((r) => r.json())
        .then((res) => { if (res.success) setter(res.data); })
        .catch(() => {})
        .finally(() => loadSetter(false));
    };

    get(`/api/schools/${schoolId}/stats`, setStats, setStatsLoading);
    get(`/session/school/${schoolId}/active`, setActiveSession, setSessionLoading);
    get(`/api/schools/${schoolId}/attendance/today`, setTodayAttendance, setAttendanceLoading);
    get(`/api/schools/${schoolId}/gender-distribution`, setGenderData, setGenderLoading);
    get(`/api/schools/${schoolId}/enrollment-trend`, setEnrollmentTrend, setEnrollmentLoading);
    get(`/api/schools/${schoolId}/recent-activities?page=1&pageSize=4`, setRecentActivities, setActivitiesLoading);
    get(`/api/schools/${schoolId}/monthly-financials`, setMonthlyFinancials, setFinancialsLoading);

    // Events — needs filtering
    setEventsLoading(true);
    fetch(`${API_BASE}/api/school-events/school/${schoolId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const today = new Date(); today.setHours(0, 0, 0, 0);
          setUpcomingEvents(
            (res.data || [])
              .filter((e) => new Date(e.event_date) >= today)
              .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
              .slice(0, 3)
          );
        }
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));

    fetchFeePayments("today");

  }, [schoolId, fetchFeePayments]);

  return {
    stats, statsLoading,
    activeSession, sessionLoading,
    todayAttendance, attendanceLoading,
    upcomingEvents, eventsLoading,
    feePayments, feeLoading, feeRange, changeFeeRange,
    genderData, genderLoading,
    enrollmentTrend, enrollmentLoading,
    recentActivities, activitiesLoading,
    monthlyFinancials, financialsLoading,
  };
};

export default useDashboard;
