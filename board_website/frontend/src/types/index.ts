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
  todayNeedsStudy?: boolean;
  todayNeedsApp?: boolean;
  todayMinutes?: number;
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
}

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
}
