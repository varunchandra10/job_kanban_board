import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api, isTauri } from '../../services/api';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Pencil,
  Check,
  FolderSearch,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const StorageSwitchModal: React.FC = () => {
  const {
    storageMode,
    pendingStorageMode,
    isStorageConfirmModalOpen,
    confirmStorageModeChange,
    cancelStorageModeChange,
    showToast,
    applications,
  } = useApp();

  const isDesktop = isTauri;
  const [localDir, setLocalDir] = useState<string>('');
  const [customPathInput, setCustomPathInput] = useState<string>('');
  const [isEditingPath, setIsEditingPath] = useState<boolean>(false);
  const [canOpenFolder, setCanOpenFolder] = useState<boolean>(false);
  const [isSavingPath, setIsSavingPath] = useState<boolean>(false);
  const [shouldSyncAfterSwitch, setShouldSyncAfterSwitch] = useState<boolean>(true);

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
  }, [isStorageConfirmModalOpen, isDesktop]);

  if (!isStorageConfirmModalOpen || !pendingStorageMode) return null;

  const isSwitchingToLocal = pendingStorageMode === 'local_storage';

  const handleOpenFolder = async () => {
    try {
      await api.openLocalFolder(customPathInput.trim() || localDir);
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
      const res = await api.setLocalFolder(trimmed);
      setLocalDir(res.folderPath);
      setCustomPathInput(res.folderPath);
      setIsEditingPath(false);
      showToast('Custom directory saved: ' + res.folderPath);
    } catch (err: any) {
      showToast('Could not save folder: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSavingPath(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (isSwitchingToLocal && isEditingPath) {
      const trimmed = customPathInput.trim();
      if (trimmed && trimmed !== localDir) {
        try {
          const res = await api.setLocalFolder(trimmed);
          setLocalDir(res.folderPath);
        } catch (e: any) {
          console.warn('Directory save note:', e);
        }
      }
    }
    confirmStorageModeChange();

    if (shouldSyncAfterSwitch) {
      showToast('Started background document sync between Local & Drive...');
      api.syncDocuments(applications).then((res) => {
        showToast(`Sync complete! ${res.uploadedToDrive} uploaded to Drive, ${res.downloadedToLocal} saved locally.`);
      }).catch((e) => {
        console.warn('Sync notice:', e);
      });
    }
  };

  return (
    <Modal
      isOpen={isStorageConfirmModalOpen}
      onClose={cancelStorageModeChange}
      title={isSwitchingToLocal ? 'Switch to Local Storage?' : 'Switch to Google Drive?'}
      subtitle="Choose where attached resumes and career documents are saved."
      icon={
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg ${
            isSwitchingToLocal
              ? 'bg-gradient-to-br from-indigo-500 to-blue-600 shadow-indigo-500/25'
              : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/25'
          }`}
        >
          {isSwitchingToLocal ? <Database size={20} strokeWidth={2.2} /> : <Cloud size={20} strokeWidth={2.2} />}
        </div>
      }
      maxWidth="lg"
      zIndex={99999}
      footer={
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
      }
    >
      <div className="space-y-5">
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
                    <FolderOpen size={13} className="text-indigo-600 dark:text-indigo-400" />
                    <span>Target Folder on your Computer:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {canOpenFolder && (
                      <button
                        type="button"
                        onClick={handleOpenFolder}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white underline cursor-pointer"
                      >
                        <FolderOpen size={12} />
                        <span>Open Folder</span>
                      </button>
                    )}
                    {!isEditingPath && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPath(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white underline ml-2 cursor-pointer"
                      >
                        <Pencil size={11} />
                        <span>Change</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditingPath ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={customPathInput}
                        onChange={(e) => setCustomPathInput(e.target.value)}
                        placeholder="e.g. C:\Users\YourName\Documents\JobResumes"
                        className="flex-1 rounded-lg border border-indigo-300 dark:border-indigo-500/50 bg-white dark:bg-black/40 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleBrowseFolder}
                        title="Browse folders"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <FolderSearch size={13} />
                        <span>Browse</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePathOnly}
                        disabled={isSavingPath}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        <Check size={13} />
                        <span>Save</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      You can paste any local folder path or browse to keep your job PDFs in your preferred folder.
                    </p>
                  </div>
                ) : (
                  <code className="block rounded-lg bg-white/80 dark:bg-black/30 border border-indigo-200/60 dark:border-white/10 px-3 py-2 text-[11px] font-mono text-indigo-950 dark:text-indigo-200 truncate select-all">
                    {localDir || '~/JobTracker_Files/documents'}
                  </code>
                )}
              </div>

              <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Offline Access:</strong> Resumes and cover letters are stored directly in your local directory.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Private &amp; Secure:</strong> Zero cloud uploads — your career files remain entirely on your physical workstation.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4 text-xs">
              <div className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Private Google Drive Folder:</strong> Saved in an isolated <code className="bg-slate-200/70 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">JobTracker_Files</code> folder on your account.
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

        <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-xs font-semibold text-blue-900 dark:text-blue-200 cursor-pointer transition hover:bg-blue-100/80 dark:hover:bg-blue-500/15">
          <input
            type="checkbox"
            checked={shouldSyncAfterSwitch}
            onChange={(e) => setShouldSyncAfterSwitch(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
          />
          <span>
            {isSwitchingToLocal
              ? 'Also download Google Drive documents to local folder for offline access'
              : 'Also mirror existing local documents to Google Drive'}
          </span>
        </label>

        <div className="flex items-start gap-2 text-[11.5px] text-slate-500 dark:text-slate-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
          <span>
            Previously attached documents will remain accessible where they were uploaded. This toggle sets your default for new uploads.
          </span>
        </div>
      </div>
    </Modal>
  );
};
