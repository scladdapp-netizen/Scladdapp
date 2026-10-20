import { loadIdCardSet, saveIdCardSet } from "../../../../../../utils/idCardTemplate";

export const PX_PER_MM = 3.8;

export const CARD_SIZES = [
  { id: "cr80-landscape", label: "CR80 landscape", widthMm: 85.6, heightMm: 53.98 },
  { id: "cr80-portrait", label: "CR80 portrait", widthMm: 53.98, heightMm: 85.6 },
  { id: "a4", label: "A4 paper card", widthMm: 210, heightMm: 297 },
  { id: "custom", label: "Custom", widthMm: 85.6, heightMm: 53.98 },
];

export const STUDENT_FIELDS = [
  { id: "fullName", label: "Student full name", kind: "text" },
  { id: "admissionNumber", label: "Admission number", kind: "text" },
  { id: "className", label: "Class", kind: "text" },
  { id: "classArm", label: "Class arm", kind: "text" },
  { id: "phone", label: "Phone number", kind: "text" },
  { id: "email", label: "Email", kind: "text", w: 62 },
  { id: "address", label: "Address", kind: "text", w: 70, h: 14 },
  { id: "gender", label: "Gender", kind: "text" },
  { id: "bloodGroup", label: "Blood group", kind: "text" },
  { id: "emergencyName", label: "Emergency contact", kind: "text" },
  { id: "emergencyPhone", label: "Emergency phone", kind: "text" },
  { id: "photo", label: "Student photograph", kind: "photo" },
  { id: "session", label: "Academic session", kind: "text" },
  { id: "schoolName", label: "School name", kind: "text" },
  { id: "schoolLogo", label: "School logo", kind: "logo" },
  { id: "issueDate", label: "Issue date", kind: "text" },
  { id: "expiryDate", label: "Expiry date", kind: "text" },
  { id: "dateOfBirth", label: "Date of birth", kind: "text" },
  { id: "qr", label: "Student QR code", kind: "qr" },
];

export const STAFF_FIELDS = [
  { id: "fullName", label: "Staff full name", kind: "text" },
  { id: "employeeId", label: "Employee ID", kind: "text" },
  { id: "photo", label: "Photograph", kind: "photo" },
  { id: "jobTitle", label: "Job title", kind: "text" },
  { id: "department", label: "Department", kind: "text" },
  { id: "phone", label: "Phone number", kind: "text" },
  { id: "email", label: "Email", kind: "text", w: 62 },
  { id: "address", label: "Address", kind: "text", w: 70, h: 14 },
  { id: "gender", label: "Gender", kind: "text" },
  { id: "qualification", label: "Qualification", kind: "text", w: 62 },
  { id: "joiningDate", label: "Joining date", kind: "text" },
  { id: "bloodGroup", label: "Blood group", kind: "text" },
  { id: "emergencyName", label: "Emergency contact", kind: "text" },
  { id: "emergencyPhone", label: "Emergency phone", kind: "text" },
  { id: "schoolName", label: "School name", kind: "text" },
  { id: "schoolLogo", label: "School logo", kind: "logo" },
  { id: "issueDate", label: "Issue date", kind: "text" },
  { id: "expiryDate", label: "Expiry date", kind: "text" },
  { id: "dateOfBirth", label: "Date of birth", kind: "text" },
  { id: "qr", label: "Staff QR code", kind: "qr" },
];

const UNIQUE_FIELDS = new Set(["photo", "schoolLogo", "qr", "barcode"]);

export const fieldsFor = (type) => (type === "staff" ? STAFF_FIELDS : STUDENT_FIELDS);

