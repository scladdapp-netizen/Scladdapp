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

const IconZoomOut = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21l-4.3-4.3M8 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconZoomIn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 21l-4.3-4.3M8 11h6M11 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const ZOOM_PRESETS = [50, 67, 75, 80, 90, 100, 110, 125, 150, 175, 200, 250];

const DEVICES = [
  { id: "desktop", label: "Desktop", Icon: IconDesktop },
  { id: "tablet",  label: "Tablet",  Icon: IconTablet  },
  { id: "mobile",  label: "Mobile",  Icon: IconMobile  },
];

function nearestZoomIndex(pct) {
  let best = 0;
  let dist = Infinity;
  ZOOM_PRESETS.forEach((z, i) => {
    const d = Math.abs(z - pct);
    if (d < dist) { dist = d; best = i; }
  });
  return best;
}

function isTransparentColor(c) {
  return !c || c === "transparent" || c === "rgba(0, 0, 0, 0)" || c === "rgba(0,0,0,0)";
}

/** Match the iframe chrome to the page html/body background (not forced white). */
function paintIframeFromPage(iframe) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc?.documentElement) return;
    const htmlCs = getComputedStyle(doc.documentElement);
    const bodyCs = doc.body ? getComputedStyle(doc.body) : null;
    let color = htmlCs.backgroundColor;
    let image = htmlCs.backgroundImage;
    if (isTransparentColor(color) && (!image || image === "none") && bodyCs) {
      color = bodyCs.backgroundColor;
      image = bodyCs.backgroundImage;
    }
    iframe.style.backgroundColor = isTransparentColor(color) ? "transparent" : color;
    iframe.style.backgroundImage = image && image !== "none" ? image : "none";
    const frame = iframe.parentElement;
    if (frame?.className?.includes("aie-preview-frame")) {
      frame.style.backgroundColor = iframe.style.backgroundColor;
      frame.style.backgroundImage = iframe.style.backgroundImage;
    }
  } catch {
    /* iframe not ready */
  }
}

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
  const [zoom,   setZoom]   = useState(80);
  const [zoomMenu, setZoomMenu] = useState(false);
  const zoomMenuRef  = useRef(null);
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
    setTimeout(() => paintIframeFromPage(iframe), 40);
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

  const zoomInSafe = () => {
    setZoom((z) => {
      const i = nearestZoomIndex(z);
      if (ZOOM_PRESETS[i] <= z && i < ZOOM_PRESETS.length - 1) return ZOOM_PRESETS[i + 1];
      if (ZOOM_PRESETS[i] > z) return ZOOM_PRESETS[i];
      return z;
    });
  };
  const zoomOutSafe = () => {
    setZoom((z) => {
      const i = nearestZoomIndex(z);
      if (ZOOM_PRESETS[i] >= z && i > 0) return ZOOM_PRESETS[i - 1];
      if (ZOOM_PRESETS[i] < z) return ZOOM_PRESETS[i];
      return z;
    });
  };

  useEffect(() => {
    if (!zoomMenu) return;
    const close = (e) => {
      if (!zoomMenuRef.current?.contains(e.target)) setZoomMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [zoomMenu]);

  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "=" || e.key === "+") { e.preventDefault(); zoomInSafe(); }
      else if (e.key === "-") { e.preventDefault(); zoomOutSafe(); }
      else if (e.key === "0") { e.preventDefault(); setZoom(80); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPreviewWheel = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    if (e.deltaY < 0) zoomInSafe();
    else zoomOutSafe();
  };

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

        <div className="aie-zoom" ref={zoomMenuRef}>
          <button
            type="button"
            className="aie-zoom-btn"
            onClick={zoomOutSafe}
            disabled={zoom <= ZOOM_PRESETS[0]}
            title="Zoom out (Ctrl+-)"
            aria-label="Zoom out"
          >
            <IconZoomOut />
          </button>
          <button
            type="button"
            className="aie-zoom-pct"
            onClick={() => setZoomMenu((o) => !o)}
            title="Zoom level — click for presets, Ctrl+0 to reset"
            aria-label={`Zoom ${zoom} percent`}
            aria-expanded={zoomMenu}
          >
            {zoom}%
          </button>
          <button
            type="button"
            className="aie-zoom-btn"
            onClick={zoomInSafe}
            disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
            title="Zoom in (Ctrl++)"
            aria-label="Zoom in"
          >
            <IconZoomIn />
          </button>
          {zoomMenu && (
            <div className="aie-zoom-menu" role="listbox">
              {ZOOM_PRESETS.map((z) => (
                <button
                  key={z}
                  type="button"
                  role="option"
                  aria-selected={z === zoom}
                  className={`aie-zoom-option ${z === zoom ? "aie-zoom-option--active" : ""}`}
                  onClick={() => { setZoom(z); setZoomMenu(false); }}
                >
                  {z}%
                </button>
              ))}
            </div>
          )}
        </div>

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
      <div
        className={`aie-preview-stage aie-preview-stage--${device}`}
        onWheel={onPreviewWheel}
      >
        {html ? (
          <div
            className={frameClass}
            style={{ "--aie-zoom": zoom / 100 }}
          >
            <iframe
              key={key}
              ref={iframeRef}
              className="aie-preview-iframe"
              style={{ zoom: zoom / 100 }}
              srcDoc={srcDoc}
              title="Website preview"
              sandbox="allow-scripts allow-same-origin allow-forms"
              aria-label="Live website preview"
              onLoad={() => {
                iframeReady.current = true;
                const frameEl = iframeRef.current;
                const win = frameEl?.contentWindow;
                if (!win) return;
                paintIframeFromPage(frameEl);
                requestAnimationFrame(() => paintIframeFromPage(frameEl));
                const latest = pendingHtml.current ?? html;
                pendingHtml.current = null;
                if (latest !== initialHtml.current) {
                  win.postMessage({ __aie: true, type: "updateHtml", html: latest }, "*");
                  setTimeout(() => paintIframeFromPage(frameEl), 50);
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
