import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import "./Landing.css";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const TYPEWRITER_PHRASES = [
  "Students Stay Informed",
  "Schools Stay Connected",
  "Teachers Stay Organized",
];

const FEATURES = [
  {
    title: "Student Management",
    img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&q=80",
    bullets: ["Student records", "Attendance", "Results", "Promotion history"],
  },
  {
    title: "Staff Management",
    img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=80",
    bullets: ["Teacher profiles", "Salary / payroll", "Assigned classes", "Subjects taught"],
  },
  {
    title: "Timetable System",
    img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=400&q=80",
    bullets: ["Auto timetable generation", "Class schedules", "Teacher schedules"],
  },
  {
    title: "Result & Report Cards",
    img: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=80",
    bullets: ["End-of-term results", "GPA calculation", "Printable report cards"],
  },
  // {
  //   title: "School Fees",
  //   img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
  //   bullets: ["Online payment", "Payment history", "Receipts", "Debt tracking"],
  // },
  {
    title: "Notifications",
    img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80",
    bullets: ["Announcements", "Exam alerts", "Fee reminders", "SMS / email"],
  },
];

const TESTIMONIALS = [
  {
    quote: "Scladapp completely transformed how we manage student records and fees. Setup was under 30 minutes and our staff adopted it immediately.",
    name: "Mrs. Adaeze Okonkwo",
    role: "Principal",
    school: "Greenfield Academy, Lagos",
    initials: "AO",
    color: "#6c5ce7",
  },
  {
    quote: "The timetable generation alone saved us two full days of work every term. Parents love getting fee reminders directly on their phones.",
    name: "Mr. Chidi Eze",
    role: "Head Teacher",
    school: "Bright Stars College, Abuja",
    initials: "CE",
    color: "#00cec9",
  },
  {
    quote: "We switched from spreadsheets to Scladapp and never looked back. Result processing that used to take a week now takes one afternoon.",
    name: "Mrs. Funke Adesanya",
    role: "School Administrator",
    school: "Heritage International School, Ibadan",
    initials: "FA",
    color: "#fd79a8",
  },
];

