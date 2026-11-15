import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import { TROPHY_TIER_CONFIG, Tier3DIcon } from '../CareerProfile';
import {
  HardDrive,
  Layers,
  Folder,
  Code2,
  Bell,
  BellRing,
  Smartphone,
  Globe,
  Lock,
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
  Trash2,
  Mail,
  Zap,
  Trophy,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  RotateCcw,
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
    setIsDriveModalOpen,
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
    gamification,
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
  // 2. Career Mastery & Trophy Road State
  // -------------------------------------------------------------
  const userLevel = gamification?.level || 1;
  const currentTierConfig = TROPHY_TIER_CONFIG[userLevel] || TROPHY_TIER_CONFIG[1];
  const [isTrophyRoadOpen, setIsTrophyRoadOpen] = useState(false);

  // -------------------------------------------------------------
  // 3. Sound FX & Audio Synthesizer State
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

  const handleTestSound = (cue: SoundCue) => {
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
  const [settingsCategory, setSettingsCategory] = useState<'all' | 'showcase' | 'system'>('all');

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

  // -------------------------------------------------------------
  // Section 1: Public Recruiter Showcase
  // -------------------------------------------------------------
  const renderRecruiterShowcaseSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Globe size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              1. Public Recruiter Showcase (/u/:slug)
            </h2>
            <span className="text-[11px] text-slate-400">
              Verified showcase URL with your active streak, DSA progress &amp; resume
            </span>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isPortfolioPublic}
            onChange={handleTogglePublic}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>

      {/* Username Slug Input Bar */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-3">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Custom Portfolio URL Slug
        </label>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] px-3 h-11 sm:h-10 shadow-2xs focus-within:border-indigo-500">
            <span className="text-xs text-slate-400 font-mono select-none shrink-0 hidden sm:inline">
              kanban-board-job.vercel.app/u/
            </span>
            <span className="text-xs text-slate-400 font-mono select-none shrink-0 sm:hidden">
              /u/
            </span>
            <input
              type="text"
              placeholder="varun"
              value={portfolioSlug}
              onChange={e => setPortfolioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              maxLength={30}
              className="w-full bg-transparent text-base sm:text-xs font-mono font-bold text-slate-900 dark:text-white outline-none pl-1"
            />
            <div className="shrink-0 text-xs">
              {slugStatus === 'checking' && (
                <Loader2 size={13} className="animate-spin text-slate-400" />
              )}
              {slugStatus === 'available' && (
                <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                  <Check size={13} />
                  <span>Available</span>
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px]">
                  <AlertCircle size={13} />
                  <span>Taken</span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSlug}
            disabled={isSavingPortfolio || slugStatus === 'taken' || slugStatus === 'invalid'}
            className="px-4 h-11 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
          >
            {isSavingPortfolio ? 'Saving...' : 'Save Slug'}
          </button>
        </div>

        {slugMessage && (
          <div className="text-[11px] text-slate-400">{slugMessage}</div>
        )}

        {/* Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isPortfolioPublic ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isPortfolioPublic ? 'Public Showcase is LIVE' : 'Public Showcase is OFFLINE'}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleCopyPortfolioLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-9 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isCopiedPortfolio ? (
                <>
                  <CheckCheck size={14} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenPortfolioPreview}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 h-9 sm:h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPortfolioEditorOpen(!isPortfolioEditorOpen)}
              className="inline-flex items-center justify-center gap-1 px-3 h-9 sm:h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
            >
              <span>Headline &amp; Bio</span>
              <ChevronDown size={14} className={`transform transition-transform ${isPortfolioEditorOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Headline & Bio */}
      {isPortfolioEditorOpen && (
        <form onSubmit={handleSavePortfolioDetails} className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-500/[0.02] space-y-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Recruiter Showcase Headline
            </label>
            <input
              type="text"
              placeholder="e.g. Full Stack & AI Systems Engineer | 45-Day LeetCode Streak"
              value={portfolioHeadline}
              onChange={e => setPortfolioHeadline(e.target.value)}
              maxLength={120}
              className="w-full h-11 sm:h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Showcase Bio &amp; Summary
            </label>
            <textarea
              rows={2}
              placeholder="Specializing in scalable distributed systems and clean APIs..."
              value={portfolioBio}
              onChange={e => setPortfolioBio(e.target.value)}
              maxLength={400}
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isSavingPortfolio}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              {isSavingPortfolio ? 'Saving...' : 'Save Headline & Bio'}
            </button>
          </div>
        </form>
      )}

      {/* Privacy Shield Guarantee */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300">
        <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
        <span className="leading-relaxed">
          <strong>Recruiter Privacy Shield Active:</strong> Your confidential company applications, interview rounds, salary numbers, and private notes are filtered out and never exposed on public URLs.
        </span>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 2: Career Mastery & Trophy Road
  // -------------------------------------------------------------
  const renderTrophyRoadSection = () => (
    <section
      className={`relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-4 sm:p-6 shadow-xs transition-all duration-300 ${
        isTrophyRoadOpen ? 'space-y-5' : 'space-y-0'
      }`}
      aria-label="Career Mastery & Trophy Road"
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isTrophyRoadOpen ? 'pb-4 border-b border-slate-100 dark:border-white/5' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 text-amber-500 shadow-inner">
            <Trophy size={19} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white m-0">
                2. Career Mastery &amp; Trophy Road
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                7 Ranks
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5 line-clamp-1">
              Ascend ranks by submitting applications, logging study, and solving algorithms.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 font-black text-xs px-2.5 sm:px-3 py-1 rounded-full border shadow-2xs ${currentTierConfig.bg} ${currentTierConfig.border} ${currentTierConfig.text}`}
          >
            <Tier3DIcon tier={userLevel} size={15} className="shrink-0" />
            <span>Level {userLevel}: {currentTierConfig.title}</span>
          </span>

          <button
            type="button"
            onClick={() => setIsTrophyRoadOpen(prev => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <span>{isTrophyRoadOpen ? 'Hide Ranks' : 'View Trophy Road'}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-300 text-slate-400 ${
                isTrophyRoadOpen ? 'rotate-180 text-amber-500' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {isTrophyRoadOpen && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((lvl) => {
              const cfg = TROPHY_TIER_CONFIG[lvl];
              const isUnlocked = lvl <= userLevel;
              const isCurrent = lvl === userLevel;

              return (
                <div
                  key={lvl}
                  className={`relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                    isCurrent
                      ? `${cfg.bg} ${cfg.border} ring-2 ring-indigo-500/40 shadow-md scale-[1.02]`
                      : isUnlocked
                      ? 'bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10'
                      : 'bg-slate-50/40 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md font-mono text-slate-500 dark:text-slate-400">
                      L{lvl}
                    </span>
                    {isCurrent ? (
                      <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded-full">
                        Current
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-400">
                        <Lock size={9} />
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center my-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl mb-1.5">
                      <Tier3DIcon
                        tier={lvl}
                        size={36}
                        className={isUnlocked ? '' : 'opacity-30 grayscale'}
                      />
                    </div>
                    <h4 className="text-xs font-black truncate max-w-full m-0 text-slate-900 dark:text-white">
                      {cfg.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                      {cfg.min} - {cfg.max > 5000 ? '5k+' : cfg.max} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );

  // -------------------------------------------------------------
  // Section 3: DSA Practice Tracker & Coding Roadmap
  // -------------------------------------------------------------
  const renderDsaTrackSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Code2 size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              3. DSA Practice Tracker &amp; Coding Roadmap
            </h2>
            <span className="text-[11px] text-slate-400">
              79 curated challenges with 1-4-7 Spaced Repetition retention system
            </span>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isDsaEnabled}
            onChange={() => toggleDsaTrack(!isDsaEnabled)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
        <p className="m-0 leading-relaxed max-w-xl">
          When enabled, the <strong>DSA Roadmap</strong> appears in your navigation bar. Track problem-solving velocity, log review sessions, and earn <strong>+25 XP</strong> per solved challenge.
        </p>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
            isDsaEnabled
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
              : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
          }`}
        >
          {isDsaEnabled ? 'Feature Active' : 'Disabled'}
        </span>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 4: Habit & Streak Notifications
  // -------------------------------------------------------------
  const renderNotificationsSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Bell size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              4. Habit &amp; Streak Notifications
            </h2>
            <span className="text-[11px] text-slate-400">
              Stay consistent with proactive reminders and streak defense alerts
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Push Notifications Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Smartphone size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Device Push Notifications
              </div>
              <div className="text-[11px] text-slate-400">
                Daily habit nudges and interview alerts on desktop &amp; mobile
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTogglePush}
            disabled={isPushLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasPushActive
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            {isPushLoading ? 'Updating...' : hasPushActive ? 'Push Enabled' : 'Enable Push'}
          </button>
        </div>

        {/* Email Reminders Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Mail size={16} />
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Streak Safeguard Reminders
              </div>
              <div className="text-[11px] text-slate-400">
                Gentle evening reminder if no activity logged before midnight
              </div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
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
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 5: Interactive Audio Engine & Sound FX
  // -------------------------------------------------------------
  const renderAudioEngineSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Volume2 size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              5. Interactive Audio Engine &amp; Sound FX
            </h2>
            <span className="text-[11px] text-slate-400">
              Synthesized via Web Audio API &bull; Zero network latency &bull; Offline-ready
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSoundMute}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            !isSoundMuted
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
          }`}
        >
          {isSoundMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span>{!isSoundMuted ? 'Sound Enabled' : 'Sound Muted'}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Master Volume Slider */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              {isSoundMuted || soundVolume === 0 ? (
                <VolumeX size={16} />
              ) : soundVolume < 0.5 ? (
                <Volume1 size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Master Sound FX Volume
              </div>
              <div className="text-[11px] text-slate-400">
                Synthesized tone amplitude across UI interactions
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-48">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundVolume}
              onChange={handleSoundVolumeChange}
              disabled={isSoundMuted}
              className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-violet-600 disabled:opacity-40"
            />
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-10 text-right">
              {Math.round(soundVolume * 100)}%
            </span>
          </div>
        </div>

        {/* Real-time Audition Grid */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Audition Mathematical Waveforms
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Swoosh */}
            <button
              type="button"
              onClick={() => handleTestSound('swoosh')}
              className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all text-left cursor-pointer group flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">💨</span>
                <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-violet-500 transition-colors">
                  <Play size={12} fill="currentColor" />
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  swoosh
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Kanban card drag &amp; drop
                </div>
              </div>
            </button>

            {/* Chime */}
            <button
              type="button"
              onClick={() => handleTestSound('chime')}
              className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all text-left cursor-pointer group flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">🔔</span>
                <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-violet-500 transition-colors">
                  <Play size={12} fill="currentColor" />
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  chime
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Focus sprint completion
                </div>
              </div>
            </button>

            {/* LevelUp */}
            <button
              type="button"
              onClick={() => handleTestSound('levelUp')}
              className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all text-left cursor-pointer group flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">🎺</span>
                <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-violet-500 transition-colors">
                  <Play size={12} fill="currentColor" />
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  levelUp
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Tier rank &amp; chest unlock
                </div>
              </div>
            </button>

            {/* StreakSafe */}
            <button
              type="button"
              onClick={() => handleTestSound('streakSafe')}
              className="p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] hover:border-violet-500/40 hover:bg-violet-500/[0.03] transition-all text-left cursor-pointer group flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">🔥</span>
                <span className="p-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 group-hover:text-violet-500 transition-colors">
                  <Play size={12} fill="currentColor" />
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  streakSafe
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Daily streak safe
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 6: Storage Engine & Cloud Sync
  // -------------------------------------------------------------
  const renderStorageEngineSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <HardDrive size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              6. Storage Engine &amp; Cloud Sync
            </h2>
            <span className="text-[11px] text-slate-400">
              Choose where your resumes, cover letters, and notes are securely stored
            </span>
          </div>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option A: Local Storage */}
        <div
          onClick={() => requestStorageModeChange('local_storage')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            storageMode === 'local_storage'
              ? 'border-emerald-500/50 bg-emerald-500/[0.04] ring-2 ring-emerald-500/20'
              : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <HardDrive size={14} />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Local Disk Storage
                </div>
                <div className="text-[11px] text-slate-400">
                  Offline &amp; private in user folder
                </div>
              </div>
            </div>
            {storageMode === 'local_storage' && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px]">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
            Fastest access, zero cloud dependence, completely isolated to your device.
          </p>
        </div>

        {/* Option B: Google Drive */}
        <div
          onClick={() => requestStorageModeChange('g_drive')}
          className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            storageMode === 'g_drive'
              ? 'border-blue-500/50 bg-blue-500/[0.04] ring-2 ring-blue-500/20'
              : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Layers size={14} />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Google Drive Cloud
                </div>
                <div className="text-[11px] text-slate-400">
                  Cross-device sync &amp; automated backup
                </div>
              </div>
            </div>
            {storageMode === 'g_drive' && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px]">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
            Seamless synchronization across mobile, laptop, and web browsers.
          </p>
        </div>
      </div>

      {/* Sync & Setup Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDriveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Folder size={13} />
            <span>
              {storageMode === 'g_drive'
                ? gdriveStatus?.connected
                  ? 'Manage Drive Folder'
                  : 'Setup Drive Folder'
                : 'Folder Setup'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Syncing...' : 'Manual Sync Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => openDriveModal('sync')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Mirror & Sync Documents (Local Storage <-> Google Drive)"
          >
            <RotateCcw size={13} className="text-blue-600 dark:text-indigo-400" />
            <span>Mirror &amp; Sync Documents</span>
          </button>
        </div>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 7: 1-Click Universal Job Clipper
  // -------------------------------------------------------------
  const renderClipperSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <Zap size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              7. 1-Click Universal Job Clipper
            </h2>
            <span className="text-[11px] text-slate-400">
              Import job postings from LinkedIn, Indeed, Naukri, &amp; company portals
            </span>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
          Clipper Ready
        </span>
      </div>

      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
            <span>Universal Web Bookmarklet &amp; Clipboard Parser</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 leading-relaxed">
            Drag the bookmarklet to your browser bar or paste job postings. Automatically extracts title, company, salary, location, and requirements into your Kanban board.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsClipperModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:brightness-105 active:scale-95 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
        >
          <Zap size={14} className="fill-current" />
          <span>Launch Clipper &amp; Bookmarklet</span>
        </button>
      </div>
    </section>
  );

  // -------------------------------------------------------------
  // Section 8: Data Backup & Account Controls
  // -------------------------------------------------------------
  const renderDataBackupSection = () => (
    <section className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Download size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              8. Data Backup &amp; Account Controls
            </h2>
            <span className="text-[11px] text-slate-400">
              Download your application dataset or safely sign out
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* CSV Export */}
        <button
          type="button"
          onClick={exportToCSV}
          className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100 dark:hover:bg-white/[0.05] text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Download size={14} className="text-emerald-500" />
              <span>Export Applications (CSV)</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Spreadsheet-ready CSV file with all company pipeline statuses.
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 group-hover:underline">
            Download CSV &rarr;
          </span>
        </button>

        {/* Sign Out / Clear Cache */}
        <button
          type="button"
          onClick={handleClearCacheAndLogout}
          className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] hover:bg-rose-500/10 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
              <LogOut size={14} />
              <span>Sign Out &amp; Clear Cache</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Safely end active session and flush local browser state cache.
            </div>
          </div>
          <span className="text-[11px] font-bold text-rose-600 group-hover:underline">
            Sign Out &rarr;
          </span>
        </button>
      </div>
    </section>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner with Category Filter Pills */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white m-0">
              Settings &amp; Integrations
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
              Preferences Cockpit
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Configure your storage synchronization, career mastery milestones, DSA algorithms, habit alerts, and recruiter showcase.
          </p>
        </div>

        {/* Category Segmented View Selector */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 text-xs font-bold self-start lg:self-center">
          <button
            type="button"
            onClick={() => setSettingsCategory('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              settingsCategory === 'all'
                ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Settings
          </button>
          <button
            type="button"
            onClick={() => setSettingsCategory('showcase')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              settingsCategory === 'showcase'
                ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Showcase &amp; Roadmap
          </button>
          <button
            type="button"
            onClick={() => setSettingsCategory('system')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              settingsCategory === 'system'
                ? 'bg-white dark:bg-[#18181b] text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            System &amp; Audio
          </button>
        </div>
      </div>

      {/* Main Settings Sections - Responsive 2-Column Cockpit Layout */}
      {settingsCategory === 'all' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Public Identity, Roadmap & Alerts */}
          <div className="space-y-6">
            {renderRecruiterShowcaseSection()}
            {renderTrophyRoadSection()}
            {renderDsaTrackSection()}
            {renderNotificationsSection()}
          </div>

          {/* Column 2: Audio Engine, Cloud Storage & System */}
          <div className="space-y-6">
            {renderAudioEngineSection()}
            {renderStorageEngineSection()}
            {renderClipperSection()}
            {renderDataBackupSection()}
          </div>
        </div>
      )}

      {settingsCategory === 'showcase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {renderRecruiterShowcaseSection()}
            {renderNotificationsSection()}
          </div>
          <div className="space-y-6">
            {renderTrophyRoadSection()}
            {renderDsaTrackSection()}
          </div>
        </div>
      )}

      {settingsCategory === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            {renderAudioEngineSection()}
            {renderClipperSection()}
          </div>
          <div className="space-y-6">
            {renderStorageEngineSection()}
            {renderDataBackupSection()}
          </div>
        </div>
      )}

    </div>
  );
};
