import { useState, useEffect, useRef } from "react";

/**
 * Debounced auto-save hook.
 * Calls saveFn(html) after `delay` ms of inactivity.
 * Returns saveStatus: "saved" | "saving" | "unsaved"
 */
export default function useAutoSave(html, saveFn, delay = 2000, syncKey = null) {
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | unsaved
  const timerRef     = useRef(null);
  const lastSavedRef = useRef(html);
  const saveFnRef    = useRef(saveFn);
  const skipNextRef  = useRef(false);

  // keep saveFn ref fresh
  useEffect(() => { saveFnRef.current = saveFn; }, [saveFn]);

  // When switching pages, skip one autosave cycle and treat incoming html as saved
  useEffect(() => {
    clearTimeout(timerRef.current);
    skipNextRef.current = true;
    setSaveStatus("saved");
  }, [syncKey]);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      lastSavedRef.current = html;
      setSaveStatus("saved");
      return;
    }

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
