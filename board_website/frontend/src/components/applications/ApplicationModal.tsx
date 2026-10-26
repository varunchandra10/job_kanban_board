import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApplicationStage } from '../../types';
import { STAGES, COUNTRIES } from '../../utils/constants';
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
} from 'lucide-react';

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

  // Prefill or reset on open
  useEffect(() => {
    if (!isAddAppOpen) return;

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
    }
  }, [isAddAppOpen, editingApp, selectedCalDate, versions]);

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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Target Category Pills */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
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
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
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
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Clock size={14} className="text-blue-600 dark:text-indigo-400" />
                Stage & Timeline
              </span>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalStageSelect">
                    Pipeline Stage
                  </label>
                  <select
                    id="modalStageSelect"
                    value={stage}
                    onChange={e => setStage(e.target.value as ApplicationStage)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {STAGES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalDateApplied">
                    Date Applied
                  </label>
                  <input
                    type="date"
                    id="modalDateApplied"
                    value={dateApplied}
                    onChange={e => setDateApplied(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalDeadline">
                  Application Deadline <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="date"
                  id="modalDeadline"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* 4. Location & Workplace */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <MapPin size={14} className="text-blue-600 dark:text-indigo-400" />
                Location & Workplace
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalCountrySelect">
                    Country
                  </label>
                  <select
                    id="modalCountrySelect"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="modalCityInput">
                    City / Workplace
                  </label>
                  <input
                    type="text"
                    id="modalCityInput"
                    placeholder="e.g. San Francisco, Bengaluru"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
            </div>

            {/* 5. Compensation */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <DollarSign size={14} className="text-blue-600 dark:text-indigo-400" />
                Compensation
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Salary / Stipend
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 180,000 or 30 LPA"
                    value={salary}
                    onChange={e => setSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <Key size={14} className="text-blue-600 dark:text-indigo-400" />
                Portal Login & Credentials
              </span>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Portal URL</label>
                  <input
                    type="url"
                    placeholder="https://company.wd1.myworkdayjobs.com/..."
                    value={portalUrl}
                    onChange={e => setPortalUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Username / Email</label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={portalUser}
                      onChange={e => setPortalUser(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      placeholder="Saved password"
                      value={portalPass}
                      onChange={e => setPortalPass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Recruiter Info */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                <UserCheck size={14} className="text-blue-600 dark:text-indigo-400" />
                Recruiter Info
              </span>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Recruiter Name"
                  value={recruiterName}
                  onChange={e => setRecruiterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <input
                  type="email"
                  placeholder="Recruiter Email"
                  value={recruiterEmail}
                  onChange={e => setRecruiterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <textarea
                placeholder="Interview notes, dates, or recruiter comments..."
                rows={2}
                value={recruiterNotes}
                onChange={e => setRecruiterNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
              />
            </div>

            {/* 8. Custom Tags */}
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
