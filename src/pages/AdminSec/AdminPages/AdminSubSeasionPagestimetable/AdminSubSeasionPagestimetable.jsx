import React, { useEffect, useRef, useState } from "react";
import "./AdminSubSeasionPages.css";
import Button from "../../../../components/Button/Button";
import EditeTimetable from "../EditeTimetable/EditeTimetable";
import { useNavigate, useParams } from "react-router-dom";
import Timetable from "../../../../components/timetable/Timetable";

const sample = [
  {
    className: "Class 1A",
    timetable: [
      { id: 1, day: "Monday", name: "Math", start: "08:00", end: "09:30" },
      { id: 2, day: "Monday", name: "English", start: "09:45", end: "10:45" },
      { id: 3, day: "Monday", name: "Physics", start: "11:00", end: "12:30" },
      { id: 4, day: "Monday", name: "Chemistry", start: "13:30", end: "14:30" },
      { id: 5, day: "Monday", name: "Biology", start: "15:00", end: "16:30" },

      // Tuesday
      {
        id: 6,
        day: "Tuesday",
        name: "Computer Science",
        start: "08:30",
        end: "10:00",
      },
      { id: 7, day: "Tuesday", name: "Math", start: "10:15", end: "11:45" },
      { id: 8, day: "Tuesday", name: "English", start: "12:00", end: "13:00" },
      {
        id: 9,
        day: "Tuesday",
        name: "Physics Lab",
        start: "13:30",
        end: "15:30",
      },
      { id: 10, day: "Tuesday", name: "Sports", start: "16:00", end: "17:00" },

      // Wednesday
      {
        id: 11,
        day: "Wednesday",
        name: "Biology",
        start: "08:00",
        end: "09:20",
      },
      {
        id: 12,
        day: "Wednesday",
        name: "Chemistry",
        start: "09:15",
        end: "10:45",
      },
      { id: 13, day: "Wednesday", name: "Math", start: "11:00", end: "12:30" },
      {
        id: 14,
        day: "Wednesday",
        name: "Computer Lab",
        start: "13:30",
        end: "15:30",
      },
      {
        id: 15,
        day: "Wednesday",
        name: "English",
        start: "15:45",
        end: "16:45",
      },

      // Thursday
      {
        id: 16,
        day: "Thursday",
        name: "Physics",
        start: "08:30",
        end: "10:00",
      },
      { id: 17, day: "Thursday", name: "Math", start: "10:15", end: "11:15" },
      {
        id: 18,
        day: "Thursday",
        name: "Chemistry Lab",
        start: "11:30",
        end: "13:30",
      },
      {
        id: 19,
        day: "Thursday",
        name: "Biology",
        start: "14:00",
        end: "15:00",
      },
      {
        id: 20,
        day: "Thursday",
        name: "Freen Study",
        start: "15:15",
        end: "16:45",
      },

      // Friday
      {
        id: 21,
        day: "Friday",
        name: "Math Revision",
        start: "08:00",
        end: "09:30",
      },
      { id: 22, day: "Friday", name: "Englishh", start: "09:45", end: "10:45" },
      { id: 23, day: "Friday", name: "Physics", start: "11:00", end: "12:30" },
      { id: 24, day: "Friday", name: "ICT", start: "13:30", end: "14:30" },
      {
        id: 25,
        day: "Friday",
        name: "Club Activities",
        start: "15:00",
        end: "18:00",
      },
    ],
  },
  {
    className: "Class 1B",
    timetable: [
      { id: 11, day: "Monday", name: "Biology", start: "08:00", end: "09:20" },
      {
        id: 12,
        day: "Tuesday",
        name: "Physics Lab",
        start: "13:30",
        end: "15:30",
      },
    ],
  },
  {
    className: "Class 2A",
    timetable: [
      {
        id: 21,
        day: "Wednesday",
        name: "Chemistry",
        start: "09:15",
        end: "10:45",
      },
      { id: 22, day: "Friday", name: "ICT", start: "13:30", end: "14:30" },
    ],
  },
  {
    className: "Class 2Ad",
    timetable: [],
  },
  {
    className: "Class f",
    timetable: [],
  },
  {
    className: "Class 2Ag",
    timetable: [],
  },
  {
    className: "Class 2Ah",
    timetable: [],
  },
  {
    className: "Class 2Aj",
    timetable: [],
  },
  // ...more classes
];

