import { useState, useEffect } from "react";
import "./ClassOverview.css";
import InfoField from "../../../../../components/infoField/InfoField";
import { Icons } from "../../../../../utils/icons";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import Button from "../../../../../components/Button/Button";
import AddClassPanel from "../../SchoolDirectory/Classes/AddClassPanel";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import { FaEllipsisV, FaEdit, FaPrint, FaFileExport, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";

const ClassOverview = ({ classData, onClassUpdate, refreshClassData }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.classes?.edit;

  const [showEditMenu, setShowEditMenu] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  const classInfo = classData?.class || classData || {};
  const headmasterAssignments = classData?.headmaster_assignments || [];
  const activeHeadmaster = headmasterAssignments.find((h) => h.is_active === true);

  const displayClassInfo = {
    className:    classInfo.class_name    || "N/A",
    classId:      classInfo.class_id      || "N/A",
    classCode:    classInfo.class_code    || "N/A",
    section:      classInfo.class_section || "N/A",
    classType:    classInfo.class_type    || "N/A",
    roomNumber:   classInfo.room_number   || "Not Assigned",
    status:       classInfo.is_active ? "Active" : "Inactive",
    createdAt:    classInfo.created_at    || "N/A",
    updatedAt:    classInfo.updated_at    || "N/A",
    classTeacher: activeHeadmaster?.teacher_name  || "Not Assigned",
    teacherEmail: activeHeadmaster?.teacher_email || "N/A",
  };

  const formatDate = (d) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showDropdown && !e.target.closest(".co-actions-wrap")) setShowDropdown(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape" && showDropdown) setShowDropdown(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [showDropdown]);

  const handleEditClass = () => {
    if (!canEdit) { addNotification("You do not have permission to edit this class.", "error"); setShowDropdown(false); return; }
    setEditFormData({
      className:    classInfo.class_name    || "",
      classCode:    classInfo.class_code    || "",
      classSection: classInfo.class_section || "",
      classType:    classInfo.class_type    || "",
      roomNumber:   classInfo.room_number   || "",
    });
    setShowEditMenu(true);
    setShowDropdown(false);
  };

  const handleFormChange = (field) => (value) => setEditFormData((p) => ({ ...p, [field]: value }));

  const handlePrintClass = () => {
    const w = window.open("", "_blank");
    w.document.open();
    w.document.write(`<html><head><title>Class Overview - ${displayClassInfo.className}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#111}h1{font-size:18px;font-weight:800;margin:0 0 4px}.sub{font-size:12px;color:#888;margin:0 0 20px}.section{margin-bottom:18px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#888;border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:10px}.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}.field label{font-size:9px;font-weight:700;text-transform:uppercase;color:#aaa;display:block;margin-bottom:2px}.field span{font-size:12px;color:#111;font-weight:600}@media print{body{margin:12px}}</style>
    </head><body>
    <h1>${displayClassInfo.className}</h1>
    <p class="sub">${displayClassInfo.classCode} · Section ${displayClassInfo.section} · ${displayClassInfo.status}</p>
    <div class="section"><div class="section-title">Basic Information</div><div class="grid">
      <div class="field"><label>Class Name</label><span>${displayClassInfo.className}</span></div>
      <div class="field"><label>Class Code</label><span>${displayClassInfo.classCode}</span></div>
      <div class="field"><label>Section</label><span>${displayClassInfo.section}</span></div>
      <div class="field"><label>Class Type</label><span>${displayClassInfo.classType}</span></div>
      <div class="field"><label>Room Number</label><span>${displayClassInfo.roomNumber}</span></div>
      <div class="field"><label>Status</label><span>${displayClassInfo.status}</span></div>
      <div class="field"><label>Class ID</label><span>${displayClassInfo.classId}</span></div>
      <div class="field"><label>Created</label><span>${formatDate(displayClassInfo.createdAt)}</span></div>
    </div></div>
    <div class="section"><div class="section-title">Class Headmaster</div><div class="grid">
      <div class="field"><label>Headmaster Name</label><span>${displayClassInfo.classTeacher}</span></div>
      <div class="field"><label>Email</label><span>${displayClassInfo.teacherEmail}</span></div>
      ${activeHeadmaster ? `<div class="field"><label>Assignment Start</label><span>${activeHeadmaster.start_date || "N/A"}</span></div><div class="field"><label>Assignment End</label><span>${activeHeadmaster.end_date || "Ongoing"}</span></div>` : ""}
    </div></div>
    <p style="text-align:center;margin-top:30px;color:#aaa;font-size:11px">Generated ${new Date().toLocaleString()}</p>
    </body></html>`);
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close(); }, 400);
    setShowDropdown(false);
  };

  const handleExportClass = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 18;
      let y = 20;

      // Header bar
      doc.setFillColor(17, 17, 17);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont("helvetica", "bold");
      doc.text("Class Overview", margin, 12);
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`${displayClassInfo.className}  ·  ${displayClassInfo.classCode}`, margin, 20);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 20, { align: "right" });
      y = 38;

      const section = (title) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(8);
        doc.setTextColor(136, 136, 136);
        doc.text(title.toUpperCase(), margin, y);
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y + 2, pageW - margin, y + 2);
        y += 10;
      };

      const row = (label, value) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(136, 136, 136);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(34, 34, 34);
        doc.text(String(value || "N/A"), margin + 50, y);
        y += 7;
      };

      section("Basic Information");
      row("Class Name",   displayClassInfo.className);
      row("Class Code",   displayClassInfo.classCode);
      row("Section",      displayClassInfo.section);
      row("Class Type",   displayClassInfo.classType);
      row("Room Number",  displayClassInfo.roomNumber);
      row("Status",       displayClassInfo.status);
      row("Class ID",     displayClassInfo.classId);
      row("Created",      formatDate(displayClassInfo.createdAt));
      y += 4;

      section("Class Headmaster");
      row("Headmaster Name", displayClassInfo.classTeacher);
      row("Email",           displayClassInfo.teacherEmail);
      if (activeHeadmaster) {
        row("Assignment Start", activeHeadmaster.start_date || "N/A");
        row("Assignment End",   activeHeadmaster.end_date   || "Ongoing");
      }

      doc.save(`Class_${displayClassInfo.className.replace(/\s+/g, "_")}_Overview.pdf`);
      addNotification("Class overview exported as PDF", "success");
    } catch {
      addNotification("Failed to export class overview", "error");
    }
    setShowDropdown(false);
  };

  const handleActivateClass = () => {
    if (!canEdit) { addNotification("You do not have permission to activate this class.", "error"); setShowDropdown(false); return; }
    setShowActivateModal(true); setShowDropdown(false);
  };

  const handleDeactivateClass = () => {
    if (!canEdit) { addNotification("You do not have permission to deactivate this class.", "error"); setShowDropdown(false); return; }
    setShowDeactivateModal(true); setShowDropdown(false);
  };

  const handleConfirmToggleStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      const result = await onClassUpdate({
        className:    classInfo.class_name,
        classCode:    classInfo.class_code,
        classSection: classInfo.class_section,
        classType:    classInfo.class_type,
        roomNumber:   classInfo.room_number,
        is_active:    newStatus,
      });
      if (result.success && refreshClassData) {
        await refreshClassData();
        setShowDeactivateModal(false);
        setShowActivateModal(false);
      } else {
        addNotification(result.error || `Failed to ${newStatus ? "activate" : "deactivate"} class`, "error");
      }
    } catch {
      addNotification(`Failed to ${newStatus ? "activate" : "deactivate"} class`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsUpdating(true);
    try {
      const result = await onClassUpdate?.({
        className:    editFormData.className,
        classCode:    editFormData.classCode,
        classSection: editFormData.classSection,
        classType:    editFormData.classType,
        roomNumber:   editFormData.roomNumber || null,
      });
      if (result?.success) {
        setShowEditMenu(false);
        if (refreshClassData) await refreshClassData();
      } else {
        addNotification(result?.error || "Failed to update class information", "error");
      }
    } catch {
      addNotification("Failed to update class information", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const isActive = classInfo.is_active;

  return (
    <InnerTabCon>
      <div className="class-overview">
        <div className="co-card">

          {/* Banner */}
          <div className="co-banner">
            <span className="co-banner-deco" aria-hidden="true" />
          </div>

          {/* Header */}
          <div className="co-header">
            <div className="co-header-left">
              <div className="co-icon-wrap">
                <Icons.Class size={40} color="#888888" />
              </div>
              <div className="co-header-text">
                <h3>{displayClassInfo.className}</h3>
                <p className="co-subtitle">
                  {displayClassInfo.classCode} · Section {displayClassInfo.section}
                </p>
                <div className="co-badges">
                  <span className={`co-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "✓ Active" : "✗ Inactive"}
                  </span>
                  <span className="co-badge">{displayClassInfo.classType}</span>
                </div>
              </div>
            </div>

            <div className="co-header-actions">
              <div className="co-actions-wrap">
                <button className="co-actions-btn" onClick={() => setShowDropdown(!showDropdown)}>
                  <FaEllipsisV size={11} /> Actions
                </button>
                {showDropdown && (
                  <div className="co-dropdown">
                    <button className="co-dropdown-item" onClick={handleEditClass}>
                      <FaEdit size={13} /> Edit Class
                    </button>
                    <div className="co-dropdown-divider" />
                    <button className="co-dropdown-item" onClick={handleExportClass}>
                      <FaFileExport size={13} /> Export PDF
                    </button>
                    <button className="co-dropdown-item" onClick={handlePrintClass}>
                      <FaPrint size={13} /> Print
                    </button>
                    <div className="co-dropdown-divider" />
                    {isActive ? (
                      <button className="co-dropdown-item danger" onClick={handleDeactivateClass}>
                        <FaTimesCircle size={13} /> Deactivate Class
                      </button>
                    ) : (
                      <button className="co-dropdown-item success" onClick={handleActivateClass}>
                        <FaCheckCircle size={13} /> Activate Class
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="co-body">

            {/* Basic Information */}
            <div>
              <span className="co-section-title">Basic Information</span>
              <div className="co-grid">
                <InfoField label="Class Name"   value={displayClassInfo.className} />
                <InfoField label="Class Code"   value={displayClassInfo.classCode} />
                <InfoField label="Section"      value={displayClassInfo.section} />
                <InfoField label="Class Type"   value={displayClassInfo.classType} />
                <InfoField label="Room Number"  value={displayClassInfo.roomNumber} />
                <InfoField label="Status"       value={displayClassInfo.status} />
                <InfoField label="Class ID"     value={displayClassInfo.classId} />
                <InfoField label="Created"      value={formatDate(displayClassInfo.createdAt)} />
              </div>
            </div>

            {/* Class Headmaster */}
            <div>
              <span className="co-section-title">Class Headmaster</span>
              <div className="co-grid">
                <InfoField label="Headmaster Name" value={displayClassInfo.classTeacher} />
                <InfoField label="Email"           value={displayClassInfo.teacherEmail} />
                {activeHeadmaster && <>
                  <InfoField label="Assignment Start" value={activeHeadmaster.start_date || "N/A"} />
                  <InfoField label="Assignment End"   value={activeHeadmaster.end_date || "Ongoing"} />
                </>}
              </div>
            </div>

          </div>
        </div>

        {/* Edit Panel */}
        <AddClassPanel
          isShow={showEditMenu}
          onClose={() => setShowEditMenu(false)}
          formData={editFormData}
          onFormChange={handleFormChange}
          onSubmit={handleSaveEdit}
          loading={isUpdating}
          isEditMode={true}
        />

        {/* Deactivate Confirm Panel */}
        <SlideInMenu isShow={showDeactivateModal} onClose={() => setShowDeactivateModal(false)} width="420px">
          <div className="co-confirm-container">
            <div className="co-confirm-header danger">
              <span className="co-confirm-header-deco" aria-hidden="true" />
              <div className="co-confirm-header-content">
                <div className="co-confirm-header-icon">
                  <FaTimesCircle size={18} />
                </div>
                <div className="co-confirm-header-text">
                  <h3>Deactivate Class</h3>
                  <p>This action can be reversed later</p>
                </div>
              </div>
            </div>
            <div className="co-confirm-body">
              <div className="co-confirm-class-name">{displayClassInfo.className}</div>
              <div className="co-confirm-warn danger">
                ⚠️ You are about to deactivate this class.
              </div>
              <p className="co-confirm-effects-title">This will:</p>
              <ul className="co-confirm-effects">
                <li>Make the class inactive in the system</li>
                <li>Hide it from active class lists</li>
                <li>Prevent new student enrollments</li>
                <li>Preserve all historical data and records</li>
              </ul>
            </div>
            <div className="co-confirm-footer">
              <Button variant="secondary" onClick={() => setShowDeactivateModal(false)} disabled={isUpdating}>Cancel</Button>
              <Button variant="danger" onClick={() => handleConfirmToggleStatus(false)} disabled={isUpdating}>
                {isUpdating ? "Deactivating..." : "Deactivate Class"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Activate Confirm Panel */}
        <SlideInMenu isShow={showActivateModal} onClose={() => setShowActivateModal(false)} width="420px">
          <div className="co-confirm-container">
            <div className="co-confirm-header success">
              <span className="co-confirm-header-deco" aria-hidden="true" />
              <div className="co-confirm-header-content">
                <div className="co-confirm-header-icon">
                  <FaCheckCircle size={18} />
                </div>
                <div className="co-confirm-header-text">
                  <h3>Activate Class</h3>
                  <p>Restore this class to active status</p>
                </div>
              </div>
            </div>
            <div className="co-confirm-body">
              <div className="co-confirm-class-name">{displayClassInfo.className}</div>
              <div className="co-confirm-warn success">
                ✓ You are about to activate this class.
              </div>
              <p className="co-confirm-effects-title">This will:</p>
              <ul className="co-confirm-effects">
                <li>Make the class active in the system</li>
                <li>Show it in active class lists</li>
                <li>Allow new student enrollments</li>
                <li>Restore all previous settings and permissions</li>
              </ul>
            </div>
            <div className="co-confirm-footer">
              <Button variant="secondary" onClick={() => setShowActivateModal(false)} disabled={isUpdating}>Cancel</Button>
              <Button onClick={() => handleConfirmToggleStatus(true)} disabled={isUpdating}>
                {isUpdating ? "Activating..." : "Activate Class"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

      </div>
    </InnerTabCon>
  );
};

export default ClassOverview;
