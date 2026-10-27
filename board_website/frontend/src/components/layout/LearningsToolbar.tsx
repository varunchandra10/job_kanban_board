import React from 'react';
import { useApp } from '../../context/AppContext';
import { LearningCategory } from '../../types';
import {
  LayoutGrid,
  Code,
  BrainCircuit,
  Terminal,
  Lightbulb,
  Calendar,
  Plus,
  Sparkles,
  Briefcase,
  BookOpen,
  X,
  ChevronDown,
  Search,
} from 'lucide-react';

export const LearningsToolbar: React.FC = () => {
  const {
    learnings,
    activeLearningCategory,
    setActiveLearningCategory,
    openAddLearningModal,
    learningTracks,
    deleteLearningTrack,
    openQuickList,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const getTrackIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('aptitude') || n.includes('logic') || n.includes('reason')) return <Lightbulb size={14} />;
    if (n.includes('code') || n.includes('dsa') || n.includes('algo') || n.includes('program')) return <Code size={14} />;
    if (n.includes('ai') || n.includes('ml') || n.includes('data') || n.includes('brain')) return <BrainCircuit size={14} />;
    if (n.includes('cs') || n.includes('system') || n.includes('terminal') || n.includes('dev')) return <Terminal size={14} />;
    if (n.includes('design') || n.includes('ui') || n.includes('ux') || n.includes('art')) return <Sparkles size={14} />;
    if (n.includes('finance') || n.includes('business') || n.includes('econ') || n.includes('market')) return <Briefcase size={14} />;
    return <BookOpen size={14} />;
  };

  const countAll = learnings.length;

  const categories: Array<{
    id: LearningCategory;
    label: string;
    count?: number;
    icon: React.ReactNode;
    activeClass: string;
  }> = [
    {
      id: 'All',
      label: 'All Tracks',
      count: countAll,
      icon: <LayoutGrid size={14} />,
      activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs',
    },
    ...learningTracks.map(t => {
      const count = learnings.filter(
        l =>
          (l.category || '').toLowerCase() === t.id.toLowerCase() ||
          (l.category || '').toLowerCase() === t.name.toLowerCase()
      ).length;
      return {
        id: t.name,
        label: t.name,
        count,
        icon: getTrackIcon(t.name),
        activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs',
      };
    }),
    {
      id: 'Calendar',
      label: 'Calendar',
      icon: <Calendar size={14} />,
      activeClass: 'bg-cyan-600 text-white border-cyan-600 shadow-xs shadow-cyan-500/20',
    },
  ];

  return (
    <nav className="flex items-center justify-between gap-1 sm:gap-2 px-2.5 sm:px-6 py-1.5 sm:py-2 bg-white/95 dark:bg-[#121214]/95 border-b border-slate-200 dark:border-white/10 backdrop-blur-md transition-colors relative">
      {/* Left: Scrollable Category Chips (ending with Calendar) */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto min-w-0 shrink lg:flex-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-1 sm:pr-2">
        {categories.map(cat => {
          const isActive =
            activeLearningCategory.toLowerCase() === cat.id.toLowerCase() ||
            activeLearningCategory.toLowerCase() === cat.label.toLowerCase();
          const canDelete = cat.id !== 'All' && cat.id !== 'Calendar';

          return (
            <div key={cat.id} className="relative group shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setActiveLearningCategory(cat.id)}
                title={cat.label}
                aria-label={cat.label}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? `${cat.activeClass} font-bold`
                    : 'bg-white dark:bg-[#18181b] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <span className="opacity-90 shrink-0">{cat.icon}</span>
                <span className="hidden sm:inline">{cat.label}</span>
                {cat.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
                {canDelete && (
                  <span
                    onClick={e => {
                      e.stopPropagation();
                      deleteLearningTrack(cat.id);
                    }}
                    role="button"
                    tabIndex={0}
                    className="hidden sm:inline-flex opacity-0 group-hover:opacity-60 hover:!opacity-100 p-0.5 -mr-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-opacity cursor-pointer text-slate-400 hover:text-red-500"
                    title={`Delete track ${cat.label}`}
                    aria-label={`Delete track ${cat.label}`}
                  >
                    <X size={11} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Middle: Integrated Search Bar for smaller screens (<lg), placed between Calendar and + icon */}
      <div className="lg:hidden flex-1 min-w-[95px] max-w-[260px] flex items-center h-8 bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2 sm:px-2.5 mx-1 sm:mx-1.5 focus-within:border-orange-500 dark:focus-within:border-orange-500 focus-within:bg-white dark:focus-within:bg-[#18181b] focus-within:shadow-xs transition-all">
        <Search size={13} className="text-slate-400 shrink-0 mr-1.5" />
        <input
          type="text"
          className="w-full h-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none min-w-0"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search learnings"
        />
        {searchQuery && (
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1 shrink-0 p-0.5"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Right: Fixed Add Note Button */}
      <div className="flex items-center shrink-0 pl-1 sm:pl-2 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md z-10">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-sm shadow-orange-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
          onClick={() => openAddLearningModal()}
          title="Add Daily Learning Note"
          aria-label="Add Note"
        >
          <Plus size={15} strokeWidth={2.5} className="shrink-0" />
          <span className="hidden sm:inline">Add Note</span>
        </button>
      </div>
    </nav>
  );
};