export const uid = () => `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const baseElement = (partial) => ({
  id: uid(),
  type: "text",
  name: "Text",
  field: "",
  text: "",
  src: "",
  x: 8,
  y: 8,
  w: 42,
  h: 12,
  rotation: 0,
  opacity: 1,
  hidden: false,
  locked: false,
  fontFamily: "helvetica",
  fontSizeMm: 3.2,
  fontWeight: 700,
  italic: false,
  underline: false,
  color: "#111111",
  align: "left",
  lineHeight: 1.15,
  letterSpacing: 0,
  transform: "none",
  fill: "#14532d",
  stroke: "#111111",
  strokeWidth: 0,
  radius: 0,
  fit: "cover",
  grayscale: false,
  shape: "rect",
  ...partial,
});

export function elementFromField(field, type) {
  const label = field.label;
  if (field.kind === "photo") {
    return baseElement({ type: "photo", field: field.id, name: label, w: 24, h: 52, fill: "#d4d4d4", radius: 4 });
  }
  if (field.kind === "logo") {
    return baseElement({ type: "logo", field: field.id, name: label, w: 16, h: 26, radius: 50 });
  }
  if (field.kind === "qr") {
    return baseElement({ type: "qr", field: field.id, name: label, w: 20, h: 32, fill: "#111111" });
  }
  return baseElement({
    type: "text",
    field: field.id,
    name: label,
    text: "",
    showLabel: true,
    labelLayout: "inline",
    w: field.w || (type === "staff" && field.id === "fullName" ? 54 : 48),
    h: field.h || 12,
    fontSizeMm: field.id === "fullName" ? 4 : 2.8,
  });
}

export function elementCatalog(type) {
  const idField = type === "staff" ? "employeeId" : "admissionNumber";
  const roleField = type === "staff" ? "jobTitle" : "className";
  const text = (name, textValue, extra) => () => baseElement({ name, text: textValue, ...extra });
  const field = (id, extra) => () => elementFromField(fieldsFor(type).find((row) => row.id === id) || { id, label: id, kind: "text" }, type);
  return [
    {
      title: "Text",
      items: [
        { key: "heading", label: "Heading", create: text("Heading", "Heading", { fontSizeMm: 4.4, w: 56, h: 12 }) },
        { key: "subheading", label: "Subheading", create: text("Subheading", "Subheading", { fontSizeMm: 3.2, fontWeight: 600, w: 50, h: 10 }) },
        { key: "body", label: "Body text", create: text("Body text", "Body text", { fontSizeMm: 2.6, fontWeight: 500, w: 60, h: 16 }) },
        { key: "custom", label: "Custom text", create: text("Custom text", "Text", { fontWeight: 600 }) },
        { key: "motto", label: "School motto", create: () => baseElement({ name: "School motto", field: "motto", showLabel: true, labelLayout: "inline", w: 70, h: 12, fontSizeMm: 2.6, fontWeight: 500 }) },
        { key: "footer", label: "Footer text", create: text("Footer text", "If found, please return this card to the school.", { fontSizeMm: 2.2, fontWeight: 500, w: 80, h: 12, y: 82 }) },
      ],
    },
    {
      title: "School",
      items: [
        { key: "logo", label: "School logo", create: field("schoolLogo") },
        { key: "school", label: "School name", create: field("schoolName") },
        { key: "address", label: "School address", create: () => baseElement({ name: "School address", field: "schoolAddress", showLabel: true, labelLayout: "inline", w: 70, h: 12, fontSizeMm: 2.4, fontWeight: 500 }) },
        { key: "phone", label: "School phone", create: () => baseElement({ name: "School phone", field: "schoolPhone", showLabel: true, labelLayout: "inline", w: 46, h: 10, fontSizeMm: 2.4, fontWeight: 600 }) },
        { key: "website", label: "School website", create: () => baseElement({ name: "School website", field: "schoolWebsite", showLabel: true, labelLayout: "inline", w: 50, h: 10, fontSizeMm: 2.4, fontWeight: 600 }) },
      ],
    },
    {
      title: "Person",
      items: [
        { key: "photo", label: "Photograph", create: field("photo") },
        { key: "name", label: "Full name", create: field("fullName") },
        { key: "id", label: type === "staff" ? "Employee ID" : "Admission number", create: field(idField) },
        { key: "role", label: type === "staff" ? "Job title" : "Class", create: field(roleField) },
        { key: "group", label: type === "staff" ? "Department" : "Class arm", create: field(type === "staff" ? "department" : "classArm") },
        { key: "phone", label: "Phone number", create: field("phone") },
        { key: "email", label: "Email", create: field("email") },
        { key: "address", label: "Address", create: field("address") },
        { key: "dob", label: "Date of birth", create: field("dateOfBirth") },
        { key: "gender", label: "Gender", create: field("gender") },
        { key: "blood", label: "Blood group", create: field("bloodGroup") },
        { key: "emergency", label: "Emergency contact", create: field("emergencyName") },
        { key: "emergencyPhone", label: "Emergency phone", create: field("emergencyPhone") },
        ...(type === "staff" ? [
          { key: "qualification", label: "Qualification", create: field("qualification") },
          { key: "joined", label: "Joining date", create: field("joiningDate") },
        ] : []),
        { key: "session", label: "Academic session", create: field("session") },
        { key: "issue", label: "Issue date", create: field("issueDate") },
        { key: "expiry", label: "Expiry date", create: field("expiryDate") },
        { key: "sign", label: "Signature line", create: () => baseElement({ type: "shape", shape: "line", name: "Signature", w: 36, h: 6, fill: "transparent", stroke: "#111111", strokeWidth: 1.5 }) },
      ],
    },
    {
      title: "Codes",
      items: [
        { key: "qr", label: "QR code", create: field("qr") },
        { key: "barcode", label: "Barcode", create: () => baseElement({ type: "barcode", field: "barcode", name: "Barcode", w: 42, h: 16, fill: "#111111" }) },
      ],
    },
    {
      title: "Shapes",
      items: [
        { key: "rect", label: "Rectangle", create: () => baseElement({ type: "shape", shape: "rect", name: "Rectangle", w: 30, h: 18, fill: "#14532d", text: "" }) },
        { key: "circle", label: "Circle", create: () => baseElement({ type: "shape", shape: "circle", name: "Circle", w: 18, h: 28, fill: "#1d4ed8", radius: 50 }) },
        { key: "line", label: "Line", create: () => baseElement({ type: "shape", shape: "line", name: "Line", w: 40, h: 4, fill: "transparent", stroke: "#111111", strokeWidth: 2 }) },
        { key: "border", label: "Border", create: () => baseElement({ type: "shape", shape: "rect", name: "Border", x: 3, y: 4, w: 94, h: 92, fill: "transparent", stroke: "#111111", strokeWidth: 1.5, radius: 3 }) },
        { key: "band", label: "Background shape", create: () => baseElement({ type: "shape", shape: "rect", name: "Background shape", x: 0, y: 0, w: 100, h: 28, fill: "#14532d", radius: 0 }) },
        { key: "image", label: "Uploaded image", create: () => baseElement({ type: "image", name: "Image", w: 28, h: 36, src: "" }) },
        { key: "pattern", label: "Decorative pattern", create: () => baseElement({ type: "shape", shape: "pattern", name: "Pattern", w: 100, h: 16, x: 0, y: 84, fill: "#14532d" }) },
      ],
    },
  ];
}

const num = (value, fallback, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

export function cleanElement(raw) {
  const el = baseElement(raw && typeof raw === "object" ? raw : {});
  el.id = String(raw?.id || el.id);
  el.type = ["text", "photo", "logo", "shape", "qr", "barcode", "image"].includes(raw?.type) ? raw.type : "text";
  el.name = String(raw?.name || el.name).slice(0, 80);
  el.field = String(raw?.field || "");
  el.text = String(raw?.text || "").slice(0, 400);
  el.src = String(raw?.src || "");
  el.x = num(raw?.x, 8, -8, 100);
  el.y = num(raw?.y, 8, -8, 100);
  el.w = num(raw?.w, 40, 2, 120);
  el.h = num(raw?.h, 12, 2, 120);
  el.rotation = num(raw?.rotation, 0, -180, 180);
  el.opacity = num(raw?.opacity, 1, 0.05, 1);
  el.hidden = !!raw?.hidden;
  el.locked = !!raw?.locked;
  el.fontSizeMm = num(raw?.fontSizeMm, 3.2, 1.4, 12);
  el.fontWeight = Number(raw?.fontWeight) >= 700 ? 700 : 500;
  el.italic = !!raw?.italic;
  el.underline = !!raw?.underline;
  el.color = String(raw?.color || "#111111");
  el.align = ["left", "center", "right"].includes(raw?.align) ? raw.align : "left";
  el.lineHeight = num(raw?.lineHeight, 1.15, 0.8, 2);
  el.letterSpacing = num(raw?.letterSpacing, 0, -1, 8);
  el.transform = ["none", "uppercase", "lowercase"].includes(raw?.transform) ? raw.transform : "none";
  el.fill = String(raw?.fill || "#14532d");
  el.stroke = String(raw?.stroke || "#111111");
  el.strokeWidth = num(raw?.strokeWidth, 0, 0, 8);
  el.radius = num(raw?.radius, 0, 0, 50);
  el.fit = raw?.fit === "contain" ? "contain" : "cover";
  el.grayscale = !!raw?.grayscale;
  el.shape = ["rect", "circle", "line", "pattern"].includes(raw?.shape) ? raw.shape : "rect";
  el.fontFamily = ["helvetica", "times", "courier"].includes(raw?.fontFamily) ? raw.fontFamily : "helvetica";
  el.showLabel = raw?.showLabel === undefined ? !!el.field : !!raw.showLabel;
  el.labelLayout = ["inline", "stacked", "beside"].includes(raw?.labelLayout) ? raw.labelLayout : "inline";
  return el;
}

export function blankTemplate(type = "student", name = "Untitled card") {
  const size = CARD_SIZES[0];
  const now = new Date().toISOString();
  return {
    id: `tpl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    editorVersion: 2,
    name,
    type: type === "staff" ? "staff" : "student",
    status: "draft",
    version: 1,
    sizeId: size.id,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    background: "#ffffff",
    backgroundImage: "",
    overlayOpacity: 0,
    showWatermark: false,
    cornerRadius: 3,
    borderColor: "#e5e7eb",
    borderWidth: 0.4,
    defaultColor: "#111111",
    showSafe: true,
    showBleed: false,
    showGrid: false,
    front: [],
    back: [],
    createdAt: now,
    updatedAt: now,
  };
}

