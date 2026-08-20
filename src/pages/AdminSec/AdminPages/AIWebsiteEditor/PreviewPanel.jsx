import { useState, useRef, useEffect, useMemo } from "react";
import { injectInteractivity } from "./previewInjector";

const IconDesktop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconTablet = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const IconMobile = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M23 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 20v-6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCursor = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DEVICES = [
  { id: "desktop", label: "Desktop", Icon: IconDesktop },
  { id: "tablet",  label: "Tablet",  Icon: IconTablet  },
  { id: "mobile",  label: "Mobile",  Icon: IconMobile  },
];

/**
 * Props:
 *   html            – raw HTML string
 *   siteUrl         – displayed in address bar
 *   isSplitMode     – when true, element hover/select is enabled
 *   onElementSelect – called with { label, selector, textContent, tagName, outerHTML }
 *   hoverSelector   – selector to highlight from outside (e.g. layout tree hover)
 *   hoverLabel      – friendly label for the hover badge
 */
export default function PreviewPanel({ html, siteUrl, isSplitMode, onElementSelect, hoverSelector, hoverLabel, scrollToSelector }) {
  const [device, setDevice] = useState("desktop");
  const [key,    setKey]    = useState(0);
  const iframeRef    = useRef(null);
  const initialHtml  = useRef(html);   // the HTML used for the current srcDoc load
  const iframeReady  = useRef(false);  // true once the iframe has fired onLoad
  const pendingHtml  = useRef(null);   // html queued while iframe was still loading

  // srcDoc is only recomputed on key change (manual refresh) or isSplitMode toggle.
  // We always use the latest html as the baseline when key changes.
  const srcDoc = useMemo(
    () => isSplitMode ? injectInteractivity(initialHtml.current) : initialHtml.current,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, isSplitMode]
  );

  // When html prop changes, push a live patch to the iframe (no reload = no scroll reset)
  useEffect(() => {
    if (!iframeReady.current) {
      // iframe still loading — queue it; onLoad will flush it
      pendingHtml.current = html;
      return;
    }
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { __aie: true, type: "updateHtml", html },
      "*"
    );
  }, [html]);

  // Manual refresh — reload iframe with latest html
  const handleRefresh = () => {
    initialHtml.current = html;
    iframeReady.current = false;
    pendingHtml.current = null;
    setKey((k) => k + 1);
  };

  // When isSplitMode toggles, reload with latest html so interactivity script is (re)injected
  const prevSplitMode = useRef(isSplitMode);
  useEffect(() => {
    if (prevSplitMode.current !== isSplitMode) {
      prevSplitMode.current = isSplitMode;
      initialHtml.current   = html;
      iframeReady.current   = false;
      pendingHtml.current   = null;
      setKey((k) => k + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSplitMode]);

  // Listen for postMessage events from the iframe
  useEffect(() => {
    if (!isSplitMode) return;

    const handler = (e) => {
      if (!e.data?.__aie) return;
      if (e.data.type === "select") {
        onElementSelect?.({
          label:       e.data.label,
          selector:    e.data.selector,
          textContent: e.data.textContent,
          tagName:     e.data.tagName,
          outerHTML:   e.data.outerHTML,
          sectionId:   e.data.sectionId   || null,
          sectionHtml: e.data.sectionHtml || null,
        });
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isSplitMode, onElementSelect]);

  // Send external hover command to the iframe when hoverSelector changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    if (hoverSelector) {
      iframe.contentWindow.postMessage(
        { __aie: true, type: "externalHover", selector: hoverSelector, label: hoverLabel || hoverSelector },
        "*"
      );
    } else {
      iframe.contentWindow.postMessage(
        { __aie: true, type: "externalHoverClear" },
        "*"
      );
    }
  }, [hoverSelector, hoverLabel]);

  // When a tree node is selected, scroll to it inside the iframe
  useEffect(() => {
    if (!scrollToSelector || !iframeReady.current) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { __aie: true, type: "externalSelect", selector: scrollToSelector },
      "*"
    );
  }, [scrollToSelector]);

  const frameClass =
    device === "tablet" ? "aie-preview-frame aie-preview-frame--tablet" :
    device === "mobile" ? "aie-preview-frame aie-preview-frame--mobile" :
                          "aie-preview-frame aie-preview-frame--desktop";

  return (
    <div className="aie-right">
      {/* browser-chrome bar */}
      <div className="aie-preview-bar">
        <div className="aie-preview-dots">
          <span className="aie-dot aie-dot-r" />
          <span className="aie-dot aie-dot-y" />
          <span className="aie-dot aie-dot-g" />
        </div>

        <div className="aie-preview-addr">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>{siteUrl || "preview"}</span>
        </div>

        {/* cursor mode indicator — only in split */}
        {isSplitMode && (
          <div className="aie-cursor-mode-badge" title="Click any element to select it for AI editing">
            <IconCursor />
            <span>Select mode</span>
          </div>
        )}

        <button
          className="aie-preview-refresh"
          onClick={handleRefresh}
          title="Refresh preview"
          aria-label="Refresh preview"
        >
          <IconRefresh />
        </button>

        {/* device buttons */}
        <div className="aie-device-btns">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`aie-device-btn ${device === id ? "aie-device-btn--active" : ""}`}
              onClick={() => setDevice(id)}
              title={label}
              aria-label={`${label} preview`}
            >
              <Icon />
            </button>
          ))}
        </div>
      </div>

      {/* preview stage */}
      <div className={`aie-preview-stage aie-preview-stage--${device}`}>
        {html ? (
          <div className={frameClass}>
            <iframe
              key={key}
              ref={iframeRef}
              className="aie-preview-iframe"
              srcDoc={srcDoc}
              title="Website preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              aria-label="Live website preview"
              onLoad={() => {
                iframeReady.current = true;
                const win = iframeRef.current?.contentWindow;
                if (!win) return;
                // Flush any html that changed while the iframe was loading
                const latest = pendingHtml.current ?? html;
                pendingHtml.current = null;
                if (latest !== initialHtml.current) {
                  win.postMessage({ __aie: true, type: "updateHtml", html: latest }, "*");
                }
              }}
            />
          </div>
        ) : (
          <div className="aie-preview-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.4"/>
              <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
            <p>No preview yet</p>
            <span>Start editing or use AI to generate content</span>
          </div>
        )}
      </div>
    </div>
  );
}
