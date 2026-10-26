import React from 'react';
import { useApp } from '../../context/AppContext';
import { STAGES, STAGE_CONFIG } from '../../utils/constants';
import { Search, X, Plus, Calendar } from 'lucide-react';

export const MobileUtilityBar: React.FC = () => {
  const {
    viewMode,
    searchQuery,
    setSearchQuery,
    activeMobileStage,
    setActiveMobileStage,
    applications,
    openAddAppModal,
    openAddLearningModal,
  } = useApp();

  return (
    <div className="md:hidden flex flex-col gap-2 p-3 bg-white/95 dark:bg-[#121214]/95 border-b border-slate-200 dark:border-white/10">
      {/* Mobile Sub-Bar: Search + Add Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 flex items-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-blue-500">
          <Search size={14} className="text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
            placeholder={viewMode === 'learnings' ? 'Search learnings...' : 'Search applications...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
          onClick={() => (viewMode === 'learnings' ? openAddLearningModal() : openAddAppModal())}
          title="Add"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Add</span>
        </button>
      </div>

      {/* Mobile Stage Switcher Bar */}
      {viewMode === 'apps' && (
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5" role="tablist">
          {STAGES.map(st => {
            const count = applications.filter(a => a.stage === st).length;
            const isActive = activeMobileStage === st;
            return (
              <button
                key={st}
                type="button"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm font-bold'
                    : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                }`}
                onClick={() => setActiveMobileStage(st)}
                role="tab"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STAGE_CONFIG[st].color }} />
                <span>{st}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
              </button>
            );
          })}
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-all border ${
              activeMobileStage === 'Calendar'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm font-bold'
                : 'bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
            }`}
            onClick={() => setActiveMobileStage('Calendar')}
            role="tab"
            title="Calendar View"
          >
            <Calendar size={12} />
            <span>Calendar</span>
          </button>
        </div>
      )}
    </div>
  );
};
