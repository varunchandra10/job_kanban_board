import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { pomodoroEngine, PomodoroState } from '../../utils/pomodoroEngine';
import { soundEffects } from '../../utils/soundEffects';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  ChevronUp,
  ChevronDown,
  X,
  Clock,
  BookOpen,
  Volume2,
  VolumeX,
  Plus,
} from 'lucide-react';

export const PomodoroFocusTimer: React.FC = () => {
  const {
    addLearning,
    learningTracks,
    showToast,
    gamification,
    isAddAppOpen,
    isAddLearningOpen,
    isFollowUpOpen,
    isClipperModalOpen,
    isDeleteAppModalOpen,
    isQuickListOpen,
    isShutdownOpen,
    isDriveModalOpen,
    isStorageConfirmModalOpen,
    isAuthModalOpen,
  } = useApp();

  const isModalOpen = Boolean(
    isAddAppOpen ||
    isAddLearningOpen ||
    isFollowUpOpen ||
    isClipperModalOpen ||
    isDeleteAppModalOpen ||
    isQuickListOpen ||
    isShutdownOpen ||
    isDriveModalOpen ||
    isStorageConfirmModalOpen ||
    isAuthModalOpen
  );

  const [state, setState] = useState<PomodoroState>(() => pomodoroEngine.getState());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getIsMuted());

  // Auto-collapse expanded cockpit when any modal is opened
  useEffect(() => {
    if (isModalOpen && isExpanded) {
      setIsExpanded(false);
    }
  }, [isModalOpen, isExpanded]);

  // Subscribe to pomodoroEngine updates
  useEffect(() => {
    return pomodoroEngine.subscribe(newState => {
      setState(newState);
    });
  }, []);

  // Subscribe to audio engine mute updates
  useEffect(() => {
    return soundEffects.subscribe(() => {
      setIsMuted(soundEffects.getIsMuted());
    });
  }, []);

  // Listen for custom trigger to open Pomodoro modal from header or external buttons
  useEffect(() => {
    const handleOpen = () => setIsExpanded(true);
    window.addEventListener('open_pomodoro_modal', handleOpen);
    return () => window.removeEventListener('open_pomodoro_modal', handleOpen);
  }, []);

  // Handle auto-completion when timer hits 0
  const completionHandledRef = useRef<number | null>(null);

  useEffect(() => {
    if (state.isFinished && state.remainingSeconds === 0) {
      const now = Date.now();
      // Prevent double logging within 5 seconds
      if (completionHandledRef.current && now - completionHandledRef.current < 5000) {
        return;
      }
      completionHandledRef.current = now;

      // 1. Play crystal bell chime
      soundEffects.play('chime');

      // 2. Browser native notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Focus Sprint Complete! 🎉', {
            body: `Great job! You logged ${state.selectedMinutes} minutes of deep study.`,
            icon: '/favicon.ico',
          });
        } catch {}
      }

      // 3. Auto-log completed session into Learnings
      const sessionTitle = state.topic.trim() || `${state.selectedMinutes}m Pomodoro Sprint`;
      const sessionCategory = state.category || learningTracks[0]?.name || 'Deep Study';

      addLearning({
        title: sessionTitle,
        topic: state.topic.trim() || 'Focus Sprint',
        category: sessionCategory,
        duration_minutes: state.selectedMinutes,
        date_logged: new Date().toISOString().slice(0, 10),
        notes: `Completed full ${state.selectedMinutes}-minute Pomodoro focus sprint.`,
        tags: 'pomodoro,deep-study',
      });

      pomodoroEngine.markLogged();

      showToast(
        `🎉 ${state.selectedMinutes}m Pomodoro Complete! +${state.selectedMinutes * 10} XP logged to Deep Study`
      );
    }
  }, [state.isFinished, state.remainingSeconds, state.selectedMinutes, state.topic, state.category, addLearning, learningTracks, showToast]);

  // Format MM:SS
  const mins = Math.floor(state.remainingSeconds / 60);
  const secs = state.remainingSeconds % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Circular SVG calculations
  const totalSeconds = (state.selectedMinutes || 25) * 60;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - state.remainingSeconds) / totalSeconds : 0;
  const clampedProgress = Math.max(0, Math.min(1, progressRatio));

  // Small Ring Radius (Collapsed Pill)
  const smallRadius = 14;
  const smallCircumference = 2 * Math.PI * smallRadius;
  const smallOffset = smallCircumference * (1 - clampedProgress);

  // Large Ring Radius (Expanded Cockpit)
  const largeRadius = 68;
  const largeCircumference = 2 * Math.PI * largeRadius;
  const largeOffset = largeCircumference * (1 - clampedProgress);

  const handleStartOrPause = () => {
    if (state.isRunning) {
      pomodoroEngine.pause();
    } else if (state.isPaused) {
      pomodoroEngine.resume();
    } else {
      pomodoroEngine.start();
    }
  };

  const handlePresetSelect = (minutes: number) => {
    pomodoroEngine.setPreset(minutes);
  };

  const handleManualEarlyLog = async () => {
    const elapsedSeconds = totalSeconds - state.remainingSeconds;
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

    // Play chime feedback
    soundEffects.play('chime');

    const sessionTitle = state.topic.trim() || `${elapsedMinutes}m Focus Session`;
    const sessionCategory = state.category || learningTracks[0]?.name || 'Deep Study';

    await addLearning({
      title: sessionTitle,
      topic: state.topic.trim() || 'Focus Session',
      category: sessionCategory,
      duration_minutes: elapsedMinutes,
      date_logged: new Date().toISOString().slice(0, 10),
      notes: `Logged early: completed ${elapsedMinutes} minutes of focus study.`,
      tags: 'pomodoro,deep-study',
    });

    pomodoroEngine.reset();
    showToast(`Logged ${elapsedMinutes}m study session to Learnings!`);
  };

  const requestNotificationPermission = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  };

  // Completely hide floating Pomodoro widget when any modal is open (e.g. Add/Edit Application, Add/Edit Learning)
  // to prevent overlapping modal footer action buttons (Cancel, Add Application, Save Changes)
  if (isModalOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Pomodoro Focus Timer"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end select-none font-sans"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. EXPANDED FOCUS COCKPIT POPOVER */}
      {/* ------------------------------------------------------------- */}
      {isExpanded && (
        <div className="mb-3 w-[320px] sm:w-[350px] rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Flame size={15} className={state.isRunning ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white m-0">
                  Pomodoro Sprint
                </h3>
                <span className="text-[10px] text-slate-400">
                  {state.isRunning ? 'Deep Work in Progress' : state.isPaused ? 'Sprint Paused' : 'Ready to Focus'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => soundEffects.toggleMute()}
                className={`p-1.5 rounded-lg border text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer ${
                  isMuted ? 'border-slate-200 dark:border-white/10' : 'border-orange-500/30 text-orange-500 bg-orange-500/10'
                }`}
                title={isMuted ? 'Chime muted' : 'Chime enabled'}
                aria-label="Toggle Sound"
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Minimize timer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Preset Buttons Row */}
          <div className="mt-3 flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5">
            {[15, 25, 45].map(preset => {
              const isActive = state.selectedMinutes === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={state.isRunning}
                  onClick={() => handlePresetSelect(preset)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-60 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/5'
                  }`}
                >
                  {preset}m
                </button>
              );
            })}
          </div>

          {/* Large Circular Gauge Display */}
          <div className="relative my-4 flex flex-col items-center justify-center">
            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={largeRadius}
                className="stroke-slate-100 dark:stroke-white/[0.06]"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Progress Ring with Gradient */}
              <circle
                cx="80"
                cy="80"
                r={largeRadius}
                stroke="url(#pomodoroGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                style={{
                  strokeDasharray: largeCircumference,
                  strokeDashoffset: largeOffset,
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
              <defs>
                <linearGradient id="pomodoroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Digital Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
                {timeDisplay}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 flex items-center gap-1">
                {state.isRunning && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />}
                {state.isFinished ? 'Sprint Complete!' : state.isRunning ? 'Focus Sprint' : 'Standard Sprint'}
              </span>
            </div>
          </div>

          {/* Session Topic & Category Inputs */}
          <div className="space-y-2 mb-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Sprint Goal / Concept
              </label>
              <input
                type="text"
                placeholder="e.g. Dynamic Programming or System Design"
                value={state.topic}
                onChange={e => pomodoroEngine.setTopic(e.target.value)}
                maxLength={60}
                className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                Track Category
              </label>
              <select
                value={state.category}
                onChange={e => pomodoroEngine.setCategory(e.target.value)}
                className="w-full h-8 px-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                {learningTracks.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cockpit Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                requestNotificationPermission();
                handleStartOrPause();
              }}
              className="flex-1 h-10 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 active:scale-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {state.isRunning ? (
                <>
                  <Pause size={14} className="fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-current" />
                  <span>{state.isPaused ? 'Resume Sprint' : 'Start Focus Sprint'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => pomodoroEngine.reset()}
              className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center cursor-pointer shrink-0"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw size={14} />
            </button>

            {(state.isRunning || state.isPaused) && (
              <button
                type="button"
                onClick={handleManualEarlyLog}
                className="h-10 px-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 active:scale-95 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="Log completed time to study notes now"
              >
                <CheckCircle2 size={13} />
                <span>Log Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MINIMALIST FLOATING PILL (COLLAPSED STATE) */}
      {/* ------------------------------------------------------------- */}
      <div
        className={`group flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl border backdrop-blur-xl shadow-lg transition-all duration-300 cursor-pointer ${
          state.isRunning
            ? 'bg-white/95 dark:bg-[#16161a]/95 border-orange-500/40 ring-2 ring-orange-500/20 shadow-orange-500/15'
            : state.isFinished
            ? 'bg-emerald-50/95 dark:bg-emerald-950/40 border-emerald-500/40'
            : 'bg-white/90 dark:bg-[#141417]/90 border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Open Pomodoro Focus Timer"
      >
        {/* Miniature SVG Progress Ring */}
        <div className="relative flex items-center justify-center w-7 h-7 shrink-0">
          <svg className="w-7 h-7 -rotate-90 transform" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r={smallRadius}
              className="stroke-slate-200 dark:stroke-white/10"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              cx="18"
              cy="18"
              r={smallRadius}
              className={state.isFinished ? 'stroke-emerald-500' : 'stroke-orange-500'}
              strokeWidth="3"
              strokeLinecap="round"
              fill="transparent"
              style={{
                strokeDasharray: smallCircumference,
                strokeDashoffset: smallOffset,
                transition: 'stroke-dashoffset 0.4s ease',
              }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {state.isRunning ? (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            ) : state.isFinished ? (
              <CheckCircle2 size={11} className="text-emerald-500" />
            ) : (
              <Flame size={12} className="text-orange-500" />
            )}
          </div>
        </div>

        {/* Digital Time & Status */}
        <div className="flex flex-col">
          <span className="text-xs font-black font-mono tracking-tight text-slate-800 dark:text-slate-100 tabular-nums leading-none">
            {timeDisplay}
          </span>
          <span className="text-[9px] font-bold text-slate-400 leading-tight">
            {state.isRunning ? 'Focus' : state.isPaused ? 'Paused' : `${state.selectedMinutes}m Sprint`}
          </span>
        </div>

        {/* Quick Play/Pause in Collapsed Pill */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            requestNotificationPermission();
            handleStartOrPause();
          }}
          className="ml-1 p-1.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-orange-500 hover:text-white transition-all cursor-pointer"
          title={state.isRunning ? 'Pause' : 'Start'}
          aria-label={state.isRunning ? 'Pause Timer' : 'Start Timer'}
        >
          {state.isRunning ? <Pause size={11} className="fill-current" /> : <Play size={11} className="fill-current" />}
        </button>

        {/* Expand / Minimize Arrow */}
        <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </div>
    </aside>
  );
};
