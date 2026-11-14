import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  DsaProblemProgress,
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
import {
  enqueueMutation,
  flushMutationQueue,
  hasPendingMutations,
  resolveId,
  recordIdMapping,
} from '../services/offlineSync';

interface ToastState {
  message: string;
  undoAction?: () => void;
}

export interface AppPrefill {
  company?: string;
  role?: string;
  city?: string;
  country?: string;
  salary?: string;
  currency?: string;
  jd_url?: string;
  portal_notes?: string;
  custom_tags?: string;
  stage?: ApplicationStage;
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
  appPrefill: AppPrefill | null;
  setAppPrefill: (prefill: AppPrefill | null) => void;
  isAddLearningOpen: boolean;
  editingLearning: Learning | null;
  selectedCalDate: string | null;
  toast: ToastState | null;
  isShutdownOpen: boolean;
  isDriveModalOpen: boolean;
  isClipperModalOpen: boolean;
  setIsClipperModalOpen: (open: boolean) => void;
  gdriveStatus: { connected: boolean; folderId: string | null };
  isAuthenticated: boolean;
  currentUser: any;
  isAuthModalOpen: boolean;
  isFollowUpOpen: boolean;
  followUpApp: Application | null;
  isDataLoading: boolean;
  refreshState: () => Promise<void>;
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
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
  driveModalTab: 'local_storage' | 'g_drive' | 'sync';
  setDriveModalTab: (tab: 'local_storage' | 'g_drive' | 'sync') => void;
  openDriveModal: (tab?: 'local_storage' | 'g_drive' | 'sync') => void;
  setGdriveStatus: React.Dispatch<React.SetStateAction<{ connected: boolean; folderId: string | null }>>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (email?: string, password?: string) => Promise<void>;
  googleLogin: (payload: { credential?: string; accessToken?: string; profile?: { email: string; name?: string; picture?: string; sub?: string } }) => Promise<void>;
  setSession: (token: string, user: any) => void;
  forgotPassword: (email: string) => Promise<{ ok: number; message: string }>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<{ ok: number; message: string; token: string; user: any }>;
  logout: () => Promise<void>;

  // Modal Triggers
  openAddAppModal: (prefillDate?: string, prefillData?: AppPrefill) => void;
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
  appToDelete: Application | null;
  isDeleteAppModalOpen: boolean;
  isDeletingApp: boolean;
  confirmDeleteApplication: () => Promise<void>;
  cancelDeleteApplication: () => void;
  moveApplication: (id: number, stage: ApplicationStage) => Promise<void>;
  toggleBookmark: (id: number, forceState?: boolean) => Promise<void>;

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

