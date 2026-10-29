import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  BookOpen,
  User,
  Sun,
  Moon,
  Search,
  X,
  LogIn,
  LogOut,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    applications,
    learnings,
    isAuthenticated,
    openAuthModal,
    openDriveModal,
    logout,
    openQuickList,
  } = useApp();

  const isBoardActive = location.pathname === '/job-applications' || location.pathname === '/board' || location.pathname === '/applications';
  const isLearningsActive = location.pathname === '/learnings';
  const isProfileActive = location.pathname === '/profile';

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press / or Ctrl/Cmd + K to search, Escape to clear/blur, ArrowDown to open quick list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.getAttribute('contenteditable') === 'true';

      const isSlashShortcut =
        e.key === '/' && !isTyping && !e.altKey && !e.ctrlKey && !e.metaKey;

      const isSearchShortcut =
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';

      const isArrowDownShortcut =
        e.key === 'ArrowDown' && !isTyping && !e.altKey && !e.ctrlKey && !e.metaKey;

      if (isSlashShortcut || isSearchShortcut) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (isArrowDownShortcut && (isBoardActive || isLearningsActive)) {
        e.preventDefault();
        openQuickList();
      }

      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchQuery, isBoardActive, isLearningsActive, openQuickList]);

  const searchPlaceholder = isLearningsActive
    ? 'Search concepts, notes, topics...'
    : 'Search company, role, notes...';

  return (
    <header className="flex w-full flex-wrap items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#121214]/95 px-3 py-2 sm:px-6 sm:py-2.5 backdrop-blur-xl lg:flex-nowrap lg:gap-5 lg:px-8 transition-colors">
      {/* 1. Brand Logo & Link: Clicking 'Job Tracker' routes to /job-applications when logged in, or / when not logged in */}
      <Link
        to={isAuthenticated ? '/job-applications' : '/'}
        onClick={(e) => {
          e.preventDefault();
          navigate(isAuthenticated ? '/job-applications' : '/');
        }}
        className="group inline-flex shrink-0 items-center gap-2.5 rounded-xl no-underline text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 cursor-pointer"
        title={isAuthenticated ? 'Go to Job Applications' : 'Job Tracker Home'}
      >
        <span className="relative flex h-9 w-9 items-center justify-center">
          <img
            src="/logo.svg"
            alt="Job Tracker Logo"
            width={34}
            height={34}
            className="rounded-xl shadow-md shadow-indigo-500/20 transition-transform duration-200 group-hover:scale-105"
          />
        </span>

        <span className="flex flex-col">
          <span className="text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-base">
            Job Tracker
          </span>
          <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 sm:block">
            Career Workflow
          </span>
        </span>
      </Link>

      {/* 2. Main Navigation: Mode Tabs */}
      <nav
        className="order-3 flex w-full items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 p-1 lg:order-none lg:ml-2 lg:w-auto lg:shrink-0"
        aria-label="Main navigation"
      >
        <button
          type="button"
          onClick={() => navigate('/job-applications')}
          className={`group relative inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-4 cursor-pointer border ${
            isBoardActive
              ? 'bg-white dark:bg-[#1e1e24] text-blue-600 dark:text-blue-400 shadow-sm border-slate-200/80 dark:border-white/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-white/5 border-transparent'
          }`}
          title="Job applications board"
        >
          <Briefcase
            size={14}
            className={isBoardActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}
          />
          <span className="whitespace-nowrap">Job Applications</span>
          <span
            className={`inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              isBoardActive
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/learnings')}
          className={`group relative inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 sm:px-4 cursor-pointer border ${
            isLearningsActive
              ? 'bg-white dark:bg-[#1e1e24] text-orange-600 dark:text-orange-400 shadow-sm border-slate-200/80 dark:border-white/10 font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-white/5 border-transparent'
          }`}
          title="Daily learnings"
        >
          <BookOpen
            size={14}
            className={isLearningsActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}
          />
          <span className="whitespace-nowrap">Learnings</span>
          <span
            className={`inline-flex min-w-5 items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              isLearningsActive
                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'
            }`}
          >
            {learnings.length}
          </span>
        </button>
      </nav>

      {/* 3. Search Bar on Board/Learnings, or Flexible Spacer on Profile */}
      {!isProfileActive ? (
        <div
          className={`order-4 ${isLearningsActive ? 'hidden lg:flex' : 'flex'} h-9 min-w-0 w-full items-center gap-2 rounded-xl border px-3 transition-all duration-150 lg:order-none lg:ml-auto lg:w-auto lg:flex-1 lg:max-w-md ${
            searchQuery
              ? 'border-blue-500 dark:border-indigo-500 bg-white dark:bg-[#18181b] shadow-sm'
              : 'border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
          }`}
        >
          <Search
            size={15}
            className={`shrink-0 transition-colors ${
              searchQuery ? 'text-blue-600 dark:text-indigo-400' : 'text-slate-400'
            }`}
          />

          <input
            ref={searchInputRef}
            type="text"
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            aria-label="Search applications or learnings"
          />

          {searchQuery ? (
            <button
              type="button"
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
            >
              <X size={14} />
            </button>
          ) : (
            <kbd
              onClick={() => searchInputRef.current?.focus()}
              className="hidden shrink-0 items-center rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 sm:inline-flex cursor-pointer hover:border-slate-300"
              title="Press / to search"
            >
              /
            </kbd>
          )}
        </div>
      ) : (
        <span className="flex-1" />
      )}

      {/* 4. Right-side Actions & HUD */}
      <div
        className={`order-2 flex shrink-0 items-center gap-1.5 lg:order-none lg:gap-2 ${
          isProfileActive ? 'ml-auto' : 'ml-auto lg:ml-0'
        }`}
      >
        {/* Quick Sync Button */}
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => openDriveModal('sync')}
            className="inline-flex h-9 items-center gap-1.5 px-2.5 sm:px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer text-xs font-semibold"
            title="Mirror & Sync Documents (Local Storage <-> Google Drive)"
            aria-label="Mirror & Sync Documents"
          >
            <RotateCcw size={14} className="text-blue-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        )}

        {/* Profile Button */}
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal();
            } else {
              navigate('/profile');
            }
          }}
          className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
            isProfileActive
              ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-400'
              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title={isAuthenticated ? 'Career Hub & Profile' : 'Sign in to access Career Hub & Profile'}
          aria-label="User Profile"
        >
          <User size={16} strokeWidth={2} />
          {isAuthenticated && (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#121214]" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
        </button>

        <span className="mx-0.5 hidden h-5 w-px bg-slate-200 dark:bg-white/10 sm:block" />

        {/* Login / Logout Button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
            title="Log out of session"
            aria-label="Log Out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            title="Sign in to Job Tracker"
            aria-label="Log In"
          >
            <LogIn size={15} strokeWidth={2.5} />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};