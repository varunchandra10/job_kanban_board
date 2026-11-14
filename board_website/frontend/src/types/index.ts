export type ApplicationStage = 'Bookmarked' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
export type ApplicationCategory = 'All' | 'Industry' | 'Government' | 'Research' | 'Calendar';

export interface Application {
  id: number;
  company: string;
  role: string;
  stage: ApplicationStage;
  category?: string;
  country?: string;
  city?: string;
  date_applied: string;
  deadline?: string;
  salary?: string;
  currency?: string;
  jd?: string;
  jd_url?: string;
  portal_url?: string;
  portal_user?: string;
  portal_pass?: string;
  portal_notes?: string;
  custom_tags?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_notes?: string;
  resume_path?: string;
  cover_letter_path?: string;
  resume_version_id?: number | null;
  position?: number;
  user_id?: string;
  is_bookmarked?: boolean | number;
}

export interface LearningTrack {
  id: string;
  name: string;
  color: string;
  bg?: string;
  border?: string;
}

export type LearningCategory = 'All' | 'Calendar' | string;

export interface Learning {
  id: number;
  title: string;
  topic?: string;
  category: string;
  duration_minutes: number;
  date_logged: string;
  resource_url?: string;
  notes?: string;
  tags?: string;
  user_id?: string;
  is_bookmarked?: boolean | number;
}

export interface TrophyTier {
  level: number;
  title: string;
  min: number;
  max: number;
  icon: string;
}

export interface GamificationStats {
  streak: number;
  currentStreak?: number;
  longestStreak: number;
  learningCount: number;
  totalMinutes: number;
  totalDsaSolved?: number;
  totalRepetitionStagesAdvanced?: number;
  spacedRepetitionXP?: number;
  totalXP: number;
  level: number;
  title?: string;
  levelTitle?: string;
  levelIcon?: string;
  currentLevelMin?: number;
  progressPercent?: number;
  nextLevelXP?: number;
  isFrozen?: boolean;
  todayFrozen?: boolean;
  todayCompleted?: boolean;
  todayAppOnly?: boolean;
  todayStudyOnly?: boolean;
  todayNeedsStudy?: boolean;
  todayNeedsApp?: boolean;
  todayHasApp?: boolean;
  todayHasStudy?: boolean;
  todayMinutes?: number;
  todayStudyCount?: number;
  todayDsaCount?: number;
  todayAppCount?: number;
  weekPunchcard: Array<{
    date: string;
    day: string;
    active: boolean;
    frozen: boolean;
    appOnly: boolean;
    isToday: boolean;
    appCount?: number;
    studyMinutes?: number;
    dsaCount?: number;
  }>;
  tiers?: TrophyTier[];
}

export interface UserProfile {
  id?: number | string;
  full_name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  school: string;
  degree: string;
  grad_date: string;
  gpa: string;
  skills: string;
  projects: string;
  experience: string;
  gdrive_folder_id?: string;
  portfolio_slug?: string;
  is_portfolio_public?: number | boolean;
  portfolio_headline?: string;
  portfolio_bio?: string;
}

export interface PublicPortfolioResponse {
  ok: number;
  slug: string;
  user: {
    name: string;
    headline: string;
    bio: string;
    avatar_url?: string;
    linkedin?: string;
    github?: string;
    email?: string;
    school?: string;
    degree?: string;
    grad_date?: string;
    skills?: string;
    projects?: string;
    experience?: string;
  };
  stats: {
    streak: number;
    longestStreak: number;
    level: number;
    levelTitle: string;
    levelIcon: string;
    totalXP: number;
    totalDsaSolved: number;
    masteredDsaCount: number;
    learningCount: number;
    weekPunchcard: boolean[];
  };
  dsa: {
    solvedProblemIds: Array<{
      id: string;
      repetition_stage: number;
    }>;
    masteredCount: number;
  };
  recentLearnings: Array<{
    id: number | string;
    title?: string;
    topic?: string;
    category?: string;
    date: string;
    tags?: string;
    duration_minutes: number;
  }>;
  resume: {
    hasPdf: boolean;
    name: string;
    downloadUrl: string;
  } | null;
}

export type PublicPortfolioData = PublicPortfolioResponse;

export interface ResumeVersion {
  id: number;
  label: string;
  region: string;
  text?: string;
  pdf_name?: string;
  has_pdf?: boolean | number;
}

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  type: string;
}

export type ViewMode = 'apps' | 'learnings' | 'profile' | 'dsa';

export interface DsaProblem {
  id: string;
  title: string;
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface DsaCategory {
  id: string;
  name: string;
  iconName: string;
  subtopics: string[];
  problems: DsaProblem[];
}

export interface DsaProblemProgress {
  problem_id: string;
  status: 'solved' | 'attempted' | 'todo';
  notes?: string;
  updated_at?: string;
  repetition_stage?: number; // 0: Day 0, 1: Day 1, 2: Day 4, 3: Day 7, 4: Mastered
  next_review_date?: string | null; // 'YYYY-MM-DD'
  last_reviewed_at?: string | null;
}
