import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cbtContext } from "../../api_call/useCbt";
import CbtEditor from "./CbtEditor";
import "./CbtDesk.css";

/**
 * Full-page editor for one test, on its own address. `testId` is empty for a new test.
 * `listPath` is the CBT list to return to and `editorPath(testId)` is this page's address.
 */
const CbtEditorPage = ({ subjectId, subsessionId, testId = "", lockedClassId = "", listPath, editorPath }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ctx, setCtx] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await cbtContext(subjectId, subsessionId);
    if (res.success) setCtx(res.data);
    else setError(res.message || "Could not load the test page.");
  }, [subjectId, subsessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const back = () => navigate(listPath);
  // After the first save a new test gets its own address, so a refresh reopens the same draft.
  const saved = (id) => {
    if (!testId && id) navigate(editorPath(id), { replace: true, state: location.state });
  };

  return (
    <div className="cbt cbt-page">
      <div className="cbt-page-inner">
        {error && (
          <div className="cbt-card cbt-empty">
            <p className="cbt-error">{error}</p>
            <div className="cbt-inline" style={{ justifyContent: "center" }}>
              <button type="button" className="cbt-ghost" onClick={back}>Back to tests</button>
              <button type="button" className="cbt-btn" onClick={load}>Try again</button>
            </div>
          </div>
        )}
        {!error && !ctx && <div className="cbt-card cbt-empty">Loading...</div>}
        {!error && ctx && (
          <CbtEditor
            ctx={lockedClassId ? { ...ctx, classes: ctx.classes.filter((item) => item.class_id === lockedClassId) } : ctx}
            testId={testId}
            lockedClassId={lockedClassId}
            onBack={back}
            onSaved={saved}
          />
        )}
      </div>
    </div>
  );
};

export default CbtEditorPage;
