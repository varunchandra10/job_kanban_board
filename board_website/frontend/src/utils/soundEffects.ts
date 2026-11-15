/**
 * Zero-Dependency Interactive Audio Synthesizer (Web Audio API)
 * Synthesizes mathematical audio waveforms in real time with zero external assets or network latency.
 */

export type SoundCue = 'swoosh' | 'chime' | 'levelUp' | 'streakSafe';

class SoundEffectsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const storedMute = localStorage.getItem('job_tracker_sound_enabled');
        this.isMuted = storedMute === '0';

        const storedVol = localStorage.getItem('job_tracker_sound_volume');
        if (storedVol !== null) {
          const parsed = parseFloat(storedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
      } catch {
        // LocalStorage blocked
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('job_tracker_sound_enabled', muted ? '0' : '1');
    } catch {}
    this.notify();
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    if (!next) {
      // Play a quick reassuring feedback chime when unmuting
      this.play('chime');
    }
    return next;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem('job_tracker_sound_volume', clamped.toString());
    } catch {}
    this.notify();
  }

  /**
   * Play any of the 4 synthesized sound cues
   */
  public play(cue: SoundCue): void {
    if (this.isMuted || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(ctx.destination);

      switch (cue) {
        case 'swoosh':
          this.synthesizeSwoosh(ctx, masterGain, now);
          break;
        case 'chime':
          this.synthesizeChime(ctx, masterGain, now);
          break;
        case 'levelUp':
          this.synthesizeLevelUp(ctx, masterGain, now);
          break;
        case 'streakSafe':
          this.synthesizeStreakSafe(ctx, masterGain, now);
          break;
      }
    } catch {
      // Audio playback failed or blocked by autoplay policy
    }
  }

  /**
   * 1. 💨 Swoosh: Dynamic pitch-dive white noise & bandpass sweep for Kanban card drops
   */
  private synthesizeSwoosh(ctx: AudioContext, destination: AudioNode, now: number): void {
    const duration = 0.18;
    const sampleRate = ctx.sampleRate;
    const bufferSize = Math.floor(sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Warm sub-sine tone layer for visceral drag feel
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(260, now);
    subOsc.frequency.exponentialRampToValueAtTime(90, now + duration);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.2, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    subOsc.connect(subGain);
    subGain.connect(destination);

    whiteNoise.start(now);
    subOsc.start(now);
    whiteNoise.stop(now + duration);
    subOsc.stop(now + duration);
  }

  /**
   * 2. 🔔 Chime: Dual crystalline harmonic bell chime for focus sprints
   */
  private synthesizeChime(ctx: AudioContext, destination: AudioNode, now: number): void {
    // Frequencies: D5 (587.33Hz) -> A5 (880Hz) -> D6 (1174.66Hz)
    const tones = [
      { freq: 587.33, time: now, gain: 0.35, decay: 1.4 },
      { freq: 880.00, time: now + 0.06, gain: 0.4, decay: 1.6 },
      { freq: 1174.66, time: now + 0.12, gain: 0.25, decay: 1.8 },
      { freq: 1760.00, time: now + 0.16, gain: 0.15, decay: 1.2 },
    ];

    tones.forEach(({ freq, time, gain, decay }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(gain, time + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);

      osc.connect(oscGain);
      oscGain.connect(destination);

      osc.start(time);
      osc.stop(time + decay);
    });
  }

  /**
   * 3. 🎺 LevelUp: Radiant 5-note C-major ascending arpeggio for tier & chest unlock
   */
  private synthesizeLevelUp(ctx: AudioContext, destination: AudioNode, now: number): void {
    // C5, E5, G5, B5, C6, with sparkling top C7
    const arpeggio = [
      { freq: 523.25, time: now + 0.00, gain: 0.3 },
      { freq: 659.25, time: now + 0.08, gain: 0.32 },
      { freq: 783.99, time: now + 0.16, gain: 0.34 },
      { freq: 987.77, time: now + 0.24, gain: 0.36 },
      { freq: 1046.50, time: now + 0.32, gain: 0.45 },
      { freq: 2093.00, time: now + 0.36, gain: 0.18 },
    ];

    arpeggio.forEach(({ freq, time, gain }) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(gain, time + 0.02);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);

      osc.connect(oscGain);
      oscGain.connect(destination);

      osc.start(time);
      osc.stop(time + 1.7);
    });
  }

  /**
   * 4. 🔥 StreakSafe: Warm, resonant major triad chord for daily streak defense
   */
  private synthesizeStreakSafe(ctx: AudioContext, destination: AudioNode, now: number): void {
    // Warm F-major resonant chord: F4 (349.23Hz), A4 (440Hz), C5 (523.25Hz), F5 (698.46Hz)
    const chord = [349.23, 440.00, 523.25, 698.46];

    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.28 / chord.length * 2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + 1.7);
    });
  }
}

export const soundEffects = new SoundEffectsEngine();

