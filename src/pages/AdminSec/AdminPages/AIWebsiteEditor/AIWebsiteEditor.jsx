import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams }          from "react-router-dom";
import "./AIWebsiteEditor.css";

import TopBar              from "./TopBar";
import LeftPanel           from "./LeftPanel";
import ManualPanel         from "./ManualPanel";
import PreviewPanel        from "./PreviewPanel";
import PublishConfirmModal from "./PublishConfirmModal";
import useEditorHistory    from "./useEditorHistory";
import useAutoSave         from "./useAutoSave";
import {
  useAIWebsiteModels,
  useAIWebsiteEdit,
  saveDraftHtml,
  saveDraftPages,
  fetchDraftHtml,
  fetchLiveHtml,
} from "../../../../api_call/useAIWebsiteEditor";
import useSubscription from "../../../../api_call/useSubscription";
import useSchool from "../../../../api_call/useSchool";
import useWebsiteRequest from "../../../../api_call/useWebsiteRequest";
import { useNotification } from "../../../../context/NotificationProvider/NotificationProvider";
import { patchTextContent } from "./htmlPatcher";

function isStandardOrAbovePlan(plan) {
  const name = String(plan?.plan_name || "").toLowerCase();
  return name.includes("standard") || name.includes("premium");
}

// ── Empty state HTML — shown in preview when no draft exists ─────────────────
const EMPTY_STATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; background: #f8f8f9; color: #aaa;
  }
  .empty {
    display: flex; flex-direction: column; align-items: center; gap: 14px;
    text-align: center; padding: 40px;
  }
  .empty svg { opacity: 0.35; }
  .empty h2 { font-size: 17px; font-weight: 700; color: #bbb; }
  .empty p  { font-size: 13px; color: #ccc; line-height: 1.6; max-width: 280px; }
</style>
</head>
<body>
  <div class="empty">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#aaa" stroke-width="1.5" stroke-dasharray="4 2"/>
      <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <h2>No active site</h2>
    <p>Complete and submit your website brief first — our team will build and publish your site here.</p>
  </div>
</body>
</html>`;

function formatTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AIWebsiteEditor() {
  const { schoolId } = useParams();

  // ── API hooks ─────────────────────────────────────────────────────────────
  const { models }              = useAIWebsiteModels(schoolId);
  const { callEdit }            = useAIWebsiteEdit(schoolId);
  const { getSubscriptionDashboard } = useSubscription();
  const { addNotification } = useNotification();
  const { getProfile } = useSchool();
  const { getRequest } = useWebsiteRequest();
  const [schoolBrand, setSchoolBrand] = useState(null);
  const aiPlanAllowedRef = useRef(null); // null = unknown, true/false after check
  const [aiModeChecking, setAiModeChecking] = useState(false);

  useEffect(() => {
    aiPlanAllowedRef.current = null;
  }, [schoolId]);

  useEffect(() => {
    if (!schoolId) return;
    let cancelled = false;
    Promise.all([getProfile(schoolId), getRequest(schoolId)]).then(([profile, request]) => {
      if (cancelled) return;
      setSchoolBrand({
        school: profile?.success ? profile.data : null,
        brief: request?.success ? request.data?.brief || null : null,
      });
    });
    return () => { cancelled = true; };
    // Profile and request loaders are recreated each render; schoolId is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  // ── history / html state ──────────────────────────────────────────────────
  const { html, set, setLive, replace, undo, redo, canUndo, canRedo } = useEditorHistory(EMPTY_STATE_HTML);
  const htmlLoadedRef = useRef(false);

  // ── multi-page state ──────────────────────────────────────────────────────
  const [pages, setPages] = useState([{ id: "home", title: "Home", slug: "/", order: 0, html: "" }]);
  const [activePageId, setActivePageId] = useState("home");
  const pagesRef = useRef(pages);
  const activePageIdRef = useRef(activePageId);
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { activePageIdRef.current = activePageId; }, [activePageId]);

  const chrome = useMemo(() => {
    const school = schoolBrand?.school;
    const brief = schoolBrand?.brief || {};
    const logo = school?.logo_url;
    const logoUrl = typeof logo === "string" ? logo : logo?.url || "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return {
      schoolName: school?.school_name || "School Name",
      logoUrl,
      email: school?.email || "",
      phone: school?.phone_number || "",
      address: [school?.address, school?.state, school?.country].filter(Boolean).join(", "),
      motto: school?.motto || "",
      pages: (() => {
        const fromEditor = (pages || []).map((page) => ({
          title: page.title,
          slug: page.slug || "/",
        }));
        const fromBrief = (schoolBrand?.brief?.pages || []).map((page) => ({
          title: page.title,
          slug: page.slug || "/",
        }));
        const source = fromEditor.filter((page) => page.title || page.slug).length
          >= fromBrief.filter((page) => page.title || page.slug).length
          ? fromEditor
          : fromBrief;
        return source.filter((page) => page.title || page.slug);
      })(),
      loginHref: schoolId ? `${origin}/school/${schoolId}/login` : "/login",
      applyHref: schoolId ? `${origin}/school/${schoolId}/apply` : "/apply",
      primary: brief.primary_color || "#111111",
      secondary: brief.secondary_color || "#6c5ce7",
      background: brief.background_color || "#ffffff",
      fontStyle: brief.font_style || "modern",
    };
  }, [schoolBrand, pages, schoolId]);

  const slugToFilename = (slug) => {
    if (!slug || slug === "/") return "index.html";
    return `${String(slug).replace(/^\//, "").replace(/\//g, "-")}.html`;
  };

  // Load saved draft pages (or published) on mount
  useEffect(() => {
    if (!schoolId || htmlLoadedRef.current) return;
    fetchDraftHtml(schoolId).then((data) => {
      if (data.success && Array.isArray(data.data?.pages) && data.data.pages.length) {
        const loaded = data.data.pages.map((p, i) => ({
          id: p.id || `page_${i}`,
          title: p.title || `Page ${i + 1}`,
          slug: p.slug || (i === 0 ? "/" : `/${p.id}`),
          order: p.order ?? i,
          html: p.html || "",
        }));
        setPages(loaded);
        const firstId = data.data.pageId || loaded.find((p) => p.slug === "/" || p.id === "home")?.id || loaded[0].id;
        setActivePageId(firstId);
        const firstHtml = loaded.find((p) => p.id === firstId)?.html || "";
        replace(firstHtml || EMPTY_STATE_HTML);
        if (data.data.source === "published") {
          saveDraftPages(schoolId, loaded).catch(() => {});
        }
      } else if (data.success && data.data?.html) {
        // Legacy single-html response
        replace(data.data.html);
        setPages([{ id: "home", title: "Home", slug: "/", order: 0, html: data.data.html }]);
        setActivePageId("home");
        if (data.data.source === "published") {
          saveDraftHtml(schoolId, data.data.html, "home").catch(() => {});
        }
      }
      htmlLoadedRef.current = true;
    }).catch(() => { htmlLoadedRef.current = true; });
  }, [schoolId, replace]);

  // Keep active page html mirrored in pages state
  useEffect(() => {
    setPages((prev) => prev.map((p) => (p.id === activePageId ? { ...p, html } : p)));
  }, [html, activePageId]);

  // ── keep a ref to html so handleAISend always reads the latest value ─────
  const htmlRef = useRef(html);
  useEffect(() => { htmlRef.current = html; }, [html]);
  const saveFn = useCallback(
    (currentHtml) => saveDraftHtml(schoolId, currentHtml, activePageIdRef.current),
    [schoolId]
  );
  const saveStatus = useAutoSave(html, saveFn, 2000, activePageId);

  const handleSwitchPage = useCallback(async (pageId) => {
    if (pageId === activePageIdRef.current) return;
    // Persist current page before switching
    const currentHtml = htmlRef.current;
    const currentId = activePageIdRef.current;
    const next = pagesRef.current.find((p) => p.id === pageId);
    setPages((prev) => prev.map((p) => (p.id === currentId ? { ...p, html: currentHtml } : p)));
    try {
      await saveDraftHtml(schoolId, currentHtml, currentId);
    } catch (_) {}

    setSelectedElement(null);
    replace(next?.html || EMPTY_STATE_HTML);
    setActivePageId(pageId);
  }, [schoolId, replace]);

  // ── editor mode: "ai" | "manual" ─────────────────────────────────────────
  const [editorMode, setEditorMode] = useState("manual");

  const handleEditorMode = useCallback(async (mode) => {
    if (mode !== "ai") {
      setEditorMode(mode);
      return;
    }
    if (editorMode === "ai" || aiModeChecking) return;

    if (aiPlanAllowedRef.current === true) {
      setEditorMode("ai");
      return;
    }
    if (aiPlanAllowedRef.current === false) {
      addNotification("Upgrade your plan to use AI. Standard Plan or above is required.", "warning");
      return;
    }

    setAiModeChecking(true);
    try {
      const res = await getSubscriptionDashboard(schoolId);
      const allowed = res.success && isStandardOrAbovePlan(res.data?.plan);
      aiPlanAllowedRef.current = allowed;
      if (!allowed) {
        addNotification("Upgrade your plan to use AI. Standard Plan or above is required.", "warning");
        return;
      }
      setEditorMode("ai");
    } catch {
      addNotification("Could not verify your plan. Please try again.", "error");
    } finally {
      setAiModeChecking(false);
    }
  }, [editorMode, aiModeChecking, schoolId, getSubscriptionDashboard, addNotification]);

  // ── view mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("split");

  // ── AI chat ───────────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  // ── selected element ──────────────────────────────────────────────────────
  const [selectedElement, setSelectedElement] = useState(null);

  // ── modals ────────────────────────────────────────────────────────────────
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishing,       setPublishing]       = useState(false);
  const [publishSuccess,   setPublishSuccess]   = useState(false);
  const [resetting,        setResetting]        = useState(false);
  const [publishedUrl,     setPublishedUrl]     = useState(null);

  // ── keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) &&  e.shiftKey && e.key === "z") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo]);

  // ── AI send handler ───────────────────────────────────────────────────────
  const handleAISend = useCallback(async (prompt, element, configId) => {
    const displayContent = element ? `🎯 ${element.label} — ${prompt}` : prompt;
    setMessages((m) => [...m, { id: Date.now(), role: "user", content: displayContent, time: formatTime() }]);
    setIsThinking(true);
    setSelectedElement(null);

    try {
      const sectionHtml = element?.sectionHtml || element?.outerHTML || null;
      const sectionId   = element?.sectionId   || null;

      // Always read htmlRef.current so we use the latest HTML, not a stale closure
      const result = await callEdit({
        prompt,
        fullHtml:    htmlRef.current,
        sectionId,
        sectionHtml,
        element: element ? {
          selector:    element.selector,
          tagName:     element.tagName,
          label:       element.label,
          textContent: element.textContent,
        } : null,
        configId: configId || null,
      });

      if (!result.success) {
        setMessages((m) => [...m, {
          id:      Date.now() + 1,
          role:    "ai",
          isError: true,
          content: result.message || "Something went wrong. Please try again.",
          time:    formatTime(),
        }]);
        return;
      }

      set(result.newHtml);

      setMessages((m) => [...m, {
        id:      Date.now() + 1,
        role:    "ai",
        content: result.message || "Section updated successfully.",
        time:    formatTime(),
      }]);

    } catch (err) {
      setMessages((m) => [...m, {
        id:      Date.now() + 1,
        role:    "ai",
        isError: true,
        content: err?.message || "Something went wrong. Please try again.",
        time:    formatTime(),
      }]);
    } finally {
      setIsThinking(false);
    }
  }, [set, callEdit]);

  const handlePreviewTextEdit = useCallback(({ selector, text, label, tagName, outerHTML, textContent }) => {
    if (!selector) return;
    const next = patchTextContent(htmlRef.current, selector, text);
    set(next);
    setSelectedElement((prev) => {
      if (prev?.selector && prev.selector !== selector) return prev;
      return {
        ...(prev || {}),
        selector,
        label: label || prev?.label || selector,
        tagName: tagName || prev?.tagName || "",
        textContent: textContent || String(text || "").slice(0, 120),
        outerHTML: outerHTML || prev?.outerHTML || "",
      };
    });
  }, [set]);

  // ── publish ───────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      // Flush active page into pages list first
      const snapshot = pagesRef.current.map((p) =>
        p.id === activePageIdRef.current ? { ...p, html: htmlRef.current } : p
      );
      setPages(snapshot);
      await saveDraftPages(schoolId, snapshot);

      const formData = new FormData();
      formData.append(
        "pages_json",
        JSON.stringify(snapshot.map(({ id, title, slug, order }) => ({ id, title, slug, order })))
      );
      snapshot.forEach((page) => {
        const blob = new Blob([page.html || ""], { type: "text/html" });
        formData.append("html_files", blob, slugToFilename(page.slug));
      });

      let token = "";
      try {
        const raw = sessionStorage.getItem("user");
        if (raw) token = JSON.parse(raw)?.token || "";
      } catch (_) {}
      const res   = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:1234"}/api/schools/${schoolId}/website-request/publish`,
        {
          method:  "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body:    formData,
        }
      );
      const data = await res.json();
      if (data.success) {
        setPublishedUrl(data.site_url);
        setPublishSuccess(true);
      }
    } catch (_) {
      // toast error if needed
    } finally {
      setPublishing(false);
    }
  }, [schoolId]);

  // ── reset to live published HTML ──────────────────────────────────────────
  const handleResetToLive = useCallback(async () => {
    const confirmed = window.confirm(
      "This will discard all your unsaved draft changes and reload the live published website (all pages). Continue?"
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const data = await fetchLiveHtml(schoolId);
      if (data.success && Array.isArray(data.data?.pages) && data.data.pages.length) {
        const loaded = data.data.pages.map((p, i) => ({
          id: p.id || `page_${i}`,
          title: p.title || `Page ${i + 1}`,
          slug: p.slug || (i === 0 ? "/" : `/${p.id}`),
          order: p.order ?? i,
          html: p.html || "",
        }));
        setPages(loaded);
        await saveDraftPages(schoolId, loaded);
        const firstId = loaded.find((p) => p.slug === "/" || p.id === "home")?.id || loaded[0].id;
        setActivePageId(firstId);
        replace(loaded.find((p) => p.id === firstId)?.html || EMPTY_STATE_HTML);
      } else if (data.success && data.data?.html) {
        replace(data.data.html);
        await saveDraftHtml(schoolId, data.data.html, activePageIdRef.current);
      } else {
        alert(data.message || "Could not load the live website. Make sure it has been published.");
      }
    } catch {
      alert("Failed to load the live website. Please try again.");
    } finally {
      setResetting(false);
    }
  }, [schoolId, replace]);

  const showLeft    = viewMode !== "preview";
  const showPreview = viewMode !== "code";

  // Derive site name from publishedUrl or school info
  const siteName = publishedUrl
    ? publishedUrl.split("/sites/")?.[1] || publishedUrl.split("/").pop()
    : schoolId;

  return (
    <div className="aie-root">
      <TopBar
        siteName={siteName}
        saveStatus={saveStatus}
        editorMode={editorMode}
        onEditorMode={handleEditorMode}
        aiModeChecking={aiModeChecking}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        viewMode={viewMode}
        onViewMode={setViewMode}
        onPublish={() => { setPublishSuccess(false); setPublishModalOpen(true); }}
        publishing={publishing}
        onResetToLive={handleResetToLive}
        resetting={resetting}
        pages={pages}
        activePageId={activePageId}
        onSwitchPage={handleSwitchPage}
      />

      {/* ── AI Mode layout: [LeftPanel] | [resize] | [Preview] ────────── */}
      {editorMode === "ai" && (
        <div className="aie-body">
          {showLeft && (
            <LeftPanel
              editorMode={editorMode}
              html={html}
              onChangeLive={setLive}
              onCommit={set}
              messages={messages}
              isThinking={isThinking}
              onSend={handleAISend}
              selectedElement={selectedElement}
              onClearElement={() => setSelectedElement(null)}
              models={models}
            />
          )}

          {showLeft && showPreview && (
            <div className="aie-resize-handle" aria-hidden="true" />
          )}

          {showPreview && (
            <PreviewPanel
              html={html}
              siteUrl={publishedUrl || "preview"}
              isSplitMode={viewMode === "split"}
              onElementSelect={setSelectedElement}
              onTextEdit={handlePreviewTextEdit}
            />
          )}
        </div>
      )}

      {/* ── Manual Mode layout: [ManualLeftPanel] | [Preview] | [ManualRightPanel] ── */}
      {editorMode === "manual" && (
        <div className="aie-body aie-body--manual">
          <ManualPanel
            html={html}
            chrome={chrome}
            selectedElement={selectedElement}
            onHtmlChange={set}
            onSelectNode={(node) => {
              setSelectedElement({
                selector:    node.selector,
                label:       node.label,
                tagName:     node.tag,
                textContent: node.textPreview,
                outerHTML:   node.outerHTML,
              });
            }}
          >
            <PreviewPanel
              html={html}
              siteUrl={publishedUrl || "preview"}
              isSplitMode={true}
              onElementSelect={setSelectedElement}
              onTextEdit={handlePreviewTextEdit}
              scrollToSelector={selectedElement?.selector || null}
            />
          </ManualPanel>
        </div>
      )}

      <PublishConfirmModal
        isOpen={publishModalOpen}
        onClose={() => { setPublishModalOpen(false); setPublishSuccess(false); }}
        onConfirm={handlePublish}
        publishing={publishing}
        publishedUrl={publishedUrl}
        isSuccess={publishSuccess}
      />
    </div>
  );
}
