import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DayData {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  inCurrentMonth: boolean;
  minutes: number;
  count: number;
  titles: string[];
  isToday: boolean;
}

export const MonthlyContributionHeatmap: React.FC = () => {
  const { learnings, gamification } = useApp();

  // Navigation state: year & month (0-indexed, default: current month)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [activeDay, setActiveDay] = useState<DayData | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysFullNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];

  // Quick navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setActiveDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setActiveDay(null);
  };

  const handleResetToToday = () => {
    setCurrentDate(new Date());
    setActiveDay(null);
  };

  // Build mapping of date -> learning items + week punchcard activity
  const dateMap = useMemo(() => {
    const map: Record<string, { minutes: number; count: number; titles: string[] }> = {};

    // 1. Incorporate logged learnings
    learnings.forEach(l => {
      if (!l.date_logged) return;
      const key = l.date_logged.slice(0, 10);
      if (!map[key]) {
        map[key] = { minutes: 0, count: 0, titles: [] };
      }
      map[key].minutes += Number(l.duration_minutes) || 0;
      map[key].count += 1;
      if (l.title && !map[key].titles.includes(l.title)) {
        map[key].titles.push(l.title);
      }
    });

    // 2. Incorporate week punchcard active days if streak exists
    if (gamification?.weekPunchcard) {
      gamification.weekPunchcard.forEach(p => {
        if (p.active && p.date) {
          const key = p.date.slice(0, 10);
          if (!map[key]) {
            map[key] = { minutes: 45, count: 1, titles: ['Daily Focus Study Sprint'] };
          }
        }
      });
    }

    return map;
  }, [learnings, gamification]);

  // Construct GitHub-style weeks matrix for the selected single month
  const { weeks, monthTotalMinutes, activeDaysCount, daysInMonth } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    const todayStr = new Date().toISOString().slice(0, 10);

    let totalMinutes = 0;
    let activeDays = 0;

    // Start day of week (0 = Sun, 1 = Mon...)
    const startDayOfWeek = firstDayOfMonth.getDay();

    const dayCells: DayData[] = [];

    // Prepend placeholder days before the 1st
    for (let i = 0; i < startDayOfWeek; i++) {
      dayCells.push({
        dateStr: '',
        dayNumber: 0,
        dayOfWeek: i,
        inCurrentMonth: false,
        minutes: 0,
        count: 0,
        titles: [],
        isToday: false,
      });
    }

    // Actual days of this single month
    for (let d = 1; d <= totalDays; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = dateMap[dStr] || { minutes: 0, count: 0, titles: [] };
      const currentDayOfWeek = new Date(year, month, d).getDay();
      const isToday = dStr === todayStr;

      if (dayData.minutes > 0 || dayData.count > 0) {
        totalMinutes += dayData.minutes;
        activeDays += 1;
      }

      dayCells.push({
        dateStr: dStr,
        dayNumber: d,
        dayOfWeek: currentDayOfWeek,
        inCurrentMonth: true,
        minutes: dayData.minutes,
        count: dayData.count,
        titles: dayData.titles,
        isToday,
      });
    }

    // Append placeholder days to complete the last week column
    const remainder = dayCells.length % 7;
    if (remainder !== 0) {
      const needed = 7 - remainder;
      for (let i = 0; i < needed; i++) {
        dayCells.push({
          dateStr: '',
          dayNumber: 0,
          dayOfWeek: (remainder + i) % 7,
          inCurrentMonth: false,
          minutes: 0,
          count: 0,
          titles: [],
          isToday: false,
        });
      }
    }

    // Group into columns of weeks (each column has 7 days: Sun-Sat)
    const weeksList: DayData[][] = [];
    for (let i = 0; i < dayCells.length; i += 7) {
      weeksList.push(dayCells.slice(i, i + 7));
    }

    return {
      weeks: weeksList,
      monthTotalMinutes: totalMinutes,
      activeDaysCount: activeDays,
      daysInMonth: totalDays,
    };
  }, [year, month, dateMap]);

  // GitHub contribution color level (0 - 4)
  const getLevel = (minutes: number, count: number): 0 | 1 | 2 | 3 | 4 => {
    if (minutes <= 0 && count <= 0) return 0;
    if (minutes <= 30 || count === 1) return 1;
    if (minutes <= 60 || count === 2) return 2;
    if (minutes <= 120) return 3;
    return 4;
  };

  const getLevelClass = (lvl: number, isToday: boolean) => {
    if (lvl === 0) {
      return isToday
        ? 'bg-orange-500/10 border-orange-500/50 text-orange-600 dark:text-orange-400'
        : 'bg-slate-100 dark:bg-white/[0.04] border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-300';
    }
    if (lvl === 1) {
      return 'bg-emerald-200 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300';
    }
    if (lvl === 2) {
      return 'bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600 text-white';
    }
    if (lvl === 3) {
      return 'bg-emerald-500 dark:bg-emerald-500 border-emerald-600 dark:border-emerald-400 text-white';
    }
    return 'bg-emerald-600 dark:bg-emerald-400 border-emerald-400 dark:border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.35)] text-white';
  };

  // Format date accurately without UTC timezone shifting
  const formatDateLabel = (day: DayData) => {
    const dayName = daysFullNames[day.dayOfWeek] || '';
    const monthName = monthNames[month] || '';
    return `${dayName}, ${monthName} ${day.dayNumber}, ${year}`;
  };

  const daysLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const isViewingCurrentMonth = (() => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() === month;
  })();

  const monthHours = (monthTotalMinutes / 60).toFixed(1);

  return (
    <div
      onMouseLeave={() => setActiveDay(null)}
      className="relative rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#141417]/90 p-4 shadow-xs backdrop-blur-xl space-y-3 select-none"
    >
      {/* 1. Month Navigation & Overview Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Previous month"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-orange-500" />
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white m-0 tracking-tight">
              {monthNames[month]} {year}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Contribution Matrix
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Next month"
            aria-label="Next month"
          >
            <ChevronRight size={15} />
          </button>

          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={handleResetToToday}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer"
            >
              Today
            </button>
          )}
        </div>

        {/* Month Overview Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-[11px]">
            <Flame size={12} className="text-orange-500" />
            <span className="text-slate-500">Active:</span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
              {activeDaysCount}/{daysInMonth}d
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-[11px]">
            <Clock size={12} className="text-blue-500" />
            <span className="text-slate-500">Focus:</span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
              {monthHours}h
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-[11px]">
            <BookOpen size={12} className="text-purple-500" />
            <span className="text-slate-500">Notes:</span>
            <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
              {Object.values(dateMap).reduce((sum, item) => sum + item.count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Live Active Day & Count Banner - Immediately displays Day & Count on hover */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/10 text-xs min-h-[40px] transition-all">
        {activeDay ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar size={13} className="text-orange-500" />
              <span>{formatDateLabel(activeDay)}</span>
            </span>
            <span className="text-slate-400 font-bold">&bull;</span>
            <span
              className={`font-black px-2.5 py-0.5 rounded-lg text-xs shadow-2xs ${
                activeDay.count > 0 || activeDay.minutes > 0
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300'
              }`}
            >
              {activeDay.count} Note{activeDay.count === 1 ? '' : 's'} ({activeDay.minutes}m focus)
            </span>
            {activeDay.isToday && (
              <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 rounded">
                🔥 Today
              </span>
            )}
            {activeDay.titles.length > 0 && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm hidden sm:inline">
                &mdash; {activeDay.titles.join(', ')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
            <Sparkles size={13} className="text-orange-400" />
            <span>Hover over any day square in the matrix to view the day and count</span>
          </div>
        )}
      </div>

      {/* 3. GitHub-Style Single-Month Matrix Grid */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1">
        {/* Day-of-week labels (Sun - Sat) */}
        <div className="grid grid-rows-7 gap-1.5 shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center select-none">
          {daysLabels.map((lbl, idx) => (
            <div key={idx} className="h-6 w-3 flex items-center justify-center">
              {idx % 2 === 1 ? lbl : ''}
            </div>
          ))}
        </div>

        {/* Week columns (columns = weeks of that month, rows = days Sun-Sat) */}
        <div className="flex items-center gap-1.5">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1.5 shrink-0">
              {week.map((cell, dIdx) => {
                if (!cell.inCurrentMonth) {
                  return (
                    <div
                      key={dIdx}
                      className="h-6 w-6 rounded-md border border-dashed border-slate-200/30 dark:border-white/5 opacity-20 pointer-events-none"
                    />
                  );
                }

                const lvl = getLevel(cell.minutes, cell.count);
                const isHovered = activeDay?.dateStr === cell.dateStr;

                return (
                  <div
                    key={dIdx}
                    onMouseEnter={() => setActiveDay(cell)}
                    onClick={() => setActiveDay(cell)}
                    title={`${formatDateLabel(cell)}: ${
                      cell.minutes > 0 ? `${cell.count} notes, ${cell.minutes}m focus` : 'No study focus'
                    }`}
                    className={`relative group/cell h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-extrabold cursor-pointer transition-all duration-150 border ${getLevelClass(
                      lvl,
                      cell.isToday
                    )} ${
                      isHovered
                        ? 'ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-[#141417] z-20 brightness-110 shadow-sm'
                        : 'hover:brightness-105'
                    }`}
                  >
                    <span>{cell.dayNumber}</span>

                    {/* Today indicator pip */}
                    {cell.isToday && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-[#141417]" />
                    )}

                    {/* Instant Hover Tooltip attached right to this cell */}
                    <div
                      className={`hidden group-hover/cell:flex pointer-events-none absolute ${
                        dIdx <= 2 ? 'top-full mt-2.5' : 'bottom-full mb-2.5'
                      } ${
                        wIdx <= 1
                          ? 'left-0'
                          : wIdx >= weeks.length - 1
                          ? 'right-0'
                          : 'left-1/2 -translate-x-1/2'
                      } z-50 flex-col items-center whitespace-nowrap animate-in fade-in zoom-in-95 duration-100`}
                    >
                      {/* Arrow pointing up for top rows */}
                      {dIdx <= 2 && (
                        <div
                          className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-t border-l border-slate-700/80 dark:border-white/15 -mb-1 z-10 ${
                            wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= weeks.length - 1 ? 'self-end mr-2.5' : ''
                          }`}
                        />
                      )}

                      <div className="bg-slate-900/95 dark:bg-[#0b0f19]/95 text-white py-1.5 px-3 rounded-xl shadow-2xl border border-slate-700/80 dark:border-white/15 backdrop-blur-md flex flex-col gap-1 min-w-[130px]">
                        <div className="flex items-center justify-between gap-3 text-[10.5px]">
                          <span className="font-bold text-slate-300">
                            {formatDateLabel(cell)}
                          </span>
                          {cell.isToday && (
                            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/20 px-1 rounded">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-0.5 border-t border-white/10">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              cell.count > 0 || cell.minutes > 0
                                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                                : 'bg-slate-500'
                            } shrink-0`}
                          />
                          <span className="text-xs font-black text-white">
                            {cell.count > 0
                              ? `${cell.count} Note${cell.count === 1 ? '' : 's'}${cell.minutes > 0 ? ` (${cell.minutes}m)` : ''}`
                              : 'No study focus'}
                          </span>
                        </div>
                      </div>

                      {/* Arrow pointing down for bottom rows */}
                      {dIdx > 2 && (
                        <div
                          className={`w-2 h-2 rotate-45 bg-slate-900/95 dark:bg-[#0b0f19]/95 border-b border-r border-slate-700/80 dark:border-white/15 -mt-1 z-10 ${
                            wIdx <= 1 ? 'self-start ml-2.5' : wIdx >= weeks.length - 1 ? 'self-end mr-2.5' : ''
                          }`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected / Hovered Day Inspector Card */}
        <div className="ml-auto hidden sm:flex items-center min-w-[220px] max-w-[280px] shrink-0">
          {activeDay ? (
            <div className="w-full p-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.04] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  {formatDateLabel(activeDay)}
                </span>
                {activeDay.isToday && (
                  <span className="text-[9px] font-black uppercase text-orange-600 dark:text-orange-400 bg-orange-500/15 px-1 rounded">
                    Today
                  </span>
                )}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                <span>⏱️ {activeDay.minutes}m focus</span>
                <span>&middot;</span>
                <span>📚 {activeDay.count} note{activeDay.count === 1 ? '' : 's'}</span>
              </div>
              {activeDay.titles.length > 0 ? (
                <div className="space-y-0.5 pt-0.5">
                  {activeDay.titles.slice(0, 2).map((t, idx) => (
                    <p key={idx} className="text-[10px] text-slate-500 dark:text-slate-400 truncate m-0">
                      • {t}
                    </p>
                  ))}
                  {activeDay.titles.length > 2 && (
                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400">
                      +{activeDay.titles.length - 2} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic m-0">
                  No learning notes logged on this day
                </p>
              )}
            </div>
          ) : (
            <div className="w-full p-3 rounded-xl border border-dashed border-slate-200/80 dark:border-white/10 text-center text-[11px] text-slate-400 flex flex-col items-center justify-center">
              <Sparkles size={14} className="text-orange-400 mb-1" />
              <span>Hover over any day to inspect details</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Legend */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Sparkles size={11} className="text-emerald-500" />
          <span>Single-month focus contribution intensity</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-[10px] text-slate-400">Less</span>
          <div className="h-3 w-3 rounded-xs bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5" />
          <div className="h-3 w-3 rounded-xs bg-emerald-200 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800" />
          <div className="h-3 w-3 rounded-xs bg-emerald-400 dark:bg-emerald-700 border border-emerald-500 dark:border-emerald-600" />
          <div className="h-3 w-3 rounded-xs bg-emerald-500 dark:bg-emerald-500 border border-emerald-600 dark:border-emerald-400" />
          <div className="h-3 w-3 rounded-xs bg-emerald-600 dark:bg-emerald-400 border border-emerald-400" />
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
};
