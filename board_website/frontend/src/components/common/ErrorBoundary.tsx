import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Home,
  ShieldAlert,
} from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'global' | 'route' | 'component';
  fallbackTitle?: string;
  onReset?: () => void;
  fallback?: ReactNode | ((props: { error: Error; resetError: () => void }) => ReactNode);
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

/**
 * Universal React Error Boundary (CWE-755 / WSOD Protection)
 *
 * Catches unhandled JavaScript runtime exceptions in child component trees,
 * logs detailed error diagnostics, and renders a fault-tolerant recovery interface
 * instead of letting React unmount the entire DOM into a blank white screen.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[React ErrorBoundary Caught Exception]:', error, errorInfo);
  }

  public resetError = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('[ErrorBoundary onReset error]:', err);
      }
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false,
    });
  };

  public handleReload = () => {
    window.location.reload();
  };

  public handleClearCorruptCache = () => {
    try {
      const keysToPurge = [
        'job_tracker_apps',
        'job_tracker_learnings',
        'job_tracker_profile',
        'job_tracker_quicklinks',
        'job_tracker_mutation_queue',
        'job_tracker_id_map',
        'job_tracker_dead_letter_queue',
      ];
      keysToPurge.forEach(k => {
        try {
          localStorage.removeItem(k);
        } catch (_) {}
      });
      sessionStorage.clear();
    } catch (_) {}
    window.location.href = '/';
  };

  public copyDiagnosticInfo = () => {
    const { error, errorInfo } = this.state;
    const diagnosticPayload = [
      `Job Tracker Error Report`,
      `Time: ${new Date().toISOString()}`,
      `URL: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Error Name: ${error?.name || 'Error'}`,
      `Error Message: ${error?.message || 'Unknown error'}`,
      `Stack Trace:`,
      error?.stack || 'No stack trace available',
      `Component Stack:`,
      errorInfo?.componentStack || 'No component stack available',
    ].join('\n\n');

    navigator.clipboard.writeText(diagnosticPayload).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    });
  };

  public toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render(): ReactNode {
    const { hasError, error, errorInfo, copied, showDetails } = this.state;
    const { children, level = 'global', fallback, fallbackTitle } = this.props;

    if (!hasError) {
      return children;
    }

    // Custom fallback override
    if (typeof fallback === 'function' && error) {
      return fallback({ error, resetError: this.resetError });
    }
    if (fallback && typeof fallback !== 'function') {
      return fallback;
    }

    const title = fallbackTitle || (level === 'global' ? 'Application Encountered an Unexpected Error' : 'This view encountered a display problem');
    const subtitle = level === 'global'
      ? 'A runtime error prevented this page from rendering. Your data is safe. You can reload, reset the cached state, or report the diagnostic trace below.'
      : 'An unexpected error occurred while rendering this section. You can try refreshing this view or clearing corrupt client cache.';

    // Route / Inline Component Level Fallback
    if (level === 'route' || level === 'component') {
      return (
        <div className="w-full my-auto py-8 px-4 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white dark:bg-[#18181b] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.resetError}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors"
              >
                <RefreshCw size={14} />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleClearCorruptCache}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 font-medium text-xs transition-colors"
              >
                <Trash2 size={14} />
                Clear Cache
              </button>
            </div>

            {/* Diagnostic Details Toggle */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-4 text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <span>Diagnostic Information</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDetails && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-red-600 dark:text-red-400 truncate max-w-[80%]">
                      {error?.toString()}
                    </span>
                    <button
                      type="button"
                      onClick={this.copyDiagnosticInfo}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-[10px] leading-tight overflow-x-auto max-h-48 border border-white/10">
                    {error?.stack}
                    {errorInfo?.componentStack}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Global Root Level Fallback Screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#18181b] to-black text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="max-w-2xl w-full bg-[#18181b]/95 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-28 bg-red-500/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert size={26} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/40">
                Crash Protection Active
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {title}
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-8">
            {subtitle}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <button
              type="button"
              onClick={this.resetError}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-blue-600/20"
            >
              <RotateCcw size={16} />
              Recover View
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs transition-colors border border-white/10"
            >
              <RefreshCw size={16} />
              Reload Page
            </button>
            <button
              type="button"
              onClick={this.handleClearCorruptCache}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs transition-colors border border-amber-500/30"
            >
              <Trash2 size={16} />
              Clear Corrupt Cache
            </button>
          </div>

          {/* Diagnostic Trace Section */}
          <div className="border-t border-white/10 pt-5">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <span>Technical Trace Details</span>
                {showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                type="button"
                onClick={this.copyDiagnosticInfo}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors border border-white/10"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Diagnostic Copied!' : 'Copy Diagnostics'}</span>
              </button>
            </div>

            {showDetails && (
              <div className="mt-3">
                <div className="p-3 mb-2 rounded-xl bg-red-950/40 border border-red-900/40 text-red-300 font-mono text-xs break-all">
                  <strong>{error?.name}:</strong> {error?.message}
                </div>
                <pre className="p-4 rounded-xl bg-black/80 border border-white/10 text-slate-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 select-all">
                  {error?.stack}
                  {errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
