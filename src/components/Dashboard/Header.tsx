import React, { useState } from 'react';
import { useAuth, isNotificationVisibleToUser } from '../../context/AuthContext.tsx';
import { User, Bell, Settings, LogOut, Shield, Copy, Check, Smartphone } from 'lucide-react';
import { PWAInstallButton } from '../Common/PWAInstallButton.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import {
  getDeviceNotificationPermission,
  requestDeviceNotificationPermission,
  triggerDashboardVisitDeviceNotification,
} from '../../utils/deviceNotifications.ts';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenNotifications }) => {
  const { user, logout, notifications } = useAuth();
  const { isLight } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Count notifications visible to this particular user (global broadcasts + their personal notices)
  const broadcastCount = (notifications || []).filter((n) =>
    isNotificationVisibleToUser(n, user?.id)
  ).length;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="relative flex items-center justify-between pt-2 pb-4 px-1">
      {/* User Info Left */}
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="relative group focus:outline-none cursor-pointer"
        >
          <div
            className={`w-12 h-12 rounded-full border-2 p-0.5 flex items-center justify-center shadow-lg transition-all ${
              isLight
                ? 'bg-amber-100 border-amber-500 shadow-amber-500/10'
                : 'bg-[#16171b] border-amber-500/80 shadow-amber-500/10 group-hover:border-amber-400'
            }`}
          >
            <div
              className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden ${
                isLight ? 'bg-amber-50' : 'bg-gradient-to-b from-[#23242a] to-[#121316]'
              }`}
            >
              <User className={`w-6 h-6 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            </div>
          </div>
          {/* Online badge */}
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full ${
              isLight ? 'border-white' : 'border-[#0b0c0e]'
            }`}
          />
        </button>

        <div>
          <span className={`text-xs font-normal block tracking-wide ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            {getGreeting()}
          </span>
          <h1 className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {user?.name || 'Valued Customer'}
          </h1>
          <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Your goals. Our priority.
          </p>
        </div>
      </div>

      {/* Action Icons Right */}
      <div className="flex items-center gap-2">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className={`relative w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-400 shadow-sm'
              : 'bg-[#18191f]/90 border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/40'
          }`}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {/* Yellow Notification Badge ONLY when admin has dropped a broadcast */}
          {broadcastCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          )}
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            isLight
              ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-amber-400 shadow-sm'
              : 'bg-[#18191f]/90 border-stone-800 text-stone-300 hover:text-white hover:border-amber-500/40'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Dropdown Menu */}
      {showProfileMenu && (
        <div
          className={`absolute top-16 left-0 z-40 w-72 border rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ${
            isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-[#16181d] border-stone-700/80 text-white'
          }`}
        >
          <div className={`flex items-center gap-3 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500 font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden">
              <h3 className={`font-semibold text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user?.name}</h3>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{user?.email}</p>
            </div>
          </div>

          <div className="py-3 space-y-2 text-xs">
            {user?.referralCode && (
              <div className={`flex items-center justify-between p-2 rounded-xl ${
                isLight ? 'bg-slate-50 border border-slate-200' : 'bg-[#1c1f26]'
              }`}>
                <div>
                  <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Referral Code</span>
                  <span className={`font-semibold text-xs font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.referralCode}</span>
                </div>
                <button
                  type="button"
                  onClick={copyReferralCode}
                  className={`p-1.5 rounded-md text-amber-500 transition-colors cursor-pointer ${
                    isLight ? 'hover:bg-slate-200' : 'hover:bg-stone-700'
                  }`}
                  title="Copy Referral Code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(false);
                onOpenSettings();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 font-semibold text-xs border border-amber-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-3.5 h-3.5 text-amber-500" />
                <span>Profile &amp; Settings</span>
              </div>
              <span className="text-[10px] text-amber-600 dark:text-amber-400/80 font-normal">Change Username</span>
            </button>

            <div className={`flex items-center gap-2 px-1 py-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified Earner Profile</span>
            </div>

            {/* Device Notifications */}
            <button
              type="button"
              onClick={async () => {
                const perm = getDeviceNotificationPermission();
                if (perm !== 'granted') {
                  const res = await requestDeviceNotificationPermission();
                  if (res === 'granted') {
                    await triggerDashboardVisitDeviceNotification(user, true);
                  }
                } else {
                  await triggerDashboardVisitDeviceNotification(user, true);
                }
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium text-xs border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-emerald-500" />
                <span>Turn on notification</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/20 px-1.5 py-0.5 rounded">
                Alerts
              </span>
            </button>
          </div>

          <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-stone-800'}`}>
            <button
              type="button"
              onClick={logout}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                isLight
                  ? 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-300 shadow-sm'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
              }`}
            >
              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