function paintStarter(starter, type) {
  const accent = starter.accent;
  const ink = starter.ink;
  const idField = type === "staff" ? "employeeId" : "admissionNumber";
  const roleField = type === "staff" ? "jobTitle" : "className";
  const title = type === "staff" ? "STAFF ID" : "STUDENT ID";
  const roleName = type === "staff" ? "Job title" : "Class";
  const idName = type === "staff" ? "Employee ID" : "Admission number";
  const text = (partial) => cleanElement({ showLabel: true, labelLayout: "inline", color: ink, fontWeight: 500, ...partial });
  const back = [
    cleanElement({ type: "shape", shape: "rect", name: "Back header", x: 0, y: 0, w: 100, h: 16, fill: accent, radius: 0 }),
    text({ field: "schoolName", name: "School name", x: 6, y: 4, w: 88, h: 9, color: "#ffffff", fontSizeMm: 3, fontWeight: 700, showLabel: false }),
    text({ field: "motto", name: "Motto", x: 6, y: 24, w: 88, h: 12, fontSizeMm: 2.8 }),
    text({ field: "schoolAddress", name: "Address", x: 6, y: 42, w: 88, h: 14, fontSizeMm: 2.4 }),
    text({ field: "schoolPhone", name: "Phone", x: 6, y: 60, w: 60, h: 10, fontSizeMm: 2.4, fontWeight: 600 }),
    cleanElement({ name: "Return note", text: "If found, please return this card to the school.", x: 6, y: 78, w: 88, h: 14, color: ink, fontSizeMm: 2.3, fontWeight: 500 }),
  ];
  const fronts = {
    "classic-blue": [
      cleanElement({ type: "shape", shape: "rect", name: "Side bar", x: 0, y: 0, w: 34, h: 100, fill: accent, radius: 0 }),
      cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 4, y: 28, w: 26, h: 48, fill: "#dbe4ff", radius: 4 }),
      cleanElement({ type: "logo", field: "schoolLogo", name: "School logo", x: 40, y: 6, w: 14, h: 22, radius: 50 }),
      text({ name: "Card title", text: title, x: 56, y: 8, w: 40, h: 8, color: accent, fontSizeMm: 2.8, fontWeight: 700, showLabel: false }),
      text({ field: "schoolName", name: "School", x: 40, y: 32, w: 56, h: 10, fontSizeMm: 2.4, showLabel: false }),
      text({ field: "fullName", name: "Name", x: 40, y: 46, w: 56, h: 12, fontSizeMm: 3.4, fontWeight: 700 }),
      text({ field: roleField, name: roleName, x: 40, y: 62, w: 56, h: 10, fontSizeMm: 2.4 }),
      text({ field: idField, name: idName, x: 40, y: 76, w: 56, h: 10, fontSizeMm: 2.3, fontWeight: 600 }),
    ],
    "minimal-white": [
      cleanElement({ type: "shape", shape: "rect", name: "Top rule", x: 12, y: 6, w: 76, h: 1.2, fill: accent, radius: 0 }),
      cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 30, y: 12, w: 40, h: 28, fill: "#f3f3f3", radius: 50 }),
      text({ field: "fullName", name: "Name", x: 10, y: 44, w: 80, h: 8, fontSizeMm: 3.6, fontWeight: 700, align: "center", showLabel: false }),
      text({ name: "Card title", text: title, x: 10, y: 53, w: 80, h: 6, color: "#666666", fontSizeMm: 2.2, align: "center", showLabel: false }),
      text({ field: roleField, name: roleName, x: 14, y: 64, w: 72, h: 7, fontSizeMm: 2.4, align: "center" }),
      text({ field: idField, name: idName, x: 14, y: 73, w: 72, h: 7, fontSizeMm: 2.3, align: "center" }),
      text({ field: "session", name: "Session", x: 14, y: 82, w: 72, h: 7, fontSizeMm: 2.2, align: "center" }),
    ],
    "formal-staff": [
      cleanElement({ type: "shape", shape: "rect", name: "Header", x: 0, y: 0, w: 100, h: 22, fill: accent, radius: 0 }),
      cleanElement({ type: "logo", field: "schoolLogo", name: "School logo", x: 8, y: 4, w: 16, h: 14, radius: 50 }),
      text({ name: "Card title", text: title, x: 28, y: 5, w: 64, h: 6, color: "#ffffff", fontSizeMm: 2.8, fontWeight: 700, showLabel: false }),
      text({ field: "schoolName", name: "School", x: 28, y: 12, w: 64, h: 6, color: "#ffffff", fontSizeMm: 2.2, showLabel: false }),
      cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 32, y: 28, w: 36, h: 26, fill: "#e8eef5", radius: 2 }),
      text({ field: "fullName", name: "Name", x: 10, y: 58, w: 80, h: 8, fontSizeMm: 3.2, fontWeight: 700, align: "center", showLabel: false }),
      text({ field: roleField, name: roleName, x: 12, y: 68, w: 76, h: 7, fontSizeMm: 2.3, align: "center" }),
      text({ field: type === "staff" ? "department" : "session", name: type === "staff" ? "Department" : "Session", x: 12, y: 76, w: 76, h: 7, fontSizeMm: 2.2, align: "center" }),
      text({ field: idField, name: idName, x: 12, y: 84, w: 76, h: 7, fontSizeMm: 2.2, fontWeight: 600, align: "center" }),
    ],
    "student-photo": [
      cleanElement({ type: "shape", shape: "rect", name: "Footer band", x: 0, y: 84, w: 100, h: 16, fill: accent, radius: 0 }),
      cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 62, y: 8, w: 32, h: 70, fill: "#e5e7eb", radius: 3 }),
      cleanElement({ type: "logo", field: "schoolLogo", name: "School logo", x: 4, y: 6, w: 14, h: 22, radius: 50 }),
      text({ name: "Card title", text: title, x: 20, y: 8, w: 40, h: 8, color: accent, fontSizeMm: 2.8, fontWeight: 700, showLabel: false }),
      text({ field: "schoolName", name: "School", x: 4, y: 32, w: 54, h: 10, fontSizeMm: 2.3, showLabel: false }),
      text({ field: "fullName", name: "Name", x: 4, y: 46, w: 54, h: 12, fontSizeMm: 3.2, fontWeight: 700 }),
      text({ field: roleField, name: roleName, x: 4, y: 62, w: 54, h: 10, fontSizeMm: 2.4 }),
      text({ field: "session", name: "Session", x: 6, y: 88, w: 88, h: 8, color: "#ffffff", fontSizeMm: 2.3, showLabel: false }),
    ],
    colourful: [
      cleanElement({ type: "shape", shape: "rect", name: "Header", x: 0, y: 0, w: 100, h: 18, fill: accent, radius: 0 }),
      cleanElement({ type: "shape", shape: "rect", name: "Footer band", x: 0, y: 90, w: 100, h: 10, fill: "#ea580c", radius: 0 }),
      cleanElement({ type: "logo", field: "schoolLogo", name: "School logo", x: 4, y: 3, w: 10, h: 12, radius: 50 }),
      text({ name: "Card title", text: title, x: 16, y: 4, w: 70, h: 5, color: "#ffffff", fontSizeMm: 5, fontWeight: 700, showLabel: false }),
      text({ field: "schoolName", name: "School", x: 16, y: 10, w: 70, h: 5, color: "#ffffff", fontSizeMm: 3.4, showLabel: false }),
      cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 6, y: 24, w: 28, h: 36, fill: "#ffedd5", radius: 4 }),
      text({ field: "fullName", name: "Name", x: 38, y: 26, w: 56, h: 10, fontSizeMm: 6, fontWeight: 700, showLabel: false }),
      text({ field: roleField, name: roleName, x: 38, y: 40, w: 56, h: 8, fontSizeMm: 3.6 }),
      text({ field: idField, name: idName, x: 38, y: 52, w: 56, h: 8, fontSizeMm: 3.4, fontWeight: 600 }),
      text({ field: "session", name: "Session", x: 6, y: 66, w: 42, h: 10, fontSizeMm: 3.2 }),
      text({ field: "dateOfBirth", name: "Date of birth", x: 52, y: 66, w: 42, h: 10, fontSizeMm: 3.2 }),
      text({ field: "schoolAddress", name: "Address", x: 6, y: 80, w: 88, h: 8, fontSizeMm: 3, showLabel: false }),
    ],
  };
  const front = fronts[starter.id] || [
    cleanElement({ type: "shape", shape: "rect", name: "Header", x: 0, y: 0, w: 100, h: 26, fill: accent, radius: 0 }),
    cleanElement({ type: "logo", field: "schoolLogo", name: "School logo", x: 4, y: 4, w: 14, h: 18, radius: 50 }),
    text({ name: "Card title", text: title, x: 22, y: 6, w: 70, h: 10, color: "#ffffff", fontSizeMm: 3.4, fontWeight: 700, showLabel: false }),
    text({ field: "schoolName", name: "School name", x: 22, y: 15, w: 72, h: 8, color: "#ffffff", fontSizeMm: 2.3, showLabel: false }),
    cleanElement({ type: "photo", field: "photo", name: "Photograph", x: 5, y: 32, w: 26, h: 58, fill: "#e5e7eb", radius: 3 }),
    text({ field: "fullName", name: "Full name", x: 36, y: 34, w: 58, h: 12, fontSizeMm: 3.6, fontWeight: 700 }),
    text({ field: roleField, name: roleName, x: 36, y: 50, w: 58, h: 10, fontSizeMm: 2.6 }),
    text({ field: idField, name: idName, x: 36, y: 64, w: 40, h: 10, fontSizeMm: 2.5, fontWeight: 600 }),
    text({ field: "session", name: "Session", x: 36, y: 78, w: 40, h: 10, fontSizeMm: 2.4 }),
    cleanElement({ type: "qr", field: "qr", name: "QR code", x: 78, y: 64, w: 18, h: 28, fill: ink }),
  ];
  return { front, back };
}

