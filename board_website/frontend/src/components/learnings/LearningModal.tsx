import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { APTITUDE_TOPICS } from '../../utils/constants';
import {
  BookOpen,
  Code,
  BrainCircuit,
  Terminal,
  Lightbulb,
  Clock,
  Calendar,
  Link2,
  FileText,
  Tag,
  X,
  Check,
  Sparkles,
  ChevronDown,
  Trash2,
  Plus,
} from 'lucide-react';

export const LearningModal: React.FC = () => {
  const {
    isAddLearningOpen,
    editingLearning,
    selectedCalDate,
    learningPrefill,
    closeLearningModal,
    addLearning,
    updateLearning,
    learningTracks,
    addLearningTrack,
    deleteLearningTrack,
  } = useApp();

  const [category, setCategory] = useState<string>('General Aptitude');
  const [isTrackDropdownOpen, setIsTrackDropdownOpen] = useState(false);
  const trackMenuRef = useRef<HTMLDivElement>(null);

  const [aptitudeStream, setAptitudeStream] = useState<'English' | 'Quants' | 'Reasoning'>('Quants');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState<number | string>(45);
  const [dateLogged, setDateLogged] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  // Close track dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (trackMenuRef.current && !trackMenuRef.current.contains(e.target as Node)) {
        setIsTrackDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Prefill or reset on modal open
  useEffect(() => {
    if (!isAddLearningOpen) return;

    if (editingLearning) {
      setCategory(editingLearning.category || 'General Aptitude');
      setTitle(editingLearning.title || '');
      setTopic(editingLearning.topic || '');
      setDuration(editingLearning.duration_minutes || 45);
      setDateLogged(editingLearning.date_logged || '');
      setResourceUrl(editingLearning.resource_url || '');
      setNotes(editingLearning.notes || '');
      setTags(editingLearning.tags || '');

      // Check stream for aptitude
      if (
        (editingLearning.category || '').toUpperCase().includes('APTITUDE') &&
        editingLearning.topic
      ) {
        const tLower = editingLearning.topic.toLowerCase();
        if (tLower.includes('english') || tLower.includes('verbal')) setAptitudeStream('English');
        else if (tLower.includes('reason') || tLower.includes('logic')) setAptitudeStream('Reasoning');
        else setAptitudeStream('Quants');
      }
    } else {
      const initialCat = learningPrefill?.category || learningTracks[0]?.name || 'General Aptitude';
      setCategory(initialCat);
      setAptitudeStream('Quants');
      setTitle('');
      setTopic('');
      setDuration(learningPrefill?.duration || 45);
      setDateLogged(selectedCalDate || new Date().toISOString().slice(0, 10));
      setResourceUrl('');
      setNotes('');
      setTags('');
    }
    setIsTrackDropdownOpen(false);
  }, [isAddLearningOpen, editingLearning, selectedCalDate, learningTracks, learningPrefill]);

  if (!isAddLearningOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const trimmedCat = category.trim() || 'General';

    // If it's a new track not in list, auto-add it!
    const existing = learningTracks.find(
      t => t.name.toLowerCase() === trimmedCat.toLowerCase() || t.id.toLowerCase() === trimmedCat.toLowerCase()
    );
    let finalCategory = trimmedCat;
    if (!existing) {
      const added = addLearningTrack(trimmedCat);
      finalCategory = added.name;
    } else {
      finalCategory = existing.name;
    }

    const learningData = {
      category: finalCategory,
      title: title.trim(),
      topic: topic.trim(),
      duration_minutes: Number(duration) || 30,
      date_logged: dateLogged || new Date().toISOString().slice(0, 10),
      resource_url: resourceUrl.trim(),
      notes: notes.trim(),
      tags: tags.trim(),
    };

    if (editingLearning) {
      updateLearning(editingLearning.id, learningData);
    } else {
      addLearning(learningData);
    }
    closeLearningModal();
  };

  const isAptitudeSelected = category.toUpperCase().includes('APTITUDE');

  return (
    <>
      {/* 1. Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={closeLearningModal}
        aria-hidden="true"
      />

      {/* 2. Slideout Drawer */}
      <aside
        className="fixed inset-y-0 right-0 w-full max-w-[560px] bg-white dark:bg-[#121214] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-transform animate-in slide-in-from-right duration-200"
        aria-modal="true"
        role="dialog"
      >
        {/* Mobile Pull Handle */}
        <div className="flex sm:hidden w-full justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-xs">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white m-0 truncate">
                {editingLearning ? 'Edit Learning Note' : 'Log Daily Learning'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 truncate">
                Track takeaways, problem solutions & keep your streak alive
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLearningModal}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Track Category Selector with Searchable Dropdown */}
          <div className="relative" ref={trackMenuRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Learning Track / Subject *
              </label>
              <span className="text-[11px] text-slate-400">
                Select or type a new track
              </span>
            </div>

            {/* Input that functions as both display and search input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center pointer-events-none">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background:
                      learningTracks.find(
                        t => t.name.toLowerCase() === category.toLowerCase() || t.id.toLowerCase() === category.toLowerCase()
                      )?.color || '#f59e0b',
                  }}
                />
              </div>

              <input
                type="text"
                value={category}
                onChange={e => {
                  setCategory(e.target.value);
                  setIsTrackDropdownOpen(true);
                }}
                onFocus={e => {
                  e.target.select();
                  setIsTrackDropdownOpen(true);
                }}
                placeholder="Type or select track (e.g. General Aptitude, System Design, Finance)..."
                className="w-full h-11 pl-8 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-normal focus:bg-white dark:focus:bg-[#18181b] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />

              <button
                type="button"
                onClick={() => setIsTrackDropdownOpen(!isTrackDropdownOpen)}
                className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Toggle tracks list"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-150 ${isTrackDropdownOpen ? 'rotate-180 text-orange-500' : ''}`}
                />
              </button>
            </div>

            {/* Dropdown Menu: Tracks listed one on other */}
            {isTrackDropdownOpen && (() => {
              const trimmed = category.trim().toLowerCase();
              const isExactTrack = learningTracks.some(
                t => t.name.toLowerCase() === trimmed || t.id.toLowerCase() === trimmed
              );

              // If input matches an existing track exactly (e.g. initial state or after click), show all tracks!
              // Otherwise, filter by the typed query
              const filteredList = isExactTrack || !trimmed
                ? learningTracks
                : learningTracks.filter(
                    t =>
                      t.name.toLowerCase().includes(trimmed) ||
                      t.id.toLowerCase().includes(trimmed)
                  );

              const isNewTrack =
                trimmed.length > 0 &&
                !learningTracks.some(
                  t => t.name.toLowerCase() === trimmed || t.id.toLowerCase() === trimmed
                );

              return (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {filteredList.map(t => {
                      const isSelected =
                        trimmed === t.name.toLowerCase() ||
                        trimmed === t.id.toLowerCase();
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setCategory(t.name);
                            setIsTrackDropdownOpen(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-orange-50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: t.color }}
                            />
                            <span className="truncate">{t.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isSelected && (
                              <span className="text-orange-600 dark:text-orange-400 text-xs font-bold">
                                ✓
                              </span>
                            )}
                            {/* Delete Track button */}
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                deleteLearningTrack(t.id);
                                if (isSelected) {
                                  setCategory('');
                                }
                              }}
                              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                              title={`Delete track "${t.name}"`}
                              aria-label={`Delete track ${t.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* If user typed a new track not in list, offer "+ Create new track" */}
                    {isNewTrack && (
                      <button
                        type="button"
                        onClick={() => {
                          const newTrack = addLearningTrack(category.trim());
                          setCategory(newTrack.name);
                          setIsTrackDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50/70 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors cursor-pointer text-left"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Create new track &ldquo;{category.trim()}&rdquo;</span>
                      </button>
                    )}

                    {learningTracks.length === 0 && !category.trim() && (
                      <div className="px-3 py-3 text-center text-xs text-slate-400">
                        No tracks yet. Type a track name above to create one.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Aptitude Stream & Preset Topics (Shown when an Aptitude track is selected) */}
          {isAptitudeSelected && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                  Aptitude Stream
                </span>
                <div className="flex items-center gap-1">
                  {(['English', 'Quants', 'Reasoning'] as const).map(stream => (
                    <button
                      key={stream}
                      type="button"
                      onClick={() => {
                        setAptitudeStream(stream);
                        if (!topic) setTopic(stream);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all border ${
                        aptitudeStream === stream
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-amber-100/50'
                      }`}
                    >
                      {stream}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Pick from standard {aptitudeStream} topics
                </label>
                <select
                  value={APTITUDE_TOPICS[aptitudeStream]?.includes(topic) ? topic : ''}
                  onChange={(e) => {
                    if (e.target.value) setTopic(e.target.value);
                  }}
                  className="w-full h-8 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs px-2.5 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">-- Choose a standard topic or type custom below --</option>
                  {APTITUDE_TOPICS[aptitudeStream]?.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Title Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Title / Concept *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dynamic Programming & Two Pointers Memoization"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Subtopic Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Subtopic / Algorithm
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 0/1 Knapsack, Bellman-Ford, Transformers"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Duration & Date Logged Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Study Duration Input (Numbers Only) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock size={12} />
                <span>Duration (minutes) *</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={duration}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9]/g, '');
                    setDuration(sanitized ? parseInt(sanitized, 10) : '');
                  }}
                  placeholder="e.g. 45 or 50"
                  className="w-full h-10 pl-3.5 pr-14 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <span className="absolute right-3.5 text-xs font-semibold text-slate-400 pointer-events-none">
                  mins
                </span>
              </div>
            </div>

            {/* Date Logged */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar size={12} />
                <span>Date Logged</span>
              </label>
              <input
                type="date"
                value={dateLogged}
                onChange={(e) => setDateLogged(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs text-slate-900 dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Resource URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Link2 size={12} />
              <span>Reference Link / LeetCode URL</span>
            </label>
            <input
              type="url"
              value={resourceUrl}
              onChange={(e) => setResourceUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/... or arXiv paper"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <Tag size={12} />
              <span>Tags (comma separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. dp, graph, medium, interview-favorite"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Notes / Takeaways Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
              <FileText size={12} />
              <span>Study Notes & Takeaways</span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key observations, recurrence relations, corner cases, time/space complexity notes..."
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-y leading-relaxed font-mono"
            />
          </div>

          {/* Form Action Buttons in Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#121214] pb-2">
            <button
              type="button"
              onClick={closeLearningModal}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>{editingLearning ? 'Update Note' : 'Save Learning'}</span>
            </button>
          </div>
        </form>
      </aside>
    </>
  );
};
