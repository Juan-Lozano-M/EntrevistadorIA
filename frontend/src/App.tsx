import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore, applyAccent } from "@/stores/settingsStore";
import { LandingPage } from "@/features/landing/LandingPage";
import { PlansPage } from "@/features/plans/PlansPage";
import { CheckoutPage } from "@/features/billing/CheckoutPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { ProtectedRoute, RequireAuth } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { InterviewsPage } from "@/features/interview/InterviewsPage";
import { ConfigWizardPage } from "@/features/interview/ConfigWizardPage";
import { InterviewPage } from "@/features/interview/InterviewPage";
import { ChatInterviewPage } from "@/features/interview/ChatInterviewPage";
import { VoiceInterviewPage } from "@/features/interview/VoiceInterviewPage";
import { ResultsPage } from "@/features/interview/ResultsPage";
import { ProgresoPage } from "@/features/progress/ProgresoPage";
import { ConfiguracionPage } from "@/features/account/ConfiguracionPage";
import { LogrosPage } from "@/features/gamification/LogrosPage";
import { RecursosPage } from "@/features/resources/RecursosPage";

function Home() {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/app" replace /> : <LandingPage />;
}

export default function App() {
  const accent = useSettingsStore((s) => s.accent);
  useEffect(() => { applyAccent(accent); }, [accent]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/precios" element={<PlansPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/new" element={<ConfigWizardPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/entrevistas" element={<InterviewsPage />} />
        <Route path="/app/progreso" element={<ProgresoPage />} />
        <Route path="/app/recursos" element={<RecursosPage />} />
        <Route path="/app/logros" element={<LogrosPage />} />
        <Route path="/app/configuracion" element={<ConfiguracionPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/chat/:id" element={<ChatInterviewPage />} />
        <Route path="/voice/:id" element={<VoiceInterviewPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/history" element={<Navigate to="/app/entrevistas" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
