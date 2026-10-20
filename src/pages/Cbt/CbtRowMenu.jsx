import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const ITEM_HEIGHT = 38;

/** An "Actions" dropdown that sits above the page so a table never clips it. */
const CbtRowMenu = ({ items, label = "Actions" }) => {
  const [pos, setPos] = useState(null);
  const button = useRef(null);
  const close = useCallback(() => setPos(null), []);

  useEffect(() => {
    if (!pos) return undefined;
    const onKey = (event) => event.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [pos, close]);

  const toggle = (event) => {
    event.stopPropagation();
    if (pos) return close();
    const rect = button.current.getBoundingClientRect();
    const height = items.length * ITEM_HEIGHT + 12;
    const openUp = window.innerHeight - rect.bottom < height + 8 && rect.top > height;
    setPos({ top: openUp ? rect.top - height - 4 : rect.bottom + 4, right: Math.max(window.innerWidth - rect.right, 8) });
    return undefined;
  };

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <button ref={button} type="button" className="cbt-menu-btn" aria-haspopup="menu" aria-expanded={Boolean(pos)} onClick={toggle} disabled={items.length === 0}>
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {pos &&
        createPortal(
          <div className="cbt-menu-backdrop" onClick={(event) => { event.stopPropagation(); close(); }}>
            <div className="cbt-menu" role="menu" style={{ top: pos.top, right: pos.right }} onClick={(event) => event.stopPropagation()}>
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={`cbt-menu-item${item.danger ? " is-danger" : ""}`}
                  onClick={() => {
                    close();
                    item.onClick();
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CbtRowMenu;
