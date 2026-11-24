// Native Device & Installed App Notification Utility for 9jacash
// Delivers normal device notifications directly for the installed 9jacash app (Android, iOS, Desktop)
// via the app's Service Worker registration — never requiring a browser tab once installed.
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
  /** Show an instant native-style heads-up banner inside the app while open in foreground */
  showForegroundBanner?: boolean;
}

export interface ForegroundAppAlertPayload {
  id: string;
  title: string;
  body: string;
  timestamp: number;
}

export const APP_ALERT_BANNER_EVENT = '9jacash-app-alert-banner';

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
 * Check if running as an installed app on the user's device
 * (Android WebAPK/PWA, iOS Home Screen App, Desktop installed PWA, TWA, or native mobile wrapper)
 */
export function isPwaInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const win = window as unknown as {
      __pwaIsInstalled?: boolean;
      Capacitor?: unknown;
      cordova?: unknown;
      Android?: unknown;
      ReactNativeWebView?: unknown;
    };
    const nav = window.navigator as unknown as { standalone?: boolean };
    const isStandaloneMedia =
      typeof window.matchMedia === 'function' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches);

    return (
      isStandaloneMedia ||
      nav.standalone === true ||
      document.referrer.includes('android-app://') ||
      win.__pwaIsInstalled === true ||
      Boolean(win.Capacitor || win.cordova || win.Android || win.ReactNativeWebView)
    );
  } catch {
    return false;
  }
}

/**
 * Check for optional native Android/iOS wrapper bridge (if packaged as an APK/IPA)
 */
function requestNativeAppWrapperPermission(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const win = window as unknown as {
      Android?: {
        requestNotificationPermission?: () => void;
        enableNotifications?: () => void;
      };
      webkit?: {
        messageHandlers?: {
          notifications?: { postMessage?: (msg: unknown) => void };
          requestNotificationPermission?: { postMessage?: (msg: unknown) => void };
        };
      };
    };

    if (win.Android?.requestNotificationPermission) {
      win.Android.requestNotificationPermission();
      return true;
    }
    if (win.Android?.enableNotifications) {
      win.Android.enableNotifications();
      return true;
    }
    if (win.webkit?.messageHandlers?.requestNotificationPermission?.postMessage) {
      win.webkit.messageHandlers.requestNotificationPermission.postMessage({ action: 'enable' });
      return true;
    }
    if (win.webkit?.messageHandlers?.notifications?.postMessage) {
      win.webkit.messageHandlers.notifications.postMessage({ action: 'enable' });
      return true;
    }
  } catch {
    // Ignore missing native bridges
  }
  return false;
}

/**
 * Send notification through a native Android/iOS wrapper bridge if available
 */
