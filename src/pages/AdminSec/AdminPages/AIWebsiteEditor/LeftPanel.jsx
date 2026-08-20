// LeftPanel.jsx
// Left sidebar — switches between AI Chat/Code tabs (AI mode)
// and Manual editing panel (Manual mode).

import { useState } from "react";
import AIChatPanel    from "./AIChatPanel";
import CodeEditorPanel from "./CodeEditorPanel";
import ManualPanel    from "./ManualPanel";

const IconAI = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
);
const IconCode = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <polyline points="16,18 22,12 16,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="8,6 2,12 8,18"    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AI_TABS = [
  { id: "ai",   label: "AI Chat", Icon: IconAI   },
  { id: "code", label: "Code",    Icon: IconCode  },
];

/**
 * Props:
 *   editorMode      – "ai" | "manual"
 *   html            – current HTML string
 *   onChangeLive    – fn(html) live update (no history commit)
 *   onCommit        – fn(html) commit to undo history
 *   messages        – AI chat message array
 *   isThinking      – bool
 *   tokenCount      – number
 *   onSend          – fn(prompt, element, configId)
 *   onBuyTokens     – fn()
 *   selectedElement – element selected from preview
 *   onClearElement  – fn()
 *   models          – available AI model configs
 */
export default function LeftPanel({
  editorMode,
  html,
  onChangeLive,
  onCommit,
  messages,
  isThinking,
  tokenCount,
  onSend,
  onBuyTokens,
  selectedElement,
  onClearElement,
  models,
}) {
  const [activeTab, setActiveTab] = useState("ai");

  // ── Manual mode ───────────────────────────────────────────────────────────
  if (editorMode === "manual") {
    return (
      <div className="aie-left">
        <ManualPanel />
      </div>
    );
  }

  // ── AI mode ───────────────────────────────────────────────────────────────
  return (
    <div className="aie-left">
      {/* tab bar */}
      <div className="aie-panel-tabs" role="tablist">
        {AI_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            className={`aie-panel-tab ${activeTab === id ? "aie-panel-tab--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {/* panel content */}
      {activeTab === "ai" ? (
        <AIChatPanel
          messages={messages}
          isThinking={isThinking}
          tokenCount={tokenCount}
          onSend={onSend}
          onBuyTokens={onBuyTokens}
          selectedElement={selectedElement}
          onClearElement={onClearElement}
          models={models || []}
        />
      ) : (
        <CodeEditorPanel
          html={html}
          onChangeLive={onChangeLive}
          onCommit={onCommit}
        />
      )}
    </div>
  );
}
