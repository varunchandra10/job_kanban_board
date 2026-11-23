import React, { Suspense, lazy } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { ApplicationsToolbar } from './ApplicationsToolbar';
import { LearningsToolbar } from './LearningsToolbar';
import { MobileUtilityBar } from './MobileUtilityBar';
import { ShutdownModal } from '../ui/ShutdownModal';
import { DriveModal } from '../ui/DriveModal';
import { StorageSwitchModal } from '../ui/StorageSwitchModal';
import { DeleteApplicationModal } from '../common/DeleteApplicationModal';
import { PomodoroFocusTimer } from '../learnings/PomodoroFocusTimer';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useApp } from '../../context/AppContext';

// Code-split heavy modals to significantly shrink index entry bundle size
const ApplicationModal = lazy(() => import('../applications/ApplicationModal').then(m => ({ default: m.ApplicationModal })));
const FollowUpModal = lazy(() => import('../applications/FollowUpModal').then(m => ({ default: m.FollowUpModal })));
const LearningModal = lazy(() => import('../learnings/LearningModal').then(m => ({ default: m.LearningModal })));
const AllItemsListModal = lazy(() => import('../common/AllItemsListModal').then(m => ({ default: m.AllItemsListModal })));
const JobClipperModal = lazy(() => import('../common/JobClipperModal').then(m => ({ default: m.JobClipperModal })));

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const {
    isAddAppOpen,
    isFollowUpOpen,
    isAddLearningOpen,
    isQuickListOpen,
    isShutdownOpen,
    isDriveModalOpen,
    isStorageConfirmModalOpen,
    isClipperModalOpen,
    setIsClipperModalOpen,
    appToDelete,
    isDeleteAppModalOpen,
    isDeletingApp,
    confirmDeleteApplication,
    cancelDeleteApplication
  } = useApp();

  const isBoard = location.pathname === '/job-applications' || location.pathname === '/board' || location.pathname === '/applications';
  const isLearnings = location.pathname === '/learnings';
  const isBoardLike = isBoard || isLearnings;

  return (
    <div className={`min-h-screen relative flex flex-col bg-[#fafaf9] dark:bg-[#121214] text-slate-900 dark:text-slate-100 selection:bg-blue-500/20 ${
      isBoardLike ? 'md:h-screen md:overflow-hidden' : ''
    }`}>
      {/* Background Ambient Glow & Grid Pattern */}
      <div
        className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.08)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* Unified Sticky Navigation Bar & Second Bar (pinned together across all screen sizes) */}
      <div className="sticky top-0 z-40 w-full shrink-0 flex flex-col bg-white/95 dark:bg-[#121214]/95 backdrop-blur-xl shadow-xs">
        <AppHeader />
        {isBoard && <ApplicationsToolbar />}
        {isLearnings && <LearningsToolbar />}
      </div>

      {/* Main Content View */}
      <div className={`flex-1 px-2 sm:px-4 py-3 max-w-[1920px] w-full mx-auto relative z-10 flex flex-col ${
        isBoardLike ? 'min-h-0 md:overflow-hidden' : ''
      }`}>
        <ErrorBoundary level="route">
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* Global Modals & Notifications - Lazy loaded with Suspense */}
      <Suspense fallback={null}>
        {isAddAppOpen && <ApplicationModal />}
        {isFollowUpOpen && <FollowUpModal />}
        {isAddLearningOpen && <LearningModal />}
        {isQuickListOpen && <AllItemsListModal />}
        {isShutdownOpen && <ShutdownModal />}
        {isDriveModalOpen && <DriveModal />}
        {isStorageConfirmModalOpen && <StorageSwitchModal />}
        {isClipperModalOpen && (
          <JobClipperModal
            isOpen={isClipperModalOpen}
            onClose={() => setIsClipperModalOpen(false)}
          />
        )}
        {isDeleteAppModalOpen && (
          <DeleteApplicationModal
            isOpen={isDeleteAppModalOpen}
            application={appToDelete}
            onConfirm={confirmDeleteApplication}
            onCancel={cancelDeleteApplication}
            isDeleting={isDeletingApp}
          />
        )}
      </Suspense>

      {/* Floating Pomodoro Focus Sprint Widget */}
      <PomodoroFocusTimer />
    </div>
  );
};
