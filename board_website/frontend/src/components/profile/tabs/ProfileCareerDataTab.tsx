import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../../context/AppContext';
import { UserProfile, EducationItem, ProjectItem, SkillsMatrix, AchievementItem } from '../../../types';
import {
  User,
  GraduationCap,
  FolderGit2,
  Cpu,
  Award,
  FileText,
  Save,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { PersonalDemographicsSection } from '../career/PersonalDemographicsSection';
import { QuickLinksSection } from '../career/QuickLinksSection';
import { EducationHistorySection } from '../career/EducationHistorySection';
import { ProjectShowcaseSection } from '../career/ProjectShowcaseSection';
import { SkillsMatrixSection, DEFAULT_SKILLS_MATRIX } from '../career/SkillsMatrixSection';
import { HonorsAwardsSection } from '../career/HonorsAwardsSection';
import { ResumeVersionsSection } from '../career/ResumeVersionsSection';

export const ProfileCareerDataTab: React.FC = () => {
  const { profile, updateProfile, versions, refreshState, showToast, currentUser, quickLinks } = useApp();

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
  // 2. Education Timeline State
  // -------------------------------------------------------------
  const [educationList, setEducationList] = useState<EducationItem[]>([]);

  // -------------------------------------------------------------
  // 3. Technical Projects State
  // -------------------------------------------------------------
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);

  // -------------------------------------------------------------
  // 4. Skills Matrix State
  // -------------------------------------------------------------
  const [skillsMatrix, setSkillsMatrix] = useState<SkillsMatrix>(DEFAULT_SKILLS_MATRIX);

  // -------------------------------------------------------------
  // 5. Achievements & Honors State
  // -------------------------------------------------------------
  const [achievementsList, setAchievementsList] = useState<AchievementItem[]>([]);

  // -------------------------------------------------------------
  // 6. Resume Version Manager State
  // -------------------------------------------------------------
  const [portfolioResumeId, setPortfolioResumeId] = useState<number | null>(null);

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
      <PersonalDemographicsSection
        fullName={fullName}
        setFullName={setFullName}
        age={age}
        setAge={setAge}
        phone={phone}
        setPhone={setPhone}
        location={location}
        setLocation={setLocation}
        linkedin={linkedin}
        setLinkedin={setLinkedin}
        github={github}
        setGithub={setGithub}
        bio={bio}
        setBio={setBio}
        markChanged={markChanged}
      />

      {/* 2. QUICK LINKS */}
      <QuickLinksSection />

      {/* 3. EDUCATION TIMELINE */}
      <EducationHistorySection
        educationList={educationList}
        setEducationList={setEducationList}
        markChanged={markChanged}
        showToast={showToast}
      />

      {/* 4. TECHNICAL PROJECTS */}
      <ProjectShowcaseSection
        projectsList={projectsList}
        setProjectsList={setProjectsList}
        markChanged={markChanged}
        showToast={showToast}
      />

      {/* 5. SKILLS MATRIX */}
      <SkillsMatrixSection
        skillsMatrix={skillsMatrix}
        setSkillsMatrix={setSkillsMatrix}
        markChanged={markChanged}
      />

      {/* 6. ACHIEVEMENTS, PUBLICATIONS & HONORS */}
      <HonorsAwardsSection
        achievementsList={achievementsList}
        setAchievementsList={setAchievementsList}
        markChanged={markChanged}
        showToast={showToast}
      />

      {/* 7. RESUME VERSION MANAGER */}
      <ResumeVersionsSection
        versions={versions || []}
        portfolioResumeId={portfolioResumeId}
        setPortfolioResumeId={setPortfolioResumeId}
        updateProfile={updateProfile}
        refreshState={refreshState}
        markChanged={markChanged}
        showToast={showToast}
      />

    </div>
  );
};
