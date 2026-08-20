/**
 * HtmlLivePreview — renders an HTML fragment (not a full page) in a scrollable
 * canvas with click-to-select and hover-highlight support.
 *
 * Used by: EditTemplatePage, (future) EmailTemplatePage
 *
 * Unlike PreviewPanel (which uses an iframe for full pages), this component
 * renders the fragment directly via dangerouslySetInnerHTML inside a scoped
 * container. Click events bubble up and are resolved to CSS selectors via the
 * same buildSelector logic used in htmlLayoutParser.
 *
 * Props:
 *   html              – HTML fragment string (no <!DOCTYPE> needed)
 *   onElementSelect   – fn({ selector, label, tagName, textContent, outerHTML })
 *   selectedSelector  – selector to highlight with a blue outline
 *   hoverSelector     – selector to highlight with a lighter hover outline
 *   title             – optional label shown in the preview bar (default "Preview")
 */

import { useRef, useEffect, useCallback } from "react";

// ── Build a unique CSS selector for a DOM element ─────────────────────────────
function buildSelector(el) {
  const parts = [];
  let cur = el;
  while (cur && cur.tagName && cur.tagName.toLowerCase() !== "body") {
    const tag = cur.tagName.toLowerCase();
    // Prefer id, then data-hle-id (stable even after re-parse)
    const id  = cur.id ? `#${cur.id}` : "";
    if (id) { parts.unshift(tag + id); break; }
    const hleId = cur.getAttribute("data-hle-id");
    if (hleId) { parts.unshift(`${tag}[data-hle-id="${hleId}"]`); break; }
    const parent = cur.parentElement;
    const siblings = parent
      ? Array.from(parent.children).filter((c) => c.tagName === cur.tagName)
      : [cur];
    const index = siblings.indexOf(cur) + 1;
    const cls = Array.from(cur.classList).slice(0, 1).map((c) => `.${c}`).join("");
    parts.unshift(`${tag}${cls}:nth-of-type(${index})`);
    cur = cur.parentElement;
  }
  return parts.join(" > ");
}

// Friendly name for an element
function elementLabel(el) {
  const tagLabels = {
    div: "Container", section: "Section", article: "Article", header: "Header",
    footer: "Footer", nav: "Navigation", main: "Main", aside: "Sidebar",
    h1: "Heading 1", h2: "Heading 2", h3: "Heading 3", h4: "Heading 4",
    p: "Paragraph", span: "Text", a: "Link", button: "Button",
    img: "Image", table: "Table", tr: "Row", td: "Cell", th: "Header Cell",
    ul: "List", ol: "Numbered List", li: "List Item",
  };
  const tag = el.tagName.toLowerCase();
  return tagLabels[tag] || (tag.charAt(0).toUpperCase() + tag.slice(1));
}

// Inject selection / hover outline styles into the container
const STYLE_ID = "__hle_styles__";
function ensureStyles(container) {
  if (container.querySelector(`#${STYLE_ID}`)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    .__hle_hover__ { outline: 2px dashed rgba(108,92,231,0.5) !important; outline-offset: 1px !important; cursor: pointer !important; }
    .__hle_selected__ { outline: 2px solid #6c5ce7 !important; outline-offset: 1px !important; }
  `;
  container.prepend(s);
}

export default function HtmlLivePreview({
  html,
  onElementSelect,
  selectedSelector,
  hoverSelector,
  title = "Preview",
}) {
  const containerRef = useRef(null);

  // Inject HTML into container (keeps it in the same document for easy querying)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = html || "";
    ensureStyles(container);
  }, [html]);

  // Apply selected outline
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll(".__hle_selected__").forEach((el) =>
      el.classList.remove("__hle_selected__")
    );
    if (selectedSelector) {
      try {
        const el = container.querySelector(selectedSelector);
        if (el) el.classList.add("__hle_selected__");
      } catch (_) {}
    }
  }, [selectedSelector, html]);

  // Apply hover outline
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll(".__hle_hover__").forEach((el) =>
      el.classList.remove("__hle_hover__")
    );
    if (hoverSelector) {
      try {
        const el = container.querySelector(hoverSelector);
        if (el) el.classList.add("__hle_hover__");
      } catch (_) {}
    }
  }, [hoverSelector, html]);

  const handleClick = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container || !onElementSelect) return;
      // Walk up from target until we hit the container boundary
      let el = e.target;
      while (el && el !== container) {
        if (el.nodeType === 1 && el.tagName.toLowerCase() !== "style") {
          e.stopPropagation();
          const selector = buildSelector(el);
          onElementSelect({
            selector,
            label:       elementLabel(el),
            tagName:     el.tagName.toLowerCase(),
            textContent: (el.textContent || "").trim().slice(0, 60),
            outerHTML:   el.outerHTML,
          });
          return;
        }
        el = el.parentElement;
      }
    },
    [onElementSelect]
  );

  const handleMouseOver = useCallback(
    (e) => {
      const container = containerRef.current;
      if (!container) return;
      container.querySelectorAll(".__hle_hover__").forEach((el) =>
        el.classList.remove("__hle_hover__")
      );
      let el = e.target;
      while (el && el !== container) {
        if (el.nodeType === 1 && el.tagName.toLowerCase() !== "style") {
          el.classList.add("__hle_hover__");
          return;
        }
        el = el.parentElement;
      }
    },
    []
  );

  const handleMouseOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll(".__hle_hover__").forEach((el) =>
      el.classList.remove("__hle_hover__")
    );
  }, []);

  return (
    <div className="hle-root">
      {/* Browser-chrome bar */}
      <div className="aie-preview-bar">
        <div className="aie-preview-dots">
          <span className="aie-dot aie-dot-r" />
          <span className="aie-dot aie-dot-y" />
          <span className="aie-dot aie-dot-g" />
        </div>
        <div className="aie-preview-addr">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>{title}</span>
        </div>
        <div className="aie-cursor-mode-badge" title="Click any element to select it">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M4 4l7.07 17 2.51-7.39L21 11.07z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Select mode</span>
        </div>
      </div>

      {/* Scrollable canvas */}
      <div className="hle-canvas">
        <div className="hle-paper">
          <div
            ref={containerRef}
            className="hle-content"
            onClick={handleClick}
            onMouseOver={handleMouseOver}
            onMouseOut={handleMouseOut}
          />
        </div>
      </div>
    </div>
  );
}
