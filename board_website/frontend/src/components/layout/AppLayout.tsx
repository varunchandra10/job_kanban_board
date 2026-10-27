import React from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { ApplicationsToolbar } from './ApplicationsToolbar';
import { LearningsToolbar } from './LearningsToolbar';
import { MobileUtilityBar } from './MobileUtilityBar';
import { ApplicationModal } from '../applications/ApplicationModal';
import { FollowUpModal } from '../applications/FollowUpModal';
import { LearningModal } from '../learnings/LearningModal';
import { AllItemsListModal } from '../common/AllItemsListModal';
import { ShutdownModal } from '../ui/ShutdownModal';
import { DriveModal } from '../ui/DriveModal';

export const AppLayout: React.FC = () => {
  const location = useLocation();

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
        <Outlet />
      </div>

      {/* Global Modals & Notifications */}
      <ApplicationModal />
      <FollowUpModal />
      <LearningModal />
      <AllItemsListModal />
      <ShutdownModal />
      <DriveModal />
    </div>
  );
};
