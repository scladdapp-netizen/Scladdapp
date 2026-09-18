import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import FormInput from "../../components/FormInput";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import {
  fetchPublicApplicationForm,
  submitApplicationForm,
  sendApplicationEmailOtp,
  verifyApplicationEmailOtp,
} from "../../api_call/useApplicationForm";
import "./ApplicationForm.css";

function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <button type="button" className="af-theme-toggle" onClick={cycleTheme} title={`Theme: ${theme}`}>
      {resolved === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M15 10.5A7 7 0 017.5 3a7 7 0 100 12 7 7 0 007.5-4.5z" fill="#ffffff" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="3.5" fill="#111111" opacity="0.25" stroke="#111111" strokeWidth="1.5" />
          <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.4 3.4l1.4 1.4M13.2 13.2l1.4 1.4M3.4 14.6l1.4-1.4M13.2 4.8l1.4-1.4" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EmailVerifyField({ field, value, schoolId, verified, onChange, onVerifiedChange }) {
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // ok | err

  const email = String(value || "").trim();
  const valid = EMAIL_RE.test(email);

  const resetVerifyUi = () => {
    setSent(false);
    setOtp("");
    setMsg("");
    setMsgType("");
  };

  const handleEmailChange = (next) => {
    onChange(next);
    if (verified) onVerifiedChange(false);
    resetVerifyUi();
  };

  const handleSend = async () => {
    if (!valid) {
      setMsg("Enter a valid email first.");
      setMsgType("err");
      return;
    }
    setBusy(true);
    setMsg("");
    setMsgType("");
    try {
      const res = await sendApplicationEmailOtp(schoolId, email);
      if (!res.success) throw new Error(res.message || "Failed to send code");
      setSent(true);
      setMsg(res.message || "Code sent. Check your inbox.");
      setMsgType("ok");
      onVerifiedChange(false);
    } catch (err) {
      setMsg(err.message || "Failed to send code");
      setMsgType("err");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      setMsg("Enter the code from your email.");
      setMsgType("err");
      return;
    }
    setBusy(true);
    setMsg("");
    setMsgType("");
    try {
      const res = await verifyApplicationEmailOtp(schoolId, email, otp.trim());
      if (!res.success) throw new Error(res.message || "Verification failed");
      onVerifiedChange(true);
      setSent(false);
      setOtp("");
      setMsg("Email verified.");
      setMsgType("ok");
    } catch (err) {
      setMsg(err.message || "Verification failed");
      setMsgType("err");
      onVerifiedChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="af-field af-email-verify">
      <label className="af-label">
        {field.label}
        {verified && <span className="af-verified-pill">Verified</span>}
      </label>
      <div className="af-email-row">
        <input
          className="af-input af-email-input"
          type="email"
          value={value || ""}
          onChange={(e) => handleEmailChange(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
        />
        {!verified && (
          <button
            type="button"
            className="af-verify-btn"
            onClick={handleSend}
            disabled={busy || !valid}
          >
            {busy && !sent ? "Sending…" : sent ? "Resend" : "Verify"}
          </button>
        )}
      </div>

      {sent && !verified && (
        <div className="af-otp-row">
          <input
            className="af-input af-otp-input"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code"
          />
          <button
            type="button"
            className="af-verify-btn af-verify-btn--confirm"
            onClick={handleVerify}
            disabled={busy || otp.length < 4}
          >
            {busy ? "Checking…" : "Confirm"}
          </button>
        </div>
      )}

      {msg && (
        <span className={`af-email-msg af-email-msg--${msgType}`}>{msg}</span>
      )}
    </div>
  );
}

function FieldInput({ field, value, onChange, schoolId, verified, onVerifiedChange }) {
  const common = {
    label: field.label,
    value: value ?? "",
    onChange,
    width: "100%",
    isActive: true,
  };

  if (field.type === "email") {
    return (
      <EmailVerifyField
        field={field}
        value={value}
        schoolId={schoolId}
        verified={verified}
        onChange={onChange}
        onVerifiedChange={onVerifiedChange}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="af-field">
        <label className="af-label">{field.label}</label>
        <textarea
          className="af-input af-textarea"
          rows={4}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    const options = field.options || [];
    return (
      <div className="af-field">
        <label className="af-label">{field.label}</label>
        <select className="af-input af-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">{options.length ? "Select…" : "No classes available"}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {field.id === "class_applying" && !options.length && (
          <span className="af-field-hint">This school has no active classes listed yet.</span>
        )}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="af-checkbox">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="af-checkbox-box" aria-hidden="true" />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "file") {
    return (
      <div className="af-field">
        <label className="af-label">{field.label}</label>
        <div className="af-file-wrap">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="af-file"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
          <span className="af-file-hint">PDF or image files accepted</span>
        </div>
      </div>
    );
  }

  return (
    <FormInput
      {...common}
      type={field.type === "date" ? "date" : field.type === "tel" ? "tel" : "text"}
    />
  );
}

function getGridItemClass(field, section) {
  const classes = ["af-grid-item"];

  if (section.id === "declaration") {
    if (field.id === "declaration_signature" || field.id === "declaration_date") {
      classes.push("af-grid-item--half");
    } else {
      classes.push("af-grid-item--full");
      if (field.type === "checkbox") classes.push("af-grid-item--checkbox");
    }
    return classes.join(" ");
  }

  if (field.type === "textarea" || field.type === "file" || field.type === "checkbox" || field.type === "email") {
    classes.push("af-grid-item--full");
  }

  return classes.join(" ");
}

export default function ApplicationForm() {
  const { schoolId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [school, setSchool] = useState(null);
  const [sections, setSections] = useState([]);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [verifiedEmails, setVerifiedEmails] = useState({}); // fieldId -> true

  const emailFields = useMemo(
    () => sections.flatMap((s) => s.fields.filter((f) => f.type === "email")),
    [sections]
  );

  useEffect(() => {
    setLoading(true);
    fetchPublicApplicationForm(schoolId)
      .then((res) => {
        if (!res.success) throw new Error(res.message || "Could not load application form");
        setSchool(res.data.school);
        setSections(res.data.sections || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [schoolId]);

  const setFieldValue = (fieldId, value, isFile = false) => {
    if (isFile) {
      setFiles((prev) => ({ ...prev, [fieldId]: value }));
    } else {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      for (const field of emailFields) {
        const val = String(values[field.id] || "").trim();
        if (!val) {
          if (field.id === "email" || field.locked) {
            throw new Error(`${field.label} is required and must be verified.`);
          }
          continue;
        }
        if (!EMAIL_RE.test(val)) {
          throw new Error(`Please enter a valid ${field.label}.`);
        }
        if (!verifiedEmails[field.id]) {
          throw new Error(`Please verify ${field.label} before submitting.`);
        }
      }

      const formData = new FormData();
      formData.append("data", JSON.stringify(values));
      Object.entries(files).forEach(([fieldId, file]) => {
        if (file) formData.append(fieldId, file);
      });

      const res = await submitApplicationForm(schoolId, formData);
      if (!res.success) throw new Error(res.message || "Submission failed");

      setSuccess(res.message || "Application submitted successfully.");
      setValues({});
      setFiles({});
      setVerifiedEmails({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const brandInitial = (school?.school_name || "S").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="af-page af-page--state">
        <ThemeToggle />
        <div className="af-state-card">
          <div className="af-spinner" aria-hidden="true" />
          <h2>Loading application form</h2>
          <p>Please wait while we prepare the form…</p>
        </div>
      </div>
    );
  }

  if (error && !school) {
    return (
      <div className="af-page af-page--state">
        <ThemeToggle />
        <div className="af-state-card af-state-card--error">
            <div className="af-state-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2>Form unavailable</h2>
            <p>{error}</p>
            <Link to="/" className="af-back-link">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="af-page">
      <ThemeToggle />

      <div className="af-shell">
        <header className="af-hero">
          <div className="af-hero-brand">
            {school?.logo_url ? (
              <img src={school.logo_url} alt={school.school_name} className="af-logo" />
            ) : (
              <div className="af-logo-placeholder">{brandInitial}</div>
            )}
            <div className="af-hero-text">
              <span className="af-hero-badge">Student Application</span>
              <h1>{school?.school_name}</h1>
              {school?.motto && <p className="af-hero-motto">{school.motto}</p>}
            </div>
          </div>
          <p className="af-hero-desc">
            Complete the form below to apply. Email addresses must be verified with a code before you submit.
          </p>
        </header>

        <main className="af-main">
          {success && (
            <div className="af-banner af-banner--success">
              <div className="af-banner-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <strong>Application submitted</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          {error && school && (
            <div className="af-banner af-banner--error">
              <div className="af-banner-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <strong>Something went wrong</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!success && (
            <form className="af-form" onSubmit={handleSubmit}>
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  className={`af-section${section.id === "declaration" ? " af-section--declaration" : ""}`}
                >
                  <div className="af-section-head">
                    <span className="af-section-num">{index + 1}</span>
                    <h2>{section.title}</h2>
                  </div>
                  <div className={`af-grid${section.id === "declaration" ? " af-grid--declaration" : ""}`}>
                    {section.fields.map((field) => (
                      <div key={field.id} className={getGridItemClass(field, section)}>
                        <FieldInput
                          field={field}
                          schoolId={schoolId}
                          value={field.type === "file" ? files[field.id] : values[field.id]}
                          verified={!!verifiedEmails[field.id]}
                          onChange={(val) => setFieldValue(field.id, val, field.type === "file")}
                          onVerifiedChange={(ok) =>
                            setVerifiedEmails((prev) => ({ ...prev, [field.id]: ok }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <div className="af-actions">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Application"}
                </Button>
              </div>
            </form>
          )}
        </main>

        <footer className="af-footer">
          <span>Powered by</span>
          <Link to="/">Scladapp</Link>
        </footer>
      </div>
    </div>
  );
}
