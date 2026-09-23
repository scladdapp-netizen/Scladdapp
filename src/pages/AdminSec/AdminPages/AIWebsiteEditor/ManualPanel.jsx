// ManualPanel.jsx
// Shell layout for Manual editing mode.
// Owns: hover state, modal state, add / delete / duplicate / move HTML mutations.

import { useState, cloneElement, useCallback } from "react";
import ManualLeftPanel    from "./ManualLeftPanel";
import ManualRightPanel   from "./ManualRightPanel";
import AddTemplateModal   from "./AddTemplateModal";
import { parseLayoutTree } from "./htmlLayoutParser";
import { deleteElement, insertChildLast, upsertHeadStyle, insertSectionIntoPage, moveElement, moveIntoParent, duplicateElement } from "./htmlPatcher";
import { applySectionChrome, brandCss, isNavigationSection } from "./sectionChrome";

function findNodeBySelector(nodes, selector) {
  if (!selector || !nodes?.length) return null;
  const strip = (s) => String(s).replace(/\.[a-zA-Z0-9_-]+/g, "").replace(/\s+/g, " ").trim();
  const want = strip(selector);
  // Only treat hle-id as identity when the lookup is the stamped root itself
  // (not a descendant path that merely includes an ancestor's data-hle-id)
  const hleRootId = (() => {
    const m = want.match(/^(?:[a-zA-Z0-9_-]+)?\[data-hle-id="([^"]+)"\]$/);
    return m ? m[1] : null;
  })();
  const walk = (list) => {
    for (const n of list) {
      if (n.selector === selector || strip(n.selector) === want) return n;
      if (hleRootId && n.id === hleRootId) return n;
      const child = walk(n.children || []);
      if (child) return child;
    }
    return null;
  };
  return walk(nodes);
}

/**
 * Props:
 *   html             – current HTML string
 *   selectedElement  – element selected from preview { selector, ... }
 *   onSelectNode     – fn(node) when user picks from layout tree
 *   onHtmlChange     – fn(newHtml) commit a new HTML snapshot to history
 *   children         – the <PreviewPanel /> from AIWebsiteEditor
 */
export default function ManualPanel({ html, selectedElement, onSelectNode, onHtmlChange, chrome = null, children }) {
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
    const fragment = applySectionChrome(templateHtml, chrome);
    const pageHtml = chrome ? upsertHeadStyle(html, "wbp-brand", brandCss(chrome)) : html;
    const navigation = isNavigationSection(fragment);
    const { html: newHtml, selector } = insertSectionIntoPage(pageHtml, fragment, {
      atStart: navigation,
      replaceSelector: navigation ? "nav.sclad-nav, header.sclad-nav" : null,
      parentSelector: modalTargetSel || null,
    });
    onHtmlChange(newHtml);
    if (navigation && selector && onSelectNode) {
      const tree = parseLayoutTree(newHtml);
      const node = findNodeBySelector(tree, selector);
      if (node) onSelectNode(node);
    }
  }, [html, modalTargetSel, onHtmlChange, onSelectNode, chrome]);

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
    const result = position === "inside"
      ? moveIntoParent(html, fromSelector, toSelector)
      : moveElement(html, fromSelector, toSelector, position);
    const newHtml = typeof result === "string" ? result : result.html;
    const movedHleId = typeof result === "string" ? null : result.movedHleId;
    onHtmlChange(newHtml);

    // Refresh selection to the moved node's new selector (path may have changed)
    if (onSelectNode) {
      const tree = parseLayoutTree(newHtml);
      const lookup = movedHleId
        ? `[data-hle-id="${movedHleId}"]`
        : fromSelector;
      const node = findNodeBySelector(tree, lookup) || findNodeBySelector(tree, fromSelector);
      if (node) onSelectNode(node);
    }
  }, [html, onHtmlChange, onSelectNode]);

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
        onSelectNode={onSelectNode}
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
