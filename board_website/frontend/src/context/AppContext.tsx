import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Application,
  Learning,
  GamificationStats,
  UserProfile,
  ResumeVersion,
  QuickLink,
  ViewMode,
  ApplicationStage,
  ApplicationCategory,
  LearningCategory,
  LearningTrack,
} from '../types';
import {
  INITIAL_APPLICATIONS,
  INITIAL_LEARNINGS,
  INITIAL_GAMIFICATION,
  INITIAL_PROFILE,
  INITIAL_RESUME_VERSIONS,
  INITIAL_QUICK_LINKS,
  STAGES,
  DEFAULT_TRACKS,
  TRACK_PALETTE,
} from '../utils/constants';
import { api } from '../services/api';
import { getInitialStorageMode, StorageMode } from '../utils/environment';

interface ToastState {
  message: string;
  undoAction?: () => void;
}

interface AppContextType {
  // State
  applications: Application[];
  learnings: Learning[];
  gamification: GamificationStats;
  profile: UserProfile;
  versions: ResumeVersion[];
  quickLinks: QuickLink[];
  viewMode: ViewMode;
  activeAppCategory: ApplicationCategory;
  activeCountry: string;
  activeMobileStage: ApplicationStage | 'Calendar';
  activeLearningCategory: LearningCategory;
  searchQuery: string;
  theme: 'light' | 'dark';
  isAddAppOpen: boolean;
  editingApp: Application | null;
  isAddLearningOpen: boolean;
  editingLearning: Learning | null;
  selectedCalDate: string | null;
  toast: ToastState | null;
  isShutdownOpen: boolean;
  isDriveModalOpen: boolean;
  gdriveStatus: { connected: boolean; folderId: string | null };
  isAuthenticated: boolean;
  currentUser: any;
  isAuthModalOpen: boolean;
  isFollowUpOpen: boolean;
  followUpApp: Application | null;
  isDataLoading: boolean;
  refreshState: () => Promise<void>;
  storageMode: StorageMode;
  pendingStorageMode: StorageMode | null;
  isStorageConfirmModalOpen: boolean;
  requestStorageModeChange: (targetMode: StorageMode) => void;
  confirmStorageModeChange: () => void;
  cancelStorageModeChange: () => void;