export const STARTER_TEMPLATES = [
  { id: "modern-green", name: "Modern Green", accent: "#14532d", ink: "#14532d", background: "#f7faf7", type: "student", sizeId: "cr80-landscape" },
  { id: "classic-blue", name: "Classic Blue", accent: "#1e3a8a", ink: "#1e3a8a", background: "#f8fafc", type: "student", sizeId: "cr80-landscape" },
  { id: "minimal-white", name: "Minimal White", accent: "#111111", ink: "#111111", background: "#ffffff", type: "student", sizeId: "cr80-portrait" },
  { id: "formal-staff", name: "Formal Staff ID", accent: "#0f2744", ink: "#0f2744", background: "#f4f7fb", type: "staff", sizeId: "cr80-portrait" },
  { id: "student-photo", name: "Student Photo ID", accent: "#166534", ink: "#14532d", background: "#ffffff", type: "student", sizeId: "cr80-landscape" },
  { id: "colourful", name: "Colourful School ID", accent: "#7c2d12", ink: "#7c2d12", background: "#fff7ed", type: "student", sizeId: "a4" },
];

export function applyCatalog(current, doc) {
  const clean = cleanTemplate({ ...doc, id: current.id, type: current.type });
  return {
    ...clean,
    id: current.id,
    type: current.type,
    name: current.name && current.name !== "Untitled card" ? current.name : clean.name,
    status: current.status,
    version: current.version,
    createdAt: current.createdAt,
  };
}

