// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext/AuthContext";
import NotFound from "../pages/NotFound/NotFound";
import ProductPricing from "../components/ProductPricing/ProductPricing";
import SchoolSetup from "../pages/SchoolSetup/SchoolSetup";
import LogIn from "../pages/LogIn/LogIn";
import ExamPage from "../pages/StudentSec/SchoolDashboard/pages/Exam/ExamPage";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import TeacherSec from "../pages/TeacherSec/TeacherSec";
import StudentSec from "../pages/StudentSec/StudentSec";
import Admin from "../pages/AdminSec/Admin_route/Admin_saidbar_route";
import FeedbackWidget from "../components/FeedbackWidget/FeedbackWidget";
import Docs from "../pages/Docs/Docs";
import ContactUs from "../pages/ContactUs/ContactUs";
import PricingPage from "../pages/PricingPage/PricingPage";
import Features from "../pages/Features/Features";
import Landing from "../pages/Landing/Landing";
import ReportDownload from "../pages/ReportDownload/ReportDownload";
import ApplicationForm from "../pages/ApplicationForm/ApplicationForm";
import Terms from "../pages/Legal/Terms";
import Privacy from "../pages/Legal/Privacy";

// The exam link teachers share. It is a public address that never redirects: a signed-in student
// sees the exam page, and anyone else sees the sign-in form right here and returns to /exam after.
const ExamEntry = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    sessionStorage.setItem("post_login_path", "/exam");
    return <LogIn />;
  }
  if (user?.student) return <ExamPage />;
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 22 }}>This page is for students</h1>
      <p>You are signed in as school staff. Sign out and sign in with a student account to take a test.</p>
    </div>
  );
};

export default function Nav() {
  const { isAuthenticated, user } = useAuth();

  console.log(user);

  // Helper function to get user's dashboard route
  const getUserDashboardRoute = () => {
    if (!user) return "/";

    const schoolId = user.school?.school_id;
    if (user.admin) {
      return `/admin/${schoolId}`;
    } else if (user.teacher || user.staff) {
      return `/teacher/${schoolId}`;
    } else if (user.student) {
      // After following the exam link and logging in, land on the exam page.
      if (sessionStorage.getItem("post_login_path") === "/exam") return "/exam";
      return `/student/${user.student.student_id}`;
    }

    return "/";
  };

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {isAuthenticated && <FeedbackWidget />}
      <Routes>
        <Route path="*" element={<NotFound />} />

        {/* Public route - always accessible */}
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Navigate to="/docs/quick-start" replace />} />
        <Route path="/docs/:topicId" element={<Docs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<Features />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/report-download" element={<ReportDownload />} />

        {/* Public routes - accessible when not authenticated */}
        <Route
          path="/setup/:step"
          element={
            isAuthenticated ? (
              <Navigate to={getUserDashboardRoute()} replace />
            ) : (
              <SchoolSetup />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={getUserDashboardRoute()} replace />
            ) : (
              <LogIn />
            )
          }
        />
        {/* School-specific login route — shows school branding in the left panel */}
        <Route
          path="/school/:schoolId/login"
          element={
            isAuthenticated ? (
              <Navigate to={getUserDashboardRoute()} replace />
            ) : (
              <LogIn />
            )
          }
        />
        <Route path="/school/:schoolId/apply" element={<ApplicationForm />} />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? (
              <Navigate to={getUserDashboardRoute()} replace />
            ) : (
              <ForgotPassword />
            )
          }
        />

        {/* Exam link teachers share with students: not listed anywhere in the student dashboard */}
        <Route path="/exam" element={<ExamEntry />} />

        {/* Protected routes - only accessible when authenticated */}
        <Route
          path="/admin/:schoolId/*"
          element={
            isAuthenticated ? <Admin /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/teacher/:schoolId/*"
          element={
            isAuthenticated ? <TeacherSec /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/student/:studentId/*"
          element={
            isAuthenticated ? <StudentSec /> : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </div>
  );
}