  // Setters & Actions
  setViewMode: (mode: ViewMode) => void;
  setActiveAppCategory: (cat: ApplicationCategory) => void;
  setActiveCountry: (country: string) => void;
  setActiveMobileStage: (st: ApplicationStage | 'Calendar') => void;
  setActiveLearningCategory: (cat: LearningCategory) => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  showToast: (message: string, undoAction?: () => void) => void;
  setIsShutdownOpen: (open: boolean) => void;
  setIsDriveModalOpen: (open: boolean) => void;
  setGdriveStatus: React.Dispatch<React.SetStateAction<{ connected: boolean; folderId: string | null }>>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  googleLogin: (profile: { email: string; name?: string; picture?: string; sub?: string }) => Promise<void>;
  setSession: (token: string, user: any) => void;
  forgotPassword: (email: string) => Promise<{ ok: number; message: string }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ ok: number; message: string; token: string; user: any }>;
  logout: () => Promise<void>;

  // Modal Triggers
  openAddAppModal: (prefillDate?: string) => void;
  openEditAppModal: (app: Application) => void;
  closeAppModal: () => void;

  openFollowUpModal: (app: Application) => void;
  closeFollowUpModal: () => void;

  openAddLearningModal: (prefillDate?: string, prefillCategory?: string, prefillDuration?: number) => void;
  openEditLearningModal: (learning: Learning) => void;
  closeLearningModal: () => void;
  learningPrefill: { category?: string; duration?: number } | null;

  // Quick List Drawer Triggers (All applications or all learnings list)
  isQuickListOpen: boolean;
  quickListInitialFilter: string;
  openQuickList: (initialFilter?: string) => void;
  closeQuickList: () => void;
  toggleQuickList: () => void;

  // Application CRUD
  addApplication: (data: Partial<Application>) => Promise<void>;
  updateApplication: (id: number, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  moveApplication: (id: number, stage: ApplicationStage) => Promise<void>;

  // Learning CRUD
  addLearning: (data: Partial<Learning>) => Promise<void>;
  updateLearning: (id: number, data: Partial<Learning>) => Promise<void>;
  deleteLearning: (id: number) => Promise<void>;
  learningTracks: LearningTrack[];
  addLearningTrack: (name: string, customColor?: string) => LearningTrack;
  deleteLearningTrack: (trackId: string) => void;

  // Profile & Links CRUD
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('job_tracker_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Views & filters
  const [viewMode, setViewMode] = useState<ViewMode>('apps');
  const [activeAppCategory, setActiveAppCategory] = useState<ApplicationCategory>('All');
  const [activeCountry, setActiveCountry] = useState<string>('');
  const [activeMobileStage, setActiveMobileStage] = useState<ApplicationStage | 'Calendar'>('Bookmarked');
  const [activeLearningCategory, setActiveLearningCategory] = useState<LearningCategory>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [isAddAppOpen, setIsAddAppOpen] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [isAddLearningOpen, setIsAddLearningOpen] = useState<boolean>(false);
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [learningPrefill, setLearningPrefill] = useState<{ category?: string; duration?: number } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isShutdownOpen, setIsShutdownOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState<boolean>(false);
  const [followUpApp, setFollowUpApp] = useState<Application | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1';
    if (isLoggedOut) return false;
    return Boolean(localStorage.getItem('auth_token') || localStorage.getItem('auth_user'));
  });
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const isLoggedOut = localStorage.getItem('logged_out') === '1';
      if (isLoggedOut) return null;
      const u = localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [gdriveStatus, setGdriveStatus] = useState<{ connected: boolean; folderId: string | null }>(() => {
    const savedFolder = localStorage.getItem('gdrive_folder_id');
    return {
      connected: !!savedFolder,
      folderId: savedFolder || null,
    };
  });
  const [storageMode, setStorageMode] = useState<StorageMode>(() => getInitialStorageMode());
  const [pendingStorageMode, setPendingStorageMode] = useState<StorageMode | null>(null);
  const [isStorageConfirmModalOpen, setIsStorageConfirmModalOpen] = useState<boolean>(false);

  const requestStorageModeChange = (targetMode: StorageMode) => {
    if (targetMode === storageMode) return;
    setPendingStorageMode(targetMode);
    setIsStorageConfirmModalOpen(true);
  };

  const confirmStorageModeChange = () => {
    if (pendingStorageMode) {
      setStorageMode(pendingStorageMode);
      localStorage.setItem('job_tracker_storage_preference', pendingStorageMode);
      showToast(
        pendingStorageMode === 'local_storage'
          ? 'Storage switched to Local Database'
          : 'Storage switched to Google Drive'
      );
    }
    setIsStorageConfirmModalOpen(false);
    setPendingStorageMode(null);
  };

  const cancelStorageModeChange = () => {
    setIsStorageConfirmModalOpen(false);
    setPendingStorageMode(null);
  };
  const [isDataLoading, setIsDataLoading] = useState<boolean>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return false;
    const saved = localStorage.getItem('job_tracker_apps');
    return !saved || saved === '[]';
  });

  // Core Data loaded from localStorage or initialized with defaults (ONLY if authenticated)
  const [applications, setApplications] = useState<Application[]>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return [];
    const saved = localStorage.getItem('job_tracker_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(a => !(a.portal_user === 'varunchandra@gmail.com' && a.recruiter_email === 'sjenkins@google.com'));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [learnings, setLearnings] = useState<Learning[]>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return [];
    const saved = localStorage.getItem('job_tracker_learnings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(l => !(l.title?.includes('Scaled Dot-Product Attention') && l.notes?.includes('Derived attention weights')));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [learningTracks, setLearningTracks] = useState<LearningTrack[]>(() => {
    const saved = localStorage.getItem('job_tracker_learning_tracks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_TRACKS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('job_tracker_learning_tracks', JSON.stringify(learningTracks));
    } catch (e) {
      console.error(e);
    }
  }, [learningTracks]);

  const [gamification, setGamification] = useState<GamificationStats>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return INITIAL_GAMIFICATION;
    const saved = localStorage.getItem('job_tracker_gamify');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.totalXP === 3850 && parsed.streak === 5) {
          return INITIAL_GAMIFICATION;
        }
        return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_GAMIFICATION;
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return INITIAL_PROFILE;
    const saved = localStorage.getItem('job_tracker_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.full_name === 'Varun Chandra' || parsed.email === 'varunchandra@example.com')) {
          return INITIAL_PROFILE;
        }
        return parsed;
      } catch (e) { console.error(e); }
    }
    return INITIAL_PROFILE;
  });

  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return [];
    const saved = localStorage.getItem('job_tracker_quicklinks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(q => !q.url?.includes('varunchandra'));
        }
      } catch (e) { console.error(e); }
    }
    return [];
  });

  // Theme synchronization with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('job_tracker_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync to localStorage ONLY when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('job_tracker_apps', JSON.stringify(applications));
    }
  }, [applications, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('job_tracker_learnings', JSON.stringify(learnings));
    }
  }, [learnings, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('job_tracker_profile', JSON.stringify(profile));
    }
  }, [profile, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('job_tracker_quicklinks', JSON.stringify(quickLinks));
    }
  }, [quickLinks, isAuthenticated]);

  // State synchronizer (syncs data across devices when switching tabs/windows)
  const refreshState = async () => {
    if (!isAuthenticated) return;
    try {
      const [stateRes, learnRes, gamifyRes] = await Promise.allSettled([
        api.getState(),
        api.getLearnings(),
        api.getGamification(),
      ]);
      if (stateRes.status === 'fulfilled' && stateRes.value?.apps) {
        setApplications(stateRes.value.apps);
        if (stateRes.value.profile) setProfile(stateRes.value.profile);
        if (stateRes.value.versions) setVersions(stateRes.value.versions);
      }
      if (learnRes.status === 'fulfilled' && learnRes.value) {
        setLearnings(learnRes.value);
      }
      if (gamifyRes.status === 'fulfilled' && gamifyRes.value) {
        setGamification(gamifyRes.value);
      }
    } catch (err) {
      console.warn('[Auto-sync error]:', err);
    }
  };

  // Cross-device sync listener: when window/tab is focused, sync state silently
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleSync = () => {
      if (document.visibilityState === 'visible') {
        refreshState();
      }
    };
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);
    return () => {
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [isAuthenticated]);

  // Attempt backend initial fetch on mount (ONLY if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const fetchInitialData = async () => {
      if (applications.length === 0) {
        setIsDataLoading(true);
      }
      try {
        const stateData = await api.getState();
        if (mounted && stateData?.apps) {
          setApplications(stateData.apps);
          if (stateData.profile) setProfile(stateData.profile);
          if (stateData.versions) setVersions(stateData.versions);
        }
      } catch (err) {
        // Fallback to local data gracefully
      }

      try {
        const learnData = await api.getLearnings();
        if (mounted && learnData) {
          setLearnings(learnData);
        }
      } catch (err) {
        // Fallback to local data
      }

      try {
        const gamifyData = await api.getGamification();
        if (mounted && gamifyData) {
          setGamification(gamifyData);
        }
      } catch (err) {
        // Fallback to local data
      }

      try {
        const storageData = await api.getStorageStatus();
        if (mounted && storageData) {
          const isConn = !!(storageData.connected || storageData.folderId);
          const fId = storageData.folderId || localStorage.getItem('gdrive_folder_id');
          if (fId) localStorage.setItem('gdrive_folder_id', fId);
          setGdriveStatus({
            connected: isConn,
            folderId: fId,
          });
        }
      } catch (err) {
        // Fallback to local storage if API call fails
      } finally {
        if (mounted) {
          setIsDataLoading(false);
        }
      }
    };

    fetchInitialData();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  // Toast Helper
  const showToast = (message: string, undoAction?: () => void) => {
    setToast({ message, undoAction });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Modal Handlers (Require login to add or edit)
  const openAddAppModal = (prefillDate?: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add a job application');
      setIsAuthModalOpen(true);
      return;
    }
    setEditingApp(null);
    setSelectedCalDate(prefillDate || null);
    setIsAddAppOpen(true);
  };

  const openEditAppModal = (app: Application) => {
    if (!isAuthenticated) {
      showToast('Please sign in to edit applications');
      setIsAuthModalOpen(true);
      return;
    }
    setEditingApp(app);
    setSelectedCalDate(null);
    setIsAddAppOpen(true);
  };

  const closeAppModal = () => {
    setIsAddAppOpen(false);
    setEditingApp(null);
    setSelectedCalDate(null);
  };

  const openFollowUpModal = (app: Application) => {
    if (!isAuthenticated) {
      showToast('Please sign in to view follow-up templates');
      setIsAuthModalOpen(true);
      return;
    }
    setFollowUpApp(app);
    setIsFollowUpOpen(true);
  };

  const closeFollowUpModal = () => {
    setIsFollowUpOpen(false);
    setFollowUpApp(null);
  };

  const openAddLearningModal = (prefillDate?: string, prefillCategory?: string, prefillDuration?: number) => {
    if (!isAuthenticated) {
      showToast('Please sign in to log a learning note');
      setIsAuthModalOpen(true);
      return;
    }
    setEditingLearning(null);
    setSelectedCalDate(prefillDate || null);
    if (prefillCategory || prefillDuration) {
      setLearningPrefill({ category: prefillCategory, duration: prefillDuration });
    } else {
      setLearningPrefill(null);
    }
    setIsAddLearningOpen(true);
  };

  const openEditLearningModal = (learning: Learning) => {
    if (!isAuthenticated) {
      showToast('Please sign in to edit learning notes');
      setIsAuthModalOpen(true);
      return;
    }
    setEditingLearning(learning);
    setSelectedCalDate(null);
    setLearningPrefill(null);
    setIsAddLearningOpen(true);
  };

  const closeLearningModal = () => {
    setIsAddLearningOpen(false);
    setEditingLearning(null);
    setSelectedCalDate(null);
    setLearningPrefill(null);
  };

  // Quick List Drawer
  const [isQuickListOpen, setIsQuickListOpen] = useState<boolean>(false);
  const [quickListInitialFilter, setQuickListInitialFilter] = useState<string>('All');
  const openQuickList = (initialFilter?: string) => {
    setQuickListInitialFilter(initialFilter || 'All');
    setIsQuickListOpen(true);
  };
  const closeQuickList = () => setIsQuickListOpen(false);
  const toggleQuickList = () => setIsQuickListOpen(prev => !prev);

  // Applications CRUD
  const addApplication = async (data: Partial<Application>) => {
    const newApp: Application = {
      id: Date.now(),
      company: data.company || 'New Company',
      role: data.role || 'Software Engineer',
      stage: (data.stage as ApplicationStage) || 'Applied',
      category: data.category || 'Industry',
      country: data.country || 'US',
      city: data.city || '',
      date_applied: data.date_applied || new Date().toISOString().slice(0, 10),
      deadline: data.deadline || '',
      salary: data.salary || '',
      currency: data.currency || 'USD',
      jd: data.jd || '',
      jd_url: data.jd_url || '',
      portal_url: data.portal_url || '',
      portal_user: data.portal_user || '',
      portal_pass: data.portal_pass || '',
      portal_notes: data.portal_notes || '',
      custom_tags: data.custom_tags || '',
      recruiter_name: data.recruiter_name || '',
      recruiter_email: data.recruiter_email || '',
      recruiter_notes: data.recruiter_notes || '',
      resume_path: data.resume_path || '',
      cover_letter_path: data.cover_letter_path || '',
      position: applications.length,
    };

    setApplications(prev => [newApp, ...prev]);
    showToast(`Added application for ${newApp.company}`);

    try {
      const serverApp = await api.createApplication(newApp);
      if (serverApp?.id) {
        setApplications(prev => prev.map(a => (a.id === newApp.id ? serverApp : a)));
      }
    } catch (err) {
      // Local state already updated
    }
  };

  const updateApplication = async (id: number, data: Partial<Application>) => {
    setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
    showToast('Application updated');

    try {
      await api.updateApplication(id, data);
    } catch (err) {
      // Local state already updated
    }
  };

  const deleteApplication = async (id: number) => {
    if (!isAuthenticated) {
      showToast('Please sign in to delete applications');
      setIsAuthModalOpen(true);
      return;
    }
    const target = applications.find(a => a.id === id);
    if (!target) return;

    setApplications(prev => prev.filter(a => a.id !== id));
    showToast(`Removed ${target.company}`, () => {
      // Undo callback
      setApplications(prev => [target, ...prev]);
    });

    try {
      await api.deleteApplication(id);
    } catch (err) {
      // Local state already updated
    }
  };

  const moveApplication = async (id: number, stage: ApplicationStage) => {
    if (!isAuthenticated) {
      showToast('Please sign in to update application stages');
      setIsAuthModalOpen(true);
      return;
    }
    const prevStage = applications.find(a => a.id === id)?.stage;
    setApplications(prev => prev.map(a => (a.id === id ? { ...a, stage } : a)));
    showToast(`Moved to ${stage}`, () => {
      if (prevStage) {
        setApplications(prev => prev.map(a => (a.id === id ? { ...a, stage: prevStage } : a)));
      }
    });

    try {
      await api.moveApplication(id, stage);
    } catch (err) {
      // Local state updated
    }
  };

  // Learnings CRUD
  const addLearning = async (data: Partial<Learning>) => {
    const newLearning: Learning = {
      id: Date.now(),
      title: data.title || 'New Concept',
      topic: data.topic || '',
      category: data.category || 'DSA',
      duration_minutes: Number(data.duration_minutes) || 30,
      date_logged: data.date_logged || new Date().toISOString().slice(0, 10),
      resource_url: data.resource_url || '',
      notes: data.notes || '',
      tags: data.tags || '',
    };

    setLearnings(prev => [newLearning, ...prev]);
    // Increment gamification
    setGamification(prev => ({
      ...prev,
      learningCount: prev.learningCount + 1,
      totalMinutes: prev.totalMinutes + newLearning.duration_minutes,
      totalXP: prev.totalXP + newLearning.duration_minutes * 10,
      todayCompleted: true,
    }));

    showToast(`Logged: ${newLearning.title}`);

    try {
      const serverLearning = await api.createLearning(newLearning);
      if (serverLearning?.id) {
        setLearnings(prev => prev.map(l => (l.id === newLearning.id ? serverLearning : l)));
      }
    } catch (err) {
      // Local state updated
    }
  };

  const updateLearning = async (id: number, data: Partial<Learning>) => {
    setLearnings(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
    showToast('Learning updated');

    try {
      await api.updateLearning(id, data);
    } catch (err) {
      // Local state updated
    }
  };

  const deleteLearning = async (id: number) => {
    if (!isAuthenticated) {
      showToast('Please sign in to delete learning notes');
      setIsAuthModalOpen(true);
      return;
    }
    const target = learnings.find(l => l.id === id);
    if (!target) return;

    setLearnings(prev => prev.filter(l => l.id !== id));
    showToast(`Deleted ${target.title}`, () => {
      setLearnings(prev => [target, ...prev]);
    });

    try {
      await api.deleteLearning(id);
    } catch (err) {
      // Local state updated
    }
  };

  const addLearningTrack = (name: string, customColor?: string): LearningTrack => {
    const trimmed = name.trim();
    if (!trimmed) return learningTracks[0] || DEFAULT_TRACKS[0];
    if (!isAuthenticated) {
      showToast('Please sign in to add learning tracks');
      setIsAuthModalOpen(true);
      return { id: trimmed, name: trimmed, color: customColor || '#6366f1' };
    }

    const existing = learningTracks.find(
      t => t.id.toLowerCase() === trimmed.toLowerCase() || t.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const color = customColor || TRACK_PALETTE[learningTracks.length % TRACK_PALETTE.length];
    const newTrack: LearningTrack = {
      id: trimmed,
      name: trimmed,
      color,
    };

    setLearningTracks(prev => [...prev, newTrack]);
    return newTrack;
  };

  const deleteLearningTrack = (trackId: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to manage learning tracks');
      setIsAuthModalOpen(true);
      return;
    }
    setLearningTracks(prev => prev.filter(t => t.id !== trackId && t.name !== trackId));
    if (activeLearningCategory === trackId) {
      setActiveLearningCategory('All');
    }
    showToast('Track removed');
  };

  // Profile Updates
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!isAuthenticated) {
      showToast('Please sign in to update your profile');
      setIsAuthModalOpen(true);
      return;
    }
    setProfile(prev => ({ ...prev, ...data }));
    showToast('Profile information saved');

    try {
      await api.updateProfile(data);
    } catch (err) {
      // Local state updated
    }
  };

  // Quick Links
  const addQuickLink = (link: Omit<QuickLink, 'id'>) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add quick links');
      setIsAuthModalOpen(true);
      return;
    }
    const newLink: QuickLink = {
      ...link,
      id: String(Date.now()),
    };
    setQuickLinks(prev => [...prev, newLink]);
    showToast(`Added quick link: ${newLink.title}`);
  };

  const removeQuickLink = (id: string) => {
    if (!isAuthenticated) {
      showToast('Please sign in to remove quick links');
      setIsAuthModalOpen(true);
      return;
    }
    setQuickLinks(prev => prev.filter(l => l.id !== id));
    showToast('Quick link removed');
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (email?: string, password?: string) => {
    try {
      const res = await api.login(email, password);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast('Logged in successfully');
      // Sync fresh backend state
      api.getState().then(st => {
        if (st.apps) setApplications(st.apps);
        if (st.profile) setProfile(st.profile);
        if (st.versions) setVersions(st.versions);
      }).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Login failed');
      throw err;
    }
  };

  const googleLogin = async (profile: { email: string; name?: string; picture?: string; sub?: string }) => {
    try {
      const res = await api.googleAuth(profile);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast(`Welcome, ${res.user?.name || res.user?.email || 'User'}! Signed in with Google`);
      // Sync fresh backend state
      api.getState().then(st => {
        if (st.apps) setApplications(st.apps);
        if (st.profile) setProfile(st.profile);
        if (st.versions) setVersions(st.versions);
      }).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const setSession = (token: string, user: any) => {
    if (token) localStorage.setItem('auth_token', token);
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      setCurrentUser(user);
    }
    localStorage.removeItem('logged_out');
    setIsAuthenticated(true);
    closeAuthModal();
    showToast(`Welcome, ${user?.name || user?.email || 'User'}!`);
    api.getState().then(st => {
      if (st.apps) setApplications(st.apps);
      if (st.profile) setProfile(st.profile);
      if (st.versions) setVersions(st.versions);
    }).catch(() => {});
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await api.forgotPassword(email);
      showToast(res.message || 'Verification code sent to your email');
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to send verification code');
      throw err;
    }
  };

  const resetPassword = async (email: string, code: string, newPass: string) => {
    try {
      const res = await api.resetPassword(email, code, newPass);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      setIsAuthenticated(true);
      closeAuthModal();
      showToast('Password reset successfully! Signed in.');
      api.getState().then(st => {
        if (st.apps) setApplications(st.apps);
        if (st.profile) setProfile(st.profile);
        if (st.versions) setVersions(st.versions);
      }).catch(() => {});
      return res;
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      localStorage.setItem('logged_out', '1');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('job_tracker_apps');
      localStorage.removeItem('job_tracker_learnings');
      localStorage.removeItem('job_tracker_profile');
      localStorage.removeItem('job_tracker_quicklinks');
      localStorage.removeItem('job_tracker_gamify');
      localStorage.removeItem('gdrive_folder_id');
      setCurrentUser(null);
      setIsAuthenticated(false);
      setApplications([]);
      setLearnings([]);
      setGamification(INITIAL_GAMIFICATION);
      setProfile(INITIAL_PROFILE);
      setQuickLinks([]);
      setVersions([]);
      showToast('Logged out');
    }
  };

  return (
    <AppContext.Provider
      value={{
        applications,
        learnings,
        gamification,
        profile,
        versions,
        quickLinks,
        viewMode,
        activeAppCategory,
        activeCountry,
        activeMobileStage,
        activeLearningCategory,
        searchQuery,
        theme,
        isAddAppOpen,
        editingApp,
        isAddLearningOpen,
        editingLearning,
        selectedCalDate,
        toast,
        isShutdownOpen,
        isDriveModalOpen,
        gdriveStatus,
        isAuthenticated,
        currentUser,
        isAuthModalOpen,
        setViewMode,
        setActiveAppCategory,
        setActiveCountry,
        setActiveMobileStage,
        setActiveLearningCategory,
        setSearchQuery,
        toggleTheme,
        showToast,
        setIsShutdownOpen,
        setIsDriveModalOpen,
        setGdriveStatus,
        openAuthModal,
        closeAuthModal,
        login,
        googleLogin,
        setSession,
        forgotPassword,
        resetPassword,
        logout,
        openAddAppModal,
        openEditAppModal,
        closeAppModal,
        isFollowUpOpen,
        followUpApp,
        openFollowUpModal,
        closeFollowUpModal,
        isDataLoading,
        refreshState,
        openAddLearningModal,
        openEditLearningModal,
        closeLearningModal,
        learningPrefill,
        isQuickListOpen,
        quickListInitialFilter,
        openQuickList,
        closeQuickList,
        toggleQuickList,
        addApplication,
        updateApplication,
        deleteApplication,
        moveApplication,
        addLearning,
        updateLearning,
        deleteLearning,
        learningTracks,
        addLearningTrack,
        deleteLearningTrack,
        updateProfile,
        addQuickLink,
        removeQuickLink,
        storageMode,
        pendingStorageMode,
        isStorageConfirmModalOpen,
        requestStorageModeChange,
        confirmStorageModeChange,
        cancelStorageModeChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
