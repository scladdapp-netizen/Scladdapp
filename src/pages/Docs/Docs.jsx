import { useState, useEffect, useRef } from "react";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import docsContent from "./docsContent.json";
import "./Docs.css";

const Docs = () => {
  const firstItem = docsContent[0].items[0];
  const [activeId, setActiveId] = useState(firstItem.id);
  const [search, setSearch] = useState("");
  const [headerDark, setHeaderDark] = useState(true);
  const contentRef = useRef(null);
  const bodyRef = useRef(null);
  const heroRef = useRef(null);

  const allItems = docsContent.flatMap((s) => s.items);

  const filtered = search.trim()
    ? allItems.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const activeItem = allItems.find((i) => i.id === activeId);

  const handleSelect = (id) => {
    setActiveId(id);
    setSearch("");
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Switch header to light when the body section scrolls under the header (64px)
  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="docs-pg">
      <PublicHeader dark={headerDark} />

      {/* Hero */}
      <div className="docs-pg__hero" ref={heroRef}>
        <span className="docs-pg__tag">Documentation</span>
        <h1>Everything you need to build with Scladapp</h1>
        <p>Guides, references, and tutorials to get your school up and running.</p>
     

        {/* Search results dropdown */}
        {filtered && (
          <div className="docs-pg__search-results">
            {filtered.length === 0 ? (
              <div className="docs-pg__search-empty">No results for "{search}"</div>
            ) : (
              filtered.map((item) => (
                <button key={item.id} className="docs-pg__search-result" onClick={() => handleSelect(item.id)}>
                  <span className="docs-pg__search-result-title">{item.title}</span>
                  <span className="docs-pg__search-result-preview">{item.content.slice(0, 80)}…</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="docs-pg__body">
        {/* Sidebar */}
        <aside className="docs-pg__sidebar">
          {docsContent.map((section) => (
            <div key={section.section} className="docs-pg__sidebar-section">
              <div className="docs-pg__sidebar-heading">
                <span>{section.icon}</span>
                <h4>{section.section}</h4>
              </div>
              <ul>
                {section.items.map((item) => (
                  <li key={item.id}>
                    <button
                      className={`docs-pg__sidebar-link${activeId === item.id ? " active" : ""}`}
                      onClick={() => handleSelect(item.id)}
                    >
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main content */}
        <main className="docs-pg__content" ref={contentRef}>
          {activeItem && (
            <>
              {/* Breadcrumb */}
              <div className="docs-pg__breadcrumb">
                {docsContent.find((s) => s.items.some((i) => i.id === activeItem.id))?.section}
                <span> / </span>
                {activeItem.title}
              </div>

              <h1 className="docs-pg__content-title">{activeItem.title}</h1>
              <p className="docs-pg__content-lead">{activeItem.content}</p>

              {/* Video preview */}
              {activeItem.video && (
                <div className="docs-pg__video-wrap">
                  <div className="docs-pg__video-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    {activeItem.video.title}
                  </div>
                  <div className="docs-pg__video-frame">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeItem.video.youtubeId}`}
                      title={activeItem.video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Steps */}
              {activeItem.steps && (
                <div className="docs-pg__steps">
                  {activeItem.steps.map((s, i) => (
                    <div key={i} className="docs-pg__step">
                      <div className="docs-pg__step-num">{i + 1}</div>
                      <div className="docs-pg__step-body">
                        <h4>{s.step}</h4>
                        <p>{s.desc}</p>
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
                  const idx = allItems.findIndex((i) => i.id === activeId);
                  const prev = allItems[idx - 1];
                  const next = allItems[idx + 1];
                  return (
                    <>
                      {prev ? (
                        <button className="docs-pg__nav-btn docs-pg__nav-btn--prev" onClick={() => handleSelect(prev.id)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                          <span><small>Previous</small>{prev.title}</span>
                        </button>
                      ) : <div />}
                      {next ? (
                        <button className="docs-pg__nav-btn docs-pg__nav-btn--next" onClick={() => handleSelect(next.id)}>
                          <span><small>Next</small>{next.title}</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </button>
                      ) : <div />}
                    </>
                  );
                })()}
              </div>
            </>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Docs;
