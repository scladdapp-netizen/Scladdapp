import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../../../api_call/useSession";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import Button from "../../../../components/Button/Button";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import CenterModal from "../../../../components/CenterModal/CenterModal";
import ArchiveSessionPanel from "../../../../components/ArchiveSessionPanel/ArchiveSessionPanel";
import FormInput from "../../../../components/FormInput";
import {
  FaCalendarAlt,
  FaPlus,
  FaCheckCircle,
  FaLock,
  FaEdit,
  FaClock,
  FaArchive,
  FaSearch,
  FaEllipsisV,
  FaBan,
  FaExclamationTriangle,
} from "react-icons/fa";
import { formatDate } from "../../../../services/dateFormarter";
import "./AcademicSessionList.css";

const AcademicSessionList = () => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getSessionsBySchool, updateSession, deleteSession } = useSession();

  // ── DEBUG: log full user object to see its shape ──────────────────────────
  console.log("🔍 [AcademicSessionList] full user object:", JSON.stringify(user, null, 2));
  console.log("🔍 [AcademicSessionList] user?.user_id:", user?.user_id);
  console.log("🔍 [AcademicSessionList] user?.admin?.admin_id || user?.user_id:", user?.admin?.admin_id || user?.user_id);
  // ─────────────────────────────────────────────────────────────────────────

  // ── Permission helpers ────────────────────────────────────────────────────
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));

  const hasPerm = (module, action) => {
    if (isSuperAdmin) return true;
    return !!admin?.permissions?.[module]?.[action];
  };

  const canCreateSession = hasPerm("academic_sessions", "create");
  const canEditSession   = hasPerm("academic_sessions", "edit");
  const canDeleteSession = hasPerm("academic_sessions", "delete");
  // ─────────────────────────────────────────────────────────────────────────

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showActionDropdown, setShowActionDropdown] = useState(null);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [archivingSession, setArchivingSession] = useState(null);
  const [showArchivedPanel, setShowArchivedPanel] = useState(false);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [overlappingSessions, setOverlappingSessions] = useState([]);
  const [sessionToReactivate, setSessionToReactivate] = useState(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchSessions();
  }, [schoolId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.session-actions-dropdown')) {
        setShowActionDropdown(null);
      }
    };

    if (showActionDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionDropdown]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const result = await getSessionsBySchool(schoolId);
      if (result.success) {
        // Sort by start date descending (newest first)
        const sortedSessions = (result.data || []).sort((a, b) => {
          const dateA = new Date(a.academic_year_start_date);
          const dateB = new Date(b.academic_year_start_date);
          return dateB - dateA; // Newest first
        });
        setSessions(sortedSessions);
      } else {
        addNotification(
          result.message || "Failed to fetch sessions",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      addNotification("An error occurred while fetching sessions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenArchivePanel = (session, event) => {
    event.stopPropagation();
    if (!canDeleteSession) {
      addNotification("You do not have permission to archive this session.", "error");
      setShowActionDropdown(null);
      return;
    }
    setArchivingSession(session);
    setShowArchivePanel(true);
    setShowActionDropdown(null);
  };

  const handleOpenEditPanel = (session, event) => {
    event.stopPropagation();
    if (!canEditSession) {
      addNotification("You do not have permission to edit this session.", "error");
      setShowActionDropdown(null);
      return;
    }
    setEditingSession(session);
    setEditFormData({
      name: session.session_name,
      startDate: session.academic_year_start_date,
      endDate: session.academic_year_end_date,
    });
    setShowEditPanel(true);
    setShowActionDropdown(null);
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingSession) return;

    // Validate dates
    const startDate = new Date(editFormData.startDate);
    const endDate = new Date(editFormData.endDate);

    if (startDate >= endDate) {
      addNotification("Start date must be before end date", "error");
      return;
    }

    const result = await updateSession(editingSession.session_id, {
      session_name: editFormData.name,
      academic_year_start_date: editFormData.startDate,
      academic_year_end_date: editFormData.endDate,
      modified_by: user?.admin?.admin_id || user?.user_id,
    });
    console.log("🔍 [handleSaveEdit] sending modified_by:", user?.admin?.admin_id || user?.user_id, "| result:", result);

    if (result.success) {
      addNotification("Session updated successfully!", "success");
      setShowEditPanel(false);
      setEditingSession(null);
      
      // Reload sessions
      setTimeout(() => {
        fetchSessions();
      }, 500);
    } else {
      addNotification(`Failed to update session: ${result.message}`, "error");
    }
  };

  const handleArchiveSession = async () => {
    if (!archivingSession) return;

    const isDraft = archivingSession.session_status === "draft";
    let result;

    if (isDraft) {
      // Delete draft session permanently
      console.log("🔍 [handleArchiveSession] sending deleted_by:", user?.admin?.admin_id || user?.user_id);
      result = await deleteSession(archivingSession.session_id, user?.admin?.admin_id || user?.user_id);
    } else {
      // Archive active/completed session
      console.log("🔍 [handleArchiveSession] sending modified_by:", user?.admin?.admin_id || user?.user_id);
      result = await updateSession(archivingSession.session_id, {
        session_status: "archived",
        is_archived: true,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });
    }

    if (result.success) {
      const action = isDraft ? "deleted" : "archived";
      addNotification(`Session ${action} successfully!`, "success");
      setShowArchivePanel(false);
      setArchivingSession(null);
      
      // Reload sessions
      setTimeout(() => {
        fetchSessions();
      }, 500);
    } else {
      addNotification(`Failed to ${isDraft ? "delete" : "archive"} session: ${result.message}`, "error");
    }
  };

  const handleReactivateSession = async (session) => {
    // Find all overlapping active sessions
    const activeSessions = sessions.filter(s => !s.is_archived && s.session_id !== session.session_id);
    
    const sessionStart = new Date(session.academic_year_start_date);
    const sessionEnd = new Date(session.academic_year_end_date);

    const overlapping = activeSessions.filter((otherSession) => {
      if (!otherSession.academic_year_start_date || !otherSession.academic_year_end_date) return false;

      const otherStart = new Date(otherSession.academic_year_start_date);
      const otherEnd = new Date(otherSession.academic_year_end_date);

      // Check if dates overlap
      return (sessionStart < otherEnd && sessionEnd > otherStart);
    });

    if (overlapping.length > 0) {
      // Close the archived panel and show modal with overlapping sessions
      setShowArchivedPanel(false);
      setOverlappingSessions(overlapping);
      setSessionToReactivate(session);
      setShowOverlapModal(true);
      return;
    }

    // No overlaps, proceed with reactivation
    await performReactivation(session);
  };

  const performReactivation = async (session) => {
    const result = await updateSession(session.session_id, {
      is_archived: false,
      session_status: "draft",
      modified_by: user?.admin?.admin_id || user?.user_id,
    });

    if (result.success) {
      addNotification("Session reactivated successfully!", "success");
      setShowArchivedPanel(false);
      
      // Reload sessions
      setTimeout(() => {
        fetchSessions();
      }, 500);
    } else {
      addNotification(`Failed to reactivate session: ${result.message}`, "error");
    }
  };

  const handleArchiveOverlappingAndReactivate = async () => {
    try {
      // Archive overlapping sessions SEQUENTIALLY to avoid race conditions
      for (const session of overlappingSessions) {
        const result = await updateSession(session.session_id, {
          is_archived: true,
          session_status: "archived",
          modified_by: user?.admin?.admin_id || user?.user_id,
        });
        
        if (!result.success) {
          addNotification(`Failed to archive "${session.session_name}"`, "error");
          return;
        }
      }

      // Now reactivate the target session
      await performReactivation(sessionToReactivate);
      setShowOverlapModal(false);
      setOverlappingSessions([]);
      setSessionToReactivate(null);
    } catch (error) {
      console.error("Error in archive and reactivate:", error);
      addNotification("Error archiving overlapping sessions", "error");
    }
  };

  // Filter active and archived sessions
  const activeSessions = sessions.filter(s => !s.is_archived);
  const archivedSessions = sessions.filter(s => s.is_archived);

  // Filter sessions based on search query
  const filteredSessions = activeSessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      session.session_name?.toLowerCase().includes(query) ||
      session.session_code?.toLowerCase().includes(query) ||
      session.session_status?.toLowerCase().includes(query) ||
      session.created_by_name?.toLowerCase().includes(query)
    );
  });

  const handleCreateSession = () => {
    if (!canCreateSession) {
      addNotification("You do not have permission to perform this action.", "error");
      return;
    }
    navigate(`/admin/${schoolId}/acedemic_seasion/create-session`);
  };

  const handleSessionClick = (sessionId, event) => {
    // Don't navigate if clicking on action button
    if (event.target.closest('.session-actions-dropdown') || 
        event.target.closest('.action-menu-btn')) {
      return;
    }
    navigate(`/admin/${schoolId}/acedemic_seasion/sd/${sessionId}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FaCheckCircle className="status-icon active" />;
      case "completed":
        return <FaCheckCircle className="status-icon completed" />;
      case "draft":
        return <FaEdit className="status-icon draft" />;
      case "archived":
        return <FaArchive className="status-icon archived" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    return `session-status ${status}`;
  };

  if (loading) {
    return (
      <div className="asl-container">
        <div className="asl-loading">
          <div className="spinner"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="asl-container">
      <div className="asl-header">
        <div className="asl-header-content">
          <div className="asl-header-text">
            <h1 className="asl-title">Academic Sessions</h1>
            <p className="asl-subtitle">
              Manage all academic sessions for your school
            </p>
          </div>
          <div className="asl-header-actions">
            {archivedSessions.length > 0 && canEditSession && (
              <Button
                variant="secondary"
                onClick={() => setShowArchivedPanel(true)}
                icon={<FaArchive />}
              >
                View Archived ({archivedSessions.length})
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleCreateSession}
              icon={canCreateSession ? <FaPlus /> : <FaLock />}
            >
              Create New Session
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {activeSessions.length > 0 && (
          <div className="asl-search-container">
            <div className="asl-search-wrapper">
              <FaSearch className="asl-search-icon" />
              <input
                type="text"
                className="asl-search-input"
                placeholder="Search by name, code, status, or creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="asl-search-clear"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="asl-search-results">
                Found {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {activeSessions.length === 0 ? (
        <div className="asl-empty">
          <FaCalendarAlt className="asl-empty-icon" />
          <h2>No Academic Sessions Found</h2>
          <p>Get started by creating your first academic session</p>
          <Button
            variant="primary"
            onClick={handleCreateSession}
            icon={canCreateSession ? <FaPlus /> : <FaLock />}
          >
            Create Session
          </Button>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="asl-empty">
          <FaSearch className="asl-empty-icon" />
          <h2>No Sessions Match Your Search</h2>
          <p>Try adjusting your search terms</p>
          <Button
            variant="secondary"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="asl-grid">
          {filteredSessions.map((session) => (
            <div
              key={session.session_id}
              className="asl-card"
              onClick={(e) => handleSessionClick(session.session_id, e)}
            >
              <div className="asl-card-header">
                <div className="asl-card-icon">
                  <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="4" width="18" height="15" rx="2.5" fill="white" opacity="0.15" stroke="white" strokeWidth="1.7" />
                    <path d="M7 2v4M15 2v4" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M2 9h18" stroke="white" strokeWidth="1.5" opacity="0.6" />
                    <rect x="6" y="12" width="4" height="4" rx="1" fill="white" />
                    <rect x="12" y="12" width="4" height="4" rx="1" fill="white" opacity="0.4" />
                  </svg>
                </div>
                <div className="asl-card-header-right">
                  <div className={getStatusClass(session.session_status)}>
                    {getStatusIcon(session.session_status)}
                    <span>{session.session_status}</span>
                  </div>
                  <div className="session-actions-dropdown">
                    <button 
                      className="action-menu-btn" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowActionDropdown(showActionDropdown === session.session_id ? null : session.session_id);
                      }} 
                      title="Actions"
                    >
                      <FaEllipsisV size={14} />
                    </button>
                    
                    {showActionDropdown === session.session_id && (
                      <div className="action-dropdown-menu">
                        <button 
                          className="action-dropdown-item"
                          onClick={(e) => handleOpenEditPanel(session, e)}
                        >
                          <FaEdit size={14} />
                          <span>Edit</span>
                        </button>
                        <button 
                          className="action-dropdown-item action-dropdown-item-danger"
                          onClick={(e) => handleOpenArchivePanel(session, e)}
                          disabled={session.session_status === "archived"}
                        >
                          {session.session_status === "archived" ? (
                            <>
                              <FaArchive size={14} />
                              <span>Archived</span>
                            </>
                          ) : (
                            <>
                              <FaBan size={14} />
                              <span>{session.session_status === "draft" ? "Delete" : "Archive"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="asl-card-body">
                <h3 className="asl-card-title">{session.session_name}</h3>
                <p className="asl-card-code">{session.session_code}</p>

                <div className="asl-card-dates">
                  <div className="asl-date-item">
                    <span className="asl-date-label">Start Date</span>
                    <span className="asl-date-value">
                      {formatDate(session.academic_year_start_date)}
                    </span>
                  </div>
                  <div className="asl-date-divider"></div>
                  <div className="asl-date-item">
                    <span className="asl-date-label">End Date</span>
                    <span className="asl-date-value">
                      {formatDate(session.academic_year_end_date)}
                    </span>
                  </div>
                </div>

                {session.created_by_name && (
                  <div className="asl-card-meta">
                    <span className="asl-meta-label">Created by:</span>
                    <span className="asl-meta-value">
                      {session.created_by_name}
                    </span>
                  </div>
                )}
              </div>

              <div className="asl-card-footer">
                <span className="asl-view-link">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Session Panel */}
      <SlideInMenu isShow={showEditPanel} onClose={() => setShowEditPanel(false)} width="500px">
        <div className="edit-session-container">
          <div className="edit-session-header">
            <h2>Edit Session</h2>
            <p>Update session details and dates</p>
          </div>
          <div className="edit-session-form">
            <FormInput 
              label="Session Name *" 
              type="text" 
              value={editFormData.name} 
              onChange={(value) => handleEditInputChange("name", value)} 
              placeholder="e.g., 2024/2025 Academic Year" 
            />
            <FormInput 
              label="Start Date *" 
              type="date" 
              value={editFormData.startDate} 
              onChange={(value) => handleEditInputChange("startDate", value)} 
            />
            <FormInput 
              label="End Date *" 
              type="date" 
              value={editFormData.endDate} 
              onChange={(value) => handleEditInputChange("endDate", value)} 
            />
          </div>
          <div className="edit-session-footer">
            <Button variant="secondary" onClick={() => setShowEditPanel(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={!editFormData.name || !editFormData.startDate || !editFormData.endDate}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Archive Confirmation Panel */}
      <ArchiveSessionPanel
        isOpen={showArchivePanel}
        onClose={() => setShowArchivePanel(false)}
        onConfirm={handleArchiveSession}
        sessionData={archivingSession}
        type="session"
        mode={archivingSession?.session_status === "draft" ? "delete" : "archive"}
      />

      {/* Archived Sessions Panel */}
      <SlideInMenu isShow={showArchivedPanel} onClose={() => setShowArchivedPanel(false)} width="700px">
        <div className="archived-sessions-container">
          <div className="archived-sessions-header">
            <div className="archived-header-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="6" width="18" height="13" rx="2.5" fill="#111111" opacity="0.15" stroke="#111111" strokeWidth="1.6" />
                <path d="M2 9h18" stroke="#111111" strokeWidth="1.6" />
                <path d="M8 13h6" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
                <rect x="6" y="3" width="10" height="4" rx="1.5" fill="#111111" opacity="0.3" stroke="#111111" strokeWidth="1.4" />
              </svg>
            </div>
            <div className="archived-header-text">
              <h2>Archived Sessions</h2>
              <p>View all archived sessions for this school</p>
            </div>
            <button className="archived-header-close" onClick={() => setShowArchivedPanel(false)} aria-label="Close">
              ×
            </button>
          </div>
          
          <div className="archived-sessions-content">
            {archivedSessions.length === 0 ? (
              <div className="archived-empty-state">
                <svg width="48" height="48" viewBox="0 0 22 22" fill="none" className="archived-empty-svg">
                  <rect x="2" y="6" width="18" height="13" rx="2.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M2 9h18" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <rect x="6" y="3" width="10" height="4" rx="1.5" fill="currentColor" opacity="0.3" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <p>No archived sessions</p>
              </div>
            ) : (
              <div className="archived-sessions-list">
                {archivedSessions.map((session) => (
                  <div key={session.session_id} className="archived-session-card">
                    <div className="archived-card-header">
                      <div className="archived-card-icon">
                        <svg width="18" height="18" viewBox="0 0 22 22" fill="none" className="archived-card-svg">
                          <rect x="2" y="6" width="18" height="13" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M2 9h18" stroke="currentColor" strokeWidth="1.6" />
                          <path d="M8 13h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          <rect x="6" y="3" width="10" height="4" rx="1.5" fill="currentColor" opacity="0.4" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </div>
                      <div className="archived-card-title">
                        <h3>{session.session_name}</h3>
                        <p className="archived-card-code">{session.session_code}</p>
                      </div>
                      <span className="archived-badge">Archived</span>
                    </div>
                    
                    <div className="archived-card-dates">
                      <svg width="14" height="14" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                        <rect x="2" y="4" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
                        <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                      <span>{formatDate(session.academic_year_start_date)} – {formatDate(session.academic_year_end_date)}</span>
                    </div>
                    
                    <div className="archived-card-meta">
                      <span className="archived-meta-label">Archived on:</span>
                      <span className="archived-meta-value">{formatDate(session.updated_at)}</span>
                    </div>
                    
                    <div className="archived-card-actions">
                      <Button
                        className="reactivate-btn"
                        onClick={() => handleReactivateSession(session)}
                      >
                        Reactivate Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="archived-sessions-footer">
            <Button variant="secondary" onClick={() => setShowArchivedPanel(false)}>
              Close
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Overlap Conflict Modal */}
      <CenterModal 
        isShow={showOverlapModal} 
        onClose={() => {
          setShowOverlapModal(false);
          setOverlappingSessions([]);
          setSessionToReactivate(null);
        }}
        size="large"
      >
        <div className="overlap-modal-container">
          <div className="overlap-modal-header">
            <div className="overlap-warning-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 21h20L12 3z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M12 9v5" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="17.5" r="1" fill="#111111" />
              </svg>
            </div>
            <h2>Date Overlap Detected</h2>
            <p>The session you're trying to reactivate overlaps with the following active session(s):</p>
          </div>

          <div className="overlap-modal-content">
            <div className="overlap-sessions-row">
              {sessionToReactivate && (
                <div className="reactivating-session-info">
                  <h3>Reactivating:</h3>
                <div className="session-info-card highlight">
                  {/* mirrors asl-card layout */}
                  <div className="asl-card-header">
                    <div className="asl-card-icon">
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <rect x="2" y="4" width="18" height="15" rx="2.5" fill="white" opacity="0.15" stroke="white" strokeWidth="1.7" />
                        <path d="M7 2v4M15 2v4" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M2 9h18" stroke="white" strokeWidth="1.5" opacity="0.6" />
                        <rect x="6" y="12" width="4" height="4" rx="1" fill="white" />
                        <rect x="12" y="12" width="4" height="4" rx="1" fill="white" opacity="0.4" />
                      </svg>
                    </div>
                    <div className="asl-card-header-right">
                      <div className={`session-status ${sessionToReactivate.session_status}`}>
                        {/* {getStatusIcon(sessionToReactivate.session_status)} */}
                        <span>{sessionToReactivate.session_status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="asl-card-body">
                    <h3 className="asl-card-title">{sessionToReactivate.session_name}</h3>
                    <p className="asl-card-code">{sessionToReactivate.session_code}</p>
                    <div className="asl-card-dates">
                      <div className="asl-date-item">
                        <span className="asl-date-label">Start Date</span>
                        <span className="asl-date-value">{formatDate(sessionToReactivate.academic_year_start_date)}</span>
                      </div>
                      <div className="asl-date-divider" />
                      <div className="asl-date-item">
                        <span className="asl-date-label">End Date</span>
                        <span className="asl-date-value">{formatDate(sessionToReactivate.academic_year_end_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="asl-card-footer">
                    <span className="asl-view-link">Reactivating this session</span>
                  </div>
                </div>
              </div>
            )}

            <div className="overlapping-sessions-info">
              <h3>Overlapping with:</h3>
              <div className="overlapping-list">
                {overlappingSessions.map((session) => (
                  <div key={session.session_id} className="asl-card" style={{ cursor: "default" }}>
                    <div className="asl-card-header">
                      <div className="asl-card-icon">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                          <rect x="2" y="4" width="18" height="15" rx="2.5" fill="white" opacity="0.15" stroke="white" strokeWidth="1.7" />
                          <path d="M7 2v4M15 2v4" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
                          <path d="M2 9h18" stroke="white" strokeWidth="1.5" opacity="0.6" />
                          <rect x="6" y="12" width="4" height="4" rx="1" fill="white" />
                          <rect x="12" y="12" width="4" height="4" rx="1" fill="white" opacity="0.4" />
                        </svg>
                      </div>
                      <div className="asl-card-header-right">
                        <div className={`session-status ${session.session_status}`}>
                          {/* {getStatusIcon(session.session_status)} */}
                          <span>{session.session_status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="asl-card-body">
                      <h3 className="asl-card-title">{session.session_name}</h3>
                      <p className="asl-card-code">{session.session_code}</p>
                      <div className="asl-card-dates">
                        <div className="asl-date-item">
                          <span className="asl-date-label">Start Date</span>
                          <span className="asl-date-value">{formatDate(session.academic_year_start_date)}</span>
                        </div>
                        <div className="asl-date-divider" />
                        <div className="asl-date-item">
                          <span className="asl-date-label">End Date</span>
                          <span className="asl-date-value">{formatDate(session.academic_year_end_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="asl-card-footer">
                      <span className="asl-view-link">Will be archived</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>{/* end overlap-sessions-row */}

            <div className="overlap-modal-warning">
              <div className="overlap-warning-icon-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L2 21h20L12 3z" fill="#111111" opacity="0.12" stroke="#111111" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 9v5" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="17.5" r="1" fill="#111111" />
                </svg>
              </div>
              <div>
                <h4>Action Required</h4>
                <p>
                  To reactivate "{sessionToReactivate?.session_name}", you must first archive the {overlappingSessions.length} overlapping session{overlappingSessions.length > 1 ? 's' : ''}.
                </p>
                <p className="warning-note">
                  This will archive the overlapping session{overlappingSessions.length > 1 ? 's' : ''} and then reactivate "{sessionToReactivate?.session_name}".
                </p>
              </div>
            </div>
          </div>

          <div className="overlap-modal-footer">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowOverlapModal(false);
                setOverlappingSessions([]);
                setSessionToReactivate(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="overlap-confirm-btn"
              onClick={handleArchiveOverlappingAndReactivate}
            >
              Archive {overlappingSessions.length} & Reactivate
            </Button>
          </div>
        </div>
      </CenterModal>
    </div>
  );
};

export default AcademicSessionList;
