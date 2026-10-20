import { useEffect, useMemo, useState } from "react";
import { cbtPublish, cbtStudents } from "../../api_call/useCbt";
import { CbtModal } from "./CbtModal";
import { fmt, formatDateTime, fromLocalInput } from "./cbtUtils";

const examLink = () => `${window.location.origin}/exam`;

/**
 * Assign students to a draft test and make it live. Nothing starts yet: the teacher starts each
 * student's countdown from the Students tab. A closing time is optional.
 */
const CbtPublishModal = ({ test, onClose, onDone }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("all");
  const [closesAt, setClosesAt] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [upgrade, setUpgrade] = useState(false);
  const [published, setPublished] = useState(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await cbtStudents(test.test_id);
      if (!alive) return;
      if (res.success) {
        setStudents(res.data);
        setSelected(new Set(res.data.map((row) => row.student_id)));
      } else {
        setLoadError(res.message || "Could not load the class list.");
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [test.test_id]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((row) => {
      if (show === "selected" && !selected.has(row.student_id)) return false;
      if (show === "unselected" && selected.has(row.student_id)) return false;
      if (!term) return true;
      return `${row.full_name} ${row.admission_number || ""}`.toLowerCase().includes(term);
    });
  }, [students, search, show, selected]);

  const allVisibleSelected = visible.length > 0 && visible.every((row) => selected.has(row.student_id));
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((row) => (allVisibleSelected ? next.delete(row.student_id) : next.add(row.student_id)));
      return next;
    });

  const closesIso = fromLocalInput(closesAt);
  const problem =
    closesAt && new Date(closesIso).getTime() <= Date.now() ? "The closing time must be in the future." :
    selected.size === 0 ? "Select at least one student." : "";

  const assign = async () => {
    setBusy(true);
    setError("");
    const res = await cbtPublish(test.test_id, { closes_at: closesIso, student_ids: [...selected] });
    setBusy(false);
    if (!res.success) {
      setConfirming(false);
      setUpgrade(res.code === "upgrade_required");
      setError(res.message || "Could not assign students.");
      return;
    }
    setPublished({ code: res.data.access_code, count: res.assigned });
  };

  const copy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };

  if (published) {
    return (
      <CbtModal
        title="Students assigned"
        onClose={() => onDone(published)}
        footer={<button type="button" className="cbt-btn" onClick={() => onDone(published)}>Done</button>}
      >
        <p className="cbt-modal-text">
          "{test.title}" is ready for {published.count} student{published.count === 1 ? "" : "s"}. Nobody has started yet: select students on the Students tab and press Start to begin their countdown. Give them this exam code and ask them to open the exam page.
        </p>
        <div className="cbt-code">
          <span className="cbt-code-value">{published.code}</span>
          <button type="button" className="cbt-ghost" onClick={() => copy(published.code, "code")}>{copied === "code" ? "Copied" : "Copy code"}</button>
        </div>
        <div className="cbt-code is-link">
          <span className="cbt-code-link">{examLink()}</span>
          <button type="button" className="cbt-ghost" onClick={() => copy(examLink(), "link")}>{copied === "link" ? "Copied" : "Copy link"}</button>
        </div>
        <p className="cbt-muted">Only the students you selected can open the test with this code, and only after you start them.</p>
      </CbtModal>
    );
  }

  return (
    <CbtModal
      title={confirming ? "Assign these students?" : "Assign students"}
      onClose={onClose}
      locked={busy}
      wide
      footer={
        confirming ? (
          <>
            <button type="button" className="cbt-ghost" onClick={() => setConfirming(false)} disabled={busy}>Back</button>
            <button type="button" className="cbt-btn" onClick={assign} disabled={busy}>{busy ? "Assigning..." : "Assign students"}</button>
          </>
        ) : (
          <>
            <button type="button" className="cbt-ghost" onClick={onClose}>Cancel</button>
            <button type="button" className="cbt-btn" disabled={Boolean(problem) || loading} title={problem} onClick={() => { setError(""); setConfirming(true); }}>Continue</button>
          </>
        )
      }
    >
      {error && (
        <div className={`cbt-error-banner${upgrade ? " is-upgrade" : ""}`} role="alert">
          <p className="cbt-error">{error}</p>
          {upgrade && <p className="cbt-muted">Your draft is saved and nothing has been assigned to students.</p>}
        </div>
      )}

      {confirming ? (
        <div className="cbt-confirm">
          <p className="cbt-modal-text">
            Assign "{test.title}" to <strong>{selected.size}</strong> student{selected.size === 1 ? "" : "s"}?
          </p>
          <ul className="cbt-facts">
            <li>Total marks: {fmt(test.total_marks)}, duration {test.duration_minutes} minutes for each student.</li>
            <li>{closesAt ? `Closes: ${formatDateTime(closesIso)}` : "No closing time. It stays open until you close it."}</li>
            <li>Once assigned, the questions can no longer be edited.</li>
            <li>Nothing starts until you start each student. Students are not notified.</li>
          </ul>
        </div>
      ) : loading ? (
        <p className="cbt-empty">Loading students...</p>
      ) : loadError ? (
        <p className="cbt-error">{loadError}</p>
      ) : (
        <>
          <label className="cbt-field">
            Closes (optional)
            <input type="datetime-local" value={closesAt} onChange={(event) => setClosesAt(event.target.value)} />
          </label>
          <div className="cbt-pick-bar">
            <input className="cbt-search" placeholder="Search students" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select value={show} onChange={(event) => setShow(event.target.value)} aria-label="Filter students">
              <option value="all">All students</option>
              <option value="selected">Selected</option>
              <option value="unselected">Not selected</option>
            </select>
          </div>
          <div className="cbt-pick-count">
            <label className="cbt-check">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} disabled={visible.length === 0} />
              Select all shown
            </label>
            <span>{selected.size} of {students.length} selected</span>
          </div>
          <div className="cbt-students">
            {students.length === 0 && <p className="cbt-empty">No students are enrolled in this class for this term.</p>}
            {visible.map((row) => (
              <label key={row.student_id} className="cbt-person">
                <span><input type="checkbox" checked={selected.has(row.student_id)} onChange={() => toggle(row.student_id)} />{row.full_name}</span>
                <span className="cbt-muted">{row.admission_number || ""}</span>
              </label>
            ))}
          </div>
          {problem && <p className="cbt-hint">{problem}</p>}
        </>
      )}
    </CbtModal>
  );
};

export default CbtPublishModal;
