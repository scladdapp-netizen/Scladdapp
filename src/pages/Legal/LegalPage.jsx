import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import "./LegalPage.css";

/**
 * Shared shell for Terms / Privacy pages.
 * sections: [{ id, title, body: string | string[] }]
 */
export default function LegalPage({ tag, title, updated, intro, sections, otherLink }) {
  const [headerDark, setHeaderDark] = useState(true);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="legal-pg">
      <PublicHeader dark={headerDark} />

      <div className="legal-pg__hero" ref={heroRef}>
        <span className="legal-pg__tag">{tag}</span>
        <h1>{title}</h1>
        <p>Last updated: {updated}</p>
      </div>

      <div className="legal-pg__body">
        <aside className="legal-pg__toc" aria-label="On this page">
          <h2>On this page</h2>
          <nav>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>{s.title}</a>
            ))}
          </nav>
          {otherLink && (
            <Link className="legal-pg__other" to={otherLink.to}>
              {otherLink.label}
            </Link>
          )}
        </aside>

        <article className="legal-pg__content">
          {intro && <p className="legal-pg__intro">{intro}</p>}

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="legal-pg__section">
              <h2>{s.title}</h2>
              {Array.isArray(s.body)
                ? s.body.map((p, i) => <p key={i}>{p}</p>)
                : <p>{s.body}</p>}
              {s.list && (
                <ul>
                  {s.list.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <p className="legal-pg__contact">
            Questions about this policy? Contact us at{" "}
            <a href="mailto:support@scladapp.com">support@scladapp.com</a>
            {" "}or visit our <Link to="/contact">Contact</Link> page.
          </p>
        </article>
      </div>

      <Footer />
    </div>
  );
}
