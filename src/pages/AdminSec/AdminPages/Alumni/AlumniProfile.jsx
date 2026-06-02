import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import StudentDetailTopTab from "../../Admin_components/StudentDetailTopTab/StudentDetailTopTab";
import AlumniProfileTab from "./components/AlumniProfileTab/AlumniProfileTab";
import AlumniCertificatesTab from "./components/AlumniCertificatesTab/AlumniCertificatesTab";
import AlumniNotificationsTab from "./components/AlumniNotificationsTab/AlumniNotificationsTab";
import useAlumni from "../../../../api_call/useAlumni";
import { useAuth } from "../../../../context/AuthContext/AuthContext";
import "./AlumniProfile.css";

const AlumniProfile = () => {
  const { schoolId, alumniId } = useParams();
  const navigate = useNavigate();
  const { getAlumniById } = useAlumni();
  const { user } = useAuth();
  const [alumniData, setAlumniData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlumniById(alumniId).then((res) => {
      if (res.success && res.data) {
        const a = res.data;
        // Map backend fields to the shape AlumniProfileTab expects
        setAlumniData({
          // identity
          id: a.alumni_id,
          alumni_id: a.alumni_id,
          student_id: a.student_id,
          fullName: a.student_name || "—",
          gender: a.gender || null,
          dateOfBirth: null, // not stored on alumni record
          // graduation
          graduationYear: a.graduation_date ? new Date(a.graduation_date).getFullYear() : "—",
          graduationDate: a.graduation_date || null,
          finalClass: a.final_class_name || "—",
          graduationSession: a.graduation_session_name || null,
          status: a.graduation_date
            ? `Graduated ${new Date(a.graduation_date).getFullYear()}`
            : "Alumni",
          // contact
          contactEmail: a.contact_email || "",
          contactPhone: a.contact_phone || "",
          currentAddress: a.contact_address || "",
          // current status
          currentOccupation: a.current_occupation || "",
          currentInstitution: a.current_employer || "",
          course: a.current_position || "",
          currentLocation: a.current_location || "",
          // social
          linkedin_profile: a.linkedin_profile || "",
          // extra
          achievements: a.achievements || "",
          remarks: a.remarks || "",
          notes: a.remarks || "",
          willing_to_mentor: a.willing_to_mentor || false,
          willing_to_speak: a.willing_to_speak || false,
          willing_to_donate: a.willing_to_donate || false,
        });
      }
      setLoading(false);
    });
  }, [alumniId]);

  // Tab routes configuration
  const tabRoutes = [
    { label: "Profile", link: "" },
    { label: "Certificates", link: "/certificates" },
    { label: "Notifications", link: "/notifications" },
  ];

  // Handle alumni data update — calls backend then merges locally
  const handleAlumniUpdate = async (updatedFields) => {
    try {
      const res = await fetch(`http://localhost:3000/api/alumni/${alumniId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_email: updatedFields.contactEmail,
          contact_phone: updatedFields.contactPhone,
          contact_address: updatedFields.currentAddress,
          current_occupation: updatedFields.currentOccupation,
          current_employer: updatedFields.currentInstitution,
          current_position: updatedFields.course,
          modified_by: user?.admin?.admin_id || user?.user_id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlumniData((prev) => ({ ...prev, ...updatedFields }));
      }
    } catch (err) {
      console.error("Update alumni error:", err);
    }
  };

  if (loading) {
    return (
      <div className="alumni-profile-loading">
        <div className="loading-spinner">Loading alumni profile...</div>
      </div>
    );
  }

  if (!alumniData) {
    return (
      <div className="alumni-profile-error">
        <h2>Alumni Not Found</h2>
        <p>The requested alumni profile could not be found.</p>
        <button onClick={() => navigate(`/admin/${schoolId}/alumni`)}>
          Back to Alumni Directory
        </button>
      </div>
    );
  }

  return (
    <div className="alumni-profile">
      <StudentDetailTopTab
        title={alumniData.fullName}
        subtitle={`${alumniData.status} • Final Class: ${alumniData.finalClass} • ID: ${alumniData.alumni_id}`}
        route={tabRoutes}
        showButton={true}
        buttonText="Edit Alumni"
        onButtonClick={() => console.log("Edit alumni clicked")}
      >
        <AlumniProfileContent
          alumniData={alumniData}
          onUpdate={handleAlumniUpdate}
        />
      </StudentDetailTopTab>
    </div>
  );
};

// Content component to handle different tabs
const AlumniProfileContent = ({ alumniData, onUpdate }) => {
  const location = useLocation();
  const { schoolId, alumniId } = useParams();

  // Determine which tab to show based on URL
  const getCurrentTab = () => {
    if (location.pathname.includes("/certificates")) {
      return "certificates";
    } else if (location.pathname.includes("/notifications")) {
      return "notifications";
    } else {
      return "profile";
    }
  };

  const currentTab = getCurrentTab();

  switch (currentTab) {
    case "certificates":
      return (
        <AlumniCertificatesTab alumniData={alumniData} onUpdate={onUpdate} />
      );
    case "notifications":
      return (
        <AlumniNotificationsTab alumniData={alumniData} onUpdate={onUpdate} />
      );
    default:
      return <AlumniProfileTab alumniData={alumniData} onUpdate={onUpdate} />;
  }
};

export default AlumniProfile;
