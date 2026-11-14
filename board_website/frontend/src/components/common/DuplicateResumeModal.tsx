import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  X,
  HardDrive,
  ArrowRight,
  Edit3
} from 'lucide-react';

export function computeRenamedResume(originalName: string, company: string, role: string): string {
  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
  const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '.pdf';

  const cleanCompany = (company || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_');

  const cleanRole = (role || '')
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '')
    .replace(/\s+/g, '_');

  const parts = [baseName, cleanCompany, cleanRole].filter(Boolean);
  return `${parts.join('_')}${ext}`;
}

interface DuplicateResumeModalProps {
  isOpen: boolean;
  fileName: string;
  existingLink: string;
  company: string;
  role: string;
  onSelectSame: () => void;
  onSelectDifferent: (newFileName: string) => void;
  onCancel: () => void;
}

export const DuplicateResumeModal: React.FC<DuplicateResumeModalProps> = ({
  isOpen,
  fileName,
  existingLink,
  company,
  role,
  onSelectSame,
  onSelectDifferent,
  onCancel,
}) => {
  const [customName, setCustomName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Recalculate default renamed filename when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      const suggested = computeRenamedResume(fileName, company, role);
      setCustomName(suggested);
      setIsEditingName(false);
    }
  }, [isOpen, fileName, company, role]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#131418] p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <HardDrive size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white m-0">
                  Resume Already Exists
                </h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Google Drive
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                A file named <span className="font-semibold text-slate-800 dark:text-slate-200">"{fileName}"</span> is already in your Drive folder.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Question Prompt */}
        <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 m-0">
            Is this the exact same resume, or a different resume tailored for this job?
          </p>
        </div>

        {/* The 2 Choices */}
        <div className="space-y-3">
          {/* Choice 1: Same Resume */}
          <div
            onClick={onSelectSame}
            className="group relative p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181c] hover:border-emerald-500 dark:hover:border-emerald-500/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      Yes, it's the same resume
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded">
                      Link Existing
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                    Bring the existing link here. No duplicate file will be uploaded to your Google Drive.
                  </p>
                  {existingLink && (
                    <a
                      href={existingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1.5"
                    >
                      <ExternalLink size={10} />
                      <span>Preview file in Google Drive</span>
                    </a>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onSelectSame();
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Bring Link
              </button>
            </div>
          </div>

          {/* Choice 2: Different Resume */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181c] shadow-xs">
            <div className="flex items-start gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    No, it's a different resume
                  </span>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.2 rounded">
                    Rename & Upload
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                  Renames with <span className="font-semibold text-slate-700 dark:text-slate-300">document + company + role</span> to keep customized versions organized.
                </p>
              </div>
            </div>

            {/* Target New Filename Preview & Edit */}
            <div className="pl-11 pr-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  New Document Name:
                </label>
                {!isEditingName && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit3 size={10} />
                    <span>Edit name</span>
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-500 dark:border-blue-500/60 bg-blue-50/30 dark:bg-blue-500/10 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none"
                    placeholder="Enter filename..."
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 font-mono text-xs text-blue-600 dark:text-blue-400 truncate">
                  <span className="truncate font-semibold">{customName}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSelectDifferent(customName || computeRenamedResume(fileName, company, role))}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
              >
                <Sparkles size={13} />
                <span>Rename & Upload to Drive</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

