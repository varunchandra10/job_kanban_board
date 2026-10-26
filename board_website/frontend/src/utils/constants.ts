import { Application, Learning, GamificationStats, UserProfile, ResumeVersion, QuickLink, ApplicationStage } from '../types';

export const STAGES: ApplicationStage[] = ['Bookmarked', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

export const STAGE_CONFIG: Record<ApplicationStage, { label: string; color: string; bg: string; border: string }> = {
  Bookmarked: { label: 'Bookmarked', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  Applied: { label: 'Applied', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  Interviewing: { label: 'Interviewing', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  Offer: { label: 'Offer', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  Rejected: { label: 'Rejected', color: '#dc2626', bg: '#fff7ed', border: '#ffedd5' },
};

export const COUNTRIES = `US|United States,GB|United Kingdom,SG|Singapore,DE|Germany,IN|India,CA|Canada,AU|Australia,NL|Netherlands,CH|Switzerland,SE|Sweden,FR|France,IE|Ireland,JP|Japan,KR|South Korea,CN|China,HK|Hong Kong,AE|United Arab Emirates,ES|Spain,IT|Italy,PL|Poland,NO|Norway,DK|Denmark,FI|Finland,BE|Belgium,AT|Austria,PT|Portugal,IL|Israel,BR|Brazil,MX|Mexico,NZ|New Zealand,ZA|South Africa,TW|Taiwan,MY|Malaysia,ID|Indonesia,TH|Thailand,VN|Vietnam,PH|Philippines,SA|Saudi Arabia,TR|Turkey,AR|Argentina,CL|Chile,CZ|Czechia`
  .split(',')
  .map(x => {
    const [code, name] = x.split('|');
    return { code, name };
  });

export const DEFAULT_TRACKS = [
  { id: 'GENERAL APTITUDE', name: 'General Aptitude', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
];

export const TRACK_PALETTE = [
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#ef4444', // Red
];

export const LEARNING_TRACKS = DEFAULT_TRACKS;

export const APTITUDE_TOPICS: Record<string, string[]> = {
  English: [
    'Reading Comprehension',
    'Sentence Correction & Grammar',
    'Vocabulary, Synonyms & Antonyms',
    'Para Jumbles & Sentence Rearrangement',
    'Spotting Errors',
    'Idioms & Phrases',
    'Fill in the Blanks / Cloze Test',
    'One Word Substitution',
    'Active & Passive Voice',
    'Direct & Indirect Speech',
  ],
  Quants: [
    'Percentages, Profit & Loss',
    'Time, Speed & Distance',
    'Time & Work, Pipes & Cisterns',
    'Permutations, Combinations & Probability',
    'Ratio, Proportion & Averages',
    'Number Systems & Divisibility',
    'Simple & Compound Interest',
    'Algebra & Quadratic Equations',
    'Geometry & Mensuration',
    'Data Interpretation (Charts & Tables)',
    'Mixtures & Alligations',
  ],
  Reasoning: [
    'Blood Relations & Family Tree',
    'Direction Sense Test',
    'Syllogisms & Venn Diagrams',
    'Coding-Decoding & Analogy',
    'Number & Letter Series',
    'Seating Arrangement (Linear & Circular)',
    'Puzzles & Order / Ranking',
    'Clocks & Calendars',
    'Statement & Assumptions / Arguments',
    'Input-Output & Machine Reasoning',
    'Dice, Cubes & Paper Folding',
  ],
};

export const PRESET_DURATIONS = [15, 25, 45, 60, 90, 120];

export const INITIAL_PROFILE: UserProfile = {
  full_name: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  school: '',
  degree: '',
  grad_date: '',
  gpa: '',
  skills: '',
  projects: '',
  experience: '',
  gdrive_folder_id: '',
};

export const INITIAL_RESUME_VERSIONS: ResumeVersion[] = [];

export const INITIAL_QUICK_LINKS: QuickLink[] = [];

export const INITIAL_GAMIFICATION: GamificationStats = {
  streak: 0,
  longestStreak: 0,
  learningCount: 0,
  totalMinutes: 0,
  totalXP: 0,
  level: 1,
  levelTitle: 'Novice Explorer',
  todayCompleted: false,
  todayFrozen: false,
  isFrozen: false,
  weekPunchcard: [
    { date: '', day: 'Mon', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Tue', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Wed', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Thu', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Fri', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Sat', active: false, frozen: false, appOnly: false, isToday: false },
    { date: '', day: 'Sun', active: false, frozen: false, appOnly: false, isToday: false },
  ],
};

export const INITIAL_LEARNINGS: Learning[] = [];

export const INITIAL_APPLICATIONS: Application[] = [];