export function applyStarter(current, starterId) {
  const starter = STARTER_TEMPLATES.find((row) => row.id === starterId) || STARTER_TEMPLATES[0];
  const painted = paintStarter(starter, current.type);
  const size = CARD_SIZES.find((row) => row.id === starter.sizeId) || CARD_SIZES[0];
  return {
    ...current,
    name: current.name && current.name !== "Untitled card" ? current.name : starter.name,
    background: starter.background,
    defaultColor: starter.ink,
    sizeId: size.id,
    widthMm: size.widthMm,
    heightMm: size.heightMm,
    front: painted.front,
    back: painted.back,
    updatedAt: new Date().toISOString(),
  };
}

export function cleanTemplate(raw) {
  const next = blankTemplate(raw?.type, raw?.name || "Untitled card");
  if (raw?.id) next.id = String(raw.id);
  next.name = String(raw?.name || next.name).slice(0, 80);
  next.type = raw?.type === "staff" ? "staff" : "student";
  next.status = raw?.status === "active" ? "active" : "draft";
  next.version = num(raw?.version, 1, 1, 9999);
  const size = CARD_SIZES.find((row) => row.id === raw?.sizeId);
  next.sizeId = size ? size.id : "custom";
  next.widthMm = num(raw?.widthMm, size?.widthMm || 85.6, 40, 297);
  next.heightMm = num(raw?.heightMm, size?.heightMm || 53.98, 30, 420);
  next.background = String(raw?.background || "#ffffff");
  next.backgroundImage = String(raw?.backgroundImage || "");
  next.overlayOpacity = num(raw?.overlayOpacity, 0, 0, 1);
  next.showWatermark = !!raw?.showWatermark;
  next.cornerRadius = num(raw?.cornerRadius, 3, 0, 16);
  next.borderColor = String(raw?.borderColor || "#e5e7eb");
  next.borderWidth = num(raw?.borderWidth, 0.4, 0, 4);
  next.defaultColor = String(raw?.defaultColor || "#111111");
  next.showSafe = raw?.showSafe !== false;
  next.showBleed = !!raw?.showBleed;
  next.showGrid = !!raw?.showGrid;
  next.front = Array.isArray(raw?.front) ? raw.front.map(cleanElement) : [];
  next.back = Array.isArray(raw?.back) ? raw.back.map(cleanElement) : [];
  next.createdAt = raw?.createdAt || next.createdAt;
  next.updatedAt = raw?.updatedAt || next.updatedAt;
  next.editorVersion = 2;
  return next;
}

