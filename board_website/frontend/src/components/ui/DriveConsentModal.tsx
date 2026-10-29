import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { requestGoogleDriveAccess, getStoredGoogleDriveToken } from '../../utils/googleAuth';
import { X, ShieldCheck, Check, HardDrive, ArrowRight, Loader2, Sparkles, Folder } from 'lucide-react';

export const DriveConsentModal: React.FC = () => {
  const {
    isAuthenticated,
    gdriveStatus,
    setGdriveStatus,
    setStorageMode,
    showToast,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      return;
    }

    const hasToken = !!getStoredGoogleDriveToken();
    const explicitPreference = localStorage.getItem('job_tracker_storage_preference');
    const dismissedThisSession = sessionStorage.getItem('dismissed_drive_consent') === 'true';

    // Show consent prompt if Google Drive is not connected and user hasn't explicitly chosen local_storage
    if (!hasToken && explicitPreference !== 'local_storage' && !dismissedThisSession) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [isAuthenticated, gdriveStatus.connected]);

  if (!isOpen) return null;

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    setErrorMsg('');
    try {
      await requestGoogleDriveAccess();
      setGdriveStatus(prev => ({ ...prev, connected: true }));
      setStorageMode('g_drive');
      localStorage.setItem('job_tracker_storage_preference', 'g_drive');
      showToast('Google Drive connected! Your cloud storage is ready.');
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Drive authorization was cancelled. You can try again or use Local Storage.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleChooseLocalStorage = () => {
    setStorageMode('local_storage');
    localStorage.setItem('job_tracker_storage_preference', 'local_storage');
    showToast('Switched to Local Storage. Documents will be saved on this device.');
    setIsOpen(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('dismissed_drive_consent', 'true');
    setIsOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151518] p-6 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow ambient background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          disabled={isConnecting}
          className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Remind me later"
        >
          <X size={18} />
        </button>

        {/* Drive Tri-Color Icon Badge */}
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#202024] border border-slate-200/80 dark:border-white/10 shadow-lg shadow-blue-500/10 flex items-center justify-center">
            <svg viewBox="0 0 87.3 78" width="30" height="27" className="shrink-0 drop-shadow-sm">
              <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L29 52.2H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
              <path d="M43.65 25.15L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.35.6-.55 1.2-.7 1.85h29z" fill="#00AC47" />
              <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H58.3L73.55 76.8z" fill="#EA4335" />
              <path d="M43.65 25.15L58.25 0H29.05l14.6 25.15z" fill="#00832D" />
              <path d="M58.3 52.2H29L13.75 76.8c1.35.8 2.85 1.2 4.45 1.2H69.1c1.6 0 3.1-.45 4.45-1.2z" fill="#2684FC" />
              <path d="M73.4 26.5L58.25 0c-1.35.8-2.5 1.9-3.3 3.3L43.65 25.15 58.3 52.2h29c0-1.55-.4-3.1-1.2-4.5z" fill="#FFBA00" />
            </svg>
          </div>
        </div>

        {/* Status Pill */}
        <div className="text-center mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles size={11} className="text-blue-500" />
            <span>Primary Cloud Storage</span>
          </span>
        </div>

        {/* Modal Title */}
        <h3 className="font-['Outfit',sans-serif] text-center text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
          Connect Your Google Drive
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-center text-slate-600 dark:text-slate-400 mt-2 mb-5 leading-relaxed m-0">
          Job Tracker stores your tailored resumes, cover letters, and interview notes directly in your personal Google Drive so you never lose them.
        </p>

        {/* Benefits List */}
        <div className="space-y-2 mb-6 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
            <span><strong>100% Private:</strong> Saved in your own Google account</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
            <span><strong>1-Click Setup:</strong> Secure official Google popup window</span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
            <span><strong>Multi-Device:</strong> Access files seamlessly across Web &amp; Desktop</span>
          </div>
        </div>

        {/* Error Notice */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          {/* Primary Button: Connect Google Drive (1-Click) */}
          <button
            type="button"
            onClick={handleConnectDrive}
            disabled={isConnecting}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 87.3 78" width="16" height="14.3" className="shrink-0">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L29 52.2H0c0 1.55.4 3.1 1.2 4.5z" fill="#FFFFFF" />
                  <path d="M43.65 25.15L29.05 0c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.35.6-.55 1.2-.7 1.85h29z" fill="#FFFFFF" />
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.7c.8-1.4 1.2-2.95 1.2-4.5H58.3L73.55 76.8z" fill="#FFFFFF" />
                  <path d="M43.65 25.15L58.25 0H29.05l14.6 25.15z" fill="#FFFFFF" />
                  <path d="M58.3 52.2H29L13.75 76.8c1.35.8 2.85 1.2 4.45 1.2H69.1c1.6 0 3.1-.45 4.45-1.2z" fill="#FFFFFF" />
                  <path d="M73.4 26.5L58.25 0c-1.35.8-2.5 1.9-3.3 3.3L43.65 25.15 58.3 52.2h29c0-1.55-.4-3.1-1.2-4.5z" fill="#FFFFFF" />
                </svg>
                <span>Connect Google Drive (1-Click)</span>
              </>
            )}
          </button>

          {/* Secondary Button: Use Local Storage instead */}
          <button
            type="button"
            onClick={handleChooseLocalStorage}
            disabled={isConnecting}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Folder size={13} className="text-slate-400" />
            <span>Use Local Storage instead</span>
          </button>
        </div>

        {/* Security Assurance */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
          <ShieldCheck size={13} className="text-emerald-500 shrink-0" />
          <span>Encrypted OAuth 2.0 &bull; Private JobTracker_Files folder</span>
        </div>
      </div>
    </div>
  );
};

