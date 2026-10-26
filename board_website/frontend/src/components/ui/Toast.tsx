import React from 'react';
import { useApp } from '../../context/AppContext';

export const Toast: React.FC = () => {
  const { toast } = useApp();

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[999999] flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-2xl border border-slate-800 dark:border-slate-200 text-xs font-semibold animate-in slide-in-from-bottom-4 duration-150"
      role="status"
    >
      <span>{toast.message}</span>
      {toast.undoAction && (
        <button
          type="button"
          onClick={() => {
            if (toast.undoAction) toast.undoAction();
          }}
          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
        >
          Undo
        </button>
      )}
    </div>
  );
};