const libraryKey = (schoolId) => `id-card-editor:${schoolId || "school"}`;
const publishedKey = (schoolId) => `id-card-published:${schoolId || "school"}`;

function writePublishedStamp(schoolId, library) {
  const stamp = {};
  (library.templates || []).forEach((row) => {
    if (row?.id && (row.id === library.active?.student || row.id === library.active?.staff)) {
      stamp[row.id] = row.updatedAt || "";
    }
  });
  localStorage.setItem(publishedKey(schoolId), JSON.stringify(stamp));
}

export function isPublishedTemplate(schoolId, doc) {
  try {
    const stamp = JSON.parse(localStorage.getItem(publishedKey(schoolId)) || "null");
    return !!doc?.id && stamp?.[doc.id] === doc.updatedAt;
  } catch {
    return false;
  }
}

export function isLiveTemplate(schoolId, doc) {
  const set = loadIdCardSet(schoolId);
  const live = doc?.type === "staff" ? set.staff : set.student;
  return live?.id === doc?.id && isPublishedTemplate(schoolId, doc);
}

export function seedLibrary() {
  const card = applyStarter(blankTemplate("student", "Modern Green"), "modern-green");
  card.status = "active";
  return {
    templates: [card],
    active: { student: card.id, staff: card.id },
  };
}

