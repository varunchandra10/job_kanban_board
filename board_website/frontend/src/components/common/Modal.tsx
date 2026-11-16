import React, { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full' | string;
export type ModalButtonVariant = 'primary' | 'danger' | 'warning' | 'success' | 'secondary';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  customHeader?: React.ReactNode;
  hideHeader?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;

  // Standard action footer helpers
  cancelLabel?: string;
  submitLabel?: string;
  onSubmit?: (e?: React.FormEvent) => void | Promise<void>;
  isSubmitting?: boolean;
  submitVariant?: ModalButtonVariant;
  disableSubmit?: boolean;
  hideFooter?: boolean;

  // Layout & Styling
  maxWidth?: ModalMaxWidth;
  className?: string;
  panelClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  backdropClassName?: string;
  zIndex?: string | number;
  maxHeight?: string;

  // Behavior & Accessibility
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const MAX_WIDTH_CLASSES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-full',
};

const SUBMIT_VARIANT_CLASSES: Record<ModalButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20',
  danger:
    'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/25',
  warning:
    'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/25',
  success:
    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/25',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-white dark:bg-white/10 dark:hover:bg-white/15',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  headerActions,
  customHeader,
  hideHeader = false,
  hideCloseButton = false,
  children,
  footer,
  cancelLabel = 'Cancel',
  submitLabel,
  onSubmit,
  isSubmitting = false,
  submitVariant = 'primary',
  disableSubmit = false,
  hideFooter = false,
  maxWidth = 'lg',
  className = '',
  panelClassName = '',
  bodyClassName = '',
  footerClassName = '',
  backdropClassName = '',
  zIndex = 50,
  maxHeight = 'max-h-[92vh]',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScroll = true,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // 1. Lock document body scroll on mount, restore on unmount
  useEffect(() => {
    if (!isOpen || !preventScroll) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, preventScroll]);

  // 2. Escape key listener
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const widthClass = MAX_WIDTH_CLASSES[maxWidth] || maxWidth;
  const zIndexStyle = typeof zIndex === 'number' ? { zIndex } : {};
  const zIndexClass = typeof zIndex === 'string' ? zIndex : '';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const hasStandardFooter = !footer && Boolean(onSubmit || submitLabel);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 ${zIndexClass} ${backdropClassName}`}
      style={zIndexStyle}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : ariaLabel}
      aria-labelledby={title ? 'modal-dialog-title' : undefined}
      aria-describedby={ariaDescribedBy}
    >
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        className={`relative w-full ${widthClass} ${maxHeight} rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 ${panelClassName} ${className}`}
      >
        {/* Modal Header */}
        {!hideHeader && (
          <>
            {customHeader ? (
              customHeader
            ) : (
              <div className="shrink-0 flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02]">
                <div className="flex items-start gap-3 min-w-0">
                  {icon && (
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {title && (
                        <h2
                          id="modal-dialog-title"
                          className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white m-0 truncate"
                        >
                          {title}
                        </h2>
                      )}
                      {badge}
                    </div>
                    {subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 leading-relaxed">
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-auto">
                  {headerActions}
                  {!hideCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Close dialog"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal Scrollable Body */}
        <div className={`flex-1 overflow-y-auto px-5 sm:px-6 py-4 ${bodyClassName}`}>
          {children}
        </div>

        {/* Modal Footer */}
        {!hideFooter && (
          <>
            {footer ? (
              footer
            ) : hasStandardFooter ? (
              <div
                className={`shrink-0 flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] ${footerClassName}`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                {onSubmit && (
                  <button
                    type="button"
                    onClick={onSubmit}
                    disabled={disableSubmit || isSubmitting}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                      SUBMIT_VARIANT_CLASSES[submitVariant]
                    }`}
                  >
                    {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                    <span>{submitLabel || 'Save Changes'}</span>
                  </button>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
