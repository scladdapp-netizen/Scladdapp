import LegalPage from "./LegalPage";

const SECTIONS = [
  {
    id: "agreement",
    title: "1. Agreement to terms",
    body: [
      "These Terms of Service (“Terms”) govern your access to and use of Scladapp, including our websites, school portals, admin dashboards, APIs, and related services (together, the “Service”).",
      "By creating a school account, signing in, or using the Service, you agree to these Terms. If you are accepting on behalf of a school or organisation, you confirm that you have authority to bind that organisation.",
    ],
  },
  {
    id: "service",
    title: "2. The Service",
    body: "Scladapp is a school management platform that helps schools manage students, staff, classes, sessions, grades, fees, communication, websites, and related academic operations. Features available to you depend on your subscription plan and configuration.",
  },
  {
    id: "accounts",
    title: "3. Accounts and eligibility",
    body: [
      "You must provide accurate registration information and keep your login credentials secure. You are responsible for activity under your school’s accounts, including admin, staff, teacher, student, and guardian access you grant.",
      "Schools are responsible for obtaining any parental or guardian consent required by law before creating student accounts or collecting student data through the Service.",
    ],
  },
  {
    id: "subscriptions",
    title: "4. Subscriptions and payments",
    body: [
      "Paid plans are billed according to the cycle you select (for example monthly, quarterly, or yearly). Fees are charged through our payment partners and are generally non-refundable except where required by law or stated otherwise at purchase.",
      "If a subscription lapses, your data remains stored, but creating or editing records may be restricted until you renew. Free trial terms, if offered, are described at signup.",
    ],
  },
  {
    id: "school-data",
    title: "5. Your school data",
    body: [
      "You retain ownership of the content and data you upload or enter into the Service (“School Data”), including student records, staff information, grades, and documents.",
      "You grant Scladapp a limited licence to host, process, back up, and display School Data solely to provide and improve the Service. You are responsible for the accuracy and lawfulness of School Data you submit.",
    ],
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable use",
    body: "You agree not to misuse the Service. Prohibited conduct includes:",
    list: [
      "Attempting to access other schools’ data or bypass security controls",
      "Uploading malware, illegal content, or infringing material",
      "Harassing users or sending spam through messaging features",
      "Scraping, reverse engineering, or overloading the platform beyond normal use",
      "Using the Service in violation of applicable education, privacy, or consumer laws",
    ],
  },
  {
    id: "availability",
    title: "7. Availability and changes",
    body: "We aim to keep the Service reliable but do not guarantee uninterrupted access. We may update features, suspend access for maintenance or security, or change these Terms. Material changes will be reflected on this page with an updated date. Continued use after changes means you accept the revised Terms.",
  },
  {
    id: "disclaimer",
    title: "8. Disclaimers",
    body: "The Service is provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be error-free or that reports, grades, or calculations will meet every local regulatory requirement without your review.",
  },
  {
    id: "liability",
    title: "9. Limitation of liability",
    body: "To the fullest extent permitted by law, Scladapp and its operators will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, or business, arising from your use of the Service. Our total liability for any claim relating to the Service is limited to the fees you paid us for the Service in the twelve (12) months before the claim.",
  },
  {
    id: "termination",
    title: "10. Termination",
    body: "You may stop using the Service at any time. We may suspend or terminate access if you breach these Terms, fail to pay fees, or create risk to the platform or other users. Upon termination, your right to use the Service ends; we may retain School Data as required for legal, backup, or accounting purposes, subject to our Privacy Policy.",
  },
  {
    id: "governing-law",
    title: "11. Governing law",
    body: "These Terms are governed by the laws of Nigeria, without regard to conflict-of-law rules. Courts located in Nigeria shall have exclusive jurisdiction over disputes arising from these Terms or the Service, except where mandatory local law provides otherwise.",
  },
  {
    id: "contact",
    title: "12. Contact",
    body: "For questions about these Terms, email support@scladapp.com or use the Contact page on our website.",
  },
];

export default function Terms() {
  return (
    <LegalPage
      tag="Legal"
      title="Terms of Service"
      updated="8 September 2026"
      intro="Please read these Terms carefully before using Scladapp. They explain your rights and responsibilities when you operate a school account on our platform."
      sections={SECTIONS}
      otherLink={{ to: "/privacy", label: "Read our Privacy Policy →" }}
    />
  );
}
