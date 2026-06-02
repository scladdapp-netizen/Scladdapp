import { useNavigate, useParams } from "react-router-dom";
import { FaCrown, FaTimes } from "react-icons/fa";
import "./SubscriptionLimitModal.css";

/**
 * SubscriptionLimitModal — shown when a storage/plan limit is exceeded.
 *
 * Props:
 *   isOpen   {boolean}
 *   onClose  {function}
 *   message  {string}   — custom message from the backend (optional)
 *   title    {string}   — custom title (optional)
 */
const SubscriptionLimitModal = ({
  isOpen,
  onClose,
  message = "You have reached your storage limit. Upgrade your plan to continue uploading files.",
  title = "Storage Limit Reached",
}) => {
  const navigate = useNavigate();
  const { schoolId } = useParams();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    navigate(`/admin/${schoolId}/settings/subscriptions?tab=upgrade`);
  };

  return (
    <div className="slm-overlay" onClick={onClose}>
      <div className="slm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="slm-close" onClick={onClose}>
          <FaTimes size={16} />
        </button>

        <div className="slm-icon">
          <FaCrown size={40} color="#f59e0b" />
        </div>

        <h2 className="slm-title">{title}</h2>
        <p className="slm-message">{message}</p>

        <div className="slm-actions">
          <button className="slm-cancel" onClick={onClose}>Maybe Later</button>
          <button className="slm-upgrade" onClick={handleUpgrade}>
            <FaCrown size={14} /> Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionLimitModal;
