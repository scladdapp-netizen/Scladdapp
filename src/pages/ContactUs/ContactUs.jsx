import { useState } from "react";
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
    ),
    label: "Call us",
    value: "+234 800 123 4567",
    sub: "Mon – Fri, 9am – 6pm WAT",
    href: "tel:+2348001234567",
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
  const { sendMessage } = useContact();

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
      <PublicHeader dark />

      {/* Hero */}
      <div className="ct-pg__hero">
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
                  ? <a className="ct-pg__channel-value" href={c.href}>{c.value}</a>
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

          <div className="ct-pg__aside-block">
            <h3>Follow us</h3>
            <div className="ct-pg__socials">
              <a href="#" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
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
