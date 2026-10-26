import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CompanyLogo } from '../common/CompanyLogo';
import {
  Mail,
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Send,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  Save,
  ChevronDown,
  Info,
} from 'lucide-react';

type FollowUpType =
  | 'first_checkin'
  | 'post_interview_thanks'
  | 'interview_status'
  | 'breaking_silence'
  | 'competing_offer';

type EmailTone = 'warm' | 'concise' | 'formal';

interface TemplateConfig {
  id: FollowUpType;
  label: string;
  badge: string;
  description: string;
  recommendedWhen: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'first_checkin',
    label: '1st Follow-Up',
    badge: '5-10d Post-Apply',
    description: 'Polite inquiry to confirm receipt and reiterate strong excitement.',
    recommendedWhen: '5 to 10 days after applying when no response has been received.',
  },
  {
    id: 'post_interview_thanks',
    label: 'Interview Thank You',
    badge: 'Within 24-48h',
    description: 'Thank the interviewers and reference key discussion highlights.',
    recommendedWhen: 'Send within 24 to 48 hours after completing an interview round.',
  },
  {
    id: 'interview_status',
    label: 'Interview Status',
    badge: '1-2w Post-Interview',
    description: 'Professional check-in following up on next steps timeline.',
    recommendedWhen: 'When the promised post-interview decision window has passed.',
  },
  {
    id: 'breaking_silence',
    label: 'Breaking Silence',
    badge: '3+ Weeks Radio Silence',
    description: 'Friendly re-engagement to revive stalled communication.',
    recommendedWhen: 'When 2 to 4+ weeks have passed with zero updates.',
  },
  {
    id: 'competing_offer',
    label: 'Timeline / Offer Nudge',
    badge: 'Urgent Decision',
    description: 'Politely inform them of an impending deadline while keeping them #1.',
    recommendedWhen: 'When you receive another offer or interview decision deadline.',
  },
];

