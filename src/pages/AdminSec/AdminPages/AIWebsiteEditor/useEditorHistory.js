import { useState, useCallback } from "react";

const MAX_HISTORY = 50;

/**
 * Undo/redo history stack for HTML snapshots.
 * Returns { html, set, undo, redo, canUndo, canRedo }
 */
export default function useEditorHistory(initialHtml = "") {
  const [past,    setPast]    = useState([]);
  const [present, setPresent] = useState(initialHtml);
  const [future,  setFuture]  = useState([]);

  /** Push a new snapshot — called when user commits a change */
  const set = useCallback((newHtml) => {
    setPresent((prev) => {
      if (prev === newHtml) return prev; // no-op
      setPast((p) => [...p.slice(-MAX_HISTORY + 1), prev]);
      setFuture([]);
      return newHtml;
    });
  }, []);

  /** Called on every keystroke in the code editor — no history push */
  const setLive = useCallback((newHtml) => {
    setPresent(newHtml);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      const rest = p.slice(0, -1);
      setPresent((cur) => {
        setFuture((f) => [cur, ...f]);
        return prev;
      });
      return rest;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const next = f[0];
      const rest = f.slice(1);
      setPresent((cur) => {
        setPast((p) => [...p, cur]);
        return next;
      });
      return rest;
    });
  }, []);

  return {
    html:     present,
    set,
    setLive,
    undo,
    redo,
    canUndo:  past.length > 0,
    canRedo:  future.length > 0,
  };
}
