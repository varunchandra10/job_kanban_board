import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Clock,
  Zap,
  Plus,
  List,
  Grid,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const {
    applications,
    learnings,
    openEditAppModal,
    openEditLearningModal,
    openAddAppModal,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [mobileView, setMobileView] = useState<'agenda' | 'grid'>('agenda');

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // First day of current month (0=Sun, 1=Mon, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const toYMD = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().slice(0, 10));
  };

  // Trailing previous month days
  const prevDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevDays.push(daysInPrevMonth - i);
  }

  // Days in current month
  const currentMonthDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    currentMonthDays.push(d);
  }

  // Leading next month days
  const totalCells = firstDayIndex + daysInMonth;
  const remCells = (7 - (totalCells % 7)) % 7;
  const nextDays = [];
  for (let d = 1; d <= remCells; d++) {
    nextDays.push(d);
  }

  // Selected date events
  const selectedApplied = applications.filter(a => a.date_applied === selectedDateStr);
  const selectedDue = applications.filter(a => a.deadline === selectedDateStr);
  const selectedLearnings = learnings.filter(
    l => (l.date_logged || '').slice(0, 10) === selectedDateStr
  );
  const totalSelectedEvents = selectedApplied.length + selectedDue.length + selectedLearnings.length;

  // Format selected date nicely
  const formattedSelectedDate = (() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDateStr;
    }
  })();

  const isSelectedToday = selectedDateStr === todayStr;

  return (
    <div className="flex-1 w-full max-w-[1700px] mx-auto p-2.5 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/10 rounded-2xl p-3 sm:p-5 shadow-xs">
        {/* Calendar Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-blue-600 dark:text-indigo-400 shrink-0" />
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">
                {monthNames[month]} {year}
              </h2>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-2.5 py-0.5 sm:py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-4">
            {/* Legend */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span className="hidden xs:inline">Applied</span>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                <span className="hidden xs:inline">Deadline</span>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                <span className="hidden xs:inline">Learning</span>
              </span>
            </div>

            {/* Mobile View Toggle: Agenda vs Full Grid */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 md:hidden">
              <button
                type="button"
                onClick={() => setMobileView('agenda')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  mobileView === 'agenda'
                    ? 'bg-white dark:bg-[#1e1e24] text-blue-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="Agenda & Month View"
              >
                <List size={12} />
                <span>Agenda</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileView('grid')}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  mobileView === 'grid'
                    ? 'bg-white dark:bg-[#1e1e24] text-blue-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
                title="Scrollable Full Grid View"
              >
                <Grid size={12} />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 1. MOBILE AGENDA VIEW (Compact Month Matrix + Selected Day Details) ─── */}
        <div className={`flex flex-col gap-4 ${mobileView === 'agenda' ? 'block md:hidden' : 'hidden'}`}>
          {/* Compact Month Matrix */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-xl p-2.5">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div
                  key={i}
                  className="text-[11px] font-bold text-slate-400 dark:text-slate-500 py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Previous month trailing */}
              {prevDays.map((d, idx) => (
                <div
                  key={`prev-m-${idx}`}
                  className="h-10 sm:h-11 rounded-lg flex flex-col items-center justify-center opacity-30 select-none text-xs text-slate-400"
                >
                  <span>{d}</span>
                </div>
              ))}

              {/* Current Month Days */}
              {currentMonthDays.map(d => {
                const dateStr = toYMD(year, month, d);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDateStr;

                const appliedApps = applications.filter(a => a.date_applied === dateStr);
                const dueApps = applications.filter(a => a.deadline === dateStr);
                const dayLearnings = learnings.filter(
                  l => (l.date_logged || '').slice(0, 10) === dateStr
                );

                const hasEvents = appliedApps.length > 0 || dueApps.length > 0 || dayLearnings.length > 0;

                return (
                  <button
                    key={`m-day-${d}`}
                    type="button"
                    onClick={() => setSelectedDateStr(dateStr)}
                    className={`h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-blue-600 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-500/20 text-blue-600 dark:text-indigo-400 font-extrabold shadow-xs ring-2 ring-blue-500/20'
                        : isToday
                        ? 'border-blue-300 dark:border-blue-500/40 bg-white dark:bg-white/5 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-transparent hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-xs">{d}</span>

                    {/* Indicator dots */}
                    {hasEvents && (
                      <div className="flex items-center justify-center gap-0.5 mt-0.5">
                        {appliedApps.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                        )}
                        {dueApps.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0" />
                        )}
                        {dayLearnings.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400 shrink-0" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Next Month Days */}
              {nextDays.map((d, idx) => (
                <div
                  key={`next-m-${idx}`}
                  className="h-10 sm:h-11 rounded-lg flex flex-col items-center justify-center opacity-30 select-none text-xs text-slate-400"
                >
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Day Agenda Detail Card */}
          <div className="bg-slate-50/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/60 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formattedSelectedDate}
                </span>
                {isSelectedToday && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-blue-600 text-white tracking-wider">
                    TODAY
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => openAddAppModal(selectedDateStr)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-all cursor-pointer shrink-0"
                title="Add Application for this date"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>Add</span>
              </button>
            </div>

            {/* Event List for selected day */}
            {totalSelectedEvents === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <CalendarIcon size={24} className="text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  No applications, deadlines, or learnings on this date.
                </p>
                <button
                  type="button"
                  onClick={() => openAddAppModal(selectedDateStr)}
                  className="text-xs font-bold text-blue-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  + Add job applied on this date
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Applied applications */}
                {selectedApplied.map(app => (
                  <div
                    key={`mob-app-${app.id}`}
                    onClick={() => openEditAppModal(app)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-500/20 bg-white dark:bg-blue-500/5 hover:border-blue-400 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                        <Briefcase size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {app.company}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {app.role || 'Application'} {app.city ? `· ${app.city}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30">
                      Applied
                    </span>
                  </div>
                ))}

                {/* Deadlines */}
                {selectedDue.map(app => (
                  <div
                    key={`mob-due-${app.id}`}
                    onClick={() => openEditAppModal(app)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-500/20 bg-white dark:bg-amber-500/5 hover:border-amber-400 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
                        <Clock size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {app.company}
                        </div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">
                          Deadline due today
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/30">
                      Due
                    </span>
                  </div>
                ))}

                {/* Learnings */}
                {selectedLearnings.map(l => (
                  <div
                    key={`mob-learn-${l.id}`}
                    onClick={() => openEditLearningModal(l)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-orange-200/80 dark:border-orange-500/20 bg-white dark:bg-orange-500/5 hover:border-orange-400 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-500/20">
                        <Zap size={15} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {l.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {l.category} {l.duration_minutes ? `· ${l.duration_minutes}m` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-500/30">
                      Learning
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── 2. DESKTOP & EXPANDED MOBILE GRID VIEW ─── */}
        <div
          className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            mobileView === 'grid' ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="min-w-[620px] md:min-w-full">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div
                  key={d}
                  className="text-center text-xs font-bold uppercase tracking-wider py-1.5 sm:py-2 text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {/* Previous month trailing cells */}
              {prevDays.map((d, idx) => (
                <div
                  key={`prev-${idx}`}
                  className="min-h-[85px] sm:min-h-[110px] p-2 rounded-xl border border-dashed border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.01] opacity-35 select-none"
                >
                  <span className="text-xs font-bold text-slate-400">{d}</span>
                </div>
              ))}

              {/* Current month days */}
              {currentMonthDays.map(d => {
                const dateStr = toYMD(year, month, d);
                const isToday = dateStr === todayStr;

                const appliedApps = applications.filter(a => a.date_applied === dateStr);
                const dueApps = applications.filter(a => a.deadline === dateStr);
                const dayLearnings = learnings.filter(
                  l => (l.date_logged || '').slice(0, 10) === dateStr
                );

                return (
                  <div
                    key={dateStr}
                    className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 sm:gap-1.5 ${
                      isToday
                        ? 'border-blue-500 dark:border-indigo-500 bg-blue-50/40 dark:bg-indigo-500/10 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200/90 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] hover:border-blue-400/70 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-[#17171c]'
                    }`}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('.event-pill')) return;
                      openAddAppModal(dateStr);
                    }}
                    title="Click empty space to add an application on this date"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={`text-xs font-bold ${
                          isToday
                            ? 'text-blue-600 dark:text-indigo-400 font-extrabold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {d}
                      </span>
                      {isToday && (
                        <span className="text-[8px] sm:text-[9px] font-black uppercase px-1 sm:px-1.5 py-0.2 rounded-full bg-blue-600 text-white tracking-wider">
                          TODAY
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {/* Applied jobs */}
                      {appliedApps.map(app => (
                        <div
                          key={`app-${app.id}`}
                          className="event-pill flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-bold truncate hover:opacity-90 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            openEditAppModal(app);
                          }}
                          title={`Applied: ${app.company} - ${app.role}`}
                        >
                          <Briefcase size={10} className="shrink-0" />
                          <span className="truncate">{app.company}</span>
                        </div>
                      ))}

                      {/* Deadline jobs */}
                      {dueApps.map(app => (
                        <div
                          key={`due-${app.id}`}
                          className="event-pill flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold truncate hover:opacity-90 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            openEditAppModal(app);
                          }}
                          title={`Deadline: ${app.company}`}
                        >
                          <Clock size={10} className="shrink-0" />
                          <span className="truncate">{app.company} Due</span>
                        </div>
                      ))}

                      {/* Daily Learnings */}
                      {dayLearnings.map(l => (
                        <div
                          key={`learn-${l.id}`}
                          className="event-pill flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-700 dark:text-orange-300 text-[10px] font-bold truncate hover:opacity-90 cursor-pointer"
                          onClick={e => {
                            e.stopPropagation();
                            openEditLearningModal(l);
                          }}
                          title={`Learning: ${l.title}`}
                        >
                          <Zap size={10} className="shrink-0 text-orange-500" />
                          <span className="truncate">{l.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Next month leading cells */}
              {nextDays.map((d, idx) => (
                <div
                  key={`next-${idx}`}
                  className="min-h-[85px] sm:min-h-[110px] p-2 rounded-xl border border-dashed border-slate-200/50 dark:border-white/5 bg-slate-50/20 dark:bg-white/[0.01] opacity-35 select-none"
                >
                  <span className="text-xs font-bold text-slate-400">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
