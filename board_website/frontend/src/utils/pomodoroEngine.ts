/**
 * Pomodoro Focus Sprint State Engine
 * Synchronizes timer countdown across routes and tabs with zero clock drift.
 */

export interface PomodoroState {
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  selectedMinutes: number; // 15, 25, 45, or custom
  remainingSeconds: number;
  endTime: number | null; // Timestamp
  topic: string;
  category: string;
  lastLoggedSessionId: number | null;
}

const STORAGE_KEY = 'job_tracker_pomodoro_state';

class PomodoroEngine {
  private state: PomodoroState;
  private listeners: Set<(state: PomodoroState) => void> = new Set();
  private timerId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = this.loadState();
    this.reconcileBackgroundTick();
    this.startTicker();
  }

  private loadState(): PomodoroState {
    const defaultState: PomodoroState = {
      isRunning: false,
      isPaused: false,
      isFinished: false,
      selectedMinutes: 25,
      remainingSeconds: 25 * 60,
      endTime: null,
      topic: 'Deep Study Sprint',
      category: 'General Aptitude',
      lastLoggedSessionId: null,
    };

    if (typeof window === 'undefined') return defaultState;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
        };
      }
    } catch {
      // Ignore JSON parse errors
    }

    return defaultState;
  }

  private persistState(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore localStorage errors
    }
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(fn => fn(this.state));
  }

  public subscribe(listener: (state: PomodoroState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): PomodoroState {
    return { ...this.state };
  }

  private reconcileBackgroundTick(): void {
    if (this.state.isRunning && this.state.endTime) {
      const now = Date.now();
      const remaining = Math.max(0, Math.round((this.state.endTime - now) / 1000));
      this.state.remainingSeconds = remaining;

      if (remaining <= 0) {
        this.state.isRunning = false;
        this.state.isFinished = true;
        this.state.endTime = null;
      }
    }
  }

  private startTicker(): void {
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      if (this.state.isRunning && this.state.endTime) {
        const now = Date.now();
        const remaining = Math.max(0, Math.round((this.state.endTime - now) / 1000));
        
        if (remaining !== this.state.remainingSeconds) {
          this.state.remainingSeconds = remaining;

          if (remaining <= 0) {
            this.state.isRunning = false;
            this.state.isFinished = true;
            this.state.endTime = null;
          }
          this.persistState();
        }
      }
    }, 500);
  }

  public start(minutes?: number, topic?: string, category?: string): void {
    const mins = minutes ?? this.state.selectedMinutes ?? 25;
    const secs = mins * 60;

    this.state.selectedMinutes = mins;
    this.state.remainingSeconds = secs;
    this.state.endTime = Date.now() + secs * 1000;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.isFinished = false;

    if (topic !== undefined) this.state.topic = topic;
    if (category !== undefined) this.state.category = category;

    this.persistState();
  }

  public pause(): void {
    if (!this.state.isRunning) return;

    this.reconcileBackgroundTick();
    this.state.isRunning = false;
    this.state.isPaused = true;
    this.state.endTime = null;

    this.persistState();
  }

  public resume(): void {
    if (this.state.isRunning || this.state.remainingSeconds <= 0) return;

    this.state.endTime = Date.now() + this.state.remainingSeconds * 1000;
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.isFinished = false;

    this.persistState();
  }

  public reset(minutes?: number): void {
    const mins = minutes ?? this.state.selectedMinutes ?? 25;
    this.state.selectedMinutes = mins;
    this.state.remainingSeconds = mins * 60;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.isFinished = false;
    this.state.endTime = null;

    this.persistState();
  }

  public setPreset(minutes: number): void {
    const clamped = Math.max(1, Math.min(180, minutes));
    this.reset(clamped);
  }

  public setTopic(topic: string): void {
    this.state.topic = topic;
    this.persistState();
  }

  public setCategory(category: string): void {
    this.state.category = category;
    this.persistState();
  }

  public markLogged(): void {
    this.state.isFinished = false;
    this.state.lastLoggedSessionId = Date.now();
    this.persistState();
  }
}

export const pomodoroEngine = new PomodoroEngine();
