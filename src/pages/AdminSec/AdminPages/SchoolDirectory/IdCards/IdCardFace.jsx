const initials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?";

function Watermark({ school }) {
  if (!school?.logoUrl) return null;
  return <img className="ict-watermark" src={school.logoUrl} alt="" />;
}

function LogoMark({ school, light }) {
  if (school.logoUrl) return <img src={school.logoUrl} alt="" />;
  return <b className={light ? "is-light" : ""}>{initials(school.name)}</b>;
}

function Photo({ person, accent }) {
  return (
    <span className="ict-shot" style={{ background: accent || "#dddddd" }}>
      {person.photoUrl && <img src={person.photoUrl} alt="" onError={(e) => e.currentTarget.remove()} />}
      <b>{initials(person.name)}</b>
    </span>
  );
}

function rowsFor(design, person, school, kind, validLabel) {
  const rows = [];
  if (design.showName !== false) rows.push(["Name", person.name]);
  if (design.showClass !== false) rows.push([kind === "staff" ? "Role" : "Class", person.role || "—"]);
  if (design.showSession !== false && person.session) rows.push(["Session", person.session]);
  if (design.showId !== false) rows.push(["ID", person.idNumber || "—"]);
  if (design.showContact !== false && school.address) rows.push(["Address", school.address]);
  if (design.showValidUntil !== false && validLabel) rows.push(["Valid", String(validLabel).replace(/^Valid until\s*/i, "")]);
  if (design.showEmergency !== false && person.emergencyName) {
    rows.push(["Emergency", [person.emergencyName, person.emergencyPhone].filter(Boolean).join(" · ")]);
  }
  return rows;
}

function FieldRows({ rows, stacked }) {
  return (
    <div className={`ict-rows${stacked ? " is-stacked" : ""}`}>
      {rows.map(([label, value]) => (
        <p key={label}>
          <span>{label}</span>
          <b>{value || "—"}</b>
        </p>
      ))}
    </div>
  );
}

export function CardFront({ design, person, school, kind, validLabel, blank }) {
  const tall = design.orientation === "portrait";
  const layout = ["gold", "campus", "round", "formal"].includes(design.layout) ? design.layout : "gold";
  const title = kind === "staff" ? design.staffLabel : design.studentLabel;
  const rows = rowsFor(design, person, school, kind, validLabel);
  const faceStyle = {
    background: design.paper || "#ffffff",
    color: design.ink || "#111111",
    "--ict-header": design.headerColor || "#111111",
    "--ict-accent": design.accentColor || "#333333",
  };

  let body = null;
  if (layout === "campus") {
    body = (
      <>
        <div className="ict-campus-head">
          {!blank && design.showLogo !== false && <span className="ict-campus-logo"><LogoMark school={school} /></span>}
          {!blank && design.showSchool !== false && <strong>{school.name}</strong>}
          {!blank && design.showContact !== false && school.address && <small>{school.address}</small>}
        </div>
        {!blank && design.showName !== false && <div className="ict-campus-name">{person.name}</div>}
        <div className="ict-campus-body">
          {!blank && design.showPhoto !== false && <Photo person={person} accent={design.accentColor} />}
          {!blank && <FieldRows rows={rows.filter(([label]) => label !== "Name")} />}
        </div>
        <div className="ict-campus-foot">
          <span>{!blank && design.showId !== false ? person.idNumber : ""}</span>
          <span>{!blank ? person.session || "" : ""}</span>
        </div>
      </>
    );
  } else if (layout === "round") {
    body = (
      <>
        <i className="ict-round-corner a" />
        <i className="ict-round-corner b" />
        <div className="ict-round-inner">
          <div>
            <div className="ict-round-brand">
              {!blank && design.showLogo !== false && <span className="ict-round-logo"><LogoMark school={school} /></span>}
              {!blank && design.showSchool !== false && <strong>{school.name}</strong>}
            </div>
            {!blank && <p className="ict-round-title">{title}</p>}
            {!blank && <FieldRows rows={rows} stacked />}
          </div>
          {!blank && design.showPhoto !== false && <Photo person={person} accent={design.headerColor} />}
        </div>
      </>
    );
  } else if (layout === "formal") {
    body = (
      <>
        <div className="ict-formal-head">
          <div className="ict-formal-logo" style={{ background: design.accentColor || "#333333" }}>
            {!blank && design.showLogo !== false && <LogoMark school={school} light />}
            {!blank && <span>School</span>}
          </div>
          <div className="ict-formal-school" style={{ background: design.headerColor || "#111111" }}>
            {!blank && design.showSchool !== false && <strong>{school.name}</strong>}
            {!blank && <em>{title}</em>}
          </div>
        </div>
        <div className="ict-formal-body">
          {!blank && design.showPhoto !== false && <Photo person={person} accent={design.headerColor} />}
          {!blank && <FieldRows rows={rows} />}
        </div>
        <div className="ict-formal-foot" style={{ background: design.headerColor || "#111111" }}>
          {!blank && design.showContact !== false && <span>{[school.address, school.phone].filter(Boolean).join(" · ")}</span>}
        </div>
      </>
    );
  } else {
    body = (
      <>
        <div className="ict-gold-head" style={{ background: design.headerColor || "#111111" }}>
          {!blank && design.showLogo !== false && (
            <span className="ict-gold-logo"><LogoMark school={school} /></span>
          )}
          {!blank && (
            <span>
              {design.showSchool !== false && <strong>{school.name}</strong>}
              {design.showContact !== false && school.address && <small>{school.address}</small>}
            </span>
          )}
        </div>
        {!blank && (
          <div className="ict-gold-body">
            {design.showPhoto !== false && <Photo person={person} accent={design.accentColor} />}
            <div className="ict-gold-main">
              <p className="ict-gold-title">{title}</p>
              <FieldRows rows={rows} />
            </div>
          </div>
        )}
        <i className="ict-gold-wave" style={{ background: design.accentColor || "#333333" }} />
      </>
    );
  }

  return (
    <div className={`ict-face layout-${layout}${tall ? " is-tall" : ""}`} style={faceStyle}>
      <Watermark school={school} />
      {body}
    </div>
  );
}