const layoutSignature = (doc) => JSON.stringify({
  name: doc.name,
  sizeId: doc.sizeId,
  background: doc.background,
  widthMm: doc.widthMm,
  heightMm: doc.heightMm,
  front: (doc.front || []).map((el) => [el.type, el.name, el.field, el.text, el.x, el.y, el.w, el.h]),
  back: (doc.back || []).map((el) => [el.type, el.name, el.field, el.text, el.x, el.y, el.w, el.h]),
});

function isUntouchedAutoSeed(templates) {
  if (templates.length !== 2) return false;
  const student = templates.find((row) => row.name === "Student Photo ID");
  const staff = templates.find((row) => row.name === "Formal Staff ID");
  if (!student || !staff) return false;
  const expectedStudent = cleanTemplate(applyStarter(blankTemplate("student", "Student Photo ID"), "student-photo"));
  const expectedStaff = cleanTemplate(applyStarter(blankTemplate("staff", "Formal Staff ID"), "formal-staff"));
  return layoutSignature(student) === layoutSignature(expectedStudent)
    && layoutSignature(staff) === layoutSignature(expectedStaff);
}

export function loadLibrary(schoolId) {
  try {
    const saved = JSON.parse(localStorage.getItem(libraryKey(schoolId)) || "null");
    if (saved?.templates?.length) {
      const templates = saved.templates.map(cleanTemplate);
      if (isUntouchedAutoSeed(templates)) {
        const seeded = seedLibrary();
        publishLibrary(schoolId, seeded);
        return seeded;
      }
      const active = {
        student: templates.find((row) => row.id === saved.active?.student)?.id || templates[0]?.id || "",
        staff: templates.find((row) => row.id === saved.active?.staff)?.id
          || templates.find((row) => row.id === saved.active?.student)?.id
          || templates[0]?.id
          || "",
      };
      if (!localStorage.getItem(publishedKey(schoolId))) writePublishedStamp(schoolId, { templates, active });
      return { templates, active };
    }
  } catch { /* seed below */ }
  const seeded = seedLibrary();
  publishLibrary(schoolId, seeded);
  return seeded;
}

export function saveDraftLibrary(schoolId, library) {
  const next = {
    templates: library.templates.map(cleanTemplate),
    active: { ...library.active },
  };
  if (!next.templates.some((row) => row.id === next.active.student)) next.active.student = next.templates[0]?.id || "";
  if (!next.templates.some((row) => row.id === next.active.staff)) next.active.staff = next.active.student;
  localStorage.setItem(libraryKey(schoolId), JSON.stringify(next));
  return next;
}

export function publishLibrary(schoolId, library) {
  const next = saveDraftLibrary(schoolId, library);
  writePublishedStamp(schoolId, next);
  const current = loadIdCardSet(schoolId);
  const student = next.templates.find((row) => row.id === next.active.student);
  const staff = next.templates.find((row) => row.id === next.active.staff);
  const publish = (doc, type) => ({
    ...doc,
    type,
    placements: undefined,
    orientation: doc.widthMm >= doc.heightMm ? "landscape" : "portrait",
  });
  if (student) current.student = { ...current.student, ...publish(student, "student") };
  if (staff) current.staff = { ...current.staff, ...publish(staff, "staff") };
  saveIdCardSet(schoolId, current);
  return next;
}

export function loadPublishedSet(schoolId) {
  loadLibrary(schoolId);
  return loadIdCardSet(schoolId);
}

export function loadPublishedTemplate(schoolId, kind = "student") {
  const set = loadPublishedSet(schoolId);
  return kind === "staff" ? set.staff : set.student;
}

