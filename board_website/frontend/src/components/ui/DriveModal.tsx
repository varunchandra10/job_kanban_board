import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { requestGoogleDriveAccess } from '../../utils/googleAuth';
import {
  HardDrive,
  X,
  Check,
  Copy,
  CheckCheck,
  AlertCircle,
  FolderOpen,
  ShieldCheck,
  ArrowUpRight,
  LoaderCircle,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
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

  const [folderId, setFolderId] = useState(gdriveStatus.folderId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [hasOAuth, setHasOAuth] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const serviceAccountEmail =
    'job-tracker-storage@job-tracker-512318.iam.gserviceaccount.com';

  useEffect(() => {
    if (isDriveModalOpen) {
      setFolderId(gdriveStatus.folderId || '');
      setErrorMsg('');
      setCopiedEmail(false);
      setHasOAuth(!!localStorage.getItem('google_drive_access_token'));
    }
  }, [isDriveModalOpen, gdriveStatus.folderId]);

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

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(serviceAccountEmail);
      setCopiedEmail(true);
      showToast('Service account email copied!');
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setErrorMsg('Unable to copy automatically. Please select and copy the email.');
    }
  };

  const handleAuthorizeOAuth = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await requestGoogleDriveAccess();
      setHasOAuth(true);
      setGdriveStatus({ ...gdriveStatus, connected: true });
      showToast('Personal Google Drive account authorized!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authorization was cancelled');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedFolderId = folderId.trim();

    if (!trimmedFolderId) {
      setErrorMsg('Please enter your Google Drive folder ID.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await api.connectDriveFolder(trimmedFolderId);
      localStorage.setItem('gdrive_folder_id', trimmedFolderId);
      setGdriveStatus({
        connected: true,
        folderId: trimmedFolderId,
      });
      showToast('Google Drive connected successfully!');
      setIsDriveModalOpen(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to connect to Google Drive. Please check your folder ID and permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
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
                  Google Drive Storage
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Connect your Google Drive to store and sync resumes.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              aria-label="Close Google Drive setup"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
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
              Change
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 px-6 py-5 max-h-[70vh] overflow-y-auto">
          {/* PRIMARY: 1-Click Personal Account Access */}
          <div className={`rounded-2xl border p-4 transition-all ${
            hasOAuth
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-blue-500/25 bg-blue-50/50 dark:bg-blue-500/5'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    Direct Google Account Connection
                  </h4>
                  {hasOAuth ? (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                  {hasOAuth
                    ? 'Your Google account is authorized. Resumes and cover letters are stored directly in your personal Google Drive (15 GB quota).'
                    : 'Authorize your Google Drive in 1 click. No service account sharing or folder IDs needed.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAuthorizeOAuth}
                disabled={loading}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 text-white ${
                  hasOAuth
                    ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                }`}
              >
                <ShieldCheck size={13} />
                <span>{hasOAuth ? 'Re-authorize' : 'Authorize 1-Click'}</span>
              </button>
            </div>

            {hasOAuth && (
              <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <Check size={13} /> Direct OAuth Active — uploads will save to your Google Drive
                </span>
                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Open Drive ↗
                </a>
              </div>
            )}
          </div>

          {/* Collapsible Advanced Custom Service Account & Folder Setup */}
          <div className="border border-slate-200/80 dark:border-white/10 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 dark:bg-white/[0.02] text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              <span>Custom Service Account / Folder ID (Advanced)</span>
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAdvanced && (
              <form onSubmit={handleConnect} className="p-4 space-y-4 border-t border-slate-200/80 dark:border-white/10">
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 m-0">
                  Optional: If you need to share documents with an automated service account or specify a custom shared folder:
                </p>

                {/* Step 1 */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    1. Share folder with service account email:
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1 break-all rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] px-3 py-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                      {serviceAccountEmail}
                    </div>
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
                    >
                      {copiedEmail ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1.5">
                  <label htmlFor="drive-folder-id" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    2. Custom Google Drive Folder ID:
                  </label>
                  <div className="relative">
                    <FolderOpen size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="drive-folder-id"
                      type="text"
                      placeholder="Paste folder ID..."
                      value={folderId}
                      onChange={(e) => {
                        setFolderId(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] py-2 pl-9 pr-3 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !folderId.trim()}
                    className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer"
                  >
                    Save Custom Folder
                  </button>
                </div>
              </form>
            )}
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
          <div className="hidden items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 sm:flex">
            <ShieldCheck size={14} />
            Your folder permissions stay in your control.
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};