import "./InfoField.css";
import { useNavigate } from "react-router-dom";

const InfoField = ({ label, value, linkTo }) => {
  const navigate = useNavigate();

  const activate = () => { if (!linkTo) return; navigate(linkTo); };
  const onKeyDown = (e) => {
    if (!linkTo) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
  };

  return (
    <div className="ssp-info-item">
      <div className="ssp-info-label">{label}</div>
      {linkTo ? (
        <div
          className="ssp-info-value ssp-info-link"
          role="button"
          tabIndex={0}
          onClick={activate}
          onKeyDown={onKeyDown}
          aria-label={`${label}: ${value} — open`}
        >
          <span className="ssp-link-text">{value}</span>
          <span className="ssp-chev" aria-hidden="true">›</span>
        </div>
      ) : (
        <div className="ssp-info-value">{value}</div>
      )}
    </div>
  );
};

export default InfoField;
