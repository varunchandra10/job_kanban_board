import React from 'react';
import {
  Trash2,
  AlertTriangle,
  HardDrive,
  FileText,
} from 'lucide-react';
import { Application } from '../../types';
import { Modal } from './Modal';

interface DeleteApplicationModalProps {
  isOpen: boolean;
  application: Application | null;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isDeleting?: boolean;
}

const getFileName = (pathStr?: string, fallback: string = 'Document') => {
  if (!pathStr) return fallback;
  if (pathStr.includes('drive.google.com') || pathStr.includes('docs.google.com')) {
    return 'Google Drive File';
  }
  try {
    const urlMatch = pathStr.match(/[?&]name=([^&]+)/);
    if (urlMatch) return decodeURIComponent(urlMatch[1]);
  } catch (_) {}
  const clean = pathStr.split('?')[0];
  const parts = clean.split(/[/\\]/);
  const last = parts.pop();
  return last || fallback;
};

export const DeleteApplicationModal: React.FC<DeleteApplicationModalProps> = ({
  isOpen,
  application,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  if (!isOpen || !application) return null;

  const hasResume = Boolean(application.resume_path);
  const hasCover = Boolean(application.cover_letter_path);
  const hasFiles = hasResume || hasCover;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title="Delete Application?"
      subtitle="This action cannot be undone."
      icon={
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
          <Trash2 size={20} />
        </div>
      }
      maxWidth="md"
      zIndex={120}
      cancelLabel="Cancel"
      submitLabel="Yes, Delete from DB & Drive"
      submitVariant="danger"
      onSubmit={onConfirm}
      isSubmitting={isDeleting}
    >
      <div className="space-y-4">
        {/* Target Application Badge */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate m-0">
              {application.company}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate m-0 mt-0.5">
              {application.role || 'Software Engineer'}
            </p>
          </div>
          <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            {application.stage}
          </span>
        </div>

        {/* Warning Callout Box */}
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900 dark:text-red-200 leading-relaxed">
            <p className="font-bold m-0 mb-1 text-red-700 dark:text-red-300">
              Are you sure you want to delete this application?
            </p>
            <p className="m-0 text-[11.5px] opacity-90">
              This will permanently delete this application from the database.{' '}
              <span className="font-bold underline decoration-red-400">
                Attached files will also be permanently deleted from your Google Drive
              </span>
              .
            </p>
          </div>
        </div>

        {/* Attached Files List (if any) */}
        {hasFiles && (
          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/80 dark:border-amber-500/20">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">
              <HardDrive size={12} />
              <span>Files to be deleted from Google Drive / Storage:</span>
            </div>
            <div className="space-y-1.5">
              {hasResume && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate">
                  <FileText size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate font-semibold">
                    Resume: {getFileName(application.resume_path, 'Resume Document')}
                  </span>
                </div>
              )}
              {hasCover && (
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate">
                  <FileText size={13} className="text-purple-500 shrink-0" />
                  <span className="truncate font-semibold">
                    Cover Letter: {getFileName(application.cover_letter_path, 'Cover Letter Document')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
