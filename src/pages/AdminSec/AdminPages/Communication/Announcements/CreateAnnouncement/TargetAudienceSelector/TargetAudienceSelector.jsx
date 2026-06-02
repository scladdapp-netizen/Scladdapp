import { useState, useEffect } from "react";
import SearchableSelect from "../../../../../../../components/SearchableSelect/SearchableSelect";
import { useAuth } from "../../../../../../../context/AuthContext/AuthContext";
import useTargetAudience from "../../../../../../../api_call/useTargetAudience";
import "./TargetAudienceSelector.css";

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const IconWholeSchool = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const IconStudent = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const IconStaff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

const IconAlumni = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconClasses = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
    <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7"/>
  </svg>
);

const ICONS = {
  whole_school:     <IconWholeSchool />,
  all_students:     <IconStudent />,
  all_staff:        <IconStaff />,
  all_alumni:       <IconAlumni />,
  alumni_by_year:   <IconAlumni />,
  specific_classes: <IconClasses />,
  specific_students:<IconStudent />,
  specific_staff:   <IconStaff />,
  specific_alumni:  <IconAlumni />,
};

const TYPE_BADGE = {
  Student: { bg: "#dcfce7", color: "#166634" },
  Staff:   { bg: "#dbeafe", color: "#1e40af" },
  Alumni:  { bg: "#ede9fe", color: "#6d28d9" },
};

