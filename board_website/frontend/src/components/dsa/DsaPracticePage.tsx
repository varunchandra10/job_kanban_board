import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SkeletonDsaPage } from '../common/SkeletonLoader';
import { DSA_CATEGORIES } from '../../data/dsaTopics';
import { DsaCategory, DsaProblem } from '../../types';
import {
  Code2,
  ExternalLink,
  CheckCircle2,
  Circle,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Trophy,
  Filter,
  Check,
  X,
  Flame,
  ListOrdered,
  Type,
  GitCommitHorizontal,
  Network,
  Layers,
  Share2,
  Boxes,
  Cpu,
  Hash,
  Binary,
  ArrowDownUp,
  LucideIcon,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ListOrdered,
  Type,
  GitCommitHorizontal,
  Network,
  Layers,
  Share2,
  Boxes,
  Cpu,
  Hash,
  Binary,
  ArrowDownUp,
  Search,
};

export const DsaPracticePage: React.FC = () => {
  const {
    dsaProgress,
    toggleDsaProblem,
    updateDsaNotes,
    isDataLoading,
    searchQuery = '',
    setSearchQuery,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // Expand the first 3 by default
    const initial: Record<string, boolean> = {};
    DSA_CATEGORIES.forEach((c, idx) => {
      initial[c.id] = idx < 3;
    });
    return initial;
  });

  const [activeNotesProblemId, setActiveNotesProblemId] = useState<string | null>(null);

  // Total problems count
  const allProblems = useMemo(() => {
    return DSA_CATEGORIES.flatMap(c => c.problems);
  }, []);

  const totalProblems = allProblems.length;

  const solvedProblems = useMemo(() => {
    return allProblems.filter(p => dsaProgress[p.id]?.status === 'solved');
  }, [allProblems, dsaProgress]);

  const solvedCount = solvedProblems.length;
  const overallPercentage = totalProblems > 0 ? Math.round((solvedCount / totalProblems) * 100) : 0;

  // Breakdown by difficulty
  const difficultyStats = useMemo(() => {
    const stats = {
      Easy: { total: 0, solved: 0 },
      Medium: { total: 0, solved: 0 },
      Hard: { total: 0, solved: 0 },
    };

    allProblems.forEach(p => {
      const diff = p.difficulty;
      if (stats[diff]) {
        stats[diff].total += 1;
        if (dsaProgress[p.id]?.status === 'solved') {
          stats[diff].solved += 1;
        }
      }
    });

    return stats;
  }, [allProblems, dsaProgress]);

  // Toggle Category Accordion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    DSA_CATEGORIES.forEach(c => {
      all[c.id] = true;
    });
    setExpandedCategories(all);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Filter categories and problems by search & filter
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return DSA_CATEGORIES.map(category => {
      if (selectedCategory !== 'All' && category.id !== selectedCategory) {
        return null;
      }

      const matchingProblems = category.problems.filter(prob => {
        if (!q) return true;
        const matchTitle = prob.title.toLowerCase().includes(q);
        const matchDiff = prob.difficulty.toLowerCase().includes(q);
        const matchSub = category.subtopics.some(s => s.toLowerCase().includes(q));
        return matchTitle || matchDiff || matchSub;
      });

      if (q && matchingProblems.length === 0 && !category.name.toLowerCase().includes(q)) {
        return null;
      }

      return {
        ...category,
        problems: q ? matchingProblems : category.problems,
      };
    }).filter(Boolean) as DsaCategory[];
  }, [searchQuery, selectedCategory]);

  if (isDataLoading) {
    return <SkeletonDsaPage />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-3.5 sm:space-y-5 pb-20 w-full animate-in fade-in duration-200">
      {/* 1. Header Hero Card with Overall Progress */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-gradient-to-br from-white via-slate-50/50 to-purple-50/30 dark:from-[#151518] dark:via-[#131316] dark:to-purple-950/20 p-4 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] sm:text-xs font-bold">
              <Sparkles size={12} />
              <span>Coding Interview Master Sheet</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              DSA Patterns &amp; LeetCode Roadmap
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              12 core algorithmic patterns and curated LeetCode challenges. Track your solved status, review notes, and monitor completion progress.
            </p>
          </div>

          {/* Progress Overview Card */}
          <div className="w-full lg:w-80 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/[0.04] backdrop-blur-md p-3.5 sm:p-5 shadow-xs shrink-0 space-y-2.5 sm:space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Trophy size={13} className="text-amber-500" />
                <span>Overall Mastery</span>
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {overallPercentage}%
              </span>
            </div>

            {/* Main Progress Bar */}
            <div className="w-full h-2 sm:h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${overallPercentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span className="font-semibold">
                <strong className="text-slate-900 dark:text-white font-bold">{solvedCount}</strong> of {totalProblems} Solved
              </span>
              <span className="text-[10.5px] sm:text-[11px] font-medium text-slate-400">
                12 Categories
              </span>
            </div>

            {/* Difficulty Pills */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
              <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Easy</span>
                <span className="text-[11px] sm:text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {difficultyStats.Easy.solved}/{difficultyStats.Easy.total}
                </span>
              </div>

              <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-600 dark:text-amber-400">Medium</span>
                <span className="text-[11px] sm:text-xs font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">
                  {difficultyStats.Medium.solved}/{difficultyStats.Medium.total}
                </span>
              </div>

              <div className="flex flex-col items-center p-1 sm:p-1.5 rounded-lg bg-rose-50/60 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-600 dark:text-rose-400">Hard</span>
                <span className="text-[11px] sm:text-xs font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">
                  {difficultyStats.Hard.solved}/{difficultyStats.Hard.total}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Controls Toolbar (Category Filter & Accordion Expand / Collapse) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-[#141417] border border-slate-200/90 dark:border-white/10 rounded-xl p-2 sm:p-2.5 shadow-2xs">
        {/* Left: Category Dropdown & Active Search Tag */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500/40 cursor-pointer font-semibold"
          >
            <option value="All">All Categories (12)</option>
            {DSA_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.problems.length})
              </option>
            ))}
          </select>

          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs">
              <span className="truncate max-w-[120px] sm:max-w-xs font-medium">"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-purple-900 dark:hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Expand / Collapse All Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={expandAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold transition-all cursor-pointer"
          >
            Expand All
          </button>

          <button
            type="button"
            onClick={collapseAll}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold transition-all cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 3. 12 Topic Accordion Cards */}
      <div className="space-y-4">
        {filteredCategories.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400">
            <Search size={28} className="mx-auto opacity-40 mb-2 text-slate-400" />
            <p className="font-semibold text-sm">No matching problems found</p>
            <p className="text-xs opacity-75 mt-0.5">Try searching for a different keyword or pattern</p>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = Boolean(expandedCategories[category.id] || searchQuery);
            const categorySolved = category.problems.filter(p => dsaProgress[p.id]?.status === 'solved').length;
            const categoryTotal = category.problems.length;
            const categoryPercent = categoryTotal > 0 ? Math.round((categorySolved / categoryTotal) * 100) : 0;
            const isAllSolved = categoryTotal > 0 && categorySolved === categoryTotal;

            const IconComponent = CATEGORY_ICONS[category.iconName] || Code2;

            return (
              <div
                key={category.id}
                className={`rounded-2xl border transition-all duration-200 bg-white dark:bg-[#141417] shadow-xs overflow-hidden ${
                  isAllSolved
                    ? 'border-emerald-200 dark:border-emerald-500/20'
                    : 'border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                {/* Category Header (Responsive Single-Row on Small Screens) */}
                <div
                  onClick={() => toggleCategory(category.id)}
                  className="p-3 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-4 cursor-pointer select-none bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAllSolved
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                      }`}
                    >
                      <IconComponent size={16} className="sm:w-[19px] sm:h-[19px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                          {category.name}
                        </h2>
                        {isAllSolved && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <Check size={10} strokeWidth={3} />
                            <span className="hidden sm:inline">Completed</span>
                          </span>
                        )}
                      </div>

                      {/* Subtopics pill preview (visible on sm+) */}
                      <div className="hidden sm:flex flex-wrap items-center gap-1.5 mt-1">
                        {category.subtopics.slice(0, 4).map((sub, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-white/5"
                          >
                            {sub}
                          </span>
                        ))}
                        {category.subtopics.length > 4 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            +{category.subtopics.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Stats & Accordion Arrow */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                        {categorySolved}/{categoryTotal} <span className="hidden sm:inline">Solved</span>
                      </span>
                      <div className="w-16 sm:w-28 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isAllSolved ? 'bg-emerald-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${categoryPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                </div>

                {/* Problems List Container */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5 animate-in fade-in duration-150">
                    {/* All Subtopics Tag Cloud */}
                    <div className="px-5 py-2.5 bg-slate-50/30 dark:bg-white/[0.01] flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider mr-1">Patterns:</span>
                      {category.subtopics.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>

                    {category.problems.map((problem) => {
                      const isSolved = dsaProgress[problem.id]?.status === 'solved';
                      const hasNotes = Boolean(dsaProgress[problem.id]?.notes?.trim());
                      const isNotesOpen = activeNotesProblemId === problem.id;

                      const diffColor =
                        problem.difficulty === 'Easy'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                          : problem.difficulty === 'Medium'
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                          : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';

                      return (
                        <div
                          key={problem.id}
                          className={`p-2.5 sm:px-5 sm:py-3 transition-colors ${
                            isSolved
                              ? 'bg-slate-50/40 dark:bg-white/[0.015]'
                              : 'hover:bg-slate-50/70 dark:hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 sm:gap-3">
                            {/* Checkbox & Problem Title */}
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => toggleDsaProblem(problem.id)}
                                className={`h-5 w-5 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                  isSolved
                                    ? 'bg-emerald-500 text-white shadow-xs'
                                    : 'border border-slate-300 dark:border-white/20 hover:border-purple-500 text-transparent'
                                }`}
                                title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                              >
                                <Check size={13} strokeWidth={3} className={isSolved ? 'opacity-100' : 'opacity-0'} />
                              </button>

                              <a
                                href={problem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-xs sm:text-sm font-semibold truncate transition-colors hover:text-purple-600 dark:hover:text-purple-400 inline-flex items-center gap-1.5 min-w-0 flex-1 ${
                                  isSolved
                                    ? 'text-slate-500 dark:text-slate-400 line-through'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <span className="truncate">{problem.title}</span>
                                <ExternalLink size={11} className="opacity-40 shrink-0" />
                              </a>
                            </div>

                            {/* Difficulty & Quick Notes Toggle */}
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <span className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md border ${diffColor}`}>
                                {problem.difficulty}
                              </span>

                              <button
                                type="button"
                                onClick={() => setActiveNotesProblemId(isNotesOpen ? null : problem.id)}
                                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer border ${
                                  hasNotes
                                    ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20'
                                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                                title={hasNotes ? 'Edit Problem Notes' : 'Add Problem Notes'}
                              >
                                <FileText size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Notes Drawer */}
                          {isNotesOpen && (
                            <div className="mt-3 pl-8 pr-2 pt-2 pb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                Personal Notes &amp; Approach (Time / Space Complexity, Edge Cases):
                              </label>
                              <textarea
                                rows={2}
                                defaultValue={dsaProgress[problem.id]?.notes || ''}
                                onBlur={(e) => updateDsaNotes(problem.id, e.target.value)}
                                placeholder="e.g. Use hashmap to store complement (target - num). Time: O(N), Space: O(N)..."
                                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 no-scrollbar resize-y"
                              />
                              <p className="text-[10px] text-slate-400 mt-1">
                                Notes automatically save to your database when you click outside.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
