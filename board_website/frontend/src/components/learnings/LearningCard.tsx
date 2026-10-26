import React from 'react';
import { Learning } from '../../types';
import { useApp } from '../../context/AppContext';
import { LEARNING_TRACKS } from '../../utils/constants';
import {
  Clock,
  Calendar,
  ExternalLink,
  BookOpen,
  Code,
  BrainCircuit,
  Terminal,
  Lightbulb,
  X,
  Tag,
} from 'lucide-react';

interface LearningCardProps {
  learning: Learning;
}

export const LearningCard: React.FC<LearningCardProps> = ({ learning: l }) => {
  const { openEditLearningModal, deleteLearning } = useApp();

  const trackObj = LEARNING_TRACKS.find(t => t.id === l.category) || LEARNING_TRACKS[0];

  const getTrackIcon = (catId: string) => {
    switch (catId) {
      case 'DSA':
        return <Code size={15} />;
      case 'AI/ML/NLP/CV':
        return <BrainCircuit size={15} />;
      case 'CS SUBJECTS':
        return <Terminal size={15} />;
      case 'GENERAL APTITUDE':
        return <Lightbulb size={15} />;
      default:
        return <BookOpen size={15} />;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Today';
    const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(dateStr);
    if (!m) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[+m[2] - 1]} ${+m[3]}`;
  };

  const tagsList = (l.tags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  // Detect Aptitude stream if in General Aptitude
  let aptitudeStream = '';
  if (l.category === 'GENERAL APTITUDE' && l.topic) {
    const tLower = l.topic.toLowerCase();
    if (tLower.includes('quant') || tLower.includes('math') || tLower.includes('percent')) {
      aptitudeStream = 'Quants';
    } else if (tLower.includes('english') || tLower.includes('verbal') || tLower.includes('grammar')) {
      aptitudeStream = 'English';
    } else if (tLower.includes('reason') || tLower.includes('logic') || tLower.includes('puzzle')) {
      aptitudeStream = 'Reasoning';
    }
  }

  return (
    <div
      className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-3.5 shadow-xs hover:shadow-md hover:border-orange-400/60 dark:hover:border-orange-500/50 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
      onClick={() => openEditLearningModal(l)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          openEditLearningModal(l);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${l.title}`}
    >
      {/* Top subtle hover accent line */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100 rounded-t-full" />

      {/* Delete button (visible on hover) */}
      <button
        type="button"
        className="absolute right-2.5 top-2.5 z-10 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all cursor-pointer"
        title="Delete learning note"
        aria-label="Delete note"
        onClick={(e) => {
          e.stopPropagation();
          deleteLearning(l.id);
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      {/* Card Header: Category Icon Avatar & Title */}
      <div className="flex items-start gap-2.5 pr-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
          style={{
            backgroundColor: `${trackObj.color}15`,
            borderColor: `${trackObj.color}35`,
            color: trackObj.color,
          }}
        >
          {getTrackIcon(l.category)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13px] leading-snug text-slate-900 dark:text-slate-100 line-clamp-2 m-0 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
            {l.title}
          </h3>

          {l.topic && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {aptitudeStream && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {aptitudeStream}
                </span>
              )}
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                {l.topic}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Notes Preview Block */}
      {l.notes && (
        <div className="mt-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-white/[0.02] p-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
          {l.notes}
        </div>
      )}

      {/* Tag Badges */}
      {tagsList.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 mt-2.5">
          {tagsList.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-white/5"
            >
              #{tag}
            </span>
          ))}
          {tagsList.length > 3 && (
            <span className="text-[10px] text-slate-400 font-semibold px-1">
              +{tagsList.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Card Footer: Duration Pill, Date Logged & Resource Link */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          {/* Duration Pill */}
          <span
            className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md text-[10px] border shadow-2xs"
            style={{
              backgroundColor: `${trackObj.color}10`,
              borderColor: `${trackObj.color}25`,
              color: trackObj.color,
            }}
          >
            <Clock size={10} strokeWidth={2.5} />
            <span>{l.duration_minutes || 30}m</span>
          </span>

          {/* Date */}
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
            <Calendar size={11} />
            <span>{formatDate(l.date_logged)}</span>
          </span>
        </div>

        {/* Resource External Link */}
        {l.resource_url && (
          <a
            href={l.resource_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-indigo-400 hover:underline hover:text-blue-700 dark:hover:text-indigo-300 transition-colors"
            title="Open external resource / notes"
          >
            <span>Source</span>
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  );
};
