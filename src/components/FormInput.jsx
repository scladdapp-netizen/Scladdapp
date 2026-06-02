import React, { useState, useRef, useEffect } from "react";

export default function FormInput({
  label,
  type = "text",
  value,
  onChange,
  options = [],
  width = "100%",
  height = "40px",
  maxLength,
  placeholder = "",
  isActive = true,
  dataType = "string",
  multiple = false,
  accept = "*",
}) {
  const fileInputRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);
  const [preview, setPreview] = useState(
    type === "image" && typeof value === "string" ? value : null
  );

  useEffect(() => {
    if (type !== "image") return;

    // If value is a File → create preview
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);

      // ✅ cleanup to avoid memory leaks
      return () => URL.revokeObjectURL(url);
    }

    // If value is a URL string (edit mode)
    if (typeof value === "string") {
      setPreview(value);
    }

    // If cleared
    if (!value) {
      setPreview(null);
    }
  }, [value, type]);

  // Safe calculation of remaining characters
  const getRemainingText = () => {
    if (!maxLength) return null;

    const currentLength =
      typeof value === "string"
        ? value.length
        : typeof value === "number"
        ? String(value).length
        : 0;

    return `${currentLength}/${maxLength}`;
  };

  const remaining = getRemainingText();

  const baseStyle = {
    width,
    height,
    padding: type === "checkbox" || type === "switch" ? "0" : "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
    fontSize: "14px",
    background: isActive ? "#fff" : "#f9f9f9",
    opacity: isActive ? 1 : 0.6,
    pointerEvents: isActive ? "auto" : "none",
    resize: type === "textarea" ? "vertical" : "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontWeight: 500,
    marginBottom: "4px",
    display: label ? "block" : "none",
  };

  // Switch toggle styles
  const switchStyle = {
    position: "relative",
    display: "inline-block",
    width: "50px",
    height: "24px",
  };

  const switchSliderStyle = {
    position: "absolute",
    cursor: "pointer",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: value ? "#9370db" : "#ccc",
    transition: "0.4s",
    borderRadius: "24px",
  };

  const switchSliderBeforeStyle = {
    position: "absolute",
    content: '""',
    height: "16px",
    width: "16px",
    left: value ? "26px" : "4px",
    bottom: "4px",
    backgroundColor: "white",
    transition: "0.4s",
    borderRadius: "50%",
  };

  const handleChange = (e) => {
    let val;

    if (type === "checkbox" || type === "switch") {
      val = e.target.checked;
    } else if (
      type === "select" ||
      type === "textarea" ||
      type === "text" ||
      type === "number" ||
      type === "date"
    ) {
      // Apply data type conversion based on dataType prop
      const rawValue = e.target.value;

      switch (dataType) {
        case "number":
          // For number inputs, handle empty string and decimal numbers
          if (rawValue === "" || rawValue === "-") {
            val = rawValue;
          } else {
            val = Number(rawValue);
            // If it's not a valid number, keep the string value
            if (isNaN(val)) val = rawValue;
          }
          break;
        case "boolean":
          val = Boolean(rawValue);
          break;
        default: // 'string'
          val = rawValue;
      }
    } else if (type === "image") {
      val = e.target.files?.[0];
    } else if (type === "file") {
      val = multiple ? Array.from(e.target.files) : e.target.files?.[0];
    } else {
      val = e.target.value;
    }

    // Safe length check (only for string types)
    const inputLength =
      typeof val === "string"
        ? val.length
        : typeof val === "number"
        ? String(val).length
        : 0;

    if (!maxLength || inputLength <= maxLength) {
      onChange(val);
    }
  };

  const handleFileSelect = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  // Handle switch toggle
  const handleSwitchToggle = () => {
    onChange(!value);
  };

  // Safe value for inputs - convert based on dataType for display
  const getSafeValue = () => {
    if (value === null || value === undefined) {
      if (type === "number" && dataType === "number") return "";
      return "";
    }

    if (type === "checkbox" || type === "switch") {
      return value;
    }

    if (type === "date") {
      return value ? String(value).slice(0, 10) : "";
    }

    if (type === "file") {
      return ""; // File inputs should always have empty string value
    }

    // For display purposes, convert to string
    return String(value);
  };

  const safeValue = getSafeValue();

  return (
    <div style={{ marginBottom: "1rem", width }}>
      {label && <label className="fi-label">{label}</label>}

      {type === "select" ? (
        <select
          style={baseStyle}
          value={safeValue}
          onChange={handleChange}
          disabled={!isActive}
        >
          <option value="">Select...</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <input
          type="checkbox"
          checked={!!value}
          onChange={handleChange}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
          disabled={!isActive}
        />
      ) : type === "switch" ? (
        <label style={switchStyle}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={handleSwitchToggle}
            style={{ display: "none" }}
            disabled={!isActive}
          />
          <span style={switchSliderStyle}>
            <span style={switchSliderBeforeStyle} />
          </span>
        </label>
      ) : type === "textarea" ? (
        <textarea
          value={safeValue}
          placeholder={placeholder}
          onChange={handleChange}
          style={{ ...baseStyle, height: height || "100px" }}
          disabled={!isActive}
          maxLength={maxLength}
        />
      ) : type === "image" ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="fi-image-drop"
          style={{ width, height: height || "150px" }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div className="fi-image-placeholder">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="fi-image-icon">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.5" />
                <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <path d="M12 8v4M10 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="fi-image-plus" />
              </svg>
              <span className="fi-image-text">Drag &amp; drop or click to upload</span>
              <span className="fi-image-hint">Only image files allowed</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: "none" }}
          />
        </div>
      ) : type === "file" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <input
            type="file"
            onChange={handleChange}
            style={{
              ...baseStyle,
              padding: "8px",
              cursor: "pointer",
            }}
            disabled={!isActive}
            multiple={multiple}
            accept={accept}
          />
          {value && (
            <div style={{ fontSize: "12px", color: "#666" }}>
              {multiple && Array.isArray(value)
                ? `${value.length} file(s) selected`
                : value instanceof File
                ? value.name
                : "File selected"}
            </div>
          )}
        </div>
      ) : (
        <div style={type === "password" ? { position: "relative" } : undefined}>
          <input
            type={type === "password" ? (showPwd ? "text" : "password") : type === "number" ? "number" : type === "date" ? "date" : type}
            value={safeValue}
            placeholder={placeholder}
            onChange={handleChange}
            style={{
              ...baseStyle,
              ...(type === "password" ? { paddingRight: "40px" } : {}),
            }}
            disabled={!isActive}
            maxLength={maxLength}
            step={type === "number" ? "any" : undefined}
          />
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                color: "#aaa",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
              tabIndex={-1}
            >
              {showPwd ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {maxLength &&
        type !== "checkbox" &&
        type !== "switch" &&
        type !== "image" &&
        type !== "file" && (
          <div
            style={{
              textAlign: "right",
              fontSize: "12px",
              color: safeValue.length >= maxLength ? "red" : "#666",
              marginTop: "3px",
            }}
          >
            {remaining}
          </div>
        )}
    </div>
  );
}

