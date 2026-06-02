import "./StudentGuardian.css";
import { useState, useRef, useEffect } from "react";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import SlideInMenu from "../../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../../components/FormInput";
import { Icons } from "../../../../../../utils/icons";
import { useParams } from "react-router-dom";
import { useFetchStudentDetail } from "../../../../../../api_call";
import LoadingData from "../../../../../../components/LoadingData";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import jsPDF from "jspdf";
import DeleteConfirmPanel from "../../../../../../components/DeleteConfirmPanel/DeleteConfirmPanel";

const API = `${import.meta.env.VITE_API_BASE_URL}`;

const StudentGuardian = () => {
  const { schoolId, studentId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.students?.edit;

  const { studentData, loading, error, refetch } = useFetchStudentDetail(schoolId, studentId);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    guardian_name: "",
    guardian_phone: "",
    guardian_relationship: "",
    guardian_email: "",
    guardian_address: "",
    guardian_occupation: "",
    guardian_workplace: "",
    is_primary: false,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null); // guardian to delete
  const [deleting, setDeleting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(".gd-menu-wrap")) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpenEdit = (guardian) => {
    if (!canEdit) {
      addNotification("You do not have permission to edit guardians.", "error");
      return;
    }
    setEditingGuardian(guardian);
    setEditForm({
      guardian_name: guardian.guardian_name || "",
      guardian_phone: guardian.guardian_phone || "",
      guardian_relationship: guardian.guardian_relationship || "",
      guardian_email: guardian.guardian_email || "",
      guardian_address: guardian.guardian_address || "",
      guardian_occupation: guardian.guardian_occupation || "",
      guardian_workplace: guardian.guardian_workplace || "",
      is_primary: guardian.is_primary || false,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.guardian_name.trim() || !editForm.guardian_phone.trim()) {
      addNotification("Guardian name and phone are required.", "error");
      return;
    }
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/guardian/${editingGuardian.guardian_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Guardian updated successfully!", "success");
        setIsEditOpen(false);
        setEditingGuardian(null);
        refetch();
      } else {
        addNotification(data.message || "Failed to update guardian", "error");
      }
    } catch {
      addNotification("Failed to update guardian", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const setEdit = (field) => (value) => setEditForm(p => ({ ...p, [field]: value }));
  const set = (field) => (value) => setForm(p => ({ ...p, [field]: value }));

  const handleAdd = () => {
    if (!canEdit) {
      addNotification("You do not have permission to add guardians.", "error");
      return;
    }
    setForm({ guardian_name: "", guardian_phone: "", guardian_relationship: "", guardian_email: "", guardian_address: "", guardian_occupation: "", guardian_workplace: "", is_primary: false });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!form.guardian_name.trim() || !form.guardian_phone.trim()) {
      addNotification("Guardian name and phone are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/guardian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, student_id: studentId }),
      });
      const data = await res.json();
      if (data.success) {
        addNotification("Guardian added successfully!", "success");
        setIsAddOpen(false);
        refetch();
      } else {
        addNotification(data.message || "Failed to add guardian", "error");
      }
    } catch {
      addNotification("Failed to add guardian", "error");
    } finally {
      setSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <InnerTabCon>
        <LoadingData
          message="Loading guardian information..."
          style={{ margin: "40px 0" }}
        />
      </InnerTabCon>
    );
  }

  // Show error state
  if (error) {
    return (
      <InnerTabCon>
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#dc3545",
          }}
        >
          <h3>Error Loading Guardians</h3>
          <p>{error}</p>
        </div>
      </InnerTabCon>
    );
  }

  // Get guardians from student data
  const guardianData = studentData?.guardians || [];

  const handleRequestDelete = (guardian) => {
    if (!canEdit) { addNotification("No permission to delete guardians.", "error"); return; }
    setOpenDropdown(null);
    setDeleteTarget(guardian);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/guardian/${deleteTarget.guardian_id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        addNotification(`${deleteTarget.guardian_name} deleted successfully.`, "success");
        setDeleteTarget(null);
        refetch();
      } else {
        addNotification(data.message || "Failed to delete guardian.", "error");
      }
    } catch {
      addNotification("Failed to delete guardian.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleWhatsAppMessage = (guardian) => {
    const phoneNumber = guardian.guardian_phone?.replace(/[\s\-\(\)]/g, "") || "";
    if (!phoneNumber) {
      alert("No phone number available for this guardian");
      return;
    }
    const message = `Hello ${guardian.guardian_name}, this is regarding your ward's school matters.`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const studentName = studentData?.student?.full_name || "Student";

  const handleExportPDF = () => {
    if (!guardianData.length) {
      addNotification("No guardian data to export.", "error");
      return;
    }

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 20;

    // Header bar
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Guardian Information", margin, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Student: ${studentName}`, margin, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageW - margin, 20, { align: "right" });

    y = 38;

    guardianData.forEach((g, i) => {
      // Card background
      const cardH = 62;
      if (y + cardH > 280) { doc.addPage(); y = 20; }

      doc.setFillColor(247, 247, 247);
      doc.roundedRect(margin, y, pageW - margin * 2, cardH, 4, 4, "F");
      doc.setDrawColor(232, 232, 232);
      doc.roundedRect(margin, y, pageW - margin * 2, cardH, 4, 4, "S");

      // Avatar circle
      doc.setFillColor(17, 17, 17);
      doc.circle(margin + 10, y + 12, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const initials = g.guardian_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
      doc.text(initials, margin + 10, y + 15, { align: "center" });

      // Name + relationship
      doc.setTextColor(17, 17, 17);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(g.guardian_name, margin + 22, y + 11);

      if (g.is_primary) {
        doc.setFillColor(17, 17, 17);
        doc.roundedRect(margin + 22 + doc.getTextWidth(g.guardian_name) + 3, y + 6, 18, 5, 2, 2, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text("PRIMARY", margin + 22 + doc.getTextWidth(g.guardian_name) + 5, y + 10);
      }

      doc.setTextColor(136, 136, 136);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(g.guardian_relationship || "—", margin + 22, y + 18);

      // Divider
      doc.setDrawColor(232, 232, 232);
      doc.line(margin + 4, y + 23, margin + pageW - margin * 2 - 4, y + 23);

      // Fields grid (2 columns)
      const fields = [
        ["Phone", g.guardian_phone || "N/A"],
        ["Email", g.guardian_email || "N/A"],
        ["Occupation", g.guardian_occupation || "N/A"],
        ["Address", g.guardian_address || "N/A"],
      ];
      const colW = (pageW - margin * 2 - 8) / 2;
      fields.forEach((f, fi) => {
        const col = fi % 2;
        const row = Math.floor(fi / 2);
        const fx = margin + 4 + col * colW;
        const fy = y + 29 + row * 14;
        doc.setTextColor(170, 170, 170);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(f[0].toUpperCase(), fx, fy);
        doc.setTextColor(17, 17, 17);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const val = doc.splitTextToSize(f[1], colW - 4);
        doc.text(val[0], fx, fy + 5);
      });

      y += cardH + 8;
    });

    doc.save(`${studentName.replace(/\s+/g, "_")}_Guardians.pdf`);
    addNotification("PDF exported successfully!", "success");
  };

  const handlePrint = () => {
    if (!guardianData.length) {
      addNotification("No guardian data to print.", "error");
      return;
    }
    const printContent = `
      <html><head><title>Guardians — ${studentName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
        h1 { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
        .sub { font-size: 12px; color: #888; margin: 0 0 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .card { border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; }
        .card-head { background: #f7f7f7; padding: 12px 16px; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; gap: 10px; }
        .avatar { width: 36px; height: 36px; border-radius: 8px; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; flex-shrink: 0; }
        .name { font-size: 13px; font-weight: 800; }
        .rel  { font-size: 11px; color: #888; }
        .badge { display: inline-block; background: #111; color: #fff; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 20px; margin-left: 6px; text-transform: uppercase; }
        .body { padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .field label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #aaa; display: block; margin-bottom: 2px; }
        .field span  { font-size: 12px; color: #111; }
        @media print { body { margin: 12px; } }
      </style></head><body>
      <h1>Guardian Information</h1>
      <p class="sub">Student: ${studentName} &nbsp;|&nbsp; ${new Date().toLocaleDateString()}</p>
      <div class="grid">
        ${guardianData.map(g => `
          <div class="card">
            <div class="card-head">
              <div class="avatar">${g.guardian_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}</div>
              <div>
                <div class="name">${g.guardian_name}${g.is_primary ? '<span class="badge">Primary</span>' : ""}</div>
                <div class="rel">${g.guardian_relationship || "—"}</div>
              </div>
            </div>
            <div class="body">
              <div class="field"><label>Phone</label><span>${g.guardian_phone || "N/A"}</span></div>
              <div class="field"><label>Email</label><span>${g.guardian_email || "N/A"}</span></div>
              <div class="field"><label>Occupation</label><span>${g.guardian_occupation || "N/A"}</span></div>
              <div class="field"><label>Address</label><span>${g.guardian_address || "N/A"}</span></div>
            </div>
          </div>`).join("")}
      </div>
      </body></html>`;
    const w = window.open("", "_blank");
    w.document.write(printContent);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  const GuardianCard = ({ guardian, onEdit }) => {
    const isOpen = openDropdown === guardian.guardian_id;
    const btnRef = useRef(null);

    const handleToggle = (e) => {
      e.stopPropagation();
      if (!isOpen && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
      }
      setOpenDropdown(isOpen ? null : guardian.guardian_id);
    };

    return (
      <div className="guardianCard">
        <div className="guardianCardHeader">
          <div className="guardianAvatar">
            {guardian.guardian_photo ? (
              <img src={guardian.guardian_photo} alt={guardian.guardian_name} />
            ) : (
              <div className="guardianInitials">
                {guardian.guardian_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </div>
            )}
          </div>
          <div className="guardianBasicInfo">
            <h3 className="guardianName">
              {guardian.guardian_name}
              {guardian.is_primary && <span className="primaryBadge">Primary</span>}
            </h3>
            <p className="guardianRelationship">{guardian.guardian_relationship || "N/A"}</p>
          </div>
          <div className="guardianActions">
            {/* WhatsApp stays as-is */}
            <button className="whatsappButton" onClick={() => handleWhatsAppMessage(guardian)} title="Message on WhatsApp">
              <Icons.WhatsApp size={16} />
            </button>
            {/* 3-dot dropdown */}
            <div className="gd-menu-wrap">
              <button ref={btnRef} className="gd-menu-btn" onClick={handleToggle} title="Options">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                </svg>
              </button>
              {isOpen && (
                <div className="gd-dropdown" style={{ top: dropdownPos.top, right: dropdownPos.right }}>
                  <button className="gd-dropdown-item" onClick={() => { setOpenDropdown(null); onEdit(guardian); }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                    Edit
                  </button>
                  <button className="gd-dropdown-item gd-dropdown-danger" onClick={() => handleRequestDelete(guardian)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="guardianDetails">
          <div className="guardianDetailRow">
            <InfoField label="Phone" value={guardian.guardian_phone || "N/A"} />
            <InfoField label="Email" value={guardian.guardian_email || "N/A"} />
            <InfoField label="Occupation" value={guardian.guardian_occupation || "N/A"} />
            <InfoField label="Workplace" value={guardian.guardian_workplace || "N/A"} />
            <InfoField label="Address" value={guardian.guardian_address || "N/A"} />
            <InfoField label="Emergency Contact" value={guardian.guardian_emergency_contact || guardian.guardian_phone || "N/A"} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <InnerTabCon>
      <div className="studentGuardian">
        <div className="guardianHeader">
          <div className="guardianHeaderLeft">
            <h2 className="guardianTitle">Student Guardians</h2>
            <p className="guardianCount">
              {guardianData.length} {guardianData.length === 1 ? "Guardian" : "Guardians"}
            </p>
          </div>
          <div className="topExButton">
            <Button variant={"secondary"} onClick={handleExportPDF}>Export PDF</Button>
            <Button variant={"secondary"} onClick={handlePrint}>Print</Button>
            <Button onClick={handleAdd}>+ Add Guardian</Button>
          </div>
        </div>

        {guardianData.length === 0 ? (
          <div className="guardian-empty">
            <h3>No Guardians Found</h3>
            <p>No guardian information available for this student.</p>
            <Button onClick={handleAdd}>+ Add Guardian</Button>
          </div>
        ) : (
          <div className="guardiansList">
            {guardianData.map((guardian) => (
              <GuardianCard key={guardian.guardian_id} guardian={guardian} onEdit={handleOpenEdit} />
            ))}
          </div>
        )}

        {/* Add Guardian Panel */}
        <SlideInMenu isShow={isAddOpen} onClose={() => setIsAddOpen(false)} width="560px">
          <div className="gp-container">
            <div className="gp-header">
              <span className="gp-header-deco" aria-hidden="true" />
              <div className="gp-header-content">
                <div className="gp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
                    <path d="M2 19c0-3.3 2.7-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                    <path d="M17 10v6M14 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="gp-header-text">
                  <h2>Add Guardian</h2>
                  <p>Add a new guardian for this student</p>
                </div>
              </div>
            </div>
            <div className="gp-body">
              <FormInput label="Full Name *" type="text" value={form.guardian_name} onChange={set("guardian_name")} placeholder="e.g. John Doe" />
              <FormInput label="Phone Number *" type="text" value={form.guardian_phone} onChange={set("guardian_phone")} placeholder="e.g. +234 801 234 5678" />
              <FormInput label="Relationship" type="select" value={form.guardian_relationship} onChange={set("guardian_relationship")}
                options={[{value:"",label:"— Select —"},{value:"Father",label:"Father"},{value:"Mother",label:"Mother"},{value:"Uncle",label:"Uncle"},{value:"Aunt",label:"Aunt"},{value:"Grandparent",label:"Grandparent"},{value:"Sibling",label:"Sibling"},{value:"Guardian",label:"Guardian"},{value:"Other",label:"Other"}]}
              />
              <FormInput label="Email" type="email" value={form.guardian_email} onChange={set("guardian_email")} placeholder="guardian@email.com" />
              <FormInput label="Occupation" type="text" value={form.guardian_occupation} onChange={set("guardian_occupation")} placeholder="e.g. Engineer" />
              <FormInput label="Workplace" type="text" value={form.guardian_workplace} onChange={set("guardian_workplace")} placeholder="e.g. ABC Company Ltd" />
              <FormInput label="Address" type="textarea" value={form.guardian_address} onChange={set("guardian_address")} placeholder="Home address..." height="70px" />
              <label className="gp-primary-label">
                <input type="checkbox" checked={form.is_primary} onChange={e => setForm(p => ({ ...p, is_primary: e.target.checked }))} />
                <div>
                  <p className="gp-primary-title">Set as Primary Guardian</p>
                  <p className="gp-primary-hint">Primary guardian will be shown first and used as main contact</p>
                </div>
              </label>
            </div>
            <div className="gp-footer">
              <Button variant="secondary" onClick={() => setIsAddOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving || !form.guardian_name.trim() || !form.guardian_phone.trim()}>
                {saving ? "Saving..." : "Add Guardian"}
              </Button>
            </div>
          </div>
        </SlideInMenu>

        {/* Edit Guardian Panel */}
        <SlideInMenu isShow={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingGuardian(null); }} width="560px">
          <div className="gp-container">
            <div className="gp-header">
              <span className="gp-header-deco" aria-hidden="true" />
              <div className="gp-header-content">
                <div className="gp-header-icon">
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                    <path d="M15 3l4 4-11 11H4v-4L15 3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="gp-header-text">
                  <h2>Edit Guardian</h2>
                  <p>Update guardian information</p>
                </div>
              </div>
            </div>
            <div className="gp-body">
              <FormInput label="Full Name *" type="text" value={editForm.guardian_name || ""} onChange={setEdit("guardian_name")} placeholder="e.g. John Doe" />
              <FormInput label="Phone Number *" type="text" value={editForm.guardian_phone || ""} onChange={setEdit("guardian_phone")} placeholder="e.g. +234 801 234 5678" />
              <FormInput label="Relationship" type="select" value={editForm.guardian_relationship || ""} onChange={setEdit("guardian_relationship")}
                options={[{value:"",label:"— Select —"},{value:"Father",label:"Father"},{value:"Mother",label:"Mother"},{value:"Uncle",label:"Uncle"},{value:"Aunt",label:"Aunt"},{value:"Grandparent",label:"Grandparent"},{value:"Sibling",label:"Sibling"},{value:"Guardian",label:"Guardian"},{value:"Other",label:"Other"}]}
              />
              <FormInput label="Email" type="email" value={editForm.guardian_email || ""} onChange={setEdit("guardian_email")} placeholder="guardian@email.com" />
              <FormInput label="Occupation" type="text" value={editForm.guardian_occupation || ""} onChange={setEdit("guardian_occupation")} placeholder="e.g. Engineer" />
              <FormInput label="Workplace" type="text" value={editForm.guardian_workplace || ""} onChange={setEdit("guardian_workplace")} placeholder="e.g. ABC Company Ltd" />
              <FormInput label="Address" type="textarea" value={editForm.guardian_address || ""} onChange={setEdit("guardian_address")} placeholder="Home address..." height="70px" />
              <label className="gp-primary-label">
                <input type="checkbox" checked={editForm.is_primary || false} onChange={e => setEditForm(p => ({ ...p, is_primary: e.target.checked }))} />
                <div>
                  <p className="gp-primary-title">Set as Primary Guardian</p>
                  <p className="gp-primary-hint">Primary guardian will be shown first and used as main contact</p>
                </div>
              </label>
            </div>
            <div className="gp-footer">
              <Button variant="secondary" onClick={() => { setIsEditOpen(false); setEditingGuardian(null); }} disabled={editSaving}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={editSaving || !editForm.guardian_name?.trim() || !editForm.guardian_phone?.trim()}>
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </SlideInMenu>
      </div>

      {/* Delete Confirmation Panel */}
      <DeleteConfirmPanel
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Guardian"
        description={`Remove this guardian from the student's profile?`}
        itemName={deleteTarget?.guardian_name}
      />
    </InnerTabCon>
  );
};

export default StudentGuardian;
