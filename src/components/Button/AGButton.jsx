import React from "react";
import "./button.css";

const AGButton = ({ text, onClick, disabled = false, type = "button" }) => {
  return (
    <div
      className={`agrbut ${disabled ? "agrbut-disabled" : ""}`}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" && !disabled && onClick) {
          onClick();
        }
      }}
    >
      <p className="dgbtext">{text}</p>
    </div>
  );
};

export default AGButton;
