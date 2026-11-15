import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { TROPHY_TIER_CONFIG, Tier3DIcon } from '../CareerProfile';
import { DSA_CATEGORIES } from '../../../data/dsaTopics';
import {
  Flame,
  Download,
  Mail,
  HardDrive,
  Briefcase,
  Layers,
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
}

export const ProfileOverviewTab: React.FC = () => {
  const {
    profile,
    gamification,
    applications,
    learnings,
    dsaProgress,
    currentUser,
    storageMode,
    requestStorageModeChange,
    showToast,
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
    .map(s => s[0])
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

  // 2. CSV Export
  const exportToCSV = () => {
    const headers = ['Company', 'Role', 'Stage', 'Category', 'Country', 'City', 'Date Applied', 'Deadline', 'Salary'];
    const rows = applications.map(a => [
      `"${a.company || ''}"`,
      `"${a.role || ''}"`,
      `"${a.stage || ''}"`,
      `"${a.category || ''}"`,
      `"${a.country || ''}"`,
      `"${a.city || ''}"`,
      `"${a.date_applied || ''}"`,
      `"${a.deadline || ''}"`,
      `"${a.salary || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job_applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported applications to CSV');
  };

  // 3. Side-by-Side Multi-Month Stepper & Heatmap Calculations
  const [momentumDate, setMomentumDate] = useState(() => new Date());
  const [monthSpan, setMonthSpan] = useState<number>(6); // Default 6 months (~26 weeks) to fully fill the card width
  const [hoveredMatrixDay, setHoveredMatrixDay] = useState<{
    dateStr: string;
    dayNum: number;
    count: number;
    type: 'applications' | 'learnings';
    isToday: boolean;
  } | null>(null);

  const selectedYear = momentumDate.getFullYear();
  const selectedMonth = momentumDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const stepMonth = (delta: number) => {
    setMomentumDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };
  const setMonthByIndex = (m: number) => {
    setMomentumDate(prev => new Date(prev.getFullYear(), m, 1));
  };
  const setYearByValue = (y: number) => {
    setMomentumDate(prev => new Date(y, prev.getMonth(), 1));
  };
  const resetToCurrentMonth = () => {
    setMomentumDate(new Date());
  };

  const todayYMD = new Date().toISOString().slice(0, 10);

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

  // Build multi-month grid structure (span of N months ending at selectedMonth)
  const multiMonthGridData = useMemo(() => {
    const startDate = new Date(selectedYear, selectedMonth - (monthSpan - 1), 1);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0);

    const startMonthName = shortMonths[startDate.getMonth()];
    const startYear = startDate.getFullYear();
    const endMonthName = shortMonths[endDate.getMonth()];
    const endYear = endDate.getFullYear();

    const rangeLabel = startYear === endYear
      ? `${startMonthName} – ${endMonthName} ${endYear}`
      : `${startMonthName} ${startYear} – ${endMonthName} ${endYear}`;

    const buildGrid = (countMap: Record<string, number>) => {
      const weeks: DayCellData[][] = [];
      let currentWeek: DayCellData[] = [];

      // Padding for the first week (Monday = 0 ... Sunday = 6)
      const firstDayIndex = (startDate.getDay() + 6) % 7;
      for (let p = 0; p < firstDayIndex; p++) {
        currentWeek.push({ dayNum: null, dateStr: null, count: 0, month: -1, year: -1, isToday: false });
      }

      // Iterate day by day from startDate to endDate
      const iter = new Date(startDate);
      while (iter <= endDate) {
        const d = iter.getDate();
        const m = iter.getMonth();
        const y = iter.getFullYear();
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const count = countMap[dateStr] || 0;

        currentWeek.push({
          dayNum: d,
          dateStr,
          count,
          month: m,
          year: y,
          isToday: dateStr === todayYMD,
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
          currentWeek.push({ dayNum: null, dateStr: null, count: 0, month: -1, year: -1, isToday: false });
        }
        weeks.push(currentWeek);
      }

      return weeks;
    };

    const appWeeks = buildGrid(appsByDate);
    const learnWeeks = buildGrid(learningsByDate);

    // Calculate month headers along the week columns cleanly from appWeeks
    const monthHeaders: Array<{ weekIdx: number; label: string }> = [];
    let lastHeaderWeek = -999;
    let lastMonth = -1;
    appWeeks.forEach((week, wIdx) => {
      const validDay = week.find(d => d.month !== -1 && d.dayNum !== null);
      if (validDay && validDay.month !== lastMonth) {
        if (wIdx - lastHeaderWeek >= 2) {
          monthHeaders.push({ weekIdx: wIdx, label: shortMonths[validDay.month] });
          lastHeaderWeek = wIdx;
        }
        lastMonth = validDay.month;
      }
    });

    // Calculate totals across the displayed multi-month span
    let periodAppsTotal = 0;
    let periodLearningsTotal = 0;
    let periodActiveDays = 0;
    let totalDaysInPeriod = 0;

    const countIter = new Date(startDate);
    while (countIter <= endDate) {
      totalDaysInPeriod++;
      const y = countIter.getFullYear();
      const m = countIter.getMonth();
      const d = countIter.getDate();
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const appCnt = appsByDate[dateStr] || 0;
      const learnCnt = learningsByDate[dateStr] || 0;

      periodAppsTotal += appCnt;
      periodLearningsTotal += learnCnt;
      if (appCnt > 0 || learnCnt > 0) periodActiveDays++;

      countIter.setDate(countIter.getDate() + 1);
    }

    return {
      appWeeks,
      learnWeeks,
      monthHeaders,
      rangeLabel,
      periodAppsTotal,
      periodLearningsTotal,
      periodActiveDays,
      totalDaysInPeriod,
    };
  }, [appsByDate, learningsByDate, selectedYear, selectedMonth, monthSpan, todayYMD]);

  const {
    appWeeks,
    learnWeeks,
    monthHeaders,
    rangeLabel,
    periodAppsTotal,
    periodLearningsTotal,
    periodActiveDays,
    totalDaysInPeriod,
  } = multiMonthGridData;

  const getAppCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    const c = cell.count;
    if (c === 0) return 'bg-slate-200/70 dark:bg-[#1b2230] border-slate-300/40 dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20';
    if (c === 1) return 'bg-blue-200 dark:bg-[#163354] border-blue-300/80 dark:border-blue-700/60';
    if (c === 2) return 'bg-blue-400 dark:bg-[#1d4ed8] border-blue-500 dark:border-blue-600';
    if (c === 3) return 'bg-blue-600 dark:bg-[#2563eb] border-blue-700 dark:border-blue-500 shadow-2xs shadow-blue-500/20';
    return 'bg-blue-700 dark:bg-[#3b82f6] border-blue-800 dark:border-blue-400 shadow-xs shadow-blue-500/30';
  };

  const getLearnCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
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
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
          aria-label="Candidate Quick Card"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* User Avatar */}
              {oauthAvatarUrl ? (
                <img
                  src={oauthAvatarUrl}
                  alt={displayName}
                  className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl object-cover shadow-md ring-4 ring-white dark:ring-[#141417] border border-slate-200/60 dark:border-white/10"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-xl sm:text-2xl shadow-md ring-4 ring-white dark:ring-[#141417]">
                  {avatarInitials}
                </div>
              )}

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
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Tier3DIcon tier={userLevel} size={14} className="shrink-0" />
                    <span>Tier {userLevel}: {currentTierConfig.title}</span>
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
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">
                Progress to {nextTierConfig.title}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
              <div
                className={`h-full bg-gradient-to-r ${currentTierConfig.gradient} rounded-full transition-all duration-700`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Right Card: Storage Engine & System Snapshot */}
        <section
          className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4"
          aria-label="Storage Engine & System Snapshot"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive size={14} className="text-indigo-500" />
                <span>Storage &amp; System Engine</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                System Healthy
              </span>
            </div>

            {/* Storage Mode Selector Pills */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Storage Provider
              </div>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 relative">
                <button
                  type="button"
                  onClick={() => storageMode !== 'local_storage' && requestStorageModeChange('local_storage')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    storageMode === 'local_storage'
                      ? 'bg-white dark:bg-[#27272a] text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/80 dark:border-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <HardDrive size={13} className={storageMode === 'local_storage' ? 'text-indigo-500' : 'text-slate-400'} />
                  <span>LOCAL_STORAGE</span>
                  {storageMode === 'local_storage' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => storageMode !== 'g_drive' && requestStorageModeChange('g_drive')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    storageMode === 'g_drive'
                      ? 'bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-300 shadow-sm border border-slate-200/80 dark:border-white/10'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers size={13} className={storageMode === 'g_drive' ? 'text-emerald-500' : 'text-slate-400'} />
                  <span>GOOGLE_DRIVE</span>
                  {storageMode === 'g_drive' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Metrics Tiles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Tracked Roles</div>
                <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {totalApps} <span className="text-xs font-normal text-slate-500">Apps</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Learning Logs</div>
                <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                  {learnings.length} <span className="text-xs font-normal text-slate-500">Topics</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export CSV CTA */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Download your entire application history:
            </span>
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <Download size={13} className="text-emerald-500" />
              <span>Download CSV</span>
            </button>
          </div>
        </section>
      </div>

      {/* 2. SIDE-BY-SIDE MULTI-MONTH GITHUB-STYLED HEATMAP (Job Applications on Left | Daily Learnings on Right) */}
      <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        {/* Header, Range Label, Month Span Switcher, and Month Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Briefcase size={16} className="text-blue-600" />
              <span>Activity &amp; Momentum Heatmaps</span>
            </div>
            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>{periodAppsTotal + periodLearningsTotal} activities in </span>
              <strong className="text-slate-900 dark:text-white font-bold">
                {rangeLabel}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-Month Span Toggle (3M / 6M / 9M / 1Y) */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] font-bold">
              {[
                { label: '3M', val: 3 },
                { label: '6M', val: 6 },
                { label: '9M', val: 9 },
                { label: '1Y', val: 12 },
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setMonthSpan(item.val)}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    monthSpan === item.val
                      ? 'bg-white dark:bg-[#27272a] text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`Display past ${item.label}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Month & Year Navigation Controls */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => stepMonth(-1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft size={14} />
              </button>

              <select
                value={selectedMonth}
                onChange={e => setMonthByIndex(Number(e.target.value))}
                className="h-6 px-1.5 rounded-lg border-0 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {shortMonths.map((m, idx) => (
                  <option key={m} value={idx} className="bg-white dark:bg-[#18181b]">{m}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setYearByValue(Number(e.target.value))}
                className="h-6 px-1.5 rounded-lg border-0 bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-[#18181b]">{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => stepMonth(1)}
                className="flex h-6 w-6 items-center justify-center rounded-lg hover:bg-white dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={resetToCurrentMonth}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Jump to Current Month"
              >
                Today
              </button>
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
                  {(() => {
                    const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                    const d = new Date(hoveredMatrixDay.dateStr);
                    const dayOfWeek = daysNames[d.getDay()];
                    const mName = shortMonths[d.getMonth()];
                    return `${dayOfWeek}, ${mName} ${hoveredMatrixDay.dayNum}, ${d.getFullYear()}`;
                  })()}
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
                <Sparkles size={13} className="text-indigo-500" />
                <span className="font-semibold">
                  <strong className="text-slate-900 dark:text-white font-black">{periodActiveDays} active days</strong> ({Math.round((periodActiveDays / totalDaysInPeriod) * 100)}% consistency) across {rangeLabel}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                Hover any cell for daily details
              </span>
            </div>
          )}
        </div>

        {/* Dual Side-by-Side Activity Blocks: Applications (Left) & Learnings (Right) */}
        <div
          onMouseLeave={() => setHoveredMatrixDay(null)}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch my-2.5 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]"
        >
          {/* 1. Job Applications Block (Blue Theme) */}
          <div className="flex flex-col gap-2.5 flex-1 min-w-0 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
            <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
              <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Briefcase size={13} />
                <span>Job Applications</span>
              </span>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  periodAppsTotal > 0
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                    : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                }`}
              >
                {periodAppsTotal} applications
              </span>
            </div>

            {/* Multi-month Grid with month labels on top and day labels on left */}
            <div className="min-w-fit">
              {/* Month labels bar */}
              <div className="flex text-[10px] font-bold text-slate-400 h-4 relative mb-1 select-none pointer-events-none">
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

              <div className="flex gap-1 items-start">
                <div className="grid grid-rows-7 gap-1 text-[9.5px] font-bold text-slate-400 select-none pt-0.5 w-7 shrink-0">
                  <div className="h-[14px] flex items-center leading-none">Mon</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px] flex items-center leading-none">Wed</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px] flex items-center leading-none">Fri</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px]" />
                </div>

                <div className="flex gap-1 flex-1">
                  {appWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          onMouseEnter={() => {
                            if (cell.dayNum && cell.dateStr) {
                              setHoveredMatrixDay({
                                dateStr: cell.dateStr,
                                dayNum: cell.dayNum,
                                count: cell.count,
                                type: 'applications',
                                isToday: cell.isToday,
                              });
                            }
                          }}
                          className={`w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] rounded-[3px] border transition-all duration-150 cursor-pointer ${getAppCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-[#141417]' : ''
                          } hover:ring-2 hover:ring-blue-500/80 hover:scale-125 hover:z-20`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Daily Learnings Block (Emerald Theme) */}
          <div className="flex flex-col gap-2.5 flex-1 min-w-0 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10 lg:border-l lg:border-slate-200/80 lg:dark:border-white/10 lg:pl-5">
            <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <BookOpen size={13} />
                <span>Daily Learnings &amp; Problem Solving</span>
              </span>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  periodLearningsTotal > 0
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                }`}
              >
                {periodLearningsTotal} learnings
              </span>
            </div>

            {/* Multi-month Grid with month labels on top and day labels on left */}
            <div className="min-w-fit">
              {/* Month labels bar */}
              <div className="flex text-[10px] font-bold text-slate-400 h-4 relative mb-1 select-none pointer-events-none">
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

              <div className="flex gap-1 items-start">
                <div className="grid grid-rows-7 gap-1 text-[9.5px] font-bold text-slate-400 select-none pt-0.5 w-7 shrink-0">
                  <div className="h-[14px] flex items-center leading-none">Mon</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px] flex items-center leading-none">Wed</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px] flex items-center leading-none">Fri</div>
                  <div className="h-[14px]" />
                  <div className="h-[14px]" />
                </div>

                <div className="flex gap-1 flex-1">
                  {learnWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {week.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          onMouseEnter={() => {
                            if (cell.dayNum && cell.dateStr) {
                              setHoveredMatrixDay({
                                dateStr: cell.dateStr,
                                dayNum: cell.dayNum,
                                count: cell.count,
                                type: 'learnings',
                                isToday: cell.isToday,
                              });
                            }
                          }}
                          className={`w-[13px] h-[13px] sm:w-[14px] sm:h-[14px] rounded-[3px] border transition-all duration-150 cursor-pointer ${getLearnCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-[#141417]' : ''
                          } hover:ring-2 hover:ring-emerald-500/80 hover:scale-125 hover:z-20`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Legend & Totals */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <Flame size={13} className="text-orange-500" />
            <span>Active Days ({rangeLabel}):</span>
            <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{periodActiveDays} Days</strong>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-blue-600 shadow-2xs shadow-blue-500/40" />
              <span>Job Applications</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 shadow-2xs shadow-emerald-500/40" />
              <span>Daily Learnings</span>
            </span>

            {/* Less -> More Scale */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[3px] bg-slate-200/70 dark:bg-[#1b2230] border border-slate-300/40 dark:border-white/5" />
              <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-200 dark:bg-[#064e3b]" />
              <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 dark:bg-[#059669]" />
              <span className="w-2.5 h-2.5 rounded-[3px] bg-emerald-600 dark:bg-[#10b981]" />
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
