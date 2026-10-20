import { DEFAULT_ID_CARD_TEMPLATE } from "./idCardTemplate";
import { displayText, displayLabel } from "../pages/AdminSec/AdminPages/SchoolDirectory/IdCards/editor/model.js";

const loadImageDataUrl = async (url) => {
  if (!url) return null;
  if (String(url).startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 128;
      canvas.height = img.naturalHeight || 128;
      canvas.getContext("2d").drawImage(img, 0, 0);
      return canvas.toDataURL("image/jpeg", 0.92);
    } catch {
      return null;
    }
  }
};

const imageFormat = (dataUrl) => (String(dataUrl).includes("image/png") ? "PNG" : "JPEG");

const fitText = (doc, text, maxWidth) => {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  if (!source) return "";
  if (doc.getTextWidth(source) <= maxWidth) return source;
  let cut = source;
  while (cut.length > 1 && doc.getTextWidth(`${cut}...`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trim()}...`;
};

export const formatCardDate = (value) => {
  if (!value) return "";
  const raw = String(value).slice(0, 10);
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const sessionValidUntil = (sessions) => {
  const list = Array.isArray(sessions) ? sessions : [];
  const active = list.find((s) => s.session_status === "active" && (s.academic_year_end_date || s.session_end_date));
  const raw = active?.academic_year_end_date || active?.session_end_date;
  if (raw) return String(raw).slice(0, 10);
  const dated = list
    .map((s) => s.academic_year_end_date || s.session_end_date)
    .filter(Boolean)
    .map((d) => String(d).slice(0, 10))
    .sort();
  return dated.at(-1) || "";
};

export const schoolForIdCard = (school) => {
  const logo = school?.logo_url;
  return {
    name: school?.school_name || "School",
    motto: school?.motto || "",
    address: [school?.address, school?.state, school?.country].filter(Boolean).join(", "),
    phone: school?.phone_number || "",
    email: school?.email || "",
    logoUrl: typeof logo === "string" ? logo : logo?.url || logo?.secure_url || "",
    website: school?.website || "",
  };
};

const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

const hexToRgb = (hex) => {
  const raw = String(hex || "#111111").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return [17, 17, 17];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const shown = (template, key) => template[key] !== false;

const paintCard = (doc, x, y, paper, size) => {
  const [pr, pg, pb] = hexToRgb(paper || "#ffffff");
  doc.setFillColor(pr, pg, pb);
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, size.w, size.h, 2.2, 2.2, "FD");
};

const paintPhoto = (doc, x, y, w, h, card, images, fill) => {
  if (images.photo) {
    try {
      doc.addImage(images.photo, imageFormat(images.photo), x, y, w, h);
      return;
    } catch { /* fall through to initials */ }
  }
  const [r, g, b] = hexToRgb(fill);
  doc.setFillColor(r, g, b);
  doc.rect(x, y, w, h, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(initials(card.name), x + w / 2, y + h / 2 + 1.5, { align: "center" });
};

const CARD_LAYOUTS = new Set(["gold", "campus", "round", "formal"]);

const paintWatermark = (doc, x, y, size, images) => {
  if (!images?.logo) return;
  try {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    const w = Math.min(size.w, size.h) * 0.38;
    doc.addImage(images.logo, imageFormat(images.logo), x + (size.w - w) / 2, y + (size.h - w) / 2, w, w);
    doc.restoreGraphicsState();
  } catch { /* optional */ }
};

const fieldRows = (card, template, school, validLabel) => {
  const rows = [];
  if (shown(template, "showName")) rows.push(["Name", card.name || "—"]);
  if (shown(template, "showClass")) rows.push([card.kind === "staff" ? "Role" : "Class", card.role || "—"]);
  if (shown(template, "showSession") && card.session) rows.push(["Session", card.session]);
  if (shown(template, "showId")) rows.push(["ID", card.idNumber || "—"]);
  if (shown(template, "showContact") && school?.address) rows.push(["Address", school.address]);
  if (shown(template, "showValidUntil") && validLabel) rows.push(["Valid", validLabel]);
  if (shown(template, "showEmergency") && card.emergencyName) {
    rows.push(["Emergency", [card.emergencyName, card.emergencyPhone].filter(Boolean).join(" ")]);
  }
  return rows.slice(0, 6);
};

const paintRows = (doc, x, y, width, rows, ink) => {
  const [ir, ig, ib] = hexToRgb(ink || "#111111");
  let cursor = y;
  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(label, x, cursor);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(ir, ig, ib);
    doc.text(fitText(doc, String(value || "—"), Math.max(8, width - 16)), x + 16, cursor);
    cursor += 4.2;
  });
};

const drawFreeSide = (doc, x, y, card, school, validLabel, images, template, size, side) => {
  const CARD_W = size.w;
  const CARD_H = size.h;
  const layout = CARD_LAYOUTS.has(template.layout) ? template.layout : "gold";
  const [r, g, b] = hexToRgb(template.headerColor);
  const [ar, ag, ab] = hexToRgb(template.accentColor || template.headerColor);
  const [ir, ig, ib] = hexToRgb(template.ink || "#111111");
  paintCard(doc, x, y, template.paper, size);
  paintWatermark(doc, x, y, size, images);
  if (side === "front") {
    if (layout === "campus") {
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(1);
      doc.roundedRect(x + 1.2, y + 1.2, CARD_W - 2.4, CARD_H - 2.4, 1.5, 1.5, "S");
      doc.setFillColor(r, g, b);
      doc.rect(x + 1.4, y + CARD_H - 8, CARD_W - 2.8, 6.6, "F");
    } else if (layout === "round") {
      doc.setFillColor(r, g, b);
      doc.circle(x + CARD_W - 6, y + 8, 9, "F");
      doc.setFillColor(ar, ag, ab);
      doc.circle(x + 8, y + CARD_H - 6, 8, "F");
    } else if (layout === "formal") {
      doc.setFillColor(ar, ag, ab);
      doc.rect(x, y, 28, 14, "F");
      doc.setFillColor(r, g, b);
      doc.rect(x + 22, y, CARD_W - 22, 14, "F");
      doc.rect(x, y + CARD_H - 7, CARD_W, 7, "F");
    } else {
      doc.setFillColor(r, g, b);
      doc.rect(x, y, CARD_W, 12, "F");
      doc.setFillColor(ar, ag, ab);
      doc.rect(x, y + CARD_H - 6, CARD_W, 6, "F");
    }
  } else {
    doc.setFillColor(r, g, b);
    doc.rect(x, y, CARD_W, 10, "F");
  }
  (template.placements?.[side] || []).forEach((item) => {
    const px = x + (Number(item.x) / 100) * CARD_W;
    const py = y + (Number(item.y) / 100) * CARD_H;
    if (/^box-\d+$/.test(item.key)) {
      const bw = ((Number(item.w) || 36) / 100) * CARD_W;
      const bh = ((Number(item.h) || 22) / 100) * CARD_H;
      const head = Math.min(3.2, Math.max(1.6, bh * 0.18));
      doc.setFillColor(255, 255, 255);
      doc.rect(px, py, bw, bh, "F");
      doc.setFillColor(r, g, b);
      doc.rect(px, py, bw, head, "F");
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.35);
      doc.rect(px, py, bw, bh);
      return;
    }
    if (item.key === "photo") {
      paintPhoto(doc, px, py, 16, 20, card, images, template.accentColor);
      return;
    }
    if (item.key === "logo" && images?.logo) {
      try { doc.addImage(images.logo, imageFormat(images.logo), px, py, 8, 8); } catch { /* optional */ }
      return;
    }
    if (item.key === "qr") {
      doc.setDrawColor(ar, ag, ab);
      doc.rect(px, py, 12, 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(ir, ig, ib);
      doc.text("QR", px + 6, py + 7, { align: "center" });
      return;
    }
    const value = {
      school: school.name,
      title: card.kind === "staff" ? template.staffLabel : template.studentLabel,
      name: card.name,
      class: card.role,
      session: card.session,
      id: card.idNumber,
      address: school.address,
      valid: String(validLabel || "").replace(/^Valid until\s*/i, ""),
      emergency: [card.emergencyName, card.emergencyPhone].filter(Boolean).join("  "),
      motto: school.motto,
      note: template.footerText,
      phone: [school.address, school.phone, school.email].filter(Boolean).join("  ·  "),
    }[item.key];
    const label = item.key === "class"
      ? (card.kind === "staff" ? "Role" : "Class")
      : item.key === "id"
        ? (card.kind === "staff" ? "Staff ID" : "Admission number")
        : ({
          name: "Name",
          session: "Current session",
          address: "Address",
          valid: "Valid until",
          emergency: "Emergency contact",
          motto: "Motto",
          phone: "Address and phone",
        }[item.key] || "");
    if (!value && !label) return;
    doc.setTextColor(17, 17, 17);
    let textY = py + 3;
    if (label) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.text(label.toUpperCase(), px, py + 2.2);
      textY = py + 6;
    }
    doc.setFont("helvetica", item.key === "name" || item.key === "title" ? "bold" : "normal");
    doc.setFontSize(item.key === "name" ? 11 : 8);
    doc.text(doc.splitTextToSize(String(value || "—"), CARD_W * 0.62).slice(0, 2), px, textY);
  });
};

const drawFront = (doc, x, y, card, school, validLabel, images, template, size) => {
  if (template.placements && Array.isArray(template.placements.front)) {
    drawFreeSide(doc, x, y, card, school, validLabel, images, template, size, "front");
    return;
  }
  const CARD_W = size.w;
  const CARD_H = size.h;
  const layout = CARD_LAYOUTS.has(template.layout) ? template.layout : "gold";
  const [r, g, b] = hexToRgb(template.headerColor);
  const [ar, ag, ab] = hexToRgb(template.accentColor || template.headerColor);
  const [ir, ig, ib] = hexToRgb(template.ink || "#111111");
  paintCard(doc, x, y, template.paper, size);
  paintWatermark(doc, x, y, size, images);
  const photo = shown(template, "showPhoto");
  const title = card.kind === "staff" ? template.staffLabel : template.studentLabel;
  const rows = fieldRows(card, template, school, validLabel);
  const photoW = 18;
  const photoH = Math.min(24, CARD_H - 28);

  if (layout === "campus") {
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1);
    doc.roundedRect(x + 1.2, y + 1.2, CARD_W - 2.4, CARD_H - 2.4, 1.5, 1.5, "S");
    if (shown(template, "showSchool")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(r, g, b);
      doc.text(fitText(doc, school.name, CARD_W - 10), x + CARD_W / 2, y + 8, { align: "center" });
    }
    doc.setFillColor(ar, ag, ab);
    doc.roundedRect(x + 8, y + 11, CARD_W - 16, 7, 1, 1, "F");
    if (shown(template, "showName")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(fitText(doc, card.name, CARD_W - 20), x + CARD_W / 2, y + 15.6, { align: "center" });
    }
    if (photo) paintPhoto(doc, x + 5, y + 21, photoW, photoH, card, images, template.accentColor);
    paintRows(doc, photo ? x + 26 : x + 6, y + 24, CARD_W - (photo ? 32 : 12), rows.filter(([label]) => label !== "Name"), template.ink);
    doc.setFillColor(r, g, b);
    doc.rect(x + 1.4, y + CARD_H - 8, CARD_W - 2.8, 6.6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    if (shown(template, "showId")) doc.text(fitText(doc, card.idNumber || "", 40), x + 4, y + CARD_H - 3.6);
    if (card.session) doc.text(fitText(doc, card.session, 40), x + CARD_W - 4, y + CARD_H - 3.6, { align: "right" });
    return;
  }

  if (layout === "round") {
    doc.setFillColor(r, g, b);
    doc.circle(x + CARD_W - 6, y + 8, 9, "F");
    doc.setFillColor(ar, ag, ab);
    doc.circle(x + 8, y + CARD_H - 6, 8, "F");
    let cursor = y + 8;
    if (shown(template, "showSchool")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(ir, ig, ib);
      doc.text(fitText(doc, school.name, CARD_W - 36), x + 6, cursor);
      cursor += 5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(r, g, b);
    doc.text(fitText(doc, title || "ID CARD", CARD_W - 36), x + 6, cursor);
    if (photo) paintPhoto(doc, x + CARD_W - 26, y + 12, 20, 20, card, images, template.headerColor);
    paintRows(doc, x + 6, cursor + 6, CARD_W - 36, rows, template.ink);
    return;
  }

  if (layout === "formal") {
    doc.setFillColor(ar, ag, ab);
    doc.rect(x, y, 28, 14, "F");
    doc.setFillColor(r, g, b);
    doc.rect(x + 22, y, CARD_W - 22, 14, "F");
    if (shown(template, "showSchool")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(fitText(doc, school.name, CARD_W - 30), x + 26, y + 6);
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(fitText(doc, title || "", CARD_W - 30), x + 26, y + 11);
    if (photo) paintPhoto(doc, x + 4, y + 18, photoW, photoH, card, images, template.headerColor);
    paintRows(doc, photo ? x + 26 : x + 5, y + 20, CARD_W - (photo ? 32 : 10), rows, template.ink);
    doc.setFillColor(r, g, b);
    doc.rect(x, y + CARD_H - 7, CARD_W, 7, "F");
    if (shown(template, "showContact")) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(fitText(doc, [school.address, school.phone].filter(Boolean).join("  ·  "), CARD_W - 8), x + 4, y + CARD_H - 2.8);
    }
    return;
  }

  doc.setFillColor(r, g, b);
  doc.rect(x, y, CARD_W, 14, "F");
  let nameX = x + 6;
  if (shown(template, "showLogo") && images.logo) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.circle(x + 8, y + 7, 5, "F");
      doc.addImage(images.logo, imageFormat(images.logo), x + 4.2, y + 3.2, 7.6, 7.6);
      nameX = x + 16;
    } catch { /* optional */ }
  }
  if (shown(template, "showSchool")) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(fitText(doc, school.name, CARD_W - (nameX - x) - 6), nameX, y + 6);
  }
  if (shown(template, "showContact") && school.address) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(fitText(doc, school.address, CARD_W - (nameX - x) - 6), nameX, y + 11);
  }
  if (photo) paintPhoto(doc, x + 5, y + 18, photoW, photoH, card, images, template.accentColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(ir, ig, ib);
  doc.text(fitText(doc, title || "ID CARD", CARD_W - 32), photo ? x + 26 : x + 5, y + 20);
  paintRows(doc, photo ? x + 26 : x + 5, y + 25, CARD_W - (photo ? 32 : 10), rows, template.ink);
  doc.setFillColor(ar, ag, ab);
  doc.rect(x, y + CARD_H - 6, CARD_W, 6, "F");
};

const drawBack = (doc, x, y, card, school, qrUrl, template, size, images) => {
  if (template.placements && Array.isArray(template.placements.back)) {
    drawFreeSide(doc, x, y, card, school, "", images, template, size, "back");
    return;
  }
  const CARD_W = size.w;
  const CARD_H = size.h;
  const [r, g, b] = hexToRgb(template.headerColor);
  const [ir, ig, ib] = hexToRgb(template.ink || "#111111");
  paintCard(doc, x, y, template.paper, size);
  paintWatermark(doc, x, y, size, images);
  doc.setFillColor(r, g, b);
  doc.rect(x, y, CARD_W, 2.4, "F");

  const showQr = shown(template, "showQr") && qrUrl;
  const left = x + 4;
  const width = showQr ? CARD_W - 26 : CARD_W - 8;
  let cursor = y + 8;

  if (shown(template, "showSchool")) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(ir, ig, ib);
    doc.text(fitText(doc, school.name, width), left, cursor);
    cursor += 4.2;
  }
  if (shown(template, "showMotto") && school.motto) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 110);
    doc.text(fitText(doc, school.motto, width), left, cursor);
    cursor += 4;
  }
  if (shown(template, "showContact")) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    const address = doc.splitTextToSize(school.address || "", width).slice(0, 2);
    if (address.length && address[0]) {
      doc.text(address, left, cursor);
      cursor += address.length * 3.1 + 1;
    }
    const contact = [school.phone, school.email].filter(Boolean).join("  ·  ");
    if (contact) {
      doc.text(fitText(doc, contact, width), left, cursor);
      cursor += 4.4;
    }
  }
  if (shown(template, "showEmergency")) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(140, 140, 140);
    doc.text("EMERGENCY", left, cursor);
    cursor += 3.4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(ir, ig, ib);
    doc.text(fitText(doc, card.emergencyName || "School office", width), left, cursor);
    if (card.emergencyPhone) {
      cursor += 3.3;
      doc.text(fitText(doc, card.emergencyPhone, width), left, cursor);
    }
  }
  if (showQr) {
    try { doc.addImage(qrUrl, "PNG", x + CARD_W - 19, y + 16, 15, 15); } catch { /* optional */ }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(110, 110, 110);
  const footer = doc.splitTextToSize(template.footerText || "If found, please return this card to the school.", CARD_W - 8);
  doc.text(footer, left, y + CARD_H - 6);
};

const mapPool = async (items, limit, fn) => {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index], index);
    }
  });
  await Promise.all(workers);
  return out;
};

const PX_PER_MM = 3.8;

const frameRadius = (element, ew, eh, cardWidthMm, drawnWidth) => {
  if (element?.shape === "circle" || Number(element?.radius) >= 40) return Math.min(ew, eh) / 2;
  const px = Number(element?.radius) || 0;
  if (px <= 0) return 0;
  const unit = drawnWidth / (Number(cardWidthMm) || drawnWidth);
  return Math.min((px / PX_PER_MM) * unit, ew / 2, eh / 2);
};

const traceRoundRect = (ctx, w, h, r) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(w, 0, w, h, radius);
  ctx.arcTo(w, h, 0, h, radius);
  ctx.arcTo(0, h, 0, 0, radius);
  ctx.arcTo(0, 0, w, 0, radius);
  ctx.closePath();
};

const loadHtmlImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("image"));
  img.src = src;
});

const frameImage = async (src, element, ew, eh, radius) => {
  if (!src || radius <= 0.05) return src;
  const img = await loadHtmlImage(src);
  const scale = 12;
  const w = Math.max(2, Math.round(ew * scale));
  const h = Math.max(2, Math.round(eh * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  traceRoundRect(ctx, w, h, radius * scale);
  ctx.clip();
  if (element.grayscale) ctx.filter = "grayscale(1)";
  const fit = element.type === "logo" ? "fill" : (element.fit || "cover");
  if (fit === "contain") {
    const fitted = Math.min(w / img.width, h / img.height);
    const dw = img.width * fitted;
    const dh = img.height * fitted;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else if (fit === "cover") {
    const fitted = Math.max(w / img.width, h / img.height);
    const dw = img.width * fitted;
    const dh = img.height * fitted;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  } else {
    ctx.drawImage(img, 0, 0, w, h);
  }
  return canvas.toDataURL("image/png");
};

const prepareSideImages = async (elements, images, template, drawn) => Promise.all((elements || []).map(async (element) => {
  if (element.hidden || !["photo", "logo", "image"].includes(element.type)) return element;
  const ew = (Number(element.w) / 100) * drawn.w;
  const eh = (Number(element.h) / 100) * drawn.h;
  const radius = frameRadius(element, ew, eh, template.widthMm, drawn.w);
  const picture = element.type === "photo" ? images.photo : element.type === "logo" ? images.logo : element.src;
  if (!picture || radius <= 0.05) return element;
  try {
    return { ...element, printSrc: await frameImage(picture, element, ew, eh, radius) };
  } catch {
    return element;
  }
}));

const drawEditorSide = (doc, x, y, elements, card, school, extras, images, template, size) => {
  const [pr, pg, pb] = hexToRgb(template.background || "#ffffff");
  doc.setFillColor(pr, pg, pb);
  doc.rect(x, y, size.w, size.h, "F");
  if (template.backgroundImage) {
    try { doc.addImage(template.backgroundImage, imageFormat(template.backgroundImage), x, y, size.w, size.h); } catch { /* optional */ }
    const overlay = Number(template.overlayOpacity);
    if (overlay > 0) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: Math.min(1, overlay) }));
      doc.setFillColor(pr, pg, pb);
      doc.rect(x, y, size.w, size.h, "F");
      doc.restoreGraphicsState();
    }
  }
  if (template.showWatermark) {
    if (images?.logo) paintWatermark(doc, x, y, size, images);
    else if (school?.name) {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(80, 80, 80);
      doc.text(String(school.name), x + size.w / 2, y + size.h / 2, { align: "center", maxWidth: size.w - 8 });
      doc.restoreGraphicsState();
    }
  }
  (elements || []).forEach((element) => {
    if (element.hidden) return;
    const ex = x + (Number(element.x) / 100) * size.w;
    const ey = y + (Number(element.y) / 100) * size.h;
    const ew = (Number(element.w) / 100) * size.w;
    const eh = (Number(element.h) / 100) * size.h;
    doc.saveGraphicsState();
    if (Number(element.opacity) < 1) doc.setGState(new doc.GState({ opacity: Number(element.opacity) }));
    if (element.type === "shape") {
      const [fr, fg, fb] = hexToRgb(element.fill || "#111111");
      const [sr, sg, sb] = hexToRgb(element.stroke || "#111111");
      doc.setFillColor(fr, fg, fb);
      doc.setDrawColor(sr, sg, sb);
      doc.setLineWidth(Math.max(0.1, Number(element.strokeWidth) || 0.2));
      if (element.shape === "circle") doc.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, element.strokeWidth ? "FD" : "F");
      else if (element.shape === "line") {
        doc.setDrawColor(sr, sg, sb);
        doc.line(ex, ey + eh / 2, ex + ew, ey + eh / 2);
      } else doc.roundedRect(ex, ey, ew, eh, Math.min(2, ew / 6), Math.min(2, eh / 6), element.strokeWidth ? "FD" : "F");
    } else if (element.type === "photo" || element.type === "logo" || element.type === "image") {
      const picture = element.printSrc || (element.type === "photo" ? images.photo : element.type === "logo" ? images.logo : element.src);
      const radius = frameRadius(element, ew, eh, template.widthMm, size.w);
      if (picture) {
        try { doc.addImage(picture, element.printSrc ? "PNG" : imageFormat(picture), ex, ey, ew, eh); } catch { /* optional */ }
      } else {
        doc.setFillColor(220, 220, 220);
        if (radius > 0) doc.roundedRect(ex, ey, ew, eh, radius, radius, "F");
        else doc.rect(ex, ey, ew, eh, "F");
      }
      if (radius > 0 && Number(element.strokeWidth) > 0) {
        const [sr, sg, sb] = hexToRgb(element.stroke || "#111111");
        doc.setDrawColor(sr, sg, sb);
        doc.setLineWidth(Math.max(0.1, Number(element.strokeWidth) / PX_PER_MM));
        doc.roundedRect(ex, ey, ew, eh, radius, radius, "S");
      }
    } else if (element.type === "qr") {
      if (images.qr) {
        try { doc.addImage(images.qr, "PNG", ex, ey, Math.min(ew, eh), Math.min(ew, eh)); } catch { /* optional */ }
      } else {
        doc.setDrawColor(17, 17, 17);
        doc.rect(ex, ey, Math.min(ew, eh), Math.min(ew, eh));
      }
    } else if (element.type === "barcode") {
      const value = displayText({ ...element, type: "text" }, card, school, extras, true) || card.idNumber || "ID";
      const bits = [];
      String(value).split("").forEach((char) => {
        const code = char.charCodeAt(0);
        bits.push((code & 1) ? 2 : 1, (code & 2) ? 3 : 1, (code & 4) ? 1 : 2);
      });
      const total = bits.reduce((sum, bit) => sum + bit, 0) || 1;
      let cursor = ex;
      bits.forEach((bit, index) => {
        const bw = (bit / total) * ew;
        if (index % 2 === 0) {
          doc.setFillColor(17, 17, 17);
          doc.rect(cursor, ey, bw, eh, "F");
        }
        cursor += bw;
      });
    } else {
      const value = displayText(element, card, school, extras, true);
      const showLabel = !!(element.field && element.showLabel !== false);
      const label = displayLabel(element, card?.kind === "staff");
      if (value || showLabel) {
        const [tr, tg, tb] = hexToRgb(element.color || "#111111");
        doc.setTextColor(tr, tg, tb);
        const style = element.italic
          ? (element.fontWeight >= 700 ? "bolditalic" : "italic")
          : (element.fontWeight >= 700 ? "bold" : "normal");
        doc.setFont(element.fontFamily || "helvetica", style);
        const valueSize = Math.max(6, Number(element.fontSizeMm) * 2.83465 || 8);
        const align = element.align || "left";
        const anchor = align === "center" ? ex + ew / 2 : align === "right" ? ex + ew : ex;
        const layout = element.labelLayout || "inline";
        if (!showLabel) {
          doc.setFontSize(valueSize);
          const lines = doc.splitTextToSize(String(value), Math.max(4, ew));
          doc.text(lines.slice(0, 4), anchor, ey + 3, { align, angle: Number(element.rotation) || 0 });
        } else if (layout === "stacked") {
          doc.setFont(element.fontFamily || "helvetica", "normal");
          doc.setFontSize(Math.max(5, valueSize * 0.72));
          doc.text(label, anchor, ey + 2.4, { align });
          if (value) {
            doc.setFont(element.fontFamily || "helvetica", style);
            doc.setFontSize(valueSize);
            const lines = doc.splitTextToSize(String(value), Math.max(4, ew));
            doc.text(lines.slice(0, 3), anchor, ey + 2.4 + valueSize * 0.45, { align });
          }
        } else if (layout === "beside") {
          doc.setFont(element.fontFamily || "helvetica", "normal");
          doc.setFontSize(Math.max(5, valueSize * 0.78));
          doc.text(label, ex, ey + 3, { align: "left" });
          const labelWidth = doc.getTextWidth(`${label} `);
          if (value) {
            doc.setFont(element.fontFamily || "helvetica", style);
            doc.setFontSize(valueSize);
            const lines = doc.splitTextToSize(String(value), Math.max(4, ew - labelWidth));
            doc.text(lines.slice(0, 3), ex + labelWidth, ey + 3, { align: "left" });
          }
        } else {
          doc.setFontSize(valueSize);
          const line = value ? `${label}: ${value}` : label;
          const lines = doc.splitTextToSize(line, Math.max(4, ew));
          doc.text(lines.slice(0, 4), anchor, ey + 3, { align, angle: Number(element.rotation) || 0 });
        }
      }
    }
    doc.restoreGraphicsState();
  });
};

const exportEditorPdf = async ({ doc, cards, school, validUntil, filename, template, QR }) => {
  const people = cards;
  const logo = await loadImageDataUrl(school?.logoUrl);
  const photos = await mapPool(people, 4, (card) => loadImageDataUrl(card.photoUrl));
  const qrApi = QR?.toDataURL ? QR : QR?.default;
  const qrUrls = await mapPool(people, 6, async (card) => {
    if (!qrApi?.toDataURL || !card.idNumber) return null;
    try {
      return await qrApi.toDataURL(String(card.idNumber), { margin: 1, width: 256, errorCorrectionLevel: "M" });
    } catch {
      return null;
    }
  });
  const extras = { issueDate: formatCardDate(new Date().toISOString().slice(0, 10)), expiryDate: formatCardDate(validUntil) };
  const size = { w: Number(template.widthMm) || 85.6, h: Number(template.heightMm) || 53.98 };
  const pdf = doc;
  const margin = 8;
  const wide = size.w > 180 || size.h > 250;
  const scale = wide ? Math.min((210 - margin * 2) / size.w, (297 - margin * 2) / size.h, 1) : 1;
  const draw = { w: size.w * scale, h: size.h * scale };
  const cols = wide ? 1 : 2;
  const rows = wide ? 1 : (draw.h > draw.w ? 2 : 3);
  const gap = wide ? 0 : 4;
  const perPage = cols * rows;
  const gridW = cols * draw.w + (cols - 1) * gap;
  const gridH = rows * draw.h + (rows - 1) * gap;
  const originX = (210 - gridW) / 2;
  const originY = (297 - gridH) / 2;
  const slotPosition = (index) => {
    const slot = index % perPage;
    return {
      x: originX + (slot % cols) * (draw.w + gap),
      y: originY + Math.floor(slot / cols) * (draw.h + gap),
      page: Math.floor(index / perPage),
    };
  };
  const paintPeople = async (sideName) => {
    for (let index = 0; index < people.length; index += 1) {
      const card = people[index];
      const pos = slotPosition(index);
      if (pos.page > 0 && index % perPage === 0) pdf.addPage();
      const shot = { logo, photo: photos[index], qr: qrUrls[index] };
      const elements = await prepareSideImages(template[sideName], shot, template, draw);
      drawEditorSide(pdf, pos.x, pos.y, elements, card, school, extras, shot, template, draw);
    }
  };
  await paintPeople("front");
  if ((template.back || []).some((element) => !element.hidden)) {
    pdf.addPage();
    await paintPeople("back");
  }
  pdf.save(filename || `id-cards-${people.length}.pdf`);
  return { pages: pdf.getNumberOfPages(), count: people.length };
};

export async function exportIdCardsPDF({ cards, school, validUntil, filename, template }) {
  const people = (cards || []).filter((card) => card && card.name);
  if (!people.length) throw new Error("Choose at least one person");
  const tpl = { ...DEFAULT_ID_CARD_TEMPLATE, ...(template || {}) };

  const [{ jsPDF }, QR] = await Promise.all([
    import("jspdf"),
    import("qrcode"),
  ]);

  const logo = await loadImageDataUrl(school?.logoUrl);
  const photos = await mapPool(people, 4, (card) => loadImageDataUrl(card.photoUrl));
  const qrApi = QR?.toDataURL ? QR : QR?.default;
  const qrUrls = await mapPool(people, 6, async (card) => {
    if (!tpl.showQr || !qrApi?.toDataURL || !card.idNumber) return null;
    try {
      return await qrApi.toDataURL(String(card.idNumber), { margin: 0, width: 256, errorCorrectionLevel: "M" });
    } catch {
      return null;
    }
  });

  const validLabel = formatCardDate(validUntil);
  const size = tpl.orientation === "portrait" ? { w: 75, h: 100 } : { w: 100, h: 63 };
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  if (tpl.editorVersion === 2 && Array.isArray(tpl.front)) {
    return exportEditorPdf({ doc, cards: people, school, validUntil, filename, template: tpl, QR });
  }
  const cols = 2;
  const rows = size.h > size.w ? 2 : 3;
  const gap = 4;
  const perPage = cols * rows;
  const gridW = cols * size.w + (cols - 1) * gap;
  const gridH = rows * size.h + (rows - 1) * gap;
  const originX = (210 - gridW) / 2;
  const originY = (297 - gridH) / 2;

  const slotPosition = (index, mirror) => {
    const slot = index % perPage;
    const row = Math.floor(slot / cols);
    let col = slot % cols;
    if (mirror) col = cols - 1 - col;
    return {
      x: originX + col * (size.w + gap),
      y: originY + row * (size.h + gap),
      page: Math.floor(index / perPage),
    };
  };

  people.forEach((card, index) => {
    const pos = slotPosition(index, false);
    if (pos.page > 0 && index % perPage === 0) doc.addPage();
    drawFront(doc, pos.x, pos.y, card, school, validLabel, { logo, photo: photos[index] }, tpl, size);
  });

  const frontPages = Math.ceil(people.length / perPage);
  people.forEach((card, index) => {
    const pos = slotPosition(index, true);
    if (index % perPage === 0) doc.addPage();
    drawBack(doc, pos.x, pos.y, card, school, qrUrls[index], tpl, size, { logo });
  });

  const safeName = filename || `id-cards-${people.length}.pdf`;
  doc.save(safeName);
  return { pages: frontPages * 2, count: people.length };
}
