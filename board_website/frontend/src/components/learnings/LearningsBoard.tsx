import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNING_TRACKS, APTITUDE_TOPICS } from '../../utils/constants';
import { LearningCard } from './LearningCard';
import { FocusSprintBar } from './FocusSprintBar';
import {
  Inbox,
  Code,
  BrainCircuit,
  Terminal,
  Lightbulb,
  BookOpen,
  Filter,
  X,
  Sparkles,
  ChevronDown,
  Briefcase,
  Plus,
} from 'lucide-react';

export const LearningsBoard: React.FC = () => {
  const {
    learnings,
    gamification,
    activeLearningCategory,
    searchQuery,
    openAddLearningModal,
    learningTracks,
  } = useApp();

  // Collapsed tracks state (open by default, closed only when user clicks button)
  const [collapsedTracks, setCollapsedTracks] = useState<Record<string, boolean>>({});

  const toggleTrack = (trackId: string) => {
    setCollapsedTracks(prev => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  };

  // Aptitude specific filters
  const [aptitudeStream, setAptitudeStream] = useState<'All' | 'English' | 'Quants' | 'Reasoning'>('All');
  const [aptitudeTopic, setAptitudeTopic] = useState<string>('All');

  // Filter learnings
  const filteredLearnings = learnings.filter(l => {
    // 1. Category Filter from Toolbar
    if (activeLearningCategory !== 'All' && activeLearningCategory !== 'Calendar') {
      if ((l.category || '').toLowerCase() !== activeLearningCategory.toLowerCase()) return false;
    }

    // 2. Aptitude Stream Filter
    if ((l.category || '').toUpperCase().includes('APTITUDE')) {
      if (aptitudeStream !== 'All') {
        const streamLower = aptitudeStream.toLowerCase();
        const text = [l.title, l.topic, l.notes, l.tags].join(' ').toLowerCase();
        if (!text.includes(streamLower)) return false;
      }

      if (aptitudeTopic !== 'All') {
        const topicLower = aptitudeTopic.toLowerCase();
        const text = [l.title, l.topic, l.notes, l.tags].join(' ').toLowerCase();
        if (!text.includes(topicLower)) return false;
      }
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (l.title || '').toLowerCase().includes(q);
      const matchTopic = (l.topic || '').toLowerCase().includes(q);
      const matchNotes = (l.notes || '').toLowerCase().includes(q);
      const matchTags = (l.tags || '').toLowerCase().includes(q);
      if (!matchTitle && !matchTopic && !matchNotes && !matchTags) return false;
    }

    return true;
  });

  // Combine user tracks with any orphan categories present in existing learnings
  const existingCategories = Array.from(new Set(learnings.map(l => l.category).filter(Boolean)));
  const allTracks = [...learningTracks];
  existingCategories.forEach(catName => {
    if (!allTracks.some(t => t.name.toLowerCase() === catName.toLowerCase() || t.id.toLowerCase() === catName.toLowerCase())) {
      allTracks.push({
        id: catName,
        name: catName,
        color: '#6366f1',
      });
    }
  });

  const tracksToDisplay =
    activeLearningCategory === 'All' || activeLearningCategory === 'Calendar'
      ? allTracks
      : allTracks.filter(
          t =>
            t.id.toLowerCase() === activeLearningCategory.toLowerCase() ||
            t.name.toLowerCase() === activeLearningCategory.toLowerCase()
        );

  // Auto-expand tracks on search
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      setCollapsedTracks({});
    }
  }, [searchQuery]);

  const totalHours = (gamification.totalMinutes / 60).toFixed(1);

  const getTrackIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('aptitude') || n.includes('logic') || n.includes('reason')) return <Lightbulb size={13} />;
    if (n.includes('code') || n.includes('dsa') || n.includes('algo') || n.includes('program')) return <Code size={13} />;
    if (n.includes('ai') || n.includes('ml') || n.includes('data') || n.includes('brain')) return <BrainCircuit size={13} />;
    if (n.includes('cs') || n.includes('system') || n.includes('terminal') || n.includes('dev')) return <Terminal size={13} />;
    if (n.includes('design') || n.includes('ui') || n.includes('ux') || n.includes('art')) return <Sparkles size={13} />;
    if (n.includes('finance') || n.includes('business') || n.includes('econ') || n.includes('market')) return <Briefcase size={13} />;
    return <BookOpen size={13} />;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5">
      {/* 1. Slim Focus Sprint Bar (Pomodoro Timer, Audio Bell Chime & Compact Streak) */}
      <FocusSprintBar />

      {/* 2. Track Columns - Kanban Lanes Container */}
      <main
        id="learningsView"
        className="w-full flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar items-stretch"
      >
        {tracksToDisplay.map(track => {
          const isAptitude =
            track.id.toUpperCase().includes('APTITUDE') ||
            track.name.toUpperCase().includes('APTITUDE');
          const trackLearnings = filteredLearnings.filter(
            l =>
              (l.category || '').toLowerCase() === track.id.toLowerCase() ||
              (l.category || '').toLowerCase() === track.name.toLowerCase()
          );
          const isOpen = !collapsedTracks[track.id];

          return (
            <section
              key={track.id}
              className={`flex flex-col min-w-[280px] bg-slate-100/70 dark:bg-[#121215] border border-slate-200/90 dark:border-white/10 rounded-2xl p-2.5 transition-all duration-200 ${
                isOpen ? 'h-full min-h-0' : 'h-fit self-start'
              } ${
                tracksToDisplay.length === 1
                  ? 'max-w-2xl mx-auto flex-1'
                  : 'flex-1 max-w-[380px]'
              }`}
              data-cat={track.id}
            >
              {/* Column Header */}
              <div
                onClick={() => toggleTrack(track.id)}
                className="shrink-0 flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 backdrop-blur-md shadow-2xs cursor-pointer select-none hover:bg-white dark:hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex items-center min-w-0">
                  <h2 className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0 truncate">
                    <span style={{ color: track.color }}>{getTrackIcon(track.name || track.id)}</span>
                    <span className="truncate">{track.name}</span>
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-2xs">
                    {trackLearnings.length}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTrack(track.id);
                    }}
                    className={`p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-transform duration-200 cursor-pointer flex items-center justify-center ${
                      isOpen ? 'rotate-180 text-orange-600 dark:text-orange-400' : ''
                    }`}
                    title={isOpen ? `Close ${track.name} section` : `Open ${track.name} section`}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? `Close ${track.name} section` : `Open ${track.name} section`}
                  >
                    <ChevronDown size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isOpen && (
                <div className="flex-1 min-h-0 flex flex-col pt-2.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* General Aptitude Granular Filters */}
                  {isAptitude && (
                    <div className="shrink-0 mb-3 space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                      {/* Stream Selector Buttons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {(['All', 'English', 'Quants', 'Reasoning'] as const).map(stream => (
                          <button
                            key={stream}
                            type="button"
                            onClick={() => {
                              setAptitudeStream(stream);
                              setAptitudeTopic('All');
                            }}
                            className={`px-2 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all border ${
                              aptitudeStream === stream
                                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                            }`}
                          >
                            {stream}
                          </button>
                        ))}
                      </div>

                      {/* Topic Select Dropdown */}
                      <div className="relative">
                        <select
                          value={aptitudeTopic}
                          onChange={(e) => setAptitudeTopic(e.target.value)}
                          className="w-full h-7 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-800 dark:text-slate-200 text-[11px] px-2 outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="All">All {aptitudeStream !== 'All' ? aptitudeStream : 'Aptitude'} Topics</option>
                          {aptitudeStream !== 'All' ? (
                            APTITUDE_TOPICS[aptitudeStream]?.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))
                          ) : (
                            Object.entries(APTITUDE_TOPICS).map(([group, topics]) => (
                              <optgroup key={group} label={group}>
                                {topics.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </optgroup>
                            ))
                          )}
                        </select>
                      </div>

                      {aptitudeTopic !== 'All' && (
                        <div className="flex items-center justify-between text-[10.5px] text-amber-700 dark:text-amber-300 font-medium">
                          <span className="truncate">Topic: <strong>{aptitudeTopic}</strong></span>
                          <button
                            type="button"
                            onClick={() => setAptitudeTopic('All')}
                            className="text-amber-500 hover:text-amber-700 ml-1 cursor-pointer"
                            title="Clear topic filter"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Column Cards Container - Scrollable Vertically Inside Each Lane */}
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2.5 pr-1">
                    {trackLearnings.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-slate-300/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 my-1">
                        <Inbox size={26} className="opacity-40 mb-2" />
                        <div className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                          No learnings in {track.name}
                        </div>
                        <div className="text-[11px] opacity-75 mt-0.5">
                          Click + Add to record today's notes
                        </div>
                        <button
                          type="button"
                          onClick={() => openAddLearningModal()}
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 transition-colors cursor-pointer"
                        >
                          <Plus size={12} strokeWidth={2.5} />
                          <span>Log Note</span>
                        </button>
                      </div>
                    ) : (
                      trackLearnings.map(learning => (
                        <LearningCard key={learning.id} learning={learning} />
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
};
