import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
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
} from 'lucide-react';

export const DriveModal: React.FC = () => {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    gdriveStatus,
    setGdriveStatus,
    showToast,
  } = useApp();

  const [folderId, setFolderId] = useState(gdriveStatus.folderId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const serviceAccountEmail =
    'job-tracker-storage@job-tracker-512318.iam.gserviceaccount.com';

  useEffect(() => {
    if (isDriveModalOpen) {
      setFolderId(gdriveStatus.folderId || '');
      setErrorMsg('');
      setCopiedEmail(false);
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
                  Connect a folder to store your job tracker documents.
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
                Secure service account access
              </span>
            </div>

            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                gdriveStatus.connected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {gdriveStatus.connected ? 'CONFIGURED' : 'SETUP REQUIRED'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConnect}>
          <div className="space-y-5 px-6 py-5">
            {/* Step 1 */}
            <section>
              <div className="mb-2.5 flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  1
                </div>

                <div>
                  <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                    Grant folder access
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Share your Google Drive folder with this service account as an <strong>Editor</strong>.
                  </p>
                </div>
              </div>

              <div className="ml-9 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 p-3.5">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <ShieldCheck size={14} />
                  Service account email
                </div>

                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 break-all rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] px-3 py-2 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                    {serviceAccountEmail}
                  </div>

                  <button
                    type="button"
                    onClick={copyEmail}
                    aria-label="Copy service account email"
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                  >
                    {copiedEmail ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copiedEmail ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <a
                  href="https://drive.google.com/drive/my-drive"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-indigo-400 hover:underline"
                >
                  Open Google Drive
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </section>

            {/* Step 2 */}
            <section>
              <div className="mb-2.5 flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                  2
                </div>

                <div>
                  <h3 className="m-0 text-sm font-bold text-slate-900 dark:text-white">
                    Choose your storage folder
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    Paste the folder ID from its Google Drive URL.
                  </p>
                </div>
              </div>

              <div className="ml-9">
                <label htmlFor="drive-folder-id" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Google Drive Folder ID
                </label>

                <div className="relative">
                  <FolderOpen size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="drive-folder-id"
                    type="text"
                    placeholder="Paste folder ID or link here..."
                    value={folderId}
                    onChange={(e) => {
                      setFolderId(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] py-2.5 pl-10 pr-3 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 transition"
                  />
                </div>

                <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  <Info size={13} className="mt-0.5 shrink-0" />
                  <p className="m-0">
                    Example URL: <span className="font-mono text-blue-600 dark:text-indigo-400">drive.google.com/drive/folders/<strong>FOLDER_ID</strong></span>
                  </p>
                </div>
              </div>
            </section>

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
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !folderId.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/25 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}
                {loading ? 'Connecting...' : 'Save & Connect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};