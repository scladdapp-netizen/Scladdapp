import React from "react";
import { useParams } from "react-router-dom";
import "./TeacherProfile.css";

const TeacherProfile = () => {
  const { teacherId, subseasion } = useParams();

  return (
    <div className="teacher-profile">
      <div className="profile-content">
        <h2>Teacher Profile Overview</h2>
        <p>
          {subseasion
            ? "Session-specific teacher information and performance data."
            : "Overall teacher profile and permanent information."}
        </p>

        <div className="profile-info">
          <div className="info-card">
            <h3>Teacher ID</h3>
            <p>{teacherId}</p>
          </div>

          {subseasion && (
            <div className="info-card">
              <h3>Session ID</h3>
              <p>{subseasion}</p>
            </div>
          )}

          <div className="info-card">
            <h3>Context</h3>
            <p>{subseasion ? "Session Data" : "Overall Data"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
