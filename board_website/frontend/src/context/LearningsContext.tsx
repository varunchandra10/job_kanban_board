import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Learning,
  LearningTrack,
  DsaProblemProgress,
  LearningCategory,
  ViewMode,
} from '../types';
import { DEFAULT_TRACKS, TRACK_PALETTE } from '../utils/constants';
import { api } from '../services/api';
import {
  enqueueMutation,
  resolveId,
  recordIdMapping,
} from '../services/offlineSync';
import { generateTempNumericId } from '../utils/idGenerator';

export interface LearningsContextType {
  learnings: Learning[];
  setLearnings: React.Dispatch<React.SetStateAction<Learning[]>>;
  learningTracks: LearningTrack[];
  addLearning: (data: Partial<Learning>) => Promise<void>;
  updateLearning: (id: number, data: Partial<Learning>) => Promise<void>;
  deleteLearning: (id: number) => Promise<void>;
  addLearningTrack: (name: string, customColor?: string) => LearningTrack;
  deleteLearningTrack: (trackId: string) => void;
  isDsaEnabled: boolean;
  toggleDsaTrack: (enabled: boolean) => Promise<void>;
  dsaProgress: Record<string, DsaProblemProgress>;
  setDsaProgress: React.Dispatch<React.SetStateAction<Record<string, DsaProblemProgress>>>;
  toggleDsaProblem: (problemId: string) => Promise<void>;
  updateDsaNotes: (problemId: string, notes: string) => Promise<void>;
  advanceDsaReview: (problemId: string, action?: 'advance' | 'reset') => Promise<void>;
}

export const LearningsContext = createContext<LearningsContextType | undefined>(undefined);

export interface LearningsProviderProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  showToast?: (message: string, undoAction?: () => void) => void;
  openAuthModal?: () => void;
  onLearningAdded?: (learning: Learning) => void;
  onDsaProgressUpdated?: (isSolving: boolean) => void;
  onDsaReviewAdvanced?: (action: 'advance' | 'reset') => void;
  onDsaGamificationSync?: (gamification: any) => void;
  activeLearningCategory?: LearningCategory;
  setActiveLearningCategory?: (cat: LearningCategory) => void;
  viewMode?: ViewMode;
  setViewMode?: (mode: ViewMode) => void;
}

export const LearningsProvider: React.FC<LearningsProviderProps> = ({
  children,
  isAuthenticated = false,
  showToast = () => {},
  openAuthModal = () => {},
  onLearningAdded = () => {},
  onDsaProgressUpdated = () => {},
  onDsaReviewAdvanced = () => {},
  onDsaGamificationSync = () => {},
  activeLearningCategory = 'All',
  setActiveLearningCategory = () => {},
  viewMode = 'apps',
  setViewMode = () => {},
}) => {
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

  useEffect(() => {
    if (isAuthenticated) {
      localStorage.setItem('job_tracker_learnings', JSON.stringify(learnings));
    }
  }, [learnings, isAuthenticated]);

  const addLearning = async (data: Partial<Learning>) => {
    const newLearning: Learning = {
      id: generateTempNumericId(),
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
    onLearningAdded(newLearning);
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
      openAuthModal();
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
      openAuthModal();
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
      openAuthModal();
      return;
    }
    setLearningTracks(prev => prev.filter(t => t.id !== trackId && t.name !== trackId));
    if (activeLearningCategory === trackId) {
      setActiveLearningCategory('All');
    }
    showToast('Track removed');
  };

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

    onDsaProgressUpdated(isSolving);

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
          onDsaGamificationSync(res.gamification);
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

    onDsaReviewAdvanced(action);

    if (action === 'advance') {
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
          onDsaGamificationSync(res.gamification);
        }
      } catch (err) {
        console.warn('Failed advancing DSA review on server:', err);
      }
    }
  };

  return (
    <LearningsContext.Provider
      value={{
        learnings,
        setLearnings,
        learningTracks,
        addLearning,
        updateLearning,
        deleteLearning,
        addLearningTrack,
        deleteLearningTrack,
        isDsaEnabled,
        toggleDsaTrack,
        dsaProgress,
        setDsaProgress,
        toggleDsaProblem,
        updateDsaNotes,
        advanceDsaReview,
      }}
    >
      {children}
    </LearningsContext.Provider>
  );
};

export const useLearnings = () => {
  const context = useContext(LearningsContext);
  if (!context) {
    throw new Error('useLearnings must be used within a LearningsProvider');
  }
  return context;
};
