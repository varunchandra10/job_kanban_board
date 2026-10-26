import React, { useState, useEffect } from 'react';
import { Application, ApplicationStage } from '../../types';
import { STAGE_CONFIG } from '../../utils/constants';
import { ApplicationCard } from './ApplicationCard';
import { useApp } from '../../context/AppContext';
import { Bookmark, Send, Users, Trophy, XCircle, Inbox, ChevronDown } from 'lucide-react';

interface KanbanColumnProps {
  stage: ApplicationStage;
  applications: Application[];
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, applications }) => {
  const { moveApplication, searchQuery } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Auto-expand when user types a search query with matching cards
  useEffect(() => {
    if (searchQuery && searchQuery.trim() && applications.length > 0) {
      setIsOpen(true);
    }
  }, [searchQuery, applications.length]);

  const stageIcons: Record<ApplicationStage, React.ReactNode> = {
    Bookmarked: <Bookmark size={13} />,
    Applied: <Send size={13} />,
    Interviewing: <Users size={13} />,
    Offer: <Trophy size={13} />,
    Rejected: <XCircle size={13} />,
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const idStr = e.dataTransfer.getData('text/plain');
    if (!idStr) return;
    const appId = Number(idStr);
    if (appId) {
      moveApplication(appId, stage);
    }
  };

  return (
    <section
      className={`flex flex-col min-w-0 bg-slate-100/70 dark:bg-[#121215] border rounded-2xl p-2.5 transition-all duration-200 ${
        isOpen ? 'h-full min-h-0' : 'h-fit self-start'
      } ${
        isDragOver
          ? 'border-blue-500/60 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-indigo-500/10'
          : 'border-slate-200/90 dark:border-white/10'
      }`}
      data-stage={stage}
    >
      {/* Column Header */}
      <div
        onClick={() => setIsOpen(prev => !prev)}
        className="shrink-0 flex items-center justify-between px-2.5 py-2 rounded-xl bg-white/80 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 backdrop-blur-md shadow-2xs cursor-pointer select-none hover:bg-white dark:hover:bg-white/[0.08] transition-colors"
      >
        <div className="flex items-center min-w-0">
          <h2 className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 m-0 truncate">
            <span style={{ color: STAGE_CONFIG[stage].color }}>{stageIcons[stage]}</span>
            <span className="truncate">{stage}</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center justify-center min-w-5 px-1.5 py-0.5 rounded-full text-[11px] font-extrabold tabular-nums bg-slate-100 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 shadow-2xs">
            {applications.length}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(prev => !prev);
            }}
            className={`p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-transform duration-200 cursor-pointer flex items-center justify-center ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
            title={isOpen ? `Close ${stage} section` : `Open ${stage} section`}
            aria-expanded={isOpen}
            aria-label={isOpen ? `Close ${stage} section` : `Open ${stage} section`}
          >
            <ChevronDown size={14} className="stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Collapsible Column Body / Droppable Cards Container */}
      {isOpen && (
        <div
          className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-1 pt-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
          data-stage={stage}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-xl border border-dashed border-slate-300/80 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 my-1">
              <Inbox size={26} className="opacity-40 mb-2" />
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                No applications in {stage}
              </div>
              <div className="text-[11px] opacity-75 mt-0.5">
                Drag cards here or click + Add
              </div>
            </div>
          ) : (
            applications.map(app => (
              <ApplicationCard key={app.id} application={app} />
            ))
          )}
        </div>
      )}
    </section>
  );
};
