import React from "react";
import "./SeasionOverview.css";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import CenterModal from "../../../../components/CenterModal/CenterModal";
import Button from "../../../../components/Button/Button";
import FormInput from "../../../../components/FormInput";
import LoadingData from "../../../../components/LoadingData";
import ArchiveSessionPanel from "../../../../components/ArchiveSessionPanel/ArchiveSessionPanel";
import { useSession, useSubsession } from "../../../../api_call";
import AddSubsessionPanel from "./AddSubsessionPanel";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { formatDate } from "../../../../services/dateFormarter";
import InnerTabCon from "../../../../components/InnerTabCon/InnerTabCon";

const SeasionOverview = () => {
  const { schoolId, seasionId } = useParams();
  const { getSessionById } = useSession();
  const { getSubsessionsBySessionId, updateSubsession, createSubsession, deleteSubsession } = useSubsession();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canCreate = isSuperAdmin || !!admin?.permissions?.academic_sessions?.create;
  const canEdit   = isSuperAdmin || !!admin?.permissions?.academic_sessions?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.academic_sessions?.delete;

  const [sessionData, setSessionData] = useState(null);
  const [subsessions, setSubsessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [editingSubsession, setEditingSubsession] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(null);
  const [showArchivePanel, setShowArchivePanel] = useState(false);
  const [archivingSubsession, setArchivingSubsession] = useState(null);
  const [showArchivedPanel, setShowArchivedPanel] = useState(false);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [overlappingSubsessions, setOverlappingSubsessions] = useState([]);
  const [subsessionToReactivate, setSubsessionToReactivate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [addFormData, setAddFormData] = useState({
    name: "",
    code: "",
    startDate: "",
    endDate: "",
    gradingTemplateId: null,
    gradingTemplateName: null,
  });
  const [addFormErrors, setAddFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionResult = await getSessionById(seasionId);
        if (!sessionResult.success) {
          throw new Error(sessionResult.message || "Failed to fetch session");
        }
        setSessionData(sessionResult.data);
        const subsessionsResult = await getSubsessionsBySessionId(seasionId);
        if (!subsessionsResult.success) {
          throw new Error(subsessionsResult.message || "Failed to fetch subsessions");
        }
        // Sort subsessions by start date (ascending - earliest first for terms)
        const sortedSubsessions = (subsessionsResult.data || []).sort((a, b) => {
          const dateA = new Date(a.term_start_date);
          const dateB = new Date(b.term_start_date);
          return dateA - dateB; // Earliest first (First Term, Second Term, etc.)
        });
        setSubsessions(sortedSubsessions);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (schoolId && seasionId) {
      fetchData();
    }
  }, [schoolId, seasionId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.subsession-actions-dropdown')) {
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

  const handleEditSubsession = (subsessionIndex, subsession) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit subsessions.", "error");
      setShowActionDropdown(null);
      return;
    }
    setEditingSubsession(subsession); // Store the subsession object, not the index
    setEditFormData({
      name: subsession.term_name,
      startDate: subsession.term_start_date,
      endDate: subsession.term_end_date,
    });
    setShowEditMenu(true);
    setShowActionDropdown(null);
  };

  const handleOpenArchivePanel = (subsessionIndex, subsession) => {
    if (!canDelete) {
      addNotification("You do not have permission to archive subsessions.", "error");
      setShowActionDropdown(null);
      return;
    }
    setArchivingSubsession({ index: subsessionIndex, data: subsession });
    setShowArchivePanel(true);
    setShowActionDropdown(null);
  };

  const handleArchiveSubsession = async () => {
    if (!archivingSubsession) return;
    
    const subsession = subsessions[archivingSubsession.index];
    if (!subsession) return;

    const isDraft = subsession.term_status === "draft";
    let result;

    if (isDraft) {
      // Delete draft subsession permanently
      result = await deleteSubsession(subsession.term_id, user?.admin?.admin_id || user?.user_id);
    } else {
      // Archive active/completed subsession
      result = await updateSubsession(subsession.term_id, {
        term_status: "archived",
        is_archived: true,
        modified_by: user?.admin?.admin_id || user?.user_id,
      });
    }

    if (result.success) {
      const action = isDraft ? "deleted" : "archived";
      addNotification(`Subsession ${action} successfully!`, "success");
      setShowArchivePanel(false);
      setArchivingSubsession(null);
      
      // Reload the page to refresh all components including APTtab
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to show the notification
    } else {
      addNotification(`Failed to ${isDraft ? "delete" : "archive"} subsession: ${result.message}`, "error");
    }
  };

  const handleReactivateSubsession = async (subsession) => {
    // Validate dates are within session dates
    if (sessionData) {
      const subStart = new Date(subsession.term_start_date);
      const subEnd = new Date(subsession.term_end_date);
      const sessionStart = new Date(sessionData.academic_year_start_date);
      const sessionEnd = new Date(sessionData.academic_year_end_date);

      if (subStart < sessionStart || subEnd > sessionEnd) {
        addNotification(
          "Cannot reactivate: Subsession dates are outside the session date range",
          "error"
        );
        return;
      }
    }

    // Find all overlapping active subsessions
    const activeSubsessions = subsessions.filter(sub => !sub.is_archived && sub.term_id !== subsession.term_id);
    
    const subStart = new Date(subsession.term_start_date);
    const subEnd = new Date(subsession.term_end_date);

    const overlapping = activeSubsessions.filter((otherSub) => {
      if (!otherSub.term_start_date || !otherSub.term_end_date) return false;

      const otherStart = new Date(otherSub.term_start_date);
      const otherEnd = new Date(otherSub.term_end_date);

      // Check if dates overlap
      return (subStart < otherEnd && subEnd > otherStart);
    });

    if (overlapping.length > 0) {
      // Close the archived panel and show modal with overlapping subsessions
      console.log("Found overlapping subsessions:", overlapping);
      console.log("Number of overlapping:", overlapping.length);
      setShowArchivedPanel(false);
      setOverlappingSubsessions(overlapping);
      setSubsessionToReactivate(subsession);
      setShowOverlapModal(true);
      return;
    }

    // No overlaps, proceed with reactivation
    await performReactivation(subsession);
  };

  const performReactivation = async (subsession) => {
    const result = await updateSubsession(subsession.term_id, {
      is_archived: false,
      term_status: "draft",
      modified_by: user?.admin?.admin_id || user?.user_id,
    });

    if (result.success) {
      addNotification("Subsession reactivated successfully!", "success");
      setShowArchivedPanel(false);
      
      // Reload the page to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      addNotification(`Failed to reactivate subsession: ${result.message}`, "error");
    }
  };

  const handleArchiveOverlappingAndReactivate = async () => {
    try {
      // Archive overlapping subsessions SEQUENTIALLY to avoid race conditions
      for (const sub of overlappingSubsessions) {
        const result = await updateSubsession(sub.term_id, {
          is_archived: true,
          term_status: "archived",
          modified_by: user?.admin?.admin_id || user?.user_id,
        });
        
        if (!result.success) {
          addNotification(`Failed to archive "${sub.term_name}"`, "error");
          return;
        }
      }

      // Now reactivate the target subsession
      await performReactivation(subsessionToReactivate);
      setShowOverlapModal(false);
      setOverlappingSubsessions([]);
      setSubsessionToReactivate(null);
    } catch (error) {
      console.error("Error in archive and reactivate:", error);
      addNotification("Error archiving overlapping subsessions", "error");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSubsession) return; // Check if subsession object exists
    const subsession = editingSubsession; // Use the subsession object directly

    // Validate dates are within session dates
    if (sessionData) {
      const subStart = new Date(editFormData.startDate);
      const subEnd = new Date(editFormData.endDate);
      const sessionStart = new Date(sessionData.academic_year_start_date);
      const sessionEnd = new Date(sessionData.academic_year_end_date);

      if (subStart < sessionStart || subEnd > sessionEnd) {
        addNotification("Subsession dates must be within session date range", "error");
        return;
      }
    }

    // Check if start date is before end date
    const subStart = new Date(editFormData.startDate);
    const subEnd = new Date(editFormData.endDate);
    
    if (subStart >= subEnd) {
      addNotification("Start date must be before end date", "error");
      return;
    }

    // Check for overlaps with other active subsessions (exclude current subsession and archived ones)
    const otherActiveSubsessions = subsessions.filter(
      sub => !sub.is_archived && sub.term_id !== subsession.term_id
    );

    const hasOverlap = otherActiveSubsessions.some((otherSub) => {
      if (!otherSub.term_start_date || !otherSub.term_end_date) return false;

      const otherStart = new Date(otherSub.term_start_date);
      const otherEnd = new Date(otherSub.term_end_date);

      // Check if dates overlap: start1 < end2 AND end1 > start2
      const overlaps = (subStart < otherEnd && subEnd > otherStart);
      
      if (overlaps) {
        addNotification(`Dates overlap with "${otherSub.term_name}"`, "error");
      }
      
      return overlaps;
    });

    if (hasOverlap) return;

    // Proceed with update
    const result = await updateSubsession(subsession.term_id, {
      term_name: editFormData.name,
      term_start_date: editFormData.startDate,
      term_end_date: editFormData.endDate,
      modified_by: user?.admin?.admin_id || user?.user_id,
    });
    
    if (result.success) {
      // Find and update the subsession by term_id instead of index
      const updatedSubsessions = subsessions.map(sub => 
        sub.term_id === result.data.term_id ? result.data : sub
      );
      setSubsessions(updatedSubsessions);
      setShowEditMenu(false);
      addNotification("Subsession updated successfully!", "success");
    } else {
      addNotification(`Failed to update subsession: ${result.message}`, "error");
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddInputChange = (field, value) => {
    setAddFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on change
    validateAddSubsession(field, value);
  };

  const validateAddSubsession = (field, value) => {
    const updatedData = { ...addFormData, [field]: value };
    const errors = {};

    // Check if dates are within session dates
    if (updatedData.startDate && sessionData?.academic_year_start_date) {
      const subStart = new Date(updatedData.startDate);
      const sessionStart = new Date(sessionData.academic_year_start_date);
      
      if (subStart < sessionStart) {
        errors.startDate = "Subsession start date must be within session dates";
      }
    }

    if (updatedData.endDate && sessionData?.academic_year_end_date) {
      const subEnd = new Date(updatedData.endDate);
      const sessionEnd = new Date(sessionData.academic_year_end_date);
      
      if (subEnd > sessionEnd) {
        errors.endDate = "Subsession end date must be within session dates";
      }
    }

    // Check if start date is before end date
    if (updatedData.startDate && updatedData.endDate) {
      const subStart = new Date(updatedData.startDate);
      const subEnd = new Date(updatedData.endDate);
      
      if (subStart >= subEnd) {
        errors.startDate = "Start date must be before end date";
      }
    }

    // Check for overlaps with existing subsessions (exclude archived subsessions)
    subsessions.filter(sub => !sub.is_archived).forEach((otherSub) => {
      if (!otherSub.term_start_date || !otherSub.term_end_date) return;
      if (!updatedData.startDate || !updatedData.endDate) return;

      const subStart = new Date(updatedData.startDate);
      const subEnd = new Date(updatedData.endDate);
      const otherStart = new Date(otherSub.term_start_date);
      const otherEnd = new Date(otherSub.term_end_date);

      // Check if dates overlap: start1 < end2 AND end1 > start2
      // This allows subsessions to touch at boundaries
      const overlaps = (subStart < otherEnd && subEnd > otherStart);
      
      if (overlaps) {
        errors.overlap = `Dates overlap with ${otherSub.term_name}`;
      }
    });

    setAddFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubsession = () => {
    if (!canCreate) {
      addNotification("You do not have permission to create subsessions.", "error");
      return;
    }
    setAddFormData({ name: "", code: "", startDate: "", endDate: "", gradingTemplateId: null, gradingTemplateName: null });
    setAddFormErrors({});
    setShowAddMenu(true);
  };

  const handleSaveAdd = async () => {
    if (!addFormData.name || !addFormData.code || !addFormData.startDate || !addFormData.endDate) {
      addNotification("All fields are required", "error");
      return;
    }

    // Check if template is selected
    if (!addFormData.gradingTemplateId) {
      addNotification("A template is required", "error");
      return;
    }

    // Validate before saving
    const isValid = validateAddSubsession("endDate", addFormData.endDate);
    if (!isValid) {
      return;
    }

    const result = await createSubsession({
      school_id: schoolId,
      session_id: seasionId,
      term_name: addFormData.name,
      term_code: addFormData.code,
      term_start_date: addFormData.startDate,
      term_end_date: addFormData.endDate,
      term_status: "draft",
      grading_template_id: addFormData.gradingTemplateId,
      grading_template_name: addFormData.gradingTemplateName,
      created_by: user?.admin?.admin_id || user?.user_id,
      created_by_name: user?.admin?.username || user?.admin?.full_name || null,
      created_by_role: "admin",
    });

    if (result.success) {
      setSubsessions([...subsessions, result.data]);
      setShowAddMenu(false);
      setAddFormData({ 
        name: "", 
        code: "", 
        startDate: "", 
        endDate: "",
        gradingTemplateId: null,
        gradingTemplateName: null,
      });
      setAddFormErrors({});
      addNotification("Subsession created successfully!", "success");
    } else {
      addNotification(`Failed to create subsession: ${result.message}`, "error");
    }
  };

  // Filter active and archived subsessions
  const activeSubsessions = subsessions.filter(sub => !sub.is_archived);
  const archivedSubsessions = subsessions.filter(sub => sub.is_archived);

  return (
    <div className="so">
      {loading ? (
        <LoadingData message="Loading session data..." />
      ) : error ? (
        <div className="so-error">
          <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M11 7v5M11 15v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Error Loading Session</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <InnerTabCon>
            <>
              {/* ── Stat cards ── */}
          <div className="sotp">
            <div className="sotpi">
              <div className="so-card-ico">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="15" rx="2.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                  <rect x="6" y="12" width="4" height="4" rx="1" fill="currentColor"/>
                </svg>
              </div>
              <div className="so-card-body">
                <span className="so-card-label">Session Period</span>
                <span className="so-card-value">{sessionData?.session_name || "N/A"}</span>
                <span className="so-card-sub">{formatDate(sessionData?.academic_year_start_date)} – {formatDate(sessionData?.academic_year_end_date)}</span>
              </div>
            </div>
            <div className="sotpi">
              <div className="so-card-ico">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <circle cx="8" cy="7" r="3.5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="16" cy="7" r="2.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M19 19c0-2.2-1.3-4-3-4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </div>
              <div className="so-card-body">
                <span className="so-card-label">Total Students</span>
                <span className="so-card-value">—</span>
                <span className="so-card-sub">Enrolled in this session</span>
              </div>
            </div>
            <div className="sotpi">
              <div className="so-card-ico">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M4 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M8 12h6M8 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="so-card-body">
                <span className="so-card-label">Subsessions</span>
                <span className="so-card-value">{activeSubsessions.length}</span>
                <span className="so-card-sub">{archivedSubsessions.length} archived</span>
              </div>
            </div>
          </div>
          {/* ── Subsessions header ── */}
          <div className="subsession_header_pr">
            <div className="so-section-title">
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="4" width="18" height="15" rx="2.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
              </svg>
              <p className="subsession_title_pr">Subsessions</p>
            </div>
            <div className="subsession_header_actions">
              {archivedSubsessions.length > 0 && (
                <button onClick={() => setShowArchivedPanel(true)} className="view_archived_btn_pr">
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="6" width="18" height="13" rx="2" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
                    <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  Archived ({archivedSubsessions.length})
                </button>
              )}
              {sessionData?.session_status !== "completed" && (
                <button onClick={handleAddSubsession} className="add_subsession_btn_pr">
                  <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v14M4 11h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                  </svg>
                  Add Subsession
                </button>
              )}
            </div>
          </div>
          
          {activeSubsessions.length === 0 ? (
            <div className="Op_p_empty_subsessions_pr">
              <div className="Op_p_empty_icon_pr">
                <svg width="32" height="32" viewBox="0 0 22 22" fill="none">
                  <rect x="2" y="4" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.4"/>
                  <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.4"/>
                  <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                  <path d="M11 12v4M9 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <h3 className="Op_p_empty_title_pr">No Subsessions Yet</h3>
              <p className="Op_p_empty_description_pr">
                {sessionData?.session_status === "completed"
                  ? "This completed session doesn't have any subsessions."
                  : "No subsessions yet. Create your first term to start organizing the academic calendar."}
              </p>
              {sessionData?.session_status !== "completed" && (
                <div className="Op_p_empty_action_pr">
                  <Button onClick={handleAddSubsession}>+ Create First Subsession</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="sots">
              {activeSubsessions.map((item, index) => (
                <div key={item.term_id} className="sotsit">
                  <div className="sottopsec">
                    <div className="soticonsec">
                      <span className="so-term-num">{index + 1}</span>
                    </div>
                    <div className="sottitlesec">
                      <h2>{item.term_name}</h2>
                      <p>
                        <svg width="11" height="11" viewBox="0 0 22 22" fill="none" style={{marginRight:4,verticalAlign:"middle"}}>
                          <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/>
                          <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                          <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        {formatDate(item.term_start_date)} – {formatDate(item.term_end_date)}
                      </p>
                    </div>
                    <div className="sotstatussection">
                      <span className={`so-status-pill so-status-${item.term_status}`}>{item.term_status}</span>
                      <div className="subsession-actions-dropdown">
                        <button
                          className="action-menu-btn"
                          onClick={(e) => { e.stopPropagation(); setShowActionDropdown(showActionDropdown === index ? null : index); }}
                          title="Actions"
                        >
                          <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="5" r="1.5" fill="currentColor"/>
                            <circle cx="11" cy="11" r="1.5" fill="currentColor"/>
                            <circle cx="11" cy="17" r="1.5" fill="currentColor"/>
                          </svg>
                        </button>
                        {showActionDropdown === index && (
                          <div className="action-dropdown-menu">
                            <button className="action-dropdown-item" onClick={(e) => { e.stopPropagation(); handleEditSubsession(index, item); }}>
                              <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                                <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button className="action-dropdown-item action-dropdown-item-danger" onClick={(e) => { e.stopPropagation(); handleOpenArchivePanel(index, item); }} disabled={item.term_status === "archived"}>
                              <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                                <rect x="2" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                                <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M7 3h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                              </svg>
                              <span>{item.term_status === "draft" ? "Delete" : "Archive"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="subsession-templates-display">
                    <div className="template-display-item">
                      <div className="template-display-icon">
                        <svg width="15" height="15" viewBox="0 0 22 22" fill="none">
                          <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1.6"/>
                          <path d="M13 2v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          <path d="M7 13h2v3H7zM10 11h2v5h-2zM13 15h2v1h-2z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className="template-display-content">
                        <div className="template-display-label">Grading Template</div>
                        <div className="template-display-value">{item.grading_template_name || "Not assigned"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
        </InnerTabCon>

          <SlideInMenu isShow={showEditMenu} onClose={() => setShowEditMenu(false)} width="500px">
            <div className="edit-subsession-container">
              <div className="edit-subsession-header">
                <h2>Edit Subsession</h2>
                <p>Update subsession details and dates</p>
                {sessionData?.session_name && (
                  <div className="Op_p_session_info_pr">
                    <span className="Op_p_session_label_pr">Session:</span>
                    <span className="Op_p_session_name_pr">{sessionData.session_name}</span>
                  </div>
                )}
              </div>
              <div className="edit-subsession-form">
                <FormInput label="Subsession Name *" type="text" value={editFormData.name} onChange={(value) => handleEditInputChange("name", value)} placeholder="e.g., First Term" />
                <FormInput label="Start Date *" type="date" value={editFormData.startDate} onChange={(value) => handleEditInputChange("startDate", value)} />
                <FormInput label="End Date *" type="date" value={editFormData.endDate} onChange={(value) => handleEditInputChange("endDate", value)} />
              </div>
              <div className="edit-subsession-footer">
                <Button variant="secondary" onClick={() => setShowEditMenu(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={!editFormData.name || !editFormData.startDate || !editFormData.endDate}>Save Changes</Button>
              </div>
            </div>
          </SlideInMenu>

          <AddSubsessionPanel isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} formData={addFormData} formErrors={addFormErrors} onInputChange={handleAddInputChange} onSave={handleSaveAdd} sessionName={sessionData?.session_name} schoolId={schoolId} />

          <ArchiveSessionPanel isOpen={showArchivePanel} onClose={() => setShowArchivePanel(false)} onConfirm={handleArchiveSubsession} sessionData={archivingSubsession?.data} type="subsession" mode={archivingSubsession?.data?.term_status === "draft" ? "delete" : "archive"} />

          <SlideInMenu isShow={showArchivedPanel} onClose={() => setShowArchivedPanel(false)} width="700px">
            <div className="archived-subsessions-container">
              <div className="archived-subsessions-header">
                <div className="archived-header-icon">
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="2" y="6" width="18" height="13" rx="2" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.6"/>
                    <path d="M2 10h18" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
                    <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="archived-header-text">
                  <h2>Archived Subsessions</h2>
                  <p>View and restore archived subsessions</p>
                </div>
              </div>
              <div className="archived-subsessions-content">
                {archivedSubsessions.length === 0 ? (
                  <div className="archived-empty-state">
                    <svg width="40" height="40" viewBox="0 0 22 22" fill="none" style={{opacity:0.3}}>
                      <rect x="2" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                      <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    </svg>
                    <p>No archived subsessions</p>
                  </div>
                ) : (
                  <div className="archived-subsessions-list">
                    {archivedSubsessions.map((item) => (
                      <div key={item.term_id} className="archived-subsession-card">
                        <div className="archived-card-header">
                          <div className="archived-card-icon">
                            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                              <rect x="2" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                              <path d="M7 3h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="archived-card-title">
                            <h3>{item.term_name}</h3>
                            <p className="archived-card-code">{item.term_code}</p>
                          </div>
                          <span className="archived-badge">Archived</span>
                        </div>
                        <div className="archived-card-dates">
                          <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                            <rect x="2" y="4" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                            <path d="M7 2v4M15 2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            <path d="M2 9h18" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          <span>{formatDate(item.term_start_date)} – {formatDate(item.term_end_date)}</span>
                        </div>
                        <div className="archived-card-templates">
                          <div className="archived-template-item">
                            <svg width="13" height="13" viewBox="0 0 22 22" fill="none">
                              <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                              <path d="M13 2v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                            </svg>
                            <span>{item.grading_template_name || "No grading template"}</span>
                          </div>
                        </div>
                        <div className="archived-card-meta">
                          <span className="archived-meta-label">Archived:</span>
                          <span className="archived-meta-value">{formatDate(item.updated_at)}</span>
                        </div>
                        <div className="archived-card-actions">
                          <Button onClick={() => handleReactivateSubsession(item)} style={{ width: "100%" }}>Reactivate Subsession</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="archived-subsessions-footer">
                <Button variant="secondary" onClick={() => setShowArchivedPanel(false)}>Close</Button>
              </div>
            </div>
          </SlideInMenu>

          <CenterModal isShow={showOverlapModal} onClose={() => { setShowOverlapModal(false); setOverlappingSubsessions([]); setSubsessionToReactivate(null); }} size="large">
            <div className="overlap-modal-container">
              <div className="overlap-modal-header">
                <svg width="40" height="40" viewBox="0 0 22 22" fill="none" style={{margin:"0 auto 12px",display:"block"}}>
                  <path d="M11 3l8.5 15H2.5L11 3z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M11 9v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="11" cy="16" r="1" fill="#f59e0b"/>
                </svg>
                <h2>Date Overlap Detected</h2>
                <p>The subsession you're reactivating overlaps with existing active subsessions.</p>
              </div>
              <div className="overlap-modal-content">
                {subsessionToReactivate && (
                  <div className="reactivating-subsession-info">
                    <h3>Reactivating:</h3>
                    <div className="subsession-info-card highlight">
                      <div className="subsession-info-name">{subsessionToReactivate.term_name}</div>
                      <div className="subsession-info-dates">{formatDate(subsessionToReactivate.term_start_date)} – {formatDate(subsessionToReactivate.term_end_date)}</div>
                    </div>
                  </div>
                )}
                <div className="overlapping-subsessions-info">
                  <h3>Overlapping with:</h3>
                  <div className="overlapping-list">
                    {overlappingSubsessions.map((sub) => (
                      <div key={sub.term_id} className="subsession-info-card">
                        <div className="subsession-info-header">
                          <div className="subsession-info-name">{sub.term_name}</div>
                          <span className="subsession-info-status">{sub.term_status}</span>
                        </div>
                        <div className="subsession-info-dates">{formatDate(sub.term_start_date)} – {formatDate(sub.term_end_date)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="overlap-modal-warning">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none" style={{flexShrink:0,marginTop:2}}>
                    <path d="M11 3l8.5 15H2.5L11 3z" fill="#f59e0b" opacity="0.15" stroke="#f59e0b" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M11 9v4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="11" cy="16" r="1" fill="#f59e0b"/>
                  </svg>
                  <div>
                    <h4>Action Required</h4>
                    <p>To reactivate "{subsessionToReactivate?.term_name}", the {overlappingSubsessions.length} overlapping subsession{overlappingSubsessions.length > 1 ? "s" : ""} will be archived first.</p>
                    <p className="warning-note">This action cannot be undone.</p>
                  </div>
                </div>
              </div>
              <div className="overlap-modal-footer">
                <Button variant="secondary" onClick={() => { setShowOverlapModal(false); setOverlappingSubsessions([]); setSubsessionToReactivate(null); }}>Cancel</Button>
                <Button onClick={handleArchiveOverlappingAndReactivate}>Archive {overlappingSubsessions.length} & Reactivate</Button>
              </div>
            </div>
          </CenterModal>
        </>
      )}
    </div>
  );
};

export default SeasionOverview;
