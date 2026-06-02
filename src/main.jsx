import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { NotificationProvider } from "./context/NotificationProvider/NotificationProvider.jsx";
import { AlertProvider } from "./context/AlertProvider/AlertProvider.jsx";
import { OTPProvider } from "./components/otp/OTPContext.jsx";
import { OTPModal } from "./components/otp/OTPModal.jsx";
import { AuthProvider } from "./context/AuthContext/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext/ThemeContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AlertProvider>
              <OTPProvider>
                <App />
                <OTPModal />
              </OTPProvider>
            </AlertProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
