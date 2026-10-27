import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getApiEndpoint } from '../../services/api';
import {
  ArrowRight,
  CheckCircle2,
  Sun,
  Moon,
  ChevronUp,
  LayoutGrid,
  ShieldCheck,
  Flame,
  Calendar,
  Lock,
  Database,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isAuthenticated, openAuthModal, logout } = useApp();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f8fafc] font-sans antialiased relative selection:bg-blue-500/20 flex flex-col">
      {/* Ambient background glow & pattern */}
      <div
        className="absolute top-0 left-0 right-0 h-[900px] pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_12%,rgba(99,102,241,0.12)_0%,rgba(59,130,246,0.05)_35%,transparent_65%)] dark:bg-[radial-gradient(circle_at_50%_12%,rgba(99,102,241,0.22)_0%,rgba(14,165,233,0.08)_40%,transparent_70%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-0 right-0 h-[750px] pointer-events-none z-0 [background-image:radial-gradient(rgba(148,163,184,0.18)_1px,transparent_1px)] dark:[background-image:radial-gradient(rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)] [-webkit-mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)]"
        aria-hidden="true"
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#090d16]/85 border-b border-slate-200 dark:border-white/10 px-6 sm:px-10 py-3.5 flex items-center justify-between transition-colors">
        <Link
          to={isAuthenticated ? '/job-applications' : '/'}
          onClick={(e) => {
            e.preventDefault();
            navigate(isAuthenticated ? '/job-applications' : '/');
          }}
          className="flex items-center gap-3 text-slate-900 dark:text-slate-50 font-extrabold text-xl tracking-tight no-underline cursor-pointer"
          title={isAuthenticated ? 'Go to Job Applications' : 'Job Tracker'}
        >
          <img
            src="/logo.svg"
            alt="Job Tracker Logo"
            className="w-[34px] h-[34px] rounded-[10px] shadow-[0_3px_10px_rgba(99,102,241,0.35)]"
          />
          <span>Job Tracker</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[15px] font-semibold text-slate-500 dark:text-slate-400" aria-label="Main Navigation">
          <a href="#features" className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors no-underline">
            Features
          </a>
          <a href="#benefits" className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors no-underline">
            How It Helps
          </a>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else navigate('/job-applications');
            }}
            className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit font-semibold text-[15px] text-slate-500 dark:text-slate-400"
            title="Go to Job Applications Board"
          >
            Job Board
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else navigate('/learnings');
            }}
            className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit font-semibold text-[15px] text-slate-500 dark:text-slate-400"
          >
            Daily Learnings
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal();
              } else {
                navigate('/profile');
              }
            }}
            className="hover:text-blue-600 dark:hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit font-semibold text-[15px] text-slate-500 dark:text-slate-400"
          >
            Career Hub
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* Dark/Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            title="Toggle Theme"
            className="p-2 rounded-[9px] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Login / Logout button */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-[9px] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-all cursor-pointer"
              title="Log out of session"
            >
              Logout
            </button>
          ) : (
            <button
              type="button"
              onClick={openAuthModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-[9px] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
              title="Sign In"
            >
              Sign In
            </button>
          )}

          {/* Launch CTA Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) openAuthModal();
              else navigate('/job-applications');
            }}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm px-4 py-2 rounded-[9px] shadow-[0_4px_14px_rgba(37,99,235,0.35)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)] transition-all cursor-pointer border-0"
            title={isAuthenticated ? 'Open Job Board' : 'Get Started'}
          >
            <span>{isAuthenticated ? 'Open Job Board' : 'Get Started'}</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-[1120px] w-full mx-auto px-6 flex-1">
        {/* Hero Section */}
        <section className="pt-20 sm:pt-24 pb-16 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-7">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
            <span>Personal Career Workflow Hub</span>
          </div>

          <h1 className="font-['Outfit',sans-serif] text-4xl sm:text-5xl lg:text-[4.2rem] font-black tracking-tight leading-[1.12] max-w-[900px] text-slate-900 dark:text-white mb-5">
            Your Job Search, <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-sky-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Organized Like Never Before.
            </span>
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-[720px] leading-relaxed mb-10">
            A private, streamlined dashboard to track applications across visual stages, 
            save tailored resumes directly to your own Google Drive, and turn daily interview learnings into an unstoppable career streak.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-9">
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) openAuthModal();
                else navigate('/job-applications');
              }}
              className="inline-flex items-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_10px_25px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_14px_35px_-4px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 transition-all cursor-pointer border-0"
              title={isAuthenticated ? 'Open Job Board' : 'Get Started'}
            >
              <span>{isAuthenticated ? 'Open Job Board' : 'Get Started'}</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  openAuthModal();
                } else {
                  navigate('/profile');
                }
              }}
              className="inline-flex items-center gap-2 bg-white/90 dark:bg-slate-900/80 hover:border-slate-400 dark:hover:border-slate-500 text-slate-900 dark:text-slate-100 font-semibold text-base px-7 py-3.5 rounded-xl border border-slate-200 dark:border-white/10 hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              <span>Career Hub &amp; Heatmap</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-8 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
            <div className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5} />
              <span>100% User-Owned Google Drive</span>
            </div>
            <div className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5} />
              <span>Strict Multi-Tenant Isolation</span>
            </div>
            <div className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={2.5} />
              <span>1-Click CSV &amp; SQLite Backup</span>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section id="features" className="pt-4 pb-12">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Core Capabilities
            </div>
            <h2 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              Features Built In This Project
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed m-0">
              Everything you need to run an organized, structured job search without spreadsheet clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-24">
            {/* Feature 1: Kanban */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <LayoutGrid size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  4-STAGE PIPELINE
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                Visual Kanban Board
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                Organize applications across 4 visual stages: <strong>Applied</strong>, <strong>Interviewing</strong>, <strong>Offer</strong>, and <strong>Rejected</strong>. Drag and drop cards, filter by track (Industry, Government, Research), and search instantly with <code className="text-xs bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">/</code>.
              </p>
            </div>

            {/* Feature 2: Google Drive */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  PRIVATE CLOUD
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                Personal Google Drive Storage
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                Uploaded resumes and cover letters stream directly into <strong>your personal Google Drive folder</strong> via official Google Drive API integration. Your files are never stored on shared admin servers.
              </p>
            </div>

            {/* Feature 3: Learnings & Streak */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Flame size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  HABIT TRACKING
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                Daily Learnings Diary &amp; Streak
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                Log technical takeaways, interview questions, and prep notes daily. Maintain a glowing activity streak counter to stay disciplined and prepared for every round.
              </p>
            </div>

            {/* Feature 4: Career Hub Heatmap */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Calendar size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  VISUAL MATRIX
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                Career Hub &amp; Heatmap
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                View your monthly activity matrix heatmap showing applications submitted and daily learnings logged, along with tailored resume version tracking.
              </p>
            </div>

            {/* Feature 5: Multi-Tenant OAuth */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Lock size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  STRICT ISOLATION
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                Google OAuth &amp; Privacy
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                Sign in securely using Google OAuth or custom email. Multi-tenant database queries strictly isolate data by user ID so you never see another user&apos;s records.
              </p>
            </div>

            {/* Feature 6: Backup & Export */}
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-[18px] p-8 backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.4)] hover:border-blue-400 dark:hover:border-indigo-500/50 hover:-translate-y-1 transition-all flex flex-col gap-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Database size={24} strokeWidth={2} />
                </div>
                <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400">
                  OFFLINE FREEDOM
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0">
                1-Click CSV &amp; SQLite Backup
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed m-0">
                Export all application records to clean CSV or download the complete SQLite database as a ZIP file anytime for offline archiving and total data ownership.
              </p>
            </div>
          </div>
        </section>

        {/* How It Helps Section */}
        <section id="benefits" className="pb-12">
          <div className="text-center max-w-[680px] mx-auto mb-14">
            <div className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">
              Practical Value
            </div>
            <h2 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
              How It Helps You Land Offers
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed m-0">
              Why visual Kanban and daily habit tracking outperform traditional spreadsheets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-2xl p-7 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="font-['Outfit',sans-serif] text-3xl font-black text-blue-600 dark:text-indigo-400 opacity-85 mb-3">
                01
              </div>
              <h4 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Clear Stage Visibility
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0">
                Instantly see where each job stands without maintaining messy, outdated rows in a spreadsheet.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-2xl p-7 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="font-['Outfit',sans-serif] text-3xl font-black text-blue-600 dark:text-indigo-400 opacity-85 mb-3">
                02
              </div>
              <h4 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Always Send the Right Resume
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0">
                Open the exact resume version you submitted directly from your personal Google Drive with a single click.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-2xl p-7 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="font-['Outfit',sans-serif] text-3xl font-black text-blue-600 dark:text-indigo-400 opacity-85 mb-3">
                03
              </div>
              <h4 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                Improve After Every Interview
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0">
                Document questions and mistakes in your daily diary right after each round so you prepare smarter for the next.
              </p>
            </div>

            <div className="bg-white/90 dark:bg-slate-900/75 border border-slate-200 dark:border-white/10 rounded-2xl p-7 hover:-translate-y-1 hover:border-blue-400 dark:hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="font-['Outfit',sans-serif] text-3xl font-black text-blue-600 dark:text-indigo-400 opacity-85 mb-3">
                04
              </div>
              <h4 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
                You Own Your Storage
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed m-0">
                Files stay in your Google Drive and database records can be exported to CSV or SQLite whenever you want.
              </p>
            </div>
          </div>
        </section>

        {/* Ready Banner */}
        <section className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white rounded-3xl p-10 sm:p-16 text-center mb-24 shadow-[0_20px_40px_-10px_rgba(49,46,129,0.4)]">
          <h2 className="font-['Outfit',sans-serif] text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight">
            Ready to Organize Your Job Search?
          </h2>
          <p className="text-lg text-indigo-200 max-w-[620px] mx-auto mb-9 leading-relaxed">
            Launch your Kanban board and start managing your applications with visual momentum.
          </p>
          <Link
            to="/job-applications"
            className="inline-flex items-center gap-2.5 bg-white text-[#1e1b4b] hover:bg-slate-100 font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.25)] hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all no-underline cursor-pointer"
            title="Go to Job Applications Board"
          >
            <span>{isAuthenticated ? 'Launch Job Board' : 'Get Started'}</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </Link>
        </section>
      </main>

      {/* Proper Multi-Column Footer */}
      <footer className="bg-[#0f172a] dark:bg-[#05070d] text-slate-400 border-t border-white/10 pt-16 pb-10 px-6 sm:px-10 text-sm">
        <div className="max-w-[1120px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 lg:gap-14 mb-14">
            {/* Col 1: Brand */}
            <div className="flex flex-col gap-4">
              <Link
                to={isAuthenticated ? '/job-applications' : '/'}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(isAuthenticated ? '/job-applications' : '/');
                }}
                className="inline-flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight no-underline cursor-pointer"
                title={isAuthenticated ? 'Go to Job Applications' : 'Job Tracker'}
              >
                <img src="/logo.svg" alt="Job Tracker Logo" className="w-[30px] h-[30px] rounded-lg" />
                <span>Job Tracker</span>
              </Link>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[340px] m-0">
                A private, visual career workflow platform built to help professionals organize applications, track interview learnings, and land dream offers with momentum.
              </p>
            </div>

            {/* Col 2: Navigation */}
            <div className="flex flex-col gap-3.5">
              <h4 className="text-white text-xs font-extrabold uppercase tracking-widest m-0">
                Navigation
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) openAuthModal();
                      else navigate('/job-applications');
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit text-sm text-left"
                  >
                    Job Board
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) openAuthModal();
                      else navigate('/learnings');
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit text-sm text-left"
                  >
                    Daily Learnings Diary
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) openAuthModal();
                      else navigate('/profile');
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit text-sm text-left"
                  >
                    Career Hub &amp; Heatmap
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) openAuthModal();
                      else navigate('/profile');
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer font-inherit text-sm text-left"
                  >
                    Google Drive Storage
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Features Built */}
            <div className="flex flex-col gap-3.5">
              <h4 className="text-white text-xs font-extrabold uppercase tracking-widest m-0">
                Features
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li>
                  <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    4-Stage Kanban Pipeline
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Personal Google Drive Sync
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Daily Learning Streak
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Category Track Filters
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Privacy & Backups */}
            <div className="flex flex-col gap-3.5">
              <h4 className="text-white text-xs font-extrabold uppercase tracking-widest m-0">
                Privacy &amp; Data
              </h4>
              <ul className="list-none p-0 m-0 flex flex-col gap-2.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal();
                      } else {
                        navigate('/profile');
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-inherit text-sm"
                  >
                    Personal Google Drive
                  </button>
                </li>
                <li>
                  <Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Strict Multi-Tenant Isolation
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal();
                      } else {
                        window.location.href = getApiEndpoint('/api/backup/csv');
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-inherit text-sm"
                  >
                    Download as CSV
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal();
                      } else {
                        window.location.href = getApiEndpoint('/api/backup/export');
                      }
                    }}
                    className="text-slate-400 hover:text-indigo-400 transition-colors bg-transparent border-0 p-0 cursor-pointer text-left font-inherit text-sm"
                  >
                    Download DB as ZIP
                  </button>
                </li>
                <li>
                  <Link to="/privacy" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-slate-400 hover:text-indigo-400 transition-colors no-underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex items-center justify-between flex-wrap gap-4 text-xs sm:text-sm">
            <div>
              &copy; 2026 Job Tracker &bull; 100% User-Owned Google Drive Storage &bull; All data isolated.
            </div>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors no-underline">
                Privacy
              </Link>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors no-underline">
                Terms
              </Link>
              <a
                href="https://github.com/varunchandra10/job_kanban_board"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors no-underline"
              >
                GitHub
              </a>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
              >
                <span>Back to top</span>
                <ChevronUp size={14} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
