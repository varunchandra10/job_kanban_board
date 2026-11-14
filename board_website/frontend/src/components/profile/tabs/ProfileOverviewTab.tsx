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

interface HoveredHeatmapDay {
  dateStr: string;
  appsCount: number;
  studyCount: number;
  dsaCount: number;
  totalCount: number;
  dayOfWeek: number;
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
    setIsDriveModalOpen,
  } = useApp();

  const [hoveredDay, setHoveredDay] = useState<HoveredHeatmapDay | null>(null);
  const [isTrophyRoadOpen, setIsTrophyRoadOpen] = useState(false);

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

  // 3. 365-Day / 52-Week GitHub Style Heatmap Calculation
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const todayYMD = today.toISOString().slice(0, 10);

    // Group Applications by date
    const appsMap: Record<string, number> = {};
    applications.forEach(a => {
      const d = (a.date_applied || (a as any).created_at || '').slice(0, 10);
      if (d) appsMap[d] = (appsMap[d] || 0) + 1;
    });

    // Group Learnings by date
    const learningsMap: Record<string, number> = {};
    learnings.forEach(l => {
      const d = (l.date_logged || (l as any).date || '').slice(0, 10);
      if (d) learningsMap[d] = (learningsMap[d] || 0) + 1;
    });

    // Group Solved DSA by date
    const dsaMap: Record<string, number> = {};
    Object.values(dsaProgress || {}).forEach(prog => {
      if (prog.status === 'solved' && prog.updated_at) {
        const d = prog.updated_at.slice(0, 10);
        dsaMap[d] = (dsaMap[d] || 0) + 1;
      }
    });

    // We generate 52 weeks (364 days). Week starts on Sunday (day 0) to Saturday (day 6).
    const weeks: Array<Array<{
      dateStr: string;
      appsCount: number;
      studyCount: number;
      dsaCount: number;
      totalCount: number;
      dayOfWeek: number;
      isToday: boolean;
      month: number;
      dayNum: number;
    }>> = [];

    // Find the end date: this Saturday or today
    const daysFromSunday = today.getDay(); // 0 = Sun, 6 = Sat
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (6 - daysFromSunday));

    // Start date is 52 weeks back from endOfWeek
    const totalDays = 52 * 7;
    const startDate = new Date(endOfWeek);
    startDate.setDate(endOfWeek.getDate() - totalDays + 1);

    const monthHeaders: Array<{ weekIdx: number; monthName: string }> = [];
    let lastMonth = -1;

    let currentDayIter = new Date(startDate);
    let currentWeek: any[] = [];

    for (let i = 0; i < totalDays; i++) {
      const dateStr = currentDayIter.toISOString().slice(0, 10);
      const m = currentDayIter.getMonth();
      const dayNum = currentDayIter.getDate();
      const dayOfWeek = currentDayIter.getDay();

      const appsCount = appsMap[dateStr] || 0;
      const studyCount = learningsMap[dateStr] || 0;
      const dsaCount = dsaMap[dateStr] || 0;
      const totalCount = appsCount + studyCount + dsaCount;
      const isToday = dateStr === todayYMD;

      currentWeek.push({
        dateStr,
        appsCount,
        studyCount,
        dsaCount,
        totalCount,
        dayOfWeek,
        isToday,
        month: m,
        dayNum,
      });

      if (dayOfWeek === 6 || i === totalDays - 1) {
        const weekIdx = weeks.length;
        if (m !== lastMonth) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          monthHeaders.push({ weekIdx, monthName: monthNames[m] });
          lastMonth = m;
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDayIter.setDate(currentDayIter.getDate() + 1);
    }

    let activeDaysCount = 0;
    let totalContributions = 0;
    weeks.forEach(week => {
      week.forEach(day => {
        if (day.totalCount > 0) {
          activeDaysCount++;
          totalContributions += day.totalCount;
        }
      });
    });

    return {
      weeks,
      monthHeaders,
      activeDaysCount,
      totalContributions,
    };
  }, [applications, learnings, dsaProgress]);

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

  // Top Category Bars for DSA
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

      {/* 2. FULL-WIDTH GITHUB-STYLE 365-DAY CONTRIBUTION HEATMAP */}
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4"
        aria-label="GitHub-Style Contribution Heatmap"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Calendar size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                  Activity &amp; Consistency Heatmap
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  52 Weeks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Every job applied, learning logged, and DSA problem conquered across the past 365 days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                {heatmapData.totalContributions} Contributions
              </div>
              <div className="text-[10px] text-slate-400">
                {heatmapData.activeDaysCount} Active Days in past year
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid Container (Scrollable horizontally on smaller mobile screens) */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[780px] space-y-1.5">
            
            {/* Month Labels Bar */}
            <div className="flex text-[10px] font-bold text-slate-400 pl-8 h-4 relative">
              {heatmapData.monthHeaders.map((hdr, i) => (
                <span
                  key={i}
                  style={{ left: `${(hdr.weekIdx * 14.8) + 32}px` }}
                  className="absolute transform -translate-x-1"
                >
                  {hdr.monthName}
                </span>
              ))}
            </div>

            {/* Matrix: Day Labels on Left + 52 Week Columns */}
            <div className="flex items-start gap-2">
              {/* Day-of-week labels */}
              <div className="flex flex-col justify-between h-[100px] text-[9.5px] font-semibold text-slate-400 pr-1 select-none">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* 52 Columns */}
              <div className="flex gap-1 flex-1">
                {heatmapData.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((cell, cIdx) => {
                      // Color Scale
                      let cellColor = 'bg-slate-100 dark:bg-white/[0.04] border-slate-200/60 dark:border-white/5';
                      if (cell.totalCount === 1) {
                        cellColor = 'bg-emerald-500/30 border-emerald-500/40 text-emerald-400';
                      } else if (cell.totalCount === 2 || cell.totalCount === 3) {
                        cellColor = 'bg-emerald-500/65 border-emerald-500/70 text-emerald-200 shadow-2xs';
                      } else if (cell.totalCount >= 4) {
                        cellColor = 'bg-emerald-500 border-emerald-400 text-white shadow-xs shadow-emerald-500/40';
                      }

                      return (
                        <div
                          key={cIdx}
                          onMouseEnter={() => setHoveredDay(cell)}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`w-[12px] h-[12px] sm:w-[13px] sm:h-[13px] rounded-[3px] border transition-all duration-150 cursor-pointer ${cellColor} ${
                            cell.isToday ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#141417]' : ''
                          } hover:ring-2 hover:ring-emerald-400 hover:scale-125 hover:z-20`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip & Legend Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs">
          {/* Tooltip Content or Default Prompt */}
          <div className="min-h-[22px] flex items-center gap-2">
            {hoveredDay ? (
              <div className="flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-100">
                <span className="text-slate-900 dark:text-white font-mono font-bold">
                  {hoveredDay.dateStr}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {hoveredDay.totalCount} {hoveredDay.totalCount === 1 ? 'activity' : 'activities'}
                </span>
                <span className="text-slate-400 text-[11px]">
                  ({hoveredDay.appsCount} apps, {hoveredDay.studyCount} notes, {hoveredDay.dsaCount} DSA)
                </span>
                {hoveredDay.isToday && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.2 rounded-md">
                    Today
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 text-xs">
                Hover over any day to inspect applications, study notes, and DSA solved.
              </span>
            )}
          </div>

          {/* Scale Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 self-end sm:self-center">
            <span>Less</span>
            <span className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500/30 border border-emerald-500/40" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500/65 border border-emerald-500/70" />
            <span className="w-3 h-3 rounded-[3px] bg-emerald-500 border border-emerald-400" />
            <span>More</span>
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
            <div className="grid grid-cols-4 gap-2">
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

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
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

          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Retention Rule: <strong>1-4-7 Day System</strong></span>
            <span>Permanent Mastered: <strong>{masteredDsaCount} Problems</strong></span>
          </div>
        </section>
      </div>

      {/* 4. CARD C: CAREER MASTERY & TROPHY ROAD (Collapsible) */}
      <section
        className={`relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-4 sm:p-6 shadow-xs transition-all duration-300 ${
          isTrophyRoadOpen ? 'space-y-6' : 'space-y-0'
        }`}
        aria-label="Career Mastery & Trophy Road"
      >
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            isTrophyRoadOpen ? 'pb-4 border-b border-slate-100 dark:border-white/5' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 text-amber-500 shadow-inner">
              <Trophy size={19} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                  Career Mastery &amp; Trophy Road
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                  7 Ranks
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 line-clamp-1">
                Ascend the ranks by submitting applications, logging technical study, and mastering algorithms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 font-black text-xs px-2.5 sm:px-3 py-1 rounded-full border shadow-2xs ${currentTierConfig.bg} ${currentTierConfig.border} ${currentTierConfig.text}`}
            >
              <Tier3DIcon tier={userLevel} size={15} className="shrink-0" />
              <span>Level {userLevel}: {currentTierConfig.title}</span>
            </span>

            <button
              type="button"
              onClick={() => setIsTrophyRoadOpen(prev => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <span>{isTrophyRoadOpen ? 'Hide Ranks' : 'View Trophy Road'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 text-slate-400 ${
                  isTrophyRoadOpen ? 'rotate-180 text-amber-500' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {isTrophyRoadOpen && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
                const cfg = TROPHY_TIER_CONFIG[lvl];
                const isUnlocked = lvl <= userLevel;
                const isCurrent = lvl === userLevel;

                return (
                  <div
                    key={lvl}
                    className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                      isCurrent
                        ? `${cfg.bg} ${cfg.border} ring-2 ring-indigo-500/40 shadow-md scale-[1.02]`
                        : isUnlocked
                        ? 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10'
                        : 'bg-slate-50/40 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md font-mono text-slate-500 dark:text-slate-400">
                        L{lvl}
                      </span>
                      {isCurrent ? (
                        <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">
                          <Lock size={9} />
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center text-center my-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-1.5">
                        <Tier3DIcon
                          tier={lvl}
                          size={36}
                          className={isUnlocked ? '' : 'opacity-30 grayscale'}
                        />
                      </div>
                      <h4 className="text-xs font-black truncate max-w-full m-0 text-slate-900 dark:text-white">
                        {cfg.title}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                        {cfg.min} - {cfg.max > 5000 ? '5k+' : cfg.max} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

    </div>
  );
};
