import React, { useEffect, useState } from 'react';
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
  FolderOpen,
  Folder,
} from 'lucide-react';

import { isDesktopApp } from '../../utils/environment';
import { api } from '../../services/api';

export const StorageSwitchModal: React.FC = () => {
  const {
    isStorageConfirmModalOpen,
    pendingStorageMode,
    storageMode,
    confirmStorageModeChange,
    cancelStorageModeChange,
    showToast,
  } = useApp();

  const isDesktop = isDesktopApp();
  const [localDir, setLocalDir] = useState<string>('');
  const [canOpenFolder, setCanOpenFolder] = useState<boolean>(false);
  const [customPathInput, setCustomPathInput] = useState<string>('');
  const [isEditingPath, setIsEditingPath] = useState<boolean>(false);
  const [isSavingPath, setIsSavingPath] = useState<boolean>(false);

  useEffect(() => {
    if (!isStorageConfirmModalOpen) return;

    api.getLocalStorageInfo()
      .then((info) => {
        if (info.activeDir) {
          setLocalDir(info.activeDir);
          setCustomPathInput(info.activeDir);
        }
        setCanOpenFolder(info.canOpenFolder || isDesktop);
      })
      .catch(() => {});

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelStorageModeChange();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isStorageConfirmModalOpen, cancelStorageModeChange, isDesktop]);

  if (!isStorageConfirmModalOpen || !pendingStorageMode) return null;

  const isSwitchingToLocal = pendingStorageMode === 'local_storage';

  const handleOpenFolder = async () => {
    try {
      if ((window as any).__TAURI__?.core?.invoke) {
        await (window as any).__TAURI__.core.invoke('open_data_folder');
      } else {
        await api.openLocalFolder(localDir);
      }
      showToast('Opening storage folder in File Explorer');
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
          setIsEditingPath(true);
        }
      } else if (typeof (window as any).showDirectoryPicker === 'function') {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle?.name) {
          setCustomPathInput(dirHandle.name);
          setIsEditingPath(true);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Directory browse failed:', err);
      }
    }
  };

  const handleSavePathOnly = async () => {
    const trimmed = customPathInput.trim();
    if (!trimmed) return;
    setIsSavingPath(true);
    try {
      await api.setLocalFolder(trimmed);
      setLocalDir(trimmed);
      setIsEditingPath(false);
      showToast('Storage folder updated with resumes & cover_letter folders!');
    } catch (err: any) {
      showToast('Error: ' + (err.message || 'Failed to update folder'));
    } finally {
      setIsSavingPath(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (isSwitchingToLocal && customPathInput.trim() && customPathInput.trim() !== localDir) {
      try {
        await api.setLocalFolder(customPathInput.trim());
      } catch (err) {
        console.warn('Failed to save preferred folder path:', err);
      }
    }
    confirmStorageModeChange();
  };

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
              <div className="space-y-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs">
                <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-500/10 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      <Folder size={13} className="text-indigo-600 dark:text-indigo-400" />
                      Storage Destination Folder:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditingPath) {
                            setCustomPathInput(localDir || '');
                          }
                          setIsEditingPath(!isEditingPath);
                        }}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {isEditingPath ? 'Cancel' : 'Change Path'}
                      </button>
                      {canOpenFolder && (
                        <button
                          type="button"
                          onClick={handleOpenFolder}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                          title="Open this folder in Windows File Explorer"
                        >
                          <FolderOpen size={12} />
                          <span>Open in Explorer</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPath ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customPathInput}
                          onChange={(e) => setCustomPathInput(e.target.value)}
                          placeholder="e.g. C:\Users\YourName\Documents\Resumes"
                          className="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-indigo-200 dark:border-indigo-500/40 bg-white dark:bg-black/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleBrowseFolder}
                          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-500/30 bg-white dark:bg-indigo-500/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition cursor-pointer"
                          title="Browse folder on your computer"
                        >
                          <FolderOpen size={13} />
                          <span>Browse...</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400">
                        <span>Resumes &amp; cover_letter subfolders will be auto-created inside.</span>
                        <button
                          type="button"
                          onClick={handleSavePathOnly}
                          disabled={isSavingPath || !customPathInput.trim()}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          {isSavingPath ? 'Saving...' : 'Save Path'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <code className="block text-[11px] font-mono break-all bg-white dark:bg-black/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-500/20 text-slate-800 dark:text-indigo-300 select-all">
                        {localDir || customPathInput || 'Default Documents Folder'}
                      </code>
                      <p className="text-[10px] text-indigo-700/80 dark:text-indigo-300/80 m-0 pl-0.5">
                        📁 Contains auto-created <code>resumes/</code> and <code>cover_letter/</code> subfolders.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Fast &amp; Private:</strong> Files are stored directly in your private database account without requiring Google Drive OAuth or cloud permissions.
                  </span>
                </div>
                {isDesktop ? (
                  <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Windows System Disk Storage:</strong> Files are stored locally on your PC hard drive for instant offline access and file explorer viewing.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Mobile &amp; Web Device Storage:</strong> Tapping attached files downloads directly to your phone's native <em>Files / Downloads</em> folder.
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero Setup:</strong> No service account emails or Google Drive folder IDs needed.
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
            onClick={handleConfirmSwitch}
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
