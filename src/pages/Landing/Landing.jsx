import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import { getMonthlyRate, formatNaira, isFreePlan } from "../../utils/planPricing";
import { TUTORIAL_PAGE_LANDING, tutorialThumb, useTutorialVideos } from "../../api_call/useTutorialVideos";
import "./Landing.css";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const INTRO_SECTION_BG = { r: 26, g: 26, b: 26 }; // #1a1a1a — matches .intro-video-section
const FEATURES_SECTION_BG = { r: 0, g: 0, b: 0 };

const TYPEWRITER_PHRASES = [
  "Students Stay Informed",
  "Schools Stay Connected",
  "Teachers Stay Organized",
];

const FEATURES = [
  {
    title: "Student Management",
    icon: "students",
    accent: "#3a3a3a",
    face: "#f3f3f3",
    ink: "#111111",
    bullets: [
      { text: "Student records", icon: "records" },
      { text: "Attendance", icon: "attendance" },
      { text: "Results", icon: "results" },
      { text: "Promotion history", icon: "promotion" },
    ],
  },
  {
    title: "Staff Management",
    icon: "staff",
    accent: "rgba(255,255,255,0.72)",
    face: "#3d3d3d",
    ink: "#ffffff",
    dark: true,
    bullets: [
      { text: "Teacher profiles", icon: "profiles" },
      { text: "Salary / payroll", icon: "payroll" },
      { text: "Assigned classes", icon: "classes" },
      { text: "Subjects taught", icon: "subjects" },
    ],
  },
  {
    title: "Timetable System",
    icon: "timetable",
    accent: "#4a4a4a",
    face: "#d4d4d4",
    ink: "#161616",
    bullets: [
      { text: "Auto timetable generation", icon: "auto" },
      { text: "Class schedules", icon: "schedule" },
      { text: "Teacher schedules", icon: "teacher" },
    ],
  },
  {
    title: "Result & Report Cards",
    icon: "reports",
    accent: "rgba(255,255,255,0.7)",
    face: "#1c1c1c",
    ink: "#ffffff",
    dark: true,
    bullets: [
      { text: "End-of-term results", icon: "term" },
      { text: "GPA calculation", icon: "gpa" },
      { text: "Printable report cards", icon: "printable" },
      { text: "Admins can email report cards to parents", icon: "email" },
    ],
  },
  {
    title: "Notifications",
    icon: "notifications",
    accent: "#2f2f2f",
    face: "#bdbdbd",
    ink: "#141414",
    bullets: [
      { text: "Announcements", icon: "announcements" },
      { text: "Exam alerts", icon: "exam" },
      { text: "SMS / email", icon: "sms" },
    ],
  },
  {
    title: "AI Assistant",
    icon: "ai",
    accent: "#555555",
    face: "#8a8a8a",
    ink: "#111111",
    bullets: [
      { text: "Analyzes school records", icon: "records" },
      { text: "Schedules emails", icon: "email" },
      { text: "Reports such as the best performing student of all time", icon: "results" },
    ],
  },
];

const TESTIMONIALS = [
  {
    quote: "Scladapp completely transformed how we manage student records . Setup was under 30 minutes and our staff adopted it immediately.",
    name: "Mrs. Adaeze Okonkwo",
    role: "Principal",
    school: "Greenfield Academy, Lagos",
    initials: "AO",
    color: "#6c5ce7",
  },
  {
    quote: "The timetable generation alone saved us two full days of work every term.",
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

function HeroTypewriter() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef(null);

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
    <div className="landing__hero-typewriter">
      <span>{displayed}</span>
      <span className="landing__hero-cursor">|</span>
    </div>
  );
}

function viewportH() {
  return Math.round(window.visualViewport?.height || window.innerHeight);
}

function documentY(el) {
  return el.getBoundingClientRect().top + window.scrollY;
}

const SUPPORTS_VIEW_TIMELINE =
  typeof window !== "undefined" && typeof window.ViewTimeline === "function";

/**
 * Pins each track to its wrapper's sticky range, 1px of scroll per 1px sideways.
 *
 * Where supported the pan is a scroll-driven animation so it runs on the
 * compositor alongside position:sticky. Driving the transform from a scroll
 * listener instead lets the track fall behind during fast scrolling and snap
 * forward on release.
 */
