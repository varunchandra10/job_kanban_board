import React, { useState, useEffect } from 'react';
import { Server, RefreshCw, Sparkles, CheckCircle2, Clock, ArrowRight, Cloud } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getApiEndpoint, isTauri } from '../../services/api';

export const ServerAwakeningLoader: React.FC = () => {
  // Never show cloud server awakening modal in the native desktop app (runs on offline local SQLite)
  if (isTauri) return null;

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
      <div className="relative w-full max-w-[480px] rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#121216]/95 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Glow ambient background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-28 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none" />

        {/* Center Logo & Spinner */}
        <div className="relative w-18 h-18 mx-auto mb-4 flex items-center justify-center">
          {/* Animated Spinner Ring */}
          {!isReady && (
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
          )}

          {/* Logo container */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-center transition-transform">
            {isReady ? (
              <CheckCircle2 size={28} className="animate-in zoom-in text-emerald-300" />
            ) : (
              <div className="flex items-center justify-center">
                <Cloud size={28} className="text-white drop-shadow-md animate-pulse" />
              </div>
            )}
          </div>
        </div>

        {/* Top Serverless Status Tag */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span>Vercel Serverless Cloud</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-['Outfit',sans-serif] text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
          {isReady ? 'Server Connected & Ready!' : 'Starting Job Tracker Server...'}
        </h3>

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 mt-2.5 mb-4 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
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
          <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-6 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 shadow-xs"
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Board Now</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>

        <div className="mt-5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          100% User-Owned Google Drive &bull; Private Kanban Pipeline
        </div>
      </div>
    </div>
  );
};
