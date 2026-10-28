import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HardDrive,
  Database,
  ArrowRight,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';

export const StorageSwitchModal: React.FC = () => {
  const {
    isStorageConfirmModalOpen,
    pendingStorageMode,
    storageMode,
    confirmStorageModeChange,
    cancelStorageModeChange,
  } = useApp();

  useEffect(() => {
    if (!isStorageConfirmModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelStorageModeChange();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isStorageConfirmModalOpen, cancelStorageModeChange]);

  if (!isStorageConfirmModalOpen || !pendingStorageMode) return null;

  const isSwitchingToLocal = pendingStorageMode === 'local_storage';

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cancelStorageModeChange();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-switch-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#16161a]/95 text-slate-900 dark:text-white shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Ambient Glow */}
        <div className="relative border-b border-slate-200 dark:border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
                  isSwitchingToLocal
                    ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/25'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/25'
                }`}
              >
                {isSwitchingToLocal ? <Database size={22} strokeWidth={2.2} /> : <Cloud size={22} strokeWidth={2.2} />}
              </div>

              <div>
                <h2 id="storage-switch-title" className="m-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {isSwitchingToLocal ? 'Switch to Local Storage?' : 'Switch to Google Drive?'}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Choose where attached resumes and career documents are saved.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={cancelStorageModeChange}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Transition Comparison Pill */}
          <div className="flex items-center justify-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>{storageMode === 'local_storage' ? 'Local Storage' : 'Google Drive'}</span>
            </div>

            <ArrowRight size={16} className="text-slate-400 shrink-0" />

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-xs ${
                isSwitchingToLocal
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                  : 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isSwitchingToLocal ? 'bg-indigo-500' : 'bg-purple-500'
                }`}
              />
              <span>{isSwitchingToLocal ? 'Local Storage (Active)' : 'Google Drive (Active)'}</span>
            </div>
          </div>

          {/* Key Advantages of the selected mode */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              What this means:
            </h4>

            {isSwitchingToLocal ? (
              <div className="space-y-2 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Fast &amp; Offline Ready:</strong> Files are stored directly inside the database without depending on external Google API connections.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Setup Required:</strong> You don't need to configure Google Drive folder IDs or grant service account permissions.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Default for Desktop App:</strong> Recommended for the desktop executable for swift file handling.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cloud Backup:</strong> Resumes and cover letters are organized in your 15 GB personal Google Drive storage.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Multi-Device Access:</strong> Open and download your tailored PDFs directly from any phone, browser, or Google Drive folder.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Default for Web App:</strong> Recommended when accessing Job Tracker across multiple public web browsers.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              Previously attached documents will remain accessible where they were uploaded. This toggle only controls future uploads.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] px-6 py-4">
          <button
            type="button"
            onClick={cancelStorageModeChange}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={confirmStorageModeChange}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-md transition cursor-pointer ${
              isSwitchingToLocal
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/25'
            }`}
          >
            {isSwitchingToLocal ? <Database size={14} /> : <Cloud size={14} />}
            <span>Confirm &amp; Switch Storage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
