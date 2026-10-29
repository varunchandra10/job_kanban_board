import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { ApplicationStage } from '../../types';
import { STAGES, COUNTRIES } from '../../utils/constants';
import { ensureGoogleDriveToken, getStoredGoogleDriveToken } from '../../utils/googleAuth';
import {
  Briefcase,
  Landmark,
  Beaker,
  FileText,
  Clock,
  MapPin,
  DollarSign,
  Key,
  UserCheck,
  Tag,
  X,
  Check,
  Mail,
  Paperclip,
  Upload,
  HardDrive,
  ExternalLink,
  Trash2,
  Loader2,
  Database,
  FolderOpen,
  RotateCcw,
} from 'lucide-react';

const getDisplayFileName = (pathStr: string, fallback: string = 'Document') => {
  if (!pathStr) return fallback;
  if (pathStr.includes('drive.google.com') || pathStr.includes('docs.google.com')) {
    return 'Google Drive Document';
  }
  try {
    const urlMatch = pathStr.match(/[?&]name=([^&]+)/);
    if (urlMatch) {
      return decodeURIComponent(urlMatch[1]);
    }
  } catch (_) {}
  const clean = pathStr.split('?')[0];
  const parts = clean.split(/[/\\]/);
  const last = parts.pop();
  if (last && last !== 'document-content' && last !== 'file-content') {
    return last;
  }
  return fallback;
};

