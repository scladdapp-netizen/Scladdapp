import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTutorialVideos } from "../../../../../api_call/useTutorialVideos";
import "./SetupSchoolVideo.css";

const clampPosition = (x, y, width, height) => ({
  x: Math.max(0, Math.min(window.innerWidth - width, x)),
  y: Math.max(0, Math.min(window.innerHeight - height, y)),
});

const getDefaultPosition = (corner, width = 420, height = 150) =>
  clampPosition(
    corner === "bottom-left" ? 24 : window.innerWidth - width - 24,
    window.innerHeight - height - 20,
    width,
    height
  );

const SetupSchoolVideo = ({
  page = "",
  corner = "bottom-right",
  // each placement remembers where it was dragged to on its own
  storageKey = "ssv_pos",
  footerText = "Keep this open while you work in admin.",
  collapsedText = "Watch the setup guide while you configure your school dashboard.",
}) => {
  const location = useLocation();
  const { videos } = useTutorialVideos(page);
  const wrapRef = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const timerRef = useRef(null);

  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const p = JSON.parse(saved);
        return clampPosition(p.x, p.y, p.w || 420, p.h || 150);
      }
    } catch {}
    return getDefaultPosition(corner);
  });

  posRef.current = pos;

  const isAdminDashboard = /^\/admin\/[^/]+/.test(location.pathname);

  useEffect(() => {
    if (active >= videos.length) {
      setActive(0);
      setPlaying(false);
    }
  }, [active, videos.length]);

  useEffect(() => {
    if (playing || videos.length <= 1) return undefined;
    timerRef.current = setTimeout(() => {
      setActive((prev) => (prev + 1) % videos.length);
    }, 6000);
    return () => clearTimeout(timerRef.current);
  }, [active, playing, videos.length]);

  useEffect(() => {
    const el = wrapRef.current;
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        x: pos.x,
        y: pos.y,
        w: el?.offsetWidth,
        h: el?.offsetHeight,
      })
    );
  }, [pos, storageKey]);

  useEffect(() => {
    const onResize = () => {
      const el = wrapRef.current;
      if (!el) return;
      setPos((current) =>
        clampPosition(current.x, current.y, el.offsetWidth, el.offsetHeight)
      );
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isAdminDashboard || dismissed) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    setPlaying(false);
  };

  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded(true);
  };

  const handleCollapse = (e) => {
    e.stopPropagation();
    setExpanded(false);
  };

  const handlePlay = (e) => {
    e.stopPropagation();
    setExpanded(true);
    setPlaying(true);
  };

  const goTo = (idx) => {
    setActive(idx);
    setPlaying(false);
  };

  const next = () => goTo((active + 1) % videos.length);
  const prev = () => goTo((active - 1 + videos.length) % videos.length);

  const onPointerDown = (e) => {
    if (!e.target.closest(".setup-school-video__header")) return;
    if (e.target.closest("button")) return;

    dragging.current = true;
    setIsDragging(true);
    offset.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
    wrapRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current) return;

    const el = wrapRef.current;
    const width = el?.offsetWidth ?? 420;
    const height = el?.offsetHeight ?? 150;

    setPos(
      clampPosition(
        e.clientX - offset.current.x,
        e.clientY - offset.current.y,
        width,
        height
      )
    );
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setIsDragging(false);
  };

  const showPlayer = expanded || playing;
  const video = videos[active];
  if (!isAdminDashboard || dismissed || !video) return null;

  const thumb = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const panelClass = expanded
    ? "setup-school-video--expanded"
    : playing
      ? "setup-school-video--compact"
      : "setup-school-video--collapsed";

  return createPortal(
    <div
      ref={wrapRef}
      className={`setup-school-video-wrap${isDragging ? " setup-school-video-wrap--dragging" : ""}`}
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="setup-school-video__wave" aria-hidden="true" />
      <span className="setup-school-video__wave setup-school-video__wave--delay" aria-hidden="true" />
      <div
        className={`setup-school-video ${panelClass}`}
        role="complementary"
        aria-label="School setup video guide"
      >
        <div className="setup-school-video__header" title="Drag to move">
          <div className="setup-school-video__title-wrap">
            <span className="setup-school-video__drag-handle" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
            </span>
            <span className="setup-school-video__icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </span>
            <div>
              <span className="setup-school-video__title">{video.title}</span>
              <span className="setup-school-video__subtitle">
                {video.category || "Tutorial"}{video.duration ? ` · ${video.duration}` : ""}
              </span>
            </div>
          </div>

          <div className="setup-school-video__actions">
            {expanded ? (
              <button
                type="button"
                className="setup-school-video__btn"
                onClick={handleCollapse}
                aria-label="Minimize video"
                title="Minimize"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9h12M6 15h12" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                className="setup-school-video__btn"
                onClick={handleExpand}
                aria-label={playing ? "Expand video" : "Expand panel"}
                title="Expand"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="setup-school-video__btn setup-school-video__btn--close"
              onClick={handleDismiss}
              aria-label="Close setup video"
              title="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {showPlayer ? (
          <>
            <div className="setup-school-video__player">
              {playing ? (
                <iframe
                  className="setup-school-video__iframe"
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" className="setup-school-video__thumb-wrap" onClick={() => setPlaying(true)}>
                  <img
                    src={thumb}
                    alt={video.title}
                    className="setup-school-video__thumb"
                  />
                  <span className="setup-school-video__thumb-overlay">
                    <span className="setup-school-video__play-btn" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </button>
              )}
            </div>
            <div className="setup-school-video__meta">
              <div className="setup-school-video__meta-top">
                <span className="setup-school-video__badge">{video.category || "Tutorial"}</span>
                {video.duration && <span className="setup-school-video__duration">{video.duration}</span>}
              </div>
              <p className="setup-school-video__desc">
                {video.description || "Watch this guide while you work in the admin dashboard."}
              </p>
            </div>
            {videos.length > 1 && (
              <div className="setup-school-video__controls">
                <button type="button" className="setup-school-video__nav-btn" onClick={prev} aria-label="Previous video">‹</button>
                <div className="setup-school-video__dots">
                  {videos.map((item, index) => (
                    <button
                      key={`${item.youtubeId}-${index}`}
                      type="button"
                      className={`setup-school-video__dot${index === active ? " active" : ""}`}
                      onClick={() => goTo(index)}
                      aria-label={`Open video ${index + 1}`}
                    />
                  ))}
                </div>
                <button type="button" className="setup-school-video__nav-btn" onClick={next} aria-label="Next video">›</button>
              </div>
            )}
            {expanded && (
              <div className="setup-school-video__footer">
                <span>{footerText}</span>
              </div>
            )}
          </>
        ) : (
          <div className="setup-school-video__collapsed-body">
            <p className="setup-school-video__collapsed-text">{collapsedText}</p>
            <button type="button" className="setup-school-video__watch-btn" onClick={handlePlay}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch guide
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SetupSchoolVideo;
