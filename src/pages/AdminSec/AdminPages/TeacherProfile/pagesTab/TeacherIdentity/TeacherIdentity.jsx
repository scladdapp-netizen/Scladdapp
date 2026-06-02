import React, { useState, useEffect } from "react";
import "./TeacherIdentity.css";
import TeacherInfoCard from "../../components/teacherInfoCard/TeacherInfoCard";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import Button from "../../../../../../components/Button/Button";
import useTeacherInfo from "../../../../../../api_call/useTeacherInfo";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";

const TeacherIdentity = ({ teacherData, refreshTeacherData }) => {
  const [showAssignments, setShowAssignments]       = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [isTeacherActive, setIsTeacherActive] = useState(
    teacherData?.teacher?.is_active ?? teacherData?.is_active ?? false
  );
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { revokeTeacher, reactivateTeacher, getTeacherAssignmentHistory, loading } = useTeacherInfo();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    setIsTeacherActive(teacherData?.teacher?.is_active ?? teacherData?.is_active ?? false);
  }, [teacherData]);

  useEffect(() => {
    if (!showAssignments) return;
    const tid = teacherData?.teacher?.teacher_id || teacherData?.teacher_id;
    if (!tid) return;
    setLoadingHistory(true);
    getTeacherAssignmentHistory(tid)
      .then((result) => {
        if (result.success && result.data) setAssignmentHistory(result.data);
        else { addNotification(result.message || "Failed to load assignment history", "error"); setAssignmentHistory([]); }
      })
      .catch(() => { addNotification("Error loading assignment history", "error"); setAssignmentHistory([]); })
      .finally(() => setLoadingHistory(false));
  }, [showAssignments, teacherData?.teacher?.teacher_id || teacherData?.teacher_id]);

  const handleDeactivateTeacher = async () => {
    const tid = teacherData?.teacher?.teacher_id || teacherData?.teacher_id;
    const result = await revokeTeacher(tid, user?.admin?.admin_id);
    if (result.success) {
      setIsTeacherActive(false); setShowDeactivateModal(false);
      addNotification("Teacher deactivated successfully", "success");
      if (refreshTeacherData) await refreshTeacherData();
    } else {
      addNotification(result.message || "Failed to deactivate teacher", "error");
    }
  };

  const handleActivateTeacher = async () => {
    const tid = teacherData?.teacher?.teacher_id || teacherData?.teacher_id;
    const result = await reactivateTeacher(tid, user?.admin?.admin_id);
    if (result.success) {
      setIsTeacherActive(true); setShowReactivateModal(false);
      addNotification("Teacher reactivated successfully", "success");
      if (refreshTeacherData) await refreshTeacherData();
    } else {
      addNotification(result.message || "Failed to reactivate teacher", "error");
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <InnerTabCon>
      <TeacherInfoCard
        teacherData={teacherData}
        onViewPreviousAssignments={() => setShowAssignments(true)}
        onDeactivateTeacher={() => isTeacherActive ? setShowDeactivateModal(true) : setShowReactivateModal(true)}
        isTeacherActive={isTeacherActive}
        refreshTeacherData={refreshTeacherData}
      />

      {/* Assignment History Panel */}
      <SlideInMenu isShow={showAssignments} onClose={() => setShowAssignments(false)} width="460px">
        <div className="ti-panel">
          <div className="ti-panel-header default">
            <span className="ti-panel-header-deco" aria-hidden="true" />
            <div className="ti-panel-header-content">
              <div className="ti-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
                  <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ti-panel-header-text">
                <h2>Previous Staff Assignments</h2>
                <p>History of staff changes for this teacher</p>
              </div>
            </div>
          </div>
          <div className="ti-panel-body">
            {loadingHistory ? (
              <p className="ti-panel-empty">Loading assignment history...</p>
            ) : assignmentHistory.length === 0 ? (
              <p className="ti-panel-empty">No previous staff assignments found.</p>
            ) : (
              assignmentHistory.map((a) => (
                <div key={a.history_id} className="ti-history-card">
                  <div className="ti-history-from">
                    <span className="ti-history-direction">Changed from</span>
                    <span className="ti-history-name from">{a.old_staff_name}</span>
                    <span className="ti-history-id">{a.old_staff_id}</span>
                  </div>
                  <div className="ti-history-divider" />
                  <div className="ti-history-to">
                    <span className="ti-history-direction">Changed to</span>
                    <span className="ti-history-name to">{a.new_staff_name}</span>
                    <span className="ti-history-id">{a.new_staff_id}</span>
                  </div>
                  <div className="ti-history-divider" />
                  <span className="ti-history-date">Changed on: {fmt(a.changed_at)}</span>
                </div>
              ))
            )}
          </div>
          <div className="ti-panel-footer">
            <Button variant="secondary" onClick={() => setShowAssignments(false)}>Close</Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Deactivate Panel */}
      <SlideInMenu isShow={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} width="420px">
        <div className="ti-panel">
          <div className="ti-panel-header danger">
            <span className="ti-panel-header-deco" aria-hidden="true" />
            <div className="ti-panel-header-content">
              <div className="ti-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M15 4l6 6M21 4l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="ti-panel-header-text">
                <h2>Deactivate Teacher</h2>
                <p>This action can be reversed later</p>
              </div>
            </div>
          </div>
          <div className="ti-panel-body">
            <div className="ti-info-box warn">
              ⚠️ You are about to deactivate this teacher account.
            </div>
            <p className="ti-effects-title">This will:</p>
            <ul className="ti-effects">
              <li>Prevent the teacher from logging into the system</li>
              <li>Remove access to all teaching materials and classes</li>
              <li>Hide the teacher from active staff lists</li>
              <li>Preserve all historical data and records</li>
            </ul>
          </div>
          <div className="ti-panel-footer">
            <Button variant="secondary" onClick={() => setShowDeactivateModal(false)} disabled={loading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeactivateTeacher} disabled={loading}>
              {loading ? "Deactivating..." : "Deactivate Teacher"}
            </Button>
          </div>
        </div>
      </SlideInMenu>

      {/* Reactivate Panel */}
      <SlideInMenu isShow={showReactivateModal} onClose={() => setShowReactivateModal(false)} width="420px">
        <div className="ti-panel">
          <div className="ti-panel-header success">
            <span className="ti-panel-header-deco" aria-hidden="true" />
            <div className="ti-panel-header-content">
              <div className="ti-panel-header-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  <path d="M16 5l2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="ti-panel-header-text">
                <h2>Reactivate Teacher</h2>
                <p>Restore this teacher to active status</p>
              </div>
            </div>
          </div>
          <div className="ti-panel-body">
            <div className="ti-info-box info">
              ✓ You are about to reactivate this teacher account.
            </div>
            <p className="ti-effects-title">This will:</p>
            <ul className="ti-effects">
              <li>Restore teacher login access to the system</li>
              <li>Grant access to all teaching materials and classes</li>
              <li>Show the teacher in active staff lists</li>
              <li>Update the staff role back to "Teacher"</li>
            </ul>
          </div>
          <div className="ti-panel-footer">
            <Button variant="secondary" onClick={() => setShowReactivateModal(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleActivateTeacher} disabled={loading}>
              {loading ? "Reactivating..." : "Reactivate Teacher"}
            </Button>
          </div>
        </div>
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default TeacherIdentity;
