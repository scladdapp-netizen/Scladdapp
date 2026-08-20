/**
 * HtmlPropertiesPanel — reusable right properties panel.
 * Used by: EditTemplatePage, (future) EmailTemplatePage
 *
 * Thin wrapper around ManualRightPanel — just re-exports it with a display name.
 * Keeps it importable from the shared HtmlEditor location without coupling
 * consuming pages directly to the AIWebsiteEditor folder.
 *
 * Props: same as ManualRightPanel
 *   selectedElement  – { selector, tagName, label, textContent, outerHTML } | null
 *   html             – current HTML string
 *   onHtmlChange     – fn(newHtml)
 */
import ManualRightPanel from "../../pages/AdminSec/AdminPages/AIWebsiteEditor/ManualRightPanel";

export default function HtmlPropertiesPanel({ selectedElement, html, onHtmlChange }) {
  return (
    <ManualRightPanel
      selectedElement={selectedElement}
      html={html}
      onHtmlChange={onHtmlChange}
    />
  );
}
