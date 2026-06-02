import React from "react";
import {
  FaEnvelope,
  FaMobile,
  FaBell,
  FaEye,
  FaMousePointer,
} from "react-icons/fa";
import "./NotificationAnalytics.css";

const NotificationAnalytics = ({ onClose }) => {
  // Mock analytics data
  const analyticsData = {
    totalSent: 2847,
    totalDelivered: 2798,
    totalOpened: 2234,
    totalClicked: 892,
    deliveryRate: 98.3,
    openRate: 79.8,
    clickRate: 31.9,
    channelBreakdown: {
      email: { sent: 1523, opened: 1289, clicked: 567 },
      sms: { sent: 892, opened: 756, clicked: 234 },
      push: { sent: 432, opened: 189, clicked: 91 },
    },
    typeBreakdown: {
      system: { count: 1847, openRate: 85.2 },
      manual: { count: 1000, openRate: 72.4 },
    },
    recentTrends: [
      { date: "Jan 6", sent: 234, opened: 187 },
      { date: "Jan 7", sent: 189, opened: 156 },
      { date: "Jan 8", sent: 267, opened: 223 },
      { date: "Jan 9", sent: 198, opened: 167 },
      { date: "Jan 10", sent: 245, opened: 201 },
    ],
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Notification Analytics</h2>
        <p>Performance metrics and delivery insights</p>
      </div>

      <div className="analytics-body">
        {/* Overview Cards */}
        <div className="overview-cards">
          <div className="analytics-card">
            <div className="card-icon">
              <FaEnvelope />
            </div>
            <div className="card-content">
              <div className="card-value">
                {analyticsData.totalSent.toLocaleString()}
              </div>
              <div className="card-label">Total Sent</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon delivered">
              <FaBell />
            </div>
            <div className="card-content">
              <div className="card-value">{analyticsData.deliveryRate}%</div>
              <div className="card-label">Delivery Rate</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon opened">
              <FaEye />
            </div>
            <div className="card-content">
              <div className="card-value">{analyticsData.openRate}%</div>
              <div className="card-label">Open Rate</div>
            </div>
          </div>

          <div className="analytics-card">
            <div className="card-icon clicked">
              <FaMousePointer />
            </div>
            <div className="card-content">
              <div className="card-value">{analyticsData.clickRate}%</div>
              <div className="card-label">Click Rate</div>
            </div>
          </div>
        </div>

        {/* Channel Performance */}
        <div className="analytics-section">
          <h3>Channel Performance</h3>
          <div className="channel-stats">
            <div className="channel-item">
              <div className="channel-header">
                <FaEnvelope className="channel-icon email" />
                <span className="channel-name">Email</span>
              </div>
              <div className="channel-metrics">
                <div className="metric">
                  <span className="metric-label">Sent:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.email.sent}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Opened:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.email.opened}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Clicked:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.email.clicked}
                  </span>
                </div>
              </div>
              <div className="channel-rate">
                Open Rate:{" "}
                {Math.round(
                  (analyticsData.channelBreakdown.email.opened /
                    analyticsData.channelBreakdown.email.sent) *
                    100
                )}
                %
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-header">
                <FaMobile className="channel-icon sms" />
                <span className="channel-name">SMS</span>
              </div>
              <div className="channel-metrics">
                <div className="metric">
                  <span className="metric-label">Sent:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.sms.sent}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Opened:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.sms.opened}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Clicked:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.sms.clicked}
                  </span>
                </div>
              </div>
              <div className="channel-rate">
                Open Rate:{" "}
                {Math.round(
                  (analyticsData.channelBreakdown.sms.opened /
                    analyticsData.channelBreakdown.sms.sent) *
                    100
                )}
                %
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-header">
                <FaBell className="channel-icon push" />
                <span className="channel-name">Push</span>
              </div>
              <div className="channel-metrics">
                <div className="metric">
                  <span className="metric-label">Sent:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.push.sent}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Opened:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.push.opened}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Clicked:</span>
                  <span className="metric-value">
                    {analyticsData.channelBreakdown.push.clicked}
                  </span>
                </div>
              </div>
              <div className="channel-rate">
                Open Rate:{" "}
                {Math.round(
                  (analyticsData.channelBreakdown.push.opened /
                    analyticsData.channelBreakdown.push.sent) *
                    100
                )}
                %
              </div>
            </div>
          </div>
        </div>

        {/* Type Breakdown */}
        <div className="analytics-section">
          <h3>Notification Types</h3>
          <div className="type-stats">
            <div className="type-item">
              <div className="type-info">
                <span className="type-name">System Alerts</span>
                <span className="type-count">
                  {analyticsData.typeBreakdown.system.count} notifications
                </span>
              </div>
              <div className="type-rate">
                {analyticsData.typeBreakdown.system.openRate}% open rate
              </div>
            </div>
            <div className="type-item">
              <div className="type-info">
                <span className="type-name">Manual Notifications</span>
                <span className="type-count">
                  {analyticsData.typeBreakdown.manual.count} notifications
                </span>
              </div>
              <div className="type-rate">
                {analyticsData.typeBreakdown.manual.openRate}% open rate
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="analytics-section">
          <h3>Recent Activity (Last 5 Days)</h3>
          <div className="trends-chart">
            {analyticsData.recentTrends.map((day, index) => (
              <div key={index} className="trend-day">
                <div className="trend-bar">
                  <div
                    className="trend-sent"
                    style={{ height: `${(day.sent / 300) * 100}%` }}
                  />
                  <div
                    className="trend-opened"
                    style={{ height: `${(day.opened / 300) * 100}%` }}
                  />
                </div>
                <div className="trend-labels">
                  <div className="trend-date">{day.date}</div>
                  <div className="trend-values">
                    <span className="sent-value">{day.sent}</span>
                    <span className="opened-value">{day.opened}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color sent"></div>
              <span>Sent</span>
            </div>
            <div className="legend-item">
              <div className="legend-color opened"></div>
              <span>Opened</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-footer">
        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationAnalytics;
