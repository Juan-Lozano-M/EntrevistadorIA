import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ConfigWizardPage } from "@/features/interview/ConfigWizardPage";
import { InterviewPage } from "@/features/interview/InterviewPage";
import { ResultsPage } from "@/features/interview/ResultsPage";
import { HistoryPage } from "@/features/history/HistoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/new" element={<ConfigWizardPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/results/:id" element={<ResultsPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