export const FollowUpModal: React.FC = () => {
  const {
    isFollowUpOpen,
    followUpApp,
    closeFollowUpModal,
    profile,
    updateApplication,
    showToast,
  } = useApp();

  const [selectedTemplate, setSelectedTemplate] = useState<FollowUpType>('first_checkin');
  const [tone, setTone] = useState<EmailTone>('warm');
  const [recruiterName, setRecruiterName] = useState<string>('');
  const [recruiterEmail, setRecruiterEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isTipsOpen, setIsTipsOpen] = useState<boolean>(false);
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Initialize data when app changes
  useEffect(() => {
    if (followUpApp) {
      const initialRecruiter =
        followUpApp.recruiter_name ||
        followUpApp.portal_user ||
        '';
      setRecruiterName(initialRecruiter);

      const initialEmail =
        followUpApp.recruiter_email ||
        (followUpApp.portal_user && followUpApp.portal_user.includes('@')
          ? followUpApp.portal_user
          : '');
      setRecruiterEmail(initialEmail);

      // Choose intelligent default template based on stage
      if (followUpApp.stage === 'Interviewing') {
        setSelectedTemplate('interview_status');
      } else {
        setSelectedTemplate('first_checkin');
      }
    }
  }, [followUpApp]);

  // Generate dynamic Subject & Body based on template, tone, and inputs
  useEffect(() => {
    if (!followUpApp) return;

    const company = followUpApp.company || 'the team';
    const role = followUpApp.role || 'this position';
    const applicantName = profile?.full_name?.trim() || 'Varun Chandra';
    const contactGreeting = recruiterName.trim()
      ? `Dear ${recruiterName.trim()}`
      : `Dear ${company} Recruiting Team`;

    let generatedSubject = '';
    let generatedBody = '';

    if (selectedTemplate === 'first_checkin') {
      if (tone === 'warm') {
        generatedSubject = `Following Up - Application for ${role} position | ${applicantName}`;
        generatedBody = `${contactGreeting},

I hope you are having a wonderful week!

I recently submitted my application for the ${role} position at ${company} and wanted to briefly reach out to reaffirm my strong enthusiasm for this opportunity. 

Having followed ${company}'s impressive engineering milestones, I am very excited about the prospect of contributing my technical background and problem-solving skills to your team.

Please let me know if there are any additional materials, references, or code samples I can provide to support my application. I look forward to the possibility of discussing how my experience aligns with your goals.

Thank you so much for your time and consideration!

Warm regards,
${applicantName}
${profile?.phone ? `Phone: ${profile.phone}\n` : ''}${profile?.linkedin ? `LinkedIn: ${profile.linkedin}` : ''}`;
      } else if (tone === 'concise') {
        generatedSubject = `${role} Application Follow-Up - ${applicantName}`;
        generatedBody = `${contactGreeting},

I am writing to briefly check in on the status of my application for the ${role} role at ${company}.

I remain very interested in joining ${company} and believe my technical background aligns well with the team's objectives. Please let me know if you need any additional information from my side.

Thank you for your time and review.

Best regards,
${applicantName}`;
      } else {
        generatedSubject = `Inquiry Regarding ${role} Application - ${applicantName}`;
        generatedBody = `${contactGreeting},

I am following up regarding my application submitted for the ${role} opening at ${company}.

I am very eager to contribute to ${company}'s continued success and would appreciate any updates you might share regarding the review timeline for this role.

Thank you for your consideration, and I look forward to hearing from you.

Sincerely,
${applicantName}`;
      }
    } else if (selectedTemplate === 'post_interview_thanks') {
      if (tone === 'warm') {
        generatedSubject = `Thank You - ${role} Interview Discussion | ${applicantName}`;
        generatedBody = `${contactGreeting},

Thank you very much for taking the time to speak with me today regarding the ${role} role at ${company}.

I thoroughly enjoyed our conversation and learning more about the team's engineering challenges and roadmap. The discussion reinforced my strong interest in joining ${company} and contributing to these high-impact initiatives.

Please don't hesitate to reach out if you need any further information or follow-up details. I look forward to hearing about the next steps in the process!

Best regards,
${applicantName}`;
      } else if (tone === 'concise') {
        generatedSubject = `Thank You - ${role} Interview - ${applicantName}`;
        generatedBody = `${contactGreeting},

Thank you for the insightful conversation today regarding the ${role} position.

I appreciated learning about the team's vision and remain extremely enthusiastic about the prospect of contributing to ${company}.

Looking forward to the next steps.

Best regards,
${applicantName}`;
      } else {
        generatedSubject = `Appreciation & Follow-Up: ${role} Interview - ${applicantName}`;
        generatedBody = `${contactGreeting},

I want to express my sincere appreciation for the opportunity to interview for the ${role} position today. 

Our discussion gave me valuable insight into ${company}'s culture and high standards. I am confident that my technical expertise and collaborative mindset will allow me to make meaningful contributions.

Thank you again for your time and guidance throughout this process.

Sincerely,
${applicantName}`;
      }
    } else if (selectedTemplate === 'interview_status') {
      if (tone === 'warm') {
        generatedSubject = `Status Check - ${role} Interview Process | ${applicantName}`;
        generatedBody = `${contactGreeting},

I hope you are having a productive week!

I am checking in to see if there is any update regarding the ${role} position following our recent interview. I really enjoyed our discussion and continue to be very enthusiastic about the opportunity to join ${company}.

Please let me know if there are any questions I can answer or if you require any additional materials at this stage.

Thank you again for your time and consideration!

Warm regards,
${applicantName}`;
      } else {
        generatedSubject = `Next Steps Inquiry - ${role} - ${applicantName}`;
        generatedBody = `${contactGreeting},

I wanted to follow up regarding the status of my candidacy for the ${role} role following our interview.

${company} remains one of my top choices, and I would love to learn if there are any updates regarding next steps or timeline.

Thank you for your assistance.

Best regards,
${applicantName}`;
      }
    } else if (selectedTemplate === 'breaking_silence') {
      generatedSubject = `Touching Base - ${role} Opportunity at ${company} | ${applicantName}`;
      generatedBody = `${contactGreeting},

I hope this message finds you well!

I know how busy hiring cycles can be, so I wanted to gently circle back regarding my application for the ${role} position at ${company}.

I remain deeply interested in the work your team is doing and would welcome any update on whether the position is still active and where things stand. If the role has already been filled, I would still love to stay connected for future opportunities.

Thank you very much for your time and help!

Best regards,
${applicantName}`;
    } else if (selectedTemplate === 'competing_offer') {
      generatedSubject = `Timeline Update regarding ${role} Candidacy | ${applicantName}`;
      generatedBody = `${contactGreeting},

I hope you are having a great week.

I am writing to share a brief update on my job search timeline. I have recently received another offer with an upcoming decision deadline; however, ${company} remains my top choice and preferred team.

Because I would love the chance to join ${company}, I wanted to check if there is any update regarding my status for the ${role} position and whether your timeline might accommodate a conversation before my deadline.

I truly appreciate your understanding and support throughout this process!

Best regards,
${applicantName}`;
    }

    setSubject(generatedSubject);
    setBody(generatedBody);
  }, [followUpApp, selectedTemplate, tone, recruiterName, profile]);

  if (!isFollowUpOpen || !followUpApp) return null;

  // Calculate days since applied
  const daysSinceApplied = (() => {
    if (!followUpApp.date_applied) return null;
    const applied = new Date(followUpApp.date_applied);
    const now = new Date();
    const diff = Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
    return isNaN(diff) ? null : diff;
  })();

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      const fullContent = `Subject: ${subject}\n\n${body}`;
      await navigator.clipboard.writeText(fullContent);
      setCopied(true);
      showToast('Email subject and body copied to clipboard! ✨');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Could not copy to clipboard. Please copy manually.');
    }
  };

  // Launch email client (mailto)
  const handleOpenMailClient = () => {
    const to = recruiterEmail.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    showToast('Opening default email client...');
  };

  // Save follow-up log to application notes
  const handleSaveNote = async () => {
    if (!followUpApp) return;
    setIsSavingNote(true);
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const templateName = TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Follow-Up';
      const logLine = `[Follow-Up Prepared: ${templateName} on ${todayStr}]`;

      const existingNotes = followUpApp.portal_notes || '';
      const updatedNotes = existingNotes.trim()
        ? `${existingNotes}\n${logLine}`
        : logLine;

      await updateApplication(followUpApp.id, {
        portal_notes: updatedNotes,
        recruiter_name: recruiterName.trim() || followUpApp.recruiter_name,
        recruiter_email: recruiterEmail.trim() || followUpApp.recruiter_email,
      });

      showToast(`Logged follow-up action to ${followUpApp.company} notes! ✅`);
    } catch (err) {
      showToast('Failed to save follow-up note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <>
      {/* 1. Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={closeFollowUpModal}
        aria-hidden="true"
      />

      {/* 2. Modal Window */}
      <div
        className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[94vw] sm:max-w-[760px] max-h-[92vh] bg-white dark:bg-[#151518] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="followup-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-5 sm:px-6 py-4 bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <CompanyLogo company={followUpApp.company} size={40} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="followup-title" className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white truncate m-0">
                  Follow Up with {followUpApp.company}
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {followUpApp.stage}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{followUpApp.role}</span>
                {daysSinceApplied !== null && (
                  <>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Clock size={11} className="text-amber-500" />
                      {daysSinceApplied === 0 ? 'Applied today' : `Applied ${daysSinceApplied}d ago`}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeFollowUpModal}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close follow-up modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
          {/* Template Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-orange-500" />
                <span>Follow-Up Strategy & Scenario</span>
              </span>
              <span className="text-[11px] text-slate-400">Select scenario</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TEMPLATES.map(tpl => {
                const isSelected = selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/40'
                        : 'bg-white dark:bg-[#1a1a1e] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-xs font-bold truncate w-full">{tpl.label}</span>
                    <span className="text-[10px] opacity-75 font-medium truncate w-full mt-0.5">
                      {tpl.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Template Guidance Tip */}
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              💡 {TEMPLATES.find(t => t.id === selectedTemplate)?.recommendedWhen}
            </p>
          </div>

          {/* Tone & Recruiter Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
            {/* Tone Selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Tone
              </label>
              <div className="flex rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] p-0.5">
                {(['warm', 'concise', 'formal'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                      tone === t
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Recruiter Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Recruiter / Contact Name
              </label>
              <input
                type="text"
                value={recruiterName}
                onChange={e => setRecruiterName(e.target.value)}
                placeholder={`e.g. Sarah, or ${followUpApp.company} Team`}
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Recruiter Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Recruiter Email (Optional)
              </label>
              <input
                type="email"
                value={recruiterEmail}
                onChange={e => setRecruiterEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Subject Line Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Email Body Field (Editable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Email Message Body
              </label>
              <span className="text-[11px] text-slate-400">
                {body.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={9}
              value={body}
              onChange={e => setBody(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] text-xs sm:text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans transition-all resize-y"
            />
          </div>

          {/* Best Practices Accordion */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsTipsOpen(!isTipsOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-left cursor-pointer hover:bg-amber-500/10 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Info size={13} />
                <span>Follow-Up Best Practices (High Response Tips)</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-amber-700 dark:text-amber-400 transition-transform ${
                  isTipsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isTipsOpen && (
              <div className="px-3.5 pb-3 text-xs text-amber-900/80 dark:text-amber-200/80 space-y-1.5 pt-1 border-t border-amber-500/15">
                <p>• <strong>Timing:</strong> Tuesday and Thursday between 9:00 AM – 11:30 AM local time yield the highest recruiter open rates.</p>
                <p>• <strong>Length:</strong> Keep messages under 150 words. Recruiters read emails primarily on mobile between meetings.</p>
                <p>• <strong>Value Add:</strong> If you recently published a project, passed a certification, or solved a relevant technical problem, mention it in 1 sentence.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-200 dark:border-white/10 px-5 sm:px-6 py-3.5 bg-slate-50/90 dark:bg-[#121215] flex flex-wrap items-center justify-between gap-3">
          {/* Left: Save Note to Application */}
          <button
            type="button"
            disabled={isSavingNote}
            onClick={handleSaveNote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1a1a1e] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="Log that you prepared/sent this follow up to the application's notes"
          >
            <Save size={13} />
            <span>{isSavingNote ? 'Logging...' : 'Log to App Notes'}</span>
          </button>

          {/* Right: Copy & Send Actions */}
          <div className="flex items-center gap-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-[#1a1a1e] border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard! ✨' : 'Copy Email'}</span>
            </button>

            {/* Open in Email Client Button */}
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-md"
            >
              <Send size={13} />
              <span>Open in Email App</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
