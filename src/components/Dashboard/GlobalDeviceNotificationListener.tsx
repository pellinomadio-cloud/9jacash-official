import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  subscribeToDeviceBroadcasts,
  subscribeToNotifications,
} from '../../services/firebase.ts';
import {
  detectDevicePlatform,
  getDeviceNotificationPermission,
  sendDeviceNotification,
  syncDeviceSubscriber,
} from '../../utils/deviceNotifications.ts';

export const GlobalDeviceNotificationListener: React.FC = () => {
  const { user } = useAuth();
  const isListeningRef = useRef(false);

  // 1. Keep device subscriber registration active in Firestore
  useEffect(() => {
    // Initial sync
    syncDeviceSubscriber(user?.id, user?.name).catch(() => {});

    // Sync when user logs in or changes
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
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

  // 2. Real-time background device push listener
  // Listens to Firestore device_broadcasts and notifications collections
  // Pops native Android status bar / lock screen or iPhone notifications even when app is minimized or backgrounded!
  useEffect(() => {
    if (isListeningRef.current) return;
    isListeningRef.current = true;

    const currentPlatform = detectDevicePlatform();

    // Channel A: Dedicated device_broadcasts collection
    const unsubBroadcasts = subscribeToDeviceBroadcasts((broadcasts) => {
      if (!broadcasts || broadcasts.length === 0) return;

      const permission = getDeviceNotificationPermission();
      if (permission !== 'granted') return;

      for (const broadcast of broadcasts) {
        if (!broadcast || !broadcast.id) continue;

        // Verify target platform matches
        if (
          broadcast.targetPlatform &&
          broadcast.targetPlatform !== 'all' &&
          broadcast.targetPlatform !== currentPlatform
        ) {
          continue;
        }

        // Avoid showing ancient broadcasts older than 48h to newly registered devices
        const broadcastAge = Date.now() - (broadcast.timestamp || 0);
        if (broadcastAge > 48 * 60 * 60 * 1000) {
          continue;
        }

        const storageKey = `9jacash_shown_device_push_${broadcast.id}`;
        if (localStorage.getItem(storageKey)) {
          continue;
        }

        // Mark as processed immediately to prevent duplicate alerts
        localStorage.setItem(storageKey, 'true');

        // Trigger native device notification (Android status bar / iOS lock screen)
        sendDeviceNotification(broadcast.title || 'Message from 9jacash company', {
          body: broadcast.body,
          tag: broadcast.tag || `9jacash-company-${broadcast.id}`,
          renotify: true,
          data: {
            url: broadcast.actionUrl || '/',
            id: broadcast.id,
          },
        }).catch((err) => {
          console.warn('Global push notification delivery error:', err);
        });
      }
    });

    // Channel B: Fallback via notifications collection (dual channel redundancy)
    const unsubNotifs = subscribeToNotifications((notifs) => {
      if (!notifs || notifs.length === 0) return;

      const permission = getDeviceNotificationPermission();
      if (permission !== 'granted') return;

      for (const notif of notifs) {
        if (!notif || !notif.id || !notif.isDevicePush) continue;

        // Verify target platform
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

        // Mark as shown
        localStorage.setItem(storageKey, 'true');

        // Trigger native device notification
        sendDeviceNotification(notif.senderLabel || notif.title || 'Message from 9jacash company', {
          body: notif.desc,
          tag: `9jacash-company-notif-${notif.id}`,
          renotify: true,
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

  return null;
};
