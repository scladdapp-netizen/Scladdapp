import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import useSchool from "../../../../../api_call/useSchool";
import useWebsiteRequest from "../../../../../api_call/useWebsiteRequest";
import Button from "../../../../../components/Button/Button";
import FormInput from "../../../../../components/FormInput";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import ApplicationFormFieldsPanel from "./ApplicationFormFieldsPanel";
import {
  fetchApplicationFormConfig,
  saveApplicationFormConfig,
} from "../../../../../api_call/useApplicationForm";
import "./SchoolWebsite.css";

// ── helpers ──────────────────────────────────────────────────────────────────
const isFree = (sub) => !sub || sub.subscription_type === "free";

const loginUrl = (schoolId) =>
  `${window.location.origin}/school/${schoolId}/login`;

const applicationUrl = (schoolId) =>
  `${window.location.origin}/school/${schoolId}/apply`;

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button className="sw-copy-btn" onClick={copy} title="Copy">
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
};

// ── Login link card ───────────────────────────────────────────────────────────
const LoginLinkCard = ({ schoolId, school }) => {
  const url = loginUrl(schoolId);
  return (
    <div className="sw-section">
      <div className="sw-section-head">
        <div className="sw-section-icon sw-icon-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h3 className="sw-section-title">School Login Link</h3>
          <p className="sw-section-sub">Share this link with your staff and teachers. It shows your school branding on the login screen.</p>
        </div>
      </div>

      <div className="sw-link-preview">
        <div className="sw-link-preview-left">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.school_name} className="sw-link-logo" />
          ) : (
            <div className="sw-link-logo-placeholder">
              {school?.school_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
          )}
          <div className="sw-link-info">
            <span className="sw-link-name">{school?.school_name || "Your School"}</span>
            <span className="sw-link-url">{url}</span>
          </div>
        </div>
        <div className="sw-link-actions">
          <CopyBtn text={url} />
          <a href={url} target="_blank" rel="noreferrer" className="sw-open-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Open
          </a>
        </div>
      </div>
    </div>
  );
};

// ── Application form link card ────────────────────────────────────────────────
const ApplicationFormLinkCard = ({ schoolId, school, onConfigure, isActive, onActiveChange }) => {
  const { addNotification } = useNotification();
  const url = applicationUrl(schoolId);
  const [toggling, setToggling] = useState(false);

  const handleToggleActive = async () => {
    if (!schoolId || toggling) return;
    const next = !isActive;
    setToggling(true);
    try {
      const current = await fetchApplicationFormConfig(schoolId);
      if (!current.success) throw new Error(current.message || "Failed to load settings");
      const fields = current.data.enabled_fields || [];
      const res = await saveApplicationFormConfig(schoolId, {
        enabled_fields: fields,
        is_active: next,
      });
      if (!res.success) throw new Error(res.message || "Failed to update");
      onActiveChange(next);
      addNotification(next ? "Application form is now open" : "Application form is now closed", "success");
    } catch (err) {
      addNotification(err.message || "Could not update form status", "error");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="sw-section">
      <div className="sw-section-head">
        <div className="sw-section-icon sw-icon-form">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h3 className="sw-section-title">School Application Form Link</h3>
          <p className="sw-section-sub">Share this link with parents so they can apply online. Choose which fields appear on the form.</p>
        </div>
        <div className="sw-section-head-actions">
          <label className={`sw-form-active-toggle${toggling ? " sw-form-active-toggle--busy" : ""}`}>
            <input
              type="checkbox"
              checked={isActive}
              disabled={toggling}
              onChange={handleToggleActive}
            />
            <span className="sw-form-active-track" aria-hidden="true">
              <span className="sw-form-active-thumb" />
            </span>
            <span className="sw-form-active-text">Accept new applications</span>
          </label>
          <Button variant="secondary" onClick={onConfigure}>Configure fields</Button>
        </div>
      </div>

      <div className="sw-link-preview">
        <div className="sw-link-preview-left">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.school_name} className="sw-link-logo" />
          ) : (
            <div className="sw-link-logo-placeholder">
              {school?.school_name?.charAt(0)?.toUpperCase() || "S"}
            </div>
          )}
          <div className="sw-link-info">
            <span className="sw-link-name">{school?.school_name || "Your School"}</span>
            <span className="sw-link-url">{url}</span>
          </div>
        </div>
        <div className="sw-link-actions">
          <CopyBtn text={url} />
          <a href={url} target="_blank" rel="noreferrer" className="sw-open-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Open
          </a>
        </div>
      </div>
    </div>
  );
};

