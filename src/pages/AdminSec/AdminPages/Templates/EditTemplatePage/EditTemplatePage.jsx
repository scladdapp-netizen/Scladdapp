/**
 * EditTemplatePage — visual HTML editor for a grading / report-card template.
 *
 * Draft flow:
 *   - On load: uses html_template_draft (unsaved work) if present, else html_template.
 *   - Auto-save (2s debounce): PATCH /grading-template/:id/html-draft — saves to
 *     html_template_draft without touching the published html_template.
 *   - Save button / Ctrl+S: POST /grading-template/:id/publish-draft — promotes
 *     draft → html_template and clears the draft.
 *
 * All patcher functions from htmlPatcher.js work on plain HTML fragments.
 * Undo / Redo via useEditorHistory. Keyboard: Ctrl+Z / Ctrl+Shift+Z / Ctrl+S.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ── Reusable HtmlEditor components ────────────────────────────────────────────
import HtmlEditorTopBar    from "../../../../../components/HtmlEditor/HtmlEditorTopBar";
import HtmlElementTree     from "../../../../../components/HtmlEditor/HtmlElementTree";
import HtmlLivePreview     from "../../../../../components/HtmlEditor/HtmlLivePreview";
import HtmlPropertiesPanel from "../../../../../components/HtmlEditor/HtmlPropertiesPanel";
import "../../../../../components/HtmlEditor/HtmlEditor.css";

// ── AIWebsiteEditor shared hooks + patchers ───────────────────────────────────
import useEditorHistory from "../../AIWebsiteEditor/useEditorHistory";
import useAutoSave      from "../../AIWebsiteEditor/useAutoSave";
import {
  deleteElement,
  duplicateElement,
  moveElement,
  moveIntoParent,
} from "../../AIWebsiteEditor/htmlPatcher";

// ── Data ──────────────────────────────────────────────────────────────────────
import { useCombinedTemplate }         from "../../../../../api_call/useCombinedTemplate";
import { hydrateReportHtml }           from "../../../../../utils/hydrateReportHtml";
import { generateDefaultReportHtml }   from "../../../../../utils/generateDefaultReportHtml";
import { useAuth }                     from "../../../../../context/AuthContext/AuthContext";

// ── AIWebsiteEditor CSS (provides all .aie-* and .manual-* classes) ───────────
import "../../AIWebsiteEditor/AIWebsiteEditor.css";

export default function EditTemplatePage() {
  const { schoolId, templateId } = useParams();
  const navigate = useNavigate();
  const { getTemplateById, saveDraft, publishDraft } = useCombinedTemplate();
  const { user } = useAuth();

  // ── Raw template data ──────────────────────────────────────────────────────
  const [template, setTemplate] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  // ── Editor history (html fragment string) ─────────────────────────────────
  const { html, set, undo, redo, canUndo, canRedo } = useEditorHistory("");

  // ── Selected element ───────────────────────────────────────────────────────
  const [selectedElement, setSelectedElement] = useState(null);
  const [hoverSelector,   setHoverSelector]   = useState(null);

  // ── Hydrated HTML for preview (replaces {{placeholders}} with demo data) ───
  const [previewHtml, setPreviewHtml] = useState("");

  // ── Load template on mount ─────────────────────────────────────────────────
  // Prefer html_template_draft (unsaved work) over html_template (published).
  useEffect(() => {
    if (!templateId) return;
    (async () => {
      const result = await getTemplateById(templateId);
      if (result.success && result.data) {
        setTemplate(result.data);
        const draft     = result.data.html_template_draft;
        const published = result.data.html_template || "";
        if (draft) {
          setHasDraft(true);
          set(draft);
        } else {
          set(published);
        }
      } else {
        setLoadError(result.message || "Template not found");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // ── Keep previewHtml in sync with editor html ──────────────────────────────
  useEffect(() => {
    if (!template) return;
    setPreviewHtml(hydrateReportHtml(html, template));
  }, [html, template]);

  // ── Auto-save draft: debounced PATCH to html_template_draft ───────────────
  const draftSaveFn = useCallback(
    async (currentHtml) => {
      if (!templateId) return;
      await saveDraft(templateId, currentHtml);
      setHasDraft(true);
    },
    [templateId, saveDraft]
  );
  const saveStatus = useAutoSave(html, draftSaveFn, 2000);

  // ── Explicit publish: draft → html_template ───────────────────────────────
  const [saving, setSaving] = useState(false);
  const handleSave = useCallback(async () => {
    if (!templateId) return;
    setSaving(true);
    // Flush latest html as draft, then publish
    await saveDraft(templateId, html);
    await publishDraft(templateId);
    setHasDraft(false);
    setSaving(false);
  }, [templateId, html, saveDraft, publishDraft]);

  // ── Reset to default HTML ─────────────────────────────────────────────────
  // Regenerates the template HTML from the template's own grading fields /
  // scheme / traits + the school profile, exactly like when it was first created.
  const [resetting, setResetting] = useState(false);
  const handleReset = useCallback(async () => {
    const ok = window.confirm(
      "Reset to default?\n\nThis will discard all your edits and regenerate the original template layout. This cannot be undone."
    );
    if (!ok) return;
    setResetting(true);
    const defaultHtml = generateDefaultReportHtml({
      grading_fields:    template.grading_fields    ?? [],
      grading_scheme:    template.grading_scheme    ?? [],
      behavioral_traits: template.behavioral_traits ?? [],
      school:            user?.school               ?? {},
    });
    set(defaultHtml);
    // Immediately save draft + publish so the reset persists
    await saveDraft(templateId, defaultHtml);
    await publishDraft(templateId);
    setHasDraft(false);
    setResetting(false);
  }, [template, user, templateId, set, saveDraft, publishDraft]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) &&  e.shiftKey && e.key === "z") { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, handleSave]);

  // ── Element tree operations ────────────────────────────────────────────────
  const handleDelete = useCallback(
    (selector) => set(deleteElement(html, selector)),
    [html, set]
  );
  const handleDuplicate = useCallback(
    (selector) => set(duplicateElement(html, selector)),
    [html, set]
  );
  const handleMove = useCallback(
    (from, to, position) => {
      const newHtml = position === "inside"
        ? moveIntoParent(html, from, to)
        : moveElement(html, from, to, position);
      set(newHtml);
    },
    [html, set]
  );

  // When user selects from the tree
  const handleSelectNode = useCallback((node) => {
    setSelectedElement({
      selector:    node.selector,
      label:       node.label,
      tagName:     node.tag,
      textContent: node.textPreview,
      outerHTML:   node.outerHTML,
    });
  }, []);

  // When user clicks in the preview
  const handleElementSelect = useCallback((el) => {
    setSelectedElement(el);
  }, []);

  // When ManualRightPanel patches a style/attr — re-sync outerHTML so the
  // Properties panel reflects the patched state immediately
  const handleHtmlChange = useCallback(
    (newHtml) => {
      set(newHtml);
      setSelectedElement((prev) => {
        if (!prev?.selector) return prev;
        try {
          const doc = new DOMParser().parseFromString(newHtml, "text/html");
          const el  = doc.querySelector(prev.selector);
          if (!el) return prev;
          return { ...prev, outerHTML: el.outerHTML };
        } catch {
          return prev;
        }
      });
    },
    [set]
  );

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="hle-page">
        <div className="hle-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {loadError}
          <button className="aie-back-btn" onClick={() => navigate(`/admin/${schoolId}/templates`)}>
            ← Back to Templates
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="hle-page">
        <div className="hle-loading">
          <div className="hle-spinner" />
          Loading template…
        </div>
      </div>
    );
  }

  return (
    <div className="hle-page">
      {/* ── Top bar ── */}
      <HtmlEditorTopBar
        name={template.name}
        saveStatus={saveStatus}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={handleSave}
        saving={saving}
        onReset={handleReset}
        resetting={resetting}
        onBack={() => navigate(`/admin/${schoolId}/templates`)}
        backLabel="Templates"
        hasDraft={hasDraft}
      />

      {/* ── Three-column body ── */}
      <div className="hle-body">

        {/* Left — element tree (operates on raw html, not hydrated) */}
        <HtmlElementTree
          html={html}
          selectedSelector={selectedElement?.selector || null}
          onSelectNode={handleSelectNode}
          onHover={(sel) => setHoverSelector(sel)}
          onHoverClear={() => setHoverSelector(null)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onMove={handleMove}
          title="Template Elements"
        />

        {/* Centre — live preview with mock data */}
        <HtmlLivePreview
          html={previewHtml}
          onElementSelect={handleElementSelect}
          selectedSelector={selectedElement?.selector || null}
          hoverSelector={hoverSelector}
          title={template.name}
        />

        {/* Right — properties panel (patches raw html directly) */}
        <HtmlPropertiesPanel
          selectedElement={selectedElement}
          html={html}
          onHtmlChange={handleHtmlChange}
        />

      </div>
    </div>
  );
}
