import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import {
  HardDrive,
  Layers,
  Code2,
  Bell,
  Smartphone,
  Globe,
  Copy,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Download,
  LogOut,
  RefreshCw,
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Mail,
  Zap,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Sliders,
} from 'lucide-react';
import { soundEffects, SoundCue } from '../../../utils/soundEffects';
import {
  subscribeToPush,
  unsubscribeFromPush,
  checkServerPushStatus,
} from '../../../utils/pushNotifications';

export const ProfileSettingsTab: React.FC = () => {
  const {
    profile,
    updateProfile,
    storageMode,
    requestStorageModeChange,
    openDriveModal,
    gdriveStatus,
    isDsaEnabled,
    toggleDsaTrack,
    applications,
    currentUser,
    isAuthenticated,
    openAuthModal,
    logout,
    showToast,
    setIsClipperModalOpen,
  } = useApp();

  // -------------------------------------------------------------
  // 1. Storage & Sync State
  // -------------------------------------------------------------
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    showToast('Checking and syncing storage files...');
    try {
      const res = await api.syncDocuments(applications);
      if (res.errors && res.errors.length > 0) {
        showToast(`Sync completed with notes: ${res.errors[0]}`);
      } else {
        showToast(`Sync successful! ${res.uploadedToDrive || 0} to Drive, ${res.downloadedToLocal || 0} local.`);
      }
    } catch {
      showToast('Storage is up to date.');
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  // -------------------------------------------------------------
  // 2. Sound FX & Audio State
  // -------------------------------------------------------------
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => soundEffects.getIsMuted());
  const [soundVolume, setSoundVolume] = useState<number>(() => soundEffects.getVolume());

  useEffect(() => {
    return soundEffects.subscribe(() => {
      setIsSoundMuted(soundEffects.getIsMuted());
      setSoundVolume(soundEffects.getVolume());
    });
  }, []);

  const handleToggleSoundMute = () => {
    soundEffects.toggleMute();
  };

  const handleSoundVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    soundEffects.setVolume(val);
  };

  const handleTestSound = (cue: SoundCue = 'chime') => {
    if (isSoundMuted) {
      soundEffects.setMuted(false);
    }
    soundEffects.play(cue);
  };

  // -------------------------------------------------------------
  // 3. Notifications & Reminders State
  // -------------------------------------------------------------
  const [hasPushActive, setHasPushActive] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('job_tracker_push_active') === '1';
  });
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [emailRemindersEnabled, setEmailRemindersEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (currentUser?.id) {
      checkServerPushStatus(currentUser.id).then(status => {
        setHasPushActive(status.hasPush);
        if (status.hasPush) {
          localStorage.setItem('job_tracker_push_active', '1');
        } else {
          localStorage.removeItem('job_tracker_push_active');
        }
      });
    }
  }, [currentUser?.id]);

  const handleTogglePush = async () => {
    if (isPushLoading) return;
    if (!currentUser?.id) {
      showToast('Please sign in to enable device push alerts');
      openAuthModal();
      return;
    }

    setIsPushLoading(true);
    try {
      if (hasPushActive) {
        const ok = await unsubscribeFromPush(currentUser.id);
        if (ok) {
          setHasPushActive(false);
          localStorage.removeItem('job_tracker_push_active');
          showToast('Turned off browser push notifications');
        } else {
          showToast('Could not unsubscribe from notifications');
        }
      } else {
        const ok = await subscribeToPush(currentUser.id);
        if (ok) {
          setHasPushActive(true);
          localStorage.setItem('job_tracker_push_active', '1');
          showToast('Push notifications enabled on this browser');
        } else {
          showToast('Could not enable push (check browser permissions)');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Push notification configuration failed');
    } finally {
      setIsPushLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 4. Public Portfolio Showcase State
  // -------------------------------------------------------------
  const [portfolioSlug, setPortfolioSlug] = useState('');
  const [isPortfolioPublic, setIsPortfolioPublic] = useState(false);
  const [portfolioHeadline, setPortfolioHeadline] = useState('');
  const [portfolioBio, setPortfolioBio] = useState('');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [slugMessage, setSlugMessage] = useState('');
  const [isCopiedPortfolio, setIsCopiedPortfolio] = useState(false);
  const [isSavingPortfolio, setIsSavingPortfolio] = useState(false);
  const [isPortfolioEditorOpen, setIsPortfolioEditorOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      const defaultSlug = (profile.full_name || currentUser?.name || currentUser?.email?.split('@')[0] || '')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '')
        .slice(0, 30);
      setPortfolioSlug(profile.portfolio_slug || defaultSlug);
      setIsPortfolioPublic(Boolean(profile.is_portfolio_public));
      setPortfolioHeadline(profile.portfolio_headline || '');
      setPortfolioBio(profile.portfolio_bio || '');
    }
  }, [profile?.portfolio_slug, profile?.is_portfolio_public, profile?.portfolio_headline, profile?.portfolio_bio, currentUser]);

  useEffect(() => {
    if (!portfolioSlug) {
      setSlugStatus('idle');
      setSlugMessage('');
      return;
    }
    const clean = portfolioSlug.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(clean)) {
      setSlugStatus('invalid');
      setSlugMessage('Must be 3-30 letters, numbers, hyphens or underscores');
      return;
    }
    if (clean === (profile?.portfolio_slug || '').toLowerCase()) {
      setSlugStatus('available');
      setSlugMessage('Current username');
      return;
    }
    setSlugStatus('checking');
    setSlugMessage('Checking availability...');
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkPortfolioSlug(clean);
        if (res.available) {
          setSlugStatus('available');
          setSlugMessage('Username is available');
        } else {
          setSlugStatus('taken');
          setSlugMessage('Username is already taken');
        }
      } catch {
        setSlugStatus('idle');
        setSlugMessage('');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [portfolioSlug, profile?.portfolio_slug]);

  const handleTogglePublic = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to enable public portfolio');
      openAuthModal();
      return;
    }
    const nextVal = !isPortfolioPublic;
    setIsPortfolioPublic(nextVal);
    try {
      await updateProfile({ is_portfolio_public: nextVal ? 1 : 0 });
      showToast(nextVal ? 'Public portfolio enabled!' : 'Portfolio set to private');
    } catch {
      setIsPortfolioPublic(!nextVal);
      showToast('Failed to update portfolio privacy setting');
    }
  };

  const handleSaveSlug = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in first');
      openAuthModal();
      return;
    }
    const clean = portfolioSlug.trim().toLowerCase();
    if (slugStatus === 'taken' || slugStatus === 'invalid' || !clean) {
      showToast('Please pick a valid, available username');
      return;
    }
    setIsSavingPortfolio(true);
    try {
      await updateProfile({ portfolio_slug: clean });
      showToast('Portfolio username saved!');
      setSlugStatus('available');
      setSlugMessage('Current username');
    } catch (err: any) {
      showToast(err.message || 'Failed to save username');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleSavePortfolioDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in first');
      openAuthModal();
      return;
    }
    setIsSavingPortfolio(true);
    try {
      await updateProfile({
        portfolio_headline: portfolioHeadline.trim(),
        portfolio_bio: portfolioBio.trim(),
      });
      showToast('Showcase headline & bio saved');
      setIsPortfolioEditorOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save details');
    } finally {
      setIsSavingPortfolio(false);
    }
  };

  const handleCopyPortfolioLink = () => {
    const slug = profile?.portfolio_slug || portfolioSlug;
    if (!slug) {
      showToast('Please choose a username first');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://kanban-board-job.vercel.app';
    const url = `${origin}/u/${encodeURIComponent(slug)}`;
    navigator.clipboard.writeText(url);
    setIsCopiedPortfolio(true);
    setTimeout(() => setIsCopiedPortfolio(false), 2000);
    showToast('Copied public portfolio link to clipboard');
  };

  const handleOpenPortfolioPreview = () => {
    const slug = profile?.portfolio_slug || portfolioSlug;
    if (!slug) {
      showToast('Please configure your username first');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.open(`${origin}/u/${encodeURIComponent(slug)}`, '_blank');
  };

  // -------------------------------------------------------------
  // 5. Account & Data Export Handlers
  // -------------------------------------------------------------
  const exportToCSV = () => {
    const headers = ['Company', 'Role', 'Stage', 'Category', 'Country', 'City', 'Date Applied', 'Deadline', 'Salary'];
    const rows = applications.map(a => [
      `"${a.company || ''}"`,
      `"${a.role || ''}"`,
      `"${a.stage || ''}"`,
      `"${a.category || ''}"`,
      `"${a.country || ''}"`,
      `"${a.city || ''}"`,
      `"${a.date_applied || ''}"`,
      `"${a.deadline || ''}"`,
      `"${a.salary || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `job_applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported applications to CSV');
  };

  const handleClearCacheAndLogout = async () => {
    if (!confirm('Are you sure you want to sign out and clear active session cache?')) return;
    try {
      await logout();
      showToast('Signed out successfully');
    } catch {
      showToast('Signed out');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================= */}
      {/* Card 1: Public Recruiter Showcase                         */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141417] shadow-xs overflow-hidden">
        {/* Card Header */}
        <div className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Globe size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                  Public Recruiter Showcase
                </h2>
                {isPortfolioPublic ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10">
                    OFFLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Verified public URL showcasing your daily streak, DSA mastery, and resume to hiring teams.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
            <input
              type="checkbox"
              checked={isPortfolioPublic}
              onChange={handleTogglePublic}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
          </label>
        </div>

        {/* Card Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Custom Slug Input Row */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Personalized Showcase URL
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] px-3.5 h-10 shadow-2xs focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-[#18181b] focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <span className="text-xs text-slate-400 font-mono select-none shrink-0 hidden md:inline pr-0.5">
                  kanban-board-job.vercel.app/u/
                </span>
                <span className="text-xs text-slate-400 font-mono select-none shrink-0 md:hidden pr-0.5">
                  /u/
                </span>
                <input
                  type="text"
                  placeholder="username"
                  value={portfolioSlug}
                  onChange={e => setPortfolioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  maxLength={30}
                  className="flex-1 min-w-0 bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white outline-none px-1"
                />
                <div className="shrink-0 text-xs pl-2">
                  {slugStatus === 'checking' && (
                    <Loader2 size={13} className="animate-spin text-slate-400" />
                  )}
                  {slugStatus === 'available' && (
                    <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <Check size={12} />
                      <span>Available</span>
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px] bg-rose-500/10 px-2 py-0.5 rounded-md">
                      <AlertCircle size={12} />
                      <span>Taken</span>
                    </span>
                  )}
                  {slugStatus === 'invalid' && (
                    <span className="text-amber-500 font-bold flex items-center gap-1 text-[11px] bg-amber-500/10 px-2 py-0.5 rounded-md">
                      <span>Invalid</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveSlug}
                disabled={isSavingPortfolio || slugStatus === 'taken' || slugStatus === 'invalid'}
                className="px-4 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
              >
                {isSavingPortfolio ? 'Saving...' : 'Save Slug'}
              </button>
            </div>
            {slugMessage && (
              <span className="text-[11px] text-slate-400 mt-1 block">{slugMessage}</span>
            )}
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCopyPortfolioLink}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              {isCopiedPortfolio ? <CheckCheck size={14} /> : <Copy size={14} />}
              <span>{isCopiedPortfolio ? 'Copied Link!' : 'Copy Public Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenPortfolioPreview}
              className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Preview Live Showcase</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPortfolioEditorOpen(!isPortfolioEditorOpen)}
              className="inline-flex items-center gap-1 px-3.5 h-9 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer ml-auto"
            >
              <span>{isPortfolioEditorOpen ? 'Hide Bio' : 'Edit Headline & Bio'}</span>
              <ChevronDown size={14} className={`transform transition-transform ${isPortfolioEditorOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Headline & Bio Drawer */}
          {isPortfolioEditorOpen && (
            <form onSubmit={handleSavePortfolioDetails} className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.02] space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recruiter Showcase Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Engineer • React, Node.js, Cloud Architectures"
                  value={portfolioHeadline}
                  onChange={e => setPortfolioHeadline(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Personal Pitch &amp; Candidate Bio
                </label>
                <textarea
                  rows={3}
                  placeholder="Write a brief professional summary highlighting what you build, your engineering focus, and what roles you are actively targeting..."
                  value={portfolioBio}
                  onChange={e => setPortfolioBio(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsPortfolioEditorOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPortfolio}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isSavingPortfolio ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span>Recruiter Privacy Shield: Confidential company notes, interview stages, and compensation are always private.</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Card 2: Notifications & Habit Reminders                   */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141417] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              Notifications &amp; Habit Reminders
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Configure gentle nudges to keep your daily momentum and protect active streaks.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {/* Row 1: Streak Reminders */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                <Mail size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Streak Safeguard Reminders
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated reminders delivered if no job application or daily learning is logged before evening.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={emailRemindersEnabled}
                onChange={e => {
                  setEmailRemindersEnabled(e.target.checked);
                  showToast(e.target.checked ? 'Streak reminders enabled' : 'Streak reminders paused');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          {/* Row 2: Device Push Alerts */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                <Smartphone size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Device Push Alerts
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct browser push alerts on desktop or mobile for scheduled reminders and follow-ups.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePush}
              disabled={isPushLoading}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                hasPushActive
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
              }`}
            >
              {isPushLoading ? 'Updating...' : hasPushActive ? 'Push Enabled' : 'Enable Push'}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Card 3: Experience & Workspace Tools                      */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141417] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center gap-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sliders size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              Workspace &amp; Feature Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
              Tailor your problem-solving roadmap, sound effects, and browser clipping tools.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {/* Row 1: DSA Practice Track */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                <Code2 size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  DSA Practice Roadmap
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Display the 79-problem coding roadmap in navigation with 1-4-7 Spaced Repetition mastery tracking.
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isDsaEnabled}
                onChange={() => toggleDsaTrack(!isDsaEnabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {/* Row 2: UI Audio Effects */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 mt-0.5">
                {isSoundMuted || soundVolume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Sound Effects &amp; Audio Feedback
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Subtle synthesized chimes when completing sprints, advancing Kanban columns, and earning XP.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={handleToggleSoundMute}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isSoundMuted
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isSoundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isSoundMuted ? 'Muted' : 'Active'}</span>
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={handleSoundVolumeChange}
                  disabled={isSoundMuted}
                  className="w-20 h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600 disabled:opacity-30"
                />
                <button
                  type="button"
                  onClick={() => handleTestSound('chime')}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  title="Test Chime Sound"
                >
                  Test
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: 1-Click Universal Clipper */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 mt-0.5">
                <Zap size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Universal Job Clipper
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Browser bookmarklet to clip roles from LinkedIn, Indeed, and careers pages into your pipeline in 1 click.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsClipperModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-105 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Zap size={13} className="fill-current" />
              <span>Launch Clipper</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* Card 4: Storage, Backup & Account Controls                */}
      {/* ========================================================= */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#141417] shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <HardDrive size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                Storage &amp; Data Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 m-0">
                Manage resume storage targets, synchronization, and local database backups.
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shrink-0 ${
              storageMode === 'g_drive'
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                storageMode === 'g_drive' ? 'bg-blue-500' : 'bg-emerald-500'
              }`}
            />
            {storageMode === 'g_drive' ? 'Google Drive Active' : 'Local Storage Active'}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {/* Storage Mode Selector */}
          <div className="p-5 sm:p-6 space-y-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Document Storage Destination
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Local Storage */}
              <div
                onClick={() => requestStorageModeChange('local_storage')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  storageMode === 'local_storage'
                    ? 'border-emerald-500 bg-emerald-500/[0.04] ring-1 ring-emerald-500/30'
                    : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <HardDrive size={14} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Local Disk Storage
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Fastest access, private in your user folder, offline-ready.
                    </div>
                  </div>
                </div>
                {storageMode === 'local_storage' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Option 2: Google Drive */}
              <div
                onClick={() => requestStorageModeChange('g_drive')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  storageMode === 'g_drive'
                    ? 'border-blue-500 bg-blue-500/[0.04] ring-1 ring-blue-500/30'
                    : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                    <Layers size={14} />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">
                      Google Drive Cloud
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Synchronized across all your desktop and web devices.
                    </div>
                  </div>
                </div>
                {storageMode === 'g_drive' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shrink-0">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>

            {/* Sync Action & Drive Status */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-all"
              >
                <RefreshCw size={13} className={isSyncing ? 'animate-spin text-indigo-500' : ''} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Documents Now'}</span>
              </button>

              {storageMode === 'g_drive' && (
                <button
                  type="button"
                  onClick={() => openDriveModal('g_drive')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Configure Drive Folder &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Data Export Row */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                <Download size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Export Applications Dataset
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Download a spreadsheet-ready CSV with all tracked companies, roles, interview stages, and dates.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Account & Session Row */}
          <div className="p-5 sm:p-6 flex items-center justify-between gap-4 bg-rose-500/[0.02] dark:bg-rose-500/[0.03]">
            <div className="flex items-start gap-3 max-w-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5">
                <LogOut size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Account Session &amp; Local Cache
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentUser?.email ? `Signed in as ${currentUser.email}. ` : ''}Safely sign out and flush local browser state cache.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearCacheAndLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
