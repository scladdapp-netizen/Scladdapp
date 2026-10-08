import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./SchoolAssistantPanel.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const SUGGESTIONS = [
  "How do I add a student?",
  "How do I create a session?",
  "How do I add a staff member?",
];

const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2.2l1.7 6.1L20 10l-6.3 1.7L12 17.8l-1.7-6.1L4 10l6.3-1.7L12 2.2z" fill="#4F46E5" />
    <path d="M18.2 14.2l.7 2.4 2.3.7-2.3.7-.7 2.4-.7-2.4-2.3-.7 2.3-.7.7-2.4z" fill="#818CF8" />
  </svg>
);

function partText(parts) {
  return (parts || []).map((part) => part.text).join("");
}

function historyText(message) {
  if (message.role === "user") return message.text || "";
  const result = message.result;
  if (!result) return "";
  if (result.kind === "query") {
    const names = (result.rows || []).slice(0, 3).map((row) => row.full_name || row.name || row.student_name || row.title || "").filter(Boolean);
    return [result.message || result.title, names.join(", ")].filter(Boolean).join(": ");
  }
  if (result.items?.length) {
    return [result.title, ...result.items.map((item) => [item.title, item.text || partText(item.parts)].filter(Boolean).join(": "))].filter(Boolean).join(". ");
  }
  return result.message || result.answer || partText(result.parts) || "";
}

function pageHref(schoolId, pagePath) {
  return `/admin/${schoolId}${pagePath === "/" ? "" : pagePath}`;
}

function RichText({ schoolId, parts, fallback }) {
  if (!parts?.length) return fallback || null;
  return parts.map((part, index) => (
    part.type === "link" && part.path
      ? <Link key={index} className="aa-page-link" to={pageHref(schoolId, part.path)}>{part.text}</Link>
      : <span key={index}>{part.text}</span>
  ));
}

