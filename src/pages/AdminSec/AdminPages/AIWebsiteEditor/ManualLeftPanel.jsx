// ManualLeftPanel.jsx
// Left sidebar for Manual mode.
// Shows the page element tree (Layout).
// The "Add" tab is replaced by an "Add section" button that opens the template modal.

import { useState } from "react";
import LayoutTree from "./LayoutTree";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconLayers = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCollapseAll = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconExpandAll = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/**
 * Props:
 *   html             – current page HTML string
 *   selectedSelector – selector of the element selected in preview
 *   onSelectNode     – fn(node)
 *   onHover          – fn(selector, label)
 *   onHoverClear     – fn()
 *   onAdd            – fn(parentSelector, templateHtml)
 *   onDelete         – fn(selector)
 *   onDuplicate      – fn(selector)
 *   onMove           – fn(from, to, position)
 *   onOpenModal      – fn(tab) opens AddTemplateModal with given initial tab
 */
export default function ManualLeftPanel({
  html, selectedSelector, onSelectNode,
  onHover, onHoverClear,
  onAdd, onDelete, onDuplicate, onMove,
  onOpenModal,
}) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="manual-side-panel manual-side-panel--left">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="manual-side-panel__header">
        <span className="manual-side-panel__title">Elements</span>
      </div>

      {/* ── Tab-bar: Layout (active) + Add section (button) ─────── */}
      <div className="msp-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={true}
          className="msp-tab msp-tab--active"
        >
          <IconLayers /> Layout
        </button>
        <button
          role="tab"
          aria-selected={false}
          className="msp-tab msp-tab--add"
          onClick={() => onOpenModal("sections")}
          title="Add a pre-built section or component"
        >
          <IconPlus /> Add section
        </button>
        <button
          type="button"
          className="msp-icon-btn"
          onClick={() => setExpandAll((e) => !e)}
          title={expandAll ? "Collapse all elements" : "Expand all elements"}
          aria-label={expandAll ? "Collapse all elements" : "Expand all elements"}
        >
          {expandAll ? <IconCollapseAll /> : <IconExpandAll />}
        </button>
      </div>

      <div className="msp-content">
        <LayoutTree
          html={html}
          selectedSelector={selectedSelector}
          onSelect={onSelectNode}
          onHover={onHover}
          onHoverClear={onHoverClear}
          onAdd={onAdd}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMove={onMove}
          onOpenModal={onOpenModal}
          expandAll={expandAll}
        />
      </div>
    </div>
  );
}
