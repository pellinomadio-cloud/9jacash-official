import React, { useState, useEffect } from 'react';
import { useAuth, isNotificationVisibleToUser, isGlobalBroadcastNotification } from '../../context/AuthContext.tsx';
import { AppNotification } from '../../types/index.ts';
import {
  ArrowLeft,
  Bell,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  Inbox,
  KeyRound,
  Lock,
  Wallet,
  ImageIcon,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  getDeviceNotificationPermission,
  requestDeviceNotificationPermission,
} from '../../utils/deviceNotifications.ts';
import { useTheme } from '../../context/ThemeContext.tsx';

interface NotificationsPageProps {
  onBack: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack }) => {
  const { user, notifications } = useAuth();
  const { isLight } = useTheme();
  const [filter, setFilter] = useState<'all' | 'personal' | 'broadcast'>('all');
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [devicePerm, setDevicePerm] = useState<string>(() => getDeviceNotificationPermission());

  useEffect(() => {
    setDevicePerm(getDeviceNotificationPermission());
  }, []);

  const handleEnableDeviceNotification = async () => {
    const res = await requestDeviceNotificationPermission();
    setDevicePerm(res);
  };

  // STRICT: Only show global broadcasts OR private notifications addressed specifically to this user
  const visibleNotifications = (notifications || []).filter((n) => {
    if (!n) return false;
    return isNotificationVisibleToUser(n, user?.id);
  });

  const personalNotifications = visibleNotifications.filter(
    (n) => user && n.targetUserId === user.id && !isGlobalBroadcastNotification(n)
  );

  const broadcastNotifications = visibleNotifications.filter(
    (n) => isGlobalBroadcastNotification(n)
  );

  const displayedList =
    filter === 'personal'
      ? personalNotifications
      : filter === 'broadcast'
      ? broadcastNotifications
      : visibleNotifications;

  const getNotificationVisuals = (n: AppNotification) => {
    const titleLower = (n.title || '').toLowerCase();
    const isGlobal = isGlobalBroadcastNotification(n);

    if (titleLower.includes('ban') || titleLower.includes('restricted')) {
      return {
        icon: Lock,
        color: isLight
          ? 'text-red-600 bg-red-50 border-red-200'
          : 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: 'Account Security',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (titleLower.includes('kyc')) {
      return {
        icon: n.type === 'alert' ? ShieldAlert : ShieldCheck,
        color:
          n.type === 'alert'
            ? isLight
              ? 'text-red-600 bg-red-50 border-red-200'
              : 'text-red-400 bg-red-500/10 border-red-500/30'
            : isLight
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: n.type === 'alert' ? 'KYC Declined' : 'KYC Verification',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (titleLower.includes('quick code') || titleLower.includes('code')) {
      return {
        icon: KeyRound,
        color:
          n.type === 'alert'
            ? isLight
              ? 'text-red-600 bg-red-50 border-red-200'
              : 'text-red-400 bg-red-500/10 border-red-500/30'
            : isLight
            ? 'text-amber-700 bg-amber-50 border-amber-200'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        badge: n.type === 'alert' ? 'Code Declined' : 'Quick Code',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (titleLower.includes('deposit') || titleLower.includes('wallet') || titleLower.includes('withdraw')) {
      return {
        icon: Wallet,
        color:
          n.type === 'alert'
            ? isLight
              ? 'text-red-600 bg-red-50 border-red-200'
              : 'text-red-400 bg-red-500/10 border-red-500/30'
            : isLight
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: n.type === 'alert' ? 'Transaction Alert' : 'Wallet Transaction',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (isGlobal || n.type === 'admin') {
      return {
        icon: Megaphone,
        color: isLight
          ? 'text-amber-700 bg-amber-50 border-amber-200'
          : 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        badge: 'Official Broadcast',
        scope: 'Global Broadcast',
      };
    }

    if (n.type === 'alert') {
      return {
        icon: ShieldAlert,
        color: isLight
          ? 'text-red-600 bg-red-50 border-red-200'
          : 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: 'Important Alert',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    return {
      icon: Sparkles,
      color: isLight
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Account Notice',
      scope: isGlobal ? 'Global Broadcast' : 'Private to You',
    };
  };

  return (
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className={`flex items-center justify-between pt-2 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-400 shadow-sm'
                : 'bg-[#16171d] border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-lg font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Notifications <Bell className="w-4 h-4 text-amber-500" />
            </h1>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Personal account alerts &amp; company broadcasts
            </p>
          </div>
        </div>

        {visibleNotifications.length > 0 && (
          <span
            className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                : 'bg-[#1c1e26] border-stone-800 text-stone-300'
            }`}
          >
            {visibleNotifications.length} {visibleNotifications.length === 1 ? 'Notice' : 'Notices'}
          </span>
        )}
      </div>

      {/* Device Notifications */}
      <div
        className={`p-3.5 rounded-2xl border transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50 via-white to-teal-50/90 border-emerald-300 shadow-lg shadow-emerald-500/10'
            : 'bg-gradient-to-r from-emerald-950/70 via-[#101915] to-[#0e1612] border-emerald-500/30 shadow-lg shadow-emerald-950/20'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                isLight
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Device Notifications
              </h4>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-600 font-medium' : 'text-stone-300'}`}>
                Receive alerts on your device when you visit the app and for your withdrawals.
              </p>
            </div>
          </div>
          {devicePerm === 'granted' ? (
            <span
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                isLight
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span>Active</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleEnableDeviceNotification}
              className={`px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 ${
                isLight ? 'text-white' : 'text-black'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Turn On</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className={`flex gap-1.5 p-1 rounded-2xl border text-xs ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#14151b] border-stone-800'
        }`}
      >
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            filter === 'all'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'all'
                ? 'bg-black/20 text-black'
                : isLight
                ? 'bg-slate-100 text-slate-600'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            {visibleNotifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('personal')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            filter === 'personal'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Personal</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'personal'
                ? 'bg-black/20 text-black'
                : isLight
                ? 'bg-slate-100 text-slate-600'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            {personalNotifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('broadcast')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            filter === 'broadcast'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Broadcasts</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'broadcast'
                ? 'bg-black/20 text-black'
                : isLight
                ? 'bg-slate-100 text-slate-600'
                : 'bg-stone-800 text-stone-400'
            }`}
          >
            {broadcastNotifications.length}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div
            className={`p-12 text-center rounded-3xl border text-xs flex flex-col items-center justify-center gap-3 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-500 shadow-sm'
                : 'bg-[#15161c] border-stone-800 text-stone-500'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-[#1c1e26] border-stone-800 text-stone-600'
              }`}
            >
              <Inbox className="w-7 h-7" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-stone-300'}`}>No Notifications Found</h3>
              <p className={`text-[11px] mt-1 max-w-[280px] leading-relaxed ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                {filter === 'personal'
                  ? 'You have no personal account notifications yet. Approvals, declines, and direct messages will appear here.'
                  : filter === 'broadcast'
                  ? 'No global broadcast announcements from company administration at this time.'
                  : 'You have no notifications yet. Personal alerts and official announcements will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          displayedList.map((n: AppNotification) => {
            const { icon: Icon, color, badge, scope } = getNotificationVisuals(n);
            const isGlobal = isGlobalBroadcastNotification(n);

            return (
              <div
                key={n.id}
                className={`p-4 rounded-3xl border transition-all flex flex-col gap-3 shadow-lg ${
                  isLight
                    ? isGlobal
                      ? 'bg-gradient-to-br from-amber-50/70 to-white border-amber-300 hover:border-amber-400 shadow-slate-200/60'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-slate-200/50'
                    : isGlobal
                    ? 'bg-[#15161c] border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-br from-[#16171d] to-[#121319]'
                    : 'bg-[#15161c] border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex gap-3.5 items-start">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                          }`}
                        >
                          {badge}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                            isGlobal
                              ? isLight
                                ? 'bg-amber-100/80 text-amber-800 border-amber-300'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : isLight
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {scope}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>{n.time}</span>
                    </div>

                    <h4 className={`text-xs font-bold leading-snug pt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{n.title}</h4>
                    <p className={`text-xs leading-relaxed whitespace-pre-line ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>{n.desc}</p>

                    {/* Screenshot attachment preview */}
                    {n.screenshotUrl && (
                      <div className="pt-2">
                        <div
                          onClick={() => setPreviewScreenshotUrl(n.screenshotUrl || null)}
                          className={`group relative inline-flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                            isLight
                              ? 'bg-slate-50 border-amber-300 hover:border-amber-500'
                              : 'bg-[#0e0f14] border-amber-500/30 hover:border-amber-400'
                          }`}
                        >
                          <img
                            src={n.screenshotUrl}
                            alt="Attached Proof"
                            className={`w-14 h-14 rounded-lg object-cover border group-hover:opacity-90 ${
                              isLight ? 'border-slate-200' : 'border-stone-800'
                            }`}
                          />
                          <div className="text-left pr-2">
                            <span className={`text-[10px] font-bold flex items-center gap-1 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                              <ImageIcon className="w-3 h-3" />
                              <span>View Attached Slip</span>
                            </span>
                            <span className={`text-[9px] block font-mono truncate max-w-[140px] ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                              {n.screenshotName || 'transfer_receipt.jpg'}
                            </span>
                            <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>Tap to expand</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {n.date && (
                      <span className={`text-[10px] block pt-1 font-mono ${isLight ? 'text-slate-500' : 'text-stone-500'}`}>
                        {n.date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULL SCREENSHOT PREVIEW MODAL */}
      {previewScreenshotUrl && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in ${
            isLight ? 'bg-slate-900/50' : 'bg-black/90'
          }`}
        >
          <div
            className={`w-full max-w-lg border rounded-3xl p-4 sm:p-5 space-y-3 ${
              isLight ? 'bg-white border-amber-300 shadow-2xl' : 'bg-[#14151b] border-amber-500/40'
            }`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Transfer Confirmation Slip</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:text-slate-900' : 'bg-stone-800 text-stone-300 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`rounded-2xl overflow-hidden border max-h-[70vh] flex items-center justify-center p-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/60 border-stone-800'
              }`}
            >
              <img
                src={previewScreenshotUrl}
                alt="Confirmation Proof"
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain mx-auto"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="py-2 px-4 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-amber-300 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
