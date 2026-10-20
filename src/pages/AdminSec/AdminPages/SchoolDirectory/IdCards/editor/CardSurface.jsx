import { displayText, displayLabel, PX_PER_MM } from "./model";

const fontFamily = {
  helvetica: "Arial, Helvetica, sans-serif",
  times: "Times New Roman, Times, serif",
  courier: "Courier New, Courier, monospace",
};

function bars(value) {
  const source = String(value || "ID");
  const bits = [];
  for (let i = 0; i < source.length; i += 1) {
    const code = source.charCodeAt(i);
    bits.push((code & 1) ? 2 : 1, (code & 2) ? 3 : 1, (code & 4) ? 1 : 2);
  }
  return bits;
}

export default function CardSurface({
  template,
  side = "front",
  person,
  school,
  extras,
  preview = false,
  selected = [],
  interactive = false,
  onSelect,
  onDrag,
  onResize,
  onRotate,
  onEditText,
  onClear,
  pixelsPerMm,
}) {
  const elements = template?.[side] || [];
  const radius = pixelsPerMm
    ? `${(Number(template?.cornerRadius) || 0) * pixelsPerMm}px`
    : `${Number(template?.cornerRadius) || 0}mm`;
  const borderWidth = pixelsPerMm
    ? `${(Number(template?.borderWidth) || 0) * pixelsPerMm}px`
    : `${Number(template?.borderWidth) || 0}mm`;
  return (
    <div
      className={`ice-card${preview ? " is-preview" : ""}`}
      style={{
        background: template?.background || "#ffffff",
        borderRadius: radius,
        border: `${borderWidth} solid ${template?.borderColor || "transparent"}`,
      }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClear?.();
      }}
    >
      {template?.backgroundImage && (
        <img className="ice-card-bg" src={template.backgroundImage} alt="" />
      )}
      {template?.backgroundImage && Number(template.overlayOpacity) > 0 && (
        <div className="ice-card-overlay" style={{ background: template.background || "#ffffff", opacity: Number(template.overlayOpacity) }} />
      )}
      {template?.showWatermark && (
        school?.logoUrl
          ? <img className="ice-watermark" src={school.logoUrl} alt="" />
          : <span className="ice-watermark is-text">{school?.name || "School"}</span>
      )}
      {template?.showSafe && interactive && <div className="ice-safe" />}
      {template?.showBleed && interactive && <div className="ice-bleed" />}
      {template?.showGrid && interactive && <div className="ice-grid" />}
      {elements.map((element) => {
        if (element.hidden && !interactive) return null;
        const active = selected.includes(element.id);
        const text = element.type === "text"
          ? displayText(element, person, school, extras, preview)
          : "";
        const missing = preview && element.field && element.type === "text" && !text;
        return (
          <div
            key={element.id}
            className={`ice-el is-${element.type}${active ? " is-on" : ""}${element.locked ? " is-locked" : ""}${element.hidden ? " is-hidden" : ""}`}
            style={{
              left: `${element.x}%`,
              top: `${element.y}%`,
              width: `${element.w}%`,
              height: `${element.h}%`,
              transform: `rotate(${element.rotation || 0}deg)`,
              opacity: element.hidden ? 0.35 : element.opacity,
              pointerEvents: interactive && !element.locked ? "auto" : "none",
            }}
            data-el={element.id}
            onPointerDown={(event) => onSelect?.(event, element)}
          >
            {element.type === "text" && (
              interactive && !element.field && active ? (
                <textarea
                  className="ice-el-text is-editing"
                  value={element.text}
                  onChange={(event) => onEditText?.(element.id, event.target.value)}
                  ref={(node) => {
                    if (!node) return;
                    node.style.setProperty("color", "#111111", "important");
                    node.style.setProperty("-webkit-text-fill-color", "#111111", "important");
                    node.style.setProperty("background", "transparent", "important");
                    node.style.setProperty("background-color", "transparent", "important");
                  }}
                  style={textStyle(element, pixelsPerMm, true)}
                />
              ) : (
                <FieldText element={element} value={missing ? "No data" : text} missing={missing} pixelsPerMm={pixelsPerMm} staff={person?.kind === "staff" || template?.type === "staff"} />
              )
            )}
            {element.type === "photo" && (
              <span className="ice-el-photo" style={frameStyle(element)}>
                {person?.photoUrl ? <img src={person.photoUrl} alt="" style={{ objectFit: element.fit }} /> : <b>Photo</b>}
              </span>
            )}
            {element.type === "logo" && (
              <span className="ice-el-photo" style={frameStyle(element)}>
                {school?.logoUrl ? <img src={school.logoUrl} alt="" /> : <b>Logo</b>}
              </span>
            )}
            {element.type === "image" && (
              <span className="ice-el-photo" style={frameStyle(element)}>
                {element.src ? <img src={element.src} alt="" style={{ objectFit: element.fit }} /> : <b>Image</b>}
              </span>
            )}
            {element.type === "shape" && <span className={`ice-shape is-${element.shape}`} style={shapeStyle(element)} />}
            {element.type === "qr" && <span className="ice-qr">QR</span>}
            {element.type === "barcode" && (
              <span className="ice-bars" aria-hidden="true">
                {bars(person?.idNumber || "ID").map((width, index) => (
                  <i key={`${element.id}-${index}`} style={{ flex: width, background: index % 2 ? "transparent" : (element.fill || "#111") }} />
                ))}
              </span>
            )}
            {interactive && active && !element.locked && (
              <>
                {["nw", "ne", "sw", "se", "n", "e", "s", "w"].map((edge) => (
                  <button
                    key={edge}
                    type="button"
                    className={`ice-handle is-${edge}`}
                    aria-label={`Resize ${edge}`}
                    onPointerDown={(event) => onResize?.(event, element, edge)}
                  />
                ))}
                <button
                  type="button"
                  className="ice-rotate"
                  aria-label="Rotate"
                  onPointerDown={(event) => onRotate?.(event, element)}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FieldText({ element, value, missing, pixelsPerMm, staff }) {
  const layout = ["inline", "stacked", "beside"].includes(element.labelLayout) ? element.labelLayout : "inline";
  const showLabel = !!(element.field && element.showLabel !== false);
  return (
    <span className={`ice-el-text${showLabel ? ` is-${layout}` : ""}${missing ? " is-missing" : ""}`} style={textStyle(element, pixelsPerMm, false)}>
      {showLabel && <em className="ice-el-label">{displayLabel(element, staff)}</em>}
      <strong className="ice-el-value">{value}</strong>
    </span>
  );
}

function textStyle(element, pixelsPerMm, editing) {
  const scale = pixelsPerMm ? pixelsPerMm / PX_PER_MM : 1;
  return {
    color: editing ? "#111111" : (element.color || "#111111"),
    background: "transparent",
    fontFamily: fontFamily[element.fontFamily] || fontFamily.helvetica,
    fontSize: pixelsPerMm ? `${element.fontSizeMm * pixelsPerMm}px` : `${element.fontSizeMm}mm`,
    fontWeight: element.fontWeight,
    fontStyle: element.italic ? "italic" : "normal",
    textDecoration: element.underline ? "underline" : "none",
    textAlign: element.align,
    lineHeight: element.lineHeight,
    letterSpacing: `${(element.letterSpacing || 0) * scale}px`,
    textTransform: element.transform === "none" ? "none" : element.transform,
  };
}

function frameStyle(element) {
  return {
    borderRadius: element.shape === "circle" || element.radius >= 40 ? "50%" : `${element.radius || 0}px`,
    border: element.strokeWidth ? `${element.strokeWidth}px solid ${element.stroke}` : "0",
    filter: element.grayscale ? "grayscale(1)" : "none",
    background: element.fill || "#e5e7eb",
  };
}

function shapeStyle(element) {
  return {
    background: element.shape === "line" ? element.stroke : element.fill,
    border: element.shape === "line" ? "0" : `${element.strokeWidth || 0}px solid ${element.stroke}`,
    borderRadius: element.shape === "circle" ? "50%" : `${element.radius || 0}px`,
  };
}
