import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft, FileCheck, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
            <FileCheck size={12} />
            <span>User Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight m-0">
            Terms of Service
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
              1. Acceptance of Terms
            </h2>
            <p className="m-0 text-slate-300 leading-relaxed">
              By accessing or using Job Tracker (&quot;the Service&quot;), available at{' '}
              <a href="https://kanban-board-job.vercel.app" className="text-indigo-400 underline">
                https://kanban-board-job.vercel.app
              </a>
              , you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <CheckCircle2 size={18} className="text-indigo-400" />
              2. Description of Service
            </h2>
            <p className="m-0 text-slate-300 leading-relaxed">
              Job Tracker is a productivity web application that allows job seekers to track employment applications across custom Kanban stages, document technical interview preparation and daily learnings, and organize associated resumes and cover letters via Google Drive integrations.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <CheckCircle2 size={18} className="text-indigo-400" />
              3. User Accounts and Responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-300 m-0">
              <li>
                You are responsible for safeguarding your login credentials and for any activities or actions under your account.
              </li>
              <li>
                You agree not to upload any malicious code, unauthorized materials, or violate any third-party intellectual property rights when uploading resumes or notes.
              </li>
              <li>
                You must be at least 13 years old to use the Service.
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <CheckCircle2 size={18} className="text-indigo-400" />
              4. Third-Party Services (Google APIs)
            </h2>
            <p className="m-0 text-slate-300 leading-relaxed">
              The Service integrates with Google OAuth and Google Drive APIs. When connecting your Google account, you grant the Service permission to store files strictly inside designated Job Tracker folders. Your relationship with Google is governed by Google&apos;s own Terms of Service.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <AlertCircle size={18} className="text-amber-400" />
              5. Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <p className="m-0 text-slate-300 leading-relaxed">
              Job Tracker is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. In no event shall the developer be liable for any direct, indirect, incidental, special, or consequential damages arising out of the use or inability to use the service.
            </p>
          </section>

          {/* Section 6: Contact */}
          <section className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5 m-0 mb-3">
              <Mail size={18} className="text-indigo-400" />
              6. Contact Information
            </h2>
            <p className="m-0">
              For any questions or legal inquiries regarding these Terms of Service, please contact:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-1 text-xs">
              <span className="text-slate-400 font-mono">Developer: Varun Chandra</span>
              <span className="text-slate-400 font-mono">
                Email:{' '}
                <a href="mailto:kvarunchandra19@gmail.com" className="text-indigo-400 underline">
                  kvarunchandra19@gmail.com
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
