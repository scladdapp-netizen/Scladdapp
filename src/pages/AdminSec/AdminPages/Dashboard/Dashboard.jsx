import React, { useState, useEffect, useRef } from "react";
import {
  FaSchool,
  FaUsers,
  FaUser,
  FaUserShield,
  FaChartBar,
  FaDollarSign,
  FaCog,
  FaBell,
  FaEdit,
  FaGraduationCap,
  FaCalendarAlt,
  FaUserCheck,
  FaUserTimes,
  FaClock,
  FaPlus,
  FaFileAlt,
  FaBullhorn,
  FaTable,
  FaMoneyBillWave,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaLock,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import dashboardData from "../../../../data/DashboardData.json";
import useDashboard from "../../../../api_call/useDashboard";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import LoadingData from "../../../../components/LoadingData/LoadingData";
import "./Dashboard.css";

const Dashboard = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const school = user?.school; // already in auth context — no fetch needed
  const { stats: liveStats, statsLoading, activeSession, sessionLoading, todayAttendance, attendanceLoading, applicationsTrend, applicationsLoading, feePayments, feeLoading, feeRange, changeFeeRange, genderData: liveGender, genderLoading, enrollmentTrend: liveEnrollment, enrollmentLoading, recentActivities: liveActivities, activitiesLoading, monthlyFinancials, financialsLoading } = useDashboard(schoolId || school?.school_id);

  const [activitiesOpen] = useState(false);

  // Get data from JSON file
  const {
    schoolInfo,
    statistics: stats,
    enrollmentTrend: enrollmentData,
    financialData,
    recentActivities,
    setupTasks,
  } = dashboardData;

  // Additional data for new widgets
  const currentSession = {
    name: "2025/2026",
    currentTerm: "Second Term",
    termProgress: 65,
    status: "Active",
    startDate: "Jan 8, 2025",
    endDate: "Apr 15, 2025",
  };

  const attendanceData = {
    studentsPresent: 1180,
    studentsTotal: 1247,
    studentsAbsent: 67,
    studentsLate: 12,
    staffPresent: 85,
    staffTotal: 89,
    attendanceRate: 94.6,
  };

  const quickActions = [
    { icon: FaPlus, label: "Add Student", color: "#10b981" },
    { icon: FaFileAlt, label: "Generate Report", color: "#3b82f6" },
    { icon: FaBullhorn, label: "Send Announcement", color: "#f59e0b" },
    { icon: FaTable, label: "View Timetable", color: "#8b5cf6" },
    { icon: FaMoneyBillWave, label: "Fee Management", color: "#ef4444" },
    { icon: FaUsers, label: "Manage Staff", color: "#06b6d4" },
  ];

  const feeCollectionData = {
    totalDue: 2450000,
    collected: 1890000,
    outstanding: 560000,
    overdueAccounts: 23,
    collectionRate: 77,
    monthlyTarget: 2200000,
  };

  // Attendance chart data
  const weeklyAttendanceData = [
    { day: "Mon", attendance: 96 },
    { day: "Tue", attendance: 94 },
    { day: "Wed", attendance: 95 },
    { day: "Thu", attendance: 93 },
    { day: "Fri", attendance: 97 },
    { day: "Sat", attendance: 89 },
    { day: "Sun", attendance: 0 },
  ];

  // Fee collection trend data
  const feeCollectionTrend = [
    { month: "Oct", collected: 85, target: 100 },
    { month: "Nov", collected: 92, target: 100 },
    { month: "Dec", collected: 88, target: 100 },
    { month: "Jan", collected: 77, target: 100 },
  ];

  // Gender distribution data
  const genderData = [
    { name: "Male", value: stats.maleStudents, color: "#3b82f6" },
    { name: "Female", value: stats.femaleStudents, color: "#ec4899" },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "session":
        return <FaSchool style={{ color: "#10b981" }} />;
      case "fee":
        return <FaDollarSign style={{ color: "#f59e0b" }} />;
      case "student":
        return <FaUsers style={{ color: "#3b82f6" }} />;
      case "report":
        return <FaChartBar style={{ color: "#8b5cf6" }} />;
      case "timetable":
        return <FaCog style={{ color: "#ef4444" }} />;
      default:
        return <FaBell style={{ color: "#6b7280" }} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-subtitle">
          Your school at a glance — students, staff, sessions and more.
        </p>
      </div>

      <div className="dashboard-grid">
        {/* School Info Card */}
        <div className="school-info-card card">
          <div className="school-info-content">
            {/* decorative bg boxes */}
            <span className="sic-box sic-box-1" />
            <span className="sic-box sic-box-2" />
            <span className="sic-box sic-box-3" />
            <span className="sic-box sic-box-4" />
            {/* Left: school text info */}
            <div className="school-info-left">
              <p className="school-info-label">School Profile</p>
              <h2 className="school-name">{school?.school_name || "Your School Name"}</h2>
              <p className="school-tagline">{school?.motto || "Excellence in Education"}</p>
              <div className="school-contact">
                {school?.address && <span>{school.address}</span>}
                {school?.address && school?.phone_number && <span className="dot">•</span>}
                {school?.phone_number && <span>{school.phone_number}</span>}
                {school?.phone_number && school?.email && <span className="dot">•</span>}
                {school?.email && <span>{school.email}</span>}
              </div>
              <button className="edit-school-btn"><FaEdit /> Edit Info</button>
            </div>

            {/* Right: floating logo cards */}
            <div className="school-logo-stack">
              <div className="logo-card logo-card-back" />
              <div className="logo-card logo-card-front">
                {school?.logo_url
                  ? <img src={school.logo_url} alt="School Logo" className="logo-img" />
                  : <FaGraduationCap className="logo-placeholder-icon" />
                }
                <span className="logo-card-label">{school?.school_name?.split(" ")[0] || "School"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tutorial Videos Card */}
        <TutorialVideos />

        {/* Statistics Cards — full-width row of 5 */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-card-body">
              <span className="stat-card-icon"><FaUsers /></span>
              <p className="stat-label">Total Students</p>
              <h2 className="stat-number">{statsLoading ? "—" : (liveStats?.students ?? "—").toLocaleString()}</h2>
              <div className="stat-card-line" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-body">
              <span className="stat-card-icon"><FaUserCheck /></span>
              <p className="stat-label">Total Admitted</p>
              <h2 className="stat-number">{statsLoading ? "—" : (liveStats?.admitted ?? "—")}</h2>
              <div className="stat-card-line" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-body">
              <span className="stat-card-icon"><FaUser /></span>
              <p className="stat-label">Total Staff</p>
              <h2 className="stat-number">{statsLoading ? "—" : (liveStats?.staff ?? "—")}</h2>
              <div className="stat-card-line" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-body">
              <span className="stat-card-icon"><FaGraduationCap /></span>
              <p className="stat-label">Graduates</p>
              <h2 className="stat-number">{statsLoading ? "—" : (liveStats?.graduates ?? "—")}</h2>
              <div className="stat-card-line" />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-body">
              <span className="stat-card-icon"><FaUserShield /></span>
              <p className="stat-label">Admins</p>
              <h2 className="stat-number">{statsLoading ? "—" : (liveStats?.admins ?? "—")}</h2>
              <div className="stat-card-line" />
            </div>
          </div>
        </div>

        {/* Academic Session Status Card */}
        <div className="session-status-card card">
          <div className="card-content">
            {sessionLoading ? (
              <LoadingData message="Loading session..." />
            ) : !activeSession?.session ? (
              <div className="session-empty">
                <FaCalendarAlt size={36} color="#d1d5db" />
                <p className="session-empty-title">No Active Session</p>
                <p className="session-empty-sub">No academic session is currently running.</p>
              </div>
            ) : (() => {
              const start = new Date(activeSession.session.academic_year_start_date);
              const end = new Date(activeSession.session.academic_year_end_date);
              const now = new Date();
              const pct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
              return (
                <div className="session-inner">
                  <div className="session-header">
                    <div className="session-header-left">
                      <span className="session-eyebrow"><FaCalendarAlt /> Academic Session</span>
                      <h3 className="session-name">{activeSession.session.session_name}</h3>
                      <span className="session-term">
                        {activeSession.subsession ? activeSession.subsession.term_name : "No active term"}
                      </span>
                    </div>
                    <div className="session-status active">
                      <FaPlay className="status-icon" />
                      {activeSession.session.session_status || "Active"}
                    </div>
                  </div>

                  <div className="session-divider" />

                  <div className="term-progress">
                    <div className="progress-info">
                      <span>Session Progress</span>
                      <span className="progress-pct">{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="session-dates">
                      <span>{start.toLocaleDateString()}</span>
                      <span>{end.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Attendance Overview Widget */}
        <div className="attendance-card card">
          <div className="card-content">
            {attendanceLoading ? (
              <LoadingData message="Loading attendance..." />
            ) : !todayAttendance || todayAttendance.total === 0 ? (
              <div className="attendance-empty">
                <FaUserCheck size={32} color="#d1d5db" />
                <p className="attendance-empty-title">No Attendance Today</p>
                <p className="attendance-empty-sub">No records marked for {new Date().toLocaleDateString()}.</p>
              </div>
            ) : (() => {
              const totalStudents = liveStats?.students || todayAttendance.total;
              const presentPct  = totalStudents > 0 ? Math.min(100, Math.round((todayAttendance.present  / totalStudents) * 100)) : 0;
              const absentPct   = totalStudents > 0 ? Math.min(100, Math.round((todayAttendance.absent   / totalStudents) * 100)) : 0;
              const excusedPct  = totalStudents > 0 ? Math.min(100, Math.round((todayAttendance.excused  / totalStudents) * 100)) : 0;
              const bars = [
                { pct: presentPct,  label: "Present", val: todayAttendance.present  },
                { pct: absentPct,   label: "Absent",  val: todayAttendance.absent   },
                { pct: excusedPct,  label: "Excused", val: todayAttendance.excused  },
              ];
              return (
                <div className="attendance-inner">
                  {/* Header */}
                  <div className="attendance-header">
                    <div className="attendance-header-left">
                      <span className="attendance-eyebrow"><FaUserCheck /> Today's Attendance</span>
                      <p className="attendance-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="attendance-body">
                    {/* Bar visualiser */}
                    <div className="attendance-bars-wrap">
                      <div className="attendance-bars">
                        {bars.map((b, i) => (
                          <div key={i} className="att-bar-col">
                            <span className="att-bar-val">{b.val}</span>
                            <div className="att-bar-track">
                              <div
                                className={`att-bar-fill att-bar-fill-${i}`}
                                style={{ height: `${Math.max(4, b.pct)}%` }}
                              />
                            </div>
                            <span className="att-bar-pct">{b.pct}%</span>
                            <span className="att-bar-label">{b.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="att-total-line">
                        <span>of {totalStudents} enrolled</span>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="attendance-breakdown">
                      <div className="breakdown-item present">
                        <span className="breakdown-val">{todayAttendance.present}</span>
                        <span className="breakdown-label">Present</span>
                        <FaUserCheck className="breakdown-icon" />
                      </div>
                      <div className="breakdown-item absent">
                        <span className="breakdown-val">{todayAttendance.absent}</span>
                        <span className="breakdown-label">Absent</span>
                        <FaUserTimes className="breakdown-icon" />
                      </div>
                      <div className="breakdown-item late">
                        <span className="breakdown-val">{todayAttendance.excused}</span>
                        <span className="breakdown-label">Excused</span>
                        <FaClock className="breakdown-icon" />
                      </div>
                      <div className="breakdown-item total">
                        <span className="breakdown-val">{totalStudents}</span>
                        <span className="breakdown-label">Enrolled</span>
                        <FaUsers className="breakdown-icon" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Applications Widget */}
        <div
          className="applications-card card"
          onClick={() => navigate(`/admin/${schoolId}/applications`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && navigate(`/admin/${schoolId}/applications`)}
        >
          <div className="applications-card-header">
            <span className="applications-eyebrow"><FaFileAlt /> Applications</span>
            <span className="applications-link">View all →</span>
          </div>
          <div className="applications-body">
            {applicationsLoading ? (
              <LoadingData message="Loading applications..." />
            ) : (
              <>
                <div className="applications-hero">
                  <div className="applications-hero-stat">
                    <span className="applications-hero-val">
                      {(applicationsTrend?.currentMonth ?? 0).toLocaleString()}
                    </span>
                    <span className="applications-hero-lbl">This month</span>
                  </div>
                  <div className="applications-hero-divider" />
                  <div className="applications-hero-stat">
                    <span className="applications-hero-val applications-hero-val--muted">
                      {(applicationsTrend?.total ?? 0).toLocaleString()}
                    </span>
                    <span className="applications-hero-lbl">Last 12 months</span>
                  </div>
                </div>

                {(applicationsTrend?.months?.length ?? 0) > 0 ? (
                  <div className="applications-chart-wrap">
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart
                        data={applicationsTrend.months}
                        margin={{ top: 8, right: 4, left: -22, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="4 4" stroke="#e8e8e8" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 9, fill: "#aaaaaa" }}
                          axisLine={false}
                          tickLine={false}
                          interval={1}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 9, fill: "#aaaaaa" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(v) => [v, "Applications"]}
                          contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
                        />
                        <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="applications-empty">
                    <FaFileAlt size={28} color="#d1d5db" />
                    <p>No applications yet</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fee Payments */}
        <div className="fee-collection-card card">
          {/* Header */}
          <div className="fee-card-header">
            <span className="fee-eyebrow"><FaMoneyBillWave /> Fee Payments</span>
            <div className="fee-range-tabs">
              {["today", "week", "month"].map((r) => (
                <button
                  key={r}
                  className={`fee-range-btn${feeRange === r ? " active" : ""}`}
                  onClick={() => changeFeeRange(r)}
                >
                  {r === "today" ? "Today" : r === "week" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          </div>

          {feeLoading ? (
            <div className="fee-body"><LoadingData message="Loading payments..." /></div>
          ) : (
            <div className="fee-body">
              {/* Hero total */}
              <div className="fee-hero">
                <div className="fee-hero-left">
                  <p className="fee-hero-label">Total Collected</p>
                  <h2 className="fee-hero-amount">
                    ₦{feePayments?.total >= 1_000_000
                      ? `${(feePayments.total / 1_000_000).toFixed(1)}M`
                      : feePayments?.total >= 1_000
                      ? `${(feePayments.total / 1_000).toFixed(1)}K`
                      : (feePayments?.total || 0).toLocaleString()}
                  </h2>
                  <p className="fee-hero-sub">
                    {feePayments?.count || 0} transaction{feePayments?.count !== 1 ? "s" : ""} &nbsp;·&nbsp;
                    {feeRange === "today" ? "today" : feeRange === "week" ? "last 7 days" : "last 30 days"}
                  </p>
                </div>
                <div className="fee-hero-avg">
                  <span className="fee-avg-val">
                    {feePayments?.count > 0
                      ? `₦${Math.round(feePayments.total / feePayments.count).toLocaleString()}`
                      : "—"}
                  </span>
                  <span className="fee-avg-label">avg / txn</span>
                </div>
              </div>

              {/* Area chart */}
              {feePayments?.chartData?.length > 0 && (
                <div className="fee-chart-wrap">
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={feePayments.chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="feeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#111111" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="amount" stroke="#111111" fill="url(#feeGrad)" strokeWidth={2} dot={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#aaaaaa" }}
                        interval={feeRange === "month" ? 4 : 0} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v) => [`₦${Number(v).toLocaleString()}`, "Amount"]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Stats row */}
              <div className="fee-stats-row">
                <div className="fee-stat-tile">
                  <span className="fee-stat-val">{feePayments?.count || 0}</span>
                  <span className="fee-stat-lbl">Transactions</span>
                </div>
                <div className="fee-stat-divider" />
                <div className="fee-stat-tile">
                  <span className="fee-stat-val">{feePayments?.from || "—"}</span>
                  <span className="fee-stat-lbl">From</span>
                </div>
                <div className="fee-stat-divider" />
                <div className="fee-stat-tile">
                  <span className="fee-stat-val">
                    {feePayments?.count > 0
                      ? `₦${Math.round(feePayments.total / feePayments.count).toLocaleString()}`
                      : "—"}
                  </span>
                  <span className="fee-stat-lbl">Avg / txn</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="chart-card gender-chart card">
          <div className="gender-card-header">
            <span className="gender-eyebrow"><FaUsers /> Gender Distribution</span>
          </div>
          <div className="gender-card-body">
            {genderLoading ? (
              <LoadingData message="Loading..." />
            ) : liveGender.length === 0 ? (
              <div className="gender-empty">No student data</div>
            ) : (() => {
              const total = liveGender.reduce((s, g) => s + g.count, 0);
              const bwColors = ["#111111", "#888888", "#bbbbbb", "#dddddd", "#f0f0f0"];
              return (
                <>
                  {/* Donut */}
                  <div className="gender-donut-wrap">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={liveGender}
                          cx="50%" cy="50%"
                          innerRadius={52} outerRadius={80}
                          paddingAngle={3}
                          dataKey="count" nameKey="gender"
                          strokeWidth={0}
                        >
                          {liveGender.map((_, i) => (
                            <Cell key={i} fill={bwColors[i % bwColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label */}
                    <div className="gender-donut-center">
                      <span className="gender-donut-total">{total}</span>
                      <span className="gender-donut-sub">students</span>
                    </div>
                  </div>

                  {/* Bars per gender */}
                  <div className="gender-bars">
                    {liveGender.map((g, i) => {
                      const pct = total > 0 ? Math.round((g.count / total) * 100) : 0;
                      return (
                        <div key={i} className="gender-bar-row">
                          <div className="gender-bar-meta">
                            <span className="gender-bar-name">{g.gender}</span>
                            <span className="gender-bar-count">{g.count} <span className="gender-bar-pct">({pct}%)</span></span>
                          </div>
                          <div className="gender-bar-track">
                            <div
                              className="gender-bar-fill"
                              style={{ width: `${pct}%`, background: bwColors[i % bwColors.length] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Student Enrollment Trend */}
        <div className="enrollment-chart card">
          <div className="enroll-card-header">
            <div className="enroll-header-left">
              <span className="enroll-eyebrow"><FaGraduationCap /> Student Enrollment Trend</span>
              <p className="enroll-header-sub">Monthly admissions over time</p>
            </div>
            {!enrollmentLoading && liveEnrollment.length > 0 && (() => {
              const total = liveEnrollment.reduce((s, d) => s + (d.count || 0), 0);
              const last = liveEnrollment[liveEnrollment.length - 1]?.count || 0;
              const prev = liveEnrollment[liveEnrollment.length - 2]?.count || 0;
              const trend = prev > 0 ? Math.round(((last - prev) / prev) * 100) : null;
              return (
                <div className="enroll-header-stat">
                  <span className="enroll-total">{total.toLocaleString()}</span>
                  <span className="enroll-total-lbl">total admissions</span>
                  {trend !== null && (
                    <span className={`enroll-trend ${trend >= 0 ? "up" : "down"}`}>
                      {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="enroll-card-body">
            {enrollmentLoading ? (
              <LoadingData message="Loading..." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={liveEnrollment} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#111111" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#111111" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e8e8e8" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#aaaaaa" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#aaaaaa" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => [v, "Admissions"]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff" }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#111111" fill="url(#enrollGrad)" strokeWidth={2.5} dot={{ r: 3, fill: "#111111", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="financial-card card">
          <div className="financial-card-header">
            <div className="financial-header-left">
              <span className="financial-eyebrow"><FaDollarSign /> Monthly Income & Expenses</span>
              <p className="financial-header-sub">Income vs expenses over time</p>
            </div>
            <div className="financial-legend">
              <div className="fin-legend-item"><span className="fin-legend-dot" style={{ background: "#111111" }} />Income</div>
              <div className="fin-legend-item"><span className="fin-legend-dot" style={{ background: "#aaaaaa" }} />Expenses</div>
            </div>
          </div>
          <div className="financial-card-body">
            {financialsLoading ? (
              <LoadingData message="Loading financials..." />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyFinancials} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e8e8e8" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#aaaaaa" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => v >= 1_000_000 ? `₦${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `₦${(v/1000).toFixed(0)}K` : `₦${v}`} tick={{ fontSize: 9, fill: "#aaaaaa" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`₦${Number(v).toLocaleString()}`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <Line type="monotone" dataKey="income"   stroke="#111111" strokeWidth={2.5} dot={{ r: 3, fill: "#111111", strokeWidth: 0 }} activeDot={{ r: 5 }} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#aaaaaa" strokeWidth={2.5} dot={{ r: 3, fill: "#aaaaaa", strokeWidth: 0 }} activeDot={{ r: 5 }} name="Expenses" strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="activities-card card">
          <div className="activities-card-header">
            <span className="activities-eyebrow"><FaBell /> Recent Admin Activities</span>
          </div>
          <div className="activities-card-body">
            {activitiesLoading ? (
              <LoadingData message="Loading activities..." />
            ) : liveActivities.length === 0 ? (
              <div className="activities-empty">No recent activities</div>
            ) : (
              <div className="activities-list">
                {liveActivities.map((activity, index) => (
                  <ActivityItem key={activity.log_id} activity={activity} showDivider={index < liveActivities.length - 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Activity item ─────────────────────────────────────────────────────────
const ActivityItem = ({ activity, showDivider }) => (
  <>
    <div className="activity-row">
      <div className="activity-avatar-initials">
        {(activity.user_name || "?").slice(0, 2).toUpperCase()}
      </div>
      <div className="activity-content">
        <p className="activity-name">{activity.user_name}</p>
        <p className="activity-desc">{activity.description}</p>
        <span className="activity-time">{new Date(activity.performed_at).toLocaleString()}</span>
      </div>
      <span className="activity-badge">{activity.category || activity.action}</span>
    </div>
    {showDivider && <div className="activity-divider-line" />}
  </>
);

const VIDEOS = [
  {
    id: "dQw4w9WgXcQ",
    title: "Getting Started with Scladapp",
    description: "Learn how to set up your school and configure basic settings.",
    duration: "5:32",
    category: "Getting Started",
  },
  {
    id: "ScMzIvxBSi4",
    title: "Managing Students & Admissions",
    description: "A complete walkthrough of student enrollment and admission management.",
    duration: "8:14",
    category: "Students",
  },
  {
    id: "9bZkp7q19f0",
    title: "Setting Up Classes & Timetables",
    description: "How to create classes, assign teachers, and build timetables.",
    duration: "6:47",
    category: "Classes",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Fee Billing & Payments",
    description: "Configure fee templates, generate bills, and track payments.",
    duration: "7:20",
    category: "Finance",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Staff & Teacher Management",
    description: "Add staff, assign roles, and manage teacher subjects.",
    duration: "4:55",
    category: "Staff",
  },
];

const TutorialVideos = () => {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [animDir, setAnimDir] = useState("next");
  const timerRef = useRef(null);

  const goTo = (idx, dir = "next") => {
    setAnimDir(dir);
    setActive(idx);
    setPlaying(false);
  };

  const next = () => goTo((active + 1) % VIDEOS.length, "next");
  const prev = () => goTo((active - 1 + VIDEOS.length) % VIDEOS.length, "prev");

  // Auto-advance every 6s when not playing
  useEffect(() => {
    if (playing) return;
    timerRef.current = setTimeout(next, 6000);
    return () => clearTimeout(timerRef.current);
  }, [active, playing]);

  const video = VIDEOS[active];
  const thumb = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;

  return (
    <div className="tutorial-card card">
        {/* Main video preview — flush to edges, controls overlaid */}
        <div className="tutorial-main">
          {playing ? (
            <iframe
              key={video.id}
              className="tutorial-iframe"
              src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
              title={video.title}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <div className={`tutorial-thumb-wrap anim-${animDir}`} key={active}>
              <img src={thumb} alt={video.title} className="tutorial-thumb" />
              <div className="tutorial-thumb-overlay">
                <button className="tutorial-play-btn" onClick={() => setPlaying(true)}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <span className="tutorial-duration">{video.duration}</span>
              <span className="tutorial-category-badge">{video.category}</span>
            </div>
          )}

          {/* Controls overlaid on video */}
          <div className="tutorial-controls">
            <button className="tutorial-nav-btn" onClick={prev}>‹</button>
            <div className="tutorial-dots">
              {VIDEOS.map((_, i) => (
                <button
                  key={i}
                  className={`tutorial-dot ${i === active ? "active" : ""}`}
                  onClick={() => goTo(i, i > active ? "next" : "prev")}
                />
              ))}
            </div>
            <button className="tutorial-nav-btn" onClick={next}>›</button>
          </div>
        </div>

        {/* Info */}
        <div className="tutorial-body">
          <div className="tutorial-info">
            <h4 className="tutorial-video-title">{video.title}</h4>
            <p className="tutorial-video-desc">{video.description}</p>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
