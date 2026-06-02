import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SmartTable from "../../../../../components/SmartTable/SmartTable";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import CreateAnnouncement from "./CreateAnnouncement/CreateAnnouncement";
import ActionDropdown from "./ActionDropdown/ActionDropdown";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import {
  FaArrowRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPaperPlane,
  FaCopy,
} from "react-icons/fa";
import "./Announcements.css";

const Announcements = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isPreviewMenuOpen, setIsPreviewMenuOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Enhanced announcements data with detailed specifications
  const announcementsData = [
    {
      id: 1,
      title: "School Resumes 13 Jan",
      content:
        "Dear students and parents, we are pleased to announce that school will resume on January 13th, 2025. All students are expected to report by 8:00 AM with their complete uniforms and necessary materials.",
      sentDate: "2025-01-10",
      scheduledDate: "2025-01-10 08:00",
      targets: "Whole School",
      targetDetails: {
        type: "whole_school",
        count: 1250,
        breakdown: "All Students, Parents & Staff",
      },
      status: "Published",
      views: "85%",
      viewStats: {
        sent: 1250,
        delivered: 1238,
        opened: 1063,
        clicked: 234,
      },
      repliesAllowed: "Yes",
      replyCount: 23,
      author: "Principal Johnson",
      priority: "High",
      attachments: ["school_calendar_2025.pdf", "uniform_guidelines.pdf"],
      deliveryChannels: ["Email", "SMS", "App Push"],
      isUrgent: true,
      activityLogs: [
        {
          action: "Created",
          timestamp: "2025-01-09 14:30",
          user: "Principal Johnson",
        },
        {
          action: "Reviewed",
          timestamp: "2025-01-09 16:45",
          user: "Vice Principal",
        },
        {
          action: "Published",
          timestamp: "2025-01-10 08:00",
          user: "Principal Johnson",
        },
      ],
    },
    {
      id: 2,
      title: "Parent-Teacher Conference Schedule",
      content:
        "Parent-Teacher conferences are scheduled for January 25-27, 2025. Please book your appointment through the school portal or contact your child's class teacher directly.",
      sentDate: "2025-01-08",
      scheduledDate: "2025-01-08 15:00",
      targets: "JSS1 A / First Term",
      targetDetails: {
        type: "specific_class",
        count: 45,
        breakdown: "JSS1 A Students & Parents",
      },
      status: "Published",
      views: "92%",
      viewStats: {
        sent: 45,
        delivered: 45,
        opened: 41,
        clicked: 28,
      },
      repliesAllowed: "Yes",
      replyCount: 12,
      author: "Class Teacher - Mrs. Smith",
      priority: "Medium",
      attachments: ["conference_booking_form.pdf"],
      deliveryChannels: ["Email", "App Push"],
      isUrgent: false,
      activityLogs: [
        {
          action: "Created",
          timestamp: "2025-01-07 10:15",
          user: "Mrs. Smith",
        },
        {
          action: "Published",
          timestamp: "2025-01-08 15:00",
          user: "Mrs. Smith",
        },
      ],
    },
    {
      id: 3,
      title: "Fee Payment Reminder - Overdue Accounts",
      content:
        "This is a reminder that school fees for the current term are now overdue. Please settle your account by January 20th to avoid late payment charges.",
      sentDate: "2025-01-12",
      scheduledDate: "2025-01-12 09:00",
      targets: "All Overdue Fees Parents",
      targetDetails: {
        type: "custom_group",
        count: 78,
        breakdown: "Parents with Outstanding Fees",
      },
      status: "Published",
      views: "67%",
      viewStats: {
        sent: 78,
        delivered: 76,
        opened: 52,
        clicked: 15,
      },
      repliesAllowed: "No",
      replyCount: 0,
      author: "Bursar",
      priority: "High",
      attachments: ["payment_options.pdf", "fee_structure.pdf"],
      deliveryChannels: ["Email", "SMS"],
      isUrgent: true,
      activityLogs: [
        { action: "Created", timestamp: "2025-01-11 16:20", user: "Bursar" },
        { action: "Published", timestamp: "2025-01-12 09:00", user: "Bursar" },
      ],
    },
    {
      id: 4,
      title: "Sports Day Registration Open",
      content:
        "Annual Sports Day will be held on February 15th, 2025. Registration is now open for all events. Please register through the sports department by January 30th.",
      sentDate: null,
      scheduledDate: "2025-01-15 10:00",
      targets: "All Students",
      targetDetails: {
        type: "all_students",
        count: 850,
        breakdown: "All Students Across All Classes",
      },
      status: "Scheduled",
      views: "0%",
      viewStats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      },
      repliesAllowed: "Yes",
      replyCount: 0,
      author: "Sports Coordinator",
      priority: "Medium",
      attachments: ["sports_events_list.pdf", "registration_form.pdf"],
      deliveryChannels: ["Email", "App Push"],
      isUrgent: false,
      activityLogs: [
        {
          action: "Created",
          timestamp: "2025-01-13 11:45",
          user: "Sports Coordinator",
        },
        {
          action: "Scheduled",
          timestamp: "2025-01-13 11:50",
          user: "Sports Coordinator",
        },
      ],
    },
    {
      id: 5,
      title: "Library Maintenance Notice",
      content:
        "The school library will be closed for maintenance from January 20-22, 2025. Online resources will remain available through the school portal.",
      sentDate: null,
      scheduledDate: null,
      targets: "Whole School",
      targetDetails: {
        type: "whole_school",
        count: 1250,
        breakdown: "All Students, Parents & Staff",
      },
      status: "Draft",
      views: "0%",
      viewStats: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      },
      repliesAllowed: "No",
      replyCount: 0,
      author: "Librarian",
      priority: "Low",
      attachments: [],
      deliveryChannels: ["Email"],
      isUrgent: false,
      activityLogs: [
        { action: "Created", timestamp: "2025-01-12 14:30", user: "Librarian" },
      ],
    },
    {
      id: 6,
      title: "Exam Timetable Released - Final Term",
      content:
        "The final examination timetable for Term 1 has been released. Please check the student portal for detailed schedules and examination guidelines.",
      sentDate: "2025-01-14",
      scheduledDate: "2025-01-14 08:00",
      targets: "SS3 Students",
      targetDetails: {
        type: "specific_level",
        count: 120,
        breakdown: "SS3 Students & Parents",
      },
      status: "Published",
      views: "96%",
      viewStats: {
        sent: 120,
        delivered: 120,
        opened: 115,
        clicked: 89,
      },
      repliesAllowed: "Yes",
      replyCount: 34,
      author: "Examination Officer",
      priority: "High",
      attachments: [
        "exam_timetable.pdf",
        "exam_guidelines.pdf",
        "exam_rules.pdf",
      ],
      deliveryChannels: ["Email", "SMS", "App Push"],
      isUrgent: true,
      activityLogs: [
        {
          action: "Created",
          timestamp: "2025-01-13 16:00",
          user: "Examination Officer",
        },
        {
          action: "Reviewed",
          timestamp: "2025-01-13 18:30",
          user: "Academic Director",
        },
        {
          action: "Published",
          timestamp: "2025-01-14 08:00",
          user: "Examination Officer",
        },
      ],
    },
  ];

  // Enhanced columns for the table
  const columns = [
    {
      label: "Title",
      accessor: "title",
      render: (v, row) => (
        <div className="announcement-title-cell">
          <div className="title-main">
            {row.isUrgent && <span className="urgent-indicator">🔴</span>}
            {v}
          </div>
          <div className="title-meta">
            By {row.author} • {row.priority} Priority
          </div>
        </div>
      ),
    },
    {
      label: "Sent Date",
      accessor: "sentDate",
      render: (v, row) => (
        <div className="date-cell">
          {v ? (
            <>
              <div className="sent-date">{v}</div>
              <div className="sent-time">
                {row.scheduledDate?.split(" ")[1] || "N/A"}
              </div>
            </>
          ) : (
            <div className="not-sent">
              {row.status === "Scheduled"
                ? `Scheduled: ${row.scheduledDate}`
                : "Not Sent"}
            </div>
          )}
        </div>
      ),
    },
    {
      label: "Targets",
      accessor: "targets",
      render: (v, row) => (
        <div className="targets-cell">
          <div className="target-main">{v}</div>
          <div className="target-count">
            {row.targetDetails.count} recipients
          </div>
        </div>
      ),
    },
    {
      label: "Status",
      accessor: "status",
      render: (value) => (
        <span
          className={`status-badge ${value.toLowerCase()}`}
          style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "600",
            backgroundColor: getStatusColor(value).bg,
            color: getStatusColor(value).text,
          }}
        >
          {value}
        </span>
      ),
    },
    {
      label: "Views",
      accessor: "views",
      render: (v, row) => (
        <div className="views-cell">
          <div className="view-percentage">{v}</div>
          <div className="view-details">
            {row.viewStats.opened}/{row.viewStats.sent}
          </div>
        </div>
      ),
    },
    {
      label: "Replies Allowed",
      accessor: "repliesAllowed",
      render: (v, row) => (
        <div className="replies-cell">
          <span className={`reply-status ${v.toLowerCase()}`}>{v}</span>
          {v === "Yes" && row.replyCount > 0 && (
            <div className="reply-count">{row.replyCount} replies</div>
          )}
        </div>
      ),
    },
    {
      label: "Actions",
      accessor: "actions",
      searchable: false,
      render: (val, row) => (
        <ActionDropdown
          row={row}
          onView={handleViewAnnouncement}
          onEdit={handleEditAnnouncement}
          onResend={handleResendAnnouncement}
          onDelete={handleDeleteAnnouncement}
        />
      ),
    },
  ];

  // Helper functions
  const getStatusColor = (status) => {
    switch (status) {
      case "Published":
        return { bg: "#dcfce7", text: "#166534" };
      case "Scheduled":
        return { bg: "#dbeafe", text: "#1e40af" };
      case "Draft":
        return { bg: "#fef3c7", text: "#92400e" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  // Event handlers
  const handleBulkDelete = async (ids) => {
    console.log("Bulk delete announcements:", ids);
  };

  const handleExport = async (opts) => {
    console.log("Export announcements:", opts);
  };

  const handleCreate = () => {
    setIsCreateMenuOpen(true);
  };

  const handleClick = (row) => {
    handleViewAnnouncement(row);
  };

  const handleViewAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewMenuOpen(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsCreateMenuOpen(true);
  };

  const handleResendAnnouncement = (announcement) => {
    console.log("Resend announcement:", announcement.id);
    // Handle resend functionality
  };

  const handleDeleteAnnouncement = (announcement) => {
    console.log("Delete announcement:", announcement.id);
    // Handle soft delete functionality
  };

  const handlePreviewAnnouncement = (formData) => {
    setSelectedAnnouncement({ ...formData, id: "preview" });
    setIsCreateMenuOpen(false);
    setIsPreviewMenuOpen(true);
  };

  const handleSubmitAnnouncement = async (formData) => {
    console.log("Create announcement:", formData);

    // Show preview first
    handlePreviewAnnouncement(formData);

    return { success: true };
  };

  const handleSendAnnouncement = async () => {
    console.log("Sending announcement:", selectedAnnouncement);
    // Handle actual sending logic
    setIsPreviewMenuOpen(false);
    // Log activity
    console.log("Activity logged: Announcement sent");
  };

  return (
    <InnerTabCon>
      <div className="announcements-container">
        {/* Simple Header with Title and Subtitle Only */}
        <div className="announcements-header">
          <div className="header-content">
            <h2>Announcements</h2>
            <p className="subtitle">
              Create and manage school announcements with delivery tracking and
              engagement analytics
            </p>
          </div>
        </div>

        <SmartTable
          columns={columns}
          data={announcementsData}
          onRowClick={handleClick}
          enableSelect={true}
          onSelectChange={(ids) => console.log("selected changed", ids)}
          onBulkDelete={handleBulkDelete}
          onExport={handleExport}
          onCreate={handleCreate}
          maxRowsPerPage={15}
          showcreatbut={true}
          creattext="Create Announcement"
        />

        {/* Create/Edit Announcement Form */}
        <SlideInMenu
          isShow={isCreateMenuOpen}
          onClose={() => setIsCreateMenuOpen(false)}
          width="900px"
        >
          <CreateAnnouncement
            initialData={
              selectedAnnouncement?.id !== "preview"
                ? selectedAnnouncement
                : null
            }
            isEdit={
              selectedAnnouncement?.id !== "preview" && selectedAnnouncement?.id
            }
            onSubmit={handleSubmitAnnouncement}
            onPreview={handlePreviewAnnouncement}
            onCancel={() => {
              setIsCreateMenuOpen(false);
              setSelectedAnnouncement(null);
            }}
          />
        </SlideInMenu>

        {/* Preview Announcement Modal */}
        <SlideInMenu
          isShow={isPreviewMenuOpen}
          onClose={() => setIsPreviewMenuOpen(false)}
          width="700px"
        >
          <div className="announcement-preview-content">
            <div className="preview-header">
              <h2>Preview Announcement</h2>
              <p>Review your announcement before sending</p>
            </div>

            <div className="preview-body">
              {selectedAnnouncement && (
                <>
                  <div className="preview-section">
                    <h3>{selectedAnnouncement.title}</h3>
                    <div className="preview-meta">
                      <span>
                        To:{" "}
                        {selectedAnnouncement.targetType ||
                          selectedAnnouncement.targets}
                      </span>
                      <span>Priority: {selectedAnnouncement.priority}</span>
                      <span>
                        Channels:{" "}
                        {Array.isArray(selectedAnnouncement.deliveryChannels)
                          ? selectedAnnouncement.deliveryChannels.join(", ")
                          : selectedAnnouncement.deliveryChannels}
                      </span>
                      <span>
                        Recipients:{" "}
                        {selectedAnnouncement.selectedTargets?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="preview-content">
                    <p>{selectedAnnouncement.content}</p>
                  </div>

                  {selectedAnnouncement.attachments &&
                    selectedAnnouncement.attachments.length > 0 && (
                      <div className="preview-attachments">
                        <h4>Attachments:</h4>
                        <ul>
                          {selectedAnnouncement.attachments.map(
                            (attachment, index) => (
                              <li key={index}>{attachment}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {/* Note about file attachments */}
                  <div className="preview-note">
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontStyle: "italic",
                      }}
                    >
                      Note: File attachment functionality will be available in
                      the next update.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="preview-footer">
              <Button
                variant="secondary"
                onClick={() => setIsPreviewMenuOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPreviewMenuOpen(false);
                  setIsCreateMenuOpen(true);
                }}
              >
                Edit
              </Button>
              <Button onClick={handleSendAnnouncement}>
                <FaPaperPlane size={14} style={{ marginRight: "8px" }} />
                Send Announcement
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* View Announcement Details */}
        <SlideInMenu
          isShow={isViewMenuOpen}
          onClose={() => setIsViewMenuOpen(false)}
          width="800px"
        >
          <div className="announcement-detail-content">
            <div className="announcement-detail-header">
              <div>
                <h2>{selectedAnnouncement?.title}</h2>
                <div className="announcement-meta">
                  <span className="meta-item">
                    <strong>Author:</strong> {selectedAnnouncement?.author}
                  </span>
                  <span className="meta-item">
                    <strong>Status:</strong> {selectedAnnouncement?.status}
                  </span>
                  <span className="meta-item">
                    <strong>Priority:</strong> {selectedAnnouncement?.priority}
                  </span>
                </div>
              </div>
              <button
                className="close-button"
                onClick={() => setIsViewMenuOpen(false)}
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

            <div className="announcement-detail-body">
              {selectedAnnouncement && (
                <>
                  <div className="detail-section">
                    <h3>Content</h3>
                    <p className="announcement-content">
                      {selectedAnnouncement.content}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Target Details</h3>
                    <div className="target-details-expanded">
                      <div className="target-info">
                        <span>
                          <strong>Target Group:</strong>{" "}
                          {selectedAnnouncement.targets}
                        </span>
                        <span>
                          <strong>Recipients:</strong>{" "}
                          {selectedAnnouncement.targetDetails?.count}
                        </span>
                        <span>
                          <strong>Breakdown:</strong>{" "}
                          {selectedAnnouncement.targetDetails?.breakdown}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedAnnouncement.status === "Published" && (
                    <div className="detail-section">
                      <h3>Delivery Statistics</h3>
                      <div className="delivery-stats">
                        <div className="stat-card">
                          <div className="stat-value">
                            {selectedAnnouncement.viewStats?.sent}
                          </div>
                          <div className="stat-label">Sent</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">
                            {selectedAnnouncement.viewStats?.delivered}
                          </div>
                          <div className="stat-label">Delivered</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">
                            {selectedAnnouncement.viewStats?.opened}
                          </div>
                          <div className="stat-label">Opened</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-value">
                            {selectedAnnouncement.viewStats?.clicked}
                          </div>
                          <div className="stat-label">Clicked</div>
                        </div>
                      </div>
                      <div className="engagement-rates">
                        <span>Open Rate: {selectedAnnouncement.views}</span>
                        <span>
                          Click Rate:{" "}
                          {Math.round(
                            (selectedAnnouncement.viewStats?.clicked /
                              selectedAnnouncement.viewStats?.sent) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedAnnouncement.attachments &&
                    selectedAnnouncement.attachments.length > 0 && (
                      <div className="detail-section">
                        <h3>Attachments</h3>
                        <div className="attachments-list">
                          {selectedAnnouncement.attachments.map(
                            (attachment, index) => (
                              <div key={index} className="attachment-item">
                                <span className="attachment-name">
                                  {attachment}
                                </span>
                                <button className="download-btn">
                                  Download
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="detail-section">
                    <h3>Activity Log</h3>
                    <div className="activity-log">
                      {selectedAnnouncement.activityLogs?.map((log, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-action">{log.action}</div>
                          <div className="activity-details">
                            <span>{log.timestamp}</span>
                            <span>by {log.user}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="announcement-detail-footer">
              <Button
                variant="secondary"
                onClick={() => setIsViewMenuOpen(false)}
              >
                Close
              </Button>
              {selectedAnnouncement?.status === "Draft" && (
                <Button
                  variant="secondary"
                  onClick={() => handleEditAnnouncement(selectedAnnouncement)}
                >
                  Edit
                </Button>
              )}
              {selectedAnnouncement?.status === "Published" && (
                <Button
                  variant="secondary"
                  onClick={() => handleResendAnnouncement(selectedAnnouncement)}
                >
                  Resend
                </Button>
              )}
              <Button
                onClick={() => handleDeleteAnnouncement(selectedAnnouncement)}
              >
                Delete
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>
    </InnerTabCon>
  );
};

export default Announcements;
