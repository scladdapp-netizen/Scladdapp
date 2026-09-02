import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import DocsSectionIcon from "./DocsSectionIcon";
import DocsContentBlocks from "./DocsContentBlocks";
import { getTopicBlocks, getStepBlocks, topicSearchText } from "./docsBlocksUtils";
import "./Docs.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:1234";

function DocsStatusPanel({ type, message, onRetry }) {
  const isLoading = type === "loading";

  return (
    <div className={`docs-pg__status docs-pg__status--${type}`}>
      {isLoading ? (
        <div className="docs-pg__spinner" aria-hidden="true" />
      ) : (
        <svg className="docs-pg__status-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <line x1="1" y1="1" x2="23" y2="23" />
          <path d="M16.72 11.06a10.94 10.94 0 0 1 1.78 2.88" />
          <path d="M5 12.55a11 11 0 0 1 .9-3.11" />
          <path d="M8.53 16.11a6 6 0 0 1 2.31-1.18" />
          <path d="M12 20h.01" />
          <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
          <path d="M10.66 5.05a16 16 0 0 1 4.34 0" />
          <path d="M19.91 11.5a15.91 15.91 0 0 0-1.78-2.88" />
        </svg>
      )}
      <h2>{isLoading ? "Loading documentation" : "No network connection"}</h2>
      <p>{message}</p>
      {!isLoading && onRetry && (
        <button type="button" className="docs-pg__retry-btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

const Docs = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [docsContent, setDocsContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [headerDark, setHeaderDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bodyRef = useRef(null);
  const heroRef = useRef(null);

  const loadDocs = useCallback(() => {
    setLoading(true);
    setError(null);

    return fetch(`${API_BASE}/api/docs`)
      .then((r) => {
        if (!r.ok) throw new Error("network");
        return r.json();
      })
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setDocsContent(res.data);
          setError(null);
        } else {
          setDocsContent([]);
          setError(res.message || "Documentation is unavailable right now.");
        }
      })
      .catch(() => {
        setDocsContent([]);
        setError("Unable to reach the server. Check your internet connection and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const firstItem = docsContent[0]?.items?.[0];
  const allItems = docsContent.flatMap((s) => s.items);
  const activeItem = allItems.find((i) => i.id === topicId);

  const handleSelect = (id) => {
    navigate(`/docs/${id}`);
    setSearch("");
    setSidebarOpen(false);
  };

  useEffect(() => {
    if (!topicId || loading) return;
    bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [topicId, loading]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = search.trim()
    ? allItems.filter((item) => topicSearchText(item).includes(search.toLowerCase()))
    : null;

  if (!loading && !error && !activeItem && firstItem) {
    return <Navigate to={`/docs/${firstItem.id}`} replace />;
  }

  return (
    <div className="docs-pg">
      <PublicHeader dark={headerDark} />

      {/* Hero */}
      <div className="docs-pg__hero" ref={heroRef}>
        <span className="docs-pg__tag">Documentation</span>
        <h1>Everything you need to build with Scladapp</h1>
        <p>Guides, references, and tutorials to get your school up and running.</p>
      </div>

      {loading ? (
        <div className="docs-pg__body docs-pg__body--status">
          <DocsStatusPanel
            type="loading"
            message="Please wait while we load the guides…"
          />
        </div>
      ) : error ? (
        <div className="docs-pg__body docs-pg__body--status">
          <DocsStatusPanel
            type="error"
            message={error}
            onRetry={loadDocs}
          />
        </div>
      ) : (
        <div className="docs-pg__body" ref={bodyRef}>
        <button
          type="button"
          className="docs-pg__sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-expanded={sidebarOpen}
          aria-controls="docs-sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          Browse docs
        </button>

        {sidebarOpen && (
          <button
            type="button"
            className="docs-pg__sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          id="docs-sidebar"
          className={`docs-pg__sidebar${sidebarOpen ? " docs-pg__sidebar--open" : ""}`}
        >
          <div className="docs-pg__sidebar-header">
            <span>Documentation</span>
            <button
              type="button"
              className="docs-pg__sidebar-close"
              aria-label="Close navigation"
              onClick={() => setSidebarOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          {docsContent.map((section) => (
            <div key={section.section} className="docs-pg__sidebar-section">
              <div className="docs-pg__sidebar-heading">
                <DocsSectionIcon name={section.icon} />
                <h4>{section.section}</h4>
              </div>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to={`/docs/${item.id}`}
                      className={`docs-pg__sidebar-link${topicId === item.id ? " active" : ""}`}
                      onClick={() => {
                        setSearch("");
                        setSidebarOpen(false);
                      }}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="docs-pg__content">
          {activeItem && (
            <>
              {/* Breadcrumb */}
              <div className="docs-pg__breadcrumb">
                {docsContent.find((s) => s.items.some((i) => i.id === activeItem.id))?.section}
                <span> / </span>
                {activeItem.title}
              </div>

              <h1 className="docs-pg__content-title">{activeItem.title}</h1>

              <DocsContentBlocks blocks={getTopicBlocks(activeItem)} className="docs-pg__content-blocks" />

              {/* Steps */}
              {activeItem.steps && (
                <div className="docs-pg__steps">
                  {activeItem.steps.map((s, i) => (
                    <div key={i} className="docs-pg__step">
                      <div className="docs-pg__step-num">{i + 1}</div>
                      <div className="docs-pg__step-body">
                        <h4>{s.step}</h4>
                        <DocsContentBlocks blocks={getStepBlocks(s)} className="docs-pg__step-blocks" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Callout */}
              {activeItem.callout && (
                <div className="docs-pg__callout">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  {activeItem.callout}
                </div>
              )}

              {/* Prev / Next nav */}
              <div className="docs-pg__nav">
                {(() => {
                  const idx = allItems.findIndex((i) => i.id === topicId);
                  const prev = allItems[idx - 1];
                  const next = allItems[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <Link className="docs-pg__nav-btn docs-pg__nav-btn--prev" to={`/docs/${prev.id}`}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                          <span><small>Previous</small>{prev.title}</span>
                        </Link>
                      ) : <div />}
                      {next ? (
                        <Link className="docs-pg__nav-btn docs-pg__nav-btn--next" to={`/docs/${next.id}`}>
                          <span><small>Next</small>{next.title}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </Link>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </main>
        </div>
      )}

      <div className="docs-pg__footer">
        <Footer />
      </div>
    </div>
  );
};

export default Docs;
