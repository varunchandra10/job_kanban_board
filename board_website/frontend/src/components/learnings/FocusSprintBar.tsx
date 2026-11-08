import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Play,
  Square,
  RotateCcw,
  Bell,
  BellOff,
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

  // Metrics calculations
  const totalHours = (gamification.totalMinutes / 60).toFixed(1);

  return (
    <div className="shrink-0 w-full rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#121316]/95 shadow-xs hover:shadow-md backdrop-blur-xl transition-all overflow-hidden">
      {/* Main Single Ultra-Clean Bar */}
      <div className="relative px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 flex-wrap lg:flex-nowrap">
        {/* Subtle Bottom Progress Track for Active Timer */}
        {isRunning && (
          <div className="absolute inset-x-0 bottom-0 h-[2px] bg-slate-100 dark:bg-white/5 overflow-hidden pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Group A: Streak & Progress Stats (Left) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* 1. [fire emoji 0d] */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 text-xs font-black shadow-2xs shrink-0"
            title="Current Streak"
          >
            <Flame size={14} className="text-orange-500 fill-orange-500/30 animate-pulse shrink-0" />
            <span className="tabular-nums font-black text-slate-900 dark:text-white">
              {gamification.streak}<span className="text-orange-600 dark:text-orange-400 font-extrabold ml-0.5">d</span>
            </span>
          </div>

          {/* 2. [trophy emoji: days] */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs shrink-0"
            title="Best Streak Record"
          >
            <Trophy size={13} className="text-amber-500 shrink-0" />
            <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
              {gamification.longestStreak ?? gamification.streak ?? 0}d
            </span>
          </div>

          {/* 3. [timer emoji: hours] */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs shrink-0"
            title="Total Study Hours Logged"
          >
            <Clock size={13} className="text-blue-500 shrink-0" />
            <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
              {totalHours}h
            </span>
          </div>

          {/* 4. [note emoji: no.of notes] */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs shadow-2xs shrink-0"
            title="Total Logged Learning Notes"
          >
            <BookMarked size={13} className="text-purple-500 shrink-0" />
            <span className="font-black text-slate-800 dark:text-slate-100 tabular-nums">
              {learnings.length}
            </span>
          </div>
        </div>

        {/* Group B: Focus Pomodoro Timer & Action Controls (Right) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Timer: Subsection */}
          <div className="flex items-center bg-slate-100/90 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/10 rounded-xl p-0.5 sm:p-1 shadow-inner shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
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
                  className="w-8 sm:w-10 h-6 text-center font-black text-xs bg-white dark:bg-[#1a1b1f] border border-slate-200 dark:border-white/10 rounded-md text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60 shadow-2xs"
                />
                <span className="text-[10px] sm:text-[10.5px] font-bold text-slate-400 dark:text-slate-500 ml-0.5 sm:ml-1">min</span>
              </div>
            </div>

            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5" />

            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-lg font-mono text-xs sm:text-sm font-black tabular-nums tracking-wider transition-all ${
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

          {/* Controls Container: [start emoji] [reset emoji] [bell emoji] */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 6. [start emoji] */}
            {isRunning ? (
              <button
                type="button"
                onClick={handleStopTimer}
                className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-500/25 active:scale-95 shrink-0"
                title="Stop timer countdown"
              >
                <Square size={11} className="fill-current shrink-0" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartTimer}
                className="flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 text-white shadow-orange-500/25 active:scale-95 shrink-0"
                title="Start timer countdown"
              >
                <Play size={11} className="fill-current shrink-0" />
                <span>
                  {isFinished ? 'Restart' : timeLeft < (parseInt(inputMinutes, 10) || 45) * 60 && timeLeft > 0 ? 'Resume' : 'Start'}
                </span>
              </button>
            )}

            {/* 7. [reset emoji] */}
            <button
              type="button"
              onClick={handleResetTimer}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0"
              title="Reset timer to entered minutes"
              aria-label="Reset timer"
            >
              <RotateCcw size={13} strokeWidth={2.4} />
            </button>

            {/* 8. [bell emoji] */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`p-1.5 rounded-xl border active:scale-95 transition-all cursor-pointer shadow-2xs shrink-0 ${
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
      </div>
    </div>
  );
};