export function CardBack({ design, person, school, blank }) {
  return (
    <div
      className={`ict-face ict-rear layout-back${design.orientation === "portrait" ? " is-tall" : ""}`}
      style={{
        background: design.paper || "#ffffff",
        color: design.ink || "#111111",
        "--ict-header": design.headerColor || "#111111",
        "--ict-accent": design.accentColor || "#333333",
      }}
    >
      <Watermark school={school} />
      <div className="ict-back-head" style={{ background: design.headerColor || "#111111" }}>
        {!blank && design.showLogo !== false && <span className="ict-back-logo"><LogoMark school={school} light /></span>}
        {!blank && <strong>{design.showSchool !== false ? school.name : "Terms"}</strong>}
      </div>
      {!blank && (
      <div className="ict-rear-body">
        <div className="ict-rear-copy">
          <span className="ict-back-kicker" style={{ color: design.accentColor || "#333333" }}>Terms</span>
          {design.showMotto !== false && school.motto && <span>{school.motto}</span>}
          <span className="ict-rear-foot">{design.footerText}</span>
          {design.showContact !== false && (
            <span>{[school.address, school.phone, school.email].filter(Boolean).join(" · ") || "School address and phone"}</span>
          )}
          {design.showEmergency !== false && person.emergencyName && (
            <span>Emergency · {person.emergencyName}{person.emergencyPhone ? ` · ${person.emergencyPhone}` : ""}</span>
          )}
        </div>
        {design.showQr !== false && (
          <span className="ict-qr" style={{ borderColor: design.accentColor || "#111111" }}>QR</span>
        )}
      </div>
      )}
    </div>
  );
}

export const CARD_PIECES = [
  { key: "box", label: "Box", side: "front", repeat: true },
  { key: "photo", label: "Photo", side: "front" },
  { key: "logo", label: "School logo", side: "front" },
  { key: "school", label: "School name", side: "front" },
  { key: "title", label: "Card title", side: "front" },
  { key: "name", label: "Name", side: "front" },
  { key: "class", label: "Class", staff: "Role", side: "front" },
  { key: "session", label: "Current session", side: "front" },
  { key: "id", label: "Admission number", staff: "Staff ID", side: "front" },
  { key: "address", label: "Address", side: "front" },
  { key: "valid", label: "Valid until", side: "front" },
  { key: "emergency", label: "Emergency contact", side: "front" },
  { key: "school", label: "School name", side: "back" },
  { key: "motto", label: "Motto", side: "back" },
  { key: "note", label: "Back note", side: "back" },
  { key: "phone", label: "Address and phone", side: "back" },
  { key: "emergency", label: "Emergency contact", side: "back" },
  { key: "qr", label: "QR code", side: "back" },
];

function pieceLabel(pieceKey, kind) {
  if (pieceKey === "class") return kind === "staff" ? "Role" : "Class";
  if (pieceKey === "id") return kind === "staff" ? "Staff ID" : "Admission number";
  return {
    name: "Name",
    session: "Current session",
    address: "Address",
    valid: "Valid until",
    emergency: "Emergency contact",
    motto: "Motto",
    phone: "Address and phone",
  }[pieceKey] || "";
}

export const isBoxKey = (key) => String(key || "").startsWith("box-");

export function pieceStyle(item) {
  const style = { left: `${item.x}%`, top: `${item.y}%` };
  if (isBoxKey(item.key)) {
    style.width = `${item.w || 36}%`;
    style.height = `${item.h || 22}%`;
  }
  return style;
}

export function PieceView({ pieceKey, design, person, school, kind, validLabel }) {
  if (isBoxKey(pieceKey)) return null;
  if (pieceKey === "photo") return <Photo person={person} accent={design.accentColor} />;
  if (pieceKey === "logo") return <span className="ict-piece-logo"><LogoMark school={school} /></span>;
  if (pieceKey === "qr") return <span className="ict-qr" style={{ borderColor: design.accentColor || "#111111" }}>QR</span>;
  const value = {
    school: school.name,
    title: kind === "staff" ? design.staffLabel : design.studentLabel,
    name: person.name,
    class: person.role,
    session: person.session,
    id: person.idNumber,
    address: school.address,
    valid: String(validLabel || "").replace(/^Valid until\s*/i, ""),
    emergency: [person.emergencyName, person.emergencyPhone].filter(Boolean).join(" · "),
    motto: school.motto,
    note: design.footerText,
    phone: [school.address, school.phone, school.email].filter(Boolean).join(" · "),
  }[pieceKey];
  const label = pieceLabel(pieceKey, kind);
  return (
    <span className={`ict-piece-text is-${pieceKey}`}>
      {label ? <small>{label}</small> : null}
      <b>{value || "—"}</b>
    </span>
  );
}
