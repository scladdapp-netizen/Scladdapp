import { useState, useEffect, useRef } from "react";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import useContact from "../../api_call/useContact";
import "./ContactUs.css";

const CHANNELS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    ),
    label: "Email us",
    value: "support@scladapp.com",
    sub: "We reply within 24 hours",
    href: "mailto:support@scladapp.com",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 22.5l5.4-1.1A11 11 0 0 0 20.5 3.5zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.2.7.7-3.1-.2-.3A9.1 9.1 0 1 1 12 20.5zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.5 11.5 0 0 0 4.4 4 14.7 14.7 0 0 0 1.5.5 3.6 3.6 0 0 0 1.6.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3z"/></svg>
    ),
    label: "WhatsApp",
    value: "+234 708 218 9833",
    sub: "Mon – Fri, 9am – 6pm WAT",
    href: "https://wa.me/2347082189833",
    external: true,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    ),
    label: "Live chat",
    value: "Chat with support",
    sub: "Available during business hours",
    href: "#",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
    label: "Response time",
    value: "Under 24 hours",
    sub: "Average first response",
    href: null,
  },
];

const SUBJECTS = [
  "General Inquiry",
  "Technical Support",
  "Billing & Payments",
  "Feature Request",
  "Partnership",
  "Other",
];

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: SUBJECTS[0], message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [headerDark, setHeaderDark] = useState(true);
  const bodyRef = useRef(null);
  const heroRef = useRef(null);
  const { sendMessage } = useContact();

  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      // go light once the hero's bottom edge scrolls above the header (64px)
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await sendMessage(form);
    setLoading(false);
    if (res.success) {
      setSent(true);
    } else {
      setError(res.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="ct-pg">
      <PublicHeader dark={headerDark} />

      {/* Hero */}
      <div className="ct-pg__hero" ref={heroRef}>
        <span className="ct-pg__tag">Contact Us</span>
        <h1>We're here to help</h1>
        <p>Reach out and we'll get back to you as soon as possible.</p>

        {/* Channel pills */}
        <div className="ct-pg__channels">
          {CHANNELS.map((c) => (
            <div key={c.label} className="ct-pg__channel">
              <span className="ct-pg__channel-icon">{c.icon}</span>
              <div>
                <div className="ct-pg__channel-label">{c.label}</div>
                {c.href
                  ? <a className="ct-pg__channel-value" href={c.href} {...(c.external ? { target: "_blank", rel: "noreferrer" } : {})}>{c.value}</a>
                  : <span className="ct-pg__channel-value">{c.value}</span>
                }
                <div className="ct-pg__channel-sub">{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="ct-pg__body">

        {/* Left — info */}
        <aside className="ct-pg__aside">
          <div className="ct-pg__aside-block">
            <h3>Before you write</h3>
            <p>Check our <a href="/docs">documentation</a> — most questions are answered there.</p>
          </div>

          <div className="ct-pg__aside-block">
            <h3>Office hours</h3>
            <ul className="ct-pg__hours">
              <li><span>Monday – Friday</span><span>9:00 – 18:00</span></li>
              <li><span>Saturday</span><span>10:00 – 14:00</span></li>
              <li><span>Sunday</span><span>Closed</span></li>
            </ul>
          </div>

        </aside>

        {/* Right — form */}
        <div className="ct-pg__form-wrap">
          {sent ? (
            <div className="ct-pg__success">
              <div className="ct-pg__success-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3>Message sent</h3>
              <p>Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within 24 hours.</p>
              <button className="ct-pg__reset" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: SUBJECTS[0], message: "" }); }}>
                Send another message
              </button>
            </div>
          ) : (
            <form className="ct-pg__form" onSubmit={handleSubmit}>
              <div className="ct-pg__form-header">
                <h2>Send a message</h2>
                <p>Fill in the form and we'll be in touch shortly.</p>
              </div>

              <div className="ct-pg__row">
                <div className="ct-pg__field">
                  <label>Full name</label>
                  <input name="name" value={form.name} onChange={set("name")} placeholder="John Doe" required />
                </div>
                <div className="ct-pg__field">
                  <label>Email address</label>
                  <input type="email" name="email" value={form.email} onChange={set("email")} placeholder="you@example.com" required />
                </div>
              </div>

              <div className="ct-pg__field">
                <label>Subject</label>
                <select name="subject" value={form.subject} onChange={set("subject")}>
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="ct-pg__field">
                <label>Message</label>
                <textarea name="message" value={form.message} onChange={set("message")} rows={6} placeholder="Tell us how we can help..." required />
              </div>

              {error && <p className="ct-pg__error">{error}</p>}
              <button type="submit" className={`ct-pg__submit${loading ? " loading" : ""}`} disabled={loading}>
                {loading
                  ? <><span className="ct-pg__spinner" />Sending…</>
                  : <>Send message <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                }
              </button>            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactUs;
