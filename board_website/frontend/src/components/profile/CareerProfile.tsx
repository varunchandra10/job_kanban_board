import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Flame,
  Download,
  Database,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  Briefcase,
  Layers,
  Copy,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Sparkles,
  Calendar,
  Lock,
  LogIn,
} from 'lucide-react';

export const CareerProfile: React.FC = () => {
  const {
    profile,
    quickLinks,
    addQuickLink,
    removeQuickLink,
    gamification,
    applications,
    learnings,
    setIsDriveModalOpen,
    gdriveStatus,
    showToast,
    isAuthenticated,
    openAuthModal,
  } = useApp();

  // Momentum Activity Matrix Date controls
  const [momentumDate, setMomentumDate] = useState(() => new Date());
  const [hoveredMatrixDay, setHoveredMatrixDay] = useState<{
    dateStr: string;
    dayNum: number;
    count: number;
    type: 'applications' | 'learnings';
    isToday: boolean;
  } | null>(null);

  // Add / Edit Quick Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      openAuthModal();
    }
  }, [isAuthenticated, openAuthModal]);

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[60vh]">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 p-8 text-center shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
            Sign In to Access Career Hub
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Your career profile, tailored resume versions, activity heatmap, and personal Google Drive files are private and require an active session.
          </p>
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <LogIn size={16} strokeWidth={2.5} />
            <span>Sign In to Job Tracker</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedYear = momentumDate.getFullYear();
  const selectedMonth = momentumDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = [2024, 2025, 2026, 2027];

  const stepMonth = (offset: number) => {
    setMomentumDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
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

  // Copy Quick Link
  const copyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
    showToast('Copied link to clipboard');
  };

  // Open Link Modal (Add or Edit)
  const openAddLinkModal = () => {
    setEditingLinkId(null);
    setLinkTitle('');
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const openEditLinkModal = (link: { id: string; title: string; url: string }) => {
    setEditingLinkId(link.id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    if (editingLinkId) {
      removeQuickLink(editingLinkId);
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Link updated');
    } else {
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Quick link added');
    }
    setIsLinkModalOpen(false);
  };

  // Export applications to CSV
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

  // -------------------------------------------------------------
  // Activity Matrix Calculation
  // -------------------------------------------------------------
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const toYMD = (d: number) =>
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const todayYMD = new Date().toISOString().slice(0, 10);

  // Group applications and learnings by date string YYYY-MM-DD
  const appsByDate: Record<string, number> = {};
  applications.forEach(a => {
    const d = (a.date_applied || '').slice(0, 10);
    if (d) appsByDate[d] = (appsByDate[d] || 0) + 1;
  });

  const learningsByDate: Record<string, number> = {};
  learnings.forEach(l => {
    const d = (l.date_logged || '').slice(0, 10);
    if (d) learningsByDate[d] = (learningsByDate[d] || 0) + 1;
  });

  // Calculate month activities & active days
  let monthAppsTotal = 0;
  let monthLearningsTotal = 0;
  let monthActiveDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = toYMD(d);
    const appCnt = appsByDate[dateStr] || 0;
    const learnCnt = learningsByDate[dateStr] || 0;
    monthAppsTotal += appCnt;
    monthLearningsTotal += learnCnt;
    if (appCnt > 0 || learnCnt > 0) monthActiveDays++;
  }

  // Build weekly column structure (Monday=0 to Sunday=6)
  interface DayCellData {
    dayNum: number | null;
    dateStr: string | null;
    count: number;
    isToday: boolean;
  }

  const buildMonthGrid = (countMap: Record<string, number>) => {
    const weeks: DayCellData[][] = [];
    let currentWeek: DayCellData[] = [];

    // First day of month (0=Sun, 1=Mon, ..., 6=Sat)
    // Convert to Monday=0 .. Sunday=6
    const firstDayIndex = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;

    // Pad beginning of first week
    for (let p = 0; p < firstDayIndex; p++) {
      currentWeek.push({ dayNum: null, dateStr: null, count: 0, isToday: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toYMD(day);
      const count = countMap[dateStr] || 0;
      currentWeek.push({
        dayNum: day,
        dateStr,
        count,
        isToday: dateStr === todayYMD,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Pad end of last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dayNum: null, dateStr: null, count: 0, isToday: false });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const appWeeks = buildMonthGrid(appsByDate);
  const learnWeeks = buildMonthGrid(learningsByDate);

  const getAppCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    const c = cell.count;
    if (c === 0) return 'bg-[#ebedf0] dark:bg-[#1e293b] border-black/5 dark:border-white/5';
    if (c === 1) return 'bg-[#bfdbfe] dark:bg-[#1e3a5f] border-blue-300 dark:border-blue-700';
    if (c === 2) return 'bg-[#60a5fa] dark:bg-[#2563eb] border-blue-400 dark:border-blue-600';
    if (c === 3) return 'bg-[#2563eb] dark:bg-[#3b82f6] border-blue-600 dark:border-blue-500';
    return 'bg-[#1d4ed8] dark:bg-[#60a5fa] border-blue-800 dark:border-blue-400';
  };

  const getLearnCellClass = (cell: DayCellData) => {
    if (!cell.dayNum) return 'opacity-0 pointer-events-none';
    const c = cell.count;
    if (c === 0) return 'bg-[#ebedf0] dark:bg-[#1e293b] border-black/5 dark:border-white/5';
    if (c === 1) return 'bg-[#86efac] dark:bg-[#064e3b] border-emerald-300 dark:border-emerald-700';
    if (c === 2) return 'bg-[#34d399] dark:bg-[#059669] border-emerald-400 dark:border-emerald-600';
    if (c === 3) return 'bg-[#059669] dark:bg-[#10b981] border-emerald-600 dark:border-emerald-500';
    return 'bg-[#064e3b] dark:bg-[#34d399] border-emerald-900 dark:border-emerald-400';
  };

  // -------------------------------------------------------------
  // Pipeline Stats Calculation
  // -------------------------------------------------------------
  const totalApps = applications.length;
  const interviewingApps = applications.filter(a => a.stage === 'Interviewing').length;
  const offerApps = applications.filter(a => a.stage === 'Offer').length;
  const appliedApps = applications.filter(a => a.stage === 'Applied').length;
  const rejectedApps = applications.filter(a => a.stage === 'Rejected').length;
  const responseRate = totalApps > 0 ? (((interviewingApps + offerApps) / totalApps) * 100).toFixed(1) : '0';

  const pct = (val: number) => totalApps > 0 ? Math.round((val / totalApps) * 100) : 0;

  // Top locations
  const countryCounts: Record<string, number> = {};
  applications.forEach(a => {
    const c = a.country || 'Remote';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });
  const topLocations = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c, n]) => `${c} (${n})`)
    .join(', ') || 'Various';

  // -------------------------------------------------------------
  // Learnings Stats Calculation
  // -------------------------------------------------------------
  const streak = gamification.streak || 0;
  const studyHours = (gamification.totalMinutes / 60).toFixed(1);
  const totalXp = gamification.totalXP || 0;
  const currentRank = `Lvl ${gamification.level || 1}`;
  const totalTopics = learnings.length;

  // XP progress to next level (out of 500)
  const xpCurrentInLevel = totalXp % 500;
  const xpFillPercent = Math.min(100, Math.round((xpCurrentInLevel / 500) * 100));

  // Category distribution
  const catCounts = {
    'System Design': 0,
    'Algorithms / DSA': 0,
    'Web Dev': 0,
    'Cloud & Core': 0,
  };
  learnings.forEach(l => {
    const c = (l.category || '').toLowerCase();
    const t = (l.title || '').toLowerCase();
    if (c.includes('system') || t.includes('system') || t.includes('design')) catCounts['System Design']++;
    else if (c.includes('dsa') || c.includes('algo') || t.includes('tree') || t.includes('dp')) catCounts['Algorithms / DSA']++;
    else if (c.includes('cs') || c.includes('cloud') || c.includes('database')) catCounts['Cloud & Core']++;
    else catCounts['Web Dev']++;
  });

  const catPct = (cnt: number) => totalTopics > 0 ? Math.round((cnt / totalTopics) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 w-full">
      {/* 1. Profile Hero Card */}
      <section
        className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs transition-all"
        aria-label="Profile Hero Card"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* User Identity */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Avatar Circle */}
            <div className="flex h-16 w-16 sm:h-18 sm:w-18 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white font-extrabold text-xl sm:text-2xl shadow-md ring-4 ring-white dark:ring-[#141417]">
              {profile.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase() || 'VC'}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white m-0 truncate">
                {profile.full_name || 'Varun Chandra'}
              </h1>

              {/* Streak badge right below the name */}
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 font-bold text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/25 px-3 py-1 rounded-full shadow-2xs">
                  <Flame size={14} className="text-orange-500 animate-pulse" />
                  <span>{streak}-Day Focus Streak</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: G-Drive | Download as CSV | Download DB as ZIP */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {/* G-Drive Button */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              onClick={() => setIsDriveModalOpen(true)}
              title="Manage Your Google Drive Storage & Setup"
            >
              {/* Google Drive Tri-Color Icon */}
              <svg viewBox="0 0 87.3 78" width="16" height="14.3" className="shrink-0">
                <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L29 52.2H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
                <path d="M43.65 25.15L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.35.6-.55 1.2-.7 1.85h29z" fill="#00AC47" />
                <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H58.3L73.55 76.8z" fill="#EA4335" />
                <path d="M43.65 25.15L58.25 0H29.05l14.6 25.15z" fill="#00832D" />
                <path d="M58.3 52.2H29L13.75 76.8c1.35.8 2.85 1.2 4.45 1.2H69.1c1.6 0 3.1-.45 4.45-1.2z" fill="#2684FC" />
                <path d="M73.4 26.5L58.25 0c-1.35.8-2.5 1.9-3.3 3.3L43.65 25.15 58.3 52.2h29c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
              </svg>
              <span>G-Drive</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  gdriveStatus.connected ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-amber-500'
                }`}
                title={gdriveStatus.connected ? 'Google Drive Connected' : 'Google Drive Disconnected'}
              />
            </button>

            {/* Download as CSV Button */}
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-all shadow-xs cursor-pointer"
              onClick={exportToCSV}
              title="Export all Job Applications to CSV"
            >
              <Download size={14} className="text-emerald-500" />
              <span>Download as CSV</span>
            </button>

            {/* Download DB as ZIP Button */}
            <a
              href="/api/backup/export"
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-all shadow-xs no-underline"
              title="Download Full SQLite Database (.db) & Attached Resumes as ZIP"
            >
              <Database size={14} />
              <span>Download DB as ZIP</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. 2-Card Row: Left = Quick Links & Profiles | Right = Activity & Momentum Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Card: Quick Links & Profiles */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <ExternalLink size={16} className="text-indigo-600 dark:text-indigo-400" />
              <span>Quick Links &amp; Profiles</span>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              onClick={openAddLinkModal}
            >
              <Plus size={13} strokeWidth={2.5} />
              <span>Add Link</span>
            </button>
          </div>

          {/* Links List Container */}
          <div className="space-y-2.5 flex-1 max-h-[380px] overflow-y-auto pr-1">
            {quickLinks.map(link => {
              const isEmail = link.url.includes('@') && !link.url.startsWith('http');
              const href = isEmail ? `mailto:${link.url}` : link.url;

              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-500/20">
                      <ExternalLink size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {link.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {link.url}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Open / Copy / Edit / Delete */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-colors no-underline"
                    >
                      {isEmail ? 'Send ↗' : 'Open ↗'}
                    </a>

                    <button
                      type="button"
                      onClick={() => copyLink(link.url, link.id)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedLink === link.id ? (
                        <CheckCheck size={12} className="text-emerald-500 inline" />
                      ) : (
                        'Copy'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditLinkModal(link)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Link"
                    >
                      <Sparkles size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeQuickLink(link.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove Link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Card: Single Month Activity Matrix (Apps & Learnings separated) */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Briefcase size={16} className="text-blue-600" />
                <span>Activity &amp; Momentum</span>
              </div>
              <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{monthAppsTotal + monthLearningsTotal} activities in </span>
                <strong className="text-slate-900 dark:text-white font-bold">
                  {monthNames[selectedMonth]} {selectedYear}
                </strong>
              </div>
            </div>

            {/* Month & Year Controls */}
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

          {/* Live Hover Info Banner - Displays the exact Day and Count */}
          <div className="flex items-center justify-between px-3.5 py-2 mb-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-xs min-h-[40px] transition-all">
            {hoveredMatrixDay ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-500" />
                  <span>
                    {(() => {
                      const daysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                      const d = new Date(selectedYear, selectedMonth, hoveredMatrixDay.dayNum);
                      const dayOfWeek = daysNames[d.getDay()];
                      return `${dayOfWeek}, ${monthNames[selectedMonth]} ${hoveredMatrixDay.dayNum}, ${selectedYear}`;
                    })()}
                  </span>
                </span>
                <span className="text-slate-400 font-bold">&bull;</span>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-lg text-xs shadow-2xs ${
                    hoveredMatrixDay.type === 'applications'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : 'bg-emerald-600 text-white shadow-emerald-500/20'
                  }`}
                >
                  {hoveredMatrixDay.count}{' '}
                  {hoveredMatrixDay.type === 'applications'
                    ? `Job Application${hoveredMatrixDay.count === 1 ? '' : 's'}`
                    : `Learning Note${hoveredMatrixDay.count === 1 ? '' : 's'}`}
                </span>
                {hoveredMatrixDay.isToday && (
                  <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 rounded">
                    🔥 Today
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Hover over any day square in the matrix to view the day and count</span>
              </div>
            )}
          </div>

          {/* Dual Month Activity Blocks: Apps (Left) & Learnings (Right) */}
          <div
            onMouseLeave={() => setHoveredMatrixDay(null)}
            className="flex gap-4 sm:gap-6 items-stretch justify-around my-2.5 p-4 rounded-xl border border-slate-200/70 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] overflow-x-auto"
          >
            {/* Job Applications Block */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Briefcase size={13} />
                  <span>Job Applications</span>
                </span>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    monthAppsTotal > 0
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                      : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {monthAppsTotal} applications
                </span>
              </div>

              {/* Grid wrap with days legend (Mon, Wed, Fri) and week columns */}
              <div className="flex gap-2 items-start">
                <div className="grid grid-rows-7 gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 h-[148px] select-none">
                  <span className="row-start-1 leading-4">Mon</span>
                  <span className="row-start-3 leading-4">Wed</span>
                  <span className="row-start-5 leading-4">Fri</span>
                </div>

                <div className="flex gap-1.5 flex-1">
                  {appWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5">
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
                          title={
                            cell.dateStr
                              ? `${cell.dateStr}: ${cell.count} applications logged`
                              : ''
                          }
                          className={`relative group/cell w-4 h-4 rounded-xs border transition-all cursor-pointer ${getAppCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          } hover:ring-2 hover:ring-blue-500 hover:scale-125 z-10`}
                        >
                          {/* Instant Floating Tooltip */}
                          {cell.dayNum && (
                            <div className="hidden group-hover/cell:flex pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex-col items-center whitespace-nowrap">
                              <div className="bg-slate-900/95 dark:bg-[#1f1f23]/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-slate-700/60 dark:border-white/10 flex items-center gap-1.5">
                                <span>{cell.dayNum} {monthNames[selectedMonth]}:</span>
                                <span className="text-blue-400 font-extrabold">{cell.count} application{cell.count === 1 ? '' : 's'}</span>
                              </div>
                              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-[#1f1f23]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vertical divider */}
            <div className="w-px bg-slate-200 dark:bg-white/10 shrink-0" />

            {/* Daily Learnings Block */}
            <div className="flex flex-col gap-2.5 flex-1 min-w-[160px]">
              <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-slate-200/80 dark:border-white/10">
                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <BookOpen size={13} />
                  <span>Daily Learnings</span>
                </span>
                <span
                  className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                    monthLearningsTotal > 0
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  {monthLearningsTotal} learnings
                </span>
              </div>

              {/* Grid wrap with days legend (Mon, Wed, Fri) and week columns */}
              <div className="flex gap-2 items-start">
                <div className="grid grid-rows-7 gap-1.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 h-[148px] select-none">
                  <span className="row-start-1 leading-4">Mon</span>
                  <span className="row-start-3 leading-4">Wed</span>
                  <span className="row-start-5 leading-4">Fri</span>
                </div>

                <div className="flex gap-1.5 flex-1">
                  {learnWeeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col gap-1.5">
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
                          title={
                            cell.dateStr
                              ? `${cell.dateStr}: ${cell.count} learnings logged`
                              : ''
                          }
                          className={`relative group/cell w-4 h-4 rounded-xs border transition-all cursor-pointer ${getLearnCellClass(cell)} ${
                            cell.isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                          } hover:ring-2 hover:ring-emerald-500 hover:scale-125 z-10`}
                        >
                          {/* Instant Floating Tooltip */}
                          {cell.dayNum && (
                            <div className="hidden group-hover/cell:flex pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 flex-col items-center whitespace-nowrap">
                              <div className="bg-slate-900/95 dark:bg-[#1f1f23]/95 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-slate-700/60 dark:border-white/10 flex items-center gap-1.5">
                                <span>{cell.dayNum} {monthNames[selectedMonth]}:</span>
                                <span className="text-emerald-400 font-extrabold">{cell.count} learning{cell.count === 1 ? '' : 's'}</span>
                              </div>
                              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-[#1f1f23]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Legend & Stats */}
          <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Flame size={12} className="text-orange-500" />
              <span>Active Days:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 font-extrabold">{monthActiveDays} Days</strong>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-xs bg-[#2563eb]" /> Apps
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400">
                <span className="w-2 h-2 rounded-xs bg-[#10b981]" /> Learnings
              </span>

              {/* Less -> More Scale */}
              <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                <span>Less</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-[#ebedf0] dark:bg-[#1e293b]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#86efac] dark:bg-[#064e3b]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#34d399] dark:bg-[#059669]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669] dark:bg-[#10b981]" />
                <span className="w-2.5 h-2.5 rounded-xs bg-[#064e3b] dark:bg-[#34d399]" />
                <span>More</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Stats 2-Column: Job Applications Stats (Left) & Learnings Stats (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Panel 1: Job Applications Stats & Pipeline */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Briefcase size={16} className="text-blue-600" />
                <span>Job Applications Stats &amp; Pipeline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  {applications.length > 0 ? 'ACTIVE' : '0D'} APP STREAK
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                  {totalApps} TOTAL
                </span>
              </div>
            </div>

            {/* 4 Metric Boxes */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {totalApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Total Applied
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {interviewingApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Interviewing
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {offerApps}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Offers
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {responseRate}%
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Response Rate
                </div>
              </div>
            </div>

            {/* Stage Funnel Breakdown Bars */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Stage Funnel Breakdown
              </div>

              {/* Applied */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Applied ({appliedApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${pct(appliedApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(appliedApps)}%
                </span>
              </div>

              {/* Interviewing */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Interviewing ({interviewingApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${pct(interviewingApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(interviewingApps)}%
                </span>
              </div>

              {/* Offers */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Offers ({offerApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${pct(offerApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(offerApps)}%
                </span>
              </div>

              {/* Rejected */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-28 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Rejected ({rejectedApps})
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-300"
                    style={{ width: `${pct(rejectedApps)}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {pct(rejectedApps)}%
                </span>
              </div>
            </div>
          </div>

          {/* Sub-footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Top Locations: <strong className="text-slate-900 dark:text-white font-bold">{topLocations}</strong></span>
            <span>Archived/Rejected: <strong className="text-slate-900 dark:text-white font-bold">{rejectedApps}</strong></span>
          </div>
        </section>

        {/* Panel 2: Daily Learnings & Mastery Stats */}
        <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <BookOpen size={16} className="text-emerald-600" />
                <span>Daily Learnings &amp; Mastery Stats</span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                <Flame size={12} className="text-orange-500" />
                <span>{streak}D STREAK</span>
              </span>
            </div>

            {/* 4 Metric Boxes */}
            <div className="grid grid-cols-4 gap-2.5 mb-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-orange-600 dark:text-orange-400 tabular-nums">
                  {streak}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Active Streak
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {studyHours}h
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Study Time
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {totalXp}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Total XP
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2.5 text-center">
                <div className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                  {currentRank}
                </div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase mt-0.5">
                  Current Rank
                </div>
              </div>
            </div>

            {/* XP Progress Bar to Next Level */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <span>Rank Progress to Next Level</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                  {xpCurrentInLevel} / 500 XP
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${xpFillPercent}%` }}
                />
              </div>
            </div>

            {/* Topic Category Breakdown Bars */}
            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="text-[11.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Topic Category Breakdown
              </div>

              {/* System Design */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  System Design
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${catPct(catCounts['System Design'])}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {catPct(catCounts['System Design'])}%
                </span>
              </div>

              {/* Algorithms / DSA */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Algorithms / DSA
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${catPct(catCounts['Algorithms / DSA'])}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {catPct(catCounts['Algorithms / DSA'])}%
                </span>
              </div>

              {/* Web Dev */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Web Dev
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${catPct(catCounts['Web Dev'])}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {catPct(catCounts['Web Dev'])}%
                </span>
              </div>

              {/* Cloud & Core */}
              <div className="flex items-center gap-3 text-xs">
                <span className="w-32 text-slate-700 dark:text-slate-300 font-semibold truncate">
                  Cloud &amp; Core
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all duration-300"
                    style={{ width: `${catPct(catCounts['Cloud & Core'])}%` }}
                  />
                </div>
                <span className="w-10 text-right font-mono font-bold text-slate-900 dark:text-white text-[11.5px]">
                  {catPct(catCounts['Cloud & Core'])}%
                </span>
              </div>
            </div>
          </div>

          {/* Sub-footer */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Total Logs: <strong className="text-slate-900 dark:text-white font-bold">{totalTopics} Topics</strong></span>
            <span>Mastery Ratio: <strong className="text-slate-900 dark:text-white font-bold">100% Active</strong></span>
          </div>
        </section>
      </div>

      {/* Add / Edit Quick Link Modal (Matching linkModal in profile.html) */}
      {isLinkModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setIsLinkModalOpen(false)}
            aria-hidden="true"
          />

          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141417] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  {editingLinkId ? 'Edit Quick Link' : 'Add Quick Link'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Portfolio, GitHub, LeetCode"
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    autoFocus
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    URL / Email *
                  </label>
                  <input
                    type="text"
                    placeholder="https://... or user@example.com"
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setIsLinkModalOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Save Link</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