function Answer({ result, schoolId }) {
  if (result.kind === "docs" && result.items?.length) {
    return (
      <div className="aa-msg-text">
        {result.title && <p className="aa-msg-title">{result.title}</p>}
        <ol>
          {result.items.map((item, index) => (
            <li key={index}>
              {item.title && <strong>{item.title}</strong>}
              <span><RichText schoolId={schoolId} parts={item.parts} fallback={item.text} /></span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (result.kind === "docs") {
    return (
      <div className="aa-msg-text">
        <p><RichText schoolId={schoolId} parts={result.parts} fallback={result.message || result.answer} /></p>
      </div>
    );
  }

  if (result.kind === "query") {
    return (
      <div className="aa-msg-text">
        {result.message
          ? <p>{result.message}</p>
          : <p className="aa-msg-title">{result.title}</p>}
        {!result.message && result.query && <p className="aa-query">{result.query}</p>}
        {result.rows?.length ? (
          <div className="aa-table-wrap">
            <table>
              <thead>
                <tr>
                  {(result.columns || []).map((col) => <th key={col.key}>{col.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index}>
                    {(result.columns || []).map((col) => <td key={col.key}>{row[col.key] ?? "—"}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !result.message && <p>No matching records.</p>
        )}
      </div>
    );
  }

  return (
    <div className="aa-msg-text">
      <p><RichText schoolId={schoolId} parts={result.parts} fallback={result.message || "I could not answer that."} /></p>
    </div>
  );
}

const STORAGE_PREFIX = "sclad-assistant-chats:";
const MAX_CHATS = 30;

function storageKey(schoolId) {
  return `${STORAGE_PREFIX}${schoolId}`;
}

function chatTitle(messages) {
  const first = messages.find((message) => message.role === "user" && message.text);
  const text = (first?.text || "New chat").replace(/\s+/g, " ").trim();
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

function loadStore(schoolId) {
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    const parsed = raw ? JSON.parse(raw) : null;
    const chats = Array.isArray(parsed?.chats) ? parsed.chats.filter((chat) => chat?.id && Array.isArray(chat.messages)) : [];
    const activeId = chats.some((chat) => chat.id === parsed?.activeId) ? parsed.activeId : (chats[0]?.id || null);
    return { schoolId, activeId, chats };
  } catch {
    return { schoolId, activeId: null, chats: [] };
  }
}

function saveStore(store) {
  const payload = { activeId: store.activeId, chats: store.chats.slice(0, MAX_CHATS) };
  try {
    localStorage.setItem(storageKey(store.schoolId), JSON.stringify(payload));
  } catch {
    try {
      localStorage.setItem(storageKey(store.schoolId), JSON.stringify({ ...payload, chats: payload.chats.slice(0, 8) }));
    } catch {
      /* this browser refused more local storage */
    }
  }
}

const SchoolAssistantPanel = ({ schoolId, onClose }) => {
  const [question, setQuestion] = useState("");
  const [pendingId, setPendingId] = useState(null);
  const [store, setStore] = useState(() => loadStore(schoolId));
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const active = store.chats.find((chat) => chat.id === store.activeId) || null;
  const messages = active?.messages || [];
  const loading = pendingId != null && pendingId === store.activeId;

  useEffect(() => {
    setStore(loadStore(schoolId));
    setQuestion("");
    setPendingId(null);
  }, [schoolId]);

  useEffect(() => {
    if (store.schoolId === schoolId) saveStore(store);
  }, [store, schoolId]);

  useEffect(() => {
    const thread = threadRef.current;
    if (thread) thread.scrollTop = thread.scrollHeight;
  }, [messages, loading]);

  const startNew = () => {
    if (pendingId) return;
    setQuestion("");
    setStore((prev) => ({ ...prev, activeId: null }));
    inputRef.current?.focus();
  };

  const openChat = (id) => {
    setStore((prev) => ({ ...prev, activeId: id }));
  };

  const removeChat = (id) => {
    if (pendingId === id) setPendingId(null);
    setStore((prev) => {
      const chats = prev.chats.filter((chat) => chat.id !== id);
      const activeId = prev.activeId === id ? (chats[0]?.id || null) : prev.activeId;
      return { ...prev, chats, activeId };
    });
  };

  const ask = async (text) => {
    const q = (text ?? question).trim();
    if (!q || pendingId) return;
    const chatId = store.activeId || `${Date.now()}`;
    const prior = store.activeId ? messages : [];
    const history = prior.slice(-8).map((message) => ({
      role: message.role,
      text: historyText(message).slice(0, 500),
    })).filter((item) => item.text);
    const userMessage = { id: Date.now(), role: "user", text: q };
    setQuestion("");
    setPendingId(chatId);
    setStore((prev) => {
      const existing = prev.chats.find((chat) => chat.id === chatId);
      const base = existing?.messages || [];
      const nextMessages = [...base, userMessage];
      const next = {
        id: chatId,
        title: chatTitle(nextMessages),
        updatedAt: Date.now(),
        messages: nextMessages,
      };
      const rest = prev.chats.filter((chat) => chat.id !== chatId);
      return { ...prev, activeId: chatId, chats: [next, ...rest].slice(0, MAX_CHATS) };
    });
    const append = (message) => {
      setStore((prev) => ({
        ...prev,
        chats: prev.chats.map((chat) => (
          chat.id === chatId
            ? { ...chat, updatedAt: Date.now(), messages: [...chat.messages, message] }
            : chat
        )),
      }));
    };
    try {
      const res = await fetch(`${API_BASE}/api/schools/${schoolId}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) throw new Error(data.message || "Could not answer that.");
      append({ id: Date.now() + 1, role: "assistant", result: data });
    } catch (err) {
      append({ id: Date.now() + 1, role: "assistant", error: err.message || "Could not answer that." });
    } finally {
      setPendingId((current) => (current === chatId ? null : current));
      inputRef.current?.focus();
    }
  };

  const empty = messages.length === 0 && !loading;

  return (
    <aside className="aa-panel">
      <header className="aa-panel-header">
        <button type="button" className="aa-new-chat" onClick={startNew} disabled={!!pendingId} aria-label="New chat">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {store.chats.length > 0 ? (
          <div className="aa-history-list">
            {store.chats.map((chat) => (
              <div key={chat.id} className={`aa-history-item${chat.id === store.activeId ? " on" : ""}`}>
                <button type="button" className="aa-history-open" onClick={() => openChat(chat.id)}>
                  {chat.title || "New chat"}
                </button>
                <button type="button" className="aa-history-delete" onClick={() => removeChat(chat.id)} aria-label="Delete chat">×</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="aa-panel-title">
            <Star />
            <h2>Assistant</h2>
          </div>
        )}
        <button type="button" className="aa-close" onClick={onClose} aria-label="Close assistant">×</button>
      </header>

      <div className="aa-thread" ref={threadRef}>
        {empty && (
          <div className="aa-empty">
            <div className="aa-empty-mark"><Star /></div>
            <h3>How can I help?</h3>
            <div className="aa-suggestions">
              {SUGGESTIONS.map((item) => (
                <button key={item} type="button" className="aa-chip" onClick={() => ask(item)}>{item}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          message.role === "user" ? (
            <div key={message.id} className="aa-row user">
              <div className="aa-bubble">{message.text}</div>
            </div>
          ) : (
            <div key={message.id} className="aa-row assistant">
              <div className="aa-avatar"><Star /></div>
              {message.error
                ? <div className="aa-msg-text aa-error"><p>{message.error}</p></div>
                : <Answer result={message.result} schoolId={schoolId} />}
            </div>
          )
        ))}

        {loading && (
          <div className="aa-row assistant">
            <div className="aa-avatar"><Star /></div>
            <div className="aa-typing" aria-label="Assistant is answering">
              <span /><span /><span />
            </div>
          </div>
        )}
      </div>

      <form
        className="aa-composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="Ask anything"
          maxLength={400}
        />
        <button type="submit" disabled={loading || !question.trim()} aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 13V3M8 3L4 7M8 3l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </aside>
  );
};

export default SchoolAssistantPanel;
