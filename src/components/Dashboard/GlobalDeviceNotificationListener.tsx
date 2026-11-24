import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  subscribeToDeviceBroadcasts,
  subscribeToNotifications,
} from '../../services/firebase.ts';
import {
  APP_ALERT_BANNER_EVENT,
  ForegroundAppAlertPayload,
  clearAppNotificationBadge,
  detectDevicePlatform,
  getDeviceNotificationPermission,
  isInAppNotificationsEnabled,
  sendDeviceNotification,
  syncDeviceSubscriber,
} from '../../utils/deviceNotifications.ts';

export const GlobalDeviceNotificationListener: React.FC = () => {
  const { user } = useAuth();
  const isListeningRef = useRef(false);
  const [activeBanner, setActiveBanner] = useState<ForegroundAppAlertPayload | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 0. Render native-style foreground 9jacash app notification drop-down banner whenever an alert arrives
  useEffect(() => {
    const handleBanner = (event: Event) => {
      const customEvent = event as CustomEvent<ForegroundAppAlertPayload>;
      if (!customEvent?.detail) return;
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
      setActiveBanner(customEvent.detail);
      bannerTimerRef.current = setTimeout(() => {
        setActiveBanner(null);
      }, 4500);
    };

    window.addEventListener(APP_ALERT_BANNER_EVENT, handleBanner);
    return () => {
      window.removeEventListener(APP_ALERT_BANNER_EVENT, handleBanner);
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  // 1. Keep installed app device subscriber registration active in Firestore & clear app badge when opened
  useEffect(() => {
    syncDeviceSubscriber(user?.id, user?.name).catch(() => {});
    clearAppNotificationBadge();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        clearAppNotificationBadge();
        syncDeviceSubscriber(user?.id, user?.name).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [user]);

  // 2. Real-time device notification listener for the installed 9jacash app
  // Dispatches native OS app notifications (status bar / lock screen) via Service Worker
  useEffect(() => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;

    const currentPlatform = detectDevicePlatform();

    // Channel A: Dedicated device_broadcasts collection
    const unsubBroadcasts = subscribeToDeviceBroadcasts((broadcasts) => {
      if (!broadcasts || broadcasts.length === 0) return;

      const permission = getDeviceNotificationPermission();
      const canNotify = permission === 'granted' || isInAppNotificationsEnabled();
      if (!canNotify) return;

      for (const broadcast of broadcasts) {
        if (!broadcast || !broadcast.id) continue;

        if (
          broadcast.targetPlatform &&
          broadcast.targetPlatform !== 'all' &&
          broadcast.targetPlatform !== currentPlatform
        ) {
          continue;
        }

        const broadcastAge = Date.now() - (broadcast.timestamp || 0);
        if (broadcastAge > 48 * 60 * 60 * 1000) {
          continue;
        }

        const storageKey = `9jacash_shown_device_push_${broadcast.id}`;
        if (localStorage.getItem(storageKey)) {
          continue;
        }

        localStorage.setItem(storageKey, 'true');

        sendDeviceNotification(broadcast.title || '9jacash', {
          body: broadcast.body,
          tag: broadcast.tag || `9jacash-company-${broadcast.id}`,
          renotify: true,
          showForegroundBanner: true,
          data: {
            url: broadcast.actionUrl || '/',
            id: broadcast.id,
          },
        }).catch((err) => {
          console.warn('App notification delivery error:', err);
        });
      }
    });

    // Channel B: Fallback via notifications collection
    const unsubNotifs = subscribeToNotifications((notifs) => {
      if (!notifs || notifs.length === 0) return;

      const permission = getDeviceNotificationPermission();
      const canNotify = permission === 'granted' || isInAppNotificationsEnabled();
      if (!canNotify) return;

      for (const notif of notifs) {
        if (!notif || !notif.id || !notif.isDevicePush) continue;

        if (
          notif.targetPlatform &&
          notif.targetPlatform !== 'all' &&
          notif.targetPlatform !== currentPlatform
        ) {
          continue;
        }

        const storageKey = `9jacash_shown_device_push_${notif.id}`;
        if (localStorage.getItem(storageKey)) {
          continue;
        }

        localStorage.setItem(storageKey, 'true');

        sendDeviceNotification(notif.senderLabel || notif.title || '9jacash', {
          body: notif.desc,
          tag: `9jacash-company-notif-${notif.id}`,
          renotify: true,
          showForegroundBanner: true,
          data: {
            url: notif.actionUrl || '/',
            id: notif.id,
          },
        }).catch(console.warn);
      }
    });

    return () => {
      unsubBroadcasts();
      unsubNotifs();
      isListeningRef.current = false;
    };
  }, []);

  if (!activeBanner) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] w-[calc(100%-24px)] max-w-sm animate-in fade-in slide-in-from-top-3 duration-200"
    >
      <div className="rounded-2xl bg-[#161820]/95 backdrop-blur-xl border border-stone-700/80 shadow-2xl shadow-black/50 p-3 flex items-start gap-3 text-white">
        <img
          src="/pwa-192x192.png?v=4"
          alt="9jacash"
          className="w-10 h-10 rounded-xl object-cover border border-amber-400/40 shrink-0 shadow-md"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold text-amber-400 truncate">
              {activeBanner.title}
            </span>
            <span className="text-[10px] text-stone-400 shrink-0">now</span>
          </div>
          <p className="text-xs text-stone-200 leading-snug mt-0.5 line-clamp-3">
            {activeBanner.body}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveBanner(null)}
          className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