  // DSA Practice Track
  isDsaEnabled: boolean;
  toggleDsaTrack: (enabled: boolean) => Promise<void>;
  dsaProgress: Record<string, DsaProblemProgress>;
  toggleDsaProblem: (problemId: string) => Promise<void>;
  updateDsaNotes: (problemId: string, notes: string) => Promise<void>;
  advanceDsaReview: (problemId: string, action?: 'advance' | 'reset') => Promise<void>;
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
  const [appPrefill, setAppPrefill] = useState<AppPrefill | null>(null);
  const [isAddLearningOpen, setIsAddLearningOpen] = useState<boolean>(false);
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [learningPrefill, setLearningPrefill] = useState<{ category?: string; duration?: number } | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isShutdownOpen, setIsShutdownOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isClipperModalOpen, setIsClipperModalOpen] = useState<boolean>(false);
  const [driveModalTab, setDriveModalTab] = useState<'local_storage' | 'g_drive' | 'sync'>('local_storage');

  const openDriveModal = (tab?: 'local_storage' | 'g_drive' | 'sync') => {
    if (tab) setDriveModalTab(tab);
    setIsDriveModalOpen(true);
  };
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
  // DSA Practice Track State
  const [isDsaEnabled, setIsDsaEnabled] = useState<boolean>(() => {
    return localStorage.getItem('job_tracker_dsa_enabled') === '1';
  });
  const [dsaProgress, setDsaProgress] = useState<Record<string, DsaProblemProgress>>(() => {
    try {
      const saved = localStorage.getItem('job_tracker_dsa_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
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
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeleteAppModalOpen, setIsDeleteAppModalOpen] = useState<boolean>(false);
  const [isDeletingApp, setIsDeletingApp] = useState<boolean>(false);

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
    return !isLoggedOut;
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

  // In-flight sync mutex and debounce refs
  const isSyncingRef = useRef<boolean>(false);
  const syncDebounceTimerRef = useRef<any>(null);

  // Offline mutation queue synchronizer
  const syncOfflineQueue = async () => {
    if (!isAuthenticated || !hasPendingMutations()) return;
    try {
      const result = await flushMutationQueue((tempId, serverId, type) => {
        if (type === 'application') {
          setApplications(prev => prev.map(a => (a.id === tempId ? { ...a, id: serverId } : a)));
        } else if (type === 'learning') {
          setLearnings(prev => prev.map(l => (l.id === tempId ? { ...l, id: serverId } : l)));
        }
      });
      if (result.processed > 0) {
        showToast(`Synced ${result.processed} offline change${result.processed === 1 ? '' : 's'} with server.`);
      }
    } catch (err) {
      console.warn('[OfflineSync] Flush warning:', err);
    }
  };

  // State synchronizer (syncs data across devices when switching tabs/windows)
  // Protected with isSyncingRef mutex against concurrent/overlapping executions
  const refreshState = async () => {
    if (!isAuthenticated || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      if (hasPendingMutations()) {
        await syncOfflineQueue();
      }
      const [stateRes, learnRes, gamifyRes] = await Promise.allSettled([
        api.getState(),
        api.getLearnings(),
        api.getGamification(),
      ]);
      if (stateRes.status === 'fulfilled' && stateRes.value?.apps) {
        sessionStorage.setItem('job_tracker_server_warmed', 'true');
        setApplications(stateRes.value.apps);
        if (stateRes.value.profile) setProfile(stateRes.value.profile);
        if (stateRes.value.versions) setVersions(stateRes.value.versions);
        if (stateRes.value.settings?.dsa_track_enabled !== undefined) {
          const isEnabled = stateRes.value.settings.dsa_track_enabled === '1';
          setIsDsaEnabled(isEnabled);
          localStorage.setItem('job_tracker_dsa_enabled', isEnabled ? '1' : '0');
        }
      }
      if (learnRes.status === 'fulfilled' && learnRes.value) {
        setLearnings(learnRes.value);
      }
      if (gamifyRes.status === 'fulfilled' && gamifyRes.value) {
        setGamification(gamifyRes.value);
      }
    } catch (err) {
      console.warn('[Auto-sync error]:', err);
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Cross-device and offline sync listener: when window/tab is focused or network recovers,
  // debounced with 400ms delay to merge simultaneous focus and visibilitychange events.
  useEffect(() => {
    if (!isAuthenticated) return;

    const executeSync = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        await refreshState();
      } else if (hasPendingMutations()) {
        await syncOfflineQueue();
      }
    };

    const handleSync = () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      syncDebounceTimerRef.current = setTimeout(() => {
        executeSync();
      }, 400);
    };

    window.addEventListener('online', handleSync);
    document.addEventListener('visibilitychange', handleSync);
    window.addEventListener('focus', handleSync);

    // Initial check on mount
    if (typeof navigator !== 'undefined' && navigator.onLine && hasPendingMutations()) {
      handleSync();
    }

    return () => {
      if (syncDebounceTimerRef.current) {
        clearTimeout(syncDebounceTimerRef.current);
      }
      window.removeEventListener('online', handleSync);
      document.removeEventListener('visibilitychange', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [isAuthenticated]);

  // Attempt backend initial fetch on mount in parallel (ONLY if authenticated)
  useEffect(() => {
    if (!isAuthenticated) {
      setIsDataLoading(false);
      return;
    }
    let mounted = true;

    const fetchInitialData = async () => {
      // Fire all independent initial requests in parallel to avoid serial network waterfall
      const statePromise = api.getState().then(stateData => {
        if (mounted && stateData?.apps) {
          sessionStorage.setItem('job_tracker_server_warmed', 'true');
          setApplications(stateData.apps);
          localStorage.setItem('job_tracker_apps', JSON.stringify(stateData.apps));
          if (stateData.profile) setProfile(stateData.profile);
          if (stateData.versions) setVersions(stateData.versions);
          if (stateData.settings?.dsa_track_enabled !== undefined) {
            const isEnabled = stateData.settings.dsa_track_enabled === '1';
            setIsDsaEnabled(isEnabled);
            localStorage.setItem('job_tracker_dsa_enabled', isEnabled ? '1' : '0');
          }
        }
      }).catch(() => {});

      const learningsPromise = api.getLearnings().then(learnData => {
        if (mounted && learnData) {
          setLearnings(learnData);
          localStorage.setItem('job_tracker_learnings', JSON.stringify(learnData));
        }
      }).catch(() => {});

      const dsaPromise = api.getDsaProgress().then(dsaProg => {
        if (mounted && Array.isArray(dsaProg)) {
          const map: Record<string, DsaProblemProgress> = {};
          dsaProg.forEach(item => {
            map[item.problem_id] = {
              problem_id: item.problem_id,
              status: item.status,
              notes: item.notes,
              repetition_stage: item.repetition_stage ?? 0,
              next_review_date: item.next_review_date ?? null,
              last_reviewed_at: item.last_reviewed_at ?? null,
              updated_at: item.updated_at
            };
          });
          setDsaProgress(map);
          localStorage.setItem('job_tracker_dsa_progress', JSON.stringify(map));
        }
      }).catch(() => {});

      const gamifyPromise = api.getGamification().then(gamifyData => {
        if (mounted && gamifyData) {
          setGamification(gamifyData);
        }
      }).catch(() => {});

      const storagePromise = api.getStorageStatus().then(storageData => {
        if (mounted && storageData) {
          const isConn = !!(storageData.connected || storageData.folderId);
          const fId = storageData.folderId || localStorage.getItem('gdrive_folder_id');
          if (fId) localStorage.setItem('gdrive_folder_id', fId);
          setGdriveStatus({
            connected: isConn,
            folderId: fId,
          });
        }
      }).catch(() => {});

      try {
        await Promise.allSettled([
          statePromise,
          learningsPromise,
          dsaPromise,
          gamifyPromise,
          storagePromise,
        ]);
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

  // Check for quickClip query params from 1-Click Clipper bookmarklet
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('quickClip') === '1') {
        const prefill: AppPrefill = {
          company: params.get('company') || '',
          role: params.get('role') || '',
          city: params.get('location') || '',
          salary: params.get('salary') || '',
          jd_url: params.get('url') || '',
          portal_notes: params.get('notes') ? `Highlights:\n${params.get('notes')}` : 'Clipped via 1-Click Job Clipper',
          custom_tags: 'Clipped',
          stage: 'Applied'
        };
        setAppPrefill(prefill);
        setEditingApp(null);
        setIsAddAppOpen(true);
        // Clean URL parameters without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (_) {}
  }, []);

  // Modal Handlers (Require login to add or edit)
  const openAddAppModal = (prefillDate?: string, prefillData?: AppPrefill) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add a job application');
      setIsAuthModalOpen(true);
      return;
    }
    setEditingApp(null);
    setAppPrefill(prefillData || null);
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
    setAppPrefill(null);
    setSelectedCalDate(null);
    setIsAddAppOpen(true);
  };

  const closeAppModal = () => {
    setIsAddAppOpen(false);
    setEditingApp(null);
    setAppPrefill(null);
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
      position: 0,
    };

    setApplications(prev => [
      newApp,
      ...prev.map(a => (a.stage === newApp.stage ? { ...a, position: (a.position ?? 0) + 1 } : a))
    ]);
    showToast(`Added application for ${newApp.company}`);

    // Update gamification stats immediately for streak & safeguards
    setGamification(prev => {
      const newAppCount = (prev.todayAppCount || 0) + 1;
      const newHasApp = true;
      const hasStudy = !!prev.todayHasStudy || (prev.todayStudyCount || 0) > 0 || (prev.todayDsaCount || 0) > 0 || (prev.todayMinutes || 0) >= 45;
      const wasCompleted = !!prev.todayCompleted;
      const isNowCompleted = newHasApp && hasStudy;
      const streakDelta = (!wasCompleted && isNowCompleted) ? 1 : 0;
      const newStreak = (prev.streak || 0) + streakDelta;
      const newLongest = Math.max(prev.longestStreak || 0, newStreak);
      const updated: GamificationStats = {
        ...prev,
        todayAppCount: newAppCount,
        todayHasApp: newHasApp,
        todayNeedsApp: false,
        todayCompleted: isNowCompleted,
        todayNeedsStudy: !hasStudy,
        streak: newStreak,
        currentStreak: newStreak,
        longestStreak: newLongest,
      };
      localStorage.setItem('job_tracker_gamify', JSON.stringify(updated));
      return updated;
    });

    try {
      const serverApp = await api.createApplication(newApp);
      if (serverApp?.id) {
        recordIdMapping(newApp.id, serverApp.id);
        setApplications(prev => prev.map(a => (a.id === newApp.id ? serverApp : a)));
      }
    } catch (err) {
      enqueueMutation('create_application', newApp, newApp.id);
      showToast(`Saved offline (${newApp.company}). Will sync when connected.`);
    }
  };

  const updateApplication = async (id: number, data: Partial<Application>) => {
    setApplications(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)));
    showToast('Application updated');

    try {
      const effectiveId = resolveId(id);
      await api.updateApplication(effectiveId, data);
    } catch (err) {
      enqueueMutation('update_application', data, undefined, id);
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

    // Pop confirmation modal asking if user is sure, warning that files will be deleted from Google Drive
    setAppToDelete(target);
    setIsDeleteAppModalOpen(true);
  };

  const confirmDeleteApplication = async () => {
    if (!appToDelete) return;
    const target = appToDelete;
    setIsDeletingApp(true);
    try {
      setApplications(prev => prev.filter(a => a.id !== target.id));
      const effectiveId = resolveId(target.id);
      await api.deleteApplication(effectiveId);
      showToast(`Deleted ${target.company} and removed files from Google Drive.`);
      setIsDeleteAppModalOpen(false);
      setAppToDelete(null);
    } catch (err: any) {
      showToast('Error deleting application: ' + (err.message || 'Unknown error'));
      enqueueMutation('delete_application', {}, undefined, target.id);
      setIsDeleteAppModalOpen(false);
      setAppToDelete(null);
    } finally {
      setIsDeletingApp(false);
    }
  };

  const cancelDeleteApplication = () => {
    setIsDeleteAppModalOpen(false);
    setAppToDelete(null);
    setIsDeletingApp(false);
  };

  const toggleBookmark = async (id: number, forceState?: boolean) => {
    const targetApp = applications.find(a => a.id === id);
    if (!targetApp) return;

    const currentBookmarked = Boolean(
      targetApp.is_bookmarked ||
      (targetApp.custom_tags && targetApp.custom_tags.split(',').map(t => t.trim().toLowerCase()).includes('bookmarked')) ||
      targetApp.stage === 'Bookmarked'
    );

    const newBookmarked = forceState !== undefined ? forceState : !currentBookmarked;
    if (newBookmarked === currentBookmarked) return;

    const existingTags = (targetApp.custom_tags || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t && t.toLowerCase() !== 'bookmarked');

    if (newBookmarked) {
      existingTags.push('bookmarked');
    }

    const updatedTags = existingTags.join(', ');

    // If an app's stage was originally 'Bookmarked', and user unbookmarks, let it be in 'Applied'
    const newStage = targetApp.stage === 'Bookmarked' && !newBookmarked ? 'Applied' : targetApp.stage;

    setApplications(prev =>
      prev.map(app =>
        app.id === id
          ? { ...app, is_bookmarked: newBookmarked ? 1 : 0, custom_tags: updatedTags, stage: newStage }
          : app
      )
    );

    showToast(
      newBookmarked
        ? `⭐ Bookmarked ${targetApp.company} for quick access`
        : `Removed ${targetApp.company} from bookmarks`
    );

    try {
      const effectiveId = resolveId(id);
      await api.updateApplication(effectiveId, {
        custom_tags: updatedTags,
        is_bookmarked: newBookmarked ? 1 : 0,
        ...(targetApp.stage === 'Bookmarked' && !newBookmarked ? { stage: 'Applied' } : {}),
      });
    } catch (err) {
      enqueueMutation('update_application', {
        custom_tags: updatedTags,
        is_bookmarked: newBookmarked ? 1 : 0
      }, undefined, id);
    }
  };

  const moveApplication = async (id: number, stage: ApplicationStage) => {
    if (!isAuthenticated) {
      showToast('Please sign in to update application stages');
      setIsAuthModalOpen(true);
      return;
    }

    // If dropping on 'Bookmarked', bookmark for quick access WITHOUT removing from its current workflow column!
    if (stage === 'Bookmarked') {
      await toggleBookmark(id, true);
      return;
    }

    const prevApps = [...applications];
    setApplications(prev => {
      const target = prev.find(a => a.id === id);
      if (!target) return prev;
      const updated = { ...target, stage, position: 0 };
      const others = prev
        .filter(a => a.id !== id)
        .map(a => (a.stage === stage ? { ...a, position: (a.position ?? 0) + 1 } : a));
      return [updated, ...others];
    });
    showToast(`Moved to ${stage}`, () => {
      setApplications(prevApps);
    });

    try {
      const effectiveId = resolveId(id);
      await api.moveApplication(effectiveId, stage);
    } catch (err) {
      enqueueMutation('move_application', { stage }, undefined, id);
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
    // Increment gamification & check dual streak requirements (1+ job app AND 1+ study/DSA)
    setGamification(prev => {
      const newStudyCount = (prev.todayStudyCount || 0) + 1;
      const newHasStudy = true;
      const hasApp = !!prev.todayHasApp || (prev.todayAppCount || 0) > 0;
      const wasCompleted = !!prev.todayCompleted;
      const isNowCompleted = hasApp && newHasStudy;
      const streakDelta = (!wasCompleted && isNowCompleted) ? 1 : 0;
      const newStreak = (prev.streak || 0) + streakDelta;
      const newLongest = Math.max(prev.longestStreak || 0, newStreak);
      const updated: GamificationStats = {
        ...prev,
        learningCount: prev.learningCount + 1,
        totalMinutes: prev.totalMinutes + newLearning.duration_minutes,
        totalXP: prev.totalXP + newLearning.duration_minutes * 10,
        todayStudyCount: newStudyCount,
        todayHasStudy: newHasStudy,
        todayNeedsStudy: false,
        todayCompleted: isNowCompleted,
        todayNeedsApp: !hasApp,
        streak: newStreak,
        currentStreak: newStreak,
        longestStreak: newLongest,
      };
      localStorage.setItem('job_tracker_gamify', JSON.stringify(updated));
      return updated;
    });

    showToast(`Logged: ${newLearning.title}`);

    try {
      const serverLearning = await api.createLearning(newLearning);
      if (serverLearning?.id) {
        recordIdMapping(newLearning.id, serverLearning.id);
        setLearnings(prev => prev.map(l => (l.id === newLearning.id ? serverLearning : l)));
      }
    } catch (err) {
      enqueueMutation('create_learning', newLearning, newLearning.id);
      showToast(`Saved offline (${newLearning.title}). Will sync when connected.`);
    }
  };

  const updateLearning = async (id: number, data: Partial<Learning>) => {
    setLearnings(prev => prev.map(l => (l.id === id ? { ...l, ...data } : l)));
    showToast('Learning updated');

    try {
      const effectiveId = resolveId(id);
      await api.updateLearning(effectiveId, data);
    } catch (err) {
      enqueueMutation('update_learning', data, undefined, id);
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
      const effectiveId = resolveId(id);
      await api.deleteLearning(effectiveId);
    } catch (err) {
      enqueueMutation('delete_learning', {}, undefined, id);
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

  // DSA Practice Track Actions
  const toggleDsaTrack = async (enabled: boolean) => {
    setIsDsaEnabled(enabled);
    localStorage.setItem('job_tracker_dsa_enabled', enabled ? '1' : '0');
    if (!enabled && viewMode === 'dsa') {
      setViewMode('apps');
    }
    showToast(enabled ? 'DSA Practice Path enabled' : 'DSA Practice Path disabled');
    if (isAuthenticated) {
      try {
        await api.updateSetting('dsa_track_enabled', enabled ? '1' : '0');
      } catch (err) {
        console.warn('Failed saving DSA setting:', err);
      }
    }
  };

  const toggleDsaProblem = async (problemId: string) => {
    const current = dsaProgress[problemId];
    const nextStatus: 'solved' | 'todo' = current?.status === 'solved' ? 'todo' : 'solved';
    const notes = current?.notes || '';
    const isSolving = nextStatus === 'solved';

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const nextStage = isSolving ? (current?.repetition_stage ?? 0) : 0;
    const nextReview = isSolving ? (current?.next_review_date || tomorrowStr) : null;

    setDsaProgress(prev => {
      const updated: Record<string, DsaProblemProgress> = {
        ...prev,
        [problemId]: {
          ...prev[problemId],
          problem_id: problemId,
          status: nextStatus,
          notes,
          repetition_stage: nextStage,
          next_review_date: nextReview,
          updated_at: new Date().toISOString()
        }
      };
      localStorage.setItem('job_tracker_dsa_progress', JSON.stringify(updated));
      return updated;
    });

    // DSA counts under learnings & directly affects streak & XP immediately
    setGamification(prev => {
      const deltaSolved = isSolving ? 1 : -1;
      const newDsaSolved = Math.max(0, (prev.totalDsaSolved || 0) + deltaSolved);
      const newTodayDsa = Math.max(0, (prev.todayDsaCount || 0) + deltaSolved);
      const newLearningCount = Math.max(0, (prev.learningCount || 0) + deltaSolved);
      const newXP = Math.max(0, (prev.totalXP || 0) + (isSolving ? 25 : -25));

      const wasCompletedToday = !!prev.todayCompleted;
      const hasStudy = newTodayDsa > 0 || (prev.todayStudyCount || 0) > 0 || (prev.todayMinutes || 0) >= 45;
      const hasApp = !!prev.todayHasApp || (prev.todayAppCount || 0) > 0;
      const isNowCompleted = hasStudy && hasApp;
      const streakDelta = (!wasCompletedToday && isNowCompleted) ? 1 : (wasCompletedToday && !isNowCompleted) ? -1 : 0;
      const newStreak = Math.max(0, (prev.streak || 0) + streakDelta);
      const newLongest = Math.max(prev.longestStreak || 0, newStreak);

      const updated: GamificationStats = {
        ...prev,
        totalDsaSolved: newDsaSolved,
        todayDsaCount: newTodayDsa,
        learningCount: newLearningCount,
        totalXP: newXP,
        todayHasStudy: hasStudy,
        todayNeedsStudy: !hasStudy,
        todayCompleted: isNowCompleted,
        todayNeedsApp: !hasApp,
        streak: newStreak,
        currentStreak: newStreak,
        longestStreak: newLongest,
      };
      localStorage.setItem('job_tracker_gamify', JSON.stringify(updated));
      return updated;
    });

    if (isSolving) {
      try {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 40,
            spread: 55,
            origin: { y: 0.8 }
          });
        });
      } catch (_) {}
      showToast('Problem marked as Solved! Streak & XP updated! 🎉');
    }

    if (isAuthenticated) {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const res = await api.saveDsaProgress(problemId, nextStatus, notes, tz);
        if (res && res.gamification) {
          setGamification(res.gamification);
          localStorage.setItem('job_tracker_gamify', JSON.stringify(res.gamification));
        }
      } catch (err) {
        console.warn('Failed saving DSA progress:', err);
      }
    }
  };

  const updateDsaNotes = async (problemId: string, notes: string) => {
    const current = dsaProgress[problemId];
    const status = current?.status || 'todo';
    setDsaProgress(prev => {
      const updated: Record<string, DsaProblemProgress> = {
        ...prev,
        [problemId]: {
          ...prev[problemId],
          problem_id: problemId,
          status,
          notes,
          updated_at: new Date().toISOString()
        }
      };
      localStorage.setItem('job_tracker_dsa_progress', JSON.stringify(updated));
      return updated;
    });

    if (isAuthenticated) {
      try {
        await api.saveDsaProgress(problemId, status, notes);
      } catch (err) {
        console.warn('Failed saving DSA notes:', err);
      }
    }
  };

  const advanceDsaReview = async (problemId: string, action: 'advance' | 'reset' = 'advance') => {
    const current = dsaProgress[problemId];
    if (!current || current.status !== 'solved') return;

    const currentStage = Number(current.repetition_stage || 0);
    let nextStage = currentStage;
    let nextReviewDate: string | null = null;

    const shift = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    };

    if (action === 'reset') {
      nextStage = 0;
      nextReviewDate = shift(1);
    } else {
      if (currentStage === 0) {
        nextStage = 1;
        nextReviewDate = shift(3);
      } else if (currentStage === 1) {
        nextStage = 2;
        nextReviewDate = shift(3);
      } else {
        nextStage = 4;
        nextReviewDate = null;
      }
    }

    const updatedProg: DsaProblemProgress = {
      ...current,
      problem_id: problemId,
      repetition_stage: nextStage,
      next_review_date: nextReviewDate,
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDsaProgress(prev => {
      const updated = { ...prev, [problemId]: updatedProg };
      localStorage.setItem('job_tracker_dsa_progress', JSON.stringify(updated));
      return updated;
    });

    if (action === 'advance') {
      // Award +15 XP optimistically
      setGamification(prev => {
        const nextXP = (prev.totalXP || 0) + 15;
        const nextStages = (prev.totalRepetitionStagesAdvanced || 0) + 1;
        const nextRepXP = (prev.spacedRepetitionXP || 0) + 15;
        const updated = {
          ...prev,
          totalXP: nextXP,
          totalRepetitionStagesAdvanced: nextStages,
          spacedRepetitionXP: nextRepXP
        };
        localStorage.setItem('job_tracker_gamify', JSON.stringify(updated));
        return updated;
      });

      try {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        });
      } catch (_) {}

      if (nextStage === 4) {
        showToast('🏆 Permanently Mastered! +15 XP awarded! Outstanding retention!');
      } else {
        showToast(`+15 XP! Advanced to Stage ${nextStage} (Next review: ${nextReviewDate}) 🎉`);
      }
    } else {
      showToast('Review reset to Day 1. Review scheduled for tomorrow.');
    }

    if (isAuthenticated) {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const res = await api.reviewDsaProblem(problemId, action, tz);
        if (res && res.gamification) {
          setGamification(res.gamification);
          localStorage.setItem('job_tracker_gamify', JSON.stringify(res.gamification));
        }
      } catch (err) {
        console.warn('Failed advancing DSA review on server:', err);
      }
    }
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
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
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

  const googleLogin = async (payload: { credential?: string; accessToken?: string; profile?: { email: string; name?: string; picture?: string; sub?: string } }) => {
    try {
      const res = await api.googleAuth(payload);
      if (res && res.token) {
        localStorage.setItem('auth_token', res.token);
      }
      if (res && res.user) {
        localStorage.setItem('auth_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
      localStorage.removeItem('logged_out');
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
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
      sessionStorage.setItem('job_tracker_server_warmed', 'true');
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
        appPrefill,
        setAppPrefill,
        isAddLearningOpen,
        editingLearning,
        selectedCalDate,
        toast,
        isShutdownOpen,
        isDriveModalOpen,
        isClipperModalOpen,
        setIsClipperModalOpen,
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
        driveModalTab,
        setDriveModalTab,
        openDriveModal,
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
        appToDelete,
        isDeleteAppModalOpen,
        isDeletingApp,
        confirmDeleteApplication,
        cancelDeleteApplication,
        moveApplication,
        toggleBookmark,
        addLearning,
        updateLearning,
        deleteLearning,
        learningTracks,
        addLearningTrack,
        deleteLearningTrack,
        updateProfile,
        addQuickLink,
        removeQuickLink,
        isDsaEnabled,
        toggleDsaTrack,
        dsaProgress,
        toggleDsaProblem,
        updateDsaNotes,
        advanceDsaReview,
        storageMode,
        setStorageMode,
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

export const isApplicationBookmarked = (app: Application): boolean => {
  return Boolean(
    app.is_bookmarked ||
    (app.custom_tags && app.custom_tags.split(',').map(t => t.trim().toLowerCase()).includes('bookmarked')) ||
    app.stage === 'Bookmarked'
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
