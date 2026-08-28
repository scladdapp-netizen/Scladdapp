// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext/AuthContext";
import NotFound from "../pages/NotFound/NotFound";
import ProductPricing from "../components/ProductPricing/ProductPricing";
import SchoolSetup from "../pages/SchoolSetup/SchoolSetup";
import LogIn from "../pages/LogIn/LogIn";
import ForgotPassword from "../pages/ForgotPassword/ForgotPassword";
import TeacherSec from "../pages/TeacherSec/TeacherSec";
import StudentSec from "../pages/StudentSec/StudentSec";
import Admin from "../pages/AdminSec/Admin_route/Admin_saidbar_route";
import FeedbackWidget from "../components/FeedbackWidget/FeedbackWidget";
import Docs from "../pages/Docs/Docs";
import ContactUs from "../pages/ContactUs/ContactUs";
import PricingPage from "../pages/PricingPage/PricingPage";
import Landing from "../pages/Landing/Landing";
import ReportDownload from "../pages/ReportDownload/ReportDownload";

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
        <Route path="/docs" element={<Docs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/pricing" element={<PricingPage />} />
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
