import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFetchStudentsPaginated, useSession, useStaffInfo } from "../../../../../api_call";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { formatCardDate, schoolForIdCard, sessionValidUntil } from "../../../../../utils/exportIdCardPDF";
import CardSurface from "./editor/CardSurface";
import {
  CARD_SIZES,
  PX_PER_MM,
  STARTER_TEMPLATES,
  applyStarter,
  applyCatalog,
  blankTemplate,
  canInsert,
  cleanTemplate,
  elementCatalog,
  elementFromField,
  fieldsFor,
  layoutWarnings,
  isLiveTemplate,
  loadLibrary,
  personFromRecord,
  publishLibrary,
  saveDraftLibrary,
} from "./editor/model";
import "./IdCardEditor.css";

const STATUS = {
  saved: "Saved",
  draft: "Draft",
  unsaved: "Draft",
  saving: "Saving draft",
  failed: "Save failed",
};

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

const IdCardTemplatePage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getStudentsPaginated } = useFetchStudentsPaginated();
  const { getStaffBySchoolId } = useStaffInfo();
  const { getSessionsBySchool } = useSession();
  const school = { ...schoolForIdCard(user?.school), website: user?.school?.website || "" };
  const cardRef = useRef(null);
  const stageRef = useRef(null);
  const past = useRef([]);
  const future = useRef([]);
  const draftRef = useRef(null);
  const historyArmed = useRef(false);
  const saveToken = useRef(0);
  const [library, setLibrary] = useState(() => loadLibrary(schoolId));
  const libraryRef = useRef(library);
  libraryRef.current = library;
  const [draft, setDraft] = useState(() => cleanTemplate(loadLibrary(schoolId).templates.find((row) => row.id === loadLibrary(schoolId).active.student)));
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(draft));
  const [side, setSide] = useState("front");
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState("elements");
  const railTab = tab === "templates" ? "templates" : "elements";
  const [zoom, setZoom] = useState(1);
  const [preview, setPreview] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState(null);
  const [saveStatus, setSaveStatus] = useState(() => (isLiveTemplate(schoolId, draft) ? "saved" : "draft"));
  const [ask, setAsk] = useState(null);
  const [rev, setRev] = useState(0);
  const [people, setPeople] = useState([]);
  const [previewId, setPreviewId] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [expiry, setExpiry] = useState("");
  draftRef.current = draft;

  const dirty = JSON.stringify(draft) !== savedJson;
  const elements = draft[side] || [];
  const selectedElements = elements.filter((row) => selected.includes(row.id));
  const activeElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const catalog = elementCatalog(draft.type);
  const [platformDesigns, setPlatformDesigns] = useState([]);
  const fields = fieldsFor(draft.type);
  const person = people.find((row) => row.idNumber === previewId && row.kind === draft.type) || null;
  const sample = person || people.find((row) => row.kind === draft.type) || null;
  const extras = useMemo(() => ({
    issueDate: formatCardDate(new Date().toISOString().slice(0, 10)),
    expiryDate: expiry ? formatCardDate(expiry) : "",
  }), [expiry]);
  const warnings = preview ? layoutWarnings(draft, side, person, school, extras) : [];
  const cardPx = {
    width: draft.widthMm * PX_PER_MM * zoom,
    height: draft.heightMm * PX_PER_MM * zoom,
  };

  useEffect(() => {
    let cancel = false;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
    fetch(`${base}/api/id-card-templates`)
      .then((res) => res.json())
      .then((data) => { if (!cancel && data?.success) setPlatformDesigns(data.data || []); })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [studentsRes, staffRes, sessionRes] = await Promise.all([
          getStudentsPaginated(schoolId, { page: 1, limit: 30, status: "active", sortBy: "full_name", sortOrder: "asc" }),
          getStaffBySchoolId(schoolId),
          getSessionsBySchool(schoolId),
        ]);
        if (cancel) return;
        const sessions = sessionRes?.data || [];
        const active = sessions.find((row) => row.session_status === "active");
        setSessionName(active?.session_name || "");
        setExpiry(sessionValidUntil(sessions));
        const students = (studentsRes?.data || []).map((row) => ({ ...personFromRecord(row, "student", active?.session_name || ""), idNumber: row.admission_number || row.student_id }));
        const staff = (staffRes?.data || [])
          .filter((row) => (row.record_status || "active") === "active")
          .map((row) => ({ ...personFromRecord(row, "staff", active?.session_name || ""), idNumber: row.staff_id }));
        setPeople([...students, ...staff]);
      } catch { /* the editor still works before records load */ }
    })();
    return () => { cancel = true; };
  }, [schoolId]);

  useEffect(() => {
    if (!dirty) return undefined;
    setSaveStatus("unsaved");
    const timer = window.setTimeout(() => { persist("auto"); }, 900);
    return () => window.clearTimeout(timer);
  }, [dirty, draft]);

  useEffect(() => {
    const onKey = (event) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        persist("manual");
      }
      if (typing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      if (event.key === "Delete" || event.key === "Backspace") removeSelected();
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSheet(null);
        setSelected([]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const bump = () => setRev((value) => value + 1);
  const commit = (recipe) => {
    setDraft((current) => {
      past.current.push(current);
      if (past.current.length > 40) past.current.shift();
      future.current = [];
      return recipe(current);
    });
    bump();
  };
  const remember = () => {
    if (historyArmed.current) return;
    past.current.push(draftRef.current);
    if (past.current.length > 40) past.current.shift();
    future.current = [];
    historyArmed.current = true;
    bump();
  };
  const undo = () => {
    setDraft((current) => {
      const prev = past.current.pop();
      if (!prev) return current;
      future.current.push(current);
      return prev;
    });
    bump();
  };
  const redo = () => {
    setDraft((current) => {
      const next = future.current.pop();
      if (!next) return current;
      past.current.push(current);
      return next;
    });
    bump();
  };

  const canPublishCards = async () => {
    const allowed = (name) => {
      const value = String(name || "").toLowerCase();
      return value.includes("standard") || value.includes("premium");
    };
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(`${base}/api/subscription/school/${schoolId}/dashboard`);
      const data = await res.json();
      if (data?.success) return allowed(data.data?.plan?.plan_name);
    } catch { /* fall back to the plan stored at login */ }
    return allowed(user?.subscription?.plan_name);
  };

  const persist = async (reason) => {
    if (reason === "manual" && !(await canPublishCards())) {
      setSaveStatus("draft");
      addNotification("Upgrade from Basic Plan to Standard Plan to make changes in the ID card template.", "error");
      return false;
    }
    const token = saveToken.current + 1;
    saveToken.current = token;
    setSaveStatus("saving");
    try {
      const nextDoc = { ...draftRef.current, updatedAt: new Date().toISOString(), version: Number(draftRef.current.version || 1) + 1 };
      const shelf = libraryRef.current;
      const templates = shelf.templates.some((row) => row.id === nextDoc.id)
        ? shelf.templates.map((row) => (row.id === nextDoc.id ? nextDoc : row))
        : [...shelf.templates, nextDoc];
      const nextLibrary = { templates, active: { ...shelf.active, [nextDoc.type]: nextDoc.id } };
      if (reason === "manual") publishLibrary(schoolId, nextLibrary);
      else saveDraftLibrary(schoolId, nextLibrary);
      if (token !== saveToken.current) return false;
      setLibrary(nextLibrary);
      setDraft(nextDoc);
      setSavedJson(JSON.stringify(nextDoc));
      setSaveStatus(reason === "manual" ? "saved" : "draft");
      if (reason === "manual") addNotification("Cards saved. This design is now the ID card template.", "success");
      return true;
    } catch (err) {
      if (token !== saveToken.current) return false;
      setSaveStatus("failed");
      addNotification(err.message || "Could not save the template. Your edits are still on this page.", "error");
      return false;
    }
  };

  const patchElement = (id, next, record) => {
    if (record) remember();
    setDraft((current) => ({
      ...current,
      [side]: current[side].map((row) => (row.id === id ? { ...row, ...next } : row)),
    }));
  };

  const insertElement = (element) => {
    if (!canInsert(elements, element)) {
      addNotification("That item is already on this side of the card", "error");
      return;
    }
    const placed = { ...element };
    if (placed.name !== "Background shape" && placed.name !== "Border" && placed.name !== "Pattern") {
      const shift = elements.length % 5;
      placed.x = Math.min(70, placed.x + shift * 2);
      placed.y = Math.min(70, placed.y + shift * 2);
    }
    const atBack = placed.name === "Background shape" || placed.shape === "pattern";
    commit((current) => ({
      ...current,
      [side]: atBack ? [placed, ...current[side]] : [...current[side], placed],
    }));
    setSelected([placed.id]);
  };

  const onDrop = (event) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("application/x-id-card");
    if (!raw || !cardRef.current) return;
    const payload = JSON.parse(raw);
    const element = payload.field
      ? elementFromField(fields.find((row) => row.id === payload.field), draft.type)
      : catalog.flatMap((group) => group.items).find((row) => row.key === payload.key)?.create();
    if (!element) return;
    const rect = cardRef.current.getBoundingClientRect();
    element.x = Math.max(0, Math.min(80, ((event.clientX - rect.left) / rect.width) * 100));
    element.y = Math.max(0, Math.min(80, ((event.clientY - rect.top) / rect.height) * 100));
    insertElement(element);
  };

  const moveElement = (event, element) => {
    if (preview || element.locked || event.button !== 0) return;
    if (event.target.closest(".ice-handle, .ice-rotate")) return;
    const typing = event.target.closest("textarea");
    if (typing) event.preventDefault();
    const ids = event.shiftKey ? selected : [element.id];
    const moving = new Set(ids.includes(element.id) ? ids : [element.id]);
    const rect = cardRef.current.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const origins = elements.filter((row) => moving.has(row.id) && !row.locked).map((row) => ({ id: row.id, x: row.x, y: row.y }));
    let moved = false;
    const onMove = (moveEvent) => {
      if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 4) return;
      if (!moved) {
        moved = true;
        typing?.blur();
      }
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100;
      const bleed = draftRef.current.showBleed ? 6 : 0;
      remember();
      setDraft((current) => ({
        ...current,
        [side]: current[side].map((row) => {
          const origin = origins.find((item) => item.id === row.id);
          if (!origin) return row;
          let x = origin.x + dx;
          let y = origin.y + dy;
          if (current.showGrid) {
            x = Math.round(x);
            y = Math.round(y);
          }
          x = Math.max(-bleed, Math.min(100 + bleed - row.w, x));
          y = Math.max(-bleed, Math.min(100 + bleed - row.h, y));
          return { ...row, x, y };
        }),
      }));
    };
    const onUp = () => {
      historyArmed.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (!moved && element.type === "text" && !element.field) {
        window.requestAnimationFrame(() => {
          cardRef.current?.querySelector(`[data-el="${element.id}"] textarea`)?.focus();
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const resizeElement = (event, element, edge) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = cardRef.current.getBoundingClientRect();
    const origin = { ...element, cx: event.clientX, cy: event.clientY };
    const onMove = (moveEvent) => {
      const dx = ((moveEvent.clientX - origin.cx) / rect.width) * 100;
      const dy = ((moveEvent.clientY - origin.cy) / rect.height) * 100;
      let { x, y, w, h } = origin;
      if (edge.includes("e")) w = origin.w + dx;
      if (edge.includes("s")) h = origin.h + dy;
      if (edge.includes("w")) w = origin.w - dx;
      if (edge.includes("n")) h = origin.h - dy;
      w = Math.max(4, w);
      h = Math.max(4, h);
      if (edge.includes("w")) x = origin.x + origin.w - w;
      if (edge.includes("n")) y = origin.y + origin.h - h;
      const bleed = draftRef.current.showBleed ? 6 : 0;
      x = Math.max(-bleed, x);
      y = Math.max(-bleed, y);
      if (x + w > 100 + bleed) w = 100 + bleed - x;
      if (y + h > 100 + bleed) h = 100 + bleed - y;
      remember();
      patchElement(element.id, { x, y, w: Math.max(4, w), h: Math.max(4, h) });
    };
    const onUp = () => {
      historyArmed.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const rotateElement = (event, element) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + ((element.x + element.w / 2) / 100) * rect.width;
    const cy = rect.top + ((element.y + element.h / 2) / 100) * rect.height;
    const onMove = (moveEvent) => {
      const angle = Math.round(Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx) * (180 / Math.PI) + 90);
      remember();
      patchElement(element.id, { rotation: Math.max(-180, Math.min(180, angle)) });
    };
    const onUp = () => {
      historyArmed.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const removeSelected = () => {
    if (!selected.length) return;
    commit((current) => ({ ...current, [side]: current[side].filter((row) => !selected.includes(row.id) || row.locked) }));
    setSelected([]);
  };
  const duplicateSelected = () => {
    const copies = selectedElements.filter((row) => canInsert(elements, { ...row, field: UNIQUE_FIELDS_SAFE(row) ? "" : row.field }));
    if (!copies.length) return;
    const made = copies.map((row) => ({ ...row, id: `${row.id}-copy-${Date.now().toString(36)}`, name: `${row.name} copy`, x: Math.min(90, row.x + 3), y: Math.min(90, row.y + 3), field: ["photo", "schoolLogo", "qr", "barcode"].includes(row.field) ? "" : row.field }));
    commit((current) => ({ ...current, [side]: [...current[side], ...made] }));
    setSelected(made.map((row) => row.id));
  };

  const order = (mode) => {
    commit((current) => {
      const list = [...current[side]];
      selected.forEach((id) => {
        const index = list.findIndex((row) => row.id === id);
        if (index < 0) return;
        const [item] = list.splice(index, 1);
        if (mode === "front") list.push(item);
        else if (mode === "back") list.unshift(item);
        else if (mode === "forward") list.splice(Math.min(list.length, index + 1), 0, item);
        else list.splice(Math.max(0, index - 1), 0, item);
      });
      return { ...current, [side]: list };
    });
  };

  const align = (mode) => {
    if (selectedElements.length < 2) return;
    const minX = Math.min(...selectedElements.map((row) => row.x));
    const maxX = Math.max(...selectedElements.map((row) => row.x + row.w));
    const minY = Math.min(...selectedElements.map((row) => row.y));
    const maxY = Math.max(...selectedElements.map((row) => row.y + row.h));
    commit((current) => ({
      ...current,
      [side]: current[side].map((row) => {
        if (!selected.includes(row.id) || row.locked) return row;
        if (mode === "left") return { ...row, x: minX };
        if (mode === "right") return { ...row, x: maxX - row.w };
        if (mode === "hcenter") return { ...row, x: (minX + maxX) / 2 - row.w / 2 };
        if (mode === "top") return { ...row, y: minY };
        if (mode === "bottom") return { ...row, y: maxY - row.h };
        return { ...row, y: (minY + maxY) / 2 - row.h / 2 };
      }),
    }));
  };

  const openTemplate = (next, audience = draft.type) => {
    const cleaned = cleanTemplate({ ...next, type: audience });
    past.current = [];
    future.current = [];
    setDraft(cleaned);
    setSavedJson(JSON.stringify(cleaned));
    setSelected([]);
    setSaveStatus(isLiveTemplate(schoolId, cleaned) ? "saved" : "draft");
    setLibrary((current) => ({ ...current, active: { ...current.active, [audience]: cleaned.id } }));
  };

  const guard = (message, action, options = {}) => {
    const when = options.when === undefined ? dirty : options.when;
    if (!when) action();
    else setAsk({ message, confirmLabel: options.confirmLabel || "Discard changes", action });
  };

  const switchType = (type) => {
    if (type === draft.type) return;
    const go = () => {
      const shelf = libraryRef.current;
      const chosen = shelf.templates.find((row) => row.id === shelf.active[type]) || shelf.templates[0];
      if (chosen) openTemplate(chosen, type);
      else commit((current) => ({ ...current, type }));
    };
    setMenuOpen(false);
    guard("Switch ID type and discard unsaved changes?", go);
  };

  const openSheet = (which) => {
    setMenuOpen(false);
    if (which === "props") {
      setSheet((current) => (current === "props" ? null : "props"));
      return;
    }
    if (sheet === "rail" && railTab === which) {
      setSheet(null);
      return;
    }
    setTab(which);
    setSheet("rail");
  };

  const fit = () => {
    const stage = stageRef.current?.getBoundingClientRect();
    if (!stage) return;
    const next = Math.min((stage.width - 64) / (draft.widthMm * PX_PER_MM), (stage.height - 64) / (draft.heightMm * PX_PER_MM));
    setZoom(Math.max(0.35, Math.min(next, 2)));
  };

  const chooseImage = async (file, apply) => {
    if (!file) return;
    try {
      apply(await readFile(file));
    } catch (err) {
      addNotification(err.message || "Could not read that image", "error");
    }
  };

  const previewPeople = people.filter((row) => row.kind === draft.type);

  return (
    <div className="ice">
      <header className={`ice-top${menuOpen ? " is-menu-open" : ""}`}>
        <div className="ice-top-lead">
          <button type="button" className="ice-back" aria-label="ID Cards" onClick={() => {
            const leave = () => navigate(`/admin/${schoolId}/school_directory/id-cards`);
            if (dirty || saveStatus === "unsaved" || saveStatus === "failed") guard("Leave without saving the latest changes?", leave);
            else if (saveStatus === "draft") guard("This draft is not on ID cards yet. Leave without publishing it?", leave, { when: true, confirmLabel: "Leave" });
            else leave();
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 5L8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input className="ice-name" aria-label="Edit ID card" placeholder="Edit ID card" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <button type="button" className={`ice-more${menuOpen ? " on" : ""}`} aria-expanded={menuOpen} aria-label="Card options" onClick={() => setMenuOpen((value) => !value)}>
          {draft.type === "staff" ? "Staff" : "Student"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={`ice-top-panel${menuOpen ? " is-open" : ""}`}>
        <div className="ice-switch" role="tablist" aria-label="Template type">
          <button type="button" className={draft.type === "student" ? "on" : ""} onClick={() => switchType("student")}>Student ID</button>
          <button type="button" className={draft.type === "staff" ? "on" : ""} onClick={() => switchType("staff")}>Staff ID</button>
        </div>
        <div className="ice-top-actions">
          <span className={`ice-status is-${saveStatus}`}>{STATUS[saveStatus]}</span>
          {saveStatus === "failed" && <button type="button" className="ice-btn" onClick={() => persist("manual")}>Retry</button>}
          <div className="ice-history">
            <button type="button" className="ice-btn" aria-label="Undo" onClick={undo} disabled={!past.current.length}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 8H4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 12a8 8 0 1 0 2.3-5.6L4 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="ice-btn" aria-label="Redo" onClick={redo} disabled={!future.current.length}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M16 8h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12a8 8 0 1 1-2.3-5.6L20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <button type="button" className={`ice-btn${preview ? " on" : ""}`} onClick={() => { setMenuOpen(false); setPreview((value) => !value); }}>{preview ? "Edit" : "Preview"}</button>
          <button type="button" className="ice-save" onClick={() => { setMenuOpen(false); persist("manual"); }}>Save cards</button>
        </div>
        </div>
      </header>

      <div className="ice-body">
        {menuOpen && <button type="button" className="ice-menu-backdrop" aria-label="Close options" onClick={() => setMenuOpen(false)} />}
        {sheet && <button type="button" className="ice-sheet-backdrop" aria-label="Close panel" onClick={() => setSheet(null)} />}
        <aside className={`ice-rail${sheet === "rail" ? " is-open" : ""}`}>
          <div className="ice-sheet-head">
            <strong>{railTab === "templates" ? "Templates" : "Elements"}</strong>
            <button type="button" className="ice-btn" onClick={() => setSheet(null)}>Close</button>
          </div>
          <div className="ice-tabs" role="tablist">
            {["elements", "templates"].map((item) => (
              <button key={item} type="button" className={`ice-tab${railTab === item ? " on" : ""}`} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
            ))}
          </div>
          <div className="ice-rail-scroll">
          {railTab === "elements" && catalog.map((group) => (
            <section key={group.title} className="ice-group">
              <h2>{group.title}</h2>
              <div className="ice-chip-list">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="ice-chip"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("application/x-id-card", JSON.stringify({ key: item.key }))}
                    onClick={() => insertElement(item.create())}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
          {railTab === "templates" && (
            <section className="ice-group">
              <h2>Saved templates</h2>
              {library.templates.map((row) => (
                <div key={row.id} className={`ice-template${library.active[draft.type] === row.id ? " is-selected" : ""}`}>
                  <button type="button" onClick={() => guard("Open another template and discard unsaved changes?", () => { openTemplate(row, draft.type); setSheet(null); })}>
                    <span>{row.name}</span>
                    <small>{CARD_SIZES.find((size) => size.id === row.sizeId)?.label || "Custom"}</small>
                  </button>
                  <span className="ice-note">{row.status}</span>
                </div>
              ))}
              <h2>{platformDesigns.length ? "Sclad templates" : "Starting designs"}</h2>
              {(platformDesigns.length ? platformDesigns : STARTER_TEMPLATES).map((row) => (
                <div key={row.id} className="ice-template">
                  <button type="button" onClick={() => setAsk({ message: `Replace the current layout with ${row.name}?`, confirmLabel: "Apply template", action: () => { commit((current) => platformDesigns.length ? applyCatalog(current, row) : applyStarter(current, row.id)); setSheet(null); } })}>
                    <span>{row.name}</span>
                    <small>{CARD_SIZES.find((size) => size.id === row.sizeId)?.label || "Custom"}</small>
                  </button>
                </div>
              ))}
              <button type="button" className="ice-btn" onClick={() => { const next = blankTemplate(draft.type, "Blank card"); setLibrary((current) => ({ templates: [...current.templates, next], active: { ...current.active, [next.type]: next.id } })); openTemplate(next); }}>New blank template</button>
            </section>
          )}
          </div>
        </aside>

        <main className="ice-stage-wrap">
          <div className="ice-side" role="tablist" aria-label="Card side">
            <button type="button" className={side === "front" ? "on" : ""} onClick={() => { setSide("front"); setSelected([]); }}>Front</button>
            <button type="button" className={side === "back" ? "on" : ""} onClick={() => { setSide("back"); setSelected([]); }}>Back</button>
          </div>
          <div className="ice-stage" ref={stageRef}>
            <div className="ice-stage-center">
            <div
              className="ice-board"
              ref={cardRef}
              style={cardPx}
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              <CardSurface
                template={draft}
                side={side}
                person={preview ? person : sample}
                school={school}
                extras={extras}
                preview={preview}
                interactive={!preview}
                selected={preview ? [] : selected}
                pixelsPerMm={PX_PER_MM * zoom}
                onClear={() => setSelected([])}
                onSelect={(event, element) => {
                  if (event.shiftKey) setSelected((current) => current.includes(element.id) ? current.filter((id) => id !== element.id) : [...current, element.id]);
                  else setSelected([element.id]);
                  moveElement(event, element);
                }}
                onResize={resizeElement}
                onRotate={rotateElement}
                onEditText={(id, text) => patchElement(id, { text })}
              />
            </div>
            </div>
          </div>
          {!!warnings.length && <p className="ice-warn">{warnings[0]}</p>}
        </main>

        <aside className={`ice-props${sheet === "props" ? " is-open" : ""}`}>
          <div className="ice-sheet-head">
            <strong>Properties</strong>
            <button type="button" className="ice-btn" onClick={() => setSheet(null)}>Close</button>
          </div>
          <div className="ice-props-scroll">
          {preview && (
            <>
              <h2>Preview record</h2>
              <label className="ice-field">
                School record
                <select value={previewId} onChange={(event) => setPreviewId(event.target.value)}>
                  <option value="">Field labels</option>
                  {previewPeople.map((row) => <option key={row.idNumber} value={row.idNumber}>{row.fullName}</option>)}
                </select>
              </label>
              {!previewPeople.length && <p className="ice-note">No {draft.type} records are available for this account.</p>}
              <button type="button" className="ice-btn" onClick={() => setPrintOpen(true)}>Print preview</button>
              {warnings.map((warning) => <p key={warning} className="ice-warn">{warning}</p>)}
            </>
          )}
          {!preview && !activeElement && (
            <>
              <h2>Card</h2>
              <label className="ice-field">Size
                <select value={draft.sizeId} onChange={(event) => {
                  const size = CARD_SIZES.find((row) => row.id === event.target.value);
                  commit((current) => ({ ...current, sizeId: size.id, widthMm: size.widthMm, heightMm: size.heightMm }));
                }}>
                  {CARD_SIZES.map((size) => <option key={size.id} value={size.id}>{size.label}</option>)}
                </select>
              </label>
              {draft.sizeId === "custom" && (
                <div className="ice-row">
                  <NumField label="Width mm" value={draft.widthMm} onValue={(widthMm) => setDraft((current) => ({ ...current, widthMm }))} />
                  <NumField label="Height mm" value={draft.heightMm} onValue={(heightMm) => setDraft((current) => ({ ...current, heightMm }))} />
                </div>
              )}
              <label className="ice-field">Background<input type="color" value={draft.background} onChange={(event) => setDraft((current) => ({ ...current, background: event.target.value }))} /></label>
              <label className="ice-field">Background image
                <input type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0], (src) => setDraft((current) => ({ ...current, backgroundImage: src, overlayOpacity: current.overlayOpacity > 0 ? current.overlayOpacity : 0.45 })))} />
              </label>
              {draft.backgroundImage && (
                <>
                  <button type="button" className="ice-btn" onClick={() => setDraft((current) => ({ ...current, backgroundImage: "", overlayOpacity: 0 }))}>Remove background</button>
                  <label className="ice-field">Overlay strength
                    <input type="range" min="0" max="100" value={Math.round((Number(draft.overlayOpacity) || 0) * 100)} onChange={(event) => setDraft((current) => ({ ...current, overlayOpacity: Number(event.target.value) / 100 }))} />
                    <span className="ice-range-value">{Math.round((Number(draft.overlayOpacity) || 0) * 100)}%</span>
                  </label>
                </>
              )}
              <NumField label="Corner radius" value={draft.cornerRadius} onValue={(cornerRadius) => setDraft((current) => ({ ...current, cornerRadius }))} />
              <label className="ice-field">Border colour<input type="color" value={draft.borderColor} onChange={(event) => setDraft((current) => ({ ...current, borderColor: event.target.value }))} /></label>
              <label className="ice-check"><input type="checkbox" checked={draft.showSafe} onChange={(event) => setDraft((current) => ({ ...current, showSafe: event.target.checked }))} /> Safe margin</label>
              <label className="ice-check"><input type="checkbox" checked={draft.showBleed} onChange={(event) => setDraft((current) => ({ ...current, showBleed: event.target.checked }))} /> Bleed guide</label>
              <label className="ice-check"><input type="checkbox" checked={draft.showGrid} onChange={(event) => setDraft((current) => ({ ...current, showGrid: event.target.checked }))} /> Snap grid</label>
              <label className="ice-check"><input type="checkbox" checked={!!draft.showWatermark} onChange={(event) => setDraft((current) => ({ ...current, showWatermark: event.target.checked }))} /> Watermark</label>
              <label className="ice-check"><input type="checkbox" checked={draft.status === "active"} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.checked ? "active" : "draft" }))} /> Active template</label>
              <p className="ice-note">{draft.widthMm} × {draft.heightMm} mm. Zoom does not change the printed size. Version {draft.version}.</p>
            </>
          )}
          {!preview && selectedElements.length > 1 && (
            <>
              <h2>{selectedElements.length} selected</h2>
              <div className="ice-chip-list">
                <button type="button" className="ice-chip" onClick={() => align("left")}>Align left</button>
                <button type="button" className="ice-chip" onClick={() => align("hcenter")}>Center</button>
                <button type="button" className="ice-chip" onClick={() => align("right")}>Align right</button>
                <button type="button" className="ice-chip" onClick={() => align("top")}>Align top</button>
                <button type="button" className="ice-chip" onClick={() => align("vcenter")}>Middle</button>
                <button type="button" className="ice-chip" onClick={() => align("bottom")}>Align bottom</button>
              </div>
            </>
          )}
          {!preview && activeElement && (
            <>
              <h2>{activeElement.name}</h2>
              {activeElement.type === "text" && !activeElement.field && (
                <label className="ice-field">Text<textarea value={activeElement.text} onChange={(event) => patchElement(activeElement.id, { text: event.target.value })} /></label>
              )}
              {activeElement.type === "text" && (
                <label className="ice-field">Data field
                  <select value={activeElement.field} onChange={(event) => {
                    const field = event.target.value;
                    patchElement(activeElement.id, { field, showLabel: field ? activeElement.showLabel !== false : false, labelLayout: activeElement.labelLayout || "inline" });
                  }}>
                    <option value="">Static text</option>
                    {fields.map((field) => field.kind === "text" && <option key={field.id} value={field.id}>{field.label}</option>)}
                    <option value="schoolAddress">School address</option>
                    <option value="schoolPhone">School phone</option>
                    <option value="schoolWebsite">School website</option>
                    <option value="motto">School motto</option>
                  </select>
                </label>
              )}
              {activeElement.type === "text" && !!activeElement.field && (
                <>
                  <label className="ice-check">
                    <input type="checkbox" checked={activeElement.showLabel !== false} onChange={(event) => patchElement(activeElement.id, { showLabel: event.target.checked, labelLayout: activeElement.labelLayout || "inline" })} />
                    Show label
                  </label>
                  {activeElement.showLabel !== false && (
                    <>
                      <label className="ice-field">Label
                        <input value={activeElement.name} onChange={(event) => patchElement(activeElement.id, { name: event.target.value })} />
                      </label>
                      <label className="ice-field">Label layout
                        <select value={activeElement.labelLayout || "inline"} onChange={(event) => {
                          const labelLayout = event.target.value;
                          patchElement(activeElement.id, { labelLayout, h: labelLayout === "stacked" && activeElement.h < 16 ? 16 : activeElement.h });
                        }}>
                          <option value="inline">Inline</option>
                          <option value="stacked">Label above</option>
                          <option value="beside">Label beside</option>
                        </select>
                      </label>
                    </>
                  )}
                </>
              )}
              {activeElement.type === "text" && (
                <>
                  <label className="ice-field">Font
                    <select value={activeElement.fontFamily} onChange={(event) => patchElement(activeElement.id, { fontFamily: event.target.value })}>
                      <option value="helvetica">Helvetica</option>
                      <option value="times">Times</option>
                      <option value="courier">Courier</option>
                    </select>
                  </label>
                  <div className="ice-row">
                    <NumField label="Size mm" step="0.1" value={activeElement.fontSizeMm} onValue={(fontSizeMm) => patchElement(activeElement.id, { fontSizeMm })} />
                    <label className="ice-field">Colour<input type="color" value={activeElement.color} onChange={(event) => patchElement(activeElement.id, { color: event.target.value })} /></label>
                  </div>
                  <label className="ice-check"><input type="checkbox" checked={activeElement.fontWeight >= 700} onChange={(event) => patchElement(activeElement.id, { fontWeight: event.target.checked ? 700 : 500 })} /> Bold</label>
                  <label className="ice-check"><input type="checkbox" checked={activeElement.italic} onChange={(event) => patchElement(activeElement.id, { italic: event.target.checked })} /> Italic</label>
                  <label className="ice-check"><input type="checkbox" checked={activeElement.underline} onChange={(event) => patchElement(activeElement.id, { underline: event.target.checked })} /> Underline</label>
                  <label className="ice-field">Align
                    <select value={activeElement.align} onChange={(event) => patchElement(activeElement.id, { align: event.target.value })}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                  <label className="ice-field">Transform
                    <select value={activeElement.transform} onChange={(event) => patchElement(activeElement.id, { transform: event.target.value })}>
                      <option value="none">Normal</option>
                      <option value="uppercase">Uppercase</option>
                      <option value="lowercase">Lowercase</option>
                    </select>
                  </label>
                </>
              )}
              {(activeElement.type === "shape" || activeElement.type === "photo" || activeElement.type === "logo" || activeElement.type === "image") && (
                <>
                  <label className="ice-field">Fill<input type="color" value={toColor(activeElement.fill)} onChange={(event) => patchElement(activeElement.id, { fill: event.target.value })} /></label>
                  <label className="ice-field">Border<input type="color" value={toColor(activeElement.stroke)} onChange={(event) => patchElement(activeElement.id, { stroke: event.target.value })} /></label>
                  <NumField label="Border thickness" value={activeElement.strokeWidth} onValue={(strokeWidth) => patchElement(activeElement.id, { strokeWidth })} />
                </>
              )}
              {activeElement.type === "image" && (
                <label className="ice-field">Replace image
                  <input type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0], (src) => patchElement(activeElement.id, { src }))} />
                </label>
              )}
              {(activeElement.type === "photo" || activeElement.type === "image") && (
                <>
                  <label className="ice-field">Fit
                    <select value={activeElement.fit} onChange={(event) => patchElement(activeElement.id, { fit: event.target.value })}>
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </label>
                  <label className="ice-check"><input type="checkbox" checked={activeElement.grayscale} onChange={(event) => patchElement(activeElement.id, { grayscale: event.target.checked })} /> Grayscale</label>
                  <NumField label="Corner radius" value={activeElement.radius} onValue={(radius) => patchElement(activeElement.id, { radius })} />
                </>
              )}
              {(activeElement.type === "qr" || activeElement.type === "barcode") && (
                <p className="ice-note">The code stores only the admission or employee ID, so a scan can check the card without exposing other personal details.</p>
              )}
              <div className="ice-row">
                <NumField label="X" value={Math.round(activeElement.x)} onValue={(x) => patchElement(activeElement.id, { x })} />
                <NumField label="Y" value={Math.round(activeElement.y)} onValue={(y) => patchElement(activeElement.id, { y })} />
                <NumField label="Width" value={Math.round(activeElement.w)} onValue={(w) => patchElement(activeElement.id, { w })} />
                <NumField label="Height" value={Math.round(activeElement.h)} onValue={(h) => patchElement(activeElement.id, { h })} />
              </div>
              <NumField label="Rotation" value={activeElement.rotation} onValue={(rotation) => patchElement(activeElement.id, { rotation })} />
              <NumField label="Opacity" min="0.1" max="1" step="0.05" value={activeElement.opacity} onValue={(opacity) => patchElement(activeElement.id, { opacity })} />
              <label className="ice-check"><input type="checkbox" checked={activeElement.hidden} onChange={(event) => patchElement(activeElement.id, { hidden: event.target.checked })} /> Hidden</label>
              <label className="ice-check"><input type="checkbox" checked={activeElement.locked} onChange={(event) => patchElement(activeElement.id, { locked: event.target.checked })} /> Locked</label>
              <button type="button" className="ice-btn" onClick={removeSelected}>Delete</button>
            </>
          )}
          </div>
        </aside>
      </div>

      <nav className="ice-dock" aria-label="Editor panels">
        <button type="button" className={sheet === "rail" && railTab === "elements" ? "on" : ""} onClick={() => openSheet("elements")}>Elements</button>
        <button type="button" className={sheet === "rail" && railTab === "templates" ? "on" : ""} onClick={() => openSheet("templates")}>Templates</button>
        <button type="button" className={sheet === "props" ? "on" : ""} onClick={() => openSheet("props")}>Properties</button>
      </nav>
      <footer className="ice-bottom">
        <span className="ice-size">{draft.widthMm.toFixed(2)} × {draft.heightMm.toFixed(2)} mm</span>
        <div className="ice-zoom">
          <div className="ice-zoom-step">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.35, value - 0.1))} aria-label="Zoom out">−</button>
            <strong>{Math.round(zoom * 100)}%</strong>
            <button type="button" onClick={() => setZoom((value) => Math.min(2.5, value + 0.1))} aria-label="Zoom in">+</button>
          </div>
          <button type="button" className="ice-btn" onClick={fit}>Fit</button>
          <button type="button" className="ice-btn" onClick={() => setZoom(1)}>Reset zoom</button>
        </div>
      </footer>

      {ask && (
        <div className="ice-pop" onClick={() => setAsk(null)}>
          <div className="ice-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <p>{ask.message}</p>
            <div className="ice-dialog-actions">
              <button type="button" className="ice-btn" onClick={() => setAsk(null)}>Cancel</button>
              <button type="button" className="ice-save" onClick={() => { const action = ask.action; setAsk(null); action(); }}> {ask.confirmLabel}</button>
            </div>
          </div>
        </div>
      )}
      {printOpen && (
        <div className="ice-pop" onClick={() => setPrintOpen(false)}>
          <div className="ice-print" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Print preview</h2>
            <p className="ice-note">Shown at the card’s physical size of {draft.widthMm} × {draft.heightMm} mm.</p>
            <div className="ice-print-sheet">
              <div style={{ width: `${draft.widthMm}mm`, height: `${draft.heightMm}mm` }}>
                <CardSurface template={draft} side={side} person={person} school={school} extras={extras} preview />
              </div>
            </div>
            <button type="button" className="ice-btn" onClick={() => setPrintOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

function toColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#111111";
}

function selectField(event) {
  const input = event.currentTarget;
  requestAnimationFrame(() => input.select());
}

function readTypedNumber(event, fallback = 0) {
  const input = event.target;
  let text = input.value;
  if (text === "" || text === "-" || text === "." || text === "-.") return fallback;
  const stripped = text.replace(/^(-?)0+(?=\d)/, "$1");
  if (stripped !== text) input.value = stripped;
  const n = Number(stripped);
  return Number.isFinite(n) ? n : fallback;
}

function NumField({ label, value, onValue, step, min, max }) {
  return (
    <label className="ice-field">
      {label}
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onFocus={selectField}
        onChange={(event) => onValue(readTypedNumber(event, value))}
      />
    </label>
  );
}

function UNIQUE_FIELDS_SAFE(row) {
  return ["photo", "schoolLogo", "qr", "barcode"].includes(row.field);
}

export default IdCardTemplatePage;
