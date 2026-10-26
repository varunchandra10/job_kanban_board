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
    <nav className="flex items-center justify-between px-2.5 sm:px-6 py-1.5 sm:py-2 bg-white/95 dark:bg-[#121214]/95 border-b border-slate-200 dark:border-white/10 backdrop-blur-md transition-colors relative">
      {/* Left: Scrollable Category Chips */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto min-w-0 flex-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pr-2">
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

      {/* Right: Fixed Add Note Button */}
      <div className="flex items-center shrink-0 pl-1.5 sm:pl-2 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md z-10 border-l border-slate-200/60 dark:border-white/10 sm:border-l-0 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.35)] sm:shadow-none">
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
