import React from "react";
import "./button.css";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  loading = false,
  loadingText = "Processing...",
  disabled = false,
  className = "",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn ${variant} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <>
          <span className="btn-spinner"></span>
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
