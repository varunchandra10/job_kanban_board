import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api, WeeklyChestData, WeeklyChestVaultData, WeeklyChestVaultBadge } from '../../services/api';
import { soundEffects } from '../../utils/soundEffects';
import {
  Trophy,
  Award,
  Sparkles,
  Lock,
  Unlock,
  Check,
  CheckCircle2,
  Clock,
  Briefcase,
  Code2,
  BookOpen,
  ChevronRight,
  X,
  Settings2,
  Flame,
  Star,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

export const WeeklyGoalChest: React.FC = () => {
  const {
    applications,
    learnings,
    dsaProgress,
    gamification,
    setGamification,
    showToast,
    isAuthenticated,
  } = useApp();

  const [chestData, setChestData] = useState<WeeklyChestData | null>(null);
  const [vaultData, setVaultData] = useState<WeeklyChestVaultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Custom targets form state
  const [targetAppsInput, setTargetAppsInput] = useState<number>(10);
  const [targetDsaInput, setTargetDsaInput] = useState<number>(5);
  const [targetStudyInput, setTargetStudyInput] = useState<number>(180);
  const [isSavingTargets, setIsSavingTargets] = useState<boolean>(false);

  // Live countdown to Sunday midnight
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const day = now.getDay();
      const daysUntilSunday = day === 0 ? 0 : 7 - day;
      const sundayMidnight = new Date(now);
      sundayMidnight.setDate(now.getDate() + daysUntilSunday);
      sundayMidnight.setHours(23, 59, 59, 999);

      const diffMs = sundayMidnight.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeftStr('Resets tonight at midnight');
        return;
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeftStr(`${days}d ${hours}h left`);
      } else {
        setTimeLeftStr(`${hours}h ${minutes}m left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch or calculate weekly chest progress
  const loadChestData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWeeklyChest();
      setChestData(data);
      setTargetAppsInput(data.targets.apps);
      setTargetDsaInput(data.targets.dsa);
      setTargetStudyInput(data.targets.studyMinutes);
    } catch {
      // Offline / guest local calculation fallback
      const now = new Date();
      const day = now.getDay() || 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - day + 1);
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const monStr = monday.toISOString().slice(0, 10);
      const sunStr = sunday.toISOString().slice(0, 10);

      // Local applications count
      const localAppsCount = applications.filter(a => {
        const d = (a.date_applied || (a as any).created_at || '').slice(0, 10);
        return d >= monStr && d <= sunStr;
      }).length;

      // Local DSA solved count
      const localDsaCount = Object.values(dsaProgress || {}).filter(prog => {
        if (prog.status !== 'solved' || !prog.updated_at) return false;
        const d = prog.updated_at.slice(0, 10);
        return d >= monStr && d <= sunStr;
      }).length;

      // Local study minutes
      const localStudyMinutes = learnings.filter(l => {
        const d = (l.date_logged || (l as any).date || '').slice(0, 10);
        return d >= monStr && d <= sunStr;
      }).reduce((sum, l) => sum + (Number(l.duration_minutes) || 0), 0);

      const targetApps = 10;
      const targetDsa = 5;
      const targetStudy = 180;

      const appsPct = Math.min(100, Math.round((localAppsCount / targetApps) * 100));
      const dsaPct = Math.min(100, Math.round((localDsaCount / targetDsa) * 100));
      const studyPct = Math.min(100, Math.round((localStudyMinutes / targetStudy) * 100));
      const overallPct = Math.min(100, Math.round((appsPct + dsaPct + studyPct) / 3));

      const isUnlocked = localAppsCount >= targetApps && localDsaCount >= targetDsa && localStudyMinutes >= targetStudy;

      setChestData({
        weekId: `${now.getFullYear()}-W${Math.ceil((now.getDate() + 6) / 7)}`,
        mondayDate: monStr,
        sundayDate: sunStr,
        targets: { apps: targetApps, dsa: targetDsa, studyMinutes: targetStudy },
        progress: { apps: localAppsCount, dsa: localDsaCount, studyMinutes: localStudyMinutes },
        percentages: { apps: appsPct, dsa: dsaPct, study: studyPct, overall: overallPct },
        isUnlocked,
        isClaimed: false,
        claimedAt: null,
        bonusXpAwarded: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaultData = async () => {
    try {
      const data = await api.getWeeklyChestVault();
      setVaultData(data);
    } catch {
      // Fallback empty vault
      setVaultData({ badges: [], totalClaimed: 0, totalBonusXp: 0 });
    }
  };

  useEffect(() => {
    loadChestData();
    loadVaultData();
  }, [applications.length, learnings.length, Object.keys(dsaProgress || {}).length]);

  // Handle claiming the gold chest
  const handleClaimChest = async () => {
    if (isClaiming || chestData?.isClaimed || !chestData?.isUnlocked) return;
    setIsClaiming(true);

    try {
      const res = await api.claimWeeklyChest();

      // 1. Play LevelUp arpeggio audio
      soundEffects.play('levelUp');

      // 2. Confetti explosion
      try {
        const confettiModule = await import('canvas-confetti');
        confettiModule.default({
          particleCount: 160,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#10b981', '#6366f1', '#ec4899'],
        });
      } catch {}

      // 3. Update gamification stats
      if (res.gamification) {
        setGamification(res.gamification);
        try {
          localStorage.setItem('job_tracker_gamify', JSON.stringify(res.gamification));
        } catch {}
      }

      showToast(res.message || '🎉 Weekly Gold Chest unlocked! +100 Bonus XP awarded.');
      await loadChestData();
      await loadVaultData();
    } catch (err: any) {
      showToast(err.message || 'Could not claim chest');
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle saving customized targets
  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTargets(true);
    try {
      await api.updateWeeklyChestTargets({
        target_apps: targetAppsInput,
        target_dsa: targetDsaInput,
        target_study_minutes: targetStudyInput,
      });
      showToast('Weekly quest targets updated successfully');
      setIsSettingsOpen(false);
      await loadChestData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update targets');
    } finally {
      setIsSavingTargets(false);
    }
  };

  const isUnlocked = Boolean(chestData?.isUnlocked);
  const isClaimed = Boolean(chestData?.isClaimed);
  const overallPercentage = chestData?.percentages.overall || 0;

  // Circular gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (overallPercentage / 100) * circumference;

  return (
    <section className="relative rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-sm overflow-hidden space-y-5">
      <style>{`
        @keyframes chestRumble {
          0% { transform: perspective(600px) rotateY(0deg) rotateZ(0deg) scale(1); }
          15% { transform: perspective(600px) rotateY(-10deg) rotateZ(-3deg) scale(1.06); }
          30% { transform: perspective(600px) rotateY(10deg) rotateZ(3deg) scale(1.06); }
          45% { transform: perspective(600px) rotateY(-8deg) rotateZ(-2deg) scale(1.06); }
          60% { transform: perspective(600px) rotateY(8deg) rotateZ(2deg) scale(1.06); }
          75% { transform: perspective(600px) rotateY(-4deg) rotateZ(-1deg) scale(1.04); }
          100% { transform: perspective(600px) rotateY(0deg) rotateZ(0deg) scale(1); }
        }
        .animate-chest-shake {
          animation: chestRumble 1.8s infinite ease-in-out;
        }
      `}</style>

      {/* Ambient background rays when chest is ready to unlock */}
      {isUnlocked && !isClaimed && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.18)_0%,transparent_70%)] animate-pulse" />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. Header Row */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 text-amber-500 border border-amber-500/30 shadow-inner">
            <Trophy size={20} className={isUnlocked ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                Weekly Goal Chest
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                {chestData?.weekId || 'This Week'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
              Complete all 3 weekly milestones to unlock the Weekly Gold Chest (+100 Bonus XP).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {/* Sunday Midnight Reset Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-300"
            title="Weekly quest auto-resets every Sunday at midnight"
          >
            <Clock size={13} className="text-amber-500" />
            <span>{timeLeftStr || 'Sun Midnight'}</span>
          </div>

          {/* Trophy Vault Button */}
          <button
            type="button"
            onClick={() => setIsVaultOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Open Historical Trophy Vault"
          >
            <Award size={13} className="text-indigo-500" />
            <span>Trophy Vault</span>
            {vaultData && vaultData.totalClaimed > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                {vaultData.totalClaimed}
              </span>
            )}
          </button>

          {/* Edit Targets */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Customize Quest Targets"
            aria-label="Customize Quest Targets"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Main Quest Cockpit Grid: 3 Quests (Left) + 3D Chest (Right) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: 3 Milestone Quest Cards (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between gap-3">
          
          {/* Quest 1: Applications */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Briefcase size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                    Quest 1
                  </span>
                  {chestData?.progress.apps !== undefined && chestData.progress.apps >= chestData.targets.apps && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                      <Check size={10} strokeWidth={3} />
                      Completed
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  Submit {chestData?.targets.apps || 10} Job Applications
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Consistent pipeline generation across target companies
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 w-28 sm:w-36">
              <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                <span className="text-blue-600 dark:text-blue-400">{chestData?.progress.apps || 0}</span>
                <span className="text-slate-400">/</span>
                <span>{chestData?.targets.apps || 10}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${chestData?.percentages.apps || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quest 2: DSA Problem Solving */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                <Code2 size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                    Quest 2
                  </span>
                  {chestData?.progress.dsa !== undefined && chestData.progress.dsa >= chestData.targets.dsa && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                      <Check size={10} strokeWidth={3} />
                      Completed
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  Solve {chestData?.targets.dsa || 5} DSA Challenges
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Algorithmic mastery and spaced repetition retention
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 w-28 sm:w-36">
              <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                <span className="text-purple-600 dark:text-purple-400">{chestData?.progress.dsa || 0}</span>
                <span className="text-slate-400">/</span>
                <span>{chestData?.targets.dsa || 5}</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${chestData?.percentages.dsa || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quest 3: Deep Technical Study Hours */}
          <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-4 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.04]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <BookOpen size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Quest 3
                  </span>
                  {chestData?.progress.studyMinutes !== undefined && chestData.progress.studyMinutes >= chestData.targets.studyMinutes && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                      <Check size={10} strokeWidth={3} />
                      Completed
                    </span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  Log {((chestData?.targets.studyMinutes || 180) / 60).toFixed(1)}h of Deep Focus / Study
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  System design notes, concept revisions, and Pomodoro sprints
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 w-28 sm:w-36">
              <div className="flex items-center gap-1 font-mono text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                <span className="text-amber-600 dark:text-amber-400">
                  {((chestData?.progress.studyMinutes || 0) / 60).toFixed(1)}h
                </span>
                <span className="text-slate-400">/</span>
                <span>{((chestData?.targets.studyMinutes || 180) / 60).toFixed(1)}h</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${chestData?.percentages.study || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3D Weekly Reward Chest Graphic & Action (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] via-amber-500/[0.02] to-transparent p-5 flex flex-col items-center justify-between gap-4 text-center">
          
          {/* Top Progress Percentage Ring Badge */}
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Quest Mastery
            </span>
            <span className="font-mono text-xs font-black text-amber-500">
              {overallPercentage}% Completed
            </span>
          </div>

          {/* 3D Chest Visual Graphic */}
          <div className="relative my-1 flex flex-col items-center justify-center">
            {/* Glowing Backdrop Ring */}
            <svg className="w-28 h-28 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-white/10"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={isClaimed ? '#10b981' : isUnlocked ? '#f59e0b' : '#f59e0b'}
                strokeWidth="6"
                strokeLinecap="round"
                fill="transparent"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeOffset,
                  transition: 'stroke-dashoffset 0.8s ease',
                }}
              />
            </svg>

            {/* The Chest / Trophy Graphic */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-transform ${
                isUnlocked && !isClaimed ? 'animate-chest-shake cursor-pointer' : ''
              }`}
              onClick={isUnlocked && !isClaimed ? handleClaimChest : undefined}
            >
              {isClaimed ? (
                /* Claimed / Opened Golden State */
                <div className="flex flex-col items-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 scale-105 border-2 border-emerald-300">
                    <Sparkles size={28} className="animate-spin text-white" style={{ animationDuration: '6s' }} />
                  </div>
                  <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +100 XP Claimed
                  </span>
                </div>
              ) : isUnlocked ? (
                /* Ready to Unlock / Shaking Golden Chest */
                <div className="flex flex-col items-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 text-white shadow-2xl shadow-amber-500/50 border-2 border-yellow-200">
                    <Unlock size={28} className="text-white drop-shadow-md" />
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9px] font-black animate-ping" />
                  </div>
                  <span className="mt-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 animate-pulse">
                    Tap to Open!
                  </span>
                </div>
              ) : (
                /* Locked Chest State */
                <div className="flex flex-col items-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-400 shadow-inner">
                    <Lock size={24} />
                  </div>
                  <span className="mt-1 font-mono text-[10px] font-bold text-slate-400">
                    {overallPercentage}% / 100%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="w-full">
            {isClaimed ? (
              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black flex items-center justify-center gap-1.5 cursor-default"
              >
                <CheckCircle2 size={14} />
                <span>Claimed for {chestData?.weekId}</span>
              </button>
            ) : isUnlocked ? (
              <button
                type="button"
                onClick={handleClaimChest}
                disabled={isClaiming}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
              >
                <Sparkles size={14} />
                <span>{isClaiming ? 'Unlocking Chest...' : 'Claim Gold Chest (+100 XP)'}</span>
              </button>
            ) : (
              <div className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-[11px] font-semibold text-slate-500 text-center">
                Reach 100% on all 3 quests to unlock
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. HISTORICAL TROPHY VAULT MODAL */}
      {/* ------------------------------------------------------------- */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Award size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white m-0">
                    Trophy Vault &amp; Past Chests
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Permanent chronicle of your completed weekly milestones
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVaultOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close Trophy Vault"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lifetime Stats Strip */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Gold Chests
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                  {vaultData?.totalClaimed || 0} <span className="text-xs font-semibold text-amber-500">Unlocked</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bonus Vault XP
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                  +{vaultData?.totalBonusXp || 0} <span className="text-xs font-semibold text-indigo-500">XP</span>
                </div>
              </div>
            </div>

            {/* Badges List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {vaultData && vaultData.badges.length > 0 ? (
                vaultData.badges.map(b => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-xs shrink-0">
                        <Trophy size={18} />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{b.weekId}</span>
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                            +{b.bonusXp} XP
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Claimed {b.claimedAt ? new Date(b.claimedAt).toLocaleDateString() : 'Achieved'} &bull; {b.achieved.apps} apps, {b.achieved.dsa} DSA, {Math.round(b.achieved.studyMinutes / 60)}h study
                        </div>
                      </div>
                    </div>

                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <Lock size={24} className="mx-auto mb-2 opacity-40" />
                  No completed weekly chests yet. Reach 100% on your weekly quests to earn your first vault badge!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. CUSTOMIZE TARGETS MODAL */}
      {/* ------------------------------------------------------------- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveTargets}
            className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                  <Settings2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white m-0">
                    Customize Weekly Targets
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Tailor your milestones to your personal job search velocity
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Close Modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quest 1: Weekly Job Applications Target
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetAppsInput}
                  onChange={e => setTargetAppsInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400">Default: 10 applications per week</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quest 2: Weekly DSA Challenges Target
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={targetDsaInput}
                  onChange={e => setTargetDsaInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400">Default: 5 solved problems per week</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quest 3: Weekly Deep Study Target (Minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="1200"
                  step="15"
                  value={targetStudyInput}
                  onChange={e => setTargetStudyInput(Math.max(15, parseInt(e.target.value, 10) || 15))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs font-bold text-slate-900 dark:text-white"
                />
                <span className="text-[10px] text-slate-400">
                  {targetStudyInput} minutes = {(targetStudyInput / 60).toFixed(1)} hours (Default: 180 min / 3h)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingTargets}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isSavingTargets ? 'Saving...' : 'Save Targets'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
