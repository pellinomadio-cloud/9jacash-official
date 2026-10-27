// Utility for sending native OS device notifications on Android (and desktop)
// Alerts users on their device status bar and lock screen
import { DeviceSubscriber } from '../types/index.ts';
import { registerDeviceSubscriberInFirestore } from '../services/firebase.ts';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface DeviceNotificationOptions {
  title?: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: Record<string, unknown>;
  renotify?: boolean;
}

/**
 * Detect the user's OS platform (Android, iOS/iPhone, or Desktop)
 */
export function detectDevicePlatform(): 'android' | 'ios' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

/**
 * Get or create a persistent device identifier stored in localStorage
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_' + Date.now();
  const STORAGE_KEY = '9jacash_device_subscriber_id';
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Check if running as an installed PWA (Home Screen standalone mode)
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Sync device subscriber metadata to Firestore so admin knows how many devices are reachable
 */
export async function syncDeviceSubscriber(userId?: string | null, userName?: string | null): Promise<DeviceSubscriber | null> {
  if (typeof window === 'undefined') return null;
  const permission = getDeviceNotificationPermission();
  const deviceId = getOrCreateDeviceId();
  const platform = detectDevicePlatform();
  const isPwa = isPwaInstalled();

  const sub: DeviceSubscriber = {
    id: deviceId,
    platform,
    permission: permission === 'granted' ? 'granted' : permission === 'denied' ? 'denied' : 'default',
    isPwa,
    userAgent: (navigator.userAgent || '').substring(0, 150),
    registeredAt: localStorage.getItem('9jacash_device_reg_date') || new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    userId: userId || null,
    userName: userName || null,
  };

  if (!localStorage.getItem('9jacash_device_reg_date')) {
    localStorage.setItem('9jacash_device_reg_date', sub.registeredAt);
  }

  // Throttle writes: only update Firestore subscriber record once every 6 hours
  const LAST_SYNC_KEY = '9jacash_last_device_subscriber_sync';
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  const now = Date.now();
  if (lastSync && now - parseInt(lastSync, 10) < 6 * 60 * 60 * 1000) {
    return sub;
  }

  try {
    await registerDeviceSubscriberInFirestore(sub);
    localStorage.setItem(LAST_SYNC_KEY, now.toString());
  } catch (err) {
    console.warn('Could not sync device subscriber to Firestore:', err);
  }

  return sub;
}

/**
 * Play a clear, pleasant native chime using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.33);
  } catch {
    // Audio may be suspended without user gesture
  }
}

let lastNotificationTimestamp = 0;
const MIN_NOTIFICATION_INTERVAL_MS = 10000; // 10s cooldown for automatic visits to avoid spamming system tray

/**
 * Check if the browser and device support the Notification API
 */
export function isDeviceNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current notification permission
 */
export function getDeviceNotificationPermission(): NotificationPermissionState {
  if (!isDeviceNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Register or retrieve the active service worker for showing device notifications
 */
export async function getNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    // Wait for the service worker to become ready/active
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('Could not retrieve or register Notification Service Worker:', err);
    return null;
  }
}

/**
 * Request notification permission from the user
 */
export async function requestDeviceNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isDeviceNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Warm up service worker registration
      await getNotificationServiceWorker();
    }
    return permission as NotificationPermissionState;
  } catch (err) {
    console.warn('Error requesting device notification permission:', err);
    return Notification.permission as NotificationPermissionState;
  }
}

/**
 * Send a native device notification to the user's Android phone (or desktop)
 * Shows in Android status bar, lock screen, and notification drawer
 */
