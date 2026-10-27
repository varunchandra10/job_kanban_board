import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, Sparkles, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getApiEndpoint } from '../../services/api';

export const ServerAwakeningLoader: React.FC = () => {
  const { showToast } = useApp();

  // Has the server responded in this browser session?
  const [isWarmed, setIsWarmed] = useState<boolean>(() => {
    return sessionStorage.getItem('job_tracker_server_warmed') === 'true';
  });

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [hasTimeoutError, setHasTimeoutError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    if (isWarmed) return;

    let isMounted = true;
    let timerInterval: ReturnType<typeof setInterval>;
    let showDelayTimer: ReturnType<typeof setTimeout>;

    // Only show loader if server takes more than 700ms to respond (prevent flashing on fast/local servers)
    showDelayTimer = setTimeout(() => {
      if (isMounted && !isReady) {
        setIsVisible(true);
      }
    }, 700);

    const startTime = Date.now();
    timerInterval = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(sec);
      if (sec >= 14) {
        setHasTimeoutError(true);
      }
    }, 500);

    // Ping health check endpoint
    const checkServerHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(getApiEndpoint('/api/health'), {
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          if (!isMounted) return;
          setIsReady(true);
          sessionStorage.setItem('job_tracker_server_warmed', 'true');

          // Smooth dissolve
          setTimeout(() => {
            if (isMounted) {
              setIsVisible(false);
              setIsWarmed(true);
            }
          }, 600);
        } else {
          throw new Error(`Server returned ${res.status}`);
        }
      } catch (err: any) {
        // Retry once after 2 seconds if not mounted/ready
        if (isMounted && !isReady && retryCount < 2) {
          setTimeout(() => {
            if (isMounted && !isReady) {
              setRetryCount(prev => prev + 1);
            }
          }, 2000);
        }
      }
    };

    checkServerHealth();

    return () => {
      isMounted = false;
      clearTimeout(showDelayTimer);
      clearInterval(timerInterval);
    };
  }, [isWarmed, isReady, retryCount]);

  if (isWarmed || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    setIsWarmed(true);
    showToast('Continuing in Guest/Offline mode. Server is continuing to wake up in background.');
  };

  const handleRetry = () => {
    setHasTimeoutError(false);
    setElapsedSeconds(0);
    setRetryCount(prev => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 dark:bg-[#090d16]/85 backdrop-blur-md transition-opacity duration-300"
      aria-live="polite"
      role="status"
    >
      <div className="relative w-full max-w-[460px] rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#121216]/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow ambient background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-500/15 dark:bg-indigo-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Center Logo & Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
          {/* Animated Spinner Ring */}
          {!isReady && (
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-500/20 border-t-blue-600 dark:border-t-indigo-400 animate-spin" />
          )}

          {/* Logo container */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform">
            {isReady ? (
              <CheckCircle2 size={24} className="animate-in zoom-in" />
            ) : (
              <img
                src="/logo.svg"
                alt="Job Tracker Logo"
                className="w-7 h-7 rounded-md"
              />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
          {isReady ? 'Server is Ready!' : 'Starting Job Tracker Server...'}
        </h3>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 mt-2.5 mb-4 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold">
          {isReady ? (
            <>
              <Sparkles size={13} className="text-emerald-500" />
              <span>Connected successfully</span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span>Waking up cloud server instance ({elapsedSeconds}s)</span>
            </>
          )}
        </div>

        {/* Explanatory Note with Apology */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5 m-0">
          Sorry for the inconvenience! When accessing after inactivity, the serverless cloud instance requires a few seconds to spin up and load the database.
        </p>

        {/* Progress Bar Animation */}
        {!isReady && (
          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(95, elapsedSeconds * 8 + 15)}%` }}
            />
          </div>
        )}

        {/* Actions / Fallback when delay is extended */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          {hasTimeoutError && (
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Retry Ping</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <span>Explore Board Now</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
          100% User-Owned Google Drive &bull; Private Kanban Pipeline
        </div>
      </div>
    </div>
  );
};
