import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { LandingPage } from './components/landing/LandingPage';
import { AppLayout } from './components/layout/AppLayout';
import { ApplicationsPage } from './components/applications/ApplicationsPage';
import { LearningsPage } from './components/learnings/LearningsPage';
import { CareerProfile } from './components/profile/CareerProfile';
import { ServerAwakeningLoader } from './components/common/ServerAwakeningLoader';
import { AuthModal } from './components/ui/AuthModal';
import { Toast } from './components/ui/Toast';

export const App: React.FC = () => {
  const { isAuthenticated } = useApp();

  return (
    <>
      <ServerAwakeningLoader />
      <AuthModal />
      <Toast />
      <Routes>
        {/* Route 1: '/' -> Redirect to /job-applications if logged in, otherwise Landing Page */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/job-applications" replace /> : <LandingPage />}
        />

        {/* Application routes under standard app layout - ONLY accessible when logged in */}
        {isAuthenticated && (
          <Route element={<AppLayout />}>
            <Route path="/job-applications" element={<ApplicationsPage />} />
            <Route path="/board" element={<Navigate to="/job-applications" replace />} />
            <Route path="/applications" element={<Navigate to="/job-applications" replace />} />
            <Route path="/learnings" element={<LearningsPage />} />
            <Route path="/profile" element={<CareerProfile />} />
          </Route>
        )}

      {/* Fallback to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};
