import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SlideInMenu from "../../../../../components/SlideInMenu/SlideInMenu";
import FormInput from "../../../../../components/FormInput";
import Button from "../../../../../components/Button/Button";
import { useStaffInfo } from "../../../../../api_call";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import SubscriptionLimitModal from "../../../../../components/SubscriptionLimitModal/SubscriptionLimitModal";

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
    fullName: "", email: "", phone: "", alternatePhone: "",
    position: "", department: "", qualification: "", experience: "",
    employmentType: "Full-time", role: "Support Staff",
    salary: "", salaryGrade: "", jobTitle: "",
    confirmationDate: "", employmentStatus: "active", recordStatus: "active",
    joiningDate: "", emergencyContact: "", emergencyContactPhone: "",
    emergencyContactRelationship: "", emergencyContactAddress: "",
    address: "", nationalId: "", taxNumber: "", bankAccount: "", bankName: "",
    nextOfKin: "", nextOfKinPhone: "", nextOfKinRelationship: "", nextOfKinAddress: "",
    dateOfBirth: "", gender: "", religion: "", staffPhoto: null,
    medicalConditions: "", bloodGroup: "", genotype: "", maritalStatus: "",
    nationality: "", stateOfOrigin: "", twoFactorAuth: false,
  };

  const [staffForm, setStaffForm] = React.useState(emptyForm);

  React.useEffect(() => {
    clearError();
    if (staffData && isEditMode) {
      setStaffForm({
        ...emptyForm,
        fullName: staffData.fullName || staffData.name || "",
        email: staffData.email || "", phone: staffData.phone || "",
        alternatePhone: staffData.alternatePhone || "",
        position: staffData.position || "", department: staffData.department || "",
        qualification: staffData.qualification || "",
        experience: typeof staffData.experience === "number" ? staffData.experience.toString() : staffData.experience?.replace(" years", "") || "",
        employmentType: staffData.employmentType || "Full-time",
        role: staffData.role || "Support Staff",
        salary: typeof staffData.salary === "number" ? staffData.salary.toString() : staffData.salary?.replace(/[₦,]/g, "") || "",
        salaryGrade: staffData.salaryGrade || "", jobTitle: staffData.jobTitle || "",
        confirmationDate: staffData.confirmationDate || "",
        employmentStatus: staffData.employmentStatus || "active",
        recordStatus: staffData.recordStatus || "active",
        joiningDate: staffData.joiningDate || "",
        emergencyContact: staffData.emergencyContact || "",
        emergencyContactPhone: staffData.emergencyContactPhone || "",
        emergencyContactRelationship: staffData.emergencyContactRelationship || "",
        emergencyContactAddress: staffData.emergencyContactAddress || "",
        address: staffData.address || "", nationalId: staffData.nationalId || "",
        taxNumber: staffData.taxNumber || "", bankAccount: staffData.bankAccount || "",
        bankName: staffData.bankName || "", nextOfKin: staffData.nextOfKin || "",
        nextOfKinPhone: staffData.nextOfKinPhone || "",
        nextOfKinRelationship: staffData.nextOfKinRelationship || "",
        nextOfKinAddress: staffData.nextOfKinAddress || "",
        dateOfBirth: staffData.dateOfBirth || "", gender: staffData.gender || "",
        religion: staffData.religion || "", staffPhoto: staffData.staffPhoto || null,
        medicalConditions: staffData.medicalConditions || "",
        bloodGroup: staffData.bloodGroup || "", genotype: staffData.genotype || "",
        maritalStatus: staffData.maritalStatus || "", nationality: staffData.nationality || "",
        stateOfOrigin: staffData.stateOfOrigin || "",
        twoFactorAuth: staffData.twoFactorAuth || false,
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
                <FormInput label="Alternate Phone" value={staffForm.alternatePhone} onChange={handleFormChange("alternatePhone")} placeholder="Enter alternate phone" />
                <FormInput label="Date of Birth" type="date" value={staffForm.dateOfBirth} onChange={handleFormChange("dateOfBirth")} />
                <FormInput label="Gender" type="select" value={staffForm.gender} onChange={handleFormChange("gender")} options={[{value:"",label:"Select Gender"},{value:"Male",label:"Male"},{value:"Female",label:"Female"},{value:"Other",label:"Other"}]} />
                <FormInput label="Religion" value={staffForm.religion} onChange={handleFormChange("religion")} placeholder="Enter religion" />
                <FormInput label="Marital Status" type="select" value={staffForm.maritalStatus} onChange={handleFormChange("maritalStatus")} options={[{value:"",label:"Select Status"},{value:"Single",label:"Single"},{value:"Married",label:"Married"},{value:"Divorced",label:"Divorced"},{value:"Widowed",label:"Widowed"}]} />
                <FormInput label="Nationality" value={staffForm.nationality} onChange={handleFormChange("nationality")} placeholder="Enter nationality" />
                <FormInput label="State of Origin" value={staffForm.stateOfOrigin} onChange={handleFormChange("stateOfOrigin")} placeholder="Enter state of origin" />
                <FormInput label="Blood Group" type="select" value={staffForm.bloodGroup} onChange={handleFormChange("bloodGroup")} options={[{value:"",label:"Select"},{value:"A+",label:"A+"},{value:"A-",label:"A-"},{value:"B+",label:"B+"},{value:"B-",label:"B-"},{value:"AB+",label:"AB+"},{value:"AB-",label:"AB-"},{value:"O+",label:"O+"},{value:"O-",label:"O-"}]} />
                <FormInput label="Genotype" type="select" value={staffForm.genotype} onChange={handleFormChange("genotype")} options={[{value:"",label:"Select"},{value:"AA",label:"AA"},{value:"AS",label:"AS"},{value:"AC",label:"AC"},{value:"SS",label:"SS"},{value:"SC",label:"SC"},{value:"CC",label:"CC"}]} />
              </div>
              <FormInput label="Address" value={staffForm.address} onChange={handleFormChange("address")} placeholder="Enter full address" />
              <FormInput label="Medical Conditions" type="textarea" value={staffForm.medicalConditions} onChange={handleFormChange("medicalConditions")} placeholder="Enter any medical conditions or allergies" height="70px" />
            </div>

            {/* Employment Information */}
            <div className="sfp-section">
              <div className="sfp-section-title">Employment Information</div>
              <div className="sfp-form-row">
                <FormInput label="Position *" value={staffForm.position} onChange={handleFormChange("position")} placeholder="e.g., Principal, Bursar" />
                <FormInput label="Job Title" value={staffForm.jobTitle} onChange={handleFormChange("jobTitle")} placeholder="Enter specific job title" />
                <FormInput label="Department *" value={staffForm.department} onChange={handleFormChange("department")} placeholder="e.g., Administration, Finance" />
                <FormInput label="Qualification" value={staffForm.qualification} onChange={handleFormChange("qualification")} placeholder="e.g., M.Ed, B.Sc" />
                <FormInput label="Years of Experience" type="number" value={staffForm.experience} onChange={handleFormChange("experience")} placeholder="Enter years" />
                <FormInput label="Employment Type" type="select" value={staffForm.employmentType} onChange={handleFormChange("employmentType")} options={[{value:"Full-time",label:"Full-time"},{value:"Part-time",label:"Part-time"},{value:"Contract",label:"Contract"},{value:"Temporary",label:"Temporary"}]} />
                <FormInput label="Employment Status" type="select" value={staffForm.employmentStatus} onChange={handleFormChange("employmentStatus")} options={[{value:"active",label:"Active"},{value:"on_leave",label:"On Leave"},{value:"suspended",label:"Suspended"},{value:"terminated",label:"Terminated"},{value:"retired",label:"Retired"}]} />
                <FormInput label="Role" type="select" value={staffForm.role} onChange={handleFormChange("role")} options={[{value:"Senior Management",label:"Senior Management"},{value:"Management",label:"Management"},{value:"Administrative",label:"Administrative"},{value:"Support Staff",label:"Support Staff"},{value:"Technical",label:"Technical"}]} />
                <FormInput label="Salary (₦)" type="number" value={staffForm.salary} onChange={handleFormChange("salary")} placeholder="Enter monthly salary" />
                <FormInput label="Salary Grade" value={staffForm.salaryGrade} onChange={handleFormChange("salaryGrade")} placeholder="e.g., Grade 12, Level 08" />
                <FormInput label="Joining Date" type="date" value={staffForm.joiningDate} onChange={handleFormChange("joiningDate")} />
                <FormInput label="Confirmation Date" type="date" value={staffForm.confirmationDate} onChange={handleFormChange("confirmationDate")} />
              </div>
            </div>

            {/* Financial Information */}
            <div className="sfp-section">
              <div className="sfp-section-title">Financial Information</div>
              <div className="sfp-form-row">
                <FormInput label="Bank Name" value={staffForm.bankName} onChange={handleFormChange("bankName")} placeholder="Enter bank name" />
                <FormInput label="Bank Account Number" value={staffForm.bankAccount} onChange={handleFormChange("bankAccount")} placeholder="Enter account number" />
                <FormInput label="National ID" value={staffForm.nationalId} onChange={handleFormChange("nationalId")} placeholder="Enter national ID number" />
                <FormInput label="Tax Number" value={staffForm.taxNumber} onChange={handleFormChange("taxNumber")} placeholder="Enter tax identification number" />
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="sfp-section">
              <div className="sfp-section-title">Emergency Contact</div>
              <div className="sfp-form-row">
                <FormInput label="Emergency Contact Name" value={staffForm.emergencyContact} onChange={handleFormChange("emergencyContact")} placeholder="Enter contact name" />
                <FormInput label="Emergency Contact Phone" value={staffForm.emergencyContactPhone} onChange={handleFormChange("emergencyContactPhone")} placeholder="Enter contact phone" />
                <FormInput label="Emergency Contact Relationship" value={staffForm.emergencyContactRelationship} onChange={handleFormChange("emergencyContactRelationship")} placeholder="e.g., Spouse, Parent" />
              </div>
              <FormInput label="Emergency Contact Address" value={staffForm.emergencyContactAddress} onChange={handleFormChange("emergencyContactAddress")} placeholder="Enter emergency contact address" />

              <div className="sfp-section-title" style={{ marginTop: 8 }}>Next of Kin</div>
              <div className="sfp-form-row">
                <FormInput label="Next of Kin Name" value={staffForm.nextOfKin} onChange={handleFormChange("nextOfKin")} placeholder="Enter next of kin name" />
                <FormInput label="Next of Kin Phone" value={staffForm.nextOfKinPhone} onChange={handleFormChange("nextOfKinPhone")} placeholder="Enter next of kin phone" />
                <FormInput label="Next of Kin Relationship" value={staffForm.nextOfKinRelationship} onChange={handleFormChange("nextOfKinRelationship")} placeholder="e.g., Spouse, Parent, Child" />
              </div>
              <FormInput label="Next of Kin Address" value={staffForm.nextOfKinAddress} onChange={handleFormChange("nextOfKinAddress")} placeholder="Enter next of kin address" />
            </div>

            {/* Security */}
            {!isEditMode && (
              <div className="sfp-section">
                <div className="sfp-section-title">Security & Access</div>
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: "12px",
                  background: "#eff6ff", border: "1px solid #bfdbfe",
                  borderRadius: "10px", padding: "14px 16px",
                }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>📧</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#1e40af", marginBottom: "4px" }}>
                      Password setup via email
                    </div>
                    <div style={{ fontSize: "13px", color: "#3b82f6", lineHeight: 1.5 }}>
                      A secure link will be sent to <strong>{staffForm.email || "the staff's email"}</strong> after
                      account creation. They'll use it to set their own password.
                      The link expires in 48 hours.
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "14px" }}>
                  <FormInput label="Enable Two-Factor Authentication" type="checkbox" value={staffForm.twoFactorAuth} onChange={handleFormChange("twoFactorAuth")} />
                  {staffForm.twoFactorAuth && (
                    <div className="sfp-2fa-info">
                      Two-factor authentication will be set up via SMS or authenticator app after account creation.
                    </div>
                  )}
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
