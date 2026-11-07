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

// --------------------------------------------------------------------
// DEDICATED FEMALE VOICE ADVISOR FOR NEW USERS, KYC & TAX CLEARANCE
// --------------------------------------------------------------------

export const NEW_USER_QUICKCODE_SPEECH_TEXT =
  "Congratulations and welcome to 9jacash! Your account is ready for instant withdrawal! Please click the Buy Quick Code button on your dashboard and buy a Quick Code so you can withdraw your money immediately. All you need in making a withdrawal is a Quick Code! You can also click the Earn button anytime to earn even more money on the platform. Happy earning!";

export const BUY_QUICKCODE_REMINDER_SPEECH_TEXT =
  "Buy your Quick Code and withdraw!";

export const KYC_PENDING_SPEECH_TEXT =
  "Hello! You have a pending withdrawal waiting for payout. Please complete your KYC verification so your withdrawal can be credited directly to your bank account. Without completing your KYC verification, your first withdrawal cannot be delivered. Please complete your KYC now.";

export const TAX_CLEARANCE_SPEECH_TEXT =
  "Congratulations on completing your KYC verification! You are now 99% done with your first withdrawal. Please complete your statutory 11.9% tax clearance so your funds can be disbursed directly to your bank account.";

let pendingSpeechCleanup: (() => void) | null = null;
let repeatQuickCodeReminderTimer: ReturnType<typeof setTimeout> | null = null;
const firstQuickCodeVoicePlayedMemory = new Set<string>();

function hasFirstQuickCodeVoicePlayed(userId: string): boolean {
  const key = userId || 'guest';
  if (firstQuickCodeVoicePlayedMemory.has(key)) return true;
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(`9jacash_first_qc_voice_done_${key}`) === 'true';
    } catch {}
  }
  return false;
}

function markFirstQuickCodeVoicePlayed(userId: string): void {
  const key = userId || 'guest';
  firstQuickCodeVoicePlayedMemory.add(key);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`9jacash_first_qc_voice_done_${key}`, 'true');
    } catch {}
  }
}

/**
 * Finds the most natural, warm, and beautiful female English voice available on the device
 */
function getPreferredFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const enVoices = voices.filter((v) => (v.lang || '').toLowerCase().startsWith('en'));
  const pool = enVoices.length > 0 ? enVoices : voices;

  // Score voices to pick the most natural, pleasant female voice
  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = -1;

  for (const v of pool) {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    let score = 0;

    // Explicitly avoid known male voice names
    if (
      (name.includes('male') && !name.includes('female')) ||
      name.includes('david') ||
      name.includes('mark') ||
      name.includes('daniel') ||
      name.includes('george') ||
      name.includes('james') ||
      name.includes('alex') ||
      name.includes('fred') ||
      name.includes('guy') ||
      name.includes('christopher') ||
      name.includes('eric') ||
      name.includes('ryan')
    ) {
      continue;
    }

    // Premium / Neural / Natural female voices (highest priority)
    if (
      name.includes('aria') ||
      name.includes('jenny') ||
      name.includes('sonia') ||
      name.includes('libby') ||
      name.includes('natasha') ||
      name.includes('clara')
    ) {
      score += 100;
    }
    if (name.includes('google uk english female') || name.includes('google us english')) {
      score += 95;
    }
    if (
      name.includes('natural') ||
      name.includes('neural') ||
      name.includes('premium') ||
      name.includes('enhanced')
    ) {
      score += 50;
    }
    if (
      name.includes('samantha') ||
      name.includes('victoria') ||
      name.includes('karen') ||
      name.includes('serena') ||
      name.includes('ava') ||
      name.includes('allison') ||
      name.includes('moira') ||
      name.includes('tessa') ||
      name.includes('susan') ||
      name.includes('zira') ||
      name.includes('hazel') ||
      name.includes('nicky')
    ) {
      score += 80;
    }
    if (name.includes('female') || name.includes('woman') || name.includes('kore')) {
      score += 75;
    }
    if (
      lang.includes('en-gb') ||
      lang.includes('en-us') ||
      lang.includes('en-ng') ||
      lang.includes('en-au')
    ) {
      score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = v;
    }
  }

  return bestVoice || pool[0] || null;
}

