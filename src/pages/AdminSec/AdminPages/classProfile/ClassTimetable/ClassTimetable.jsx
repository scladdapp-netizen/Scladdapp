import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./ClassTimetable.css";
import Timetable from "../../../../../components/timetable/Timetable";
import Button from "../../../../../components/Button/Button";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import LoadingData from "../../../../../components/LoadingData/LoadingData";
import TimetableEditor from "./TimetableEditor";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import { useClassTimetable } from "../../../../../api_call/useClassTimetable";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";

const ClassTimetable = ({ classData }) => {
  const { classId, schoolId, subseasion } = useParams();
  const { loading, saving, error, loadTimetable, saveTimetable } = useClassTimetable();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Permission helpers
  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const handleOpenEditor = () => {
    if (!canEdit) {
      addNotification("You do not have permission to edit the timetable.", "error");
      return;
    }
    setShowEditMenu(true);
  };

  const [timetableData, setTimetableData] = useState([]);
  const [showEditMenu, setShowEditMenu] = useState(false);

  // Resolve class name from classData prop (same pattern as other tabs)
  const classInfo = classData?.class || classData || {};
  const className = classInfo.class_name || classInfo.className || "This Class";

  useEffect(() => {
    if (!classId || !subseasion) return;
    loadTimetable(classId, subseasion).then((result) => {
      if (result) setTimetableData(result.entries || []);
    });
  }, [classId, subseasion]); // re-fetch when subsession changes

  const hasTimetable = timetableData.length > 0;

  const handleSaveTimetable = async (updatedEntries) => {
    const saved = await saveTimetable(classId, subseasion, schoolId, updatedEntries, user?.admin?.admin_id || user?.user_id);
    if (saved) {
      setTimetableData(saved.entries || updatedEntries);
    }
    setShowEditMenu(false);
  };

  const handleTimetableChange = (updatedEntries) => {
    setTimetableData(updatedEntries);
  };

  const handleExportPDF = async () => {
    if (!timetableData.length) { addNotification("No timetable to export.", "error"); return; }
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Header bar
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 24, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13); doc.setFont("helvetica", "bold");
      doc.text(`Timetable — ${className}`, margin, 10);
      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 10, { align: "right" });
      doc.text("Weekly class schedule", margin, 17);
      y = 32;

      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const colW = (pageW - margin * 2) / days.length;

      // Day headers
      days.forEach((day, i) => {
        const x = margin + i * colW;
        doc.setFillColor(247, 247, 247);
        doc.rect(x, y, colW, 8, "F");
        doc.setDrawColor(232, 232, 232);
        doc.rect(x, y, colW, 8, "S");
        doc.setTextColor(136, 136, 136);
        doc.setFontSize(7); doc.setFont("helvetica", "bold");
        doc.text(day.toUpperCase(), x + colW / 2, y + 5, { align: "center" });
      });
      y += 10;

      // Group entries by day
      const byDay = {};
      days.forEach((d) => { byDay[d] = []; });
      timetableData.forEach((e) => { if (byDay[e.day]) byDay[e.day].push(e); });
      days.forEach((d) => byDay[d].sort((a, b) => a.start.localeCompare(b.start)));

      const maxEntries = Math.max(...days.map((d) => byDay[d].length), 1);
      const rowH = 14;

      for (let row = 0; row < maxEntries; row++) {
        days.forEach((day, i) => {
          const entry = byDay[day][row];
          const x = margin + i * colW;
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(232, 232, 232);
          doc.rect(x, y, colW, rowH, "FD");
          if (entry) {
            doc.setTextColor(17, 17, 17);
            doc.setFontSize(7); doc.setFont("helvetica", "bold");
            const name = entry.name || (entry.subjects?.[0]?.name) || "—";
            doc.text(doc.splitTextToSize(name, colW - 4)[0], x + 2, y + 5);
            doc.setTextColor(136, 136, 136);
            doc.setFontSize(6); doc.setFont("helvetica", "normal");
            doc.text(`${entry.start} – ${entry.end}`, x + 2, y + 9);
            if (entry.teacher) doc.text(doc.splitTextToSize(entry.teacher, colW - 4)[0], x + 2, y + 12.5);
          }
        });
        y += rowH;
      }

      doc.save(`Timetable_${className.replace(/\s+/g, "_")}.pdf`);
      addNotification("Timetable exported as PDF", "success");
    } catch {
      addNotification("Failed to export timetable", "error");
    }
  };

  return (
    <InnerTabCon>
      <div className="classTimetable">
        {/* Header */}
        <div className="ctHeader">
          <div className="ctHeaderLeft">
            <h2 className="ctTitle">Timetable — {className}</h2>
            <p className="ctSubtitle">Weekly class schedule</p>
          </div>
          {hasTimetable && (
            <div className="ctHeaderRight">
              <Button variant="secondary" onClick={handleExportPDF}>Export PDF</Button>
              <Button onClick={handleOpenEditor}>Edit Timetable</Button>
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && <LoadingData message="Loading timetable..." />}
        {error && <p className="ct-error">{error}</p>}

        {/* Content */}
        {!loading && (
          hasTimetable ? (
            <div className="ctTimetableContainer">
              <Timetable timetableData={timetableData} />
            </div>
          ) : (
            <div className="ctEmptyState">
              <div className="ctEmptyContent">
                <div className="ctEmptyIcon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="1.7"/>
                    <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="ctEmptyTitle">No Timetable Yet</h3>
                <p className="ctEmptyMessage">
                  Create a timetable for {className} to organise the weekly schedule.
                </p>
                <Button onClick={handleOpenEditor}>Create Timetable</Button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Editor panel */}
      <SlideInMenu
        isShow={showEditMenu}
        onClose={() => setShowEditMenu(false)}
        position="rightt"
        width="620px"
      >
        <TimetableEditor
          timetableData={timetableData}
          className={className}
          classId={classId}
          schoolId={schoolId}
          subsessionId={subseasion}
          generatedBy={user?.admin?.admin_id || user?.user_id}
          onClose={() => setShowEditMenu(false)}
          onSave={handleSaveTimetable}
          saving={saving}
        />
      </SlideInMenu>
    </InnerTabCon>
  );
};

export default ClassTimetable;
