export const CARD_LAYOUTS = ["gold", "campus", "round", "formal"];
export const ID_CARD_LAYOUTS = CARD_LAYOUTS;

const LEGACY_LAYOUTS = {
  classic: "gold",
  stripe: "gold",
  stack: "gold",
  band: "campus",
  banner: "campus",
  rail: "campus",
  crest: "round",
  badge: "round",
  poster: "round",
  split: "formal",
  frame: "formal",
  ticket: "formal",
};

const pickLayout = (value) => {
  if (CARD_LAYOUTS.includes(value)) return value;
  return LEGACY_LAYOUTS[value] || "gold";
};

export const DEFAULT_ID_CARD_TEMPLATE = {
  designId: "classic",
  name: "Classic Ink",
  headerColor: "#111111",
  accentColor: "#333333",
  paper: "#ffffff",
  ink: "#111111",
  layout: "gold",
  layoutTall: "gold",
  orientation: "landscape",
  showName: true,
  showSession: true,
  showClass: true,
  showId: true,
  showLogo: true,
  showPhoto: true,
  showSchool: true,
  showMotto: true,
  showQr: true,
  showValidUntil: true,
  showEmergency: true,
  showContact: true,
  studentLabel: "STUDENT ID CARD",
  staffLabel: "STAFF ID CARD",
  footerText: "If found, please return this card to the school.",
};

export const ID_CARD_DESIGNS = [
  {
    designId: "classic",
    name: "Classic Ink",
    blurb: "Black bar, white card, the school standard.",
    headerColor: "#111111",
    accentColor: "#2a2a2a",
    paper: "#ffffff",
    ink: "#111111",
    layout: "gold",
    layoutTall: "gold",
  },
  {
    designId: "indigo",
    name: "Indigo",
    blurb: "The same color as the assistant star.",
    headerColor: "#312e81",
    accentColor: "#4F46E5",
    paper: "#f8f7ff",
    ink: "#1e1b4b",
    layout: "campus",
    layoutTall: "campus",
  },
  {
    designId: "forest",
    name: "Forest",
    blurb: "Deep green with the photo centered.",
    headerColor: "#14532d",
    accentColor: "#166534",
    paper: "#f7faf7",
    ink: "#14532d",
    layout: "round",
    layoutTall: "round",
  },
  {
    designId: "sunset",
    name: "Sunset",
    blurb: "A warm band beside the photo.",
    headerColor: "#9a3412",
    accentColor: "#ea580c",
    paper: "#fff7ed",
    ink: "#7c2d12",
    layout: "formal",
    layoutTall: "formal",
  },
  {
    designId: "navy",
    name: "Navy Crest",
    blurb: "A wide color banner, and a framed tall card.",
    headerColor: "#0f2744",
    accentColor: "#c4a35a",
    paper: "#f4f7fb",
    ink: "#0f2744",
    layout: "campus",
    layoutTall: "campus",
  },
  {
    designId: "paper",
    name: "Soft Paper",
    blurb: "A thin line on the wide card, a ticket on the tall card.",
    headerColor: "#374151",
    accentColor: "#9ca3af",
    paper: "#fafafa",
    ink: "#111111",
    layout: "gold",
    layoutTall: "gold",
  },
].map((design) => ({ ...DEFAULT_ID_CARD_TEMPLATE, ...design }));

const keyFor = (schoolId) => `id-card-template:${schoolId || "school"}`;

const normalize = (raw) => {
  const next = { ...DEFAULT_ID_CARD_TEMPLATE, ...(raw && typeof raw === "object" ? raw : {}) };
  next.layout = pickLayout(next.layout);
  next.layoutTall = next.layout;
  if (next.orientation !== "portrait") next.orientation = "landscape";
  if (next.placements && typeof next.placements === "object") {
    const cleanList = (list) => {
      if (!Array.isArray(list)) return [];
      const seen = new Set();
      const known = new Set(["photo", "logo", "school", "title", "name", "class", "session", "id", "address", "valid", "emergency", "motto", "note", "phone", "qr"]);
      return list.flatMap((item) => {
        const key = String(item?.key || "");
        const box = /^box-\d+$/.test(key);
        if ((!known.has(key) && !box) || (!box && seen.has(key))) return [];
        if (!box) seen.add(key);
        const x = Number(item.x);
        const y = Number(item.y);
        const spot = {
          key,
          x: Math.min(box ? 100 : 88, Math.max(0, Number.isFinite(x) ? x : 8)),
          y: Math.min(box ? 100 : 86, Math.max(0, Number.isFinite(y) ? y : 8)),
        };
        if (box) {
          const w = Number(item.w);
          const h = Number(item.h);
          spot.w = Math.min(100, Math.max(12, Number.isFinite(w) ? w : 36));
          spot.h = Math.min(100, Math.max(10, Number.isFinite(h) ? h : 22));
          if (spot.x + spot.w > 100) spot.x = Math.max(0, 100 - spot.w);
          if (spot.y + spot.h > 100) spot.y = Math.max(0, 100 - spot.h);
          spot.text = String(item.text || "").slice(0, 400);
        }
        return [spot];
      });
    };
    next.placements = {
      front: cleanList(next.placements.front),
      back: cleanList(next.placements.back),
    };
  } else {
    delete next.placements;
  }
  return next;
};

const readStore = (schoolId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(schoolId)) || "null");
    if (!saved || typeof saved !== "object") return null;
    return saved;
  } catch {
    return null;
  }
};

export const loadIdCardSet = (schoolId) => {
  const saved = readStore(schoolId);
  if (saved && (saved.student || saved.staff) && !saved.headerColor) {
    return {
      student: normalize(saved.student),
      staff: normalize(saved.staff),
    };
  }
  const shared = normalize(saved);
  return { student: shared, staff: { ...shared } };
};

export const loadIdCardTemplate = (schoolId, kind = "student") => {
  const set = loadIdCardSet(schoolId);
  return kind === "staff" ? set.staff : set.student;
};

export const saveIdCardSet = (schoolId, set) => {
  const next = {
    student: normalize(set?.student),
    staff: normalize(set?.staff),
  };
  localStorage.setItem(keyFor(schoolId), JSON.stringify(next));
  return next;
};

export const saveIdCardTemplate = (schoolId, template, kind = "student") => {
  const set = loadIdCardSet(schoolId);
  const slot = kind === "staff" ? "staff" : "student";
  set[slot] = normalize(template);
  saveIdCardSet(schoolId, set);
  return set[slot];
};