export async function sendDeviceNotification(
  title: string,
  options: DeviceNotificationOptions
): Promise<boolean> {
  if (!isDeviceNotificationSupported()) {
    console.warn('Device notifications are not supported in this browser.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    // If not granted, try requesting
    const perm = await requestDeviceNotificationPermission();
    if (perm !== 'granted') {
      return false;
    }
  }

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/icon-badge.png',
    vibrate: options.vibrate || [200, 100, 200, 100, 300], // Haptic alert vibration
    tag: options.tag || `9jacash-${Date.now()}`,
    renotify: options.renotify !== false, // Always wake up notification bar and vibrate
    requireInteraction: false,
    silent: false,
    data: {
      url: '/',
      timestamp: Date.now(),
      ...options.data,
    },
  };

  // 1. Android mobile standard: ServiceWorkerRegistration.showNotification()
  try {
    const swReg = await getNotificationServiceWorker();
    if (swReg && typeof swReg.showNotification === 'function') {
      await swReg.showNotification(title, notificationOptions as NotificationOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('Service worker showNotification failed, trying fallback:', swErr);
  }

  // 2. Fallback for desktop browsers
  try {
    new Notification(title, {
      body: options.body,
      icon: options.icon || '/icon-192.png',
      tag: options.tag || `9jacash-${Date.now()}`,
    });
    return true;
  } catch (fallbackErr) {
    console.warn('Fallback Notification constructor failed:', fallbackErr);
    return false;
  }
}

export const VISIT_NOTIF_STORAGE_PREFIX = '9jacash_visit_device_notif_shown_';

/**
 * Check if the visit device notification has already shown for this user
 * Persists in localStorage across page refreshes and tab navigations
 */
export function hasDashboardVisitNotificationShown(userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = VISIT_NOTIF_STORAGE_PREFIX + (userId || 'guest');
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark that the visit device notification has been shown so it never fires again
 */
export function markDashboardVisitNotificationShown(userId?: string): void {
  if (typeof window === 'undefined') return;
  const key = VISIT_NOTIF_STORAGE_PREFIX + (userId || 'guest');
  try {
    localStorage.setItem(key, 'true');
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Trigger a device alert when the user visits the dashboard for the first time.
 * If it has already shown, it will NEVER show again even if user visits any button,
 * returns back to dashboard, or refreshes the page.
 */
export async function triggerDashboardVisitDeviceNotification(
  user?: {
    name?: string;
    balance?: number;
    availableBalance?: number;
    id?: string;
  } | null,
  force: boolean = false
): Promise<boolean> {
  // If already shown once for this user/device, do NOT show again even across refreshes and page navigation
  if (!force && hasDashboardVisitNotificationShown(user?.id)) {
    return false;
  }

  const permission = getDeviceNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }

  // Mark as shown in localStorage immediately so it never shows again on button navigation or refresh
  markDashboardVisitNotificationShown(user?.id);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';
  const balance = Number(user?.balance ?? user?.availableBalance ?? 0);
  const formattedBalance = `₦${balance.toLocaleString()}`;

  // Rotate between realistic instant device alerts
  const alertTemplates = [
    {
      title: '9jacash • Account Alert',
      body: `💰 Welcome back, ${firstName}! Available Balance: ${formattedBalance}. Instant transfer & cashout ready.`,
    },
    {
      title: '9jacash Alert ⚡',
      body: `⚡ Account active: ${formattedBalance} in your wallet. Daily rewards and quick tasks updated.`,
    },
    {
      title: '9jacash • Instant Notice',
      body: `🟢 Session active for ${firstName}. Balance: ${formattedBalance}. Tap to manage your account.`,
    },
  ];

  const selectedAlert = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];

  return await sendDeviceNotification(selectedAlert.title, {
    body: selectedAlert.body,
    tag: `9jacash-dashboard-${Date.now()}`,
    renotify: true,
  });
}

let lastWithdrawalNotification = { amount: 0, time: 0 };

/**
 * Trigger a device notification when a user makes a withdrawal
 * Shows that they withdrew the specified amount
 */
export async function sendWithdrawalDeviceNotification(
  amount: number,
  bank?: string,
  accountNumber?: string
): Promise<boolean> {
  const now = Date.now();
  if (lastWithdrawalNotification.amount === amount && now - lastWithdrawalNotification.time < 3000) {
    return true; // prevent duplicate within 3s
  }
  lastWithdrawalNotification = { amount, time: now };

  const formattedAmount = `₦${Number(amount || 0).toLocaleString()}`;
  const destination = bank && accountNumber ? ` to ${bank} (${accountNumber})` : '';
  const bodyText = `You withdrew ${formattedAmount}${destination}. Your withdrawal transaction is recorded.`;

  return await sendDeviceNotification('9jacash • Withdrawal Alert 💸', {
    body: bodyText,
    tag: `9jacash-withdrawal-${now}`,
    renotify: true,
  });
}

let lastCodeNotification = { time: 0, code: '' };

/**
 * Trigger a device notification when a user buys a Quick Code
 * Shows that code is successfully purchased
 */
export async function sendCodePurchasedDeviceNotification(
  code?: string,
  _planName?: string
): Promise<boolean> {
  const now = Date.now();
  const codeKey = code || 'purchased';
  if (lastCodeNotification.code === codeKey && now - lastCodeNotification.time < 3000) {
    return true; // prevent duplicate within 3s
  }
  lastCodeNotification = { time: now, code: codeKey };

  const bodyText = code
    ? `Quick Code is successfully purchased. Code: ${code}. Valid for authorization.`
    : `Quick Code is successfully purchased. Your withdrawal code is ready.`;

  return await sendDeviceNotification('9jacash • Quick Code 🔑', {
    body: bodyText,
    tag: `9jacash-code-${now}`,
    renotify: true,
  });
}
