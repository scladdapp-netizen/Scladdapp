import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../../../../../components/Button/Button";
import InnerTabCon from "../../../../../components/InnerTabCon/InnerTabCon";
import "../../../../../components/StatusFilterSwitch/StatusFilterSwitch.css";
import { useAuth } from "../../../../../context/AuthContext/AuthContext";
import { useNotification } from "../../../../../context/NotificationProvider/NotificationProvider";
import { useClass, useFetchStudentsPaginated, useSession, useStaffInfo } from "../../../../../api_call";
import {
  exportIdCardsPDF,
  formatCardDate,
  schoolForIdCard,
  sessionValidUntil,
} from "../../../../../utils/exportIdCardPDF";
import { loadPublishedSet } from "./editor/model";
import { CardBack, CardFront, isBoxKey, pieceStyle, PieceView } from "./IdCardFace";
import CardSurface from "./editor/CardSurface";
import "./IdCardTemplatePage.css";
import "./IdCards.css";

const classLabel = (row) => [row?.current_class_name, row?.current_class_stream].filter(Boolean).join(" ");

const studentCard = (row) => ({
  id: row.student_id,
  kind: "student",
  name: row.full_name || "Student",
  fullName: row.full_name || "Student",
  idNumber: row.admission_number || row.student_id || "",
  admissionNumber: row.admission_number || "",
  className: row.current_class_name || "",
  classArm: row.current_class_stream || "",
  role: classLabel(row),
  dateOfBirth: row.date_of_birth || "",
  phone: row.phone || "",
  email: row.email || "",
  address: row.address || "",
  gender: row.gender || "",
  bloodGroup: row.blood_group || "",
  photoUrl: row.student_photo || "",
  emergencyName: row.emergency_contact_name || row.guardian_name || "",
  emergencyPhone: row.emergency_contact_phone || row.guardian_phone || "",
  groupId: row.current_class_id || "",
});

const staffCard = (row) => ({
  id: row.staff_id,
  kind: "staff",
  name: row.full_name || "Staff",
  fullName: row.full_name || "Staff",
  idNumber: row.staff_id || "",
  employeeId: row.staff_id || "",
  jobTitle: row.job_title || row.position || "",
  department: row.department || "",
  role: [row.job_title || row.position, row.department].filter(Boolean).join(" · "),
  dateOfBirth: row.date_of_birth || "",
  phone: row.phone || "",
  email: row.email || "",
  address: row.address || [row.house_number_street, row.area_estate, row.city, row.state_of_residence].filter(Boolean).join(", "),
  gender: row.gender || "",
  qualification: row.qualification || "",
  joiningDate: row.joining_date || "",
  bloodGroup: row.blood_group || "",
  photoUrl: row.staff_photo || "",
  emergencyName: row.emergency_contact_name || "",
  emergencyPhone: row.emergency_contact_phone || "",
  groupId: row.department || "",
});