export function resolveField(field, person, school, extras = {}) {
  const value = {
    fullName: person?.fullName || person?.name || "",
    admissionNumber: person?.kind === "staff"
      ? (person?.employeeId || person?.idNumber || "")
      : (person?.admissionNumber || person?.idNumber || ""),
    employeeId: person?.employeeId || (person?.kind === "staff" ? person?.idNumber : "") || "",
    className: person?.kind === "staff" ? (person?.jobTitle || "") : (person?.className || ""),
    classArm: person?.kind === "staff" ? (person?.department || "") : (person?.classArm || ""),
    jobTitle: person?.jobTitle || "",
    department: person?.department || "",
    session: person?.session || "",
    dateOfBirth: person?.dateOfBirth || "",
    phone: person?.phone || "",
    email: person?.email || "",
    address: person?.address || "",
    gender: person?.gender || "",
    bloodGroup: person?.bloodGroup || "",
    emergencyName: person?.emergencyName || "",
    emergencyPhone: person?.emergencyPhone || "",
    qualification: person?.qualification || "",
    joiningDate: person?.joiningDate || "",
    issueDate: extras.issueDate || "",
    expiryDate: extras.expiryDate || "",
    schoolName: school?.name || "",
    schoolAddress: school?.address || "",
    schoolPhone: school?.phone || "",
    schoolWebsite: school?.website || "",
    motto: school?.motto || "",
    barcode: person?.idNumber || person?.admissionNumber || person?.employeeId || "",
    qr: person?.idNumber || "",
  }[field];
  return String(value || "").trim();
}

export function displayLabel(element, staff) {
  const name = element?.name || "";
  if (staff) {
    if (element?.field === "className" || name === "Class") return "Job title";
    if (element?.field === "admissionNumber" || name === "Admission number") return "Employee ID";
    if (element?.field === "classArm" || name === "Class arm") return "Department";
    return name;
  }
  if (element?.field === "jobTitle" || name === "Job title") return "Class";
  if (element?.field === "employeeId" || name === "Employee ID") return "Admission number";
  if (element?.field === "department" || name === "Department") return "Class arm";
  return name;
}

export function displayStatic(text, staff) {
  if (staff) {
    if (text === "STUDENT ID") return "STAFF ID";
    if (text === "Student ID") return "Staff ID";
    return text;
  }
  if (text === "STAFF ID") return "STUDENT ID";
  if (text === "Staff ID") return "Student ID";
  return text;
}

export function displayText(element, person, school, extras, preview) {
  const staff = person?.kind === "staff";
  if (!element.field) return displayStatic(element.text || (preview ? "" : element.name), staff);
  const value = resolveField(element.field, person, school, extras);
  if (value) return value;
  if (preview) return "";
  return element.showLabel === false ? (element.name || "") : "";
}

export function layoutWarnings(template, side, person, school, extras) {
  const warnings = [];
  (template?.[side] || []).forEach((element) => {
    if (element.hidden) return;
    if (element.x < -0.2 || element.y < -0.2 || element.x + element.w > 100.2 || element.y + element.h > 100.2) {
      warnings.push(`${element.name} sits outside the printable card.`);
    }
    if (element.field && element.type === "text" && !resolveField(element.field, person, school, extras)) {
      warnings.push(`${element.name} has no value for this record.`);
    }
    if (element.type === "photo" && !person?.photoUrl) warnings.push("This record has no photograph.");
    if (element.type === "logo" && !school?.logoUrl) warnings.push("The school has no logo.");
  });
  return [...new Set(warnings)];
}

export function canInsert(list, element) {
  if (!element.field || !UNIQUE_FIELDS.has(element.field)) return true;
  return !(list || []).some((row) => row.field === element.field);
}

export function personFromRecord(row, kind, sessionName) {
  if (!row) return null;
  return {
    kind,
    fullName: row.full_name || row.name || "",
    name: row.full_name || row.name || "",
    admissionNumber: row.admission_number || "",
    employeeId: row.staff_id || "",
    idNumber: kind === "staff" ? (row.staff_id || row.idNumber || "") : (row.admission_number || row.student_id || row.idNumber || ""),
    className: row.current_class_name || row.className || "",
    classArm: row.current_class_stream || row.classArm || "",
    jobTitle: row.job_title || row.position || row.jobTitle || "",
    department: row.department || "",
    session: row.session || sessionName || "",
    dateOfBirth: row.date_of_birth || row.dateOfBirth || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || [row.house_number_street, row.area_estate, row.city, row.state_of_residence].filter(Boolean).join(", "),
    gender: row.gender || "",
    bloodGroup: row.blood_group || row.bloodGroup || "",
    emergencyName: row.emergency_contact_name || row.guardian_name || row.emergencyName || "",
    emergencyPhone: row.emergency_contact_phone || row.guardian_phone || row.emergencyPhone || "",
    qualification: row.qualification || "",
    joiningDate: row.joining_date || row.joiningDate || "",
    photoUrl: row.student_photo || row.staff_photo || row.photoUrl || "",
  };
}
