import LegalPage from "./LegalPage";

const SECTIONS = [
  {
    id: "overview",
    title: "1. Overview",
    body: [
      "This Privacy Policy explains how Scladapp (“we”, “us”) collects, uses, stores, and shares personal information when you use our websites, school portals, and related services (the “Service”).",
      "Schools using Scladapp act as controllers of their student, staff, and guardian data. Scladapp processes that data on the school’s instructions to provide the Service.",
    ],
  },
  {
    id: "information-we-collect",
    title: "2. Information we collect",
    body: "Depending on how you use the Service, we may collect:",
    list: [
      "Account details — name, email, phone number, role (admin, staff, teacher, student, guardian), and school affiliation",
      "School records — class enrolment, attendance, grades, fees, applications, announcements, and documents you upload",
      "School profile data — school name, logo, address, branding, and website content you publish through Scladapp",
      "Payment information — billing details processed by our payment partners (we do not store full card numbers on our servers)",
      "Usage and device data — log files, IP address, browser type, and approximate location used for security and product improvement",
      "Support communications — messages you send to support@scladapp.com or through Contact forms",
    ],
  },
  {
    id: "how-we-use",
    title: "3. How we use information",
    body: "We use personal information to:",
    list: [
      "Provide, operate, and secure the Service for your school",
      "Authenticate users and manage roles and permissions",
      "Process subscriptions and send billing or account notices",
      "Generate reports, report cards, timetables, and other school outputs you request",
      "Respond to support requests and improve product reliability",
      "Detect abuse, prevent fraud, and enforce our Terms of Service",
      "Comply with legal obligations",
    ],
  },
  {
    id: "legal-bases",
    title: "4. Legal bases",
    body: "Where applicable privacy laws require a legal basis, we rely on performance of a contract with your school, legitimate interests in operating a secure SaaS platform, consent where you provide it (for example optional marketing), and legal obligations.",
  },
  {
    id: "sharing",
    title: "5. How we share information",
    body: [
      "We do not sell personal information. We share data only as needed to run the Service:",
    ],
    list: [
      "Within your school — with users your admins grant access to (teachers, staff, students, guardians)",
      "Service providers — hosting, email delivery, analytics, and payment processors under contractual safeguards",
      "Legal requirements — when required by law, court order, or to protect rights, safety, or security",
      "Business transfers — if we merge or sell assets, subject to continued protection of personal data",
    ],
  },
  {
    id: "student-data",
    title: "6. Student and children’s data",
    body: [
      "Scladapp is designed for schools. Student data is collected and managed by the school that creates the accounts.",
      "Schools must ensure they have appropriate authority and parental or guardian consent where required before entering children’s information. Parents or guardians should contact their school first for access, correction, or deletion requests related to student records.",
    ],
  },
  {
    id: "retention",
    title: "7. Retention",
    body: "We retain personal information for as long as your school account is active and as needed to provide the Service, resolve disputes, enforce agreements, and meet legal or accounting requirements. Schools may request export or deletion of School Data subject to applicable law and outstanding obligations.",
  },
  {
    id: "security",
    title: "8. Security",
    body: "We use administrative, technical, and organisational measures designed to protect personal information, including access controls and encrypted connections. No method of transmission or storage is completely secure; schools should also protect admin credentials and limit permissions appropriately.",
  },
  {
    id: "international",
    title: "9. International transfers",
    body: "Your information may be processed in countries where we or our providers operate. Where required, we use appropriate safeguards for cross-border transfers.",
  },
  {
    id: "your-rights",
    title: "10. Your rights",
    body: "Depending on your location and role, you may have rights to access, correct, delete, or export personal information, or to object to certain processing. Students and parents should usually submit requests to their school. School admins and individual account holders may contact us at support@scladapp.com. We may need to verify your identity before responding.",
  },
  {
    id: "cookies",
    title: "11. Cookies and similar technologies",
    body: "We use essential cookies and similar technologies to keep you signed in, remember preferences, and secure the Service. We may also use limited analytics cookies to understand product usage. You can control cookies through your browser settings; disabling essential cookies may affect login and core features.",
  },
  {
    id: "changes",
    title: "12. Changes to this policy",
    body: "We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will change when we do. Continued use of the Service after an update means you acknowledge the revised policy.",
  },
  {
    id: "contact",
    title: "13. Contact",
    body: "For privacy questions or requests, email support@scladapp.com or use our Contact page. If you are a student or parent, start with your school’s administrator for the fastest help with school-held records.",
  },
];

export default function Privacy() {
  return (
    <LegalPage
      tag="Legal"
      title="Privacy Policy"
      updated="8 September 2026"
      intro="This policy describes how Scladapp handles personal information for schools, staff, students, and visitors. It applies to scladapp.com and related school portals we host."
      sections={SECTIONS}
      otherLink={{ to: "/terms", label: "Read our Terms of Service →" }}
    />
  );
}