function bindPinnedTracks(pins) {
  const state = pins.filter((p) => p.wrapper && p.track);
  if (!state.length) return () => {};

  let ticking = false;

  const clearAnimations = (pin) => {
    pin.animations?.forEach((a) => a.cancel());
    pin.animations = null;
  };

  const composite = (pin) => {
    clearAnimations(pin);
    if (pin.maxX <= 0) return false;

    const timeline = new ViewTimeline({ subject: pin.wrapper, axis: "block" });
    const from = pin.reverse ? `translate3d(${-pin.maxX}px, 0, 0)` : "translate3d(0, 0, 0)";
    const to = pin.reverse ? "translate3d(0, 0, 0)" : `translate3d(${-pin.maxX}px, 0, 0)`;

    const animations = [
      pin.track.animate(
        { transform: [from, to] },
        { timeline, rangeStart: "contain 0%", rangeEnd: "contain 100%", fill: "both" }
      ),
    ];

    if (pin.fadeSticky && pin.sticky) {
      animations.push(
        pin.sticky.animate(
          { opacity: [0, 1] },
          { timeline, rangeStart: "contain 0%", rangeEnd: "contain 6%", fill: "both" }
        )
      );
    }

    pin.track.style.transform = "";
    pin.animations = animations;
    return true;
  };

  const measure = () => {
    const vh = viewportH();
    for (const pin of state) {
      if (pin.sticky) {
        pin.sticky.style.height = `${vh}px`;
        pin.sticky.style.boxSizing = "border-box";
      }
      pin.maxX = Math.max(0, pin.track.scrollWidth - window.innerWidth);
      // 1:1 — the section stays pinned for exactly the distance it pans.
      pin.measureHeight?.(pin.maxX, vh);
      pin.startY = documentY(pin.wrapper);
      pin.range = Math.max(1, pin.wrapper.offsetHeight - vh);
      pin.lastX = NaN;
      pin.lastOp = NaN;
      pin.composited = SUPPORTS_VIEW_TIMELINE ? composite(pin) : false;
    }
    apply();
  };

  const apply = () => {
    ticking = false;
    const y = window.scrollY;
    const vh = viewportH();

    for (const pin of state) {
      const t = Math.max(0, Math.min(1, (y - pin.startY) / pin.range));

      if (!pin.composited) {
        const x = Math.round(pin.reverse ? (1 - t) * pin.maxX : t * pin.maxX);
        if (x !== pin.lastX) {
          pin.lastX = x;
          pin.track.style.transform = `translate3d(${-x}px, 0, 0)`;
        }
        if (pin.fadeSticky && pin.sticky) {
          const op = pin.maxX <= 0 ? 1 : Math.max(0, Math.min(1, t / 0.06));
          if (op !== pin.lastOp) {
            pin.lastOp = op;
            pin.sticky.style.opacity = String(op);
          }
        }
      }

      pin.onProgress?.(t, vh, y, pin.startY);
    }
  };

  // Cards slide under a stationary cursor, so hover would flicker card lifts on
  // and off mid-pan. Ignore pointers until scrolling settles.
  let idleTimer = 0;
  let inert = false;
  const setInert = (next) => {
    if (inert === next) return;
    inert = next;
    state.forEach((pin) => {
      pin.track.style.pointerEvents = next ? "none" : "";
    });
  };

  const onScroll = () => {
    setInert(true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => setInert(false), 120);
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  };

  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  window.visualViewport?.addEventListener("resize", measure);
  return () => {
    clearTimeout(idleTimer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", measure);
    window.visualViewport?.removeEventListener("resize", measure);
    state.forEach(clearAnimations);
  };
}

const INTRO_FALLBACK_ID = "dQw4w9WgXcQ";

function IntroVideo() {
  const { videos } = useTutorialVideos(TUTORIAL_PAGE_LANDING);
  const video = videos[0];
  const youtubeId = video?.youtubeId || INTRO_FALLBACK_ID;
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [youtubeId, video?.thumbnail]);

  const thumb = tutorialThumb(
    { youtubeId, thumbnail: video?.thumbnail || "" },
    "maxresdefault"
  );

  return (
    <div className="intro-video-inner">
      <div className="intro-video-frame-wrap">
        <div className="ivs-glow" />
        <div className="intro-video-frame">
          {playing ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              title={video?.title || "Scladapp Introduction Video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button type="button" className="intro-video-poster" onClick={() => setPlaying(true)}>
              <img src={thumb} alt="" />
              <span className="intro-video-play" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="intro-video-text">
        <span className="ivs-eyebrow">AI website</span>
        <h2 className="ivs-heading">
          Build the<br />school site<br />with AI
        </h2>
        <p className="ivs-sub">
          Pick a look. The page is written for your school. Then change the words and pictures yourself.
        </p>
        <div className="ivs-divider" />
        <span className="ivs-runtime">{video?.duration || "2 min watch"}</span>
      </div>
    </div>
  );
}

const BILLING_CYCLES = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly", badge: "-10%" },
  { id: "yearly", label: "Yearly", badge: "-20%" },
];

function PricingPlanCard({ plan, onSelect }) {
  const free = isFreePlan(plan);
  const [cycle, setCycle] = useState("monthly");

  return (
    <div className={`pricing-card${plan.featured ? " pricing-card--highlight" : ""}`}>
      <span className="pricing-card__corner-tr" />
      <span className="pricing-card__corner-bl" />
      <span className="pricing-card__deco-circle" />
      <span className="pricing-card__deco-box" />
      {plan.featured && <span className="pricing-card__popular">Most Popular</span>}
      <div className="pricing-card__header">
        <h3>{plan.plan_name}</h3>
        <p className="pricing-card__desc">{plan.description}</p>
      </div>
      {!free && (
        <div className="pricing-card__switch" role="group" aria-label="Billing cycle">
          {BILLING_CYCLES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cycle === c.id ? "is-on" : ""}
              aria-pressed={cycle === c.id}
              onClick={() => setCycle(c.id)}
            >
              {c.label}
              {c.badge && <em>{c.badge}</em>}
            </button>
          ))}
        </div>
      )}
      <div className="pricing-card__price">
        <span className="pricing-card__amount">{free ? "Free" : formatNaira(getMonthlyRate(plan, cycle))}</span>
        {!free && <span className="pricing-card__period">/mo</span>}
      </div>
      <div className="pricing-card__limits">
        <span>Unlimited students</span>
        <span>Unlimited staff</span>
        <span>{plan.max_subadmin} sub-admins</span>
        <span>{plan.max_storage_gb}GB</span>
        {plan.ai_assistant && <span>AI</span>}
      </div>
      <ul className="pricing-card__features">
        {(plan.features || []).map((f) => (
          <li key={f}><span className="pricing-check">✓</span>{f}</li>
        ))}
      </ul>
      <button
        className={`pricing-card__btn${plan.featured ? " pricing-card__btn--dark" : ""}`}
        onClick={() => onSelect(plan, free ? "monthly" : cycle)}
      >
        {free ? "Get Started Free" : "Get Started"}
      </button>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const hWrapperRef = useRef(null);
  const hTrackRef = useRef(null);
  const hProgressRef = useRef(null);
  const introVideoRef = useRef(null);
  const h2WrapperRef = useRef(null);
  const h2TrackRef = useRef(null);
  const h3WrapperRef = useRef(null);
  const h3TrackRef = useRef(null);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [navDark, setNavDark] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/subscription/plans`)
      .then(r => r.json())
      .then(d => { if (d.success) setPlans(d.data); })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const handleSelectPlan = (plan, cycle) => {
    navigate("/setup/1", { state: { plan, priceView: cycle } });
  };

  // Horizontal pin sections — one scroller, 1:1 with page scroll
  useEffect(() => {
    const wrapper = hWrapperRef.current;
    const track = hTrackRef.current;
    if (!wrapper || !track) return;

    const sticky = wrapper.querySelector(".hscroll-sticky");
    const handle = wrapper.querySelector(".hscroll-pull-handle");
    const lastBg = { current: "" };

    if (sticky) {
      sticky.style.opacity = "1";
      sticky.style.pointerEvents = "";
    }
    if (handle) {
      handle.style.opacity = "0";
      handle.style.transform = "translateX(-50%)";
    }

    const featuresSticky = h2WrapperRef.current?.querySelector(".hscroll2-sticky");
    if (featuresSticky) {
      featuresSticky.getAnimations().forEach((animation) => animation.cancel());
      featuresSticky.style.opacity = "1";
    }

    return bindPinnedTracks([
      {
        wrapper,
        track,
        sticky,
        measureHeight: (maxTranslate, vh) => {
          if (maxTranslate <= 0) {
            const introBg = `rgb(${INTRO_SECTION_BG.r}, ${INTRO_SECTION_BG.g}, ${INTRO_SECTION_BG.b})`;
            wrapper.style.height = "auto";
            wrapper.style.backgroundColor = introBg;
            lastBg.current = introBg;
            if (introVideoRef.current) introVideoRef.current.style.backgroundColor = introBg;
            return;
          }
          wrapper.style.height = `${Math.round(maxTranslate + vh)}px`;
        },
        onProgress: (t, vh, y, startY) => {
          const dist = startY - y;
          let bgT = 0;
          if (dist >= vh) bgT = 0;
          else if (dist > 0) bgT = 1 - dist / vh;
          else bgT = 1;
          const r = Math.round(INTRO_SECTION_BG.r + (FEATURES_SECTION_BG.r - INTRO_SECTION_BG.r) * bgT);
          const g = Math.round(INTRO_SECTION_BG.g + (FEATURES_SECTION_BG.g - INTRO_SECTION_BG.g) * bgT);
          const b = Math.round(INTRO_SECTION_BG.b + (FEATURES_SECTION_BG.b - INTRO_SECTION_BG.b) * bgT);
          const bgColor = `rgb(${r}, ${g}, ${b})`;
          if (lastBg.current !== bgColor) {
            lastBg.current = bgColor;
            wrapper.style.backgroundColor = bgColor;
            if (introVideoRef.current) introVideoRef.current.style.backgroundColor = bgColor;
          }
          if (hProgressRef.current) hProgressRef.current.style.width = `${t * 100}%`;
        },
      },
      {
        wrapper: h2WrapperRef.current,
        track: h2TrackRef.current,
        sticky: featuresSticky,
        reverse: true,
        measureHeight: (maxTranslate, vh) => {
          const w = h2WrapperRef.current;
          if (!w) return;
          w.style.height = maxTranslate <= 0 ? "auto" : `${Math.round(maxTranslate + vh)}px`;
        },
      },
      {
        wrapper: h3WrapperRef.current,
        track: h3TrackRef.current,
        sticky: h3WrapperRef.current?.querySelector(".pricing-hscroll-sticky"),
        fadeSticky: true,
        measureHeight: (maxTranslate, vh) => {
          const w = h3WrapperRef.current;
          if (!w) return;
          w.style.height = maxTranslate <= 0 ? "auto" : `${Math.round(maxTranslate + vh)}px`;
        },
      },
    ]);
  }, [plans]);

  // Landing navbar — white text when overlapping dark sections
  useEffect(() => {
    let ticking = false;

    const measure = () => {
      ticking = false;
      const headerBottom = 72;
      const darkSections = [
        introVideoRef.current,
        hWrapperRef.current,
        h2WrapperRef.current,
        document.querySelector(".cta-section"),
      ];

      const overDark = darkSections.filter(Boolean).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < headerBottom && r.bottom > 0;
      });

      setNavDark(overDark);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
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

  return (
    <div className="landing">
      <PublicHeader dark={navDark} />

      {/* Stacking scroll wrapper starts here — hero is layer 1 */}
      <div className="stack-scroll">

      {/* Hero */}
      <section className="landing__hero ">

        {/* TOP — left-aligned text block */}
        <div className="landing__hero-text">
          <div className="landing__hero-perk" role="note">
            <span className="landing__hero-perk-pulse" aria-hidden="true" />
            <span className="landing__hero-perk-text">
              <strong>Free school website</strong> created and hosted for you
            </span>
          </div>
          <h1>The Smarter Way to <br /> Experience Education</h1>
          <HeroTypewriter />
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

      {/* Intro Video */}
      <div className="intro-video-section" ref={introVideoRef}>
        <div className="ivs-noise" />
        <div className="ivs-grid" />

        <IntroVideo />
      </div>

        {/* Stack 1 — Horizontal feature scroll */}
        <div
          className="hscroll-wrapper stack-section--1"
          ref={hWrapperRef}
          style={{ zIndex: 2 }}
        >
          <div className="hscroll-pull-handle-wrap" aria-hidden="true">
            <div className="hscroll-pull-handle">
              <span className="hscroll-pull-handle__dot" />
              <span className="hscroll-pull-handle__line" />
            </div>
          </div>

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

              {FEATURES.map((f, i) => (
                  <div key={f.title} className="hscroll-panel">
                    <div
                      className={`hscroll-card hscroll-card--feature${f.dark ? " is-dark" : ""}`}
                      style={{ "--feature-accent": f.accent, "--feature-face": f.face, "--feature-ink": f.ink }}
                    >
                      <div className="hscroll-card-face">
                        <span className="hscroll-card-face__mark">{String(i + 1).padStart(2, "0")}</span>
                        <span className="hscroll-card-face__name">{f.title}</span>
                        <span className="hscroll-card-face__label">Features</span>
                        <svg className="hscroll-card-face__steps" viewBox="0 0 92 76" fill="none" aria-hidden="true">
                          <rect x="6" y="46" width="22" height="22" stroke="currentColor" strokeWidth="1.4" />
                          <rect x="32" y="28" width="22" height="22" stroke="currentColor" strokeWidth="1.4" />
                          <rect x="58" y="10" width="22" height="22" stroke="currentColor" strokeWidth="1.4" />
                        </svg>
                      </div>
                      <div className="hscroll-card-body">
                        <h3>{f.title}</h3>
                        <p>{f.bullets.map((b) => b.text).join(". ")}.</p>
                      </div>
                    </div>
                  </div>
              ))}
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
                  key: "student", badge: "Student Portal", accent: "#f0f0f0",
                  title: "Students Stay Informed Anywhere.",
                  desc: "From exam results to announcements, students access everything from one secure portal.",
                  features: ["Result checking","Notifications","Timetable","Assignments"],
                  visual: "both",
                },
                {
                  key: "admin", badge: "Admin Portal", accent: "#6e6e6e",
                  title: "Complete Control for School Administrators.",
                  desc: "Command your entire school from one powerful dashboard.",
                  features: ["Student records","Payroll","Finance tracking","Reports","Sessions & terms","Analytics"],
                  visual: "desktop", center: true,
                },
                {
                  key: "staff", badge: "Staff Portal", accent: "#bdbdbd",
                  title: "Teaching Management Made Simple.",
                  desc: "Everything a teacher needs to manage their day — in one clean view.",
                  features: ["Assigned classes","Attendance","Upload scores","Class schedules","Head-of-class management"],
                  visual: "both",
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
                          <span className="pm-coming-soon">Coming Soon</span>
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
                            <span className="pm-coming-soon">Coming Soon</span>
                          </div>
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
          </div>

          <div className="pricing-hscroll-track" ref={h3TrackRef}>
            {plansLoading
              ? [1,2,3,4].map(i => <div key={i} className="pricing-skeleton"/>)
              : plans.map(plan => (
                <PricingPlanCard
                  key={plan["$id"] || plan.plan_id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                />
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
              Scladapp simplifies education management by bringing student records, teacher schedules, and administrative tools together in one place.
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
              { q: "Do I get a school website?", a: "Yes. A free school website is created and hosted for your school as part of ScladApp." },
              { q: "Is everything documented?", a: "Yes. Features and workflows are documented so your team can learn and use the platform with clear guides." },
              { q: "Is there a mobile app?", a: "Not yet. Mobile apps are not available at the moment. You can use ScladApp fully in the browser on desktop or mobile web." },
              { q: "Can I import existing students?", a: "No bulk import. Students must be enrolled manually, or you can admit them using an existing student ID if they already have one." },
              { q: "What happens when my subscription expires?", a: "Your data stays safe. You can still view previous school data, but you cannot add, edit, or delete until you renew your subscription." },
              { q: "Can I see previous school data?", a: "Yes. Your past records remain available to view even after a subscription ends." },
              { q: "Do you offer a free trial?", a: "Yes. You get one month free. After that, continued use is on a paid subscription plan." },
              { q: "Can multiple admins use the same school?", a: "Yes. You can invite staff and admins with different roles and permissions." },
              { q: "What payment methods are supported?", a: "We support card payments and major Nigerian payment gateways." },
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
