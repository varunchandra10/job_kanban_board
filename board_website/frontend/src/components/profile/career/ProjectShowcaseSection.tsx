import React, { useState } from 'react';
import { FolderGit2, Plus, Globe, Github, Trash2, X } from 'lucide-react';
import { ProjectItem } from '../../../types';
import { sanitizeUrl } from '../../../utils/security';
import { generateUniqueStringId } from '../../../utils/idGenerator';

export interface ProjectShowcaseSectionProps {
  projectsList: ProjectItem[];
  setProjectsList: React.Dispatch<React.SetStateAction<ProjectItem[]>>;
  markChanged: () => void;
  showToast: (msg: string) => void;
}

export const ProjectShowcaseSection: React.FC<ProjectShowcaseSectionProps> = ({
  projectsList,
  setProjectsList,
  markChanged,
  showToast,
}) => {
  const [isAddingProj, setIsAddingProj] = useState(false);
  const [newProj, setNewProj] = useState<Partial<ProjectItem>>({
    title: '',
    role: '',
    startDate: '',
    endDate: '',
    description: '',
    techStack: [],
    liveUrl: '',
    repoUrl: '',
  });
  const [newProjTagInput, setNewProjTagInput] = useState('');

  const handleAddProject = () => {
    if (!newProj.title?.trim()) {
      showToast('Please enter a project title');
      return;
    }
    const item: ProjectItem = {
      id: generateUniqueStringId('proj'),
      title: newProj.title?.trim() || '',
      role: newProj.role?.trim() || '',
      startDate: newProj.startDate?.trim() || '',
      endDate: newProj.endDate?.trim() || '',
      description: newProj.description?.trim() || '',
      techStack: newProj.techStack || [],
      liveUrl: newProj.liveUrl?.trim() || '',
      repoUrl: newProj.repoUrl?.trim() || '',
    };
    setProjectsList(prev => [...prev, item]);
    setNewProj({
      title: '',
      role: '',
      startDate: '',
      endDate: '',
      description: '',
      techStack: [],
      liveUrl: '',
      repoUrl: '',
    });
    setIsAddingProj(false);
    markChanged();
  };

  const handleRemoveProject = (id: string) => {
    setProjectsList(prev => prev.filter(p => p.id !== id));
    markChanged();
  };

  const handleAddProjTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if ('key' in e) e.preventDefault();

    const tag = newProjTagInput.replace(/,/g, '').trim();
    if (!tag) return;
    if (!(newProj.techStack || []).includes(tag)) {
      setNewProj(prev => ({
        ...prev,
        techStack: [...(prev.techStack || []), tag],
      }));
    }
    setNewProjTagInput('');
  };

  const handleRemoveProjTag = (tag: string) => {
    setNewProj(prev => ({
      ...prev,
      techStack: (prev.techStack || []).filter(t => t !== tag),
    }));
  };

  return (
    <section id="sec-projects" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FolderGit2 size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
              4. Technical Projects &amp; Verified Links
            </h2>
            <span className="text-[11px] text-slate-400">Key engineering projects with live demo &amp; repository links</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddingProj(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/25 text-xs font-bold transition-all cursor-pointer shadow-2xs"
        >
          <Plus size={14} />
          <span>Add Project</span>
        </button>
      </div>

      {/* Existing Projects List */}
      {projectsList.length === 0 && !isAddingProj ? (
        <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FolderGit2 size={24} />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No Projects Added Yet
            </div>
            <p className="text-xs text-slate-400 max-w-sm m-0">
              Showcase your standout engineering work, live deployments, and GitHub repositories.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
            <button
              type="button"
              onClick={() => {
                setNewProj(p => ({
                  ...p,
                  title: 'Full Stack Web Platform',
                  role: 'Full Stack Engineer',
                  techStack: ['React', 'Node.js', 'PostgreSQL', 'TailwindCSS'],
                }));
                setIsAddingProj(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + Full Stack App
            </button>
            <button
              type="button"
              onClick={() => {
                setNewProj(p => ({
                  ...p,
                  title: 'AI / LLM Workflow Engine',
                  role: 'AI Systems Engineer',
                  techStack: ['Python', 'FastAPI', 'Redis', 'Docker'],
                }));
                setIsAddingProj(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-purple-500/25 bg-purple-500/5 hover:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-all cursor-pointer"
            >
              + AI / LLM Application
            </button>
            <button
              type="button"
              onClick={() => setIsAddingProj(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              + Add Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectsList.map(proj => (
            <div
              key={proj.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white m-0">
                      {proj.title}
                    </h3>
                    {proj.role && (
                      <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                        {proj.role}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveProject(proj.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remove project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0 line-clamp-3">
                    {proj.description}
                  </p>
                )}

                {/* Tech stack chip badges */}
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.techStack.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-200/70 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Links (Live Demo & GitHub Repo) */}
              {(proj.liveUrl || proj.repoUrl) && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                  {proj.liveUrl && (
                    <a
                      href={sanitizeUrl(proj.liveUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      <Globe size={12} />
                      <span>Live Demo</span>
                    </a>
                  )}

                  {proj.repoUrl && (
                    <a
                      href={sanitizeUrl(proj.repoUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-200/70 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
                    >
                      <Github size={12} />
                      <span>Source Code</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Project Form */}
      {isAddingProj && (
        <div className="p-4 sm:p-5 rounded-xl border border-purple-500/30 bg-purple-500/[0.03] space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              New Technical Project
            </span>
            <button
              type="button"
              onClick={() => setIsAddingProj(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Project Title *</label>
              <input
                type="text"
                placeholder="e.g. Distributed Cache Engine"
                value={newProj.title}
                onChange={e => setNewProj(p => ({ ...p, title: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Your Role / Responsibility</label>
              <input
                type="text"
                placeholder="e.g. Lead Engineer / Backend Contributor"
                value={newProj.role}
                onChange={e => setNewProj(p => ({ ...p, role: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Live Demo URL</label>
              <input
                type="url"
                placeholder="https://myproject.dev"
                value={newProj.liveUrl}
                onChange={e => setNewProj(p => ({ ...p, liveUrl: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">GitHub Repo URL</label>
              <input
                type="url"
                placeholder="https://github.com/..."
                value={newProj.repoUrl}
                onChange={e => setNewProj(p => ({ ...p, repoUrl: e.target.value }))}
                className="w-full h-11 sm:h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Engineering Impact &amp; Architecture Description
            </label>
            <textarea
              rows={2}
              placeholder="Architected a fault-tolerant vector index supporting 10k QPS with sub-5ms latency..."
              value={newProj.description}
              onChange={e => setNewProj(p => ({ ...p, description: e.target.value }))}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-base sm:text-xs text-slate-900 dark:text-white outline-none focus:border-purple-500"
            />
          </div>

          {/* Tag Input for Tech Stack */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Tech Stack Tags (Press Enter or Comma)
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b]">
              {(newProj.techStack || []).map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProjTag(tag)}
                    className="hover:text-rose-500"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                placeholder="Type tag (e.g. Go, Redis, Docker)..."
                value={newProjTagInput}
                onChange={e => setNewProjTagInput(e.target.value)}
                onKeyDown={handleAddProjTag}
                className="flex-1 min-w-[140px] text-base sm:text-xs bg-transparent outline-none py-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/15">
            <button
              type="button"
              onClick={() => setIsAddingProj(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddProject}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
            >
              Save Project
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

