import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { TROPHY_TIER_CONFIG, Tier3DIcon } from '../CareerProfile';
import { WeeklyGoalChest } from '../WeeklyGoalChest';
import { DSA_CATEGORIES } from '../../../data/dsaTopics';
import { getLocalIsoDate, formatFullDateLabel } from '../../../utils/dateUtils';
import {
  Flame,
  Mail,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Lock,
  Code2,
  Trophy,
  CheckCircle2,
  Check,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';

interface DayCellData {
  dayNum: number | null;
  dateStr: string | null;
  count: number;
  month: number;
  year: number;
  isToday: boolean;
  isFuture: boolean;
}

export const ProfileOverviewTab: React.FC = () => {
  const {
    profile,
    gamification,
    applications,
    learnings,
    dsaProgress,
    currentUser,
  } = useApp();

  // 1. User Demographics & Rank calculations
  const userEmail = currentUser?.email || profile?.email || '';
  const isOAuth = Boolean(
    currentUser?.is_google ||
    currentUser?.auth_provider === 'google' ||
    Boolean(currentUser?.picture) ||
    Boolean(currentUser?.avatar_url)
  );

  const emailPrefix = userEmail.includes('@') ? userEmail.split('@')[0] : (userEmail || 'User');
  const displayName = isOAuth
    ? (currentUser?.name?.trim() || profile.full_name?.trim() || emailPrefix)
    : (profile.full_name?.trim() || emailPrefix);

  const oauthAvatarUrl = isOAuth
    ? (currentUser?.picture || currentUser?.avatar_url || (currentUser as any)?.photo_url || null)
    : null;

  const avatarInitials = (displayName || emailPrefix)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((s: string) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const userLevel = gamification.level || 1;
  const currentTierConfig = TROPHY_TIER_CONFIG[userLevel] || TROPHY_TIER_CONFIG[1];
  const nextTierConfig = TROPHY_TIER_CONFIG[userLevel + 1] || currentTierConfig;
  const userXP = gamification.totalXP || 0;
  const levelMinXP = currentTierConfig.min;
  const levelMaxXP = currentTierConfig.max;
  const progressPercent = levelMaxXP > levelMinXP
    ? Math.min(100, Math.max(0, Math.round(((userXP - levelMinXP) / (levelMaxXP - levelMinXP)) * 100)))
    : 100;

  // 2. Full-Year GitHub-Styled Heatmap State & Navigation
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [activeHeatmapTab, setActiveHeatmapTab] = useState<'applications' | 'learnings'>('applications');
  const [hoveredMatrixDay, setHoveredMatrixDay] = useState<{
    dateStr: string;
    dayNum: number;
    count: number;
    type: 'applications' | 'learnings';
    isToday: boolean;
  } | null>(null);

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const canGoForward = selectedYear < currentYear;

  const handlePrevYear = () => {
    setSelectedYear(prev => prev - 1);
  };
  const handleNextYear = () => {
    if (selectedYear < currentYear) {
      setSelectedYear(prev => prev + 1);
    }
  };

  const todayYMD = getLocalIsoDate();

  // Group applications by date string YYYY-MM-DD
  const appsByDate: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach(a => {
      const d = (a.date_applied || (a as any).created_at || '').slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return map;
  }, [applications]);

  // Group learnings & solved DSA by date string YYYY-MM-DD
  const learningsByDate: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    learnings.forEach(l => {
      const d = (l.date_logged || (l as any).date || '').slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    Object.values(dsaProgress || {}).forEach(prog => {
      if (prog.status === 'solved' && prog.updated_at) {
        const d = prog.updated_at.slice(0, 10);
        map[d] = (map[d] || 0) + 1;
      }
    });
    return map;
  }, [learnings, dsaProgress]);

  // Build full calendar year GitHub-styled grid (Jan 1 to Dec 31 of selectedYear)
  const yearGridData = useMemo(() => {
    const startDate = new Date(selectedYear, 0, 1);

    const buildGrid = (countMap: Record<string, number>) => {
      const weeks: DayCellData[][] = [];
      let currentWeek: DayCellData[] = [];

      // Padding for the first week (Monday = 0 ... Sunday = 6)
      const firstDayIndex = (startDate.getDay() + 6) % 7;
      for (let p = 0; p < firstDayIndex; p++) {
        currentWeek.push({ dayNum: null, dateStr: null, count: 0, month: -1, year: -1, isToday: false, isFuture: false });
      }

      // Iterate day by day from Jan 1 to Dec 31
      const iter = new Date(selectedYear, 0, 1);
      while (iter.getFullYear() === selectedYear) {
        const d = iter.getDate();
        const m = iter.getMonth();
        const y = iter.getFullYear();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = countMap[dateStr] || 0;
        const isToday = dateStr === todayYMD;
        const isFuture = dateStr > todayYMD;

        currentWeek.push({
          dayNum: d,
          dateStr,
          count,
          month: m,
          year: y,
          isToday,
          isFuture,
        });

        if (currentWeek.length === 7) {
          weeks.push(currentWeek);
          currentWeek = [];
        }

        iter.setDate(iter.getDate() + 1);
      }

      // Pad remaining days of last week
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
          currentWeek.push({ dayNum: null, dateStr: null, count: 0, month: -1, year: -1, isToday: false, isFuture: false });
        }
        weeks.push(currentWeek);
      }

      return weeks;
    };

    const appWeeks = buildGrid(appsByDate);
    const learnWeeks = buildGrid(learningsByDate);

    // Calculate month headers: find which week index contains day 1 of each month
    const monthHeaders: Array<{ weekIdx: number; label: string }> = [];
    appWeeks.forEach((week, wIdx) => {
      const firstOfMonth = week.find(d => d.dayNum === 1 && d.month !== -1);
      if (firstOfMonth) {
        monthHeaders.push({ weekIdx: wIdx, label: shortMonths[firstOfMonth.month] });
      }
    });

    // Calculate totals across the selected year
    let yearAppsTotal = 0;
    let yearLearningsTotal = 0;
    let yearActiveAppDays = 0;
    let yearActiveLearnDays = 0;
    let elapsedDaysInYear = 0;

    const countIter = new Date(selectedYear, 0, 1);
    while (countIter.getFullYear() === selectedYear) {
      const y = countIter.getFullYear();
      const m = countIter.getMonth();
      const d = countIter.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const appCnt = appsByDate[dateStr] || 0;
      const learnCnt = learningsByDate[dateStr] || 0;

      yearAppsTotal += appCnt;
      yearLearningsTotal += learnCnt;
      if (appCnt > 0) yearActiveAppDays++;
      if (learnCnt > 0) yearActiveLearnDays++;

      if (dateStr <= todayYMD) {
        elapsedDaysInYear++;
      }

      countIter.setDate(countIter.getDate() + 1);
    }

    const yearActiveDays = activeHeatmapTab === 'applications' ? yearActiveAppDays : yearActiveLearnDays;
    const denominatorDays = Math.max(1, elapsedDaysInYear);
    const consistencyPercent = Math.min(100, Math.round((yearActiveDays / denominatorDays) * 100));

    return {
      appWeeks,
      learnWeeks,
      monthHeaders,
      yearAppsTotal,
      yearLearningsTotal,
      yearActiveDays,
      consistencyPercent,
    };
  }, [appsByDate, learningsByDate, selectedYear, activeHeatmapTab, todayYMD]);

  const {
    appWeeks,
    learnWeeks,
    monthHeaders,
    yearAppsTotal,
    yearLearningsTotal,
    yearActiveDays,
    consistencyPercent,
  } = yearGridData;

  const activeWeeks = activeHeatmapTab === 'applications' ? appWeeks : learnWeeks;

  const getAppCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    if (cell.isFuture) return 'bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/[0.04] opacity-35 cursor-default';
    const c = cell.count;
    if (c === 0) return 'bg-slate-200/70 dark:bg-[#1b2230] border-slate-300/40 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
    if (c === 1) return 'bg-blue-200 dark:bg-[#163354] border-blue-300/80 dark:border-blue-700/60';
    if (c === 2) return 'bg-blue-400 dark:bg-[#1d4ed8] border-blue-500 dark:border-blue-600';
    if (c === 3) return 'bg-blue-600 dark:bg-[#2563eb] border-blue-700 dark:border-blue-500 shadow-2xs shadow-blue-500/20';
    return 'bg-blue-700 dark:bg-[#3b82f6] border-blue-800 dark:border-blue-400 shadow-xs shadow-blue-500/30';
  };

  const getLearnCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    if (cell.isFuture) return 'bg-slate-100/50 dark:bg-white/[0.02] border-slate-200/40 dark:border-white/[0.04] opacity-35 cursor-default';
    const c = cell.count;
    if (c === 0) return 'bg-slate-200/70 dark:bg-[#1b2230] border-slate-300/40 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
    if (c === 1) return 'bg-emerald-200 dark:bg-[#064e3b] border-emerald-300/80 dark:border-emerald-700/60';
    if (c === 2) return 'bg-emerald-400 dark:bg-[#059669] border-emerald-500 dark:border-emerald-600';
    if (c === 3) return 'bg-emerald-600 dark:bg-[#10b981] border-emerald-700 dark:border-emerald-500 shadow-2xs shadow-emerald-500/20';
    return 'bg-emerald-700 dark:bg-[#34d399] border-emerald-800 dark:border-emerald-400 shadow-xs shadow-emerald-500/30';
  };

  // 4. Job Search Funnel Calculations
  const totalApps = applications.length;
  const interviewingApps = applications.filter(a => a.stage === 'Interviewing').length;
  const offerApps = applications.filter(a => a.stage === 'Offer').length;
  const rejectedApps = applications.filter(a => a.stage === 'Rejected').length;
  const appliedApps = applications.filter(a => a.stage === 'Applied' || a.stage === 'Bookmarked').length;
  const responseRate = totalApps > 0 ? Math.round(((interviewingApps + offerApps) / totalApps) * 100) : 0;
  const pct = (count: number) => (totalApps > 0 ? Math.round((count / totalApps) * 100) : 0);

  // 5. DSA Mastery Calculations
  const solvedProblems = Object.entries(dsaProgress || {}).filter(([_, p]) => p.status === 'solved');
  const solvedDsaCount = solvedProblems.length;
  const masteredDsaCount = solvedProblems.filter(([_, p]) => (p.repetition_stage ?? 0) >= 4).length;
  const totalCatalog = 79;
  const dsaMasteryPct = Math.round((solvedDsaCount / totalCatalog) * 100);

  const solvedSet = new Set(solvedProblems.map(([id]) => id));
  const categoryMasteryList = DSA_CATEGORIES.slice(0, 6).map(cat => {
    const total = cat.problems.length;
    const solved = cat.problems.filter(p => solvedSet.has(p.id)).length;
    const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
    return {
      id: cat.id,
      name: cat.name,
      total,
      solved,
      pct,
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP ROW: 2 Balanced Cards (Candidate Quick Card & Storage Snapshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Card: Candidate Identity & Gamification Rank */}
        <section
          className={`relative overflow-hidden rounded-2xl border ${currentTierConfig.border} bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4 transition-all duration-300`}
          aria-label="Candidate Quick Card"
        >
          {/* Ambient Tier Glow Aura */}
          <div
            className={`absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-25 dark:opacity-20 pointer-events-none bg-gradient-to-br ${currentTierConfig.gradient}`}
          />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* User Avatar with Tier Ring & Floating Badge */}
              <div className="relative shrink-0">
                {oauthAvatarUrl ? (
                  <img
                    src={oauthAvatarUrl}
                    alt={displayName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shadow-md ring-4 ring-white dark:ring-[#141417] border border-slate-200/60 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-gradient-to-tr ${currentTierConfig.gradient} text-white font-extrabold text-xl sm:text-2xl shadow-md ring-4 ring-white dark:ring-[#141417]`}>
                    {avatarInitials}
                  </div>
                )}
                <div
                  className={`absolute -bottom-1 -right-1 p-1 rounded-xl bg-white dark:bg-[#18181b] shadow-md border ${currentTierConfig.border} flex items-center justify-center`}
                  title={`Level ${userLevel}: ${currentTierConfig.title}`}
                >
                  <Tier3DIcon tier={userLevel} size={18} />
                </div>
              </div>

              {/* Name, Verified Discipline, & Email */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white m-0 truncate">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <ShieldCheck size={11} />
                    VERIFIED
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <Mail size={13} className="shrink-0 text-slate-400" />
                  <span className="truncate">{userEmail || 'Developer Profile'}</span>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${currentTierConfig.bg} ${currentTierConfig.text} border ${currentTierConfig.border} shadow-2xs`}>
                    <Sparkles size={12} className="shrink-0 animate-pulse" />
                    <span>Tier {userLevel}: {currentTierConfig.title}</span>
                    <span className="text-[10px] opacity-75 font-mono">({userXP} XP)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-card: 3D Fire Flame Streak + Kaizen Level Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Flame Streak */}
              <div className="rounded-xl border border-orange-500/25 dark:border-orange-500/30 bg-orange-500/[0.06] dark:bg-orange-500/10 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0">
                  <Flame size={20} className="animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    Active Discipline
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {gamification.streak || 0} <span className="text-xs font-semibold text-slate-500">Days</span>
                  </div>
                </div>
              </div>

              {/* Kaizen Total XP */}
              <div className="rounded-xl border border-indigo-500/25 dark:border-indigo-500/30 bg-indigo-500/[0.06] dark:bg-indigo-500/10 p-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
                  <Trophy size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Discipline XP
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {userXP} <span className="text-xs font-semibold text-slate-500">XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar to Next Rank */}
          <div className="relative z-10 space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>Progress to {nextTierConfig.title}</span>
                <span className="text-[10px] font-mono text-slate-400">({userXP} / {levelMaxXP > 5000 ? '5,000+' : levelMaxXP} XP)</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
              <div
                className={`h-full bg-gradient-to-r ${currentTierConfig.gradient} rounded-full transition-all duration-700 shadow-xs`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Right Card: Career Velocity & Pipeline Pulse */}
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
          aria-label="Career Velocity & Pipeline Pulse"
        >
          {/* Ambient Pipeline Glow Aura */}
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-15 dark:opacity-10 pointer-events-none bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500" />
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span>Career Velocity &amp; Pipeline Pulse</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pipeline Active
              </span>
            </div>

            {/* 4 Metric Tiles Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Tracked Roles</span>
                  <Briefcase size={12} className="text-blue-500" />
                </div>
                <div className="mt-1">
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {totalApps} <span className="text-xs font-normal text-slate-500">Apps</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {interviewingApps} interviewing · {offerApps} offer(s)
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">DSA Solved</span>
                  <Code2 size={12} className="text-purple-500" />
                </div>
                <div className="mt-1">
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {solvedDsaCount} <span className="text-xs font-normal text-slate-500">/ {totalCatalog}</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {masteredDsaCount} permanent mastered
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Study Topics</span>
                  <BookOpen size={12} className="text-emerald-500" />
                </div>
                <div className="mt-1">
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {learnings.length} <span className="text-xs font-normal text-slate-500">Logs</span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Feeding weekly study quests
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Response Rate</span>
                  <Sparkles size={12} className="text-amber-500" />
                </div>
                <div className="mt-1">
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    {responseRate}%
                  </div>
                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Interviews &amp; offers vs applied
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick jump to Weekly Goals & Heatmap */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Flame size={13} className="text-orange-500" />
              <span>Streak protection active</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('weekly-goal-chest');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              <span>Weekly Quests</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </section>
      </div>

      {/* 2. WEEKLY GOAL CHESTS & QUEST MILESTONES */}
      <div id="weekly-goal-chest">
        <WeeklyGoalChest />
      </div>

      {/* 3. SINGLE FULL-YEAR GITHUB-STYLED HEATMAP (Job Applications / Learnings) */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        {/* Header: Title + Subtitle on Left, 2 Buttons + Year Stepper on Right */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              {activeHeatmapTab === 'applications' ? (
                <Briefcase size={16} className="text-blue-600" />
              ) : (
                <BookOpen size={16} className="text-emerald-600" />
              )}
              <span>Activity &amp; Momentum Heatmap</span>
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>
                {activeHeatmapTab === 'applications'
                  ? `${yearAppsTotal} job application${yearAppsTotal === 1 ? '' : 's'} in `
                  : `${yearLearningsTotal} learning${yearLearningsTotal === 1 ? '' : 's'} & DSA in `}
              </span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {selectedYear}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Exactly Two Toggle Buttons: Job Applications & Learnings */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/90 dark:border-white/10 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveHeatmapTab('applications')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeHeatmapTab === 'applications'
                    ? 'bg-white dark:bg-[#27272a] text-blue-600 dark:text-blue-400 shadow-xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Display Job Applications Heatmap"
              >
                <Briefcase size={13} />
                <span>Job Applications</span>
                {yearAppsTotal > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeHeatmapTab === 'applications'
                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {yearAppsTotal}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveHeatmapTab('learnings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeHeatmapTab === 'learnings'
                    ? 'bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Display Daily Learnings & DSA Heatmap"
              >
                <BookOpen size={13} />
                <span>Learnings</span>
                {yearLearningsTotal > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeHeatmapTab === 'learnings'
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {yearLearningsTotal}
                  </span>
                )}
              </button>
            </div>

            {/* Year Stepper: Back Button (<) moves complete year back */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/90 dark:border-white/10 shadow-2xs">
              <button
                type="button"
                onClick={handlePrevYear}
                className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title={`Previous Year (${selectedYear - 1})`}
                aria-label="Previous Year"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="px-2 text-xs font-black text-slate-900 dark:text-white select-none">
                {selectedYear}
              </span>

              <button
                type="button"
                onClick={handleNextYear}
                disabled={!canGoForward}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  canGoForward
                    ? 'hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 cursor-pointer'
                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-40'
                }`}
                title={canGoForward ? `Next Year (${selectedYear + 1})` : 'Current Year'}
                aria-label="Next Year"
              >
                <ChevronRight size={15} />
              </button>

              {selectedYear !== currentYear && (
                <button
                  type="button"
                  onClick={() => setSelectedYear(currentYear)}
                  className="ml-1 px-2 py-0.5 rounded-lg text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Return to Current Year"
                >
                  {currentYear}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Hover Info Banner - Displays exact date and count */}
        <div className="flex items-center justify-between px-3.5 py-2 mb-3 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-xs min-h-[42px] transition-all">
          {hoveredMatrixDay ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar size={13} className={hoveredMatrixDay.type === 'applications' ? 'text-blue-500' : 'text-emerald-500'} />
                <span>
                  {formatFullDateLabel(hoveredMatrixDay.dateStr)}
                </span>
              </span>
              <span className="text-slate-400 font-bold">&bull;</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-lg text-xs shadow-2xs flex items-center gap-1.5 ${
                  hoveredMatrixDay.type === 'applications'
                    ? 'bg-blue-600 text-white shadow-blue-500/25'
                    : 'bg-emerald-600 text-white shadow-emerald-500/25'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>
                  {hoveredMatrixDay.count}{' '}
                  {hoveredMatrixDay.type === 'applications'
                    ? `Job Application${hoveredMatrixDay.count === 1 ? '' : 's'}`
                    : `Learning Note${hoveredMatrixDay.count === 1 ? '' : 's'}`}
                </span>
              </span>
              {hoveredMatrixDay.isToday && (
                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 rounded-md shadow-2xs">
                  🔥 Today
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className={activeHeatmapTab === 'applications' ? 'text-blue-500' : 'text-emerald-500'} />
                <span className="font-semibold">
                  <strong className="text-slate-900 dark:text-white font-black">{yearActiveDays} active days</strong> ({consistencyPercent}% consistency) in {selectedYear}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                Hover any cell for daily details
              </span>
            </div>
          )}
        </div>

        {/* Single GitHub-styled Heatmap Grid */}
        <div
          onMouseLeave={() => setHoveredMatrixDay(null)}
          className="my-2.5 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10"
        >
          <div className="min-w-fit">
            {/* Month labels bar */}
            <div className="flex text-[10.5px] font-bold text-slate-400 h-4 relative mb-1.5 select-none pointer-events-none">
              {monthHeaders.map((hdr, i) => (
                <span
                  key={i}
                  style={{ left: `${(hdr.weekIdx * 18) + 32}px` }}
                  className="absolute"
                >
                  {hdr.label}
                </span>
              ))}
            </div>

            {/* Heatmap Rows & Week Columns */}
            <div className="flex gap-1 items-start">
              {/* Day of Week Labels */}
              <div className="grid grid-rows-7 gap-1 text-[9.5px] font-bold text-slate-400 select-none pt-0.5 w-7 shrink-0">
                <div className="h-[14px] flex items-center leading-none">Mon</div>
                <div className="h-[14px]" />
                <div className="h-[14px] flex items-center leading-none">Wed</div>
                <div className="h-[14px]" />
                <div className="h-[14px] flex items-center leading-none">Fri</div>
                <div className="h-[14px]" />
                <div className="h-[14px]" />
              </div>

              {/* Weeks (52-53 columns) */}
              <div className="flex gap-1">
                {activeWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1 w-[14px] shrink-0">
                    {week.map((cell, cIdx) => (
                      <div
                        key={cIdx}
                        onMouseEnter={() => {
                          if (cell.dayNum && cell.dateStr && !cell.isFuture) {
                            setHoveredMatrixDay({
                              dateStr: cell.dateStr,
                              dayNum: cell.dayNum,
                              count: cell.count,
                              type: activeHeatmapTab,
                              isToday: cell.isToday,
                            });
                          }
                        }}
                        className={`w-[14px] h-[14px] rounded-[3px] border transition-all duration-150 ${
                          cell.isFuture ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          activeHeatmapTab === 'applications'
                            ? getAppCellClass(cell)
                            : getLearnCellClass(cell)
                        } ${
                          cell.isToday
                            ? (activeHeatmapTab === 'applications'
                                ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#141417]'
                                : 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-[#141417]')
                            : ''
                        } ${
                          !cell.isFuture && cell.dayNum
                            ? `hover:ring-2 hover:scale-125 hover:z-20 ${
                                activeHeatmapTab === 'applications'
                                  ? 'hover:ring-blue-500/80'
                                  : 'hover:ring-emerald-500/80'
                              }`
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Legend & Totals */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Flame size={13} className="text-orange-500" />
            <span>Active Days in {selectedYear}:</span>
            <strong
              className={`font-extrabold ${
                activeHeatmapTab === 'applications'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {yearActiveDays} Days
            </strong>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
              <span
                className={`w-2.5 h-2.5 rounded-[3px] ${
                  activeHeatmapTab === 'applications'
                    ? 'bg-blue-600 shadow-2xs shadow-blue-500/40'
                    : 'bg-emerald-600 shadow-2xs shadow-emerald-500/40'
                }`}
              />
              <span>
                {activeHeatmapTab === 'applications'
                  ? 'Job Applications'
                  : 'Daily Learnings & DSA'}
              </span>
            </span>

            {/* Less -> More Scale */}
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-200/70 dark:bg-[#1b2230] border border-slate-300/40 dark:border-white/5" />
              {activeHeatmapTab === 'applications' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-200 dark:bg-[#163354]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-400 dark:bg-[#1d4ed8]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-600 dark:bg-[#2563eb]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-700 dark:bg-[#3b82f6]" />
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-200 dark:bg-[#064e3b]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 dark:bg-[#059669]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 dark:bg-[#10b981]" />
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-700 dark:bg-[#34d399]" />
                </>
              )}
              <span>More</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISUAL ANALYTICS (Card A: Job Funnel & Card B: DSA Radar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Card A: Job Search Funnel */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Briefcase size={16} className="text-blue-600" />
                <span>Job Search Pipeline &amp; Funnel</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                {totalApps} Total Tracked
              </span>
            </div>

            {/* 4 Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {appliedApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Applied
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {interviewingApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Interviews
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {offerApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Offers
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-base sm:text-lg font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {responseRate}%
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Response
                </div>
              </div>
            </div>

            {/* Pipeline Stage Bars */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-slate-700 dark:text-slate-300 font-semibold truncate">Applied</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${pct(appliedApps)}%` }} />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]">{pct(appliedApps)}%</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-slate-700 dark:text-slate-300 font-semibold truncate">Interviewing</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all duration-300" style={{ width: `${pct(interviewingApps)}%` }} />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]">{pct(interviewingApps)}%</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-slate-700 dark:text-slate-300 font-semibold truncate">Offers</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${pct(offerApps)}%` }} />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]">{pct(offerApps)}%</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="w-24 text-slate-700 dark:text-slate-300 font-semibold truncate">Rejected</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 transition-all duration-300" style={{ width: `${pct(rejectedApps)}%` }} />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11px]">{pct(rejectedApps)}%</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Active Pipeline: <strong>{interviewingApps + appliedApps} Roles</strong></span>
            <span>Outcome Rate: <strong>{offerApps} won / {rejectedApps} archived</strong></span>
          </div>
        </section>

        {/* Card B: DSA Algorithmic Mastery Radar */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Code2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>DSA Mastery &amp; 1-4-7 Spaced Repetition</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {masteredDsaCount} Mastered
              </span>
            </div>

            {/* Circular Progress & Overall Stat */}
            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-black text-lg">
                {dsaMasteryPct}%
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Roadmap Completion: {solvedDsaCount} of {totalCatalog} Solved
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                  Algorithms advance through Day 1, Day 4, and Day 7 reviews into permanent memory.
                </p>
              </div>
            </div>

            {/* Top Algorithmic Pattern Meters */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Top Pattern Coverage
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {categoryMasteryList.map(cat => (
                  <div key={cat.id} className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span className="truncate">{cat.name}</span>
                      <span className="font-mono text-slate-500">{cat.solved}/{cat.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${cat.pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Retention Rule: <strong>1-4-7 Day System</strong></span>
            <span>Permanent Mastered: <strong>{masteredDsaCount} Problems</strong></span>
          </div>
        </section>
      </div>

    </div>
  );
};
