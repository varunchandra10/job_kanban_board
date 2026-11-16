import React from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';

export const ShutdownModal: React.FC = () => {
  const { isShutdownOpen, setIsShutdownOpen, showToast } = useApp();

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
    <Modal
      isOpen={isShutdownOpen}
      onClose={() => setIsShutdownOpen(false)}
      title="Close Application Tracker?"
      icon={
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle size={22} />
        </div>
      }
      maxWidth="md"
      zIndex={99999}
      cancelLabel="Cancel"
      submitLabel="Yes, Shut Down"
      submitVariant="danger"
      onSubmit={handleConfirmShutdown}
    >
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed m-0">
        This will stop the local background server and close the terminal. You will need to rerun{' '}
        <code className="bg-slate-100 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-[11px]">start.bat</code> to launch it again.
      </p>
    </Modal>
  );
};
