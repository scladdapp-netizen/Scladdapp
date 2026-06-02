import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaEye, FaEdit, FaTrash, FaCopy } from "react-icons/fa";
import "./ActionDropdown.css";

const ActionDropdown = ({ row, onView, onEdit, onResend, onDelete }) => {
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
      case "resend":
        onResend(row);
        break;
      case "delete":
        onDelete(row);
        break;
      default:
        break;
    }
  };

  const toggleDropdown = (event) => {
    event.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Determine available actions based on status
  const getAvailableActions = () => {
    const actions = [
      {
        key: "view",
        label: "View Details",
        icon: <FaEye size={14} />,
        available: true,
      },
    ];

    if (row.status === "Draft") {
      actions.push({
        key: "edit",
        label: "Edit",
        icon: <FaEdit size={14} />,
        available: true,
      });
    }

    if (row.status === "Published") {
      actions.push({
        key: "resend",
        label: "Resend",
        icon: <FaCopy size={14} />,
        available: true,
      });
    }

    if (row.status === "Scheduled") {
      actions.push({
        key: "edit",
        label: "Edit Schedule",
        icon: <FaEdit size={14} />,
        available: true,
      });
    }

    actions.push({
      key: "delete",
      label: row.status === "Published" ? "Archive" : "Delete",
      icon: <FaTrash size={14} />,
      available: true,
      danger: true,
    });

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

export default ActionDropdown;
