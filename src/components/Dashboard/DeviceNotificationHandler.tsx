import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  getDeviceNotificationPermission,
  requestDeviceNotificationPermission,
  triggerDashboardVisitDeviceNotification,
  hasDashboardVisitNotificationShown,
  markDashboardVisitNotificationShown,
  isDeviceNotificationSupported,
  NotificationPermissionState,
} from '../../utils/deviceNotifications.ts';

interface DeviceNotificationHandlerProps {
  isActive: boolean; // True when currentScreen === 'dashboard'
}

export const DeviceNotificationHandler: React.FC<DeviceNotificationHandlerProps> = ({ isActive: _isActive }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('9jacash_dismiss_device_notif_banner') === 'true';
  });

  // Sync current permission state
  const refreshPermissionState = useCallback(() => {
    const supported = isDeviceNotificationSupported();
    setIsSupported(supported);
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    const currentPerm = getDeviceNotificationPermission();
    setPermission(currentPerm);
  }, []);

  // Request permission and fire device notification once granted
  const handleEnableNotifications = async () => {
    try {
      const res = await requestDeviceNotificationPermission();
      setPermission(res);
      if (res === 'granted' && !hasDashboardVisitNotificationShown(user?.id)) {
        await triggerDashboardVisitDeviceNotification(user, true);
        markDashboardVisitNotificationShown(user?.id);
      }
    } catch (err) {
      console.warn('Failed to enable device notifications:', err);
    }
  };

  const handleDismissBanner = () => {
    setIsPromptDismissed(true);
    sessionStorage.setItem('9jacash_dismiss_device_notif_banner', 'true');
  };

  // Initial Visit Alert: Fires ONLY ONCE ever for this user visit.
  // Persisted in localStorage so going into any button, returning back to the dashboard,
  // or refreshing the dashboard will NEVER show it again!
  useEffect(() => {
    refreshPermissionState();

    // If already shown once on this device/user, never re-fire
    if (hasDashboardVisitNotificationShown(user?.id)) {
      return;
    }

    const currentPerm = getDeviceNotificationPermission();
    if (currentPerm === 'granted') {
      triggerDashboardVisitDeviceNotification(user);
    } else if (currentPerm === 'default') {
      // Proactively request permission if browser allows auto-request
      requestDeviceNotificationPermission()
        .then((res) => {
          setPermission(res);
          if (res === 'granted' && !hasDashboardVisitNotificationShown(user?.id)) {
            triggerDashboardVisitDeviceNotification(user, true);
          }
        })
        .catch(() => {});
    }
  }, [user, refreshPermissionState]);

  if (!isSupported) {
    return null;
  }

  // If permission is already granted, render nothing
  if (permission === 'granted') {
    return null;
  }

  // If user dismissed the prompt in this session, do not render banner
  if (isPromptDismissed) {
    return null;
  }

  return (
    <div className="relative mx-1 my-2 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#101915] to-[#0e1612] border border-emerald-500/30 p-3.5 shadow-xl shadow-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 shadow-md">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">
              Turn on notifications
            </h4>
            <p className="text-[12px] text-stone-300 mt-0.5 leading-relaxed">
              Turn on notifications to receive alerts on your device when you visit the app and for your withdrawals.
            </p>

            <div className="mt-3 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold text-xs hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                Turn On Notification
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismissBanner}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800/50 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {permission === 'denied' && (
        <div className="mt-2 pt-2 border-t border-emerald-900/40 flex items-center gap-1.5 text-[11px] text-amber-300">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Notifications are currently blocked. Please tap the lock or site settings icon in your browser to allow notifications.</span>
        </div>
      )}
    </div>
  );
};
