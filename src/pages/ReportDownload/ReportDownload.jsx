import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  exportReportHtml,
  resolveReportExportTemplate,
} from "../../utils/exportReportHtml";

const API = import.meta.env.VITE_API_BASE_URL;

/**
 * Public page opened from result-email "Download Report PDF" link.
 * Validates token, builds the same HTML report as in-app export, downloads PDF.
 */
export default function ReportDownload() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading | downloading | done | error
  const [message, setMessage] = useState("Preparing your report…");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        setStatus("error");
        setMessage("This download link is missing or incomplete.");
        return;
      }

      try {
        const res = await fetch(
          `${API}/api/student-report/download-payload/${encodeURIComponent(token)}`
        );
        const json = await res.json();
        if (!json?.success || !json.data) {
          throw new Error(json?.message || "Could not load report data.");
        }

        if (cancelled) return;

        const { student, template, school, report_card } = json.data;
        if (!template) throw new Error("Report template not found.");

        setStatus("downloading");
        setMessage("Generating PDF…");

        const resolved = await resolveReportExportTemplate(template, school);
        if (!resolved?.htmlTemplate) {
          throw new Error("Could not resolve report card HTML.");
        }

        const tableRows = (student?.subjects || []).map((row) => ({
          subject_name: row.name,
          name: row.name,
          scores: row.scores || {},
          position: row.position || "—",
        }));

        const grandTotal = (student?.subjects || []).reduce(
          (sum, row) => sum + (Number(row.total) || 0),
          0
        );

        await exportReportHtml({
          htmlTemplate: resolved.htmlTemplate,
          themeCss: resolved.themeCss,
          template,
          school,
          studentData: {
            studentName: student?.studentName || "Student",
            class: student?.class || "—",
            session: student?.session || "—",
            term: student?.term || "—",
            admissionId: student?.admissionId || "—",
            position: student?.position || "—",
            gender: student?.gender || "—",
            dob: student?.dob || "—",
            profileImg: student?.profileImg || null,
            teacherRemark:
              student?.teacherRemark || report_card?.teacher_remark || "",
            principalRemark:
              student?.principalRemark || report_card?.principal_remark || "",
            attendance: student?.attendance || null,
          },
          tableRows,
          traitScores: student?.traits || {},
          classAverage: null,
          classPos: 0,
          totalStudents: 0,
          grandTotal,
        });

        if (cancelled) return;
        setStatus("done");
        setMessage("Your report PDF has been downloaded. You can close this tab.");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setMessage(err?.message || "Download failed. Please try again later.");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "#f5f5f5",
        fontFamily: "Arial, Helvetica, sans-serif",
        color: "#111",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#888",
          }}
        >
          ScladApp
        </p>
        <h1
          style={{
            margin: "0 0 12px",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          {status === "error"
            ? "Download unavailable"
            : status === "done"
              ? "Download complete"
              : "Downloading report"}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#555", lineHeight: 1.55 }}>
          {message}
        </p>
        {status === "error" && (
          <p style={{ margin: "16px 0 0", fontSize: 12, color: "#999" }}>
            Ask your school to resend the result email if this keeps happening.
          </p>
        )}
      </div>
    </div>
  );
}
