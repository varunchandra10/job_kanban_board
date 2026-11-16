import React, { useState } from 'react';
import { Cpu, X } from 'lucide-react';
import { SkillsMatrix } from '../../../types';

export const DEFAULT_SKILLS_MATRIX: SkillsMatrix = {
  languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
  frameworks: ['React', 'Next.js', 'Node.js', 'TailwindCSS'],
  databases: ['PostgreSQL', 'Redis', 'Docker'],
  tools: ['Git', 'Linux', 'Postman'],
};

export const SUGGESTED_SKILLS: Record<keyof SkillsMatrix, string[]> = {
  languages: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'C++', 'SQL', 'Rust'],
  frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'TailwindCSS', 'FastAPI', 'Django', 'Spring Boot'],
  databases: ['PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'MySQL', 'Prisma', 'Supabase'],
  tools: ['Git', 'Linux', 'AWS', 'Docker', 'Postman', 'Vercel', 'Kubernetes', 'GitHub Actions'],
};

export interface SkillsMatrixSectionProps {
  skillsMatrix: SkillsMatrix;
  setSkillsMatrix: React.Dispatch<React.SetStateAction<SkillsMatrix>>;
  markChanged: () => void;
}

export const SkillsMatrixSection: React.FC<SkillsMatrixSectionProps> = ({
  skillsMatrix,
  setSkillsMatrix,
  markChanged,
}) => {
  const [skillInputs, setSkillInputs] = useState<{
    languages: string;
    frameworks: string;
    databases: string;
    tools: string;
  }>({
    languages: '',
    frameworks: '',
    databases: '',
    tools: '',
  });

  const handleAddSkill = (category: keyof SkillsMatrix) => {
    const raw = skillInputs[category].trim();
    if (!raw) return;

    const tokens = raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    setSkillsMatrix(prev => {
      const current = prev[category] || [];
      const updated = Array.from(new Set([...current, ...tokens]));
      return { ...prev, [category]: updated };
    });

    setSkillInputs(prev => ({ ...prev, [category]: '' }));
    markChanged();
  };

  const handleRemoveSkill = (category: keyof SkillsMatrix, skill: string) => {
    setSkillsMatrix(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(s => s !== skill),
    }));
    markChanged();
  };

  const handleQuickAddSkill = (category: keyof SkillsMatrix, skill: string) => {
    setSkillsMatrix(prev => {
      const current = prev[category] || [];
      if (current.includes(skill)) return prev;
      return { ...prev, [category]: [...current, skill] };
    });
    markChanged();
  };

  return (
    <section id="sec-skills" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Cpu size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              5. Categorized Skills Matrix
            </h2>
            <span className="text-[11px] text-slate-400">Organized technical competencies with 1-click chip tags</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Languages */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Languages
              </span>
              <span className="text-[10.5px] font-semibold text-slate-400">
                {skillsMatrix.languages.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {skillsMatrix.languages.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 group"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('languages', s)}
                    className="text-indigo-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add language (e.g. Go, C++, Rust)..."
                value={skillInputs.languages}
                onChange={e => setSkillInputs(p => ({ ...p, languages: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('languages'))}
                className="flex-1 h-10 sm:h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('languages')}
                className="px-3.5 h-10 sm:h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* 1-Click Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Quick Add:</span>
              {SUGGESTED_SKILLS.languages
                .filter(s => !skillsMatrix.languages.includes(s))
                .slice(0, 5)
                .map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickAddSkill('languages', s)}
                    className="px-2 py-0.5 rounded-md border border-dashed border-indigo-300 dark:border-white/10 hover:border-indigo-500 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all cursor-pointer text-[10.5px] font-medium"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Frameworks & Libraries */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Frameworks &amp; Libraries
              </span>
              <span className="text-[10.5px] font-semibold text-slate-400">
                {skillsMatrix.frameworks.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {skillsMatrix.frameworks.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 group"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('frameworks', s)}
                    className="text-blue-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add framework (e.g. Next.js, Express)..."
                value={skillInputs.frameworks}
                onChange={e => setSkillInputs(p => ({ ...p, frameworks: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('frameworks'))}
                className="flex-1 h-10 sm:h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('frameworks')}
                className="px-3.5 h-10 sm:h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* 1-Click Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Quick Add:</span>
              {SUGGESTED_SKILLS.frameworks
                .filter(s => !skillsMatrix.frameworks.includes(s))
                .slice(0, 5)
                .map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickAddSkill('frameworks', s)}
                    className="px-2 py-0.5 rounded-md border border-dashed border-blue-300 dark:border-white/10 hover:border-blue-500 bg-white dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all cursor-pointer text-[10.5px] font-medium"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Databases & Cloud */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Databases &amp; Cloud Infrastructure
              </span>
              <span className="text-[10.5px] font-semibold text-slate-400">
                {skillsMatrix.databases.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {skillsMatrix.databases.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 group"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('databases', s)}
                    className="text-emerald-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add DB/Cloud (e.g. AWS, Redis, Kafka)..."
                value={skillInputs.databases}
                onChange={e => setSkillInputs(p => ({ ...p, databases: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('databases'))}
                className="flex-1 h-10 sm:h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('databases')}
                className="px-3.5 h-10 sm:h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* 1-Click Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Quick Add:</span>
              {SUGGESTED_SKILLS.databases
                .filter(s => !skillsMatrix.databases.includes(s))
                .slice(0, 5)
                .map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickAddSkill('databases', s)}
                    className="px-2 py-0.5 rounded-md border border-dashed border-emerald-300 dark:border-white/10 hover:border-emerald-500 bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-all cursor-pointer text-[10.5px] font-medium"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Developer Tools */}
        <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Developer Tools &amp; CI/CD
              </span>
              <span className="text-[10.5px] font-semibold text-slate-400">
                {skillsMatrix.tools.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 min-h-[32px]">
              {skillsMatrix.tools.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 group"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill('tools', s)}
                    className="text-amber-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tool (e.g. Vitest, Docker, Figma)..."
                value={skillInputs.tools}
                onChange={e => setSkillInputs(p => ({ ...p, tools: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('tools'))}
                className="flex-1 h-10 sm:h-8 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('tools')}
                className="px-3.5 h-10 sm:h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* 1-Click Suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Quick Add:</span>
              {SUGGESTED_SKILLS.tools
                .filter(s => !skillsMatrix.tools.includes(s))
                .slice(0, 5)
                .map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleQuickAddSkill('tools', s)}
                    className="px-2 py-0.5 rounded-md border border-dashed border-amber-300 dark:border-white/10 hover:border-amber-500 bg-white dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 transition-all cursor-pointer text-[10.5px] font-medium"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
