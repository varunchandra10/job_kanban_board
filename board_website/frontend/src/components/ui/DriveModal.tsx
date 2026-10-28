import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { requestGoogleDriveAccess } from '../../utils/googleAuth';
import {
  HardDrive,
  X,
  Check,
  ShieldCheck,
  ArrowUpRight,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  Database,
  Cloud,
} from 'lucide-react';

export const DriveModal: React.FC = () => {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    gdriveStatus,
    setGdriveStatus,
    showToast,
    storageMode,
    requestStorageModeChange,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasOAuth, setHasOAuth] = useState(false);

  useEffect(() => {
    if (isDriveModalOpen) {
      setErrorMsg('');
      setHasOAuth(!!localStorage.getItem('google_drive_access_token'));
    }
  }, [isDriveModalOpen]);

  useEffect(() => {
    if (!isDriveModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        setIsDriveModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDriveModalOpen, loading, setIsDriveModalOpen]);

  if (!isDriveModalOpen) return null;

  const closeModal = () => {
    if (!loading) setIsDriveModalOpen(false);
  };

  const handleAuthorizeOAuth = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await requestGoogleDriveAccess();
      setHasOAuth(true);
      setGdriveStatus({ ...gdriveStatus, connected: true });
      showToast('Google Drive account authorized!');

      // If current storage mode is local_storage, prompt user with confirmation modal to switch to Google Drive
      if (storageMode !== 'g_drive') {
        requestStorageModeChange('g_drive');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authorization was cancelled');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drive-modal-title"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="relative border-b border-slate-200 dark:border-white/10 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <HardDrive size={22} strokeWidth={2} />
              </div>

              <div>
                <h2 id="drive-modal-title" className="m-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Google Drive Cloud Storage
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Direct 1-Click access to store and sync your resumes in Google Drive.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              aria-label="Close Google Drive modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          {/* Active Storage Engine Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              {storageMode === 'local_storage' ? (
                <Database size={15} className="text-indigo-500 shrink-0" />
              ) : (
                <Cloud size={15} className="text-purple-500 shrink-0" />
              )}
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active Storage Engine:
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                storageMode === 'local_storage'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
              }`}>
                {storageMode === 'local_storage' ? 'Local Storage' : 'Google Drive'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                requestStorageModeChange(storageMode === 'local_storage' ? 'g_drive' : 'local_storage');
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Switch Storage
            </button>
          </div>
        </div>

        {/* Modal Body: Pure 1-Click Google Drive Connection */}
        <div className="space-y-4 px-6 py-6">
          <div className={`rounded-2xl border p-5 transition-all ${
            hasOAuth
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-blue-500/25 bg-blue-50/50 dark:bg-blue-500/5'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    Direct Personal Google Drive
                  </h3>
                  {hasOAuth ? (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
                      1-Click
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                  {hasOAuth
                    ? 'Your personal Google account is authorized. Resumes are saved directly into your 15 GB Google Drive quota in a dedicated "job_kanban_board" folder.'
                    : 'Authorize your Google Drive in 1 click. Zero manual service account sharing or folder IDs needed.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAuthorizeOAuth}
                disabled={loading}
                className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 text-white ${
                  hasOAuth
                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                }`}
              >
                {loading ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                <span>{hasOAuth ? 'Re-authorize' : 'Authorize 1-Click'}</span>
              </button>
            </div>

            {hasOAuth && (
              <div className="mt-4 pt-3.5 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check size={14} strokeWidth={2.5} /> Direct 1-Click Sync Active
                </span>
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Open Google Drive
                  <ArrowUpRight size={13} />
                </a>
              </div>
            )}
          </div>

          {/* Privacy & Control Note */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Your Google Drive tokens remain strictly in your browser. The app only creates and accesses files inside your dedicated Job Tracker folder.
            </span>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-relaxed text-red-600 dark:text-red-400">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-4">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck size={14} />
            <span>100% private to your Google account</span>
          </div>

          <button
            type="button"
            onClick={closeModal}
            disabled={loading}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};