import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Application, Learning, GamificationStats, UserProfile, ResumeVersion,
  QuickLink, ViewMode, ApplicationStage, ApplicationCategory, LearningCategory,
  LearningTrack, DsaProblemProgress,
} from '../types';
import { INITIAL_GAMIFICATION, INITIAL_PROFILE } from '../utils/constants';
import { api } from '../services/api';
import { StorageMode } from '../utils/environment';
import { soundEffects } from '../utils/soundEffects';
import { flushMutationQueue, hasPendingMutations } from '../services/offlineSync';
import { generateUniqueStringId } from '../utils/idGenerator';
import { AuthProvider, useAuth, AuthContextType } from './AuthContext';
import { UIProvider, useUI, UIContextType, ToastState, AppPrefill } from './UIContext';
import { ApplicationsProvider, useApplications, ApplicationsContextType, isApplicationBookmarked } from './ApplicationsContext';
import { LearningsProvider, useLearnings, LearningsContextType } from './LearningsContext';

export { useAuth } from './AuthContext';
export { useUI } from './UIContext';
export { useApplications, isApplicationBookmarked } from './ApplicationsContext';
export { useLearnings } from './LearningsContext';
export type { ToastState, AppPrefill };

export interface AppContextType
  extends AuthContextType,
    UIContextType,
    ApplicationsContextType,
    LearningsContextType {
  // Gamification & Level
  gamification: GamificationStats;
  setGamification: React.Dispatch<React.SetStateAction<GamificationStats>>;

  // Profile & Resume Versions
  profile: UserProfile;
  versions: ResumeVersion[];
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

  // Quick Links
  quickLinks: QuickLink[];
  addQuickLink: (link: Omit<QuickLink, 'id'>) => void;
  removeQuickLink: (id: string) => void;

  // Global Sync & Data Loading
  isDataLoading: boolean;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CompositeAppInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const ui = useUI();
  const apps = useApplications();
  const learn = useLearnings();

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
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_GAMIFICATION;
  });

  // Level Up sound effect listener
  const prevLevelRef = useRef<number>(gamification.level || 1);
  useEffect(() => {
    const currentLevel = gamification.level || 1;
    if (prevLevelRef.current && currentLevel > prevLevelRef.current) {
      soundEffects.play('levelUp');
    }
    prevLevelRef.current = currentLevel;
  }, [gamification.level]);

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
      } catch (e) {
        console.error(e);
      }
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
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const [isDataLoading, setIsDataLoading] = useState<boolean>(() => {
    const isLoggedOut = localStorage.getItem('logged_out') === '1' || !localStorage.getItem('auth_token');
    if (isLoggedOut) return false;
    const saved = localStorage.getItem('job_tracker_apps');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      } catch (_) {}
    }
    return true;
  });

  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem('job_tracker_profile', JSON.stringify(profile));
    }
  }, [profile, auth.isAuthenticated]);

  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem('job_tracker_quicklinks', JSON.stringify(quickLinks));
    }
  }, [quickLinks, auth.isAuthenticated]);

  // In-flight sync mutex and debounce refs
  const isSyncingRef = useRef<boolean>(false);
  const syncDebounceTimerRef = useRef<any>(null);

  // Offline mutation queue synchronizer
  const syncOfflineQueue = async () => {
    if (!auth.isAuthenticated || !hasPendingMutations()) return;
    try {
      const result = await flushMutationQueue((tempId, serverId, type) => {
        if (type === 'application') {
          apps.setApplications(prev => prev.map(a => (a.id === tempId ? { ...a, id: serverId } : a)));
        } else if (type === 'learning') {
          learn.setLearnings(prev => prev.map(l => (l.id === tempId ? { ...l, id: serverId } : l)));
        }
      });
      if (result.processed > 0) {
        ui.showToast(`Synced ${result.processed} offline change${result.processed === 1 ? '' : 's'} with server.`);
      }
    } catch (err) {
      console.warn('[OfflineSync] Flush warning:', err);
    }
  };

  // State synchronizer (syncs data across devices when switching tabs/windows)
  const refreshState = async () => {
    if (!auth.isAuthenticated || isSyncingRef.current) return;
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
        apps.setApplications(prev => {
          const serverApps = stateRes.value.apps;
          const serverIds = new Set(serverApps.map(a => a.id));
          // Preserve optimistic in-flight applications (temp IDs >= 1_000_000_000) not yet present in server snapshot
          const inFlight = prev.filter(a => a.id >= 1_000_000_000 && !serverIds.has(a.id));
          return inFlight.length > 0 ? [...inFlight, ...serverApps] : serverApps;
        });
        if (stateRes.value.profile) setProfile(stateRes.value.profile);
        if (stateRes.value.versions) setVersions(stateRes.value.versions);
        if (stateRes.value.settings?.dsa_track_enabled !== undefined) {
          const isEnabled = stateRes.value.settings.dsa_track_enabled === '1';
          learn.toggleDsaTrack(isEnabled);
        }
      }
      if (learnRes.status === 'fulfilled' && learnRes.value) {
        learn.setLearnings(prev => {
          const serverLearnings = learnRes.value;
          const serverIds = new Set(serverLearnings.map(l => l.id));
          const inFlight = prev.filter(l => l.id >= 1_000_000_000 && !serverIds.has(l.id));
          return inFlight.length > 0 ? [...inFlight, ...serverLearnings] : serverLearnings;
        });
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

  // Cross-device and offline sync listener
  const lastFocusSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const executeSync = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        await refreshState();
      } else if (hasPendingMutations()) {
        await syncOfflineQueue();
      }
    };

    const handleSync = (e?: Event) => {
      // Throttle window focus sync: only re-fetch if at least 30s elapsed or offline mutations are pending
      if (e?.type === 'focus') {
        const now = Date.now();
        if (now - lastFocusSyncRef.current < 30_000 && !hasPendingMutations()) {
          return;
        }
        lastFocusSyncRef.current = now;
      }

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
  }, [auth.isAuthenticated]);

  // Attempt backend initial fetch on mount in parallel (ONLY if authenticated)
  useEffect(() => {
    if (!auth.isAuthenticated) {
      setIsDataLoading(false);
      return;
    }
    let mounted = true;

    const fetchInitialData = async () => {
      const statePromise = api.getState().then(stateData => {
        if (mounted && stateData?.apps) {
          sessionStorage.setItem('job_tracker_server_warmed', 'true');
          apps.setApplications(prev => {
            const serverApps = stateData.apps;
            const serverIds = new Set(serverApps.map(a => a.id));
            const inFlight = prev.filter(a => a.id >= 1_000_000_000 && !serverIds.has(a.id));
            return inFlight.length > 0 ? [...inFlight, ...serverApps] : serverApps;
          });
          if (stateData.profile) setProfile(stateData.profile);
          if (stateData.versions) setVersions(stateData.versions);
          if (stateData.settings?.dsa_track_enabled !== undefined) {
            const isEnabled = stateData.settings.dsa_track_enabled === '1';
            learn.toggleDsaTrack(isEnabled);
          }
          // Applications board data arrived - unblock board rendering immediately!
          setIsDataLoading(false);
        }
      }).catch(() => {});

      const learningsPromise = api.getLearnings().then(learnData => {
        if (mounted && learnData) {
          learn.setLearnings(learnData);
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
          learn.setDsaProgress(map);
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
          ui.setGdriveStatus({
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
  }, [auth.isAuthenticated]);

  // Profile Updates
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!auth.isAuthenticated) {
      ui.showToast('Please sign in to update your profile');
      auth.openAuthModal();
      return;
    }
    setProfile(prev => ({ ...prev, ...data }));
    ui.showToast('Profile information saved');

    try {
      await api.updateProfile(data);
    } catch (err) {
      // Local state updated
    }
  };

  // Quick Links
  const addQuickLink = (link: Omit<QuickLink, 'id'>) => {
    if (!auth.isAuthenticated) {
      ui.showToast('Please sign in to add quick links');
      auth.openAuthModal();
      return;
    }
    const newLink: QuickLink = {
      ...link,
      id: generateUniqueStringId('ql'),
    };
    setQuickLinks(prev => [...prev, newLink]);
    ui.showToast(`Added quick link: ${newLink.title}`);
  };

  const removeQuickLink = (id: string) => {
    if (!auth.isAuthenticated) {
      ui.showToast('Please sign in to remove quick links');
      auth.openAuthModal();
      return;
    }
    setQuickLinks(prev => prev.filter(l => l.id !== id));
    ui.showToast('Quick link removed');
  };

  // Composite Context Value
  const compositeValue: AppContextType = {
    ...auth,
    ...ui,
    ...apps,
    ...learn,
    gamification,
    setGamification,
    profile,
    versions,
    updateProfile,
    quickLinks,
    addQuickLink,
    removeQuickLink,
    isDataLoading,
    refreshState,
  };

  return <AppContext.Provider value={compositeValue}>{children}</AppContext.Provider>;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Shared state helpers for cross-context events
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  return (
    <AuthProvider
      showToast={(msg) => setToastMessage(msg)}
      onLoginSuccess={() => {}}
      onLogoutSuccess={() => {}}
    >
      <AuthContextConsumer>
        {auth => (
          <UIProvider isAuthenticated={auth.isAuthenticated} openAuthModal={auth.openAuthModal}>
            <UIContextConsumer>
              {ui => (
                <ApplicationsProvider
                  isAuthenticated={auth.isAuthenticated}
                  openAuthModal={auth.openAuthModal}
                  showToast={ui.showToast}
                >
                  <LearningsProvider
                    isAuthenticated={auth.isAuthenticated}
                    openAuthModal={auth.openAuthModal}
                    showToast={ui.showToast}
                    activeLearningCategory={ui.activeLearningCategory}
                    setActiveLearningCategory={ui.setActiveLearningCategory}
                    viewMode={ui.viewMode}
                    setViewMode={ui.setViewMode}
                  >
                    <CompositeAppInner>
                      {children}
                    </CompositeAppInner>
                  </LearningsProvider>
                </ApplicationsProvider>
              )}
            </UIContextConsumer>
          </UIProvider>
        )}
      </AuthContextConsumer>
    </AuthProvider>
  );
};

const AuthContextConsumer: React.FC<{ children: (auth: AuthContextType) => React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <>{children(auth)}</>;
};

const UIContextConsumer: React.FC<{ children: (ui: UIContextType) => React.ReactNode }> = ({ children }) => {
  const ui = useUI();
  return <>{children(ui)}</>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
