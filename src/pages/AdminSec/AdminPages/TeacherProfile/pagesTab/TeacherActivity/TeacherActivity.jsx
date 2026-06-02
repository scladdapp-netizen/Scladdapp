import "./TeacherActivity.css";
import { Icons } from "../../../../../../utils/icons";
import { useState } from "react";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SmartTable from "../../../../../../components/SmartTable/SmartTable";

const TeacherActivity = () => {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);

  // Sample teacher activity data
  const activities = [
    {
      id: 1,
      type: "Login",
      title: "System Login",
      description: "Logged into the system",
      timestamp: "2024-12-10T08:30:00Z",
      date: "2024-12-10",
      time: "08:30 AM",
      ipAddress: "192.168.1.100",
      device: "Desktop - Chrome",
      location: "Staff Room",
      status: "Success",
      duration: "4h 30m",
      details: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        sessionId: "sess_abc123def456",
        loginMethod: "Username/Password",
      },
    },
    {
      id: 2,
      type: "Grade Submission",
      title: "Mathematics Test Scores",
      description: "Submitted test scores for Grade 10A Mathematics",
      timestamp: "2024-12-10T10:15:00Z",
      date: "2024-12-10",
      time: "10:15 AM",
      class: "Grade 10A",
      subject: "Mathematics",
      studentsAffected: 32,
      assessmentType: "Mid-term Test",
      status: "Completed",
      details: {
        totalStudents: 32,
        gradesSubmitted: 32,
        averageScore: 78.5,
        highestScore: 95,
        lowestScore: 45,
      },
    },
    {
      id: 3,
      type: "Attendance",
      title: "Class Attendance Marked",
      description: "Marked attendance for Grade 10A",
      timestamp: "2024-12-10T09:00:00Z",
      date: "2024-12-10",
      time: "09:00 AM",
      class: "Grade 10A",
      subject: "Mathematics",
      studentsAffected: 32,
      status: "Completed",
      details: {
        totalStudents: 32,
        present: 30,
        absent: 2,
        late: 0,
        attendanceRate: "93.75%",
      },
    },
    {
      id: 4,
      type: "Resource Upload",
      title: "Lesson Plan Upload",
      description: "Uploaded new lesson plan for Algebra chapter",
      timestamp: "2024-12-09T16:45:00Z",
      date: "2024-12-09",
      time: "04:45 PM",
      fileName: "algebra_lesson_plan_chapter5.pdf",
      fileSize: "2.3 MB",
      category: "Teaching Materials",
      status: "Success",
      details: {
        fileType: "PDF",
        uploadMethod: "Web Interface",
        visibility: "Public",
        tags: ["algebra", "lesson plan", "chapter 5"],
      },
    },
    {
      id: 5,
      type: "Communication",
      title: "Parent Message Sent",
      description: "Sent progress update to John Smith's parents",
      timestamp: "2024-12-09T14:20:00Z",
      date: "2024-12-09",
      time: "02:20 PM",
      student: "John Smith",
      class: "Grade 10A",
      messageType: "Progress Update",
      status: "Delivered",
      details: {
        recipientCount: 2,
        messageLength: 245,
        deliveryMethod: "Email & SMS",
        readStatus: "Read",
      },
    },
    {
      id: 6,
      type: "Assessment Creation",
      title: "Quiz Created",
      description: "Created new quiz for Physics - Thermodynamics",
      timestamp: "2024-12-09T11:30:00Z",
      date: "2024-12-09",
      time: "11:30 AM",
      subject: "Physics",
      class: "Grade 11B",
      assessmentType: "Quiz",
      questionCount: 15,
      status: "Draft",
      details: {
        duration: "45 minutes",
        totalMarks: 30,
        questionTypes: ["Multiple Choice", "Short Answer"],
        scheduledDate: "2024-12-15",
      },
    },
    {
      id: 7,
      type: "System Access",
      title: "Gradebook Access",
      description: "Accessed gradebook for Grade 9C Mathematics",
      timestamp: "2024-12-08T13:45:00Z",
      date: "2024-12-08",
      time: "01:45 PM",
      class: "Grade 9C",
      subject: "Mathematics",
      action: "View Grades",
      status: "Success",
      details: {
        accessDuration: "25 minutes",
        recordsViewed: 30,
        modificationsMode: "Read Only",
      },
    },
    {
      id: 8,
      type: "Login",
      title: "System Login",
      description: "Logged into the system",
      timestamp: "2024-12-08T08:15:00Z",
      date: "2024-12-08",
      time: "08:15 AM",
      ipAddress: "192.168.1.100",
      device: "Desktop - Chrome",
      location: "Staff Room",
      status: "Success",
      duration: "6h 15m",
      details: {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        sessionId: "sess_def456ghi789",
        loginMethod: "Username/Password",
      },
    },
  ];

  // Define columns for SmartTable
  const columns = [
    {
      accessor: "title",
      label: "Activity",
      searchable: true,
      render: (value, row) => (
        <div className="activityInfo">
          <div className="activityIcon">{getActivityIcon(row.type)}</div>
          <div className="activityDetails">
            <div className="activityTitle">{value}</div>
            <div className="activityDescription">{row.description}</div>
          </div>
        </div>
      ),
    },
    {
      accessor: "type",
      label: "Type",
      searchable: true,
      render: (value) => (
        <span
          className="activityTypeBadge"
          style={{ backgroundColor: getTypeColor(value) }}
        >
          {value}
        </span>
      ),
    },
    {
      accessor: "date",
      label: "Date",
      searchable: true,
      render: (value, row) => (
        <div className="activityDateTime">
          <div className="activityDate">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="activityTime">{row.time}</div>
        </div>
      ),
    },
    {
      accessor: "class",
      label: "Class/Subject",
      searchable: true,
      render: (value, row) => (
        <div className="activityClassSubject">
          {value && <div className="activityClass">{value}</div>}
          {row.subject && <div className="activitySubject">{row.subject}</div>}
          {!value && !row.subject && <span className="noClassSubject">-</span>}
        </div>
      ),
    },
    {
      accessor: "studentsAffected",
      label: "Students",
      render: (value) => (value ? `${value} students` : "-"),
    },
    {
      accessor: "status",
      label: "Status",
      searchable: true,
      render: (value) => (
        <span
          className="activityStatusBadge"
          style={{ color: getStatusColor(value) }}
        >
          {value}
        </span>
      ),
    },
    {
      accessor: "duration",
      label: "Duration",
      render: (value) => value || "-",
    },
    {
      accessor: "actions",
      label: "Actions",
      render: (_, row) => (
        <span
          className="viewDetails"
          onClick={(e) => {
            e.stopPropagation();
            handleActivityClick(row);
          }}
        >
          View Details →
        </span>
      ),
    },
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case "Login":
        return <Icons.Report size={20} color="#10b981" />;
      case "Logout":
        return <Icons.Report size={20} color="#6b7280" />;
      case "Grade Submission":
        return <Icons.Guardians size={20} color="#3b82f6" />;
      case "Attendance":
        return <Icons.Class size={20} color="#8b5cf6" />;
      case "Resource Upload":
        return <Icons.AdmissionHistory size={20} color="#f59e0b" />;
      case "Communication":
        return <Icons.Disciplinary size={20} color="#ec4899" />;
      case "Assessment Creation":
        return <Icons.Report size={20} color="#14b8a6" />;
      case "System Access":
        return <Icons.Class size={20} color="#6366f1" />;
      default:
        return <Icons.Report size={20} color="#6b7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
      case "Completed":
      case "Delivered":
        return "#10b981";
      case "Draft":
      case "Pending":
        return "#f59e0b";
      case "Failed":
      case "Error":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Login":
      case "Logout":
        return "rgba(16, 185, 129, 0.1)";
      case "Grade Submission":
        return "rgba(59, 130, 246, 0.1)";
      case "Attendance":
        return "rgba(139, 92, 246, 0.1)";
      case "Resource Upload":
        return "rgba(245, 158, 11, 0.1)";
      case "Communication":
        return "rgba(236, 72, 153, 0.1)";
      case "Assessment Creation":
        return "rgba(20, 184, 166, 0.1)";
      case "System Access":
        return "rgba(99, 102, 241, 0.1)";
      default:
        return "rgba(107, 114, 128, 0.1)";
    }
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    setIsActivityDetailOpen(true);
  };

  const handleRowClick = (activity) => {
    handleActivityClick(activity);
  };

  const handleExport = async (options) => {
    console.log("Export activities", options);
  };

  return (
    <InnerTabCon>
      <div className="teacherActivity">
        {/* Header */}
        <div className="actHeader">
          <div className="actHeaderLeft">
            <h2 className="actTitle">Teacher Activity Log</h2>
            <p className="actSubtitle">
              Comprehensive activity tracking including logins, grade
              submissions, and system usage
            </p>
          </div>
          <div className="actHeaderRight">
            <Button variant="secondary">Print Report</Button>
          </div>
        </div>

        {/* SmartTable */}
        <SmartTable
          columns={columns}
          data={activities}
          onRowClick={handleRowClick}
          onExport={handleExport}
          showcreatbut={false}
          maxRowsPerPage={10}
          exportDefaults={{
            includeColumns: [
              "title",
              "type",
              "date",
              "class",
              "status",
              "duration",
            ],
            format: "csv",
          }}
        />

        {/* Activity Detail Modal */}
        <SlideInMenu
          isShow={isActivityDetailOpen}
          onClose={() => setIsActivityDetailOpen(false)}
          width="700px"
        >
          <div className="actSlideMenuContent">
            <div className="actSlideMenuHeader">
              <div>
                <h2>{selectedActivity?.title}</h2>
                <p>
                  {selectedActivity?.type} • {selectedActivity?.date} •{" "}
                  {selectedActivity?.time}
                </p>
              </div>
              <button
                className="actCloseButton"
                onClick={() => setIsActivityDetailOpen(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="actSlideMenuBody">
              {selectedActivity && (
                <div className="actActivityDetailContent">
                  <div className="actDetailSection">
                    <h3>Activity Information</h3>
                    <div className="actDetailGrid">
                      <div className="actDetailItem">
                        <span className="actDetailLabel">Activity Type</span>
                        <span className="actDetailValue">
                          {selectedActivity.type}
                        </span>
                      </div>
                      <div className="actDetailItem">
                        <span className="actDetailLabel">Status</span>
                        <span
                          className="actDetailValue"
                          style={{
                            color: getStatusColor(selectedActivity.status),
                          }}
                        >
                          {selectedActivity.status}
                        </span>
                      </div>
                      <div className="actDetailItem">
                        <span className="actDetailLabel">Date & Time</span>
                        <span className="actDetailValue">
                          {selectedActivity.date} at {selectedActivity.time}
                        </span>
                      </div>
                      {selectedActivity.class && (
                        <div className="actDetailItem">
                          <span className="actDetailLabel">Class</span>
                          <span className="actDetailValue">
                            {selectedActivity.class}
                          </span>
                        </div>
                      )}
                      {selectedActivity.subject && (
                        <div className="actDetailItem">
                          <span className="actDetailLabel">Subject</span>
                          <span className="actDetailValue">
                            {selectedActivity.subject}
                          </span>
                        </div>
                      )}
                      {selectedActivity.studentsAffected && (
                        <div className="actDetailItem">
                          <span className="actDetailLabel">
                            Students Affected
                          </span>
                          <span className="actDetailValue">
                            {selectedActivity.studentsAffected}
                          </span>
                        </div>
                      )}
                      {selectedActivity.duration && (
                        <div className="actDetailItem">
                          <span className="actDetailLabel">Duration</span>
                          <span className="actDetailValue">
                            {selectedActivity.duration}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="actDetailSection">
                    <h3>Description</h3>
                    <p className="actDetailDescription">
                      {selectedActivity.description}
                    </p>
                  </div>

                  {selectedActivity.details && (
                    <div className="actDetailSection">
                      <h3>Additional Details</h3>
                      <div className="actDetailGrid">
                        {Object.entries(selectedActivity.details).map(
                          ([key, value]) => (
                            <div key={key} className="actDetailItem">
                              <span className="actDetailLabel">
                                {key
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (str) => str.toUpperCase())}
                              </span>
                              <span className="actDetailValue">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : value.toString()}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="actSlideMenuFooter">
              <Button
                variant="secondary"
                onClick={() => setIsActivityDetailOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default TeacherActivity;
