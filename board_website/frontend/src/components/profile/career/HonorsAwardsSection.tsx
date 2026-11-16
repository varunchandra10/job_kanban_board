import React, { useState } from 'react';
import { Award, Plus, Link as LinkIcon, ExternalLink, Trash2, X } from 'lucide-react';
import { AchievementItem } from '../../../types';
import { sanitizeUrl } from '../../../utils/security';
import { generateUniqueStringId } from '../../../utils/idGenerator';

export interface HonorsAwardsSectionProps {
  achievementsList: AchievementItem[];
  setAchievementsList: React.Dispatch<React.SetStateAction<AchievementItem[]>>;
  markChanged: () => void;
  showToast: (msg: string) => void;
}

export const HonorsAwardsSection: React.FC<HonorsAwardsSectionProps> = ({
  achievementsList,
  setAchievementsList,
  markChanged,
  showToast,
}) => {
  const [isAddingAch, setIsAddingAch] = useState(false);
  const [newAch, setNewAch] = useState<Partial<AchievementItem>>({
    title: '',
    issuer: '',
    year: '',
    url: '',
    description: '',
  });

  const handleAddAchievement = () => {
    if (!newAch.title?.trim()) {
      showToast('Please enter an achievement title');
      return;
    }
    const item: AchievementItem = {
      id: generateUniqueStringId('ach'),
      title: newAch.title?.trim() || '',
      issuer: newAch.issuer?.trim() || '',
      year: newAch.year?.trim() || '',
      url: newAch.url?.trim() || '',
      description: newAch.description?.trim() || '',
    };
    setAchievementsList(prev => [...prev, item]);
    setNewAch({
      title: '',
      issuer: '',
      year: '',
      url: '',
      description: '',
    });
    setIsAddingAch(false);
    markChanged();
  };

  const handleRemoveAchievement = (id: string) => {
    setAchievementsList(prev => prev.filter(a => a.id !== id));
    markChanged();
  };

  return (
    <section id="sec-achievements" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              6. Achievements, Publications &amp; Honors
            </h2>
            <span className="text-[11px] text-slate-400">Competitions won, hackathons, academic papers, patents, certifications</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingAch(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>Add Honor</span>
        </button>
      </div>

      {/* Existing Achievements List */}
      {achievementsList.length === 0 && !isAddingAch ? (
        <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Award size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Achievements or Certifications Added Yet
            </div>
            <p className="text-xs text-slate-400 max-w-sm m-0">
              Add verified certifications, hackathons won, academic honors, or published papers.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
            <button
              type="button"
              onClick={() => {
                setNewAch(p => ({ ...p, title: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services' }));
                setIsAddingAch(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + AWS / Cloud Certification
            </button>
            <button
              type="button"
              onClick={() => {
                setNewAch(p => ({ ...p, title: 'Hackathon Finalist / Winner', issuer: 'Devpost / Major League Hacking' }));
                setIsAddingAch(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + Hackathon Winner
            </button>
            <button
              type="button"
              onClick={() => setIsAddingAch(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Add Honor
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {achievementsList.map(ach => (
            <div
              key={ach.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                    {ach.title}
                  </h3>
                  {ach.issuer && (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      &bull; {ach.issuer}
                    </span>
                  )}
                  {ach.year && (
                    <span className="text-[11px] font-mono text-slate-400 font-bold">
                      ({ach.year})
                    </span>
                  )}
                </div>

                {ach.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 m-0">
                    {ach.description}
                  </p>
                )}

                {ach.url && (
                  <div className="pt-1">
                    <a
                      href={sanitizeUrl(ach.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <LinkIcon size={12} />
                      <span>View Verifiable Credential</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveAchievement(ach.id)}
                className="self-end sm:self-center p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Remove honor"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Achievement Form */}
      {isAddingAch && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.03] space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              New Achievement / Publication / Honor
            </span>
            <button
              type="button"
              onClick={() => setIsAddingAch(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Title / Competition / Certificate *</label>
              <input
                type="text"
                placeholder="e.g. AWS Certified Solutions Architect Associate"
                value={newAch.title}
                onChange={e => setNewAch(p => ({ ...p, title: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Year / Date</label>
              <input
                type="text"
                placeholder="e.g. 2026"
                value={newAch.year}
                onChange={e => setNewAch(p => ({ ...p, year: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Issuing Organization</label>
              <input
                type="text"
                placeholder="e.g. Amazon Web Services, HackMIT, IEEE"
                value={newAch.issuer}
                onChange={e => setNewAch(p => ({ ...p, issuer: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Verifiable URL</label>
              <input
                type="url"
                placeholder="https://credly.com/..."
                value={newAch.url}
                onChange={e => setNewAch(p => ({ ...p, url: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-amber-500/15">
            <button
              type="button"
              onClick={() => setIsAddingAch(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddAchievement}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-2xs"
            >
              Save Honor
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
