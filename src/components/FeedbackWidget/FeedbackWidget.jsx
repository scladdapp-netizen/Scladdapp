import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import FeedbackPanel from "../FeedbackPanel/FeedbackPanel";
import { useAuth } from "../../context/AuthContext/AuthContext";
import "./FeedbackWidget.css";

const STORAGE_KEY = "fbw_dismissed";
const POS_KEY     = "fbw_pos";

const FeedbackWidget = () => {
  const { user } = useAuth();

  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(STORAGE_KEY) === "true"
  );
  const [panelOpen, setPanelOpen] = useState(false);

  // Position — default: right edge, vertically centered-ish
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        // Clamp to current viewport in case screen size changed
        return {
          x: Math.max(0, Math.min(window.innerWidth  - 180, p.x)),
          y: Math.max(0, Math.min(window.innerHeight -  48, p.y)),
        };
      }
    } catch {}
    return { x: window.innerWidth - 200, y: Math.round(window.innerHeight * 0.55) };
  });

  const dragging  = useRef(false);
  const hasMoved  = useRef(false);
  const offset    = useRef({ x: 0, y: 0 });
  const widgetRef = useRef(null);
  const [glowing, setGlowing] = useState(false);

  // Glow every 60 seconds for 2.5 seconds
  useEffect(() => {
    const trigger = () => {
      setGlowing(true);
      setTimeout(() => setGlowing(false), 2500);
    };
    trigger(); // glow once on mount too
    const id = setInterval(trigger, 60000);
    return () => clearInterval(id);
  }, []);

  // Persist position
  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(pos));
  }, [pos]);

  const onPointerDown = (e) => {
    dragging.current = true;
    hasMoved.current = false;
    offset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    widgetRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;
    hasMoved.current = true;
    const el = widgetRef.current;
    const w  = el ? el.offsetWidth  : 48;
    const h  = el ? el.offsetHeight : 48;
    const nx = Math.max(0, Math.min(window.innerWidth  - w, e.clientX - offset.current.x));
    const ny = Math.max(0, Math.min(window.innerHeight - h, e.clientY - offset.current.y));
    setPos({ x: nx, y: ny });
  };

  const onPointerUp = (e) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!hasMoved.current) {
      // It was a tap/click, not a drag
      setPanelOpen(true);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed) return null;

  const staff   = user?.staff   || user?.teacher || {};
  const admin   = user?.admin   || {};
  const student = user?.student || {};
  const school  = user?.school  || {};

  const isAdmin   = !!user?.admin;
  const isStudent = !!user?.student;
  const userType  = isAdmin ? (user?.current_role || "admin") : isStudent ? "student" : "teacher";
  const userId    = admin?.admin_id || staff?.staff_id || student?.student_id || "";
  const userName  = admin?.full_name || staff?.full_name || student?.full_name || "User";
  const userEmail = admin?.email || staff?.email || student?.email;

  return createPortal(
    <>
      <div
        ref={widgetRef}
        className={`fbw_widget${glowing ? " fbw_glow" : ""}`}
        style={{ left: pos.x, top: pos.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="Help us improve"
      >
        <button className="fbw_dismiss" onClick={handleDismiss} aria-label="Dismiss">
          ×
        </button>
        <div className="fbw_icon">
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
            <path d="M11 3l8 4-8 4-8-4 8-4z" fill="white" opacity="0.35" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
            <circle cx="15" cy="15" r="4" fill="white" opacity="0.2" stroke="white" strokeWidth="1.4"/>
            <path d="M15 13v2.2M15 16.8h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="fbw_label">Help us improve</span>
      </div>

      <FeedbackPanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        userType={userType}
        userId={userId}
        userName={userName}
        userEmail={userEmail}
        schoolId={school?.school_id}
        schoolName={school?.school_name}
      />
    </>,
    document.body
  );
};

export default FeedbackWidget;
