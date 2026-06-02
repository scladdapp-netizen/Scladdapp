import { useState } from "react";
import useAppFeedback from "../../api_call/useAppFeedback";
import "./FeedbackPanel.css";

const FeedbackPanel = ({ isOpen, onClose, userType, userId, userName, userEmail, schoolId, schoolName }) => {
  const { submitFeedback } = useAppFeedback();
  const [type, setType] = useState("report");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    const res = await submitFeedback({
      user_type: userType,
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      school_id: schoolId,
      school_name: schoolName,
      type,
      message: message.trim(),
    });
    setLoading(false);
    if (res.success) {
      setSubmitted(true);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setMessage("");
    setType("report");
    onClose();
  };

  return (
    <div className="fbp_overlay" onClick={handleClose}>
      <div className="fbp_panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="fbp_header">
          <div className="fbp_header_icon">
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M11 3l8 4-8 4-8-4 8-4z" fill="white" opacity="0.3" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="15" cy="15" r="4" fill="white" opacity="0.2" stroke="white" strokeWidth="1.5" />
              <path d="M15 13v2.5M15 17h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="fbp_title">Report / Improvement Idea</p>
            <p className="fbp_subtitle">Help us make Scladapp better</p>
          </div>
          <button className="fbp_close" onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="fbp_success">
            <div className="fbp_success_icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
                <path d="M10 16l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="fbp_success_title">Thank you for your feedback!</p>
            <p className="fbp_success_msg">
              We appreciate you taking the time to share your thoughts. Your input helps us improve Scladapp for everyone.
            </p>
            <button className="fbp_btn_primary" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <form className="fbp_body" onSubmit={handleSubmit}>
            {/* Type toggle */}
            <div className="fbp_field">
              <label className="fbp_label">Type</label>
              <div className="fbp_toggle_group">
                <button
                  type="button"
                  className={`fbp_toggle_btn ${type === "report" ? "active" : ""}`}
                  onClick={() => setType("report")}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 5v3.5M8 10.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Bug / Issue
                </button>
                <button
                  type="button"
                  className={`fbp_toggle_btn ${type === "improvement" ? "active" : ""}`}
                  onClick={() => setType("improvement")}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Improvement Idea
                </button>
              </div>
            </div>

            {/* Message */}
            <div className="fbp_field">
              <label className="fbp_label" htmlFor="fbp_message">
                {type === "report" ? "Describe the issue" : "Share your idea"}
              </label>
              <textarea
                id="fbp_message"
                className="fbp_textarea"
                placeholder={
                  type === "report"
                    ? "What went wrong? What were you doing when it happened?"
                    : "What would make Scladapp better for you?"
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </div>

            {/* From */}
            <div className="fbp_from">
              <span className="fbp_from_label">From</span>
              <span className="fbp_from_value">{userName}</span>
              {schoolName && (
                <>
                  <span className="fbp_from_sep">·</span>
                  <span className="fbp_from_value">{schoolName}</span>
                </>
              )}
            </div>

            <button
              type="submit"
              className="fbp_btn_primary"
              disabled={loading || !message.trim()}
            >
              {loading ? "Sending…" : "Send Feedback"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackPanel;
