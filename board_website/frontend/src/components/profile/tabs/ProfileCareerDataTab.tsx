import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { api } from '../../../services/api';
import {
  UserProfile,
  EducationItem,
  ProjectItem,
  SkillsMatrix,
  AchievementItem,
  ResumeVersion,
} from '../../../types';
import {
  User,
  GraduationCap,
  FolderGit2,
  Cpu,
  Award,
  FileText,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Github,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Link as LinkIcon,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Star,
  Check,
  X,
  FileCheck,
  Loader2,
  Eye,
  Copy,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';

const DEFAULT_SKILLS_MATRIX: SkillsMatrix = {
  languages: ['TypeScript', 'JavaScript', 'Python', 'SQL'],
  frameworks: ['React', 'Next.js', 'Node.js', 'TailwindCSS'],
  databases: ['PostgreSQL', 'Redis', 'Docker'],
  tools: ['Git', 'Linux', 'Postman'],
};

export const ProfileCareerDataTab: React.FC = () => {
  const { profile, updateProfile, versions, refreshState, showToast, currentUser, quickLinks, addQuickLink, removeQuickLink } = useApp();

  // -------------------------------------------------------------
  // 1. Personal Demographics State
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [bio, setBio] = useState('');


  // -------------------------------------------------------------
  // Quick Links State & Handlers
  // -------------------------------------------------------------
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
    showToast('Copied link to clipboard');
  };

  const openAddLinkModal = () => {
    setEditingLinkId(null);
    setLinkTitle('');
    setLinkUrl('');
    setIsLinkModalOpen(true);
  };

  const openEditLinkModal = (link: { id: string; title: string; url: string }) => {
    setEditingLinkId(link.id);
    setLinkTitle(link.title);
    setLinkUrl(link.url);
    setIsLinkModalOpen(true);
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) return;

    if (editingLinkId) {
      removeQuickLink(editingLinkId);
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Link updated');
    } else {
      addQuickLink({
        title: linkTitle.trim(),
        url: linkUrl.trim(),
        type: 'custom',
      });
      showToast('Quick link added');
    }
    setIsLinkModalOpen(false);
  };

  // -------------------------------------------------------------
  // 2. Education Timeline State
  // -------------------------------------------------------------
  const [educationList, setEducationList] = useState<EducationItem[]>([]);
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

  // -------------------------------------------------------------
  // 3. Technical Projects State
  // -------------------------------------------------------------
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
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

  // -------------------------------------------------------------
  // 4. Skills Matrix State
  // -------------------------------------------------------------
  const [skillsMatrix, setSkillsMatrix] = useState<SkillsMatrix>(DEFAULT_SKILLS_MATRIX);
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

  // -------------------------------------------------------------
  // 5. Achievements, Publications & Honors State
  // -------------------------------------------------------------
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([]);
  const [isAddingAch, setIsAddingAch] = useState(false);
  const [newAch, setNewAch] = useState<Partial<AchievementItem>>({
    title: '',
    issuer: '',
    year: '',
    url: '',
    description: '',
  });

  // -------------------------------------------------------------
  // 6. Resume Version Manager State
  // -------------------------------------------------------------
  const [portfolioResumeId, setPortfolioResumeId] = useState<number | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [newResumeLabel, setNewResumeLabel] = useState('');
  const [newResumeRegion, setNewResumeRegion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status & Save indicator
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Active section spy & quick navigation
  const [activeSection, setActiveSection] = useState<string>('sec-demographics');

  // -------------------------------------------------------------
  // Initialize state from profile and AppContext
  // -------------------------------------------------------------
  const loadProfileData = () => {
    if (!profile) return;

    setFullName(profile.full_name || currentUser?.name || '');
    setAge(profile.age || '');
    setPhone(profile.phone || '');
    setLocation(profile.location || '');
    setLinkedin(profile.linkedin || '');
    setGithub(profile.github || '');
    setBio(profile.bio || profile.portfolio_bio || '');

    // Parse Education History
    try {
      if (profile.education_history) {
        const parsed = JSON.parse(profile.education_history);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEducationList(parsed);
        } else if (profile.school || profile.degree) {
          setEducationList([{
            id: 'legacy-edu-1',
            school: profile.school || '',
            degree: profile.degree || '',
            endDate: profile.grad_date || '',
            gpa: profile.gpa || '',
          }]);
        } else {
          setEducationList([]);
        }
      } else if (profile.school || profile.degree) {
        setEducationList([{
          id: 'legacy-edu-1',
          school: profile.school || '',
          degree: profile.degree || '',
          endDate: profile.grad_date || '',
          gpa: profile.gpa || '',
        }]);
      } else {
        setEducationList([]);
      }
    } catch {
      setEducationList([]);
    }

    // Parse Projects List
    try {
      if (profile.projects_list) {
        const parsed = JSON.parse(profile.projects_list);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProjectsList(parsed);
        } else if (profile.projects) {
          setProjectsList([{
            id: 'legacy-proj-1',
            title: 'Featured Projects',
            description: profile.projects,
            techStack: ['Full Stack'],
          }]);
        } else {
          setProjectsList([]);
        }
      } else if (profile.projects) {
        setProjectsList([{
          id: 'legacy-proj-1',
          title: 'Featured Projects',
          description: profile.projects,
          techStack: ['Full Stack'],
        }]);
      } else {
        setProjectsList([]);
      }
    } catch {
      setProjectsList([]);
    }

    // Parse Skills Matrix
    try {
      if (profile.skills_matrix) {
        const parsed = JSON.parse(profile.skills_matrix);
        if (parsed && typeof parsed === 'object') {
          setSkillsMatrix({
            languages: Array.isArray(parsed.languages) ? parsed.languages : DEFAULT_SKILLS_MATRIX.languages,
            frameworks: Array.isArray(parsed.frameworks) ? parsed.frameworks : DEFAULT_SKILLS_MATRIX.frameworks,
            databases: Array.isArray(parsed.databases) ? parsed.databases : DEFAULT_SKILLS_MATRIX.databases,
            tools: Array.isArray(parsed.tools) ? parsed.tools : DEFAULT_SKILLS_MATRIX.tools,
          });
        }
      } else if (profile.skills) {
        const rawTokens = profile.skills.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        if (rawTokens.length > 0) {
          setSkillsMatrix(prev => ({
            ...prev,
            languages: Array.from(new Set([...prev.languages, ...rawTokens.slice(0, 4)])),
          }));
        }
      }
    } catch {}

    // Parse Achievements
    try {
      if (profile.achievements) {
        const parsed = JSON.parse(profile.achievements);
        if (Array.isArray(parsed)) {
          setAchievementsList(parsed);
        } else {
          setAchievementsList([]);
        }
      } else {
        setAchievementsList([]);
      }
    } catch {
      setAchievementsList([]);
    }

    // Designated Portfolio Resume
    if (profile.portfolio_resume_id) {
      setPortfolioResumeId(Number(profile.portfolio_resume_id));
    } else if (versions && versions.length > 0) {
      const firstWithPdf = versions.find(v => v.has_pdf || v.pdf_name);
      if (firstWithPdf) setPortfolioResumeId(firstWithPdf.id);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [profile, currentUser]);

  const markChanged = () => setHasUnsavedChanges(true);

  const handleDiscardChanges = () => {
    loadProfileData();
    setHasUnsavedChanges(false);
    showToast('Unsaved changes discarded');
  };

  // -------------------------------------------------------------
  // Save All Profile Data
  // -------------------------------------------------------------
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const payload: Partial<UserProfile> = {
        full_name: fullName.trim(),
        age: age.trim(),
        phone: phone.trim(),
        location: location.trim(),
        linkedin: linkedin.trim(),
        github: github.trim(),
        bio: bio.trim(),
        portfolio_bio: bio.trim(), // Keep synchronized with public portfolio
        education_history: JSON.stringify(educationList),
        projects_list: JSON.stringify(projectsList),
        skills_matrix: JSON.stringify(skillsMatrix),
        achievements: JSON.stringify(achievementsList),
        portfolio_resume_id: portfolioResumeId,

        // Legacy string sync for backward compatibility
        school: educationList[0]?.school || '',
        degree: educationList[0]?.degree || '',
        grad_date: educationList[0]?.endDate || '',
        gpa: educationList[0]?.gpa || '',
        skills: [
          ...skillsMatrix.languages,
          ...skillsMatrix.frameworks,
          ...skillsMatrix.databases,
          ...skillsMatrix.tools,
        ].join(', '),
      };

      await updateProfile(payload);
      setHasUnsavedChanges(false);
      showToast('Career profile data saved successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to save career data');
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  const saveProfileRef = useRef(handleSaveProfile);
  saveProfileRef.current = handleSaveProfile;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProfileRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Quick-jump Subsections
  const subSections = useMemo(() => [
    { id: 'sec-demographics', label: 'Personal', icon: User },
    { id: 'sec-quicklinks', label: 'Quick Links', icon: ExternalLink, count: quickLinks.length },
    { id: 'sec-education', label: 'Education', icon: GraduationCap, count: educationList.length },
    { id: 'sec-projects', label: 'Projects', icon: FolderGit2, count: projectsList.length },
    {
      id: 'sec-skills',
      label: 'Skills',
      icon: Cpu,
      count:
        skillsMatrix.languages.length +
        skillsMatrix.frameworks.length +
        skillsMatrix.databases.length +
        skillsMatrix.tools.length,
    },
    { id: 'sec-achievements', label: 'Honors', icon: Award, count: achievementsList.length },
    { id: 'sec-resumes', label: 'Resumes', icon: FileText, count: versions?.length || 0 },
  ], [quickLinks.length, educationList.length, projectsList.length, skillsMatrix, achievementsList.length, versions?.length]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -120; // offset for sticky main header + sub-nav
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Scroll spy to highlight active pill
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;
      for (let i = subSections.length - 1; i >= 0; i--) {
        const sec = subSections[i];
        const el = document.getElementById(sec.id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sec.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [subSections]);

  // -------------------------------------------------------------
  // Education List Handlers
  // -------------------------------------------------------------
  const handleAddEducation = () => {
    if (!newEdu.school?.trim() && !newEdu.degree?.trim()) {
      showToast('Please enter at least a school or degree');
      return;
    }
    const item: EducationItem = {
      id: `edu-${Date.now()}`,
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

  // -------------------------------------------------------------
  // Project List Handlers
  // -------------------------------------------------------------
  const handleAddProject = () => {
    if (!newProj.title?.trim()) {
      showToast('Please enter a project title');
      return;
    }
    const item: ProjectItem = {
      id: `proj-${Date.now()}`,
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

  // -------------------------------------------------------------
  // Skills Matrix Handlers
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // Achievements Handlers
  // -------------------------------------------------------------
  const handleAddAchievement = () => {
    if (!newAch.title?.trim()) {
      showToast('Please enter an achievement title');
      return;
    }
    const item: AchievementItem = {
      id: `ach-${Date.now()}`,
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

  // -------------------------------------------------------------
  // Resume Version Upload & Management Handlers
  // -------------------------------------------------------------
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
    <div className="space-y-7 animate-in fade-in duration-200">
      
      {/* Top Header & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-500/20 bg-white/95 dark:bg-[#141417]/95 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white m-0">
              Career Data &amp; Resume Portfolio
            </h1>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              100% Optional
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Fill in only what you want. Your entries power your generated resumes and public recruiter showcase.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sticky Quick-Jump Navigation Bar */}
      <div className="sticky top-14 sm:top-16 z-30 py-2 -my-2 bg-slate-50/85 dark:bg-[#0c0d0e]/85 backdrop-blur-md">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scrollbar-none p-1 rounded-2xl bg-white/90 dark:bg-[#141417]/90 border border-slate-200/80 dark:border-white/10 shadow-xs">
          {subSections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollToSection(sec.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{sec.label}</span>
                {sec.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center min-w-4 px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {sec.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PERSONAL DEMOGRAPHICS & CONTACT */}
      <section id="sec-demographics" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                1. Personal Demographics &amp; Contact
              </h2>
              <span className="text-[11px] text-slate-400">Your core candidate identity &amp; quick contact info</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Full Legal / Preferred Name
            </label>
            <input
              type="text"
              placeholder="e.g. Alex Zhang"
              value={fullName}
              onChange={e => { setFullName(e.target.value); markChanged(); }}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Age or Date of Birth
            </label>
            <input
              type="text"
              placeholder="e.g. 24 or May 2002"
              value={age}
              onChange={e => { setAge(e.target.value); markChanged(); }}
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="tel"
                placeholder="e.g. +1 (555) 019-2834"
                value={phone}
                onChange={e => { setPhone(e.target.value); markChanged(); }}
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Current Location &amp; Timezone
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. San Francisco, CA (PST)"
                value={location}
                onChange={e => { setLocation(e.target.value); markChanged(); }}
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <Globe size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="url"
                placeholder="https://linkedin.com/in/..."
                value={linkedin}
                onChange={e => { setLinkedin(e.target.value); markChanged(); }}
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              GitHub Profile URL
            </label>
            <div className="relative">
              <Github size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="url"
                placeholder="https://github.com/..."
                value={github}
                onChange={e => { setGithub(e.target.value); markChanged(); }}
                className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Bio / Summary with Counter */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Professional Bio &amp; Elevator Pitch
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {bio.length} characters
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="e.g. Full Stack & AI Systems Engineer with 3+ years experience building distributed workflows. Passionate about real-time systems, clean API architectures, and algorithmic problem-solving."
            value={bio}
            onChange={e => { setBio(e.target.value); markChanged(); }}
            className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#18181b] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed"
          />
        </div>
      </section>


      {/* 2. QUICK LINKS & SHORTCUT PROFILES */}
      <section id="sec-quicklinks" className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#141417] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ExternalLink size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white m-0">
                2. Quick Links &amp; Shortcut Profiles
              </h2>
              <span className="text-[11px] text-slate-400">
                1-click shortcuts to your portfolio, LeetCode profile, GitHub, or live docs
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddLinkModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Plus size={14} />
            <span>Add Link</span>
          </button>
        </div>

        {quickLinks.length === 0 ? (
          <div className="py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center text-xs text-slate-400">
            No quick links added yet. Click &quot;Add Link&quot; to save shortcuts.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map(link => {
              const isEmail = link.url.includes('@') && !link.url.startsWith('http');
              const href = isEmail ? `mailto:${link.url}` : link.url;

              return (
                <div
                  key={link.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] transition-all gap-2.5 group"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {link.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {link.url}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                    >
                      {isEmail ? 'Send ↗' : 'Open ↗'}
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(link.url, link.id)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedLink === link.id ? (
                        <CheckCheck size={12} className="text-emerald-500" />
                      ) : (
                        'Copy'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditLinkModal(link)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <Sparkles size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeQuickLink(link.id)}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. EDUCATION TIMELINE & THESIS LINKS */}
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
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <GraduationCap size={24} className="text-slate-400" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Education Added Yet
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm m-0">
              Click &quot;Add Education&quot; to list your university, degree, GPA, or thesis research link.
            </p>
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
                          href={edu.thesisUrl}
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
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Degree &amp; Major *</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech in Computer Science"
                  value={newEdu.degree}
                  onChange={e => setNewEdu(p => ({ ...p, degree: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Dates / Graduation</label>
                <input
                  type="text"
                  placeholder="e.g. Aug 2022 – May 2026"
                  value={newEdu.endDate}
                  onChange={e => setNewEdu(p => ({ ...p, endDate: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">GPA / Honors</label>
                <input
                  type="text"
                  placeholder="e.g. 3.9/4.0 • Magna Cum Laude"
                  value={newEdu.gpa}
                  onChange={e => setNewEdu(p => ({ ...p, gpa: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Thesis / Project Title</label>
                <input
                  type="text"
                  placeholder="e.g. Optimizing Distributed Key-Value Stores"
                  value={newEdu.thesisTitle}
                  onChange={e => setNewEdu(p => ({ ...p, thesisTitle: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Thesis / Research URL</label>
                <input
                  type="url"
                  placeholder="https://doi.org/... or PDF link"
                  value={newEdu.thesisUrl}
                  onChange={e => setNewEdu(p => ({ ...p, thesisUrl: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/15">
              <button
                type="button"
                onClick={() => setIsAddingEdu(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEducation}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-2xs"
              >
                Save Education
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. TECHNICAL PROJECTS */}
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
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <FolderGit2 size={24} className="text-slate-400" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Projects Added Yet
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm m-0">
              Showcase your best engineering work, GitHub repos, and live deployments.
            </p>
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
                        href={proj.liveUrl}
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
                        href={proj.repoUrl}
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
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Your Role / Responsibility</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Engineer / Backend Contributor"
                  value={newProj.role}
                  onChange={e => setNewProj(p => ({ ...p, role: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Live Demo URL</label>
                <input
                  type="url"
                  placeholder="https://myproject.dev"
                  value={newProj.liveUrl}
                  onChange={e => setNewProj(p => ({ ...p, liveUrl: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">GitHub Repo URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/..."
                  value={newProj.repoUrl}
                  onChange={e => setNewProj(p => ({ ...p, repoUrl: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
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
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
            </div>

            {/* Tag Input for Tech Stack */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Tech Stack Tags (Press Enter or Comma)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b]">
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
                  className="flex-1 min-w-[140px] text-xs bg-transparent outline-none py-0.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-purple-500/15">
              <button
                type="button"
                onClick={() => setIsAddingProj(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddProject}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-2xs"
              >
                Save Project
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. SKILLS MATRIX (CATEGORIZED CHIP BADGES) */}
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
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
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
                    className="text-indigo-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add language (e.g. Go, C++, Rust)..."
                value={skillInputs.languages}
                onChange={e => setSkillInputs(p => ({ ...p, languages: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('languages'))}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('languages')}
                className="px-3 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Frameworks & Libraries */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
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
                    className="text-blue-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add framework (e.g. Next.js, Express)..."
                value={skillInputs.frameworks}
                onChange={e => setSkillInputs(p => ({ ...p, frameworks: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('frameworks'))}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('frameworks')}
                className="px-3 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Databases & Cloud */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
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
                    className="text-emerald-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add DB/Cloud (e.g. AWS, Redis, Kafka)..."
                value={skillInputs.databases}
                onChange={e => setSkillInputs(p => ({ ...p, databases: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('databases'))}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('databases')}
                className="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Developer Tools */}
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] space-y-2.5">
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
                    className="text-amber-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add tool (e.g. Vitest, Docker, Figma)..."
                value={skillInputs.tools}
                onChange={e => setSkillInputs(p => ({ ...p, tools: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill('tools'))}
                className="flex-1 h-8 px-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
              <button
                type="button"
                onClick={() => handleAddSkill('tools')}
                className="px-3 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ACHIEVEMENTS, PUBLICATIONS & HONORS */}
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
          <div className="py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-center gap-2">
            <Award size={24} className="text-slate-400" />
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No Achievements Added Yet
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm m-0">
              Add hackathons, AWS/GCP certifications, contest ratings, or patents with verifiable verification URLs.
            </p>
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
                        href={ach.url}
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
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Year / Date</label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  value={newAch.year}
                  onChange={e => setNewAch(p => ({ ...p, year: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Issuing Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services, HackMIT, IEEE"
                  value={newAch.issuer}
                  onChange={e => setNewAch(p => ({ ...p, issuer: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Verifiable URL</label>
                <input
                  type="url"
                  placeholder="https://credly.com/..."
                  value={newAch.url}
                  onChange={e => setNewAch(p => ({ ...p, url: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
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

      {/* 7. RESUME VERSION MANAGER & PORTFOLIO RESUME SELECTION */}
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
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Target Region / Focus</label>
              <input
                type="text"
                placeholder="e.g. US Remote / EU / Backend"
                value={newResumeRegion}
                onChange={e => setNewResumeRegion(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18181b] text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Select PDF File *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
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
      {/* Bottom Completion Hint */}
      <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles size={14} className="text-indigo-500 shrink-0" />
          <span>All sections are optional and automatically synchronize with your public recruiter portfolio.</span>
        </div>
      </div>

      {/* Quick Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/10 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingLinkId ? 'Edit Quick Link' : 'Add Quick Link'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveLink} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Title or Platform Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub, LeetCode, Personal Site"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  URL or Email Address
                </label>
                <input
                  type="text"
                  placeholder="https://... or username@domain.com"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  required
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121214] text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs cursor-pointer"
                >
                  {editingLinkId ? 'Save Changes' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Smart Save Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-lg animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-slate-900/95 dark:bg-[#18181b]/95 backdrop-blur-xl text-white border border-white/10 shadow-2xl shadow-indigo-500/25 ring-1 ring-white/10">
            <div className="flex items-center gap-2.5 min-w-0 pl-1.5">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Unsaved changes</div>
                <div className="text-[10px] text-slate-400 hidden sm:block truncate">
                  Press <kbd className="font-mono bg-white/10 px-1 rounded text-[9px]">Ctrl+S</kbd> to save anytime
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} />
                <span>Discard</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/30 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

