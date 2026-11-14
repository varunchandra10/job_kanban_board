import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  Briefcase,
  Building2,
  GraduationCap,
  FileText,
  Clock,
  MapPin,
  DollarSign,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Paperclip,
  Upload,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ApplicationCategory, ApplicationStage } from '../../types';
import { STAGES, COUNTRIES } from '../../utils/constants';
import { api } from '../../services/api';

export const StandaloneClipperPage: React.FC = () => {
  const {
    isAuthenticated,
    addApplication,
    versions,
    storageMode,
    login,
    googleLogin,
    showToast
  } = useApp();

  // Parse URL search params
  const [params, setParams] = useState<URLSearchParams>(() => {
    return typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  });

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<ApplicationCategory>('Industry');
  const [stage, setStage] = useState<ApplicationStage>('Applied');
  const [dateApplied, setDateApplied] = useState(() => new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState('');
  const [country, setCountry] = useState('US');
  const [city, setCity] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [jdUrl, setJdUrl] = useState('');
  const [portalNotes, setPortalNotes] = useState('');
  const [customTags, setCustomTags] = useState('Clipped');
  const [resumeVersionId, setResumeVersionId] = useState<number | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Initialize fields from URL params on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    setParams(p);

    const comp = p.get('company') || '';
    const rol = p.get('role') || '';
    const loc = p.get('location') || '';
    const sal = p.get('salary') || '';
    const url = p.get('url') || '';
    const notes = p.get('notes') || '';
    const cat = (p.get('category') as ApplicationCategory) || 'Industry';
    const stg = (p.get('stage') as ApplicationStage) || 'Applied';

    if (comp) setCompany(comp);
    if (rol) setRole(rol);
    if (loc) {
      setCity(loc);
      if (loc.toLowerCase().includes('remote')) setCountry('REMOTE');
      else if (loc.toLowerCase().includes('india') || loc.toLowerCase().includes('bengaluru') || loc.toLowerCase().includes('bangalore') || loc.toLowerCase().includes('hyderabad') || loc.toLowerCase().includes('delhi') || loc.toLowerCase().includes('mumbai') || loc.toLowerCase().includes('pune')) {
        setCountry('IN');
        setCurrency('INR');
      }
    }
    if (sal) {
      setSalary(sal);
      if (sal.includes('₹') || sal.toUpperCase().includes('LPA') || sal.toUpperCase().includes('INR')) {
        setCurrency('INR');
      } else if (sal.includes('€') || sal.toUpperCase().includes('EUR')) {
        setCurrency('EUR');
      } else if (sal.includes('£') || sal.toUpperCase().includes('GBP')) {
        setCurrency('GBP');
      }
    }
    if (url) setJdUrl(url);
    if (notes) setPortalNotes(`Highlights from posting:\n${notes}`);
    if (cat) setCategory(cat);
    if (stg) setStage(stg);
  }, []);

  // Sync default resume version
  useEffect(() => {
    if (versions.length > 0 && resumeVersionId === null) {
      setResumeVersionId(versions[0].id);
    }
  }, [versions, resumeVersionId]);

  const handleClose = () => {
    try {
      window.close();
    } catch (_) {}
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setLoginError('Please enter both email and password');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await login(authEmail.trim(), authPassword.trim());
      showToast('Logged in successfully!');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) {
      showToast('Company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedResume = versions.find(v => v.id === resumeVersionId);
      let resumePathToSave = selectedResume?.pdf_name || '';
      let coverPathToSave = '';

      if (resumeFile) {
        try {
          const up = await api.uploadDocument(resumeFile, 'resume', undefined, storageMode);
          resumePathToSave = up.fullPath || up.path || resumeFile.name;
        } catch (upErr: any) {
          console.warn('[Clipper] Resume file upload fallback:', upErr);
          resumePathToSave = resumeFile.name;
        }
      }

      if (coverLetterFile) {
        try {
          const up = await api.uploadDocument(coverLetterFile, 'cover_letter', undefined, storageMode);
          coverPathToSave = up.fullPath || up.path || coverLetterFile.name;
        } catch (upErr: any) {
          console.warn('[Clipper] Cover letter file upload fallback:', upErr);
          coverPathToSave = coverLetterFile.name;
        }
      }

      await addApplication({
        company: company.trim(),
        role: role.trim() || 'Software Engineer',
        category,
        stage,
        date_applied: dateApplied || new Date().toISOString().slice(0, 10),
        deadline: deadline || '',
        country,
        city: city.trim(),
        salary: salary.trim(),
        currency,
        jd_url: jdUrl.trim(),
        portal_notes: portalNotes.trim(),
        custom_tags: customTags.trim() || 'Clipped',
        resume_version_id: resumeVersionId,
        resume_path: resumePathToSave,
        cover_letter_path: coverPathToSave,
      });

      setIsSaved(true);
      showToast('⚡ Job clipped to Kanban board! Daily streak updated.');

      // Automatically close popup window after 1.2s
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      showToast('Failed to save application: ' + (err.message || 'Unknown error'));
      setIsSubmitting(false);
    }
  };

  // If saved, show celebratory completion card
  if (isSaved) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4 animate-in zoom-in-75">
          <CheckCircle2 size={36} strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white m-0 mb-1">
          Clipped to Board!
        </h2>
        <p className="text-sm text-slate-300 max-w-xs mb-3">
          <span className="font-bold text-white">{role || 'Job'}</span> at{' '}
          <span className="font-bold text-white">{company}</span> has been added to your{' '}
          <span className="text-emerald-400 font-bold">{stage}</span> column.
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-5 shadow-xs">
          <Sparkles size={13} />
          <span>+25 XP & Streak Protected 🎯</span>
        </div>
        <p className="text-xs text-slate-400">Closing window in a second...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] dark:bg-[#0e0f12] text-slate-900 dark:text-slate-100 flex flex-col font-sans select-text">
      {/* 1. Header (Sticky Top Bar) */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shrink-0 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-orange-500/25">
            <Zap size={16} className="fill-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white m-0 truncate">
                Job Clipper
              </h1>
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                1-Click
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate m-0">
              Save directly into your Kanban pipeline
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Close window (Esc)"
          aria-label="Close window"
        >
          <X size={16} />
        </button>
      </header>

      {/* 2. Unauthenticated State (Prompt Login) */}
      {!isAuthenticated ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <Lock size={22} />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white mb-1">
            Sign In to Clip Jobs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
            Log in once with your Job Tracker account to link clipped jobs to your personal Kanban board.
          </p>

          <form onSubmit={handleLoginSubmit} className="w-full max-w-xs space-y-3 text-left">
            {loginError && (
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <span>{isLoggingIn ? 'Signing in...' : 'Sign In & Clip Job'}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      ) : (
        /* 3. Main Scrollable Form Body */
        <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div className="p-4 space-y-3.5">
            {/* Category Cards (Exact layout from user screenshot) */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <Briefcase size={13} className="text-blue-600 dark:text-blue-400" />
                Target Category
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Industry', label: 'Industry', sub: 'Tech & Corporate', icon: Briefcase },
                  { id: 'Government', label: 'Government', sub: 'Public Sector', icon: Building2 },
                  { id: 'Research', label: 'Research', sub: 'Labs & Academia', icon: GraduationCap },
                ].map(c => {
                  const Icon = c.icon;
                  const isSel = category === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id as ApplicationCategory)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center cursor-pointer ${
                        isSel
                          ? 'bg-blue-50/80 dark:bg-blue-500/10 border-blue-500 dark:border-blue-500/50 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                          : 'border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={16} className={`mb-1 ${isSel ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
                      <span className="text-[11px] leading-tight font-bold">{c.label}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{c.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Organization & Role */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <FileText size={13} className="text-blue-600 dark:text-blue-400" />
                  Organization & Role
                </span>
                <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-md">
                  Required
                </span>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Company / Institution <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Stripe, Google, Airbnb"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* Stage & Timeline */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <Clock size={13} className="text-blue-600 dark:text-blue-400" />
                Stage & Timeline
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={e => setStage(e.target.value as ApplicationStage)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Date Applied
                    </label>
                    <input
                      type="date"
                      value={dateApplied}
                      onChange={e => setDateApplied(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Compensation */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <MapPin size={13} className="text-blue-600 dark:text-blue-400" />
                Location & Compensation
              </span>
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    >
                      {COUNTRIES.map(c => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      City / Workplace
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Bengaluru (Remote)"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Salary / Package
                    </label>
                    <input
                      type="text"
                      value={salary}
                      onChange={e => setSalary(e.target.value)}
                      placeholder="e.g. ₹30 - 45 LPA"
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="SGD">SGD ($)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Links & Highlights */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <LinkIcon size={13} className="text-blue-600 dark:text-blue-400" />
                Links & Notes
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Job Posting URL
                  </label>
                  <input
                    type="url"
                    value={jdUrl}
                    onChange={e => setJdUrl(e.target.value)}
                    placeholder="https://company.com/jobs/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono truncate"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Notes & Highlighted Text
                  </label>
                  <textarea
                    rows={3}
                    value={portalNotes}
                    onChange={e => setPortalNotes(e.target.value)}
                    placeholder="Highlighted requirements or personal notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Documents & Attachments */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121316] p-3.5 shadow-2xs">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                <Paperclip size={13} className="text-blue-600 dark:text-blue-400" />
                Documents & Attachments
              </span>
              <div className="space-y-3">
                {/* Resume Upload / Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Resume Document (.pdf, .docx)
                  </label>
                  {resumeFile ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="truncate font-semibold text-blue-700 dark:text-blue-300">
                          {resumeFile.name} ({Math.round(resumeFile.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove resume"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-[#18181c] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
                        <Upload size={13} />
                        <span>Upload Custom Resume File</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
                          }}
                        />
                      </label>
                      {versions.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 shrink-0">or select version:</span>
                          <select
                            value={resumeVersionId || ''}
                            onChange={e => setResumeVersionId(Number(e.target.value) || null)}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#18181c] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer truncate"
                          >
                            {versions.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.label} ({v.region})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cover Letter Upload */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Cover Letter (.pdf, .docx, .txt)
                  </label>
                  {coverLetterFile ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="truncate font-semibold text-purple-700 dark:text-purple-300">
                          {coverLetterFile.name} ({Math.round(coverLetterFile.size / 1024)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverLetterFile(null)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove cover letter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-[#18181c] hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer transition-colors">
                      <Upload size={13} />
                      <span>Upload Cover Letter File</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files?.[0]) setCoverLetterFile(e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Sticky Bottom Action Bar */}
          <footer className="sticky bottom-0 z-20 flex items-center justify-between gap-2.5 p-3.5 bg-white/95 dark:bg-[#121316]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/10 shrink-0 shadow-lg">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !company.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <Zap size={14} className="fill-white" />
              <span>{isSubmitting ? 'Saving...' : '⚡ Save to Board'}</span>
            </button>
          </footer>
        </form>
      )}
    </div>
  );
};

