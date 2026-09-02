import { useState, useRef, useEffect } from "react";

// ── static suggestions shown in the welcome state ────────────────────────────
const SUGGESTIONS = [

  "Make the hero section background dark blue",
  "Add a contact form at the bottom",
  "Make the font bigger and more readable",
  "Change the color scheme to match our logo",
  "Add a sticky navigation bar at the top",
  "Make the page fully mobile responsive",
];

// ── Icons ────────────────────────────────────────────────────────────────────
const IconAI = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
  </svg>
);
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconCoin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7v1m0 8v1M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconWarn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ── single message ────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  const isError = msg.isError;

  let content = msg.content;
  let targetTag = null;
  if (isUser && typeof content === "string" && content.startsWith("🎯 ")) {
    const dashIdx = content.indexOf(" — ");
    if (dashIdx !== -1) {
      targetTag = content.slice(2, dashIdx).trim();
      content   = content.slice(dashIdx + 3).trim();
    }
  }

  return (
    <div className={`aie-msg ${isUser ? "aie-msg--user" : "aie-msg--ai"}${isError ? " aie-msg--error" : ""}`}>
      <div className="aie-msg-bubble">
        {targetTag && (
          <span className="aie-msg-target-tag">🎯 {targetTag}</span>
        )}
        {content}
      </div>
      <span className="aie-msg-meta">{msg.time}</span>
    </div>
  );
}

// ── typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="aie-msg aie-msg--ai">
      <div className="aie-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

const IconTarget = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4"  stroke="currentColor" strokeWidth="2"/>
    <line x1="12" y1="2"  x2="12" y2="6"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="2"  y1="12" x2="6"  y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconX = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

/**
 * Props:
 *   messages        – array of { id, role, content, time }
 *   isThinking      – bool
 *   tokenCount      – number
 *   onSend          – fn(promptText, selectedElement?, configId?)
 *   onBuyTokens     – fn()
 *   selectedElement – { label, selector, textContent, tagName } | null
 *   onClearElement  – fn()
 *   models          – [{ config_id, label, model, is_active }]  — available AI models
 */
export default function AIChatPanel({
  messages,
  isThinking,
  tokenCount,
  onSend,
  onBuyTokens,
  selectedElement,
  onClearElement,
  models = [],
}) {
  const [prompt,    setPrompt]    = useState("");
  const [configId,  setConfigId]  = useState("");   // selected model config_id
  const bottomRef = useRef(null);
  const textaRef  = useRef(null);

  const hasTokens = tokenCount > 0;

  // Default to active model when list loads
  useEffect(() => {
    if (models.length > 0 && !configId) {
      const active = models.find((m) => m.is_active) || models[0];
      if (active) setConfigId(active.config_id);
    }
  }, [models, configId]);

  // scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSend = () => {
    const text = prompt.trim();
    if (!text || !hasTokens || isThinking) return;
    onSend(text, selectedElement ?? null, configId || null);
    setPrompt("");
    textaRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setPrompt(text);
    textaRef.current?.focus();
  };

  return (
    <div className="aie-chat">
      {/* messages area */}
      <div className="aie-chat-messages">
        {messages.length === 0 ? (
          <div className="aie-welcome">
            <div className="aie-welcome-icon">
              <IconAI />
            </div>
            <h3>AI Website Editor</h3>
            <p>
              Describe what you want to change and the AI will edit your site's HTML directly.
              {" "}In split view, click any element on the preview to target it.
            </p>
            <div className="aie-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="aie-suggestion-chip"
                  onClick={() => handleSuggestion(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            {isThinking && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input area */}
      <div className="aie-chat-input-wrap">
        {/* no-token banner */}
        {!hasTokens && (
          <button className="aie-no-token-banner" onClick={onBuyTokens}>
            <IconWarn />
            <span>You have no tokens left</span>
            <span>Buy tokens →</span>
          </button>
        )}

        {/* ── model picker — always shown when models exist ─────────── */}
        {models.length > 0 && (
          <div className="aie-model-picker">
            <span className="aie-model-picker-label">Model</span>
            <div className="aie-model-chips">
              {models.map((m) => (
                <button
                  key={m.config_id}
                  className={`aie-model-chip${configId === m.config_id ? " aie-model-chip--active" : ""}`}
                  onClick={() => !isThinking && setConfigId(m.config_id)}
                  disabled={isThinking}
                  title={m.model}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── selected element chip ─────────────────────────────── */}
        {selectedElement && (
          <div className="aie-selected-el-chip">
            <span className="aie-sel-icon"><IconTarget /></span>
            <div className="aie-sel-info">
              <span className="aie-sel-label">{selectedElement.label}</span>
              {selectedElement.textContent && (
                <span className="aie-sel-text">
                  {selectedElement.textContent.slice(0, 60)}
                  {selectedElement.textContent.length > 60 ? "…" : ""}
                </span>
              )}
            </div>
            <button
              className="aie-sel-clear"
              onClick={onClearElement}
              aria-label="Clear selected element"
              title="Clear selection"
            >
              <IconX />
            </button>
          </div>
        )}

        <div className="aie-chat-input-row">
          <textarea
            ref={textaRef}
            className="aie-chat-textarea"
            placeholder={
              selectedElement
                ? `Edit the ${selectedElement.tagName}…`
                : hasTokens
                  ? "Describe what to change… or click an element in preview"
                  : "Buy tokens to edit with AI"
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKey}
            disabled={!hasTokens || isThinking}
            rows={1}
            aria-label="AI prompt input"
          />
          <button
            className="aie-send-btn"
            onClick={handleSend}
            disabled={!prompt.trim() || !hasTokens || isThinking}
            aria-label="Send prompt"
          >
            <IconSend />
          </button>
        </div>

        <div className="aie-input-hint">
          <span className="aie-input-hint-text">
            Shift+Enter for new line · Enter to send
          </span>
          <span className="aie-token-cost">
            <IconCoin /> 1 token per edit
          </span>
        </div>
      </div>
    </div>
  );
}