function CtaTestimonials() {
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState("up");

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection("up");
      setAnimating(true);
      setTimeout(() => {
        setActive(i => (i + 1) % TESTIMONIALS.length);
        setAnimating(false);
      }, 350);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const goTo = (i) => {
    if (i === active) return;
    setDirection(i > active ? "up" : "down");
    setAnimating(true);
    setTimeout(() => {
      setActive(i);
      setAnimating(false);
    }, 350);
  };

  const t = TESTIMONIALS[active];

  return (
    <div className="cta-testimonials">
      <div className="cta-testimonials__label">What schools say</div>
      <div className={`cta-testimonials__card cta-tcard--${animating ? direction : "visible"}`}>
        <svg className="cta-tcard__quote-icon" width="32" height="24" viewBox="0 0 32 24" fill="none">
          <path d="M0 24V14.4C0 6.4 4.267 1.6 12.8 0l1.6 2.4C10.133 3.733 8 6.667 8 10.4V12h6.4V24H0zm17.6 0V14.4C17.6 6.4 21.867 1.6 30.4 0L32 2.4C27.733 3.733 25.6 6.667 25.6 10.4V12H32V24H17.6z" fill="rgba(255,255,255,0.08)"/>
        </svg>
        <p className="cta-tcard__quote">{t.quote}</p>
        <div className="cta-tcard__author">
          <span className="cta-tcard__avatar" style={{ background: t.color }}>{t.initials}</span>
          <div>
            <strong className="cta-tcard__name">{t.name}</strong>
            <span className="cta-tcard__role">{t.role} · {t.school}</span>
          </div>
        </div>
      </div>
      <div className="cta-testimonials__dots">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            className={`cta-tdot${i === active ? " cta-tdot--active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);
  const hWrapperRef = useRef(null);
  const hTrackRef = useRef(null);
  const hProgressRef = useRef(null);
  const h2WrapperRef = useRef(null);
  const h2TrackRef = useRef(null);
  const h3WrapperRef = useRef(null);
  const h3TrackRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState("monthly");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscription/plans`)
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.data); })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const getPrice = (plan) => {
    if (plan.plan_type === "Free") return "Free";
    const multiplier = billingCycle === "monthly" ? 1 : billingCycle === "quarterly" ? 3 : 12;
    const base = billingCycle === "monthly" ? plan.monthly_price
      : billingCycle === "quarterly" ? plan.quataly_price
      : plan.yearly_price;
    // mark up 3x for display
    const marked = Math.ceil(Number(base) * 3 / 100) * 100;
    return `₦${marked.toLocaleString()}`;
  };

  const getPeriod = () =>
    billingCycle === "monthly" ? "/mo" : billingCycle === "quarterly" ? "/qtr" : "/yr";

  const handleSelectPlan = (plan) => {
    navigate("/setup/1", { state: { plan } });
  };

  // Horizontal scroll handler
  useEffect(() => {
    const wrapper = hWrapperRef.current;
    const track = hTrackRef.current;

    const updateHeight = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) {
        wrapper.style.height = "auto";
        track.style.transform = "translateX(0)";
        const sticky = wrapper.querySelector(".hscroll-sticky");
        if (sticky) sticky.style.opacity = "1";
      } else {
        wrapper.style.height = `${FEATURES.length * 100}vh`;
      }
    };

    const onScroll = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) return;
      const rect = wrapper.getBoundingClientRect();
      const progress = -rect.top / (wrapper.offsetHeight - window.innerHeight);
      const move = Math.max(0, Math.min(progress * maxTranslate, maxTranslate));
      track.style.transform = `translateX(-${move}px)`;
      const sticky = wrapper.querySelector(".hscroll-sticky");
      if (sticky) sticky.style.opacity = Math.min(progress / 0.08, 1);
      if (hProgressRef.current) {
        hProgressRef.current.style.width = `${Math.max(0, Math.min(progress * 100, 100))}%`;
      }
    };

    updateHeight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Reverse horizontal scroll handler (Stack 2)
  useEffect(() => {
    const wrapper = h2WrapperRef.current;
    const track = h2TrackRef.current;

    const updateHeight = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) {
        wrapper.style.height = "auto";
        track.style.transform = "translateX(0)";
        const sticky = wrapper.querySelector(".hscroll2-sticky");
        if (sticky) sticky.style.opacity = "1";
      } else {
        wrapper.style.height = `${3 * 100}vh`;
      }
    };

    const onScroll = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) return;
      const rect = wrapper.getBoundingClientRect();
      const progress = -rect.top / (wrapper.offsetHeight - window.innerHeight);
      const move = Math.max(0, Math.min((1 - progress) * maxTranslate, maxTranslate));
      track.style.transform = `translateX(-${move}px)`;
      const sticky = wrapper.querySelector(".hscroll2-sticky");
      if (sticky) sticky.style.opacity = Math.min(progress / 0.08, 1);
    };

    updateHeight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  // Pricing horizontal scroll (left-to-right, same direction as section 1)
  useEffect(() => {
    const wrapper = h3WrapperRef.current;
    const track = h3TrackRef.current;

    const updateHeight = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) {
        // all cards fit — no scroll needed, collapse to normal height
        wrapper.style.height = "auto";
        track.style.transform = "translateX(0)";
        const sticky = wrapper.querySelector(".pricing-hscroll-sticky");
        if (sticky) sticky.style.opacity = "1";
      } else {
        wrapper.style.height = `${(plans.length || 4) * 100}vh`;
      }
    };

    const onScroll = () => {
      if (!wrapper || !track) return;
      const maxTranslate = track.scrollWidth - window.innerWidth;
      if (maxTranslate <= 0) return; // nothing to scroll
      const rect = wrapper.getBoundingClientRect();
      const progress = -rect.top / (wrapper.offsetHeight - window.innerHeight);
      const move = Math.max(0, Math.min(progress * maxTranslate, maxTranslate));
      track.style.transform = `translateX(-${move}px)`;
      const sticky = wrapper.querySelector(".pricing-hscroll-sticky");
      if (sticky) sticky.style.opacity = Math.min(progress / 0.08, 1);
    };

    updateHeight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateHeight);
    };
  }, [plans]);

  // Header color based on scroll section
  useEffect(() => {
    const header = document.querySelector(".pub-header");
    const onScroll = () => {
      if (!header) return;
      const darkSelectors = [
        hWrapperRef.current,
        h2WrapperRef.current,
        ...Array.from(document.querySelectorAll(".stack-section--3, .stack-section--4, .stack-section--5")),
      ];
      const isDark = darkSelectors.filter(Boolean).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 0 && r.bottom > 0;
      });
      header.classList.toggle("pub-header--white", isDark);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const sections = document.querySelectorAll(".stack-section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.5 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const current = TYPEWRITER_PHRASES[phraseIndex];

    if (!deleting && charIndex <= current.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex));
        setCharIndex((c) => c + 1);
      }, 60);
    } else if (!deleting && charIndex > current.length) {
      timeoutRef.current = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && charIndex >= 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, charIndex));
        setCharIndex((c) => c - 1);
      }, 35);
    } else if (deleting && charIndex < 0) {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % TYPEWRITER_PHRASES.length);
      setCharIndex(0);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [charIndex, deleting, phraseIndex]);

  return (
    <div className="landing">
      <PublicHeader />

      {/* Stacking scroll wrapper starts here — hero is layer 1 */}
      <div className="stack-scroll">

      {/* Hero */}
      <section className="landing__hero ">

        {/* TOP — left-aligned text block */}
        <div className="landing__hero-text">
          <span className="landing__hero-tag">All-In-One School Platform</span>
          <h1>The Smarter Way to <br /> Experience Education</h1>
          <div className="landing__hero-typewriter">
            <span>{displayed}</span>
            <span className="landing__hero-cursor">|</span>
          </div>
          <p>
            A connected platform for students, teachers, and administrators
            to handle everything from academics to communication.
          </p>
          <div className="landing__hero-actions">
            <button className="morph-btn" onClick={() => navigate("/setup/1")}>
              <span className="btn-fill"></span>
              <span className="shadow"></span>
              <span className="btn-text">
                <span style={{"--i":0}}>G</span>
                <span style={{"--i":1}}>e</span>
                <span style={{"--i":2}}>t</span>
                <span style={{"--i":3}} className="btn-space">&nbsp;</span>
                <span style={{"--i":4}}>S</span>
                <span style={{"--i":5}}>t</span>
                <span style={{"--i":6}}>a</span>
                <span style={{"--i":7}}>r</span>
                <span style={{"--i":8}}>t</span>
                <span style={{"--i":9}}>e</span>
                <span style={{"--i":10}}>d</span>
              </span>
              <span className="orbit-dots"><span></span><span></span><span></span><span></span></span>
              <span className="corners"><span></span><span></span><span></span><span></span></span>
            </button>
  
          </div>
        </div>

        {/* BOTTOM — Dashboard screenshot image */}
        <div className="landing__hero-img-wrap">
          {/* Browser chrome bar on top of the image */}
          <div className="lh-browser-bar">
            <span className="lh-browser-dots">
              <span></span><span></span><span></span>
            </span>
            <span className="lh-browser-url">app.scladapp.com/dashboard</span>
          </div>
          <div className="lh-img-frame">
            <img
              src="/dashboard-preview.png"
              alt="Scladapp dashboard preview"
              className="lh-dash-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                e.currentTarget.parentElement.classList.add("lh-img-frame--placeholder");
              }}
            />
          </div>
        </div>
      </section>

        {/* Stack 1 — Horizontal feature scroll */}
        <div
          className="hscroll-wrapper stack-section--1"
          ref={hWrapperRef}
          style={{ height: `${FEATURES.length * 100}vh`, zIndex: 2 }}
        >
          <div className="hscroll-sticky">

            {/* Section title — fixed at top of sticky viewport */}
            <div className="hscroll-header">
              <span className="hscroll-header-tag">Platform Features</span>
              <h2>Everything your school needs</h2>
              <p>One platform to manage it all — no juggling spreadsheets or disconnected tools.</p>
            </div>

            {/* Panels track — timeline line is inside so it scrolls with cards */}
            <div className="hscroll-track" ref={hTrackRef}>

              {/* The continuous timeline line inside the track */}
              <div className="hscroll-inline-line" />

              {FEATURES.map((f, i) => {
                const isUp = i % 2 === 0;
                return (
                  <div key={f.title} className={`hscroll-panel ${isUp ? "hscroll-panel--up" : "hscroll-panel--down"}`}>
                    <div className="hscroll-card">
                      {/* floating orbit dots around card */}
                      <span className="hscroll-card-orbit"><span></span><span></span><span></span><span></span></span>
                      {/* corner accents */}
                      <span className="hscroll-card-corners"><span></span><span></span><span></span><span></span></span>

                      <div className="hscroll-card-imgs">
                        <img src={f.img} alt={f.title} className="hscroll-img" />
                      </div>
                      <div className="hscroll-card-body">
                        <h3>{f.title}</h3>
                        <ul>
                          {f.bullets.map((b) => <li key={b}>{b}</li>)}
                        </ul>
                      </div>
                    </div>

                    {/* SVG curved connector + dot — all same direction (top to bottom) */}
                    <svg
                      className="hscroll-svg-connector"
                      width="40" height="80" viewBox="0 0 40 80"
                      fill="none" xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M20 0 C20 40, 20 40, 20 72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" className="hscroll-svg-path" />
                      <circle cx="20" cy="76" r="5" fill="#fff" stroke="#000" strokeWidth="2" className="hscroll-svg-dot" />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stack 2 — 3 Portals horizontal scroll (reverse direction) */}
        <div
          className="hscroll2-wrapper stack-section--2"
          ref={h2WrapperRef}
          style={{ height: `${3 * 100}vh`, zIndex: 3 }}
        >
          <div className="hscroll2-sticky">
            <div className="hscroll2-header">
              <span className="hscroll2-tag">Three Portals. One Platform.</span>
              <h2>Powerful Features</h2>
              <p>Built for every role in your school.</p>
            </div>
            <div className="hscroll2-track" ref={h2TrackRef}>

              {/* inline timeline line */}
              <div className="hscroll-inline-line" />

              {[
                {
                  key: "student", badge: "Student Portal", accent: "#00cec9",
                  title: "Students Stay Informed Anywhere.",
                  desc: "From exam results to announcements and fees, students access everything from one secure portal.",
                  features: ["Result checking","Notifications","Fee payments","Timetable","Assignments"],
                  visual: "both", store: true,
                },
                {
                  key: "admin", badge: "Admin Portal", accent: "#6c5ce7",
                  title: "Complete Control for School Administrators.",
                  desc: "Command your entire school from one powerful dashboard.",
                  features: ["Student records","Payroll","Finance tracking","Reports","Sessions & terms","Analytics"],
                  visual: "desktop", store: false, center: true,
                },
                {
                  key: "staff", badge: "Staff Portal", accent: "#fd79a8",
                  title: "Teaching Management Made Simple.",
                  desc: "Everything a teacher needs to manage their day — in one clean view.",
                  features: ["Assigned classes","Attendance","Upload scores","Class schedules","Head-of-class management"],
                  visual: "both", store: true,
                },
              ].map((p, i) => {
                const isUp = i % 2 === 0;
                return (
                  <div key={p.key} className={`hscroll-panel ${isUp ? "hscroll-panel--up" : "hscroll-panel--down"}`} style={{ width: 420 }}>
                    <div className={`hscroll-card portal2-card${p.center ? " portal2-card--center" : ""}`} style={{ "--accent": p.accent }}>
                      {/* orbit dots */}
                      <span className="hscroll-card-orbit"><span/><span/><span/><span/></span>
                      {/* corner accents */}
                      <span className="hscroll-card-corners"><span/><span/><span/><span/></span>

                      <span className="portal2-badge" style={{ color: p.accent, borderColor: p.accent }}>{p.badge}</span>
                      <h3 className="portal2-title">{p.title}</h3>
                      <p className="portal2-desc">{p.desc}</p>
                      <ul className="portal2-features">
                        {p.features.map(f => <li key={f}>{f}</li>)}
                      </ul>

                      {/* mockup visual */}
                      {p.visual === "desktop" && (
                        <div className="portal-mockup portal-mockup--desktop" style={{ "--c": p.accent }}>
                          <div className="pm-bar"><span/><span/><span/></div>
                          <div className="pm-screen">
                            <div className="pm-sidebar"><span/><span/><span/><span/><span/></div>
                            <div className="pm-content">
                              <div className="pm-stat-row"><div className="pm-stat"/><div className="pm-stat"/><div className="pm-stat"/></div>
                              <div className="pm-chart"/>
                              <div className="pm-table"><div/><div/><div/><div/></div>
                            </div>
                          </div>
                        </div>
                      )}
                      {p.visual === "phone" && (
                        <div className="portal-mockup portal-mockup--phone portal-mockup--centered" style={{ "--c": p.accent }}>
                          <div className="pm-phone-notch"/>
                          <div className="pm-phone-screen">
                            <div className="pm-phone-header"/>
                            <div className="pm-phone-card"/><div className="pm-phone-card pm-phone-card--sm"/>
                            <div className="pm-phone-row"><div/><div/></div>
                            <div className="pm-phone-card pm-phone-card--sm"/>
                          </div>
                        </div>
                      )}
                      {p.visual === "both" && (
                        <div className="portal-visual-both">
                          <div className="portal-mockup portal-mockup--desktop" style={{ "--c": p.accent }}>
                            <div className="pm-bar"><span/><span/><span/></div>
                            <div className="pm-screen">
                              <div className="pm-sidebar"><span/><span/><span/><span/></div>
                              <div className="pm-content">
                                <div className="pm-stat-row"><div className="pm-stat"/><div className="pm-stat"/></div>
                                <div className="pm-table"><div/><div/><div/><div/><div/></div>
                              </div>
                            </div>
                          </div>
                          <div className="portal-mockup portal-mockup--phone portal-mockup--overlay" style={{ "--c": p.accent }}>
                            <div className="pm-phone-notch"/>
                            <div className="pm-phone-screen">
                              <div className="pm-phone-header"/>
                              <div className="pm-phone-card"/><div className="pm-phone-card pm-phone-card--sm"/>
                            </div>
                          </div>
                        </div>
                      )}

                      {p.store && (
                        <div className="portal-card__store-btns">
                          <a className="store-btn" href="#" aria-label="Google Play">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76a2 2 0 0 0 2.09-.22l11.67-6.74-2.55-2.55L3.18 23.76zm-1.1-20.5C2 3.6 2 4.1 2 4.6v14.8c0 .5 0 1 .08 1.34l10.3-10.3L2.08 3.26zM20.4 10.4l-2.6-1.5-2.87 2.87 2.87 2.87 2.62-1.51A1.5 1.5 0 0 0 20.4 10.4zM5.27.46A2 2 0 0 0 3.18.24L14.39 11.5l2.55-2.55L5.27.46z"/></svg>
                            <div><span>GET IT ON</span><strong>Google Play</strong></div>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* SVG connector to timeline */}
                    <svg className="hscroll-svg-connector" width="40" height="80" viewBox="0 0 40 80" fill="none">
                      {isUp
                        ? <path d="M20 0 C20 40, 20 40, 20 72" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" className="hscroll-svg-path"/>
                        : <path d="M20 80 C20 40, 20 40, 20 8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 3" className="hscroll-svg-path"/>
                      }
                      <circle cx="20" cy={isUp ? 76 : 4} r="5" fill="#fff" stroke="#000" strokeWidth="2" className="hscroll-svg-dot"/>
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>{/* end stack-scroll */}

      {/* Intro Video */}
      <div className="intro-video-section">
        <div className="ivs-noise" />
        <div className="ivs-grid" />

        <div className="intro-video-inner">
          {/* Left — text */}
          <div className="intro-video-text">
            <span className="ivs-eyebrow">See It In Action</span>
            <h2 className="ivs-heading">
              Watch how<br />Scladapp<br />works
            </h2>
            <p className="ivs-sub">
              A 2-minute walkthrough of the platform — from onboarding to daily use, for admins, teachers, and students.
            </p>
            <div className="ivs-divider" />
            <span className="ivs-runtime">2 min watch</span>
          </div>

          {/* Right — video */}
          <div className="intro-video-frame-wrap">
            <div className="ivs-glow" />
            <div className="intro-video-frame">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Scladapp Introduction Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing — horizontal scroll (left-to-right) */}
      <div
        className="pricing-hscroll-wrapper"
        ref={h3WrapperRef}
        style={{ height: `${(plans.length || 4) * 100}vh` }}
        id="pricing"
      >
        <div className="pricing-hscroll-sticky">
          <div className="pricing-hscroll-header">
            <span className="landing-section-tag">Simple Pricing</span>
            <h2>Plans that grow with your school</h2>
            <p>No hidden fees. Cancel anytime.</p>
            <div className="pricing-toggle">
              {["monthly","quarterly","yearly"].map(c => (
                <button
                  key={c}
                  className={`pricing-toggle__btn${billingCycle === c ? " pricing-toggle__btn--active" : ""}`}
                  onClick={() => setBillingCycle(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                  {c === "quarterly" && <span className="pricing-toggle__badge">-10%</span>}
                  {c === "yearly" && <span className="pricing-toggle__badge">-20%</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="pricing-hscroll-track" ref={h3TrackRef}>
            {plansLoading
              ? [1,2,3,4].map(i => <div key={i} className="pricing-skeleton"/>)
              : plans.map(plan => (
                <div key={plan["$id"] || plan.plan_id} className={`pricing-card${plan.featured ? " pricing-card--highlight" : ""}`}>
                  <span className="pricing-card__corner-tr" />
                  <span className="pricing-card__corner-bl" />
                  <span className="pricing-card__deco-circle" />
                  <span className="pricing-card__deco-box" />
                  {plan.featured && <span className="pricing-card__popular">Most Popular</span>}
                  <div className="pricing-card__header">
                    <h3>{plan.plan_name}</h3>
                    <p className="pricing-card__desc">{plan.description}</p>
                  </div>
                  <div className="pricing-card__price">
                    <span className="pricing-card__amount">{getPrice(plan)}</span>
                    {plan.plan_type !== "Free" && <span className="pricing-card__period">{getPeriod()}</span>}
                  </div>
                  <div className="pricing-card__limits">
                    <span>{plan.max_students} students</span>
                    <span>{plan.max_staff} staff</span>
                    <span>{plan.max_storage_gb}GB</span>
                    {plan.ai_assistant && <span>AI</span>}
                  </div>
                  <ul className="pricing-card__features">
                    {(plan.features || []).map(f => (
                      <li key={f}><span className="pricing-check">✓</span>{f}</li>
                    ))}
                  </ul>
                  <button
                    className={`pricing-card__btn${plan.featured ? " pricing-card__btn--dark" : ""}`}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.plan_type === "Free" ? "Get Started Free" : "Get Started"}
                  </button>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <section className="cta-section">
        <div className="cta-section__bg-grid" />
        <div className="cta-section__layout">

          {/* Left — CTA text */}
          <div className="cta-section__inner">
            <span className="landing-section-tag cta-section__tag">Get Started</span>
            <h2 className="cta-section__heading">
              Ready to simplify<br />your school?
            </h2>
            <p className="cta-section__sub">
              Join hundreds of schools already running smarter with Scladapp.
              No credit card required. Setup in under 30 minutes.
            </p>
            <div className="cta-section__actions">
              <button className="cta-section__btn cta-section__btn--primary" onClick={() => navigate("/setup/1")}>
                Start for Free
              </button>
              <button className="cta-section__btn cta-section__btn--ghost" onClick={() => navigate("/contact")}>
                Talk to Us
              </button>
            </div>
          
          </div>

          {/* Right — Testimonial slider */}
          <CtaTestimonials />

        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="faq-section__inner">
          <div className="faq-section__head">
            <span className="landing-section-tag">FAQ</span>
            <h2>Frequently asked questions</h2>
            <p>Everything you need to know before getting started.</p>
          </div>
          <div className="faq-grid">
            {[
              { q: "How long does setup take?", a: "Most schools are fully set up within 30 minutes using our guided wizard." },
              { q: "Can students access it on mobile?", a: "Yes — students and staff have dedicated mobile apps available on Google Play." },
              { q: "Is my school's data secure?", a: "All data is encrypted in transit and at rest. We follow industry-standard security practices." },
              { q: "Can I import existing student data?", a: "Yes, you can bulk import students via CSV from any spreadsheet." },
              { q: "What happens when I exceed my plan limit?", a: "We'll notify you before you hit the limit and offer a seamless upgrade path." },
              { q: "Do you offer a free trial?", a: "The Starter plan is free forever. Paid plans come with a 14-day free trial." },
              { q: "Can multiple admins use the same account?", a: "Yes, you can invite multiple staff members with different roles and permissions." },
              { q: "What payment methods are supported?", a: "We support bank transfers, card payments, and major Nigerian payment gateways." },
            ].map((item, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">
                  <span>{item.q}</span>
                  <span className="faq-icon">+</span>
                </summary>
                <p className="faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Landing;
