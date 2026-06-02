import React, { useState } from "react";
import FormInput from "../../../../../../components/FormInput";
import Button from "../../../../../../components/Button/Button";
import { FaEnvelope, FaMobile, FaBell, FaUser, FaUsers } from "react-icons/fa";
import "./NotificationPreferences.css";

const NotificationPreferences = ({ onClose, recipientType = "parent" }) => {
  const [preferences, setPreferences] = useState({
    // Channel preferences
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,

    // Category preferences
    feeReminders: { email: true, sms: true, push: false },
    academicUpdates: { email: true, sms: false, push: true },
    attendanceAlerts: { email: true, sms: true, push: true },
    emergencyAlerts: { email: true, sms: true, push: true },
    libraryNotices: { email: true, sms: false, push: false },
    eventReminders: { email: true, sms: false, push: true },

    // Timing preferences
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "07:00",
    },

    // Frequency preferences
    digestMode: false,
    digestTime: "18:00",
  });

  const handleChannelChange = (category, channel) => (value) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value,
      },
    }));
  };

  const handleGlobalChannelChange = (channel) => (value) => {
    setPreferences((prev) => ({
      ...prev,
      [`${channel}Enabled`]: value,
    }));
  };

  const handleTimingChange = (field) => (value) => {
    setPreferences((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value,
      },
    }));
  };

  const handleSavePreferences = () => {
    console.log("Saving preferences:", preferences);
    onClose();
  };

  const categories = [
    {
      key: "feeReminders",
      label: "Fee Reminders",
      description: "Payment due dates, overdue notices, payment confirmations",
      icon: <FaEnvelope />,
    },
    {
      key: "academicUpdates",
      label: "Academic Updates",
      description: "Report cards, exam schedules, assignment notifications",
      icon: <FaBell />,
    },
    {
      key: "attendanceAlerts",
      label: "Attendance Alerts",
      description: "Low attendance warnings, absence notifications",
      icon: <FaUser />,
    },
    {
      key: "emergencyAlerts",
      label: "Emergency Alerts",
      description: "School closures, urgent announcements, safety notices",
      icon: <FaBell />,
    },
    {
      key: "libraryNotices",
      label: "Library Notices",
      description: "Book due dates, overdue fines, new arrivals",
      icon: <FaBell />,
    },
    {
      key: "eventReminders",
      label: "Event Reminders",
      description: "School events, meetings, sports activities",
      icon: <FaUsers />,
    },
  ];

  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <h2>Notification Preferences</h2>
        <p>Customize how and when you receive notifications</p>
      </div>

      <div className="preferences-body">
        {/* Global Channel Settings */}
        <div className="preferences-section">
          <h3>Global Channel Settings</h3>
          <div className="global-channels">
            <div className="channel-setting">
              <div className="channel-info">
                <FaEnvelope className="channel-icon email" />
                <div>
                  <div className="channel-name">Email Notifications</div>
                  <div className="channel-desc">
                    Receive notifications via email
                  </div>
                </div>
              </div>
              <FormInput
                type="switch"
                value={preferences.emailEnabled}
                onChange={handleGlobalChannelChange("email")}
              />
            </div>

            <div className="channel-setting">
              <div className="channel-info">
                <FaMobile className="channel-icon sms" />
                <div>
                  <div className="channel-name">SMS Notifications</div>
                  <div className="channel-desc">
                    Receive notifications via text message
                  </div>
                </div>
              </div>
              <FormInput
                type="switch"
                value={preferences.smsEnabled}
                onChange={handleGlobalChannelChange("sms")}
              />
            </div>

            <div className="channel-setting">
              <div className="channel-info">
                <FaBell className="channel-icon push" />
                <div>
                  <div className="channel-name">Push Notifications</div>
                  <div className="channel-desc">
                    Receive notifications in the app
                  </div>
                </div>
              </div>
              <FormInput
                type="switch"
                value={preferences.pushEnabled}
                onChange={handleGlobalChannelChange("push")}
              />
            </div>
          </div>
        </div>

        {/* Category Preferences */}
        <div className="preferences-section">
          <h3>Notification Categories</h3>
          <div className="category-preferences">
            {categories.map((category) => (
              <div key={category.key} className="category-item">
                <div className="category-header">
                  <div className="category-info">
                    {category.icon}
                    <div>
                      <div className="category-name">{category.label}</div>
                      <div className="category-desc">
                        {category.description}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="category-channels">
                  <div className="channel-option">
                    <span className="channel-label">Email</span>
                    <FormInput
                      type="checkbox"
                      value={preferences[category.key]?.email}
                      onChange={handleChannelChange(category.key, "email")}
                      disabled={!preferences.emailEnabled}
                    />
                  </div>
                  <div className="channel-option">
                    <span className="channel-label">SMS</span>
                    <FormInput
                      type="checkbox"
                      value={preferences[category.key]?.sms}
                      onChange={handleChannelChange(category.key, "sms")}
                      disabled={!preferences.smsEnabled}
                    />
                  </div>
                  <div className="channel-option">
                    <span className="channel-label">Push</span>
                    <FormInput
                      type="checkbox"
                      value={preferences[category.key]?.push}
                      onChange={handleChannelChange(category.key, "push")}
                      disabled={!preferences.pushEnabled}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timing Preferences */}
        <div className="preferences-section">
          <h3>Timing Preferences</h3>

          <div className="timing-setting">
            <div className="setting-header">
              <FormInput
                type="checkbox"
                value={preferences.quietHours.enabled}
                onChange={handleTimingChange("enabled")}
              />
              <div>
                <div className="setting-name">Quiet Hours</div>
                <div className="setting-desc">
                  Don't send non-urgent notifications during these hours
                </div>
              </div>
            </div>

            {preferences.quietHours.enabled && (
              <div className="time-range">
                <FormInput
                  label="Start Time"
                  type="time"
                  value={preferences.quietHours.startTime}
                  onChange={handleTimingChange("startTime")}
                />
                <FormInput
                  label="End Time"
                  type="time"
                  value={preferences.quietHours.endTime}
                  onChange={handleTimingChange("endTime")}
                />
              </div>
            )}
          </div>

          <div className="timing-setting">
            <div className="setting-header">
              <FormInput
                type="checkbox"
                value={preferences.digestMode}
                onChange={(value) =>
                  setPreferences((prev) => ({ ...prev, digestMode: value }))
                }
              />
              <div>
                <div className="setting-name">Daily Digest</div>
                <div className="setting-desc">
                  Receive a summary of non-urgent notifications once per day
                </div>
              </div>
            </div>

            {preferences.digestMode && (
              <div className="digest-time">
                <FormInput
                  label="Digest Time"
                  type="time"
                  value={preferences.digestTime}
                  onChange={(value) =>
                    setPreferences((prev) => ({ ...prev, digestTime: value }))
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="preferences-footer">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSavePreferences}>Save Preferences</Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
