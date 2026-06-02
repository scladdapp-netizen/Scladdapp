import "./LoadingData.css";

const LoadingData = ({ message = "Loading..." }) => {
  return (
    <div className="ld-container">
      <div className="ld-spinner-wrap">
        <svg className="ld-spinner" viewBox="0 0 50 50" fill="none">
          {/* Outer ring */}
          <circle
            className="ld-ring ld-ring-outer"
            cx="25" cy="25" r="20"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Middle ring */}
          <circle
            className="ld-ring ld-ring-mid"
            cx="25" cy="25" r="13"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Inner dot */}
          <circle className="ld-dot" cx="25" cy="25" r="3" />
        </svg>
      </div>
      {message && <p className="ld-message">{message}</p>}
    </div>
  );
};

export default LoadingData;
