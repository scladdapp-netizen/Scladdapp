import { useState, useEffect, useCallback, useRef } from "react";
import { useParams }          from "react-router-dom";
import "./AIWebsiteEditor.css";

import TopBar              from "./TopBar";
import LeftPanel           from "./LeftPanel";
import ManualPanel         from "./ManualPanel";
import PreviewPanel        from "./PreviewPanel";
import BuyTokensModal      from "./BuyTokensModal";
import PublishConfirmModal from "./PublishConfirmModal";
import useEditorHistory    from "./useEditorHistory";
import useAutoSave         from "./useAutoSave";
import {
  useAITokenBalance,
  useAIWebsiteModels,
  useAIWebsiteEdit,
  saveDraftHtml,
  fetchDraftHtml,
  fetchLiveHtml,
} from "../../../../api_call/useAIWebsiteEditor";

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

  // ── user email from sessionStorage (set during login) ────────────────────
  const userEmail = (() => {
    try {
      const raw = sessionStorage.getItem("user");
      const d   = raw ? JSON.parse(raw) : null;
      return d?.admin?.email || d?.staff?.email || d?.email || "";
    } catch { return ""; }
  })();

  // ── API hooks ─────────────────────────────────────────────────────────────
  const { balance, setBalance } = useAITokenBalance(schoolId);
  const { models }              = useAIWebsiteModels(schoolId);
  const { callEdit }            = useAIWebsiteEdit(schoolId);

  // ── history / html state ──────────────────────────────────────────────────
  const { html, set, setLive, undo, redo, canUndo, canRedo } = useEditorHistory(EMPTY_STATE_HTML);
  const htmlLoadedRef = useRef(false);

  // Load saved draft or live published HTML on mount
  useEffect(() => {
    if (!schoolId || htmlLoadedRef.current) return;
    fetchDraftHtml(schoolId).then((data) => {
      if (data.success && data.data?.html) {
        set(data.data.html);
        if (data.data.source === "published") {
          saveDraftHtml(schoolId, data.data.html).catch(() => {});
        }
      }
      // If no html returned, leave EMPTY_STATE_HTML in place
      htmlLoadedRef.current = true;
    }).catch(() => { htmlLoadedRef.current = true; });
  }, [schoolId, set]);

  // ── keep a ref to html so handleAISend always reads the latest value ─────
  const htmlRef = useRef(html);
  useEffect(() => { htmlRef.current = html; }, [html]);
  const saveFn = useCallback(
    (currentHtml) => saveDraftHtml(schoolId, currentHtml),
    [schoolId]
  );
  const saveStatus = useAutoSave(html, saveFn, 2000);

  // ── editor mode: "ai" | "manual" ─────────────────────────────────────────
  const [editorMode, setEditorMode] = useState("manual");

  // ── view mode ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState("split");

  // ── AI chat ───────────────────────────────────────────────────────────────
  const [messages,   setMessages]   = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  // ── token count (mirrors balance from server) ─────────────────────────────
  const tokenCount = balance ?? 0;

  // ── selected element ──────────────────────────────────────────────────────
  const [selectedElement, setSelectedElement] = useState(null);

  // ── modals ────────────────────────────────────────────────────────────────
  const [buyTokensOpen,    setBuyTokensOpen]    = useState(false);
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
    if (!tokenCount) return;

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
        const isNoToken = result.code === "INSUFFICIENT_TOKENS";
        setMessages((m) => [...m, {
          id:      Date.now() + 1,
          role:    "ai",
          isError: true,
          content: isNoToken
            ? "You have no tokens left. Please purchase more to continue editing."
            : result.message || "Something went wrong. Please try again.",
          time:    formatTime(),
        }]);
        return;
      }

      set(result.newHtml);

      if (result.newBalance !== undefined) {
        setBalance(result.newBalance);
      }

      const usageNote = result.modelUsage?.total_tokens
        ? ` (${result.modelUsage.total_tokens} model tokens)`
        : "";

      setMessages((m) => [...m, {
        id:      Date.now() + 1,
        role:    "ai",
        content: `${result.message || "Section updated successfully."}${usageNote} ${result.newBalance} edit token${result.newBalance === 1 ? "" : "s"} remaining.`,
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
  }, [tokenCount, set, callEdit, setBalance]);

  // ── publish ───────────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const blob     = new Blob([htmlRef.current], { type: "text/html" });
      const formData = new FormData();
      formData.append("html_file", blob, "index.html");

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

  const handleBuyTokensInitiate = useCallback(() => {
    setBuyTokensOpen(false);
  }, []);

  // ── reset to live published HTML ──────────────────────────────────────────
  const handleResetToLive = useCallback(async () => {
    const confirmed = window.confirm(
      "This will discard all your unsaved draft changes and reload the live published website. Continue?"
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const data = await fetchLiveHtml(schoolId);
      if (data.success && data.data?.html) {
        set(data.data.html);
        // Overwrite the draft with live HTML so auto-save keeps it in sync
        await saveDraftHtml(schoolId, data.data.html);
      } else {
        alert(data.message || "Could not load the live website. Make sure it has been published.");
      }
    } catch {
      alert("Failed to load the live website. Please try again.");
    } finally {
      setResetting(false);
    }
  }, [schoolId, set]);

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
        onEditorMode={setEditorMode}
        tokenCount={tokenCount}
        onBuyTokens={() => setBuyTokensOpen(true)}
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
              tokenCount={tokenCount}
              onSend={handleAISend}
              onBuyTokens={() => setBuyTokensOpen(true)}
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
            />
          )}
        </div>
      )}

      {/* ── Manual Mode layout: [ManualLeftPanel] | [Preview] | [ManualRightPanel] ── */}
      {editorMode === "manual" && (
        <div className="aie-body aie-body--manual">
          <ManualPanel
            html={html}
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
              scrollToSelector={selectedElement?.selector || null}
            />
          </ManualPanel>
        </div>
      )}

      <BuyTokensModal
        isOpen={buyTokensOpen}
        onClose={() => setBuyTokensOpen(false)}
        tokenCount={tokenCount}
        schoolId={schoolId}
        email={userEmail}
        onTokensPurchased={(newBalance) => setBalance(newBalance)}
      />

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
