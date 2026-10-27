/**
 * Voice Guide Utility for 9jacash Quick Code Purchase.
 * 
 * Plays a clear female voice explaining that 9jacash is legit,
 * advising against using OPay/PalmPay, and instructing users to use
 * Moniepoint, POS, or other commercial banks.
 * 
 * Works reliably across all browsers, mobile devices, and after deployment:
 * 1. Primary: Bundled pre-rendered high-quality female audio (/audio/quickcode-voice-guide.mp3)
 * 2. Secondary: Bundled WAV audio fallback (/audio/quickcode-voice-guide.wav)
 * 3. Tertiary: Native Web SpeechSynthesis API with preferred female voice
 */

export const VOICE_GUIDE_TEXT =
  "Hello! Welcome to 9jacash. Please listen carefully: 9jacash is 100% legit, verified, and trusted. When paying for your Quick Code, please do NOT use OPay or PalmPay. Instead, make your payment using Moniepoint, a POS machine, or any other commercial bank like Zenith Bank, Access Bank, or GTBank. This ensures your payment is confirmed quickly and your Quick Code is issued immediately. Thank you!";

export interface VoiceGuideState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasPlayedOnce: boolean;
}

type StateListener = (state: VoiceGuideState) => void;

class VoiceGuideManager {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 32.2;
  private hasPlayedOnce = false;
  private listeners: Set<StateListener> = new Set();
  private isUnlocked = false;
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private usingSpeechSynthesis = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
      this.setupUnlockListeners();
    }
  }

  private getAudioUrl(filename: string): string {
    if (typeof window === 'undefined') return `/audio/${filename}`;
    try {
      return new URL(`/audio/${filename}`, window.location.origin).href;
    } catch {
      return `/audio/${filename}`;
    }
  }

  private initAudio() {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.preload = 'auto';
        this.audioElement.src = this.getAudioUrl('quickcode-voice-guide.mp3');

        this.audioElement.addEventListener('play', () => {
          this.isPlaying = true;
          this.hasPlayedOnce = true;
          this.notify();
        });

        this.audioElement.addEventListener('pause', () => {
          this.isPlaying = false;
          this.notify();
        });

        this.audioElement.addEventListener('ended', () => {
          this.isPlaying = false;
          this.currentTime = 0;
          this.notify();
        });

        this.audioElement.addEventListener('timeupdate', () => {
          if (this.audioElement) {
            this.currentTime = this.audioElement.currentTime;
            if (this.audioElement.duration && !isNaN(this.audioElement.duration)) {
              this.duration = this.audioElement.duration;
            }
            this.notify();
          }
        });

        this.audioElement.addEventListener('loadedmetadata', () => {
          if (this.audioElement && this.audioElement.duration && !isNaN(this.audioElement.duration)) {
            this.duration = this.audioElement.duration;
            this.notify();
          }
        });

        this.audioElement.addEventListener('error', () => {
          console.warn('VoiceGuide: MP3 failed, trying WAV fallback...');
          if (this.audioElement && !this.audioElement.src.endsWith('.wav')) {
            this.audioElement.src = this.getAudioUrl('quickcode-voice-guide.wav');
            this.audioElement.load();
            if (this.isPlaying) {
              this.audioElement.play().catch(() => {
                this.fallbackToSpeech();
              });
            }
          } else {
            if (this.isPlaying) {
              this.fallbackToSpeech();
            }
          }
        });
      }
    } catch (e) {
      console.warn('VoiceGuide: audio init error', e);
    }
  }

  private setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.isUnlocked) return;
      this.isUnlocked = true;

      // Prime the audio element on first interaction
      if (this.audioElement) {
        this.audioElement.load();
      }

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true, once: true });
    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('click', unlock, { passive: true, once: true });
  }

  private notify() {
    const state: VoiceGuideState = {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      hasPlayedOnce: this.hasPlayedOnce,
    };
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error(err);
      }
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      hasPlayedOnce: this.hasPlayedOnce,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): VoiceGuideState {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      hasPlayedOnce: this.hasPlayedOnce,
    };
  }

  public async play(): Promise<void> {
    if (typeof window === 'undefined') return;

    this.stop();
    this.usingSpeechSynthesis = false;

    if (!this.audioElement) {
      this.initAudio();
    }

    if (this.audioElement) {
      try {
        this.audioElement.currentTime = 0;
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          await playPromise;
          this.isPlaying = true;
          this.hasPlayedOnce = true;
          this.notify();
          return;
        }
      } catch (err) {
        console.warn('VoiceGuide: Audio file playback blocked or failed, attempting WAV fallback or SpeechSynthesis', err);
        // Try WAV fallback before Speech
        if (this.audioElement && !this.audioElement.src.endsWith('.wav')) {
          try {
            this.audioElement.src = this.getAudioUrl('quickcode-voice-guide.wav');
            this.audioElement.currentTime = 0;
            await this.audioElement.play();
            this.isPlaying = true;
            this.hasPlayedOnce = true;
            this.notify();
            return;
          } catch (wavErr) {
            console.warn('VoiceGuide: WAV fallback also blocked, using SpeechSynthesis', wavErr);
          }
        }
      }
    }

    // Tertiary Fallback: Web Speech API
    this.fallbackToSpeech();
  }

  public pause(): void {
    if (this.audioElement && !this.usingSpeechSynthesis) {
      try {
        this.audioElement.pause();
      } catch {
        // Ignore
      }
    }

    if (this.usingSpeechSynthesis && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {
        // Ignore
      }
    }

    this.isPlaying = false;
    this.notify();
  }

  public replay(): void {
    this.play();
  }

  public toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public stop(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }

    this.isPlaying = false;
    this.currentTime = 0;
    this.usingSpeechSynthesis = false;
    this.notify();
  }

  private fallbackToSpeech() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isPlaying = false;
      this.notify();
      return;
    }

    try {
      this.usingSpeechSynthesis = true;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(VOICE_GUIDE_TEXT);
      utterance.rate = 0.92;
      utterance.pitch = 1.05;

      const pickFemaleVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        return (
          voices.find((v) => {
            const name = (v.name || '').toLowerCase();
            return (
              (name.includes('female') ||
                name.includes('kore') ||
                name.includes('zira') ||
                name.includes('samantha') ||
                name.includes('karen') ||
                name.includes('victoria') ||
                name.includes('serena') ||
                name.includes('google uk english female') ||
                name.includes('natural')) &&
              v.lang.startsWith('en')
            );
          }) || voices.find((v) => v.lang.startsWith('en'))
        );
      };

      const voice = pickFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          const v = pickFemaleVoice();
          if (v) utterance.voice = v;
        };
      }

      utterance.onstart = () => {
        this.isPlaying = true;
        this.hasPlayedOnce = true;
        this.notify();
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.usingSpeechSynthesis = false;
        this.currentTime = 0;
        this.notify();
      };

      utterance.onerror = () => {
        this.isPlaying = false;
        this.usingSpeechSynthesis = false;
        this.notify();
      };

      this.speechUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('VoiceGuide: Speech synthesis error', e);
      this.isPlaying = false;
      this.usingSpeechSynthesis = false;
      this.notify();
    }
  }
}

export const voiceGuide = new VoiceGuideManager();
