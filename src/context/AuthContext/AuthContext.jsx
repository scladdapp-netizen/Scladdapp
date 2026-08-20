import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize user from sessionStorage
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Initialize isAuthenticated from sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = sessionStorage.getItem("isAuthenticated");
    return savedAuth === "true";
  });

  const [loading, setLoading] = useState(false);

  // Update sessionStorage whenever user changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);
    } else {
      sessionStorage.removeItem("user");
      sessionStorage.setItem("isAuthenticated", "false");
      setIsAuthenticated(false);
    }
  }, [user]);

  const login = async (credentials, navigate) => {
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Check if user has multiple roles (staff with admin role)
        if (data.data.has_multiple_roles) {
          // Return data for role selection modal
          return {
            success: true,
            requiresRoleSelection: true,
            userData: data.data,
            message: "Please select your role",
          };
        }

        // Check if 2FA is enabled
        const userInfo =
          data.data.admin || data.data.teacher || data.data.staff;

        if (userInfo && userInfo.two_fac_auth) {
          // Send OTP via backend (email) — do NOT expose the OTP to the frontend
          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otp/send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email:    credentials.email,
                schoolId: data.data.school?.school_id || null,
              }),
            });
          } catch {
            // Non-fatal — still show the OTP modal; user can retry
          }

          return {
            success:     true,
            requiresOTP: true,
            email:       credentials.email,
            userData:    data.data,
            message:     "OTP sent to your email",
          };
        } else {
          // No 2FA required, login directly
          setUser(data.data);

          // Navigate to appropriate dashboard
          const schoolId = data.data.school.school_id;
          if (data.data.admin) {
            navigate(`/admin/${schoolId}`);
          } else if (data.data.teacher || data.data.staff) {
            navigate(`/teacher/${schoolId}`);
          } else if (data.data.student) {
            navigate(`/student/${data.data.student.student_id}`);
          }

          return { success: true, data: data.data };
        }
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      return { success: false, error: error.message || "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
    sessionStorage.setItem("isAuthenticated", "false");
    setIsAuthenticated(false);
  };

  const school_setup = async (
    adminData,
    schoolData,
    totalMonths,
    selectedPlan,
    billingCycle,
    total_amount,
    duration,
    agreeTerms,
    navigate // Add navigate parameter
  ) => {
    setLoading(true);
    try {
      // Use FormData to support file upload (school logo)
      const formData = new FormData();
      formData.append("adminData", JSON.stringify(adminData));

      // Extract logo file before stringifying schoolData
      const { school_logo, ...schoolDataWithoutLogo } = schoolData;
      formData.append("schoolData", JSON.stringify(schoolDataWithoutLogo));

      if (school_logo instanceof File) {
        formData.append("school_logo", school_logo);
      }

      formData.append("totalMonths", totalMonths);
      formData.append("selectedPlan", JSON.stringify(selectedPlan));
      formData.append("billingCycle", billingCycle);
      formData.append("total_amount", total_amount);
      formData.append("duration", duration);
      formData.append("agreeTerms", agreeTerms);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/setup/complete`, {
        method: "POST",
        // No Content-Type header — browser sets it automatically with boundary for FormData
        body: formData,
      });

      const data = await response.json();

      console.log(data);

      if (response.ok) {
        setUser(data.data);

        // Navigate to admin dashboard using school_id
        const schoolId = data.data.school.school_id;
        navigate(`/admin/${schoolId}`);

        return { success: true, data };
      } else {
        return { success: false, error: data.message || "Setup failed" };
      }
    } catch (error) {
      return { success: false, error: error.message || "Network error" };
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (userData, navigate, selectedRole = null) => {
    // If role is selected, prepare userData with only that role
    let finalUserData = userData;

    if (selectedRole && userData.has_multiple_roles) {
      // Create userData with only the selected role
      finalUserData = {
        ...userData,
        current_role: selectedRole,
      };

      // Remove the role that wasn't selected from the response
      if (selectedRole === "admin") {
        // Keep admin, remove staff from main level (but keep in userData for switching)
        const { staff, ...rest } = finalUserData;
        finalUserData = {
          ...rest,
          available_roles: { staff, admin: userData.admin },
        };
      } else {
        // Keep staff, remove admin from main level (but keep in userData for switching)
        const { admin, ...rest } = finalUserData;
        finalUserData = {
          ...rest,
          available_roles: { staff: userData.staff, admin },
        };
      }
    }

    setUser(finalUserData);

    // Navigate to appropriate dashboard based on selected role or default role
    const schoolId = finalUserData.school.school_id;
    const roleToUse = selectedRole || (finalUserData.admin ? "admin" : "staff");

    if (roleToUse === "admin") {
      navigate(`/admin/${schoolId}`);
    } else if (roleToUse === "staff" || finalUserData.teacher) {
      navigate(`/teacher/${schoolId}`);
    }
  };

  const updateSubscription = (newSubscription) => {
    setUser((prev) => {
      const updated = { ...prev, subscription: newSubscription };
      sessionStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    completeLogin,
    logout,
    school_setup,
    updateSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
