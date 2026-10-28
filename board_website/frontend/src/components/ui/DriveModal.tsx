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
  FolderOpen,
  Folder,
  FolderCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { isDesktopApp } from '../../utils/environment';
import { api } from '../../services/api';

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

  const isDesktop = isDesktopApp();
  const [activeTab, setActiveTab] = useState<'g_drive' | 'local_storage'>('g_drive');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasOAuth, setHasOAuth] = useState(false);

  // Local storage management state
  const [localInfo, setLocalInfo] = useState<{
    activeDir: string;
    defaultDir: string;
    customDir: string | null;
    canOpenFolder: boolean;
    isDesktop: boolean;
  } | null>(null);
  const [customPathInput, setCustomPathInput] = useState('');
  const [isEditingCustomPath, setIsEditingCustomPath] = useState(false);
  const [savingCustomPath, setSavingCustomPath] = useState(false);

  const fetchLocalInfo = () => {
    api.getLocalStorageInfo()
      .then((info) => {
        setLocalInfo(info);
        if (!customPathInput) {
          setCustomPathInput(info.activeDir);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isDriveModalOpen) {
      setErrorMsg('');
      setHasOAuth(!!localStorage.getItem('google_drive_access_token'));
      setActiveTab(storageMode === 'local_storage' ? 'local_storage' : 'g_drive');
      fetchLocalInfo();
    }
  }, [isDriveModalOpen, storageMode]);

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

      if (storageMode !== 'g_drive') {
        requestStorageModeChange('g_drive');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authorization was cancelled');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLocalFolder = async () => {
    try {
      if ((window as any).__TAURI__?.core?.invoke) {
        await (window as any).__TAURI__.core.invoke('open_data_folder');
      } else {
        await api.openLocalFolder(localInfo?.activeDir);
      }
      showToast('Opened storage folder in Windows File Explorer');
    } catch (err: any) {
      showToast('Could not open folder: ' + (err.message || 'Unknown error'));
    }
  };

  const handleBrowseFolder = async () => {
    try {
      if ((window as any).__TAURI__?.core?.invoke) {
        const selected = await (window as any).__TAURI__.core.invoke('select_folder');
        if (selected) {
          setCustomPathInput(selected);
        }
      } else if (typeof (window as any).showDirectoryPicker === 'function') {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle?.name) {
          setCustomPathInput(dirHandle.name);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory browse failed:', err);
      }
    }
  };

  const handleSaveCustomPath = async () => {
    const trimmed = customPathInput.trim();
    if (!trimmed) return;
    setSavingCustomPath(true);
    setErrorMsg('');
    try {
      await api.setLocalFolder(trimmed);
      showToast('Preferred local storage folder saved!');
      setIsEditingCustomPath(false);
      fetchLocalInfo();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update folder location');
    } finally {
      setSavingCustomPath(false);
    }
  };

  const handleResetDefaultPath = async () => {
    if (!localInfo?.defaultDir) return;
    setSavingCustomPath(true);
    setErrorMsg('');
    try {
      await api.setLocalFolder(localInfo.defaultDir);
      setCustomPathInput(localInfo.defaultDir);
      showToast('Restored default storage directory');
      setIsEditingCustomPath(false);
      fetchLocalInfo();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to restore default');
    } finally {
      setSavingCustomPath(false);
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25">
                {activeTab === 'local_storage' ? (
                  <Database size={22} strokeWidth={2} />
                ) : (
                  <HardDrive size={22} strokeWidth={2} />
                )}
              </div>

              <div>
                <h2 id="drive-modal-title" className="m-0 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Storage &amp; Sync Settings
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Manage where attached resumes and career files are stored.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              aria-label="Close modal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode Switch Tabs */}
          <div className="mt-4 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('local_storage')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'local_storage'
                  ? 'bg-white dark:bg-[#202024] text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database size={14} />
              <span>Local Storage</span>
              {storageMode === 'local_storage' && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('g_drive')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'g_drive'
                  ? 'bg-white dark:bg-[#202024] text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/60 dark:border-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cloud size={14} />
              <span>Google Drive</span>
              {storageMode === 'g_drive' && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 px-6 py-6">
          {activeTab === 'local_storage' ? (
            /* Local Storage Settings Tab */
            <div className="space-y-4">
              <div className="rounded-2xl border border-indigo-500/25 bg-indigo-50/40 dark:bg-indigo-500/5 p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                        Local Disk Storage Location
                      </h3>
                      {storageMode === 'local_storage' ? (
                        <span className="rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Active Mode
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => requestStorageModeChange('local_storage')}
                          className="rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white px-2 py-0.5 text-[10px] font-bold transition cursor-pointer"
                        >
                          Make Active
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed m-0">
                      {isDesktop
                        ? 'Files are saved directly on your Windows PC hard drive into this folder.'
                        : 'Web mode: files are stored securely in your account database with 1-click download to your device.'}
                    </p>
                  </div>

                  {(localInfo?.canOpenFolder || isDesktop) && (
                    <button
                      type="button"
                      onClick={handleOpenLocalFolder}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition cursor-pointer"
                      title="Open this directory in Windows File Explorer"
                    >
                      <FolderOpen size={14} />
                      <span>Open Folder</span>
                    </button>
                  )}
                </div>

                {/* Directory Path Display & Editor */}
                <div className="rounded-xl bg-white dark:bg-black/40 border border-indigo-100 dark:border-indigo-500/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Folder size={12} className="text-indigo-500" />
                      Current Storage Folder:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingCustomPath && localInfo?.activeDir) {
                          setCustomPathInput(localInfo.activeDir);
                        }
                        setIsEditingCustomPath(!isEditingCustomPath);
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {isEditingCustomPath ? 'Cancel' : 'Change Location'}
                    </button>
                  </div>

                  {isEditingCustomPath ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customPathInput}
                          onChange={(e) => setCustomPathInput(e.target.value)}
                          placeholder="e.g. C:\Users\YourName\Documents\Resumes"
                          className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-slate-50 dark:bg-black/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleBrowseFolder}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer"
                          title="Browse and select folder"
                        >
                          <FolderOpen size={14} />
                          <span>Browse...</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleResetDefaultPath}
                          disabled={savingCustomPath}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-[11px] font-semibold transition cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Reset Default</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCustomPath}
                          disabled={savingCustomPath || !customPathInput.trim()}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                          {savingCustomPath ? <LoaderCircle size={12} className="animate-spin" /> : <FolderCheck size={12} />}
                          <span>Save Preferred Location</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <code className="block text-xs font-mono text-slate-800 dark:text-indigo-300 break-all select-all">
                      {localInfo?.activeDir || 'AppData\\Roaming\\JobTracker\\documents'}
                    </code>
                  )}
                </div>
              </div>

              {/* Informative Intimation Box */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Automatic Organization:</strong> Resumes and cover letters uploaded in Local Storage mode are automatically sorted into <code>resume/</code> and <code>cover_letter/</code> subfolders.
                </span>
              </div>
            </div>
          ) : (
            /* Google Drive Cloud Settings Tab */
            <div className="space-y-4">
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
            </div>
          )}

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
            <span>Files remain 100% private and user-controlled</span>
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