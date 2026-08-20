import { useState, useEffect, useRef } from "react";

/**
 * Debounced auto-save hook.
 * Calls saveFn(html) after `delay` ms of inactivity.
 * Returns saveStatus: "saved" | "saving" | "unsaved"
 */
export default function useAutoSave(html, saveFn, delay = 2000) {
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved
  const timerRef     = useRef(null);
  const lastSavedRef = useRef(html);
  const saveFnRef    = useRef(saveFn);

  // keep saveFn ref fresh
  useEffect(() => { saveFnRef.current = saveFn; }, [saveFn]);

  useEffect(() => {
    if (html === lastSavedRef.current) return;

    setSaveStatus("unsaved");

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await saveFnRef.current(html);
        lastSavedRef.current = html;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [html, delay]);

  return saveStatus;
}
