// LayoutTree.jsx
// Collapsible human-readable page element tree.
// Nestable nodes show + (add child) and × (delete) action buttons on hover.

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal }          from "react-dom";
import { parseLayoutTree }       from "./htmlLayoutParser";
import TEMPLATES                 from "./elementTemplates.json";
import { duplicateElement }      from "./htmlPatcher";

// Tags that can have children added inside them
const NESTABLE_TAGS = new Set([
  "div", "section", "article", "main", "header", "footer",
  "nav", "aside", "form", "ul", "ol", "table", "tbody",
  "thead", "tr", "fieldset", "figure", "details",
]);

// Group templates by category once — in display order
const CATEGORY_ORDER = ["Text", "Interactive", "Layout", "Media"];
const TEMPLATE_GROUPS = CATEGORY_ORDER.reduce((acc, cat) => {
  const items = TEMPLATES.filter(t => t.category === cat);
  if (items.length) acc[cat] = items;
  return acc;
}, {});

// ── Icons ─────────────────────────────────────────────────────────────────────
const nodeIcons = {
  layout:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/></svg>,
  navigation: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  section:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/></svg>,
  container:  () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/></svg>,
  heading:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  text:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M4 7V5h16v2M9 19h6M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  image:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  link:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  button:     () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="10" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  input:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M6 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  list:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="9" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>,
  listitem:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="4" cy="12" r="1.5" fill="currentColor"/><line x1="9" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  table:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="1" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2"/><line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/></svg>,
  form:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  video:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor"/></svg>,
  icon:       () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  divider:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2"/></svg>,
  article:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 8h10M7 12h10M7 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  sidebar:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2"/></svg>,
  quote:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="2"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="2"/></svg>,
  embed:      () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M8 12l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

const IconChevron = ({ open }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
    style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}>
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPlus  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>;
const IconTrash = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconCopy  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;

function NodeIcon({ type }) {
  const Comp = nodeIcons[type] || nodeIcons.container;
  return <span className="lt-node-icon"><Comp /></span>;
}

// Pure recursive helper — does this subtree contain `selector`?
function subtreeContains(node, selector) {
  if (!selector || !node) return false;
  if (node.selector === selector) return true;
  return (node.children || []).some(c => subtreeContains(c, selector));
}

// ── Add dropdown — portal-based, positioned with useLayoutEffect (no flash) ──
function AddDropdown({ anchorRef, onPick, onClose, onOpenModal, parentSelector, parentLabel }) {
  const dropRef = useRef(null);
  const [pos, setPos] = useState(null); // null = not yet measured

  // Measure synchronously before paint — eliminates the top-flash
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top:  rect.bottom + 4,
      left: rect.left,
    });
  }, []); // only once on mount

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropRef.current   && !dropRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, anchorRef]);

  // Don't render until position is known — avoids any flash at (0,0) or top
  if (!pos) return null;

  return createPortal(
    <div
      ref={dropRef}
      className="lt-add-dropdown"
      role="menu"
      style={{ position: "fixed", top: pos.top, left: pos.left }}
    >
      {onOpenModal && (
        <button
          className="lt-add-browse-btn"
          role="menuitem"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            onOpenModal("components", parentSelector, parentLabel);
          }}
        >
          <IconPlus /> Browse all templates
        </button>
      )}
      {Object.entries(TEMPLATE_GROUPS).map(([category, items]) => (
        <div key={category} className="lt-add-group">
          <span className="lt-add-group-label">{category}</span>
          {items.map(item => {
            const Icon = nodeIcons[item.iconType] || nodeIcons.container;
            return (
              <button
                key={item.id}
                className="lt-add-option"
                role="menuitem"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onPick(item);
                  onClose();
                }}
              >
                <span className="lt-add-option-icon"><Icon /></span>
                {item.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>,
    document.body
  );
}

// ── Single tree node ──────────────────────────────────────────────────────────
function TreeNode({
  node, depth, selectedSelector,
  onSelect, onHover, onHoverClear,
  onAdd, onDelete, onDuplicate, onMove,
  dragState, setDragState, onOpenModal,
  expandAll,
}) {
  const [open,        setOpen]        = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [dropZone,    setDropZone]    = useState(null); // "before"|"inside"|"after"|null
  const addBtnRef = useRef(null);
  const rowRef    = useRef(null);

  const hasChildren = node.children && node.children.length > 0;
  const isNestable  = NESTABLE_TAGS.has(node.tag);
  const isSelected  = selectedSelector === node.selector;
  const isDragging  = dragState?.selector === node.selector;

  // When selectedSelector changes (preview click or external):
  // • if this node IS selected → scroll its row into view
  // • if this node CONTAINS the selected node → expand so it becomes visible
  useEffect(() => {
    if (!selectedSelector) return;
    if (isSelected) {
      // Small timeout lets React finish rendering the open state of ancestors first
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 50);
    } else if (subtreeContains(node, selectedSelector)) {
      setOpen(true);
    }
  }, [selectedSelector]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (hasChildren) setOpen(!!expandAll);
  }, [expandAll]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick  = (e) => { e.stopPropagation(); onSelect(node); };
  const handleToggle = (e) => { e.stopPropagation(); if (hasChildren) setOpen(o => !o); };
  const handleDelete = (e) => { e.stopPropagation(); onDelete(node.selector); };
  const handleDuplicate = (e) => { e.stopPropagation(); onDuplicate(node.selector); };

  const handleAddPick = useCallback((template) => {
    onAdd(node.selector, template.html);
    setOpen(true);
    setAddOpen(false);
    onHoverClear?.();
  }, [node.selector, onAdd, onHoverClear]);

  // ── Drag source ────────────────────────────────────────────────────────────
  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.selector);
    setDragState({ selector: node.selector, label: node.label });
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropZone(null);
  };

  // ── Drop target ────────────────────────────────────────────────────────────
  const handleDragOver = (e) => {
    if (!dragState || dragState.selector === node.selector) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relY    = e.clientY - rect.top;
    const pct     = relY / rect.height;

    let zone;
    if (pct < 0.25) {
      zone = "before";
    } else if (pct > 0.75) {
      zone = "after";
    } else {
      // middle zone — only "inside" if target is nestable, else split before/after
      zone = isNestable ? "inside" : (pct < 0.5 ? "before" : "after");
    }
    setDropZone(zone);
  };

  const handleDragLeave = (e) => {
    if (!rowRef.current?.contains(e.relatedTarget)) {
      setDropZone(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragState || dragState.selector === node.selector || !dropZone) return;
    onMove(dragState.selector, node.selector, dropZone);
    if (dropZone === "inside") setOpen(true); // expand so user sees the dropped child
    setDropZone(null);
    setDragState(null);
  };

  return (
    <div className="lt-node">
      <div
        ref={rowRef}
        className={[
          "lt-node-row",
          isSelected  ? "lt-node-row--selected" : "",
          isDragging  ? "lt-node-row--dragging"  : "",
          dropZone === "before" ? "lt-node-row--drop-before" : "",
          dropZone === "after"  ? "lt-node-row--drop-after"  : "",
          dropZone === "inside" ? "lt-node-row--drop-inside" : "",
        ].filter(Boolean).join(" ")}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onMouseEnter={() => {
          if (!addOpen) {
            setShowActions(true);
            onHover?.(node.selector, node.label);
          }
        }}
        onMouseLeave={() => {
          if (!addOpen) {
            setShowActions(false);
            onHoverClear?.();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        title={node.selector}
      >
        {/* chevron / dot */}
        <span
          className={`lt-node-toggle ${!hasChildren ? "lt-node-toggle--leaf" : ""}`}
          onClick={handleToggle}
        >
          {hasChildren ? <IconChevron open={open} /> : <span className="lt-node-dot" />}
        </span>

        <NodeIcon type={node.iconType} />
        <span className="lt-node-label">{node.label}</span>
        {node.hint && <span className="lt-node-hint">{node.hint}</span>}
        {!hasChildren && node.textPreview && (
          <span className="lt-node-preview">{node.textPreview}</span>
        )}

        {/* ── action buttons ───────────────────────────────────────── */}
        {(showActions || addOpen) && (
          <div
            className="lt-node-actions"
            onClick={e => e.stopPropagation()}
            onMouseEnter={e => { e.stopPropagation(); setShowActions(true); }}
            onMouseLeave={e => { e.stopPropagation(); setShowActions(false); }}
            draggable={false}
            onDragStart={e => e.preventDefault()}
          >
            {isNestable && (
              <div className="lt-add-wrap">
                <button
                  ref={addBtnRef}
                  className={`lt-action-btn lt-action-btn--add${addOpen ? " lt-action-btn--add-open" : ""}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onHoverClear?.();
                    setAddOpen(o => !o);
                  }}
                  title="Add element inside"
                  aria-label="Add child element"
                  aria-expanded={addOpen}
                >
                  <IconPlus />
                </button>
                {addOpen && (
                  <AddDropdown
                    anchorRef={addBtnRef}
                    onPick={handleAddPick}
                    onClose={() => setAddOpen(false)}
                    onOpenModal={onOpenModal}
                    parentSelector={node.selector}
                    parentLabel={node.label}
                  />
                )}
              </div>
            )}
            <button
              className="lt-action-btn lt-action-btn--duplicate"
              onClick={handleDuplicate}
              title="Duplicate this element"
              aria-label="Duplicate element"
            >
              <IconCopy />
            </button>
            <button
              className="lt-action-btn lt-action-btn--delete"
              onClick={handleDelete}
              title="Delete this element"
              aria-label="Delete element"
            >
              <IconTrash />
            </button>
          </div>
        )}
      </div>

      {/* children */}
      {hasChildren && open && (
        <div className="lt-node-children">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedSelector={selectedSelector}
              onSelect={onSelect}
              onHover={onHover}
              onHoverClear={onHoverClear}
              onAdd={onAdd}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMove={onMove}
              dragState={dragState}
              setDragState={setDragState}
              onOpenModal={onOpenModal}
              expandAll={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   html             – raw HTML string of the page
 *   selectedSelector – CSS selector of the currently selected element
 *   onSelect         – fn(node)
 *   onHover          – fn(selector, label)
 *   onHoverClear     – fn()
 *   onAdd            – fn(parentSelector, templateHtml)
 *   onDelete         – fn(selector)
 *   onMove           – fn(fromSelector, toSelector, "before"|"after")
 */
export default function LayoutTree({ html, selectedSelector, onSelect, onHover, onHoverClear, onAdd, onDelete, onDuplicate, onMove, onOpenModal, expandAll = false }) {
  const tree = useMemo(() => parseLayoutTree(html), [html]);
  const [dragState, setDragState] = useState(null);

  if (!tree.length) {
    return <div className="lt-empty"><p>No elements found.</p></div>;
  }

  return (
    <div className="lt-root" role="tree" aria-label="Page layout tree">
      {tree.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selectedSelector={selectedSelector}
          onSelect={onSelect}
          onHover={onHover}
          onHoverClear={onHoverClear}
          onAdd={onAdd}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onMove={onMove}
          dragState={dragState}
          setDragState={setDragState}
          onOpenModal={onOpenModal}
          expandAll={expandAll}
        />
      ))}
    </div>
  );
}
