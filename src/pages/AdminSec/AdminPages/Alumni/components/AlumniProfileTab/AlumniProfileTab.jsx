import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../../../../components/Button/Button";
import InnerTabCon from "../../../../../../components/InnerTabCon/InnerTabCon";
import InfoField from "../../../../../../components/infoField/InfoField";
import pp from "../../../../../../assets/img/pp.jpg";
import { useAuth } from "../../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../../context/NotificationProvider/NotificationProvider";
import "./AlumniProfileTab.css";

const AlumniProfileTab = ({ alumniData, onUpdate }) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [editingSection, setEditingSection] = useState(null);

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin?.permissions.includes("ALL"));
  const canEdit = isSuperAdmin || !!admin?.permissions?.graduate?.edit;

  const [editData, setEditData] = useState({
    contactEmail: alumniData.contactEmail || "",
    contactPhone: alumniData.contactPhone || "",
    currentAddress: alumniData.currentAddress || "",
    currentOccupation: alumniData.currentOccupation || "",
    currentInstitution: alumniData.currentInstitution || "",
    course: alumniData.course || "",
  });

  const handleEditSection = (section) => {
    if (!canEdit) { addNotification("No permission to edit alumni profiles.", "error"); return; }
    setEditingSection(section);
  };

  const handleSave = () => { onUpdate(editData); setEditingSection(null); };

  const handleCancel = () => {
    setEditData({
      contactEmail: alumniData.contactEmail || "",
      contactPhone: alumniData.contactPhone || "",
      currentAddress: alumniData.currentAddress || "",
      currentOccupation: alumniData.currentOccupation || "",
      currentInstitution: alumniData.currentInstitution || "",
      course: alumniData.course || "",
    });
    setEditingSection(null);
  };

  const set = (field) => (e) => setEditData((p) => ({ ...p, [field]: e.target.value }));

  return (
    <InnerTabCon>
      <div className="mm-apt-wrap">

        <div className="mm-apt-layout">
          {/* ── Left column ── */}
          <div className="mm-apt-left">
            <div className="mm-apt-card">
              {/* Avatar */}
              <div className="mm-apt-avatar-wrap">
                <img src={alumniData.profileImage || pp} alt="Alumni" className="mm-apt-avatar" />
              </div>
              <h3 className="mm-apt-name">{alumniData.fullName}</h3>
              <p className="mm-apt-status">{alumniData.status}</p>
              <p className="mm-apt-class">Final Class: {alumniData.finalClass}</p>

              {/* Basic info */}
              <div className="mm-apt-section">
                <span className="mm-apt-section-title">Basic Information</span>
                <div className="mm-apt-info-grid">
                  <InfoField label="Full Name"       value={alumniData.fullName} />
                  <InfoField label="Alumni ID"       value={alumniData.alumni_id} />
                  <InfoField label="Gender"          value={alumniData.gender || "—"} />
                  <InfoField label="Graduation Date" value={alumniData.graduationDate ? new Date(alumniData.graduationDate).toLocaleDateString() : "—"} />
                  <InfoField label="Final Class"     value={alumniData.finalClass} />
                  <InfoField label="Session"         value={alumniData.graduationSession || "—"} />
                </div>
              </div>

              {/* Academic history link */}
              <div className="mm-apt-section">
                <span className="mm-apt-section-title">Academic History</span>
                <p className="mm-apt-history-desc">View complete academic records and session history</p>
                <Button variant="secondary" onClick={() => navigate(`/admin/${schoolId}/Profile/${alumniData.student_id}`)}>
                  View Student Profile History
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="mm-apt-right">

            {/* Contact info */}
            <div className="mm-apt-card">
              <div className="mm-apt-card-header">
                <h4 className="mm-apt-card-title">Contact Information</h4>
                {!editingSection && (
                  <Button variant="secondary" onClick={() => handleEditSection("contact")}>Edit Contact</Button>
                )}
              </div>

              {editingSection === "contact" ? (
                <div className="mm-apt-edit-form">
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Email Address</label>
                    <input className="mm-apt-field-input" type="email" value={editData.contactEmail} onChange={set("contactEmail")} placeholder="Enter email address" />
                  </div>
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Phone Number</label>
                    <input className="mm-apt-field-input" type="tel" value={editData.contactPhone} onChange={set("contactPhone")} placeholder="Enter phone number" />
                  </div>
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Current Address</label>
                    <textarea className="mm-apt-field-textarea" value={editData.currentAddress} onChange={set("currentAddress")} placeholder="Enter current address" rows="3" />
                  </div>
                  <div className="mm-apt-form-actions">
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="mm-apt-info-grid">
                  <InfoField label="Email"   value={alumniData.contactEmail || "Not provided"} />
                  <InfoField label="Phone"   value={alumniData.contactPhone || "Not provided"} />
                  <InfoField label="Address" value={alumniData.currentAddress || "Not provided"} />
                </div>
              )}
            </div>

            {/* Current status */}
            <div className="mm-apt-card">
              <div className="mm-apt-card-header">
                <h4 className="mm-apt-card-title">Current Status</h4>
                {!editingSection && (
                  <Button variant="secondary" onClick={() => handleEditSection("status")}>Update Status</Button>
                )}
              </div>

              {editingSection === "status" ? (
                <div className="mm-apt-edit-form">
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Current Occupation</label>
                    <input className="mm-apt-field-input" type="text" value={editData.currentOccupation} onChange={set("currentOccupation")} placeholder="e.g., University Student, Software Engineer" />
                  </div>
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Institution / Company</label>
                    <input className="mm-apt-field-input" type="text" value={editData.currentInstitution} onChange={set("currentInstitution")} placeholder="e.g., University of Lagos, Microsoft" />
                  </div>
                  <div className="mm-apt-field">
                    <label className="mm-apt-field-label">Course / Position</label>
                    <input className="mm-apt-field-input" type="text" value={editData.course} onChange={set("course")} placeholder="e.g., Computer Science, Senior Developer" />
                  </div>
                  <div className="mm-apt-form-actions">
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                  </div>
                </div>
              ) : (
                <div className="mm-apt-info-grid">
                  <InfoField label="Occupation"      value={alumniData.currentOccupation || "Not specified"} />
                  <InfoField label="Institution"     value={alumniData.currentInstitution || "Not specified"} />
                  <InfoField label="Course/Position" value={alumniData.course || "Not specified"} />
                </div>
              )}
            </div>

            {/* Notes */}
            {alumniData.notes && (
              <div className="mm-apt-card">
                <div className="mm-apt-card-header">
                  <h4 className="mm-apt-card-title">Additional Notes</h4>
                </div>
                <p className="mm-apt-notes-text">{alumniData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </InnerTabCon>
  );
};

export default AlumniProfileTab;
