import React, { createContext, useContext, useState, useEffect } from 'react';
import { Application, ApplicationStage } from '../types';
import { api } from '../services/api';
import {
  enqueueMutation,
  resolveId,
  recordIdMapping,
} from '../services/offlineSync';
import {
  encryptApplicationsForStorage,
  decryptApplicationsFromStorage,
} from '../utils/security';
import { generateTempNumericId } from '../utils/idGenerator';

export const isApplicationBookmarked = (app: Application): boolean => {
  return Boolean(
    app.is_bookmarked ||
    (app.custom_tags && app.custom_tags.split(',').map(t => t.trim().toLowerCase()).includes('bookmarked')) ||
    app.stage === 'Bookmarked'
  );
};

export interface ApplicationsContextType {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  addApplication: (data: Partial<Application>) => Promise<void>;
  updateApplication: (id: number, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  appToDelete: Application | null;
  isDeleteAppModalOpen: boolean;
  isDeletingApp: boolean;
  confirmDeleteApplication: () => Promise<void>;
  cancelDeleteApplication: () => void;
  moveApplication: (id: number, stage: ApplicationStage, before?: number | null) => Promise<void>;
  toggleBookmark: (id: number, forceState?: boolean) => Promise<void>;
}

export const ApplicationsContext = createContext<ApplicationsContextType | undefined>(undefined);

export interface ApplicationsProviderProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  showToast?: (message: string, undoAction?: () => void) => void;
  openAuthModal?: () => void;
  onApplicationAdded?: (app: Application) => void;
}

export const ApplicationsProvider: React.FC<ApplicationsProviderProps> = ({
  children,
  isAuthenticated = false,
  showToast = () => {},
  openAuthModal = () => {},
  onApplicationAdded = () => {},
}) => {
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

  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [isDeleteAppModalOpen, setIsDeleteAppModalOpen] = useState<boolean>(false);
  const [isDeletingApp, setIsDeletingApp] = useState<boolean>(false);

  // Decrypt client-side at-rest secrets when loaded into memory from offline storage cache
  useEffect(() => {
    if (isAuthenticated && applications.some(a => a.portal_pass && a.portal_pass.startsWith('enc:v1:'))) {
      let isMounted = true;
      decryptApplicationsFromStorage(applications).then(decrypted => {
        if (isMounted) {
          setApplications(decrypted);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isAuthenticated, applications]);

  // Sync to localStorage ONLY when authenticated (with portal passwords encrypted at rest via AES-256-GCM)
  useEffect(() => {
    if (isAuthenticated) {
      let isCurrent = true;
      encryptApplicationsForStorage(applications).then(encryptedApps => {
        if (isCurrent) {
          localStorage.setItem('job_tracker_apps', JSON.stringify(encryptedApps));
        }
      });
      return () => {
        isCurrent = false;
      };
    }
  }, [applications, isAuthenticated]);

  const addApplication = async (data: Partial<Application>) => {
    const newApp: Application = {
      id: generateTempNumericId(),
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

    onApplicationAdded(newApp);

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
      openAuthModal();
      return;
    }
    const target = applications.find(a => a.id === id);
    if (!target) return;

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

  const moveApplication = async (id: number, stage: ApplicationStage, before?: number | null) => {
    if (!isAuthenticated) {
      showToast('Please sign in to update application stages');
      openAuthModal();
      return;
    }

    if (stage === 'Bookmarked') {
      await toggleBookmark(id, true);
      return;
    }

    const prevApps = [...applications];
    setApplications(prev => {
      const target = prev.find(a => a.id === id);
      if (!target) return prev;

      const others = prev.filter(a => a.id !== id);

      const targetStageApps = others
        .filter(a => a.stage === stage)
        .sort((a, b) => {
          const posA = a.position ?? 0;
          const posB = b.position ?? 0;
          if (posA !== posB) return posA - posB;
          return (b.id ?? 0) - (a.id ?? 0);
        });

      let insertIndex = targetStageApps.length;
      if (before != null) {
        const idx = targetStageApps.findIndex(a => a.id === before);
        if (idx !== -1) {
          insertIndex = idx;
        }
      }

      const updatedTarget = { ...target, stage };
      targetStageApps.splice(insertIndex, 0, updatedTarget);

      const normalizedTargetApps = targetStageApps.map((a, pos) => ({
        ...a,
        position: pos,
      }));

      const targetStageIds = new Set(targetStageApps.map(a => a.id));
      let remainingApps = others.filter(a => !targetStageIds.has(a.id));

      if (target.stage !== stage) {
        const sourceStageApps = remainingApps
          .filter(a => a.stage === target.stage)
          .sort((a, b) => {
            const posA = a.position ?? 0;
            const posB = b.position ?? 0;
            if (posA !== posB) return posA - posB;
            return (b.id ?? 0) - (a.id ?? 0);
          })
          .map((a, pos) => ({
            ...a,
            position: pos,
          }));

        const sourceStageIds = new Set(sourceStageApps.map(a => a.id));
        const otherStagesApps = remainingApps.filter(a => !sourceStageIds.has(a.id));
        remainingApps = [...sourceStageApps, ...otherStagesApps];
      }

      return [...normalizedTargetApps, ...remainingApps];
    });

    showToast(`Moved to ${stage}`, () => {
      setApplications(prevApps);
    });

    try {
      const effectiveId = resolveId(id);
      const effectiveBefore = before != null ? resolveId(before) : undefined;
      await api.moveApplication(effectiveId, stage, effectiveBefore);
    } catch (err) {
      enqueueMutation('move_application', { stage, before }, undefined, id);
    }
  };

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        setApplications,
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
      }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
};

export const useApplications = () => {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error('useApplications must be used within an ApplicationsProvider');
  }
  return context;
};

