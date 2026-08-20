import { useState, useRef } from "react";

const IconCopy = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function CodeEditorPanel({ html, onChangeLive, onCommit }) {
  const [copied, setCopied]     = useState(false);
  const commitTimerRef          = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChangeLive(val);

    // commit to history 1s after the user stops typing
    clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      onCommit(val);
    }, 1000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="aie-code-panel">
      <div className="aie-code-toolbar">
        <div className="aie-code-toolbar-left">
          <span className="aie-code-label">Source</span>
          <span className="aie-code-lang">HTML</span>
        </div>
        <button className="aie-code-copy-btn" onClick={handleCopy} aria-label="Copy HTML">
          {copied ? <><IconCheck /> Copied</> : <><IconCopy /> Copy</>}
        </button>
      </div>

      <div className="aie-code-editor">
        <textarea
          className="aie-code-textarea"
          value={html}
          onChange={handleChange}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="HTML source editor"
        />
      </div>
    </div>
  );
}
