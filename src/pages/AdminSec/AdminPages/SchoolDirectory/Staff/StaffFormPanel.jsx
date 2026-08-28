import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import { useStaffInfo } from "../../../../../api_call";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";
import "./Staff.css";

const IcoStaff = () => (
  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" fill="none"/>
    <path d="M3 19c0-3.9 3.6-7 8-7s8 3.1 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const StaffFormPanel = ({ isShow, onClose, staffData = null, onSubmit, isEditMode = false }) => {
  const { schoolId } = useParams();
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const [storageLimitOpen, setStorageLimitOpen] = useState(false);
  const [storageLimitMsg, setStorageLimitMsg] = useState("");
  const { loading, error, createStaff, updateStaff, clearError } = useStaffInfo();

  const emptyForm = {
    fullName: "", email: "", phone: "", whatsapp: "",
    position: "", department: "", qualification: "", experience: "",
    employmentType: "Full-time", joiningDate: "",
    emergencyContact: "", emergencyContactPhone: "",
    emergencyContactRelationship: "", emergencyContactWhatsapp: "",
    dateOfBirth: "", gender: "", religion: "", staffPhoto: null,
    bloodGroup: "", genotype: "", maritalStatus: "",
    nationality: "", stateOfOrigin: "", placeOfBirth: "", lgaOfOrigin: "", tribe: "", nin: "",
    houseNumberStreet: "", areaEstate: "", city: "", lgaOfResidence: "", stateOfResidence: "", landmark: "",
  };

  const [staffForm, setStaffForm] = React.useState(emptyForm);

  React.useEffect(() => {
    clearError();
    if (staffData && isEditMode) {
      setStaffForm({
        ...emptyForm,
        fullName: staffData.fullName || staffData.name || "",
        email: staffData.email || "", phone: staffData.phone || "",
        whatsapp: staffData.whatsapp || "",
        position: staffData.position || "", department: staffData.department || "",
        qualification: staffData.qualification || "",
        experience: typeof staffData.experience === "number" ? staffData.experience.toString() : staffData.experienceYears?.toString() || staffData.experience?.replace?.(" years", "") || "",
        employmentType: staffData.employmentType || "Full-time",
        joiningDate: staffData.joiningDate || "",
        emergencyContact: staffData.emergencyContact || "",
        emergencyContactPhone: staffData.emergencyContactPhone || "",
        emergencyContactRelationship: staffData.emergencyContactRelationship || "",
        emergencyContactWhatsapp: staffData.emergencyContactWhatsapp || "",
        dateOfBirth: staffData.dateOfBirth || "", gender: staffData.gender || "",
        religion: staffData.religion || "", staffPhoto: staffData.staffPhoto || null,
        bloodGroup: staffData.bloodGroup || "", genotype: staffData.genotype || "",
        maritalStatus: staffData.maritalStatus || "", nationality: staffData.nationality || "",
        stateOfOrigin: staffData.stateOfOrigin || "",
        placeOfBirth: staffData.placeOfBirth || "",
        lgaOfOrigin: staffData.lgaOfOrigin || "",
        tribe: staffData.tribe || "",
        nin: staffData.nin || staffData.nationalId || "",
        houseNumberStreet: staffData.houseNumberStreet || "",
        areaEstate: staffData.areaEstate || "",
        city: staffData.city || "",
        lgaOfResidence: staffData.lgaOfResidence || "",
        stateOfResidence: staffData.stateOfResidence || "",
        landmark: staffData.landmark || "",
      });
    } else if (!isEditMode) {
      setStaffForm(emptyForm);
    }
  }, [staffData, isEditMode, isShow]);

  const handleFormChange = (field) => (value) => {
    setStaffForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!staffForm.fullName || !staffForm.email || !staffForm.phone || !staffForm.position || !staffForm.department)
      return { isValid: false, message: "Please fill in all required fields" };
    if (!schoolId)
      return { isValid: false, message: "School information is missing. Please refresh and try again." };
    return { isValid: true, message: "" };
  };

  const handleSubmit = async () => {
    const v = validateForm();
    if (!v.isValid) { addNotification(v.message, "error"); return; }
    clearError();
    const apiData = { ...staffForm, school_id: schoolId, ...(isEditMode ? { modified_by: user?.admin?.admin_id || user?.user_id } : { created_by: user?.admin?.admin_id || user?.user_id }) };
    try {
      const result = isEditMode && staffData?.staff_id
        ? await updateStaff(staffData.staff_id, apiData)
        : await createStaff(apiData);
      if (result.success) {
        onSubmit && await onSubmit(result.data);
        handleClose();
        addNotification(result.message || `Staff ${isEditMode ? "updated" : "created"} successfully`, "success");
      } else {
        if (result.limitType === "staff" || result.message?.includes("limit")) {
          setStorageLimitMsg(result.message || "Staff limit reached."); setStorageLimitOpen(true);
        } else {
          addNotification(result.message || "An error occurred while saving staff member", "error");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      addNotification("An unexpected error occurred. Please try again.", "error");
    }
  };

  const handleClose = () => { clearError(); onClose(); };

  return (
    <>
      <SlideInMenu isShow={isShow} onClose={handleClose} width="700px">
        <div className="sfp-container">

          {/* ── Header ── */}
          <div className="sfp-header">
            <span className="sfp-header-deco"  aria-hidden="true" />
            <span className="sfp-header-deco2" aria-hidden="true" />
            <div className="sfp-header-content">
              <div className="sfp-header-icon"><IcoStaff /></div>
              <div className="sfp-header-text">
                <h2>{isEditMode ? "Edit Staff Profile" : "Create New Staff Member"}</h2>
                <p>{isEditMode ? "Update staff profile information" : "Create a new staff profile with personal and employment information"}</p>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="sfp-body">

            {/* Personal Information */}
            <div className="sfp-section">
              <div className="sfp-section-title">Personal Information</div>
              <FormInput label="Staff Photo" type="image" value={staffForm.staffPhoto} onChange={handleFormChange("staffPhoto")} height="150px" width="200px" />
              <div className="sfp-form-row">
                <FormInput label="Full Name *" value={staffForm.fullName} onChange={handleFormChange("fullName")} placeholder="Enter full name" />
                <FormInput label="Email Address *" type="email" value={staffForm.email} onChange={handleFormChange("email")} placeholder="Enter email address" />
                <FormInput label="Phone Number *" value={staffForm.phone} onChange={handleFormChange("phone")} placeholder="Enter phone number" />
                <FormInput label="WhatsApp number" value={staffForm.whatsapp} onChange={handleFormChange("whatsapp")} placeholder="Enter WhatsApp number" />
                <FormInput label="Date of Birth" type="date" value={staffForm.dateOfBirth} onChange={handleFormChange("dateOfBirth")} />
                <FormInput label="Gender" type="select" value={staffForm.gender} onChange={handleFormChange("gender")} options={[{value:"",label:"Select Gender"},{value:"Male",label:"Male"},{value:"Female",label:"Female"},{value:"Other",label:"Other"}]} />
              </div>
            </div>

            <div className="sfp-section">
              <div className="sfp-section-title">Identity / bio</div>
              <div className="sfp-form-row">
                <FormInput label="Religion" value={staffForm.religion} onChange={handleFormChange("religion")} placeholder="Enter religion" />
                <FormInput label="Marital Status" type="select" value={staffForm.maritalStatus} onChange={handleFormChange("maritalStatus")} options={[{value:"",label:"Select Status"},{value:"Single",label:"Single"},{value:"Married",label:"Married"},{value:"Divorced",label:"Divorced"},{value:"Widowed",label:"Widowed"}]} />
                <FormInput label="Nationality" value={staffForm.nationality} onChange={handleFormChange("nationality")} placeholder="Enter nationality" />
                <FormInput label="State of Origin" value={staffForm.stateOfOrigin} onChange={handleFormChange("stateOfOrigin")} placeholder="Enter state of origin" />
                <FormInput label="LGA of origin" value={staffForm.lgaOfOrigin} onChange={handleFormChange("lgaOfOrigin")} placeholder="Enter LGA of origin" />
                <FormInput label="Place of birth" value={staffForm.placeOfBirth} onChange={handleFormChange("placeOfBirth")} placeholder="Enter place of birth" />
                <FormInput label="Tribe / ethnic group" value={staffForm.tribe} onChange={handleFormChange("tribe")} placeholder="Enter tribe" />
                <FormInput label="NIN" value={staffForm.nin} onChange={handleFormChange("nin")} placeholder="Enter NIN" />
                <FormInput label="Blood Group" type="select" value={staffForm.bloodGroup} onChange={handleFormChange("bloodGroup")} options={[{value:"",label:"Select"},{value:"A+",label:"A+"},{value:"A-",label:"A-"},{value:"B+",label:"B+"},{value:"B-",label:"B-"},{value:"AB+",label:"AB+"},{value:"AB-",label:"AB-"},{value:"O+",label:"O+"},{value:"O-",label:"O-"}]} />
                <FormInput label="Genotype" type="select" value={staffForm.genotype} onChange={handleFormChange("genotype")} options={[{value:"",label:"Select"},{value:"AA",label:"AA"},{value:"AS",label:"AS"},{value:"AC",label:"AC"},{value:"SS",label:"SS"},{value:"SC",label:"SC"},{value:"CC",label:"CC"}]} />
              </div>
            </div>

            <div className="sfp-section">
              <div className="sfp-section-title">Residence</div>
              <div className="sfp-form-row">
                <FormInput label="House number / street" value={staffForm.houseNumberStreet} onChange={handleFormChange("houseNumberStreet")} placeholder="House number and street" />
                <FormInput label="Area / estate" value={staffForm.areaEstate} onChange={handleFormChange("areaEstate")} placeholder="Area or estate" />
                <FormInput label="City" value={staffForm.city} onChange={handleFormChange("city")} placeholder="City" />
                <FormInput label="LGA of residence" value={staffForm.lgaOfResidence} onChange={handleFormChange("lgaOfResidence")} placeholder="LGA of residence" />
                <FormInput label="State of residence" value={staffForm.stateOfResidence} onChange={handleFormChange("stateOfResidence")} placeholder="State of residence" />
                <FormInput label="Landmark" value={staffForm.landmark} onChange={handleFormChange("landmark")} placeholder="Landmark" />
              </div>
            </div>

            {/* Employment Information */}
            <div className="sfp-section">
              <div className="sfp-section-title">Employment Information</div>
              <div className="sfp-form-row">
                <FormInput label="Position *" value={staffForm.position} onChange={handleFormChange("position")} placeholder="e.g., Principal, Bursar" />
                <FormInput label="Department *" value={staffForm.department} onChange={handleFormChange("department")} placeholder="e.g., Administration, Finance" />
                <FormInput label="Qualification" value={staffForm.qualification} onChange={handleFormChange("qualification")} placeholder="e.g., M.Ed, B.Sc" />
                <FormInput label="Years of Experience" type="number" value={staffForm.experience} onChange={handleFormChange("experience")} placeholder="Enter years" />
                <FormInput label="Employment Type" type="select" value={staffForm.employmentType} onChange={handleFormChange("employmentType")} options={[{value:"Full-time",label:"Full-time"},{value:"Part-time",label:"Part-time"},{value:"Contract",label:"Contract"},{value:"Temporary",label:"Temporary"}]} />
                <FormInput label="Joining Date" type="date" value={staffForm.joiningDate} onChange={handleFormChange("joiningDate")} />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="sfp-section">
              <div className="sfp-section-title">Emergency Contact</div>
              <div className="sfp-form-row">
                <FormInput label="Name" value={staffForm.emergencyContact} onChange={handleFormChange("emergencyContact")} placeholder="Enter contact name" />
                <FormInput label="Relationship" value={staffForm.emergencyContactRelationship} onChange={handleFormChange("emergencyContactRelationship")} placeholder="e.g., Spouse, Parent" />
                <FormInput label="Phone" value={staffForm.emergencyContactPhone} onChange={handleFormChange("emergencyContactPhone")} placeholder="Enter contact phone" />
                <FormInput label="WhatsApp number" value={staffForm.emergencyContactWhatsapp} onChange={handleFormChange("emergencyContactWhatsapp")} placeholder="Enter WhatsApp number" />
              </div>
            </div>

            {/* Security */}
            {!isEditMode && (
              <div className="sfp-section">
                <div className="sfp-section-title">Security & Access</div>
                <div className="sfp-invite-note">
                  <div className="sfp-invite-note-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                      <path d="M4 7.5 12 13l8-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="sfp-invite-note-text">
                    <p className="sfp-invite-note-title">Password setup via email</p>
                    <p className="sfp-invite-note-body">
                      A secure link will be sent to{" "}
                      <strong>{staffForm.email || "the staff's email"}</strong> after
                      account creation. They'll use it to set their own password.
                    </p>
                    <span className="sfp-invite-note-meta">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M12 7v5.5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Link expires in 48 hours
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className="sfp-error"><strong>Error:</strong> {error}</div>}

          </div>

          {/* ── Footer ── */}
          <div className="sfp-footer">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Staff Profile" : "Create Staff Member")}
            </Button>
          </div>

        </div>
      </SlideInMenu>

      <SubscriptionLimitModal
        isOpen={storageLimitOpen}
        onClose={() => setStorageLimitOpen(false)}
        message={storageLimitMsg}
        title="Staff Limit Reached"
      />
    </>
  );
};

export default StaffFormPanel;
