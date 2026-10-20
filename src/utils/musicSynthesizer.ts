import { BuiltInMelody } from '../types/wedding';
import { sanitizeExternalUrl } from './securityAndLinks';

class WeddingMusicController {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private noteIndex = 0;

  // Romantic frequencies (Hz) for gentle arpeggio chords
  private readonly melodies: Record<Exclude<BuiltInMelody, 'custom-url'>, number[]> = {
    'romantic-waltz': [
      261.63, 329.63, 392.0, 523.25, 392.0, 329.63, // C major
      220.0, 261.63, 329.63, 440.0, 329.63, 261.63, // A minor
      174.61, 220.0, 261.63, 349.23, 261.63, 220.0, // F major
      196.0, 246.94, 293.66, 392.0, 293.66, 246.94, // G major
    ],
    'classic-harp': [
      293.66, 369.99, 440.0, 587.33, 659.25, 587.33, 440.0, 369.99, // D major add9
      246.94, 329.63, 369.99, 493.88, 587.33, 493.88, 369.99, 329.63, // Bm7
      196.0, 246.94, 293.66, 392.0, 493.88, 392.0, 293.66, 246.94, // Gmaj7
      220.0, 277.18, 329.63, 440.0, 554.37, 440.0, 329.63, 277.18, // A major
    ],
    'dreamy-musicbox': [
      523.25, 659.25, 783.99, 1046.5, 783.99, 659.25,
      493.88, 587.33, 783.99, 987.77, 783.99, 587.33,
      440.0, 523.25, 659.25, 880.0, 659.25, 523.25,
      392.0, 493.88, 587.33, 783.99, 659.25, 587.33,
    ],
  };

  public start(melody: BuiltInMelody, customUrl?: string): void {
    this.stop();
    this.isPlaying = true;

    const validCustomUrl = sanitizeExternalUrl(customUrl);
    if (melody === 'custom-url' && validCustomUrl) {
      this.audioElement = new Audio(validCustomUrl);
      this.audioElement.loop = true;
      this.audioElement.volume = 0.45;
      this.audioElement.play().catch(() => {
        // Fallback to synth if audio element fails
        this.startSynth('romantic-waltz');
      });
      return;
    }

    const chosenMelody = melody === 'custom-url' ? 'romantic-waltz' : melody;
    this.startSynth(chosenMelody);
  }

  private startSynth(melody: Exclude<BuiltInMelody, 'custom-url'>): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const notes = this.melodies[melody] || this.melodies['romantic-waltz'];
      this.noteIndex = 0;

      const playNextNote = () => {
        if (!this.isPlaying || !this.audioCtx) return;
        const freq = notes[this.noteIndex % notes.length];
        this.playSoftNote(freq, melody);
        this.noteIndex++;
      };

      playNextNote();
      const tempoMs = melody === 'classic-harp' ? 420 : melody === 'dreamy-musicbox' ? 500 : 560;
      this.intervalId = window.setInterval(playNextNote, tempoMs);
    } catch {
      this.isPlaying = false;
    }
  }

  private playSoftNote(freq: number, melody: Exclude<BuiltInMelody, 'custom-url'>): void {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    const osc = this.audioCtx.createOscillator();
    const subOsc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = melody === 'dreamy-musicbox' ? 'sine' : 'triangle';
    subOsc.type = 'sine';

    osc.frequency.setValueAtTime(freq, now);
    subOsc.frequency.setValueAtTime(freq * 0.5, now);

    // Gentle envelope so it sounds warm and unobtrusive
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    subOsc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 1.85);
    subOsc.stop(now + 1.85);
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement = null;
    }
  }

  public getPlayingState(): boolean {
    return this.isPlaying;
  }
}

export const musicController = new WeddingMusicController();