const TargetAudienceSelector = ({
  selectedType,
  selectedTargets,
  onChange,
  onRecipientsChange,
  excludeTypes = [],
}) => {
  const { user } = useAuth();
  const schoolId = user?.school?.school_id;

  const { loading, fetchClasses, fetchStudentsByClass, fetchStudents, fetchStaff, fetchAlumni } =
    useTargetAudience();

  const [selectedItems, setSelectedItems]               = useState([]);
  const [selectedGraduationYear, setSelectedGraduationYear] = useState("");
  const [selectedFromDropdown, setSelectedFromDropdown] = useState("");
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [classStudents, setClassStudents]               = useState([]);
  const [classes, setClasses]   = useState([]);
  const [students, setStudents] = useState([]);
  const [staff, setStaff]       = useState([]);
  const [alumni, setAlumni]     = useState([]);

  const targetOptions = [
    { value: "whole_school",      label: "Whole School",      description: "All students, staff, and alumni" },
    { value: "all_students",      label: "All Students",      description: "All enrolled students" },
    { value: "all_staff",         label: "All Staff",         description: "All teaching and non-teaching staff" },
    { value: "all_alumni",        label: "All Alumni",        description: "All graduated students" },
    { value: "alumni_by_year",    label: "Alumni by Year",    description: "Select alumni from graduation years" },
    { value: "specific_classes",  label: "Specific Classes",  description: "Select individual classes" },
    { value: "specific_students", label: "Specific Students", description: "Select individual students" },
    { value: "specific_staff",    label: "Specific Staff",    description: "Select individual staff members" },
    { value: "specific_alumni",   label: "Specific Alumni",   description: "Select individual alumni/graduates" },
  ];

  useEffect(() => {
    if (!schoolId) return;
    if (selectedType === "specific_classes")  fetchClasses(schoolId).then(setClasses);
    else if (selectedType === "specific_students") fetchStudents(schoolId).then(setStudents);
    else if (selectedType === "specific_staff")    fetchStaff(schoolId).then(setStaff);
    else if (selectedType === "specific_alumni" || selectedType === "alumni_by_year")
      fetchAlumni(schoolId).then(setAlumni);
  }, [selectedType, schoolId]);

  useEffect(() => { setSelectedItems(selectedTargets || []); }, [selectedTargets]);

  useEffect(() => {
    if (!schoolId) return;
    if (["whole_school","all_students","all_alumni"].includes(selectedType)) {
      if (students.length === 0) fetchStudents(schoolId).then(setStudents);
      if (alumni.length === 0)   fetchAlumni(schoolId).then(setAlumni);
    }
    if (["whole_school","all_staff"].includes(selectedType)) {
      if (staff.length === 0) fetchStaff(schoolId).then(setStaff);
    }
  }, [selectedType, schoolId]);

  useEffect(() => {
    if (!selectedType) return;
    const list = getRecipientsList();
    if (list.length > 0) onRecipientsChange?.(list);
  }, [students, staff, alumni, classStudents, selectedType]);

  const handleTypeChange = (type) => {
    onChange(type, []);
    setSelectedItems([]);
    setSelectedGraduationYear("");
    setClassStudents([]);
  };

  const handleItemSelection = (items) => {
    setSelectedItems(items);
    onChange(selectedType, items);
    onRecipientsChange?.(items);
  };

  const handleRemoveFromList = (itemId) =>
    handleItemSelection(selectedItems.filter((i) => i.id !== itemId));

  const getItemSubtitle = (item) => {
    switch (item.type) {
      case "class":   return `${item.students} student${item.students !== 1 ? "s" : ""}`;
      case "student": return item.class || item.email || "";
      case "staff":   return `${item.role}${item.department ? " · " + item.department : ""}`;
      case "alumni":  return `Class of ${item.graduationYear}${item.currentOccupation ? " · " + item.currentOccupation : ""}`;
      default:        return item.email || "";
    }
  };

  const getDataForType = () => {
    switch (selectedType) {
      case "specific_classes":  return classes;
      case "specific_students": return students;
      case "specific_staff":    return staff;
      case "specific_alumni":   return alumni;
      case "alumni_by_year":    return selectedGraduationYear ? alumni.filter(a => a.graduationYear === selectedGraduationYear) : [];
      default: return [];
    }
  };

  const getTargetSummary = () => {
    switch (selectedType) {
      case "whole_school": {
        const sc = excludeTypes.includes("all_staff") ? 0 : staff.length;
        const total = students.length + sc + alumni.length;
        return `Entire school community (${total} recipients)`;
      }
      case "all_students":   return `All students (${students.length} recipients)`;
      case "all_staff":      return `All staff (${staff.length} recipients)`;
      case "all_alumni":     return `All alumni (${alumni.length} recipients)`;
      case "alumni_by_year":
        if (selectedGraduationYear) {
          const count = alumni.filter(a => a.graduationYear === selectedGraduationYear).length;
          return `Class of ${selectedGraduationYear} (${count} alumni)`;
        }
        return "Select a graduation year";
      case "specific_classes":
        if (selectedItems.length === 0) return "No classes selected";
        if (classStudentsLoading) return `${selectedItems.length} class${selectedItems.length !== 1 ? "es" : ""} selected — fetching students...`;
        return `${selectedItems.length} class${selectedItems.length !== 1 ? "es" : ""} selected — ${classStudents.length} student${classStudents.length !== 1 ? "s" : ""}`;
      default:
        return selectedItems.length > 0
          ? `${selectedItems.length} selected recipient${selectedItems.length !== 1 ? "s" : ""}`
          : "No recipients selected";
    }
  };

  const getRecipientsList = () => {
    switch (selectedType) {
      case "all_students": return students.map(s => ({ id: s.id, name: s.name, subtitle: s.class || "", type: "Student" }));
      case "all_staff":    return staff.map(s => ({ id: s.id, name: s.name, subtitle: `${s.role}${s.department ? " · " + s.department : ""}`, type: "Staff" }));
      case "all_alumni":   return alumni.map(a => ({ id: a.id, name: a.name, subtitle: `Class of ${a.graduationYear}`, type: "Alumni" }));
      case "whole_school": return [
        ...students.map(s => ({ id: s.id, name: s.name, subtitle: s.class || "", type: "Student" })),
        ...(excludeTypes.includes("all_staff") ? [] : staff.map(s => ({ id: s.id, name: s.name, subtitle: s.role || "", type: "Staff" }))),
        ...alumni.map(a => ({ id: a.id, name: a.name, subtitle: `Class of ${a.graduationYear}`, type: "Alumni" })),
      ];
      case "specific_classes": return classStudents.map(s => ({ id: s.id, name: s.name, subtitle: s.class || "", type: "Student" }));
      default: return [];
    }
  };

  const broadTypes = ["all_students","all_staff","all_alumni","whole_school","specific_classes"];
  const recipientsList = getRecipientsList();
  const filteredOptions = excludeTypes.length
    ? targetOptions.filter(o => !excludeTypes.includes(o.value))
    : targetOptions;

  const needsSelection = ["specific_classes","specific_students","specific_staff","specific_alumni","alumni_by_year"].includes(selectedType);

  const graduationYears = [...new Set(alumni.map(a => a.graduationYear))]
    .filter(Boolean).sort((a, b) => b - a)
    .map(year => ({ year, label: `Class of ${year}`, count: alumni.filter(a => a.graduationYear === year).length }));

  return (
    <div className="tas-wrap">

      {/* ── Option grid ── */}
      <div className="tas-grid">
        {filteredOptions.map((opt) => (
          <div
            key={opt.value}
            className={`tas-option ${selectedType === opt.value ? "selected" : ""}`}
            onClick={() => handleTypeChange(opt.value)}
          >
            <div className="tas-option-icon">
              {ICONS[opt.value]}
            </div>
            <div className="tas-option-body">
              <span className="tas-option-label">{opt.label}</span>
              <span className="tas-option-desc">{opt.description}</span>
            </div>
            {selectedType === opt.value && (
              <div className="tas-option-check">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Summary banner ── */}
      {selectedType && (
        <div className="tas-summary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.7"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
          <span><strong>Target:</strong> {getTargetSummary()}</span>
        </div>
      )}

      {/* ── Recipients list for broad types ── */}
      {broadTypes.includes(selectedType) && recipientsList.length > 0 && (
        <div className="tas-recipients">
          <p className="tas-recipients-title">Selected Recipients ({recipientsList.length})</p>
          <div className="tas-recipients-grid">
            {recipientsList.map((r) => {
              const badge = TYPE_BADGE[r.type] || TYPE_BADGE.Student;
              return (
                <div key={r.id} className="tas-recipient-card">
                  <div className="tas-recipient-info">
                    <div className="tas-recipient-row">
                      <span className="tas-recipient-name">{r.name}</span>
                      <span className="tas-type-badge" style={{ background: badge.bg, color: badge.color }}>{r.type}</span>
                    </div>
                    {r.subtitle && <span className="tas-recipient-sub">{r.subtitle}</span>}
                  </div>
                  <button
                    className="tas-remove-btn"
                    onClick={() => {
                      if (selectedType === "specific_classes") {
                        setClassStudents(prev => prev.filter(s => s.id !== r.id));
                      } else {
                        if (r.type === "Student") setStudents(prev => prev.filter(s => s.id !== r.id));
                        else if (r.type === "Staff") setStaff(prev => prev.filter(s => s.id !== r.id));
                        else if (r.type === "Alumni") setAlumni(prev => prev.filter(s => s.id !== r.id));
                      }
                    }}
                    title="Remove"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedType === "specific_classes" && classStudentsLoading && (
        <p className="tas-loading">Fetching students...</p>
      )}

      {/* ── Specific selection interface ── */}
      {needsSelection && (
        <div className="tas-selection">
          {loading && <p className="tas-loading">Loading...</p>}

          {selectedType === "alumni_by_year" ? (
            <div className="tas-year-section">
              <p className="tas-section-label">Select Graduation Year</p>
              {graduationYears.length === 0 && !loading ? (
                <p className="tas-loading">No alumni records found.</p>
              ) : (
                <div className="tas-year-grid">
                  {graduationYears.map((yd) => (
                    <div
                      key={yd.year}
                      className={`tas-year-option ${selectedGraduationYear === yd.year ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedGraduationYear(yd.year);
                        const ya = alumni.filter(a => a.graduationYear === yd.year);
                        setSelectedItems(ya);
                        onChange(selectedType, ya);
                        onRecipientsChange?.(ya);
                      }}
                    >
                      <span className="tas-year-label">{yd.label}</span>
                      <span className="tas-year-count">{yd.count} alumni</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedGraduationYear && selectedItems.length > 0 && (
                <div className="tas-recipients">
                  <p className="tas-recipients-title">Selected Recipients ({selectedItems.length})</p>
                  <div className="tas-recipients-grid">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="tas-recipient-card">
                        <div className="tas-recipient-info">
                          <div className="tas-recipient-row">
                            <span className="tas-recipient-name">{item.name}</span>
                            <span className="tas-type-badge" style={{ background: "#ede9fe", color: "#6d28d9" }}>Alumni</span>
                          </div>
                          <span className="tas-recipient-sub">{getItemSubtitle(item)}</span>
                        </div>
                        <button className="tas-remove-btn" onClick={() => handleRemoveFromList(item.id)} title="Remove">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="tas-searchable">
                <SearchableSelect
                  label={`Select ${selectedType.replace("specific_", "").replace("_", " ")}`}
                  placeholder={loading ? "Loading..." : `Choose ${selectedType.replace("specific_", "").replace("_", " ")} to add...`}
                  options={getDataForType().map(item => ({
                    value: item.id,
                    label: item.name,
                    subtitle: getItemSubtitle(item),
                  }))}
                  value={selectedFromDropdown}
                  onChange={async (val) => {
                    if (!val) return;
                    const data = getDataForType();
                    const itemToAdd = data.find(i => i.id === val);
                    if (!itemToAdd || selectedItems.find(i => i.id === itemToAdd.id)) {
                      setSelectedFromDropdown(""); return;
                    }
                    const newItems = [...selectedItems, itemToAdd];
                    setSelectedItems(newItems);
                    onChange(selectedType, newItems);
                    onRecipientsChange?.(newItems);
                    setSelectedFromDropdown("");
                    if (selectedType === "specific_classes") {
                      setClassStudentsLoading(true);
                      const fetched = await fetchStudentsByClass(schoolId, val);
                      setClassStudents(prev => {
                        const ids = new Set(prev.map(s => s.id));
                        return [...prev, ...fetched.filter(s => !ids.has(s.id))];
                      });
                      setClassStudentsLoading(false);
                    }
                  }}
                  searchable={true}
                />
                {classStudentsLoading && <p className="tas-loading">Fetching students...</p>}
              </div>

              {selectedItems.length > 0 && selectedType !== "specific_classes" && (
                <div className="tas-recipients">
                  <p className="tas-recipients-title">Selected Recipients ({selectedItems.length})</p>
                  <div className="tas-recipients-grid">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="tas-recipient-card">
                        <div className="tas-recipient-info">
                          <span className="tas-recipient-name">{item.name}</span>
                          <span className="tas-recipient-sub">{getItemSubtitle(item)}</span>
                        </div>
                        <button className="tas-remove-btn" onClick={() => handleRemoveFromList(item.id)} title="Remove">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TargetAudienceSelector;