// ── Your website section ──────────────────────────────────────────────────────
const YourWebsiteSection = ({ schoolId, initialWebsite, onSaved, loading }) => {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(initialWebsite || "");
  const [previewState, setPreviewState] = useState("idle"); // idle | loading | loaded | blocked
  const iframeRef = useRef(null);
  const loadTimerRef = useRef(null);

  useEffect(() => { setUrl(initialWebsite || ""); }, [initialWebsite]);

  // Reset preview whenever the saved URL changes
  useEffect(() => {
    setPreviewState(initialWebsite ? "loading" : "idle");
  }, [initialWebsite]);

  const handleIframeLoad = () => {
    clearTimeout(loadTimerRef.current);
    // Try to detect blank/blocked iframe
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || doc.body?.innerHTML === "") {
        setPreviewState("blocked");
      } else {
        setPreviewState("loaded");
      }
    } catch {
      // cross-origin access denied = the page actually loaded
      setPreviewState("loaded");
    }
  };

  const handleIframeError = () => {
    clearTimeout(loadTimerRef.current);
    setPreviewState("blocked");
  };

  // Safety timeout — if no load event after 8 s, treat as blocked
  useEffect(() => {
    if (previewState === "loading") {
      loadTimerRef.current = setTimeout(() => setPreviewState("blocked"), 8000);
    }
    return () => clearTimeout(loadTimerRef.current);
  }, [previewState]);

  const handleSave = async () => {
    await onSaved(url);
    setEditing(false);
  };

  const hasWebsite = !!initialWebsite;

  return (
    <div className="sw-section">
      <div className="sw-section-head">
        <div className="sw-section-icon sw-icon-globe">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h3 className="sw-section-title">Your School Website</h3>
          <p className="sw-section-sub">Add your school's website URL so staff and parents can find it quickly.</p>
        </div>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {hasWebsite ? "Edit" : "Add URL"}
          </Button>
        )}
      </div>

      {!editing ? (
        hasWebsite ? (
          <>
            {/* URL bar row */}
            <div className="sw-website-display">
              <div className="sw-website-icon-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="sw-website-url-group">
                <span className="sw-website-label">Website URL</span>
                <a href={initialWebsite} target="_blank" rel="noreferrer" className="sw-website-url-link">
                  {initialWebsite}
                </a>
              </div>
              <div className="sw-website-actions">
                <CopyBtn text={initialWebsite} />
                <a href={initialWebsite} target="_blank" rel="noreferrer" className="sw-open-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Visit
                </a>
              </div>
            </div>

            {/* Live preview browser frame */}
            <div className="sw-preview-wrap">
              {/* Chrome bar */}
              <div className="sw-preview-bar">
                <div className="sw-preview-dots">
                  <span className="sw-dot sw-dot-r" />
                  <span className="sw-dot sw-dot-y" />
                  <span className="sw-dot sw-dot-g" />
                </div>
                <div className="sw-preview-addr">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{initialWebsite}</span>
                </div>
                <a
                  href={initialWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="sw-preview-open"
                  title="Open in new tab"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>

              {/* Iframe + states */}
              <div className="sw-preview-stage">
                {previewState === "loading" && (
                  <div className="sw-preview-overlay">
                    <div className="sw-preview-spinner" />
                    <span>Loading preview…</span>
                  </div>
                )}

                {previewState === "blocked" && (
                  <div className="sw-preview-overlay sw-preview-blocked">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M4.93 4.93l14.14 14.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p className="sw-preview-blocked-title">Preview blocked</p>
                    <p className="sw-preview-blocked-sub">This site doesn't allow embedding. Visit it directly instead.</p>
                    <a href={initialWebsite} target="_blank" rel="noreferrer" className="sw-open-btn" style={{ marginTop: 4 }}>
                      Open site
                    </a>
                  </div>
                )}

                <iframe
                  ref={iframeRef}
                  src={previewState !== "blocked" ? initialWebsite : undefined}
                  title="Website preview"
                  className={`sw-preview-iframe ${previewState === "loaded" ? "sw-preview-iframe--visible" : ""}`}
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  loading="lazy"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="sw-empty-website">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <p>No website URL added yet</p>
          </div>
        )
      ) : (
        <div className="sw-edit-row">
          <FormInput
            label="Website URL"
            type="url"
            value={url}
            onChange={setUrl}
            placeholder="https://www.yourschool.edu"
            width="100%"
            isActive
          />
          <div className="sw-edit-actions">
            <Button variant="secondary" onClick={() => { setEditing(false); setUrl(initialWebsite || ""); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Custom Domain Section ─────────────────────────────────────────────────────
const CustomDomainSection = ({ scladappWebsiteUrl, existingDomain, existingStatus, nested = false }) => {
  const [domain,   setDomain]   = useState(existingDomain || "");
  const [editing,  setEditing]  = useState(false);
  const [status,   setStatus]   = useState(existingStatus || null); // null | "pending" | "connected"

  // UI-only: just show the flow, no API call yet
  const handleSave = () => {
    if (!domain.trim()) return;
    setStatus("pending");
    setEditing(false);
  };

  const handleRemove = () => {
    setDomain("");
    setStatus(null);
    setEditing(false);
  };

  if (!scladappWebsiteUrl) return null; // only show once site is published

  return (
    <div className={nested ? "sw-domain-nested" : "sw-section sw-section-domain"}>
      <div className="sw-section-head">
        <div className="sw-section-icon sw-icon-domain">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h3 className="sw-section-title">Custom Domain</h3>
          <p className="sw-section-sub">Connect your own domain so your site loads at <strong>yourschool.com</strong> instead of our subdomain.</p>
        </div>
        {!editing && status !== "connected" && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            {status === "pending" ? "Edit" : domain ? "Edit" : "Add Domain"}
          </Button>
        )}
      </div>

      {/* connected state */}
      {status === "connected" && domain && (
        <div className="sw-domain-connected">
          <div className="sw-domain-connected-left">
            <span className="sw-domain-live-dot" />
            <div>
              <p className="sw-domain-connected-url">{domain}</p>
              <p className="sw-domain-connected-sub">Connected and live</p>
            </div>
          </div>
          <div className="sw-domain-connected-actions">
            <CopyBtn text={`https://${domain}`} />
            <a href={`https://${domain}`} target="_blank" rel="noreferrer" className="sw-open-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Visit
            </a>
            <button className="sw-domain-remove-btn" onClick={handleRemove}>Remove</button>
          </div>
        </div>
      )}

      {/* pending state — show DNS instructions */}
      {status === "pending" && !editing && domain && (
        <div className="sw-domain-pending">
          <div className="sw-domain-pending-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <strong>Waiting for DNS — point your domain to us</strong>
          </div>
          <p className="sw-domain-pending-sub">
            Go to your domain registrar (GoDaddy, Namecheap, etc.) and add these DNS records for <strong>{domain}</strong>:
          </p>
          <div className="sw-dns-table">
            <div className="sw-dns-row sw-dns-head">
              <span>Type</span><span>Name</span><span>Value</span>
            </div>
            <div className="sw-dns-row">
              <span className="sw-dns-tag">A</span>
              <span className="sw-dns-mono">@</span>
              <span className="sw-dns-mono sw-dns-val">your-server-ip</span>
            </div>
            <div className="sw-dns-row">
              <span className="sw-dns-tag">CNAME</span>
              <span className="sw-dns-mono">www</span>
              <span className="sw-dns-mono sw-dns-val">{domain}</span>
            </div>
          </div>
          <p className="sw-domain-pending-note">DNS changes can take up to 24 hours to propagate.</p>
          <div className="sw-domain-pending-actions">
            <button className="sw-domain-verify-btn" onClick={() => setStatus("connected")}>
              I've added the records — Verify
            </button>
            <button className="sw-domain-remove-btn" onClick={handleRemove}>Remove domain</button>
          </div>
        </div>
      )}

      {/* edit / add form */}
      {editing && (
        <div className="sw-domain-form">
          <FormInput
            label="Your domain"
            type="text"
            value={domain}
            onChange={setDomain}
            placeholder="yourschool.com"
            width="100%"
            isActive
          />
          <p className="sw-domain-form-hint">Enter without https:// — e.g. <code>yourschool.com</code></p>
          <div className="sw-domain-form-actions">
            <Button variant="secondary" onClick={() => { setEditing(false); setDomain(existingDomain || ""); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={!domain.trim()}>Save & Get DNS Instructions</Button>
          </div>
        </div>
      )}

      {/* empty state */}
      {!status && !editing && (
        <div className="sw-domain-empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <p>No custom domain connected yet</p>
          <p className="sw-domain-empty-sub">Your site is accessible at <a href={scladappWebsiteUrl} target="_blank" rel="noreferrer">{scladappWebsiteUrl}</a></p>
        </div>
      )}
    </div>
  );
};
const RequestWebsiteSection = ({ onRequest, onCancel, loading, alreadyRequested, briefStatus, scladappWebsiteUrl, onEditWithAI, customDomain, customDomainStatus }) => {
  const features = [
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Custom Design",
      desc: "Branded with your logo, colours, and school identity",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
      title: "School Info",
      desc: "Home, About, Admissions, and Contact pages included",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/>
          <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Mobile-Ready",
      desc: "Fully responsive — looks great on any device",
    },
    {
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Fast & Secure",
      desc: "Hosted on our infrastructure, zero maintenance for you",
    },
  ];

  return (
    <div className="sw-section sw-section-request">
      <div className="sw-request-header">
        <h3 className="sw-request-title">
          {scladappWebsiteUrl ? "Your Scladapp-Powered Website" : "Get a Scladapp-Powered School Website"}
        </h3>
        <p className="sw-request-desc">
          {scladappWebsiteUrl
            ? "Your website is live and hosted by Scladapp. Share it with parents and the community."
            : "Let us build and host a professional website for your school — included in paid plans. Your school's data, profile, and branding are used automatically."}
        </p>
      </div>

      {!scladappWebsiteUrl && (
        <div className="sw-features-grid">
          {features.map((f) => (
            <div key={f.title} className="sw-feature-card">
              <div className="sw-feature-icon">{f.icon}</div>
              <div>
                <p className="sw-feature-title">{f.title}</p>
                <p className="sw-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sw-request-cta">
        {scladappWebsiteUrl ? (
          /* Website is live */
          <div className="sw-website-live">
            <div className="sw-website-live-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Your Scladapp-powered website is live!</span>
            </div>
            <div className="sw-website-live-url">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <a href={scladappWebsiteUrl} target="_blank" rel="noreferrer" className="sw-website-live-link">
                {scladappWebsiteUrl}
              </a>
              <div className="sw-website-live-actions">
                <CopyBtn text={scladappWebsiteUrl} />
                <a href={scladappWebsiteUrl} target="_blank" rel="noreferrer" className="sw-open-btn">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="15,3 21,3 21,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Visit
                </a>
              </div>
            </div>
            {/* Site Workplace entry point */}
            <button className="sw-edit-ai-btn" onClick={onEditWithAI}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Open Site Workplace
            </button>
            <p className="sw-edit-ai-desc">
              Your personal workspace for managing and improving your school website — edit content, update sections, and use AI to rewrite or generate new parts of your site.
            </p>

            <CustomDomainSection
              nested
              scladappWebsiteUrl={scladappWebsiteUrl}
              existingDomain={customDomain}
              existingStatus={customDomainStatus}
            />
          </div>
        ) : alreadyRequested ? (
          <div className="sw-requested-state">
            <div className="sw-requested-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {briefStatus === "submitted"
                ? "Brief submitted — we'll be in touch soon!"
                : "Draft saved — finish and submit your brief"}
            </div>
            <div className="sw-requested-actions">
              <Button variant="secondary" onClick={onRequest}>
                {briefStatus === "submitted" ? "View Brief" : "Continue Brief"}
              </Button>
              {briefStatus !== "submitted" && (
                <button className="sw-cancel-request-btn" onClick={onCancel} disabled={loading}>
                  {loading ? "Cancelling..." : "Cancel Request"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Button onClick={onRequest} disabled={loading}>
              {loading ? "Loading..." : "Request Your Website"}
            </Button>
            <p className="sw-request-note">Available on Starter and above plans. We'll contact you to get started.</p>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
export const SchoolWebsiteContent = () => {
  const { schoolId } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const { getWebsite, saveWebsite, loading } = useSchool();
  const { getRequest, cancelRequest, loading: briefLoading } = useWebsiteRequest();

  const [school, setSchool] = useState(null);
  const [websiteRequested, setWebsiteRequested] = useState(false);
  const [briefData, setBriefData] = useState(null);      // the WebsiteRequest doc
  const [websiteLoading, setWebsiteLoading] = useState(true);
  const [fieldsPanelOpen, setFieldsPanelOpen] = useState(false);
  const [appFormIsActive, setAppFormIsActive] = useState(true);

  const subscription = user?.subscription;
  const isPaidPlan = subscription && subscription.subscription_type !== "free" &&
    (subscription.subscription_status === "active" || subscription.subscription_status === "trialing") &&
    new Date(subscription.end_date) > new Date();

  // Hosted site URL — from WebsiteRequest first, then school.website fallback (same DB, not localStorage)
  const scladappWebsiteUrl =
    briefData?.scladapp_website_url ||
    school?.scladapp_website_url ||
    (briefData?.status === "published" && school?.website ? school.website : null) ||
    null;

  const alreadyRequested =
    websiteRequested ||
    !!briefData ||
    !!school?.website_request ||
    !!scladappWebsiteUrl;

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    setWebsiteLoading(true);

    Promise.all([
      getWebsite(schoolId),
      getRequest(schoolId),
      fetchApplicationFormConfig(schoolId),
    ])
      .then(([websiteRes, requestRes, formRes]) => {
        if (cancelled) return;

        if (websiteRes.success && websiteRes.data) {
          setSchool(websiteRes.data);
          setWebsiteRequested(!!websiteRes.data.website_requested);
          // Prefer embedded request from getWebsite when present
          if (websiteRes.data.website_request) {
            setBriefData(websiteRes.data.website_request);
          }
        }

        if (requestRes.success && requestRes.data) {
          setBriefData(requestRes.data);
          setWebsiteRequested(true);
        } else if (requestRes.success && requestRes.data === null && websiteRes?.data?.website_request) {
          // keep website_request from getWebsite
        }

        if (formRes.success) setAppFormIsActive(formRes.data.is_active !== false);
      })
      .finally(() => {
        if (!cancelled) setWebsiteLoading(false);
      });

    return () => { cancelled = true; };
  }, [schoolId]);

  const handleSaveWebsite = async (url) => {
    const res = await saveWebsite(schoolId, url);
    if (res.success) {
      setSchool((prev) => ({ ...prev, website: url || null }));
      addNotification("Website URL saved", "success");
    } else {
      addNotification("Failed to save website URL", "error");
    }
    return res;
  };

  // Opens the brief page (create or view)
  const handleOpenPanel = () => navigate(`/admin/${schoolId}/school/website/brief`);

  const handleCancelled = () => {
    setBriefData(null);
    setWebsiteRequested(false);
    setSchool((prev) => prev ? { ...prev, website_requested: false, scladapp_website_url: null, website_request: null } : prev);
    addNotification("Request cancelled.", "success");
  };

  return (
    <div className="sw-wrap">
        {/* Scladapp-hosted website request — paid plans only, shown first */}
        {websiteLoading ? (
          <div className="sw-section sw-section-request">
            <div className="sw-request-header">
              <h3 className="sw-request-title">Scladapp-Powered Website</h3>
              <p className="sw-request-desc">Loading website status…</p>
            </div>
          </div>
        ) : isPaidPlan ? (
          <RequestWebsiteSection
            onRequest={handleOpenPanel}
            onCancel={async () => {
              const res = await cancelRequest(schoolId);
              if (res.success) handleCancelled();
              else addNotification("Failed to cancel request", "error");
            }}
            loading={briefLoading}
            alreadyRequested={alreadyRequested}
            briefStatus={briefData?.status || school?.website_request_status}
            scladappWebsiteUrl={scladappWebsiteUrl}
            onEditWithAI={() => navigate(`/admin/${schoolId}/school/website/ai-editor`)}
            customDomain={briefData?.custom_domain || school?.custom_domain || null}
            customDomainStatus={briefData?.custom_domain_status || school?.custom_domain_status || null}
          />
        ) : (
          <div className="sw-section sw-section-locked">
            <div className="sw-locked-inner">
              <div className="sw-locked-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="sw-locked-title">Scladapp-Hosted Website</h3>
                <p className="sw-locked-desc">
                  Upgrade to a paid plan to request a professionally designed website built and hosted for your school.
                </p>
              </div>
              <div className="sw-locked-pill">Paid Plans Only</div>
            </div>
            <div className="sw-locked-features">
              {["Custom branded design", "All pages included", "Mobile responsive", "Zero maintenance"].map((f) => (
                <div key={f} className="sw-locked-feature">
                  <span className="sw-locked-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

          {/* Login link — always available */}
        <LoginLinkCard schoolId={schoolId} school={school} />

        <ApplicationFormLinkCard
          schoolId={schoolId}
          school={school}
          isActive={appFormIsActive}
          onActiveChange={setAppFormIsActive}
          onConfigure={() => setFieldsPanelOpen(true)}
        />

        <ApplicationFormFieldsPanel
          schoolId={schoolId}
          open={fieldsPanelOpen}
          isActive={appFormIsActive}
          onClose={(saved) => {
            setFieldsPanelOpen(false);
            if (saved) addNotification("Application form settings saved", "success");
          }}
        />

        {/* Your website URL — always available */}
        <YourWebsiteSection
          schoolId={schoolId}
          initialWebsite={school?.website}
          onSaved={handleSaveWebsite}
          loading={false}
        />
      </div>
  );
};

const SchoolWebsite = () => (
  <InnerTabCon>
    <SchoolWebsiteContent />
  </InnerTabCon>
);

export default SchoolWebsite;
