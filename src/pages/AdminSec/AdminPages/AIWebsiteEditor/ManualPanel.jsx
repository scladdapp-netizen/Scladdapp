// ManualPanel.jsx
// Shell layout for Manual editing mode.
// Owns: hover state, modal state, add / delete / duplicate / move HTML mutations.

import { useState, cloneElement, useCallback } from "react";
import ManualLeftPanel    from "./ManualLeftPanel";
import ManualRightPanel   from "./ManualRightPanel";
import AddTemplateModal   from "./AddTemplateModal";
import { deleteElement, insertChildLast, appendToBody, moveElement, moveIntoParent, duplicateElement } from "./htmlPatcher";

/**
 * Props:
 *   html             – current HTML string
 *   selectedElement  – element selected from preview { selector, ... }
 *   onSelectNode     – fn(node) when user picks from layout tree
 *   onHtmlChange     – fn(newHtml) commit a new HTML snapshot to history
 *   children         – the <PreviewPanel /> from AIWebsiteEditor
 */
export default function ManualPanel({ html, selectedElement, onSelectNode, onHtmlChange, children }) {
  const [hoverSelector, setHoverSelector] = useState(null);
  const [hoverLabel,    setHoverLabel]    = useState(null);

  // ── Template modal ─────────────────────────────────────────────────────────
  const [modalOpen,       setModalOpen]       = useState(false);
  const [modalInitTab,    setModalInitTab]    = useState("sections");
  const [modalTargetSel,  setModalTargetSel]  = useState(null); // selector of the element that opened the modal
  const [modalTargetLabel, setModalTargetLabel] = useState(null); // friendly label for the modal subtitle

  // Called from the "Add section" tab button (no target — appends to body)
  // AND from the tree node's "Browse all templates" (target = parent selector)
  const handleOpenModal = useCallback((tab, parentSelector = null, parentLabel = null) => {
    setModalInitTab(tab || "sections");
    setModalTargetSel(parentSelector || null);
    setModalTargetLabel(parentLabel || null);
    setModalOpen(true);
  }, []);

  const handleModalInsert = useCallback((templateHtml) => {
    let newHtml;
    if (modalTargetSel) {
      // Insert as last child of the element whose + button was clicked
      newHtml = insertChildLast(html, modalTargetSel, templateHtml);
    } else {
      // No specific target — append to <body>
      newHtml = appendToBody(html, templateHtml);
    }
    onHtmlChange(newHtml);
  }, [html, modalTargetSel, onHtmlChange]);

  // ── Hover ──────────────────────────────────────────────────────────────────
  const handleHover = (selector, label) => {
    setHoverSelector(selector);
    setHoverLabel(label);
  };
  const handleHoverClear = () => {
    setHoverSelector(null);
    setHoverLabel(null);
  };

  // ── Add child element (from tree node + dropdown) ──────────────────────────
  const handleAdd = useCallback((parentSelector, templateHtml) => {
    const newHtml = insertChildLast(html, parentSelector, templateHtml);
    onHtmlChange(newHtml);
  }, [html, onHtmlChange]);

  // ── Delete element ─────────────────────────────────────────────────────────
  const handleDelete = useCallback((selector) => {
    const newHtml = deleteElement(html, selector);
    onHtmlChange(newHtml);
  }, [html, onHtmlChange]);

  // ── Duplicate element ──────────────────────────────────────────────────────
  const handleDuplicate = useCallback((selector) => {
    const newHtml = duplicateElement(html, selector);
    onHtmlChange(newHtml);
  }, [html, onHtmlChange]);

  // ── Move element (drag reorder) ────────────────────────────────────────────
  const handleMove = useCallback((fromSelector, toSelector, position) => {
    const newHtml = position === "inside"
      ? moveIntoParent(html, fromSelector, toSelector)
      : moveElement(html, fromSelector, toSelector, position);
    onHtmlChange(newHtml);
  }, [html, onHtmlChange]);

  // Inject hover props into PreviewPanel
  const previewWithHover = children
    ? cloneElement(children, { hoverSelector, hoverLabel })
    : null;

  return (
    <div className="manual-layout">
      <ManualLeftPanel
        html={html}
        selectedSelector={selectedElement?.selector || null}
        onSelectNode={onSelectNode}
        onHover={handleHover}
        onHoverClear={handleHoverClear}
        onAdd={handleAdd}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onMove={handleMove}
        onOpenModal={handleOpenModal}      />

      <div className="manual-layout__preview">
        {previewWithHover}
      </div>

      <ManualRightPanel
        selectedElement={selectedElement}
        html={html}
        onHtmlChange={onHtmlChange}
      />

      <AddTemplateModal
        isOpen={modalOpen}
        initialTab={modalInitTab}
        onClose={() => { setModalOpen(false); setModalTargetSel(null); setModalTargetLabel(null); }}
        onInsert={handleModalInsert}
        targetLabel={modalTargetLabel}
      />
    </div>
  );
}
