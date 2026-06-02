import "./BehaviorAssessment.css";

const BehaviorAssessment = () => {
  // Behavior assessment data with field names and their ratings
  const behaviorData = {
    semester: "First Semester",
    academicYear: "2025/2026",
    behaviors: [
      { id: 1, field: "Punctuality", value: "A" },
      { id: 2, field: "Respect for Authority", value: "B" },
      { id: 3, field: "Cooperation", value: "A" },
      { id: 4, field: "Honesty", value: "A" },
      { id: 5, field: "Self Control", value: "C" },
    ],
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case "A":
        return "#10b981"; // Green
      case "B":
        return "#3b82f6"; // Blue
      case "C":
        return "#f59e0b"; // Orange
      case "D":
        return "#ef4444"; // Red
      default:
        return "#6b7280"; // Gray
    }
  };

  // Convert letter grades to numeric values for the graph
  const getRatingValue = (rating) => {
    switch (rating) {
      case "A":
        return 4;
      case "B":
        return 3;
      case "C":
        return 2;
      case "D":
        return 1;
      default:
        return 0;
    }
  };

  return (
    <div className="behaviorAssessment">
      <div className="behaviorHeader">
        <div className="behaviorTitle">
          <h2>Behavior Assessment</h2>
          <p>
            {behaviorData.semester} • {behaviorData.academicYear}
          </p>
        </div>
      </div>

      <div className="behaviorGraph">
        <div className="graphContainer">
          {/* Simple Legend */}
          <div className="simpleLegend">
            {[
              { rating: "A", label: "Excellent" },
              { rating: "B", label: "Good" },
              { rating: "C", label: "Fair" },
              { rating: "D", label: "Needs Work" },
            ].map((item) => (
              <div key={item.rating} className="legendItem">
                <div
                  className="legendDot"
                  style={{ backgroundColor: getRatingColor(item.rating) }}
                ></div>
                <span className="legendText">
                  {item.rating} - {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="graphWrapper">
            <svg
              className="behaviorChart"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
            >
              {/* Definitions for gradients and effects */}
              <defs>
                {/* Simple glow filter */}
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Area gradient */}
                <linearGradient
                  id="areaGradient"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Y-axis grid lines and labels */}
              {[1, 2, 3, 4].map((level) => {
                const y = 160 - (level - 1) * 40;
                const label = ["D", "C", "B", "A"][level - 1];
                return (
                  <g key={level}>
                    <line
                      x1={60}
                      y1={y}
                      x2={940}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <circle
                      cx={30}
                      cy={y}
                      r="8"
                      fill={getRatingColor(label)}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={30}
                      y={y + 1}
                      fill="white"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Calculate points for full width */}
              {(() => {
                const points = behaviorData.behaviors.map((behavior, index) => {
                  const x =
                    60 + index * (880 / (behaviorData.behaviors.length - 1));
                  const y = 160 - (getRatingValue(behavior.value) - 1) * 40;
                  return { x, y, behavior };
                });

                const pathData = points
                  .map(
                    (point, index) =>
                      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                  )
                  .join(" ");

                const areaPath = `${pathData} L ${
                  points[points.length - 1].x
                } 160 L 60 160 Z`;

                return (
                  <g>
                    {/* Area under the line */}
                    <path d={areaPath} fill="url(#areaGradient)" />

                    {/* Main line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3"
                      filter="url(#glow)"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {points.map((point, index) => (
                      <g key={index}>
                        {/* Main point */}
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="6"
                          fill={getRatingColor(point.behavior.value)}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="graphPoint"
                        />
                        {/* Rating label on point */}
                        <text
                          x={point.x}
                          y={point.y + 1}
                          fill="white"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {point.behavior.value}
                        </text>
                        {/* Behavior label - show full text */}
                        <text
                          x={point.x}
                          y={185}
                          fill="#6b7280"
                          fontSize="11"
                          fontWeight="500"
                          textAnchor="middle"
                          className="behaviorLabel"
                        >
                          {point.behavior.field}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      <div className="behaviorFooter">
        <div className="simpleStats">
          <div className="statCard">
            <span className="statLabel">Total</span>
            <span className="statValue">{behaviorData.behaviors.length}</span>
          </div>
          <div className="statCard">
            <span className="statLabel">Average</span>
            <span className="statValue">
              {(
                behaviorData.behaviors.reduce(
                  (sum, b) => sum + getRatingValue(b.value),
                  0
                ) / behaviorData.behaviors.length
              ).toFixed(1)}
            </span>
          </div>
          <div className="statCard">
            <span className="statLabel">Excellent</span>
            <span className="statValue" style={{ color: getRatingColor("A") }}>
              {behaviorData.behaviors.filter((b) => b.value === "A").length}
            </span>
          </div>
          <div className="statCard">
            <span className="statLabel">Good</span>
            <span className="statValue" style={{ color: getRatingColor("B") }}>
              {behaviorData.behaviors.filter((b) => b.value === "B").length}
            </span>
          </div>
          <div className="statCard">
            <span className="statLabel">Needs Work</span>
            <span className="statValue" style={{ color: getRatingColor("C") }}>
              {behaviorData.behaviors.filter((b) => b.value === "C").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorAssessment;