const IdCards = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const { getClassesBySchoolId } = useClass();
  const { getStudentsPaginated } = useFetchStudentsPaginated();
  const { getStaffBySchoolId } = useStaffInfo();
  const { getSessionsBySchool } = useSession();

  const admin = user?.admin;
  const isSuperAdmin =
    admin?.admin_role === "Super Admin" ||
    (Array.isArray(admin?.permissions) && admin.permissions.includes("ALL"));
  const canStudents = isSuperAdmin || !!admin?.permissions?.students?.read;
  const canStaff = isSuperAdmin || !!admin?.permissions?.staff?.read;

  const [audience, setAudience] = useState(canStudents ? "student" : "staff");
  const [students, setStudents] = useState([]);
  const [staff, setStaff] = useState([]);
  const [classes, setClasses] = useState([]);
  const [groupId, setGroupId] = useState("all");
  const [query, setQuery] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [cardSet, setCardSet] = useState(() => loadPublishedSet(schoolId));
  const [sessionName, setSessionName] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewSide, setPreviewSide] = useState("front");
  const template = audience === "staff" ? cardSet.staff : cardSet.student;
  const school = schoolForIdCard(user?.school);
  const validLabel = validUntil ? `Valid until ${formatCardDate(validUntil)}` : "";

  useEffect(() => {
    setCardSet(loadPublishedSet(schoolId));
  }, [schoolId]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const jobs = [getSessionsBySchool(schoolId), getClassesBySchoolId(schoolId)];
        if (canStudents) jobs.push(getStudentsPaginated(schoolId, { page: 1, limit: 5000, status: "active", sortBy: "full_name", sortOrder: "asc" }));
        if (canStaff) jobs.push(getStaffBySchoolId(schoolId));
        const [sessionRes, classRes, peopleRes, staffRes] = await Promise.all(jobs);
        if (cancel) return;
        setValidUntil(sessionValidUntil(sessionRes?.data));
        const activeSession = (sessionRes?.data || []).find((row) => row.session_status === "active");
        setSessionName(activeSession?.session_name || "");
        const classRows = (classRes?.data || []).filter((row) => row.is_active !== false);
        classRows.sort((a, b) => String(a.class_name || "").localeCompare(String(b.class_name || "")));
        setClasses(classRows);
        if (canStudents) setStudents((peopleRes?.data || []).map(studentCard));
        const staffPayload = canStudents ? staffRes : peopleRes;
        if (canStaff) {
          setStaff((staffPayload?.data || [])
            .filter((row) => (row.record_status || "active") === "active")
            .map(staffCard));
        }
      } catch {
        if (!cancel) addNotification("Could not load people for ID cards", "error");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [schoolId, canStudents, canStaff]);

  const source = audience === "staff" ? staff : students;

  const groups = useMemo(() => {
    if (audience === "staff") {
      const names = [...new Set(staff.map((row) => row.groupId).filter(Boolean))].sort();
      return names.map((name) => ({ id: name, label: name }));
    }
    return classes.map((row) => ({
      id: row.class_id,
      label: [row.class_name, row.class_section].filter(Boolean).join(" "),
    }));
  }, [audience, classes, staff]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter((row) => {
      if (groupId !== "all" && row.groupId !== groupId) return false;
      if (!q) return true;
      return [row.name, row.idNumber, row.role].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [source, groupId, query]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyVisible = visible.every((row) => next.has(row.id));
      visible.forEach((row) => {
        if (everyVisible) next.delete(row.id);
        else next.add(row.id);
      });
      return next;
    });
  };

  const switchAudience = (next) => {
    setAudience(next);
    setGroupId("all");
    setQuery("");
    setSelected(new Set());
    setPreview(null);
  };

  const openPreview = (card) => {
    setPreview(card);
    setPreviewSide("front");
  };

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  const download = async (rows) => {
    if (!rows.length) {
      addNotification("Choose at least one person", "error");
      return;
    }
    setDownloading(true);
    try {
      await exportIdCardsPDF({
        cards: rows.map((row) => ({ ...row, session: sessionName })),
        school: schoolForIdCard(user?.school),
        validUntil,
        template,
        filename: `${audience}-id-cards.pdf`,
      });
      addNotification(`Downloaded ${rows.length} ID card${rows.length === 1 ? "" : "s"}`, "success");
    } catch (err) {
      addNotification(err.message || "Could not create the ID cards", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (!canStudents && !canStaff) {
    return (
      <InnerTabCon>
        <div className="idc-page">
          <h2>ID Cards</h2>
          <p className="idc-muted">Student or staff access is required to generate ID cards.</p>
        </div>
      </InnerTabCon>
    );
  }

  const selectedVisible = visible.filter((row) => selected.has(row.id));

  return (
    <InnerTabCon>
    <div className="idc-page">
      <div className="idc-header dir-header">
        <div className="dir-header-text">
          <h2>ID Cards</h2>
          <p>Print wallet cards from the student and staff records already in the school.</p>
        </div>
        {canStudents && canStaff && (
          <div className="sfs-track" role="tablist" aria-label="Card type">
            <button
              type="button"
              role="tab"
              aria-selected={audience === "student"}
              className={`sfs-btn${audience === "student" ? " is-active" : ""}`}
              onClick={() => switchAudience("student")}
            >
              <span>Students</span>
              <span className="sfs-count">{students.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === "staff"}
              className={`sfs-btn${audience === "staff" ? " is-active" : ""}`}
              onClick={() => switchAudience("staff")}
            >
              <span>Staff</span>
              <span className="sfs-count">{staff.length}</span>
            </button>
          </div>
        )}
      </div>

      <div className="idc-bar">
        <div className="idc-filters">
          <input
            className="idc-search"
            type="search"
            value={query}
            placeholder="Search name or ID"
            aria-label="Search name or ID"
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="idc-filter"
            value={groupId}
            aria-label={audience === "staff" ? "Department" : "Class"}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="all">{audience === "staff" ? "All departments" : "All classes"}</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>{group.label}</option>
            ))}
          </select>
        </div>
        <div className="idc-actions">
          <Button
            variant="secondary"
            onClick={() => download(selectedVisible)}
            disabled={downloading || !selectedVisible.length}
            loading={downloading}
            loadingText="Preparing..."
          >
            Download selected ({selectedVisible.length})
          </Button>
          <Button onClick={() => navigate(`/admin/${schoolId}/school_directory/id-card-template`)}>
            Edit ID Card Template
          </Button>
        </div>
      </div>

      {selectedVisible.length > 0 && (
        <div className="idc-select-all">
          <button type="button" onClick={selectAllVisible}>
            {visible.every((row) => selected.has(row.id)) ? "Clear selection" : `Select all (${visible.length})`}
          </button>
          <span>{selectedVisible.length} selected</span>
        </div>
      )}

      {loading ? (
        <div className="idc-loading" role="status" aria-live="polite" aria-busy="true">
          <p className="idc-loading-label">Loading records</p>
          <div className="idc-grid" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="idc-card idc-skel">
                <span className="idc-skel-photo" />
                <span className="idc-copy">
                  <span className="idc-skel-line is-name" />
                  <span className="idc-skel-line" />
                  <span className="idc-skel-line is-id" />
                </span>
                <span className="idc-skel-tick" />
              </div>
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <p className="idc-empty">No {audience === "staff" ? "staff" : "students"} match this filter.</p>
      ) : (
        <div className="idc-grid">
          {visible.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`idc-card${selected.has(card.id) ? " selected" : ""}`}
              onClick={() => openPreview(card)}
            >
              {card.photoUrl ? (
                <img src={card.photoUrl} alt="" className="idc-photo" />
              ) : (
                <span className="idc-photo fallback">{card.name.slice(0, 1)}</span>
              )}
              <span className="idc-copy">
                <strong>{card.name}</strong>
                <span>{card.role || "—"}</span>
                {card.idNumber && <span className="idc-id">{card.idNumber}</span>}
              </span>
              <input
                type="checkbox"
                className="idc-tick"
                checked={selected.has(card.id)}
                onChange={() => toggle(card.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${card.name}`}
              />
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="idc-pop" onClick={() => setPreview(null)}>
          <div
            className="idc-pop-card"
            role="dialog"
            aria-modal="true"
            aria-label={`${preview.name} ID card`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="idc-pop-head">
              <strong>{preview.name}</strong>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close">Close</button>
            </div>
            <div className="ict-side">
              <button type="button" className={previewSide === "front" ? "on" : ""} onClick={() => setPreviewSide("front")}>Front</button>
              <button type="button" className={previewSide === "back" ? "on" : ""} onClick={() => setPreviewSide("back")}>Back</button>
            </div>
            <div className="ict-board">
              {template.editorVersion === 2 ? (
                <div className="idc-preview-slot">
                  <div
                    className="idc-preview-fit"
                    style={{ aspectRatio: `${430} / ${Math.round(430 * ((template.heightMm || 54) / (template.widthMm || 86)))}` }}
                  >
                    <div
                      className="idc-preview-scale"
                      style={{ width: 430, height: Math.round(430 * ((template.heightMm || 54) / (template.widthMm || 86))) }}
                    >
                      <CardSurface
                        template={template}
                        side={previewSide}
                        person={{ ...preview, session: sessionName }}
                        school={school}
                        extras={{ issueDate: formatCardDate(new Date().toISOString().slice(0, 10)), expiryDate: formatCardDate(validUntil) }}
                        preview
                      />
                    </div>
                  </div>
                </div>
              ) : previewSide === "back" ? (
                <CardBack blank={Array.isArray(template.placements?.back)} design={template} person={{ ...preview, session: sessionName }} school={school} />
              ) : (
                <CardFront
                  blank={Array.isArray(template.placements?.front)}
                  design={template}
                  person={{ ...preview, session: sessionName }}
                  school={school}
                  kind={preview.kind}
                  validLabel={validLabel}
                />
              )}
              {template.editorVersion !== 2 && Array.isArray(template.placements?.[previewSide]) && (
                <div className="ict-layer">
                  {template.placements[previewSide].map((item) => (
                    <div
                      key={item.key}
                      className={`ict-piece is-locked${isBoxKey(item.key) ? " is-box" : ` is-${item.key}`}`}
                      style={{
                        ...pieceStyle(item),
                        ...(isBoxKey(item.key) ? { "--box-header": template.headerColor || "#111111" } : {}),
                      }}
                    >
                      {!isBoxKey(item.key) && (
                        <PieceView
                          pieceKey={item.key}
                          design={template}
                          person={{ ...preview, session: sessionName }}
                          school={school}
                          kind={preview.kind}
                          validLabel={validLabel}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </InnerTabCon>
  );
};

export default IdCards;
