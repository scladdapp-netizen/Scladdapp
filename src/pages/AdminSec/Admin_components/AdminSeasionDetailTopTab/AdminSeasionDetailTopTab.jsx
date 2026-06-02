import React, { useEffect, useState } from "react";
import "./AdminSeasionDetailTopTab.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import DynamicForm from "../../../../components/DynamicForm/DynamicForm";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";
import ArchiveSessionPanel from "../../../../components/ArchiveSessionPanel/ArchiveSessionPanel";
import { formatDate } from "../../../../services/dateFormarter";
import { useSession } from "../../../../api_call/useSession";
import { useSubsession } from "../../../../api_call/useSubsession";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import { FaEdit, FaEllipsisV, FaBan } from "react-icons/fa";

const AdminSeasionDetailTopTab = ({
  children,
  fields,
  route,
  data,
  type = "seasion",
  subseasionId,
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [subsessionData, setSubsessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [showArchivePanel, setShowArchivePanel] = useState(false);

  const navigate = useNavigate();
  const { schoolId, seasionId } = useParams();
  const location = useLocation();
  const { getSessionById, updateSession, deleteSession } = useSession();
  const { getSubsessionById, updateSubsession, deleteSubsession } = useSubsession();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  // Permission helpers
  const admin = user?.admin;
  console.log("🔍 [AdminSeasionDetailTopTab] user:", JSON.stringify(user));
  console.log("🔍 [AdminSeasionDetailTopTab] user.admin:", JSON.stringify(admin));
  console.log("🔍 [AdminSeasionDetailTopTab] user.admin.admin_id:", admin?.admin_id);
  console.log("🔍 [AdminSeasionDetailTopTab] user.user_id:", user?.user_id);
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit   = isSuperAdmin || !!admin?.permissions?.academic_sessions?.edit;
  const canDelete = isSuperAdmin || !!admin?.permissions?.academic_sessions?.delete;

  // Fetch session or subsession data
  useEffect(() => {
    if (type === "seasion" && seasionId) {
      fetchSessionData();
    } else if (type !== "seasion" && subseasionId && subseasionId !== "") {
      fetchSubsessionData();
    }
  }, [seasionId, subseasionId, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-wrapper')) {
        setShowActionDropdown(false);
      }
    };

    if (showActionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showActionDropdown]);

  const fetchSessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSessionById(seasionId);
      if (result.success) {
        setSessionData(result.data);
      } else {
        setError(result.message || "Failed to load session");
      }
    } catch (err) {
      setError("An error occurred while loading session");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubsessionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSubsessionById(subseasionId);
      if (result.success) {
        setSubsessionData(result.data);
      } else {
        setError(result.message || "Failed to load subsession");
      }
    } catch (err) {
      setError("An error occurred while loading subsession");
    } finally {
      setLoading(false);
    }
  };

  // console.log(subseasionId);

  const handleArchive = async () => {
    try {
      let result;
      const isDraft = displayStatus === "draft";
      
      if (type === "seasion") {
        if (isDraft) {
          // Delete draft session permanently
          result = await deleteSession(seasionId, user?.admin?.admin_id || user?.user_id);
        } else {
          // Archive active/completed session
          result = await updateSession(seasionId, {
            session_status: "archived",
            is_archived: true,
            modified_by: user?.admin?.admin_id || user?.user_id,
          });
        }
      } else {
        if (isDraft) {
          // Delete draft subsession permanently
          result = await deleteSubsession(subseasionId, user?.admin?.admin_id || user?.user_id);
        } else {
          // Archive active/completed subsession
          result = await updateSubsession(subseasionId, {
            term_status: "archived",
            is_archived: true,
            modified_by: user?.admin?.admin_id || user?.user_id,
          });
        }
      }

      if (result.success) {
        const action = isDraft ? "deleted" : "archived";
        addNotification(`${type === "seasion" ? "Session" : "Subsession"} ${action} successfully!`, "success");
        setShowArchivePanel(false);
        
        // Navigate back to sessions list
        setTimeout(() => {
          navigate(`/admin/${schoolId}/acedemic_seasion`);
        }, 500);
      } else {
        addNotification(`Failed to ${isDraft ? "delete" : "archive"}: ${result.message}`, "error");
      }
    } catch (err) {
      addNotification("An error occurred", "error");
    }
  };

  const isActive = (link) => {
    const base =
      type === "seasion"
        ? `/admin/${schoolId}/acedemic_seasion/sd/${seasionId}`
        : subseasionId
        ? `/admin/${schoolId}/acedemic_seasion/ssd/${seasionId}${link}/${subseasionId}`
        : `/admin/${schoolId}/acedemic_seasion/ssd/${seasionId}${link}`;

    return type === "seasion"
      ? location.pathname === `${base}${link}`
      : location.pathname.startsWith(base);
  };

  const handleSubmit = async (formData) => {
    console.log("UPDATE SESSION:", seasionId, formData);

    try {
      let result;
      if (type === "seasion") {
        // Map form field names to backend field names
        const mappedData = {
          session_name: formData.name,
          session_code: sessionData?.session_code, // Keep existing code
          academic_year_start_date: formData.startDate,
          academic_year_end_date: formData.endDate,
          modified_by: user?.admin?.admin_id || user?.user_id,
        };
        result = await updateSession(seasionId, mappedData);
      } else {
        // Map subsession field names
        const mappedData = {
          term_name: formData.name,
          term_code: subsessionData?.term_code,
          term_start_date: formData.startDate,
          term_end_date: formData.endDate,
          modified_by: user?.admin?.admin_id || user?.user_id,
        };
        result = await updateSubsession(subseasionId, mappedData);
      }

      if (result.success) {
        // Refresh data after update
        if (type === "seasion") {
          await fetchSessionData();
        } else {
          await fetchSubsessionData();
        }
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: "Failed to update",
      };
    }
  };

  // Calculate status from raw dates (always accurate, never stale)
  const calcStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return "draft";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (today < start) return "draft";
    if (today > end)   return "completed";
    return "active";
  };

  // Get display data - for subsessions without ID, use the passed data prop
  const displayData = type === "seasion" 
    ? sessionData 
    : (subseasionId && subseasionId !== "" ? subsessionData : data);
    
  const displayName = displayData
    ? type === "seasion"
      ? displayData.session_name
      : displayData.term_name || displayData.name
    : "";
  const displayStartDate = displayData
    ? type === "seasion"
      ? displayData.academic_year_start_date
      : displayData.term_start_date || displayData.startDate
    : "";
  const displayEndDate = displayData
    ? type === "seasion"
      ? displayData.academic_year_end_date
      : displayData.term_end_date || displayData.endDate
    : "";
  const displayStatus = calcStatus(displayStartDate, displayEndDate);

  // Map backend data to form field names
  const formInitialData = displayData ? (
    type === "seasion" ? {
      name: displayData.session_name,
      startDate: displayData.academic_year_start_date,
      endDate: displayData.academic_year_end_date,
    } : {
      name: displayData.term_name || displayData.name,
      startDate: displayData.term_start_date || displayData.startDate,
      endDate: displayData.term_end_date || displayData.endDate,
    }
  ) : null;

  // Loading state - only show for session type or when subsession has valid ID
  if (loading && (type === "seasion" || (type !== "seasion" && subseasionId && subseasionId !== ""))) {
    return (
      <div className="asdttms">
        <div className="asdttts">
          <div className="asdtttstss">
            <div className="asdtttstssts">
              <div className="asdtttstssls">
                <div className="asdttLoading">
                  <div className="asdttSpinner"></div>
                  <p>Loading {type === "seasion" ? "session" : "subsession"}...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - only show for session type or when subsession has valid ID
  if (error && (type === "seasion" || (type !== "seasion" && subseasionId && subseasionId !== ""))) {
    return (
      <div className="asdttms">
        <div className="asdttts">
          <div className="asdtttstss">
            <div className="asdtttstssts">
              <div className="asdtttstssls">
                <div className="asdttError">
                  <p>{error}</p>
                  <Button onClick={() => type === "seasion" ? fetchSessionData() : fetchSubsessionData()}>
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state - only show for session type or when subsession has valid ID
  if (!displayData && (type === "seasion" || (type !== "seasion" && subseasionId && subseasionId !== ""))) {
    return (
      <div className="asdttms">
        <div className="asdttts">
          <div className="asdtttstss">
            <div className="asdtttstssts">
              <div className="asdtttstssls">
                <div className="asdttEmpty">
                  <p>No {type === "seasion" ? "session" : "subsession"} data found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="asdttms">
      <div className="asdttts">
        {/* Decorative elements */}
        <span className="asdttts-deco-circle" aria-hidden="true" />
        <span className="asdttts-deco-box" aria-hidden="true" />

        {/* /////////////////////////////////////////////////////////////////// */}
        <div className="asdtttstss">
          <div className="asdtttstssts">
            <div className="asdtttstssls">
              <h1>
                {displayName}{" "}
                <span className={`asdtttstsslsspn status-${displayStatus}`}>{displayStatus}</span>
              </h1>
              <div className="action-dropdown-wrapper">
                <Button onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                  setShowActionDropdown(!showActionDropdown);
                }}>
                  <FaEllipsisV size={14} />
                </Button>
                
                {showActionDropdown && (
                  <div className="action-dropdown-menu-top" style={{ top: dropdownPos.top, right: dropdownPos.right }}>
                    <button 
                      className="action-dropdown-item"
                      onClick={() => {
                        if (!canEdit) {
                          addNotification("You do not have permission to edit this session.", "error");
                          setShowActionDropdown(false);
                          return;
                        }
                        setIsEditMenuOpen(true);
                        setShowActionDropdown(false);
                      }}
                    >
                      <FaEdit size={14} />
                      <span>Edit {type === "seasion" ? "Session" : "Subsession"}</span>
                    </button>
                    <button 
                      className="action-dropdown-item action-dropdown-item-danger"
                      onClick={() => {
                        if (!canDelete) {
                          addNotification("You do not have permission to archive this session.", "error");
                          setShowActionDropdown(false);
                          return;
                        }
                        setShowArchivePanel(true);
                        setShowActionDropdown(false);
                      }}
                    >
                      <FaBan size={14} />
                      <span>{displayStatus === "draft" ? "Delete" : "Archive"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="sub">
              {formatDate(displayStartDate)} – {formatDate(displayEndDate)} •
              842 students enrolled
            </p>
          </div>
        </div>
        {/* //////////////////////////////////////////////////////////////////////////// */}
        <div className="asdtttsnt">
          <div className="asdtttsntic">
            {route.map((t, i) => (
              <div
                key={i}
                className={`asdtttti ${isActive(t.link) ? "active" : ""}`}
                onClick={() =>
                  type === "seasion"
                    ? navigate(
                        `/admin/${schoolId}/acedemic_seasion/sd/${seasionId}${t.link}`
                      )
                    : navigate(
                        `/admin/${schoolId}/acedemic_seasion/ssd/${seasionId}${t.link}/${subseasionId}`
                      )
                }
              >
                <p
                  className="asdtttttit"
                  style={{ display: "flex", gap: "6px" }}
                >
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <SlideInMenu
        isShow={isEditMenuOpen}
        onClose={() => setIsEditMenuOpen(false)}
        width="450px"
      >
        <DynamicForm
          title={`Edit ${type === "seasion" ? "Academic Session" : "Subsession"}`}
          fields={fields}
          initialData={formInitialData}
          isEdit={true}
          submitButtonText={`Update ${type === "seasion" ? "Session" : "Subsession"}`}
          loadingText="Updating..."
          onSubmit={handleSubmit}
          onCancel={() => setIsEditMenuOpen(false)}
          onSuccess={() => {
            setIsEditMenuOpen(false);
          }}
        />
      </SlideInMenu>
      
      <ArchiveSessionPanel
        isOpen={showArchivePanel}
        onClose={() => setShowArchivePanel(false)}
        onConfirm={handleArchive}
        sessionData={displayData}
        type={type === "seasion" ? "session" : "subsession"}
        mode={displayStatus === "draft" ? "delete" : "archive"}
      />
      
      <div className="asdttcs">{children}</div>
    </div>
  );
};

export default AdminSeasionDetailTopTab;
