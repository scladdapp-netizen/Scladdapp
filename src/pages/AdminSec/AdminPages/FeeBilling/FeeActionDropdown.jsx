import React, { useState, useRef, useEffect } from "react";
import {
  FaEllipsisV,
  FaEye,
  FaEdit,
  FaCopy,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";

const FeeActionDropdown = ({
  row,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = (action, event) => {
    event.stopPropagation();
    setIsOpen(false);

    switch (action) {
      case "view":
        onView(row);
        break;
      case "edit":
        onEdit(row);
        break;
      case "duplicate":
        onDuplicate(row);
        break;
      case "toggleStatus":
        onToggleStatus(row);
        break;
      default:
        break;
    }
  };

  const toggleDropdown = (event) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Define available actions for fee management
  const getAvailableActions = () => {
    const actions = [
      {
        key: "view",
        label: "View Details",
        icon: <FaEye size={14} />,
        available: true,
      },
      {
        key: "edit",
        label: "Edit Fee",
        icon: <FaEdit size={14} />,
        available: true,
      },
      {
        key: "duplicate",
        label: "Duplicate Fee",
        icon: <FaCopy size={14} />,
        available: true,
      },
      {
        key: "toggleStatus",
        label: row.status === "Active" ? "Deactivate" : "Activate",
        icon:
          row.status === "Active" ? (
            <FaToggleOff size={14} />
          ) : (
            <FaToggleOn size={14} />
          ),
        available: true,
        danger: row.status === "Active",
      },
    ];

    return actions.filter((action) => action.available);
  };

  const availableActions = getAvailableActions();

  return (
    <div className="action-dropdown" ref={dropdownRef}>
      <button
        className="dropdown-trigger"
        onClick={toggleDropdown}
        title="More actions"
      >
        <FaEllipsisV size={14} />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {availableActions.map((action, index) => (
            <React.Fragment key={action.key}>
              {index > 0 && action.danger && (
                <div className="dropdown-divider" />
              )}
              <button
                className={`dropdown-item ${action.danger ? "danger" : ""}`}
                onClick={(e) => handleAction(action.key, e)}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeeActionDropdown;