//  <FormInput
//         label="School Name"
//         type="text"
//         value={schoolName}
//         onChange={setSchoolName}
//         placeholder="Enter your school name"
//         maxLength={50}
//       />

//       <FormInput
//         label="About School"
//         type="textarea"
//         value={bio}
//         onChange={setBio}
//         placeholder="Short description"
//         height="120px"
//         maxLength={200}
//       />

//       <FormInput
//         label="School Logo"
//         type="image"
//         value={schoolLogo}
//         onChange={setSchoolLogo}
//         height="180px"
//       />

//   <FormInput
//         label="School Name"
//         type="text"
//         value={schoolName}
//         onChange={setSchoolName}
//         placeholder="Enter school name"
//         maxLength={50}
//       />

//       <FormInput
//         label="About School"
//         type="textarea"
//         value={about}
//         onChange={setAbout}
//         placeholder="Tell us about your school"
//         height="100px"
//         maxLength={120}
//       />

//       <FormInput
//         label="Country"
//         type="select"
//         value={country}
//         onChange={setCountry}
//         options={[
//           { label: "Nigeria", value: "NG" },
//           { label: "Ghana", value: "GH" },
//           { label: "Kenya", value: "KE" },
//         ]}
//       />

//       <FormInput
//         label="Password"
//         type="password"
//         value={password}
//         onChange={setPassword}
//         placeholder="Enter password"
//         maxLength={20}
//       />

//       <FormInput
//         label="Accept Terms"
//         type="checkbox"
//         value={accept}
//         onChange={setAccept}
//       />
