import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ServerAwakeningLoader } from './components/common/ServerAwakeningLoader';
import { AuthModal } from './components/ui/AuthModal';
import { DriveConsentModal } from './components/ui/DriveConsentModal';
import { Toast } from './components/ui/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import {
  SkeletonBoard,
  SkeletonLearningsBoard,
  SkeletonProfilePage,
  SkeletonDsaPage,
} from './components/common/SkeletonLoader';

// Route-level Code Splitting (Phase 6.1)
const LandingPage = React.lazy(() => import('./components/landing/LandingPage'));
const ApplicationsPage = React.lazy(() => import('./components/applications/ApplicationsPage'));
const LearningsPage = React.lazy(() => import('./components/learnings/LearningsPage'));
const CareerProfile = React.lazy(() => import('./components/profile/CareerProfile'));
const DsaPracticePage = React.lazy(() => import('./components/dsa/DsaPracticePage'));
const StandaloneClipperPage = React.lazy(() => import('./components/clipper/StandaloneClipperPage'));
const PrivacyPage = React.lazy(() => import('./components/legal/PrivacyPage'));
const TermsPage = React.lazy(() => import('./components/legal/TermsPage'));
const PublicPortfolioPage = React.lazy(() => import('./components/portfolio/PublicPortfolioPage'));

export const RouteLoadingFallback: React.FC = () => (
  <div className="flex-1 w-full min-h-[50vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-8 h-8 rounded-full border-2 border-blue-600/30 border-t-blue-600 dark:border-indigo-500/30 dark:border-t-indigo-500 animate-spin" />
    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
      Loading view...
    </span>
  </div>
);

export const App: React.FC = () => {
  const { isAuthenticated, isDsaEnabled } = useApp();

  return (
    <>
      <ServerAwakeningLoader />
      <AuthModal />
      <DriveConsentModal />
      <Toast />
      <ErrorBoundary level="route">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Route 1: '/' -> Redirect to /job-applications if logged in, otherwise Landing Page */}
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/job-applications" replace /> : <LandingPage />}
            />

            {/* Application routes under standard app layout - ONLY accessible when logged in */}
            {isAuthenticated && (
              <Route element={<AppLayout />}>
                <Route
                  path="/job-applications"
                  element={
                    <Suspense fallback={<SkeletonBoard />}>
                      <ApplicationsPage />
                    </Suspense>
                  }
                />
                <Route path="/board" element={<Navigate to="/job-applications" replace />} />
                <Route path="/applications" element={<Navigate to="/job-applications" replace />} />
                <Route
                  path="/learnings"
                  element={
                    <Suspense fallback={<SkeletonLearningsBoard />}>
                      <LearningsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <Suspense fallback={<SkeletonProfilePage />}>
                      <CareerProfile />
                    </Suspense>
                  }
                />
                {isDsaEnabled && (
                  <Route
                    path="/dsa"
                    element={
                      <Suspense fallback={<SkeletonDsaPage />}>
                        <DsaPracticePage />
                      </Suspense>
                    }
                  />
                )}
              </Route>
            )}

            {/* Dedicated 1-Click Top-Right Clipper Window Route */}
            <Route path="/clipper" element={<StandaloneClipperPage />} />

            {/* Public Legal / OAuth Verification Pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Public Recruiter Proof-of-Work Portfolio Route */}
            <Route path="/u/:slug" element={<PublicPortfolioPage />} />

            {/* Fallback to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  );
};
