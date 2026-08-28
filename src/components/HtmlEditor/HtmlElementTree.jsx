/**
 * HtmlElementTree — reusable left panel showing the element tree for an HTML fragment.
 * Used by: EditTemplatePage, (future) EmailTemplatePage
 *
 * Wraps the AIWebsiteEditor's LayoutTree + ManualLeftPanel shell styles.
 * No "Add section" button (template structure is fixed).
 *
 * Props:
 *   html              – HTML fragment string
 *   selectedSelector  – currently selected element selector
 *   onSelectNode      – fn(node) — node from parseLayoutTree
 *   onHover           – fn(selector, label)
 *   onHoverClear      – fn()
 *   onDelete          – fn(selector)   optional
 *   onDuplicate       – fn(selector)   optional
 *   onMove            – fn(from, to, position) optional
 *   title             – panel header title (default "Elements")
 */
import LayoutTree from "../../pages/AdminSec/AdminPages/AIWebsiteEditor/LayoutTree";
import { useState } from "react";

export default function HtmlElementTree({
  html,
  selectedSelector,
  onSelectNode,
  onHover,
  onHoverClear,
  onDelete,
  onDuplicate,
  onMove,
  title = "Elements",
}) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="manual-side-panel manual-side-panel--left">
      <div className="manual-side-panel__header">
        <span className="manual-side-panel__title">{title}</span>
      </div>

      <div className="msp-tabs" role="tablist">
        <button role="tab" aria-selected className="msp-tab msp-tab--active">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Layout
        </button>
        <button
          type="button"
          className="msp-icon-btn"
          onClick={() => setExpandAll((e) => !e)}
          title={expandAll ? "Collapse all elements" : "Expand all elements"}
          aria-label={expandAll ? "Collapse all elements" : "Expand all elements"}
        >
          {expandAll ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h10M4 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      <div className="msp-content">
        <LayoutTree
          html={html}
          selectedSelector={selectedSelector}
          onSelect={onSelectNode}
          onHover={onHover}
          onHoverClear={onHoverClear}
          onAdd={undefined}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMove={onMove}
          onOpenModal={undefined}
          expandAll={expandAll}
        />
      </div>
    </div>
  );
}
