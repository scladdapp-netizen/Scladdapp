import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaFileAlt,
  FaCalendarAlt,
  FaLayerGroup,
  FaUsersCog,
  FaClipboardList,
  FaMedal,
  FaMoneyBillWave,
  FaUniversity,
  FaBullhorn,
  FaBell,
  FaRobot,
  FaHeartbeat,
  FaGlobe,
  FaBookOpen,
} from "react-icons/fa";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import "./Features.css";

const GROUPS = [
  {
    id: "academics",
    tag: "Academics",
    title: "Run every class, term and result",
    blurb: "From the first day of the session to the printed report card.",
    features: [
      {
        icon: FaUserGraduate,
        title: "Student Management",
        desc: "One record for every student, from admission to graduation.",
        points: ["Student records", "Class assignments", "Promotion history"],
      },
      {
        icon: FaBookOpen,
        title: "Classes & Subjects",
        desc: "Set up classes, sections and subjects, then assign headmasters and teachers.",
        points: ["Class headmasters", "Subject assignments", "Active / inactive"],
      },
      {
        icon: FaClipboardCheck,
        title: "Attendance",
        desc: "Take and review attendance for every class, every day.",
        points: ["Daily registers", "Per-class view", "Student history"],
      },
      {
        icon: FaFileAlt,
        title: "Results & Report Cards",
        desc: "Record scores, calculate grades and produce printable report cards.",
        points: ["End-of-term results", "GPA calculation", "Email to parents"],
      },
      {
        icon: FaCalendarAlt,
        title: "Timetable System",
        desc: "Generate class and teacher timetables automatically.",
        points: ["Auto generation", "Class schedules", "Teacher schedules"],
      },
      {
        icon: FaLayerGroup,
        title: "Sessions & Terms",
        desc: "Create a new session with its terms and move students up in one guided flow.",
        points: ["Session wizard", "Class promotion rules", "Graduates to alumni"],
      },
    ],
  },
  {
    id: "people",
    tag: "People",
    title: "Staff, admins and admissions",
    blurb: "Know who works at your school and control what they can do.",
    features: [
      {
        icon: FaChalkboardTeacher,
        title: "Staff & Teachers",
        desc: "Profiles for every staff member, with teaching assignments for teachers.",
        points: ["Teacher profiles", "Assigned classes", "Subjects taught"],
      },
      {
        icon: FaUsersCog,
        title: "Admin Roles & Access",
        desc: "Promote staff to admins and decide exactly what each admin can see and change.",
        points: ["Role-based permissions", "Access scopes", "Promote from staff"],
      },
      {
        icon: FaClipboardList,
        title: "Online Admissions",
        desc: "Give parents an application form and approve applicants straight into your school.",
        points: ["Public application form", "Review & approve", "Becomes a student"],
      },
      {
        icon: FaMedal,
        title: "Alumni Records",
        desc: "Students who graduate are kept as alumni, with their history intact.",
        points: ["Automatic on graduation", "Per-session lists", "Full history"],
      },
    ],
  },
  {
    id: "finance",
    tag: "Finance",
    title: "Fees, payroll and school accounts",
    blurb: "Keep the money side of the school clear and traceable.",
    features: [
      {
        icon: FaMoneyBillWave,
        title: "Fee Billing",
        desc: "Build fee templates once, then bill whole classes or the whole school.",
        points: ["Bill templates", "Class & school bills", "Payment tracking"],
      },
      {
        icon: FaUniversity,
        title: "School Accounts",
        desc: "Manage the school's bank accounts and see every transaction in one place.",
        points: ["Multiple accounts", "Transaction history", "Payroll & expenses"],
      },
    ],
  },
  {
    id: "communication",
    tag: "Communication",
    title: "Keep everyone informed",
    blurb: "Reach students, parents and staff without chasing anyone.",
    features: [
      {
        icon: FaBullhorn,
        title: "Announcements",
        desc: "Write once and send to the right audience, using reusable templates.",
        points: ["Target audiences", "Templates", "Placeholders"],
      },
      {
        icon: FaBell,
        title: "Notifications",
        desc: "Exam alerts, results and school news delivered where people will see them.",
        points: ["In-app alerts", "SMS / email", "Exam alerts"],
      },
      {
        icon: FaRobot,
        title: "AI Assistant",
        desc: "Ask questions about your school's records and let it handle routine tasks.",
        points: ["Analyses school records", "Schedules emails", "Performance reports"],
      },
    ],
  },
  {
    id: "operations",
    tag: "School life",
    title: "Everything around the classroom",
    blurb: "The details that make a school run smoothly.",
    features: [
      {
        icon: FaCalendarAlt,
        title: "School Calendar & Events",
        desc: "Plan terms, holidays and events, and keep everyone on the same dates.",
        points: ["Term dates", "Events", "Shared calendar"],
      },
      {
        icon: FaHeartbeat,
        title: "Medical Records",
        desc: "Keep health notes for students so staff know what matters in an emergency.",
        points: ["Student health notes", "Allergies & conditions", "Per-student record"],
      },
      {
        icon: FaGlobe,
        title: "Free School Website",
        desc: "Every school gets a website created and hosted for it, with its own login page.",
        points: ["Created for you", "Hosted for you", "School-branded login"],
      },
    ],
  },
];

const Features = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [headerDark, setHeaderDark] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Switch header to light once the hero scrolls above the header
  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const total = GROUPS.reduce((n, g) => n + g.features.length, 0);

  return (
    <div className="features-pg">
      <PublicHeader dark={headerDark} />

      <section className="features-pg__hero" ref={heroRef}>
        <span className="features-pg__hero-corner-tr" />
        <span className="features-pg__hero-corner-bl" />
        <span className="features-pg__tag">Platform Features</span>
        <h1>Everything your Nigerian school needs, in one place</h1>
        <p>
          {total} features across academics, people, finance and communication, built around how
          schools here actually work.
        </p>
        <div className="features-pg__hero-actions">
          <button className="features-pg__btn features-pg__btn--light" onClick={() => navigate("/setup/1")}>
            Get Started
          </button>
          <button className="features-pg__btn features-pg__btn--ghost" onClick={() => navigate("/pricing")}>
            View Pricing
          </button>
        </div>

        <nav className="features-pg__jump" aria-label="Feature groups">
          {GROUPS.map((g) => (
            <a key={g.id} href={`#${g.id}`}>
              {g.tag}
            </a>
          ))}
        </nav>
      </section>

      <main className="features-pg__main">
        {GROUPS.map((group) => (
          <section key={group.id} id={group.id} className="features-pg__group">
            <header className="features-pg__group-head">
              <span className="features-pg__group-tag">{group.tag}</span>
              <h2>{group.title}</h2>
              <p>{group.blurb}</p>
            </header>

            <div className="features-pg__grid">
              {group.features.map((f) => {
                const Icon = f.icon;
                return (
                  <article key={f.title} className="features-pg__card">
                    <span className="features-pg__icon">
                      <Icon />
                    </span>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                    <ul>
                      {f.points.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <section className="features-pg__cta">
          <h2>Ready to run your school on Scladapp?</h2>
          <p>Set up in minutes. Your school website is created and hosted for free.</p>
          <div className="features-pg__hero-actions">
            <button className="features-pg__btn features-pg__btn--dark" onClick={() => navigate("/setup/1")}>
              Get Started
            </button>
            <button className="features-pg__btn features-pg__btn--outline" onClick={() => navigate("/contact")}>
              Talk to us
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
