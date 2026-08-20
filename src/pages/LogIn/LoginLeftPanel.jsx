import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext/ThemeContext";
import useSchool from "../../api_call/useSchool";
import "./LoginLeftPanel.css";

const BOX_SIZE = 140;
const GAP = 2;
const EDGE_COLS = 3; // how many cols from the right edge get scattered

const LoginLeftPanel = ({ schoolId = null }) => {
  const { resolved } = useTheme();
  const rootRef = useRef(null);
  const [grid, setGrid] = useState({ cols: 10, rows: 8 });
  const [schoolProfile, setSchoolProfile] = useState(null);
  const { getProfile } = useSchool();

  // Fetch school profile when schoolId is provided
  useEffect(() => {
    if (!schoolId) {
      setSchoolProfile(null);
      return;
    }
    getProfile(schoolId).then((res) => {
      if (res.success) setSchoolProfile(res.data);
    });
  }, [schoolId]);
  const animCancelRef = useRef(false);

  // Measure container and compute cols/rows to fill it
  useEffect(() => {
    const measure = () => {
      if (!rootRef.current) return;
      const { width, height } = rootRef.current.getBoundingClientRect();
      const cols = Math.ceil(width / (BOX_SIZE + GAP)) + 1;
      const rows = Math.ceil(height / (BOX_SIZE + GAP)) + 1;
      setGrid({ cols, rows });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  // Run animation whenever grid changes
  useEffect(() => {
    if (!grid.cols || !grid.rows) return;
    animCancelRef.current = false;

    let stopFn = null;

    const run = async () => {
      const { animate, utils } = await import("animejs");
      if (animCancelRef.current) return;

      const squares = rootRef.current?.querySelectorAll(".llp-square");
      if (!squares || !squares.length) return;

      const animateGrid = () => {
        if (animCancelRef.current) return;
        animate(squares, {
          opacity: [
            { to: [0.04, 0.45] },
            { to: 0.04 },
          ],
          delay: utils.stagger(120, {
            grid: [grid.cols, grid.rows],
            from: utils.random(0, grid.cols * grid.rows - 1),
          }),
          duration: 1400,
          ease: "inOutSine",
          onComplete: animateGrid,
        });
      };

      animateGrid();
    };

    run();

    return () => { animCancelRef.current = true; };
  }, [grid.cols, grid.rows]);

  const total = grid.cols * grid.rows;

  // Pre-compute which cells are visible — right-edge cols get randomly scattered
  const visible = Array.from({ length: total }, (_, i) => {
    const col = i % grid.cols;
    const distFromRight = grid.cols - 1 - col;
    if (distFromRight >= EDGE_COLS) return true;
    // probability of showing drops as we approach the right edge
    const chance = distFromRight / EDGE_COLS; // 0 at last col, ~1 at EDGE_COLS away
    return Math.random() < chance * 0.85;
  });

  return (
    <div className="llp-root" ref={rootRef}>
      {/* Clipping wrapper — grid is hard-clipped to this box */}
      <div className="llp-grid-clip">
        <div
          className="llp-grid"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, ${BOX_SIZE}px)`,
            gridTemplateRows: `repeat(${grid.rows}, ${BOX_SIZE}px)`,
            gap: `${GAP}px`,
          }}
        >
          {Array.from({ length: total }).map((_, i) => (
            <div
              className="llp-square"
              key={i}
              style={!visible[i] ? { opacity: 0, pointerEvents: "none" } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Centered overlay */}
      <div className="llp-content">
        {schoolProfile ? (
          // School branding
          <>
            <div className="llp-logo llp-logo--school">
              {schoolProfile.logo_url ? (
                <img
                  src={schoolProfile.logo_url}
                  alt={schoolProfile.school_name}
                  className="llp-school-logo-img"
                />
              ) : (
                <span className="llp-school-logo-initial">
                  {schoolProfile.school_name?.charAt(0)?.toUpperCase() || "S"}
                </span>
              )}
            </div>
            <h1 className="llp-title llp-title--school">
              {schoolProfile.school_name}
            </h1>
            <p className="llp-sub">
              {schoolProfile.address || "Welcome back"}
            </p>
          </>
        ) : (
          // Default Scladapp branding
          <>
            <div className="llp-logo">
              <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l7 3.5-7 3.5-7-3.5L8 1z" fill="currentColor" />
                <path d="M1 8l7 3.5L15 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                <path d="M1 11.5l7 3.5 7-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.3" />
              </svg>
            </div>
            <h1 className="llp-title">Scladapp</h1>
            <p className="llp-sub">School management,<br />simplified.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginLeftPanel;
