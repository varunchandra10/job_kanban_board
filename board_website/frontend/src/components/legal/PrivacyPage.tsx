import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2, HardDrive, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-white font-black text-lg no-underline tracking-tight"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Shield size={18} />
            </div>
            <span>Job Tracker</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 transition no-underline"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
            <Lock size={12} />
            <span>Privacy &amp; Data Protection</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight m-0">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Last Updated: October 27, 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <CheckCircle2 size={18} className="text-indigo-400" />
              1. Overview
            </h2>
            <p className="m-0 text-slate-300 leading-relaxed">
              Job Tracker (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;), available at{' '}
              <a href="https://kanban-board-job.vercel.app" className="text-indigo-400 underline">
                https://kanban-board-job.vercel.app
              </a>
              , is a career management and job search platform designed to help candidates organize applications, track recruitment progress, and store job search materials. We respect your privacy and are committed to protecting the personal data you share with us.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <CheckCircle2 size={18} className="text-indigo-400" />
              2. Information We Collect
            </h2>
            <p className="mb-4">We collect only the minimal data required to provide you with account access and functionality:</p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                <strong className="text-white">Account Information:</strong> When you register via email or Google Sign-In, we store your email address, your name, and optionally your profile picture avatar to authenticate your session.
              </li>
              <li>
                <strong className="text-white">Application Records:</strong> Information you voluntarily create in your Kanban board, including target company names, job titles, application stages, salary expectations, interview notes, and calendar deadlines.
              </li>
              <li>
                <strong className="text-white">Uploaded Documents:</strong> Resume and cover letter file view links stored in your designated Google Drive folder.
              </li>
            </ul>
          </section>

          {/* Section 3: Google API Disclosure */}
          <section className="bg-slate-900/50 border border-indigo-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <HardDrive size={18} className="text-indigo-400" />
              3. Google API Services &amp; Google Drive Limited Use Disclosure
            </h2>
            <p className="mb-4">
              Job Tracker uses Google APIs (OAuth 2.0 and Google Drive API) to authenticate users and enable document storage. In compliance with Google&apos;s Limited Use policy:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300 mb-4">
              <li>
                <strong className="text-white">Minimal Scopes:</strong> We use the <code className="bg-black/30 px-1.5 py-0.5 rounded text-indigo-300 text-xs">drive.file</code> scope, which grants access <em>strictly to files and folders created or opened by Job Tracker</em>. We cannot and do not read, view, or modify any other files in your personal Google Drive.
              </li>
              <li>
                <strong className="text-white">No Third-Party Transfers:</strong> Google user data and uploaded documents are never sold, transferred, or disclosed to third parties.
              </li>
              <li>
                <strong className="text-white">No AI Training:</strong> We do not use your Google user data, resumes, or application records to train generalized machine learning or artificial intelligence models.
              </li>
              <li>
                <strong className="text-white">Limited Use Compliance:</strong> Job Tracker&apos;s use and transfer to any other app of information received from Google APIs adheres to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <Lock size={18} className="text-indigo-400" />
              4. Data Isolation &amp; Security
            </h2>
            <p className="mb-4">
              We employ strict multi-tenant database isolation. Every job application, learning note, and document record is associated exclusively with your authenticated user ID. No other user can query, access, or view your records.
            </p>
            <p className="m-0">
              Passwords are salted and hashed using cryptographic algorithms before storage. Passwords are never stored in plain text.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <FileText size={18} className="text-indigo-400" />
              5. Data Retention &amp; Revocation of Access
            </h2>
            <p className="mb-4">
              You retain full ownership of your data at all times.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-300">
              <li>
                You can revoke Job Tracker&apos;s access to your Google account at any time by visiting{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 underline"
                >
                  Google Account Security Permissions
                </a>
                .
              </li>
              <li>
                You may request complete deletion of your account and database records by contacting us at the address below.
              </li>
            </ul>
          </section>

          {/* Section 6: Contact */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <Mail size={18} className="text-indigo-400" />
              6. Contact Information
            </h2>
            <p className="m-0">
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact the developer:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs">
              <span className="text-slate-400 font-mono">Developer: Varun Chandra</span>
              <span className="text-slate-400 font-mono">
                Support Email:{' '}
                <a href="mailto:kvarunchandra19@gmail.com" className="text-indigo-400 underline">
                  kvarunchandra19@gmail.com
                </a>
              </span>
              <span className="text-slate-400 font-mono">
                Website:{' '}
                <a href="https://kanban-board-job.vercel.app" className="text-indigo-400 underline">
                  https://kanban-board-job.vercel.app
                </a>
              </span>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p className="m-0">&copy; {new Date().getFullYear()} Job Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
};
