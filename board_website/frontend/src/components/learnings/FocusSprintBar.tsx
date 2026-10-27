import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Play,
  Square,
  RotateCcw,
  Bell,
  BellOff,
  CheckCircle2,
  ChevronDown,
  Trophy,
  Clock,
  BookMarked,
} from 'lucide-react';

// Web Audio API Crystal Bell Chime
const playChimeSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Harmonics for a soothing Tibetan singing bowl chime (C5, E5, G5, C6)
    const frequencies = [523.25, 659.25, 783.99, 1046.5];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + idx * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.1 + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 2.0);
    });
  } catch (err) {
    // Audio context was blocked or not supported
  }
};

export const FocusSprintBar: React.FC = () => {
  const {
    gamification,
    learnings,
  } = useApp();

  // User input minutes (only numbers allowed, default: 45)
  const [inputMinutes, setInputMinutes] = useState<string>('45');
  const [selectedMinutes, setSelectedMinutes] = useState<number>(45);
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Sound preferences
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('focus_timer_muted') === '1';
  });

  // Expandable stats drawer
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Interval ref - using ReturnType<typeof setInterval>
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            setIsFinished(true);
            if (!isMuted) {
              playChimeSound();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isMuted]);

  // Handle user typing minutes (only numbers allowed)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^0-9]/g, ''); // Numbers only
    setInputMinutes(sanitized);

    const parsed = parseInt(sanitized, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSelectedMinutes(parsed);
      if (!isRunning) {
        setTimeLeft(parsed * 60);
        setIsFinished(false);
      }
    }
  };

  // Start timer
  const handleStartTimer = () => {
    const parsed = parseInt(inputMinutes, 10) || selectedMinutes || 45;
    if (isFinished || timeLeft <= 0) {
      setTimeLeft(parsed * 60);
      setIsFinished(false);
    }
    setIsRunning(true);
  };

  // Stop timer
  const handleStopTimer = () => {
    setIsRunning(false);
  };

  // Reset timer
  const handleResetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    const parsed = parseInt(inputMinutes, 10) || selectedMinutes || 45;
    setTimeLeft(parsed * 60);
  };

  // Toggle sound
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('focus_timer_muted', next ? '1' : '0');
      if (!next) {
        playChimeSound();
      }
      return next;
    });
  };

  // Format MM:SS or HH:MM:SS
  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  const timeFormatted =
    hrs > 0
      ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Progress percentage
  const totalSeconds = selectedMinutes * 60;
  const progressPercent = totalSeconds > 0 ? Math.max(0, Math.min(100, Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100))) : 0;

  // Level & XP calculations
  const totalHours = (gamification.totalMinutes / 60).toFixed(1);
  const currentLevelXP = gamification.totalXP % 1000;
  const levelProgressPercent = Math.min(100, Math.round((currentLevelXP / 1000) * 100));

  return (
    <div className="shrink-0 w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#121316]/95 shadow-sm hover:shadow-md backdrop-blur-xl transition-all overflow-hidden">
      {/* 1. Main Ultra-Slim Focus Sprint Bar */}
      <div className="relative px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-3 flex-nowrap">
        {/* Subtle Bottom Progress Track for Active Timer */}
        {isRunning && (
          <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-slate-100 dark:bg-white/5 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* LEFT: Compact Streak & Level Pill Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsStatsOpen(prev => !prev)}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-amber-500/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all cursor-pointer shadow-xs group"
            title="Click to toggle study stats & weekly punchcard"
            aria-expanded={isStatsOpen}
          >
            <div className="relative flex items-center justify-center">
              <Flame size={15} className="text-orange-500 fill-orange-500/30 animate-pulse shrink-0" />
            </div>
            <span className="tabular-nums font-black text-slate-900 dark:text-white">
              {gamification.streak}<span className="text-orange-600 dark:text-orange-400 font-extrabold ml-0.5">d</span>
              <span className="text-slate-600 dark:text-slate-300 font-bold ml-1 hidden sm:inline">Streak</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-orange-400/50 hidden sm:inline" />
            <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-300 border border-orange-500/20 hidden md:inline">
              Lvl {gamification.level}
            </span>
            <ChevronDown
              size={13}
              className={`transition-transform duration-300 text-slate-400 group-hover:text-orange-500 shrink-0 ${
                isStatsOpen ? 'rotate-180 text-orange-600' : ''
              }`}
            />
          </button>

          {/* Today's Streak Status Indicator */}
          {gamification.todayCompleted ? (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl shadow-2xs">
              <CheckCircle2 size={13} strokeWidth={2.5} className="text-emerald-500" />
              <span>Done Today</span>
            </span>
          ) : (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>Study Today</span>
            </span>
          )}
        </div>

        {/* CENTER: User Numeric Input & Live Countdown in Segmented Pod */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          <div className="flex items-center bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 rounded-xl p-0.5 sm:p-1 shadow-inner">
            {/* Target Duration input */}
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5">
              <Clock size={12} className="text-slate-400 dark:text-slate-500 sm:hidden shrink-0" />
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider hidden sm:inline">
                Timer
              </span>
              <div className="flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={inputMinutes}
                  disabled={isRunning}
                  onChange={handleInputChange}
                  title="Enter timer duration in minutes (numbers only, e.g. 45 or 50)"
                  placeholder="45"
                  className="w-8 sm:w-11 h-6 text-center font-black text-xs bg-white dark:bg-[#1a1b1f] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60 shadow-2xs"
                />
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 dark:text-slate-500 ml-0.5 sm:ml-1">min</span>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

            {/* Live Countdown Display */}
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-base font-black tabular-nums tracking-wider transition-all ${
                isFinished
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse'
                  : isRunning
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.18)]'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              <span>{timeFormatted}</span>
              {isRunning && (
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_6px_rgba(249,115,22,0.8)] shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Actions (Start, Stop, Reset, Bell) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Start and Stop Buttons */}
          {isRunning ? (
            <button
              type="button"
              onClick={handleStopTimer}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/25 active:scale-95"
              title="Stop timer countdown"
            >
              <Square size={11} className="fill-current shrink-0" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartTimer}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 text-white shadow-orange-500/25 active:scale-95"
              title="Start timer countdown"
            >
              <Play size={11} className="fill-current shrink-0" />
              <span className="hidden sm:inline">
                {isFinished ? 'Restart' : timeLeft < (parseInt(inputMinutes, 10) || 45) * 60 && timeLeft > 0 ? 'Resume' : 'Start'}
              </span>
            </button>
          )}

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetTimer}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Reset timer to entered minutes"
            aria-label="Reset timer"
          >
            <RotateCcw size={13} strokeWidth={2.4} />
          </button>

          {/* Audio Chime Mute/Unmute */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`p-1.5 rounded-xl border active:scale-95 transition-all cursor-pointer shadow-2xs ${
              isMuted
                ? 'border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
                : 'border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.15)]'
            }`}
            title={isMuted ? 'Unmute finish bell chime' : 'Mute finish bell chime (click to test sound)'}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? <BellOff size={13} /> : <Bell size={13} />}
          </button>
        </div>
      </div>

      {/* 2. Seamless Expandable Study Stats & Gamification Drawer */}
      {isStatsOpen && (
        <div className="border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] p-3.5 sm:p-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Level & XP Bar */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 text-orange-500 font-black text-sm shadow-inner">
                L{gamification.level}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white m-0 truncate">
                    {gamification.levelTitle || 'Code Virtuoso'}
                  </h4>
                  <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                    {gamification.totalXP.toLocaleString()} XP
                  </span>
                </div>
                {/* XP Bar */}
                <div className="mt-1.5 flex items-center gap-2 w-48 sm:w-60">
                  <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 transition-all duration-500 shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                      style={{ width: `${levelProgressPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 tabular-nums">
                    {levelProgressPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Metric Badges (Best, Hours, Notes) - CENTER ALIGNED */}
            <div className="flex items-center justify-center gap-2 flex-wrap w-full md:w-auto">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs">
                <Trophy size={13} className="text-amber-500 shrink-0" />
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Best:</span>
                <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {gamification.longestStreak}d
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs">
                <Clock size={13} className="text-blue-500 shrink-0" />
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Hours:</span>
                <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {totalHours}h
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs">
                <BookMarked size={13} className="text-purple-500 shrink-0" />
                <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">Notes:</span>
                <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {learnings.length}
                </span>
              </div>
            </div>

            {/* 7-Day Mini Punchcard Day Boxes - CENTER ALIGNED */}
            <div className="flex items-center justify-center gap-1.5 shrink-0 w-full md:w-auto">
              {gamification.weekPunchcard?.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.date} (${day.day}): ${day.active ? 'Completed' : day.frozen ? 'Frozen' : 'Pending'}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-xl text-[10px] font-extrabold border transition-all cursor-default ${
                    day.active
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs shadow-emerald-500/20'
                      : day.frozen
                      ? 'bg-cyan-500 text-white border-cyan-600 shadow-xs'
                      : day.isToday
                      ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500 ring-2 ring-orange-500/30 font-black'
                      : 'bg-white dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10'
                  }`}
                >
                  {day.day[0]}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