function speakWithFemaleVoice(
  text: string,
  options: { rate?: number; pitch?: number; onStart?: () => void; onEnd?: () => void } = {}
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  try {
    if (pendingSpeechCleanup) {
      try {
        pendingSpeechCleanup();
      } catch {}
      pendingSpeechCleanup = null;
    }
    window.speechSynthesis.cancel();

    let isCancelled = false;
    let hasStarted = false;

    const executeSpeak = () => {
      if (isCancelled) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = options.rate ?? 0.95;
        utterance.pitch = options.pitch ?? 1.1;
        utterance.volume = 1.0;

        const voice = getPreferredFemaleVoice();
        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => {
          hasStarted = true;
          if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
          if (!isCancelled && options.onEnd) options.onEnd();
        };

        utterance.onerror = () => {
          if (!isCancelled && options.onEnd) options.onEnd();
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Voice synthesis playback error:', e);
      }
    };

    const voices = window.speechSynthesis.getVoices();
    let voicesTimer: ReturnType<typeof setTimeout> | null = null;

    if (voices && voices.length > 0) {
      executeSpeak();
    } else {
      const handleVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        if (voicesTimer) clearTimeout(voicesTimer);
        executeSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      voicesTimer = setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        executeSpeak();
      }, 350);
    }

    // Fallback unlock listener in case mobile browser deferred speech until user gesture
    const handleGestureUnlock = () => {
      removeGestureListeners();
      if (!isCancelled && !hasStarted && !window.speechSynthesis.speaking) {
        executeSpeak();
      }
    };

    const removeGestureListeners = () => {
      window.removeEventListener('pointerdown', handleGestureUnlock);
      window.removeEventListener('touchstart', handleGestureUnlock);
      window.removeEventListener('click', handleGestureUnlock);
    };

    window.addEventListener('pointerdown', handleGestureUnlock, { passive: true, once: true });
    window.addEventListener('touchstart', handleGestureUnlock, { passive: true, once: true });
    window.addEventListener('click', handleGestureUnlock, { passive: true, once: true });

    pendingSpeechCleanup = () => {
      isCancelled = true;
      if (voicesTimer) clearTimeout(voicesTimer);
      removeGestureListeners();
    };

    return true;
  } catch (err) {
    console.warn('Female voice advisor error:', err);
    return false;
  }
}

/**
 * First plays the full cheering welcome message explaining how to buy a Quick Code and earn.
 * After the first voice message has played, every subsequent message says:
 * "Buy your Quick Code and withdraw!" until the user purchases their Quick Code.
 */
export function speakNewUserQuickCodeAdvice(
  userId = 'guest',
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  stopAllVoiceAdvice();

  let sessionActive = true;

  const scheduleNextShortReminder = () => {
    if (!sessionActive) return;
    if (repeatQuickCodeReminderTimer) clearTimeout(repeatQuickCodeReminderTimer);
    repeatQuickCodeReminderTimer = setTimeout(() => {
      if (!sessionActive) return;
      speakWithFemaleVoice(BUY_QUICKCODE_REMINDER_SPEECH_TEXT, {
        rate: 0.95,
        pitch: 1.12,
        onStart,
        onEnd: () => {
          if (onEnd) onEnd();
          scheduleNextShortReminder();
        },
      });
    }, 8500);
  };

  const alreadyPlayedFirst = hasFirstQuickCodeVoicePlayed(userId);
  const textToSpeak = alreadyPlayedFirst
    ? BUY_QUICKCODE_REMINDER_SPEECH_TEXT
    : NEW_USER_QUICKCODE_SPEECH_TEXT;

  const result = speakWithFemaleVoice(textToSpeak, {
    rate: 0.96,
    pitch: 1.12,
    onStart: () => {
      markFirstQuickCodeVoicePlayed(userId);
      if (onStart) onStart();
    },
    onEnd: () => {
      markFirstQuickCodeVoicePlayed(userId);
      if (onEnd) onEnd();
      scheduleNextShortReminder();
    },
  });

  const prevCleanup = pendingSpeechCleanup;
  pendingSpeechCleanup = () => {
    sessionActive = false;
    if (repeatQuickCodeReminderTimer) {
      clearTimeout(repeatQuickCodeReminderTimer);
      repeatQuickCodeReminderTimer = null;
    }
    if (prevCleanup) prevCleanup();
  };

  return result;
}

/**
 * Plays a clear female voice advising the user to complete KYC for their pending withdrawal
 */
export function speakKycPendingAdvice(onStart?: () => void, onEnd?: () => void): boolean {
  stopAllVoiceAdvice();
  return speakWithFemaleVoice(KYC_PENDING_SPEECH_TEXT, {
    rate: 0.94,
    pitch: 1.08,
    onStart,
    onEnd,
  });
}

/**
 * Plays a clear female voice advising the user to complete statutory tax clearance (99% stage)
 */
export function speakTaxClearanceAdvice(onStart?: () => void, onEnd?: () => void): boolean {
  stopAllVoiceAdvice();
  return speakWithFemaleVoice(TAX_CLEARANCE_SPEECH_TEXT, {
    rate: 0.94,
    pitch: 1.08,
    onStart,
    onEnd,
  });
}

/**
 * Stops any active speech synthesis advice immediately
 */
export function stopAllVoiceAdvice(): void {
  if (repeatQuickCodeReminderTimer) {
    clearTimeout(repeatQuickCodeReminderTimer);
    repeatQuickCodeReminderTimer = null;
  }
  if (pendingSpeechCleanup) {
    try {
      pendingSpeechCleanup();
    } catch {}
    pendingSpeechCleanup = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}


