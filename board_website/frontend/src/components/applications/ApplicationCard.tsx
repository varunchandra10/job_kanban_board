import React, { useState, useRef, useEffect } from 'react';
import { Application, ApplicationStage } from '../../types';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { STAGES } from '../../utils/constants';
import { CompanyLogo } from '../common/CompanyLogo';
import {
  MapPin,
  Calendar,
  MoreHorizontal,
  Key,
  AlertCircle,
  Clock,
  Landmark,
  Beaker,
  FileText,
  Check,
  Trash2,
  ExternalLink,
  X,
  Mail,
  Send,
} from 'lucide-react';

interface ApplicationCardProps {
  application: Application;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application: app,
}) => {
  const {
    openEditAppModal,
    deleteApplication,
    moveApplication,
    openFollowUpModal,
    showToast,
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format YYYY-MM-DD
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return dateStr;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
  };

  // Deadline status calculation
  let deadlineStatus: 'overdue' | 'urgent' | 'normal' | null = null;
  let deadlineLabel = '';

  if (app.deadline) {
    const target = new Date(`${app.deadline}T23:59:59`);
    const diffDays = Math.ceil(
      (target.getTime() - new Date().getTime()) / 86400000
    );

    if (diffDays < 0) {
      deadlineStatus = 'overdue';
      deadlineLabel = `Overdue (${Math.abs(diffDays)}d)`;
    } else if (diffDays <= 7) {
      deadlineStatus = 'urgent';
      deadlineLabel = diffDays === 0 ? 'Due today' : `${diffDays}d left`;
    } else {
      deadlineStatus = 'normal';
    }
  }

  // Follow-up radar calculation (if in Applied or Interviewing and >= 5 days)
  let daysSinceApplied: number | null = null;
  let isFollowUpRecommended = false;
  if (app.date_applied && (app.stage === 'Applied' || app.stage === 'Interviewing')) {
    const applied = new Date(app.date_applied);
    const now = new Date();
    const diff = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
    if (!isNaN(diff) && diff >= 5) {
      daysSinceApplied = diff;
      isFollowUpRecommended = true;
    }
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(app.id));
    e.dataTransfer.effectAllowed = 'move';
  };

  const countryCode = app.country === 'GB' ? 'UK' : app.country || '';
  const locationString = [app.city, countryCode].filter(Boolean).join(', ');

  const customTagsList = (app.custom_tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div
      className="group relative cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-3.5 shadow-xs hover:shadow-md hover:border-blue-400/60 dark:hover:border-indigo-500/50 hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      draggable
      onDragStart={handleDragStart}
      onClick={() => openEditAppModal(app)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          openEditAppModal(app);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Edit ${app.company} application`}
      data-id={app.id}
    >
      {/* Top subtle hover accent */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 transition-opacity group-hover:opacity-100 rounded-t-full" />

      {/* Action Buttons Top-Right */}
      <div
        ref={menuRef}
        className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Quick Follow-Up Email Button (appears on hover) */}
        <button
          type="button"
          className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all cursor-pointer"
          title="Draft follow-up email"
          aria-label="Draft follow-up email"
          onClick={(e) => {
            e.stopPropagation();
            openFollowUpModal(app);
          }}
        >
          <Mail size={12} strokeWidth={2.2} />
        </button>

        {/* Quick Delete '✕' Button (appears on hover) */}
        <button
          type="button"
          className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all cursor-pointer"
          title="Delete application"
          aria-label="Delete application"
          onClick={(e) => {
            e.stopPropagation();
            deleteApplication(app.id);
          }}
        >
          <X size={12} strokeWidth={2.5} />
        </button>

        {/* 3-Dots Quick Move Button */}
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
          title="Quick move to stage"
          aria-label="Move application stage"
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
        >
          <MoreHorizontal size={14} />
        </button>

        {/* Quick Move Dropdown */}
        {isMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] py-1 shadow-xl z-50 text-slate-800 dark:text-slate-200"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Move to Stage
            </div>

            {STAGES.map((st) => (
              <button
                key={st}
                type="button"
                role="menuitem"
                className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer ${
                  app.stage === st
                    ? 'font-bold text-blue-600 dark:text-indigo-400 bg-blue-50/50 dark:bg-indigo-500/10'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => {
                  moveApplication(app.id, st);
                  closeMenu();
                }}
              >
                <span className="truncate">{st}</span>
                {app.stage === st && (
                  <Check size={13} className="shrink-0 text-blue-600 dark:text-indigo-400" />
                )}
              </button>
            ))}

            <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />

            {/* Follow-Up Email in Menu */}
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer"
              onClick={() => {
                closeMenu();
                openFollowUpModal(app);
              }}
            >
              <Mail size={13} />
              <span>Draft follow-up email</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer"
              onClick={() => {
                closeMenu();
                deleteApplication(app.id);
              }}
            >
              <Trash2 size={13} />
              <span>Delete application</span>
            </button>
          </div>
        )}
      </div>

      {/* Deadline pulsing dot top-right */}
      {deadlineStatus && deadlineStatus !== 'normal' && (
        <span
          className="absolute top-3.5 right-10 flex h-2.5 w-2.5 items-center justify-center"
          title={deadlineLabel}
        >
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              deadlineStatus === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              deadlineStatus === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
            }`}
          />
        </span>
      )}

      {/* Company Logo and Role Title */}
      <div className="flex items-start gap-3 pr-10">
        <CompanyLogo company={app.company} size={34} />

        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="m-0 truncate text-sm font-bold leading-tight text-slate-900 dark:text-slate-100">
            {app.company}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
            {app.role || 'Software Engineer'}
          </p>
        </div>
      </div>

      {/* Metadata (Location & Dates) */}
      <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-white/5 pt-2.5">
        {locationString && (
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <span className="min-w-0 truncate">{locationString}</span>
            {countryCode && (
              <span className="shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                {countryCode}
              </span>
            )}
          </div>
        )}

        <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Calendar size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="truncate">
            {formatDate(app.date_applied) || 'Date not set'}
            {app.deadline && (
              <span className="ml-1 text-slate-400 dark:text-slate-500">
                &middot; Due {formatDate(app.deadline)}
              </span>
            )}
          </span>
        </div>

        {app.deadline && deadlineStatus && deadlineStatus !== 'normal' && (
          <div
            className={`flex min-w-0 items-center gap-1.5 text-[11px] font-semibold ${
              deadlineStatus === 'overdue'
                ? 'text-red-600 dark:text-red-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {deadlineStatus === 'overdue' ? (
              <AlertCircle size={12} className="shrink-0" />
            ) : (
              <Clock size={12} className="shrink-0" />
            )}
            <span className="truncate">{deadlineLabel}</span>
          </div>
        )}

        {/* Stale Follow-Up Radar Banner */}
        {isFollowUpRecommended && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFollowUpModal(app);
            }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/25 transition-all cursor-pointer group/fu w-fit"
            title="Click to draft a follow-up email"
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
            </span>
            <span>{daysSinceApplied}d since applied &middot; Follow up</span>
            <ExternalLink size={9} className="opacity-0 group-hover/fu:opacity-100 transition-opacity" />
          </button>
        )}
      </div>

      {/* Tags & Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {app.category === 'Government' && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
            <Landmark size={10} />
            Gov
          </span>
        )}

        {app.category === 'Research' && (
          <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400">
            <Beaker size={10} />
            Research
          </span>
        )}

        {(app.portal_user || app.portal_pass) && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400"
            title="Portal credentials saved"
          >
            <Key size={10} />
            Creds
          </span>
        )}

        {app.jd && (
          <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            <FileText size={10} />
            JD
          </span>
        )}

        {app.resume_path && app.resume_path.trim().toUpperCase() !== 'NA' && (() => {
          const isGDrive = app.resume_path.includes('drive.google.com') || app.resume_path.includes('docs.google.com');
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors cursor-pointer"
              title={isGDrive ? `View Resume in Google Drive: ${app.resume_path}` : 'View / Download Attached Resume'}
              onClick={(e) => {
                e.stopPropagation();
                const url = api.getDocumentUrl(app.resume_path!);
                if (url) {
                  window.open(url, '_blank', 'noopener,noreferrer');
                  showToast(isGDrive ? 'Opening resume in Google Drive' : 'Opening resume document');
                }
              }}
            >
              <FileText size={10} />
              <span>resume</span>
              <ExternalLink size={9} />
            </button>
          );
        })()}

        {app.cover_letter_path && app.cover_letter_path.trim().toUpperCase() !== 'NA' && (() => {
          const isGDrive = app.cover_letter_path.includes('drive.google.com') || app.cover_letter_path.includes('docs.google.com');
          return (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors cursor-pointer"
              title={isGDrive ? `View Cover Letter in Google Drive: ${app.cover_letter_path}` : 'View / Download Attached Cover Letter'}
              onClick={(e) => {
                e.stopPropagation();
                const url = api.getDocumentUrl(app.cover_letter_path!);
                if (url) {
                  window.open(url, '_blank', 'noopener,noreferrer');
                  showToast(isGDrive ? 'Opening cover letter in Google Drive' : 'Opening cover letter document');
                }
              }}
            >
              <FileText size={10} />
              <span>cover_letter</span>
              <ExternalLink size={9} />
            </button>
          );
        })()}

        {customTagsList.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};
