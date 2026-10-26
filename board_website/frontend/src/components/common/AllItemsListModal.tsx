import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { CompanyLogo } from '../common/CompanyLogo';
import { STAGES, STAGE_CONFIG } from '../../utils/constants';
import {
  Briefcase,
  BookOpen,
  Search,
  X,
  Clock,
  Plus,
  ArrowRight,
} from 'lucide-react';

export const AllItemsListModal: React.FC = () => {
  const location = useLocation();
  const {
    isQuickListOpen,
    quickListInitialFilter,
    closeQuickList,
    applications,
    learnings,
    learningTracks,
    openEditAppModal,
    openEditLearningModal,
    openAddAppModal,
    openAddLearningModal,
  } = useApp();

  const isLearnings = location.pathname === '/learnings';

  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('All');
  const [selectedTrack, setSelectedTrack] = useState<string>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input and set initial stage/track filter when modal opens
  useEffect(() => {
    if (isQuickListOpen) {
      setSearch('');
      setSelectedStage(quickListInitialFilter || 'All');
      setSelectedTrack(quickListInitialFilter || 'All');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isQuickListOpen, isLearnings, quickListInitialFilter]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickListOpen) {
        closeQuickList();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickListOpen, closeQuickList]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    if (isLearnings) return [];
    return applications.filter(app => {
      // Stage filter
      if (selectedStage !== 'All' && app.stage !== selectedStage) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCo = (app.company || '').toLowerCase().includes(q);
        const matchRole = (app.role || '').toLowerCase().includes(q);
        const matchCity = (app.city || '').toLowerCase().includes(q);
        const matchCountry = (app.country || '').toLowerCase().includes(q);
        const matchTags = (app.custom_tags || '').toLowerCase().includes(q);
        const matchNotes = (app.recruiter_notes || '').toLowerCase().includes(q);
        if (!matchCo && !matchRole && !matchCity && !matchCountry && !matchTags && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [isLearnings, applications, selectedStage, search]);

  // Available tracks merged from custom tracks and existing learning notes
  const availableTracks = useMemo(() => {
    const trackMap = new Map<string, { id: string; name: string; color: string }>();
    learningTracks.forEach(t => {
      trackMap.set(t.name.toLowerCase(), { id: t.id, name: t.name, color: t.color || '#f59e0b' });
    });
    learnings.forEach(l => {
      if (l.category && !trackMap.has(l.category.toLowerCase())) {
        trackMap.set(l.category.toLowerCase(), {
          id: l.category,
          name: l.category,
          color: '#3b82f6',
        });
      }
    });
    return Array.from(trackMap.values());
  }, [learningTracks, learnings]);

  // Filtered learnings
  const filteredLearnings = useMemo(() => {
    if (!isLearnings) return [];
    return learnings.filter(l => {
      // Track filter
      if (selectedTrack !== 'All') {
        const cat = (l.category || '').toLowerCase();
        const sel = selectedTrack.toLowerCase();
        if (cat !== sel) return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = (l.title || '').toLowerCase().includes(q);
        const matchTopic = (l.topic || '').toLowerCase().includes(q);
        const matchNotes = (l.notes || '').toLowerCase().includes(q);
        const matchTags = (l.tags || '').toLowerCase().includes(q);
        if (!matchTitle && !matchTopic && !matchNotes && !matchTags) {
          return false;
        }
      }
      return true;
    });
  }, [isLearnings, learnings, selectedTrack, search]);

  if (!isQuickListOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        onClick={closeQuickList}
      />

      {/* Modal Dialog */}
      <div
        className="fixed inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-10 sm:top-14 bottom-10 sm:bottom-14 z-50 w-full sm:max-w-3xl bg-white dark:bg-[#141417] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label={isLearnings ? 'All Daily Learnings List' : 'All Job Applications List'}
      >
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm ${
                  isLearnings
                    ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                }`}
              >
                {isLearnings ? <BookOpen size={20} /> : <Briefcase size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0">
                    {isLearnings ? 'All Daily Learnings' : 'All Job Applications'}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isLearnings
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {isLearnings ? learnings.length : applications.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isLearnings
                    ? 'Full list of recorded notes across all learning tracks'
                    : 'Full list of job applications across all pipeline stages'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  closeQuickList();
                  if (isLearnings) {
                    openAddLearningModal();
                  } else {
                    openAddAppModal();
                  }
                }}
                className={`hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                  isLearnings
                    ? 'bg-orange-600 hover:bg-orange-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>{isLearnings ? 'Log Note' : 'Add Job'}</span>
              </button>

              <button
                type="button"
                onClick={closeQuickList}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Close list modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                isLearnings
                  ? 'Type to search by title, topic, concept, tags...'
                  : 'Type to search by company, role, country, notes...'
              }
              className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1f] text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!isLearnings ? (
              // Job Stage Pills
              <>
                <button
                  type="button"
                  onClick={() => setSelectedStage('All')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                    selectedStage === 'All'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100'
                  }`}
                >
                  All ({applications.length})
                </button>
                {STAGES.map(st => {
                  const count = applications.filter(a => a.stage === st).length;
                  const isActive = selectedStage === st;
                  const cfg = STAGE_CONFIG[st];
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStage(st)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                      <span>{st}</span>
                      <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </>
            ) : (
              // Learning Track Pills
              <>
                <button
                  type="button"
                  onClick={() => setSelectedTrack('All')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                    selectedTrack === 'All'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100'
                  }`}
                >
                  All ({learnings.length})
                </button>
                {availableTracks.map(t => {
                  const count = learnings.filter(
                    l =>
                      (l.category || '').toLowerCase() === t.id.toLowerCase() ||
                      (l.category || '').toLowerCase() === t.name.toLowerCase()
                  ).length;
                  const isActive =
                    selectedTrack.toLowerCase() === t.name.toLowerCase() ||
                    selectedTrack.toLowerCase() === t.id.toLowerCase();
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTrack(t.name)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border whitespace-nowrap ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-white/10 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.color }} />
                      <span>{t.name}</span>
                      <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Scrollable Items List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 space-y-2.5 custom-scrollbar">
          {!isLearnings ? (
            // Render Applications
            filteredApplications.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Briefcase size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No applications found</p>
                <p className="text-xs opacity-75 mt-0.5">Try adjusting your search or stage filter</p>
              </div>
            ) : (
              filteredApplications.map(app => {
                const stageColor = STAGE_CONFIG[app.stage]?.color || '#3b82f6';
                return (
                  <div
                    key={app.id}
                    onClick={() => {
                      closeQuickList();
                      openEditAppModal(app);
                    }}
                    className="group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-blue-500/40 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyLogo company={app.company} size={36} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0 truncate">
                            {app.company}
                          </h3>
                          {app.country && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                              {app.country}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {app.role || 'Software Engineer'}
                          {app.city ? ` · ${app.city}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Stage Pill */}
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold border shadow-2xs"
                        style={{
                          backgroundColor: `${stageColor}12`,
                          borderColor: `${stageColor}30`,
                          color: stageColor,
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: stageColor }} />
                        <span>{app.stage}</span>
                      </span>

                      {/* Date */}
                      {app.date_applied && (
                        <span className="hidden sm:inline-block text-[11px] text-slate-400 tabular-nums">
                          {app.date_applied}
                        </span>
                      )}

                      <span className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            // Render Learnings
            filteredLearnings.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <BookOpen size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">No learning notes found</p>
                <p className="text-xs opacity-75 mt-0.5">Try adjusting your search or track filter</p>
              </div>
            ) : (
              filteredLearnings.map(l => {
                const track = availableTracks.find(
                  t =>
                    t.name.toLowerCase() === (l.category || '').toLowerCase() ||
                    t.id.toLowerCase() === (l.category || '').toLowerCase()
                );
                const trackColor = track?.color || '#f59e0b';
                return (
                  <div
                    key={l.id}
                    onClick={() => {
                      closeQuickList();
                      openEditLearningModal(l);
                    }}
                    className="group flex items-start justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-orange-500/40 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 shadow-2xs"
                        style={{ background: trackColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 m-0 truncate">
                            {l.title}
                          </h3>
                        </div>
                        {l.topic && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {l.topic}
                          </p>
                        )}
                        {l.notes && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                            {l.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {/* Track Category Pill */}
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${trackColor}12`,
                          borderColor: `${trackColor}25`,
                          color: trackColor,
                        }}
                      >
                        {l.category || 'General'}
                      </span>

                      {/* Duration */}
                      {l.duration_minutes && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock size={11} />
                          <span>{l.duration_minutes}m</span>
                        </span>
                      )}

                      <span className="text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all">
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-3 sm:p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-400">
          <span>Click any item to view or edit</span>
          <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-[10px] font-mono">ESC</kbd> to close</span>
        </div>
      </div>
    </>
  );
};
