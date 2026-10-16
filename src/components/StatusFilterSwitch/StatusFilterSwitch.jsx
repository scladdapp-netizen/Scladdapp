import React from "react";
import "./StatusFilterSwitch.css";

/**
 * Active / Inactive segmented switch used in the School Directory headers.
 * value: "active" | "inactive"
 * counts: { active: number|null, inactive: number|null }
 */
const StatusFilterSwitch = ({
  value,
  onChange,
  counts = {},
  activeLabel = "Active",
  inactiveLabel = "Inactive",
  activeTitle,
  inactiveTitle,
  ariaLabel = "Status filter",
}) => {
  const options = [
    { key: "active", label: activeLabel, title: activeTitle },
    { key: "inactive", label: inactiveLabel, title: inactiveTitle },
  ];

  return (
    <div className="sfs-track" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const count = counts?.[opt.key];
        return (
          <button
            key={opt.key}
            type="button"
            role="tab"
            title={opt.title}
            aria-selected={value === opt.key}
            className={`sfs-btn${value === opt.key ? " is-active" : ""}`}
            onClick={() => onChange(opt.key)}
          >
            <span>{opt.label}</span>
            {count !== null && count !== undefined && (
              <span className="sfs-count">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilterSwitch;
