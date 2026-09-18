const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function FeatureVisual({ name }) {
  const Visual = VISUALS[name];
  if (!Visual) return null;
  return (
    <svg className="hscroll-feature-svg" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <Visual />
    </svg>
  );
}

export function BulletIcon({ name }) {
  const Icon = BULLETS[name];
  if (!Icon) return null;
  return (
    <svg className="hscroll-bullet-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <Icon />
    </svg>
  );
}

function StudentsVisual() {
  return (
    <>
      <circle cx="40" cy="40" r="31" stroke="currentColor" strokeOpacity="0.16" />
      <circle cx="28" cy="40" r="7" {...stroke} />
      <path d="M16 60c1.2-10 6.8-15.5 12-15.5S38.8 50 40 60" {...stroke} />
      <circle cx="52" cy="37" r="7.5" {...stroke} />
      <path d="M40 60c1.4-11 8-17 12-17s10.6 6 12 17" {...stroke} />
      <path d="M40 18.5 54 12l14 6.5-14 6.5-14-6.5Z" {...stroke} fill="currentColor" fillOpacity="0.18" />
      <path d="M68 18.5v8.5" {...stroke} />
      <path d="M46 22.5v3.5" {...stroke} />
    </>
  );
}

function StaffVisual() {
  return (
    <>
      <circle cx="40" cy="40" r="31" stroke="currentColor" strokeOpacity="0.16" />
      <circle cx="26" cy="32" r="5.5" {...stroke} />
      <path d="M16 52c1-8 5.5-12.5 10-12.5S35 44 36 52" {...stroke} />
      <circle cx="54" cy="32" r="5.5" {...stroke} />
      <path d="M44 52c1-8 5.5-12.5 10-12.5S63 44 64 52" {...stroke} />
      <circle cx="40" cy="28" r="6.5" {...stroke} />
      <path d="M28 56c1.4-11 7.5-16.5 12-16.5S50.6 45 52 56" {...stroke} />
      <rect x="32" y="58" width="16" height="11" rx="1.5" {...stroke} fill="currentColor" fillOpacity="0.14" />
      <path d="M36 58v-2.5a4 4 0 0 1 8 0V58" {...stroke} />
    </>
  );
}

function TimetableVisual() {
  return (
    <>
      <circle cx="40" cy="40" r="31" stroke="currentColor" strokeOpacity="0.16" />
      <rect x="16" y="20" width="36" height="40" rx="4" {...stroke} fill="currentColor" fillOpacity="0.1" />
      <path d="M16 30h36" {...stroke} />
      <path d="M26 16v8M42 16v8" {...stroke} />
      <rect x="22" y="36" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.45" />
      <rect x="31.5" y="36" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.18" />
      <rect x="41" y="36" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.18" />
      <rect x="22" y="46" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.18" />
      <rect x="31.5" y="46" width="7" height="6" rx="1" fill="currentColor" fillOpacity="0.45" />
      <circle cx="58" cy="54" r="12" fill="#000" stroke="currentColor" strokeWidth="1.7" />
      <path d="M58 48v7l5 3" {...stroke} />
    </>
  );
}

function ReportsVisual() {
  return (
    <>
      <circle cx="40" cy="40" r="31" stroke="currentColor" strokeOpacity="0.16" />
      <path
        d="M24 16h22l12 12v36a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Z"
        {...stroke}
        fill="currentColor"
        fillOpacity="0.1"
      />
      <path d="M46 16v12h12" {...stroke} />
      <path d="M28 40h16M28 47h12M28 54h8" {...stroke} />
      <path d="M52 58v-8M58 58v-14M64 58v-5" {...stroke} />
      <circle cx="58" cy="28" r="10" fill="#000" stroke="currentColor" strokeWidth="1.7" />
      <path d="M53.5 28.5 56.5 31.5 63 24.5" {...stroke} />
    </>
  );
}

function NotificationsVisual() {
  return (
    <>
      <circle cx="40" cy="40" r="31" stroke="currentColor" strokeOpacity="0.16" />
      <path
        d="M28 34a12 12 0 0 1 24 0c0 10 3 13 3 13H25s3-3 3-13Z"
        {...stroke}
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path d="M36 54a4 4 0 0 0 8 0" {...stroke} />
      <circle cx="52" cy="24" r="6" fill="currentColor" />
      <path d="M62 28c3.5 4 5.5 9 5.5 14.5M66.5 22c5 5.5 8 12.5 8 20" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 28c-3.5 4-5.5 9-5.5 14.5M13.5 22c-5 5.5-8 12.5-8 20" stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
    </>
  );
}

const VISUALS = {
  students: StudentsVisual,
  staff: StaffVisual,
  timetable: TimetableVisual,
  reports: ReportsVisual,
  notifications: NotificationsVisual,
};

