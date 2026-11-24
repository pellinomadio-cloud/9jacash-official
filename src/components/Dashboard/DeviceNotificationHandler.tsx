import React, { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCircle2, Loader2, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  getDeviceNotificationPermission,
  enableNotificationsFromUserGesture,
  triggerDashboardVisitDeviceNotification,
  hasDashboardVisitNotificationShown,
  isDeviceNotificationSupported,
  isInAppNotificationsEnabled,
  NOTIF_STATE_EVENT,
  NotificationPermissionState,
  EnableNotificationsResult,
} from '../../utils/deviceNotifications.ts';

interface DeviceNotificationHandlerProps {
  isActive: boolean; // True when currentScreen === 'dashboard'
}

export const DeviceNotificationHandler: React.FC<DeviceNotificationHandlerProps> = ({ isActive: _isActive }) => {
  const { user } = useAuth();
  const { isLight } = useTheme();
  const [permission, setPermission] = useState<NotificationPermissionState>(() =>
    getDeviceNotificationPermission()
  );
  const [isSupported, setIsSupported] = useState<boolean>(() => isDeviceNotificationSupported());
  const [inAppEnabled, setInAppEnabled] = useState<boolean>(() => isInAppNotificationsEnabled());
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<EnableNotificationsResult | null>(null);
  const [isPromptDismissed, setIsPromptDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('9jacash_dismiss_device_notif_banner') === 'true';
    } catch {
      return false;
    }
  });

  // Sync current permission & in-app alert state
  const refreshPermissionState = useCallback(() => {
    const supported = isDeviceNotificationSupported();
    setIsSupported(supported);
    setInAppEnabled(isInAppNotificationsEnabled());
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    setPermission(getDeviceNotificationPermission());
  }, []);

  // User-gesture click handler: NEVER hangs, ALWAYS gives instant feedback
  const handleEnableNotifications = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      const result = await enableNotificationsFromUserGesture(user);
      setPermission(result.permission);
      setInAppEnabled(result.inAppEnabled);
      setFeedback(result);

      // Auto-dismiss banner cleanly after showing confirmation when fully granted
      if (result.outcome === 'granted') {
        setTimeout(() => {
          setIsPromptDismissed(true);
          try {
            sessionStorage.setItem('9jacash_dismiss_device_notif_banner', 'true');
          } catch {
            // ignore
          }
        }, 2600);
      }
    } catch (err) {
      console.warn('Failed to enable device notifications:', err);
      setFeedback({
        outcome: 'unsupported',
        permission: getDeviceNotificationPermission(),
        inAppEnabled: true,
        message: 'In-app alerts have been enabled for your session.',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismissBanner = () => {
    setIsPromptDismissed(true);
    try {
      sessionStorage.setItem('9jacash_dismiss_device_notif_banner', 'true');
    } catch {
      // ignore
    }
  };

  // Sync permission state on mount, focus, and cross-component updates.
  // IMPORTANT: Do NOT auto-call Notification.requestPermission() inside useEffect without a click gesture
  // because Chrome/Android/Safari silently block or suppress ungestured permission prompts.
  useEffect(() => {
    refreshPermissionState();

    const handleSync = () => refreshPermissionState();
    window.addEventListener('focus', handleSync);
    window.addEventListener(NOTIF_STATE_EVENT, handleSync);

    // If permission is ALREADY granted, fire the one-time dashboard visit alert cleanly
    if (getDeviceNotificationPermission() === 'granted' && !hasDashboardVisitNotificationShown(user?.id)) {
      triggerDashboardVisitDeviceNotification(user).catch(() => {});
    }

    return () => {
      window.removeEventListener('focus', handleSync);
      window.removeEventListener(NOTIF_STATE_EVENT, handleSync);
    };
  }, [user, refreshPermissionState]);

  // If feedback toast is currently visible after clicking Turn On, show it before dismissing
  if (feedback && feedback.outcome === 'granted') {
    return (
      <div
        className={`relative mx-1 my-2 overflow-hidden rounded-2xl border p-3.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
          isLight
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
            : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-100 shadow-lg'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold">Notifications Turned On</h4>
              <p className={`text-[11px] leading-snug ${isLight ? 'text-emerald-800' : 'text-emerald-200/90'}`}>
                {feedback.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismissBanner}
            className="p-1 rounded-lg text-emerald-500 hover:bg-emerald-500/15 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Already granted and no active confirmation toast -> hide banner
  if (permission === 'granted') {
    return null;
  }

  // If user already turned on in-app alerts and dismissed the prompt, hide banner
  if (isPromptDismissed) {
    return null;
  }

  // If browser doesn't support native Notification API and user already activated in-app alerts, hide banner
  if (!isSupported && inAppEnabled && !feedback) {
    return null;
  }

  return (
    <div
      className={`relative mx-1 my-2 overflow-hidden rounded-2xl border p-3.5 animate-in fade-in slide-in-from-top-2 duration-300 transition-colors ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50/90 border-emerald-300 shadow-lg shadow-emerald-500/10 text-slate-900'
          : 'bg-gradient-to-r from-emerald-950/70 via-[#101915] to-[#0e1612] border-emerald-500/30 shadow-xl shadow-emerald-950/20 text-white'
      }`}
    >
      {/* Glow highlight */}
      <div
        className={`absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
          isLight ? 'bg-emerald-400/20' : 'bg-emerald-500/10'
        }`}
      />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-md ${
              isLight
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700 shadow-emerald-500/10'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>

          <div>
            <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Turn on notifications
            </h4>
            <p className={`text-[12px] mt-0.5 leading-relaxed ${isLight ? 'text-slate-600 font-medium' : 'text-stone-300'}`}>
              Turn on notifications to receive alerts on your device when you visit the app and for your withdrawals.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isRequesting}
                onClick={handleEnableNotifications}
                className={`px-3.5 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-xs hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-70 transition-all shadow-md shadow-emerald-500/25 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                  isLight ? 'text-white' : 'text-black'
                }`}
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>{feedback ? 'Try Again' : 'Turn On Notification'}</span>
                  </>
                )}
              </button>

              {feedback && (
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className={`px-3 py-2 min-h-[38px] rounded-xl font-semibold text-xs border cursor-pointer transition-colors ${
                    isLight
                      ? 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                      : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200 hover:bg-emerald-900/50'
                  }`}
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismissBanner}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-slate-500 hover:text-slate-900 hover:bg-emerald-100/70'
              : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
          }`}
          title="Dismiss"
          aria-label="Dismiss notification banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Clear immediate feedback whenever browser blocks, ignores, or needs PWA on iOS */}
      {feedback && (
        <div
          className={`mt-2.5 pt-2.5 border-t flex items-start gap-2 text-[11px] leading-relaxed ${
            isLight
              ? 'border-emerald-200 text-emerald-900 font-medium'
              : 'border-emerald-900/50 text-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
          <span>{feedback.message}</span>
        </div>
      )}

      {!feedback && permission === 'denied' && (
        <div
          className={`mt-2.5 pt-2.5 border-t flex items-start gap-1.5 text-[11px] leading-relaxed ${
            isLight
              ? 'border-emerald-200 text-amber-800 font-medium'
              : 'border-emerald-900/40 text-amber-300'
          }`}
        >
          <ShieldAlert className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span>
            Notifications are currently blocked by your browser. Tap the lock or site settings icon in your address bar to allow notifications, or tap the button above to activate in-app alerts.
          </span>
        </div>
      )}
    </div>
  );
};