function sendViaNativeAppWrapper(title: string, body: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const win = window as unknown as {
      Android?: {
        showNotification?: (t: string, b: string) => void;
        sendNotification?: (t: string, b: string) => void;
      };
      webkit?: {
        messageHandlers?: {
          notifications?: { postMessage?: (msg: unknown) => void };
        };
      };
    };
    if (win.Android?.showNotification) {
      win.Android.showNotification(title, body);
      return true;
    }
    if (win.Android?.sendNotification) {
      win.Android.sendNotification(title, body);
      return true;
    }
    if (win.webkit?.messageHandlers?.notifications?.postMessage) {
      win.webkit.messageHandlers.notifications.postMessage({ action: 'show', title, body });
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

/**
 * Update native app icon badge on installed device (Android/iOS/Desktop PWA)
 */
export function setAppNotificationBadge(count: number = 1): void {
  try {
    const nav = navigator as unknown as { setAppBadge?: (c?: number) => Promise<void> };
    if (typeof nav?.setAppBadge === 'function') {
      nav.setAppBadge(count).catch(() => {});
    }
  } catch {
    // Ignore unsupported Badging API
  }
}

/**
 * Clear native app icon badge when user opens the app
 */
export function clearAppNotificationBadge(): void {
  try {
    const nav = navigator as unknown as { clearAppBadge?: () => Promise<void> };
    if (typeof nav?.clearAppBadge === 'function') {
      nav.clearAppBadge().catch(() => {});
    }
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_APP_BADGE' });
    }
  } catch {
    // Ignore
  }
}

/**
 * Emit a foreground native-style app notification drop-down banner
 * Ensures users inside the open installed app immediately see & feel the alert even when the OS suppresses foreground popups.
 */
export function emitForegroundAppAlertBanner(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  try {
    const detail: ForegroundAppAlertPayload = {
      id: `app_alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      body,
      timestamp: Date.now(),
    };
    window.dispatchEvent(new CustomEvent<ForegroundAppAlertPayload>(APP_ALERT_BANNER_EVENT, { detail }));
  } catch {
    // Ignore
  }
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
 * Play a clear, pleasant native chime using Web Audio API + light haptic vibration
 */
export function playNotificationChime(): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([120, 60, 140]);
    }
  } catch {
    // Ignore vibration restrictions
  }
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export const IN_APP_NOTIF_STORAGE_KEY = '9jacash_inapp_notifications_enabled';
export const NOTIF_STATE_EVENT = '9jacash-notifications-state-changed';

export type EnableNotificationsOutcome =
  | 'granted'
  | 'denied'
  | 'ios_needs_pwa'
  | 'iframe_or_restricted'
  | 'unsupported'
  | 'dismissed';

export interface EnableNotificationsResult {
  outcome: EnableNotificationsOutcome;
  permission: NotificationPermissionState;
  inAppEnabled: boolean;
  message: string;
}

export function isInAppNotificationsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(IN_APP_NOTIF_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setInAppNotificationsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(IN_APP_NOTIF_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(IN_APP_NOTIF_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent(NOTIF_STATE_EVENT));
  } catch {
    // ignore storage errors
  }
}

/**
 * Check if the device supports the native OS Notification API
 */
export function isDeviceNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && typeof window.Notification !== 'undefined';
}

/**
 * Get current OS device notification permission safely
 */
export function getDeviceNotificationPermission(): NotificationPermissionState {
  if (!isDeviceNotificationSupported()) {
    return 'unsupported';
  }
  try {
    return (Notification.permission as NotificationPermissionState) || 'default';
  } catch {
    return 'unsupported';
  }
}

/**
 * Register or retrieve the active Service Worker that owns installed 9jacash app notifications.
 * Waits briefly if the worker is still activating, with a hard 2.5s cap so it can NEVER hang.
 */
export async function getNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    let registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      registration = await navigator.serviceWorker.getRegistration();
    }
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    if (registration?.active) {
      return registration;
    }

    // If a worker is installing or waiting, wait up to 2.5s for it to become active
    const pendingWorker = registration?.installing || registration?.waiting;
    if (pendingWorker) {
      await Promise.race([
        new Promise<void>((resolve) => {
          const onStateChange = () => {
            if (pendingWorker.state === 'activated' || pendingWorker.state === 'redundant') {
              pendingWorker.removeEventListener('statechange', onStateChange);
              resolve();
            }
          };
          pendingWorker.addEventListener('statechange', onStateChange);
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 2500)),
      ]);
      if (registration?.active) {
        return registration;
      }
    }

    // Race navigator.serviceWorker.ready against a 2s timeout so it never hangs
    const readyReg = await Promise.race<ServiceWorkerRegistration | null>([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
    ]);

    return readyReg || registration || null;
  } catch (err) {
    console.warn('Could not retrieve or register App Notification Service Worker:', err);
    return null;
  }
}

/**
 * Request normal device notification permission directly for the 9jacash app.
 * Must be invoked directly from a user tap/click gesture so Android/iOS displays the native OS permission prompt.
 */
export async function requestDeviceNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isDeviceNotificationSupported()) {
    requestNativeAppWrapperPermission();
    return 'unsupported';
  }

  try {
    if (Notification.permission === 'granted') {
      getNotificationServiceWorker().catch(() => {});
      return 'granted';
    }

    const permissionPromise = new Promise<NotificationPermissionState>((resolve) => {
      try {
        const result = Notification.requestPermission((cbPerm) => {
          resolve((cbPerm as NotificationPermissionState) || getDeviceNotificationPermission());
        });
        if (result && typeof (result as Promise<NotificationPermission>).then === 'function') {
          (result as Promise<NotificationPermission>)
            .then((p) => resolve((p as NotificationPermissionState) || getDeviceNotificationPermission()))
            .catch(() => resolve(getDeviceNotificationPermission()));
        }
      } catch {
        resolve(getDeviceNotificationPermission());
      }
    });

    // Guard against environments where requestPermission never settles
    const permission = await Promise.race<NotificationPermissionState>([
      permissionPromise,
      new Promise<NotificationPermissionState>((resolve) =>
        setTimeout(() => resolve(getDeviceNotificationPermission()), 6000)
      ),
    ]);

    if (permission === 'granted') {
      getNotificationServiceWorker().catch(() => {});
    }

    return permission;
  } catch (err) {
    console.warn('Error requesting app notification permission:', err);
    return getDeviceNotificationPermission();
  }
}

/**
 * Build platform-specific native device Settings path when OS app notifications are switched off.
 * Never tells installed-app users to use a browser or address bar.
 */
function getDeviceAppSettingsHint(platform: 'android' | 'ios' | 'desktop'): string {
  if (platform === 'android') {
    return 'Device notifications for 9jacash are currently switched off on your phone. Open Phone Settings → Apps → 9jacash → Notifications → Turn ON.';
  }
  if (platform === 'ios') {
    return 'Device notifications for 9jacash are currently switched off on your iPhone. Open Settings → Notifications → 9jacash → Allow Notifications.';
  }
  return 'Device notifications for 9jacash are currently turned off in your device settings. Open System Settings → Notifications → 9jacash → Allow.';
}

/**
 * Unified user-triggered activation flow for all "Turn On Notification" buttons.
 * Requests normal OS device notification permission directly for the 9jacash app (no browser needed).
 */
export async function enableNotificationsFromUserGesture(user?: {
  name?: string;
  balance?: number;
  availableBalance?: number;
  id?: string;
} | null): Promise<EnableNotificationsResult> {
  const platform = detectDevicePlatform();
  const installedApp = isPwaInstalled();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';

  // If on iPhone/iPad before installing to Home Screen, iOS requires installing the app first for native OS alerts
  if (platform === 'ios' && !installedApp && !isDeviceNotificationSupported()) {
    setInAppNotificationsEnabled(true);
    playNotificationChime();
    emitForegroundAppAlertBanner(
      '9jacash • App Alerts Active',
      `Alerts are ON for ${firstName}. Install the 9jacash app to your Home Screen for lock-screen notifications.`
    );
    return {
      outcome: 'ios_needs_pwa',
      permission: 'unsupported',
      inAppEnabled: true,
      message: 'App alerts are ON! To receive iPhone lock-screen notifications directly from the 9jacash app, tap Share → "Add to Home Screen".',
    };
  }

  // If running inside an installed native wrapper APK/IPA where Web Notification API is replaced by native OS alerts
  if (!isDeviceNotificationSupported()) {
    requestNativeAppWrapperPermission();
    setInAppNotificationsEnabled(true);
    playNotificationChime();
    sendViaNativeAppWrapper(
      '9jacash • App Notifications On',
      `Great job, ${firstName}! Device notifications are now turned on for the 9jacash app.`
    );
    emitForegroundAppAlertBanner(
      '9jacash • App Notifications On',
      `Great job, ${firstName}! You will receive instant 9jacash app alerts for withdrawals, deposits, and rewards.`
    );
    return {
      outcome: 'granted',
      permission: 'granted',
      inAppEnabled: true,
      message: '9jacash app notifications are now turned on for your device.',
    };
  }

  // Request OS device notification permission directly inside the user's tap gesture
  const perm = await requestDeviceNotificationPermission();

  if (perm === 'granted') {
    setInAppNotificationsEnabled(true);
    playNotificationChime();
    // Sync subscriber metadata in background (never block UI)
    syncDeviceSubscriber(user?.id, user?.name).catch(() => {});

    // Deliver a real native device notification directly from the 9jacash app via Service Worker
    await sendDeviceNotification('9jacash • App Notifications On', {
      body: `Great job, ${firstName}! Normal device notifications are now active for your 9jacash app.`,
      tag: `9jacash-enabled-${Date.now()}`,
      renotify: true,
      showForegroundBanner: true,
    });
    markDashboardVisitNotificationShown(user?.id);

    return {
      outcome: 'granted',
      permission: 'granted',
      inAppEnabled: true,
      message: installedApp
        ? '9jacash app notifications are turned ON! Alerts will appear directly in your phone notification bar.'
        : 'Device notifications are turned ON! Alerts will appear directly in your device notification bar.',
    };
  }

  if (perm === 'denied') {
    setInAppNotificationsEnabled(true);
    playNotificationChime();
    return {
      outcome: 'denied',
      permission: 'denied',
      inAppEnabled: true,
      message: getDeviceAppSettingsHint(platform),
    };
  }

  // Permission stayed 'default' (user dismissed the OS prompt)
  setInAppNotificationsEnabled(true);
  playNotificationChime();

  if (platform === 'ios' && !installedApp) {
    return {
      outcome: 'ios_needs_pwa',
      permission: 'default',
      inAppEnabled: true,
      message: 'App alerts are ON! Add 9jacash to your iPhone Home Screen to turn on lock-screen app notifications.',
    };
  }

  return {
    outcome: 'dismissed',
    permission: 'default',
    inAppEnabled: true,
    message: 'Tap "Turn On Notification" again and select "Allow" on the device popup to turn on 9jacash app notifications.',
  };
}

/**
 * Send a native device notification attributed directly to the 9jacash app.
 * Uses ServiceWorkerRegistration.showNotification() so installed apps show native OS app notifications
 * (status bar, lock screen, and notification tray) without needing any browser tab.
 */
export async function sendDeviceNotification(
  title: string,
  options: DeviceNotificationOptions
): Promise<boolean> {
  const installedApp = isPwaInstalled();
  const body = options.body || '';

  // Also show native-style heads-up alert inside the open app when explicitly requested or in foreground
  if (
    options.showForegroundBanner &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible'
  ) {
    emitForegroundAppAlertBanner(title, body);
  }

  // Native APK/IPA wrapper bridge first if present
  if (sendViaNativeAppWrapper(title, body)) {
    return true;
  }

  if (!isDeviceNotificationSupported()) {
    if (isInAppNotificationsEnabled()) {
      emitForegroundAppAlertBanner(title, body);
      playNotificationChime();
      return true;
    }
    return false;
  }

  if (Notification.permission !== 'granted') {
    if (isInAppNotificationsEnabled() && typeof document !== 'undefined' && document.visibilityState === 'visible') {
      emitForegroundAppAlertBanner(title, body);
      playNotificationChime();
      return true;
    }
    return false;
  }

  const notificationOptions = {
    body,
    icon: options.icon || '/pwa-192x192.png?v=4',
    badge: options.badge || '/icon-badge.png?v=4',
    vibrate: options.vibrate || [200, 100, 200, 100, 300],
    tag: options.tag || `9jacash-app-${Date.now()}`,
    renotify: options.renotify !== false,
    requireInteraction: false,
    silent: false,
    data: {
      url: '/',
      timestamp: Date.now(),
      ...options.data,
    },
  };

  setAppNotificationBadge(1);

  // 1. Primary path for installed apps (Android WebAPK, iOS Home Screen App, Desktop PWA):
  // ServiceWorkerRegistration.showNotification() delivers native OS app notifications directly from 9jacash!
  try {
    const swReg = await getNotificationServiceWorker();
    if (swReg && typeof swReg.showNotification === 'function') {
      await swReg.showNotification(title, notificationOptions as NotificationOptions);
      return true;
    }
  } catch (swErr) {
    console.warn('Service worker showNotification failed:', swErr);
  }

  // 2. Secondary Service Worker delivery via controller postMessage (also pure app notification, no browser window)
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_APP_NOTIFICATION',
        title,
        options: notificationOptions,
      });
      return true;
    }
  } catch {
    // Ignore
  }

  // 3. Only use Notification constructor if NOT in standalone installed app mode (e.g. desktop without SW)
  if (!installedApp) {
    try {
      new Notification(title, {
        body,
        icon: options.icon || '/pwa-192x192.png?v=4',
        tag: options.tag || `9jacash-app-${Date.now()}`,
      });
      return true;
    } catch {
      // Ignore on mobile where constructor is disallowed
    }
  }

  // Ensure foreground user still gets feedback if OS suppressed delivery
  if (!options.showForegroundBanner && typeof document !== 'undefined' && document.visibilityState === 'visible') {
    emitForegroundAppAlertBanner(title, body);
  }
  return false;
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
 * Trigger a one-time device alert when the user visits the dashboard for the first time.
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
  if (!force && hasDashboardVisitNotificationShown(user?.id)) {
    return false;
  }

  const permission = getDeviceNotificationPermission();
  if (permission !== 'granted') {
    return false;
  }

  markDashboardVisitNotificationShown(user?.id);

  const firstName = user?.name ? user.name.split(' ')[0] : 'Member';
  const balance = Number(user?.balance ?? user?.availableBalance ?? 0);
  const formattedBalance = `₦${Number.isFinite(balance) ? balance.toLocaleString('en-US') : '0'}`;

  const alertTemplates = [
    {
      title: '9jacash • Account Alert',
      body: `Welcome back, ${firstName}! Available Balance: ${formattedBalance}. Instant transfer & cashout ready.`,
    },
    {
      title: '9jacash Alert',
      body: `Account active: ${formattedBalance} in your wallet. Daily rewards and quick tasks updated.`,
    },
    {
      title: '9jacash • Instant Notice',
      body: `Session active for ${firstName}. Balance: ${formattedBalance}. Tap to manage your account.`,
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
 * Trigger a device app notification when a user makes a withdrawal
 */
export async function sendWithdrawalDeviceNotification(
  amount: number,
  bank?: string,
  accountNumber?: string
): Promise<boolean> {
  const now = Date.now();
  if (lastWithdrawalNotification.amount === amount && now - lastWithdrawalNotification.time < 3000) {
    return true;
  }
  lastWithdrawalNotification = { amount, time: now };

  const numericAmount = Number(amount || 0);
  const formattedAmount = `₦${Number.isFinite(numericAmount) ? numericAmount.toLocaleString('en-US') : '0'}`;
  const destination = bank && accountNumber ? ` to ${bank} (${accountNumber})` : '';
  const bodyText = `You withdrew ${formattedAmount}${destination}. Your withdrawal transaction is recorded.`;

  return await sendDeviceNotification('9jacash • Withdrawal Alert', {
    body: bodyText,
    tag: `9jacash-withdrawal-${now}`,
    renotify: true,
    showForegroundBanner: true,
  });
}

let lastCodeNotification = { time: 0, code: '' };

/**
 * Trigger a device app notification when a user buys a Quick Code
 */
export async function sendCodePurchasedDeviceNotification(
  code?: string,
  _planName?: string
): Promise<boolean> {
  const now = Date.now();
  const codeKey = code || 'purchased';
  if (lastCodeNotification.code === codeKey && now - lastCodeNotification.time < 3000) {
    return true;
  }
  lastCodeNotification = { time: now, code: codeKey };

  const bodyText = code
    ? `Quick Code is successfully purchased. Code: ${code}. Valid for authorization.`
    : `Quick Code is successfully purchased. Your withdrawal code is ready.`;

  return await sendDeviceNotification('9jacash • Quick Code', {
    body: bodyText,
    tag: `9jacash-code-${now}`,
    renotify: true,
    showForegroundBanner: true,
  });
}
