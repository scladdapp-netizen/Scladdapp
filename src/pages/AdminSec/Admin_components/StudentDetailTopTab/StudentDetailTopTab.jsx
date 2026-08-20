import { useState } from "react";
import "./StudentDetailTopTab.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import DynamicForm from "../../../../components/DynamicForm/DynamicForm";
import SlideInMenu from "../../../../components/SlideInMenu/SlideInMenu";

const StudentDetailTopTab = ({
  children,
  title,
  subtitle,
  buttonText = "Edit Student",
  fields = [],
  route = [],
  data = {},
  onSubmit,
  onButtonClick,
  showButton = false,
}) => {
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);

  const navigate = useNavigate();
  const {
    schoolId,
    studentId,
    classId,
    subjectId,
    teacherId,
    adminId,
    staffId,
    billId,
    subseasion,
    alumniId,
    assignmentId,
  } = useParams();
  const location = useLocation();

  // Determine context type
  const isClassContext = !!classId;
  const isSubjectContext = !!subjectId;
  const isTeacherContext = !!teacherId;
  const isAdminContext = !!adminId;
  const isStaffContext = !!staffId;
  const isBillContext = !!billId;
  const isAlumniContext = !!alumniId;
  const isSchoolDirectoryContext =
    location.pathname.includes("/school_directory");
  const isTemplatesContext = location.pathname.includes("/templates");
  const isCommunicationContext = location.pathname.includes("/communication");
  const isSettingsContext = location.pathname.includes("/settings");
  const isFeeBillingContext = location.pathname.includes("/fee_billing");
  const isSchoolContext = location.pathname.includes("/admin/") && location.pathname.includes("/school") && !location.pathname.includes("/school_directory");
  const isAssignmentsContext = location.pathname.includes("/teacher/") && location.pathname.includes("/assignments");
  const isEventsContext = location.pathname.includes("/teacher/") && location.pathname.includes("/events");
  const isTeacherSubjectContext = location.pathname.includes("/teacher/") && location.pathname.includes("/subject/");
  const isTeacherClassContext   = location.pathname.includes("/teacher/") && location.pathname.includes("/class/");
  const isSchoolInfoContext = (location.pathname.includes("/teacher/") || location.pathname.includes("/student/")) && location.pathname.includes("/school") && !location.pathname.includes("/alumni") && !location.pathname.includes("/session/");
  const isSessionContext = location.pathname.includes("/student/") && location.pathname.includes("/session/") && !location.pathname.includes("/alumni");
  const isStudentProfileContext = location.pathname.includes("/student/") && location.pathname.includes("/alumni") && !location.pathname.includes("/admin/");
  const isTeacherProfileContext = location.pathname.includes("/teacher/") && location.pathname.includes("/profile");

  const entityId = isClassContext
    ? classId
    : isSubjectContext
    ? subjectId
    : isTeacherContext
    ? teacherId
    : isAdminContext
    ? adminId
    : isStaffContext
    ? staffId
    : isBillContext
    ? billId
    : isAlumniContext
    ? alumniId
    : studentId;
  const entityType = isClassContext
    ? "Class"
    : isSubjectContext
    ? "subjects"
    : isTeacherContext
    ? "teachers"
    : isAdminContext
    ? "admins"
    : isStaffContext
    ? "staff"
    : isFeeBillingContext
    ? "fee_billing"
    : isAlumniContext
    ? "alumni/profile"
    : isSchoolDirectoryContext
    ? "school_directory"
    : isTemplatesContext
    ? "templates"
    : isCommunicationContext
    ? "communication"
    : isSettingsContext
    ? "settings"
    : isSchoolContext
    ? "school"
    : "Profile";

  // Debug logging
  console.log("StudentDetailTopTab - Title:", title);
  console.log("StudentDetailTopTab - Subtitle:", subtitle);
  console.log("StudentDetailTopTab - Subseasion:", subseasion);
  console.log("StudentDetailTopTab - Location:", location.pathname);
  console.log(
    "StudentDetailTopTab - Context:",
    isClassContext
      ? "Class"
      : isSubjectContext
      ? "Subject"
      : isTeacherContext
      ? "Teacher"
      : isAdminContext
      ? "Admin"
      : isStaffContext
      ? "Staff"
      : isBillContext
      ? "Bill"
      : isAlumniContext
      ? "Alumni"
      : isSchoolDirectoryContext
      ? "SchoolDirectory"
      : isTemplatesContext
      ? "Templates"
      : isCommunicationContext
      ? "Communication"
      : isSettingsContext
      ? "Settings"
      : isFeeBillingContext
      ? "FeeBilling"
      : "Student"
  );

  const isActive = (link) => {
    // Handle alumni context
    if (isAlumniContext) {
      if (!link) {
        // Default route for alumni profile
        return (
          location.pathname === `/admin/${schoolId}/alumni/profile/${alumniId}`
        );
      }
      return (
        location.pathname ===
        `/admin/${schoolId}/alumni/profile/${alumniId}${link}`
      );
    }

    // Handle templates context
    if (isTemplatesContext) {
      if (!link) {
        // Default route for templates (grading templates)
        return (
          location.pathname === `/admin/${schoolId}/templates` ||
          location.pathname === `/admin/${schoolId}/templates/grading`
        );
      }
      return location.pathname === `/admin/${schoolId}/templates${link}`;
    }

    // Handle school directory context
    if (isSchoolDirectoryContext) {
      if (!link) {
        // Default route for school directory (students)
        return (
          location.pathname === `/admin/${schoolId}/school_directory` ||
          location.pathname === `/admin/${schoolId}/school_directory/students`
        );
      }
      return location.pathname === `/admin/${schoolId}/school_directory${link}`;
    }

    // Handle communication context
    if (isCommunicationContext) {
      if (!link) {
        // Default route for communication (announcements)
        return (
          location.pathname === `/admin/${schoolId}/communication` ||
          location.pathname === `/admin/${schoolId}/communication/announcements`
        );
      }
      return location.pathname === `/admin/${schoolId}/communication${link}`;
    }

    // Handle settings context
    if (isSettingsContext) {
      if (!link) {
        // Default route for settings (subscriptions)
        return (
          location.pathname === `/admin/${schoolId}/settings` ||
          location.pathname === `/admin/${schoolId}/settings/subscriptions`
        );
      }
      return location.pathname === `/admin/${schoolId}/settings${link}`;
    }

    // Handle school context
    if (isSchoolContext) {
      if (!link) {
        return (
          location.pathname === `/admin/${schoolId}/school` ||
          location.pathname === `/admin/${schoolId}/school/profile`
        );
      }
      return location.pathname === `/admin/${schoolId}/school${link}`;
    }

    // Handle teacher subject context
    if (isTeacherSubjectContext) {
      const base = assignmentId
        ? `/teacher/${schoolId}/subject/${subjectId}/${assignmentId}`
        : `/teacher/${schoolId}/subject/${subjectId}`;
      if (!link) {
        return (
          location.pathname === base ||
          location.pathname === `${base}/info`
        );
      }
      // Assessment tab — match prefix since subseasionId is in the path
      if (link === "/assessment") {
        return location.pathname.startsWith(`${base}/assessment`);
      }
      return location.pathname === `${base}${link}`;
    }

    // Handle teacher class context
    if (isTeacherClassContext) {
      const base = `/teacher/${schoolId}/class/${classId}`;
      if (!link) {
        return (
          location.pathname === base ||
          location.pathname === `${base}/info`
        );
      }
      return location.pathname === `${base}${link}`;
    }

    // Handle assignments context
    if (isAssignmentsContext) {
      if (!link) {
        return (
          location.pathname === `/teacher/${schoolId}/assignments` ||
          location.pathname === `/teacher/${schoolId}/assignments/subjects`
        );
      }
      return location.pathname === `/teacher/${schoolId}/assignments${link}`;
    }

    // Handle events context
    if (isEventsContext) {
      if (!link) {
        return (
          location.pathname === `/teacher/${schoolId}/events` ||
          location.pathname === `/teacher/${schoolId}/events/school-events`
        );
      }
      return location.pathname === `/teacher/${schoolId}/events${link}`;
    }

    // Handle school info context (teacher + student)
    if (isSchoolInfoContext) {
      const base = location.pathname.includes("/teacher/")
        ? `/teacher/${schoolId}/school`
        : location.pathname.split("/school/")[0] + `/school/${schoolId}/school`;
      if (!link) return location.pathname === base || location.pathname === `${base}/info`;
      return location.pathname === `${base}${link}`;
    }

    // Handle session context (student)
    if (isSessionContext) {
      const parts = location.pathname.split("/session/");
      const subId = parts[1]?.split("/")[0];
      if (!subId) return false;
      const base = `${parts[0]}/session/${subId}`;
      return location.pathname === `${base}${link}`;
    }

    // Handle student profile/alumni context
    if (isStudentProfileContext) {
      const base = location.pathname.split("/alumni")[0] + "/alumni";
      if (!link) return location.pathname === base || location.pathname === `${base}/identity`;
      return location.pathname === `${base}${link}`;
    }

    // Handle teacher profile context
    if (isTeacherProfileContext) {
      const base = `/teacher/${schoolId}/profile`;
      if (!link) return location.pathname === base || location.pathname === `${base}/identity`;
      return location.pathname === `${base}${link}`;
    }

    if (isFeeBillingContext) {
      if (!link) {
        // Default route for fee billing (bills)
        return (
          location.pathname === `/admin/${schoolId}/fee_billing` ||
          location.pathname === `/admin/${schoolId}/fee_billing/`
        );
      }
      return location.pathname === `/admin/${schoolId}/fee_billing${link}`;
    }

    // Original logic for other contexts
    if (!link) {
      // For default route (empty link)
      return subseasion
        ? location.pathname ===
            `/admin/${schoolId}/${entityType}/${entityId}/${subseasion}`
        : location.pathname === `/admin/${schoolId}/${entityType}/${entityId}`;
    }

    // For routes with subseasion
    if (subseasion) {
      return (
        location.pathname ===
        `/admin/${schoolId}/${entityType}/${entityId}/${subseasion}${link}`
      );
    }

    // For entity info routes (no subseasion)
    return (
      location.pathname ===
      `/admin/${schoolId}/${entityType}/${entityId}${link}`
    );
  };

  const handleNavigation = (link) => {
    // Handle alumni context
    if (isAlumniContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/alumni/profile/${alumniId}`);
      } else {
        navigate(`/admin/${schoolId}/alumni/profile/${alumniId}${link}`);
      }
      return;
    }

    // Handle templates context
    if (isTemplatesContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/templates`);
      } else {
        navigate(`/admin/${schoolId}/templates${link}`);
      }
      return;
    }

    // Handle school directory context
    if (isSchoolDirectoryContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/school_directory/students`);
      } else {
        navigate(`/admin/${schoolId}/school_directory${link}`);
      }
      return;
    }

    // Handle communication context
    if (isCommunicationContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/communication/announcements`);
      } else {
        navigate(`/admin/${schoolId}/communication${link}`);
      }
      return;
    }

    // Handle settings context
    if (isSettingsContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/settings/subscriptions`);
      } else {
        navigate(`/admin/${schoolId}/settings${link}`);
      }
      return;
    }

    // Handle school context
    if (isSchoolContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/school/profile`);
      } else {
        navigate(`/admin/${schoolId}/school${link}`);
      }
      return;
    }

    // Handle teacher subject context
    if (isTeacherSubjectContext) {
      const base = assignmentId
        ? `/teacher/${schoolId}/subject/${subjectId}/${assignmentId}`
        : `/teacher/${schoolId}/subject/${subjectId}`;
      navigate(`${base}${link || "/info"}`);
      return;
    }

    // Handle teacher class context
    if (isTeacherClassContext) {
      const base = `/teacher/${schoolId}/class/${classId}`;
      navigate(`${base}${link || "/info"}`, { state: location.state });
      return;
    }

    // Handle assignments context
    if (isAssignmentsContext) {
      if (!link) {
        navigate(`/teacher/${schoolId}/assignments/subjects`);
      } else {
        navigate(`/teacher/${schoolId}/assignments${link}`);
      }
      return;
    }

    // Handle events context
    if (isEventsContext) {
      if (!link) {
        navigate(`/teacher/${schoolId}/events/school-events`);
      } else {
        navigate(`/teacher/${schoolId}/events${link}`);
      }
      return;
    }

    // Handle student profile/alumni context
    if (isStudentProfileContext) {
      const base = location.pathname.split("/alumni")[0] + "/alumni";
      navigate(`${base}${link || "/identity"}`);
      return;
    }

    // Handle teacher profile context
    if (isTeacherProfileContext) {
      const base = `/teacher/${schoolId}/profile`;
      navigate(`${base}${link || "/identity"}`);
      return;
    }

    // Handle school info context (teacher + student)
    if (isSchoolInfoContext) {
      const base = location.pathname.includes("/teacher/")
        ? `/teacher/${schoolId}/school`
        : location.pathname.split("/school/")[0] + `/school/${schoolId}/school`;
      if (!link) { navigate(`${base}/info`); } else { navigate(`${base}${link}`); }
      return;
    }

    // Handle session context (student)
    if (isSessionContext) {
      const parts = location.pathname.split("/session/");
      const subId = parts[1]?.split("/")[0];
      if (!subId) return;
      navigate(`${parts[0]}/session/${subId}${link}`);
      return;
    }

    // Handle fee billing context
    if (isFeeBillingContext) {
      if (!link) {
        navigate(`/admin/${schoolId}/fee_billing`);
      } else {
        navigate(`/admin/${schoolId}/fee_billing${link}`);
      }
      return;
    }

    // Original logic for other contexts
    if (!link) {
      // Navigate to default route
      if (subseasion) {
        navigate(`/admin/${schoolId}/${entityType}/${entityId}/${subseasion}`);
      } else {
        navigate(`/admin/${schoolId}/${entityType}/${entityId}`);
      }
      return;
    }

    // Navigate to specific route
    if (subseasion) {
      navigate(
        `/admin/${schoolId}/${entityType}/${entityId}/${subseasion}${link}`
      );
    } else {
      navigate(`/admin/${schoolId}/${entityType}/${entityId}${link}`);
    }
  };

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      setIsEditMenuOpen(true);
    }
  };

  const handleSubmit = async (formData) => {
    if (onSubmit) {
      return await onSubmit(formData);
    }

    console.log("UPDATE ENTITY:", entityId, formData);
    return { success: true };
  };

  return (
    <div className="sdttms">
      <div className="sdttts">
        {/* Decorative elements */}
        <span className="sdttts-deco-circle" aria-hidden="true" />
        <span className="sdttts-deco-box" aria-hidden="true" />

        {/* Header Section */}
        <div className="sdtttstss">
          <div className="sdtttstssts">
            <div className="sdtttstssls">
              <h1>{title}</h1>
              {showButton && (
                <Button onClick={handleButtonClick}>
                  <p className="df">{buttonText}</p>
                </Button>
              )}
            </div>
            {subtitle && <p className="sub">{subtitle}</p>}
          </div>
        </div>

        {/* Navigation Tabs */}
        {route && route.length > 0 && (
          <div className="sdtttsnt">
            <div className="sdtttsntic">
              {route.map((t, i) => (
                <div
                  key={i}
                  className={`sdtttti ${isActive(t.link) ? "active" : ""}`}
                  onClick={() => handleNavigation(t.link)}
                >
                  <p className="sdtttttit">{t.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Form Slide Menu */}
      {fields && fields.length > 0 && (
        <SlideInMenu
          isShow={isEditMenuOpen}
          onClose={() => setIsEditMenuOpen(false)}
          width="450px"
        >
          <DynamicForm
            title={`Edit ${title}`}
            fields={fields}
            initialData={data}
            isEdit={true}
            submitButtonText={`Update ${title}`}
            loadingText="Updating..."
            onSubmit={handleSubmit}
            onCancel={() => setIsEditMenuOpen(false)}
            onSuccess={() => {
              setIsEditMenuOpen(false);
            }}
          />
        </SlideInMenu>
      )}

      {/* Content Area */}
      <div className="sdttcs">{children}</div>
    </div>
  );
};

export default StudentDetailTopTab;
