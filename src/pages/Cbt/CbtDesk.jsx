import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cbtContext } from "../../api_call/useCbt";
import CbtList from "./CbtList";
import "./CbtDesk.css";

/**
 * The CBT list for one subject and term. Admins reach it from the subject's term page and
 * teachers from the Tests tab; both pass the subject and term so they are never editable here.
 * Creating or editing a test happens on its own full page (`editorPath`) and running one on the
 * test's detail page (`detailPath`).
 */
const CbtDesk = ({ subjectId, subsessionId, lockedClassId = "", editorPath, detailPath }) => {
  const navigate = useNavigate();
  const [ctx, setCtx] = useState(null);
  const [error, setError] = useState("");

  const loadContext = useCallback(async () => {
    setError("");
    const res = await cbtContext(subjectId, subsessionId);
    if (!res.success) {
      setError(res.message || "Could not load the CBT workspace.");
      return;
    }
    setCtx(res.data);
  }, [subjectId, subsessionId]);

  useEffect(() => {
    setCtx(null);
    if (subjectId && subsessionId) loadContext();
  }, [subjectId, subsessionId, loadContext]);

  if (error) {
    return (
      <div className="cbt">
        <div className="cbt-card cbt-empty">
          <p className="cbt-error">{error}</p>
          <button type="button" className="cbt-btn" onClick={loadContext}>Try again</button>
        </div>
      </div>
    );
  }
  if (!ctx) return <div className="cbt"><div className="cbt-card cbt-empty">Loading CBT...</div></div>;

  const classes = lockedClassId ? ctx.classes.filter((item) => item.class_id === lockedClassId) : ctx.classes;
  const go = (name, extra = {}) => {
    if (name === "editor") navigate(editorPath(extra.testId));
    if (name === "detail") navigate(detailPath(extra.testId));
  };

  return (
    <div className="cbt">
      <CbtList ctx={{ ...ctx, classes }} lockedClassId={lockedClassId} go={go} />
    </div>
  );
};

export default CbtDesk;
