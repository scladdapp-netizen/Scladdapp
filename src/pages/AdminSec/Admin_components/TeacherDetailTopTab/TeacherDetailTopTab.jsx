import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./TeacherDetailTopTab.css";
import Button from "../../../../components/Button/Button";
import DynamicForm from "../../../../components/DynamicForm/DynamicForm";
import CenterModal from "../../../../components/CenterModal/CenterModal";
import { Icons } from "../../../../utils/icons";

const TeacherDetailTopTab = ({
  title,
  subtitle,
  buttonText,
  fields,
  route,
  data,
  onSubmit,
}) => {
  const navigate = useNavigate();
  const { teacherId, subseasion, schoolId } = useParams();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleBackClick = () => {
    navigate(`/admin/${schoolId}/school_directory/teachers`);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        setShowEditModal(false);
        // You might want to show a success message here
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      // You might want to show an error message here
    }
  };

  const getContextInfo = () => {
    if (subseasion) {
      return {
        type: "Session Data",
        description: "Information specific to the selected academic session",
        icon: <Icons.Class size={16} color="#3b82f6" />,
      };
    } else {
      return {
        type: "Overall Data",
        description: "Permanent teacher information not tied to any session",
        icon: <Icons.Guardians size={16} color="#10b981" />,
      };
    }
  };

  const contextInfo = getContextInfo();

  return (
    <div className="teacher-detail-top-tab">
      <div className="top-tab-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBackClick}>
            <Icons.Report size={20} />
            <span>Back to Teachers</span>
          </button>

          <div className="title-section">
            <div className="title-row">
              <h1 className="page-title">{title}</h1>
              <div className="context-badge">
                {contextInfo.icon}
                <span>{contextInfo.type}</span>
              </div>
            </div>
            <p className="page-subtitle">{subtitle}</p>
            <p className="context-description">{contextInfo.description}</p>
          </div>
        </div>

        <div className="header-right">
          <Button variant="primary" onClick={handleEditClick}>
            {buttonText}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {route && route.length > 0 && (
        <div className="navigation-tabs">
          <div className="tabs-container">
            {route.map((tab, index) => {
              const isActive =
                window.location.pathname.endsWith(tab.link) ||
                (tab.link === "" &&
                  window.location.pathname ===
                    `/admin/${schoolId}/teachers/${teacherId}${
                      subseasion ? `/${subseasion}` : ""
                    }`);

              return (
                <button
                  key={index}
                  className={`nav-tab ${isActive ? "active" : ""}`}
                  onClick={() => {
                    const basePath = `/admin/${schoolId}/teachers/${teacherId}`;
                    const fullPath = subseasion
                      ? `${basePath}/${subseasion}${tab.link}`
                      : `${basePath}${tab.link}`;
                    navigate(fullPath);
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <CenterModal
        isShow={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${data?.name || "Teacher"}`}
        width="600px"
      >
        <div className="edit-form-container">
          <DynamicForm
            fields={fields}
            initialData={data}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowEditModal(false)}
            submitText="Save Changes"
            cancelText="Cancel"
          />
        </div>
      </CenterModal>
    </div>
  );
};

export default TeacherDetailTopTab;
