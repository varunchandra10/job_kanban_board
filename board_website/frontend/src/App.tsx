import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './components/landing/LandingPage';
import { AppLayout } from './components/layout/AppLayout';
import { ApplicationsPage } from './components/applications/ApplicationsPage';
import { LearningsPage } from './components/learnings/LearningsPage';
import { CareerProfile } from './components/profile/CareerProfile';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Route 1: '/' -> Landing Page (matching & enhancing index.html) */}
      <Route path="/" element={<LandingPage />} />

      {/* Application routes under standard app layout */}
      <Route element={<AppLayout />}>
        <Route path="/job-applications" element={<ApplicationsPage />} />
        <Route path="/board" element={<Navigate to="/job-applications" replace />} />
        <Route path="/applications" element={<Navigate to="/job-applications" replace />} />
        <Route path="/learnings" element={<LearningsPage />} />
        <Route path="/profile" element={<CareerProfile />} />
      </Route>

      {/* Fallback to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
