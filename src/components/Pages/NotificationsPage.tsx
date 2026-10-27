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
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import {
  getDeviceNotificationPermission,
  requestDeviceNotificationPermission,
} from '../../utils/deviceNotifications.ts';

interface NotificationsPageProps {
  onBack: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onBack }) => {
  const { user, notifications } = useAuth();
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
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: 'Account Security',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (titleLower.includes('kyc')) {
      return {
        icon: n.type === 'alert' ? ShieldAlert : ShieldCheck,
        color:
          n.type === 'alert'
            ? 'text-red-400 bg-red-500/10 border-red-500/30'
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
            ? 'text-red-400 bg-red-500/10 border-red-500/30'
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
            ? 'text-red-400 bg-red-500/10 border-red-500/30'
            : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        badge: n.type === 'alert' ? 'Transaction Alert' : 'Wallet Transaction',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    if (isGlobal || n.type === 'admin') {
      return {
        icon: Megaphone,
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        badge: 'Official Broadcast',
        scope: 'Global Broadcast',
      };
    }

    if (n.type === 'alert') {
      return {
        icon: ShieldAlert,
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        badge: 'Important Alert',
        scope: isGlobal ? 'Global Broadcast' : 'Private to You',
      };
    }

    return {
      icon: Sparkles,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badge: 'Account Notice',
      scope: isGlobal ? 'Global Broadcast' : 'Private to You',
    };
  };

  return (
    <div className="min-h-screen pb-12 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 pb-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#16171d] border border-stone-800 flex items-center justify-center text-stone-300 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-1.5">
              Notifications <Bell className="w-4 h-4 text-amber-400" />
            </h1>
            <p className="text-xs text-stone-400">
              Personal account alerts &amp; company broadcasts
            </p>
          </div>
        </div>

        {visibleNotifications.length > 0 && (
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-[#1c1e26] border border-stone-800 text-stone-300">
            {visibleNotifications.length} {visibleNotifications.length === 1 ? 'Notice' : 'Notices'}
          </span>
        )}
      </div>

      {/* Device Notifications */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#101915] to-[#0e1612] border border-emerald-500/30 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Device Notifications
              </h4>
              <p className="text-[11px] text-stone-300 mt-0.5">
                Receive alerts on your device when you visit the app and for your withdrawals.
              </p>
            </div>
          </div>
          {devicePerm === 'granted' ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleEnableDeviceNotification}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Turn On</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[#14151b] border border-stone-800 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            filter === 'all'
              ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>All</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'all' ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'
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
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Personal</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'personal' ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'
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
              : 'text-stone-400 hover:text-white'
          }`}
        >
          <span>Broadcasts</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              filter === 'broadcast' ? 'bg-black/20 text-black' : 'bg-stone-800 text-stone-400'
            }`}
          >
            {broadcastNotifications.length}
          </span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayedList.length === 0 ? (
          <div className="p-12 text-center bg-[#15161c] rounded-3xl border border-stone-800 text-stone-500 text-xs flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#1c1e26] border border-stone-800 flex items-center justify-center text-stone-600">
              <Inbox className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-300">No Notifications Found</h3>
              <p className="text-[11px] text-stone-500 mt-1 max-w-[280px] leading-relaxed">
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
                className={`p-4 rounded-3xl bg-[#15161c] border transition-all flex flex-col gap-3 shadow-lg ${
                  isGlobal
                    ? 'border-amber-500/30 hover:border-amber-500/50 bg-gradient-to-br from-[#16171d] to-[#121319]'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex gap-3.5 items-start">
                  <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {badge}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                            isGlobal
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {scope}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono">{n.time}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug pt-0.5">{n.title}</h4>
                    <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-line">{n.desc}</p>

                    {/* Screenshot attachment preview */}
                    {n.screenshotUrl && (
                      <div className="pt-2">
                        <div
                          onClick={() => setPreviewScreenshotUrl(n.screenshotUrl || null)}
                          className="group relative inline-flex items-center gap-2 p-2 rounded-xl bg-[#0e0f14] border border-amber-500/30 hover:border-amber-400 cursor-pointer transition-all"
                        >
                          <img
                            src={n.screenshotUrl}
                            alt="Attached Proof"
                            className="w-14 h-14 rounded-lg object-cover border border-stone-800 group-hover:opacity-90"
                          />
                          <div className="text-left pr-2">
                            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              <span>View Attached Slip</span>
                            </span>
                            <span className="text-[9px] text-stone-400 block font-mono truncate max-w-[140px]">
                              {n.screenshotName || 'transfer_receipt.jpg'}
                            </span>
                            <span className="text-[9px] text-stone-500 block">Tap to expand</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {n.date && (
                      <span className="text-[10px] text-stone-500 block pt-1 font-mono">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg bg-[#14151b] border border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Transfer Confirmation Slip</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black/60 border border-stone-800 max-h-[70vh] flex items-center justify-center p-2">
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