const b = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const BULLETS = {
  records: () => (
    <>
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" {...b} />
      <circle cx="5.5" cy="8" r="1.4" {...b} />
      <path d="M8.5 7h4M8.5 9.5h3" {...b} />
    </>
  ),
  attendance: () => (
    <>
      <rect x="2" y="3" width="12" height="11" rx="1.5" {...b} />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" {...b} />
      <path d="M5.5 10.5 7.2 12l3.3-3.3" {...b} />
    </>
  ),
  results: () => (
    <>
      <path d="M3 13V8M7 13V3M11 13V6M14 13H2" {...b} />
    </>
  ),
  promotion: () => (
    <>
      <path d="M3 12 7 5l3 4 3-7" {...b} />
      <path d="M11 2h5v5" {...b} />
    </>
  ),
  profiles: () => (
    <>
      <circle cx="8" cy="5.5" r="2.5" {...b} />
      <path d="M3 14c.6-3.2 2.8-4.8 5-4.8s4.4 1.6 5 4.8" {...b} />
    </>
  ),
  payroll: () => (
    <>
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" {...b} />
      <circle cx="8" cy="8" r="2" {...b} />
      <path d="M3.5 6h1M11.5 10h1" {...b} />
    </>
  ),
  classes: () => (
    <>
      <rect x="1.5" y="2.5" width="6" height="5" rx="1" {...b} />
      <rect x="8.5" y="2.5" width="6" height="5" rx="1" {...b} />
      <rect x="1.5" y="8.5" width="6" height="5" rx="1" {...b} />
      <rect x="8.5" y="8.5" width="6" height="5" rx="1" {...b} />
    </>
  ),
  subjects: () => (
    <>
      <path d="M2 3.5h5.5A2.5 2.5 0 0 1 10 6v8H4.5A2.5 2.5 0 0 1 2 11.5v-8Z" {...b} />
      <path d="M10 6h4a2 2 0 0 1 2 2v6.5a2 2 0 0 0-2-2H10" {...b} />
    </>
  ),
  auto: () => (
    <>
      <path d="M8 2.5 6.6 6.2H2.8l3.1 2.2L4.6 12.5 8 10.2l3.4 2.3-1.3-4.1 3.1-2.2H9.4L8 2.5Z" {...b} />
    </>
  ),
  schedule: () => (
    <>
      <circle cx="8" cy="8.5" r="5.5" {...b} />
      <path d="M8 6v3l2.2 1.4" {...b} />
    </>
  ),
  teacher: () => (
    <>
      <circle cx="6" cy="5.5" r="2.2" {...b} />
      <circle cx="11" cy="6.5" r="1.8" {...b} />
      <path d="M2 13.5c.5-2.8 2.4-4.2 4-4.2s3.5 1.4 4 4.2M9 13.2c.3-1.8 1.5-2.8 2.6-2.8 1.2 0 2.2 1 2.5 2.8" {...b} />
    </>
  ),
  term: () => (
    <>
      <path d="M4 2.5h6l3.5 3.5V13a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 13V4A1.5 1.5 0 0 1 4 2.5Z" {...b} />
      <path d="M10 2.5V6h3.5M5.5 9h5M5.5 11.5h3.5" {...b} />
    </>
  ),
  gpa: () => (
    <>
      <rect x="2" y="2.5" width="12" height="11" rx="2" {...b} />
      <path d="M5.5 6h5M5.5 8.5h5M5.5 11h3" {...b} />
    </>
  ),
  printable: () => (
    <>
      <path d="M4.5 11.5H3A1.5 1.5 0 0 1 1.5 10V7A1.5 1.5 0 0 1 3 5.5h10A1.5 1.5 0 0 1 14.5 7v3a1.5 1.5 0 0 1-1.5 1.5h-1.5" {...b} />
      <rect x="4.5" y="9.5" width="7" height="4.5" rx="0.8" {...b} />
      <path d="M4.5 5.5V2.5h7v3" {...b} />
    </>
  ),
  announcements: () => (
    <>
      <path d="M3 6.5 13 3.5v9L3 9.5v-3Z" {...b} />
      <path d="M7.5 11.2a2.4 2.4 0 1 1-4.6-1.3" {...b} />
    </>
  ),
  exam: () => (
    <>
      <path d="M8 2.5 9.6 6.4l4.2.4-3.2 2.8.9 4.1L8 11.7l-3.5 2 0.9-4.1-3.2-2.8 4.2-.4L8 2.5Z" {...b} />
    </>
  ),
  sms: () => (
    <>
      <rect x="1.5" y="3" width="13" height="9" rx="2" {...b} />
      <path d="M1.8 4.2 8 8.4l6.2-4.2" {...b} />
    </>
  ),
};
