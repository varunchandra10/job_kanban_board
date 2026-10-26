import React from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AlertTriangle } from 'lucide-react';

export const ShutdownModal: React.FC = () => {
  const { isShutdownOpen, setIsShutdownOpen, showToast } = useApp();

  if (!isShutdownOpen) return null;

  const handleConfirmShutdown = async () => {
    setIsShutdownOpen(false);
    try {
      await api.shutdown();
      showToast('The background server session has been stopped.');
    } catch {
      showToast('The background server shutdown was requested.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      aria-modal="true"
      role="dialog"
      onClick={() => setIsShutdownOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="text-amber-500 bg-amber-500/10 p-2.5 rounded-xl shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              Close Application Tracker?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed m-0">
              This will stop the local background server and close the terminal. You will need to rerun{' '}
              <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">start.bat</code> to launch it again.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
          <button
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
            onClick={() => setIsShutdownOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm shadow-red-600/30 cursor-pointer"
            onClick={handleConfirmShutdown}
          >
            Yes, Shut Down
          </button>
        </div>
      </div>
    </div>
  );
};
