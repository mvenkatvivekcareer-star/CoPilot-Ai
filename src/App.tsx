import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ResumeIntelligencePage } from './pages/resume/ResumeIntelligencePage';
import { JobMatchingPage } from './pages/job-matching/JobMatchingPage';
import { SkillGapCoachPage } from './pages/skill-gaps/SkillGapCoachPage';
import { InterviewStudioPage } from './pages/interviews/InterviewStudioPage';
import { InterviewHistoryPage } from './pages/interviews/InterviewHistoryPage';
import { SupabaseViewerPage } from './pages/supabase/SupabaseViewerPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { CareerDigitalTwinPage } from './pages/career-twin/CareerDigitalTwinPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Onboarding Flow */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected App Routes */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="resume" element={<ResumeIntelligencePage />} />
            <Route path="job-matching" element={<JobMatchingPage />} />
            <Route path="skill-gaps" element={<SkillGapCoachPage />} />
            <Route path="career-twin" element={<CareerDigitalTwinPage />} />
            <Route path="interviews" element={<InterviewStudioPage />} />
            <Route path="interviews/history" element={<InterviewHistoryPage />} />
            <Route path="supabase" element={<SupabaseViewerPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
