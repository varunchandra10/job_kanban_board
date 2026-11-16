import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ViewMode,
  Application,
  Learning,
  ApplicationStage,
  ApplicationCategory,
  LearningCategory,
} from '../types';
import { getInitialStorageMode, StorageMode } from '../utils/environment';

export interface ToastState {
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

export interface UIContextType {
  // Theme & Views
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeAppCategory: ApplicationCategory;
  setActiveAppCategory: (cat: ApplicationCategory) => void;
  activeCountry: string;
  setActiveCountry: (country: string) => void;
  activeMobileStage: ApplicationStage | 'Calendar';
  setActiveMobileStage: (st: ApplicationStage | 'Calendar') => void;
  activeLearningCategory: LearningCategory;
  setActiveLearningCategory: (cat: LearningCategory) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, undoAction?: () => void) => void;

  // App Modal
  isAddAppOpen: boolean;
  editingApp: Application | null;
  appPrefill: AppPrefill | null;
  setAppPrefill: (prefill: AppPrefill | null) => void;
  selectedCalDate: string | null;
  openAddAppModal: (prefillDate?: string, prefillData?: AppPrefill) => void;
  openEditAppModal: (app: Application) => void;
  closeAppModal: () => void;

  // Follow-up Modal
  isFollowUpOpen: boolean;
  followUpApp: Application | null;
  openFollowUpModal: (app: Application) => void;
  closeFollowUpModal: () => void;

  // Learning Modal
  isAddLearningOpen: boolean;
  editingLearning: Learning | null;
  learningPrefill: { category?: string; duration?: number } | null;
  openAddLearningModal: (prefillDate?: string, prefillCategory?: string, prefillDuration?: number) => void;
  openEditLearningModal: (learning: Learning) => void;
  closeLearningModal: () => void;

  // Quick List Drawer
  isQuickListOpen: boolean;
  quickListInitialFilter: string;
  openQuickList: (initialFilter?: string) => void;
  closeQuickList: () => void;
  toggleQuickList: () => void;

  // Utilities / Misc Modals
  isShutdownOpen: boolean;
  setIsShutdownOpen: (open: boolean) => void;
  isDriveModalOpen: boolean;
  setIsDriveModalOpen: (open: boolean) => void;
  driveModalTab: 'local_storage' | 'g_drive' | 'sync';
  setDriveModalTab: (tab: 'local_storage' | 'g_drive' | 'sync') => void;
  openDriveModal: (tab?: 'local_storage' | 'g_drive' | 'sync') => void;
  isClipperModalOpen: boolean;
  setIsClipperModalOpen: (open: boolean) => void;

  // Storage
  gdriveStatus: { connected: boolean; folderId: string | null };
  setGdriveStatus: React.Dispatch<React.SetStateAction<{ connected: boolean; folderId: string | null }>>;
  storageMode: StorageMode;
  setStorageMode: (mode: StorageMode) => void;
  pendingStorageMode: StorageMode | null;
  isStorageConfirmModalOpen: boolean;
  requestStorageModeChange: (targetMode: StorageMode) => void;
  confirmStorageModeChange: () => void;
  cancelStorageModeChange: () => void;
}

export const UIContext = createContext<UIContextType | undefined>(undefined);

export interface UIProviderProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  openAuthModal?: () => void;
}

export const UIProvider: React.FC<UIProviderProps> = ({
  children,
  isAuthenticated = false,
  openAuthModal = () => {},
}) => {
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
  const [isFollowUpOpen, setIsFollowUpOpen] = useState<boolean>(false);
  const [followUpApp, setFollowUpApp] = useState<Application | null>(null);

  // Quick List Drawer
  const [isQuickListOpen, setIsQuickListOpen] = useState<boolean>(false);
  const [quickListInitialFilter, setQuickListInitialFilter] = useState<string>('All');

  // Storage
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

  const showToast = (message: string, undoAction?: () => void) => {
    setToast({ message, undoAction });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const openDriveModal = (tab?: 'local_storage' | 'g_drive' | 'sync') => {
    if (tab) setDriveModalTab(tab);
    setIsDriveModalOpen(true);
  };

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
          stage: 'Applied',
        };
        setAppPrefill(prefill);
        setEditingApp(null);
        setIsAddAppOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (_) {}
  }, []);

  const openAddAppModal = (prefillDate?: string, prefillData?: AppPrefill) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add a job application');
      openAuthModal();
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
      openAuthModal();
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
      openAuthModal();
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
      openAuthModal();
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
      openAuthModal();
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

  const openQuickList = (initialFilter?: string) => {
    setQuickListInitialFilter(initialFilter || 'All');
    setIsQuickListOpen(true);
  };
  const closeQuickList = () => setIsQuickListOpen(false);
  const toggleQuickList = () => setIsQuickListOpen(prev => !prev);

  return (
    <UIContext.Provider
      value={{
        theme,
        toggleTheme,
        viewMode,
        setViewMode,
        activeAppCategory,
        setActiveAppCategory,
        activeCountry,
        setActiveCountry,
        activeMobileStage,
        setActiveMobileStage,
        activeLearningCategory,
        setActiveLearningCategory,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
        isAddAppOpen,
        editingApp,
        appPrefill,
        setAppPrefill,
        selectedCalDate,
        openAddAppModal,
        openEditAppModal,
        closeAppModal,
        isFollowUpOpen,
        followUpApp,
        openFollowUpModal,
        closeFollowUpModal,
        isAddLearningOpen,
        editingLearning,
        learningPrefill,
        openAddLearningModal,
        openEditLearningModal,
        closeLearningModal,
        isQuickListOpen,
        quickListInitialFilter,
        openQuickList,
        closeQuickList,
        toggleQuickList,
        isShutdownOpen,
        setIsShutdownOpen,
        isDriveModalOpen,
        setIsDriveModalOpen,
        driveModalTab,
        setDriveModalTab,
        openDriveModal,
        isClipperModalOpen,
        setIsClipperModalOpen,
        gdriveStatus,
        setGdriveStatus,
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
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