export default function AdminSubSeasionPages({
  classesWithTimetables = sample,
  subseasonStatus = "current", // "current" | "upcoming" | "past"
}) {
  const refs = useRef({});
  const containerRef = useRef(null);
  const [active, setActive] = useState(
    classesWithTimetables[0]?.className || ""
  );

  // creat time table
  const navigate = useNavigate();

  const { schoolId, seasionId, subseasionId } = useParams();

  const handleEdit = (classItem) => {
    console.log(classItem.className);

    navigate(`edit/${classItem.className}`, {
      state: { timetable: classItem },
    });
  };

  // ensure a ref exists for each class
  useEffect(() => {
    classesWithTimetables.forEach((c) => {
      if (!refs.current[c.className]) refs.current[c.className] = null;
    });
  }, [classesWithTimetables]);

  const scrollTo = (className) => {
    const el = refs.current[className];
    if (el && containerRef.current) {
      // scroll the container so the element is visible at top
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // observe which section is in view to highlight sidebar
  useEffect(() => {
    const observerRoot = containerRef.current || null;
    const sections = Object.values(refs.current).filter(Boolean);
    if (!sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const name = entry.target.getAttribute("data-class");
            setActive(name);
          }
        });
      },
      {
        root: observerRoot,
        rootMargin: "0px 0px -60% 0px", // trigger when top 40% of section visible
        threshold: 0.1,
      }
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [classesWithTimetables]);

  const handleAI = (className) => {
    // call AI generate for one class
    console.log("AI generate for", className);
  };

  const handleExport = (className) => {
    // export this class' timetable as PDF / CSV
    console.log("Export", className);
  };

  return (
    <>
      <div className="asdttts">
        <div className="asdtttstss">
          <div className="asdtttstssts">
            <div className="asdtttstssls">
              <h1>
                2025/2026 - First Term - Timetable{" "}
                <span className="asdtttstsslsspn">Current Seasion</span>
              </h1>
              <Button>✨ Generate Timetables</Button>
            </div>
            <p className="llm">
              Sep 1, 2025 – Jul 31, 2026 • First Term Timetable
            </p>
          </div>
        </div>
      </div>
      <div className="page-wrap">
        <div className="page-grid">
          <aside className="sidebar" aria-label="Classes">
            <div className="sidebar-inner">
              {classesWithTimetables.map((c) => (
                <button
                  key={c.className}
                  className={`side-item ${
                    active === c.className ? "active" : ""
                  }`}
                  onClick={() => scrollTo(c.className)}
                >
                  <span className="class-name">{c.className}</span>
                  <span className="mini-meta">
                    {c.timetable?.length ?? 0} slots
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="content" ref={containerRef}>
            {classesWithTimetables.map((c) => (
              <section
                key={c.className}
                ref={(el) => (refs.current[c.className] = el)}
                data-class={c.className}
                className="timetable-card"
              >
                <div className="card-header">
                  <div>
                    <h3>{c.className}</h3>
                    <div className="subtle">
                      {c.timetable?.length
                        ? `${c.timetable.length} entries`
                        : "No timetable yet"}
                    </div>
                  </div>

                  <div className="card-actions">
                    {c.timetable?.length > 0 && subseasonStatus !== "past" && (
                      <>
                        {/* Desktop/Web: Show individual buttons */}
                        <div className="desktop-actions">
                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => handleEdit(c)}
                          >
                            Edit
                          </Button>

                          <Button
                            size="small"
                            variant="outline"
                            onClick={() => handleExport(c.className)}
                          >
                            Export
                          </Button>
                        </div>

                        {/* Mobile: Show dropdown with three dots */}
                        <div className="mobile-dropdown">
                          <div className="dropdown">
                            <button className="btnn small dropdown-toggle">
                              ⋮
                            </button>
                            <div className="dropdown-menu">
                              <button onClick={() => handleEdit(c)}>
                                Edit
                              </button>

                              <button onClick={() => handleExport(c.className)}>
                                Export
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="card-body">
                  {c.timetable?.length ? (
                    // use your Timetable component; it receives items for that class
                    <Timetable timetableData={c.timetable} compact />
                  ) : (
                    // <p>iii</p>
                    // <p>sfd</p>
                    <div className="no-data">
                      <p>There's no timetable for this class yet.</p>
                      {subseasonStatus !== "past" && (
                        <button className="btn" onClick={() => handleEdit(c)}>
                          Create timetable
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </main>
        </div>
      </div>
    </>
  );
}
