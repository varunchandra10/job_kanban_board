import React, { useState } from 'react';
import {
  X,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Bookmark,
  Smartphone,
  ChevronDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface JobClipperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JobClipperModal: React.FC<JobClipperModalProps> = ({ isOpen, onClose }) => {
  const { showToast, currentUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [showMobileGuide, setShowMobileGuide] = useState(false);

  if (!isOpen) return null;

  // Retrieve origin and token
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kanban-board-job.vercel.app';
  const token = typeof window !== 'undefined' ? localStorage.getItem('job_tracker_token') || '' : '';

  // Minified bookmarklet code
  const bookmarkletCode = `javascript:(function(){window._JT_ORIGIN="${origin}";window._JT_TOKEN="${token}";var s=document.createElement('script');s.src='${origin}/clipper.js?t='+Date.now();document.body.appendChild(s);})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode).then(() => {
      setCopied(true);
      showToast('Clipper code copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#131418] p-5 sm:p-6 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs">
              <Zap size={18} className="fill-orange-500/20" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>1-Click Universal Job Clipper</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  Bookmarklet
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Clip job postings from LinkedIn, Indeed, Naukri, or any company careers page into your Kanban board with 1 click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Drag-and-Drop Action Box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-orange-500/[0.06] to-amber-500/[0.02] border border-orange-500/20 text-center mb-5">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-orange-500" />
            <span>Drag this button to your Bookmarks Bar</span>
          </div>

          <div className="inline-block py-2">
            <a
              href={bookmarkletCode}
              onClick={(e) => {
                e.preventDefault();
                showToast('Drag this button to your bookmarks bar, or click "Copy Code" below!');
              }}
              title="Drag this button to your browser bookmarks bar"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all cursor-grab select-none ring-2 ring-orange-500/30"
            >
              <Zap size={16} className="fill-current" />
              <span>⚡ Clip to Job Tracker</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            (Don't see your bookmarks bar? Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-[10px]">Ctrl + Shift + B</kbd> or <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-mono text-[10px]">Cmd + Shift + B</kbd>)
          </p>
        </div>

        {/* 3 Simple Steps */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            How It Works:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
              <span className="font-extrabold text-orange-500 mr-1.5">1.</span>
              <span className="text-slate-700 dark:text-slate-300">Drag the button to your browser's bookmarks bar.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
              <span className="font-extrabold text-orange-500 mr-1.5">2.</span>
              <span className="text-slate-700 dark:text-slate-300">Open any job on LinkedIn, Indeed, or company site.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5">
              <span className="font-extrabold text-orange-500 mr-1.5">3.</span>
              <span className="text-slate-700 dark:text-slate-300">Click the bookmark. It auto-fills and saves to your board!</span>
            </div>
          </div>
        </div>

        {/* Copy Code & Manual Setup */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Code Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Bookmarklet Code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowMobileGuide((prev) => !prev)}
            className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <Smartphone size={13} />
            <span>Mobile Guide</span>
            <ChevronDown size={13} className={`transition-transform ${showMobileGuide ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsible Mobile Browser Guide */}
        {showMobileGuide && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 text-[11.5px] text-slate-600 dark:text-slate-400 leading-relaxed space-y-1 animate-in fade-in duration-150">
            <div className="font-bold text-slate-800 dark:text-slate-200">Using on Chrome / Safari Mobile:</div>
            <div>1. Click <strong>"Copy Bookmarklet Code"</strong> above.</div>
            <div>2. Bookmark any page on your phone and name it <strong>"Clip to Tracker"</strong>.</div>
            <div>3. Edit the bookmark, delete the URL, and paste the copied code into the URL field.</div>
            <div>4. When on any job page on your phone, type <strong>"Clip"</strong> in the browser search bar and tap your bookmark!</div>
          </div>
        )}
      </div>
    </div>
  );
};

