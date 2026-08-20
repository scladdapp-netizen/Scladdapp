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
        title="Help &amp; Report"
      >
        <button className="fbw_dismiss" onClick={handleDismiss} aria-label="Dismiss">
          ×
        </button>
        <div className="fbw_icon">
          {/* headset / customer service */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3C7.58 3 4 6.58 4 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M20 11v1" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
            <rect x="2" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
            <rect x="18" y="12" width="4" height="6" rx="2" fill="white" opacity="0.9"/>
            <path d="M20 17.5C20 19.43 18.43 21 16.5 21H13" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
            <circle cx="12" cy="21" r="1.3" fill="white"/>
          </svg>
        </div>
        <span className="fbw_label">Help &amp; Report</span>
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
