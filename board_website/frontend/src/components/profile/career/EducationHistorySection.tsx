import React, { useState } from 'react';
import { GraduationCap, Plus, Calendar, BookOpen, ExternalLink, Trash2, X } from 'lucide-react';
import { EducationItem } from '../../../types';
import { sanitizeUrl } from '../../../utils/security';
import { generateUniqueStringId } from '../../../utils/idGenerator';

export interface EducationHistorySectionProps {
  educationList: EducationItem[];
  setEducationList: React.Dispatch<React.SetStateAction<EducationItem[]>>;
  markChanged: () => void;
  showToast: (msg: string) => void;
}

export const EducationHistorySection: React.FC<EducationHistorySectionProps> = ({
  educationList,
  setEducationList,
  markChanged,
  showToast,
}) => {
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [newEdu, setNewEdu] = useState<Partial<EducationItem>>({
    school: '',
    degree: '',
    startDate: '',
    endDate: '',
    gpa: '',
    honors: '',
    thesisTitle: '',
    thesisUrl: '',
  });

  const handleAddEducation = () => {
    if (!newEdu.school?.trim() && !newEdu.degree?.trim()) {
      showToast('Please enter at least a school or degree');
      return;
    }
    const item: EducationItem = {
      id: generateUniqueStringId('edu'),
      school: newEdu.school?.trim() || '',
      degree: newEdu.degree?.trim() || '',
      startDate: newEdu.startDate?.trim() || '',
      endDate: newEdu.endDate?.trim() || '',
      gpa: newEdu.gpa?.trim() || '',
      honors: newEdu.honors?.trim() || '',
      thesisTitle: newEdu.thesisTitle?.trim() || '',
      thesisUrl: newEdu.thesisUrl?.trim() || '',
    };
    setEducationList(prev => [...prev, item]);
    setNewEdu({
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      gpa: '',
      honors: '',
      thesisTitle: '',
      thesisUrl: '',
    });
    setIsAddingEdu(false);
    markChanged();
  };

  const handleRemoveEducation = (id: string) => {
    setEducationList(prev => prev.filter(e => e.id !== id));
    markChanged();
  };

  return (
    <section id="sec-education" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GraduationCap size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              3. Education Timeline &amp; Research Links
            </h2>
            <span className="text-[11px] text-slate-400">Universities, degrees, timeline dates, and published thesis/papers</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingEdu(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>Add Education</span>
        </button>
      </div>

      {/* Existing Education Cards */}
      {educationList.length === 0 && !isAddingEdu ? (
        <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GraduationCap size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Education Listed Yet
            </div>
            <p className="text-xs text-slate-400 max-w-sm m-0">
              List your university degree, dates, GPA, or published research thesis.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
            <button
              type="button"
              onClick={() => {
                setNewEdu(p => ({ ...p, degree: 'B.Tech / BS in Computer Science' }));
                setIsAddingEdu(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + B.Tech / BS in CS
            </button>
            <button
              type="button"
              onClick={() => {
                setNewEdu(p => ({ ...p, degree: "M.S. / Master's Degree" }));
                setIsAddingEdu(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + M.S. Degree
            </button>
            <button
              type="button"
              onClick={() => setIsAddingEdu(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Add Degree
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {educationList.map(edu => (
            <div
              key={edu.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    {edu.degree || 'Degree Program'}
                  </h3>
                  {edu.school && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      &bull; {edu.school}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  {(edu.startDate || edu.endDate) && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Calendar size={12} className="text-slate-400" />
                      {edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate || 'Present'}
                    </span>
                  )}
                  {edu.gpa && (
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      GPA: {edu.gpa}
                    </span>
                  )}
                  {edu.honors && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {edu.honors}
                    </span>
                  )}
                </div>

                {/* Thesis / Paper Link */}
                {(edu.thesisTitle || edu.thesisUrl) && (
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <BookOpen size={11} className="text-emerald-500" />
                      Thesis:
                    </span>
                    {edu.thesisUrl ? (
                      <a
                        href={sanitizeUrl(edu.thesisUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        <span>{edu.thesisTitle || edu.thesisUrl}</span>
                        <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-700 dark:text-slate-300">
                        {edu.thesisTitle}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveEducation(edu.id)}
                className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove education"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Education Modal / Inline Card */}
      {isAddingEdu && (
        <div className="p-4 sm:p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03] space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              New Education Entry
            </span>
            <button
              type="button"
              onClick={() => setIsAddingEdu(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">School / University *</label>
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={newEdu.school}
                onChange={e => setNewEdu(p => ({ ...p, school: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Degree &amp; Major *</label>
              <input
                type="text"
                placeholder="e.g. B.Tech in Computer Science"
                value={newEdu.degree}
                onChange={e => setNewEdu(p => ({ ...p, degree: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Dates / Graduation</label>
              <input
                type="text"
                placeholder="e.g. Aug 2022 – May 2026"
                value={newEdu.endDate}
                onChange={e => setNewEdu(p => ({ ...p, endDate: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">GPA / Honors</label>
              <input
                type="text"
                placeholder="e.g. 3.9/4.0 • Magna Cum Laude"
                value={newEdu.gpa}
                onChange={e => setNewEdu(p => ({ ...p, gpa: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Thesis / Project Title</label>
              <input
                type="text"
                placeholder="e.g. Optimizing Distributed Key-Value Stores"
                value={newEdu.thesisTitle}
                onChange={e => setNewEdu(p => ({ ...p, thesisTitle: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Thesis / Research URL</label>
              <input
                type="url"
                placeholder="https://doi.org/... or PDF link"
                value={newEdu.thesisUrl}
                onChange={e => setNewEdu(p => ({ ...p, thesisUrl: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/15">
            <button
              type="button"
              onClick={() => setIsAddingEdu(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddEducation}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              Save Education
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

