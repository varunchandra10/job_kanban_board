import React, { useState, useRef } from 'react';
import { FileText, Upload, Loader2, Star, FileCheck, Eye, Trash2, Sparkles } from 'lucide-react';
import { ResumeVersion, UserProfile } from '../../../types';
import { api } from '../../../services/api';

export interface ResumeVersionsSectionProps {
  versions: ResumeVersion[];
  portfolioResumeId: number | null;
  setPortfolioResumeId: (id: number | null) => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshState: () => Promise<void>;
  markChanged: () => void;
  showToast: (msg: string) => void;
}

export const ResumeVersionsSection: React.FC<ResumeVersionsSectionProps> = ({
  versions,
  portfolioResumeId,
  setPortfolioResumeId,
  updateProfile,
  refreshState,
  markChanged,
  showToast,
}) => {
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newResumeLabel, setNewResumeLabel] = useState('');
  const [newResumeRegion, setNewResumeRegion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadResumeVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a PDF resume file');
      return;
    }

    setIsUploadingResume(true);
    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // 2. Create version
      const label = newResumeLabel.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');
      const created = await api.createResumeVersion(label, newResumeRegion.trim() || 'General');

      // 3. Patch PDF data
      await api.updateResumeVersion(created.id, {
        pdf_name: selectedFile.name,
        pdf_data: base64Data,
        has_pdf: 1,
      });

      // 4. Default as portfolio resume if none set
      if (!portfolioResumeId) {
        setPortfolioResumeId(created.id);
        await updateProfile({ portfolio_resume_id: created.id });
      }

      await refreshState();
      setSelectedFile(null);
      setNewResumeLabel('');
      setNewResumeRegion('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(`Resume "${label}" uploaded successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to upload resume version');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSetPortfolioResume = async (versionId: number) => {
    setPortfolioResumeId(versionId);
    markChanged();
    try {
      await updateProfile({ portfolio_resume_id: versionId });
      showToast('Designated resume updated for Public Portfolio');
    } catch (_) {}
  };

  const handleDeleteResumeVersion = async (versionId: number) => {
    if (!confirm('Are you sure you want to delete this resume version?')) return;
    try {
      await api.deleteResumeVersion(versionId);
      if (portfolioResumeId === versionId) {
        setPortfolioResumeId(null);
        await updateProfile({ portfolio_resume_id: null });
      }
      await refreshState();
      showToast('Resume version deleted');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete version');
    }
  };

  return (
    <section id="sec-resumes" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <FileText size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              7. Resume Version Manager &amp; Public Portfolio Designation
            </h2>
            <span className="text-[11px] text-slate-400">
              Upload versions and choose which PDF is delivered to recruiters on your public portfolio
            </span>
          </div>
        </div>
      </div>

      {/* Upload New Resume Card */}
      <form onSubmit={handleUploadResumeVersion} className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-3">
        <div className="text-xs font-bold text-slate-900 dark:text-white">
          Upload New Resume PDF
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Version Label</label>
            <input
              type="text"
              placeholder="e.g. Full Stack (SWE-2026)"
              value={newResumeLabel}
              onChange={e => setNewResumeLabel(e.target.value)}
              className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Region / Focus</label>
            <input
              type="text"
              placeholder="e.g. US Remote / EU / Backend"
              value={newResumeRegion}
              onChange={e => setNewResumeRegion(e.target.value)}
              className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Select PDF File *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full h-11 sm:h-10 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isUploadingResume || !selectedFile}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            {isUploadingResume ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Uploading PDF...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Upload Resume Version</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Existing Resumes List */}
      <div className="space-y-2.5 pt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Available Resume Versions ({versions.length})
        </div>

        {versions.length === 0 ? (
          <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            No resume versions currently registered. Upload a PDF above to attach one.
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map(ver => {
              const isDesignated = portfolioResumeId === ver.id;
              const pdfUrl = api.getResumeVersionPdfUrl(ver.id);

              return (
                <div
                  key={ver.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDesignated
                      ? 'border-indigo-500/40 bg-indigo-500/[0.04] ring-1 ring-indigo-500/20'
                      : 'border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {ver.label}
                      </span>
                      {ver.region && (
                        <span className="text-[10.5px] px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-medium">
                          {ver.region}
                        </span>
                      )}
                      {isDesignated && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <Star size={11} className="fill-amber-500" />
                          <span>PORTFOLIO ACTIVE</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <FileCheck size={13} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{ver.pdf_name || `${ver.label}.pdf`}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Designated Toggle Radio */}
                    <button
                      type="button"
                      onClick={() => handleSetPortfolioResume(ver.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isDesignated
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-white dark:bg-[#1f1f23] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                      title="Set as active download on public recruiter portfolio"
                    >
                      <Star size={13} className={isDesignated ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
                      <span>{isDesignated ? 'Selected for Portfolio' : 'Select for Portfolio'}</span>
                    </button>

                    {/* Preview PDF */}
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        api.viewResumeVersionPdf(ver.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1f1f23] text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                      title="Preview PDF in browser"
                    >
                      <Eye size={13} />
                      <span>View</span>
                    </a>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDeleteResumeVersion(ver.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete resume version"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