export const ApplicationModal: React.FC = () => {
  const {
    isAddAppOpen,
    editingApp,
    selectedCalDate,
    closeAppModal,
    openFollowUpModal,
    addApplication,
    updateApplication,
    versions,
    gdriveStatus,
    setIsDriveModalOpen,
    openDriveModal,
    showToast,
    storageMode,
  } = useApp();

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState<'Industry' | 'Government' | 'Research'>('Industry');
  const [stage, setStage] = useState<ApplicationStage>('Applied');
  const [dateApplied, setDateApplied] = useState('');
  const [deadline, setDeadline] = useState('');
  const [country, setCountry] = useState('US');
  const [city, setCity] = useState('');
  const [salary, setSalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [jd, setJd] = useState('');
  const [jdUrl, setJdUrl] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [portalUser, setPortalUser] = useState('');
  const [portalPass, setPortalPass] = useState('');
  const [portalNotes, setPortalNotes] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [customTags, setCustomTags] = useState('');
  const [resumeVersionId, setResumeVersionId] = useState<number | null>(null);
  const [resumePath, setResumePath] = useState('');
  const [coverLetterPath, setCoverLetterPath] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [localDocumentsDir, setLocalDocumentsDir] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('job_tracker_custom_local_dir') || '') : '';
  });

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const prevOpenRef = useRef(false);
  const prevEditingAppIdRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    if (isAddAppOpen) {
      api.getLocalStorageInfo().then((info) => {
        if (info.customDir) {
          setLocalDocumentsDir(info.customDir);
        } else if (info.activeDir && info.activeDir !== 'AppData\\Roaming\\JobTracker\\documents') {
          setLocalDocumentsDir(info.activeDir);
        }
      }).catch(() => {});
    }
  }, [isAddAppOpen]);

  const handlePickFolder = async () => {
    try {
      if ((window as any).__TAURI__?.core?.invoke) {
        const picked = await (window as any).__TAURI__.core.invoke('select_folder');
        if (picked) {
          await api.setLocalFolder(picked);
          setLocalDocumentsDir(picked);
          showToast('Storage folder set to: ' + picked);
        }
      } else {
        setIsDriveModalOpen(true);
      }
    } catch (err: any) {
      showToast('Could not select folder: ' + (err.message || 'Unknown error'));
    }
  };

  // Prefill or reset ONLY when modal transitions from closed to open, or when editingApp changes
  useEffect(() => {
    const justOpened = !prevOpenRef.current && isAddAppOpen;
    const editingAppChanged = editingApp?.id !== prevEditingAppIdRef.current;
    prevOpenRef.current = isAddAppOpen;
    prevEditingAppIdRef.current = editingApp?.id;

    if (!isAddAppOpen) return;
    if (!justOpened && !editingAppChanged) return;

    if (editingApp) {
      setCompany(editingApp.company || '');
      setRole(editingApp.role || '');
      setCategory((editingApp.category as any) || 'Industry');
      setStage(editingApp.stage || 'Applied');
      setDateApplied(editingApp.date_applied || '');
      setDeadline(editingApp.deadline || '');
      setCountry(editingApp.country || 'US');
      setCity(editingApp.city || '');
      setSalary(editingApp.salary || '');
      setCurrency(editingApp.currency || 'USD');
      setJd(editingApp.jd || '');
      setJdUrl(editingApp.jd_url || '');
      setPortalUrl(editingApp.portal_url || '');
      setPortalUser(editingApp.portal_user || '');
      setPortalPass(editingApp.portal_pass || '');
      setPortalNotes(editingApp.portal_notes || '');
      setRecruiterName(editingApp.recruiter_name || '');
      setRecruiterEmail(editingApp.recruiter_email || '');
      setRecruiterNotes(editingApp.recruiter_notes || '');
      setCustomTags(editingApp.custom_tags || '');
      setResumeVersionId(editingApp.resume_version_id || null);
      setResumePath(editingApp.resume_path || '');
      setCoverLetterPath(editingApp.cover_letter_path || '');
    } else {
      setCompany('');
      setRole('');
      setCategory('Industry');
      setStage('Applied');
      setDateApplied(selectedCalDate || new Date().toISOString().slice(0, 10));
      setDeadline('');
      setCountry('US');
      setCity('');
      setSalary('');
      setCurrency('USD');
      setJd('');
      setJdUrl('');
      setPortalUrl('');
      setPortalUser('');
      setPortalPass('');
      setPortalNotes('');
      setRecruiterName('');
      setRecruiterEmail('');
      setRecruiterNotes('');
      setCustomTags('');
      setResumeVersionId(versions[0]?.id || null);
      setResumePath(versions[0]?.pdf_name || '');
      setCoverLetterPath('');
    }
  }, [isAddAppOpen, editingApp, selectedCalDate]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResume(true);
    try {
      if (storageMode === 'g_drive') {
        if (!getStoredGoogleDriveToken()) {
          try {
            await ensureGoogleDriveToken();
          } catch (tokenErr: any) {
            console.warn('[Google Drive Auth]:', tokenErr);
            showToast('Google Drive authorization required to upload cloud documents');
            setIsDriveModalOpen(true);
            setIsUploadingResume(false);
            if (e.target) e.target.value = '';
            return;
          }
        }
      }

      if (storageMode === 'local_storage' && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
        let currentCustom = localDocumentsDir || localStorage.getItem('job_tracker_custom_local_dir');
        if (!currentCustom) {
          try {
            const savedTauri = await (window as any).__TAURI__.core.invoke('get_custom_storage_dir');
            if (savedTauri) {
              currentCustom = savedTauri;
              localStorage.setItem('job_tracker_custom_local_dir', savedTauri);
              setLocalDocumentsDir(savedTauri);
            }
          } catch (_) {}
        }
        if (!currentCustom) {
          showToast('Please select a storage folder on your PC for your documents');
          const picked = await (window as any).__TAURI__.core.invoke('select_folder');
          if (!picked) {
            showToast('Upload cancelled: No storage folder selected.');
            setIsUploadingResume(false);
            if (e.target) e.target.value = '';
            return;
          }
          await api.setLocalFolder(picked);
          setLocalDocumentsDir(picked);
        }
      }

      const res = await api.uploadDocument(file, 'resume', editingApp?.id, storageMode);
      setResumePath(res.fullPath || res.path || file.name);
      showToast(
        res.isGoogleDrive
          ? 'Resume uploaded to Google Drive!'
          : 'Resume saved to local storage folder!'
      );
    } catch (err: any) {
      if (err.message && (err.message.includes('credentials') || err.message.includes('authorization'))) {
        setIsDriveModalOpen(true);
      }
      showToast(err.message || 'Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      if (storageMode === 'g_drive') {
        if (!getStoredGoogleDriveToken()) {
          try {
            await ensureGoogleDriveToken();
          } catch (tokenErr: any) {
            console.warn('[Google Drive Auth]:', tokenErr);
            showToast('Google Drive authorization required to upload cloud documents');
            setIsDriveModalOpen(true);
            setIsUploadingCover(false);
            if (e.target) e.target.value = '';
            return;
          }
        }
      }

      if (storageMode === 'local_storage' && typeof window !== 'undefined' && (window as any).__TAURI__?.core?.invoke) {
        let currentCustom = localDocumentsDir || localStorage.getItem('job_tracker_custom_local_dir');
        if (!currentCustom) {
          try {
            const savedTauri = await (window as any).__TAURI__.core.invoke('get_custom_storage_dir');
            if (savedTauri) {
              currentCustom = savedTauri;
              localStorage.setItem('job_tracker_custom_local_dir', savedTauri);
              setLocalDocumentsDir(savedTauri);
            }
          } catch (_) {}
        }
        if (!currentCustom) {
          showToast('Please select a storage folder on your PC for your documents');
          const picked = await (window as any).__TAURI__.core.invoke('select_folder');
          if (!picked) {
            showToast('Upload cancelled: No storage folder selected.');
            setIsUploadingCover(false);
            if (e.target) e.target.value = '';
            return;
          }
          await api.setLocalFolder(picked);
          setLocalDocumentsDir(picked);
        }
      }

      const res = await api.uploadDocument(file, 'cover_letter', editingApp?.id, storageMode);
      setCoverLetterPath(res.fullPath || res.path || file.name);
      showToast(
        res.isGoogleDrive
          ? 'Cover letter uploaded to Google Drive!'
          : 'Cover letter saved to local storage folder!'
      );
    } catch (err: any) {
      if (err.message && (err.message.includes('credentials') || err.message.includes('authorization'))) {
        setIsDriveModalOpen(true);
      }
      showToast(err.message || 'Failed to upload cover letter');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  if (!isAddAppOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim()) return;

    const appData = {
      company: company.trim(),
      role: role.trim() || 'Software Engineer',
      category,
      stage,
      date_applied: dateApplied || new Date().toISOString().slice(0, 10),
      deadline: deadline || undefined,
      country,
      city: city.trim(),
      salary: salary.trim(),
      currency,
      jd: jd.trim(),
      jd_url: jdUrl.trim(),
      portal_url: portalUrl.trim(),
      portal_user: portalUser.trim(),
      portal_pass: portalPass.trim(),
      portal_notes: portalNotes.trim(),
      recruiter_name: recruiterName.trim(),
      recruiter_email: recruiterEmail.trim(),
      recruiter_notes: recruiterNotes.trim(),
      custom_tags: customTags.trim(),
      resume_version_id: resumeVersionId,
      resume_path: resumePath,
      cover_letter_path: coverLetterPath,
    };

    if (editingApp) {
      updateApplication(editingApp.id, appData);
    } else {
      addApplication(appData);
    }
    closeAppModal();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 transition-opacity"
        onClick={closeAppModal}
        aria-hidden="true"
      />

      {/* Slideout Panel */}
      <aside
        className="fixed inset-y-0 right-0 w-full max-w-[560px] bg-white dark:bg-[#121214] border-l border-slate-200 dark:border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-transform animate-in slide-in-from-right duration-200"
        aria-modal="true"
        role="dialog"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#121214]/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white m-0">
              {editingApp ? `Edit ${editingApp.company}` : 'Add Application'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {editingApp && (
              <button
                type="button"
                onClick={() => {
                  closeAppModal();
                  openFollowUpModal(editingApp);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all cursor-pointer shadow-xs"
                title="Draft a follow-up email for this application"
              >
                <Mail size={13} />
                <span>Follow-Up Email</span>
              </button>
            )}
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
              onClick={closeAppModal}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-4 sm:py-5">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* 1. Target Category Pills */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Briefcase size={14} className="text-blue-600 dark:text-indigo-400" />
                Target Category
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('Industry')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    category === 'Industry'
                      ? 'border-blue-600 dark:border-indigo-500 bg-blue-50 dark:bg-indigo-500/15 text-blue-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Briefcase size={16} />
                  <span className="text-xs font-bold">Industry</span>
                  <span className="text-[10px] opacity-70">Tech & Corporate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('Government')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    category === 'Government'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Landmark size={16} />
                  <span className="text-xs font-bold">Government</span>
                  <span className="text-[10px] opacity-70">Public Sector</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCategory('Research')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    category === 'Research'
                      ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Beaker size={16} />
                  <span className="text-xs font-bold">Research</span>
                  <span className="text-[10px] opacity-70">Labs & Academia</span>
                </button>
              </div>
            </div>

            {/* 2. Company & Role */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <FileText size={14} className="text-blue-600 dark:text-indigo-400" />
                  Organization & Role
                </span>
                <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold">
                  Required
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalCompanyInput">
                    Company / Institution <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="modalCompanyInput"
                    placeholder="e.g. Google, ISRO, Microsoft, IISc"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalRoleInput">
                    Role / Designation
                  </label>
                  <input
                    type="text"
                    id="modalRoleInput"
                    placeholder="e.g. Senior Software Engineer, Data Scientist"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* 3. Stage & Timeline */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Clock size={14} className="text-blue-600 dark:text-indigo-400" />
                Stage & Timeline
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalStageSelect">
                    Pipeline Stage
                  </label>
                  <select
                    id="modalStageSelect"
                    value={stage}
                    onChange={e => setStage(e.target.value as ApplicationStage)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalDateApplied">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    id="modalDateApplied"
                    value={dateApplied}
                    onChange={e => setDateApplied(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalDeadline">
                  Application Deadline <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  id="modalDeadline"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* 4. Location & Workplace */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <MapPin size={14} className="text-blue-600 dark:text-indigo-400" />
                Location & Workplace
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalCountrySelect">
                    Country
                  </label>
                  <select
                    id="modalCountrySelect"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name} {c.code !== 'REMOTE' ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalCityInput">
                    City / Workplace
                  </label>
                  <input
                    type="text"
                    id="modalCityInput"
                    placeholder="e.g. San Francisco, Bengaluru"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* 5. Compensation */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <DollarSign size={14} className="text-blue-600 dark:text-indigo-400" />
                Compensation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2 min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Salary / Stipend
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 180,000 or 30 LPA"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="SGD">SGD ($)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 6. Credentials & Portal */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Key size={14} className="text-blue-600 dark:text-indigo-400" />
                Portal Login & Credentials
              </span>
              <div className="space-y-2.5">
                <div className="min-w-0">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Portal URL</label>
                  <input
                    type="url"
                    placeholder="https://company.wd1.myworkdayjobs.com/..."
                    value={portalUrl}
                    onChange={e => setPortalUrl(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Username / Email</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={portalUser}
                      onChange={e => setPortalUser(e.target.value)}
                      className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      placeholder="Saved password"
                      value={portalPass}
                      onChange={e => setPortalPass(e.target.value)}
                      className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Recruiter Info */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3.5 sm:p-4 overflow-hidden">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <UserCheck size={14} className="text-blue-600 dark:text-indigo-400" />
                Recruiter Info
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                <div className="min-w-0">
                  <input
                    type="text"
                    placeholder="Recruiter Name"
                    value={recruiterName}
                    onChange={e => setRecruiterName(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="min-w-0">
                  <input
                    type="email"
                    placeholder="Recruiter Email"
                    value={recruiterEmail}
                    onChange={e => setRecruiterEmail(e.target.value)}
                    className="w-full min-w-0 max-w-full box-border px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <textarea
                placeholder="Interview notes, dates, or recruiter comments..."
                rows={2}
                value={recruiterNotes}
                onChange={e => setRecruiterNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
              />
            </div>

            {/* 8. Documents (Resume & Cover Letter) */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <Paperclip size={14} className="text-blue-600 dark:text-indigo-400" />
                  Documents (Resume & Cover Letter)
                </span>
                {storageMode === 'local_storage' ? (
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2.5 py-0.5 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer"
                    title="Local System Storage active. Click to view or change destination folder."
                  >
                    <Database size={11} />
                    <span>Local Storage Active</span>
                  </button>
                ) : gdriveStatus.connected ? (
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full hover:bg-emerald-100 transition-colors cursor-pointer"
                    title="Google Drive is connected. Uploaded files stream directly to your Google Drive folder."
                  >
                    <HardDrive size={11} />
                    <span>Google Drive Active</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsDriveModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
                    title="Click to connect your Google Drive folder so resumes and cover letters sync automatically."
                  >
                    <HardDrive size={11} />
                    <span>Connect Drive</span>
                  </button>
                )}
              </div>

              {storageMode === 'local_storage' && (
                <div className="mb-3 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/60 dark:border-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <Database size={13} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
                    {localDocumentsDir ? (
                      <span className="truncate">
                        Storage folder: <strong className="font-mono text-indigo-950 dark:text-indigo-200">{localDocumentsDir}</strong>
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300 font-medium">
                        No custom folder selected yet. Choose where to save your documents:
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handlePickFolder}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] transition cursor-pointer shadow-xs"
                      title="Choose folder on your PC (e.g. D:\ drive)"
                    >
                      {localDocumentsDir ? 'Change Folder' : 'Select Folder...'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openDriveModal('sync')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition cursor-pointer shadow-xs"
                      title="Sync & Mirror documents with Google Drive"
                    >
                      <RotateCcw size={11} />
                      <span>Sync</span>
                    </button>
                    {localDocumentsDir && (
                      <button
                        type="button"
                        onClick={() => api.openLocalFolder(localDocumentsDir)}
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition cursor-pointer"
                        title="Open folder in File Explorer"
                      >
                        <FolderOpen size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleResumeUpload}
              />
              <input
                ref={coverInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={handleCoverUpload}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Resume Card */}
                <div className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Resume
                      </label>
                      {resumePath && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          Attached
                        </span>
                      )}
                    </div>

                    {versions.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={resumeVersionId || ''}
                          onChange={(e) => {
                            const id = e.target.value ? Number(e.target.value) : null;
                            setResumeVersionId(id);
                            const found = versions.find((v) => v.id === id);
                            if (found?.pdf_name) setResumePath(found.pdf_name);
                          }}
                          className="w-full px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300"
                        >
                          <option value="">Choose Saved Version...</option>
                          {versions.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.label || v.pdf_name || `Version #${v.id}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {resumePath ? (
                      <div className="space-y-1.5 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200 text-xs flex-1">
                            {getDisplayFileName(resumePath, 'Resume Document')}
                          </span>
                          {storageMode === 'local_storage' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.openLocalFolder();
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors cursor-pointer"
                              title="Open local storage folder in File Explorer"
                            >
                              <FolderOpen size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              api.openDocument(resumePath);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 transition-colors cursor-pointer"
                            title="Preview / Open in new tab"
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResumePath('');
                              setResumeVersionId(null);
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove attached resume"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {storageMode === 'local_storage' ? (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/40 dark:border-blue-500/20 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">Saved locally in resumes folder</span>
                            <button
                              type="button"
                              onClick={async () => {
                                await api.openLocalFolder();
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                            >
                              <span>Open Folder</span>
                              <FolderOpen size={10} />
                            </button>
                          </div>
                        ) : (
                          resumePath.startsWith('http') && (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/40 dark:border-blue-500/20">
                              <a
                                href={resumePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-600 dark:text-indigo-400 hover:underline truncate flex-1 font-mono"
                                title={resumePath}
                              >
                                {resumePath}
                              </a>
                              <a
                                href={resumePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 shrink-0"
                              >
                                <span>View Link</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        No resume attached. Upload PDF or Word document to save to {storageMode === 'local_storage' ? 'Local Storage' : 'Google Drive'}.
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={isUploadingResume}
                      onClick={() => resumeInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-500/30 hover:border-blue-500 bg-blue-50/40 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingResume ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={13} />
                          <span>{resumePath ? 'Replace Resume' : 'Upload Resume'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Cover Letter Card */}
                <div className="rounded-lg border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#18181b] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cover Letter
                      </label>
                      {coverLetterPath && (
                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded">
                          Attached
                        </span>
                      )}
                    </div>

                    {coverLetterPath ? (
                      <div className="space-y-1.5 p-2.5 rounded-lg bg-purple-50/60 dark:bg-purple-500/10 border border-purple-200/60 dark:border-purple-500/20 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate font-semibold text-slate-800 dark:text-slate-200 text-xs flex-1">
                            {getDisplayFileName(coverLetterPath, 'Cover Letter Document')}
                          </span>
                          {storageMode === 'local_storage' && (
                            <button
                              type="button"
                              onClick={async () => {
                                await api.openLocalFolder();
                              }}
                              className="p-1 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-400 transition-colors cursor-pointer"
                              title="Open local storage folder in File Explorer"
                            >
                              <FolderOpen size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              api.openDocument(coverLetterPath);
                            }}
                            className="p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 transition-colors cursor-pointer"
                            title="Preview / Open in new tab"
                          >
                            <ExternalLink size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoverLetterPath('')}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Remove attached cover letter"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        {storageMode === 'local_storage' ? (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200/40 dark:border-purple-500/20 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="truncate">Saved locally in cover_letter folder</span>
                            <button
                              type="button"
                              onClick={async () => {
                                await api.openLocalFolder();
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 hover:underline shrink-0 cursor-pointer"
                            >
                              <span>Open Folder</span>
                              <FolderOpen size={10} />
                            </button>
                          </div>
                        ) : (
                          coverLetterPath.startsWith('http') && (
                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200/40 dark:border-purple-500/20">
                              <a
                                href={coverLetterPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline truncate flex-1 font-mono"
                                title={coverLetterPath}
                              >
                                {coverLetterPath}
                              </a>
                              <a
                                href={coverLetterPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 shrink-0"
                              >
                                <span>View Link</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                        No cover letter attached. Upload PDF, Word, or text file to save to {storageMode === 'local_storage' ? 'Local Storage' : 'Google Drive'}.
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-purple-300 dark:border-purple-500/30 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-500/5 hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isUploadingCover ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={13} />
                          <span>{coverLetterPath ? 'Replace Cover Letter' : 'Upload Cover Letter'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. Custom Tags */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Tag size={14} className="text-blue-600 dark:text-indigo-400" />
                Custom Tags
              </span>
              <input
                type="text"
                placeholder="e.g. Tier 1, High Priority, Referral"
                value={customTags}
                onChange={e => setCustomTags(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 pb-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeAppModal}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{editingApp ? 'Save Changes' : 'Add Application'}</span>
              </button>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
};
